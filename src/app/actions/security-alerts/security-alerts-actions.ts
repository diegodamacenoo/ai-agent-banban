'use server';

import { createSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createAuditLog, AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES, captureRequestInfo } from '@/lib/utils/audit-logger';
import { 
  updateSecurityAlertSettingsSchema,
  type SecurityAlertSettings,
  type UpdateSecurityAlertSettings 
} from '@/lib/schemas/security-alerts';

// Função para obter configurações de alertas do usuário
export async function getSecurityAlertSettings() {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const user = session.user;

    const { data, error } = await supabase
      .from('security_alert_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Erro ao buscar configurações de alertas:', error);
      return { success: false, error: 'Erro ao buscar configurações' };
    }

    // Se não existe configuração, retorna valores padrão
    if (!data) {
      const defaultSettings: SecurityAlertSettings = {
        alert_new_device: true,
        alert_failed_attempts: true,
        alert_user_deletion: true,
        failed_attempts_threshold: 3
      };
      return { success: true, data: defaultSettings };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erro inesperado ao buscar configurações:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

// Função para atualizar configurações de alertas
export async function updateSecurityAlertSettings(
  settings: UpdateSecurityAlertSettings
) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const user = session.user;

    // Validar dados de entrada
    const validatedSettings = updateSecurityAlertSettingsSchema.parse(settings);

    // Tentar atualizar primeiro
    const { data, error: updateError } = await supabase
      .from('security_alert_settings')
      .update({
        ...validatedSettings,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    // Se não existe registro, criar um novo
    if (updateError && updateError.code === 'PGRST116') {
      const { data: insertData, error: insertError } = await supabase
        .from('security_alert_settings')
        .insert({
          user_id: user.id,
          ...validatedSettings
        })
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao criar configurações de alertas:', insertError);
        return { success: false, error: 'Erro ao salvar configurações' };
      }

      // Registrar ação no audit log
      const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);
      await createAuditLog({
        actor_user_id: user.id,
        action_type: AUDIT_ACTION_TYPES.SECURITY_ALERT_SETTINGS_UPDATED,
        resource_type: AUDIT_RESOURCE_TYPES.SECURITY_ALERT_SETTINGS,
        resource_id: user.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        organization_id: organizationId,
        details: { settings: validatedSettings }
      });

      revalidatePath('/settings');
      return { success: true, data: insertData };
    }

    if (updateError) {
      console.error('Erro ao atualizar configurações de alertas:', updateError);
      return { success: false, error: 'Erro ao atualizar configurações' };
    }

    // Registrar ação no audit log
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);
    await createAuditLog({
      actor_user_id: user.id,
      action_type: AUDIT_ACTION_TYPES.SECURITY_ALERT_SETTINGS_UPDATED,
      resource_type: AUDIT_RESOURCE_TYPES.SECURITY_ALERT_SETTINGS,
      resource_id: user.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      organization_id: organizationId,
      details: { settings: validatedSettings }
    });

    revalidatePath('/settings');
    return { success: true, data };
  } catch (error) {
    console.error('Erro inesperado ao atualizar configurações:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

// Função para obter dispositivos conhecidos do usuário
export async function getUserKnownDevices() {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const user = session.user;

    const { data, error } = await supabase
      .from('user_known_devices')
      .select('*')
      .eq('user_id', user.id)
      .order('last_seen_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar dispositivos conhecidos:', error);
      return { success: false, error: 'Erro ao buscar dispositivos' };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Erro inesperado ao buscar dispositivos:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

// Função para remover dispositivo conhecido
export async function removeKnownDevice(deviceId: string) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const user = session.user;

    const { error } = await supabase
      .from('user_known_devices')
      .delete()
      .eq('id', deviceId)
      .eq('user_id', user.id); // Garantir que só remove dispositivos do próprio usuário

    if (error) {
      console.error('Erro ao remover dispositivo:', error);
      return { success: false, error: 'Erro ao remover dispositivo' };
    }

    // Registrar ação no audit log
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);
    await createAuditLog({
      actor_user_id: user.id,
      action_type: AUDIT_ACTION_TYPES.KNOWN_DEVICE_REMOVED,
      resource_type: AUDIT_RESOURCE_TYPES.KNOWN_DEVICE,
      resource_id: deviceId,
      ip_address: ipAddress,
      user_agent: userAgent,
      organization_id: organizationId,
      details: { device_id: deviceId }
    });

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Erro inesperado ao remover dispositivo:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
} 