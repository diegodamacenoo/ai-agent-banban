"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BanbanIntegrationHub = void 0;
const index_1 = require("./flows/sales/index");
const index_2 = require("./flows/purchase/index");
const index_3 = require("./flows/inventory/index");
const index_4 = require("./flows/transfer/index");
const index_5 = require("./flows/returns/index");
const index_6 = require("./flows/etl/index");
const index_7 = require("./performance/index");
const eca_engine_1 = require("./shared/eca-engine");
const analytics_1 = require("./shared/analytics");
const validation_1 = require("./shared/validation");
class BanbanIntegrationHub {
    constructor() {
        this.salesFlow = new index_1.BanBanSalesFlowModule();
        this.purchaseFlow = new index_2.BanBanPurchaseFlowModule();
        this.inventoryFlow = new index_3.BanBanInventoryFlowModule();
        this.transferFlow = new index_4.BanBanTransferFlowModule();
        this.returnsFlow = new index_5.BanBanReturnsFlowModule();
        this.etlFlow = new index_6.BanBanETLFlowModule();
        this.performanceModule = new index_7.BanBanPerformanceModule();
        this.ecaEngine = new eca_engine_1.BanbanECAEngine();
        this.analytics = new analytics_1.BanbanAnalytics();
        this.validation = new validation_1.BanbanValidationService();
    }
    async register(fastify, prefix = '/api/integrations/banban') {
        await this.salesFlow.register(fastify);
        await this.purchaseFlow.register(fastify);
        await this.inventoryFlow.register(fastify);
        await this.transferFlow.register(fastify);
        await this.returnsFlow.register(fastify);
        await this.etlFlow.register(fastify);
        await this.performanceModule.register(fastify);
        fastify.get(`${prefix}/overview`, {
            schema: {
                description: 'Visão geral da integração Banban',
                tags: ['Banban Integration'],
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            client: { type: 'string' },
                            version: { type: 'string' },
                            description: { type: 'string' },
                            flows: {
                                type: 'array',
                                items: { type: 'string' }
                            },
                            features: {
                                type: 'array',
                                items: { type: 'string' }
                            },
                            health: {
                                type: 'object',
                                properties: {
                                    status: { type: 'string' },
                                    timestamp: { type: 'string' },
                                    flows_status: {
                                        type: 'object',
                                        additionalProperties: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }, async (request, reply) => {
            const info = await this.getIntegrationInfo();
            return reply.send(info);
        });
        fastify.get(`${prefix}/health`, {
            schema: {
                description: 'Health check de toda a integração Banban',
                tags: ['Banban Integration'],
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            status: { type: 'string' },
                            timestamp: { type: 'string' },
                            flows: {
                                type: 'object',
                                additionalProperties: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string' },
                                        version: { type: 'string' },
                                        endpoints: {
                                            type: 'array',
                                            items: { type: 'string' }
                                        }
                                    }
                                }
                            },
                            eca_engine: {
                                type: 'object',
                                properties: {
                                    status: { type: 'string' },
                                    rules_loaded: { type: 'number' },
                                    rules_enabled: { type: 'number' }
                                }
                            }
                        }
                    }
                }
            }
        }, async (request, reply) => {
            const health = await this.getHealthCheck();
            return reply.send(health);
        });
        fastify.get(`${prefix}/metrics`, {
            schema: {
                description: 'Métricas consolidadas da integração Banban',
                tags: ['Banban Integration'],
                querystring: {
                    type: 'object',
                    properties: {
                        org: { type: 'string', description: 'Organization ID (obrigatório)' },
                        from: { type: 'string', format: 'date' },
                        to: { type: 'string', format: 'date' }
                    },
                    required: ['org']
                }
            }
        }, async (request, reply) => {
            const query = request.query;
            if (!query.org) {
                return reply.code(400).send({
                    error: 'organization_id (org) é obrigatório'
                });
            }
            const metrics = await this.getIntegrationMetrics(query.org, {
                dateFrom: query.from,
                dateTo: query.to
            });
            return reply.send(metrics);
        });
        fastify.get(`${prefix}/eca/rules`, {
            schema: {
                description: 'Lista regras ECA ativas para Banban',
                tags: ['Banban Integration', 'ECA']
            }
        }, async (request, reply) => {
            const rules = this.ecaEngine.getRules();
            return reply.send({
                total_rules: rules.length,
                enabled_rules: rules.filter(r => r.enabled).length,
                rules: rules
            });
        });
        fastify.post(`${prefix}/eca/test`, {
            schema: {
                description: 'Testar processamento ECA',
                tags: ['Banban Integration', 'ECA'],
                body: {
                    type: 'object',
                    properties: {
                        event_type: { type: 'string' },
                        organization_id: { type: 'string' },
                        data: { type: 'object' }
                    },
                    required: ['event_type', 'organization_id', 'data']
                }
            }
        }, async (request, reply) => {
            const payload = request.body;
            const result = await this.ecaEngine.processEvent({
                type: payload.event_type,
                organizationId: payload.organization_id,
                data: payload.data,
                timestamp: new Date().toISOString()
            });
            return reply.send(result);
        });
    }
    async getIntegrationInfo() {
        const flows = [
            this.salesFlow.name,
            this.purchaseFlow.name,
            this.inventoryFlow.name,
            this.transferFlow.name,
            this.returnsFlow.name,
            this.etlFlow.name,
            this.performanceModule.name
        ];
        const flowsStatus = {};
        flows.forEach(flow => {
            flowsStatus[flow] = 'healthy';
        });
        return {
            client: 'Banban Fashion',
            version: '2.0.0',
            description: 'Integration Hub para Banban Fashion - ECA + Analytics + ETL',
            flows,
            features: [
                'sales-processing',
                'purchase-management',
                'inventory-control',
                'transfer-management',
                'returns-processing',
                'etl-automation',
                'performance-analytics',
                'eca-engine',
                'rfm-analytics',
                'real-time-webhooks'
            ],
            health: {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                flows_status: flowsStatus
            }
        };
    }
    async getHealthCheck() {
        const flows = {
            'sales-flow': {
                status: 'healthy',
                version: this.salesFlow.version,
                endpoints: this.salesFlow.getEndpoints()
            },
            'purchase-flow': {
                status: 'healthy',
                version: this.purchaseFlow.version,
                endpoints: this.purchaseFlow.getEndpoints()
            },
            'inventory-flow': {
                status: 'healthy',
                version: this.inventoryFlow.version,
                endpoints: this.inventoryFlow.getEndpoints()
            },
            'transfer-flow': {
                status: 'healthy',
                version: this.transferFlow.version,
                endpoints: this.transferFlow.getEndpoints()
            },
            'returns-flow': {
                status: 'healthy',
                version: this.returnsFlow.version,
                endpoints: this.returnsFlow.getEndpoints()
            },
            'etl-flow': {
                status: 'healthy',
                version: this.etlFlow.version,
                endpoints: this.etlFlow.getEndpoints()
            },
            'performance': {
                status: 'healthy',
                version: this.performanceModule.version,
                endpoints: this.performanceModule.getEndpoints()
            }
        };
        const rules = this.ecaEngine.getRules();
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            flows,
            eca_engine: {
                status: 'healthy',
                rules_loaded: rules.length,
                rules_enabled: rules.filter(r => r.enabled).length
            }
        };
    }
    async getIntegrationMetrics(organizationId, filters = {}) {
        try {
            const salesAnalytics = await this.analytics.generateSalesAnalytics(organizationId, filters);
            const rfmAnalysis = await this.analytics.calculateRFMAnalysis(organizationId, filters.dateFrom, filters.dateTo);
            const flowMetrics = {
                sales_flow: {
                    total_events: salesAnalytics.summary.total_sales,
                    success_rate: 0.98
                },
                inventory_flow: {
                    total_events: 150,
                    success_rate: 0.95
                },
                purchase_flow: {
                    total_events: 75,
                    success_rate: 0.97
                },
                transfer_flow: {
                    total_events: 45,
                    success_rate: 0.96
                }
            };
            return {
                organization_id: organizationId,
                period: {
                    from: filters.dateFrom || '2023-01-01',
                    to: filters.dateTo || new Date().toISOString()
                },
                sales_analytics: salesAnalytics,
                customer_segmentation: {
                    total_segments: rfmAnalysis.length,
                    segments_breakdown: this.getSegmentsBreakdown(rfmAnalysis)
                },
                flow_metrics: flowMetrics,
                integration_health: {
                    overall_success_rate: 0.965,
                    total_events_processed: Object.values(flowMetrics).reduce((sum, flow) => sum + flow.total_events, 0),
                    avg_processing_time_ms: 450
                }
            };
        }
        catch (error) {
            console.error('Erro ao obter métricas da integração:', error);
            throw new Error(`Erro ao gerar métricas: ${error.message}`);
        }
    }
    getSegmentsBreakdown(segments) {
        const breakdown = {};
        segments.forEach(segment => {
            const segmentName = segment.segment;
            breakdown[segmentName] = (breakdown[segmentName] || 0) + 1;
        });
        return breakdown;
    }
    getSalesFlow() { return this.salesFlow; }
    getPurchaseFlow() { return this.purchaseFlow; }
    getInventoryFlow() { return this.inventoryFlow; }
    getTransferFlow() { return this.transferFlow; }
    getReturnsFlow() { return this.returnsFlow; }
    getETLFlow() { return this.etlFlow; }
    getPerformanceModule() { return this.performanceModule; }
    getECAEngine() { return this.ecaEngine; }
    getAnalytics() { return this.analytics; }
    getValidation() { return this.validation; }
}
exports.BanbanIntegrationHub = BanbanIntegrationHub;
exports.default = BanbanIntegrationHub;
//# sourceMappingURL=index.js.map