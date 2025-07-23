"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceBaseModule = void 0;
const performance_service_1 = require("./services/performance-service");
const performance_schemas_1 = require("./schemas/performance-schemas");
class PerformanceBaseModule {
    constructor(config) {
        this.name = 'performance-base';
        this.version = '1.0.0';
        this.description = 'Módulo base de performance para métricas e analytics';
        this.config = {
            enableCaching: true,
            cacheTimeout: 300,
            enableRealTimeMetrics: true,
            ...config
        };
        this.service = new performance_service_1.PerformanceService(this.config);
    }
    async register(server, prefix = '/api/performance') {
        server.addSchema(performance_schemas_1.PerformanceSchemas.businessMetricsResponse);
        server.addSchema(performance_schemas_1.PerformanceSchemas.summaryResponse);
        server.addSchema(performance_schemas_1.PerformanceSchemas.calculateRequest);
        await server.register(async (server) => {
            server.get('/business-metrics', {
                schema: {
                    description: 'Obter métricas de negócio fundamentais',
                    tags: ['performance', 'base'],
                    querystring: {
                        type: 'object',
                        properties: {
                            period: { type: 'string', enum: ['daily', 'weekly', 'monthly'], default: 'monthly' },
                            startDate: { type: 'string', format: 'date' },
                            endDate: { type: 'string', format: 'date' }
                        }
                    },
                    response: {
                        200: { $ref: 'businessMetricsResponse#' }
                    }
                }
            }, this.getBusinessMetrics.bind(this));
            server.get('/summary', {
                schema: {
                    description: 'Obter resumo geral de performance',
                    tags: ['performance', 'base'],
                    response: {
                        200: { $ref: 'summaryResponse#' }
                    }
                }
            }, this.getSummary.bind(this));
            server.post('/calculate', {
                schema: {
                    description: 'Calcular métricas customizadas',
                    tags: ['performance', 'base'],
                    body: { $ref: 'calculateRequest#' },
                    response: {
                        200: {
                            type: 'object',
                            properties: {
                                success: { type: 'boolean' },
                                result: { type: 'object' },
                                calculatedAt: { type: 'string', format: 'date-time' }
                            }
                        }
                    }
                }
            }, this.calculateMetrics.bind(this));
            server.get('/health', {
                schema: {
                    description: 'Verificar saúde do módulo performance',
                    tags: ['performance', 'base'],
                    response: {
                        200: {
                            type: 'object',
                            properties: {
                                status: { type: 'string' },
                                module: { type: 'string' },
                                version: { type: 'string' },
                                features: { type: 'array', items: { type: 'string' } }
                            }
                        }
                    }
                }
            }, this.getHealth.bind(this));
        }, { prefix });
    }
    async handleRequest(request, reply) {
        const { url, method } = request;
        const tenant = request.tenant;
        request.log.info('PerformanceBase: Handling request', {
            url,
            method,
            tenantId: tenant?.id,
            module: 'performance-base'
        });
        return {
            module: 'performance-base',
            version: '1.0.0',
            tenant: tenant?.id || 'unknown',
            timestamp: new Date().toISOString()
        };
    }
    async getBusinessMetrics(request, reply) {
        const { period = 'monthly', startDate, endDate } = request.query;
        const tenant = request.tenant;
        try {
            const metrics = await this.service.getBusinessMetrics({
                organizationId: tenant?.organizationId || 'default',
                period,
                startDate,
                endDate,
                tenantId: tenant?.id
            });
            return {
                success: true,
                data: metrics,
                period,
                generatedAt: new Date().toISOString(),
                module: 'performance-base'
            };
        }
        catch (error) {
            request.log.error('Error getting business metrics', error);
            return reply.code(500).send({
                error: 'Internal Server Error',
                message: 'Failed to get business metrics'
            });
        }
    }
    async getSummary(request, reply) {
        const tenant = request.tenant;
        try {
            const summary = await this.service.getSummary(tenant?.id);
            return {
                success: true,
                data: summary,
                generatedAt: new Date().toISOString(),
                module: 'performance-base'
            };
        }
        catch (error) {
            request.log.error('Error getting summary', error);
            return reply.code(500).send({
                error: 'Internal Server Error',
                message: 'Failed to get performance summary'
            });
        }
    }
    async calculateMetrics(request, reply) {
        const { metrics, parameters } = request.body;
        const tenant = request.tenant;
        try {
            const result = await this.service.calculateCustomMetrics({
                organizationId: tenant?.organizationId || 'default',
                metricType: 'custom',
                metrics,
                parameters,
                tenantId: tenant?.id
            });
            return {
                success: true,
                result,
                calculatedAt: new Date().toISOString(),
                module: 'performance-base'
            };
        }
        catch (error) {
            request.log.error('Error calculating metrics', error);
            return reply.code(500).send({
                error: 'Internal Server Error',
                message: 'Failed to calculate metrics'
            });
        }
    }
    async getHealth(request, reply) {
        return {
            status: 'healthy',
            module: 'performance-base',
            version: '1.0.0',
            features: [
                'basic_analytics',
                'standard_reports',
                'kpi_tracking',
                'business_metrics',
                'summary_generation',
                'custom_calculations'
            ]
        };
    }
    getModuleInfo() {
        return {
            name: 'performance-base',
            type: 'base',
            version: '1.0.0',
            description: 'Módulo base de performance com métricas fundamentais',
            endpoints: [
                'business-metrics',
                'summary',
                'calculate',
                'health'
            ],
            features: [
                'basic_analytics',
                'standard_reports',
                'kpi_tracking'
            ]
        };
    }
    getEndpoints() {
        return [
            '/api/performance/business-metrics',
            '/api/performance/summary',
            '/api/performance/calculate',
            '/api/performance/health'
        ];
    }
}
exports.PerformanceBaseModule = PerformanceBaseModule;
//# sourceMappingURL=index.js.map