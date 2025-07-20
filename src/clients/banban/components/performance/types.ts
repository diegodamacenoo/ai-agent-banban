// Performance Module Types - Banban Fashion BI Dashboard
// Baseado no plano executivo: performance-module-plan.md

// ===== CORE INTERFACES =====

export interface PerformanceKPIs {
  // Financeiro
  total_revenue: {
    value: number;
    vs_last_period: number;
    vs_last_year: number;
    trend: 'up' | 'down' | 'stable';
  };
  
  gross_margin_percentage: {
    value: number;
    vs_target: number;
    vs_last_period: number;
  };
  
  average_ticket: {
    value: number;
    vs_last_period: number;
    breakdown_by_category: Record<string, number>;
  };
  
  // Operacional
  inventory_turnover: {
    value: number; // giros por ano
    vs_optimal: number;
    by_category: Record<string, number>;
  };
  
  sellthrough_rate: {
    value: number; // % vendido do que foi comprado
    vs_last_season: number;
    full_price_rate: number; // % vendido sem desconto
  };
  
  stock_coverage_days: {
    value: number;
    vs_optimal: number;
    by_location: Record<string, number>;
  };
}

// ===== TEMPORAL ANALYSIS =====

export interface TimeSeriesData {
  date: string;
  value: number;
  period_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface YearComparisonData {
  current_year: TimeSeriesData[];
  previous_year: TimeSeriesData[];
  growth_percentage: number;
}

export interface CategoryTimeSeriesData extends TimeSeriesData {
  category: string;
  subcategory?: string;
}

export interface SeasonalData {
  season: string;
  months: string[];
  performance_index: number;
  vs_average: number;
}

export interface MonthlyPatternData {
  month: number;
  month_name: string;
  average_sales: number;
  seasonal_index: number;
}

export interface WeeklyPatternData {
  week_of_year: number;
  average_sales: number;
  seasonal_index: number;
}

export interface DayPatternData {
  day_of_week: number;
  day_name: string;
  average_sales: number;
  peak_hours: number[];
}

export interface HolidayImpactData {
  holiday_name: string;
  date: string;
  impact_percentage: number;
  sales_lift: number;
}

export interface TemporalAnalysis {
  // Tendências Principais
  sales_over_time: {
    daily: TimeSeriesData[];
    weekly: TimeSeriesData[];
    monthly: TimeSeriesData[];
    yearly_comparison: YearComparisonData[];
  };
  
  margin_evolution: {
    by_period: TimeSeriesData[];
    by_category: CategoryTimeSeriesData[];
    seasonal_patterns: SeasonalData[];
  };
  
  // Padrões Sazonais
  seasonality_patterns: {
    by_month: MonthlyPatternData[];
    by_week: WeeklyPatternData[];
    by_day_of_week: DayPatternData[];
    holiday_impact: HolidayImpactData[];
  };
  
  // Comparações Temporais
  year_over_year: {
    revenue_growth: TimeSeriesData[];
    margin_evolution: TimeSeriesData[];
    category_performance: CategoryComparisonData[];
  };
}

// ===== RANKINGS & COMPARISONS =====

export interface ProductPerformanceData {
  rank: number;
  sku: string;
  product_name: string;
  category: string;
  brand: string;
  total_sales: number;
  units_sold: number;
  margin_percentage: number;
  growth_vs_last_period: number;
  performance_score: number; // 0-100
}

export interface CategoryPerformanceData {
  rank: number;
  category: string;
  revenue: number;
  market_share: number;
  growth_percentage: number;
  margin: number;
  velocity: number; // vendas por dia
}

export interface BrandPerformanceData {
  rank: number;
  brand: string;
  revenue: number;
  market_share: number;
  avg_margin: number;
  performance_score: number;
  trend: 'ascending' | 'stable' | 'declining';
}

export interface MarginAnalysisData {
  product_id: string;
  margin_percentage: number;
  vs_target: number;
  category: string;
}

export interface CategoryComparisonData {
  category: string;
  current_period: number;
  previous_period: number;
  growth_percentage: number;
}

export interface RankingAnalysis {
  // Top Performers
  top_products: ProductPerformanceData[];
  top_categories: CategoryPerformanceData[];
  top_brands: BrandPerformanceData[];
  
  // Bottom Performers (para atenção)
  underperformers: {
    slowest_products: ProductPerformanceData[];
    declining_categories: CategoryPerformanceData[];
    low_margin_items: MarginAnalysisData[];
  };
}

// ===== GEOGRAPHIC ANALYSIS =====

export interface StorePerformanceData {
  store_id: string;
  store_name: string;
  location: string;
  revenue: number;
  margin: number;
  average_ticket: number;
  conversion_rate: number;
  traffic: number;
  revenue_per_sqm: number;
  growth_vs_last_period: number;
  ranking_position: number;
  performance_tier: 'A' | 'B' | 'C' | 'D';
}

export interface RegionalPerformanceData {
  region: string;
  total_revenue: number;
  average_margin: number;
  store_count: number;
  growth_percentage: number;
}

export interface RegionalPreferenceData {
  region: string;
  category: string;
  preference_index: number;
  sales_percentage: number;
}

export interface RegionalSeasonalData {
  region: string;
  season: string;
  performance_index: number;
  vs_national_average: number;
}

export interface StoreTransferData {
  from_store: string;
  to_store: string;
  product_sku: string;
  recommended_quantity: number;
  potential_sales_lift: number;
}

export interface GeographicAnalysis {
  performance_by_store: StorePerformanceData[];
  regional_patterns: {
    by_region: RegionalPerformanceData[];
    category_preferences: RegionalPreferenceData[];
    seasonal_variations: RegionalSeasonalData[];
  };
  
  transfer_opportunities: {
    excess_vs_demand: StoreTransferData[];
    optimization_potential: number;
  };
}

// ===== PRODUCT ANALYSIS (Fashion-Specific) =====

export interface SizePerformanceData {
  size: string;
  sales_volume: number;
  velocity: number;
  stock_level: number;
  conversion_rate: number;
}

export interface ColorPerformanceData {
  color: string;
  popularity_score: number;
  velocity: number;
  markdown_rate: number;
}

export interface PricePointData {
  price_range: {
    min: number;
    max: number;
  };
  sales_volume: number;
  units_sold: number;
  margin_percentage: number;
  market_share: number;
}

export interface ProductCategoryAnalysis {
  category: string;
  subcategory?: string;
  revenue: number;
  units_sold: number;
  avg_price: number;
  margin: number;
  inventory_turnover: number;
  seasonal_index: number;
  lifecycle_stage: 'launch' | 'growth' | 'maturity' | 'decline';
}

export interface ProductAnalysis {
  // Análise por Categoria
  category_performance: ProductCategoryAnalysis[];
  
  // Matriz de Variações (Fashion-Specific)
  variation_matrix: {
    size_performance: SizePerformanceData[];
    color_performance: ColorPerformanceData[];
  };
  
  // Análise de Ciclo de Vida
  lifecycle_analysis: {
    new_arrivals: {
      performance_score: number;
      sellthrough_rate: number;
      time_to_first_sale: number;
    };
    
    end_of_season: {
      clearance_rate: number;
      markdown_percentage: number;
      remaining_inventory: number;
    };
    
    evergreen_products: {
      consistency_score: number;
      year_round_performance: number;
    };
  };
  
  // Fashion-Specific Metrics
  fashion_metrics: {
    full_price_sellthrough: number; // % vendido sem desconto
    seasonal_compliance: number; // % produtos da estação certa
    trend_vs_classic_ratio: number;
    price_point_distribution: PricePointData[];
  };
}

// ===== UNIFIED FILTERS =====

export interface UnifiedFilters {
  // Temporal
  date_range: {
    preset: 'last_7_days' | 'last_30_days' | 'last_quarter' | 'ytd' | 'custom';
    start_date: string;
    end_date: string;
    comparison_period?: 'previous_period' | 'last_year' | 'none';
  };
  
  // Dimensões
  categories: string[];
  brands: string[];
  stores: string[];
  price_ranges: Array<{min: number; max: number}>;
  
  // Atributos Fashion
  seasons: string[];
  collections: string[];
  sizes: string[];
  colors: string[];
  
  // Performance
  performance_tier?: 'A' | 'B' | 'C' | 'D';
  margin_threshold?: {min: number; max: number};
  velocity_threshold?: {min: number; max: number};
}

// ===== CALCULATED METRICS =====

export interface CalculatedMetrics {
  inventory_turnover: 'cost_of_goods_sold / average_inventory';
  sellthrough_rate: 'units_sold / units_received * 100';
  margin_percentage: '(selling_price - cost_price) / selling_price * 100';
  performance_score: 'weighted_average(sales_velocity, margin, growth)';
  seasonal_index: 'current_period_sales / average_period_sales';
  velocity: 'units_sold / days_available';
}

// ===== DASHBOARD STATE =====

export interface DashboardState {
  filters: UnifiedFilters;
  active_context: 'kpis' | 'temporal' | 'rankings' | 'geographic' | 'products';
  loading_states: {
    kpis: boolean;
    temporal: boolean;
    rankings: boolean;
    geographic: boolean;
    products: boolean;
  };
  drill_down_path: string[];
  comparison_mode: boolean;
}

// ===== API RESPONSES =====

export interface PerformanceApiResponse<T> {
  data: T;
  metadata: {
    last_updated: string;
    cache_expiry: string;
    calculation_time_ms: number;
    data_freshness: 'real_time' | 'cached' | 'historical';
  };
  filters_applied: Partial<UnifiedFilters>;
}

// ===== ERROR HANDLING =====

export interface PerformanceError {
  code: string;
  message: string;
  context?: string;
  timestamp: string;
}

// ===== EXPORT TYPES =====

export interface ExportConfig {
  format: 'excel' | 'pdf' | 'csv';
  sections: Array<'kpis' | 'temporal' | 'rankings' | 'geographic' | 'products'>;
  filters: UnifiedFilters;
  title?: string;
  company_name?: string;
}