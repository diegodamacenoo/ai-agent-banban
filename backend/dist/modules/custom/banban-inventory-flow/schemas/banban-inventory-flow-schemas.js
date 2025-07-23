"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.banbanInventoryFlowSchemas = void 0;
const enums_1 = require("../../../../shared/enums");
exports.banbanInventoryFlowSchemas = {
    inventoryEvent: {
        $id: 'banban-inventory-event',
        type: 'object',
        properties: {
            event_id: { type: 'string' },
            location_id: { type: 'string' },
            items: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        product_id: { type: 'string' },
                        quantity: { type: 'number' },
                        unit_cost: { type: 'number' },
                        reason: { type: 'string' },
                        notes: { type: 'string' }
                    },
                    required: ['product_id', 'quantity']
                }
            },
            event_date: { type: 'string', format: 'date-time' },
            event_type: {
                type: 'string',
                enum: ['inventory_adjustment', 'inventory_count', 'inventory_damage', 'inventory_expiry']
            },
            status: { type: 'string' },
            notes: { type: 'string' }
        },
        required: ['location_id', 'items', 'event_date', 'event_type', 'status']
    },
    inventoryFlowWebhook: {
        $id: 'banban-inventory-flow-webhook',
        type: 'object',
        properties: {
            action: {
                type: 'string',
                enum: ['inventory_adjustment', 'inventory_count', 'inventory_damage', 'inventory_expiry']
            },
            organization_id: { type: 'string' },
            attributes: { $ref: 'banban-inventory-event#' }
        },
        required: ['action', 'organization_id', 'attributes']
    },
    inventoryFlowResponse: {
        $id: 'banban-inventory-flow-response',
        type: 'object',
        properties: {
            success: { type: 'boolean', description: 'Indica se a ação foi executada com sucesso' },
            action: {
                type: 'string',
                enum: Object.values(enums_1.INVENTORY_ACTIONS),
                description: 'Ação ECA que foi executada'
            },
            transaction_id: {
                type: 'string',
                description: 'ID da transação criada/atualizada (se aplicável)'
            },
            entity_ids: {
                type: 'array',
                items: { type: 'string' },
                description: 'IDs das entidades criadas/atualizadas'
            },
            relationship_ids: {
                type: 'array',
                items: { type: 'string' },
                description: 'IDs dos relacionamentos criados'
            },
            state_transition: {
                type: 'object',
                description: 'Transição de estado executada (se aplicável)',
                properties: {
                    from: { type: 'string' },
                    to: { type: 'string' }
                }
            },
            attributes: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    entityType: { type: 'string' },
                    entityId: { type: 'string' },
                    summary: {
                        type: 'object',
                        properties: {
                            message: { type: 'string' },
                            records_processed: { type: 'integer' },
                            records_successful: { type: 'integer' },
                            records_failed: { type: 'integer' },
                            inventory_transactions: { type: 'integer' }
                        }
                    }
                }
            },
            metadata: {
                type: 'object',
                properties: {
                    processed_at: { type: 'string', format: 'date-time' },
                    processing_time_ms: { type: 'integer' },
                    records_processed: { type: 'integer' },
                    records_successful: { type: 'integer' },
                    records_failed: { type: 'integer' },
                    success_rate: { type: 'string' }
                }
            },
            error: {
                type: 'object',
                properties: {
                    code: { type: 'string' },
                    message: { type: 'string' },
                    details: { type: 'object' }
                }
            }
        }
    },
    inventoryAnalytics: {
        $id: 'banban-inventory-analytics',
        type: 'object',
        properties: {
            summary: {
                type: 'object',
                properties: {
                    total_events: { type: 'integer' },
                    total_products: { type: 'integer' },
                    total_locations: { type: 'integer' },
                    total_adjustments: { type: 'integer' },
                    total_value_adjusted: { type: 'number' }
                }
            },
            inventory_turnover: {
                type: 'object',
                properties: {
                    average_turnover_days: { type: 'number' },
                    fast_moving_products: { type: 'integer' },
                    slow_moving_products: { type: 'integer' },
                    obsolete_products: { type: 'integer' }
                }
            },
            location_metrics: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        location_id: { type: 'string' },
                        location_name: { type: 'string' },
                        total_events: { type: 'integer' },
                        total_value: { type: 'number' },
                        accuracy_score: { type: 'number' }
                    }
                }
            },
            event_trends: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        date: { type: 'string', format: 'date' },
                        adjustments: { type: 'integer' },
                        counts: { type: 'integer' },
                        damages: { type: 'integer' },
                        expiries: { type: 'integer' },
                        total_value: { type: 'number' }
                    }
                }
            },
            product_analysis: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        product_id: { type: 'string' },
                        product_name: { type: 'string' },
                        total_adjustments: { type: 'integer' },
                        net_quantity_change: { type: 'number' },
                        value_impact: { type: 'number' },
                        accuracy_issues: { type: 'integer' }
                    }
                }
            }
        }
    }
};
//# sourceMappingURL=banban-inventory-flow-schemas.js.map