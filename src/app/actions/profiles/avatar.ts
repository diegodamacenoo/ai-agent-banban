'use server';

import { createSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { captureRequestInfo } from '@/lib/utils/audit-logger';
import { createAuditLog } from '@/lib/utils/audit-logger';
import { AUDIT_RESOURCE_TYPES } from '@/lib/utils/audit-logger';
import { AUDIT_ACTION_TYPES } from '@/lib/utils/audit-logger';

/**
 * Atualiza a URL do avatar no perfil do usuário
 * @param {string | null} url URL do avatar a ser atualizada
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
 */
export async function updateAvatar(url: string | null): Promise<{success: boolean, error?: string}> {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: url,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
      
    if (error) {
      console.error('Erro ao atualizar avatar no perfil:', error);
      return { success: false, error: error.message };
    }
    
    revalidatePath('/settings');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro inesperado ao atualizar url do avatar:', error);
    return { success: false, error: 'Falha ao atualizar avatar' };
  }
}

/**
 * Faz o upload do avatar para o Supabase Storage e atualiza o perfil
 * @param {FormData} formData FormData contendo o arquivo de avatar
 * @returns {Promise<{success: boolean, url?: string, error?: string}>} Resultado da operação
 */
export async function uploadAvatar(formData: FormData): Promise<{success: boolean, url?: string, error?: string}> {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    const file = formData.get('avatar') as File;
    if (!file) {
      return { success: false, error: 'Nenhum arquivo enviado' };
    }
    
    // Validação do tipo do arquivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return { success: false, error: 'Tipo de arquivo não suportado. Envie uma imagem JPG, PNG, WEBP ou GIF.' };
    }
    
    // Validação do tamanho (2MB máximo)
    if (file.size > 2 * 1024 * 1024) {
      return { success: false, error: 'Arquivo muito grande. O tamanho máximo é 2MB.' };
    }
    
    // Gerar um nome de arquivo único para evitar sobreposições
    const ext = path.extname(file.name);
    const fileName = `${user.id}-${uuidv4()}${ext}`;
    
    // Fazer o upload para o Supabase Storage
    const { data, error: uploadError } = await supabase
      .storage
      .from('avatars')
      .upload(`public/${fileName}`, file, {
        cacheControl: '3600',
        upsert: true
      });
      
    if (uploadError) {
      console.error('Erro ao fazer upload do avatar:', uploadError);
      return { success: false, error: 'Falha ao carregar o avatar' };
    }
    
    // Obter a URL pública do arquivo
    const { data: { publicUrl } } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(`public/${fileName}`);
      
    // Atualizar o perfil do usuário com a nova URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
      
    if (updateError) {
      console.error('Erro ao atualizar avatar no perfil:', updateError);
      return { success: false, error: 'Falha ao atualizar avatar no perfil' };
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
        changes: formData
      }
    }); 
    
    revalidatePath('/settings');
    revalidatePath('/dashboard');
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Erro inesperado ao fazer upload do avatar:', error);
    return { success: false, error: 'Falha ao processar o avatar' };
  }
} 