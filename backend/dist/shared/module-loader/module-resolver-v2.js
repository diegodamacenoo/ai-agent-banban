"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleResolverV2 = void 0;
const logger_1 = require("../../utils/logger");
const banban_1 = __importDefault(require("../../integrations/banban"));
class ModuleResolverV2 {
    constructor() {
        this.integrationCache = new Map();
        this.banbanHub = new banban_1.default();
        logger_1.logger.info('ModuleResolver v2 initialized - Integration Hub mode');
    }
    async getIntegrationHubForTenant(tenantId) {
        try {
            if (this.integrationCache.has(tenantId)) {
                logger_1.logger.debug(`Using cached integration hub for tenant: ${tenantId}`);
                return this.integrationCache.get(tenantId);
            }
            logger_1.logger.debug(`Resolving integration hub for tenant: ${tenantId}`);
            let integrationHub = null;
            if (tenantId === 'banban-org-id') {
                integrationHub = this.banbanHub;
                logger_1.logger.info('Loaded Banban Integration Hub - 6 flows operational');
            }
            else {
                logger_1.logger.warn(`No integration hub configured for tenant: ${tenantId}`);
                integrationHub = {
                    type: 'generic',
                    capabilities: ['webhook_receiver', 'rest_api', 'health_check'],
                    flows: [],
                    message: 'Generic integration hub - configure specific connectors as needed'
                };
            }
            this.integrationCache.set(tenantId, integrationHub);
            return integrationHub;
        }
        catch (error) {
            logger_1.logger.error(`Failed to resolve integration hub for tenant ${tenantId}:`, error);
            console.error('Detailed error:', error);
            return null;
        }
    }
    async registerIntegrationHubs(fastify) {
        try {
            logger_1.logger.info('🔗 Registering Integration Hubs...');
            await this.banbanHub.register(fastify);
            fastify.get('/api/integrations/health', async (request, reply) => {
                const healthStatus = {
                    status: 'operational',
                    integration_hubs: {
                        banban: 'operational',
                    },
                    active_flows: {
                        banban: [
                            'sales-flow',
                            'purchase-flow',
                            'inventory-flow',
                            'transfer-flow',
                            'performance-analytics',
                            'etl-processing'
                        ]
                    },
                    capabilities: {
                        webhook_processing: true,
                        real_time_analytics: true,
                        etl_pipelines: true,
                        multi_protocol_support: true
                    },
                    last_health_check: new Date().toISOString()
                };
                return reply.send(healthStatus);
            });
            fastify.get('/api/integrations', async (request, reply) => {
                return reply.send({
                    architecture: 'Integration Hub',
                    description: 'Backend especializado em integrações externas e ETL',
                    active_integrations: {
                        banban: {
                            type: 'ERP Integration',
                            flows: 6,
                            status: 'operational',
                            features: ['Real-time webhooks', 'RFM Analytics', 'ETL Automation']
                        }
                    },
                    planned_integrations: {
                        riachuelo: {
                            type: 'Database Integration',
                            status: 'planned',
                            features: ['Direct DB connectors', 'Batch processing']
                        },
                        ca: {
                            type: 'API Integration',
                            status: 'planned',
                            features: ['REST APIs', 'GraphQL', 'Rate limiting']
                        }
                    },
                    documentation: '/docs/integrations',
                    last_updated: new Date().toISOString()
                });
            });
            logger_1.logger.info('✅ All Integration Hubs registered successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to register integration hubs:', error);
            throw error;
        }
    }
    async resolveModulesForTenant(tenantId) {
        logger_1.logger.warn('⚠️ DEPRECATED: resolveModulesForTenant() - Use Integration Hub instead');
        logger_1.logger.warn('⚠️ Frontend should use Server Actions + Database resolver');
        return {};
    }
    clearCache(tenantId) {
        if (tenantId) {
            this.integrationCache.delete(tenantId);
            logger_1.logger.debug(`Integration cache cleared for tenant: ${tenantId}`);
        }
        else {
            this.integrationCache.clear();
            logger_1.logger.debug('All integration cache cleared');
        }
    }
    getAvailableIntegrationTemplates() {
        return {
            erp_webhook: {
                name: 'ERP Webhook Integration',
                description: 'Real-time webhook processing for ERP systems',
                template_based_on: 'banban',
                flows: ['sales', 'purchase', 'inventory', 'transfers'],
                features: ['ECA Engine', 'Analytics', 'ETL'],
                estimated_setup_time: '2-3 weeks'
            },
            database_connector: {
                name: 'Database Connector',
                description: 'Direct database integration for legacy systems',
                template_based_on: 'generic',
                flows: ['data_sync', 'batch_processing'],
                features: ['Connection pooling', 'Query optimization', 'Monitoring'],
                estimated_setup_time: '1-2 weeks'
            },
            api_gateway: {
                name: 'API Gateway Integration',
                description: 'REST/GraphQL API integration',
                template_based_on: 'generic',
                flows: ['api_proxy', 'rate_limiting', 'authentication'],
                features: ['Multi-protocol', 'Circuit breakers', 'Caching'],
                estimated_setup_time: '1 week'
            }
        };
    }
}
exports.ModuleResolverV2 = ModuleResolverV2;
//# sourceMappingURL=module-resolver-v2.js.map