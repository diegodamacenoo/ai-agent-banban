'use server';

import { createSupabaseServerClient } from '@/core/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAuditLog } from '@/features/security/audit-logger';
import { AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/core/schemas/audit';
import { captureRequestInfo } from '@/features/security/audit-logger';

// Schema para validação de dados de configuração da organização
const OrganizationSettingsSchema = z.object({
  name: z.string().min(1, 'Nome da organização é obrigatório'),
  logo_url: z.string().url().optional().nullable(),
  domain: z.string().optional().nullable(),
  timezone: z.string().optional(),
  allowed_domains: z.array(z.string()).optional(),
  address: z.string().optional().nullable(),
  billing_email: z.string().email().optional().nullable(),
  // Adicione outros campos conforme necessário
});

export type OrganizationSettings = z.infer<typeof OrganizationSettingsSchema>;

/**
 * Busca as configurações da organização do usuário atual
 * @returns {Promise<{data?: any, error?: string}>} Configurações da organização ou erro
 */
export async function getOrganizationSettings(): Promise<{data?: any, error?: string}> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: 'Usuário não autenticado' };
    }
    
    // Primeiro, obtenha o ID da organização do perfil do usuário
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profileData?.organization_id) {
      console.error('Erro ao buscar ID da organização:', profileError);
      return { error: 'Não foi possível identificar a organização' };
    }
    
    // Em seguida, busque as configurações da organização
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', profileData.organization_id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar configurações da organização:', error);
      return { error: error.message };
    }
    
    return { data };
  } catch (error: any) {
    console.error('Erro inesperado ao buscar configurações da organização:', error);
    return { error: 'Falha ao buscar configurações da organização' };
  }
}

/**
 * Atualiza as configurações da organização
 * @param {OrganizationSettings} formData Dados da organização a serem atualizados
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
 */
export async function updateOrganizationSettings(formData: OrganizationSettings): Promise<{success: boolean, error?: string}> {
  try {
    const validation = OrganizationSettingsSchema.safeParse(formData);
    if (!validation.success) {
      return { 
        success: false,
        error: validation.error.errors.map((e: any) => e.message).join(', ') 
      };
    }

    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }
    
    // Primeiro, obtenha o ID da organização do perfil do usuário
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profileData?.organization_id) {
      console.error('Erro ao buscar ID da organização:', profileError);
      return { 
        success: false,
        error: 'Não foi possível identificar a organização' 
      };
    }
    
    // Atualiza as configurações da organização
    const { error } = await supabase
      .from('organizations')
      .update({
        name: formData.name,
        logo_url: formData.logo_url,
        domain: formData.domain,
        timezone: formData.timezone,
        allowed_domains: formData.allowed_domains,
        address: formData.address,
        billing_email: formData.billing_email,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileData.organization_id);

    if (error) {
      console.error('Erro ao atualizar configurações da organização:', error);
      return { 
        success: false,
        error: error.message 
      };
    }

    // Registrar atualização no log de auditoria
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);
    await createAuditLog({
      actor_user_id: user.id,
      action_type: AUDIT_ACTION_TYPES.SETTINGS_UPDATED,
      resource_type: AUDIT_RESOURCE_TYPES.SETTINGS,
      resource_id: profileData.organization_id,
      organization_id: profileData.organization_id,
      details: {
        updated_fields: Object.keys(formData),
        settings_type: 'organization',
      },
      ip_address: ipAddress,
      user_agent: userAgent,
    });
    
    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Erro inesperado ao atualizar configurações da organização:', error);
    return { 
      success: false,
      error: 'Falha ao atualizar configurações da organização' 
    };
  }
} 
