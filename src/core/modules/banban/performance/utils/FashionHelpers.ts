// ================================================
// FASHION HELPERS - MÓDULO BANBAN PERFORMANCE
// ================================================

export class FashionHelpers {
  /**
   * Converte tamanhos para formato padrão
   */
  static normalizeSizes(sizes: string[]): string[] {
    const sizeMap: Record<string, string> = {
      'PP': 'XS',
      'P': 'S', 
      'M': 'M',
      'G': 'L',
      'GG': 'XL',
      'XGG': 'XXL'
    };

    return sizes.map(size => sizeMap[size.toUpperCase()] || size);
  }

  /**
   * Categoriza produtos por tipo
   */
  static categorizeProduct(productName: string): string {
    const categories = {
      'vestido': ['vestido', 'dress'],
      'blusa': ['blusa', 'camisa', 'top', 'shirt'],
      'calça': ['calça', 'jeans', 'legging', 'pants'],
      'saia': ['saia', 'skirt'],
      'shorts': ['shorts', 'bermuda'],
      'casaco': ['casaco', 'jaqueta', 'blazer', 'jacket'],
      'acessórios': ['bolsa', 'cinto', 'chapéu', 'bag', 'belt']
    };

    const productLower = productName.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => productLower.includes(keyword))) {
        return category;
      }
    }

    return 'outros';
  }

  /**
   * Determina a estação baseada no mês
   */
  static getSeasonFromMonth(month: number): string {
    const seasons = {
      'Verão': [12, 1, 2],
      'Outono': [3, 4, 5],
      'Inverno': [6, 7, 8],
      'Primavera': [9, 10, 11]
    };

    for (const [season, months] of Object.entries(seasons)) {
      if (months.includes(month)) {
        return season;
      }
    }

    return 'Indefinido';
  }

  /**
   * Calcula score de tendência baseado em vendas
   */
  static calculateTrendScore(
    currentSales: number, 
    previousSales: number, 
    categoryAverage: number
  ): number {
    const growthRate = ((currentSales - previousSales) / previousSales) * 100;
    const categoryComparison = (currentSales / categoryAverage) * 100;
    
    // Score combinado (50% crescimento, 50% comparação com categoria)
    return Math.round((growthRate * 0.5) + (categoryComparison * 0.5));
  }

  /**
   * Gera recomendações de pricing baseado em performance
   */
  static generatePricingRecommendations(
    currentPrice: number,
    margin: number,
    salesVelocity: number,
    stockLevel: number
  ) {
    const recommendations = [];

    // Margem muito baixa
    if (margin < 25) {
      recommendations.push({
        action: 'increase_price',
        reason: 'Margem abaixo do ideal',
        suggested_change: 10,
        priority: 'high'
      });
    }

    // Vendas lentas com estoque alto
    if (salesVelocity < 2 && stockLevel > 50) {
      recommendations.push({
        action: 'decrease_price',
        reason: 'Acelerar vendas e reduzir estoque',
        suggested_change: -15,
        priority: 'medium'
      });
    }

    // Vendas rápidas com estoque baixo
    if (salesVelocity > 10 && stockLevel < 10) {
      recommendations.push({
        action: 'increase_price',
        reason: 'Alta demanda, baixo estoque',
        suggested_change: 5,
        priority: 'low'
      });
    }

    return recommendations;
  }

  /**
   * Analisa padrões de cores populares
   */
  static analyzeColorTrends(colorSales: Array<{color: string, units: number}>) {
    const totalSales = colorSales.reduce((sum, item) => sum + item.units, 0);
    
    return colorSales
      .map(item => ({
        ...item,
        percentage: (item.units / totalSales) * 100,
        trend: this.getColorTrend(item.color, item.units, totalSales)
      }))
      .sort((a, b) => b.units - a.units);
  }

  /**
   * Determina tendência de cor
   */
  private static getColorTrend(color: string, sales: number, totalSales: number): string {
    const percentage = (sales / totalSales) * 100;
    
    if (percentage > 30) return 'hot';
    if (percentage > 15) return 'trending';
    if (percentage > 5) return 'stable';
    return 'declining';
  }

  /**
   * Calcula índice de sazonalidade
   */
  static calculateSeasonalityIndex(
    monthlyData: Array<{month: number, sales: number}>
  ): Record<string, number> {
    const totalSales = monthlyData.reduce((sum, item) => sum + item.sales, 0);
    const averageMonthlySales = totalSales / 12;

    const seasonalIndex: Record<string, number> = {};

    monthlyData.forEach(item => {
      const season = this.getSeasonFromMonth(item.month);
      if (!seasonalIndex[season]) {
        seasonalIndex[season] = 0;
      }
      seasonalIndex[season] += (item.sales / averageMonthlySales);
    });

    // Normalizar por número de meses por estação
    Object.keys(seasonalIndex).forEach(season => {
      seasonalIndex[season] = seasonalIndex[season] / 3; // 3 meses por estação
    });

    return seasonalIndex;
  }
} 