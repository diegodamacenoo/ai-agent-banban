'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { userRoleOptions } from '@/app/(protected)/settings/types/user-settings-types';
import { createSupabaseClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { createAuditLog, AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES, captureRequestInfo } from '@/lib/utils/audit-logger';

// Schema para validação de dados de convite
const inviteUserSchema = z.object({
  email: z.string().email('E-mail inválido'),
  role: z.enum(userRoleOptions).default('reader'),
  expiresIn: z.number().int().min(1).max(30).default(7), // Dias para expiração, padrão 7 dias
});

const resendInviteSchema = z.object({
  id: z.string(),
});

const cancelInviteSchema = z.object({
  id: z.string(),
});

/**
 * Envia um convite para um novo usuário
 * @param {z.infer<typeof inviteUserSchema>} data Dados do convite
 * @param {string} [jwt] JWT opcional para autenticação
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
 */
export async function inviteUser(data: z.infer<typeof inviteUserSchema>, jwt?: string): Promise<{success: boolean, error?: string}> {
  const validation = inviteUserSchema.safeParse(data);
  if (!validation.success) {
    return { 
      success: false, 
      error: validation.error.errors.map(e => e.message).join(', ') 
    };
  }

  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    // Buscar dados do usuário logado para obter organization_id
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Erro ao obter sessão em inviteUser:', sessionError);
      return { success: false, error: 'Erro ao obter sessão do usuário.' };
    }
    if (!session) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const { data: userProfile, error: userProfileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', session.user.id)
      .single();

    if (userProfileError) {
      console.error('Erro ao buscar perfil do usuário em inviteUser:', userProfileError);
      return { success: false, error: 'Erro ao buscar perfil do usuário.' };
    }
    if (!userProfile) {
      return { success: false, error: 'Perfil de usuário não encontrado' };
    }

    if (userProfile.role !== 'organization_admin') {
      return { success: false, error: 'Apenas administradores podem enviar convites' };
    }

    // Chamada da edge function do Supabase
    const { data: result, error } = await supabase.functions.invoke('invite-new-user', {
      body: {
        email: data.email,
        organization_id: userProfile.organization_id,
        role: data.role,
      },
      // headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined, // Descomente se precisar passar JWT
    });

    if (error) {
      console.error('Erro ao invocar edge function invite-new-user:', error);
      return { success: false, error: error.message || 'Erro ao enviar convite.' };
    }

    // Registrar log de auditoria
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(session.user.id);
    await createAuditLog({
      actor_user_id: session.user.id,
      action_type: AUDIT_ACTION_TYPES.USER_INVITE_SENT,
      resource_type: AUDIT_RESOURCE_TYPES.INVITE,
      ip_address: ipAddress,
      user_agent: userAgent,
      organization_id: organizationId,
      details: {
        invited_email: data.email,
        role: data.role,
        expires_in_days: data.expiresIn,
        organization_id: userProfile.organization_id
      }
    });

    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Erro inesperado ao enviar convite:', error);
    return { success: false, error: 'Ocorreu um erro inesperado ao enviar o convite' };
  }
}

/**
 * Reenvia um convite existente
 * @param {z.infer<typeof resendInviteSchema>} data Dados do convite a ser reenviado
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
 */
export async function resendInvite(data: z.infer<typeof resendInviteSchema>): Promise<{success: boolean, error?: string}> {
  const validation = resendInviteSchema.safeParse(data);
  if (!validation.success) {
    return { 
      success: false, 
      error: validation.error.errors.map(e => e.message).join(', ') 
    };
  }

  try {
    const cookieStore = await cookies(); // Chamada síncrona
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        console.error('Erro ao obter sessão em resendInvite:', sessionError);
        return { success: false, error: 'Erro ao obter sessão do usuário.' };
    }
    if (!session) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    // Buscar dados do convite antes de reenviar para o log
    const { data: inviteData, error: inviteError } = await supabase
      .from('user_invites')
      .select('email, role')
      .eq('id', data.id)
      .single();
        
    const { error } = await supabase // RLS deve garantir que apenas admin da org correta possa fazer isso
      .from('user_invites')
      .update({
        status: 'reenviado',
        updated_at: new Date().toISOString(),
        expires_at: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString() // Reenviar com +7 dias de expiração
      })
      .eq('id', data.id);
      
    if (error) {
      console.error('Erro ao reenviar convite:', error);
      return { success: false, error: `Erro ao reenviar convite: ${error.message}` };
    }
    
    // Registrar log de auditoria
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(session.user.id);
    await createAuditLog({
      actor_user_id: session.user.id,
      action_type: AUDIT_ACTION_TYPES.USER_INVITE_RESENT,
      resource_type: AUDIT_RESOURCE_TYPES.INVITE,
      ip_address: ipAddress,
      user_agent: userAgent,
      organization_id: organizationId,
      resource_id: data.id,
      details: {
        invited_email: inviteData?.email,
        role: inviteData?.role
      }
    });
    
    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Erro inesperado ao reenviar convite:', error);
    return { success: false, error: 'Ocorreu um erro inesperado ao reenviar o convite' };
  }
}

/**
 * Cancela um convite existente
 * @param {z.infer<typeof cancelInviteSchema>} data Dados do convite a ser cancelado
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
 */
export async function cancelInvite(data: z.infer<typeof cancelInviteSchema>): Promise<{success: boolean, error?: string}> {
  const validation = cancelInviteSchema.safeParse(data);
  if (!validation.success) {
    return { 
      success: false, 
      error: validation.error.errors.map(e => e.message).join(', ') 
    };
  }

  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    const adminSupabase = createSupabaseAdminClient(cookieStore);

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Erro ao obter sessão em cancelInvite:', sessionError);
      return { success: false, error: 'Erro ao obter sessão do usuário.' };
    }
    if (!session) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Buscar o convite para obter o user_id e dados para o log
    const { data: invite, error: inviteError } = await supabase
      .from('user_invites')
      .select('id, user_id, email, role')
      .eq('id', data.id)
      .single();

    if (inviteError) {
      console.error('Erro ao buscar convite em cancelInvite:', inviteError);
      return { success: false, error: 'Erro ao buscar convite.' };
    }
    if (!invite) {
      return { success: false, error: 'Convite não encontrado.' };
    }

    // Se houver user_id, deletar o usuário do auth
    if (invite.user_id) {
      const { error: deleteUserError } = await adminSupabase.auth.admin.deleteUser(invite.user_id);
      if (deleteUserError) {
        console.error('Erro ao deletar usuário do auth:', deleteUserError);
        return { success: false, error: `Erro ao deletar usuário: ${deleteUserError.message}` };
      }
    }

    // Registrar log de auditoria
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(session.user.id);
    await createAuditLog({
      actor_user_id: session.user.id,
      action_type: AUDIT_ACTION_TYPES.USER_INVITE_CANCELLED,
      resource_type: AUDIT_RESOURCE_TYPES.INVITE,
      resource_id: data.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      organization_id: organizationId,
      details: {
        invited_email: invite.email,
        role: invite.role,
        had_user_account: !!invite.user_id
      }
    });

    // Deletar o registro do convite
    // const { error: deleteInviteError } = await supabase
    //   .from('user_invites')
    //   .delete()
    //   .eq('id', data.id);

    // if (deleteInviteError) {
    //   console.error('Erro ao deletar convite:', deleteInviteError);
    //   return { success: false, error: `Erro ao deletar convite: ${deleteInviteError.message}` };
    // }

    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Erro inesperado ao cancelar convite:', error);
    return { success: false, error: 'Ocorreu um erro inesperado ao cancelar o convite' };
  }
}

/**
 * Lista todos os convites
 * @returns {Promise<{data?: Array<any>, error?: string}>} Lista de convites
 */
export async function listInvites(): Promise<{data?: Array<any>, error?: string}> {
  try {
    const cookieStore = await cookies(); // Chamada síncrona
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        console.error('Erro ao obter sessão em listInvites:', sessionError);
        return { error: 'Erro ao obter sessão do usuário.' };
    }
    if (!session) {
        return { error: 'Usuário não autenticado' };
    }

    // A política RLS na tabela user_invites deve filtrar pela organization_id do admin logado.
    const { data, error } = await supabase
      .from('user_invites')
      .select('id, email, created_at, status, expires_at, updated_at, role, organization_id')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Erro ao listar convites:', error);
      return { error: `Erro ao listar convites: ${error.message}` };
    }
    
    return { data: data || [] };
  } catch (error: any) {
    console.error('Erro inesperado ao listar convites:', error);
    return { error: 'Ocorreu um erro inesperado ao listar os convites' };
  }
} 