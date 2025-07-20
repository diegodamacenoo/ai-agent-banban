// ================================================
// PERFORMANCE CALCULATORS - MÓDULO BANBAN PERFORMANCE
// ================================================

export class PerformanceCalculators {
  /**
   * Calcula ROI (Return on Investment)
   */
  static calculateROI(revenue: number, investment: number): number {
    if (investment === 0) return 0;
    return ((revenue - investment) / investment) * 100;
  }

  /**
   * Calcula margem de lucro
   */
  static calculateProfitMargin(revenue: number, cost: number): number {
    if (revenue === 0) return 0;
    return ((revenue - cost) / revenue) * 100;
  }

  /**
   * Calcula giro de estoque
   */
  static calculateInventoryTurnover(
    costOfGoodsSold: number, 
    averageInventoryValue: number
  ): number {
    if (averageInventoryValue === 0) return 0;
    return costOfGoodsSold / averageInventoryValue;
  }

  /**
   * Calcula taxa de crescimento
   */
  static calculateGrowthRate(currentValue: number, previousValue: number): number {
    if (previousValue === 0) return 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  }

  /**
   * Calcula média móvel
   */
  static calculateMovingAverage(values: number[], period: number): number[] {
    const result: number[] = [];
    
    for (let i = period - 1; i < values.length; i++) {
      const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    
    return result;
  }

  /**
   * Calcula variação percentual
   */
  static calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  /**
   * Calcula score de performance baseado em múltiplos KPIs
   */
  static calculatePerformanceScore(metrics: {
    revenue_growth: number;
    margin_improvement: number;
    inventory_turnover: number;
    customer_satisfaction: number;
  }): number {
    const weights = {
      revenue_growth: 0.3,
      margin_improvement: 0.25,
      inventory_turnover: 0.25,
      customer_satisfaction: 0.2
    };

    // Normalizar métricas para escala 0-100
    const normalizedMetrics = {
      revenue_growth: Math.min(Math.max(metrics.revenue_growth, 0), 100),
      margin_improvement: Math.min(Math.max(metrics.margin_improvement + 50, 0), 100),
      inventory_turnover: Math.min(Math.max(metrics.inventory_turnover * 20, 0), 100),
      customer_satisfaction: Math.min(Math.max(metrics.customer_satisfaction * 10, 0), 100)
    };

    // Calcular score ponderado
    const score = Object.entries(normalizedMetrics).reduce((total, [key, value]) => {
      return total + (value * weights[key as keyof typeof weights]);
    }, 0);

    return Math.round(score);
  }

  /**
   * Calcula tendência baseada em dados históricos
   */
  static calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-3); // Últimos 3 valores
    const older = values.slice(-6, -3); // 3 valores anteriores
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const change = this.calculatePercentageChange(olderAvg, recentAvg);
    
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }

  /**
   * Calcula desvio padrão
   */
  static calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Calcula coeficiente de variação
   */
  static calculateCoefficientOfVariation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = this.calculateStandardDeviation(values);
    
    if (mean === 0) return 0;
    return (stdDev / mean) * 100;
  }

  /**
   * Calcula projeção linear simples
   */
  static calculateLinearProjection(
    values: number[], 
    periodsAhead: number
  ): number[] {
    if (values.length < 2) return [];
    
    // Calcular tendência linear
    const n = values.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, value, index) => sum + (value * (index + 1)), 0);
    const sumXX = (n * (n + 1) * (2 * n + 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Gerar projeções
    const projections: number[] = [];
    for (let i = 1; i <= periodsAhead; i++) {
      const projection = slope * (n + i) + intercept;
      projections.push(Math.max(0, projection)); // Não permitir valores negativos
    }
    
    return projections;
  }

  /**
   * Calcula índice de eficiência
   */
  static calculateEfficiencyIndex(
    actualOutput: number,
    expectedOutput: number,
    actualInput: number,
    expectedInput: number
  ): number {
    if (expectedOutput === 0 || actualInput === 0) return 0;
    
    const outputRatio = actualOutput / expectedOutput;
    const inputRatio = expectedInput / actualInput;
    
    return (outputRatio * inputRatio) * 100;
  }
} 