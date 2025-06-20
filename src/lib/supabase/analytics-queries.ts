// ================================================
// ANALYTICS QUERIES: Helper functions for analytics data
// Data: 17/12/2024
// Descrição: Funções para consultar dados analíticos avançados
// ================================================

import { createSupabaseClient as createServerClient } from '@/lib/supabase/server';
import { createSupabaseClient as createClientSide } from '@/lib/supabase/client';
import { cookies } from 'next/headers';
import type {
  ForecastSales,
  ProjectedCoverage,
  ABCAnalysis,
  SupplierMetrics,
  PriceSimulation,
  DynamicSafetyStock,
  PromotionRecommendation,
  DashboardFilters,
  ABCChart,
  SupplierPerformance,
  InventoryRiskMatrix,
  ForecastData
} from '@/types/analytics';

// Função helper para criar cliente Supabase baseado no contexto
async function getSupabaseClient() {
  // Se estamos no lado do servidor (cookies disponível)
  try {
    const cookieStore = await cookies();
    return createServerClient(cookieStore);
  } catch {
    // Se estamos no lado do cliente
    return createClientSide();
  }
}

// ================================================
// 1. MÓDULO DE TENDÊNCIA E PREVISÃO
// ================================================

export async function getForecastSales(
  filters: Partial<DashboardFilters> = {}
): Promise<ForecastSales[]> {
  const supabase = await getSupabaseClient();
  
  let query = supabase
    .from('forecast_sales')
    .select(`
      *,
      core_product_variants!inner(
        sku,
        color,
        size,
        core_products(product_name, category)
      ),
      core_locations(location_name)
    `);

  if (filters.locations?.length) {
    query = query.in('location_id', filters.locations);
  }

  if (filters.dateRange) {
    query = query
      .gte('forecast_date', filters.dateRange.start)
      .lte('forecast_date', filters.dateRange.end);
  }

  const { data, error } = await query.order('forecast_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getProjectedCoverage(
  riskLevels?: string[]
): Promise<ProjectedCoverage[]> {
  const supabase = await getSupabaseClient();
  
  let query = supabase
    .from('projected_coverage')
    .select(`
      *,
      core_product_variants!inner(
        sku,
        color,
        size,
        core_products(product_name, category)
      ),
      core_locations(location_name)
    `);

  if (riskLevels?.length) {
    query = query.in('risk_level', riskLevels);
  }

  const { data, error } = await query.order('projected_days_coverage', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function buildForecastChart(
  variantId: string,
  horizonDays: 7 | 14 | 30
): Promise<ForecastData> {
  const supabase = await getSupabaseClient();
  
  const { data, error } = await supabase
    .from('forecast_sales')
    .select('*')
    .eq('variant_id', variantId)
    .eq('forecast_horizon_days', horizonDays)
    .order('forecast_date', { ascending: true });

  if (error) throw error;

  const forecasts = data || [];
  
  return {
    dates: forecasts.map((f: any) => f.forecast_date),
    predictions: forecasts.map((f: any) => f.predicted_sales),
    confidenceHigh: forecasts.map((f: any) => f.confidence_interval_high),
    confidenceLow: forecasts.map((f: any) => f.confidence_interval_low),
    accuracy: forecasts.length > 0 ? forecasts[0].model_accuracy || 0 : 0
  };
}

// ================================================
// 2. MÓDULO DE ANÁLISE DE MIX E ROTATIVIDADE
// ================================================

export async function getABCAnalysis(
  analysisDate: string,
  locations?: string[]
): Promise<ABCAnalysis[]> {
  const supabase = await getSupabaseClient();
  
  let query = supabase
    .from('abc_analysis')
    .select(`
      *,
      core_product_variants!inner(
        sku,
        color,
        size,
        core_products(product_name, category)
      ),
      core_locations(location_name)
    `)
    .eq('analysis_date', analysisDate);

  if (locations?.length) {
    query = query.in('location_id', locations);
  }

  const { data, error } = await query.order('priority_score', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getABCChart(analysisDate: string): Promise<ABCChart[]> {
  const supabase = await getSupabaseClient();
  
  const { data, error } = await supabase
    .from('abc_analysis')
    .select(`
      abc_category,
      revenue_contribution,
      core_product_variants!inner(
        id,
        sku,
        core_products(product_name)
      )
    `)
    .eq('analysis_date', analysisDate);

  if (error) throw error;

  const analysis = data || [];
  
  // Agrupar por categoria ABC
  const grouped = analysis.reduce((acc: any, item: any) => {
    const category = item.abc_category;
    if (!acc[category]) {
      acc[category] = {
        category: category as 'A' | 'B' | 'C',
        count: 0,
        revenue_percentage: 0,
        products: []
      };
    }
    
    acc[category].count++;
    acc[category].revenue_percentage += item.revenue_contribution;
    acc[category].products.push({
      variant_id: item.core_product_variants.id,
      product_name: item.core_product_variants.core_products.product_name,
      revenue_contribution: item.revenue_contribution,
      turnover_rate: 0 // Será calculado pela view/join
    });
    
    return acc;
  }, {} as Record<string, ABCChart>);

  return Object.values(grouped);
}

// ================================================
// 3. MÓDULO DE LOGÍSTICA E FORNECEDORES
// ================================================

export async function getSupplierMetrics(
  periodStart?: string,
  periodEnd?: string
): Promise<SupplierMetrics[]> {
  const supabase = await getSupabaseClient();
  
  let query = supabase
    .from('supplier_metrics')
    .select(`
      *,
      core_suppliers(trade_name)
    `);

  if (periodStart && periodEnd) {
    query = query
      .gte('analysis_period_start', periodStart)
      .lte('analysis_period_end', periodEnd);
  }

  const { data, error } = await query.order('performance_score', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getSupplierPerformanceChart(): Promise<SupplierPerformance[]> {
  const metrics = await getSupplierMetrics();
  
  return metrics.map(m => ({
    supplier_id: m.supplier_id,
    supplier_name: (m as any).core_suppliers?.trade_name || 'Desconhecido',
    performance_score: m.performance_score,
    on_time_delivery_rate: m.on_time_delivery_rate,
    fill_rate_percentage: m.fill_rate_percentage,
    avg_lead_time_days: m.avg_lead_time_days,
    trend: m.performance_score > 80 ? 'up' : m.performance_score > 60 ? 'stable' : 'down' as 'up' | 'down' | 'stable'
  }));
}

// ================================================
// 4. MÓDULO DE RENTABILIDADE E PRECIFICAÇÃO
// ================================================

export async function getPriceSimulations(
  variantId?: string
): Promise<PriceSimulation[]> {
  const supabase = await getSupabaseClient();
  
  let query = supabase
    .from('price_simulations')
    .select(`
      *,
      core_product_variants!inner(
        sku,
        color,
        core_products(product_name)
      ),
      core_locations(location_name)
    `);

  if (variantId) {
    query = query.eq('variant_id', variantId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createPriceSimulation(
  simulation: Omit<PriceSimulation, 'id' | 'simulation_date'>
): Promise<PriceSimulation> {
  const supabase = await getSupabaseClient();
  
  const { data, error } = await supabase
    .from('price_simulations')
    .insert([simulation])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ================================================
// 5. MÓDULO DE ALERTAS AVANÇADOS
// ================================================

export async function getDynamicSafetyStock(
  analysisDate: string,
  locations?: string[]
): Promise<DynamicSafetyStock[]> {
  const supabase = await getSupabaseClient();
  
  let query = supabase
    .from('dynamic_safety_stock')
    .select(`
      *,
      core_product_variants!inner(
        sku,
        color,
        core_products(product_name)
      ),
      core_locations(location_name)
    `)
    .eq('analysis_date', analysisDate);

  if (locations?.length) {
    query = query.in('location_id', locations);
  }

  const { data, error } = await query.order('calculated_safety_stock', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getPromotionRecommendations(
  status?: string[]
): Promise<PromotionRecommendation[]> {
  const supabase = await getSupabaseClient();
  
  let query = supabase
    .from('promotion_recommendations')
    .select(`
      *,
      core_product_variants!inner(
        sku,
        color,
        core_products(product_name)
      ),
      core_locations(location_name)
    `);

  if (status?.length) {
    query = query.in('status', status);
  }

  const { data, error } = await query.order('priority_score', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updatePromotionStatus(
  id: string,
  status: string,
  userId?: string
): Promise<void> {
  const supabase = await getSupabaseClient();
  
  const { error } = await supabase
    .from('promotion_recommendations')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
}

// ================================================
// 6. MÓDULO DE DRILL-DOWN E INTERATIVIDADE
// ================================================

export async function getInventoryRiskMatrix(): Promise<InventoryRiskMatrix[]> {
  // Esta função combina dados de coverage e ABC para criar matriz de risco
  const [coverage, abc] = await Promise.all([
    getProjectedCoverage(),
    getABCAnalysis(new Date().toISOString().split('T')[0])
  ]);

  return coverage.map(c => {
    const abcItem = abc.find(a => a.variant_id === c.variant_id);
    const riskScore = c.risk_level === 'critical' ? 90 : c.risk_level === 'high' ? 70 : c.risk_level === 'medium' ? 50 : 30;
    const abcScore = abcItem?.abc_category === 'A' ? 30 : abcItem?.abc_category === 'B' ? 20 : 10;
    
    return {
      variant_id: c.variant_id,
      product_name: (c as any).core_product_variants?.core_products?.product_name || 'Produto',
      abc_category: abcItem?.abc_category || 'C',
      risk_level: c.risk_level,
      days_coverage: c.projected_days_coverage,
      recommended_action: c.risk_level === 'critical' ? 'Compra urgente' : c.risk_level === 'high' ? 'Reabastecer' : 'Monitorar',
      priority_score: riskScore + abcScore
    };
  });
}

export async function getDashboardKPIs(filters: DashboardFilters) {
  const supabase = await getSupabaseClient();
  
  // Esta função agregaria KPIs principais
  const [forecasts, coverage, abc] = await Promise.all([
    getForecastSales(filters),
    getProjectedCoverage(),
    getABCAnalysis(new Date().toISOString().split('T')[0])
  ]);

  return {
    total_products: forecasts.length,
    products_at_risk: coverage.filter(c => ['critical', 'high'].includes(c.risk_level)).length,
    abc_distribution: {
      A: abc.filter(a => a.abc_category === 'A').length,
      B: abc.filter(a => a.abc_category === 'B').length,
      C: abc.filter(a => a.abc_category === 'C').length
    },
    avg_forecast_accuracy: forecasts.length > 0 
      ? forecasts.reduce((sum, f) => sum + (f.model_accuracy || 0), 0) / forecasts.length 
      : 0
  };
}

// ================================================
// 7. CACHE E OTIMIZAÇÃO
// ================================================

export async function getCachedMetric(
  cacheKey: string
): Promise<any | null> {
  const supabase = await getSupabaseClient();
  
  const { data, error } = await supabase
    .from('metrics_cache')
    .select('cached_data')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) return null;
  return data.cached_data;
}

export async function setCachedMetric(
  cacheKey: string,
  metricType: string,
  data: any,
  expiresInMinutes: number = 60,
  filters: any = {}
): Promise<void> {
  const supabase = await getSupabaseClient();
  
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  
  const { error } = await supabase
    .from('metrics_cache')
    .upsert({
      cache_key: cacheKey,
      metric_type: metricType,
      cached_data: data,
      expires_at: expiresAt.toISOString(),
      filters: filters
    });

  if (error) throw error;
}

// ================================================
// 8. CONFIGURAÇÕES
// ================================================

export async function getAnalyticsConfig(
  organizationId: string,
  configType?: string
) {
  const supabase = await getSupabaseClient();
  
  let query = supabase
    .from('analytics_config')
    .select('*')
    .eq('organization_id', organizationId);

  if (configType) {
    query = query.eq('config_type', configType);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function updateAnalyticsConfig(
  organizationId: string,
  configType: string,
  configKey: string,
  configValue: any,
  userId?: string
): Promise<void> {
  const supabase = await getSupabaseClient();
  
  const { error } = await supabase
    .from('analytics_config')
    .upsert({
      organization_id: organizationId,
      config_type: configType,
      config_key: configKey,
      config_value: configValue,
      updated_at: new Date().toISOString()
    });

  if (error) throw error;
} 