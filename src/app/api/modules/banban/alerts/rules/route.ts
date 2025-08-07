import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/core/supabase/server';
import { BANBAN_ALERTS_MODULE_CONFIG } from '@/core/modules/banban/alerts/config';
import { z } from 'zod';

// Schema para criação/atualização de regra
const AlertRuleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  alert_type: z.string().min(1),
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
  }),
  actions: z.object({
    priority: z.enum(['CRITICAL', 'WARNING', 'INFO', 'OPPORTUNITY']),
    auto_escalate: z.boolean().default(false),
    escalation_delay_minutes: z.number().min(0).optional(),
    notification_channels: z.array(z.enum(['email', 'sms', 'push', 'dashboard'])),
    custom_message_template: z.string().optional(),
  }),
  is_active: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/modules/banban/alerts/rules
 * Listar regras de alertas configuradas
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

    // Buscar regras customizadas do tenant
    const { data: customRules, error: rulesError } = await supabase
      .from('tenant_alert_rules')
      .select(`
        *,
        created_by_profile:profiles!created_by(full_name, email),
        updated_by_profile:profiles!updated_by(full_name, email)
      `)
      .eq('tenant_id', profile.organization_id)
      .order('created_at', { ascending: false });

    if (rulesError) {
      console.error('Error fetching custom rules:', rulesError);
      return NextResponse.json(
        { error: 'Failed to fetch rules' },
        { status: 500 }
      );
    }

    // Combinar regras do sistema (module.json) com regras customizadas
    const systemRules = BANBAN_ALERTS_MODULE_CONFIG.business_rules.alert_types.map(rule => ({
      id: `system-${rule.type}`,
      name: rule.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      alert_type: rule.type,
      source: 'system',
      priority: rule.priority.toUpperCase(),
      threshold: rule.threshold,
      auto_escalate: rule.auto_escalate,
      is_active: true,
      is_editable: false,
      created_at: null,
      updated_at: null,
    }));

    const allRules = [
      ...systemRules,
      ...(customRules || []).map(rule => ({
        ...rule,
        source: 'custom',
        is_editable: true,
      })),
    ];

    return NextResponse.json({
      data: allRules,
      summary: {
        total: allRules.length,
        system_rules: systemRules.length,
        custom_rules: customRules?.length || 0,
        active_rules: allRules.filter(rule => rule.is_active).length,
      },
    });

  } catch (error) {
    console.error('Error in GET /api/modules/banban/alerts/rules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/modules/banban/alerts/rules
 * Criar nova regra de alerta customizada
 */
export async function POST(request: NextRequest) {
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
    const ruleData = AlertRuleSchema.parse(body);

    // Verificar se já existe regra com mesmo nome
    const { data: existingRule } = await supabase
      .from('tenant_alert_rules')
      .select('id')
      .eq('tenant_id', profile.organization_id)
      .eq('name', ruleData.name)
      .single();

    if (existingRule) {
      return NextResponse.json(
        { error: 'Rule with this name already exists' },
        { status: 409 }
      );
    }

    // Criar nova regra
    const { data: newRule, error: insertError } = await supabase
      .from('tenant_alert_rules')
      .insert({
        tenant_id: profile.organization_id,
        name: ruleData.name,
        description: ruleData.description,
        alert_type: ruleData.alert_type,
        conditions: ruleData.conditions,
        actions: ruleData.actions,
        is_active: ruleData.is_active,
        metadata: ruleData.metadata || {},
        created_by: user.id,
      })
      .select(`
        *,
        created_by_profile:profiles!created_by(full_name, email)
      `)
      .single();

    if (insertError || !newRule) {
      console.error('Error creating alert rule:', insertError);
      return NextResponse.json(
        { error: 'Failed to create rule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        ...newRule,
        source: 'custom',
        is_editable: true,
      },
      message: 'Alert rule created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/modules/banban/alerts/rules:', error);
    
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