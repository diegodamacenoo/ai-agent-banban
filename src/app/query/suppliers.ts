import { createSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export interface SupplierMetric {
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
  trade_name?: string;
  legal_name?: string;
}

export async function getSupplierMetrics(): Promise<SupplierMetric[]> {
  const cookieStore = await cookies();
  const supabase = createSupabaseClient(cookieStore);
  
  try {
    const { data, error } = await supabase
      .from('supplier_metrics')
      .select(`
        *,
        core_suppliers!supplier_id (
          trade_name,
          legal_name
        )
      `)
      .order('performance_score', { ascending: false });

    if (error) {
      console.error('Error fetching supplier metrics:', error);
      return [];
    }

    // Transformar dados para incluir informações do fornecedor
    const transformedData: SupplierMetric[] = data?.map((item: any) => ({
      id: item.id,
      supplier_id: item.supplier_id,
      analysis_period_start: item.analysis_period_start,
      analysis_period_end: item.analysis_period_end,
      total_orders: item.total_orders,
      avg_lead_time_days: parseFloat(item.avg_lead_time_days) || 0,
      sla_lead_time_days: item.sla_lead_time_days,
      lead_time_variance: parseFloat(item.lead_time_variance) || 0,
      fill_rate_percentage: parseFloat(item.fill_rate_percentage) || 0,
      divergence_rate_percentage: parseFloat(item.divergence_rate_percentage) || 0,
      on_time_delivery_rate: parseFloat(item.on_time_delivery_rate) || 0,
      quality_score: parseFloat(item.quality_score) || 0,
      performance_score: parseFloat(item.performance_score) || 0,
      trade_name: item.core_suppliers?.trade_name || null,
      legal_name: item.core_suppliers?.legal_name || null,
    })) || [];

    return transformedData;
  } catch (error) {
    console.error('Exception in getSupplierMetrics:', error);
    return [];
  }
} 