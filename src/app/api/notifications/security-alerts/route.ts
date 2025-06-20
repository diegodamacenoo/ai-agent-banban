import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { captureRequestInfo, createAuditLog, AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/lib/utils/audit-logger';

// Schema para configurações de alertas de segurança
const SecurityAlertSettingsSchema = z.object({
  alert_new_device: z.boolean(),
  alert_failed_attempts: z.boolean(),
  alert_user_deletion: z.boolean(),
  failed_attempts_threshold: z.number().min(2).max(10),
});

// GET - Buscar configurações de alertas de segurança
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('security_alert_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Erro ao buscar configurações de segurança:', error);
      return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
    }

    // Se não existem configurações, retornar valores padrão
    const defaultSettings = {
      alert_new_device: true,
      alert_failed_attempts: true,
      alert_user_deletion: true,
      failed_attempts_threshold: 3
    };

    return NextResponse.json({ success: true, data: data || defaultSettings });
  } catch (error: any) {
    console.error('Erro inesperado ao buscar configurações:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT - Atualizar configurações de alertas de segurança
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = SecurityAlertSettingsSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: validation.error.errors.map(e => e.message).join(', ') 
      }, { status: 400 });
    }

    const data = validation.data;
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    // Buscar configurações atuais
    const { data: currentSettings } = await supabase
      .from('security_alert_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let operation: 'insert' | 'update' = 'update';
    let result;

    if (!currentSettings) {
      // Inserir novas configurações
      operation = 'insert';
      result = await supabase
        .from('security_alert_settings')
        .insert({
          user_id: user.id,
          alert_new_device: data.alert_new_device,
          alert_failed_attempts: data.alert_failed_attempts,
          alert_user_deletion: data.alert_user_deletion,
          failed_attempts_threshold: data.failed_attempts_threshold
        });
    } else {
      // Atualizar configurações existentes
      result = await supabase
        .from('security_alert_settings')
        .update({
          alert_new_device: data.alert_new_device,
          alert_failed_attempts: data.alert_failed_attempts,
          alert_user_deletion: data.alert_user_deletion,
          failed_attempts_threshold: data.failed_attempts_threshold,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
    }

    if (result.error) {
      console.error('Erro ao atualizar configurações de segurança:', result.error);
      return NextResponse.json({ error: 'Erro ao atualizar configurações de segurança' }, { status: 500 });
    }

    // Registrar log de auditoria
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);
    await createAuditLog({
      actor_user_id: user.id,
      action_type: AUDIT_ACTION_TYPES.SECURITY_ALERT_SETTINGS_UPDATED,
      resource_type: AUDIT_RESOURCE_TYPES.SECURITY_ALERT_SETTINGS,
      resource_id: user.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      organization_id: organizationId,
      details: {
        changes: data,
        previous_values: currentSettings || {},
        operation,
        method: 'api_call'
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro inesperado ao atualizar configurações de segurança:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 