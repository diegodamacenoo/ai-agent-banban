import { apiRouter } from '@/shared/utils/api-router';
import type {
  BanbanDashboardData,
  BanbanExecutiveData,
  BanbanKPIs,
  BanbanAlert,
  BanbanInsight,
  BanbanInventoryData,
  BanbanWebhookStatus,
  ReportData,
  BanbanApiResponse,
  BanbanFilters,
  AlertFilters,
  InsightFilters,
  ReportRequest
} from '../types';

/**
 * Unified BanBan API Service
 * Phase 2: Standardized API endpoints for all BanBan modules
 */
export class BanbanAPI {
  private static instance: BanbanAPI;
  private baseRoute = 'banban';

  private constructor() {}

  public static getInstance(): BanbanAPI {
    if (!BanbanAPI.instance) {
      BanbanAPI.instance = new BanbanAPI();
    }
    return BanbanAPI.instance;
  }

  /**
   * Dashboard APIs
   */
  
  // GET /api/banban/dashboard/executive
  async getExecutiveDashboard(orgId: string): Promise<BanbanApiResponse<BanbanExecutiveData>> {
    try {
      const response = await apiRouter.routeRequest(
        this.baseRoute,
        `/dashboard/executive?orgId=${orgId}`,
        'GET'
      );
      return response;
    } catch (error) {
      return this.handleError('Failed to fetch executive dashboard', error);
    }
  }

  // GET /api/banban/dashboard/kpis
  async getKPIs(filters: BanbanFilters): Promise<BanbanApiResponse<BanbanKPIs>> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const response = await apiRouter.routeRequest(
        this.baseRoute,
        `/dashboard/kpis?${queryParams}`,
        'GET'
      );
      return response;
    } catch (error) {
      return this.handleError('Failed to fetch KPIs', error);
    }
  }

  // GET /api/banban/dashboard/complete
  async getCompleteDashboard(filters: BanbanFilters): Promise<BanbanApiResponse<BanbanDashboardData>> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const response = await apiRouter.routeRequest(
        this.baseRoute,
        `/dashboard/complete?${queryParams}`,
        'GET'
      );
      return response;
    } catch (error) {
      return this.handleError('Failed to fetch complete dashboard', error);
    }
  }

  /**
   * Alerts APIs
   */
  
  // GET /api/banban/alerts/active
  async getActiveAlerts(filters: AlertFilters): Promise<BanbanApiResponse<BanbanAlert[]>> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const response = await apiRouter.routeRequest(
        this.baseRoute,
        `/alerts/active?${queryParams}`,
        'GET'
      );
      return response;
    } catch (error) {
      return this.handleError('Failed to fetch active alerts', error);
    }
  }

  // GET /api/banban/alerts/history
  async getAlertsHistory(filters: AlertFilters): Promise<BanbanApiResponse<BanbanAlert[]>> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const response = await apiRouter.routeRequest(
        this.baseRoute,
        `/alerts/history?${queryParams}`,
        'GET'
      );
      return response;
    } catch (error) {
      return this.handleError('Failed to fetch alerts history', error);
    }
  }

  // PUT /api/banban/alerts/{id}/resolve
  async resolveAlert(alertId: string, orgId: string): Promise<BanbanApiResponse<BanbanAlert>> {
    try {
      const response = await apiRouter.routeRequest(
        this.baseRoute,
        `/alerts/${alertId}/resolve`,
        'PUT',
        { orgId }
      );
      return response;
    } catch (error) {
      return this.handleError('Failed to resolve alert', error);
    }
  }

  // PUT /api/banban/alerts/{id}/archive
  async archiveAlert(alertId: string, orgId: string): Promise<BanbanApiResponse<BanbanAlert>> {
    try {
      const response = await apiRouter.routeRequest(
        this.baseRoute,
        `/alerts/${alertId}/archive`,
        'PUT',
        { orgId }
      );
      return response;
    } catch (error) {
      return this.handleError('Failed to archive alert', error);
    }
  }

  /**
   * Insights APIs
   */
  
  // GET /api/banban/insights/latest
  async getLatestInsights(filters: InsightFilters): Promise<BanbanApiResponse<BanbanInsight[]>> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const response = await apiRouter.routeRequest(
        this.baseRoute,
        `/insights/latest?${queryParams}`,
        'GET'
      );
      return response;
    } catch (error) {
      return this.handleError('Failed to fetch latest insights', error);
    }
  }

  // GET /api/banban/insights/trends
  async getInsightsTrends(filters: InsightFilters): Promise<BanbanApiResponse<BanbanInsight[]>> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const response = await apiRouter.routeRequest(
        this.baseRoute,
        `/insights/trends?${queryParams}`,
        'GET'
      );
      return response;
    } catch (error) {
      return this.handleError('Failed to fetch insights trends', error);
    }
  }

  // GET /api/banban/insights/{id}
  async getInsightDetails(insightId: string, orgId: string): Promise<BanbanApiResponse<BanbanInsight>> {
    try {
      const response = await apiRouter.routeRequest(
        this.baseRoute,
        `/insights/${insightId}?orgId=${orgId}`,
        'GET'
      );
      return response;
    } catch (error) {
      return this.handleError('Failed to fetch insight details', error);
    }
  }

  /**
   * Inventory APIs
   */
  
  // GET /api/banban/inventory/analytics
  async getInventoryAnalytics(filters: BanbanFilters): Promise<BanbanApiResponse<BanbanInventoryData>> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const response = await apiRouter.routeRequest(
        this.baseRoute,
        `/inventory/analytics?${queryParams}`,
        'GET'
      );
      return response;
    } catch (error) {
      return this.handleError('Failed to fetch inventory analytics', error);
    }
  }

  // GET /api/banban/inventory/abc-analysis
  async getABCAnalysis(filters: BanbanFilters): Promise<BanbanApiResponse<BanbanInventoryData['abcAnalysis']>> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const response = await apiRouter.routeRequest(
        this.baseRoute,
        `/inventory/abc-analysis?${queryParams}`,
        'GET'
      );
      return response;
    } catch (error) {
      return this.handleError('Failed to fetch ABC analysis', error);
    }
  }

  // GET /api/banban/inventory/fast-moving
  async getFastMovingProducts(filters: BanbanFilters): Promise<BanbanApiResponse<BanbanInventoryData['fastMoving']>> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const response = await apiRouter.routeRequest(
        this.baseRoute,
        `/inventory/fast-moving?${queryParams}`,
        'GET'
      );
      return response;
    } catch (error) {
      return this.handleError('Failed to fetch fast moving products', error);
    }
  }

  // GET /api/banban/inventory/slow-moving
  async getSlowMovingProducts(filters: BanbanFilters): Promise<BanbanApiResponse<BanbanInventoryData['slowMoving']>> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const response = await apiRouter.routeRequest(
        this.baseRoute,
        `/inventory/slow-moving?${queryParams}`,
        'GET'
      );
      return response;
    } catch (error) {
      return this.handleError('Failed to fetch slow moving products', error);
    }
  }

  /**
   * Webhooks APIs
   */
  
  // GET /api/banban/webhooks/status
  async getWebhooksStatus(orgId: string): Promise<BanbanApiResponse<BanbanWebhookStatus>> {
    try {
      const response = await apiRouter.routeRequest(
        this.baseRoute,
        `/webhooks/status?orgId=${orgId}`,
        'GET'
      );
      return response;
    } catch (error) {
      return this.handleError('Failed to fetch webhooks status', error);
    }
  }

  // GET /api/banban/webhooks/logs
  async getWebhooksLogs(orgId: string, limit: number = 50): Promise<BanbanApiResponse<BanbanWebhookStatus['recentLogs']>> {
    try {
      const response = await apiRouter.routeRequest(
        this.baseRoute,
        `/webhooks/logs?orgId=${orgId}&limit=${limit}`,
        'GET'
      );
      return response;
    } catch (error) {
      return this.handleError('Failed to fetch webhooks logs', error);
    }
  }

  // POST /api/banban/webhooks/{flow}/retry
  async retryWebhookFlow(flowName: string, orgId: string): Promise<BanbanApiResponse<{ success: boolean }>> {
    try {
      const response = await apiRouter.routeRequest(
        this.baseRoute,
        `/webhooks/${flowName}/retry`,
        'POST',
        { orgId }
      );
      return response;
    } catch (error) {
      return this.handleError('Failed to retry webhook flow', error);
    }
  }

  /**
   * Reports APIs
   */
  
  // POST /api/banban/reports/generate
  async generateReport(request: ReportRequest): Promise<BanbanApiResponse<ReportData>> {
    try {
      const response = await apiRouter.routeRequest(
        this.baseRoute,
        '/reports/generate',
        'POST',
        request
      );
      return response;
    } catch (error) {
      return this.handleError('Failed to generate report', error);
    }
  }

  // GET /api/banban/reports/{id}
  async getReport(reportId: string, orgId: string): Promise<BanbanApiResponse<ReportData>> {
    try {
      const response = await apiRouter.routeRequest(
        this.baseRoute,
        `/reports/${reportId}?orgId=${orgId}`,
        'GET'
      );
      return response;
    } catch (error) {
      return this.handleError('Failed to fetch report', error);
    }
  }

  // GET /api/banban/reports
  async listReports(orgId: string, limit: number = 20): Promise<BanbanApiResponse<ReportData[]>> {
    try {
      const response = await apiRouter.routeRequest(
        this.baseRoute,
        `/reports?orgId=${orgId}&limit=${limit}`,
        'GET'
      );
      return response;
    } catch (error) {
      return this.handleError('Failed to list reports', error);
    }
  }

  // DELETE /api/banban/reports/{id}
  async deleteReport(reportId: string, orgId: string): Promise<BanbanApiResponse<{ success: boolean }>> {
    try {
      const response = await apiRouter.routeRequest(
        this.baseRoute,
        `/reports/${reportId}?orgId=${orgId}`,
        'DELETE'
      );
      return response;
    } catch (error) {
      return this.handleError('Failed to delete report', error);
    }
  }

  /**
   * Health and System APIs
   */
  
  // GET /api/banban/health
  async getSystemHealth(orgId: string): Promise<BanbanApiResponse<{ status: string; modules: Record<string, string> }>> {
    try {
      const response = await apiRouter.routeRequest(
        this.baseRoute,
        `/health?orgId=${orgId}`,
        'GET'
      );
      return response;
    } catch (error) {
      return this.handleError('Failed to fetch system health', error);
    }
  }

  /**
   * Utility Methods
   */
  
  private buildQueryParams(filters: Record<string, any>): string {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });
    
    return params.toString();
  }

  private handleError(message: string, error: any): BanbanApiResponse<any> {
    console.error(`BanbanAPI Error: ${message}`, error);
    return {
      success: false,
      data: null,
      error: message,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Batch Operations for Performance
   */
  
  // GET /api/banban/batch/dashboard
  async getBatchDashboardData(filters: BanbanFilters): Promise<BanbanApiResponse<{
    executive: BanbanExecutiveData;
    kpis: BanbanKPIs;
    alerts: BanbanAlert[];
    insights: BanbanInsight[];
  }>> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const response = await apiRouter.routeRequest(
        this.baseRoute,
        `/batch/dashboard?${queryParams}`,
        'GET'
      );
      return response;
    } catch (error) {
      return this.handleError('Failed to fetch batch dashboard data', error);
    }
  }

  // POST /api/banban/batch/alerts/actions
  async batchAlertActions(actions: Array<{
    alertId: string;
    action: 'resolve' | 'archive' | 'escalate';
  }>, orgId: string): Promise<BanbanApiResponse<{ processed: number; errors: any[] }>> {
    try {
      const response = await apiRouter.routeRequest(
        this.baseRoute,
        '/batch/alerts/actions',
        'POST',
        { actions, orgId }
      );
      return response;
    } catch (error) {
      return this.handleError('Failed to process batch alert actions', error);
    }
  }
} 