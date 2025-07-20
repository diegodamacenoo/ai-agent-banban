// ================================================
// DATA ANALYSIS SERVICE - MÓDULO BANBAN INSIGHTS
// ================================================

import { 
  InsightSeverity,
  type ProductData,
  type CrossSellingOpportunity,
  type SeasonalTrend,
  type SupplierIssue
} from '../types';

export class DataAnalysisService {
  /**
   * Obtém produtos com estoque baixo
   */
  static async getLowStockProducts(organizationId: string): Promise<ProductData[]> {
    // Mock data - em produção, consultar banco de dados real
    return [
      {
        id: 'prod-001',
        name: 'Vestido Floral P',
        sku: 'VF-P-001',
        category: 'Vestidos',
        price: 149.90,
        currentStock: 3,
        monthlySales: 25,
        avgSalesPerDay: 0.8,
        margin: 0.35,
        stores: ['loja-centro', 'loja-shopping']
      },
      {
        id: 'prod-002',
        name: 'Blusa Casual M',
        sku: 'BC-M-002',
        category: 'Blusas',
        price: 89.90,
        currentStock: 5,
        monthlySales: 18,
        avgSalesPerDay: 0.6,
        margin: 0.42,
        stores: ['loja-centro']
      },
      {
        id: 'prod-003',
        name: 'Calça Jeans G',
        sku: 'CJ-G-003',
        category: 'Calças',
        price: 199.90,
        currentStock: 2,
        monthlySales: 12,
        avgSalesPerDay: 0.4,
        margin: 0.28,
        stores: ['loja-shopping']
      }
    ];
  }

  /**
   * Obtém produtos com margem baixa
   */
  static async getLowMarginProducts(organizationId: string): Promise<ProductData[]> {
    // Mock data - em produção, consultar banco de dados real
    return [
      {
        id: 'prod-004',
        name: 'Casaco Inverno',
        sku: 'CI-001',
        category: 'Casacos',
        price: 299.90,
        currentStock: 15,
        monthlySales: 8,
        avgSalesPerDay: 0.3,
        margin: 0.18, // Margem baixa
        potentialMarginGain: 0.12, // Potencial de melhoria
        stores: ['loja-centro', 'loja-shopping']
      },
      {
        id: 'prod-005',
        name: 'Tênis Esportivo',
        sku: 'TE-001',
        category: 'Calçados',
        price: 249.90,
        currentStock: 22,
        monthlySales: 15,
        avgSalesPerDay: 0.5,
        margin: 0.22, // Margem baixa
        potentialMarginGain: 0.08,
        stores: ['loja-centro']
      }
    ];
  }

  /**
   * Obtém produtos de movimento lento
   */
  static async getSlowMovingProducts(organizationId: string): Promise<ProductData[]> {
    // Mock data - em produção, consultar banco de dados real
    return [
      {
        id: 'prod-006',
        name: 'Saia Vintage',
        sku: 'SV-001',
        category: 'Saias',
        price: 129.90,
        currentStock: 28,
        monthlySales: 2,
        avgSalesPerDay: 0.07,
        margin: 0.35,
        lastSaleDate: '2024-11-15', // Há mais de 30 dias
        stores: ['loja-centro']
      },
      {
        id: 'prod-007',
        name: 'Bolsa de Couro',
        sku: 'BC-001',
        category: 'Acessórios',
        price: 189.90,
        currentStock: 12,
        monthlySales: 1,
        avgSalesPerDay: 0.03,
        margin: 0.45,
        lastSaleDate: '2024-10-20', // Há mais de 45 dias
        stores: ['loja-shopping']
      }
    ];
  }

  /**
   * Analisa oportunidades de cross-selling
   */
  static async analyzeCrossSellingOpportunities(organizationId: string): Promise<CrossSellingOpportunity[]> {
    // Mock data - em produção, usar algoritmos de análise de cesta de compras
    return [
      {
        productA: 'Vestido Floral',
        productB: 'Sandália Verão',
        confidence: 0.75,
        potentialRevenue: 2500,
        frequency: 15 // Vezes que foram comprados juntos
      },
      {
        productA: 'Blusa Casual',
        productB: 'Calça Jeans',
        confidence: 0.68,
        potentialRevenue: 1800,
        frequency: 12
      },
      {
        productA: 'Casaco Inverno',
        productB: 'Cachecol',
        confidence: 0.82,
        potentialRevenue: 1200,
        frequency: 8
      }
    ];
  }

  /**
   * Analisa tendências sazonais
   */
  static async analyzeSeasonalTrends(organizationId: string): Promise<SeasonalTrend[]> {
    // Mock data - em produção, analisar dados históricos de vendas
    return [
      {
        season: 'Verão 2025',
        category: 'Vestidos',
        growthRate: 35.5,
        peakMonths: ['Dezembro', 'Janeiro', 'Fevereiro'],
        recommendation: 'Aumentar estoque de vestidos leves e coloridos para a temporada de verão'
      },
      {
        season: 'Inverno 2025',
        category: 'Casacos',
        growthRate: 28.2,
        peakMonths: ['Junho', 'Julho', 'Agosto'],
        recommendation: 'Preparar coleção de inverno com foco em casacos e agasalhos'
      },
      {
        season: 'Primavera 2025',
        category: 'Calçados',
        growthRate: 22.1,
        peakMonths: ['Setembro', 'Outubro', 'Novembro'],
        recommendation: 'Investir em calçados confortáveis para a estação das flores'
      }
    ];
  }

  /**
   * Analisa problemas com fornecedores
   */
  static async analyzeSupplierIssues(organizationId: string): Promise<SupplierIssue[]> {
    // Mock data - em produção, integrar com sistema de fornecedores
    return [
      {
        supplierId: 'sup-001',
        supplierName: 'Fornecedor Têxtil ABC',
        issueType: 'delay',
        affectedProducts: ['prod-001', 'prod-002', 'prod-008'],
        severity: InsightSeverity.CRITICAL,
        estimatedImpact: 15000
      },
      {
        supplierId: 'sup-002',
        supplierName: 'Calçados Premium Ltda',
        issueType: 'quality',
        affectedProducts: ['prod-005', 'prod-009'],
        severity: InsightSeverity.ATTENTION,
        estimatedImpact: 8500
      }
    ];
  }

  /**
   * Analisa performance por categoria
   */
  static async analyzeCategoryPerformance(organizationId: string): Promise<any[]> {
    // Mock data - análise de performance por categoria
    return [
      {
        category: 'Vestidos',
        revenue: 45000,
        units: 300,
        growthRate: 15.5,
        marginAverage: 0.38,
        topProducts: ['Vestido Floral', 'Vestido Longo']
      },
      {
        category: 'Blusas',
        revenue: 32000,
        units: 280,
        growthRate: 8.3,
        marginAverage: 0.35,
        topProducts: ['Blusa Casual', 'Blusa Social']
      },
      {
        category: 'Calças',
        revenue: 28000,
        units: 140,
        growthRate: -2.1,
        marginAverage: 0.25,
        topProducts: ['Calça Jeans', 'Calça Social']
      }
    ];
  }

  /**
   * Analisa padrões de compra por cliente
   */
  static async analyzeCustomerBehavior(organizationId: string): Promise<any[]> {
    // Mock data - análise de comportamento do cliente
    return [
      {
        segment: 'Jovens (18-25)',
        preferences: ['Vestidos', 'Blusas Casuais'],
        averageTicket: 180.50,
        frequency: 'Mensal',
        seasonality: 'Alta no verão'
      },
      {
        segment: 'Executivas (26-40)',
        preferences: ['Blusas Sociais', 'Calças'],
        averageTicket: 320.80,
        frequency: 'Bimestral',
        seasonality: 'Estável'
      },
      {
        segment: 'Maduras (40+)',
        preferences: ['Vestidos Longos', 'Casacos'],
        averageTicket: 420.30,
        frequency: 'Trimestral',
        seasonality: 'Alta no inverno'
      }
    ];
  }

  /**
   * Analisa eficiência de estoque por loja
   */
  static async analyzeStoreEfficiency(organizationId: string): Promise<any[]> {
    // Mock data - análise de eficiência por loja
    return [
      {
        storeId: 'loja-centro',
        storeName: 'Loja Centro',
        inventoryTurnover: 4.2,
        salesPerSqMeter: 1250.50,
        stockAccuracy: 0.94,
        topCategories: ['Vestidos', 'Blusas']
      },
      {
        storeId: 'loja-shopping',
        storeName: 'Loja Shopping',
        inventoryTurnover: 3.8,
        salesPerSqMeter: 1180.30,
        stockAccuracy: 0.91,
        topCategories: ['Calças', 'Acessórios']
      }
    ];
  }

  /**
   * Prevê demanda futura baseada em histórico
   */
  static async forecastDemand(
    organizationId: string, 
    category: string, 
    months: number = 3
  ): Promise<any[]> {
    // Mock data - previsão de demanda
    const baseValue = 1000;
    const forecast = [];

    for (let i = 1; i <= months; i++) {
      // Simulação de crescimento sazonal
      const seasonalFactor = 1 + (Math.sin(i * Math.PI / 6) * 0.2);
      const trendFactor = 1 + (i * 0.05); // 5% de crescimento por mês
      const randomFactor = 0.9 + (Math.random() * 0.2); // ±10% de variação

      const predictedValue = Math.round(baseValue * seasonalFactor * trendFactor * randomFactor);

      forecast.push({
        month: i,
        category,
        predictedUnits: predictedValue,
        confidence: Math.max(0.95 - (i * 0.1), 0.7), // Confiança diminui com o tempo
        factors: {
          seasonal: seasonalFactor,
          trend: trendFactor,
          variance: randomFactor
        }
      });
    }

    return forecast;
  }

  /**
   * Identifica produtos com potencial de crescimento
   */
  static async identifyGrowthOpportunities(organizationId: string): Promise<any[]> {
    // Mock data - oportunidades de crescimento
    return [
      {
        productId: 'prod-010',
        productName: 'Vestido Midi',
        currentSales: 15,
        potentialSales: 35,
        growthPotential: 133.3, // Percentual
        factors: ['Tendência de moda', 'Baixa concorrência', 'Margem alta'],
        recommendedActions: [
          'Aumentar exposição na loja',
          'Criar campanha digital',
          'Expandir variações de cor'
        ]
      },
      {
        productId: 'prod-011',
        productName: 'Blazer Feminino',
        currentSales: 8,
        potentialSales: 22,
        growthPotential: 175.0,
        factors: ['Retorno ao trabalho presencial', 'Versatilidade', 'Qualidade premium'],
        recommendedActions: [
          'Parcerias com empresas',
          'Workshop de styling',
          'Bundle com calças sociais'
        ]
      }
    ];
  }

  /**
   * Calcula métricas de satisfação do cliente
   */
  static async calculateCustomerSatisfaction(organizationId: string): Promise<any> {
    // Mock data - métricas de satisfação
    return {
      overallScore: 4.2, // Escala 1-5
      nps: 45, // Net Promoter Score
      returnRate: 0.05, // 5% de devoluções
      repeatCustomerRate: 0.68, // 68% de clientes recorrentes
      averageReviewScore: 4.1,
      topComplaints: [
        { issue: 'Tamanho inadequado', frequency: 35 },
        { issue: 'Qualidade do tecido', frequency: 22 },
        { issue: 'Tempo de entrega', frequency: 18 }
      ],
      topPraises: [
        { aspect: 'Design moderno', frequency: 45 },
        { aspect: 'Atendimento cordial', frequency: 38 },
        { aspect: 'Variedade de produtos', frequency: 32 }
      ]
    };
  }
} 