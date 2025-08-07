import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/core/supabase/server';
import { z } from 'zod';

// Schema para atualização de regra (campos opcionais)
const UpdateAlertRuleSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  alert_type: z.string().min(1).optional(),
  conditions: z.object({
    field: z.string(),
    operator: z.enum(['>', '<', '>=', '<=', '==', '!=', 'contains', 'not_contains']),
    value: z.union([z.string(), z.number(), z.boolean()]),
    additional_conditions: z.array(z.object({
      field: z.string(),
      operator: z.enum(['>', '<', '>=', '<=', '==', '!=', 'contains', 'not_contains']),
      value: z.union([z.string(), z.number(), z.boolean()]),
      logical_operator: z.enum(['AND', 'OR']).optional(),
    })).optional(),
  }).optional(),
  actions: z.object({
    priority: z.enum(['CRITICAL', 'WARNING', 'INFO', 'OPPORTUNITY']),
    auto_escalate: z.boolean().default(false),
    escalation_delay_minutes: z.number().min(0).optional(),
    notification_channels: z.array(z.enum(['email', 'sms', 'push', 'dashboard'])),
    custom_message_template: z.string().optional(),
  }).optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/modules/banban/alerts/rules/[id]
 * Obter detalhes de uma regra específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Buscar regra específica
    const { data: rule, error: ruleError } = await supabase
      .from('tenant_alert_rules')
      .select(`
        *,
        created_by_profile:profiles!created_by(full_name, email),
        updated_by_profile:profiles!updated_by(full_name, email)
      `)
      .eq('id', params.id)
      .eq('tenant_id', profile.organization_id)
      .single();

    if (ruleError || !rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // Buscar estatísticas de uso da regra
    const { data: stats } = await supabase
      .from('tenant_alerts')
      .select('id, priority, status, created_at')
      .eq('tenant_id', profile.organization_id)
      .eq('alert_type', rule.alert_type)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // últimos 30 dias

    const ruleStats = {
      alerts_generated_30d: stats?.length || 0,
      alerts_by_priority: {
        CRITICAL: stats?.filter(s => s.priority === 'CRITICAL').length || 0,
        WARNING: stats?.filter(s => s.priority === 'WARNING').length || 0,
        INFO: stats?.filter(s => s.priority === 'INFO').length || 0,
        OPPORTUNITY: stats?.filter(s => s.priority === 'OPPORTUNITY').length || 0,
      },
      alerts_by_status: {
        ACTIVE: stats?.filter(s => s.status === 'ACTIVE').length || 0,
        ACKNOWLEDGED: stats?.filter(s => s.status === 'ACKNOWLEDGED').length || 0,
        RESOLVED: stats?.filter(s => s.status === 'RESOLVED').length || 0,
        ARCHIVED: stats?.filter(s => s.status === 'ARCHIVED').length || 0,
      },
    };

    return NextResponse.json({
      data: {
        ...rule,
        source: 'custom',
        is_editable: true,
        stats: ruleStats,
      },
    });

  } catch (error) {
    console.error('Error in GET /api/modules/banban/alerts/rules/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/modules/banban/alerts/rules/[id]
 * Atualizar regra de alerta
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const updateData = UpdateAlertRuleSchema.parse(body);

    // Verificar se regra existe
    const { data: existingRule } = await supabase
      .from('tenant_alert_rules')
      .select('id, name')
      .eq('id', params.id)
      .eq('tenant_id', profile.organization_id)
      .single();

    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // Verificar nome único (se está sendo alterado)
    if (updateData.name && updateData.name !== existingRule.name) {
      const { data: nameConflict } = await supabase
        .from('tenant_alert_rules')
        .select('id')
        .eq('tenant_id', profile.organization_id)
        .eq('name', updateData.name)
        .neq('id', params.id)
        .single();

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Rule with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Atualizar regra
    const { data: updatedRule, error: updateError } = await supabase
      .from('tenant_alert_rules')
      .update({
        ...updateData,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('tenant_id', profile.organization_id)
      .select(`
        *,
        created_by_profile:profiles!created_by(full_name, email),
        updated_by_profile:profiles!updated_by(full_name, email)
      `)
      .single();

    if (updateError || !updatedRule) {
      console.error('Error updating alert rule:', updateError);
      return NextResponse.json(
        { error: 'Failed to update rule' },
        { status: 500 }
      );
    }

    // Log da mudança para auditoria
    await supabase
      .from('tenant_alert_rule_changes')
      .insert({
        tenant_id: profile.organization_id,
        rule_id: params.id,
        changed_by: user.id,
        change_type: 'update',
        changes: updateData,
        changed_at: new Date().toISOString(),
      });

    return NextResponse.json({
      data: {
        ...updatedRule,
        source: 'custom',
        is_editable: true,
      },
      message: 'Alert rule updated successfully',
    });

  } catch (error) {
    console.error('Error in PUT /api/modules/banban/alerts/rules/[id]:', error);
    
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
 * DELETE /api/modules/banban/alerts/rules/[id]
 * Deletar regra de alerta customizada
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verificar se regra existe
    const { data: existingRule } = await supabase
      .from('tenant_alert_rules')
      .select('id, name, alert_type')
      .eq('id', params.id)
      .eq('tenant_id', profile.organization_id)
      .single();

    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // Verificar se existem alertas ativos baseados nesta regra
    const { data: activeAlerts } = await supabase
      .from('tenant_alerts')
      .select('id')
      .eq('tenant_id', profile.organization_id)
      .eq('alert_type', existingRule.alert_type)
      .in('status', ['ACTIVE', 'ACKNOWLEDGED']);

    if (activeAlerts && activeAlerts.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete rule with active alerts',
        details: `There are ${activeAlerts.length} active alerts based on this rule`,
      }, { status: 409 });
    }

    // Deletar regra
    const { error: deleteError } = await supabase
      .from('tenant_alert_rules')
      .delete()
      .eq('id', params.id)
      .eq('tenant_id', profile.organization_id);

    if (deleteError) {
      console.error('Error deleting alert rule:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete rule' },
        { status: 500 }
      );
    }

    // Log da deleção para auditoria
    await supabase
      .from('tenant_alert_rule_changes')
      .insert({
        tenant_id: profile.organization_id,
        rule_id: params.id,
        changed_by: user.id,
        change_type: 'delete',
        changes: { deleted_rule: existingRule },
        changed_at: new Date().toISOString(),
      });

    return NextResponse.json({
      message: 'Alert rule deleted successfully',
    });

  } catch (error) {
    console.error('Error in DELETE /api/modules/banban/alerts/rules/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}