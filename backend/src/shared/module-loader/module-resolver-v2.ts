/**
 * ModuleResolver v2 - Sistema unificado usando Integration Hub
 * 
 * Nova arquitetura:
 * - Frontend: Dynamic resolution via Database
 * - Backend: Integration Hub para conectores externos
 */

import { logger } from '../../utils/logger';
import { ModuleInfo, TenantModule } from '../types/module-types';

// Import Integration Hubs
import BanbanIntegrationHub from '../../integrations/banban';

export class ModuleResolverV2 {
  private integrationCache = new Map<string, any>();
  private banbanHub: BanbanIntegrationHub;
  
  constructor() {
    this.banbanHub = new BanbanIntegrationHub();
    logger.info('ModuleResolver v2 initialized - Integration Hub mode');
  }

  /**
   * Get Integration Hub for a tenant
   * Backend agora foca em integrações, não em replicar lógica do frontend
   */
  async getIntegrationHubForTenant(tenantId: string): Promise<any> {
    try {
      // Verificar cache primeiro
      if (this.integrationCache.has(tenantId)) {
        logger.debug(`Using cached integration hub for tenant: ${tenantId}`);
        return this.integrationCache.get(tenantId);
      }

      logger.debug(`Resolving integration hub for tenant: ${tenantId}`);

      let integrationHub = null;

      if (tenantId === 'banban-org-id') {
        // Banban Integration Hub - ERP + Analytics
        integrationHub = this.banbanHub;
        logger.info('Loaded Banban Integration Hub - 6 flows operational');
      } else {
        // Para outros clientes, futuramente teremos:
        // - RiachuElo Integration Hub (Database connectors)
        // - CA Integration Hub (API connectors)
        logger.warn(`No integration hub configured for tenant: ${tenantId}`);
        
        // Return generic integration capabilities
        integrationHub = {
          type: 'generic',
          capabilities: ['webhook_receiver', 'rest_api', 'health_check'],
          flows: [],
          message: 'Generic integration hub - configure specific connectors as needed'
        };
      }

      // Cache do integration hub
      this.integrationCache.set(tenantId, integrationHub);
      
      return integrationHub;

    } catch (error) {
      logger.error(`Failed to resolve integration hub for tenant ${tenantId}:`, error);
      console.error('Detailed error:', error);
      return null;
    }
  }

  /**
   * Register all integration hubs with Fastify
   */
  async registerIntegrationHubs(fastify: any): Promise<void> {
    try {
      logger.info('🔗 Registering Integration Hubs...');

      // Register Banban Integration Hub
      await this.banbanHub.register(fastify);
      
      // Register global integration health check
      fastify.get('/api/integrations/health', async (request: any, reply: any) => {
        const healthStatus = {
          status: 'operational',
          integration_hubs: {
            banban: 'operational',
            // riachuelo: 'planned',
            // ca: 'planned'
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

      // Register integration overview
      fastify.get('/api/integrations', async (request: any, reply: any) => {
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

      logger.info('✅ All Integration Hubs registered successfully');

    } catch (error) {
      logger.error('Failed to register integration hubs:', error);
      throw error;
    }
  }

  /**
   * DEPRECATED: Legacy module resolution for backward compatibility
   * Frontend should use Server Actions + Database resolver instead
   */
  async resolveModulesForTenant(tenantId: string): Promise<Record<string, TenantModule>> {
    logger.warn('⚠️ DEPRECATED: resolveModulesForTenant() - Use Integration Hub instead');
    logger.warn('⚠️ Frontend should use Server Actions + Database resolver');
    
    // Return empty for legacy compatibility
    // All module logic should now be in Frontend via Server Actions
    return {};
  }

  /**
   * Limpar cache de integrações
   */
  clearCache(tenantId?: string): void {
    if (tenantId) {
      this.integrationCache.delete(tenantId);
      logger.debug(`Integration cache cleared for tenant: ${tenantId}`);
    } else {
      this.integrationCache.clear();
      logger.debug('All integration cache cleared');
    }
  }

  /**
   * Get available integration templates for new clients
   */
  getAvailableIntegrationTemplates(): Record<string, any> {
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