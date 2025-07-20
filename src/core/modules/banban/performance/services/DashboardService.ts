// ================================================
// DASHBOARD SERVICE - MÓDULO BANBAN PERFORMANCE
// ================================================

import type { 
  ExecutiveDashboard, 
  BrandPerformance, 
  ProductMargins 
} from '../types';

export class DashboardService {
  /**
   * Gera dados para o dashboard executivo
   */
  static async getExecutiveDashboard(organizationId: string): Promise<ExecutiveDashboard> {
    return {
      kpis: {
        monthly_revenue: 125000,
        revenue_growth: 15.2,
        gross_margin: 36.8,
        inventory_turnover: 4.8,
        customer_acquisition: 145,
        customer_retention: 87.3
      },
      alerts: [
        {
          type: 'warning',
          message: 'Estoque baixo em Vestidos tamanho M',
          priority: 'medium'
        }
      ],
      trends: {
        revenue_trend: 'up',
        margin_trend: 'stable',
        inventory_trend: 'optimal'
      }
    };
  }

  /**
   * Calcula performance da marca
   */
  static async getBrandPerformance(organizationId: string): Promise<BrandPerformance> {
    return {
      brand_name: 'BanBan Fashion',
      overall_score: 8.7,
      metrics: {
        customer_satisfaction: 9.2,
        product_quality: 8.8,
        delivery_performance: 8.1,
        return_rate: 2.3
      },
      top_performers: [
        { product: 'Vestido Floral', score: 9.5 },
        { product: 'Blusa Casual', score: 9.1 }
      ]
    };
  }

  /**
   * Calcula margens de produtos
   */
  static async getProductMargins(organizationId: string): Promise<ProductMargins> {
    return {
      overall_margin: 36.8,
      by_category: [
        { category: 'Vestidos', margin: 42.1, trend: 'up' },
        { category: 'Blusas', margin: 38.5, trend: 'stable' },
        { category: 'Calças', margin: 28.9, trend: 'down' }
      ],
      top_margin_products: [
        { name: 'Vestido Premium', margin: 55.2, units_sold: 45 },
        { name: 'Blusa Designer', margin: 48.7, units_sold: 67 }
      ],
      margin_optimization_suggestions: [
        {
          product: 'Calça Jeans',
          current_margin: 22.1,
          suggested_margin: 28.5,
          action: 'Renegociar fornecedor'
        }
      ]
    };
  }

  /**
   * Gera alertas baseados em métricas
   */
  static async generateAlerts(organizationId: string) {
    const dashboard = await this.getExecutiveDashboard(organizationId);
    const margins = await this.getProductMargins(organizationId);
    
    const alerts = [...dashboard.alerts];
    
    // Alertas baseados em margens baixas
    margins.by_category.forEach(category => {
      if (category.margin < 30 && category.trend === 'down') {
        alerts.push({
          type: 'warning',
          message: `Margem baixa em ${category.category}: ${category.margin}%`,
          priority: 'high'
        });
      }
    });
    
    // Alertas baseados em KPIs
    if (dashboard.kpis.inventory_turnover < 3) {
      alerts.push({
        type: 'error',
        message: 'Giro de estoque abaixo do ideal',
        priority: 'high'
      });
    }
    
    if (dashboard.kpis.customer_retention < 80) {
      alerts.push({
        type: 'warning',
        message: 'Taxa de retenção de clientes baixa',
        priority: 'medium'
      });
    }
    
    return alerts;
  }

  /**
   * Calcula KPIs consolidados
   */
  static async getConsolidatedKPIs(organizationId: string) {
    const dashboard = await this.getExecutiveDashboard(organizationId);
    const brandPerformance = await this.getBrandPerformance(organizationId);
    const margins = await this.getProductMargins(organizationId);
    
    return {
      financial: {
        revenue: dashboard.kpis.monthly_revenue,
        revenue_growth: dashboard.kpis.revenue_growth,
        gross_margin: dashboard.kpis.gross_margin,
        overall_margin: margins.overall_margin
      },
      operational: {
        inventory_turnover: dashboard.kpis.inventory_turnover,
        brand_score: brandPerformance.overall_score,
        customer_satisfaction: brandPerformance.metrics.customer_satisfaction,
        delivery_performance: brandPerformance.metrics.delivery_performance
      },
      customer: {
        acquisition: dashboard.kpis.customer_acquisition,
        retention: dashboard.kpis.customer_retention,
        return_rate: brandPerformance.metrics.return_rate
      }
    };
  }
} 