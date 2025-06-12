'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { exportAlertsSchema, type ExportAlertsData } from '@/lib/schemas/alerts';

export async function exportAlertsToCSV(filters: ExportAlertsData) {
  const parsed = exportAlertsSchema.safeParse(filters);
  if (!parsed.success) {
    return { 
      success: false, 
      error: parsed.error.errors.map(e => e.message).join(', ') 
    };
  }
  
  const validatedFilters = parsed.data;
  
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const analysisDate = validatedFilters?.date || new Date().toISOString().split('T')[0];
    
    // Coletar dados de todos os tipos de alertas
    const alertsData = await Promise.all([
      // Produtos parados
      supabase
        .from('mart_stagnant_products')
        .select(`
          variant_id,
          location_id,
          days_without_movement,
          last_movement_date,
          current_stock,
          suggested_action,
          core_product_variants!inner(
            size, color,
            core_products!inner(product_name, category)
          ),
          core_locations!inner(location_name)
        `)
        .eq('analysis_date', analysisDate),

      // Alertas de reposição
      supabase
        .from('mart_replenishment_alerts')
        .select(`
          variant_id,
          location_id,
          current_stock,
          avg_daily_sales,
          coverage_days,
          suggested_qty,
          priority_level,
          core_product_variants!inner(
            size, color,
            core_products!inner(product_name, category)
          ),
          core_locations!inner(location_name)
        `)
        .eq('analysis_date', analysisDate),

      // Divergências de estoque
      supabase
        .from('mart_inventory_divergences')
        .select(`
          variant_id,
          location_id,
          expected_qty,
          scanned_qty,
          difference_qty,
          difference_percentage,
          total_value_impact,
          severity,
          core_product_variants!inner(
            size, color,
            core_products!inner(product_name, category)
          ),
          core_locations!inner(location_name)
        `)
        .eq('analysis_date', analysisDate),

      // Alertas de margem
      supabase
        .from('mart_margin_alerts')
        .select(`
          variant_id,
          current_price,
          cost_price,
          current_margin_pct,
          suggested_price,
          potential_revenue_impact,
          core_product_variants!inner(
            size, color,
            core_products!inner(product_name, category)
          )
        `)
        .eq('analysis_date', analysisDate),

      // Picos de devolução
      supabase
        .from('mart_return_spike_alerts')
        .select(`
          variant_id,
          location_id,
          returns_last_7_days,
          returns_previous_7_days,
          increase_percentage,
          total_return_value,
          suggested_investigation,
          core_product_variants!inner(
            size, color,
            core_products!inner(product_name, category)
          ),
          core_locations!inner(location_name)
        `)
        .eq('analysis_date', analysisDate),

      // Sugestões de redistribuição
      supabase
        .from('mart_redistribution_suggestions')
        .select(`
          variant_id,
          source_location_id,
          target_location_id,
          suggested_transfer_qty,
          priority_score,
          estimated_revenue_gain,
          core_product_variants!inner(
            size, color,
            core_products!inner(product_name, category)
          ),
          source_location:core_locations!source_location_id(location_name),
          target_location:core_locations!target_location_id(location_name)
        `)
        .eq('analysis_date', analysisDate)
    ]);

    // Verificar erros nas queries
    for (let i = 0; i < alertsData.length; i++) {
      if (alertsData[i].error) {
        console.error(`Erro na query ${i}:`, alertsData[i].error);
        return { success: false, error: `Erro ao buscar dados: ${alertsData[i].error?.message || 'Erro desconhecido'}` };
      }
    }

    // Extrair dados das queries
    const [
      stagnantProducts,
      replenishmentAlerts,
      inventoryDivergences,
      marginAlerts,
      returnSpikes,
      redistributionSuggestions
    ] = alertsData.map(result => result.data || []);

    // Aplicar filtros se fornecidos
    const filterData = (data: any[], type: string) => {
      let filtered = data;

      // Filtro por tipo
      if (validatedFilters?.types && validatedFilters.types.length > 0) {
        if (!validatedFilters.types.includes(type as any)) {
          return [];
        }
      }

      // Filtro por busca
      if (validatedFilters?.search) {
        const searchTerm = validatedFilters.search.toLowerCase();
        filtered = filtered.filter((item: any) => {
          const productName = item.core_product_variants?.core_products?.product_name?.toLowerCase() || '';
          const locationName = item.core_locations?.location_name?.toLowerCase() || 
                              item.source_location?.location_name?.toLowerCase() || 
                              item.target_location?.location_name?.toLowerCase() || '';
          const variantInfo = `${item.core_product_variants?.size} ${item.core_product_variants?.color}`.toLowerCase();
          
          return productName.includes(searchTerm) || 
                 locationName.includes(searchTerm) || 
                 variantInfo.includes(searchTerm);
        });
      }

      return filtered;
    };

    // Aplicar filtros nos dados
    const filteredData = {
      stagnant: filterData(stagnantProducts, 'stagnant'),
      replenishment: filterData(replenishmentAlerts, 'replenishment'),
      divergence: filterData(inventoryDivergences, 'divergence'),
      margin: filterData(marginAlerts, 'margin'),
      returns: filterData(returnSpikes, 'returns'),
      redistribution: filterData(redistributionSuggestions, 'redistribution')
    };

    // Gerar CSV unificado
    const csvRows: string[] = [];
    
    // Cabeçalho
    csvRows.push([
      'Tipo de Alerta',
      'Produto',
      'Variante',
      'Local',
      'Categoria',
      'Detalhes',
      'Prioridade/Severidade',
      'Ação Sugerida',
      'Valor de Impacto',
      'Data da Análise'
    ].join(','));

    // Adicionar dados de cada tipo
    const addRowsToCSV = (data: any[], alertType: string) => {
      data.forEach((item: any) => {
        const baseInfo = [
          alertType,
          `"${item.core_product_variants?.core_products?.product_name || 'N/A'}"`,
          `"${item.core_product_variants?.size || ''} ${item.core_product_variants?.color || ''}"`.trim(),
          `"${item.core_locations?.location_name || item.source_location?.location_name || 'N/A'}"`,
          `"${item.core_product_variants?.core_products?.category || 'N/A'}"`
        ];

        let details = '';
        let priority = '';
        let action = '';
        let impact = '';

        switch (alertType) {
          case 'Produtos Parados':
            details = `${item.days_without_movement} dias sem movimento`;
            priority = item.suggested_action;
            action = item.suggested_action === 'liquidation' ? 'Liquidação' : 
                    item.suggested_action === 'promotion' ? 'Promoção' : 'Transferir';
            impact = `${item.current_stock} unidades paradas`;
            break;

          case 'Reposição':
            details = `${item.coverage_days.toFixed(1)} dias de cobertura`;
            priority = item.priority_level;
            action = `Repor ${item.suggested_qty} unidades`;
            impact = `Estoque: ${item.current_stock}`;
            break;

          case 'Divergências':
            details = `${item.difference_percentage.toFixed(1)}% de diferença`;
            priority = item.severity;
            action = 'Investigar diferença';
            impact = `R$ ${Math.abs(item.total_value_impact).toFixed(2)}`;
            break;

          case 'Margem':
            details = `${item.current_margin_pct.toFixed(1)}% de margem atual`;
            priority = 'Oportunidade';
            action = `Ajustar para R$ ${item.suggested_price.toFixed(2)}`;
            impact = `+R$ ${item.potential_revenue_impact.toFixed(2)}`;
            break;

          case 'Devoluções':
            details = `+${item.increase_percentage.toFixed(0)}% de aumento`;
            priority = 'Investigação';
            action = item.suggested_investigation;
            impact = `R$ ${item.total_return_value.toFixed(2)}`;
            break;

          case 'Redistribuição':
            details = `${item.suggested_transfer_qty} unidades`;
            priority = item.priority_score.toFixed(1);
            action = `Transferir para ${item.target_location?.location_name || 'N/A'}`;
            impact = `+R$ ${item.estimated_revenue_gain.toFixed(2)}`;
            break;
        }

        csvRows.push([
          ...baseInfo,
          `"${details}"`,
          `"${priority}"`,
          `"${action}"`,
          `"${impact}"`,
          analysisDate
        ].join(','));
      });
    };

    // Adicionar dados de cada tipo de alerta
    addRowsToCSV(filteredData.stagnant, 'Produtos Parados');
    addRowsToCSV(filteredData.replenishment, 'Reposição');
    addRowsToCSV(filteredData.divergence, 'Divergências');
    addRowsToCSV(filteredData.margin, 'Margem');
    addRowsToCSV(filteredData.returns, 'Devoluções');
    addRowsToCSV(filteredData.redistribution, 'Redistribuição');

    const csvContent = csvRows.join('\n');
    const totalRows = csvRows.length - 1; // Excluir cabeçalho

    // Log da operação (sem dados sensíveis)
    console.log(`Export de alertas realizado: ${totalRows} registros, usuário: ${session.user.email}`);

    return { 
      success: true, 
      data: csvContent,
      filename: `alertas_${analysisDate}_${new Date().getTime()}.csv`,
      totalRows
    };

  } catch (error: any) {
    console.error('Erro no export de alertas:', error);
    return { 
      success: false, 
      error: error.message || 'Erro interno do servidor' 
    };
  }
} 