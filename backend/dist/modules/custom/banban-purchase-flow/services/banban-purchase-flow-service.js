"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BanBanPurchaseFlowService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const index_1 = require("@shared/webhook-base/index");
const logger_1 = require("../../../../utils/logger");
const BANBAN_ORG_ID = "2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4";
const PURCHASE_ACTIONS = {
    CREATE_ORDER: "create_order",
    APPROVE_ORDER: "approve_order",
    REGISTER_INVOICE: "register_invoice",
    ARRIVE_AT_CD: "arrive_at_cd",
    START_CONFERENCE: "start_conference",
    SCAN_ITEMS: "scan_items",
    EFFECTUATE_CD: "effectuate_cd",
};
class BanBanPurchaseFlowService {
    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
    }
    async processAction(action, transactionData, metadata) {
        logger_1.logger.debug(`[PurchaseService] Iniciando ação '${action}'`);
        await (0, index_1.validateAndGetTenant)(BANBAN_ORG_ID);
        switch (action) {
            case PURCHASE_ACTIONS.CREATE_ORDER:
                return this._createOrder(transactionData, metadata);
            case PURCHASE_ACTIONS.APPROVE_ORDER:
                return this._approveOrder(transactionData, metadata);
            case PURCHASE_ACTIONS.REGISTER_INVOICE:
                return this._registerInvoice(transactionData, metadata);
            case PURCHASE_ACTIONS.ARRIVE_AT_CD:
                return this._arriveAtCD(transactionData, metadata);
            case PURCHASE_ACTIONS.START_CONFERENCE:
                return this._startConference(transactionData, metadata);
            case PURCHASE_ACTIONS.SCAN_ITEMS:
                return this._scanItems(transactionData, metadata);
            case PURCHASE_ACTIONS.EFFECTUATE_CD:
                return this._effectuateCD(transactionData, metadata);
            default:
                throw new Error(`Ação de compra desconhecida: ${action}`);
        }
    }
    async getPurchaseData(queryParams) {
        logger_1.logger.debug(`[PurchaseService-GET] Buscando dados com filtros:`, queryParams);
        const { limit = 50, offset = 0, external_id, transaction_id, status, supplier_id, date_from, date_to, } = queryParams;
        let query = this.supabase
            .from("tenant_business_transactions")
            .select("*")
            .eq("organization_id", BANBAN_ORG_ID);
        if (external_id)
            query = query.eq("external_id", external_id);
        if (transaction_id)
            query = query.eq("id", transaction_id);
        if (status)
            query = query.eq("status", status);
        if (supplier_id)
            query = query.contains("attributes", {
                supplier_external_id: supplier_id,
            });
        if (date_from)
            query = query.gte("created_at", date_from);
        if (date_to)
            query = query.lte("created_at", date_to);
        const { data, error } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);
        if (error) {
            throw new Error(`Erro ao buscar dados de Purchase (legacy): ${error.message}`);
        }
        return {
            success: true,
            data: {
                purchases: data || [],
                total: data?.length || 0,
                limit,
                offset,
            },
        };
    }
    async processPurchaseOrderCreated(data, organizationId) {
        logger_1.logger.info("⚠️  [PurchaseService-LEGACY] Usando wrapper legacy processPurchaseOrderCreated");
        return await this.processAction("create_order", {
            external_id: data.external_id,
            supplier_external_id: data.supplier_external_id,
            supplier_name: data.supplier_name,
            items: data.items,
            total_value: data.total_value,
            issue_date: data.issue_date,
            expected_delivery: data.expected_delivery,
        }, { organizationId });
    }
    async _createOrder(data, metadata) {
        logger_1.logger.info("[_createOrder] Iniciando criação de ordem de compra:", data.external_id);
        if (!data.external_id || !data.items || !data.supplier_external_id) {
            throw new Error("external_id, items e supplier_external_id são obrigatórios.");
        }
        const supplierEntity = await this._getOrCreateBusinessEntity(BANBAN_ORG_ID, "SUPPLIER", data.supplier_external_id, { name: data.supplier_name || `Fornecedor ${data.supplier_external_id}` });
        const transaction = await (0, index_1.createECABusinessTransaction)("ORDER_PURCHASE", data.external_id, "PENDENTE", { ...data, status: "PENDENTE" });
        await (0, index_1.createECABusinessRelationship)("FROM_SUPPLIER", transaction.id, supplierEntity.id, {});
        for (const item of data.items) {
            const productEntity = await this._getOrCreateBusinessEntity(BANBAN_ORG_ID, "PRODUCT", item.product_external_id, { name: item.product_name || `Produto ${item.product_external_id}` });
            await (0, index_1.createECABusinessRelationship)("CONTAINS_ITEM", transaction.id, productEntity.id, { quantity: item.quantity, unit_price: item.unit_price });
        }
        await this._createBusinessEvent("TRANSACTION", transaction.id, "purchase_order_created", { ...data, ...metadata });
        logger_1.logger.info("[_createOrder] Ordem de compra criada com sucesso.");
        return {
            transaction_id: transaction.id,
            external_id: data.external_id,
            status: "PENDENTE",
        };
    }
    async _getOrCreateBusinessEntity(organizationId, entityType, externalId, initialData) {
        let entity = await (0, index_1.getECAEntityByExternalId)(entityType, externalId, organizationId);
        if (!entity) {
            logger_1.logger.debug(`[${entityType}] Entidade com external_id ${externalId} não encontrada. Criando nova...`);
            entity = await (0, index_1.upsertECABusinessEntity)(entityType, externalId, initialData, undefined, organizationId);
        }
        return entity;
    }
    async _getTransactionByExternalId(externalId, transactionType) {
        const transaction = await (0, index_1.getECATransactionByExternalId)(transactionType, externalId, BANBAN_ORG_ID);
        if (!transaction)
            throw new Error(`Transação do tipo ${transactionType} com ID externo ${externalId} não encontrada.`);
        return transaction;
    }
    async _createBusinessEvent(entityType, entityId, eventCode, eventData) {
        logger_1.logger.debug(`[_createBusinessEvent] Registrando evento '${eventCode}' para ${entityType} ${entityId}`);
        try {
            const { error } = await this.supabase
                .from("tenant_business_events")
                .insert({
                organization_id: BANBAN_ORG_ID,
                entity_type: entityType,
                entity_id: entityId,
                event_code: eventCode,
                event_data: eventData,
            });
            if (error) {
                logger_1.logger.error(`[_createBusinessEvent] Erro ao registrar evento:`, error);
                if (process.env.NODE_ENV === "development") {
                    logger_1.logger.debug(`🚧 [DEV-EVENT] ${eventCode} para ${entityType}/${entityId} (modo desenvolvimento)`);
                }
            }
            else {
                logger_1.logger.debug(`[_createBusinessEvent] Evento registrado com sucesso`);
            }
        }
        catch (error) {
            logger_1.logger.error(`[_createBusinessEvent] Erro crítico:`, error);
            if (process.env.NODE_ENV === "development") {
                logger_1.logger.debug(`🚧 [DEV-EVENT-FALLBACK] ${eventCode} para ${entityType}/${entityId}`);
            }
        }
    }
    async _updateInventorySnapshot(variantExternalId, locationExternalId, qtyChange, movementType, referenceId) {
        const snapshotKey = `stock_${variantExternalId}_${locationExternalId}`;
        const { data: snapshots, error: queryError } = await this.supabase
            .from("tenant_snapshots")
            .select("*")
            .eq("organization_id", BANBAN_ORG_ID)
            .eq("snapshot_key", snapshotKey)
            .limit(1);
        if (queryError) {
            logger_1.logger.error(`[_updateInventorySnapshot] Erro ao buscar snapshot:`, queryError);
            throw queryError;
        }
        const existing = snapshots && snapshots.length > 0 ? snapshots[0] : null;
        const stock = existing?.snapshot_value || {};
        stock.current_stock = (stock.current_stock || 0) + qtyChange;
        stock.last_movement = movementType;
        stock.last_movement_ref = referenceId;
        stock.last_updated = new Date().toISOString();
        const { error: upsertError } = await this.supabase
            .from("tenant_snapshots")
            .upsert({
            organization_id: BANBAN_ORG_ID,
            snapshot_type: "INVENTORY",
            snapshot_key: snapshotKey,
            snapshot_value: stock,
            snapshot_date: new Date().toISOString().split("T")[0],
        }, { onConflict: "organization_id,snapshot_key" });
        if (upsertError) {
            logger_1.logger.error(`[_updateInventorySnapshot] Erro ao atualizar snapshot:`, upsertError);
            throw upsertError;
        }
    }
    async _approveOrder(data, metadata) {
        logger_1.logger.info("[_approveOrder] Iniciando aprovação para:", data.external_id);
        const transaction = await this._getTransactionByExternalId(data.external_id, "ORDER_PURCHASE");
        if (transaction.status !== "PENDENTE") {
            throw new Error(`Ordem de compra ${data.external_id} não pode ser aprovada pois seu status é ${transaction.status}. Esperado: PENDENTE.`);
        }
        const updatedTx = await (0, index_1.transitionECATransactionState)(transaction.id, "APPROVED", { ...transaction.attributes, status: "APPROVED" }, BANBAN_ORG_ID);
        await this._createBusinessEvent("TRANSACTION", transaction.id, "purchase_order_approved", { ...data, ...metadata });
        logger_1.logger.info("[_approveOrder] Ordem de compra aprovada.");
        return {
            transaction_id: transaction.id,
            external_id: data.external_id,
            status: "APPROVED",
        };
    }
    async _registerInvoice(data, metadata) {
        logger_1.logger.info("[_registerInvoice] Iniciando registro de NF:", data.external_id);
        if (!data.external_id || !data.purchase_order_external_id) {
            throw new Error("external_id e purchase_order_external_id são obrigatórios.");
        }
        const poTransaction = await this._getTransactionByExternalId(data.purchase_order_external_id, "ORDER_PURCHASE");
        const invoiceData = { ...data, reference_transaction_id: poTransaction.id };
        const transaction = await (0, index_1.createECABusinessTransaction)("DOCUMENT_SUPPLIER_IN", data.external_id, "PRE_BAIXA", { ...invoiceData, status: "PRE_BAIXA" });
        await (0, index_1.createECABusinessRelationship)("BASED_ON_ORDER", transaction.id, poTransaction.id, {});
        await this._createBusinessEvent("TRANSACTION", transaction.id, "invoice_registered", { ...data, ...metadata });
        logger_1.logger.info("[_registerInvoice] NF registrada com sucesso.");
        return {
            transaction_id: transaction.id,
            external_id: data.external_id,
            status: "PRE_BAIXA",
        };
    }
    async _arriveAtCD(data, metadata) {
        logger_1.logger.info("[_arriveAtCD] Carga chegou na portaria do CD para NF:", data.invoice_external_id);
        if (!data.invoice_external_id)
            throw new Error("invoice_external_id é obrigatório.");
        const transaction = await this._getTransactionByExternalId(data.invoice_external_id, "DOCUMENT_SUPPLIER_IN");
        if (transaction.status !== "PRE_BAIXA") {
            throw new Error(`NF ${data.invoice_external_id} não pode ser marcada como chegada pois seu status é ${transaction.status}. Esperado: PRE_BAIXA.`);
        }
        const updatedTx = await (0, index_1.transitionECATransactionState)(transaction.id, "AGUARDANDO_CONFERENCIA_CD", {
            ...transaction.attributes,
            status: "AGUARDANDO_CONFERENCIA_CD",
            chegada_cd_em: new Date().toISOString(),
        }, BANBAN_ORG_ID);
        await this._createBusinessEvent("TRANSACTION", transaction.id, "arrived_at_cd", { ...data, ...metadata });
        logger_1.logger.info("[_arriveAtCD] Carga marcada como chegada no CD.");
        return {
            transaction_id: transaction.id,
            external_id: transaction.external_id,
            status: "AGUARDANDO_CONFERENCIA_CD",
        };
    }
    async _startConference(data, metadata) {
        logger_1.logger.info("[_startConference] Iniciando conferência para NF:", data.invoice_external_id);
        logger_1.logger.debug("[_startConference] Dados recebidos:", JSON.stringify(data));
        try {
            const transaction = await this._getTransactionByExternalId(data.invoice_external_id, "DOCUMENT_SUPPLIER_IN");
            logger_1.logger.debug("[_startConference] Transação encontrada:", transaction.id);
            if (transaction.status !== "PRE_BAIXA" &&
                transaction.status !== "AGUARDANDO_CONFERENCIA_CD") {
                throw new Error(`NF ${data.invoice_external_id} não pode iniciar conferência pois seu status é ${transaction.status}. Esperado: PRE_BAIXA ou AGUARDANDO_CONFERENCIA_CD.`);
            }
            logger_1.logger.debug("[_startConference] Status validado, iniciando transição para EM_CONFERENCIA_CD");
            const updatedTx = await (0, index_1.transitionECATransactionState)(transaction.id, "EM_CONFERENCIA_CD", {
                ...transaction.attributes,
                status: "EM_CONFERENCIA_CD",
                conferencia_iniciada_em: new Date().toISOString(),
            }, BANBAN_ORG_ID);
            logger_1.logger.debug("[_startConference] Status atualizado com sucesso");
            await this._createBusinessEvent("TRANSACTION", transaction.id, "conference_started", { ...data, ...metadata });
            logger_1.logger.debug("[_startConference] Evento criado com sucesso");
            return {
                transaction_id: transaction.id,
                external_id: transaction.external_id,
                status: "EM_CONFERENCIA_CD",
            };
        }
        catch (error) {
            logger_1.logger.error("[_startConference] Erro no start_conference:", error);
            throw error;
        }
    }
    async _scanItems(data, metadata) {
        logger_1.logger.info("[_scanItems] Registrando itens escaneados para NF:", data.invoice_external_id);
        if (!data.invoice_external_id || !data.items)
            throw new Error("invoice_external_id e items são obrigatórios.");
        const transaction = await this._getTransactionByExternalId(data.invoice_external_id, "DOCUMENT_SUPPLIER_IN");
        if (transaction.status !== "EM_CONFERENCIA_CD" &&
            transaction.status !== "CONFERENCIA_CD_SEM_DIVERGENCIA" &&
            transaction.status !== "CONFERENCIA_CD_COM_DIVERGENCIA") {
            throw new Error(`NF ${data.invoice_external_id} não está em conferência. Status atual: ${transaction.status}.`);
        }
        const allDiscrepancies = transaction.attributes.divergencias || [];
        for (const item of data.items) {
            await this._createBusinessEvent("TRANSACTION", transaction.id, "receipt_item_scanned_ok", { ...item, ...metadata });
            if (item.qty_diff && item.qty_diff !== 0) {
                const existingDiscrepancyIndex = allDiscrepancies.findIndex((d) => d.sku === item.product_external_id);
                const discrepancyData = {
                    sku: item.product_external_id,
                    qty_expected: item.qty_expected,
                    qty_scanned: item.qty_scanned,
                    qty_diff: item.qty_diff,
                    scanned_at: new Date().toISOString(),
                };
                if (existingDiscrepancyIndex >= 0) {
                    allDiscrepancies[existingDiscrepancyIndex] = discrepancyData;
                }
                else {
                    allDiscrepancies.push(discrepancyData);
                }
            }
            await this._processItemInventoryMovement(item, transaction);
        }
        const totalDiscrepancies = allDiscrepancies.length > 0;
        const newStatus = totalDiscrepancies
            ? "CONFERENCIA_CD_COM_DIVERGENCIA"
            : "CONFERENCIA_CD_SEM_DIVERGENCIA";
        await (0, index_1.transitionECATransactionState)(transaction.id, newStatus, {
            ...transaction.attributes,
            status: newStatus,
            divergencias: allDiscrepancies,
            ultima_conferencia_em: new Date().toISOString(),
        }, BANBAN_ORG_ID);
        logger_1.logger.info(`[_scanItems] ${data.items.length} itens processados. Status atualizado para: ${newStatus}`);
        return {
            transaction_id: transaction.id,
            external_id: transaction.external_id,
            status: newStatus,
            summary: `${data.items.length} itens escaneados`,
            divergencias: allDiscrepancies,
        };
    }
    async _processItemInventoryMovement(item, transaction) {
        logger_1.logger.debug(`[_processItemInventoryMovement] Processando item ${item.product_external_id}: +${item.qty_scanned}`);
        const productEntity = await this._getOrCreateBusinessEntity(BANBAN_ORG_ID, "PRODUCT", item.product_external_id, { name: item.product_name || `Produto ${item.product_external_id}` });
        const locationEntity = await this._getOrCreateBusinessEntity(BANBAN_ORG_ID, "LOCATION", item.location_external_id, { name: item.location_name || `Local ${item.location_external_id}` });
        const inventoryMovement = await (0, index_1.createECABusinessTransaction)("INVENTORY_MOVEMENT", null, "MOVIMENTO_EXECUTADO", {
            qty_change: item.qty_scanned,
            movement_type: "CD_RECEIPT",
            reference_invoice_id: transaction.id,
            reference_invoice_external_id: transaction.external_id,
            product_external_id: item.product_external_id,
            location_external_id: item.location_external_id,
            ...item,
        });
        await (0, index_1.createECABusinessRelationship)("AFFECTS_PRODUCT", inventoryMovement.id, productEntity.id, {});
        await (0, index_1.createECABusinessRelationship)("AT_LOCATION", inventoryMovement.id, locationEntity.id, {});
        await (0, index_1.createECABusinessRelationship)("CAUSED_BY_DOCUMENT", inventoryMovement.id, transaction.id, {});
        await this._updateInventorySnapshot(item.product_external_id, item.location_external_id, item.qty_scanned, "CD_RECEIPT", inventoryMovement.id);
    }
    async _effectuateCD(data, metadata) {
        logger_1.logger.info("[_effectuateCD] Iniciando efetivação no CD para NF:", data.invoice_external_id);
        if (!data.invoice_external_id)
            throw new Error("invoice_external_id é obrigatório.");
        const transaction = await this._getTransactionByExternalId(data.invoice_external_id, "DOCUMENT_SUPPLIER_IN");
        if (transaction.status !== "CONFERENCIA_CD_SEM_DIVERGENCIA" &&
            transaction.status !== "CONFERENCIA_CD_COM_DIVERGENCIA") {
            throw new Error(`NF ${data.invoice_external_id} não pode ser efetivada pois seu status é ${transaction.status}. Esperado: CONFERENCIA_CD_SEM_DIVERGENCIA ou CONFERENCIA_CD_COM_DIVERGENCIA.`);
        }
        await (0, index_1.transitionECATransactionState)(transaction.id, "EFETIVADO_CD", {
            ...transaction.attributes,
            status: "EFETIVADO_CD",
            efetivado_em: new Date().toISOString(),
        }, BANBAN_ORG_ID);
        await this._createBusinessEvent("TRANSACTION", transaction.id, "cd_effectuated", { ...data, ...metadata });
        logger_1.logger.info("[_effectuateCD] NF efetivada no CD com sucesso.");
        return {
            transaction_id: transaction.id,
            external_id: transaction.external_id,
            status: "EFETIVADO_CD",
        };
    }
}
exports.BanBanPurchaseFlowService = BanBanPurchaseFlowService;
//# sourceMappingURL=banban-purchase-flow-service.js.map