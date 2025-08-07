/**
 * Alert Processor para BanBan Fashion
 * Sistema inteligente de processamento de alertas específico para varejo de moda
 */

import { conditionalDebugLogSync } from '@/shared/utils/conditional-debug-sync';
import { 
  BANBAN_ALERTS_MODULE_CONFIG, 
  getAlertTypeConfig, 
  getEscalationRule,
  PROCESSOR_CONFIG 
} from '../config';

// =====================================================
// TYPES & INTERFACES
// =====================================================

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
  status: AlertStatus;
  daysUntilCritical?: number;
  escalationLevel?: number;
  autoEscalate?: boolean;
  nextEscalationAt?: string;
}

export enum AlertType {
  LOW_STOCK = 'LOW_STOCK',
  CRITICAL_STOCK = 'CRITICAL_STOCK',
  LOW_MARGIN = 'LOW_MARGIN',
  SLOW_MOVING = 'SLOW_MOVING',
  HIGH_RETURN_RATE = 'HIGH_RETURN_RATE',
  OVERSTOCK = 'OVERSTOCK',
  SEASONAL_OPPORTUNITY = 'SEASONAL_OPPORTUNITY'
}

export enum AlertSeverity {
  CRITICAL = 'CRITICAL',
  WARNING = 'WARNING',
  INFO = 'INFO',
  OPPORTUNITY = 'OPPORTUNITY'
}

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED'
}

// Configurações específicas BanBan (utilizando configuração do module.json)
export const BANBAN_ALERT_CONFIG = {
  thresholds: {
    criticalStock: getAlertTypeConfig('STOCK_CRITICAL')?.threshold || 5,
    lowStock: getAlertTypeConfig('STOCK_LOW')?.threshold || 10,
    marginThreshold: getAlertTypeConfig('MARGIN_LOW')?.threshold || 0.31,
    slowMovingDays: getAlertTypeConfig('SLOW_MOVING')?.threshold || 30,
    overstockLevel: getAlertTypeConfig('OVERSTOCK')?.threshold || 500,
    seasonalOpportunity: getAlertTypeConfig('SEASONAL_OPPORTUNITY')?.threshold || 0.8,
  },
  processing: {
    batchSize: PROCESSOR_CONFIG.batchSize,
    maxAlertsPerRun: PROCESSOR_CONFIG.maxAlertsPerRun,
    processingInterval: PROCESSOR_CONFIG.processingInterval,
  },
  escalation: {
    critical: getEscalationRule('critical'),
    attention: getEscalationRule('attention'),
    moderate: getEscalationRule('moderate'),
    opportunity: getEscalationRule('opportunity'),
  }
};

// =====================================================
// ALERT PROCESSOR CLASS
// =====================================================

export class BanbanAlertProcessor {
  private static instance: BanbanAlertProcessor;

  private constructor() {}

  static getInstance(): BanbanAlertProcessor {
    if (!BanbanAlertProcessor.instance) {
      BanbanAlertProcessor.instance = new BanbanAlertProcessor();
    }
    return BanbanAlertProcessor.instance;
  }

  /**
   * Processa todos os tipos de alertas para uma organização
   */
  async processAllAlerts(organizationId: string): Promise<ProcessedAlert[]> {
    const startTime = Date.now();
    const allAlerts: ProcessedAlert[] = [];

    try {
      conditionalDebugLogSync('[AlertProcessor] Processing all alerts', { organizationId });

      // Processar todos os tipos de alertas em paralelo
      const [
        lowStockAlerts,
        criticalStockAlerts,
        lowMarginAlerts,
        slowMovingAlerts,
        overstockAlerts
      ] = await Promise.all([
        this.processLowStockAlerts(organizationId),
        this.processCriticalStockAlerts(organizationId),
        this.processLowMarginAlerts(organizationId),
        this.processSlowMovingAlerts(organizationId),
        this.processOverstockAlerts(organizationId)
      ]);

      allAlerts.push(
        ...lowStockAlerts,
        ...criticalStockAlerts,
        ...lowMarginAlerts,
        ...slowMovingAlerts,
        ...overstockAlerts
      );

      // Ordenar por prioridade e data
      allAlerts.sort((a, b) => {
        const priorityOrder = { CRITICAL: 0, WARNING: 1, INFO: 2, OPPORTUNITY: 3 };
        const priorityDiff = priorityOrder[a.severity] - priorityOrder[b.severity];
        if (priorityDiff !== 0) return priorityDiff;
        
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      const duration = Date.now() - startTime;
      this.recordPerformanceMetrics('processAllAlerts', duration, allAlerts.length);
      
      conditionalDebugLogSync('[AlertProcessor] All alerts processed', {
        organizationId,
        totalAlerts: allAlerts.length,
        duration,
        breakdown: {
          lowStock: lowStockAlerts.length,
          criticalStock: criticalStockAlerts.length,
          lowMargin: lowMarginAlerts.length,
          slowMoving: slowMovingAlerts.length,
          overstock: overstockAlerts.length
        },
        performance: {
          avgTimePerAlert: allAlerts.length > 0 ? duration / allAlerts.length : 0,
          targetMet: duration < 500 // 500ms target
        }
      });

      return allAlerts;

    } catch (error) {
      console.error('[AlertProcessor] Error processing alerts:', error);
      throw error;
    }
  }

  /**
   * Processa alertas de estoque baixo
   */
  async processLowStockAlerts(organizationId: string): Promise<ProcessedAlert[]> {
    try {
      const lowStockProducts = await this.fetchLowStockData(organizationId);
      const alerts: ProcessedAlert[] = [];

      for (const product of lowStockProducts) {
        if (product.stock <= BANBAN_ALERT_CONFIG.thresholds.lowStock && 
            product.stock > BANBAN_ALERT_CONFIG.thresholds.criticalStock) {
          
          const daysUntilCritical = this.calculateDaysUntilCritical(product);
          
          const autoEscalate = this.shouldAutoEscalate('STOCK_LOW');
          
          const alert: ProcessedAlert = {
            id: `low-stock-${product.sku}-${Date.now()}`,
            type: AlertType.LOW_STOCK,
            severity: AlertSeverity.WARNING,
            title: `Estoque baixo: ${product.name}`,
            message: `Produto ${product.sku} com ${product.stock} unidades em ${product.store}. Limite recomendado: ${BANBAN_ALERT_CONFIG.thresholds.lowStock}`,
            organizationId,
            createdAt: new Date().toISOString(),
            threshold: BANBAN_ALERT_CONFIG.thresholds.lowStock,
            currentValue: product.stock,
            status: AlertStatus.ACTIVE,
            daysUntilCritical,
            escalationLevel: 0,
            autoEscalate,
            nextEscalationAt: autoEscalate ? this.calculateNextEscalation(AlertSeverity.WARNING, 0) : undefined,
            metadata: {
              sku: product.sku,
              name: product.name,
              store: product.store,
              category: product.category,
              lastSale: product.lastSale,
              avgDailySales: product.avgDailySales,
              suggestedAction: 'Reabastecer estoque',
              priority: 'attention',
              configuredThreshold: BANBAN_ALERT_CONFIG.thresholds.lowStock
            }
          };
          
          alerts.push(alert);
        }
      }

      return alerts;
    } catch (error) {
      console.error('[AlertProcessor] Error in processLowStockAlerts:', error);
      return [];
    }
  }

  /**
   * Processa alertas de estoque crítico
   */
  async processCriticalStockAlerts(organizationId: string): Promise<ProcessedAlert[]> {
    try {
      const criticalStockProducts = await this.fetchCriticalStockData(organizationId);
      const alerts: ProcessedAlert[] = [];

      for (const product of criticalStockProducts) {
        if (product.stock <= BANBAN_ALERT_CONFIG.thresholds.criticalStock) {
          const daysUntilEmpty = Math.floor(product.stock / (product.avgDailySales || 0.5));
          const autoEscalate = this.shouldAutoEscalate('STOCK_CRITICAL');
          
          const alert: ProcessedAlert = {
            id: `critical-stock-${product.sku}-${Date.now()}`,
            type: AlertType.CRITICAL_STOCK,
            severity: AlertSeverity.CRITICAL,
            title: `🔴 CRÍTICO: Estoque esgotando`,
            message: `URGENTE: ${product.name} com apenas ${product.stock} unidades! Risco de ruptura em ${daysUntilEmpty} dias.`,
            organizationId,
            createdAt: new Date().toISOString(),
            threshold: BANBAN_ALERT_CONFIG.thresholds.criticalStock,
            currentValue: product.stock,
            status: AlertStatus.ACTIVE,
            escalationLevel: 0,
            autoEscalate,
            nextEscalationAt: autoEscalate ? this.calculateNextEscalation(AlertSeverity.CRITICAL, 0) : undefined,
            metadata: {
              sku: product.sku,
              name: product.name,
              store: product.store,
              category: product.category,
              avgDailySales: product.avgDailySales,
              daysUntilEmpty,
              suggestedAction: 'Reposição urgente necessária',
              priority: 'critical',
              escalationRequired: autoEscalate,
              immediateEscalation: BANBAN_ALERT_CONFIG.escalation.critical?.immediate || false
            }
          };
          
          alerts.push(alert);
        }
      }

      return alerts;
    } catch (error) {
      console.error('[AlertProcessor] Error in processCriticalStockAlerts:', error);
      return [];
    }
  }

  /**
   * Processa alertas de margem baixa
   */
  async processLowMarginAlerts(organizationId: string): Promise<ProcessedAlert[]> {
    try {
      const lowMarginProducts = await this.fetchLowMarginData(organizationId);
      const alerts: ProcessedAlert[] = [];

      for (const product of lowMarginProducts) {
        if (product.margin < BANBAN_ALERT_CONFIG.thresholds.marginThreshold) {
          const marginPercentage = (product.margin * 100).toFixed(1);
          const targetPercentage = (BANBAN_ALERT_CONFIG.thresholds.marginThreshold * 100).toFixed(0);
          
          const alert: ProcessedAlert = {
            id: `low-margin-${product.sku}-${Date.now()}`,
            type: AlertType.LOW_MARGIN,
            severity: AlertSeverity.WARNING,
            title: `Margem baixa: ${product.name}`,
            message: `Produto ${product.sku} com margem de ${marginPercentage}%, abaixo do ideal de ${targetPercentage}%`,
            organizationId,
            createdAt: new Date().toISOString(),
            threshold: BANBAN_ALERT_CONFIG.thresholds.marginThreshold,
            currentValue: product.margin,
            status: AlertStatus.ACTIVE,
            metadata: {
              sku: product.sku,
              name: product.name,
              currentMargin: product.margin,
              targetMargin: BANBAN_ALERT_CONFIG.thresholds.marginThreshold,
              cost: product.cost,
              salePrice: product.salePrice,
              monthlySales: product.monthlySales,
              potentialImpact: product.potentialImpact,
              suggestedAction: 'Revisar precificação ou negociar custos',
              priority: 'medium'
            }
          };
          
          alerts.push(alert);
        }
      }

      return alerts;
    } catch (error) {
      console.error('[AlertProcessor] Error in processLowMarginAlerts:', error);
      return [];
    }
  }

  /**
   * Processa alertas de produtos slow-moving
   */
  async processSlowMovingAlerts(organizationId: string): Promise<ProcessedAlert[]> {
    try {
      const slowMovingProducts = await this.fetchSlowMovingData(organizationId);
      const alerts: ProcessedAlert[] = [];

      for (const product of slowMovingProducts) {
        if (product.daysSinceLastSale >= BANBAN_ALERT_CONFIG.thresholds.slowMovingDays) {
          const stockValue = product.stock * product.cost;
          
          const alert: ProcessedAlert = {
            id: `slow-moving-${product.sku}-${Date.now()}`,
            type: AlertType.SLOW_MOVING,
            severity: AlertSeverity.INFO,
            title: `Produto parado: ${product.name}`,
            message: `Produto ${product.sku} sem vendas há ${product.daysSinceLastSale} dias. Valor em estoque: R$ ${stockValue.toFixed(2)}`,
            organizationId,
            createdAt: new Date().toISOString(),
            threshold: BANBAN_ALERT_CONFIG.thresholds.slowMovingDays,
            currentValue: product.daysSinceLastSale,
            status: AlertStatus.ACTIVE,
            metadata: {
              sku: product.sku,
              name: product.name,
              daysSinceLastSale: product.daysSinceLastSale,
              stock: product.stock,
              stockValue,
              lastSaleDate: product.lastSaleDate,
              category: product.category,
              suggestedAction: 'Considerar promoção ou liquidação',
              priority: 'low'
            }
          };
          
          alerts.push(alert);
        }
      }

      return alerts;
    } catch (error) {
      console.error('[AlertProcessor] Error in processSlowMovingAlerts:', error);
      return [];
    }
  }

  /**
   * Processa alertas de overstock
   */
  async processOverstockAlerts(organizationId: string): Promise<ProcessedAlert[]> {
    try {
      const overstockProducts = await this.fetchOverstockData(organizationId);
      const alerts: ProcessedAlert[] = [];

      for (const product of overstockProducts) {
        if (product.stock >= BANBAN_ALERT_CONFIG.thresholds.overstockLevel) {
          const monthsOfStock = product.avgMonthlySales > 0 
            ? Math.floor(product.stock / product.avgMonthlySales) 
            : 999;
          
          const alert: ProcessedAlert = {
            id: `overstock-${product.sku}-${Date.now()}`,
            type: AlertType.OVERSTOCK,
            severity: AlertSeverity.OPPORTUNITY,
            title: `Oportunidade: Excesso de estoque`,
            message: `Produto ${product.name} com ${product.stock} unidades (${monthsOfStock} meses de estoque)`,
            organizationId,
            createdAt: new Date().toISOString(),
            threshold: BANBAN_ALERT_CONFIG.thresholds.overstockLevel,
            currentValue: product.stock,
            status: AlertStatus.ACTIVE,
            metadata: {
              sku: product.sku,
              name: product.name,
              stock: product.stock,
              avgMonthlySales: product.avgMonthlySales,
              monthsOfStock,
              category: product.category,
              suggestedAction: 'Avaliar estratégia de promoção ou redistribuição',
              priority: 'low'
            }
          };
          
          alerts.push(alert);
        }
      }

      return alerts;
    } catch (error) {
      console.error('[AlertProcessor] Error in processOverstockAlerts:', error);
      return [];
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private calculateDaysUntilCritical(product: any): number {
    if (!product.avgDailySales || product.avgDailySales <= 0) return 999;
    
    const stockAboveCritical = product.stock - BANBAN_ALERT_CONFIG.thresholds.criticalStock;
    return Math.floor(stockAboveCritical / product.avgDailySales);
  }

  /**
   * Calcula próxima escalação baseado nas regras de configuração
   */
  private calculateNextEscalation(severity: AlertSeverity, escalationLevel: number = 0): string | undefined {
    const priorityMap = {
      [AlertSeverity.CRITICAL]: 'critical',
      [AlertSeverity.WARNING]: 'attention',
      [AlertSeverity.INFO]: 'moderate',
      [AlertSeverity.OPPORTUNITY]: 'opportunity'
    };

    const priority = priorityMap[severity];
    const escalationRule = BANBAN_ALERT_CONFIG.escalation[priority as keyof typeof BANBAN_ALERT_CONFIG.escalation];

    if (!escalationRule || escalationLevel >= escalationRule.max_escalations) {
      return undefined;
    }

    const nextEscalationTime = new Date();
    nextEscalationTime.setMinutes(nextEscalationTime.getMinutes() + escalationRule.escalate_after_minutes);
    
    return nextEscalationTime.toISOString();
  }

  /**
   * Determina se um alerta deve ter escalação automática
   */
  private shouldAutoEscalate(alertType: string): boolean {
    const config = getAlertTypeConfig(alertType);
    return config?.auto_escalate ?? false;
  }

  /**
   * Processa métricas de performance
   */
  private recordPerformanceMetrics(operation: string, duration: number, alertCount: number): void {
    if (PROCESSOR_CONFIG.enableMetrics) {
      conditionalDebugLogSync(`[Metrics] ${operation}`, {
        duration,
        alertCount,
        avgTimePerAlert: alertCount > 0 ? duration / alertCount : 0,
        targetResponseTime: BANBAN_ALERTS_MODULE_CONFIG.performance_metrics.target_response_time
      });
    }
  }

  // =====================================================
  // MOCK DATA METHODS (TODO: Replace with real database queries)
  // =====================================================

  private async fetchLowStockData(organizationId: string): Promise<any[]> {
    // Mock data para demonstração
    return [
      {
        sku: 'BB001-AZUL-37',
        name: 'Sapato Social Azul 37',
        stock: 8,
        store: 'Loja Centro',
        category: 'Calçados Sociais',
        lastSale: '2024-01-15',
        avgDailySales: 1.2
      },
      {
        sku: 'BB002-PRETO-38',
        name: 'Sapato Social Preto 38',
        stock: 7,
        store: 'Loja Shopping',
        category: 'Calçados Sociais',
        lastSale: '2024-01-16',
        avgDailySales: 1.8
      }
    ];
  }

  private async fetchCriticalStockData(organizationId: string): Promise<any[]> {
    return [
      {
        sku: 'BB003-MARROM-39',
        name: 'Sapato Social Marrom 39',
        stock: 2,
        store: 'Loja Centro',
        category: 'Calçados Sociais',
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
    return [
      {
        sku: 'BB006-ROXO-41',
        name: 'Sapato Social Roxo 41',
        daysSinceLastSale: 35,
        stock: 5,
        cost: 70,
        lastSaleDate: '2023-12-15',
        category: 'Calçados Sociais'
      },
      {
        sku: 'AC002-AZUL',
        name: 'Carteira de Couro Azul',
        daysSinceLastSale: 42,
        stock: 8,
        cost: 40,
        lastSaleDate: '2023-12-08',
        category: 'Acessórios'
      }
    ];
  }

  private async fetchOverstockData(organizationId: string): Promise<any[]> {
    return [
      {
        sku: 'BB007-BEGE-42',
        name: 'Sapato Casual Bege 42',
        stock: 520,
        avgMonthlySales: 15,
        category: 'Calçados Casuais'
      }
    ];
  }
}

// Export para uso em outros módulos
export const banbanAlertProcessor = BanbanAlertProcessor.getInstance();
export default BanbanAlertProcessor;