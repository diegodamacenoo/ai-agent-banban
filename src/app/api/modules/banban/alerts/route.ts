import { NextRequest, NextResponse } from 'next/server';
import { banbanAlertProcessor } from '@/core/modules/banban/alerts/services/alert-processor';
import { BANBAN_ALERTS_MODULE_CONFIG } from '@/core/modules/banban/alerts/config';
import { createClient } from '@/core/supabase/server';
import { z } from 'zod';

// Schema para validação de filtros
const AlertFiltersSchema = z.object({
  priority: z.enum(['CRITICAL', 'WARNING', 'INFO', 'OPPORTUNITY']).optional(),
  status: z.enum(['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'ARCHIVED']).optional(),
  type: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
});

// Schema para criação de alerta manual
const CreateAlertSchema = z.object({
  type: z.string().min(1),
  severity: z.enum(['CRITICAL', 'WARNING', 'INFO', 'OPPORTUNITY']),
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(1000),
  metadata: z.record(z.any()).optional(),
  auto_resolve: z.boolean().default(false),
  escalation_enabled: z.boolean().default(true),
});

/**
 * GET /api/modules/banban/alerts
 * Listar alertas ativos com filtros
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

    // Extrair parâmetros de query
    const { searchParams } = new URL(request.url);
    const filters = AlertFiltersSchema.parse({
      priority: searchParams.get('priority'),
      status: searchParams.get('status'),
      type: searchParams.get('type'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      from_date: searchParams.get('from_date'),
      to_date: searchParams.get('to_date'),
    });

    // Processar alertas através do core module
    const alerts = await banbanAlertProcessor.processAllAlerts(profile.organization_id);

    // Aplicar filtros
    let filteredAlerts = alerts;

    if (filters.priority) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === filters.priority);
    }

    if (filters.status) {
      filteredAlerts = filteredAlerts.filter(alert => alert.status === filters.status);
    }

    if (filters.type) {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === filters.type);
    }

    if (filters.from_date) {
      const fromDate = new Date(filters.from_date);
      filteredAlerts = filteredAlerts.filter(alert => new Date(alert.created_at) >= fromDate);
    }

    if (filters.to_date) {
      const toDate = new Date(filters.to_date);
      filteredAlerts = filteredAlerts.filter(alert => new Date(alert.created_at) <= toDate);
    }

    // Paginação
    const offset = (filters.page - 1) * filters.limit;
    const paginatedAlerts = filteredAlerts.slice(offset, offset + filters.limit);

    // Resposta
    return NextResponse.json({
      data: paginatedAlerts,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: filteredAlerts.length,
        pages: Math.ceil(filteredAlerts.length / filters.limit),
      },
      filters: filters,
    });

  } catch (error) {
    console.error('Error in GET /api/modules/banban/alerts:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
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
 * POST /api/modules/banban/alerts
 * Criar alerta manual
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
    const alertData = CreateAlertSchema.parse(body);

    // Inserir alerta na base de dados
    const { data: newAlert, error: insertError } = await supabase
      .from('tenant_alerts')
      .insert({
        tenant_id: profile.organization_id,
        alert_type: alertData.type,
        priority: alertData.severity,
        status: 'ACTIVE',
        title: alertData.title,
        description: alertData.description,
        metadata: alertData.metadata || {},
        auto_resolve: alertData.auto_resolve,
        escalation_enabled: alertData.escalation_enabled,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating manual alert:', insertError);
      return NextResponse.json(
        { error: 'Failed to create alert' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: newAlert,
      message: 'Alert created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/modules/banban/alerts:', error);
    
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