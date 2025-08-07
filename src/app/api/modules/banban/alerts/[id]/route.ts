import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/core/supabase/server';
import { z } from 'zod';

// Schema para ações no alerta
const AlertActionSchema = z.object({
  comment: z.string().optional(),
  resolved_by: z.string().optional(),
});

/**
 * GET /api/modules/banban/alerts/[id]
 * Obter detalhes de um alerta específico
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

    // Buscar alerta específico
    const { data: alert, error: alertError } = await supabase
      .from('tenant_alerts')
      .select(`
        *,
        created_by_profile:profiles!created_by(full_name, email),
        acknowledged_by_profile:profiles!acknowledged_by(full_name, email),
        resolved_by_profile:profiles!resolved_by(full_name, email)
      `)
      .eq('id', params.id)
      .eq('tenant_id', profile.organization_id)
      .single();

    if (alertError || !alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    // Buscar histórico de escalações
    const { data: escalations } = await supabase
      .from('tenant_alert_escalations')
      .select(`
        *,
        escalated_to_profile:profiles!escalated_to(full_name, email)
      `)
      .eq('alert_id', params.id)
      .order('created_at', { ascending: false });

    // Buscar logs de entrega
    const { data: deliveries } = await supabase
      .from('tenant_alert_deliveries')
      .select('*')
      .eq('alert_id', params.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      data: {
        ...alert,
        escalations: escalations || [],
        deliveries: deliveries || [],
      },
    });

  } catch (error) {
    console.error('Error in GET /api/modules/banban/alerts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/modules/banban/alerts/[id]
 * Atualizar alerta específico
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
    const actionData = AlertActionSchema.parse(body);

    // Atualizar alerta
    const { data: updatedAlert, error: updateError } = await supabase
      .from('tenant_alerts')
      .update({
        ...actionData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('tenant_id', profile.organization_id)
      .select()
      .single();

    if (updateError || !updatedAlert) {
      return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
    }

    return NextResponse.json({
      data: updatedAlert,
      message: 'Alert updated successfully',
    });

  } catch (error) {
    console.error('Error in PUT /api/modules/banban/alerts/[id]:', error);
    
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
 * DELETE /api/modules/banban/alerts/[id]
 * Arquivar alerta (soft delete)
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

    // Arquivar alerta (soft delete)
    const { data: archivedAlert, error: archiveError } = await supabase
      .from('tenant_alerts')
      .update({
        status: 'ARCHIVED',
        archived_at: new Date().toISOString(),
        archived_by: user.id,
      })
      .eq('id', params.id)
      .eq('tenant_id', profile.organization_id)
      .select()
      .single();

    if (archiveError || !archivedAlert) {
      return NextResponse.json({ error: 'Failed to archive alert' }, { status: 500 });
    }

    return NextResponse.json({
      data: archivedAlert,
      message: 'Alert archived successfully',
    });

  } catch (error) {
    console.error('Error in DELETE /api/modules/banban/alerts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}