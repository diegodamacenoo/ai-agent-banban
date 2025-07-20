import { BANBAN_CONFIG } from '../config';
import { BanbanAPI } from './banban-api';
import type { 
  InventoryMetrics,
  BanBanConfig,
  InventoryTurnoverData,
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
import { apiRouter } from '@/shared/utils/api-router';

/**
 * Unified BanBan Service Layer
 * Phase 2: Consolidated service for all BanBan modules
 */
export class BanBanService {
  private static instance: BanBanService;
  private api: BanbanAPI;

  private constructor() {
    this.api = BanbanAPI.getInstance();
  }

  public static getInstance(): BanBanService {
    if (!BanBanService.instance) {
      BanBanService.instance = new BanBanService();
    }
    return BanBanService.instance;
  }

  public getConfig(): BanBanConfig {
    return BANBAN_CONFIG;
  }

  /**
   * Legacy Methods (Backward Compatibility)
   */
  public async getInventoryMetrics(): Promise<InventoryMetrics> {
    try {
      const response = await apiRouter.routeRequest(
        'banban-inventory',
        '/metrics',
        'GET'
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  public async getInventoryTurnover(): Promise<InventoryTurnoverData> {
    try {
      const response = await apiRouter.routeRequest(
        'banban-inventory',
        '/turnover',
        'GET'
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Phase 2: Unified Dashboard Methods
   */

  // Consolidated dashboard data for main dashboard
  async getDashboardData(orgId: string, filters?: Partial<BanbanFilters>): Promise<BanbanDashboardData> {
    try {
      const dashboardFilters: BanbanFilters = {
        orgId,
        period: filters?.period || '30d',
        ...filters
      };

      const response = await this.api.getCompleteDashboard(dashboardFilters);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch dashboard data');
      }

      return response.data;
    } catch (error) {
      console.error('BanBanService.getDashboardData error:', error);
      throw error;
    }
  }

  // Executive KPIs for executive dashboard
  async getExecutiveKPIs(orgId: string): Promise<BanbanExecutiveData> {
    try {
      const response = await this.api.getExecutiveDashboard(orgId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch executive KPIs');
      }

      return response.data;
    } catch (error) {
      console.error('BanBanService.getExecutiveKPIs error:', error);
      throw error;
    }
  }

  // Fashion-specific KPIs
  async getFashionKPIs(filters: BanbanFilters): Promise<BanbanKPIs> {
    try {
      const response = await this.api.getKPIs(filters);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch fashion KPIs');
      }

      return response.data;
    } catch (error) {
      console.error('BanBanService.getFashionKPIs error:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Alerts Management
   */

  // Get active alerts with optional filters
  async getActiveAlerts(filters: AlertFilters): Promise<BanbanAlert[]> {
    try {
      const response = await this.api.getActiveAlerts(filters);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch active alerts');
      }

      return response.data;
    } catch (error) {
      console.error('BanBanService.getActiveAlerts error:', error);
      throw error;
    }
  }

  // Get alerts history
  async getAlertsHistory(filters: AlertFilters): Promise<BanbanAlert[]> {
    try {
      const response = await this.api.getAlertsHistory(filters);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch alerts history');
      }

      return response.data;
    } catch (error) {
      console.error('BanBanService.getAlertsHistory error:', error);
      throw error;
    }
  }

  // Resolve an alert
  async resolveAlert(alertId: string, orgId: string): Promise<BanbanAlert> {
    try {
      const response = await this.api.resolveAlert(alertId, orgId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to resolve alert');
      }

      return response.data;
    } catch (error) {
      console.error('BanBanService.resolveAlert error:', error);
      throw error;
    }
  }

  // Archive an alert
  async archiveAlert(alertId: string, orgId: string): Promise<BanbanAlert> {
    try {
      const response = await this.api.archiveAlert(alertId, orgId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to archive alert');
      }

      return response.data;
    } catch (error) {
      console.error('BanBanService.archiveAlert error:', error);
      throw error;
    }
  }

  // Batch alert actions
  async processBatchAlertActions(actions: Array<{
    alertId: string;
    action: 'resolve' | 'archive' | 'escalate';
  }>, orgId: string): Promise<{ processed: number; errors: any[] }> {
    try {
      const response = await this.api.batchAlertActions(actions, orgId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to process batch alert actions');
      }

      return response.data;
    } catch (error) {
      console.error('BanBanService.processBatchAlertActions error:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Insights Management
   */

  // Get latest insights
  async getLatestInsights(filters: InsightFilters): Promise<BanbanInsight[]> {
    try {
      const response = await this.api.getLatestInsights(filters);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch latest insights');
      }

      return response.data;
    } catch (error) {
      console.error('BanBanService.getLatestInsights error:', error);
      throw error;
    }
  }

  // Get insights trends
  async getInsightsTrends(filters: InsightFilters): Promise<BanbanInsight[]> {
    try {
      const response = await this.api.getInsightsTrends(filters);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch insights trends');
      }

      return response.data;
    } catch (error) {
      console.error('BanBanService.getInsightsTrends error:', error);
      throw error;
    }
  }

  // Get insight details
  async getInsightDetails(insightId: string, orgId: string): Promise<BanbanInsight> {
    try {
      const response = await this.api.getInsightDetails(insightId, orgId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch insight details');
      }

      return response.data;
    } catch (error) {
      console.error('BanBanService.getInsightDetails error:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Inventory Analytics
   */

  // Get comprehensive inventory analytics
  async getInventoryAnalytics(filters: BanbanFilters): Promise<BanbanInventoryData> {
    try {
      const response = await this.api.getInventoryAnalytics(filters);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch inventory analytics');
      }

      return response.data;
    } catch (error) {
      console.error('BanBanService.getInventoryAnalytics error:', error);
      throw error;
    }
  }

  // Get ABC analysis
  async getABCAnalysis(filters: BanbanFilters): Promise<BanbanInventoryData['abcAnalysis']> {
    try {
      const response = await this.api.getABCAnalysis(filters);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch ABC analysis');
      }

      return response.data;
    } catch (error) {
      console.error('BanBanService.getABCAnalysis error:', error);
      throw error;
    }
  }

  // Get fast moving products
  async getFastMovingProducts(filters: BanbanFilters): Promise<BanbanInventoryData['fastMoving']> {
    try {
      const response = await this.api.getFastMovingProducts(filters);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch fast moving products');
      }

      return response.data;
    } catch (error) {
      console.error('BanBanService.getFastMovingProducts error:', error);
      throw error;
    }
  }

  // Get slow moving products
  async getSlowMovingProducts(filters: BanbanFilters): Promise<BanbanInventoryData['slowMoving']> {
    try {
      const response = await this.api.getSlowMovingProducts(filters);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch slow moving products');
      }

      return response.data;
    } catch (error) {
      console.error('BanBanService.getSlowMovingProducts error:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Webhooks and System Monitoring
   */

  // Get webhooks status
  async getWebhooksStatus(orgId: string): Promise<BanbanWebhookStatus> {
    try {
      const response = await this.api.getWebhooksStatus(orgId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch webhooks status');
      }

      return response.data;
    } catch (error) {
      console.error('BanBanService.getWebhooksStatus error:', error);
      throw error;
    }
  }

  // Get webhooks logs
  async getWebhooksLogs(orgId: string, limit: number = 50): Promise<BanbanWebhookStatus['recentLogs']> {
    try {
      const response = await this.api.getWebhooksLogs(orgId, limit);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch webhooks logs');
      }

      return response.data;
    } catch (error) {
      console.error('BanBanService.getWebhooksLogs error:', error);
      throw error;
    }
  }

  // Retry webhook flow
  async retryWebhookFlow(flowName: string, orgId: string): Promise<{ success: boolean }> {
    try {
      const response = await this.api.retryWebhookFlow(flowName, orgId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to retry webhook flow');
      }

      return response.data;
    } catch (error) {
      console.error('BanBanService.retryWebhookFlow error:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Reports Management
   */

  // Generate report
  async generateReport(request: ReportRequest): Promise<ReportData> {
    try {
      const response = await this.api.generateReport(request);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to generate report');
      }

      return response.data;
    } catch (error) {
      console.error('BanBanService.generateReport error:', error);
      throw error;
    }
  }

  // Get report
  async getReport(reportId: string, orgId: string): Promise<ReportData> {
    try {
      const response = await this.api.getReport(reportId, orgId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch report');
      }

      return response.data;
    } catch (error) {
      console.error('BanBanService.getReport error:', error);
      throw error;
    }
  }

  // List reports
  async listReports(orgId: string, limit: number = 20): Promise<ReportData[]> {
    try {
      const response = await this.api.listReports(orgId, limit);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to list reports');
      }

      return response.data;
    } catch (error) {
      console.error('BanBanService.listReports error:', error);
      throw error;
    }
  }

  // Delete report
  async deleteReport(reportId: string, orgId: string): Promise<{ success: boolean }> {
    try {
      const response = await this.api.deleteReport(reportId, orgId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete report');
      }

      return response.data;
    } catch (error) {
      console.error('BanBanService.deleteReport error:', error);
      throw error;
    }
  }

  /**
   * Phase 2: System Health
   */

  // Get system health
  async getSystemHealth(orgId: string): Promise<{ status: string; modules: Record<string, string> }> {
    try {
      const response = await this.api.getSystemHealth(orgId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch system health');
      }

      return response.data;
    } catch (error) {
      console.error('BanBanService.getSystemHealth error:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Utility Methods
   */

  // Get batch dashboard data for performance optimization
  async getBatchDashboardData(filters: BanbanFilters): Promise<{
    executive: BanbanExecutiveData;
    kpis: BanbanKPIs;
    alerts: BanbanAlert[];
    insights: BanbanInsight[];
  }> {
    try {
      const response = await this.api.getBatchDashboardData(filters);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch batch dashboard data');
      }

      return response.data;
    } catch (error) {
      console.error('BanBanService.getBatchDashboardData error:', error);
      throw error;
    }
  }

  // Create default filters for organization
  createDefaultFilters(orgId: string, period: '7d' | '30d' | '90d' = '30d'): BanbanFilters {
    return {
      orgId,
      period,
      startDate: undefined,
      endDate: undefined,
      storeIds: undefined,
      categories: undefined
    };
  }

  // Create alert filters
  createAlertFilters(orgId: string, options: Partial<AlertFilters> = {}): AlertFilters {
    const basePeriod = options.period && options.period !== 'custom' ? options.period : '30d';
    return {
      ...this.createDefaultFilters(orgId, basePeriod),
      severity: options.severity,
      category: options.category,
      status: options.status,
      period: options.period, // Keep original period including 'custom'
      startDate: options.startDate,
      endDate: options.endDate
    };
  }

  // Create insight filters
  createInsightFilters(orgId: string, options: Partial<InsightFilters> = {}): InsightFilters {
    const basePeriod = options.period && options.period !== 'custom' ? options.period : '30d';
    return {
      ...this.createDefaultFilters(orgId, basePeriod),
      type: options.type,
      confidence: options.confidence || 70, // Default minimum confidence
      period: options.period, // Keep original period including 'custom'
      startDate: options.startDate,
      endDate: options.endDate
    };
  }
} 
