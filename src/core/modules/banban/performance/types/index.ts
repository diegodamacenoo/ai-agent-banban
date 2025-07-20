// ================================================
// TIPOS E INTERFACES - MÓDULO BANBAN PERFORMANCE
// ================================================

// Tipos básicos para Fastify (evitando dependência direta)
export interface FastifyInstance {
  get: (path: string, handler: (request: any, reply: any) => Promise<any>) => void;
  post: (path: string, handler: (request: any, reply: any) => Promise<any>) => void;
}

export interface FastifyRequest {
  organizationId?: string;
  params?: any;
  query?: any;
  body?: any;
}

export interface FastifyReply {
  code: (statusCode: number) => FastifyReply;
  send: (payload: any) => FastifyReply;
}

// ================================================
// INTERFACES DE MÉTRICAS
// ================================================

export interface FashionMetrics {
  revenue: number;
  units: number;
  profit: number;
  margin: number;
  collections: CollectionPerformance[];
  categories: CategoryMetrics[];
}

export interface CollectionPerformance {
  id: string;
  name: string;
  season: string;
  revenue: number;
  units_sold: number;
  profit_margin: number;
  top_products: ProductMetrics[];
}

export interface CategoryMetrics {
  category: string;
  revenue: number;
  units: number;
  growth_rate: number;
  inventory_turnover: number;
}

export interface ProductMetrics {
  id: string;
  name: string;
  sku: string;
  revenue: number;
  units_sold: number;
  profit_margin: number;
  sizes_sold: SizeMetrics[];
  colors_sold: ColorMetrics[];
}

export interface SizeMetrics {
  size: string;
  units_sold: number;
  percentage: number;
}

export interface ColorMetrics {
  color: string;
  units_sold: number;
  percentage: number;
}

// ================================================
// INTERFACES DE INVENTÁRIO
// ================================================

export interface InventoryTurnover {
  overall_turnover: number;
  by_category: CategoryTurnover[];
  slow_moving_items: SlowMovingItem[];
  seasonal_trends: SeasonalTrend[];
}

export interface CategoryTurnover {
  category: string;
  turnover_rate: number;
  days_on_hand: number;
  stock_level: 'low' | 'optimal' | 'high';
}

export interface SlowMovingItem {
  product_id: string;
  name: string;
  days_without_sale: number;
  current_stock: number;
  recommended_action: 'discount' | 'clearance' | 'return_supplier';
}

export interface SeasonalTrend {
  season: string;
  peak_months: string[];
  average_turnover: number;
  growth_projection: number;
}

// ================================================
// INTERFACES DE DASHBOARD
// ================================================

export interface SeasonalAnalysis {
  current_season: string;
  performance: {
    revenue_vs_target: number;
    units_vs_target: number;
    margin_improvement: number;
  };
  trends: SeasonalTrendData[];
}

export interface SeasonalTrendData {
  season: string;
  revenue: number;
  growth_rate: number;
}

export interface BrandPerformance {
  brand_name: string;
  overall_score: number;
  metrics: {
    customer_satisfaction: number;
    product_quality: number;
    delivery_performance: number;
    return_rate: number;
  };
  top_performers: TopPerformer[];
}

export interface TopPerformer {
  product: string;
  score: number;
}

export interface ExecutiveDashboard {
  kpis: {
    monthly_revenue: number;
    revenue_growth: number;
    gross_margin: number;
    inventory_turnover: number;
    customer_acquisition: number;
    customer_retention: number;
  };
  alerts: DashboardAlert[];
  trends: {
    revenue_trend: 'up' | 'down' | 'stable';
    margin_trend: 'up' | 'down' | 'stable';
    inventory_trend: 'optimal' | 'high' | 'low';
  };
}

export interface DashboardAlert {
  type: 'warning' | 'error' | 'info';
  message: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ProductMargins {
  overall_margin: number;
  by_category: CategoryMargin[];
  top_margin_products: TopMarginProduct[];
  margin_optimization_suggestions: MarginOptimization[];
}

export interface CategoryMargin {
  category: string;
  margin: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TopMarginProduct {
  name: string;
  margin: number;
  units_sold: number;
}

export interface MarginOptimization {
  product: string;
  current_margin: number;
  suggested_margin: number;
  action: string;
}

// ================================================
// INTERFACES DE CONFIGURAÇÃO
// ================================================

export interface ModuleConfig {
  name: string;
  version: string;
  vendor: string;
  description: string;
  endpoints: string[];
}

export interface ModuleConfiguration {
  refreshInterval: number;
  cacheEnabled: boolean;
  maxDataPoints: number;
  alertThresholds: {
    lowStock: number;
    lowMargin: number;
    slowMoving: number;
  };
}

export interface ModuleInitResult {
  name: string;
  version: string;
  vendor: string;
  status: string;
  configuration: ModuleConfiguration;
  endpoints: string[];
}

// ================================================
// INTERFACES DE RESPOSTA DA API
// ================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  timestamp: string;
} 