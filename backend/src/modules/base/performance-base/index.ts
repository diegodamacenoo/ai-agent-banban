/**
 * Performance Base Module
 * Módulo base de performance que fornece funcionalidades fundamentais
 * para todos os clientes, independente da indústria ou customizações.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PerformanceService } from './services/performance-service';
import { PerformanceSchemas } from './schemas/performance-schemas';
import { ModuleInstance, ModuleConfig } from '../../../shared/types/module-types';

export interface PerformanceBaseConfig extends ModuleConfig {
  enableCaching?: boolean;
  cacheTimeout?: number;
  enableRealTimeMetrics?: boolean;
}

export class PerformanceBaseModule implements ModuleInstance {
  name = 'performance-base';
  version = '1.0.0';
  description = 'Módulo base de performance para métricas e analytics';
  
  private service: PerformanceService;
  private config: PerformanceBaseConfig;

  constructor(config: PerformanceBaseConfig) {
    this.config = {
      enableCaching: true,
      cacheTimeout: 300, // 5 minutos
      enableRealTimeMetrics: true,
      ...config
    };
    this.service = new PerformanceService(this.config);
  }

  async register(server: FastifyInstance, prefix: string = '/api/performance'): Promise<void> {
    // Registrar schemas
    server.addSchema(PerformanceSchemas.businessMetricsResponse);
    server.addSchema(PerformanceSchemas.summaryResponse);
    server.addSchema(PerformanceSchemas.calculateRequest);

    // Rotas base do módulo performance
    await server.register(async (server) => {
      // GET /api/performance/business-metrics
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

      // GET /api/performance/summary
      server.get('/summary', {
        schema: {
          description: 'Obter resumo geral de performance',
          tags: ['performance', 'base'],
          response: {
            200: { $ref: 'summaryResponse#' }
          }
        }
      }, this.getSummary.bind(this));

      // POST /api/performance/calculate
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

      // GET /api/performance/health
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

  async handleRequest(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    const { url, method } = request;
    const tenant = (request as any).tenant;
    
    // Log da requisição
    request.log.info('PerformanceBase: Handling request', {
      url,
      method,
      tenantId: tenant?.id,
      module: 'performance-base'
    });

    // Aqui seria implementada a lógica de roteamento interno
    // Por enquanto, retornar informações do módulo
    return {
      module: 'performance-base',
      version: '1.0.0',
      tenant: tenant?.id || 'unknown',
      timestamp: new Date().toISOString()
    };
  }

  private async getBusinessMetrics(request: FastifyRequest, reply: FastifyReply) {
    const { period = 'monthly', startDate, endDate } = request.query as any;
    const tenant = (request as any).tenant;

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
    } catch (error) {
      request.log.error('Error getting business metrics', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get business metrics'
      });
    }
  }

  private async getSummary(request: FastifyRequest, reply: FastifyReply) {
    const tenant = (request as any).tenant;

    try {
      const summary = await this.service.getSummary(tenant?.id);

      return {
        success: true,
        data: summary,
        generatedAt: new Date().toISOString(),
        module: 'performance-base'
      };
    } catch (error) {
      request.log.error('Error getting summary', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get performance summary'
      });
    }
  }

  private async calculateMetrics(request: FastifyRequest, reply: FastifyReply) {
    const { metrics, parameters } = request.body as any;
    const tenant = (request as any).tenant;

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
    } catch (error) {
      request.log.error('Error calculating metrics', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to calculate metrics'
      });
    }
  }

  private async getHealth(request: FastifyRequest, reply: FastifyReply) {
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
      type: 'base' as const,
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

  getEndpoints(): string[] {
    return [
      '/api/performance/business-metrics',
      '/api/performance/summary',
      '/api/performance/calculate',
      '/api/performance/health'
    ];
  }
} 