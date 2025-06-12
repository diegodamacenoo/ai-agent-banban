'use server';

import { createSupabaseClient } from '@/lib/supabase/server';
import type { PerfilUsuario } from '@/app/(protected)/settings/types/perfis';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// Esquema para validação ao criar (sem id, created_at, updated_at)
const CreatePerfilSchema = z.object({
  nome: z.string().min(1, 'Nome do perfil é obrigatório'),
  descricao: z.string().optional(),
  permissoes: z.array(z.string()).optional(),
});

// Esquema para validação ao atualizar (id é obrigatório)
const UpdatePerfilSchema = CreatePerfilSchema.extend({
  id: z.string().uuid('ID inválido'),
});

const PERFIL_USUARIO_COLUMNS = 'id, first_name, last_name, role, created_at, updated_at';

/**
 * Busca todos os perfis de usuário/roles disponíveis
 * @returns {Promise<{data?: PerfilUsuario[], error?: string}>} Lista de perfis ou erro
 */
export async function getPerfisUsuario(): Promise<{ data?: PerfilUsuario[]; error?: string }> {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    const { data, error } = await supabase
      .from('profiles') // Tabela de perfis de usuário/roles
      .select(PERFIL_USUARIO_COLUMNS) 
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar perfis de usuário:', error);
      return { error: 'Não foi possível carregar os perfis de usuário.' };
    }
    return { data: data as PerfilUsuario[] };
  } catch (e: any) {
    console.error('Erro inesperado em getPerfisUsuario:', e);
    return { error: 'Um erro inesperado ocorreu.' };
  }
}

/**
 * Cria um novo perfil de usuário/role
 * @param {Omit<PerfilUsuario, 'id' | 'created_at' | 'updated_at'>} formData Dados do perfil a ser criado
 * @returns {Promise<{success: boolean, data?: PerfilUsuario, error?: string}>} Resultado da operação
 */
export async function createPerfilUsuario(
  formData: Omit<PerfilUsuario, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean, data?: PerfilUsuario; error?: string }> {
  const validation = CreatePerfilSchema.safeParse({
    nome: formData.first_name,
    descricao: formData.last_name,
    permissoes: formData.role
  });
  
  if (!validation.success) {
    return { 
      success: false,
      error: validation.error.errors.map(e => e.message).join(', ') 
    };
  }

  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    const { data: newPerfil, error } = await supabase
      .from('profiles') 
      .insert({
        first_name: validation.data.nome,
        last_name: validation.data.descricao,
        role: validation.data.permissoes || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(PERFIL_USUARIO_COLUMNS)
      .single();

    if (error) {
      console.error('Erro ao criar perfil de usuário:', error);
      return { 
        success: false,
        error: 'Não foi possível criar o perfil de usuário.' 
      };
    }
    revalidatePath('/settings');
    return { 
      success: true,
      data: newPerfil as PerfilUsuario 
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
 * @param {PerfilUsuario} formData Dados completos do perfil a ser atualizado
 * @returns {Promise<{success: boolean, data?: PerfilUsuario, error?: string}>} Resultado da operação
 */
export async function updatePerfilUsuario(
  formData: PerfilUsuario
): Promise<{ success: boolean, data?: PerfilUsuario; error?: string }> {
  // Validamos o formData completo para garantir que o id está presente e é válido
  const validation = UpdatePerfilSchema.safeParse({
    id: formData.id,
    nome: formData.first_name,
    descricao: formData.last_name,
    permissoes: formData.role,
  });

  if (!validation.success) {
    return { 
      success: false,
      error: validation.error.errors.map(e => e.message).join(', ') 
    };
  }
  
  const { id, nome, descricao, permissoes } = validation.data;

  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: updatedPerfil, error } = await supabase
      .from('profiles') 
      .update({ 
        first_name: nome,
        last_name: descricao,
        role: permissoes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(PERFIL_USUARIO_COLUMNS)
      .single();

    if (error) {
      console.error('Erro ao atualizar perfil de usuário:', error);
      return { 
        success: false,
        error: 'Não foi possível atualizar o perfil de usuário.' 
      };
    }
    revalidatePath('/settings');
    return { 
      success: true,
      data: updatedPerfil as PerfilUsuario 
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
export async function deletePerfilUsuario(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!id) {
    return { 
      success: false,
      error: 'ID do perfil é obrigatório para remoção.' 
    };
  }

  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    const { error } = await supabase
      .from('profiles') 
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao remover perfil de usuário:', error);
      return { 
        success: false,
        error: 'Não foi possível remover o perfil de usuário.' 
      };
    }
    revalidatePath('/settings');
    return { success: true };
  } catch (e: any) {
    console.error('Erro inesperado em deletePerfilUsuario:', e);
    return { 
      success: false,
      error: 'Um erro inesperado ocorreu ao remover o perfil.' 
    };
  }
} 