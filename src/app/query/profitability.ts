import { createSupabaseServerClient } from '@/core/supabase/server';
import { getProductVariants, getProducts, getLocations } from '@/core/services/GenericDataService';

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
  const supabase = await createSupabaseServerClient();

  try {
    // Buscar dados de análise ABC
    const { data: abcData, error: abcError } = await supabase
      .from('abc_analysis')
      .select('*')
      .order('revenue_contribution', { ascending: false });

    if (abcError) {
      console.error('Error fetching ABC analysis data:', abcError);
      return [];
    }

    if (!abcData || abcData.length === 0) {
      return [];
    }

    // Buscar dados das novas tabelas genéricas
    const [variants, products, locations] = await Promise.all([
      getProductVariants(),
      getProducts(), 
      getLocations()
    ]);

    // Criar mapas para lookup rápido
    const variantMap = new Map(variants.map(v => [v.id, v]));
    const productMap = new Map(products.map(p => [p.id, p]));
    const locationMap = new Map(locations.map(l => [l.id, l]));

    return abcData.map((item: any) => {
      const variant = variantMap.get(item.variant_id);
      const product = variant ? productMap.get(variant.product_id) : null;
      const location = locationMap.get(item.location_id);

      return {
        variant_id: item.variant_id,
        location_id: item.location_id,
        product_name: product?.product_name || 'Unknown Product',
        category: product?.category || 'Unknown Category',
        size: variant?.size || '',
        color: variant?.color || '',
        location_name: location?.location_name || 'Unknown Location',
        revenue_contribution: Number(item.revenue_contribution),
        stock_value: Number(item.stock_value),
        cumulative_revenue_percentage: Number(item.cumulative_revenue_percentage),
        abc_category: item.abc_category,
        turnover_rate: Number(item.turnover_rate),
        days_of_inventory: Number(item.days_of_inventory),
        priority_score: Number(item.priority_score)
      };
    });
  } catch (error) {
    console.error('Exception in getProfitabilityData:', error);
    return [];
  }
}

export async function getPricingSimulations(): Promise<PricingSimulation[]> {
  const supabase = await createSupabaseServerClient();

  try {
    // Buscar simulações de preço
    const { data: simulationData, error: simulationError } = await supabase
      .from('price_simulations')
      .select('*')
      .order('simulation_date', { ascending: false });

    if (simulationError) {
      console.error('Error fetching pricing simulations:', simulationError);
      return [];
    }

    if (!simulationData || simulationData.length === 0) {
      return [];
    }

    // Buscar dados das novas tabelas genéricas
    const [variants, products, locations] = await Promise.all([
      getProductVariants(),
      getProducts(),
      getLocations()
    ]);

    // Criar mapas para lookup rápido
    const variantMap = new Map(variants.map(v => [v.id, v]));
    const productMap = new Map(products.map(p => [p.id, p]));
    const locationMap = new Map(locations.map(l => [l.id, l]));

    return simulationData.map((item: any) => {
      const variant = variantMap.get(item.variant_id);
      const product = variant ? productMap.get(variant.product_id) : null;
      const location = locationMap.get(item.location_id);

      return {
        variant_id: item.variant_id,
        location_id: item.location_id,
        product_name: product?.product_name || 'Unknown Product',
        size: variant?.size || '',
        color: variant?.color || '',
        location_name: location?.location_name || 'Unknown Location',
        current_price: Number(item.current_price),
        simulated_price: Number(item.simulated_price),
        price_change_percentage: Number(item.price_change_percentage),
        current_margin_percentage: Number(item.current_margin_percentage),
        projected_margin_percentage: Number(item.projected_margin_percentage),
        projected_volume_impact: Number(item.projected_volume_impact),
        projected_revenue_impact: Number(item.projected_revenue_impact),
        simulation_notes: item.simulation_notes || '',
        simulation_date: item.simulation_date
      };
    });
  } catch (error) {
    console.error('Exception in getPricingSimulations:', error);
    return [];
  }
}

export async function getElasticityData(): Promise<ElasticityData[]> {
  const supabase = await createSupabaseServerClient();

  try {
    // Buscar dados de elasticidade de preço
    const { data: elasticityData, error: elasticityError } = await supabase
      .from('price_elasticity')
      .select('*')
      .order('confidence_level', { ascending: false });

    if (elasticityError) {
      console.error('Error fetching elasticity data:', elasticityError);
      return [];
    }

    if (!elasticityData || elasticityData.length === 0) {
      return [];
    }

    // Buscar dados das novas tabelas genéricas
    const [variants, products, locations] = await Promise.all([
      getProductVariants(),
      getProducts(),
      getLocations()
    ]);

    // Criar mapas para lookup rápido
    const variantMap = new Map(variants.map(v => [v.id, v]));
    const productMap = new Map(products.map(p => [p.id, p]));
    const locationMap = new Map(locations.map(l => [l.id, l]));

    return elasticityData.map((item: any) => {
      const variant = variantMap.get(item.variant_id);
      const product = variant ? productMap.get(variant.product_id) : null;
      const location = locationMap.get(item.location_id);

      return {
        variant_id: item.variant_id,
        location_id: item.location_id,
        product_name: product?.product_name || 'Unknown Product',
        category: product?.category || 'Unknown Category',
        size: variant?.size || '',
        color: variant?.color || '',
        location_name: location?.location_name || 'Unknown Location',
        price_elasticity_coefficient: Number(item.price_elasticity_coefficient),
        confidence_level: Number(item.confidence_level),
        r_squared: Number(item.r_squared),
        analysis_period_start: item.analysis_period_start,
        analysis_period_end: item.analysis_period_end,
        sample_size: Number(item.sample_size)
      };
    });
  } catch (error) {
    console.error('Exception in getElasticityData:', error);
    return [];
  }
}

export async function getMarginTrends(): Promise<MarginTrend[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('margin_trends')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching margin trends:', error);
    return [];
  }

  return data?.map((item: any) => ({
    date: item.date,
    avg_margin: Number(item.avg_margin),
    product_count: Number(item.product_count),
    total_revenue: Number(item.total_revenue),
    category_breakdown: item.category_breakdown || []
  })) || [];
} 
