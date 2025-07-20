"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BanBanSalesFlowModule = void 0;
const banban_sales_flow_service_1 = require("./services/banban-sales-flow-service");
const banban_sales_flow_schemas_1 = require("./schemas/banban-sales-flow-schemas");
class BanBanSalesFlowModule {
    constructor() {
        this.name = 'banban-sales-flow';
        this.version = '2.0.0';
        this.description = 'Módulo de fluxo de vendas migrado das edge functions para BanBan Fashion';
        this.baseModule = 'flow-base';
        this.service = new banban_sales_flow_service_1.BanBanSalesFlowService();
    }
    async register(fastify, prefix) {
        fastify.addSchema(banban_sales_flow_schemas_1.banbanSalesFlowSchemas.saleEntity);
        fastify.addSchema(banban_sales_flow_schemas_1.banbanSalesFlowSchemas.returnEntity);
        fastify.addSchema(banban_sales_flow_schemas_1.banbanSalesFlowSchemas.salesFlowWebhook);
        fastify.addSchema(banban_sales_flow_schemas_1.banbanSalesFlowSchemas.salesFlowResponse);
        fastify.addSchema(banban_sales_flow_schemas_1.banbanSalesFlowSchemas.salesAnalytics);
        const secretToken = process.env.WEBHOOK_SECRET_TOKEN || 'banban_webhook_secret_2025';
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        };
        fastify.options('/api/modules/banban/sales-flow', async (request, reply) => {
            return reply.headers(corsHeaders).send();
        });
        fastify.options('/api/modules/banban/sales-flow/*', async (request, reply) => {
            return reply.headers(corsHeaders).send();
        });
        fastify.post('/api/modules/banban/sales-flow', {
            schema: {
                body: { $ref: 'banban-sales-flow-webhook#' },
                response: {
                    200: { $ref: 'banban-sales-flow-response#' },
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
                    case 'sale_completed':
                        result = await this.service.processSaleCompleted(payload.data, payload.organization_id);
                        break;
                    case 'sale_cancelled':
                        result = await this.service.processSaleCancelled(payload.data, payload.organization_id);
                        break;
                    case 'return_processed':
                        result = await this.service.processReturnProcessed(payload.data, payload.organization_id);
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
                console.debug('Sales flow processed successfully:', {
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
                            records_failed: result.summary.records_failed
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
                console.error('Sales flow processing error:', {
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
        fastify.get('/api/modules/banban/sales-flow', {
            schema: {
                querystring: {
                    type: 'object',
                    properties: {
                        org: { type: 'string', description: 'Organization ID (obrigatório)' },
                        sale_id: { type: 'string', description: 'ID da venda' },
                        customer_id: { type: 'string', description: 'ID do cliente' },
                        location_id: { type: 'string', description: 'ID da localização' },
                        status: { type: 'string', description: 'Status da venda' },
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
                                    sales: {
                                        type: 'array',
                                        items: { $ref: 'banban-sale-entity#' }
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
                const sales = await this.service.getSales(query.org, {
                    saleId: query.sale_id,
                    customerId: query.customer_id,
                    locationId: query.location_id,
                    status: query.status,
                    limit: query.limit
                });
                return reply.headers(corsHeaders).send({
                    success: true,
                    data: {
                        sales: sales,
                        total: sales?.length || 0
                    }
                });
            }
            catch (error) {
                console.error('Sales flow GET error:', error);
                return reply.headers(corsHeaders).code(500).send({
                    success: false,
                    error: 'Erro interno do servidor'
                });
            }
        });
        fastify.get('/api/modules/banban/sales-flow/analytics', {
            schema: {
                querystring: {
                    type: 'object',
                    properties: {
                        org: { type: 'string', description: 'Organization ID (obrigatório)' },
                        from: { type: 'string', format: 'date', description: 'Data início' },
                        to: { type: 'string', format: 'date', description: 'Data fim' },
                        customer_id: { type: 'string', description: 'ID do cliente' },
                        location_id: { type: 'string', description: 'ID da localização' }
                    },
                    required: ['org']
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            data: { $ref: 'banban-sales-analytics#' }
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
                const analytics = await this.service.getSalesAnalytics(query.org, {
                    dateFrom: query.from,
                    dateTo: query.to,
                    customerId: query.customer_id,
                    locationId: query.location_id
                });
                return reply.headers(corsHeaders).send({
                    success: true,
                    data: analytics
                });
            }
            catch (error) {
                console.error('Sales analytics error:', error);
                return reply.headers(corsHeaders).code(500).send({
                    success: false,
                    error: 'Erro ao obter analytics de vendas'
                });
            }
        });
        fastify.get('/api/modules/banban/sales-flow/health', {
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
                    'sale-processing',
                    'return-processing',
                    'customer-analytics',
                    'product-performance',
                    'location-metrics',
                    'sales-trends'
                ],
                events: [
                    'sale_completed',
                    'sale_cancelled',
                    'return_processed'
                ],
                timestamp: new Date().toISOString()
            });
        });
    }
    async handleRequest(request, reply) {
        return reply.send({
            message: 'BanBan Sales Flow Module is active',
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
                '/api/modules/banban/sales-flow',
                '/api/modules/banban/sales-flow/analytics',
                '/api/modules/banban/sales-flow/health'
            ],
            features: [
                'sale-processing',
                'return-processing',
                'customer-analytics',
                'product-performance',
                'location-metrics',
                'sales-trends'
            ],
            inheritsFrom: this.baseModule
        };
    }
    getEndpoints() {
        return this.getModuleInfo().endpoints;
    }
}
exports.BanBanSalesFlowModule = BanBanSalesFlowModule;
//# sourceMappingURL=index.js.map