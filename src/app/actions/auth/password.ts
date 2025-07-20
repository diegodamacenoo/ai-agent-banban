'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/features/security/audit-logger/audit-logger';
import { AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/core/schemas/audit';
import { captureRequestInfo } from '@/core/auth/request-info';
import { safeLogger } from '@/features/security/safe-logger';

// Schemas de validação
const ChangePasswordSchema = z.object({
  newPassword: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres')
});

const RequestPasswordResetSchema = z.object({
  email: z.string().email('Email inválido')
});

type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

/**
 * Solicita redefinição de senha para o usuário atual
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
 */
export async function requestPasswordReset(): Promise<{ success: boolean, error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.email) {
      return { success: false, error: 'Não foi possível obter o e-mail do usuário.' };
    }
    const validation = RequestPasswordResetSchema.safeParse({ email: user.email });
    if (!validation.success) {
      return { success: false, error: validation.error.errors.map((e) => e.message).join(', ') };
    }
    const { email } = validation.data;
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      safeLogger.warn('Falha ao solicitar redefinição de senha', {
        action: 'password_reset_request_failed',
        hasUser: !!user
      });
      return { success: false, error: 'Não foi possível solicitar redefinição de senha.' };
    }
    return { success: true };
  } catch (e: any) {
    safeLogger.error('Erro inesperado ao solicitar redefinição de senha', {
      action: 'password_reset_request_error'
    });
    return { success: false, error: 'Ocorreu um erro inesperado ao solicitar redefinição de senha.' };
  }
}

/**
 * Altera a senha do usuário atual
 * @param {ChangePasswordInput} data Dados para alteração de senha
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
 */
export async function changePassword(
  data: ChangePasswordInput
): Promise<{ success: boolean, error?: string }> {
  const validation = ChangePasswordSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.errors.map((e) => e.message).join(', ') };
  }

  const { newPassword } = validation.data;

  try {
    const supabase = await createSupabaseServerClient();
    
    // Obter dados do usuário para o log
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      safeLogger.warn('Falha ao alterar senha', {
        action: 'password_change_failed',
        userId: user.id
      });
      return { success: false, error: 'Não foi possível alterar a senha.' };
    }
    
    // Registrar log de auditoria
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);
    await createAuditLog({
      actor_user_id: user.id,
      action_type: AUDIT_ACTION_TYPES.USER_UPDATED,
      resource_type: AUDIT_RESOURCE_TYPES.USER,
      resource_id: user.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      organization_id: organizationId,
      details: {
        action: 'password_changed',
        method: 'self_service'
      }
    });
    
    revalidatePath('/settings');
    return { success: true };
  } catch (e: any) {
    safeLogger.error('Erro inesperado ao alterar senha', {
      action: 'password_change_error'
    });
    return { success: false, error: 'Ocorreu um erro inesperado ao alterar a senha.' };
  }
} 
