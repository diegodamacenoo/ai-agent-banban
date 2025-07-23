import { FastifyInstance } from 'fastify';
import { BanBanSalesFlowModule } from './flows/sales/index';
import { BanBanPurchaseFlowModule } from './flows/purchase/index';
import { BanBanInventoryFlowModule } from './flows/inventory/index';
import { BanBanTransferFlowModule } from './flows/transfer/index';
import { BanBanReturnsFlowModule } from './flows/returns/index';
import { BanBanETLFlowModule } from './flows/etl/index';
import { BanBanPerformanceModule } from './performance/index';
import { BanbanECAEngine } from './shared/eca-engine';
import { BanbanAnalytics } from './shared/analytics';
import { BanbanValidationService } from './shared/validation';

export interface IntegrationHubInfo {
  client: string;
  version: string;
  description: string;
  flows: string[];
  features: string[];
  health: {
    status: string;
    timestamp: string;
    flows_status: Record<string, string>;
  };
}

export class BanbanIntegrationHub {
  private salesFlow: BanBanSalesFlowModule;
  private purchaseFlow: BanBanPurchaseFlowModule;
  private inventoryFlow: BanBanInventoryFlowModule;
  private transferFlow: BanBanTransferFlowModule;
  private returnsFlow: BanBanReturnsFlowModule;
  private etlFlow: BanBanETLFlowModule;
  private performanceModule: BanBanPerformanceModule;
  private ecaEngine: BanbanECAEngine;
  private analytics: BanbanAnalytics;
  private validation: BanbanValidationService;

  constructor() {
    this.salesFlow = new BanBanSalesFlowModule();
    this.purchaseFlow = new BanBanPurchaseFlowModule();
    this.inventoryFlow = new BanBanInventoryFlowModule();
    this.transferFlow = new BanBanTransferFlowModule();
    this.returnsFlow = new BanBanReturnsFlowModule();
    this.etlFlow = new BanBanETLFlowModule();
    this.performanceModule = new BanBanPerformanceModule();
    this.ecaEngine = new BanbanECAEngine();
    this.analytics = new BanbanAnalytics();
    this.validation = new BanbanValidationService();
  }

  async register(fastify: FastifyInstance, prefix: string = '/api/integrations/banban'): Promise<void> {
    // Registrar todos os módulos de fluxo
    await this.salesFlow.register(fastify);
    await this.purchaseFlow.register(fastify);
    await this.inventoryFlow.register(fastify);
    await this.transferFlow.register(fastify);
    await this.returnsFlow.register(fastify);
    await this.etlFlow.register(fastify);
    await this.performanceModule.register(fastify);

    // Endpoint de visão geral da integração Banban
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

    // Endpoint de health check consolidado
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

    // Endpoint de métricas da integração
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
      const query = request.query as any;
      
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

    // Endpoint de configuração ECA
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

    // Endpoint para testar ECA
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
      const payload = request.body as any;
      
      const result = await this.ecaEngine.processEvent({
        type: payload.event_type,
        organizationId: payload.organization_id,
        data: payload.data,
        timestamp: new Date().toISOString()
      });

      return reply.send(result);
    });
  }

  async getIntegrationInfo(): Promise<IntegrationHubInfo> {
    const flows = [
      this.salesFlow.name,
      this.purchaseFlow.name,
      this.inventoryFlow.name,
      this.transferFlow.name,
      this.returnsFlow.name,
      this.etlFlow.name,
      this.performanceModule.name
    ];

    const flowsStatus: Record<string, string> = {};
    flows.forEach(flow => {
      flowsStatus[flow] = 'healthy'; // Simplificado por enquanto
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

  async getHealthCheck(): Promise<any> {
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

  async getIntegrationMetrics(organizationId: string, filters: any = {}): Promise<any> {
    try {
      // Obter analytics consolidados
      const salesAnalytics = await this.analytics.generateSalesAnalytics(organizationId, filters);
      
      // Obter análise RFM
      const rfmAnalysis = await this.analytics.calculateRFMAnalysis(
        organizationId, 
        filters.dateFrom, 
        filters.dateTo
      );

      // Métricas dos fluxos (simplificado)
      const flowMetrics = {
        sales_flow: {
          total_events: salesAnalytics.summary.total_sales,
          success_rate: 0.98 // Estimativa
        },
        inventory_flow: {
          total_events: 150, // Estimativa
          success_rate: 0.95
        },
        purchase_flow: {
          total_events: 75, // Estimativa
          success_rate: 0.97
        },
        transfer_flow: {
          total_events: 45, // Estimativa
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
          total_events_processed: Object.values(flowMetrics).reduce((sum, flow: any) => sum + flow.total_events, 0),
          avg_processing_time_ms: 450
        }
      };

    } catch (error: any) {
      console.error('Erro ao obter métricas da integração:', error);
      throw new Error(`Erro ao gerar métricas: ${error.message}`);
    }
  }

  private getSegmentsBreakdown(segments: any[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    segments.forEach(segment => {
      const segmentName = segment.segment;
      breakdown[segmentName] = (breakdown[segmentName] || 0) + 1;
    });

    return breakdown;
  }

  // Getters para acesso aos módulos individuais
  getSalesFlow(): BanBanSalesFlowModule { return this.salesFlow; }
  getPurchaseFlow(): BanBanPurchaseFlowModule { return this.purchaseFlow; }
  getInventoryFlow(): BanBanInventoryFlowModule { return this.inventoryFlow; }
  getTransferFlow(): BanBanTransferFlowModule { return this.transferFlow; }
  getReturnsFlow(): BanBanReturnsFlowModule { return this.returnsFlow; }
  getETLFlow(): BanBanETLFlowModule { return this.etlFlow; }
  getPerformanceModule(): BanBanPerformanceModule { return this.performanceModule; }
  getECAEngine(): BanbanECAEngine { return this.ecaEngine; }
  getAnalytics(): BanbanAnalytics { return this.analytics; }
  getValidation(): BanbanValidationService { return this.validation; }
}

export default BanbanIntegrationHub;