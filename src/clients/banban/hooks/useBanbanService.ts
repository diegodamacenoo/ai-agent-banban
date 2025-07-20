import { useState, useEffect, useCallback } from 'react';
import { BanBanService } from '../services/banban-service';
import type {
  BanbanDashboardData,
  BanbanExecutiveData,
  BanbanKPIs,
  BanbanAlert,
  BanbanInsight,
  BanbanInventoryData,
  BanbanWebhookStatus,
  ReportData,
  BanbanFilters,
  AlertFilters,
  InsightFilters,
  ReportRequest
} from '../types';

/**
 * Phase 2: Unified BanBan Service Hook
 * Provides centralized access to all BanBan functionality
 */
export const useBanbanService = (orgId: string) => {
  const [service] = useState(() => BanBanService.getInstance());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error state
  const clearError = useCallback(() => setError(null), []);

  // Generic error handler
  const handleError = useCallback((error: any, context: string) => {
    console.error(`BanBan Service Error [${context}]:`, error);
    setError(error?.message || `Failed to ${context}`);
    setLoading(false);
  }, []);

  // Generic loading wrapper
  const withLoading = useCallback(async <T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      setLoading(false);
      return result;
    } catch (error) {
      handleError(error, context);
      return null;
    }
  }, [handleError]);

  /**
   * Dashboard Operations
   */
  const getDashboardData = useCallback(async (
    filters?: Partial<BanbanFilters>
  ): Promise<BanbanDashboardData | null> => {
    return withLoading(
      () => service.getDashboardData(orgId, filters),
      'fetch dashboard data'
    );
  }, [service, orgId, withLoading]);

  const getExecutiveKPIs = useCallback(async (): Promise<BanbanExecutiveData | null> => {
    return withLoading(
      () => service.getExecutiveKPIs(orgId),
      'fetch executive KPIs'
    );
  }, [service, orgId, withLoading]);

  const getFashionKPIs = useCallback(async (
    filters: BanbanFilters
  ): Promise<BanbanKPIs | null> => {
    return withLoading(
      () => service.getFashionKPIs(filters),
      'fetch fashion KPIs'
    );
  }, [service, withLoading]);

  const getBatchDashboardData = useCallback(async (
    filters: BanbanFilters
  ): Promise<{
    executive: BanbanExecutiveData;
    kpis: BanbanKPIs;
    alerts: BanbanAlert[];
    insights: BanbanInsight[];
  } | null> => {
    return withLoading(
      () => service.getBatchDashboardData(filters),
      'fetch batch dashboard data'
    );
  }, [service, withLoading]);

  /**
   * Alerts Operations
   */
  const getActiveAlerts = useCallback(async (
    filters: AlertFilters
  ): Promise<BanbanAlert[] | null> => {
    return withLoading(
      () => service.getActiveAlerts(filters),
      'fetch active alerts'
    );
  }, [service, withLoading]);

  const getAlertsHistory = useCallback(async (
    filters: AlertFilters
  ): Promise<BanbanAlert[] | null> => {
    return withLoading(
      () => service.getAlertsHistory(filters),
      'fetch alerts history'
    );
  }, [service, withLoading]);

  const resolveAlert = useCallback(async (
    alertId: string
  ): Promise<BanbanAlert | null> => {
    return withLoading(
      () => service.resolveAlert(alertId, orgId),
      'resolve alert'
    );
  }, [service, orgId, withLoading]);

  const archiveAlert = useCallback(async (
    alertId: string
  ): Promise<BanbanAlert | null> => {
    return withLoading(
      () => service.archiveAlert(alertId, orgId),
      'archive alert'
    );
  }, [service, orgId, withLoading]);

  const processBatchAlertActions = useCallback(async (
    actions: Array<{
      alertId: string;
      action: 'resolve' | 'archive' | 'escalate';
    }>
  ): Promise<{ processed: number; errors: any[] } | null> => {
    return withLoading(
      () => service.processBatchAlertActions(actions, orgId),
      'process batch alert actions'
    );
  }, [service, orgId, withLoading]);

  /**
   * Insights Operations
   */
  const getLatestInsights = useCallback(async (
    filters: InsightFilters
  ): Promise<BanbanInsight[] | null> => {
    return withLoading(
      () => service.getLatestInsights(filters),
      'fetch latest insights'
    );
  }, [service, withLoading]);

  const getInsightsTrends = useCallback(async (
    filters: InsightFilters
  ): Promise<BanbanInsight[] | null> => {
    return withLoading(
      () => service.getInsightsTrends(filters),
      'fetch insights trends'
    );
  }, [service, withLoading]);

  const getInsightDetails = useCallback(async (
    insightId: string
  ): Promise<BanbanInsight | null> => {
    return withLoading(
      () => service.getInsightDetails(insightId, orgId),
      'fetch insight details'
    );
  }, [service, orgId, withLoading]);

  /**
   * Inventory Operations
   */
  const getInventoryAnalytics = useCallback(async (
    filters: BanbanFilters
  ): Promise<BanbanInventoryData | null> => {
    return withLoading(
      () => service.getInventoryAnalytics(filters),
      'fetch inventory analytics'
    );
  }, [service, withLoading]);

  const getABCAnalysis = useCallback(async (
    filters: BanbanFilters
  ): Promise<BanbanInventoryData['abcAnalysis'] | null> => {
    return withLoading(
      () => service.getABCAnalysis(filters),
      'fetch ABC analysis'
    );
  }, [service, withLoading]);

  const getFastMovingProducts = useCallback(async (
    filters: BanbanFilters
  ): Promise<BanbanInventoryData['fastMoving'] | null> => {
    return withLoading(
      () => service.getFastMovingProducts(filters),
      'fetch fast moving products'
    );
  }, [service, withLoading]);

  const getSlowMovingProducts = useCallback(async (
    filters: BanbanFilters
  ): Promise<BanbanInventoryData['slowMoving'] | null> => {
    return withLoading(
      () => service.getSlowMovingProducts(filters),
      'fetch slow moving products'
    );
  }, [service, withLoading]);

  /**
   * Webhooks Operations
   */
  const getWebhooksStatus = useCallback(async (): Promise<BanbanWebhookStatus | null> => {
    return withLoading(
      () => service.getWebhooksStatus(orgId),
      'fetch webhooks status'
    );
  }, [service, orgId, withLoading]);

  const getWebhooksLogs = useCallback(async (
    limit: number = 50
  ): Promise<BanbanWebhookStatus['recentLogs'] | null> => {
    return withLoading(
      () => service.getWebhooksLogs(orgId, limit),
      'fetch webhooks logs'
    );
  }, [service, orgId, withLoading]);

  const retryWebhookFlow = useCallback(async (
    flowName: string
  ): Promise<{ success: boolean } | null> => {
    return withLoading(
      () => service.retryWebhookFlow(flowName, orgId),
      'retry webhook flow'
    );
  }, [service, orgId, withLoading]);

  /**
   * Reports Operations
   */
  const generateReport = useCallback(async (
    request: ReportRequest
  ): Promise<ReportData | null> => {
    return withLoading(
      () => service.generateReport(request),
      'generate report'
    );
  }, [service, withLoading]);

  const getReport = useCallback(async (
    reportId: string
  ): Promise<ReportData | null> => {
    return withLoading(
      () => service.getReport(reportId, orgId),
      'fetch report'
    );
  }, [service, orgId, withLoading]);

  const listReports = useCallback(async (
    limit: number = 20
  ): Promise<ReportData[] | null> => {
    return withLoading(
      () => service.listReports(orgId, limit),
      'list reports'
    );
  }, [service, orgId, withLoading]);

  const deleteReport = useCallback(async (
    reportId: string
  ): Promise<{ success: boolean } | null> => {
    return withLoading(
      () => service.deleteReport(reportId, orgId),
      'delete report'
    );
  }, [service, orgId, withLoading]);

  /**
   * System Operations
   */
  const getSystemHealth = useCallback(async (): Promise<{
    status: string;
    modules: Record<string, string>;
  } | null> => {
    return withLoading(
      () => service.getSystemHealth(orgId),
      'fetch system health'
    );
  }, [service, orgId, withLoading]);

  /**
   * Utility Methods
   */
  const createDefaultFilters = useCallback((
    period: '7d' | '30d' | '90d' = '30d'
  ): BanbanFilters => {
    return service.createDefaultFilters(orgId, period);
  }, [service, orgId]);

  const createAlertFilters = useCallback((
    options: Partial<AlertFilters> = {}
  ): AlertFilters => {
    return service.createAlertFilters(orgId, options);
  }, [service, orgId]);

  const createInsightFilters = useCallback((
    options: Partial<InsightFilters> = {}
  ): InsightFilters => {
    return service.createInsightFilters(orgId, options);
  }, [service, orgId]);

  return {
    // State
    loading,
    error,
    clearError,

    // Dashboard
    getDashboardData,
    getExecutiveKPIs,
    getFashionKPIs,
    getBatchDashboardData,

    // Alerts
    getActiveAlerts,
    getAlertsHistory,
    resolveAlert,
    archiveAlert,
    processBatchAlertActions,

    // Insights
    getLatestInsights,
    getInsightsTrends,
    getInsightDetails,

    // Inventory
    getInventoryAnalytics,
    getABCAnalysis,
    getFastMovingProducts,
    getSlowMovingProducts,

    // Webhooks
    getWebhooksStatus,
    getWebhooksLogs,
    retryWebhookFlow,

    // Reports
    generateReport,
    getReport,
    listReports,
    deleteReport,

    // System
    getSystemHealth,

    // Utilities
    createDefaultFilters,
    createAlertFilters,
    createInsightFilters,

    // Direct service access for advanced usage
    service
  };
};

/**
 * Specialized hooks for specific use cases
 */

// Hook for dashboard loading with automatic refresh
export const useBanbanDashboard = (
  orgId: string, 
  filters?: Partial<BanbanFilters>,
  autoRefresh: boolean = false,
  refreshInterval: number = 30000
) => {
  const { getDashboardData, loading, error, clearError } = useBanbanService(orgId);
  const [dashboardData, setDashboardData] = useState<BanbanDashboardData | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refreshDashboard = useCallback(async () => {
    const data = await getDashboardData(filters);
    if (data) {
      setDashboardData(data);
      setLastRefresh(new Date());
    }
  }, [getDashboardData, filters]);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refreshDashboard, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refreshDashboard]);

  return {
    dashboardData,
    loading,
    error,
    clearError,
    refreshDashboard,
    lastRefresh
  };
};

// Hook for alerts management with real-time updates
export const useBanbanAlerts = (
  orgId: string,
  filters?: Partial<AlertFilters>,
  autoRefresh: boolean = true
) => {
  const { 
    getActiveAlerts, 
    resolveAlert, 
    archiveAlert,
    processBatchAlertActions,
    loading, 
    error, 
    clearError 
  } = useBanbanService(orgId);
  
  const [alerts, setAlerts] = useState<BanbanAlert[]>([]);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);

  const alertFilters = useBanbanService(orgId).createAlertFilters(filters);

  const refreshAlerts = useCallback(async () => {
    const data = await getActiveAlerts(alertFilters);
    if (data) {
      setAlerts(data);
    }
  }, [getActiveAlerts, alertFilters]);

  const handleResolveAlert = useCallback(async (alertId: string) => {
    const result = await resolveAlert(alertId);
    if (result) {
      await refreshAlerts();
    }
    return result;
  }, [resolveAlert, refreshAlerts]);

  const handleArchiveAlert = useCallback(async (alertId: string) => {
    const result = await archiveAlert(alertId);
    if (result) {
      await refreshAlerts();
    }
    return result;
  }, [archiveAlert, refreshAlerts]);

  const handleBatchActions = useCallback(async (
    actions: Array<{ alertId: string; action: 'resolve' | 'archive' | 'escalate' }>
  ) => {
    const result = await processBatchAlertActions(actions);
    if (result) {
      await refreshAlerts();
      setSelectedAlerts([]);
    }
    return result;
  }, [processBatchAlertActions, refreshAlerts]);

  const toggleAlertSelection = useCallback((alertId: string) => {
    setSelectedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  }, []);

  const selectAllAlerts = useCallback(() => {
    setSelectedAlerts(alerts.map(alert => alert.id));
  }, [alerts]);

  const clearSelection = useCallback(() => {
    setSelectedAlerts([]);
  }, []);

  useEffect(() => {
    refreshAlerts();
  }, [refreshAlerts]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refreshAlerts, 15000); // Refresh alerts every 15s
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshAlerts]);

  return {
    alerts,
    selectedAlerts,
    loading,
    error,
    clearError,
    refreshAlerts,
    resolveAlert: handleResolveAlert,
    archiveAlert: handleArchiveAlert,
    processBatchActions: handleBatchActions,
    toggleAlertSelection,
    selectAllAlerts,
    clearSelection
  };
}; 