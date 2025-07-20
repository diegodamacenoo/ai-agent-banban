import { z } from 'zod';

// Tipos de insights
export enum InsightType {
  SALES_TREND = 'sales_trend',
  STOCK_ALERT = 'stock_alert',
  SUPPLIER_PERFORMANCE = 'supplier_performance',
  ABC_ANALYSIS = 'abc_analysis',
  FORECAST_ALERT = 'forecast_alert'
}

// Schema para validação de insights
export const InsightSchema = z.object({
  type: z.nativeEnum(InsightType),
  title: z.string(),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  timestamp: z.date(),
  data: z.record(z.any()).optional(),
  actionable: z.boolean().default(false),
  action_url: z.string().optional(),
  action_label: z.string().optional()
});

export type Insight = z.infer<typeof InsightSchema>;

// Classe principal do processador de insights
export class InsightsProcessor {
  static processInsights(data: {
    salesData?: any[],
    stockData?: any[],
    supplierData?: any[],
    abcData?: any[],
    forecastData?: any[]
  }): Insight[] {
    const insights: Insight[] = [];
    const now = new Date();

    // Processar dados de vendas
    if (data.salesData?.length) {
      insights.push({
        type: InsightType.SALES_TREND,
        title: 'Aumento nas vendas detectado',
        description: 'As vendas aumentaram 15% nos últimos 7 dias.',
        severity: 'medium',
        timestamp: now,
        actionable: true,
        action_url: '/dashboard/sales',
        action_label: 'Ver análise detalhada'
      });
    }

    // Processar dados de estoque
    if (data.stockData?.length) {
      insights.push({
        type: InsightType.STOCK_ALERT,
        title: 'Produtos com estoque crítico',
        description: '3 produtos estão com cobertura menor que 7 dias.',
        severity: 'high',
        timestamp: now,
        actionable: true,
        action_url: '/dashboard/inventory',
        action_label: 'Gerenciar estoque'
      });
    }

    // Processar dados de fornecedores
    if (data.supplierData?.length) {
      insights.push({
        type: InsightType.SUPPLIER_PERFORMANCE,
        title: 'Performance de fornecedor abaixo da meta',
        description: 'Fornecedor Beta apresentou atrasos em 23% das entregas.',
        severity: 'high',
        timestamp: now,
        actionable: true,
        action_url: '/dashboard/suppliers',
        action_label: 'Ver detalhes'
      });
    }

    // Processar dados de análise ABC
    if (data.abcData?.length) {
      insights.push({
        type: InsightType.ABC_ANALYSIS,
        title: 'Novos produtos classe A identificados',
        description: '2 produtos foram reclassificados como A na última análise.',
        severity: 'medium',
        timestamp: now,
        actionable: true,
        action_url: '/dashboard/abc-analysis',
        action_label: 'Ver análise'
      });
    }

    // Processar dados de previsão
    if (data.forecastData?.length) {
      insights.push({
        type: InsightType.FORECAST_ALERT,
        title: 'Previsão de demanda atualizada',
        description: 'Aumento previsto de 20% na demanda para o próximo mês.',
        severity: 'medium',
        timestamp: now,
        actionable: true,
        action_url: '/dashboard/forecast',
        action_label: 'Ver previsão'
      });
    }

    return insights;
  }

  static sortInsightsByPriority(insights: Insight[]): Insight[] {
    const severityWeight = {
      high: 3,
      medium: 2,
      low: 1
    };

    return [...insights].sort((a, b) => {
      // Primeiro por severidade
      const severityDiff = severityWeight[b.severity] - severityWeight[a.severity];
      if (severityDiff !== 0) return severityDiff;

      // Depois por data (mais recente primeiro)
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }

  static filterInsightsByType(insights: Insight[], type: InsightType): Insight[] {
    return insights.filter(insight => insight.type === type);
  }

  static groupInsightsByType(insights: Insight[]): Record<InsightType, Insight[]> {
    return insights.reduce((groups, insight) => {
      const type = insight.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(insight);
      return groups;
    }, {} as Record<InsightType, Insight[]>);
  }

  static getActionableInsights(insights: Insight[]): Insight[] {
    return insights.filter(insight => insight.actionable);
  }

  static getCriticalInsights(insights: Insight[]): Insight[] {
    return insights.filter(insight => insight.severity === 'high');
  }
}

export default InsightsProcessor; 