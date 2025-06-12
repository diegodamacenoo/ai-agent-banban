'use server';

import { createSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAuditLog, AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES, captureRequestInfo } from '@/lib/utils/audit-logger';

// Schema para validação de dados de atualização de perfil
const UpdateProfileSchema = z.object({
  first_name: z.string().min(1, 'Nome é obrigatório'),
  last_name: z.string().optional(),
  job_title: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  team: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  email: z.string().email('E-mail inválido'),
  role: z.string(),
  theme: z.string(),
});

export type ProfileData = {
  first_name: string;
  last_name: string;
  job_title: string | null;
  phone: string | null;
  avatar_url: string | null;
  team: string | null;
  organization_id: string | null;
  username: string | null;
  location: string | null;
  email: string;
  role: string;
  theme: string;
};

/**
 * Busca o perfil do usuário atualmente autenticado
 * @returns {Promise<{data?: ProfileData, error?: string}>} Dados do perfil ou mensagem de erro
 */
export async function getProfile(): Promise<{ data?: ProfileData, error?: string }> {
  try {
    // Busca o usuário autenticado
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    // Se o usuário não está autenticado, retorna um erro
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Busca o perfil do usuário
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, job_title, phone, avatar_url, team, organization_id, username, location, role')
      .eq('id', user.id)
      .single();

    // Se houve um erro, retorna o erro
    if (error) {
      return { error: error.message };
    }

    // Se não houver perfil, retorna um erro
    if (!data) {
      return { error: 'Perfil não encontrado' };
    }
    
    // Monta o objeto de perfil incluindo o e-mail do auth
    const profileResult: ProfileData = {
      ...(data as any),
      email: user.email || ''
    };
    
    return { data: profileResult };
  } catch (error) {
    return { error: 'Falha ao buscar o perfil' };
  }
}

/**
 * Atualiza o perfil do usuário atualmente autenticado
 * @param {z.infer<typeof UpdateProfileSchema>} formData Dados do perfil a serem atualizados
 * @returns {Promise<{success: boolean, error?: string, data?: ProfileData}>} Resultado da operação
 */
export async function updateProfile(formData: z.infer<typeof UpdateProfileSchema>): Promise<{success: boolean, error?: string, data?: ProfileData}> {
  try {
    // Valida os dados do perfil
    const validation = UpdateProfileSchema.safeParse(formData);
    // Se houve um erro, retorna o erro
    if (!validation.success) {
      return { 
        success: false,
        error: validation.error.errors.map(e => e.message).join(', ') 
      };
    }
    console.log('DEBUG - Dados do perfil a serem atualizados:', formData);
    // Verificar se o usuário está autenticado
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    // Buscar dados atuais do perfil para comparar mudanças
    const { data: { user } } = await supabase.auth.getUser();
    // Se o usuário não está autenticado, retorna um erro
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    console.log('DEBUG - Usuário autenticado:', user);
    // Buscar dados atuais do perfil para comparar mudanças
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name, job_title, phone, team, location, username, avatar_url')
      .eq('id', user.id)
      .single();
    console.log('DEBUG - Perfil atual:', currentProfile);
    // Atualiza o perfil do usuário
    const { data, error } = await supabase
      .from('profiles')
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        job_title: formData.job_title,
        phone: formData.phone,
        // team: formData.team,
        location: formData.location,
        // username: formData.username,
        // avatar_url: formData.avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select('first_name, last_name, job_title, phone, avatar_url, team, organization_id, username, location, role')
      .single();
    console.log('DEBUG - Perfil atualizado:', data);
    // Se houve um erro, retorna o erro
    if (error) {
      console.error('Erro ao atualizar perfil:', error);
      return { success: false, error: error.message };
    }
    
    // Registrar log de auditoria
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);
    await createAuditLog({
      actor_user_id: user.id,
      action_type: AUDIT_ACTION_TYPES.PROFILE_UPDATED,
      resource_type: AUDIT_RESOURCE_TYPES.PROFILE,
      resource_id: user.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      organization_id: organizationId,
      details: {
        changes: formData,
        previous_values: currentProfile || {}
      }
    });
    
    revalidatePath('/settings');
    revalidatePath('/dashboard'); // Revalidar outras rotas que possam exibir dados do perfil
    
    // Adiciona o e-mail do objeto auth ao resultado
    const profileResult: ProfileData = {
      ...(data as any),
      email: user.email || ''
    };
    
    return { success: true, data: profileResult };
  } catch (error) {
    console.error('Erro inesperado ao atualizar perfil:', error);
    return { success: false, error: 'Falha ao atualizar o perfil' };
  }
} 