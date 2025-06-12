'use server';

import { createSupabaseClient } from '@/lib/supabase/server';
import type { Role } from '@/app/(protected)/settings/types/perfis';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createAuditLog, AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES, captureRequestInfo } from '@/lib/utils/audit-logger';
import { PerfilSchema, UpdatePerfilSchema, DeletePerfilSchema } from '@/lib/schemas/user-management';

const PERFIL_COLUMNS = 'id, name, description, permissions, created_at, updated_at';

/**
 * Busca todos os perfis de usuário/roles disponíveis
 * @returns {Promise<{data?: Role[], error?: string}>} Lista de perfis ou erro
 */
export async function getPerfisUsuario(): Promise<{ data?: Role[]; error?: string }> {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { error: 'Usuário não autenticado.' };
    }

    // Idealmente, isso deveria vir de uma tabela 'roles', não 'profiles'
    const { data, error } = await supabase
      .from('roles') 
      .select(PERFIL_COLUMNS) 
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar perfis de usuário:', error);
      return { error: 'Não foi possível carregar os perfis de usuário.' };
    }
    return { data: data as Role[] };
  } catch (e: any) {
    console.error('Erro inesperado em getPerfisUsuario:', e);
    return { error: 'Um erro inesperado ocorreu.' };
  }
}

/**
 * Cria um novo perfil de usuário/role
 * @param {Omit<Role, 'id' | 'created_at' | 'updated_at'>} formData Dados do perfil a ser criado
 * @returns {Promise<{success: boolean, data?: Role, error?: string}>} Resultado da operação
 */
export async function createPerfilUsuario(formData: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: Role; error?: string }> {
  const validation = PerfilSchema.safeParse(formData);
  
  if (!validation.success) {
    return { 
      success: false,
      error: validation.error.errors.map(e => e.message).join(', ') 
    };
  }

  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    const { data: userProfile } = await supabase.from('profiles').select('role, organization_id').eq('id', session.user.id).single();
    if (userProfile?.role !== 'organization_admin') {
      return { success: false, error: 'Apenas administradores podem criar perfis.' };
    }

    const { data: newPerfil, error } = await supabase
      .from('roles') 
      .insert({
        name: validation.data.name,
        description: validation.data.description,
        permissions: validation.data.permissions || [],
      })
      .select(PERFIL_COLUMNS)
      .single();

    if (error) {
      console.error('Erro ao criar perfil de usuário:', error);
      return { 
        success: false,
        error: 'Não foi possível criar o perfil de usuário.' 
      };
    }

    // Registrar no log de auditoria
    const { ipAddress, userAgent } = await captureRequestInfo(session.user.id);
    await createAuditLog({
      actor_user_id: session.user.id,
      action_type: AUDIT_ACTION_TYPES.ROLE_CREATED,
      resource_type: AUDIT_RESOURCE_TYPES.ROLE,
      resource_id: newPerfil.id,
      organization_id: userProfile.organization_id,
      details: {
        role_name: newPerfil.name,
        permissions: newPerfil.permissions,
      },
      ip_address: ipAddress,
      user_agent: userAgent,
    });
    
    revalidatePath('/settings/user-profiles');
    return { 
      success: true,
      data: newPerfil as Role
    };
  } catch (e: any) {
    console.error('Erro inesperado em createPerfilUsuario:', e);
    return { 
      success: false,
      error: 'Um erro inesperado ocorreu ao criar o perfil.' 
    };
  }
}

/**
 * Atualiza um perfil de usuário/role existente
 * @param {Role} formData Dados completos do perfil a ser atualizado
 * @returns {Promise<{success: boolean, data?: Role, error?: string}>} Resultado da operação
 */
export async function updatePerfilUsuario(formData: Role): Promise<{ success: boolean; data?: Role; error?: string }> {
  const validation = UpdatePerfilSchema.safeParse(formData);

  if (!validation.success) {
    return { 
      success: false,
      error: validation.error.errors.map(e => e.message).join(', ') 
    };
  }
  
  const { id, name, description, permissions } = validation.data;

  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    const { data: userProfile } = await supabase.from('profiles').select('role, organization_id').eq('id', session.user.id).single();
    if (userProfile?.role !== 'organization_admin') {
      return { success: false, error: 'Apenas administradores podem atualizar perfis.' };
    }
    
    const { data: updatedPerfil, error } = await supabase
      .from('roles') 
      .update({ 
        name,
        description,
        permissions,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(PERFIL_COLUMNS)
      .single();

    if (error) {
      console.error('Erro ao atualizar perfil de usuário:', error);
      return { 
        success: false,
        error: 'Não foi possível atualizar o perfil de usuário.' 
      };
    }

    // Registrar no log de auditoria
    const { ipAddress, userAgent } = await captureRequestInfo(session.user.id);
    await createAuditLog({
      actor_user_id: session.user.id,
      action_type: AUDIT_ACTION_TYPES.ROLE_UPDATED,
      resource_type: AUDIT_RESOURCE_TYPES.ROLE,
      resource_id: updatedPerfil.id,
      organization_id: userProfile.organization_id,
      details: {
        role_name: updatedPerfil.name,
        permissions: updatedPerfil.permissions,
      },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    revalidatePath('/settings/user-profiles');
    return { 
      success: true,
      data: updatedPerfil as Role
    };
  } catch (e: any) {
    console.error('Erro inesperado em updatePerfilUsuario:', e);
    return { 
      success: false,
      error: 'Um erro inesperado ocorreu ao atualizar o perfil.' 
    };
  }
}

/**
 * Remove um perfil de usuário/role
 * @param {string} id ID do perfil a ser removido
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
 */
export async function deletePerfilUsuario(id: string): Promise<{ success: boolean; error?: string }> {
  const validation = DeletePerfilSchema.safeParse({ id });

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors.map(e => e.message).join(', ')
    };
  }

  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    const { data: userProfile } = await supabase.from('profiles').select('role, organization_id').eq('id', session.user.id).single();
    if (userProfile?.role !== 'organization_admin') {
      return { success: false, error: 'Apenas administradores podem remover perfis.' };
    }

    const { data: roleToDelete, error: fetchError } = await supabase.from('roles').select('name').eq('id', id).single();

    if (fetchError || !roleToDelete) {
        return { success: false, error: 'Perfil não encontrado ou erro ao buscar.' };
    }

    const { error } = await supabase
      .from('roles') 
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao remover perfil de usuário:', error);
      return { 
        success: false,
        error: 'Não foi possível remover o perfil de usuário.' 
      };
    }

    // Registrar no log de auditoria
    const { ipAddress, userAgent } = await captureRequestInfo(session.user.id);
    await createAuditLog({
      actor_user_id: session.user.id,
      action_type: AUDIT_ACTION_TYPES.ROLE_DELETED,
      resource_type: AUDIT_RESOURCE_TYPES.ROLE,
      resource_id: id,
      organization_id: userProfile.organization_id,
      details: {
        deleted_role_name: roleToDelete.name,
      },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    revalidatePath('/settings/user-profiles');
    return { success: true };
  } catch (e: any) {
    console.error('Erro inesperado em deletePerfilUsuario:', e);
    return { 
      success: false,
      error: 'Um erro inesperado ocorreu ao remover o perfil.' 
    };
  }
} 