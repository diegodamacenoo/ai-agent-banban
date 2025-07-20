// ================================================
// API HANDLERS - MÓDULO BANBAN INSIGHTS
// ================================================

import { 
  type BanbanInsight, 
  type InsightContext, 
  type ApiResponse,
  type HealthCheckResponse,
  type MetricsResponse
} from '../types';
import { InsightsEngine, FinancialCalculator, DataAnalysisService, CacheService } from '../services';

export class ApiHandlers {
  private static insightsEngine = new InsightsEngine();
  private static cacheService = new CacheService();

  /**
   * Handler para gerar insights
   * GET /api/modules/banban/insights/generate
   */
  static async generateInsights(request: {
    organizationId: string;
    timeframe?: { start: string; end: string };
    filters?: any;
    useCache?: boolean;
  }): Promise<ApiResponse<BanbanInsight[]>> {
    try {
      const { organizationId, timeframe, filters, useCache = true } = request;

      // Verificar cache primeiro se solicitado
      if (useCache) {
        const cached = await this.cacheService.get<BanbanInsight[]>(
          `insights:${organizationId}:${JSON.stringify(filters || {})}`
        );
        
        if (cached) {
          return {
            success: true,
            data: cached.data,
            timestamp: new Date().toISOString(),
            metadata: {
              source: 'cache',
              cacheTimestamp: new Date(cached.timestamp).toISOString()
            }
          };
        }
      }

      // Gerar contexto
      const context: InsightContext = {
        organizationId,
        timeframe: timeframe || {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        },
        filters
      };

      // Gerar insights
      const insights = await this.insightsEngine.generateInsights(context);

      // Salvar no cache
      if (useCache) {
        await this.cacheService.set(
          `insights:${organizationId}:${JSON.stringify(filters || {})}`,
          insights,
          1800000 // 30 minutos
        );
      }

      return {
        success: true,
        data: insights,
        timestamp: new Date().toISOString(),
        metadata: {
          source: 'generated',
          count: insights.length,
          context
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Handler para obter insights (com cache)
   * GET /api/modules/banban/insights
   */
  static async getInsights(request: {
    organizationId: string;
    useCache?: boolean;
    filters?: any;
  }): Promise<ApiResponse<BanbanInsight[]>> {
    try {
      const { organizationId, useCache = true, filters } = request;

      // Tentar cache primeiro
      if (useCache) {
        const cached = await this.cacheService.get<BanbanInsight[]>(
          `insights:${organizationId}:${JSON.stringify(filters || {})}`
        );
        
        if (cached) {
          return {
            success: true,
            data: cached.data,
            timestamp: new Date().toISOString(),
            metadata: {
              source: 'cache',
              cacheAge: Date.now() - cached.timestamp
            }
          };
        }
      }

      // Se não houver cache, gerar novos insights
      return await this.generateInsights({ organizationId, filters, useCache });

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Handler para análise de categoria
   * GET /api/modules/banban/insights/analysis/category
   */
  static async getCategoryAnalysis(request: {
    organizationId: string;
    useCache?: boolean;
  }): Promise<ApiResponse<any[]>> {
    try {
      const { organizationId, useCache = true } = request;

      // Verificar cache
      if (useCache) {
        const cached = await this.cacheService.get<any[]>(`analysis:category:${organizationId}`);
        if (cached) {
          return {
            success: true,
            data: cached.data,
            timestamp: new Date().toISOString(),
            metadata: { source: 'cache' }
          };
        }
      }

      // Gerar análise
      const analysis = await DataAnalysisService.analyzeCategoryPerformance(organizationId);

      // Salvar no cache
      if (useCache) {
        await this.cacheService.set(`analysis:category:${organizationId}`, analysis, 3600000); // 1 hora
      }

      return {
        success: true,
        data: analysis,
        timestamp: new Date().toISOString(),
        metadata: { source: 'generated' }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Handler para análise de comportamento do cliente
   * GET /api/modules/banban/insights/analysis/customer
   */
  static async getCustomerAnalysis(request: {
    organizationId: string;
    useCache?: boolean;
  }): Promise<ApiResponse<any[]>> {
    try {
      const { organizationId, useCache = true } = request;

      // Verificar cache
      if (useCache) {
        const cached = await this.cacheService.get<any[]>(`analysis:customer:${organizationId}`);
        if (cached) {
          return {
            success: true,
            data: cached.data,
            timestamp: new Date().toISOString(),
            metadata: { source: 'cache' }
          };
        }
      }

      // Gerar análise
      const analysis = await DataAnalysisService.analyzeCustomerBehavior(organizationId);

      // Salvar no cache
      if (useCache) {
        await this.cacheService.set(`analysis:customer:${organizationId}`, analysis, 3600000);
      }

      return {
        success: true,
        data: analysis,
        timestamp: new Date().toISOString(),
        metadata: { source: 'generated' }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Handler para previsão de demanda
   * GET /api/modules/banban/insights/forecast
   */
  static async getForecast(request: {
    organizationId: string;
    category: string;
    months?: number;
    useCache?: boolean;
  }): Promise<ApiResponse<any[]>> {
    try {
      const { organizationId, category, months = 3, useCache = true } = request;

      const cacheKey = `forecast:${organizationId}:${category}:${months}`;

      // Verificar cache
      if (useCache) {
        const cached = await this.cacheService.get<any[]>(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached.data,
            timestamp: new Date().toISOString(),
            metadata: { source: 'cache' }
          };
        }
      }

      // Gerar previsão
      const forecast = await DataAnalysisService.forecastDemand(organizationId, category, months);

      // Salvar no cache
      if (useCache) {
        await this.cacheService.set(cacheKey, forecast, 7200000); // 2 horas
      }

      return {
        success: true,
        data: forecast,
        timestamp: new Date().toISOString(),
        metadata: { 
          source: 'generated',
          category,
          months,
          confidence: forecast.reduce((sum, f) => sum + f.confidence, 0) / forecast.length
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Handler para oportunidades de crescimento
   * GET /api/modules/banban/insights/opportunities
   */
  static async getGrowthOpportunities(request: {
    organizationId: string;
    useCache?: boolean;
  }): Promise<ApiResponse<any[]>> {
    try {
      const { organizationId, useCache = true } = request;

      // Verificar cache
      if (useCache) {
        const cached = await this.cacheService.get<any[]>(`opportunities:${organizationId}`);
        if (cached) {
          return {
            success: true,
            data: cached.data,
            timestamp: new Date().toISOString(),
            metadata: { source: 'cache' }
          };
        }
      }

      // Gerar oportunidades
      const opportunities = await DataAnalysisService.identifyGrowthOpportunities(organizationId);

      // Salvar no cache
      if (useCache) {
        await this.cacheService.set(`opportunities:${organizationId}`, opportunities, 3600000);
      }

      return {
        success: true,
        data: opportunities,
        timestamp: new Date().toISOString(),
        metadata: { 
          source: 'generated',
          totalPotential: opportunities.reduce((sum, opp) => sum + opp.potentialSales, 0)
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Handler para cálculo de impacto financeiro
   * POST /api/modules/banban/insights/financial-impact
   */
  static async calculateFinancialImpact(request: {
    insightType: string;
    affectedProducts: any[];
    timeframe: { start: string; end: string };
  }): Promise<ApiResponse<any>> {
    try {
      const { insightType, affectedProducts, timeframe } = request;

      const impact = FinancialCalculator.calculateFinancialImpact(
        insightType as any,
        affectedProducts,
        timeframe
      );

      const viability = FinancialCalculator.analyzeFinancialViability(
        impact.currentLoss,
        impact.potentialGain,
        impact.timeToAction,
        impact.confidenceLevel
      );

      return {
        success: true,
        data: {
          impact,
          viability,
          priority: FinancialCalculator.calculateFinancialPriority(
            impact,
            affectedProducts.length,
            impact.timeToAction <= 7 ? 0.9 : 0.5
          )
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Handler para health check
   * GET /api/modules/banban/insights/health
   */
  static async getHealth(): Promise<HealthCheckResponse> {
    try {
      const cacheStats = this.cacheService.getStats();
      
      return {
        healthy: true,
        details: {
          module: 'banban-insights',
          status: 'operational',
          lastActivity: new Date().toISOString(),
          cache: {
            size: cacheStats.size,
            hitRate: cacheStats.hitRate
          }
        }
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          module: 'banban-insights',
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Handler para métricas do módulo
   * GET /api/modules/banban/insights/metrics
   */
  static async getMetrics(): Promise<ApiResponse<MetricsResponse>> {
    try {
      const cacheStats = this.cacheService.getStats();
      
      return {
        success: true,
        data: {
          insights: {
            totalGenerated: 0, // Seria rastreado em produção
            averageGenerationTime: 0,
            cacheHitRate: cacheStats.hitRate
          },
          performance: {
            generationTime: 2500, // Mock
            cacheHitRate: cacheStats.hitRate,
            errorRate: 0.02 // Mock
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Handler para limpar cache
   * DELETE /api/modules/banban/insights/cache
   */
  static async clearCache(request: {
    organizationId?: string;
  }): Promise<ApiResponse<{ cleared: boolean; message: string }>> {
    try {
      const { organizationId } = request;

      if (organizationId) {
        // Limpar cache de uma organização específica
        const keysToDelete: string[] = [];
        const stats = this.cacheService.getStats();
        
        // Em uma implementação real, seria mais eficiente
        await this.cacheService.clear(); // Simplificado para o mock
        
        return {
          success: true,
          data: {
            cleared: true,
            message: `Cache limpo para organização ${organizationId}`
          },
          timestamp: new Date().toISOString()
        };
      } else {
        // Limpar todo o cache
        await this.cacheService.clear();
        
        return {
          success: true,
          data: {
            cleared: true,
            message: 'Todo o cache foi limpo'
          },
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      };
    }
  }
} 