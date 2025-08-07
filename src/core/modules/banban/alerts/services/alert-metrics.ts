/**
 * Serviço de Métricas de Alertas
 * Coleta e processa métricas de performance do sistema de alertas
 */

import { conditionalDebugLogSync } from '@/shared/utils/conditional-debug-sync';
import { ProcessedAlert, AlertSeverity, AlertStatus } from './alert-processor';
import { BANBAN_ALERTS_MODULE_CONFIG } from '../config';

export interface AlertMetrics {
  // Contadores básicos
  total_alerts: number;
  active_alerts: number;
  acknowledged_alerts: number;
  resolved_alerts: number;

  // Por severidade
  critical_alerts: number;
  warning_alerts: number;
  info_alerts: number;
  opportunity_alerts: number;

  // Por tipo
  by_type: Record<string, number>;

  // Performance
  avg_processing_time: number;
  avg_response_time: number;
  delivery_success_rate: number;
  false_positive_rate: number;

  // Escalações
  total_escalations: number;
  escalations_by_level: Record<number, number>;

  // Timestamps
  last_updated: string;
  period_start: string;
  period_end: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  target?: number;
  threshold_warning?: number;
  threshold_critical?: number;
  timestamp: string;
}

export class AlertMetricsService {
  private static instance: AlertMetricsService;
  private metrics: Map<string, PerformanceMetric> = new Map();

  private constructor() {}

  static getInstance(): AlertMetricsService {
    if (!AlertMetricsService.instance) {
      AlertMetricsService.instance = new AlertMetricsService();
    }
    return AlertMetricsService.instance;
  }

  /**
   * Calcula métricas de uma lista de alertas
   */
  calculateAlertMetrics(alerts: ProcessedAlert[], periodHours: number = 24): AlertMetrics {
    const now = new Date();
    const periodStart = new Date(now.getTime() - (periodHours * 60 * 60 * 1000));

    const periodAlerts = alerts.filter(alert => 
      new Date(alert.createdAt) >= periodStart
    );

    const metrics: AlertMetrics = {
      total_alerts: periodAlerts.length,
      active_alerts: periodAlerts.filter(a => a.status === AlertStatus.ACTIVE).length,
      acknowledged_alerts: periodAlerts.filter(a => a.status === AlertStatus.ACKNOWLEDGED).length,
      resolved_alerts: periodAlerts.filter(a => a.status === AlertStatus.RESOLVED).length,

      critical_alerts: periodAlerts.filter(a => a.severity === AlertSeverity.CRITICAL).length,
      warning_alerts: periodAlerts.filter(a => a.severity === AlertSeverity.WARNING).length,
      info_alerts: periodAlerts.filter(a => a.severity === AlertSeverity.INFO).length,
      opportunity_alerts: periodAlerts.filter(a => a.severity === AlertSeverity.OPPORTUNITY).length,

      by_type: this.calculateTypeBreakdown(periodAlerts),

      avg_processing_time: this.getMetricValue('avg_processing_time') || 0,
      avg_response_time: this.getMetricValue('avg_response_time') || 0,
      delivery_success_rate: this.getMetricValue('delivery_success_rate') || 1.0,
      false_positive_rate: this.getMetricValue('false_positive_rate') || 0.0,

      total_escalations: periodAlerts.filter(a => (a.escalationLevel || 0) > 0).length,
      escalations_by_level: this.calculateEscalationBreakdown(periodAlerts),

      last_updated: now.toISOString(),
      period_start: periodStart.toISOString(),
      period_end: now.toISOString()
    };

    return metrics;
  }

  /**
   * Registra uma métrica de performance
   */
  recordMetric(name: string, value: number, unit: string = 'ms'): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString()
    };

    // Adicionar targets baseados nas configurações
    switch (name) {
      case 'processing_time':
        metric.target = 500; // 500ms target
        metric.threshold_warning = 1000;
        metric.threshold_critical = 5000;
        break;
      case 'delivery_success_rate':
        metric.target = 0.999; // 99.9%
        metric.threshold_warning = 0.95;
        metric.threshold_critical = 0.90;
        break;
      case 'false_positive_rate':
        metric.target = 0.05; // 5%
        metric.threshold_warning = 0.10;
        metric.threshold_critical = 0.20;
        break;
    }

    this.metrics.set(name, metric);

    conditionalDebugLogSync(`[Metrics] ${name}`, {
      value,
      unit,
      target: metric.target,
      exceedsTarget: metric.target ? value > metric.target : false
    });
  }

  /**
   * Obtém valor de uma métrica
   */
  getMetricValue(name: string): number | undefined {
    return this.metrics.get(name)?.value;
  }

  /**
   * Obtém todas as métricas
   */
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Calcula breakdown por tipo de alerta
   */
  private calculateTypeBreakdown(alerts: ProcessedAlert[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    for (const alert of alerts) {
      const type = alert.type;
      breakdown[type] = (breakdown[type] || 0) + 1;
    }

    return breakdown;
  }

  /**
   * Calcula breakdown por nível de escalação
   */
  private calculateEscalationBreakdown(alerts: ProcessedAlert[]): Record<number, number> {
    const breakdown: Record<number, number> = {};
    
    for (const alert of alerts) {
      const level = alert.escalationLevel || 0;
      if (level > 0) {
        breakdown[level] = (breakdown[level] || 0) + 1;
      }
    }

    return breakdown;
  }

  /**
   * Verifica se as métricas estão dentro dos targets
   */
  checkHealthStatus(): { healthy: boolean; issues: string[] } {
    const issues: string[] = [];
    const config = BANBAN_ALERTS_MODULE_CONFIG.performance_metrics;

    // Verificar tempo de resposta
    const responseTime = this.getMetricValue('avg_response_time');
    if (responseTime && responseTime > 500) {
      issues.push(`Tempo de resposta acima do target: ${responseTime}ms > 500ms`);
    }

    // Verificar taxa de entrega
    const deliveryRate = this.getMetricValue('delivery_success_rate');
    if (deliveryRate && deliveryRate < 0.999) {
      issues.push(`Taxa de entrega abaixo do target: ${(deliveryRate * 100).toFixed(1)}% < 99.9%`);
    }

    // Verificar taxa de falsos positivos
    const falsePositiveRate = this.getMetricValue('false_positive_rate');
    if (falsePositiveRate && falsePositiveRate > 0.05) {
      issues.push(`Taxa de falsos positivos acima do target: ${(falsePositiveRate * 100).toFixed(1)}% > 5%`);
    }

    return {
      healthy: issues.length === 0,
      issues
    };
  }

  /**
   * Gera relatório de analytics
   */
  generateAnalyticsReport(alerts: ProcessedAlert[], days: number = 7): Record<string, any> {
    const metrics = this.calculateAlertMetrics(alerts, days * 24);
    const health = this.checkHealthStatus();
    
    return {
      summary: {
        period_days: days,
        total_alerts: metrics.total_alerts,
        daily_average: Math.round(metrics.total_alerts / days),
        active_percentage: metrics.total_alerts > 0 
          ? Math.round((metrics.active_alerts / metrics.total_alerts) * 100) 
          : 0
      },
      
      severity_distribution: {
        critical: metrics.critical_alerts,
        warning: metrics.warning_alerts,
        info: metrics.info_alerts,
        opportunity: metrics.opportunity_alerts
      },

      type_breakdown: metrics.by_type,

      performance: {
        avg_processing_time: metrics.avg_processing_time,
        delivery_success_rate: metrics.delivery_success_rate,
        false_positive_rate: metrics.false_positive_rate,
        health_status: health
      },

      escalations: {
        total: metrics.total_escalations,
        by_level: metrics.escalations_by_level,
        escalation_rate: metrics.total_alerts > 0 
          ? Math.round((metrics.total_escalations / metrics.total_alerts) * 100) 
          : 0
      },

      trends: {
        // TODO: Implementar cálculo de tendências
        alert_volume_trend: 'stable',
        response_time_trend: 'improving',
        resolution_time_trend: 'stable'
      },

      generated_at: new Date().toISOString()
    };
  }
}

export const alertMetricsService = AlertMetricsService.getInstance();
export default AlertMetricsService;