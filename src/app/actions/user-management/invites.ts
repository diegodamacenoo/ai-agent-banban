'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { userRoleOptions } from '@/app/(protected)/settings/types/user-settings-types';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/core/supabase/server';
import { createAuditLog, captureRequestInfo } from '@/features/security/audit-logger';
import { AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/core/schemas/audit';
import { cookies } from 'next/headers';

// Schemas locais para validação
const inviteUserSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['user', 'organization_admin']),
  expiresIn: z.number().min(1).max(30).default(7)
});

const resendInviteSchema = z.object({
  id: z.string().uuid('ID do convite inválido')
});

const cancelInviteSchema = z.object({
  id: z.string().uuid('ID do convite inválido')
});

// Função para sanitizar texto - implementação básica
function sanitizeText(text: string): string {
  return text.replace(/[<>]/g, '');
}

interface InviteUserParams {
  email: string;
  role: 'organization_admin' | 'user';
  expiresIn: number;
}

interface InviteUserResult {
  success: boolean;
  error?: string;
}

export async function inviteUser(params: InviteUserParams): Promise<InviteUserResult> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Obter o usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: 'Usuário não autenticado'
      };
    }

    // Obter o perfil do usuário atual para pegar a organization_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: 'Perfil do usuário não encontrado'
      };
    }

    // Verificar se o usuário tem permissão para convidar
    if (profile.role !== 'master_admin' && profile.role !== 'organization_admin') {
      return {
        success: false,
        error: 'Você não tem permissão para convidar usuários'
      };
    }

    // Verificar se o email já está em uso
    const { data: existingUser, error: existingUserError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', params.email)
      .single();

    if (existingUser) {
      return {
        success: false,
        error: 'Este email já está em uso'
      };
    }

    // Verificar se já existe um convite pendente
    const { data: existingInvite, error: existingInviteError } = await supabase
      .from('user_invites')
      .select('id')
      .eq('email', params.email)
      .eq('status', 'PENDING')
      .single();

    if (existingInvite) {
      return {
        success: false,
        error: 'Já existe um convite pendente para este email'
      };
    }

    // Criar o convite
    const { error: inviteError } = await supabase
      .from('user_invites')
      .insert({
        email: params.email,
        role: params.role,
        organization_id: profile.organization_id,
        invited_by: user.id,
        status: 'PENDING',
        expires_at: new Date(Date.now() + params.expiresIn * 1000).toISOString()
      });

    if (inviteError) {
      console.error('Erro ao criar convite:', inviteError);
      return {
        success: false,
        error: 'Erro ao criar convite'
      };
    }

    // TODO: Enviar email de convite
    // Implementar o envio de email com o link de convite

    // Revalidar a página
    revalidatePath('/admin/organizations/[id]', 'page');

    return {
      success: true
    };
  } catch (error) {
    console.error('Erro ao convidar usuário:', error);
    return {
      success: false,
      error: 'Erro inesperado ao convidar usuário'
    };
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
      error: sanitizeText(validation.error.errors.map(e => e.message).join(', ')) 
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Usuário não autenticado ou erro de sessão.' };
    }
    
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role !== 'organization_admin') {
        return { success: false, error: 'Apenas administradores podem reenviar convites.' };
    }
    
    // Buscar dados do convite antes de reenviar para o log
    const { data: inviteData, error: inviteError } = await supabase
      .from('invites')
      .select('email, role')
      .eq('id', data.id)
      .single();
        
    if (inviteError || !inviteData) {
        return { success: false, error: 'Convite não encontrado.' };
    }

    const { error } = await supabase
      .from('invites')
      .update({
        status: 'PENDING', // Reenviado volta para 'PENDING'
        updated_at: new Date().toISOString(),
        expires_at: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString()
      })
      .eq('id', data.id);
      
    if (error) {
      console.error('Erro ao reenviar convite:', error);
      return { success: false, error: sanitizeText(`Erro ao reenviar convite: ${error.message}`) };
    }
    
    // Registrar log de auditoria
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);
    await createAuditLog({
      actor_user_id: user.id,
      action_type: AUDIT_ACTION_TYPES.USER_UPDATED,
      resource_type: AUDIT_RESOURCE_TYPES.USER,
      resource_id: data.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      organization_id: organizationId,
      details: {
        invited_email: inviteData?.email,
        role: inviteData?.role
      }
    });
    
    revalidatePath('/settings/users');
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
      error: sanitizeText(validation.error.errors.map(e => e.message).join(', ')) 
    };
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado ou erro de sessão.' };
    }

    const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (userProfile?.role !== 'organization_admin') {
        return { success: false, error: 'Apenas administradores podem cancelar convites.' };
    }

    // Buscar o convite para obter o user_id e dados para o log
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('id, email, role')
      .eq('id', data.id)
      .single();

    if (inviteError || !invite) {
      return { success: false, error: 'Convite não encontrado.' };
    }
    
    const { error: updateError } = await supabase
        .from('invites')
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('id', data.id);

    if (updateError) {
        console.error('Erro ao cancelar convite:', updateError);
        return { success: false, error: sanitizeText(`Erro ao cancelar convite: ${updateError.message}`) };
    }

    // Registrar log de auditoria
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);
    await createAuditLog({
      actor_user_id: user.id,
      action_type: AUDIT_ACTION_TYPES.USER_DELETED,
      resource_type: AUDIT_RESOURCE_TYPES.USER,
      resource_id: data.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      organization_id: organizationId,
      details: {
        invited_email: invite?.email,
        role: invite?.role
      }
    });

    revalidatePath('/settings/users');
    return { success: true };
  } catch (error: any) {
    console.error('Erro inesperado ao cancelar convite:', error);
    return { success: false, error: 'Ocorreu um erro inesperado ao cancelar o convite' };
  }
}

/**
 * Lista todos os convites pendentes da organização
 * @returns {Promise<{data?: Array<any>, error?: string}>} Lista de convites ou erro
 */
export async function listInvites(): Promise<{data?: Array<any>, error?: string}> {
    try {
        const supabase = await createSupabaseServerClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { error: 'Usuário não autenticado' };
        }

        const { data: userProfile } = await supabase
            .from('profiles')
            .select('role, organization_id')
            .eq('id', user.id)
            .single();

        if (userProfile?.role !== 'organization_admin') {
            return { error: 'Acesso negado.' };
        }

        const { data, error } = await supabase
            .from('invites')
            .select('id, email, role, status, created_at, expires_at')
            .eq('organization_id', userProfile.organization_id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao listar convites:', error);
            return { error: `Erro ao buscar convites: ${error.message}` };
        }

        return { data };
    } catch (error: any) {
        console.error('Erro inesperado em listInvites:', error);
        return { error: `Erro inesperado: ${error.message}` };
    }
} 
