'use server';

import { createSupabaseServerClient } from '@/core/supabase/server';
import { revalidatePath } from 'next/cache';
import { createAuditLog, captureRequestInfo } from '@/features/security/audit-logger';
import { AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/core/schemas/audit';
import { z } from 'zod';

// Schemas locais para validação
const updateSecurityAlertSettingsSchema = z.object({
  alert_new_device: z.boolean(),
  alert_failed_attempts: z.boolean(),
  alert_user_deletion: z.boolean(),
  failed_attempts_threshold: z.number().min(1).max(10),
});

export type SecurityAlertSettings = {
  alert_new_device: boolean;
  alert_failed_attempts: boolean;
  alert_user_deletion: boolean;
  failed_attempts_threshold: number;
};

export type UpdateSecurityAlertSettings = z.infer<typeof updateSecurityAlertSettingsSchema>;

// Função para obter configurações de alertas do usuário
export async function getSecurityAlertSettings() {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

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
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

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
        action_type: AUDIT_ACTION_TYPES.USER_UPDATED,
        resource_type: AUDIT_RESOURCE_TYPES.USER,
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
      action_type: AUDIT_ACTION_TYPES.USER_UPDATED,
      resource_type: AUDIT_RESOURCE_TYPES.USER,
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
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

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
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

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
      action_type: AUDIT_ACTION_TYPES.USER_UPDATED,
      resource_type: AUDIT_RESOURCE_TYPES.USER,
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
