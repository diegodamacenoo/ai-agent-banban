// ================================================
// TIPOS E INTERFACES - MÓDULO BANBAN INSIGHTS
// ================================================

// Tipos básicos para evitar dependências diretas
export interface BackendModuleInterface {
  moduleId: string;
  clientId: string;
  configuration: any;
  endpoints: string[];
  validations: Record<string, string>;
}

// ================================================
// INTERFACES PRINCIPAIS
// ================================================

export interface BanbanInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  severity: InsightSeverity;
  priority: number;
  financialImpact: number;
  affectedProducts: number;
  affectedStores: number;
  actionSuggestions: string[];
  createdAt: string;
  expiresAt?: string;
  organizationId: string;
  metadata?: Record<string, any>;
}

export interface InsightContext {
  organizationId: string;
  timeframe: {
    start: string;
    end: string;
  };
  filters?: {
    categories?: string[];
    stores?: string[];
    collections?: string[];
  };
}

export interface FinancialImpactCalculation {
  currentLoss: number;
  potentialGain: number;
  opportunityCost: number;
  timeToAction: number; // days
  confidenceLevel: number; // 0-1
}

// ================================================
// ENUMS
// ================================================

export enum InsightType {
  LOW_STOCK = 'LOW_STOCK',
  LOW_MARGIN = 'LOW_MARGIN', 
  SLOW_MOVING = 'SLOW_MOVING',
  OPPORTUNITY = 'OPPORTUNITY',
  SEASONAL_TREND = 'SEASONAL_TREND',
  SUPPLIER_ISSUE = 'SUPPLIER_ISSUE',
  DISTRIBUTION_OPTIMIZATION = 'DISTRIBUTION_OPTIMIZATION'
}

export enum InsightSeverity {
  CRITICAL = 'CRITICAL',     // 🔴
  ATTENTION = 'ATTENTION',   // 🟡  
  MODERATE = 'MODERATE',     // 🟠
  OPPORTUNITY = 'OPPORTUNITY' // 🟢
}

// ================================================
// INTERFACES DE CONFIGURAÇÃO
// ================================================

export interface ModuleConfiguration {
  updateInterval: number;
  cacheTimeout: number;
  stockThreshold: number;
  marginThreshold: number;
  slowMovingDays: number;
}

export interface ModuleConfig {
  name: string;
  version: string;
  vendor: string;
  description: string;
  endpoints: string[];
}

export interface ModuleInitResult {
  name: string;
  version: string;
  vendor: string;
  status: 'active' | 'inactive' | 'error';
  configuration: ModuleConfiguration;
  endpoints: string[];
}

// ================================================
// INTERFACES DE DADOS
// ================================================

export interface ProductData {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  currentStock: number;
  monthlySales: number;
  avgSalesPerDay: number;
  margin: number;
  potentialMarginGain?: number;
  lastSaleDate?: string;
  stores?: string[];
}

export interface StoreData {
  id: string;
  name: string;
  location: string;
  products: ProductData[];
}

export interface CategoryData {
  name: string;
  products: ProductData[];
  stores: StoreData[];
}

// ================================================
// INTERFACES DE ANÁLISE
// ================================================

export interface CrossSellingOpportunity {
  productA: string;
  productB: string;
  confidence: number;
  potentialRevenue: number;
  frequency: number;
}

export interface SeasonalTrend {
  season: string;
  category: string;
  growthRate: number;
  peakMonths: string[];
  recommendation: string;
}

export interface SupplierIssue {
  supplierId: string;
  supplierName: string;
  issueType: 'delay' | 'quality' | 'price' | 'availability';
  affectedProducts: string[];
  severity: InsightSeverity;
  estimatedImpact: number;
}

// ================================================
// INTERFACES DE RESPOSTA
// ================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface HealthCheckResponse {
  healthy: boolean;
  details: {
    module: string;
    status: string;
    metricsCount?: number;
    lastActivity?: string;
    error?: string;
    cache?: {
      size: number;
      hitRate: number;
    };
  };
}

export interface MetricsResponse {
  insights: Record<string, any>;
  performance: {
    generationTime: number;
    cacheHitRate: number;
    errorRate: number;
  };
}

// ================================================
// INTERFACES DE CACHE
// ================================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  organizationId: string;
}

export interface CacheManager {
  get<T>(key: string): Promise<CacheEntry<T> | null>;
  set<T>(key: string, data: T, ttl: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

// ================================================
// INTERFACES DE LOGGER
// ================================================

export interface LoggerInterface {
  info(module: string, message: string, metadata?: any): void;
  error(module: string, message: string, metadata?: any): void;
  warn(module: string, message: string, metadata?: any): void;
  debug(module: string, message: string, metadata?: any): void;
}

export interface MetricsInterface {
  record(module: string, metric: string, value: number): void;
  getMetrics(module: string): Record<string, any>;
}

// ================================================
// INTERFACES DE CONFIGURAÇÃO AVANÇADA
// ================================================

export interface BusinessRules {
  criticalStockLevel: number;
  lowMarginThreshold: number;
  slowMovingDaysThreshold: number;
  maxInsightsPerGeneration: number;
  priorityWeights: {
    financial: number;
    urgency: number;
    impact: number;
  };
}

export interface AlertThresholds {
  critical: number;
  attention: number;
  moderate: number;
  opportunity: number;
}

export interface ModuleSettings {
  businessRules: BusinessRules;
  alertThresholds: AlertThresholds;
  caching: {
    enabled: boolean;
    ttl: number;
    maxEntries: number;
  };
  performance: {
    maxConcurrentAnalysis: number;
    timeoutMs: number;
    retryAttempts: number;
  };
} 