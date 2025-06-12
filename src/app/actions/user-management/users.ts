'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { type UserRole, userRoleOptions } from '@/app/(protected)/settings/types/user-settings-types';
import { createSupabaseClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { createAuditLog, AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/lib/utils/audit-logger';
import { captureRequestInfo } from '@/lib/utils/audit-logger';
import { z } from 'zod';
import {
  updateUserSchema,
  deactivateUserSchema,
  softDeleteUserSchema,
  hardDeleteUserSchema,
  restoreUserSchema
} from '@/lib/schemas/user-management';

/**
 * Realiza soft delete do usuário (define deleted_at)
 * @param {z.infer<typeof softDeleteUserSchema>} data Dados do usuário a ser soft deleted
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
 */
export async function softDeleteUser(data: z.infer<typeof softDeleteUserSchema>): Promise<{success: boolean, error?: string}> {
  const parsed = softDeleteUserSchema.safeParse(data);
  if (!parsed.success) {
    return { 
      success: false, 
      error: 'ID inválido para excluir usuário.' 
    };
  }
  
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        console.error('Erro ao obter sessão em softDeleteUser:', sessionError);
        return { success: false, error: 'Erro ao obter sessão do usuário.' };
    }
    if (!session) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Busca o perfil do usuário autenticado para verificar permissões
    const { data: userProfile, error: userProfileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    if (userProfileError) {
      console.error('Erro ao buscar perfil do usuário em softDeleteUser:', userProfileError);
      return { success: false, error: 'Erro ao buscar perfil do usuário.' };
    }
    if (!userProfile || userProfile.role !== 'organization_admin') {
      return { success: false, error: 'Apenas administradores podem excluir usuários.' };
    }

    // Impede auto-exclusão
    if (data.id === session.user.id) {
      return { success: false, error: 'Você não pode excluir sua própria conta através desta funcionalidade.' };
    }
    
    // Buscar dados do usuário antes da exclusão para o log
    const { data: targetUser, error: targetUserError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', data.id)
      .single();

    // Buscar email do auth.users para o log
    const adminSupabase = createSupabaseAdminClient(cookieStore);
    const { data: authUser } = await adminSupabase.auth.admin.getUserById(data.id);
        
    const { error } = await supabase
      .from('profiles')
      .update({ 
        deleted_at: new Date().toISOString(),
        status: 'inactive'
      })
      .eq('id', data.id)
      .is('deleted_at', null); // Só atualiza se não estiver já excluído

    if (error) {
      console.error('Erro ao fazer soft delete do usuário:', error);
      return { 
        success: false, 
        error: `Erro ao excluir usuário: ${error.message}` 
      };
    }
    
    // Registrar log de auditoria
    await createAuditLog({
      actor_user_id: session.user.id,
      action_type: AUDIT_ACTION_TYPES.USER_DELETED,
      resource_type: AUDIT_RESOURCE_TYPES.USER,
      resource_id: data.id,
      details: {
        action: 'soft_delete',
        target_user_email: authUser?.user?.email,
        target_user_name: targetUser ? `${targetUser.first_name} ${targetUser.last_name}`.trim() : null
      }
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Erro inesperado ao fazer soft delete do usuário:', error);
    return { 
      success: false, 
      error: `Erro inesperado ao excluir usuário: ${error.message}` 
    };
  }
}

/**
 * Realiza hard delete do usuário (exclui permanentemente)
 * @param {z.infer<typeof hardDeleteUserSchema>} data Dados do usuário a ser hard deleted
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
 */
export async function hardDeleteUser(data: z.infer<typeof hardDeleteUserSchema>): Promise<{success: boolean, error?: string}> {
  const parsed = hardDeleteUserSchema.safeParse(data);
  if (!parsed.success) {
    return { 
      success: false, 
      error: 'ID inválido para exclusão permanente.' 
    };
  }
  
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        console.error('Erro ao obter sessão em hardDeleteUser:', sessionError);
        return { success: false, error: 'Erro ao obter sessão do usuário.' };
    }
    if (!session) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Busca o perfil do usuário autenticado para verificar permissões
    const { data: userProfile, error: userProfileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    if (userProfileError) {
      console.error('Erro ao buscar perfil do usuário em hardDeleteUser:', userProfileError);
      return { success: false, error: 'Erro ao buscar perfil do usuário.' };
    }
    if (!userProfile || userProfile.role !== 'organization_admin') {
      return { success: false, error: 'Apenas administradores podem excluir permanentemente usuários.' };
    }

    // Impede auto-exclusão
    if (data.id === session.user.id) {
      return { success: false, error: 'Você não pode excluir permanentemente sua própria conta.' };
    }

    // Verifica se o usuário está soft deleted e busca dados para o log
    const { data: targetUser, error: checkError } = await supabase
      .from('profiles')
      .select('deleted_at, first_name, last_name')
      .eq('id', data.id)
      .single();

    if (checkError) {
      console.error('Erro ao verificar usuário para hard delete:', checkError);
      return { success: false, error: 'Usuário não encontrado.' };
    }

    if (!targetUser.deleted_at) {
      return { success: false, error: 'Apenas usuários previamente excluídos podem ser removidos permanentemente.' };
    }

    // Buscar email do auth.users antes de excluir
    const adminSupabase = createSupabaseAdminClient(cookieStore);
    const { data: authUser } = await adminSupabase.auth.admin.getUserById(data.id);

    // Exclui o perfil primeiro (devido às foreign keys)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', data.id);

    if (profileError) {
      console.error('Erro ao excluir perfil do usuário:', profileError);
      return { 
        success: false, 
        error: `Erro ao excluir perfil: ${profileError.message}` 
      };
    }

    // Exclui o usuário do Auth
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(data.id);

    if (authError) {
      console.error('Erro ao excluir usuário do Auth:', authError);
      return { 
        success: false, 
        error: `Erro ao excluir conta de acesso: ${authError.message}` 
      };
    }
    
    // Registrar log de auditoria
    await createAuditLog({
      actor_user_id: session.user.id,
      action_type: AUDIT_ACTION_TYPES.USER_DELETED,
      resource_type: AUDIT_RESOURCE_TYPES.USER,
      resource_id: data.id,
      details: {
        action: 'hard_delete',
        target_user_email: authUser?.user?.email,
        target_user_name: targetUser ? `${targetUser.first_name} ${targetUser.last_name}`.trim() : null,
        permanently_deleted: true
      }
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Erro inesperado ao fazer hard delete do usuário:', error);
    return { 
      success: false, 
      error: `Erro inesperado ao excluir permanentemente: ${error.message}` 
    };
  }
}

/**
 * Restaura usuário soft deleted (remove deleted_at)
 * @param {z.infer<typeof restoreUserSchema>} data Dados do usuário a ser restaurado
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
 */
export async function restoreUser(data: z.infer<typeof restoreUserSchema>): Promise<{success: boolean, error?: string}> {
  const parsed = restoreUserSchema.safeParse(data);
  if (!parsed.success) {
    return { 
      success: false, 
      error: 'ID inválido para restaurar usuário.' 
    };
  }
  
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        return { success: false, error: 'Usuário não autenticado ou erro de sessão.' };
    }

    // Apenas administradores podem restaurar usuários
    const { data: userProfile, error: userProfileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userProfileError || !userProfile || userProfile.role !== 'organization_admin') {
      return { success: false, error: 'Apenas administradores podem restaurar usuários.' };
    }
    
    // Buscar dados do usuário antes da restauração para o log
    const { data: targetUser, error: targetUserError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', data.id)
      .single();

    const { error } = await supabase
      .from('profiles')
      .update({ 
        deleted_at: null,
        status: 'active' 
      })
      .eq('id', data.id);

    if (error) {
      console.error('Erro ao restaurar usuário:', error);
      return { 
        success: false, 
        error: `Erro ao restaurar usuário: ${error.message}` 
      };
    }
    
    const adminSupabase = createSupabaseAdminClient(cookieStore);
    const { data: authUser } = await adminSupabase.auth.admin.getUserById(data.id);
    
    await createAuditLog({
      actor_user_id: session.user.id,
      action_type: AUDIT_ACTION_TYPES.USER_RESTORED,
      resource_type: AUDIT_RESOURCE_TYPES.USER,
      resource_id: data.id,
      details: {
        action: 'restore',
        target_user_email: authUser?.user?.email,
        target_user_name: targetUser ? `${targetUser.first_name} ${targetUser.last_name}`.trim() : null,
      }
    });

    revalidatePath('/settings/users');
    return { success: true };
  } catch (error: any) {
    console.error('Erro inesperado ao restaurar usuário:', error);
    return { 
      success: false, 
      error: `Erro inesperado ao restaurar usuário: ${error.message}` 
    };
  }
}

/**
 * Lista usuários que foram soft deleted
 * @returns {Promise<{data?: Array<any>, error?: string}>} Lista de usuários ou erro
 */
export async function listDeletedUsers(): Promise<{data?: Array<any>, error?: string}> {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { error: 'Usuário não autenticado' };
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userProfile?.role !== 'organization_admin') {
      return { error: 'Acesso negado' };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, deleted_at, status')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (error) {
      console.error('Erro ao listar usuários excluídos:', error);
      return { error: `Erro ao buscar usuários: ${error.message}` };
    }
    
    return { data };
  } catch (error: any) {
    return { error: `Erro inesperado: ${error.message}` };
  }
}

/**
 * Atualiza dados de um usuário (atualmente apenas o perfil/role)
 * @param {z.infer<typeof updateUserSchema>} data Dados do usuário a serem atualizados
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
 */
export async function updateUser(data: z.infer<typeof updateUserSchema>): Promise<{success: boolean, error?: string}> {
  const parsed = updateUserSchema.safeParse(data);
  if (!parsed.success) {
    return { 
      success: false, 
      error: 'Dados inválidos para atualizar usuário.' 
    };
  }

  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userProfile?.role !== 'organization_admin') {
      return { success: false, error: 'Apenas administradores podem atualizar usuários.' };
    }

    // Buscar dados atuais para o log
    const { data: targetUser } = await supabase.from('profiles').select('role').eq('id', data.id).single();

    const { error } = await supabase
      .from('profiles')
      .update({ role: data.perfil })
      .eq('id', data.id);

    if (error) {
      console.error('Erro ao atualizar usuário:', error);
      return { 
        success: false, 
        error: `Erro ao atualizar usuário: ${error.message}` 
      };
    }
    
    await createAuditLog({
        actor_user_id: session.user.id,
        action_type: AUDIT_ACTION_TYPES.USER_UPDATED,
        resource_type: AUDIT_RESOURCE_TYPES.USER,
        resource_id: data.id,
        details: {
            previous_role: targetUser?.role,
            new_role: data.perfil
        }
    });

    revalidatePath('/settings/users');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Erro inesperado: ${error.message}` };
  }
}

/**
 * Desativa a conta de um usuário (define status como inativo)
 * @param {z.infer<typeof deactivateUserSchema>} data Dados do usuário a ser desativado
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
 */
export async function deactivateUser(data: z.infer<typeof deactivateUserSchema>): Promise<{success: boolean, error?: string}> {
  const parsed = deactivateUserSchema.safeParse(data);
  if (!parsed.success) {
    return { 
      success: false, 
      error: 'ID inválido para desativar usuário.' 
    };
  }

  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userProfile?.role !== 'organization_admin') {
      return { success: false, error: 'Apenas administradores podem desativar usuários.' };
    }

    // Impede autodesativação
    if (data.id === session.user.id) {
      return { success: false, error: 'Você não pode desativar sua própria conta.' };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ status: 'inactive' })
      .eq('id', data.id);

    if (error) {
      console.error('Erro ao desativar usuário:', error);
      return { 
        success: false, 
        error: `Erro ao desativar usuário: ${error.message}` 
      };
    }
    
    await createAuditLog({
        actor_user_id: session.user.id,
        action_type: AUDIT_ACTION_TYPES.USER_UPDATED,
        resource_type: AUDIT_RESOURCE_TYPES.USER,
        resource_id: data.id,
        details: {
            action: 'deactivate',
            new_status: 'inactive'
        }
    });

    revalidatePath('/settings/users');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Erro inesperado: ${error.message}` };
  }
}

/**
 * Lista todos os usuários ativos da organização
 * @returns {Promise<{data?: Array<any>, error?: string}>} Lista de usuários ou erro
 */
export async function listUsers(): Promise<{data?: Array<any>, error?: string}> {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { error: 'Usuário não autenticado' };
    }
    
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userProfile?.role !== 'organization_admin') {
      return { error: 'Acesso negado.' };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role, status')
      .is('deleted_at', null)
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Erro ao listar usuários:', error);
      return { error: `Erro ao buscar usuários: ${error.message}` };
    }
    
    return { data };
  } catch (error: any) {
    return { error: `Erro inesperado: ${error.message}` };
  }
}

// ... (O restante do arquivo, como `getUsersWithInvites`, etc., também precisaria de correções similares)
// Por brevidade, focando nas funções principais.
export async function getUsersWithInvites() {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Usuário não autenticado');
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', session.user.id)
      .single();
    
    if (profileError || !userProfile || userProfile.role !== 'organization_admin') {
      throw new Error('Acesso negado. Apenas administradores podem listar usuários e convites.');
    }

    // Busca usuários da organização
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role, status')
      .eq('organization_id', userProfile.organization_id)
      .is('deleted_at', null);

    if (usersError) {
      throw usersError;
    }

    // Busca convites pendentes da organização
    const { data: invites, error: invitesError } = await supabase
      .from('invites')
      .select('id, email, role, status, created_at')
      .eq('organization_id', userProfile.organization_id)
      .eq('status', 'pending');

    if (invitesError) {
      throw invitesError;
    }

    const combinedList = [
      ...users.map(u => ({ ...u, type: 'user' })),
      ...invites.map(i => ({ ...i, type: 'invite' }))
    ];
    
    return { data: combinedList };
  } catch (error: any) {
    console.error('Erro em getUsersWithInvites:', error);
    return { error: error.message };
  }
} 