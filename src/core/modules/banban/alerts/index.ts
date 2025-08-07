/**
 * BanBan Alerts Module v2.0.0
 * Sistema inteligente de alertas para varejo de moda
 * 
 * @author Axon Development Team
 * @version 2.0.0
 * @license Proprietary
 */

import { z } from 'zod';
import type { 
  ModuleInterface, 
  ModuleInitResult, 
  ModuleHealthResult,
  ModuleShutdownResult
} from '../../../../shared/types/module-interface';
import { banbanAlertProcessor } from './services/alert-processor';
import { alertEscalationService } from './services/alert-escalation';
import { alertMetricsService } from './services/alert-metrics';
import { BANBAN_ALERTS_MODULE_CONFIG } from './config';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface AlertsModuleConfig {
  enabled?: boolean;
  processing_mode?: 'real_time' | 'batch' | 'hybrid';
  max_alerts_per_hour?: number;
  alert_retention_days?: number;
  enable_aggregation?: boolean;
  aggregation_window_minutes?: number;
}

export interface Alert {
  id: string;
  tenant_id: string;
  alert_type: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  title: string;
  message: string;
  context_data?: Record<string, any>;
  triggered_at: Date;
  acknowledged_at?: Date;
  resolved_at?: Date;
}

export type AlertType = 
  | 'STOCK_CRITICAL'
  | 'STOCK_LOW'
  | 'MARGIN_LOW'
  | 'SLOW_MOVING'
  | 'OVERSTOCK'
  | 'SEASONAL_OPPORTUNITY'
  | 'SALES_DROP'
  | 'HIGH_RETURN_RATE'
  | 'UNBALANCED_MATRIX'
  | 'CUSTOM';

export type AlertPriority = 'CRITICAL' | 'ATTENTION' | 'MODERATE' | 'OPPORTUNITY';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'EXPIRED' | 'SUPPRESSED';

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const AlertsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  processing_mode: z.enum(['real_time', 'batch', 'hybrid']).default('real_time'),
  max_alerts_per_hour: z.number().min(1).max(10000).default(1000),
  alert_retention_days: z.number().min(1).max(365).default(90),
  enable_aggregation: z.boolean().default(true),
  aggregation_window_minutes: z.number().min(1).max(60).default(5)
});

// =====================================================
// MAIN MODULE CLASS
// =====================================================

export class BanbanAlertsModule implements ModuleInterface {
  // Module Interface Properties
  public readonly id = 'banban-alerts';
  public readonly name = 'BanBan Alerts System';
  public readonly version = '2.0.0';
  public readonly category = 'core' as const;
  public readonly vendor = 'Axon Development Team';

  private config: AlertsModuleConfig;
  private initialized: boolean = false;

  constructor(config: Partial<AlertsModuleConfig> = {}) {
    this.config = AlertsConfigSchema.parse(config);
  }

  // =====================================================
  // MODULE INTERFACE IMPLEMENTATION
  // =====================================================

  async initialize(): Promise<ModuleInitResult> {
    try {
      if (this.initialized) {
        return { success: true, message: 'Alerts module already initialized' };
      }

      // Validar configuração
      const validatedConfig = AlertsConfigSchema.parse(this.config);
      this.config = validatedConfig;

      // Inicializar serviços
      // Os serviços são singletons, então apenas garantimos que estão disponíveis
      
      this.initialized = true;

      return {
        success: true,
        message: 'BanBan Alerts Module initialized successfully',
        data: {
          module_id: 'banban-alerts',
          version: '2.0.0',
          config: this.config,
          features: BANBAN_ALERTS_MODULE_CONFIG.features.filter(f => f.enabled).map(f => f.id)
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to initialize alerts module: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async shutdown(): Promise<ModuleShutdownResult> {
    try {
      this.initialized = false;
      
      return {
        success: true,
        message: 'Alerts module shutdown successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to shutdown alerts module: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async healthCheck(): Promise<ModuleHealthResult> {
    if (!this.initialized) {
      return {
        healthy: false,
        status: 'unhealthy',
        details: {
          initialized: false,
          processor: false,
          escalation_service: false,
          metrics_service: false
        },
        timestamp: new Date().toISOString()
      };
    }

    // Check services health
    const metricsHealth = alertMetricsService.checkHealthStatus();
    
    return {
      healthy: metricsHealth.healthy,
      status: metricsHealth.healthy ? 'healthy' : 'degraded',
      details: {
        initialized: true,
        processor: true,
        escalation_service: true,
        metrics_service: metricsHealth.healthy,
        issues: metricsHealth.issues
      },
      timestamp: new Date().toISOString()
    };
  }

  getMetrics() {
    const allMetrics = alertMetricsService.getAllMetrics();
    
    return {
      active_alerts: 0, // TODO: Get from real data
      processed_alerts_today: 0, // TODO: Get from real data
      average_processing_time: alertMetricsService.getMetricValue('processing_time') || 0,
      delivery_success_rate: alertMetricsService.getMetricValue('delivery_success_rate') || 1.0,
      module_uptime: this.initialized ? Date.now() : 0,
      performance_metrics: allMetrics
    };
  }

  getEndpoints(): string[] {
    return BANBAN_ALERTS_MODULE_CONFIG.api.endpoints.map(
      endpoint => `${BANBAN_ALERTS_MODULE_CONFIG.api.base_path}${endpoint.path}`
    );
  }

  getConfig() {
    return {
      ...this.config,
      module_config: BANBAN_ALERTS_MODULE_CONFIG
    };
  }

  // =====================================================
  // BUSINESS LOGIC METHODS
  // =====================================================

  /**
   * Processa todos os alertas para uma organização
   */
  async processAlerts(organizationId: string) {
    this.ensureInitialized();
    return await banbanAlertProcessor.processAllAlerts(organizationId);
  }

  /**
   * Obtém métricas de alertas
   */
  async getAlertsMetrics(organizationId: string, days: number = 7) {
    this.ensureInitialized();
    const alerts = await banbanAlertProcessor.processAllAlerts(organizationId);
    return alertMetricsService.generateAnalyticsReport(alerts, days);
  }

  /**
   * Processa escalações pendentes
   */
  async processEscalations(organizationId: string) {
    this.ensureInitialized();
    const alerts = await banbanAlertProcessor.processAllAlerts(organizationId);
    return await alertEscalationService.processEscalations(alerts);
  }

  // =====================================================
  // PRIVATE METHODS
  // =====================================================

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Alerts module not initialized. Call initialize() first.');
    }
  }
}

// =====================================================
// MODULE FACTORY FUNCTIONS
// =====================================================

export async function initializeAlertsModule(config?: Partial<AlertsModuleConfig>): Promise<BanbanAlertsModule> {
  const alertsModule = new BanbanAlertsModule(config);
  const result = await alertsModule.initialize();
  
  if (!result.success) {
    throw new Error(`Failed to initialize alerts module: ${result.message}`);
  }
  
  return alertsModule;
}

export async function register(): Promise<ModuleInterface> {
  return new BanbanAlertsModule();
}

// =====================================================
// EXPORTS
// =====================================================

export { AlertsConfigSchema };
export { banbanAlertProcessor } from './services/alert-processor';
export { alertEscalationService } from './services/alert-escalation';
export { alertMetricsService } from './services/alert-metrics';
export { BANBAN_ALERTS_MODULE_CONFIG } from './config';

export default BanbanAlertsModule;