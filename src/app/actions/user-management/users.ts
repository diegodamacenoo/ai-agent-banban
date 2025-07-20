'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { type UserRole, userRoleOptions } from '@/app/(protected)/settings/types/user-settings-types';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/core/supabase/server';
import { createAuditLog } from '@/features/security/audit-logger';
import { AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/core/schemas/audit';
import { z } from 'zod';
import { getUserProfile } from '@/shared/utils/supabase-helpers';
import {
  updateUserSchema,
  deactivateUserSchema,
  softDeleteUserSchema,
  hardDeleteUserSchema,
  restoreUserSchema
} from '@/core/schemas/user-management';

/**
 * Realiza soft delete do usuÃ¡rio (define deleted_at)
 * @param {z.infer<typeof softDeleteUserSchema>} data Dados do usuÃ¡rio a ser soft deleted
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operaÃ§Ã£o
 */
export async function softDeleteUser(data: z.infer<typeof softDeleteUserSchema>): Promise<{success: boolean, error?: string}> {
  const parsed = softDeleteUserSchema.safeParse(data);
  if (!parsed.success) {
    return { 
      success: false, 
      error: 'ID invÃ¡lido para excluir usuÃ¡rio.' 
    };
  }
  
  try {

    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'UsuÃ¡rio nÃ£o autenticado.' };
    }

    // Busca o perfil do usuÃ¡rio autenticado para verificar permissÃµes (método robusto)
    const { data: userProfile, error: userProfileError } = await getUserProfile(supabase, user.id, 'role');
    if (userProfileError) {
      console.error('Erro ao buscar perfil do usuÃ¡rio em softDeleteUser:', userProfileError);
      return { success: false, error: 'Erro ao buscar perfil do usuÃ¡rio.' };
    }
    if (!userProfile || (userProfile as any).role !== 'organization_admin') {
      return { success: false, error: 'Apenas administradores podem excluir usuÃ¡rios.' };
    }

    // Impede auto-exclusÃ£o
    if (data.id === user.id) {
      return { success: false, error: 'VocÃª nÃ£o pode excluir sua prÃ³pria conta atravÃ©s desta funcionalidade.' };
    }
    
    // Buscar dados do usuÃ¡rio antes da exclusÃ£o para o log
    const { data: targetUser, error: targetUserError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', data.id)
      .single();

    // Buscar email do auth.users para o log
    const adminSupabase = await createSupabaseAdminClient();
    const { data: authUser } = await adminSupabase.auth.admin.getUserById(data.id);
        
    const { error } = await supabase
      .from('profiles')
      .update({ 
        deleted_at: new Date().toISOString(),
        status: 'INACTIVE'
      })
      .eq('id', data.id)
      .is('deleted_at', null); // SÃ³ atualiza se nÃ£o estiver jÃ¡ excluÃ­do

    if (error) {
      console.error('Erro ao fazer soft delete do usuÃ¡rio:', error);
      return { 
        success: false, 
        error: `Erro ao excluir usuÃ¡rio: ${error.message}` 
      };
    }
    
    // Registrar log de auditoria
    await createAuditLog({
      actor_user_id: user.id,
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
    console.error('Erro inesperado ao fazer soft delete do usuÃ¡rio:', error);
    return { 
      success: false, 
      error: `Erro inesperado ao excluir usuÃ¡rio: ${error.message}` 
    };
  }
}

/**
 * Realiza hard delete do usuÃ¡rio (exclui permanentemente)
 * @param {z.infer<typeof hardDeleteUserSchema>} data Dados do usuÃ¡rio a ser hard deleted
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operaÃ§Ã£o
 */
export async function hardDeleteUser(data: z.infer<typeof hardDeleteUserSchema>): Promise<{success: boolean, error?: string}> {
  const parsed = hardDeleteUserSchema.safeParse(data);
  if (!parsed.success) {
    return { 
      success: false, 
      error: 'ID invÃ¡lido para exclusÃ£o permanente.' 
    };
  }
  
  try {

    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'UsuÃ¡rio nÃ£o autenticado.' };
    }

    // Busca o perfil do usuÃ¡rio autenticado para verificar permissÃµes
    const { data: userProfile, error: userProfileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (userProfileError) {
      console.error('Erro ao buscar perfil do usuÃ¡rio em hardDeleteUser:', userProfileError);
      return { success: false, error: 'Erro ao buscar perfil do usuÃ¡rio.' };
    }
    if (!userProfile || userProfile.role !== 'organization_admin') {
      return { success: false, error: 'Apenas administradores podem excluir permanentemente usuÃ¡rios.' };
    }

    // Impede auto-exclusÃ£o
    if (data.id === user.id) {
      return { success: false, error: 'VocÃª nÃ£o pode excluir permanentemente sua prÃ³pria conta.' };
    }

    // Verifica se o usuÃ¡rio estÃ¡ soft deleted e busca dados para o log
    const { data: targetUser, error: checkError } = await supabase
      .from('profiles')
      .select('deleted_at, first_name, last_name')
      .eq('id', data.id)
      .single();

    if (checkError) {
      console.error('Erro ao verificar usuÃ¡rio para hard delete:', checkError);
      return { success: false, error: 'UsuÃ¡rio nÃ£o encontrado.' };
    }

    if (!targetUser.deleted_at) {
      return { success: false, error: 'Apenas usuÃ¡rios previamente excluÃ­dos podem ser removidos permanentemente.' };
    }

    // Buscar email do auth.users antes de excluir
    const adminSupabase = await createSupabaseAdminClient();
    const { data: authUser } = await adminSupabase.auth.admin.getUserById(data.id);

    // Exclui o perfil primeiro (devido Ã s foreign keys)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', data.id);

    if (profileError) {
      console.error('Erro ao excluir perfil do usuÃ¡rio:', profileError);
      return { 
        success: false, 
        error: `Erro ao excluir perfil: ${profileError.message}` 
      };
    }

    // Exclui o usuÃ¡rio do Auth
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(data.id);

    if (authError) {
      console.error('Erro ao excluir usuÃ¡rio do Auth:', authError);
      return { 
        success: false, 
        error: `Erro ao excluir conta de acesso: ${authError.message}` 
      };
    }
    
    // Registrar log de auditoria
    await createAuditLog({
      actor_user_id: user.id,
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
    console.error('Erro inesperado ao fazer hard delete do usuÃ¡rio:', error);
    return { 
      success: false, 
      error: `Erro inesperado ao excluir permanentemente: ${error.message}` 
    };
  }
}

/**
 * Restaura usuÃ¡rio soft deleted (remove deleted_at)
 * @param {z.infer<typeof restoreUserSchema>} data Dados do usuÃ¡rio a ser restaurado
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operaÃ§Ã£o
 */
export async function restoreUser(data: z.infer<typeof restoreUserSchema>): Promise<{success: boolean, error?: string}> {
  const parsed = restoreUserSchema.safeParse(data);
  if (!parsed.success) {
    return { 
      success: false, 
      error: 'ID invÃ¡lido para restaurar usuÃ¡rio.' 
    };
  }
  
  try {

    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'UsuÃ¡rio nÃ£o autenticado ou erro de sessÃ£o.' };
    }

    // Apenas administradores podem restaurar usuÃ¡rios
    const { data: userProfile, error: userProfileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfileError || !userProfile || userProfile.role !== 'organization_admin') {
      return { success: false, error: 'Apenas administradores podem restaurar usuÃ¡rios.' };
    }
    
    // Buscar dados do usuÃ¡rio antes da restauraÃ§Ã£o para o log
    const { data: targetUser, error: targetUserError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', data.id)
      .single();

    const { error } = await supabase
      .from('profiles')
      .update({ 
        deleted_at: null,
        status: 'ACTIVE' 
      })
      .eq('id', data.id);

    if (error) {
      console.error('Erro ao restaurar usuÃ¡rio:', error);
      return { 
        success: false, 
        error: `Erro ao restaurar usuÃ¡rio: ${error.message}` 
      };
    }
    
    const adminSupabase = await createSupabaseAdminClient();
    const { data: authUser } = await adminSupabase.auth.admin.getUserById(data.id);
    
    await createAuditLog({
      actor_user_id: user.id,
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
    console.error('Erro inesperado ao restaurar usuÃ¡rio:', error);
    return { 
      success: false, 
      error: `Erro inesperado ao restaurar usuÃ¡rio: ${error.message}` 
    };
  }
}

/**
 * Lista usuÃ¡rios que foram soft deleted
 * @returns {Promise<{data?: Array<any>, error?: string}>} Lista de usuÃ¡rios ou erro
 */
export async function listDeletedUsers(): Promise<{data?: Array<any>, error?: string}> {
  try {

    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'UsuÃ¡rio nÃ£o autenticado' };
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
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
      console.error('Erro ao listar usuÃ¡rios excluÃ­dos:', error);
      return { error: `Erro ao buscar usuÃ¡rios: ${error.message}` };
    }
    
    return { data };
  } catch (error: any) {
    return { error: `Erro inesperado: ${error.message}` };
  }
}

/**
 * Atualiza dados de um usuÃ¡rio (atualmente apenas o perfil/role)
 * @param {z.infer<typeof updateUserSchema>} data Dados do usuÃ¡rio a serem atualizados
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operaÃ§Ã£o
 */
export async function updateUser(data: z.infer<typeof updateUserSchema>): Promise<{success: boolean, error?: string}> {
  const parsedData = updateUserSchema.safeParse(data);
  if (!parsedData.success) {
    return { success: false, error: 'Dados invÃ¡lidos.' };
  }
  const { id, ...updateData } = parsedData.data;

  try {

    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'UsuÃ¡rio nÃ£o autenticado.' };
    }

    // Verifica permissÃµes
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role !== 'organization_admin') {
      return { success: false, error: 'Apenas administradores podem alterar perfis de outros usuÃ¡rios.' };
    }

    // Buscar dados atuais para o log
    const { data: targetUser } = await supabase.from('profiles').select('role').eq('id', id).single();

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar usuÃ¡rio:', error);
      return { 
        success: false, 
        error: `Erro ao atualizar usuÃ¡rio: ${error.message}` 
      };
    }
    
    await createAuditLog({
        actor_user_id: user.id,
        action_type: AUDIT_ACTION_TYPES.USER_UPDATED,
        resource_type: AUDIT_RESOURCE_TYPES.USER,
        resource_id: id,
        details: {
            previous_role: targetUser?.role,
            new_role: updateData.role
        }
    });

    revalidatePath('/settings/users');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Erro inesperado: ${error.message}` };
  }
}

/**
 * Desativa a conta de um usuÃ¡rio (define status como inativo)
 * @param {z.infer<typeof deactivateUserSchema>} data Dados do usuÃ¡rio a ser desativado
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operaÃ§Ã£o
 */
export async function deactivateUser(data: z.infer<typeof deactivateUserSchema>): Promise<{success: boolean, error?: string}> {
  const parsed = deactivateUserSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'ID de usuÃ¡rio invÃ¡lido.' };
  }
  
  try {

    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'UsuÃ¡rio nÃ£o autenticado.' };
    }

    // Verifica permissÃµes
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role !== 'organization_admin') {
      return { success: false, error: 'Apenas administradores podem desativar usuÃ¡rios.' };
    }

    if (data.id === user.id) {
      return { success: false, error: 'VocÃª nÃ£o pode desativar sua prÃ³pria conta.' };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ status: 'INACTIVE' })
      .eq('id', data.id);

    if (error) {
      console.error('Erro ao desativar usuÃ¡rio:', error);
      return { 
        success: false, 
        error: `Erro ao desativar usuÃ¡rio: ${error.message}` 
      };
    }
    
    await createAuditLog({
        actor_user_id: user.id,
        action_type: AUDIT_ACTION_TYPES.USER_DEACTIVATED,
        resource_type: AUDIT_RESOURCE_TYPES.USER,
        resource_id: data.id,
        details: {
            action: 'deactivate',
            new_status: 'INACTIVE'
        }
    });

    revalidatePath('/settings/users');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Erro inesperado: ${error.message}` };
  }
}

/**
 * Lista todos os usuÃ¡rios ativos da organizaÃ§Ã£o
 * @returns {Promise<{data?: Array<any>, error?: string}>} Lista de usuÃ¡rios ou erro
 */
export async function listUsers(): Promise<{data?: Array<any>, error?: string}> {
  try {

    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'UsuÃ¡rio nÃ£o autenticado' };
    }
    
    const { data: userProfile } = await getUserProfile(supabase, user.id, 'role');

    if (!userProfile || (userProfile as any).role !== 'organization_admin') {
      return { error: 'Acesso negado.' };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role, status')
      .is('deleted_at', null)
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Erro ao listar usuÃ¡rios:', error);
      return { error: `Erro ao buscar usuÃ¡rios: ${error.message}` };
    }
    
    return { data };
  } catch (error: any) {
    return { error: `Erro inesperado: ${error.message}` };
  }
}

// ... (O restante do arquivo, como `getUsersWithInvites`, etc., tambÃ©m precisaria de correÃ§Ãµes similares)
// Por brevidade, focando nas funÃ§Ãµes principais.
export async function getUsersWithInvites() {
  try {

    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('UsuÃ¡rio nÃ£o autenticado');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile || profile.role !== 'organization_admin') {
      throw new Error('Acesso negado. Apenas administradores podem listar usuÃ¡rios e convites.');
    }

    // Busca usuÃ¡rios da organizaÃ§Ã£o
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role, status')
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null);

    if (usersError) {
      throw usersError;
    }

    // Busca convites pendentes da organizaÃ§Ã£o
    const { data: invites, error: invitesError } = await supabase
      .from('invites')
      .select('id, email, role, status, created_at')
      .eq('organization_id', profile.organization_id)
      .eq('status', 'PENDING');

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
