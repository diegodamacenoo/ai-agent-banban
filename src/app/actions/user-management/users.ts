'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { userRoleOptions, type UserRole } from '@/app/(protected)/settings/types/user-settings-types';
import { createSupabaseClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { createAuditLog, AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/lib/utils/audit-logger';
import { captureRequestInfo } from '@/lib/utils/audit-logger';

// Schema para validação de dados de usuário
const updateUserSchema = z.object({
  id: z.string(),
  perfil: z.enum(userRoleOptions).optional(),
});

const deactivateUserSchema = z.object({
  id: z.string(),
});

const softDeleteUserSchema = z.object({
  id: z.string(),
});

const hardDeleteUserSchema = z.object({
  id: z.string(),
});

const restoreUserSchema = z.object({
  id: z.string(),
});

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
    if (sessionError) {
        console.error('Erro ao obter sessão em restoreUser:', sessionError);
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
      console.error('Erro ao buscar perfil do usuário em restoreUser:', userProfileError);
      return { success: false, error: 'Erro ao buscar perfil do usuário.' };
    }
    if (!userProfile || userProfile.role !== 'organization_admin') {
      return { success: false, error: 'Apenas administradores podem restaurar usuários.' };
    }
    
    // Buscar dados do usuário antes da restauração para o log
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
        deleted_at: null,
        status: 'active'
      })
      .eq('id', data.id)
      .not('deleted_at', 'is', null); // Só atualiza se estiver soft deleted

    if (error) {
      console.error('Erro ao restaurar usuário:', error);
      return { 
        success: false, 
        error: `Erro ao restaurar usuário: ${error.message}` 
      };
    }
    
    // Registrar log de auditoria
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(session.user.id);
    await createAuditLog({
      actor_user_id: session.user.id,
      action_type: AUDIT_ACTION_TYPES.USER_RESTORED,
      resource_type: AUDIT_RESOURCE_TYPES.USER,
      resource_id: data.id,
      organization_id: organizationId,
      ip_address: ipAddress,
      user_agent: userAgent,
      details: {
        target_user_email: authUser?.user?.email,
        target_user_name: targetUser ? `${targetUser.first_name} ${targetUser.last_name}`.trim() : null
      }
    });
    
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
 * Lista usuários soft deleted da organização
 * @returns {Promise<{data?: Array<any>, error?: string}>} Lista de usuários excluídos
 */
export async function listDeletedUsers(): Promise<{data?: Array<any>, error?: string}> {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        console.error('Erro ao obter sessão em listDeletedUsers:', sessionError);
        return { error: 'Erro ao obter sessão do usuário.' };
    }
    if (!session) {
      return { error: 'Usuário não autenticado' };
    }
    
    // Busca o perfil do usuário autenticado para obter organization_id e role
    const { data: userProfile, error: userProfileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', session.user.id)
      .single();
    
    if (userProfileError) {
        console.error('Erro ao buscar perfil do usuário em listDeletedUsers:', userProfileError);
        return { error: 'Erro ao buscar perfil do usuário.' };
    }
    if (!userProfile) {
      return { error: 'Perfil de usuário não encontrado' };
    }
    
    // Apenas administradores podem listar usuários excluídos
    if (userProfile.role !== 'organization_admin') {
      return { error: 'Acesso negado. Apenas administradores podem listar usuários excluídos' };
    }

    // Busca perfis soft deleted da organização
    const { data: deletedProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role, status, avatar_url, deleted_at')
      .eq('organization_id', userProfile.organization_id)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (profilesError) {
      console.error('Erro ao buscar perfis excluídos:', profilesError);
      return { error: 'Erro ao buscar usuários excluídos.' };
    }

    if (!deletedProfiles || deletedProfiles.length === 0) {
      return { data: [] };
    }

    // Para cada perfil excluído, tenta buscar dados do Auth (pode não existir mais)
    const adminSupabase = createSupabaseAdminClient(cookieStore);
    const deletedUsers = await Promise.all(
      deletedProfiles.map(async (profile) => {
        try {
          const { data: authUser } = await adminSupabase.auth.admin.getUserById(profile.id);
          const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
          
          return {
            id: profile.id,
            email: authUser?.user?.email || 'Email não disponível',
            nome: fullName || 'Nome não disponível',
            perfil: profile.role || 'standard_user',
            status: profile.status || 'inactive',
            organization_id: userProfile.organization_id,
            avatar_url: profile.avatar_url || undefined,
            first_name: profile.first_name,
            last_name: profile.last_name,
            deleted_at: profile.deleted_at,
            has_auth_account: !!authUser?.user
          };
        } catch (error) {
          // Usuário pode ter sido hard deleted do Auth
          const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
          return {
            id: profile.id,
            email: 'Conta removida',
            nome: fullName || 'Nome não disponível',
            perfil: profile.role || 'standard_user',
            status: profile.status || 'inactive',
            organization_id: userProfile.organization_id,
            avatar_url: profile.avatar_url || undefined,
            first_name: profile.first_name,
            last_name: profile.last_name,
            deleted_at: profile.deleted_at,
            has_auth_account: false
          };
        }
      })
    );

    return { data: deletedUsers };
  } catch (error: any) {
    console.error('Erro inesperado em listDeletedUsers:', error);
    return { 
      error: `Erro ao listar usuários excluídos: ${error.message || 'Erro desconhecido'}` 
    };
  }
}

/**
 * Atualiza dados do usuário em public.profiles
 * @param {z.infer<typeof updateUserSchema>} data Dados do usuário a serem atualizados
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
 */
export async function updateUser(data: z.infer<typeof updateUserSchema>): Promise<{success: boolean, error?: string}> {
  // Valida os dados recebidos usando o schema zod
  const parsed = updateUserSchema.safeParse(data);
  if (!parsed.success) {
    return { 
      success: false, 
      error: `Dados inválidos para atualizar usuário: ${parsed.error.message}` 
    };
  }
  
  // Monta o objeto de atualização apenas com os campos fornecidos
  const updateData: { role?: UserRole } = {};
  if (data.perfil) {
    updateData.role = data.perfil;
  }

  // Se nenhum dado válido foi fornecido, retorna sucesso sem alteração
  if (Object.keys(updateData).length === 0) {
    console.warn("Nenhum dado fornecido para atualizar o perfil.");
    return { success: true }; // Nenhuma alteração necessária
  }

  try {
    // Obtém os cookies da requisição para autenticação
    const cookieStore = await cookies();
    // Cria o cliente Supabase autenticado
    const supabase = createSupabaseClient(cookieStore);
    
    // Obtém a sessão do usuário autenticado
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        console.error('Erro ao obter sessão em updateUser:', sessionError);
        return { success: false, error: 'Erro ao obter sessão do usuário.' };
    }
    if (!session) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Busca o perfil do usuário autenticado para verificar o role
    const { data: userProfile, error: userProfileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    if (userProfileError) {
      console.error('Erro ao buscar perfil do usuário em updateUser:', userProfileError);
      return { success: false, error: 'Erro ao buscar perfil do usuário.' };
    }
    if (!userProfile || userProfile.role !== 'organization_admin') {
      return { success: false, error: 'Apenas administradores podem atualizar perfis de usuário.' };
    }
    
    // Buscar dados atuais do usuário para comparar mudanças
    const { data: targetUser, error: targetUserError } = await supabase
      .from('profiles')
      .select('first_name, last_name, role')
      .eq('id', data.id)
      .single();

    // Buscar email do auth.users para o log
    const adminSupabase = createSupabaseAdminClient(cookieStore);
    const { data: authUser } = await adminSupabase.auth.admin.getUserById(data.id);
    
    // Atualiza o perfil do usuário na tabela profiles
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', data.id);

    // Trata erro de atualização
    if (error) {
      console.error('Erro ao atualizar perfil do usuário:', error);
      return { 
        success: false, 
        error: `Erro ao atualizar perfil: ${error.message}` 
      };
    }
    
    // Registrar log de auditoria
    await createAuditLog({
      actor_user_id: session.user.id,
      action_type: AUDIT_ACTION_TYPES.USER_UPDATED,
      resource_type: AUDIT_RESOURCE_TYPES.USER,
      resource_id: data.id,
      details: {
        target_user_email: authUser?.user?.email,
        target_user_name: targetUser ? `${targetUser.first_name} ${targetUser.last_name}`.trim() : null,
        changes: updateData,
        previous_role: targetUser?.role,
        new_role: updateData.role
      }
    });
    
    // Revalida o cache da página de configurações
    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    // Trata erro inesperado
    console.error('Erro inesperado ao atualizar usuário:', error);
    return { 
      success: false, 
      error: `Erro inesperado ao atualizar perfil: ${error.message}` 
    };
  }
}

/**
 * Desativa usuário em public.profiles (setar status para 'inactive')
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

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        console.error('Erro ao obter sessão em deactivateUser:', sessionError);
        return { success: false, error: 'Erro ao obter sessão do usuário.' };
    }
    if (!session) {
      return { success: false, error: 'Usuário não autenticado' };
    }
        
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'inactive' })
      .eq('id', data.id);

    if (error) {
      console.error('Erro ao desativar perfil do usuário:', error);
      return { 
        success: false, 
        error: `Erro ao desativar perfil: ${error.message}` 
      };
    }
    
    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Erro inesperado ao desativar usuário:', error);
    return { 
      success: false, 
      error: `Erro inesperado ao desativar perfil: ${error.message}` 
    };
  }
}

/**
 * Lista todos os usuários ativos (não soft deleted) combinando dados do Auth e Profiles
 * @returns {Promise<{data?: Array<any>, error?: string}>} Lista de usuários
 */
export async function listUsers(): Promise<{data?: Array<any>, error?: string}> {
  try {
    // Obtém os cookies da requisição para autenticação
    const cookieStore = await cookies();
    // Cria o cliente Supabase autenticado
    const supabase = createSupabaseClient(cookieStore);

    // Obtém a sessão do usuário autenticado
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        console.error('Erro ao obter sessão em listUsers:', sessionError);
        return { error: 'Erro ao obter sessão do usuário.' };
    }
    if (!session) {
      return { error: 'Usuário não autenticado' };
    }
    
    // Busca o perfil do usuário autenticado para obter organization_id e role
    const { data: userProfile, error: userProfileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', session.user.id)
      .single();
    
    if (userProfileError) {
        console.error('Erro ao buscar perfil do usuário em listUsers:', userProfileError);
        return { error: 'Erro ao buscar perfil do usuário.' };
    }
    if (!userProfile) {
      return { error: 'Perfil de usuário não encontrado' };
    }
    
    // Apenas administradores podem listar usuários
    if (userProfile.role !== 'organization_admin') {
      return { error: 'Acesso negado. Apenas administradores podem listar usuários' };
    }

    // Cria o cliente admin do Supabase para buscar usuários do Auth
    const adminSupabase = createSupabaseAdminClient(cookieStore);
    const { data: { users: authUsers }, error: authError } = await adminSupabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Erro ao buscar usuários do Auth:', authError);
      return { 
        error: `Erro ao buscar usuários: ${authError.message}` 
      };
    }
    
    if (!authUsers || authUsers.length === 0) {
      return { data: [] };
    }

    // Busca os perfis da organização, filtrando apenas os que completaram o setup e NÃO estão soft deleted
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role, status, avatar_url')
      .eq('organization_id', userProfile.organization_id)
      .eq('is_setup_complete', true)
      .is('deleted_at', null); // Filtra apenas não excluídos

    if (profilesError) {
      console.error('Erro ao buscar perfis:', profilesError);
    }

    // Cria um mapa de perfis para acesso rápido pelo id
    const profilesMap = new Map((profiles || []).map(p => [p.id, p]));
    // Cria um set com os ids dos usuários da organização
    const organizationUserIds = new Set((profiles || []).map(p => p.id));
    // Filtra apenas usuários do Auth que possuem perfil na organização
    const filteredAuthUsers = authUsers.filter(authUser => organizationUserIds.has(authUser.id));

    // Combina dados do Auth e do Profile para cada usuário
    const combinedUsers = filteredAuthUsers.map(authUser => {
      const profile = profilesMap.get(authUser.id);
      const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');
      return {
        id: authUser.id,
        email: authUser.email,
        nome: fullName || authUser.email?.split('@')[0] || 'N/A',
        perfil: profile?.role || 'standard_user',
        status: profile?.status || 'inactive',
        organization_id: userProfile.organization_id,
        avatar_url: profile?.avatar_url || undefined,
        first_name: profile?.first_name,
        last_name: profile?.last_name
      };
    });

    // Retorna a lista combinada de usuários
    return { data: combinedUsers };
  } catch (error: any) {
    console.error('Erro inesperado em listUsers:', error);
    return { 
      error: `Erro ao listar usuários: ${error.message || 'Erro desconhecido'}` 
    };
  }
} 