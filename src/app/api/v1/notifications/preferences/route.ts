import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { cookies, headers } from 'next/headers';
import { z } from 'zod';
import { createAuditLog } from '@/features/security/audit-logger';
import { AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/core/schemas/audit';
import { withRateLimit } from '@/core/api/rate-limiter';

// Schema para validação de preferências de notificação
const NotificationPreferencesSchema = z.object({
  prefers_email_notifications: z.boolean(),
  prefers_push_notifications: z.boolean(),
});

// GET - Buscar preferências de notificação
export async function GET() {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success, headers: rateHeaders } = await withRateLimit('standard', 'notification-preferences-api');
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { 
        status: 429,
        headers: rateHeaders
      });
    }

    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('prefers_email_notifications, prefers_push_notifications')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Erro ao buscar preferências de notificação:', error);
      return NextResponse.json({ error: 'Erro ao buscar preferências' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Erro inesperado ao buscar preferências:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT - Atualizar preferências de notificação
export async function PUT(request: NextRequest) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success, headers: rateHeaders } = await withRateLimit('standard', 'notification-preferences-api');
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { 
        status: 429,
        headers: rateHeaders
      });
    }

    const body = await request.json();
    const validation = NotificationPreferencesSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: validation.error.errors.map(e => e.message).join(', ') 
      }, { status: 400 });
    }

    const data = validation.data;
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    // Buscar dados atuais para comparação
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('prefers_email_notifications, prefers_push_notifications')
      .eq('id', user.id)
      .single();

    // Atualizar preferências no perfil
    const { error } = await supabase
      .from('profiles')
      .update({
        prefers_email_notifications: data.prefers_email_notifications,
        prefers_push_notifications: data.prefers_push_notifications,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      console.error('Erro ao atualizar preferências de notificação:', error);
      return NextResponse.json({ error: 'Erro ao atualizar preferências' }, { status: 500 });
    }

    // Registrar log de auditoria
    await createAuditLog({
      actor_user_id: user.id,
      action_type: AUDIT_ACTION_TYPES.USER_UPDATED,
      resource_type: AUDIT_RESOURCE_TYPES.USER,
      resource_id: user.id,
      details: {
        changes: data,
        previous_values: {
          prefers_email_notifications: currentProfile?.prefers_email_notifications,
          prefers_push_notifications: currentProfile?.prefers_push_notifications
        },
        method: 'api_call'
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro inesperado ao atualizar preferências:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 
