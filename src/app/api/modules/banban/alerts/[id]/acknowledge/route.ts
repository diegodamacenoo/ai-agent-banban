import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/core/supabase/server';
import { z } from 'zod';

// Schema para reconhecimento de alerta
const AcknowledgeSchema = z.object({
  comment: z.string().optional(),
});

/**
 * POST /api/modules/banban/alerts/[id]/acknowledge
 * Marcar alerta como reconhecido
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
    const acknowledgeData = AcknowledgeSchema.parse(body);

    // Verificar se alerta existe e está ativo
    const { data: existingAlert, error: fetchError } = await supabase
      .from('tenant_alerts')
      .select('id, status')
      .eq('id', params.id)
      .eq('tenant_id', profile.organization_id)
      .single();

    if (fetchError || !existingAlert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    if (existingAlert.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Alert is not in active state' },
        { status: 400 }
      );
    }

    // Marcar como reconhecido
    const { data: acknowledgedAlert, error: updateError } = await supabase
      .from('tenant_alerts')
      .update({
        status: 'ACKNOWLEDGED',
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user.id,
        acknowledge_comment: acknowledgeData.comment,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('tenant_id', profile.organization_id)
      .select(`
        *,
        acknowledged_by_profile:profiles!acknowledged_by(full_name, email)
      `)
      .single();

    if (updateError || !acknowledgedAlert) {
      console.error('Error acknowledging alert:', updateError);
      return NextResponse.json(
        { error: 'Failed to acknowledge alert' },
        { status: 500 }
      );
    }

    // Log da ação para auditoria
    await supabase
      .from('tenant_alert_deliveries')
      .insert({
        alert_id: params.id,
        tenant_id: profile.organization_id,
        delivery_type: 'acknowledgment',
        status: 'delivered',
        delivered_to: user.id,
        delivered_at: new Date().toISOString(),
        metadata: {
          action: 'acknowledge',
          comment: acknowledgeData.comment,
          user_id: user.id,
        },
      });

    return NextResponse.json({
      data: acknowledgedAlert,
      message: 'Alert acknowledged successfully',
    });

  } catch (error) {
    console.error('Error in POST /api/modules/banban/alerts/[id]/acknowledge:', error);
    
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