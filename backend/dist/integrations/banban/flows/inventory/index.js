"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BanBanInventoryFlowModule = void 0;
const banban_inventory_flow_service_1 = require("./services/banban-inventory-flow-service");
const banban_inventory_flow_schemas_1 = require("./schemas/banban-inventory-flow-schemas");
class BanBanInventoryFlowModule {
    constructor() {
        this.name = 'banban-inventory-flow';
        this.version = '2.0.0';
        this.description = 'Módulo de fluxo de inventário migrado das edge functions para BanBan Fashion';
        this.baseModule = 'inventory-base';
        this.service = new banban_inventory_flow_service_1.BanBanInventoryFlowService();
    }
    async register(fastify, prefix) {
        fastify.addSchema(banban_inventory_flow_schemas_1.banbanInventoryFlowSchemas.inventoryEvent);
        fastify.addSchema(banban_inventory_flow_schemas_1.banbanInventoryFlowSchemas.inventoryFlowWebhook);
        fastify.addSchema(banban_inventory_flow_schemas_1.banbanInventoryFlowSchemas.inventoryFlowResponse);
        fastify.addSchema(banban_inventory_flow_schemas_1.banbanInventoryFlowSchemas.inventoryAnalytics);
        const secretToken = process.env.WEBHOOK_SECRET_TOKEN || 'banban_webhook_secret_2025';
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        };
        fastify.options('/api/modules/banban/inventory-flow', async (request, reply) => {
            return reply.headers(corsHeaders).send();
        });
        fastify.options('/api/modules/banban/inventory-flow/*', async (request, reply) => {
            return reply.headers(corsHeaders).send();
        });
        fastify.post('/api/modules/banban/inventory-flow', {
            schema: {
                body: { $ref: 'banban-inventory-flow-webhook#' },
                response: {
                    200: { $ref: 'banban-inventory-flow-response#' },
                    400: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            error: {
                                type: 'object',
                                properties: {
                                    type: { type: 'string' },
                                    message: { type: 'string' },
                                    timestamp: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        }, async (request, reply) => {
            const startTime = Date.now();
            try {
                const payload = request.body;
                if (!payload.event_type || !payload.organization_id || !payload.data) {
                    return reply.headers(corsHeaders).code(400).send({
                        success: false,
                        action: payload.event_type || 'UNKNOWN',
                        attributes: {
                            success: false,
                            summary: {
                                message: 'event_type, organization_id e data são obrigatórios'
                            }
                        },
                        metadata: {
                            processed_at: new Date().toISOString(),
                            processing_time_ms: Date.now() - startTime,
                            organization_id: payload.organization_id || 'UNKNOWN',
                            action: payload.event_type || 'UNKNOWN',
                            event_uuid: eventUuid || 'UNKNOWN'
                        },
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: 'event_type, organization_id e data são obrigatórios',
                            details: {
                                timestamp: new Date().toISOString()
                            }
                        }
                    });
                }
                let result;
                const eventUuid = crypto.randomUUID();
                switch (payload.event_type) {
                    case 'inventory_adjustment':
                        result = await this.service.processInventoryAdjustment(payload.data, payload.organization_id);
                        break;
                    case 'inventory_count':
                        result = await this.service.processInventoryCount(payload.data, payload.organization_id);
                        break;
                    case 'inventory_damage':
                        result = await this.service.processInventoryDamage(payload.data, payload.organization_id);
                        break;
                    case 'inventory_expiry':
                        result = await this.service.processInventoryExpiry(payload.data, payload.organization_id);
                        break;
                    default:
                        return reply.headers(corsHeaders).code(400).send({
                            success: false,
                            action: payload.event_type,
                            attributes: {
                                success: false,
                                summary: {
                                    message: `Tipo de evento não suportado: ${payload.event_type}`
                                }
                            },
                            metadata: {
                                processed_at: new Date().toISOString(),
                                processing_time_ms: Date.now() - startTime,
                                organization_id: payload.organization_id,
                                action: payload.event_type,
                                event_uuid: eventUuid
                            },
                            error: {
                                code: 'UNSUPPORTED_EVENT',
                                message: `Tipo de evento não suportado: ${payload.event_type}`,
                                details: {
                                    timestamp: new Date().toISOString()
                                }
                            }
                        });
                }
                const processingTime = Date.now() - startTime;
                console.debug('Inventory flow processed successfully:', {
                    event_type: payload.event_type,
                    organization_id: payload.organization_id,
                    entity_id: result.entityId,
                    processing_time_ms: processingTime
                });
                return reply.headers(corsHeaders).send({
                    success: true,
                    action: payload.event_type,
                    transaction_id: result.transactionId || undefined,
                    entity_ids: result.entityIds || [],
                    relationship_ids: result.relationshipIds || [],
                    state_transition: result.stateTransition || undefined,
                    attributes: {
                        success: result.success,
                        entityType: result.entityType,
                        entityId: result.entityId,
                        summary: {
                            message: result.summary.message,
                            records_processed: result.summary.records_processed,
                            records_successful: result.summary.records_successful,
                            records_failed: result.summary.records_failed,
                            inventory_transactions: result.summary.inventory_transactions
                        }
                    },
                    metadata: {
                        processed_at: new Date().toISOString(),
                        processing_time_ms: processingTime,
                        organization_id: payload.organization_id,
                        action: payload.event_type,
                        event_uuid: eventUuid
                    }
                });
            }
            catch (error) {
                const processingTime = Date.now() - startTime;
                console.error('Inventory flow processing error:', {
                    error: error.message,
                    processing_time_ms: processingTime
                });
                return reply.headers(corsHeaders).code(500).send({
                    success: false,
                    action: payload.event_type,
                    attributes: {
                        success: false,
                        summary: {
                            message: error.message
                        }
                    },
                    metadata: {
                        processed_at: new Date().toISOString(),
                        processing_time_ms: processingTime,
                        organization_id: payload.organization_id,
                        action: payload.event_type,
                        event_uuid: eventUuid
                    },
                    error: {
                        code: 'PROCESSING_ERROR',
                        message: error.message,
                        details: {
                            timestamp: new Date().toISOString()
                        }
                    }
                });
            }
        });
        fastify.get('/api/modules/banban/inventory-flow', {
            schema: {
                querystring: {
                    type: 'object',
                    properties: {
                        org: { type: 'string', description: 'Organization ID (obrigatório)' },
                        event_id: { type: 'string', description: 'ID do evento' },
                        location_id: { type: 'string', description: 'ID da localização' },
                        event_type: {
                            type: 'string',
                            enum: ['inventory_adjustment', 'inventory_count', 'inventory_damage', 'inventory_expiry'],
                            description: 'Tipo do evento'
                        },
                        date_from: { type: 'string', format: 'date', description: 'Data início' },
                        date_to: { type: 'string', format: 'date', description: 'Data fim' },
                        limit: { type: 'integer', minimum: 1, maximum: 1000, default: 100 }
                    },
                    required: ['org']
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            data: {
                                type: 'object',
                                properties: {
                                    events: {
                                        type: 'array',
                                        items: { $ref: 'banban-inventory-event#' }
                                    },
                                    total: { type: 'integer' }
                                }
                            }
                        }
                    }
                }
            }
        }, async (request, reply) => {
            try {
                const query = request.query;
                if (!query.org) {
                    return reply.headers(corsHeaders).code(400).send({
                        success: false,
                        error: 'organization_id (org) é obrigatório'
                    });
                }
                const events = await this.service.getInventoryEvents(query.org, {
                    eventId: query.event_id,
                    locationId: query.location_id,
                    eventType: query.event_type,
                    dateFrom: query.date_from,
                    dateTo: query.date_to,
                    limit: query.limit
                });
                return reply.headers(corsHeaders).send({
                    success: true,
                    data: {
                        events: events,
                        total: events?.length || 0
                    }
                });
            }
            catch (error) {
                console.error('Inventory flow GET error:', error);
                return reply.headers(corsHeaders).code(500).send({
                    success: false,
                    error: 'Erro interno do servidor'
                });
            }
        });
        fastify.get('/api/modules/banban/inventory-flow/analytics', {
            schema: {
                querystring: {
                    type: 'object',
                    properties: {
                        org: { type: 'string', description: 'Organization ID (obrigatório)' },
                        from: { type: 'string', format: 'date', description: 'Data início' },
                        to: { type: 'string', format: 'date', description: 'Data fim' },
                        location_id: { type: 'string', description: 'ID da localização' },
                        product_id: { type: 'string', description: 'ID do produto' }
                    },
                    required: ['org']
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            data: { $ref: 'banban-inventory-analytics#' }
                        }
                    }
                }
            }
        }, async (request, reply) => {
            try {
                const query = request.query;
                if (!query.org) {
                    return reply.headers(corsHeaders).code(400).send({
                        success: false,
                        error: 'organization_id (org) é obrigatório'
                    });
                }
                const analytics = await this.service.getInventoryAnalytics(query.org, {
                    dateFrom: query.from,
                    dateTo: query.to,
                    locationId: query.location_id,
                    productId: query.product_id
                });
                return reply.headers(corsHeaders).send({
                    success: true,
                    data: analytics
                });
            }
            catch (error) {
                console.error('Inventory analytics error:', error);
                return reply.headers(corsHeaders).code(500).send({
                    success: false,
                    error: 'Erro ao obter analytics de inventário'
                });
            }
        });
        fastify.get('/api/modules/banban/inventory-flow/health', {
            schema: {
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            module: { type: 'string' },
                            status: { type: 'string' },
                            version: { type: 'string' },
                            baseModule: { type: 'string' },
                            features: {
                                type: 'array',
                                items: { type: 'string' }
                            },
                            events: {
                                type: 'array',
                                items: { type: 'string' }
                            },
                            timestamp: { type: 'string' }
                        }
                    }
                }
            }
        }, async (request, reply) => {
            return reply.headers(corsHeaders).send({
                module: this.name,
                status: 'healthy',
                version: this.version,
                baseModule: this.baseModule,
                features: [
                    'inventory-adjustment-processing',
                    'inventory-count-processing',
                    'damage-tracking',
                    'expiry-management',
                    'inventory-analytics',
                    'turnover-analysis',
                    'location-metrics'
                ],
                events: [
                    'inventory_adjustment',
                    'inventory_count',
                    'inventory_damage',
                    'inventory_expiry'
                ],
                timestamp: new Date().toISOString()
            });
        });
    }
    async handleRequest(request, reply) {
        return reply.send({
            message: 'BanBan Inventory Flow Module is active',
            version: this.version,
            timestamp: new Date().toISOString()
        });
    }
    getModuleInfo() {
        return {
            name: this.name,
            type: 'custom',
            version: this.version,
            description: this.description,
            endpoints: [
                '/api/modules/banban/inventory-flow',
                '/api/modules/banban/inventory-flow/analytics',
                '/api/modules/banban/inventory-flow/health'
            ],
            features: [
                'inventory-adjustment-processing',
                'inventory-count-processing',
                'damage-tracking',
                'expiry-management',
                'inventory-analytics',
                'turnover-analysis',
                'location-metrics'
            ],
            inheritsFrom: this.baseModule
        };
    }
    getEndpoints() {
        return this.getModuleInfo().endpoints;
    }
}
exports.BanBanInventoryFlowModule = BanBanInventoryFlowModule;
//# sourceMappingURL=index.js.map