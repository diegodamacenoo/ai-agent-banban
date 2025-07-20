// ================================================
// INSIGHTS ENGINE - MÓDULO BANBAN INSIGHTS
// ================================================

import type { 
  BanbanInsight, 
  InsightContext, 
  ProductData,
  LoggerInterface,
  MetricsInterface
} from '../types';
import { InsightType, InsightSeverity } from '../types';
import { DataAnalysisService } from './DataAnalysisService';
import { FinancialCalculator } from './FinancialCalculator';

// Mock das dependências para evitar import circular
const mockLogger: LoggerInterface = {
  info: (module: string, message: string, metadata?: any) => console.info(`[${module}] ${message}`, metadata),
  error: (module: string, message: string, metadata?: any) => console.error(`[${module}] ${message}`, metadata),
  warn: (module: string, message: string, metadata?: any) => console.warn(`[${module}] ${message}`, metadata),
  debug: (module: string, message: string, metadata?: any) => console.debug(`[${module}] ${message}`, metadata)
};

const mockMetrics: MetricsInterface = {
  record: (module: string, metric: string, value: number) => {
    console.debug(`[METRICS] ${module}.${metric}: ${value}`);
  },
  getMetrics: (module: string) => ({})
};

export class InsightsEngine {
  private logger: LoggerInterface;
  private metrics: MetricsInterface;

  constructor(logger?: LoggerInterface, metrics?: MetricsInterface) {
    this.logger = logger || mockLogger;
    this.metrics = metrics || mockMetrics;
  }

  /**
   * Gera todos os insights para uma organização
   */
  async generateInsights(context: InsightContext): Promise<BanbanInsight[]> {
    const startTime = Date.now();
    
    try {
      this.logger.info('insights', 'Starting insights generation', {
        organizationId: context.organizationId,
        timeframe: context.timeframe
      });

      const insights: BanbanInsight[] = [];

      // Gerar diferentes tipos de insights em paralelo
      const [
        lowStockInsights,
        lowMarginInsights,
        slowMovingInsights,
        opportunityInsights,
        seasonalInsights,
        supplierInsights
      ] = await Promise.all([
        this.generateLowStockInsights(context),
        this.generateLowMarginInsights(context),
        this.generateSlowMovingInsights(context),
        this.generateOpportunityInsights(context),
        this.generateSeasonalInsights(context),
        this.generateSupplierInsights(context)
      ]);

      insights.push(...lowStockInsights);
      insights.push(...lowMarginInsights);
      insights.push(...slowMovingInsights);
      insights.push(...opportunityInsights);
      insights.push(...seasonalInsights);
      insights.push(...supplierInsights);

      // Priorizar insights por impacto financeiro e criticidade
      const prioritizedInsights = this.prioritizeInsights(insights);

      const processingTime = Date.now() - startTime;
      this.metrics.record('insights', 'generation_time', processingTime);
      this.metrics.record('insights', 'insights_generated', prioritizedInsights.length);

      this.logger.info('insights', 'Insights generated successfully', {
        total: prioritizedInsights.length,
        critical: prioritizedInsights.filter(i => i.severity === InsightSeverity.CRITICAL).length,
        processingTimeMs: processingTime
      });

      return prioritizedInsights;

    } catch (error) {
      this.logger.error('insights', 'Failed to generate insights', {
        organizationId: context.organizationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      this.metrics.record('insights', 'generation_errors', 1);
      throw error;
    }
  }

  /**
   * Gera insights de estoque baixo
   */
  private async generateLowStockInsights(context: InsightContext): Promise<BanbanInsight[]> {
    const lowStockProducts = await DataAnalysisService.getLowStockProducts(context.organizationId);
    
    if (lowStockProducts.length === 0) {
      return [];
    }

    // Agrupar por categoria e loja
    const byCategory = this.groupByCategoryAndStore(lowStockProducts);
    const insights: BanbanInsight[] = [];

    for (const [category, storeData] of Object.entries(byCategory)) {
      const stores = Object.keys(storeData);
      const totalProducts = Object.values(storeData).reduce((sum, products) => sum + products.length, 0);
      
      // Calcular impacto financeiro
      const financialImpact = this.calculateLowStockImpact(storeData);

      const insight: BanbanInsight = {
        id: `low-stock-${category}-${Date.now()}`,
        type: InsightType.LOW_STOCK,
        title: `${totalProducts} produtos da categoria ${category} com estoque baixo em ${stores.length} lojas`,
        description: `Produtos críticos que podem gerar ruptura e perda de vendas. Ação imediata recomendada.`,
        severity: InsightSeverity.CRITICAL,
        priority: 0.9,
        financialImpact,
        affectedProducts: totalProducts,
        affectedStores: stores.length,
        actionSuggestions: [
          'Verificar fornecedores disponíveis',
          'Transferir estoque entre lojas',
          'Acelerar pedidos de reposição',
          'Considerar produtos substitutos'
        ],
        createdAt: new Date().toISOString(),
        organizationId: context.organizationId,
        metadata: {
          category,
          stores,
          threshold: 10 // Mock threshold
        }
      };

      insights.push(insight);
    }

    return insights;
  }

  /**
   * Gera insights de margem baixa
   */
  private async generateLowMarginInsights(context: InsightContext): Promise<BanbanInsight[]> {
    const lowMarginProducts = await DataAnalysisService.getLowMarginProducts(context.organizationId);
    
    if (lowMarginProducts.length === 0) {
      return [];
    }

    const totalProducts = lowMarginProducts.length;
    const financialImpact = lowMarginProducts.reduce((sum, product) => 
      sum + ((product.potentialMarginGain || 0) * product.monthlySales), 0
    );

    const insight: BanbanInsight = {
      id: `low-margin-${Date.now()}`,
      type: InsightType.LOW_MARGIN,
      title: `${totalProducts} produtos com margem abaixo do ideal`,
      description: `Produtos com margem inferior a 30% representam oportunidade de melhoria na rentabilidade.`,
      severity: InsightSeverity.ATTENTION,
      priority: 0.7,
      financialImpact: Math.round(financialImpact),
      affectedProducts: totalProducts,
      affectedStores: 1, // Simplificado
      actionSuggestions: [
        'Renegociar preços com fornecedores',
        'Revisar estrutura de custos',
        'Considerar reajuste de preços',
        'Analisar mix de produtos'
      ],
      createdAt: new Date().toISOString(),
      organizationId: context.organizationId,
      metadata: {
        averageMargin: lowMarginProducts.reduce((sum, p) => sum + p.margin, 0) / totalProducts,
        targetMargin: 0.30
      }
    };

    return [insight];
  }

  /**
   * Gera insights de produtos de movimento lento
   */
  private async generateSlowMovingInsights(context: InsightContext): Promise<BanbanInsight[]> {
    const slowMovingProducts = await DataAnalysisService.getSlowMovingProducts(context.organizationId);
    
    if (slowMovingProducts.length === 0) {
      return [];
    }

    const totalProducts = slowMovingProducts.length;
    const inventoryValue = slowMovingProducts.reduce((sum, product) => 
      sum + (product.currentStock * product.price), 0
    );

    const insight: BanbanInsight = {
      id: `slow-moving-${Date.now()}`,
      type: InsightType.SLOW_MOVING,
      title: `${totalProducts} produtos com movimento lento`,
      description: `Produtos sem vendas nos últimos 30 dias representam capital imobilizado.`,
      severity: InsightSeverity.MODERATE,
      priority: 0.5,
      financialImpact: Math.round(inventoryValue * 0.7), // 70% de recuperação estimada
      affectedProducts: totalProducts,
      affectedStores: 1, // Simplificado
      actionSuggestions: [
        'Criar campanhas promocionais',
        'Considerar liquidação',
        'Transferir para outlets',
        'Analisar sazonalidade'
      ],
      createdAt: new Date().toISOString(),
      organizationId: context.organizationId,
      metadata: {
        inventoryValue: Math.round(inventoryValue),
        averageDaysWithoutSale: 45
      }
    };

    return [insight];
  }

  /**
   * Gera insights de oportunidades
   */
  private async generateOpportunityInsights(context: InsightContext): Promise<BanbanInsight[]> {
    const opportunities = await DataAnalysisService.analyzeCrossSellingOpportunities(context.organizationId);
    
    if (!opportunities || opportunities.length === 0) {
      return [];
    }

    const totalRevenue = opportunities.reduce((sum: number, opp: any) => sum + opp.potentialRevenue, 0);

    const insight: BanbanInsight = {
      id: `opportunity-${Date.now()}`,
      type: InsightType.OPPORTUNITY,
      title: `${opportunities.length} oportunidades de cross-selling identificadas`,
      description: `Combinações de produtos com alta probabilidade de venda conjunta.`,
      severity: InsightSeverity.OPPORTUNITY,
      priority: 0.6,
      financialImpact: Math.round(totalRevenue),
      affectedProducts: opportunities.length * 2, // 2 produtos por oportunidade
      affectedStores: 1, // Simplificado
      actionSuggestions: [
        'Criar bundles promocionais',
        'Implementar recomendações no e-commerce',
        'Treinar equipe de vendas',
        'Posicionar produtos próximos'
      ],
      createdAt: new Date().toISOString(),
      organizationId: context.organizationId,
      metadata: {
        opportunities: opportunities.slice(0, 3), // Top 3
        averageConfidence: opportunities.reduce((sum: number, opp: any) => sum + opp.confidence, 0) / opportunities.length
      }
    };

    return [insight];
  }

  /**
   * Gera insights sazonais (NOVO)
   */
  private async generateSeasonalInsights(context: InsightContext): Promise<BanbanInsight[]> {
    const seasonalTrends = await DataAnalysisService.analyzeSeasonalTrends(context.organizationId);
    
    if (!seasonalTrends || seasonalTrends.length === 0) {
      return [];
    }

    const insights: BanbanInsight[] = [];

    for (const trend of seasonalTrends) {
      const insight: BanbanInsight = {
        id: `seasonal-${trend.season}-${trend.category}-${Date.now()}`,
        type: InsightType.SEASONAL_TREND,
        title: `Tendência sazonal: ${trend.category} - ${trend.season}`,
        description: trend.recommendation,
        severity: InsightSeverity.ATTENTION,
        priority: 0.4,
        financialImpact: Math.round(trend.growthRate * 1000), // Estimativa
        affectedProducts: 10, // Estimativa
        affectedStores: 1,
        actionSuggestions: [
          'Ajustar estoque para a sazonalidade',
          'Preparar campanhas temáticas',
          'Revisar mix de produtos',
          'Planejar compras antecipadas'
        ],
        createdAt: new Date().toISOString(),
        organizationId: context.organizationId,
        metadata: {
          season: trend.season,
          category: trend.category,
          growthRate: trend.growthRate,
          peakMonths: trend.peakMonths
        }
      };

      insights.push(insight);
    }

    return insights;
  }

  /**
   * Gera insights de fornecedores (NOVO)
   */
  private async generateSupplierInsights(context: InsightContext): Promise<BanbanInsight[]> {
    const supplierIssues = await DataAnalysisService.analyzeSupplierIssues(context.organizationId);
    
    if (!supplierIssues || supplierIssues.length === 0) {
      return [];
    }

    const insights: BanbanInsight[] = [];

    for (const issue of supplierIssues) {
      const insight: BanbanInsight = {
        id: `supplier-${issue.supplierId}-${Date.now()}`,
        type: InsightType.SUPPLIER_ISSUE,
        title: `Problema identificado com fornecedor ${issue.supplierName}`,
        description: `Tipo: ${issue.issueType}. Produtos afetados: ${issue.affectedProducts.length}`,
        severity: issue.severity,
        priority: issue.severity === InsightSeverity.CRITICAL ? 0.95 : 0.6,
        financialImpact: Math.round(issue.estimatedImpact),
        affectedProducts: issue.affectedProducts.length,
        affectedStores: 1,
        actionSuggestions: [
          'Contatar fornecedor imediatamente',
          'Buscar fornecedores alternativos',
          'Revisar contratos e SLAs',
          'Implementar plano de contingência'
        ],
        createdAt: new Date().toISOString(),
        organizationId: context.organizationId,
        metadata: {
          supplierId: issue.supplierId,
          supplierName: issue.supplierName,
          issueType: issue.issueType,
          affectedProducts: issue.affectedProducts
        }
      };

      insights.push(insight);
    }

    return insights;
  }

  /**
   * Prioriza insights por impacto financeiro e criticidade
   */
  private prioritizeInsights(insights: BanbanInsight[]): BanbanInsight[] {
    return insights.sort((a, b) => {
      // Primeiro por severidade (peso 60%)
      const severityWeight = {
        [InsightSeverity.CRITICAL]: 4,
        [InsightSeverity.ATTENTION]: 3,
        [InsightSeverity.MODERATE]: 2,
        [InsightSeverity.OPPORTUNITY]: 1
      };

      const severityScore = (severityWeight[b.severity] - severityWeight[a.severity]) * 0.6;
      
      // Depois por impacto financeiro (peso 40%)
      const financialScore = (b.financialImpact - a.financialImpact) / 10000 * 0.4;
      
      return severityScore + financialScore;
    });
  }

  /**
   * Agrupa produtos por categoria e loja
   */
  private groupByCategoryAndStore(products: ProductData[]): Record<string, Record<string, ProductData[]>> {
    const grouped: Record<string, Record<string, ProductData[]>> = {};

    for (const product of products) {
      if (!grouped[product.category]) {
        grouped[product.category] = {};
      }

      const stores = product.stores || ['loja-principal'];
      for (const store of stores) {
        if (!grouped[product.category][store]) {
          grouped[product.category][store] = [];
        }
        grouped[product.category][store].push(product);
      }
    }

    return grouped;
  }

  /**
   * Calcula impacto financeiro de estoque baixo
   */
  private calculateLowStockImpact(storeData: Record<string, ProductData[]>): number {
    let totalImpact = 0;

    for (const [store, products] of Object.entries(storeData)) {
      for (const product of products) {
        const deficit = Math.max(0, 10 - product.currentStock); // Assumindo estoque mínimo de 10
        const avgPrice = product.price;
        const avgSalesPerDay = product.avgSalesPerDay;
        const daysUntilRestock = 7; // Assumindo 7 dias para reposição
        
        totalImpact += deficit * avgPrice * avgSalesPerDay * daysUntilRestock;
      }
    }
    
    return Math.round(totalImpact);
  }
} 