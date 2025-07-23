"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BanBanSalesFlowService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const index_1 = require("@shared/webhook-base/index");
const BANBAN_ORG_ID = "2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4";
const SALES_ACTIONS = {
    REGISTER_SALE: "register_sale",
    REGISTER_PAYMENT: "register_payment",
    REGISTER_CANCELLATION: "register_cancellation",
    REQUEST_RETURN: "request_return",
    REGISTER_RETURN: "register_return",
    COMPLETE_RETURN: "complete_return",
    TRANSFER_BETWEEN_STORES: "transfer_between_stores",
    REGISTER_FISCAL_DATA: "register_fiscal_data",
};
class BanBanSalesFlowService {
    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
    }
    async processAction(action, transactionData, metadata) {
        console.log(`[SalesService] Iniciando ação '${action}'`);
        await (0, index_1.validateAndGetTenant)(BANBAN_ORG_ID);
        switch (action) {
            case SALES_ACTIONS.REGISTER_SALE:
                return this._registerSale(transactionData, metadata);
            case SALES_ACTIONS.REGISTER_PAYMENT:
                return this._registerPayment(transactionData, metadata);
            case SALES_ACTIONS.REGISTER_CANCELLATION:
                return this._registerCancellation(transactionData, metadata);
            case SALES_ACTIONS.REQUEST_RETURN:
                return this._requestReturn(transactionData, metadata);
            case SALES_ACTIONS.REGISTER_RETURN:
                return this._registerReturn(transactionData, metadata);
            case SALES_ACTIONS.COMPLETE_RETURN:
                return this._completeReturn(transactionData, metadata);
            case SALES_ACTIONS.TRANSFER_BETWEEN_STORES:
                return this._transferBetweenStores(transactionData, metadata);
            case SALES_ACTIONS.REGISTER_FISCAL_DATA:
                return this._registerFiscalData(transactionData, metadata);
            default:
                throw new Error(`Ação de vendas desconhecida: ${action}`);
        }
    }
    async getSalesData(queryParams) {
        console.log(`[SalesService-GET] Buscando dados com filtros:`, queryParams);
        const { limit = 50, offset = 0, external_id, customer_external_id, salesperson_id, product_analysis, location_external_id, } = queryParams;
        if (product_analysis && location_external_id) {
            return this._analyzeProductPerformance(location_external_id);
        }
        if (customer_external_id) {
            return this._calculateCustomerRfm(customer_external_id);
        }
        let query = this.supabase
            .from("tenant_business_transactions")
            .select("*")
            .eq("organization_id", BANBAN_ORG_ID)
            .in("transaction_type", ["DOCUMENT_SALE", "DOCUMENT_RETURN", "DOCUMENT_TRANSFER_INTERNAL"]);
        if (external_id)
            query = query.eq("external_id", external_id);
        if (salesperson_id)
            query = query.contains("attributes", {
                salesperson_external_id: salesperson_id,
            });
        const { data, error } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);
        if (error)
            throw new Error(`Erro ao buscar transações de venda: ${error.message}`);
        return {
            transactions: data || [],
            pagination: { limit, offset, count: data?.length || 0 },
        };
    }
    async _registerSale(data, metadata) {
        console.log("[_registerSale] Registrando venda:", data.external_id);
        if (!data.external_id || !data.items || !data.location_external_id) {
            throw new Error("external_id, items e location_external_id são obrigatórios.");
        }
        let customerEntity = null;
        if (data.customer_external_id) {
            customerEntity = await this._getOrCreateBusinessEntity(BANBAN_ORG_ID, "CUSTOMER", data.customer_external_id, { name: data.customer_name || `Cliente ${data.customer_external_id}` });
        }
        const locationEntity = await this._getOrCreateBusinessEntity(BANBAN_ORG_ID, "LOCATION", data.location_external_id, { name: data.location_name || `Local ${data.location_external_id}` });
        const transaction = await (0, index_1.createBusinessTransaction)(BANBAN_ORG_ID, "DOCUMENT_SALE", data.external_id, { ...data, status: "VENDA_CONCLUIDA" });
        if (customerEntity) {
            await (0, index_1.createBusinessRelationship)(BANBAN_ORG_ID, "SOLD_TO", transaction.id, customerEntity.id, {});
        }
        await (0, index_1.createBusinessRelationship)(BANBAN_ORG_ID, "OCCURRED_AT", transaction.id, locationEntity.id, {});
        for (const item of data.items) {
            const productEntity = await this._getOrCreateBusinessEntity(BANBAN_ORG_ID, "PRODUCT", item.product_external_id, { name: item.product_name || `Produto ${item.product_external_id}` });
            await (0, index_1.createBusinessRelationship)(BANBAN_ORG_ID, "CONTAINS_ITEM", transaction.id, productEntity.id, { quantity: item.quantity, unit_price: item.unit_price });
            const inventoryMovement = await (0, index_1.createBusinessTransaction)(BANBAN_ORG_ID, "INVENTORY_MOVEMENT", null, {
                qty_change: -item.quantity,
                movement_type: "SALE",
                reference_sale_id: transaction.id,
                reference_sale_external_id: transaction.external_id,
                product_external_id: item.product_external_id,
                location_external_id: data.location_external_id,
                status: 'MOVIMENTO_EXECUTADO',
                ...item,
            });
            await (0, index_1.createBusinessRelationship)(BANBAN_ORG_ID, "AFFECTS_PRODUCT", inventoryMovement.id, productEntity.id, {});
            await (0, index_1.createBusinessRelationship)(BANBAN_ORG_ID, "AT_LOCATION", inventoryMovement.id, locationEntity.id, {});
            await (0, index_1.createBusinessRelationship)(BANBAN_ORG_ID, "CAUSED_BY_SALE", inventoryMovement.id, transaction.id, {});
            await this._updateInventorySnapshot(item.product_external_id, data.location_external_id, -item.quantity, "SALE", inventoryMovement.id);
        }
        await this._createBusinessEvent("TRANSACTION", transaction.id, "sale_registered", { ...data, ...metadata });
        await this._updateSalesAnalyticsSnapshots(data);
        return {
            transaction_id: transaction.id,
            external_id: data.external_id,
            status: "VENDA_CONCLUIDA",
        };
    }
    async _requestReturn(data, metadata) {
        console.log("[_requestReturn] Solicitando devolução para:", data.original_sale_external_id);
        if (!data.external_id || !data.original_sale_external_id || !data.items) {
            throw new Error("external_id, original_sale_external_id e items são obrigatórios.");
        }
        const saleTx = await this._getTransactionByExternalId(data.original_sale_external_id, "DOCUMENT_SALE");
        if (saleTx.attributes.status !== "VENDA_CONCLUIDA") {
            throw new Error(`Venda ${data.original_sale_external_id} não pode ter devolução solicitada pois seu status é ${saleTx.attributes.status}. Esperado: VENDA_CONCLUIDA.`);
        }
        const returnTx = await (0, index_1.createBusinessTransaction)(BANBAN_ORG_ID, "DOCUMENT_RETURN", data.external_id, {
            ...data,
            reference_transaction_id: saleTx.id,
            status: "DEVOLUCAO_AGUARDANDO",
        });
        await (0, index_1.createBusinessRelationship)(BANBAN_ORG_ID, "RELATES_TO_SALE", returnTx.id, saleTx.id, {});
        await this._createBusinessEvent("TRANSACTION", returnTx.id, "return_requested", { ...data, ...metadata });
        console.log("[_requestReturn] Devolução solicitada com sucesso.");
        return {
            transaction_id: returnTx.id,
            external_id: data.external_id,
            status: "DEVOLUCAO_AGUARDANDO",
        };
    }
    async _registerPayment(data, metadata) {
        console.log("[_registerPayment] Registrando pagamento para:", data.reference_external_id);
        const saleTx = await this._getTransactionByExternalId(data.reference_external_id, "DOCUMENT_SALE");
        if (saleTx.attributes.status !== "VENDA_CONCLUIDA") {
            throw new Error(`Venda ${data.reference_external_id} não pode registrar pagamento pois seu status é ${saleTx.attributes.status}. Esperado: VENDA_CONCLUIDA.`);
        }
        const paymentTx = await (0, index_1.createBusinessTransaction)(BANBAN_ORG_ID, "PAYMENT", data.external_id, { ...data, reference_transaction_id: saleTx.id, status: "CONFIRMED" });
        await (0, index_1.createBusinessRelationship)(BANBAN_ORG_ID, "RELATES_TO_SALE", paymentTx.id, saleTx.id, {});
        await this._createBusinessEvent("TRANSACTION", paymentTx.id, "payment_received", { ...data, ...metadata });
        return {
            transaction_id: paymentTx.id,
            external_id: data.external_id,
            status: "CONFIRMED",
        };
    }
    async _registerCancellation(data, metadata) {
        console.log("[_registerCancellation] Registrando cancelamento para:", data.reference_external_id);
        const saleTx = await this._getTransactionByExternalId(data.reference_external_id, "DOCUMENT_SALE");
        if (saleTx.attributes.status !== "VENDA_CONCLUIDA") {
            throw new Error(`Venda ${data.reference_external_id} não pode ser cancelada pois seu status é ${saleTx.attributes.status}. Esperado: VENDA_CONCLUIDA.`);
        }
        const { data: updatedTxs, error } = await this.supabase
            .from("tenant_business_transactions")
            .update({ attributes: { ...saleTx.attributes, status: "CANCELLED" } })
            .eq("id", saleTx.id)
            .select();
        if (error)
            throw error;
        if (!updatedTxs || updatedTxs.length === 0) {
            throw new Error(`Falha ao atualizar transação ${saleTx.id}`);
        }
        const updatedTx = updatedTxs[0];
        await this._createBusinessEvent("TRANSACTION", saleTx.id, "sale_cancelled", { ...data, ...metadata });
        const locationEntity = await this._getOrCreateBusinessEntity(BANBAN_ORG_ID, "LOCATION", saleTx.attributes.location_external_id, { name: saleTx.attributes.location_name });
        for (const item of data.items) {
            const productEntity = await this._getOrCreateBusinessEntity(BANBAN_ORG_ID, "PRODUCT", item.variant_external_id, { name: item.product_name || `Produto ${item.variant_external_id}` });
            const inventoryMovement = await (0, index_1.createBusinessTransaction)(BANBAN_ORG_ID, "INVENTORY_MOVEMENT", null, {
                qty_change: item.qty,
                movement_type: "SALE_CANCELLATION",
                reference_sale_id: saleTx.id,
                reference_sale_external_id: saleTx.external_id,
                product_external_id: item.variant_external_id,
                location_external_id: saleTx.attributes.location_external_id,
                status: 'MOVIMENTO_EXECUTADO',
                ...item,
            });
            await (0, index_1.createBusinessRelationship)(BANBAN_ORG_ID, "AFFECTS_PRODUCT", inventoryMovement.id, productEntity.id, {});
            await (0, index_1.createBusinessRelationship)(BANBAN_ORG_ID, "AT_LOCATION", inventoryMovement.id, locationEntity.id, {});
            await (0, index_1.createBusinessRelationship)(BANBAN_ORG_ID, "CAUSED_BY_SALE_CANCELLATION", inventoryMovement.id, saleTx.id, {});
            await this._updateInventorySnapshot(item.variant_external_id, saleTx.attributes.location_external_id, item.qty, "SALE_CANCELLATION", inventoryMovement.id);
        }
        return {
            transaction_id: saleTx.id,
            external_id: saleTx.external_id,
            status: "CANCELLED",
        };
    }
    async _registerReturn(data, metadata) {
        console.log("[_registerReturn] Registrando devolução para:", data.reference_external_id);
        const saleTx = await this._getTransactionByExternalId(data.reference_external_id, "DOCUMENT_SALE");
        if (saleTx.attributes.status !== "VENDA_CONCLUIDA") {
            throw new Error(`Venda ${data.reference_external_id} não pode registrar devolução pois seu status é ${saleTx.attributes.status}. Esperado: VENDA_CONCLUIDA.`);
        }
        const returnTx = await (0, index_1.createBusinessTransaction)(BANBAN_ORG_ID, "RETURN", data.external_id, {
            ...data,
            reference_transaction_id: saleTx.id,
            status: "DEVOLUCAO_AGUARDANDO",
        });
        await (0, index_1.createBusinessRelationship)(BANBAN_ORG_ID, "RELATES_TO_SALE", returnTx.id, saleTx.id, {});
        await this._createBusinessEvent("TRANSACTION", returnTx.id, "return_registered", { ...data, ...metadata });
        const locationEntity = await this._getOrCreateBusinessEntity(BANBAN_ORG_ID, "LOCATION", saleTx.attributes.location_external_id, { name: saleTx.attributes.location_name });
        for (const item of data.items) {
            const productEntity = await this._getOrCreateBusinessEntity(BANBAN_ORG_ID, "PRODUCT", item.variant_external_id, { name: item.product_name || `Produto ${item.variant_external_id}` });
            const inventoryMovement = await (0, index_1.createBusinessTransaction)(BANBAN_ORG_ID, "INVENTORY_MOVEMENT", null, {
                qty_change: item.qty,
                movement_type: "SALE_RETURN",
                reference_return_id: returnTx.id,
                reference_return_external_id: returnTx.external_id,
                product_external_id: item.variant_external_id,
                location_external_id: saleTx.attributes.location_external_id,
                status: 'MOVIMENTO_EXECUTADO',
                ...item,
            });
            await (0, index_1.createBusinessRelationship)(BANBAN_ORG_ID, "AFFECTS_PRODUCT", inventoryMovement.id, productEntity.id, {});
            await (0, index_1.createBusinessRelationship)(BANBAN_ORG_ID, "AT_LOCATION", inventoryMovement.id, locationEntity.id, {});
            await (0, index_1.createBusinessRelationship)(BANBAN_ORG_ID, "CAUSED_BY_RETURN", inventoryMovement.id, returnTx.id, {});
            await this._updateInventorySnapshot(item.variant_external_id, saleTx.attributes.location_external_id, item.qty, "SALE_RETURN", inventoryMovement.id);
        }
        return {
            transaction_id: returnTx.id,
            external_id: data.external_id,
            status: "DEVOLUCAO_AGUARDANDO",
        };
    }
    async _completeReturn(data, metadata) {
        const returnId = data.return_external_id || data.external_id;
        const invoiceId = data.nf_devolucao || data.return_invoice_external_id;
        console.log("[_completeReturn] Finalizando devolução:", returnId);
        if (!returnId || !invoiceId)
            throw new Error("return_external_id (ou external_id) e nf_devolucao (ou return_invoice_external_id) são obrigatórios.");
        const returnTx = await this._getTransactionByExternalId(returnId, "DOCUMENT_RETURN");
        if (returnTx.attributes.status !== "DEVOLUCAO_AGUARDANDO") {
            throw new Error(`Devolução ${returnId} não pode ser concluída pois seu status é ${returnTx.attributes.status}. Esperado: DEVOLUCAO_AGUARDANDO.`);
        }
        const { data: updatedTx, error } = await this.supabase
            .from("tenant_business_transactions")
            .update({
            attributes: {
                ...returnTx.attributes,
                status: "DEVOLUCAO_CONCLUIDA",
                nf_devolucao: invoiceId,
                emitida_em: new Date().toISOString(),
            },
        })
            .eq("id", returnTx.id)
            .select()
            .single();
        if (error)
            throw error;
        const returnDocument = await (0, index_1.createBusinessTransaction)(BANBAN_ORG_ID, "DOCUMENT_RETURN", invoiceId, {
            ...data,
            status: "DEVOLUCAO_CONCLUIDA",
            reference_return_id: returnTx.id,
        });
        await (0, index_1.createBusinessRelationship)(BANBAN_ORG_ID, "BASED_ON_RETURN", returnDocument.id, returnTx.id, {});
        await this._createBusinessEvent("TRANSACTION", returnTx.id, "return_completed", { ...data, ...metadata });
        console.log("[_completeReturn] Devolução concluída e NF emitida.");
        return {
            transaction_id: returnTx.id,
            external_id: returnTx.external_id,
            status: "DEVOLUCAO_CONCLUIDA",
            document_id: returnDocument.id,
        };
    }
    async _transferBetweenStores(data, metadata) {
        console.log("[_transferBetweenStores] Criando transferência entre lojas:", data.external_id);
        if (!data.external_id ||
            !data.origin_store_external_id ||
            !data.destination_store_external_id ||
            !data.items) {
            throw new Error("external_id, origin_store_external_id, destination_store_external_id e items são obrigatórios.");
        }
        const originStoreEntity = await this._getOrCreateBusinessEntity(BANBAN_ORG_ID, "LOCATION", data.origin_store_external_id, {
            name: data.origin_store_name || `Loja ${data.origin_store_external_id}`,
        });
        const destinationStoreEntity = await this._getOrCreateBusinessEntity(BANBAN_ORG_ID, "LOCATION", data.destination_store_external_id, {
            name: data.destination_store_name ||
                `Loja ${data.destination_store_external_id}`,
        });
        const transferTx = await (0, index_1.createBusinessTransaction)(BANBAN_ORG_ID, "DOCUMENT_TRANSFER_INTERNAL", data.external_id, {
            status: "TRANSFERENCIA_ENTRE_LOJAS",
            origin_store_external_id: data.origin_store_external_id,
            destination_store_external_id: data.destination_store_external_id,
            transfer_reason: data.transfer_reason,
        });
        await (0, index_1.createBusinessRelationship)(BANBAN_ORG_ID, "ORIGINATES_FROM", transferTx.id, originStoreEntity.id, {});
        await (0, index_1.createBusinessRelationship)(BANBAN_ORG_ID, "DESTINED_TO", transferTx.id, destinationStoreEntity.id, {});
        for (const item of data.items) {
            const productEntity = await this._getOrCreateBusinessEntity(BANBAN_ORG_ID, "PRODUCT", item.variant_external_id, { name: item.product_name || `Produto ${item.variant_external_id}` });
            const outMovement = await (0, index_1.createBusinessTransaction)(BANBAN_ORG_ID, "INVENTORY_MOVEMENT", null, {
                qty_change: -item.qty,
                movement_type: "STORE_TRANSFER_OUT",
                reference_transfer_id: transferTx.id,
                reference_transfer_external_id: transferTx.external_id,
                product_external_id: item.variant_external_id,
                location_external_id: data.origin_store_external_id,
                status: 'MOVIMENTO_EXECUTADO',
                details: {
                    product_name: item.product_name,
                    reason: "Transferência entre lojas - Saída"
                }
            });
            const inMovement = await (0, index_1.createBusinessTransaction)(BANBAN_ORG_ID, "INVENTORY_MOVEMENT", null, {
                qty_change: item.qty,
                movement_type: "STORE_TRANSFER_IN",
                reference_transfer_id: transferTx.id,
                reference_transfer_external_id: transferTx.external_id,
                product_external_id: item.variant_external_id,
                location_external_id: data.destination_store_external_id,
                status: 'MOVIMENTO_EXECUTADO',
                details: {
                    product_name: item.product_name,
                    reason: "Transferência entre lojas - Entrada"
                }
            });
            await this._updateInventorySnapshot(item.variant_external_id, data.origin_store_external_id, -item.qty, "STORE_TRANSFER_OUT", outMovement.id);
            await this._updateInventorySnapshot(item.variant_external_id, data.destination_store_external_id, item.qty, "STORE_TRANSFER_IN", inMovement.id);
        }
        await this._createBusinessEvent("TRANSACTION", transferTx.id, "store_transfer_created", { ...data, ...metadata });
        console.log("[_transferBetweenStores] Transferência entre lojas criada.");
        return {
            transaction_id: transferTx.id,
            external_id: data.external_id,
            status: "TRANSFERENCIA_ENTRE_LOJAS",
        };
    }
    async _registerFiscalData(data, metadata) {
        console.log("[_registerFiscalData] Registrando dados fiscais para:", data.reference_external_id);
        const saleTx = await this._getTransactionByExternalId(data.reference_external_id, "DOCUMENT_SALE");
        const fiscalTx = await (0, index_1.createBusinessTransaction)(BANBAN_ORG_ID, "FISCAL_DOCUMENT", data.external_id, { ...data, reference_transaction_id: saleTx.id, status: "ISSUED" });
        await (0, index_1.createBusinessRelationship)(BANBAN_ORG_ID, "RELATES_TO_SALE", fiscalTx.id, saleTx.id, {});
        await this._createBusinessEvent("TRANSACTION", fiscalTx.id, "fiscal_data_registered", { ...data, ...metadata });
        return {
            transaction_id: fiscalTx.id,
            external_id: data.external_id,
            status: "ISSUED",
        };
    }
    async _updateSalesAnalyticsSnapshots(saleData) {
        const { customer_external_id, salesperson_external_id, location_external_id, } = saleData;
        console.log(`[_updateSalesAnalyticsSnapshots] Atualizando snapshots para venda ${saleData.external_id}`);
        if (customer_external_id) {
            const rfm = await this._calculateCustomerRfm(customer_external_id);
            await this._updateSnapshot("CUSTOMER_RFM", `rfm_${customer_external_id}`, rfm);
        }
        if (salesperson_external_id) {
            const performance = await this._calculateSalespersonPerformance(salesperson_external_id);
            await this._updateSnapshot("SALESPERSON_PERFORMANCE", `perf_${salesperson_external_id}`, performance);
        }
        if (location_external_id) {
            const productPerformance = await this._analyzeProductPerformance(location_external_id);
            await this._updateSnapshot("LOCATION_PRODUCT_PERFORMANCE", `prod_perf_${location_external_id}`, productPerformance);
        }
    }
    async _calculateCustomerRfm(customerId) {
        console.log(`[Analytics] Calculando RFM para cliente ${customerId}`);
        try {
            const { data: sales, error } = await this.supabase
                .from("tenant_business_transactions")
                .select(`
          id, external_id, attributes, created_at,
          tenant_business_relationships!inner(
            target_id,
            tenant_business_entities!inner(
              external_id,
              entity_type
            )
          )
        `)
                .eq("organization_id", BANBAN_ORG_ID)
                .eq("transaction_type", "DOCUMENT_SALE")
                .eq("tenant_business_relationships.tenant_business_entities.external_id", customerId)
                .eq("tenant_business_relationships.tenant_business_entities.entity_type", "CUSTOMER")
                .gte("created_at", new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000).toISOString())
                .order("created_at", { ascending: false });
            if (error) {
                console.error(`[RFM] Erro ao buscar vendas do cliente ${customerId}:`, error);
                throw error;
            }
            const now = new Date();
            const salesData = sales || [];
            if (salesData.length === 0) {
                return {
                    customer_external_id: customerId,
                    recency_days: 999,
                    frequency: 0,
                    monetary: "0.00",
                    segment: "NEW",
                    last_updated: now.toISOString(),
                };
            }
            const lastSaleDate = new Date(salesData[0].created_at);
            const recencyDays = Math.floor((now.getTime() - lastSaleDate.getTime()) / (24 * 60 * 60 * 1000));
            const frequency = salesData.length;
            const monetary = salesData.reduce((total, sale) => {
                const saleValue = parseFloat(sale.attributes?.total_value || "0");
                return total + saleValue;
            }, 0);
            let segment = "NEW";
            if (recencyDays <= 30 && frequency >= 5 && monetary >= 1000) {
                segment = "CHAMPIONS";
            }
            else if (recencyDays <= 90 && frequency >= 3) {
                segment = "LOYAL";
            }
            else if (recencyDays > 180 && frequency >= 2) {
                segment = "AT_RISK";
            }
            return {
                customer_external_id: customerId,
                recency_days: recencyDays,
                frequency: frequency,
                monetary: monetary.toFixed(2),
                segment: segment,
                last_updated: now.toISOString(),
            };
        }
        catch (error) {
            console.error(`[RFM] Erro ao calcular RFM para cliente ${customerId}:`, error);
            return {
                customer_external_id: customerId,
                recency_days: 999,
                frequency: 0,
                monetary: "0.00",
                segment: "NEW",
                last_updated: new Date().toISOString(),
            };
        }
    }
    async _calculateSalespersonPerformance(salespersonId) {
        console.log(`[Analytics] Calculando performance para vendedor ${salespersonId}`);
        try {
            const { data: sales, error } = await this.supabase
                .from("tenant_business_transactions")
                .select(`
          id, external_id, attributes, created_at,
          tenant_business_relationships!inner(
            target_id,
            tenant_business_entities!inner(
              external_id,
              entity_type
            )
          )
        `)
                .eq("organization_id", BANBAN_ORG_ID)
                .eq("transaction_type", "DOCUMENT_SALE")
                .eq("tenant_business_relationships.tenant_business_entities.external_id", salespersonId)
                .eq("tenant_business_relationships.tenant_business_entities.entity_type", "SALESPERSON")
                .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
                .order("created_at", { ascending: false });
            if (error) {
                console.error(`[Performance] Erro ao buscar vendas do vendedor ${salespersonId}:`, error);
                throw error;
            }
            const salesData = sales || [];
            const totalSales = salesData.length;
            if (totalSales === 0) {
                return {
                    salesperson_external_id: salespersonId,
                    total_sales: 0,
                    total_revenue: "0.00",
                    avg_ticket: "0.00",
                    conversion_rate: "0.0",
                    last_updated: new Date().toISOString(),
                };
            }
            const totalRevenue = salesData.reduce((total, sale) => {
                const saleValue = parseFloat(sale.attributes?.total_value || "0");
                return total + saleValue;
            }, 0);
            const avgTicket = totalRevenue / totalSales;
            const estimatedAttempts = Math.max(totalSales * 1.5, totalSales + 10);
            const conversionRate = (totalSales / estimatedAttempts) * 100;
            return {
                salesperson_external_id: salespersonId,
                total_sales: totalSales,
                total_revenue: totalRevenue.toFixed(2),
                avg_ticket: avgTicket.toFixed(2),
                conversion_rate: conversionRate.toFixed(1),
                last_updated: new Date().toISOString(),
            };
        }
        catch (error) {
            console.error(`[Performance] Erro ao calcular performance do vendedor ${salespersonId}:`, error);
            return {
                salesperson_external_id: salespersonId,
                total_sales: 0,
                total_revenue: "0.00",
                avg_ticket: "0.00",
                conversion_rate: "0.0",
                last_updated: new Date().toISOString(),
            };
        }
    }
    async _analyzeProductPerformance(locationId) {
        console.log(`[Analytics] Analisando performance de produtos para ${locationId}`);
        try {
            const { data: salesData, error } = await this.supabase
                .from("tenant_business_transactions")
                .select(`
          id, external_id, attributes,
          tenant_business_relationships!inner(
            attributes,
            tenant_business_entities!inner(
              external_id,
              entity_type,
              attributes
            )
          )
        `)
                .eq("organization_id", BANBAN_ORG_ID)
                .eq("transaction_type", "DOCUMENT_SALE")
                .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
            if (error) {
                console.error(`[ProductPerformance] Erro ao buscar vendas da localização ${locationId}:`, error);
                throw error;
            }
            const sales = salesData || [];
            const productStats = new Map();
            for (const sale of sales) {
                const saleValue = parseFloat(sale.attributes?.total_value || "0");
                const relationships = Array.isArray(sale.tenant_business_relationships)
                    ? sale.tenant_business_relationships
                    : [sale.tenant_business_relationships];
                for (const rel of relationships) {
                    if (rel.tenant_business_entities?.entity_type === "PRODUCT") {
                        const productId = rel.tenant_business_entities.external_id;
                        const quantity = parseInt(rel.attributes?.quantity || "1");
                        const unitPrice = parseFloat(rel.attributes?.unit_price || "0");
                        const costPrice = parseFloat(rel.tenant_business_entities.attributes?.cost_price || "0");
                        const itemRevenue = quantity * unitPrice;
                        const margin = itemRevenue - quantity * costPrice;
                        if (!productStats.has(productId)) {
                            productStats.set(productId, {
                                qty_sold: 0,
                                revenue: 0,
                                margin_total: 0,
                            });
                        }
                        const stats = productStats.get(productId);
                        stats.qty_sold += quantity;
                        stats.revenue += itemRevenue;
                        stats.margin_total += margin;
                    }
                }
            }
            const bestSellers = Array.from(productStats.entries())
                .sort((a, b) => b[1].qty_sold - a[1].qty_sold)
                .slice(0, 10)
                .map(([variant_id, stats]) => ({
                variant_id,
                qty_sold: stats.qty_sold,
                revenue: Math.round(stats.revenue),
            }));
            const highestMargin = Array.from(productStats.entries())
                .filter(([_, stats]) => stats.revenue > 0)
                .map(([variant_id, stats]) => ({
                variant_id,
                margin_percentage: Math.round((stats.margin_total / stats.revenue) * 100),
                revenue: Math.round(stats.revenue),
            }))
                .sort((a, b) => b.margin_percentage - a.margin_percentage)
                .slice(0, 10);
            return {
                location_external_id: locationId,
                best_sellers: bestSellers,
                highest_margin: highestMargin,
                last_updated: new Date().toISOString(),
            };
        }
        catch (error) {
            console.error(`[ProductPerformance] Erro ao analisar performance de produtos para ${locationId}:`, error);
            return {
                location_external_id: locationId,
                best_sellers: [],
                highest_margin: [],
                last_updated: new Date().toISOString(),
            };
        }
    }
    async _updateSnapshot(snapshotType, snapshotKey, value) {
        const { error } = await this.supabase.from("tenant_snapshots").upsert({
            organization_id: BANBAN_ORG_ID,
            snapshot_type: snapshotType,
            snapshot_key: snapshotKey,
            snapshot_value: value,
            snapshot_date: new Date().toISOString().split("T")[0],
        }, { onConflict: "organization_id,snapshot_key" });
        if (error)
            console.error(`[_updateSnapshot] Erro ao atualizar snapshot ${snapshotKey}:`, error);
    }
    async _getTransactionByExternalId(externalId, txType) {
        const { data: transactions, error } = await this.supabase
            .from("tenant_business_transactions")
            .select("*")
            .eq("organization_id", BANBAN_ORG_ID)
            .eq("external_id", externalId)
            .eq("transaction_type", txType)
            .limit(1);
        if (error || !transactions || transactions.length === 0)
            throw new Error(`Transação do tipo ${txType} com ID externo ${externalId} não encontrada.`);
        return transactions[0];
    }
    async _createBusinessEvent(entityType, entityId, eventCode, eventData) {
        console.log(`[_createBusinessEvent] Registrando evento '${eventCode}'`);
        await this.supabase.from("tenant_business_events").insert({
            organization_id: BANBAN_ORG_ID,
            entity_type: entityType,
            entity_id: entityId,
            event_code: eventCode,
            event_data: eventData,
        });
    }
    async _updateInventorySnapshot(variantId, locationId, qtyChange, moveType, refId) {
        const snapshotKey = `stock_${variantId}_${locationId}`;
        const { data: snapshots } = await this.supabase
            .from("tenant_snapshots")
            .select("*")
            .eq("organization_id", BANBAN_ORG_ID)
            .eq("snapshot_key", snapshotKey)
            .limit(1);
        const existing = snapshots && snapshots.length > 0 ? snapshots[0] : null;
        const stock = existing?.snapshot_value || {};
        stock.current_stock = (stock.current_stock || 0) + qtyChange;
        stock.last_movement = moveType;
        stock.last_movement_ref = refId;
        stock.last_updated = new Date().toISOString();
        await this._updateSnapshot("INVENTORY", snapshotKey, stock);
    }
    async _getOrCreateBusinessEntity(organizationId, entityType, externalId, initialData) {
        const { data: entities } = await this.supabase
            .from("tenant_business_entities")
            .select("*")
            .eq("organization_id", organizationId)
            .eq("entity_type", entityType)
            .eq("external_id", externalId)
            .limit(1);
        let entity = entities && entities.length > 0 ? entities[0] : null;
        if (!entity) {
            console.log(`[${entityType}] Entidade com external_id ${externalId} não encontrada. Criando nova...`);
            entity = await (0, index_1.upsertBusinessEntity)(organizationId, entityType, {
                external_id: externalId,
                ...initialData,
            });
        }
        return entity;
    }
    async getSalesAnalytics(organizationId, filters = {}) {
        console.log(`[SalesService] Getting sales analytics for org: ${organizationId}`, filters);
        try {
            const { data: sales, error } = await this.supabase
                .from('tenant_business_transactions')
                .select('*')
                .eq('organization_id', organizationId)
                .eq('transaction_type', 'DOCUMENT_SALE')
                .order('created_at', { ascending: false })
                .limit(100);
            if (error) {
                throw error;
            }
            const totalSales = sales?.length || 0;
            const totalRevenue = sales?.reduce((sum, sale) => {
                const amount = sale.attributes?.total_amount || 0;
                return sum + amount;
            }, 0) || 0;
            const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
            const salesByDate = sales?.reduce((acc, sale) => {
                const date = sale.created_at?.split('T')[0];
                if (!acc[date]) {
                    acc[date] = { count: 0, revenue: 0 };
                }
                acc[date].count += 1;
                acc[date].revenue += sale.attributes?.total_amount || 0;
                return acc;
            }, {}) || {};
            return {
                summary: {
                    total_sales: totalSales,
                    total_revenue: totalRevenue,
                    avg_order_value: avgOrderValue,
                    date_range: {
                        from: filters.dateFrom || null,
                        to: filters.dateTo || null
                    }
                },
                trends: {
                    daily_sales: salesByDate
                },
                top_products: [],
                customer_segments: [],
                last_updated: new Date().toISOString()
            };
        }
        catch (error) {
            console.error('[SalesService] Error getting sales analytics:', error);
            return {
                summary: {
                    total_sales: 0,
                    total_revenue: 0,
                    avg_order_value: 0,
                    date_range: {
                        from: filters.dateFrom || null,
                        to: filters.dateTo || null
                    }
                },
                trends: {
                    daily_sales: {}
                },
                top_products: [],
                customer_segments: [],
                last_updated: new Date().toISOString(),
                error: 'Failed to load analytics data'
            };
        }
    }
}
exports.BanBanSalesFlowService = BanBanSalesFlowService;
//# sourceMappingURL=banban-sales-flow-service.js.map