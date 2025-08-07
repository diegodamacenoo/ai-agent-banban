'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  banbanAlertProcessor, 
  ProcessedAlert, 
  AlertSeverity, 
  AlertType, 
  AlertStatus 
} from '@/core/modules/banban/alerts/services/alert-processor';
import { alertEscalationService } from '@/core/modules/banban/alerts/services/alert-escalation';
import { alertMetricsService } from '@/core/modules/banban/alerts/services/alert-metrics';
import { BANBAN_ALERTS_MODULE_CONFIG, isFeatureEnabled } from '@/core/modules/banban/alerts/config';

interface UseAlertsOptions {
  organizationId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface AlertsState {
  alerts: ProcessedAlert[];
  loading: boolean;
  error: string | null;
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
    opportunity: number;
    active: number;
    acknowledged: number;
    resolved: number;
  };
  metrics?: {
    avgProcessingTime: number;
    deliverySuccessRate: number;
    escalationRate: number;
    healthStatus: { healthy: boolean; issues: string[] };
  };
  config: {
    features: string[];
    version: string;
    escalationEnabled: boolean;
    metricsEnabled: boolean;
  };
}

interface AlertActions {
  refreshAlerts: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
  filterByType: (type: AlertType | null) => ProcessedAlert[];
  filterBySeverity: (severity: AlertSeverity | null) => ProcessedAlert[];
  getAnalytics: (days?: number) => Record<string, any>;
  processEscalations: () => Promise<void>;
}

export function useAlerts(options: UseAlertsOptions): AlertsState & AlertActions {
  const { organizationId, autoRefresh = true, refreshInterval = 300000 } = options; // 5 minutos padrão
  
  const [state, setState] = useState<AlertsState>({
    alerts: [],
    loading: true,
    error: null,
    summary: {
      total: 0,
      critical: 0,
      warning: 0,
      info: 0,
      opportunity: 0,
      active: 0,
      acknowledged: 0,
      resolved: 0
    },
    config: {
      features: BANBAN_ALERTS_MODULE_CONFIG.features.filter(f => f.enabled).map(f => f.id),
      version: BANBAN_ALERTS_MODULE_CONFIG.version,
      escalationEnabled: isFeatureEnabled('escalation_rules'),
      metricsEnabled: isFeatureEnabled('alert_analytics')
    }
  });

  const calculateSummary = useCallback((alerts: ProcessedAlert[]) => {
    const summary = {
      total: alerts.length,
      critical: 0,
      warning: 0,
      info: 0,
      opportunity: 0,
      active: 0,
      acknowledged: 0,
      resolved: 0
    };

    alerts.forEach(alert => {
      // Contagem por severidade
      switch (alert.severity) {
        case AlertSeverity.CRITICAL:
          summary.critical++;
          break;
        case AlertSeverity.WARNING:
          summary.warning++;
          break;
        case AlertSeverity.INFO:
          summary.info++;
          break;
        case AlertSeverity.OPPORTUNITY:
          summary.opportunity++;
          break;
      }

      // Contagem por status
      switch (alert.status) {
        case AlertStatus.ACTIVE:
          summary.active++;
          break;
        case AlertStatus.ACKNOWLEDGED:
          summary.acknowledged++;
          break;
        case AlertStatus.RESOLVED:
          summary.resolved++;
          break;
      }
    });

    return summary;
  }, []);

  const refreshAlerts = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const startTime = Date.now();
      const alerts = await banbanAlertProcessor.processAllAlerts(organizationId);
      const processingTime = Date.now() - startTime;
      
      // Registrar métricas se habilitado
      if (isFeatureEnabled('alert_analytics')) {
        alertMetricsService.recordMetric('processing_time', processingTime, 'ms');
        alertMetricsService.recordMetric('alerts_processed', alerts.length, 'count');
      }

      // Processar escalações se habilitado
      if (isFeatureEnabled('escalation_rules')) {
        await alertEscalationService.processEscalations(alerts);
      }

      const summary = calculateSummary(alerts);
      
      // Calcular métricas adicionais
      let metrics;
      if (isFeatureEnabled('alert_analytics')) {
        const alertMetrics = alertMetricsService.calculateAlertMetrics(alerts);
        const healthStatus = alertMetricsService.checkHealthStatus();
        
        metrics = {
          avgProcessingTime: processingTime,
          deliverySuccessRate: alertMetricsService.getMetricValue('delivery_success_rate') || 1.0,
          escalationRate: alertMetrics.total_alerts > 0 
            ? alertMetrics.total_escalations / alertMetrics.total_alerts 
            : 0,
          healthStatus
        };
      }
      
      setState(prev => ({
        ...prev,
        alerts,
        loading: false,
        error: null,
        summary,
        metrics
      }));
    } catch (error) {
      console.error('[useAlerts] Error refreshing alerts:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar alertas'
      }));
    }
  }, [organizationId, calculateSummary]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      setState(prev => ({
        ...prev,
        alerts: prev.alerts.map(alert => 
          alert.id === alertId 
            ? { ...alert, status: AlertStatus.ACKNOWLEDGED }
            : alert
        )
      }));

      // Parar escalação se habilitado
      if (isFeatureEnabled('escalation_rules')) {
        await alertEscalationService.stopEscalation(alertId, 'Alerta reconhecido pelo usuário');
      }

      // TODO: Implementar chamada para API
      console.log('Acknowledging alert:', alertId);
      
      // Recalcular summary
      setState(prev => ({
        ...prev,
        summary: calculateSummary(prev.alerts)
      }));
    } catch (error) {
      console.error('[useAlerts] Error acknowledging alert:', error);
      // Reverter mudança otimística
      await refreshAlerts();
    }
  }, [refreshAlerts, calculateSummary]);

  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      setState(prev => ({
        ...prev,
        alerts: prev.alerts.map(alert => 
          alert.id === alertId 
            ? { ...alert, status: AlertStatus.RESOLVED }
            : alert
        )
      }));

      // Parar escalação se habilitado
      if (isFeatureEnabled('escalation_rules')) {
        await alertEscalationService.stopEscalation(alertId, 'Alerta resolvido pelo usuário');
      }

      // TODO: Implementar chamada para API
      console.log('Resolving alert:', alertId);
      
      // Recalcular summary
      setState(prev => ({
        ...prev,
        summary: calculateSummary(prev.alerts)
      }));
    } catch (error) {
      console.error('[useAlerts] Error resolving alert:', error);
      // Reverter mudança otimística
      await refreshAlerts();
    }
  }, [refreshAlerts, calculateSummary]);

  const filterByType = useCallback((type: AlertType | null): ProcessedAlert[] => {
    if (!type) return state.alerts;
    return state.alerts.filter(alert => alert.type === type);
  }, [state.alerts]);

  const filterBySeverity = useCallback((severity: AlertSeverity | null): ProcessedAlert[] => {
    if (!severity) return state.alerts;
    return state.alerts.filter(alert => alert.severity === severity);
  }, [state.alerts]);

  const getAnalytics = useCallback((days: number = 7): Record<string, any> => {
    if (!isFeatureEnabled('alert_analytics')) {
      return { error: 'Analytics feature not enabled' };
    }
    
    return alertMetricsService.generateAnalyticsReport(state.alerts, days);
  }, [state.alerts]);

  const processEscalations = useCallback(async (): Promise<void> => {
    if (!isFeatureEnabled('escalation_rules')) {
      console.warn('[useAlerts] Escalation rules feature not enabled');
      return;
    }

    try {
      const escalations = await alertEscalationService.processEscalations(state.alerts);
      console.debug('[useAlerts] Processed escalations:', escalations.length);
    } catch (error) {
      console.error('[useAlerts] Error processing escalations:', error);
    }
  }, [state.alerts]);

  // Carregar alertas na inicialização
  useEffect(() => {
    refreshAlerts();
  }, [refreshAlerts]);

  // Auto-refresh se habilitado
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshAlerts();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshAlerts]);

  return {
    ...state,
    refreshAlerts,
    acknowledgeAlert,
    resolveAlert,
    filterByType,
    filterBySeverity,
    getAnalytics,
    processEscalations
  };
}

export default useAlerts;