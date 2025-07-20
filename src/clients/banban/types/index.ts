import { BANBAN_CONFIG } from '../config';

export type BanBanConfig = typeof BANBAN_CONFIG;

export interface InventoryMetrics {
  turnoverRate: number;
  stockHealth: {
    healthy: number;
    warning: number;
    critical: number;
  };
  storeDistribution: Array<{
    storeId: string;
    storeName: string;
    stockValue: number;
    turnoverRate: number;
  }>;
}

export interface InventoryTurnoverData {
  period: string;
  periodDays: number;
  categories: Array<{
    category: string;
    turnoverRate: number;
    averageStock: number;
    soldUnits: number;
    daysInStock: number;
    status: string;
    topProducts: Array<{
      name: string;
      turnover: number;
    }>;
  }>;
  summary: {
    averageTurnover: number;
    totalCategories: number;
    fastMoving: number;
    slowMoving: number;
  };
}

// Phase 2: Extended Types for Unified API

export interface BanbanDashboardData {
  executive: BanbanExecutiveData;
  kpis: BanbanKPIs;
  alerts: BanbanAlert[];
  insights: BanbanInsight[];
  inventory: BanbanInventoryData;
  webhooks: BanbanWebhookStatus;
  lastUpdated: string;
}

export interface BanbanExecutiveData {
  revenue: {
    current: number;
    previous: number;
    growth: number;
    trend: 'up' | 'down' | 'stable';
  };
  inventoryTurnover: {
    current: number;
    previous: number;
    growth: number;
    trend: 'up' | 'down' | 'stable';
  };
  averageMargin: {
    current: number;
    previous: number;
    growth: number;
    trend: 'up' | 'down' | 'stable';
  };
  criticalProducts: {
    current: number;
    previous: number;
    growth: number;
    trend: 'up' | 'down' | 'stable';
  };
  conversionRate: {
    current: number;
    previous: number;
    growth: number;
    trend: 'up' | 'down' | 'stable';
  };
  averageTicket: {
    current: number;
    previous: number;
    growth: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export interface BanbanKPIs {
  fashion: {
    topCategory: string;
    seasonalScore: number;
    trendsAdherence: number;
    sizePerformance: string;
    topColor: string;
    fastMovingItems: number;
    customerSatisfaction: number;
    targetAudience: string;
  };
  performance: {
    period: '7d' | '30d' | '90d';
    metrics: Array<{
      label: string;
      value: number | string;
      unit?: string;
      trend: 'up' | 'down' | 'stable';
      change?: number;
    }>;
  };
}

export interface BanbanAlert {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'estoque' | 'vendas' | 'financeiro' | 'operacional';
  source: string;
  timestamp: string;
  status: 'ativo' | 'resolvido' | 'arquivado';
  affectedProducts?: string[];
  recommendedActions: string[];
  impact: 'alto' | 'medio' | 'baixo';
  estimatedLoss?: number;
}

export interface BanbanInsight {
  id: string;
  title: string;
  description: string;
  type: 'oportunidade' | 'risco' | 'tendencia' | 'recomendacao';
  confidence: number; // 0-100
  category: string;
  impact: 'alto' | 'medio' | 'baixo';
  timeline: string;
  actionable: boolean;
  actions: Array<{
    description: string;
    expectedResult: string;
    effort: 'baixo' | 'medio' | 'alto';
  }>;
  relatedData: Record<string, any>;
  createdAt: string;
}

export interface BanbanInventoryData {
  abcAnalysis: {
    a: { percentage: number; items: number; revenue: number };
    b: { percentage: number; items: number; revenue: number };
    c: { percentage: number; items: number; revenue: number };
  };
  categoryTurnover: Array<{
    category: string;
    turnover: number;
    revenue: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  seasonalPerformance: {
    score: number;
    trend: 'up' | 'down' | 'stable';
    topSeasons: string[];
  };
  sizeMatrix: Array<{
    size: string;
    percentage: number;
    sales: number;
  }>;
  colorTrends: Array<{
    color: string;
    growth: number;
    popularity: number;
  }>;
  fastMoving: Array<{
    product: string;
    category: string;
    turnover: number;
    stock: number;
  }>;
  slowMoving: Array<{
    product: string;
    category: string;
    daysInStock: number;
    value: number;
  }>;
}

export interface BanbanWebhookStatus {
  flows: Array<{
    name: string;
    status: 'ativo' | 'inativo' | 'erro';
    successRate: number;
    avgProcessingTime: number;
    lastProcessed: string;
    errorCount: number;
  }>;
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    responseTime: number;
  };
  recentLogs: Array<{
    timestamp: string;
    flow: string;
    status: 'success' | 'error' | 'warning';
    message: string;
    processingTime: number;
  }>;
}

export interface ReportData {
  id: string;
  type: 'executive' | 'performance' | 'alerts' | 'insights' | 'inventory';
  title: string;
  generatedAt: string;
  period: {
    start: string;
    end: string;
  };
  format: 'pdf' | 'excel' | 'csv';
  data: Record<string, any>;
  downloadUrl?: string;
  status: 'generating' | 'ready' | 'error';
}

// API Response Types
export interface BanbanApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  timestamp: string;
}

// Service Method Parameters
export interface BanbanFilters {
  orgId: string;
  period?: '7d' | '30d' | '90d' | 'custom';
  startDate?: string;
  endDate?: string;
  storeIds?: string[];
  categories?: string[];
}

export interface AlertFilters extends BanbanFilters {
  severity?: BanbanAlert['severity'][];
  category?: BanbanAlert['category'][];
  status?: BanbanAlert['status'][];
}

export interface InsightFilters extends BanbanFilters {
  type?: BanbanInsight['type'][];
  confidence?: number; // minimum confidence
}

export interface ReportRequest extends BanbanFilters {
  type: ReportData['type'];
  format: ReportData['format'];
  includeCharts?: boolean;
  customFields?: string[];
}
