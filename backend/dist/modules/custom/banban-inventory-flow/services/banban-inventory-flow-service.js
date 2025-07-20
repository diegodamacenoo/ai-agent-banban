"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BanBanInventoryFlowService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const index_1 = require("@shared/webhook-base/index");
const INVENTORY_ACTIONS = {
    ADJUST_STOCK: "adjust_stock",
    COUNT_INVENTORY: "count_inventory",
    RESERVE_STOCK: "reserve_stock",
    TRANSFER_INTERNAL: "transfer_internal",
    QUARANTINE_PRODUCT: "quarantine_product",
};
class BanBanInventoryFlowService {
    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
    }
    async processAction(action, organizationId, transactionData, metadata) {
        console.log(`[Service] Iniciando ação '${action}' para a organização ${organizationId}`);
        await (0, index_1.validateAndGetTenant)(organizationId);
        switch (action) {
            case INVENTORY_ACTIONS.ADJUST_STOCK:
                return this._adjustStock(organizationId, transactionData, metadata);
            case INVENTORY_ACTIONS.COUNT_INVENTORY:
                return this._countInventory(organizationId, transactionData, metadata);
            case INVENTORY_ACTIONS.RESERVE_STOCK:
                return this._reserveStock(organizationId, transactionData, metadata);
            case INVENTORY_ACTIONS.TRANSFER_INTERNAL:
                return this._transferInternal(organizationId, transactionData, metadata);
            case INVENTORY_ACTIONS.QUARANTINE_PRODUCT:
                return this._quarantineProduct(organizationId, transactionData, metadata);
            default:
                throw new Error(`Ação de inventário desconhecida: ${action}`);
        }
    }
    async getInventoryData(organizationId, queryParams) {
        console.log(`[Service] Buscando dados de inventário com filtros:`, queryParams);
        const { limit = 50, offset = 0, variant_external_id, location_external_id, movement_type, alert_type, date_from, date_to, show_reserved, show_quarantined, } = queryParams;
        await (0, index_1.validateAndGetTenant)(organizationId);
        if (variant_external_id ||
            location_external_id ||
            show_reserved ||
            show_quarantined) {
            console.log("[Service-GET] Modo de consulta: Snapshots");
            let query = this.supabase
                .from("tenant_snapshots")
                .select("*")
                .eq("organization_id", organizationId)
                .eq("snapshot_type", "INVENTORY");
            if (variant_external_id)
                query = query.ilike("snapshot_value->>variant_external_id", `%${variant_external_id}%`);
            if (location_external_id)
                query = query.ilike("snapshot_value->>location_external_id", `%${location_external_id}%`);
            if (show_reserved)
                query = query.gt("snapshot_value->>qty_reserved", 0);
            if (show_quarantined)
                query = query.gt("snapshot_value->>qty_quarantined", 0);
            const { data, error } = await query.range(offset, offset + limit - 1);
            if (error) {
                console.error("[Service-GET] Erro ao buscar snapshots:", error);
                throw new Error(`Erro ao buscar snapshots de inventário: ${error.message}`);
            }
            return {
                snapshots: data || [],
                pagination: { limit, offset, count: data?.length || 0 },
            };
        }
        console.log("[Service-GET] Modo de consulta: Transações");
        let query = this.supabase
            .from("tenant_business_transactions")
            .select("*")
            .eq("organization_id", organizationId);
        if (movement_type)
            query = query.eq("transaction_type", movement_type);
        if (date_from)
            query = query.gte("created_at", date_from);
        if (date_to)
            query = query.lte("created_at", date_to);
        const { data, error } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);
        if (error) {
            console.error("[Service-GET] Erro ao buscar transações:", error);
            throw new Error(`Erro ao buscar transações de inventário: ${error.message}`);
        }
        return {
            transactions: data || [],
            pagination: { limit, offset, count: data?.length || 0 },
        };
    }
    async _adjustStock(organizationId, transactionData, metadata) {
        console.log("[_adjustStock] Iniciando:", transactionData);
        const { external_id, variant_external_id, location_external_id, qty_change, } = transactionData;
        if (!variant_external_id ||
            !location_external_id ||
            qty_change === undefined) {
            throw new Error("variant_external_id, location_external_id e qty_change são obrigatórios");
        }
        const productEntity = await this._getOrCreateBusinessEntity(organizationId, "PRODUCT", variant_external_id, { name: `Produto ${variant_external_id}` });
        const locationEntity = await this._getOrCreateBusinessEntity(organizationId, "LOCATION", location_external_id, { name: `Local ${location_external_id}` });
        const inventoryMovement = await (0, index_1.createBusinessTransaction)(organizationId, "INVENTORY_MOVEMENT", external_id || crypto.randomUUID(), {
            qty_change: qty_change,
            movement_type: "ADJUSTMENT",
            product_external_id: variant_external_id,
            location_external_id: location_external_id,
            ...transactionData,
        });
        await (0, index_1.createBusinessRelationship)(organizationId, "AFFECTS_PRODUCT", inventoryMovement.id, productEntity.id, {});
        await (0, index_1.createBusinessRelationship)(organizationId, "AT_LOCATION", inventoryMovement.id, locationEntity.id, {});
        await (0, index_1.createBusinessRelationship)(organizationId, "CAUSED_BY_ADJUSTMENT", inventoryMovement.id, inventoryMovement.id, {});
        await this._createBusinessEvent(organizationId, "TRANSACTION", inventoryMovement.id, "inventory_adjustment_made", { ...transactionData, ...metadata });
        await this._updateInventorySnapshot(organizationId, variant_external_id, location_external_id, qty_change, "ADJUSTMENT", inventoryMovement.id);
        console.log("[_adjustStock] Finalizado com sucesso.");
        return {
            entityType: "INVENTORY_ADJUSTMENT",
            entityId: inventoryMovement.id,
            summary: {
                message: `Ajuste de estoque para ${variant_external_id} processado`,
            },
        };
    }
    async _countInventory(organizationId, transactionData, metadata) {
        console.log("[_countInventory] Iniciando:", transactionData);
        const { external_id, location_external_id, items } = transactionData;
        if (!location_external_id || !items) {
            throw new Error("location_external_id e items são obrigatórios");
        }
        await this._validateLocationExists(location_external_id, organizationId);
        const countEntity = await (0, index_1.upsertBusinessEntity)(organizationId, "inventory_count", { external_id, ...transactionData, ...metadata });
        await this._createBusinessEvent(organizationId, "INVENTORY_COUNT", countEntity.id, "inventory_count_started", { ...transactionData, ...metadata });
        let itemsProcessed = 0;
        for (const item of items) {
            try {
                await this._validateVariantExists(item.variant_external_id, organizationId);
                await (0, index_1.upsertBusinessEntity)(organizationId, "inventory_count_item", {
                    count_id: countEntity.id,
                    ...item,
                });
                itemsProcessed++;
            }
            catch (error) {
                console.error(`[_countInventory] Erro ao processar item de contagem ${item.variant_external_id}:`, error);
            }
        }
        await this._createBusinessEvent(organizationId, "INVENTORY_COUNT", countEntity.id, "inventory_count_completed", { processed_items: itemsProcessed });
        console.log("[_countInventory] Finalizado com sucesso.");
        return {
            entityType: "INVENTORY_COUNT",
            entityId: countEntity.id,
            summary: {
                message: `Contagem ${external_id} processada com ${itemsProcessed} itens`,
            },
        };
    }
    async _reserveStock(organizationId, transactionData, metadata) {
        console.log("[_reserveStock] Iniciando:", transactionData);
        const { external_id, items, location_external_id } = transactionData;
        if (!items || !location_external_id)
            throw new Error("items e location_external_id são obrigatórios.");
        const locationEntity = await this._getOrCreateBusinessEntity(organizationId, "LOCATION", location_external_id, { name: `Local ${location_external_id}` });
        for (const item of items) {
            const { variant_external_id, qty_to_reserve } = item;
            const productEntity = await this._getOrCreateBusinessEntity(organizationId, "PRODUCT", variant_external_id, { name: `Produto ${variant_external_id}` });
            const snapshot = await this._getInventorySnapshot(organizationId, variant_external_id, location_external_id);
            const stock = snapshot?.snapshot_value || {};
            const qty_available = (stock.current_stock || 0) - (stock.qty_reserved || 0);
            if (qty_available < qty_to_reserve) {
                throw new Error(`Estoque insuficiente para ${variant_external_id}. Disponível: ${qty_available}, Necessário: ${qty_to_reserve}`);
            }
            const inventoryMovement = await (0, index_1.createBusinessTransaction)(organizationId, "INVENTORY_MOVEMENT", external_id || crypto.randomUUID(), {
                qty_change: qty_to_reserve,
                movement_type: "RESERVATION",
                product_external_id: variant_external_id,
                location_external_id: location_external_id,
                ...item,
            });
            await (0, index_1.createBusinessRelationship)(organizationId, "AFFECTS_PRODUCT", inventoryMovement.id, productEntity.id, {});
            await (0, index_1.createBusinessRelationship)(organizationId, "AT_LOCATION", inventoryMovement.id, locationEntity.id, {});
            await (0, index_1.createBusinessRelationship)(organizationId, "CAUSED_BY_RESERVATION", inventoryMovement.id, inventoryMovement.id, {});
            stock.qty_reserved = (stock.qty_reserved || 0) + qty_to_reserve;
            await this._updateInventorySnapshot(organizationId, variant_external_id, location_external_id, 0, "RESERVATION", inventoryMovement.id, stock);
        }
        const transaction = await (0, index_1.createBusinessTransaction)(organizationId, "STOCK_RESERVATION", external_id, transactionData);
        await this._createBusinessEvent(organizationId, "TRANSACTION", transaction.id, "stock_reservation_made", { ...transactionData, ...metadata });
        console.log("[_reserveStock] Finalizado com sucesso.");
        return {
            entityType: "STOCK_RESERVATION",
            entityId: transaction.id,
            summary: { message: `Estoque reservado com sucesso.` },
        };
    }
    async _transferInternal(organizationId, transactionData, metadata) {
        console.log("[_transferInternal] Iniciando:", transactionData);
        const { external_id, items, origin_location_external_id, destination_location_external_id, } = transactionData;
        if (!items ||
            !origin_location_external_id ||
            !destination_location_external_id)
            throw new Error("items, origin_location e destination_location são obrigatórios.");
        const originLocationEntity = await this._getOrCreateBusinessEntity(organizationId, "LOCATION", origin_location_external_id, { name: `Local ${origin_location_external_id}` });
        const destinationLocationEntity = await this._getOrCreateBusinessEntity(organizationId, "LOCATION", destination_location_external_id, { name: `Local ${destination_location_external_id}` });
        const transferTransaction = await (0, index_1.createBusinessTransaction)(organizationId, "INTERNAL_TRANSFER", external_id, transactionData);
        await this._createBusinessEvent(organizationId, "TRANSACTION", transferTransaction.id, "internal_transfer_initiated", { ...transactionData, ...metadata });
        for (const item of items) {
            const { variant_external_id, qty_transfer } = item;
            const productEntity = await this._getOrCreateBusinessEntity(organizationId, "PRODUCT", variant_external_id, { name: `Produto ${variant_external_id}` });
            console.log(`[_transferInternal] Transferindo ${qty_transfer} de ${variant_external_id} de ${origin_location_external_id} para ${destination_location_external_id}`);
            const outboundMovement = await (0, index_1.createBusinessTransaction)(organizationId, "INVENTORY_MOVEMENT", null, {
                qty_change: -qty_transfer,
                movement_type: "TRANSFER_OUT",
                product_external_id: variant_external_id,
                location_external_id: origin_location_external_id,
                reference_transfer_id: transferTransaction.id,
                ...item,
            });
            await (0, index_1.createBusinessRelationship)(organizationId, "AFFECTS_PRODUCT", outboundMovement.id, productEntity.id, {});
            await (0, index_1.createBusinessRelationship)(organizationId, "AT_LOCATION", outboundMovement.id, originLocationEntity.id, {});
            await (0, index_1.createBusinessRelationship)(organizationId, "CAUSED_BY_INTERNAL_TRANSFER", outboundMovement.id, transferTransaction.id, {});
            await this._updateInventorySnapshot(organizationId, variant_external_id, origin_location_external_id, -qty_transfer, "TRANSFER_OUT", outboundMovement.id);
            const inboundMovement = await (0, index_1.createBusinessTransaction)(organizationId, "INVENTORY_MOVEMENT", null, {
                qty_change: qty_transfer,
                movement_type: "TRANSFER_IN",
                product_external_id: variant_external_id,
                location_external_id: destination_location_external_id,
                reference_transfer_id: transferTransaction.id,
                ...item,
            });
            await (0, index_1.createBusinessRelationship)(organizationId, "AFFECTS_PRODUCT", inboundMovement.id, productEntity.id, {});
            await (0, index_1.createBusinessRelationship)(organizationId, "AT_LOCATION", inboundMovement.id, destinationLocationEntity.id, {});
            await (0, index_1.createBusinessRelationship)(organizationId, "CAUSED_BY_INTERNAL_TRANSFER", inboundMovement.id, transferTransaction.id, {});
            await this._updateInventorySnapshot(organizationId, variant_external_id, destination_location_external_id, qty_transfer, "TRANSFER_IN", inboundMovement.id);
        }
        await this._createBusinessEvent(organizationId, "TRANSACTION", transferTransaction.id, "internal_transfer_completed", { ...transactionData, ...metadata });
        console.log("[_transferInternal] Finalizado com sucesso.");
        return {
            entityType: "INTERNAL_TRANSFER",
            entityId: transferTransaction.id,
            summary: { message: `Transferência interna concluída.` },
        };
    }
    async _quarantineProduct(organizationId, transactionData, metadata) {
        console.log("[_quarantineProduct] Iniciando:", transactionData);
        const { external_id, variant_external_id, location_external_id, qty_quarantine, } = transactionData;
        if (!variant_external_id || !location_external_id || !qty_quarantine)
            throw new Error("variant_external_id, location_external_id e qty_quarantine são obrigatórios.");
        const productEntity = await this._getOrCreateBusinessEntity(organizationId, "PRODUCT", variant_external_id, { name: `Produto ${variant_external_id}` });
        const locationEntity = await this._getOrCreateBusinessEntity(organizationId, "LOCATION", location_external_id, { name: `Local ${location_external_id}` });
        const inventoryMovement = await (0, index_1.createBusinessTransaction)(organizationId, "INVENTORY_MOVEMENT", external_id || crypto.randomUUID(), {
            qty_change: qty_quarantine,
            movement_type: "QUARANTINE",
            product_external_id: variant_external_id,
            location_external_id: location_external_id,
            ...transactionData,
        });
        await (0, index_1.createBusinessRelationship)(organizationId, "AFFECTS_PRODUCT", inventoryMovement.id, productEntity.id, {});
        await (0, index_1.createBusinessRelationship)(organizationId, "AT_LOCATION", inventoryMovement.id, locationEntity.id, {});
        await (0, index_1.createBusinessRelationship)(organizationId, "CAUSED_BY_QUARANTINE", inventoryMovement.id, inventoryMovement.id, {});
        const snapshot = await this._getInventorySnapshot(organizationId, variant_external_id, location_external_id);
        const stock = snapshot?.snapshot_value || {};
        stock.qty_quarantined = (stock.qty_quarantined || 0) + qty_quarantine;
        await this._updateInventorySnapshot(organizationId, variant_external_id, location_external_id, 0, "QUARANTINE", inventoryMovement.id, stock);
        await this._createBusinessEvent(organizationId, "TRANSACTION", inventoryMovement.id, "product_quarantined", { ...transactionData, ...metadata });
        console.log("[_quarantineProduct] Finalizado com sucesso.");
        return {
            entityType: "PRODUCT_QUARANTINE",
            entityId: inventoryMovement.id,
            summary: { message: `Produto colocado em quarentena.` },
        };
    }
    async _getInventorySnapshot(organizationId, variantExternalId, locationExternalId) {
        const snapshotKey = `stock_${variantExternalId}_${locationExternalId}`;
        const { data: snapshots } = await this.supabase
            .from("tenant_snapshots")
            .select("*")
            .eq("organization_id", organizationId)
            .eq("snapshot_type", "INVENTORY")
            .eq("snapshot_key", snapshotKey)
            .limit(1);
        return snapshots && snapshots.length > 0 ? snapshots[0] : null;
    }
    async _createBusinessEvent(organizationId, entityType, entityId, eventCode, eventData) {
        console.log(`[_createBusinessEvent] Registrando evento '${eventCode}' para ${entityType} ${entityId}`);
        const { error } = await this.supabase
            .from("tenant_business_events")
            .insert({
            organization_id: organizationId,
            entity_type: entityType,
            entity_id: entityId,
            event_code: eventCode,
            event_data: eventData,
        });
        if (error)
            console.error(`[_createBusinessEvent] Erro ao registrar evento:`, error);
    }
    async _validateLocationExists(locationExternalId, organizationId) {
        const { data: locations, error } = await this.supabase
            .from("tenant_business_entities")
            .select("id")
            .eq("entity_type", "location")
            .eq("external_id", locationExternalId)
            .eq("organization_id", organizationId)
            .limit(1);
        if (error || !locations || locations.length === 0)
            throw new Error(`Localização ${locationExternalId} não encontrada`);
    }
    async _validateVariantExists(variantExternalId, organizationId) {
        const { data: variants, error } = await this.supabase
            .from("tenant_business_entities")
            .select("id")
            .eq("entity_type", "variant")
            .eq("external_id", variantExternalId)
            .eq("organization_id", organizationId)
            .limit(1);
        if (error || !variants || variants.length === 0)
            throw new Error(`Variante ${variantExternalId} não encontrada`);
    }
    async _updateInventorySnapshot(organizationId, variantExternalId, locationExternalId, qtyChange, movementType, referenceId, existingStock) {
        const snapshotKey = `stock_${variantExternalId}_${locationExternalId}`;
        const stock = existingStock ||
            (await this._getInventorySnapshot(organizationId, variantExternalId, locationExternalId))?.snapshot_value ||
            {};
        stock.current_stock = (stock.current_stock || 0) + qtyChange;
        stock.last_movement = movementType;
        stock.last_movement_ref = referenceId;
        stock.last_updated = new Date().toISOString();
        await this.supabase.from("tenant_snapshots").upsert({
            organization_id: organizationId,
            snapshot_type: "INVENTORY",
            snapshot_key: snapshotKey,
            snapshot_value: stock,
            snapshot_date: new Date().toISOString().split("T")[0],
        }, { onConflict: "organization_id,snapshot_key" });
        await this._checkStockAlerts(organizationId, variantExternalId, locationExternalId, stock.current_stock);
    }
    async _checkStockAlerts(organizationId, variantExternalId, locationExternalId, currentStock) {
        if (currentStock < 10 && currentStock >= 0) {
            console.log(`[_checkStockAlerts] Alerta de estoque baixo para ${variantExternalId} no local ${locationExternalId}. Estoque: ${currentStock}`);
            const alertSnapshot = {
                variant_external_id: variantExternalId,
                location_external_id: locationExternalId,
                alert_type: "LOW_STOCK",
                current_stock: currentStock,
                threshold: 10,
                severity: currentStock === 0 ? "critical" : "warning",
                generated_at: new Date().toISOString(),
            };
            await this.supabase.from("tenant_snapshots").insert({
                organization_id: organizationId,
                snapshot_type: "STOCK_ALERT",
                snapshot_key: `alert_${variantExternalId}_${locationExternalId}_${Date.now()}`,
                snapshot_value: alertSnapshot,
                snapshot_date: new Date().toISOString().split("T")[0],
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            });
        }
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
}
exports.BanBanInventoryFlowService = BanBanInventoryFlowService;
//# sourceMappingURL=banban-inventory-flow-service.js.map