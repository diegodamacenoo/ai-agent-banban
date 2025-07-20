// ================================================
// TESTES - MÓDULO BANBAN PERFORMANCE
// ================================================

import { 
  FashionMetricsService,
  InventoryTurnoverService,
  DashboardService,
  AnalyticsService
} from '../services';
import { FashionHelpers, PerformanceCalculators } from '../utils';

describe('BanBan Performance Module - Refatorado', () => {
  const testOrganizationId = 'test-org-123';

  describe('FashionMetricsService', () => {
    test('deve calcular métricas de moda', async () => {
      const metrics = await FashionMetricsService.calculateFashionMetrics(testOrganizationId);
      
      expect(metrics).toBeDefined();
      expect(metrics.revenue).toBeGreaterThan(0);
      expect(metrics.units).toBeGreaterThan(0);
      expect(metrics.collections).toBeInstanceOf(Array);
      expect(metrics.categories).toBeInstanceOf(Array);
    });

    test('deve retornar performance por coleção', async () => {
      const collections = await FashionMetricsService.getCollectionPerformance(testOrganizationId);
      
      expect(collections).toBeInstanceOf(Array);
      if (Array.isArray(collections)) {
        expect(collections.length).toBeGreaterThan(0);
      }
    });

    test('deve calcular matriz de tamanhos e cores', async () => {
      const matrix = await FashionMetricsService.getSizeColorMatrix(testOrganizationId);
      
      expect(matrix).toBeDefined();
      expect(matrix.sizes).toBeInstanceOf(Array);
      expect(matrix.colors).toBeInstanceOf(Array);
    });
  });

  describe('InventoryTurnoverService', () => {
    test('deve calcular turnover de inventário', async () => {
      const turnover = await InventoryTurnoverService.calculateInventoryTurnover(testOrganizationId);
      
      expect(turnover).toBeDefined();
      expect(turnover.overall_turnover).toBeGreaterThan(0);
      expect(turnover.by_category).toBeInstanceOf(Array);
      expect(turnover.slow_moving_items).toBeInstanceOf(Array);
    });

    test('deve identificar itens de movimento lento', async () => {
      const slowItems = await InventoryTurnoverService.getSlowMovingItems(testOrganizationId, 30);
      
      expect(slowItems).toBeInstanceOf(Array);
    });

    test('deve gerar recomendações de estoque', async () => {
      const recommendations = await InventoryTurnoverService.getStockRecommendations(testOrganizationId);
      
      expect(recommendations).toBeInstanceOf(Array);
    });
  });

  describe('DashboardService', () => {
    test('deve gerar dashboard executivo', async () => {
      const dashboard = await DashboardService.getExecutiveDashboard(testOrganizationId);
      
      expect(dashboard).toBeDefined();
      expect(dashboard.kpis).toBeDefined();
      expect(dashboard.alerts).toBeInstanceOf(Array);
      expect(dashboard.trends).toBeDefined();
    });

    test('deve calcular performance da marca', async () => {
      const brandPerf = await DashboardService.getBrandPerformance(testOrganizationId);
      
      expect(brandPerf).toBeDefined();
      expect(brandPerf.overall_score).toBeGreaterThan(0);
      expect(brandPerf.metrics).toBeDefined();
    });

    test('deve gerar alertas', async () => {
      const alerts = await DashboardService.generateAlerts(testOrganizationId);
      
      expect(alerts).toBeInstanceOf(Array);
    });
  });

  describe('AnalyticsService', () => {
    test('deve realizar análise sazonal', async () => {
      const seasonal = await AnalyticsService.getSeasonalAnalysis(testOrganizationId);
      
      expect(seasonal).toBeDefined();
      expect(seasonal.current_season).toBeDefined();
      expect(seasonal.trends).toBeInstanceOf(Array);
    });

    test('deve calcular previsões', async () => {
      const forecast = await AnalyticsService.getForecast(testOrganizationId, 3);
      
      expect(forecast).toBeInstanceOf(Array);
      expect(forecast.length).toBe(3);
    });

    test('deve obter tendências de crescimento', async () => {
      const trends = await AnalyticsService.getGrowthTrends(testOrganizationId, 'monthly');
      
      expect(trends).toBeInstanceOf(Array);
      expect(trends.length).toBeGreaterThan(0);
    });
  });

  describe('FashionHelpers', () => {
    test('deve normalizar tamanhos', () => {
      const sizes = ['PP', 'P', 'M', 'G', 'GG'];
      const normalized = FashionHelpers.normalizeSizes(sizes);
      
      expect(normalized).toEqual(['XS', 'S', 'M', 'L', 'XL']);
    });

    test('deve categorizar produtos', () => {
      expect(FashionHelpers.categorizeProduct('Vestido Floral')).toBe('vestido');
      expect(FashionHelpers.categorizeProduct('Blusa Casual')).toBe('blusa');
      expect(FashionHelpers.categorizeProduct('Calça Jeans')).toBe('calça');
    });

    test('deve determinar estação pelo mês', () => {
      expect(FashionHelpers.getSeasonFromMonth(1)).toBe('Verão');
      expect(FashionHelpers.getSeasonFromMonth(6)).toBe('Inverno');
      expect(FashionHelpers.getSeasonFromMonth(9)).toBe('Primavera');
    });

    test('deve calcular score de tendência', () => {
      const score = FashionHelpers.calculateTrendScore(100, 80, 90);
      expect(typeof score).toBe('number');
    });
  });

  describe('PerformanceCalculators', () => {
    test('deve calcular ROI', () => {
      const roi = PerformanceCalculators.calculateROI(1200, 1000);
      expect(roi).toBe(20);
    });

    test('deve calcular margem de lucro', () => {
      const margin = PerformanceCalculators.calculateProfitMargin(1000, 700);
      expect(margin).toBe(30);
    });

    test('deve calcular giro de estoque', () => {
      const turnover = PerformanceCalculators.calculateInventoryTurnover(5000, 1000);
      expect(turnover).toBe(5);
    });

    test('deve calcular taxa de crescimento', () => {
      const growth = PerformanceCalculators.calculateGrowthRate(110, 100);
      expect(growth).toBe(10);
    });

    test('deve calcular média móvel', () => {
      const values = [10, 20, 30, 40, 50];
      const movingAvg = PerformanceCalculators.calculateMovingAverage(values, 3);
      expect(movingAvg).toEqual([20, 30, 40]);
    });

    test('deve calcular tendência', () => {
      const upTrend = [10, 15, 20, 25, 30, 35];
      expect(PerformanceCalculators.calculateTrend(upTrend)).toBe('up');
      
      const downTrend = [35, 30, 25, 20, 15, 10];
      expect(PerformanceCalculators.calculateTrend(downTrend)).toBe('down');
    });

    test('deve calcular score de performance', () => {
      const metrics = {
        revenue_growth: 15,
        margin_improvement: 5,
        inventory_turnover: 4.5,
        customer_satisfaction: 8.5
      };
      
      const score = PerformanceCalculators.calculatePerformanceScore(metrics);
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Integração do Módulo', () => {
    test('deve inicializar corretamente', async () => {
      const { initializeModule } = await import('../index');
      
      const result = await initializeModule({
        refreshInterval: 600,
        cacheEnabled: true
      });
      
      expect(result).toBeDefined();
      expect(result.name).toBe('BanBan Performance');
      expect(result.status).toBe('active');
      expect(result.configuration.refreshInterval).toBe(600);
    });

    test('deve ter metadados corretos', async () => {
      const { moduleMetadata } = await import('../index');
      
      expect(moduleMetadata.id).toBe('banban-performance');
      expect(moduleMetadata.type).toBe('custom');
      expect(moduleMetadata.refactored).toBe(true);
      expect(moduleMetadata.architecture).toBe('modular');
    });
  });
});

// ================================================
// TESTES DE PERFORMANCE
// ================================================

describe('Performance Tests', () => {
  test('cálculos devem ser executados em tempo hábil', async () => {
    const start = Date.now();
    
    await Promise.all([
      FashionMetricsService.calculateFashionMetrics('test'),
      InventoryTurnoverService.calculateInventoryTurnover('test'),
      DashboardService.getExecutiveDashboard('test'),
      AnalyticsService.getSeasonalAnalysis('test')
    ]);
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000); // Menos de 1 segundo
  });
});

// ================================================
// TESTES DE MOCK PARA DADOS REAIS
// ================================================

describe('Mock Data Validation', () => {
  test('dados mockados devem ter estrutura consistente', async () => {
    const metrics = await FashionMetricsService.calculateFashionMetrics('test');
    
    // Validar estrutura das coleções
    metrics.collections.forEach(collection => {
      expect(collection).toHaveProperty('id');
      expect(collection).toHaveProperty('name');
      expect(collection).toHaveProperty('season');
      expect(collection).toHaveProperty('revenue');
      expect(collection).toHaveProperty('units_sold');
      expect(collection).toHaveProperty('profit_margin');
      expect(collection).toHaveProperty('top_products');
    });
    
    // Validar estrutura das categorias
    metrics.categories.forEach(category => {
      expect(category).toHaveProperty('category');
      expect(category).toHaveProperty('revenue');
      expect(category).toHaveProperty('units');
      expect(category).toHaveProperty('growth_rate');
      expect(category).toHaveProperty('inventory_turnover');
    });
  });
}); 