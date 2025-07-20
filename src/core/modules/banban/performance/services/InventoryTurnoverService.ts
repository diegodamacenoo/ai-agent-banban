// ================================================
// INVENTORY TURNOVER SERVICE - MÓDULO BANBAN PERFORMANCE
// ================================================

import type { InventoryTurnover } from '../types';

interface StockRecommendation {
  type: 'slow_moving' | 'overstock' | 'understock';
  product: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
  details: string;
}

export class InventoryTurnoverService {
  /**
   * Calcula turnover de inventário para uma organização
   */
  static async calculateInventoryTurnover(organizationId: string): Promise<InventoryTurnover> {
    return {
      overall_turnover: 4.8,
      by_category: [
        {
          category: 'Vestidos',
          turnover_rate: 4.2,
          days_on_hand: 87,
          stock_level: 'optimal'
        },
        {
          category: 'Blusas',
          turnover_rate: 5.1, 
          days_on_hand: 72,
          stock_level: 'optimal'
        }
      ],
      slow_moving_items: [
        {
          product_id: 'prod-slow-001',
          name: 'Casaco Inverno 2024',
          days_without_sale: 45,
          current_stock: 25,
          recommended_action: 'discount'
        }
      ],
      seasonal_trends: [
        {
          season: 'Verão',
          peak_months: ['Dezembro', 'Janeiro', 'Fevereiro'],
          average_turnover: 6.2,
          growth_projection: 12.5
        }
      ]
    };
  }

  /**
   * Identifica itens de movimento lento
   */
  static async getSlowMovingItems(organizationId: string, daysThreshold: number = 30) {
    const turnover = await this.calculateInventoryTurnover(organizationId);
    return turnover.slow_moving_items.filter(item => 
      item.days_without_sale >= daysThreshold
    );
  }

  /**
   * Calcula turnover por categoria específica
   */
  static async getCategoryTurnover(organizationId: string, category?: string) {
    const turnover = await this.calculateInventoryTurnover(organizationId);
    
    if (category) {
      return turnover.by_category.find(c => c.category === category);
    }
    
    return turnover.by_category;
  }

  /**
   * Analisa tendências sazonais
   */
  static async getSeasonalTrends(organizationId: string) {
    const turnover = await this.calculateInventoryTurnover(organizationId);
    return turnover.seasonal_trends;
  }

  /**
   * Gera recomendações de ação para estoque
   */
  static async getStockRecommendations(organizationId: string) {
    const turnover = await this.calculateInventoryTurnover(organizationId);
    
    const recommendations: StockRecommendation[] = [];
    
    // Recomendações baseadas em itens de movimento lento
    turnover.slow_moving_items.forEach(item => {
      recommendations.push({
        type: 'slow_moving',
        product: item.name,
        action: item.recommended_action,
        priority: item.days_without_sale > 60 ? 'high' : 'medium',
        details: `${item.days_without_sale} dias sem venda, ${item.current_stock} unidades em estoque`
      });
    });
    
    // Recomendações baseadas em categorias
    turnover.by_category.forEach(category => {
      if (category.stock_level === 'high') {
        recommendations.push({
          type: 'overstock',
          product: category.category,
          action: 'reduce_orders',
          priority: 'medium',
          details: `Categoria com estoque alto: ${category.days_on_hand} dias disponíveis`
        });
      } else if (category.stock_level === 'low') {
        recommendations.push({
          type: 'understock',
          product: category.category,
          action: 'increase_orders',
          priority: 'high',
          details: `Categoria com estoque baixo: ${category.days_on_hand} dias disponíveis`
        });
      }
    });
    
    return recommendations;
  }
} 