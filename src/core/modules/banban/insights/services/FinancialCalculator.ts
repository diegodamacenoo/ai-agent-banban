// ================================================
// FINANCIAL CALCULATOR - MÓDULO BANBAN INSIGHTS
// ================================================

import { 
  InsightType, 
  type FinancialImpactCalculation,
  type ProductData
} from '../types';

export class FinancialCalculator {
  /**
   * Calcula o impacto financeiro detalhado de um insight
   */
  static calculateFinancialImpact(
    insightType: InsightType,
    affectedProducts: ProductData[],
    timeframe: { start: string; end: string }
  ): FinancialImpactCalculation {
    switch (insightType) {
      case InsightType.LOW_STOCK:
        return this.calculateLowStockImpact(affectedProducts, timeframe);
      case InsightType.LOW_MARGIN:
        return this.calculateLowMarginImpact(affectedProducts, timeframe);
      case InsightType.SLOW_MOVING:
        return this.calculateSlowMovingImpact(affectedProducts, timeframe);
      case InsightType.OPPORTUNITY:
        return this.calculateOpportunityImpact(affectedProducts, timeframe);
      case InsightType.SEASONAL_TREND:
        return this.calculateSeasonalImpact(affectedProducts, timeframe);
      case InsightType.SUPPLIER_ISSUE:
        return this.calculateSupplierImpact(affectedProducts, timeframe);
      default:
        return {
          currentLoss: 0,
          potentialGain: 0,
          opportunityCost: 0,
          timeToAction: 30,
          confidenceLevel: 0.5
        };
    }
  }

  /**
   * Calcula impacto financeiro de estoque baixo
   */
  private static calculateLowStockImpact(
    products: ProductData[], 
    timeframe: { start: string; end: string }
  ): FinancialImpactCalculation {
    // Calcular perda por ruptura de estoque
    const dailyLossPerProduct = 50; // Valor base estimado
    const averageTimeToRestock = 7; // dias
    
    const currentLoss = products.length * dailyLossPerProduct * averageTimeToRestock;
    const potentialGain = currentLoss * 0.8; // 80% recuperável com ação rápida
    
    return {
      currentLoss,
      potentialGain,
      opportunityCost: currentLoss,
      timeToAction: 3, // dias críticos
      confidenceLevel: 0.85
    };
  }

  /**
   * Calcula impacto financeiro de margem baixa
   */
  private static calculateLowMarginImpact(
    products: ProductData[], 
    timeframe: { start: string; end: string }
  ): FinancialImpactCalculation {
    // Calcular ganho potencial com melhoria de margem
    const monthlyRevenue = products.reduce((sum, p) => sum + p.monthlySales, 0);
    const averageMarginGain = 0.05; // 5%
    
    const potentialGain = monthlyRevenue * averageMarginGain * 12; // Anual
    
    return {
      currentLoss: potentialGain / 12, // Perda mensal
      potentialGain,
      opportunityCost: potentialGain,
      timeToAction: 14, // 2 semanas para renegociar
      confidenceLevel: 0.70
    };
  }

  /**
   * Calcula impacto financeiro de produtos de movimento lento
   */
  private static calculateSlowMovingImpact(
    products: ProductData[], 
    timeframe: { start: string; end: string }
  ): FinancialImpactCalculation {
    // Calcular valor imobilizado em estoque parado
    const totalInventoryValue = products.reduce((sum, p) => 
      sum + (p.currentStock * p.price), 0
    );
    
    const potentialGain = totalInventoryValue * 0.7; // 70% de recuperação em promoção
    const currentLoss = totalInventoryValue * 0.02; // 2% de depreciação mensal
    
    return {
      currentLoss,
      potentialGain,
      opportunityCost: totalInventoryValue,
      timeToAction: 21, // 3 semanas para campanha
      confidenceLevel: 0.65
    };
  }

  /**
   * Calcula impacto financeiro de oportunidades
   */
  private static calculateOpportunityImpact(
    products: ProductData[], 
    timeframe: { start: string; end: string }
  ): FinancialImpactCalculation {
    // Calcular receita potencial de cross-selling
    const avgProductRevenue = products.reduce((sum, p) => sum + (p.price * p.avgSalesPerDay * 30), 0) / products.length;
    const crossSellMultiplier = 1.3; // 30% de aumento estimado
    
    const potentialGain = avgProductRevenue * crossSellMultiplier * products.length * 12; // Anual
    const currentLoss = 0; // Não há perda atual, apenas oportunidade perdida
    
    return {
      currentLoss,
      potentialGain,
      opportunityCost: potentialGain * 0.1, // 10% do potencial como custo de oportunidade
      timeToAction: 30, // 1 mês para implementar
      confidenceLevel: 0.60
    };
  }

  /**
   * Calcula impacto financeiro de tendências sazonais
   */
  private static calculateSeasonalImpact(
    products: ProductData[], 
    timeframe: { start: string; end: string }
  ): FinancialImpactCalculation {
    // Calcular impacto de ajuste sazonal
    const currentRevenue = products.reduce((sum, p) => sum + (p.price * p.avgSalesPerDay * 30), 0);
    const seasonalMultiplier = 1.25; // 25% de aumento na temporada
    
    const potentialGain = currentRevenue * (seasonalMultiplier - 1) * 3; // 3 meses de temporada
    const currentLoss = potentialGain * 0.1; // 10% de perda por não estar preparado
    
    return {
      currentLoss,
      potentialGain,
      opportunityCost: potentialGain * 0.2,
      timeToAction: 45, // 1.5 mês para preparar estoque
      confidenceLevel: 0.75
    };
  }

  /**
   * Calcula impacto financeiro de problemas com fornecedores
   */
  private static calculateSupplierImpact(
    products: ProductData[], 
    timeframe: { start: string; end: string }
  ): FinancialImpactCalculation {
    // Calcular impacto de ruptura de fornecimento
    const dailyRevenue = products.reduce((sum, p) => sum + (p.price * p.avgSalesPerDay), 0);
    const disruptionDays = 14; // 2 semanas de ruptura estimada
    
    const currentLoss = dailyRevenue * disruptionDays;
    const potentialGain = currentLoss * 0.6; // 60% recuperável com fornecedor alternativo
    
    return {
      currentLoss,
      potentialGain,
      opportunityCost: currentLoss,
      timeToAction: 7, // 1 semana para encontrar alternativa
      confidenceLevel: 0.80
    };
  }

  /**
   * Calcula ROI de uma ação recomendada
   */
  static calculateActionROI(
    investmentCost: number,
    expectedReturn: number,
    timeToReturn: number // em meses
  ): number {
    if (investmentCost === 0) return 0;
    
    const monthlyROI = (expectedReturn - investmentCost) / investmentCost / timeToReturn;
    return monthlyROI * 12 * 100; // ROI anual em percentual
  }

  /**
   * Calcula prioridade financeira baseada em múltiplos fatores
   */
  static calculateFinancialPriority(
    impact: FinancialImpactCalculation,
    affectedProducts: number,
    urgency: number // 0-1
  ): number {
    // Peso dos fatores
    const impactWeight = 0.4;
    const urgencyWeight = 0.3;
    const scaleWeight = 0.3;

    // Normalizar valores
    const impactScore = Math.min(impact.potentialGain / 10000, 1); // Normalizar para 0-1
    const urgencyScore = urgency;
    const scaleScore = Math.min(affectedProducts / 100, 1); // Normalizar para 0-1

    // Calcular score final
    const priority = (
      impactScore * impactWeight +
      urgencyScore * urgencyWeight +
      scaleScore * scaleWeight
    );

    return Math.round(priority * 100) / 100; // Arredondar para 2 casas decimais
  }

  /**
   * Estima tempo de payback de uma ação
   */
  static calculatePaybackPeriod(
    investmentCost: number,
    monthlyReturn: number
  ): number {
    if (monthlyReturn <= 0) return Infinity;
    return Math.ceil(investmentCost / monthlyReturn);
  }

  /**
   * Calcula valor presente líquido (NPV) simplificado
   */
  static calculateNPV(
    initialInvestment: number,
    monthlyReturns: number[],
    discountRate: number = 0.01 // 1% ao mês
  ): number {
    let npv = -initialInvestment;
    
    for (let i = 0; i < monthlyReturns.length; i++) {
      npv += monthlyReturns[i] / Math.pow(1 + discountRate, i + 1);
    }
    
    return Math.round(npv);
  }

  /**
   * Analisa viabilidade financeira de uma ação
   */
  static analyzeFinancialViability(
    cost: number,
    expectedBenefits: number,
    timeToAction: number,
    confidenceLevel: number
  ): {
    viable: boolean;
    roi: number;
    paybackMonths: number;
    riskAdjustedReturn: number;
    recommendation: string;
  } {
    const roi = this.calculateActionROI(cost, expectedBenefits, timeToAction);
    const monthlyReturn = (expectedBenefits - cost) / timeToAction;
    const paybackMonths = this.calculatePaybackPeriod(cost, monthlyReturn);
    const riskAdjustedReturn = expectedBenefits * confidenceLevel;

    let viable = false;
    let recommendation = '';

    if (roi > 20 && paybackMonths <= 12 && confidenceLevel > 0.7) {
      viable = true;
      recommendation = 'Altamente recomendado - ROI alto e baixo risco';
    } else if (roi > 10 && paybackMonths <= 18) {
      viable = true;
      recommendation = 'Recomendado - ROI moderado';
    } else if (roi > 0 && paybackMonths <= 24) {
      viable = true;
      recommendation = 'Considerar - ROI baixo mas positivo';
    } else {
      recommendation = 'Não recomendado - ROI insuficiente ou alto risco';
    }

    return {
      viable,
      roi: Math.round(roi * 100) / 100,
      paybackMonths,
      riskAdjustedReturn: Math.round(riskAdjustedReturn),
      recommendation
    };
  }
} 