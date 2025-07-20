import { createSupabaseServerClient } from '@/core/supabase/server';
import { getSuppliers } from '@/core/services/GenericDataService';

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
  const supabase = await createSupabaseServerClient();
  
  try {
    // Buscar métricas dos fornecedores
    const { data: metricsData, error: metricsError } = await supabase
      .from('supplier_metrics')
      .select('*')
      .order('performance_score', { ascending: false });

    if (metricsError) {
      console.error('Error fetching supplier metrics:', metricsError);
      return [];
    }

    if (!metricsData || metricsData.length === 0) {
      return [];
    }

    // Buscar dados dos fornecedores das novas tabelas genéricas
    const suppliers = await getSuppliers();
    
    // Criar mapa de fornecedores por ID para lookup rápido
    const supplierMap = new Map(suppliers.map(supplier => [supplier.id, supplier]));

    // Transformar dados combinando métricas com informações dos fornecedores
    const transformedData: SupplierMetric[] = metricsData.map((item: any) => {
      const supplier = supplierMap.get(item.supplier_id);
      
      return {
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
        trade_name: supplier?.trade_name || null,
        legal_name: supplier?.legal_name || null,
      };
    });

    return transformedData;
  } catch (error) {
    console.error('Exception in getSupplierMetrics:', error);
    return [];
  }
} 
