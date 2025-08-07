import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/core/supabase/server';
import { z } from 'zod';

// Schema para resolução de alerta
const ResolveSchema = z.object({
  resolution_comment: z.string().min(1, 'Resolution comment is required'),
  resolution_action: z.string().optional(),
});

/**
 * POST /api/modules/banban/alerts/[id]/resolve
 * Resolver/fechar alerta
 */
export async function POST(
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
    const resolveData = ResolveSchema.parse(body);

    // Verificar se alerta existe e pode ser resolvido
    const { data: existingAlert, error: fetchError } = await supabase
      .from('tenant_alerts')
      .select('id, status, created_at, priority')
      .eq('id', params.id)
      .eq('tenant_id', profile.organization_id)
      .single();

    if (fetchError || !existingAlert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    if (existingAlert.status === 'RESOLVED') {
      return NextResponse.json(
        { error: 'Alert is already resolved' },
        { status: 400 }
      );
    }

    if (existingAlert.status === 'ARCHIVED') {
      return NextResponse.json(
        { error: 'Cannot resolve archived alert' },
        { status: 400 }
      );
    }

    // Calcular tempo de resolução
    const resolutionTime = new Date().getTime() - new Date(existingAlert.created_at).getTime();
    const resolutionTimeMinutes = Math.round(resolutionTime / (1000 * 60));

    // Marcar como resolvido
    const { data: resolvedAlert, error: updateError } = await supabase
      .from('tenant_alerts')
      .update({
        status: 'RESOLVED',
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
        resolution_comment: resolveData.resolution_comment,
        resolution_action: resolveData.resolution_action,
        resolution_time_minutes: resolutionTimeMinutes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('tenant_id', profile.organization_id)
      .select(`
        *,
        resolved_by_profile:profiles!resolved_by(full_name, email)
      `)
      .single();

    if (updateError || !resolvedAlert) {
      console.error('Error resolving alert:', updateError);
      return NextResponse.json(
        { error: 'Failed to resolve alert' },
        { status: 500 }
      );
    }

    // Log da resolução para auditoria
    await supabase
      .from('tenant_alert_deliveries')
      .insert({
        alert_id: params.id,
        tenant_id: profile.organization_id,
        delivery_type: 'resolution',
        status: 'delivered',
        delivered_to: user.id,
        delivered_at: new Date().toISOString(),
        metadata: {
          action: 'resolve',
          resolution_comment: resolveData.resolution_comment,
          resolution_action: resolveData.resolution_action,
          resolution_time_minutes: resolutionTimeMinutes,
          user_id: user.id,
        },
      });

    // Atualizar métricas de resolução
    try {
      // Calcular SLA baseado na prioridade
      let slaMinutes = 0;
      switch (existingAlert.priority) {
        case 'CRITICAL':
          slaMinutes = 60; // 1 hora
          break;
        case 'WARNING':
          slaMinutes = 240; // 4 horas
          break;
        case 'INFO':
          slaMinutes = 1440; // 1 dia
          break;
        case 'OPPORTUNITY':
          slaMinutes = 2880; // 2 dias
          break;
      }

      const slaCompliance = resolutionTimeMinutes <= slaMinutes;

      // Inserir métricas de resolução
      await supabase
        .from('tenant_alert_metrics')
        .insert({
          tenant_id: profile.organization_id,
          alert_id: params.id,
          alert_type: resolvedAlert.alert_type,
          priority: resolvedAlert.priority,
          resolution_time_minutes: resolutionTimeMinutes,
          sla_minutes: slaMinutes,
          sla_compliance: slaCompliance,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        });
    } catch (metricsError) {
      // Log erro mas não falhar a resolução
      console.error('Error updating resolution metrics:', metricsError);
    }

    return NextResponse.json({
      data: {
        ...resolvedAlert,
        resolution_metrics: {
          resolution_time_minutes: resolutionTimeMinutes,
          resolution_time_human: formatDuration(resolutionTimeMinutes),
        },
      },
      message: 'Alert resolved successfully',
    });

  } catch (error) {
    console.error('Error in POST /api/modules/banban/alerts/[id]/resolve:', error);
    
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
 * Formatar duração em minutos para formato legível
 */
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes}m`;
  } else if (remainingMinutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${remainingMinutes}m`;
  }
}