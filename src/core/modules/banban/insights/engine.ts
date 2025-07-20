import { BanbanLogger, BanbanMetrics, BANBAN_MODULE_CONFIG } from '../index';
import { BanbanInsight, InsightType, InsightSeverity, InsightContext } from './index';

const logger = BanbanLogger.getInstance();

/**
 * Motor de Insights Funcionais para a Fase 2
 * Implementa análises específicas acionadas pelos listeners
 */
export class FunctionalInsightsEngine {
  private static instance: FunctionalInsightsEngine;

  private constructor() {}

  static getInstance(): FunctionalInsightsEngine {
    if (!FunctionalInsightsEngine.instance) {
      FunctionalInsightsEngine.instance = new FunctionalInsightsEngine();
    }
    return FunctionalInsightsEngine.instance;
  }

  /**
   * Gera insights de estoque baixo em tempo real
   */
  async generateStockInsights(organizationId: string): Promise<BanbanInsight[]> {
    const startTime = Date.now();
    
    try {
      logger.info('insights-engine', 'Generating stock insights', { organizationId });

      // Mock data - em produção seria uma query real ao banco
      const lowStockProducts = await this.fetchLowStockProducts(organizationId);
      
      if (lowStockProducts.length === 0) {
        return [];
      }

      // Agrupar produtos por categoria e criticidade
      const criticalProducts = lowStockProducts.filter(p => p.stock <= BANBAN_MODULE_CONFIG.businessRules.criticalStockLevel);
      const lowProducts = lowStockProducts.filter(p => 
        p.stock > BANBAN_MODULE_CONFIG.businessRules.criticalStockLevel && 
        p.stock <= BANBAN_MODULE_CONFIG.businessRules.stockThreshold
      );

      const insights: BanbanInsight[] = [];

      // Insight crítico para produtos com estoque muito baixo
      if (criticalProducts.length > 0) {
        const categories = [...new Set(criticalProducts.map(p => p.category))];
        const stores = [...new Set(criticalProducts.map(p => p.store))];
        
        const insight: BanbanInsight = {
          id: `critical-stock-${Date.now()}`,
          type: InsightType.LOW_STOCK,
          title: `🔴 CRÍTICO: ${criticalProducts.length} produtos com estoque crítico em ${stores.length} lojas`,
          description: `Produtos das categorias ${categories.join(', ')} com risco iminente de ruptura. Ação imediata necessária.`,
          severity: InsightSeverity.CRITICAL,
          priority: 0.95,
          financialImpact: this.calculateStockImpact(criticalProducts),
          affectedProducts: criticalProducts.length,
          affectedStores: stores.length,
          actionSuggestions: [
            'Transferir estoque urgentemente entre lojas',
            'Contatar fornecedores imediatamente',
            'Acelerar pedidos de emergência',
            'Considerar produtos substitutos'
          ],
          createdAt: new Date().toISOString(),
          organizationId,
          metadata: {
            products: criticalProducts.map(p => ({ sku: p.sku, stock: p.stock, store: p.store })),
            threshold: BANBAN_MODULE_CONFIG.businessRules.criticalStockLevel
          }
        };
        
        insights.push(insight);
      }

      // Insight de atenção para produtos com estoque baixo
      if (lowProducts.length > 0) {
        const categories = [...new Set(lowProducts.map(p => p.category))];
        const stores = [...new Set(lowProducts.map(p => p.store))];
        
        const insight: BanbanInsight = {
          id: `low-stock-${Date.now()}`,
          type: InsightType.LOW_STOCK,
          title: `🟡 ATENÇÃO: ${lowProducts.length} produtos com estoque baixo em ${stores.length} lojas`,
          description: `Produtos das categorias ${categories.join(', ')} precisam de reposição em breve.`,
          severity: InsightSeverity.ATTENTION,
          priority: 0.7,
          financialImpact: this.calculateStockImpact(lowProducts),
          affectedProducts: lowProducts.length,
          affectedStores: stores.length,
          actionSuggestions: [
            'Programar pedidos de reposição',
            'Analisar histórico de vendas',
            'Verificar previsão de demanda',
            'Otimizar distribuição entre lojas'
          ],
          createdAt: new Date().toISOString(),
          organizationId,
          metadata: {
            products: lowProducts.map(p => ({ sku: p.sku, stock: p.stock, store: p.store })),
            threshold: BANBAN_MODULE_CONFIG.businessRules.stockThreshold
          }
        };
        
        insights.push(insight);
      }

      const duration = Date.now() - startTime;
      BanbanMetrics.record('insights-engine', 'stock_analysis_time', duration);
      BanbanMetrics.record('insights-engine', 'stock_insights_generated', insights.length);

      logger.info('insights-engine', 'Stock insights generated', {
        organizationId,
        insightsCount: insights.length,
        critical: criticalProducts.length,
        attention: lowProducts.length,
        duration
      });

      return insights;

    } catch (error) {
      logger.error('insights-engine', 'Error generating stock insights', {
        organizationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Gera insights de margem baixa
   */
  async generateMarginInsights(organizationId: string): Promise<BanbanInsight[]> {
    const startTime = Date.now();
    
    try {
      logger.info('insights-engine', 'Generating margin insights', { organizationId });

      const lowMarginProducts = await this.fetchLowMarginProducts(organizationId);
      
      if (lowMarginProducts.length === 0) {
        return [];
      }

      const totalImpact = lowMarginProducts.reduce((sum, product) => 
        sum + (product.potentialGain * product.monthlyVolume), 0
      );

      const insight: BanbanInsight = {
        id: `low-margin-${Date.now()}`,
        type: InsightType.LOW_MARGIN,
        title: `🟠 MODERADO: ${lowMarginProducts.length} produtos com margem abaixo de ${(BANBAN_MODULE_CONFIG.businessRules.lowMarginThreshold * 100).toFixed(0)}%`,
        description: `Oportunidade de aumentar rentabilidade com ajustes de preço ou negociação com fornecedores.`,
        severity: InsightSeverity.MODERATE,
        priority: 0.6,
        financialImpact: totalImpact,
        affectedProducts: lowMarginProducts.length,
        affectedStores: [...new Set(lowMarginProducts.map(p => p.store))].length,
        actionSuggestions: [
          'Revisar preços de venda',
          'Negociar melhores condições com fornecedores',
          'Analisar custos de operação',
          'Considerar produtos alternativos'
        ],
        createdAt: new Date().toISOString(),
        organizationId,
        metadata: {
          products: lowMarginProducts.map(p => ({ 
            sku: p.sku, 
            currentMargin: p.margin, 
            potentialGain: p.potentialGain,
            monthlyVolume: p.monthlyVolume
          })),
          threshold: BANBAN_MODULE_CONFIG.businessRules.lowMarginThreshold
        }
      };

      const duration = Date.now() - startTime;
      BanbanMetrics.record('insights-engine', 'margin_analysis_time', duration);
      BanbanMetrics.record('insights-engine', 'margin_insights_generated', 1);

      logger.info('insights-engine', 'Margin insights generated', {
        organizationId,
        productsAnalyzed: lowMarginProducts.length,
        financialImpact: totalImpact,
        duration
      });

      return [insight];

    } catch (error) {
      logger.error('insights-engine', 'Error generating margin insights', {
        organizationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Gera insights de produtos slow-moving
   */
  async generateSlowMovingInsights(organizationId: string): Promise<BanbanInsight[]> {
    const startTime = Date.now();
    
    try {
      logger.info('insights-engine', 'Generating slow-moving insights', { organizationId });

      const slowMovingProducts = await this.fetchSlowMovingProducts(organizationId);
      
      if (slowMovingProducts.length === 0) {
        return [];
      }

      const totalValue = slowMovingProducts.reduce((sum, product) => 
        sum + (product.cost * product.stock), 0
      );

      const promotionPotential = slowMovingProducts.reduce((sum, product) => 
        sum + (product.salePrice * product.stock * 0.7), 0 // 30% de desconto
      );

      const insight: BanbanInsight = {
        id: `slow-moving-${Date.now()}`,
        type: InsightType.SLOW_MOVING,
        title: `🟢 OPORTUNIDADE: ${slowMovingProducts.length} produtos parados há mais de ${BANBAN_MODULE_CONFIG.businessRules.slowMovingDays} dias`,
        description: `Produtos com baixo giro representando R$ ${totalValue.toLocaleString()} em estoque parado. Potencial de recuperação: R$ ${promotionPotential.toLocaleString()}.`,
        severity: InsightSeverity.OPPORTUNITY,
        priority: 0.4,
        financialImpact: promotionPotential - totalValue,
        affectedProducts: slowMovingProducts.length,
        affectedStores: [...new Set(slowMovingProducts.map(p => p.store))].length,
        actionSuggestions: [
          'Criar promoções direcionadas',
          'Transferir para lojas com maior demanda',
          'Analisar sazonalidade dos produtos',
          'Considerar liquidação parcial'
        ],
        createdAt: new Date().toISOString(),
        organizationId,
        metadata: {
          products: slowMovingProducts.map(p => ({ 
            sku: p.sku, 
            daysSinceLastSale: p.daysSinceLastSale,
            stock: p.stock,
            value: p.cost * p.stock
          })),
          slowMovingThreshold: BANBAN_MODULE_CONFIG.businessRules.slowMovingDays,
          totalStockValue: totalValue,
          promotionPotential
        }
      };

      const duration = Date.now() - startTime;
      BanbanMetrics.record('insights-engine', 'slow_moving_analysis_time', duration);
      BanbanMetrics.record('insights-engine', 'slow_moving_insights_generated', 1);

      logger.info('insights-engine', 'Slow-moving insights generated', {
        organizationId,
        productsAnalyzed: slowMovingProducts.length,
        stockValue: totalValue,
        promotionPotential,
        duration
      });

      return [insight];

    } catch (error) {
      logger.error('insights-engine', 'Error generating slow-moving insights', {
        organizationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Gera insights de performance geral
   */
  async generatePerformanceInsights(organizationId: string): Promise<BanbanInsight[]> {
    const startTime = Date.now();
    
    try {
      logger.info('insights-engine', 'Generating performance insights', { organizationId });

      // Mock de análise de performance - seria baseado em dados reais
      const performanceData = await this.fetchPerformanceData(organizationId);
      
      const insights: BanbanInsight[] = [];

      // Insight de performance por categoria
      if (performanceData.topCategories.length > 0) {
        const topCategory = performanceData.topCategories[0];
        
        const insight: BanbanInsight = {
          id: `performance-category-${Date.now()}`,
          type: InsightType.OPPORTUNITY,
          title: `🟢 DESTAQUE: Categoria ${topCategory.name} teve crescimento de ${topCategory.growth}% no período`,
          description: `Oportunidade de expansão da categoria ${topCategory.name} que gerou R$ ${topCategory.revenue.toLocaleString()} em vendas.`,
          severity: InsightSeverity.OPPORTUNITY,
          priority: 0.5,
          financialImpact: topCategory.expansionPotential,
          affectedProducts: topCategory.productCount,
          affectedStores: topCategory.storeCount,
          actionSuggestions: [
            'Aumentar mix de produtos da categoria',
            'Negociar melhores condições com fornecedores',
            'Criar campanhas promocionais específicas',
            'Analisar expansão para outras lojas'
          ],
          createdAt: new Date().toISOString(),
          organizationId,
          metadata: {
            category: topCategory.name,
            growth: topCategory.growth,
            revenue: topCategory.revenue,
            period: performanceData.period
          }
        };
        
        insights.push(insight);
      }

      const duration = Date.now() - startTime;
      BanbanMetrics.record('insights-engine', 'performance_analysis_time', duration);
      BanbanMetrics.record('insights-engine', 'performance_insights_generated', insights.length);

      return insights;

    } catch (error) {
      logger.error('insights-engine', 'Error generating performance insights', {
        organizationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // ========== MÉTODOS DE DADOS MOCK (SUBSTITUIR POR QUERIES REAIS) ==========

  private async fetchLowStockProducts(organizationId: string): Promise<any[]> {
    // Mock data - em produção seria uma query ao banco
    return [
      { sku: 'BB001-AZUL-37', category: 'Calçados', stock: 2, store: 'Loja Centro', cost: 50, salePrice: 120 },
      { sku: 'BB002-PRETO-38', category: 'Calçados', stock: 1, store: 'Loja Shopping', cost: 60, salePrice: 150 },
      { sku: 'BB003-MARROM-39', category: 'Calçados', stock: 8, store: 'Loja Centro', cost: 70, salePrice: 180 },
      { sku: 'AC001-PRETO', category: 'Acessórios', stock: 3, store: 'Loja Shopping', cost: 25, salePrice: 80 }
    ];
  }

  private async fetchLowMarginProducts(organizationId: string): Promise<any[]> {
    // Mock data
    return [
      { sku: 'BB004-BRANCO-40', margin: 0.25, potentialGain: 15, monthlyVolume: 10, store: 'Loja Centro' },
      { sku: 'BB005-VERDE-38', margin: 0.28, potentialGain: 20, monthlyVolume: 8, store: 'Loja Shopping' },
      { sku: 'AC002-AZUL', margin: 0.30, potentialGain: 5, monthlyVolume: 15, store: 'Loja Centro' }
    ];
  }

  private async fetchSlowMovingProducts(organizationId: string): Promise<any[]> {
    // Mock data
    return [
      { sku: 'BB006-ROXO-41', daysSinceLastSale: 45, stock: 5, cost: 80, salePrice: 200, store: 'Loja Centro' },
      { sku: 'BB007-ROSA-36', daysSinceLastSale: 35, stock: 3, cost: 60, salePrice: 150, store: 'Loja Shopping' },
      { sku: 'AC003-DOURADO', daysSinceLastSale: 50, stock: 10, cost: 30, salePrice: 90, store: 'Loja Centro' }
    ];
  }

  private async fetchPerformanceData(organizationId: string): Promise<any> {
    // Mock data
    return {
      period: 'Últimos 30 dias',
      topCategories: [
        {
          name: 'Calçados Femininos',
          growth: 15.5,
          revenue: 45000,
          productCount: 120,
          storeCount: 2,
          expansionPotential: 12000
        }
      ]
    };
  }

  private calculateStockImpact(products: any[]): number {
    // Calcula impacto baseado na venda média perdida por dia
    return products.reduce((sum, product) => {
      const avgDailySales = 2; // Mock: 2 vendas por dia em média
      const daysUntilRestock = 7; // Mock: 7 dias para repor
      const lostRevenue = product.salePrice * avgDailySales * daysUntilRestock;
      return sum + lostRevenue;
    }, 0);
  }
}

/**
 * Funções públicas para uso pelos listeners
 */
export async function generateInsights(organizationId: string, type: string): Promise<BanbanInsight[]> {
  const engine = FunctionalInsightsEngine.getInstance();
  
  switch (type) {
    case 'stock_analysis':
      return await engine.generateStockInsights(organizationId);
    case 'margin_analysis':
      return await engine.generateMarginInsights(organizationId);
    case 'slow_mover_analysis':
      return await engine.generateSlowMovingInsights(organizationId);
    case 'performance_analysis':
      return await engine.generatePerformanceInsights(organizationId);
    default:
      logger.warn('insights-engine', 'Unknown insight type requested', { type, organizationId });
      return [];
  }
}

export default FunctionalInsightsEngine; 