'use server';

import { createSupabaseServerClient } from "@/core/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { 
  updateAlertStatusSchema, 
  alertHistorySchema, 
  updateThresholdSchema,
  getAlertDetailsSchema,
  getAlertStatisticsSchema,
  type AlertType, 
  type AlertStatus,
  type UpdateAlertStatusData,
  type AlertHistoryData,
  type UpdateThresholdData
} from '@/core/schemas/alerts';

// Re-export types for use in other files
export type { AlertType, AlertStatus } from '@/core/schemas/alerts';

// Mapear tipos de alerta para nomes de tabela
const ALERT_TABLE_MAP: Record<AlertType, string> = {
  stagnant: 'mart_stagnant_products',
  replenishment: 'mart_replenishment_alerts',
  divergence: 'mart_inventory_divergences',
  margin: 'mart_margin_alerts',
  returns: 'mart_return_spike_alerts',
  redistribution: 'mart_redistribution_suggestions'
};

/**
 * Atualizar status de um alerta
 */
export async function updateAlertStatus(data: UpdateAlertStatusData) {
  const supabase = await createSupabaseServerClient();
  const parsed = updateAlertStatusSchema.safeParse(data);
  if (!parsed.success) {
    return { 
      success: false, 
      error: parsed.error.errors.map(e => e.message).join(', ') 
    };
  }

  const { alertId, alertType, status, notes } = parsed.data;

  try {
    // Verificar autenticação do usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const tableName = ALERT_TABLE_MAP[alertType];
    if (!tableName) {
      return { success: false, error: 'Tipo de alerta inválido' };
    }

    // Atualizar o status do alerta
    const updateData: any = {
      status,
      resolved_by: status !== 'open' ? user.id : null,
      resolved_at: status !== 'open' ? new Date().toISOString() : null,
      resolution_notes: notes || null
    };

    const { error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', alertId);

    if (error) {
      console.error('Erro ao atualizar status do alerta:', error);
      return { success: false, error: 'Erro ao atualizar status' };
    }

    // Revalidar a página de alertas
    revalidatePath('/alertas');
    
    return { 
      success: true, 
      message: status === 'resolved' ? 'Alerta marcado como resolvido' : 
               status === 'ignored' ? 'Alerta ignorado' : 'Status atualizado' 
    };

  } catch (error) {
    console.error('Erro inesperado ao atualizar alerta:', error);
    return { success: false, error: 'Erro inesperado' };
  }
}

/**
 * Buscar histórico de alertas para um produto
 */
export async function getAlertHistory(data: AlertHistoryData) {
  const supabase = await createSupabaseServerClient();
  const parsed = alertHistorySchema.safeParse(data);
  if (!parsed.success) {
    return { 
      success: false, 
      error: parsed.error.errors.map(e => e.message).join(', ') 
    };
  }

  const { variantId, alertType, limit } = parsed.data;
  try {
    let query = supabase
      .from('alert_history')
      .select(`
        id,
        alert_type,
        status,
        created_at,
        resolved_at,
        resolution_notes,
        analysis_date,
        product_name,
        product_category,
        location_name,
        variant_size,
        variant_color,
        priority_level,
        severity,
        impact_value,
        alert_data
      `)
      .eq('variant_id', variantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (alertType) {
      query = query.eq('alert_type', alertType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar histórico de alertas:', error);
      return { success: false, error: 'Erro ao buscar histórico' };
    }

    return { success: true, data: data || [] };

  } catch (error) {
    console.error('Erro inesperado ao buscar histórico:', error);
    return { success: false, error: 'Erro inesperado' };
  }
}

// Dados mock para demonstração
const MOCK_ALERT_DATA = {
  stagnant: {
    id: 'mock-stagnant-1',
    variant_id: 'mock-variant-1',
    location_id: 'mock-location-1',
    analysis_date: '2024-12-19',
    days_without_movement: 45,
    current_stock: 12,
    last_movement_date: '2024-11-04',
    suggested_action: 'promotion',
    status: 'open',
    core_product_variants: {
      size: '39',
      color: 'Preto',
      core_products: {
        product_name: 'Tênis Esportivo Nike Air Max',
        category: 'Calçados Esportivos'
      }
    },
    core_locations: {
      location_name: 'Loja Shopping Center'
    }
  },
  replenishment: {
    id: 'mock-replenishment-1',
    variant_id: 'mock-variant-2',
    location_id: 'mock-location-2',
    analysis_date: '2024-12-19',
    current_stock: 3,
    coverage_days: 2.5,
    avg_daily_sales: 1.2,
    suggested_qty: 15,
    priority_level: 'high',
    status: 'open',
    core_product_variants: {
      size: '37',
      color: 'Branco',
      core_products: {
        product_name: 'Sapatilha Feminina Confort',
        category: 'Calçados Femininos'
      }
    },
    core_locations: {
      location_name: 'Loja Centro'
    }
  },
  margin: {
    id: 'mock-margin-1',
    variant_id: 'mock-variant-3',
    location_id: 'mock-location-3',
    analysis_date: '2024-12-19',
    current_margin_pct: 18.5,
    min_acceptable_margin_pct: 25,
    current_price: 89.90,
    suggested_price: 104.90,
    potential_revenue_impact: 450.50,
    status: 'open',
    core_product_variants: {
      size: '42',
      color: 'Marrom',
      core_products: {
        product_name: 'Sapato Social Masculino',
        category: 'Calçados Sociais'
      }
    },
    core_locations: {
      location_name: 'Loja Norte Shopping'
    }
  },
  divergence: {
    id: 'mock-divergence-1',
    variant_id: 'mock-variant-4',
    location_id: 'mock-location-4',
    analysis_date: '2024-12-19',
    expected_qty: 25,
    scanned_qty: 18,
    difference_qty: -7,
    difference_percentage: -28.0,
    total_value_impact: -315.30,
    severity_level: 'high',
    status: 'open',
    core_product_variants: {
      size: '36',
      color: 'Rosa',
      core_products: {
        product_name: 'Sandália Infantil Princess',
        category: 'Calçados Infantis'
      }
    },
    core_locations: {
      location_name: 'Loja Mall Sul'
    }
  },
  returns: {
    id: 'mock-returns-1',
    variant_id: 'mock-variant-5',
    location_id: 'mock-location-5',
    analysis_date: '2024-12-19',
    returns_last_7_days: 8,
    returns_previous_7_days: 3,
    increase_percentage: 166.7,
    total_return_value: 679.20,
    avg_return_reason: 'Tamanho inadequado',
    status: 'open',
    core_product_variants: {
      size: '40',
      color: 'Azul',
      core_products: {
        product_name: 'Bota Masculina Adventure',
        category: 'Calçados Masculinos'
      }
    },
    core_locations: {
      location_name: 'Loja Outlet'
    }
  },
  redistribution: {
    id: 'mock-redistribution-1',
    variant_id: 'mock-variant-6',
    source_location_id: 'mock-location-6',
    target_location_id: 'mock-location-7',
    analysis_date: '2024-12-19',
    suggested_transfer_qty: 8,
    priority_score: 8.5,
    estimated_revenue_gain: 420.80,
    source_stock: 15,
    target_demand_forecast: 12,
    status: 'open',
    core_product_variants: {
      size: '38',
      color: 'Nude',
      core_products: {
        product_name: 'Scarpin Feminino Elegance',
        category: 'Calçados Femininos'
      }
    },
    source_location: {
      location_name: 'Loja Centro'
    },
    target_location: {
      location_name: 'Loja Shopping Plaza'
    }
  }
};

const MOCK_HISTORY_DATA = [
  {
    id: 'hist-1',
    alert_type: 'stagnant',
    status: 'resolved',
    created_at: '2024-12-10T10:00:00Z',
    resolved_at: '2024-12-12T14:30:00Z',
    resolution_notes: 'Produto colocado em promoção 30% OFF',
    analysis_date: '2024-12-10',
    product_name: 'Tênis Esportivo Nike Air Max',
    product_category: 'Calçados Esportivos',
    location_name: 'Loja Shopping Center',
    variant_size: '39',
    variant_color: 'Preto',
    priority_level: 'medium',
    severity: 'medium',
    impact_value: 540.00
  },
  {
    id: 'hist-2',
    alert_type: 'replenishment',
    status: 'resolved',
    created_at: '2024-12-05T08:15:00Z',
    resolved_at: '2024-12-06T16:45:00Z',
    resolution_notes: 'Pedido de reposição enviado ao fornecedor',
    analysis_date: '2024-12-05',
    product_name: 'Sapatilha Feminina Confort',
    product_category: 'Calçados Femininos',
    location_name: 'Loja Centro',
    variant_size: '37',
    variant_color: 'Branco',
    priority_level: 'high',
    severity: 'critical',
    impact_value: 280.50
  },
  {
    id: 'hist-3',
    alert_type: 'margin',
    status: 'ignored',
    created_at: '2024-11-28T12:00:00Z',
    resolved_at: '2024-11-30T09:20:00Z',
    resolution_notes: 'Aguardando fim da promoção de Black Friday',
    analysis_date: '2024-11-28',
    product_name: 'Sapato Social Masculino',
    product_category: 'Calçados Sociais',
    location_name: 'Loja Norte Shopping',
    variant_size: '42',
    variant_color: 'Marrom',
    priority_level: 'low',
    severity: 'low',
    impact_value: 156.80
  }
];

/**
 * Buscar detalhes expandidos de um alerta
 */
export async function getAlertDetails(alertId: string, alertType: AlertType) {
  const supabase = await createSupabaseServerClient();
  const tableName = ALERT_TABLE_MAP[alertType];

  if (!tableName) {
    return { success: false, error: 'Tipo de alerta inválido' };
  }

  try {
    // Buscar detalhes do alerta específico
    const selectQuery = alertType === 'redistribution' 
      ? `
        *,
        core_product_variants!inner(
          size, color,
          core_products!inner(product_name, category)
        ),
        source_location:core_locations!source_location_id(location_name),
        target_location:core_locations!target_location_id(location_name)
      `
      : `
        *,
        core_product_variants!inner(
          size, color,
          core_products!inner(product_name, category)
        ),
        core_locations!inner(location_name)
      `;

    const { data, error } = await supabase
      .from(tableName)
      .select(selectQuery)
      .eq('id', alertId)
      .single();

    // Se não encontrar dados reais ou houver erro, usar dados mock
    if (error || !data) {
      console.debug('Usando dados mock para demonstração:', { alertId, alertType });
      
      const mockAlert = MOCK_ALERT_DATA[alertType];
      if (!mockAlert) {
        return { success: false, error: 'Dados mock não disponíveis para este tipo' };
      }

      return { 
        success: true, 
        data: {
          alert: mockAlert,
          history: MOCK_HISTORY_DATA
        }
      };
    }

    // Buscar histórico do produto relacionado (usando any para contornar tipo complexo)
    const historyResult = await getAlertHistory({ 
      variantId: (data as any).variant_id, 
      alertType,
      limit: 10 
    });

    return { 
      success: true, 
      data: {
        alert: data,
        history: historyResult.success ? historyResult.data : MOCK_HISTORY_DATA
      }
    };

  } catch (error) {
    console.error('Erro inesperado ao buscar detalhes:', error);
    
    // Em caso de erro, tentar retornar dados mock
    const mockAlert = MOCK_ALERT_DATA[alertType];
    if (mockAlert) {
      return { 
        success: true, 
        data: {
          alert: mockAlert,
          history: MOCK_HISTORY_DATA
        }
      };
    }
    
    return { success: false, error: 'Erro inesperado' };
  }
}

/**
 * Buscar configurações de thresholds
 */
export async function getAlertThresholds() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('alert_thresholds')
    .select('*')
    .eq('is_active', true)
    .order('alert_type');

  if (error) {
    console.error('Erro ao buscar thresholds:', error);
    return { success: false, error: 'Erro ao buscar configurações' };
  }

  return { success: true, data: data || [] };
}

/**
 * Atualizar configurações de thresholds
 */
export async function updateAlertThresholds(data: UpdateThresholdData) {
  const supabase = await createSupabaseServerClient();
  const parsed = updateThresholdSchema.safeParse(data);
  if (!parsed.success) {
    return { 
      success: false, 
      error: parsed.error.errors.map(e => e.message).join(', ') 
    };
  }

  const { alertType, thresholds } = parsed.data;
  try {
    // Verificar autenticação do usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Desativar configuração anterior
    await supabase
      .from('alert_thresholds')
      .update({ is_active: false })
      .eq('alert_type', alertType)
      .eq('is_active', true);

    // Inserir nova configuração
    const { error } = await supabase
      .from('alert_thresholds')
      .insert({
        alert_type: alertType,
        threshold_config: thresholds,
        is_active: true,
        created_by: user.id,
        updated_by: user.id
      });

    if (error) {
      console.error('Erro ao atualizar thresholds:', error);
      return { success: false, error: 'Erro ao atualizar configurações' };
    }

    // Revalidar a página de alertas
    revalidatePath('/alertas');
    
    return { success: true, message: 'Configurações atualizadas com sucesso' };

  } catch (error) {
    console.error('Erro inesperado ao atualizar thresholds:', error);
    return { success: false, error: 'Erro inesperado' };
  }
}

/**
 * Buscar estatísticas de alertas por período
 */
export async function getAlertStatistics(days: number = 30) {
  const supabase = await createSupabaseServerClient();
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);

  try {
    // Buscar estatísticas do histórico
    const { data, error } = await supabase
      .from('alert_history')
      .select('alert_type, status, created_at, resolved_at')
      .gte('created_at', dateLimit.toISOString());

    if (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return { success: false, error: 'Erro ao buscar estatísticas' };
    }

    // Processar estatísticas
    const stats = {
      total: data?.length || 0,
      byType: {} as Record<AlertType, number>,
      byStatus: {} as Record<AlertStatus, number>,
      averageResolutionTime: 0,
      resolutionRate: 0
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    data?.forEach(alert => {
      // Contar por tipo
      stats.byType[alert.alert_type as AlertType] = 
        (stats.byType[alert.alert_type as AlertType] || 0) + 1;

      // Contar por status
      stats.byStatus[alert.status as AlertStatus] = 
        (stats.byStatus[alert.status as AlertStatus] || 0) + 1;

      // Calcular tempo de resolução
      if (alert.status === 'resolved' && alert.resolved_at) {
        const createdAt = new Date(alert.created_at);
        const resolvedAt = new Date(alert.resolved_at);
        const resolutionTime = resolvedAt.getTime() - createdAt.getTime();
        totalResolutionTime += resolutionTime;
        resolvedCount++;
      }
    });

    // Calcular médias
    if (resolvedCount > 0) {
      stats.averageResolutionTime = totalResolutionTime / resolvedCount / (1000 * 60 * 60 * 24); // em dias
      stats.resolutionRate = (resolvedCount / stats.total) * 100;
    }

    return { success: true, data: stats };

  } catch (error) {
    console.error('Erro inesperado ao buscar estatísticas:', error);
    return { success: false, error: 'Erro inesperado' };
  }
} 
