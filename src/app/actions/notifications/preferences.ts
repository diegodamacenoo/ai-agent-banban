'use server';

import { createSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { captureRequestInfo, createAuditLog, AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/lib/utils/audit-logger';

// Schema para validação de preferências de notificação
const NotificationPreferencesSchema = z.object({
  prefers_email_notifications: z.boolean(),
  prefers_push_notifications: z.boolean(),
});

// Schema para configurações de alertas de segurança
const SecurityAlertSettingsSchema = z.object({
  alert_new_device: z.boolean(),
  alert_failed_attempts: z.boolean(),
  alert_user_deletion: z.boolean(),
  failed_attempts_threshold: z.number().min(2).max(10),
});

export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;
export type SecurityAlertSettings = z.infer<typeof SecurityAlertSettingsSchema>;

/**
 * Atualiza as preferências básicas de notificação do usuário
 * @param data - Preferências de notificação
 * @returns Promise com resultado da operação
 */
export async function updateNotificationPreferences(data: NotificationPreferences): Promise<{success: boolean, error?: string}> {
  try {
    const validation = NotificationPreferencesSchema.safeParse(data);
    if (!validation.success) {
      return { 
        success: false,
        error: validation.error.errors.map(e => e.message).join(', ') 
      };
    }

    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { 
        success: false,
        error: 'Usuário não autenticado' 
      };
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
      return { 
        success: false,
        error: 'Erro ao atualizar preferências' 
      };
    }

    // Registrar log de auditoria
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);
    await createAuditLog({
      actor_user_id: user.id,
      action_type: AUDIT_ACTION_TYPES.NOTIFICATION_PREFERENCES_UPDATED,
      resource_type: AUDIT_RESOURCE_TYPES.NOTIFICATION_PREFERENCES,
      resource_id: user.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      organization_id: organizationId,
      details: {
        changes: data,
        previous_values: {
          prefers_email_notifications: currentProfile?.prefers_email_notifications,
          prefers_push_notifications: currentProfile?.prefers_push_notifications
        },
        method: 'self_service'
      }
    });

    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Erro inesperado ao atualizar preferências:', error);
    return { 
      success: false,
      error: 'Erro interno do servidor' 
    };
  }
}

/**
 * Atualiza as configurações de alertas de segurança
 * @param data - Configurações de alertas de segurança
 * @returns Promise com resultado da operação
 */
export async function updateSecurityAlertSettings(data: SecurityAlertSettings): Promise<{success: boolean, error?: string}> {
  try {
    const validation = SecurityAlertSettingsSchema.safeParse(data);
    if (!validation.success) {
      return { 
        success: false,
        error: validation.error.errors.map(e => e.message).join(', ') 
      };
    }

    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { 
        success: false,
        error: 'Usuário não autenticado' 
      };
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
      return { 
        success: false,
        error: 'Erro ao atualizar configurações de segurança' 
      };
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
        method: 'self_service'
      }
    });

    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Erro inesperado ao atualizar configurações de segurança:', error);
    return { 
      success: false,
      error: 'Erro interno do servidor' 
    };
  }
}

/**
 * Busca as preferências de notificação do usuário atual
 * @returns Promise com preferências de notificação
 */
export async function getNotificationPreferences(): Promise<{data?: any, error?: string}> {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: 'Usuário não autenticado' };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('prefers_email_notifications, prefers_push_notifications')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Erro ao buscar preferências de notificação:', error);
      return { error: 'Erro ao buscar preferências' };
    }

    return { data };
  } catch (error: any) {
    console.error('Erro inesperado ao buscar preferências:', error);
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Busca as configurações de alertas de segurança do usuário atual
 * @returns Promise com configurações de alertas de segurança
 */
export async function getSecurityAlertSettings(): Promise<{data?: any, error?: string}> {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: 'Usuário não autenticado' };
    }

    const { data, error } = await supabase
      .from('security_alert_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Erro ao buscar configurações de segurança:', error);
      return { error: 'Erro ao buscar configurações' };
    }

    // Se não existem configurações, retornar valores padrão
    const defaultSettings = {
      alert_new_device: true,
      alert_failed_attempts: true,
      alert_user_deletion: true,
      failed_attempts_threshold: 3
    };

    return { data: data || defaultSettings };
  } catch (error: any) {
    console.error('Erro inesperado ao buscar configurações:', error);
    return { error: 'Erro interno do servidor' };
  }
} 