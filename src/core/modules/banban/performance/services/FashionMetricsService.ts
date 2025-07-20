// ================================================
// FASHION METRICS SERVICE - MÓDULO BANBAN PERFORMANCE
// ================================================

import type { FashionMetrics } from '../types';

export class FashionMetricsService {
  /**
   * Calcula métricas de moda para uma organização
   */
  static async calculateFashionMetrics(organizationId: string): Promise<FashionMetrics> {
    // Mock data para demonstração - em produção seria uma query real ao banco
    return {
      revenue: 125000,
      units: 850,
      profit: 45000,
      margin: 36,
      collections: [
        {
          id: 'col-001',
          name: 'Verão 2025',
          season: 'summer',
          revenue: 75000,
          units_sold: 500,
          profit_margin: 38,
          top_products: [
            {
              id: 'prod-001',
              name: 'Vestido Floral',
              sku: 'VF-001',
              revenue: 15000,
              units_sold: 100,
              profit_margin: 42,
              sizes_sold: [
                { size: 'P', units_sold: 25, percentage: 25 },
                { size: 'M', units_sold: 40, percentage: 40 },
                { size: 'G', units_sold: 35, percentage: 35 }
              ],
              colors_sold: [
                { color: 'Azul', units_sold: 60, percentage: 60 },
                { color: 'Rosa', units_sold: 40, percentage: 40 }
              ]
            }
          ]
        }
      ],
      categories: [
        {
          category: 'Vestidos',
          revenue: 45000,
          units: 300,
          growth_rate: 15.5,
          inventory_turnover: 4.2
        },
        {
          category: 'Blusas', 
          revenue: 35000,
          units: 280,
          growth_rate: 8.3,
          inventory_turnover: 5.1
        }
      ]
    };
  }

  /**
   * Calcula performance por coleção
   */
  static async getCollectionPerformance(organizationId: string, collectionId?: string) {
    const metrics = await this.calculateFashionMetrics(organizationId);
    
    if (collectionId) {
      return metrics.collections.find(c => c.id === collectionId);
    }
    
    return metrics.collections;
  }

  /**
   * Calcula métricas por categoria
   */
  static async getCategoryMetrics(organizationId: string, category?: string) {
    const metrics = await this.calculateFashionMetrics(organizationId);
    
    if (category) {
      return metrics.categories.find(c => c.category === category);
    }
    
    return metrics.categories;
  }

  /**
   * Calcula análise de tamanhos e cores
   */
  static async getSizeColorMatrix(organizationId: string) {
    const metrics = await this.calculateFashionMetrics(organizationId);
    
    // Agregação de dados de tamanhos e cores de todos os produtos
    const sizeAnalysis = new Map<string, number>();
    const colorAnalysis = new Map<string, number>();
    
    metrics.collections.forEach(collection => {
      collection.top_products.forEach(product => {
        product.sizes_sold.forEach(size => {
          const current = sizeAnalysis.get(size.size) || 0;
          sizeAnalysis.set(size.size, current + size.units_sold);
        });
        
        product.colors_sold.forEach(color => {
          const current = colorAnalysis.get(color.color) || 0;
          colorAnalysis.set(color.color, current + color.units_sold);
        });
      });
    });
    
    return {
      sizes: Array.from(sizeAnalysis.entries()).map(([size, units]) => ({
        size,
        units_sold: units,
        percentage: (units / metrics.units) * 100
      })),
      colors: Array.from(colorAnalysis.entries()).map(([color, units]) => ({
        color,
        units_sold: units,
        percentage: (units / metrics.units) * 100
      }))
    };
  }
} 