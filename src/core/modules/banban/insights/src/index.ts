// ================================================
// ENTRYPOINT PADRONIZADO - MÓDULO BANBAN INSIGHTS
// ================================================
// Implementação da nova arquitetura com função register() obrigatória
// Compatibilidade mantida com sistema legado

import { ModuleInterface } from '@/shared/types/module-interface';
import { BanbanInsightsModule, getBanbanInsightsModule } from '../index';
import type { 
  BanbanInsight, 
  InsightContext, 
  HealthCheckResponse,
  ModuleConfiguration 
} from '../types';

// ================================================
// INTERFACES PADRONIZADAS
// ================================================

export interface InsightsModuleConfig extends ModuleConfiguration {
  // Configurações específicas do módulo insights
  enableRealTimeUpdates?: boolean;
  maxConcurrentAnalysis?: number;
  financialPrecision?: number;
}

export interface InsightsModuleMetrics {
  insights: {
    generated: number;
    cached: number;
    errors: number;
  };
  performance: {
    avgGenerationTime: number;
    cacheHitRate: number;
    errorRate: number;
  };
  financial: {
    totalImpactCalculated: number;
    avgImpactPerInsight: number;
  };
}

// ================================================
// FUNÇÃO REGISTER OBRIGATÓRIA
// ================================================

/**
 * Função obrigatória de registro do módulo
 * Implementa a interface padrão da nova arquitetura
 */
export async function register(): Promise<ModuleInterface> {
  const moduleInstance = getBanbanInsightsModule();
  
  return {
    id: 'banban-insights',
    name: 'BanBan Insights',
    version: '2.0.0',
    category: 'custom',
    vendor: 'BanBan Fashion Systems',
    
    /**
     * Inicializa o módulo com configurações
     */
    initialize: async (config: Partial<InsightsModuleConfig> = {}) => {
      try {
        const initResult = await moduleInstance.initialize();
        
        return {
          success: initResult.success,
          message: initResult.message,
          data: {
            endpoints: initResult.endpoints,
            configuration: config,
            features: [
              'low-stock-analysis',
              'margin-optimization',
              'slow-moving-detection',
              'seasonal-trends',
              'cross-selling-opportunities',
              'financial-impact-calculation'
            ]
          }
        };
      } catch (error) {
        return {
          success: false,
          message: `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          data: null
        };
      }
    },

    /**
     * Finaliza o módulo e limpa recursos
     */
    shutdown: async () => {
      try {
        // Limpeza de recursos (cache, conexões, etc.)
        // Por enquanto, apenas log
        console.info('🛑 BanBan Insights Module shutting down...');
        
        return {
          success: true,
          message: 'Module shutdown completed successfully'
        };
      } catch (error) {
        return {
          success: false,
          message: `Shutdown failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    },

    /**
     * Verificação de saúde do módulo
     */
    healthCheck: async () => {
      try {
        const health = await moduleInstance.checkHealth();
        
        return {
          healthy: health.healthy,
          status: health.healthy ? 'healthy' : 'unhealthy',
          details: health.details,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          healthy: false,
          status: 'error',
          details: {
            module: 'banban-insights',
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          timestamp: new Date().toISOString()
        };
      }
    },

    /**
     * Retorna métricas do módulo
     */
    getMetrics: (): InsightsModuleMetrics => {
      const rawMetrics = moduleInstance.getMetrics();
      
      return {
        insights: {
          generated: rawMetrics.insights?.generated || 0,
          cached: rawMetrics.insights?.cached || 0,
          errors: rawMetrics.insights?.errors || 0
        },
        performance: {
          avgGenerationTime: rawMetrics.performance?.avgGenerationTime || 0,
          cacheHitRate: rawMetrics.performance?.cacheHitRate || 0,
          errorRate: rawMetrics.performance?.errorRate || 0
        },
        financial: {
          totalImpactCalculated: rawMetrics.financial?.totalImpactCalculated || 0,
          avgImpactPerInsight: rawMetrics.financial?.avgImpactPerInsight || 0
        }
      };
    },

    /**
     * Endpoints específicos do módulo
     */
    getEndpoints: () => [
      '/api/modules/banban/insights/health',
      '/api/modules/banban/insights',
      '/api/modules/banban/insights/generate',
      '/api/modules/banban/insights/analysis/category',
      '/api/modules/banban/insights/analysis/customer',
      '/api/modules/banban/insights/forecast',
      '/api/modules/banban/insights/opportunities',
      '/api/modules/banban/insights/financial-impact',
      '/api/modules/banban/insights/metrics',
      '/api/modules/banban/insights/cache'
    ],

    /**
     * Configuração do módulo
     */
    getConfig: () => ({
      updateInterval: 300000, // 5 minutos
      cacheTimeout: 1800000, // 30 minutos
      stockThreshold: 10,
      marginThreshold: 0.31,
      slowMovingDays: 30
    })
  };
}

// ================================================
// FUNÇÕES DE CONVENIÊNCIA (COMPATIBILIDADE)
// ================================================

/**
 * Gera insights para uma organização
 * @deprecated Use register().then(module => module.api.generateInsights())
 */
export async function generateInsights(
  organizationId: string,
  options?: {
    timeframe?: { start: string; end: string };
    filters?: any;
    useCache?: boolean;
  }
): Promise<BanbanInsight[]> {
  // Use the convenience function from the main module instead of the class method
  const { generateInsights: moduleGenerateInsights } = await import('../index');
  return moduleGenerateInsights(organizationId, options);
}

/**
 * Obtém insights de uma organização
 * @deprecated Use register().then(module => module.api.getInsights())
 */
export async function getInsights(
  organizationId: string,
  useCache: boolean = true
): Promise<BanbanInsight[]> {
  const moduleInstance = getBanbanInsightsModule();
  return moduleInstance.getInsights(organizationId, useCache);
}

/**
 * Verifica a saúde do módulo
 * @deprecated Use register().then(module => module.healthCheck())
 */
export async function checkHealth(): Promise<HealthCheckResponse> {
  const moduleInstance = getBanbanInsightsModule();
  return moduleInstance.checkHealth();
}

// ================================================
// EXPORTS PADRÃO
// ================================================

export { BanbanInsightsModule } from '../index';
export type { BanbanInsight, InsightContext, HealthCheckResponse } from '../types';

// Export da instância para compatibilidade
export const insightsModule = getBanbanInsightsModule();

// Default export para compatibilidade com imports dinâmicos
export default {
  register,
  generateInsights,
  getInsights,
  checkHealth,
  module: insightsModule
}; 