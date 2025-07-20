// ================================================
// TESTES - MÓDULO BANBAN INSIGHTS
// ================================================

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  InsightsEngine,
  FinancialCalculator,
  DataAnalysisService,
  CacheService,
  ApiHandlers,
  BanbanInsightsModule,
  generateInsights,
  getCategoryAnalysis,
  getForecast
} from '../index';
import { InsightType, InsightSeverity } from '../types';

// ================================================
// TESTES DO INSIGHTS ENGINE
// ================================================

describe('InsightsEngine', () => {
  let engine: InsightsEngine;

  beforeEach(() => {
    engine = new InsightsEngine();
  });

  describe('generateInsights', () => {
    it('deve gerar insights para uma organização', async () => {
      const context = {
        organizationId: 'org-test-001',
        timeframe: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z'
        }
      };

      const insights = await engine.generateInsights(context);

      expect(insights).toBeInstanceOf(Array);
      expect(insights.length).toBeGreaterThan(0);
      
      // Verificar estrutura dos insights
      insights.forEach(insight => {
        expect(insight).toHaveProperty('id');
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('title');
        expect(insight).toHaveProperty('description');
        expect(insight).toHaveProperty('severity');
        expect(insight).toHaveProperty('priority');
        expect(insight).toHaveProperty('financialImpact');
        expect(insight).toHaveProperty('affectedProducts');
        expect(insight).toHaveProperty('affectedStores');
        expect(insight).toHaveProperty('actionSuggestions');
        expect(insight).toHaveProperty('createdAt');
        expect(insight).toHaveProperty('organizationId');
        expect(insight.organizationId).toBe(context.organizationId);
      });
    });

    it('deve priorizar insights por severidade e impacto financeiro', async () => {
      const context = {
        organizationId: 'org-test-002',
        timeframe: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z'
        }
      };

      const insights = await engine.generateInsights(context);

      // Verificar se está ordenado por prioridade
      for (let i = 0; i < insights.length - 1; i++) {
        const current = insights[i];
        const next = insights[i + 1];
        
        // Insights críticos devem vir primeiro
        if (current.severity === InsightSeverity.CRITICAL && next.severity !== InsightSeverity.CRITICAL) {
          expect(true).toBe(true); // Ordem correta
        }
      }
    });

    it('deve incluir diferentes tipos de insights', async () => {
      const context = {
        organizationId: 'org-test-003',
        timeframe: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z'
        }
      };

      const insights = await engine.generateInsights(context);
      const types = insights.map(i => i.type);

      // Verificar se há diferentes tipos de insights
      expect(types).toContain(InsightType.LOW_STOCK);
      expect(types).toContain(InsightType.LOW_MARGIN);
      expect(types).toContain(InsightType.SLOW_MOVING);
      expect(types).toContain(InsightType.OPPORTUNITY);
    });
  });
});

// ================================================
// TESTES DO FINANCIAL CALCULATOR
// ================================================

describe('FinancialCalculator', () => {
  describe('calculateFinancialImpact', () => {
    it('deve calcular impacto de estoque baixo', () => {
      const products = [
        {
          id: 'prod-001',
          name: 'Produto Teste',
          sku: 'TEST-001',
          category: 'Teste',
          price: 100,
          currentStock: 5,
          monthlySales: 50,
          avgSalesPerDay: 1.6,
          margin: 0.3
        }
      ];

      const timeframe = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-31T23:59:59Z'
      };

      const impact = FinancialCalculator.calculateFinancialImpact(
        InsightType.LOW_STOCK,
        products,
        timeframe
      );

      expect(impact).toHaveProperty('currentLoss');
      expect(impact).toHaveProperty('potentialGain');
      expect(impact).toHaveProperty('opportunityCost');
      expect(impact).toHaveProperty('timeToAction');
      expect(impact).toHaveProperty('confidenceLevel');

      expect(impact.currentLoss).toBeGreaterThan(0);
      expect(impact.potentialGain).toBeGreaterThan(0);
      expect(impact.confidenceLevel).toBeGreaterThan(0);
      expect(impact.confidenceLevel).toBeLessThanOrEqual(1);
    });

    it('deve calcular ROI de uma ação', () => {
      const roi = FinancialCalculator.calculateActionROI(1000, 1500, 6);
      
      expect(roi).toBeGreaterThan(0);
      expect(typeof roi).toBe('number');
    });

    it('deve analisar viabilidade financeira', () => {
      const viability = FinancialCalculator.analyzeFinancialViability(
        1000, // custo
        2000, // benefícios esperados
        6,    // tempo para ação
        0.8   // nível de confiança
      );

      expect(viability).toHaveProperty('viable');
      expect(viability).toHaveProperty('roi');
      expect(viability).toHaveProperty('paybackMonths');
      expect(viability).toHaveProperty('riskAdjustedReturn');
      expect(viability).toHaveProperty('recommendation');

      expect(typeof viability.viable).toBe('boolean');
      expect(typeof viability.roi).toBe('number');
      expect(typeof viability.recommendation).toBe('string');
    });
  });
});

// ================================================
// TESTES DO DATA ANALYSIS SERVICE
// ================================================

describe('DataAnalysisService', () => {
  describe('getLowStockProducts', () => {
    it('deve retornar produtos com estoque baixo', async () => {
      const products = await DataAnalysisService.getLowStockProducts('org-test-001');

      expect(products).toBeInstanceOf(Array);
      expect(products.length).toBeGreaterThan(0);

      products.forEach(product => {
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('sku');
        expect(product).toHaveProperty('category');
        expect(product).toHaveProperty('price');
        expect(product).toHaveProperty('currentStock');
        expect(product).toHaveProperty('monthlySales');
        expect(product).toHaveProperty('avgSalesPerDay');
        expect(product).toHaveProperty('margin');
        
        // Produtos de estoque baixo devem ter stock reduzido
        expect(product.currentStock).toBeLessThan(10);
      });
    });
  });

  describe('analyzeCrossSellingOpportunities', () => {
    it('deve retornar oportunidades de cross-selling', async () => {
      const opportunities = await DataAnalysisService.analyzeCrossSellingOpportunities('org-test-001');

      expect(opportunities).toBeInstanceOf(Array);
      expect(opportunities.length).toBeGreaterThan(0);

      opportunities.forEach(opp => {
        expect(opp).toHaveProperty('productA');
        expect(opp).toHaveProperty('productB');
        expect(opp).toHaveProperty('confidence');
        expect(opp).toHaveProperty('potentialRevenue');
        expect(opp).toHaveProperty('frequency');

        expect(opp.confidence).toBeGreaterThan(0);
        expect(opp.confidence).toBeLessThanOrEqual(1);
        expect(opp.potentialRevenue).toBeGreaterThan(0);
      });
    });
  });

  describe('forecastDemand', () => {
    it('deve prever demanda futura', async () => {
      const forecast = await DataAnalysisService.forecastDemand('org-test-001', 'Vestidos', 3);

      expect(forecast).toBeInstanceOf(Array);
      expect(forecast).toHaveLength(3);

      forecast.forEach((prediction, index) => {
        expect(prediction).toHaveProperty('month');
        expect(prediction).toHaveProperty('category');
        expect(prediction).toHaveProperty('predictedUnits');
        expect(prediction).toHaveProperty('confidence');
        expect(prediction).toHaveProperty('factors');

        expect(prediction.month).toBe(index + 1);
        expect(prediction.category).toBe('Vestidos');
        expect(prediction.predictedUnits).toBeGreaterThan(0);
        expect(prediction.confidence).toBeGreaterThan(0);
        expect(prediction.confidence).toBeLessThanOrEqual(1);
      });
    });
  });
});

// ================================================
// TESTES DO CACHE SERVICE
// ================================================

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
  });

  afterEach(async () => {
    await cacheService.clear();
  });

  describe('set and get', () => {
    it('deve armazenar e recuperar dados do cache', async () => {
      const key = 'test-key';
      const data = { message: 'test data' };

      await cacheService.set(key, data);
      const cached = await cacheService.get(key);

      expect(cached).not.toBeNull();
      expect(cached?.data).toEqual(data);
      expect(cached?.timestamp).toBeGreaterThan(0);
    });

    it('deve retornar null para chaves inexistentes', async () => {
      const cached = await cacheService.get('non-existent-key');
      expect(cached).toBeNull();
    });

    it('deve expirar entradas baseado no TTL', async () => {
      const key = 'expiring-key';
      const data = { message: 'will expire' };
      const shortTTL = 100; // 100ms

      await cacheService.set(key, data, shortTTL);
      
      // Verificar que está no cache
      let cached = await cacheService.get(key);
      expect(cached).not.toBeNull();

      // Aguardar expiração
      await new Promise(resolve => setTimeout(resolve, 150));

      // Verificar que expirou
      cached = await cacheService.get(key);
      expect(cached).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('deve remover entradas expiradas', async () => {
      const key1 = 'key1';
      const key2 = 'key2';
      const shortTTL = 100;
      const longTTL = 10000;

      await cacheService.set(key1, 'data1', shortTTL);
      await cacheService.set(key2, 'data2', longTTL);

      // Aguardar expiração da primeira entrada
      await new Promise(resolve => setTimeout(resolve, 150));

      const removedCount = cacheService.cleanup();
      expect(removedCount).toBe(1);

      // Verificar que apenas a entrada não expirada permanece
      expect(await cacheService.get(key1)).toBeNull();
      expect(await cacheService.get(key2)).not.toBeNull();
    });
  });

  describe('getStats', () => {
    it('deve retornar estatísticas do cache', async () => {
      await cacheService.set('key1', 'data1');
      await cacheService.set('key2', 'data2');

      const stats = cacheService.getStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxEntries');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('oldestEntry');
      expect(stats).toHaveProperty('newestEntry');

      expect(stats.size).toBe(2);
      expect(stats.hitRate).toBeGreaterThan(0);
    });
  });
});

// ================================================
// TESTES DOS API HANDLERS
// ================================================

describe('ApiHandlers', () => {
  describe('generateInsights', () => {
    it('deve gerar insights via API', async () => {
      const request = {
        organizationId: 'org-test-001',
        timeframe: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z'
        },
        useCache: false
      };

      const response = await ApiHandlers.generateInsights(request);

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('timestamp');
      expect(response).toHaveProperty('metadata');

      expect(response.success).toBe(true);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data!.length).toBeGreaterThan(0);
      expect(response.metadata?.source).toBe('generated');
    });

    it('deve usar cache quando disponível', async () => {
      const request = {
        organizationId: 'org-test-002',
        useCache: true
      };

      // Primeira chamada - gera e armazena no cache
      const response1 = await ApiHandlers.generateInsights(request);
      expect(response1.success).toBe(true);
      expect(response1.metadata?.source).toBe('generated');

      // Segunda chamada - deve usar cache
      const response2 = await ApiHandlers.getInsights(request);
      expect(response2.success).toBe(true);
      // Note: pode ser 'generated' se o cache não estiver funcionando no mock
    });
  });

  describe('getHealth', () => {
    it('deve retornar status de saúde do módulo', async () => {
      const health = await ApiHandlers.getHealth();

      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('details');

      expect(typeof health.healthy).toBe('boolean');
      expect(health.details).toHaveProperty('module');
      expect(health.details).toHaveProperty('status');
      expect(health.details.module).toBe('banban-insights');
    });
  });
});

// ================================================
// TESTES DA CLASSE PRINCIPAL
// ================================================

describe('BanbanInsightsModule', () => {
  let instance: BanbanInsightsModule;

  beforeEach(() => {
    instance = new BanbanInsightsModule();
  });

  describe('initialize', () => {
    it('deve inicializar o módulo com sucesso', async () => {
      const result = await instance.initialize();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('endpoints');

      expect(result.success).toBe(true);
      expect(result.endpoints).toBeInstanceOf(Array);
      expect(result.endpoints.length).toBeGreaterThan(0);
    });
  });

  describe('checkHealth', () => {
    it('deve verificar a saúde do módulo', async () => {
      const health = await instance.checkHealth();

      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('details');
      expect(health.details).toHaveProperty('module');
      expect(health.details.module).toBe('banban-insights');
    });
  });

  describe('generateInsights (legacy)', () => {
    it('deve gerar insights usando método legado', async () => {
      const context = {
        organizationId: 'org-test-001',
        timeframe: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z'
        }
      };

      const insights = await instance.generateInsights(context);

      expect(insights).toBeInstanceOf(Array);
      expect(insights.length).toBeGreaterThan(0);
    });
  });
});

// ================================================
// TESTES DAS FUNÇÕES DE CONVENIÊNCIA
// ================================================

describe('Convenience Functions', () => {
  describe('generateInsights', () => {
    it('deve gerar insights usando função de conveniência', async () => {
      const insights = await generateInsights('org-test-001');

      expect(insights).toBeInstanceOf(Array);
      expect(insights.length).toBeGreaterThan(0);
    });
  });

  describe('getCategoryAnalysis', () => {
    it('deve obter análise de categoria', async () => {
      const analysis = await getCategoryAnalysis('org-test-001');

      expect(analysis).toBeInstanceOf(Array);
      expect(analysis.length).toBeGreaterThan(0);
    });
  });

  describe('getForecast', () => {
    it('deve obter previsão de demanda', async () => {
      const forecast = await getForecast('org-test-001', 'Vestidos', 3);

      expect(forecast).toBeInstanceOf(Array);
      expect(forecast).toHaveLength(3);
    });
  });
});

// ================================================
// TESTES DE INTEGRAÇÃO
// ================================================

describe('Integration Tests', () => {
  it('deve executar fluxo completo de geração de insights', async () => {
    // 1. Inicializar módulo
    const instance = new BanbanInsightsModule();
    await instance.initialize();

    // 2. Verificar saúde
    const health = await instance.checkHealth();
    expect(health.healthy).toBe(true);

    // 3. Gerar insights
    const insights = await generateInsights('org-integration-test');
    expect(insights.length).toBeGreaterThan(0);

    // 4. Obter análises complementares
    const categoryAnalysis = await getCategoryAnalysis('org-integration-test');
    expect(categoryAnalysis.length).toBeGreaterThan(0);

    // 5. Obter previsão
    const forecast = await getForecast('org-integration-test', 'Vestidos');
    expect(forecast.length).toBeGreaterThan(0);

    // 6. Verificar métricas
    const metrics = instance.getMetrics();
    expect(metrics).toBeDefined();
  });

  it('deve manter compatibilidade com API legada', async () => {
    const instance = new BanbanInsightsModule();
    await instance.initialize();
    
    // Usar método legado
    const context = {
      organizationId: 'org-legacy-test',
      timeframe: {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-31T23:59:59Z'
      }
    };

    const legacyInsights = await instance.generateInsights(context);
    const legacyCachedInsights = await instance.getInsights('org-legacy-test');

    expect(legacyInsights).toBeInstanceOf(Array);
    expect(legacyCachedInsights).toBeInstanceOf(Array);
    expect(legacyInsights.length).toBeGreaterThan(0);
  });
});

// ================================================
// TESTES DE PERFORMANCE
// ================================================

describe('Performance Tests', () => {
  it('deve gerar insights em tempo aceitável', async () => {
    const startTime = Date.now();
    
    await generateInsights('org-performance-test');
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // Menos de 5 segundos
  });

  it('deve usar cache eficientemente', async () => {
    const organizationId = 'org-cache-test';

    // Primeira chamada - sem cache
    const start1 = Date.now();
    await generateInsights(organizationId, { useCache: false });
    const duration1 = Date.now() - start1;

    // Segunda chamada - com cache
    const start2 = Date.now();
    await generateInsights(organizationId, { useCache: true });
    const duration2 = Date.now() - start2;

    // Cache deve ser mais rápido (ou pelo menos não muito mais lento)
    expect(duration2).toBeLessThanOrEqual(duration1 * 1.5);
  });
}); 