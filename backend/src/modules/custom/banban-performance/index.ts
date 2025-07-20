import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ModuleInstance, ModuleInfo } from '../../../shared/types/module-types';
import { BanBanPerformanceService } from './services/banban-performance-service';
import { banbanPerformanceSchemas } from './schemas/banban-performance-schemas';

export class BanBanPerformanceModule implements ModuleInstance {
  name = 'banban-performance';
  version = '1.0.0';
  description = 'Módulo de performance customizado para BanBan Fashion';
  baseModule = 'performance-base';
  
  private service: BanBanPerformanceService;

  constructor() {
    this.service = new BanBanPerformanceService();
  }

  async register(fastify: FastifyInstance, prefix?: string): Promise<void> {
    // Registrar schemas específicos do BanBan
    fastify.addSchema(banbanPerformanceSchemas.fashionMetrics);
    fastify.addSchema(banbanPerformanceSchemas.inventoryTurnover);
    fastify.addSchema(banbanPerformanceSchemas.seasonalAnalysis);
    fastify.addSchema(banbanPerformanceSchemas.brandPerformance);

    // Endpoints específicos do BanBan Fashion
    
    // 1. Métricas de Fashion/Moda
    fastify.get('/api/performance/fashion-metrics', {
      schema: {
        description: 'Métricas específicas de moda e fashion',
        tags: ['BanBan Performance'],
        response: {
          200: { $ref: 'banban-fashion-metrics#' }
        }
      }
    }, async (request, reply) => {
      const metrics = await this.service.getFashionMetrics();
      return reply.send(metrics);
    });

    // 2. Análise de Giro de Estoque por Categoria
    fastify.get('/api/performance/inventory-turnover', {
      schema: {
        description: 'Análise de giro de estoque por categoria de produto',
        tags: ['BanBan Performance'],
        querystring: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            period: { type: 'string', enum: ['7d', '30d', '90d', '1y'] }
          }
        },
        response: {
          200: { $ref: 'banban-inventory-turnover#' }
        }
      }
    }, async (request, reply) => {
      const { category, period } = request.query as any;
      const turnover = await this.service.getInventoryTurnover(category, period);
      return reply.send(turnover);
    });

    // 3. Análise Sazonal de Vendas
    fastify.get('/api/performance/seasonal-analysis', {
      schema: {
        description: 'Análise sazonal de vendas e tendências',
        tags: ['BanBan Performance'],
        querystring: {
          type: 'object',
          properties: {
            year: { type: 'integer' },
            season: { type: 'string', enum: ['spring', 'summer', 'fall', 'winter'] }
          }
        },
        response: {
          200: { $ref: 'banban-seasonal-analysis#' }
        }
      }
    }, async (request, reply) => {
      const { year, season } = request.query as any;
      const analysis = await this.service.getSeasonalAnalysis(year, season);
      return reply.send(analysis);
    });

    // 4. Performance por Marca/Fornecedor
    fastify.get('/api/performance/brand-performance', {
      schema: {
        description: 'Performance de vendas por marca ou fornecedor',
        tags: ['BanBan Performance'],
        querystring: {
          type: 'object',
          properties: {
            brandId: { type: 'string' },
            period: { type: 'string', enum: ['7d', '30d', '90d', '1y'] },
            metric: { type: 'string', enum: ['revenue', 'units', 'profit', 'margin'] }
          }
        },
        response: {
          200: { $ref: 'banban-brand-performance#' }
        }
      }
    }, async (request, reply) => {
      const { brandId, period, metric } = request.query as any;
      const performance = await this.service.getBrandPerformance(brandId, period, metric);
      return reply.send(performance);
    });

    // 5. Dashboard Executivo BanBan
    fastify.get('/api/performance/executive-dashboard', {
      schema: {
        description: 'Dashboard executivo com KPIs específicos do BanBan',
        tags: ['BanBan Performance'],
        response: {
          200: {
            type: 'object',
            properties: {
              fashionMetrics: { $ref: 'banban-fashion-metrics#' },
              topCategories: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    category: { type: 'string' },
                    revenue: { type: 'number' },
                    growth: { type: 'number' }
                  }
                }
              },
              seasonalTrends: { $ref: 'banban-seasonal-analysis#' },
              alerts: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    message: { type: 'string' },
                    severity: { type: 'string', enum: ['low', 'medium', 'high'] }
                  }
                }
              },
              kpis: {
                type: 'object',
                properties: {
                  totalRevenue: { type: 'number' },
                  totalOrders: { type: 'number' },
                  averageOrderValue: { type: 'number' },
                  customerRetention: { type: 'number' },
                  inventoryTurnover: { type: 'number' },
                  grossMargin: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }, async (request, reply) => {
      const dashboard = await this.service.getExecutiveDashboard();
      return reply.send(dashboard);
    });

    // 6. Análise de Margem por Produto
    fastify.get('/api/performance/product-margins', {
      schema: {
        description: 'Análise detalhada de margem por produto',
        tags: ['BanBan Performance'],
        querystring: {
          type: 'object',
          properties: {
            productId: { type: 'string' },
            category: { type: 'string' },
            minMargin: { type: 'number' },
            maxMargin: { type: 'number' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              products: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    productId: { type: 'string' },
                    name: { type: 'string' },
                    category: { type: 'string' },
                    costPrice: { type: 'number' },
                    salePrice: { type: 'number' },
                    margin: { type: 'number' },
                    marginPercent: { type: 'number' },
                    unitsSold: { type: 'integer' },
                    revenue: { type: 'number' }
                  }
                }
              },
              summary: {
                type: 'object',
                properties: {
                  totalProducts: { type: 'integer' },
                  averageMargin: { type: 'number' },
                  totalRevenue: { type: 'number' },
                  totalProfit: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }, async (request, reply) => {
      const filters = request.query as any;
      const margins = await this.service.getProductMargins(filters);
      return reply.send(margins);
    });

    // Health check específico do módulo BanBan
    fastify.get('/api/performance/banban-health', {
      schema: {
        description: 'Health check específico do módulo BanBan Performance',
        tags: ['BanBan Performance'],
        response: {
          200: {
            type: 'object',
            properties: {
              module: { type: 'string' },
              status: { type: 'string' },
              version: { type: 'string' },
              baseModule: { type: 'string' },
              customFeatures: {
                type: 'array',
                items: { type: 'string' }
              },
              timestamp: { type: 'string' }
            }
          }
        }
      }
    }, async (request, reply) => {
      return reply.send({
        module: this.name,
        status: 'healthy',
        version: this.version,
        baseModule: this.baseModule,
        customFeatures: [
          'fashion-metrics',
          'inventory-turnover',
          'seasonal-analysis',
          'brand-performance',
          'executive-dashboard',
          'product-margins'
        ],
        timestamp: new Date().toISOString()
      });
    });
  }

  async handleRequest(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    // Implementação genérica de handle request
    // Em uma implementação real, isso seria mais sofisticado
    return reply.send({ 
      message: 'BanBan Performance Module is active',
      timestamp: new Date().toISOString()
    });
  }

  getModuleInfo(): ModuleInfo {
    return {
      name: this.name,
      type: 'custom',
      version: this.version,
      description: this.description,
      endpoints: [
        '/api/performance/fashion-metrics',
        '/api/performance/inventory-turnover',
        '/api/performance/seasonal-analysis', 
        '/api/performance/brand-performance',
        '/api/performance/executive-dashboard',
        '/api/performance/product-margins',
        '/api/performance/banban-health'
      ],
      features: [
        'fashion-metrics',
        'inventory-turnover',
        'seasonal-analysis',
        'brand-performance',
        'executive-dashboard',
        'product-margins'
      ],
      inheritsFrom: this.baseModule
    };
  }

  getEndpoints(): string[] {
    return this.getModuleInfo().endpoints;
  }
} 