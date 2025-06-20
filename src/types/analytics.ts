// ================================================
// TYPES: Analytics Tables for Advanced Dashboard
// Data: 17/12/2024
// Descrição: Tipos TypeScript para módulos analíticos avançados
// ================================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ABCCategory = 'A' | 'B' | 'C';
export type AgingCategory = 'fresh' | 'slow' | 'stagnant' | 'dead';
export type DeliveryStatus = 'pending' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled';
export type PromotionStatus = 'pending' | 'approved' | 'active' | 'completed' | 'rejected';
export type PromotionReasonCode = 'slow_moving' | 'excess_inventory' | 'seasonal_clearance' | 'margin_optimization';

// ================================================
// 1. MÓDULO DE TENDÊNCIA E PREVISÃO
// ================================================

export interface ForecastSales {
  id: string;
  variant_id: string;
  location_id?: string;
  forecast_date: string;
  forecast_horizon_days: 7 | 14 | 30;
  predicted_sales: number;
  confidence_interval_low: number;
  confidence_interval_high: number;
  model_accuracy?: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectedCoverage {
  id: string;
  variant_id: string;
  location_id: string;
  analysis_date: string;
  current_stock: number;
  avg_daily_sales: number;
  projected_days_coverage: number;
  projected_stockout_date?: string;
  risk_level: RiskLevel;
  created_at: string;
}

// ================================================
// 2. MÓDULO DE ANÁLISE DE MIX E ROTATIVIDADE
// ================================================

export interface ABCAnalysis {
  id: string;
  analysis_date: string;
  variant_id: string;
  location_id?: string;
  revenue_contribution: number;
  stock_value: number;
  cumulative_revenue_percentage: number;
  abc_category: ABCCategory;
  turnover_rate: number;
  days_of_inventory: number;
  priority_score: number;
  created_at: string;
}

export interface EnhancedStagnantProduct {
  id: string;
  analysis_date: string;
  variant_id: string;
  location_id: string;
  days_without_movement: number;
  last_movement_date?: string;
  current_stock: number;
  suggested_action?: string;
  aging_category?: AgingCategory;
  priority_score?: number;
  status?: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  created_at: string;
}

// ================================================
// 3. MÓDULO DE LOGÍSTICA E FORNECEDORES
// ================================================

export interface SupplierMetrics {
  id: string;
  supplier_id: string;
  analysis_period_start: string;
  analysis_period_end: string;
  total_orders: number;
  avg_lead_time_days: number;
  sla_lead_time_days: number;
  lead_time_variance: number;
  fill_rate_percentage: number;
  divergence_rate_percentage: number;
  on_time_delivery_rate: number;
  quality_score: number;
  performance_score: number;
  created_at: string;
  updated_at: string;
}

export interface DeliveryTracking {
  id: string;
  order_id: string;
  supplier_id: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  lead_time_days?: number;
  delivery_status: DeliveryStatus;
  delay_reason?: string;
  quality_rating?: number;
  created_at: string;
  updated_at: string;
}

// ================================================
// 4. MÓDULO DE RENTABILIDADE E PRECIFICAÇÃO
// ================================================

export interface EnhancedProductPricing {
  id: string;
  variant_id: string;
  price_value: number;
  valid_from: string;
  valid_to?: string;
  change_reason?: string;
  margin_percentage?: number;
  cost_price?: number;
  markup_percentage?: number;
  created_at: string;
}

export interface PriceSimulation {
  id: string;
  variant_id: string;
  location_id?: string;
  current_price: number;
  simulated_price: number;
  price_change_percentage: number;
  current_margin_percentage: number;
  projected_margin_percentage: number;
  projected_volume_impact: number;
  projected_revenue_impact: number;
  simulation_notes?: string;
  created_by?: string;
  simulation_date: string;
}

export interface PriceElasticity {
  id: string;
  variant_id: string;
  location_id?: string;
  price_elasticity_coefficient: number;
  confidence_level: number;
  r_squared: number;
  analysis_period_start: string;
  analysis_period_end: string;
  sample_size: number;
  created_at: string;
}

// ================================================
// 5. MÓDULO DE ALERTAS AVANÇADOS
// ================================================

export interface DynamicSafetyStock {
  id: string;
  variant_id: string;
  location_id: string;
  analysis_date: string;
  demand_average: number;
  demand_variance: number;
  lead_time_average: number;
  lead_time_variance: number;
  service_level_target: number;
  calculated_safety_stock: number;
  current_safety_stock?: number;
  recommendation?: string;
  created_at: string;
}

export interface PromotionRecommendation {
  id: string;
  variant_id: string;
  location_id?: string;
  analysis_date: string;
  reason_code: PromotionReasonCode;
  recommended_discount_percentage: number;
  estimated_lift_percentage: number;
  recommended_duration_days: number;
  expected_margin_impact: number;
  expected_revenue_impact: number;
  priority_score: number;
  status: PromotionStatus;
  created_at: string;
}

// ================================================
// 6. CONFIGURAÇÃO E METADADOS
// ================================================

export interface AnalyticsConfig {
  id: string;
  organization_id: string;
  config_type: string;
  config_key: string;
  config_value: any;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface MetricsCache {
  id: string;
  cache_key: string;
  metric_type: string;
  filters: any;
  data: any;
  expires_at: string;
  created_at: string;
}

// ================================================
// TIPOS AUXILIARES PARA DASHBOARD
// ================================================

export interface ForecastData {
  dates: string[];
  predictions: number[];
  confidenceHigh: number[];
  confidenceLow: number[];
  accuracy: number;
}

export interface ABCChart {
  category: ABCCategory;
  count: number;
  revenue_percentage: number;
  products: {
    variant_id: string;
    product_name: string;
    revenue_contribution: number;
    turnover_rate: number;
  }[];
}

export interface SupplierPerformance {
  supplier_id: string;
  supplier_name: string;
  performance_score: number;
  on_time_delivery_rate: number;
  fill_rate_percentage: number;
  avg_lead_time_days: number;
  trend: 'up' | 'down' | 'stable';
}

export interface PriceOptimizationSuggestion {
  variant_id: string;
  product_name: string;
  current_price: number;
  suggested_price: number;
  expected_margin_improvement: number;
  expected_revenue_impact: number;
  confidence_score: number;
}

export interface InventoryRiskMatrix {
  variant_id: string;
  product_name: string;
  abc_category: ABCCategory;
  risk_level: RiskLevel;
  days_coverage: number;
  recommended_action: string;
  priority_score: number;
}

// ================================================
// CONFIGURAÇÕES DE FILTROS PARA DASHBOARD
// ================================================

export interface DashboardFilters {
  dateRange: {
    start: string;
    end: string;
  };
  locations?: string[];
  categories?: string[];
  suppliers?: string[];
  riskLevels?: RiskLevel[];
  abcCategories?: ABCCategory[];
}

export interface MetricTrend {
  current: number;
  previous: number;
  change_percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface KPICard {
  title: string;
  value: number | string;
  trend?: MetricTrend;
  format: 'currency' | 'percentage' | 'number' | 'days';
  description?: string;
  alert_level?: RiskLevel;
} 