'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { createSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ChangePasswordSchema, RequestPasswordResetSchema } from '@/lib/schemas/auth';
import { createAuditLog, AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/lib/utils/audit-logger';
import { captureRequestInfo } from '@/lib/utils/audit-logger';
type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

/**
 * Solicita redefinição de senha para o usuário atual
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
 */
export async function requestPasswordReset(): Promise<{ success: boolean, error?: string }> {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user?.email) {
      return { success: false, error: 'Não foi possível obter o e-mail do usuário.' };
    }
    
    const user = session.user;
    const validation = RequestPasswordResetSchema.safeParse({ email: user.email });
    if (!validation.success) {
      return { success: false, error: validation.error.errors.map((e) => e.message).join(', ') };
    }
    const { email } = validation.data;
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      console.error('Erro ao solicitar redefinição de senha:', error);
      return { success: false, error: 'Não foi possível solicitar redefinição de senha.' };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Erro inesperado em requestPasswordReset:', e);
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
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    // Obter dados do usuário para o log
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }
    
    const user = session.user;
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.error('Erro ao alterar senha:', error);
      return { success: false, error: 'Não foi possível alterar a senha.' };
    }
    
    // Registrar log de auditoria
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);
    await createAuditLog({
      actor_user_id: user.id,
      action_type: AUDIT_ACTION_TYPES.PASSWORD_CHANGED,
      resource_type: AUDIT_RESOURCE_TYPES.PROFILE,
      resource_id: user.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      organization_id: organizationId,
      details: {
        method: 'self_service'
      }
    });
    
    revalidatePath('/settings');
    return { success: true };
  } catch (e: any) {
    console.error('Erro inesperado em changePassword:', e);
    return { success: false, error: 'Ocorreu um erro inesperado ao alterar a senha.' };
  }
} 