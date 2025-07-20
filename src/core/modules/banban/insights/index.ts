// ================================================
// MÓDULO BANBAN INSIGHTS - ARQUIVO PRINCIPAL REFATORADO
// ================================================

// Exportar tipos principais
export type {
  BanbanInsight,
  InsightContext,
  FinancialImpactCalculation,
  ProductData,
  ModuleConfiguration,
  ApiResponse,
  HealthCheckResponse,
  MetricsResponse
} from './types';

// Exportar enums
export { InsightType, InsightSeverity } from './types';

// Exportar serviços
export { InsightsEngine, FinancialCalculator, DataAnalysisService, CacheService } from './services';

// Exportar handlers
export { ApiHandlers } from './handlers';

// Importar dependências para compatibilidade
import { BackendModuleInterface } from '@/shared/types/client-module-interface';
import { BanbanLogger, BanbanMetrics } from '../index';
import { InsightsEngine } from './services';
import { ApiHandlers } from './handlers';
import type { BanbanInsight, InsightContext, HealthCheckResponse } from './types';

// ================================================
// CONFIGURAÇÃO DO MÓDULO
// ================================================

export const BANBAN_INSIGHTS_MODULE: BackendModuleInterface = {
  moduleId: 'banban-insights',
  clientId: 'banban',
  configuration: {
    updateInterval: 300000, // 5 minutos
    cacheTimeout: 1800000, // 30 minutos
    stockThreshold: 10,
    marginThreshold: 0.31,
    slowMovingDays: 30
  },
  endpoints: [
    '/api/modules/banban/insights',
    '/api/modules/banban/insights/generate',
    '/api/modules/banban/insights/analysis/category',
    '/api/modules/banban/insights/analysis/customer',
    '/api/modules/banban/insights/forecast',
    '/api/modules/banban/insights/opportunities',
    '/api/modules/banban/insights/financial-impact',
    '/api/modules/banban/insights/health',
    '/api/modules/banban/insights/metrics',
    '/api/modules/banban/insights/cache'
  ],
  validations: {
    organizationId: 'required',
    timeframe: 'required'
  }
};

// ================================================
// CLASSE PRINCIPAL DO MÓDULO (MANTIDA PARA COMPATIBILIDADE)
// ================================================

export class BanbanInsightsModule {
  private engine: InsightsEngine;
  private logger = BanbanLogger.getInstance();

  constructor() {
    this.engine = new InsightsEngine();
  }

  /**
   * Gera insights para uma organização
   * @deprecated Use ApiHandlers.generateInsights() para nova implementação
   */
  async generateInsights(context: InsightContext): Promise<BanbanInsight[]> {
    this.logger.info('insights', 'Using legacy generateInsights method', {
      organizationId: context.organizationId
    });
    
    return await this.engine.generateInsights(context);
  }

  /**
   * Retorna insights do cache ou gera novos
   * @deprecated Use ApiHandlers.getInsights() para nova implementação
   */
  async getInsights(organizationId: string, useCache: boolean = true): Promise<BanbanInsight[]> {
    this.logger.info('insights', 'Using legacy getInsights method', {
      organizationId,
      useCache
    });

    const response = await ApiHandlers.getInsights({
      organizationId,
      useCache
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to get insights');
  }

  /**
   * Retorna métricas do módulo
   */
  getMetrics(): Record<string, any> {
    return BanbanMetrics.getMetrics('insights');
  }

  /**
   * Verifica a saúde do módulo
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    try {
      return await ApiHandlers.getHealth();
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
   * Método de inicialização do módulo
   */
  async initialize(): Promise<{
    success: boolean;
    message: string;
    endpoints: string[];
  }> {
    try {
      this.logger.info('insights', 'Initializing BanBan Insights Module', {
        version: '2.0.0',
        architecture: 'modular'
      });

      // Verificar saúde dos serviços
      const health = await this.checkHealth();
      
      if (!health.healthy) {
        throw new Error('Health check failed');
      }

      // Log de inicialização bem-sucedida
      this.logger.info('insights', 'BanBan Insights Module initialized successfully', {
        endpoints: BANBAN_INSIGHTS_MODULE.endpoints.length,
        services: ['InsightsEngine', 'FinancialCalculator', 'DataAnalysisService', 'CacheService'],
        handlers: ['ApiHandlers']
      });

      return {
        success: true,
        message: 'BanBan Insights Module initialized successfully',
        endpoints: BANBAN_INSIGHTS_MODULE.endpoints
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      
      this.logger.error('insights', 'Failed to initialize BanBan Insights Module', {
        error: errorMessage
      });

      return {
        success: false,
        message: `Initialization failed: ${errorMessage}`,
        endpoints: []
      };
    }
  }
}

// ================================================
// INSTÂNCIA SINGLETON (MANTIDA PARA COMPATIBILIDADE)
// ================================================

let moduleInstance: BanbanInsightsModule | null = null;

export function getBanbanInsightsModule(): BanbanInsightsModule {
  if (!moduleInstance) {
    moduleInstance = new BanbanInsightsModule();
  }
  return moduleInstance;
}

// ================================================
// FUNÇÕES DE CONVENIÊNCIA (NOVAS)
// ================================================

/**
 * Função de conveniência para gerar insights
 */
export async function generateInsights(
  organizationId: string,
  options?: {
    timeframe?: { start: string; end: string };
    filters?: any;
    useCache?: boolean;
  }
): Promise<BanbanInsight[]> {
  const response = await ApiHandlers.generateInsights({
    organizationId,
    ...options
  });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || 'Failed to generate insights');
}

/**
 * Função de conveniência para análise de categoria
 */
export async function getCategoryAnalysis(
  organizationId: string,
  useCache: boolean = true
): Promise<any[]> {
  const response = await ApiHandlers.getCategoryAnalysis({
    organizationId,
    useCache
  });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || 'Failed to get category analysis');
}

/**
 * Função de conveniência para previsão de demanda
 */
export async function getForecast(
  organizationId: string,
  category: string,
  months: number = 3,
  useCache: boolean = true
): Promise<any[]> {
  const response = await ApiHandlers.getForecast({
    organizationId,
    category,
    months,
    useCache
  });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || 'Failed to get forecast');
}

// ================================================
// EXPORTAÇÃO PADRÃO (MANTIDA PARA COMPATIBILIDADE)
// ================================================

export default BANBAN_INSIGHTS_MODULE; 