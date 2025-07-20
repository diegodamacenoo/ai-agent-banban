import { BanbanLogger, BanbanMetrics, BANBAN_MODULE_CONFIG } from '../../banban/index';
import { BanbanAlertsModule } from './index';

const logger = BanbanLogger.getInstance();

/**
 * Interface para alertas processados
 */
export interface ProcessedAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  organizationId: string;
  createdAt: string;
  threshold: number;
  currentValue: number;
  metadata: Record<string, any>;
}

export enum AlertType {
  LOW_STOCK = 'LOW_STOCK',
  CRITICAL_STOCK = 'CRITICAL_STOCK',
  LOW_MARGIN = 'LOW_MARGIN',
  SLOW_MOVING = 'SLOW_MOVING',
  HIGH_RETURN_RATE = 'HIGH_RETURN_RATE'
}

export enum AlertSeverity {
  CRITICAL = 'CRITICAL',
  WARNING = 'WARNING',
  INFO = 'INFO'
}

/**
 * Processador de Alertas Funcionais
 * Gera alertas baseados em eventos processados
 */
export class AlertProcessor {
  private static instance: AlertProcessor;

  private constructor() {}

  static getInstance(): AlertProcessor {
    if (!AlertProcessor.instance) {
      AlertProcessor.instance = new AlertProcessor();
    }
    return AlertProcessor.instance;
  }

  /**
   * Processa alertas de estoque baixo
   */
  async processLowStockAlerts(organizationId: string): Promise<ProcessedAlert[]> {
    const startTime = Date.now();
    
    try {
      logger.info('alert-processor', 'Processing low stock alerts', { organizationId });

      const lowStockProducts = await this.fetchLowStockData(organizationId);
      const alerts: ProcessedAlert[] = [];

      for (const product of lowStockProducts) {
        if (product.stock <= BANBAN_MODULE_CONFIG.businessRules.stockThreshold) {
          const alert: ProcessedAlert = {
            id: `low-stock-${product.sku}-${Date.now()}`,
            type: AlertType.LOW_STOCK,
            severity: AlertSeverity.WARNING,
            title: `Estoque baixo: ${product.name}`,
            message: `Produto ${product.sku} com apenas ${product.stock} unidades em ${product.store}. Limite: ${BANBAN_MODULE_CONFIG.businessRules.stockThreshold}`,
            organizationId,
            createdAt: new Date().toISOString(),
            threshold: BANBAN_MODULE_CONFIG.businessRules.stockThreshold,
            currentValue: product.stock,
            metadata: {
              sku: product.sku,
              name: product.name,
              store: product.store,
              category: product.category,
              lastSale: product.lastSale
            }
          };
          
          alerts.push(alert);
        }
      }

      const duration = Date.now() - startTime;
      BanbanMetrics.record('alert-processor', 'low_stock_processing_time', duration);
      BanbanMetrics.record('alert-processor', 'low_stock_alerts_generated', alerts.length);

      logger.info('alert-processor', 'Low stock alerts processed', {
        organizationId,
        alertsGenerated: alerts.length,
        duration
      });

      return alerts;

    } catch (error) {
      logger.error('alert-processor', 'Error processing low stock alerts', {
        organizationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Processa alertas de estoque crítico
   */
  async processCriticalStockAlerts(organizationId: string): Promise<ProcessedAlert[]> {
    const startTime = Date.now();
    
    try {
      logger.info('alert-processor', 'Processing critical stock alerts', { organizationId });

      const criticalStockProducts = await this.fetchCriticalStockData(organizationId);
      const alerts: ProcessedAlert[] = [];

      for (const product of criticalStockProducts) {
        if (product.stock <= BANBAN_MODULE_CONFIG.businessRules.criticalStockLevel) {
          const alert: ProcessedAlert = {
            id: `critical-stock-${product.sku}-${Date.now()}`,
            type: AlertType.CRITICAL_STOCK,
            severity: AlertSeverity.CRITICAL,
            title: `🔴 CRÍTICO: Estoque esgotando`,
            message: `URGENTE: Produto ${product.sku} com apenas ${product.stock} unidades em ${product.store}. Risco de ruptura!`,
            organizationId,
            createdAt: new Date().toISOString(),
            threshold: BANBAN_MODULE_CONFIG.businessRules.criticalStockLevel,
            currentValue: product.stock,
            metadata: {
              sku: product.sku,
              name: product.name,
              store: product.store,
              category: product.category,
              avgDailySales: product.avgDailySales,
              daysUntilEmpty: Math.floor(product.stock / (product.avgDailySales || 1))
            }
          };
          
          alerts.push(alert);
        }
      }

      const duration = Date.now() - startTime;
      BanbanMetrics.record('alert-processor', 'critical_stock_processing_time', duration);
      BanbanMetrics.record('alert-processor', 'critical_stock_alerts_generated', alerts.length);

      logger.info('alert-processor', 'Critical stock alerts processed', {
        organizationId,
        alertsGenerated: alerts.length,
        duration
      });

      return alerts;

    } catch (error) {
      logger.error('alert-processor', 'Error processing critical stock alerts', {
        organizationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Processa alertas de margem baixa
   */
  async processLowMarginAlerts(organizationId: string): Promise<ProcessedAlert[]> {
    const startTime = Date.now();
    
    try {
      logger.info('alert-processor', 'Processing low margin alerts', { organizationId });

      const lowMarginProducts = await this.fetchLowMarginData(organizationId);
      const alerts: ProcessedAlert[] = [];

      for (const product of lowMarginProducts) {
        if (product.margin < BANBAN_MODULE_CONFIG.businessRules.lowMarginThreshold) {
          const alert: ProcessedAlert = {
            id: `low-margin-${product.sku}-${Date.now()}`,
            type: AlertType.LOW_MARGIN,
            severity: AlertSeverity.WARNING,
            title: `Margem baixa: ${product.name}`,
            message: `Produto ${product.sku} com margem de ${(product.margin * 100).toFixed(1)}%, abaixo do ideal de ${(BANBAN_MODULE_CONFIG.businessRules.lowMarginThreshold * 100).toFixed(0)}%`,
            organizationId,
            createdAt: new Date().toISOString(),
            threshold: BANBAN_MODULE_CONFIG.businessRules.lowMarginThreshold,
            currentValue: product.margin,
            metadata: {
              sku: product.sku,
              name: product.name,
              currentMargin: product.margin,
              cost: product.cost,
              salePrice: product.salePrice,
              monthlySales: product.monthlySales,
              potentialImpact: product.potentialImpact
            }
          };
          
          alerts.push(alert);
        }
      }

      const duration = Date.now() - startTime;
      BanbanMetrics.record('alert-processor', 'low_margin_processing_time', duration);
      BanbanMetrics.record('alert-processor', 'low_margin_alerts_generated', alerts.length);

      logger.info('alert-processor', 'Low margin alerts processed', {
        organizationId,
        alertsGenerated: alerts.length,
        duration
      });

      return alerts;

    } catch (error) {
      logger.error('alert-processor', 'Error processing low margin alerts', {
        organizationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Processa alertas de produtos slow-moving
   */
  async processSlowMovingAlerts(organizationId: string): Promise<ProcessedAlert[]> {
    const startTime = Date.now();
    
    try {
      logger.info('alert-processor', 'Processing slow moving alerts', { organizationId });

      const slowMovingProducts = await this.fetchSlowMovingData(organizationId);
      const alerts: ProcessedAlert[] = [];

      for (const product of slowMovingProducts) {
        if (product.daysSinceLastSale >= BANBAN_MODULE_CONFIG.businessRules.slowMovingDays) {
          const alert: ProcessedAlert = {
            id: `slow-moving-${product.sku}-${Date.now()}`,
            type: AlertType.SLOW_MOVING,
            severity: AlertSeverity.INFO,
            title: `Produto parado: ${product.name}`,
            message: `Produto ${product.sku} sem vendas há ${product.daysSinceLastSale} dias. Considere ações de promoção.`,
            organizationId,
            createdAt: new Date().toISOString(),
            threshold: BANBAN_MODULE_CONFIG.businessRules.slowMovingDays,
            currentValue: product.daysSinceLastSale,
            metadata: {
              sku: product.sku,
              name: product.name,
              daysSinceLastSale: product.daysSinceLastSale,
              stock: product.stock,
              stockValue: product.stock * product.cost,
              lastSaleDate: product.lastSaleDate
            }
          };
          
          alerts.push(alert);
        }
      }

      const duration = Date.now() - startTime;
      BanbanMetrics.record('alert-processor', 'slow_moving_processing_time', duration);
      BanbanMetrics.record('alert-processor', 'slow_moving_alerts_generated', alerts.length);

      logger.info('alert-processor', 'Slow moving alerts processed', {
        organizationId,
        alertsGenerated: alerts.length,
        duration
      });

      return alerts;

    } catch (error) {
      logger.error('alert-processor', 'Error processing slow moving alerts', {
        organizationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // ========== MÉTODOS DE DADOS MOCK (SUBSTITUIR POR QUERIES REAIS) ==========

  private async fetchLowStockData(organizationId: string): Promise<any[]> {
    // Mock data - em produção seria uma query ao banco
    return [
      {
        sku: 'BB001-AZUL-37',
        name: 'Sapato Social Azul 37',
        stock: 8,
        store: 'Loja Centro',
        category: 'Calçados',
        lastSale: '2024-01-15'
      },
      {
        sku: 'BB002-PRETO-38',
        name: 'Sapato Social Preto 38',
        stock: 5,
        store: 'Loja Shopping',
        category: 'Calçados',
        lastSale: '2024-01-16'
      }
    ];
  }

  private async fetchCriticalStockData(organizationId: string): Promise<any[]> {
    // Mock data
    return [
      {
        sku: 'BB003-MARROM-39',
        name: 'Sapato Social Marrom 39',
        stock: 2,
        store: 'Loja Centro',
        category: 'Calçados',
        avgDailySales: 1.5
      },
      {
        sku: 'AC001-PRETO',
        name: 'Cinto de Couro Preto',
        stock: 1,
        store: 'Loja Shopping',
        category: 'Acessórios',
        avgDailySales: 0.8
      }
    ];
  }

  private async fetchLowMarginData(organizationId: string): Promise<any[]> {
    // Mock data
    return [
      {
        sku: 'BB004-BRANCO-40',
        name: 'Sapato Social Branco 40',
        margin: 0.25,
        cost: 80,
        salePrice: 100,
        monthlySales: 15,
        potentialImpact: 300
      },
      {
        sku: 'BB005-VERDE-38',
        name: 'Sapato Casual Verde 38',
        margin: 0.28,
        cost: 60,
        salePrice: 75,
        monthlySales: 10,
        potentialImpact: 150
      }
    ];
  }

  private async fetchSlowMovingData(organizationId: string): Promise<any[]> {
    // Mock data
    return [
      {
        sku: 'BB006-ROXO-41',
        name: 'Sapato Social Roxo 41',
        daysSinceLastSale: 35,
        stock: 5,
        cost: 70,
        lastSaleDate: '2023-12-15'
      },
      {
        sku: 'AC002-AZUL',
        name: 'Carteira de Couro Azul',
        daysSinceLastSale: 42,
        stock: 8,
        cost: 40,
        lastSaleDate: '2023-12-08'
      }
    ];
  }
}

/**
 * Função pública para processar alertas (usada pelos listeners)
 */
export async function processAlerts(organizationId: string, type: string): Promise<ProcessedAlert[]> {
  const processor = AlertProcessor.getInstance();
  
  switch (type) {
    case 'low_stock':
      return await processor.processLowStockAlerts(organizationId);
    case 'critical_stock':
      return await processor.processCriticalStockAlerts(organizationId);
    case 'low_margin':
      return await processor.processLowMarginAlerts(organizationId);
    case 'slow_moving':
      return await processor.processSlowMovingAlerts(organizationId);
    default:
      logger.warn('alert-processor', 'Unknown alert type requested', { type, organizationId });
      return [];
  }
}

export default AlertProcessor; 