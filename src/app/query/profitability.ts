import { createSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export interface ProfitabilityData {
  variant_id: string;
  location_id: string;
  product_name: string;
  category: string;
  size: string;
  color: string;
  location_name: string;
  revenue_contribution: number;
  stock_value: number;
  cumulative_revenue_percentage: number;
  abc_category: 'A' | 'B' | 'C';
  turnover_rate: number;
  days_of_inventory: number;
  priority_score: number;
  current_margin_percentage?: number;
  projected_margin_percentage?: number;
}

export interface PricingSimulation {
  variant_id: string;
  location_id: string;
  product_name: string;
  size: string;
  color: string;
  location_name: string;
  current_price: number;
  simulated_price: number;
  price_change_percentage: number;
  current_margin_percentage: number;
  projected_margin_percentage: number;
  projected_volume_impact: number;
  projected_revenue_impact: number;
  simulation_notes: string;
  simulation_date: string;
}

export interface ElasticityData {
  variant_id: string;
  location_id: string;
  product_name: string;
  category: string;
  size: string;
  color: string;
  location_name: string;
  price_elasticity_coefficient: number;
  confidence_level: number;
  r_squared: number;
  analysis_period_start: string;
  analysis_period_end: string;
  sample_size: number;
}

export interface MarginTrend {
  date: string;
  avg_margin: number;
  product_count: number;
  total_revenue: number;
  category_breakdown: {
    category: string;
    avg_margin: number;
    revenue_share: number;
  }[];
}

export async function getProfitabilityData(): Promise<ProfitabilityData[]> {
  const cookieStore = await cookies();
  const supabase = createSupabaseClient(cookieStore);

  const { data, error } = await supabase
    .from('abc_analysis')
    .select(`
      variant_id,
      location_id,
      revenue_contribution,
      stock_value,
      cumulative_revenue_percentage,
      abc_category,
      turnover_rate,
      days_of_inventory,
      priority_score,
      core_product_variants (
        size,
        color,
        core_products (
          product_name,
          category
        )
      ),
      core_locations (
        location_name
      )
    `)
    .order('revenue_contribution', { ascending: false });

  if (error) {
    console.error('Error fetching profitability data:', error);
    return [];
  }

  return data?.map((item: any) => ({
    variant_id: item.variant_id,
    location_id: item.location_id,
    product_name: item.core_product_variants.core_products.product_name,
    category: item.core_product_variants.core_products.category,
    size: item.core_product_variants.size,
    color: item.core_product_variants.color,
    location_name: item.core_locations?.location_name || 'Unknown',
    revenue_contribution: Number(item.revenue_contribution),
    stock_value: Number(item.stock_value),
    cumulative_revenue_percentage: Number(item.cumulative_revenue_percentage),
    abc_category: item.abc_category,
    turnover_rate: Number(item.turnover_rate),
    days_of_inventory: Number(item.days_of_inventory),
    priority_score: Number(item.priority_score)
  })) || [];
}

export async function getPricingSimulations(): Promise<PricingSimulation[]> {
  const cookieStore = await cookies();
  const supabase = createSupabaseClient(cookieStore);

  const { data, error } = await supabase
    .from('price_simulations')
    .select(`
      variant_id,
      location_id,
      current_price,
      simulated_price,
      price_change_percentage,
      current_margin_percentage,
      projected_margin_percentage,
      projected_volume_impact,
      projected_revenue_impact,
      simulation_notes,
      simulation_date,
      core_product_variants (
        size,
        color,
        core_products (
          product_name
        )
      ),
      core_locations (
        location_name
      )
    `)
    .order('simulation_date', { ascending: false });

  if (error) {
    console.error('Error fetching pricing simulations:', error);
    return [];
  }

  return data?.map((item: any) => ({
    variant_id: item.variant_id,
    location_id: item.location_id,
    product_name: item.core_product_variants.core_products.product_name,
    size: item.core_product_variants.size,
    color: item.core_product_variants.color,
    location_name: item.core_locations?.location_name || 'Unknown',
    current_price: Number(item.current_price),
    simulated_price: Number(item.simulated_price),
    price_change_percentage: Number(item.price_change_percentage),
    current_margin_percentage: Number(item.current_margin_percentage),
    projected_margin_percentage: Number(item.projected_margin_percentage),
    projected_volume_impact: Number(item.projected_volume_impact),
    projected_revenue_impact: Number(item.projected_revenue_impact),
    simulation_notes: item.simulation_notes || '',
    simulation_date: item.simulation_date
  })) || [];
}

export async function getElasticityData(): Promise<ElasticityData[]> {
  const cookieStore = await cookies();
  const supabase = createSupabaseClient(cookieStore);

  const { data, error } = await supabase
    .from('price_elasticity')
    .select(`
      variant_id,
      location_id,
      price_elasticity_coefficient,
      confidence_level,
      r_squared,
      analysis_period_start,
      analysis_period_end,
      sample_size,
      core_product_variants (
        size,
        color,
        core_products (
          product_name,
          category
        )
      ),
      core_locations (
        location_name
      )
    `)
    .order('confidence_level', { ascending: false });

  if (error) {
    console.error('Error fetching elasticity data:', error);
    return [];
  }

  return data?.map((item: any) => ({
    variant_id: item.variant_id,
    location_id: item.location_id,
    product_name: item.core_product_variants.core_products.product_name,
    category: item.core_product_variants.core_products.category,
    size: item.core_product_variants.size,
    color: item.core_product_variants.color,
    location_name: item.core_locations?.location_name || 'Unknown',
    price_elasticity_coefficient: Number(item.price_elasticity_coefficient),
    confidence_level: Number(item.confidence_level),
    r_squared: Number(item.r_squared),
    analysis_period_start: item.analysis_period_start,
    analysis_period_end: item.analysis_period_end,
    sample_size: item.sample_size
  })) || [];
}

export async function getMarginTrends(): Promise<MarginTrend[]> {
  const cookieStore = await cookies();
  const supabase = createSupabaseClient(cookieStore);

  // Simulated margin trends data - would be calculated from real pricing/sales data
  const trends: MarginTrend[] = [
    {
      date: '2025-01-01',
      avg_margin: 52.3,
      product_count: 120,
      total_revenue: 145000,
      category_breakdown: [
        { category: 'roupas', avg_margin: 48.5, revenue_share: 75.0 },
        { category: 'acessórios', avg_margin: 62.1, revenue_share: 25.0 }
      ]
    },
    {
      date: '2025-02-01',
      avg_margin: 54.1,
      product_count: 120,
      total_revenue: 152000,
      category_breakdown: [
        { category: 'roupas', avg_margin: 50.2, revenue_share: 72.0 },
        { category: 'acessórios', avg_margin: 64.8, revenue_share: 28.0 }
      ]
    },
    {
      date: '2025-03-01',
      avg_margin: 51.8,
      product_count: 120,
      total_revenue: 149000,
      category_breakdown: [
        { category: 'roupas', avg_margin: 47.9, revenue_share: 74.0 },
        { category: 'acessórios', avg_margin: 61.5, revenue_share: 26.0 }
      ]
    },
    {
      date: '2025-04-01',
      avg_margin: 55.7,
      product_count: 120,
      total_revenue: 161000,
      category_breakdown: [
        { category: 'roupas', avg_margin: 52.1, revenue_share: 71.0 },
        { category: 'acessórios', avg_margin: 66.2, revenue_share: 29.0 }
      ]
    },
    {
      date: '2025-05-01',
      avg_margin: 53.4,
      product_count: 120,
      total_revenue: 157000,
      category_breakdown: [
        { category: 'roupas', avg_margin: 49.8, revenue_share: 73.0 },
        { category: 'acessórios', avg_margin: 63.7, revenue_share: 27.0 }
      ]
    },
    {
      date: '2025-06-01',
      avg_margin: 56.2,
      product_count: 120,
      total_revenue: 168000,
      category_breakdown: [
        { category: 'roupas', avg_margin: 53.5, revenue_share: 70.0 },
        { category: 'acessórios', avg_margin: 67.1, revenue_share: 30.0 }
      ]
    }
  ];

  return trends;
} 