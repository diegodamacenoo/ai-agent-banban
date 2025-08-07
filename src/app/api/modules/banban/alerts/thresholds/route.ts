import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/core/supabase/server';
import { BANBAN_ALERTS_MODULE_CONFIG } from '@/core/modules/banban/alerts/config';
import { z } from 'zod';

// Schema para atualização de thresholds
const ThresholdsUpdateSchema = z.object({
  thresholds: z.array(z.object({
    alert_type: z.string().min(1),
    threshold_value: z.number(),
    threshold_unit: z.string().optional(),
    priority: z.enum(['CRITICAL', 'WARNING', 'INFO', 'OPPORTUNITY']),
    auto_escalate: z.boolean(),
    escalation_delay_minutes: z.number().min(0).optional(),
    description: z.string().optional(),
  })),
});

/**
 * GET /api/modules/banban/alerts/thresholds
 * Obter thresholds configurados
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar organização do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Buscar thresholds customizados do tenant
    const { data: customThresholds, error: thresholdsError } = await supabase
      .from('tenant_alert_thresholds')
      .select(`
        *,
        created_by_profile:profiles!created_by(full_name, email),
        updated_by_profile:profiles!updated_by(full_name, email)
      `)
      .eq('tenant_id', profile.organization_id)
      .order('alert_type');

    if (thresholdsError) {
      console.error('Error fetching custom thresholds:', thresholdsError);
      return NextResponse.json(
        { error: 'Failed to fetch thresholds' },
        { status: 500 }
      );
    }

    // Combinar thresholds do sistema com customizados
    const systemThresholds = BANBAN_ALERTS_MODULE_CONFIG.business_rules.alert_types.map(rule => ({
      alert_type: rule.type,
      threshold_value: rule.threshold,
      threshold_unit: getThresholdUnit(rule.type),
      priority: rule.priority.toUpperCase(),
      auto_escalate: rule.auto_escalate,
      escalation_delay_minutes: getEscalationDelay(rule.priority),
      source: 'system',
      is_editable: false,
      description: getThresholdDescription(rule.type),
    }));

    // Criar mapa de thresholds customizados
    const customThresholdsMap = new Map(
      (customThresholds || []).map(t => [t.alert_type, t])
    );

    // Combinar ou sobrescrever com thresholds customizados
    const allThresholds = systemThresholds.map(systemThreshold => {
      const customThreshold = customThresholdsMap.get(systemThreshold.alert_type);
      
      if (customThreshold) {
        return {
          ...customThreshold,
          source: 'custom',
          is_editable: true,
          system_default: {
            threshold_value: systemThreshold.threshold_value,
            priority: systemThreshold.priority,
            auto_escalate: systemThreshold.auto_escalate,
          },
        };
      }
      
      return systemThreshold;
    });

    // Adicionar thresholds customizados que não têm equivalente no sistema
    (customThresholds || []).forEach(customThreshold => {
      if (!systemThresholds.find(s => s.alert_type === customThreshold.alert_type)) {
        allThresholds.push({
          ...customThreshold,
          source: 'custom',
          is_editable: true,
        });
      }
    });

    return NextResponse.json({
      data: allThresholds,
      summary: {
        total: allThresholds.length,
        system_thresholds: systemThresholds.length,
        custom_thresholds: customThresholds?.length || 0,
        customized_system_thresholds: allThresholds.filter(t => t.source === 'custom' && t.system_default).length,
      },
    });

  } catch (error) {
    console.error('Error in GET /api/modules/banban/alerts/thresholds:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/modules/banban/alerts/thresholds
 * Atualizar thresholds (batch update)
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar organização do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Validar body da requisição
    const body = await request.json();
    const { thresholds } = ThresholdsUpdateSchema.parse(body);

    const updatedThresholds = [];
    const errors = [];

    // Processar cada threshold
    for (const thresholdData of thresholds) {
      try {
        // Verificar se já existe threshold customizado
        const { data: existingThreshold } = await supabase
          .from('tenant_alert_thresholds')
          .select('id')
          .eq('tenant_id', profile.organization_id)
          .eq('alert_type', thresholdData.alert_type)
          .single();

        let result;

        if (existingThreshold) {
          // Atualizar threshold existente
          const { data: updated, error: updateError } = await supabase
            .from('tenant_alert_thresholds')
            .update({
              threshold_value: thresholdData.threshold_value,
              threshold_unit: thresholdData.threshold_unit,
              priority: thresholdData.priority,
              auto_escalate: thresholdData.auto_escalate,
              escalation_delay_minutes: thresholdData.escalation_delay_minutes,
              description: thresholdData.description,
              updated_by: user.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingThreshold.id)
            .select()
            .single();

          if (updateError) throw updateError;
          result = updated;
        } else {
          // Criar novo threshold customizado
          const { data: created, error: createError } = await supabase
            .from('tenant_alert_thresholds')
            .insert({
              tenant_id: profile.organization_id,
              alert_type: thresholdData.alert_type,
              threshold_value: thresholdData.threshold_value,
              threshold_unit: thresholdData.threshold_unit,
              priority: thresholdData.priority,
              auto_escalate: thresholdData.auto_escalate,
              escalation_delay_minutes: thresholdData.escalation_delay_minutes,
              description: thresholdData.description,
              created_by: user.id,
            })
            .select()
            .single();

          if (createError) throw createError;
          result = created;
        }

        updatedThresholds.push({
          ...result,
          source: 'custom',
          is_editable: true,
        });

      } catch (error) {
        console.error(`Error updating threshold for ${thresholdData.alert_type}:`, error);
        errors.push({
          alert_type: thresholdData.alert_type,
          error: error.message,
        });
      }
    }

    // Log das mudanças para auditoria
    if (updatedThresholds.length > 0) {
      await supabase
        .from('tenant_alert_threshold_changes')
        .insert({
          tenant_id: profile.organization_id,
          changed_by: user.id,
          change_type: 'batch_update',
          changes: {
            updated_thresholds: updatedThresholds.map(t => ({
              alert_type: t.alert_type,
              old_value: null, // TODO: capturar valor anterior
              new_value: t.threshold_value,
            })),
            errors: errors,
          },
          changed_at: new Date().toISOString(),
        });
    }

    const response = {
      data: updatedThresholds,
      message: `Successfully updated ${updatedThresholds.length} thresholds`,
    };

    if (errors.length > 0) {
      response.warnings = {
        message: `Failed to update ${errors.length} thresholds`,
        errors: errors,
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in PUT /api/modules/banban/alerts/thresholds:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Obter unidade do threshold baseado no tipo de alerta
 */
function getThresholdUnit(alertType: string): string {
  const units = {
    'STOCK_CRITICAL': 'units',
    'STOCK_LOW': 'units',
    'MARGIN_LOW': 'percentage',
    'SLOW_MOVING': 'days',
    'OVERSTOCK': 'units',
    'SEASONAL_OPPORTUNITY': 'ratio',
  };
  return units[alertType] || 'value';
}

/**
 * Obter delay de escalação baseado na prioridade
 */
function getEscalationDelay(priority: string): number {
  const delays = {
    'critical': 15,
    'attention': 60,
    'moderate': 240,
    'opportunity': 1440,
  };
  return delays[priority] || 60;
}

/**
 * Obter descrição do threshold baseado no tipo
 */
function getThresholdDescription(alertType: string): string {
  const descriptions = {
    'STOCK_CRITICAL': 'Estoque crítico - produtos com menos de X unidades',
    'STOCK_LOW': 'Estoque baixo - produtos com menos de X unidades',
    'MARGIN_LOW': 'Margem baixa - produtos com margem menor que X%',
    'SLOW_MOVING': 'Produtos parados - sem movimento há X dias',
    'OVERSTOCK': 'Excesso de estoque - produtos com mais de X unidades',
    'SEASONAL_OPPORTUNITY': 'Oportunidade sazonal - produtos com potencial de X',
  };
  return descriptions[alertType] || 'Threshold personalizado';
}