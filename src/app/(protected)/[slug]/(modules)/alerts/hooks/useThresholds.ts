import { useState, useCallback } from 'react';

export interface AlertThreshold {
  alert_type: string;
  threshold_value: number;
  threshold_unit: string;
  priority: 'CRITICAL' | 'WARNING' | 'INFO' | 'OPPORTUNITY';
  auto_escalate: boolean;
  escalation_delay_minutes?: number;
  description?: string;
  source: 'system' | 'custom';
  is_editable: boolean;
  system_default?: {
    threshold_value: number;
    priority: string;
    auto_escalate: boolean;
  };
  created_at?: string;
  updated_at?: string;
  created_by_profile?: {
    full_name: string;
    email: string;
  };
  updated_by_profile?: {
    full_name: string;
    email: string;
  };
}

export interface ThresholdsSummary {
  total: number;
  system_thresholds: number;
  custom_thresholds: number;
  customized_system_thresholds: number;
}

export interface ThresholdsState {
  thresholds: AlertThreshold[];
  summary: ThresholdsSummary | null;
  loading: boolean;
  error: string | null;
}

export interface ThresholdsActions {
  loadThresholds: () => Promise<void>;
  updateThresholds: (thresholds: Partial<AlertThreshold>[]) => Promise<void>;
  resetToDefaults: () => void;
  refreshThresholds: () => Promise<void>;
}

export interface UseThresholdsOptions {
  autoLoad?: boolean;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

export function useThresholds(options: UseThresholdsOptions = {}): ThresholdsState & ThresholdsActions {
  const { autoLoad = true, onError, onSuccess } = options;

  const [state, setState] = useState<ThresholdsState>({
    thresholds: [],
    summary: null,
    loading: false,
    error: null,
  });

  const [originalThresholds, setOriginalThresholds] = useState<AlertThreshold[]>([]);

  const loadThresholds = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/modules/banban/alerts/thresholds');
      
      if (!response.ok) {
        throw new Error(`Failed to load thresholds: ${response.statusText}`);
      }

      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        thresholds: data.data || [],
        summary: data.summary || null,
        loading: false,
      }));

      setOriginalThresholds(data.data || []);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load thresholds';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [onError]);

  const updateThresholds = useCallback(async (thresholdsToUpdate: Partial<AlertThreshold>[]) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Converter para formato da API
      const formattedThresholds = thresholdsToUpdate.map(threshold => ({
        alert_type: threshold.alert_type!,
        threshold_value: threshold.threshold_value!,
        threshold_unit: threshold.threshold_unit,
        priority: threshold.priority!,
        auto_escalate: threshold.auto_escalate!,
        escalation_delay_minutes: threshold.escalation_delay_minutes,
        description: threshold.description,
      }));

      const response = await fetch('/api/modules/banban/alerts/thresholds', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thresholds: formattedThresholds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update thresholds: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Recarregar dados atualizados
      await loadThresholds();

      if (onSuccess) {
        onSuccess(`${result.data.length} thresholds atualizados com sucesso`);
      }

      // Se houver warnings, notificar também
      if (result.warnings) {
        console.warn('Threshold update warnings:', result.warnings);
        if (onError) {
          onError(`Alguns thresholds falharam: ${result.warnings.message}`);
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update thresholds';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [loadThresholds, onError, onSuccess]);

  const resetToDefaults = useCallback(() => {
    if (originalThresholds.length === 0) return;

    const resetThresholds = originalThresholds.map(threshold => ({
      ...threshold,
      // Se tem default do sistema, usar esses valores
      ...(threshold.system_default && {
        threshold_value: threshold.system_default.threshold_value,
        priority: threshold.system_default.priority as 'CRITICAL' | 'WARNING' | 'INFO' | 'OPPORTUNITY',
        auto_escalate: threshold.system_default.auto_escalate,
      }),
    }));

    setState(prev => ({
      ...prev,
      thresholds: resetThresholds,
    }));

    if (onSuccess) {
      onSuccess('Valores resetados para os padrões do sistema');
    }
  }, [originalThresholds, onSuccess]);

  const refreshThresholds = useCallback(async () => {
    await loadThresholds();
  }, [loadThresholds]);

  // Auto-load na inicialização
  React.useEffect(() => {
    if (autoLoad) {
      loadThresholds();
    }
  }, [autoLoad, loadThresholds]);

  return {
    // State
    thresholds: state.thresholds,
    summary: state.summary,
    loading: state.loading,
    error: state.error,
    
    // Actions
    loadThresholds,
    updateThresholds,
    resetToDefaults,
    refreshThresholds,
  };
}

// Hook para threshold específico
export function useThreshold(alertType: string) {
  const { thresholds, loading, error, updateThresholds } = useThresholds();
  
  const threshold = thresholds.find(t => t.alert_type === alertType);
  
  const updateThreshold = useCallback(async (updates: Partial<AlertThreshold>) => {
    if (!threshold) return;
    
    await updateThresholds([{
      ...threshold,
      ...updates,
    }]);
  }, [threshold, updateThresholds]);

  return {
    threshold,
    loading,
    error,
    updateThreshold,
    exists: !!threshold,
  };
}

// Hook para métricas de thresholds
export function useThresholdMetrics() {
  const [metrics, setMetrics] = useState<{
    violations_24h: number;
    violations_by_type: Record<string, number>;
    top_violated_thresholds: Array<{
      alert_type: string;
      violations_count: number;
      last_violation: string;
    }>;
    loading: boolean;
    error: string | null;
  }>({
    violations_24h: 0,
    violations_by_type: {},
    top_violated_thresholds: [],
    loading: false,
    error: null,
  });

  const loadMetrics = useCallback(async () => {
    try {
      setMetrics(prev => ({ ...prev, loading: true, error: null }));

      // Buscar alertas das últimas 24h para calcular violações
      const response = await fetch('/api/modules/banban/alerts?period=24h&limit=1000');
      
      if (!response.ok) {
        throw new Error('Failed to load threshold metrics');
      }

      const data = await response.json();
      const alerts = data.data || [];

      // Calcular métricas
      const violations24h = alerts.length;
      const violationsByType = alerts.reduce((acc: Record<string, number>, alert: any) => {
        acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1;
        return acc;
      }, {});

      const topViolated = Object.entries(violationsByType)
        .map(([alertType, count]) => ({
          alert_type: alertType,
          violations_count: count as number,
          last_violation: alerts
            .filter((a: any) => a.alert_type === alertType)
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at || '',
        }))
        .sort((a, b) => b.violations_count - a.violations_count)
        .slice(0, 5);

      setMetrics({
        violations_24h: violations24h,
        violations_by_type: violationsByType,
        top_violated_thresholds: topViolated,
        loading: false,
        error: null,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load metrics';
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  return {
    ...metrics,
    loadMetrics,
    refreshMetrics: loadMetrics,
  };
}