'use server';

import { createSupabaseServerClient } from '@/core/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAuditLog } from '@/features/security/audit-logger';
import { AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/core/schemas/audit';
import { captureRequestInfo } from '@/core/auth/request-info';
import { ConsentSchema, GetConsentHistorySchema, MultipleConsentsSchema } from '@/core/schemas/consent';

export type ConsentData = z.infer<typeof ConsentSchema>;

/**
 * Registra um novo consentimento do usuÃ¡rio
 * @param data - Dados do consentimento
 * @returns Promise com resultado da operaÃ§Ã£o
 */
export async function recordConsent(data: ConsentData): Promise<{success: boolean, error?: string}> {
  try {
    const validation = ConsentSchema.safeParse(data);
    if (!validation.success) {
      return { 
        success: false,
        error: validation.error.errors.map(e => e.message).join(', ') 
      };
    }

    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { 
        success: false,
        error: 'UsuÃ¡rio nÃ£o autenticado' 
      };
    }

    // Capturar informaÃ§Ãµes da requisiÃ§Ã£o
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);

    // Registrar o consentimento
    const { error } = await supabase
      .from('user_consents')
      .insert({
        user_id: user.id,
        consent_type: data.consent_type,
        version: data.version,
        ip_address: ipAddress,
        user_agent: userAgent,
        organization_id: organizationId
      });

    if (error) {
      console.error('Erro ao registrar consentimento:', error);
      return { 
        success: false,
        error: 'Erro ao registrar consentimento' 
      };
    }

    // Registrar log de auditoria
    await createAuditLog({
      actor_user_id: user.id,
      action_type: AUDIT_ACTION_TYPES.USER_CONSENT_RECORDED,
      resource_type: AUDIT_RESOURCE_TYPES.USER_CONSENT,
      resource_id: user.id,
      organization_id: organizationId,
      details: {
        consent_type: data.consent_type,
        status: 'granted',
        version: data.version,
      },
      ip_address: ipAddress,
      user_agent: userAgent,
    });
    
    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Erro inesperado ao registrar consentimento:', error);
    return { 
      success: false,
      error: 'Erro interno do servidor' 
    };
  }
}

/**
 * Busca o histÃ³rico de consentimentos do usuÃ¡rio atual
 * @returns Promise com histÃ³rico de consentimentos
 */
export async function getConsentHistory(): Promise<{data?: any[], error?: string}> {
  const validation = GetConsentHistorySchema.safeParse({});
  if (!validation.success) {
    return { error: 'Validation failed' };
  }
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: 'UsuÃ¡rio nÃ£o autenticado' };
    }

    const { data, error } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', user.id)
      .order('accepted_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar histÃ³rico de consentimentos:', error);
      return { error: 'Erro ao buscar histÃ³rico' };
    }

    return { data };
  } catch (error: any) {
    console.error('Erro inesperado ao buscar histÃ³rico:', error);
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Registra mÃºltiplos consentimentos (usado no setup da conta)
 * @param consents - Array de consentimentos
 * @returns Promise com resultado da operaÃ§Ã£o
 */
export async function recordMultipleConsents(consents: ConsentData[]): Promise<{success: boolean, error?: string}> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { 
        success: false,
        error: 'UsuÃ¡rio nÃ£o autenticado' 
      };
    }

    // Validar todos os consentimentos
    const validation = MultipleConsentsSchema.safeParse(consents);
    if (!validation.success) {
      return { 
        success: false,
        error: `Erro de validaÃ§Ã£o: ${validation.error.errors.map(e => e.message).join(', ')}` 
      };
    }

    // Capturar informaÃ§Ãµes da requisiÃ§Ã£o
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);

    // Preparar dados para inserÃ§Ã£o
    const consentRecords = consents.map(consent => ({
      user_id: user.id,
      consent_type: consent.consent_type,
      version: consent.version,
      ip_address: ipAddress,
      user_agent: userAgent,
      organization_id: organizationId
    }));

    // Inserir todos os consentimentos
    const { error } = await supabase
      .from('user_consents')
      .insert(consentRecords);

    if (error) {
      console.error('Erro ao registrar consentimentos:', error);
      return { 
        success: false,
        error: 'Erro ao registrar consentimentos' 
      };
    }

    // Registrar logs de auditoria para cada consentimento
    for (const consent of consents) {
      await createAuditLog({
        actor_user_id: user.id,
        action_type: AUDIT_ACTION_TYPES.USER_CONSENT_RECORDED,
        resource_type: AUDIT_RESOURCE_TYPES.USER_CONSENT,
        resource_id: user.id,
        organization_id: organizationId,
        details: {
          consent_type: consent.consent_type,
          status: 'granted',
          version: consent.version,
        },
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    }
    
    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Erro inesperado ao registrar consentimentos:', error);
    return { 
      success: false,
      error: 'Erro interno do servidor' 
    };
  }
}

// Registrar revogação no log de auditoria
export async function revokeConsent(consentId: string, consentType: string, reason: string): Promise<{success: boolean, error?: string}> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { 
        success: false,
        error: 'UsuÃ¡rio nÃ£o autenticado' 
      };
    }

    // Capturar informações da requisição
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);

    // Registrar revogação no log de auditoria
    await createAuditLog({
      actor_user_id: user.id,
      action_type: AUDIT_ACTION_TYPES.USER_CONSENT_REVOKED,
      resource_type: AUDIT_RESOURCE_TYPES.USER_CONSENT,
      resource_id: consentId,
      organization_id: organizationId,
      details: {
        consent_type: consentType,
        status: 'revoked',
        reason: reason,
      },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    // Remover consentimento do banco de dados
    const { error } = await supabase
      .from('user_consents')
      .delete()
      .eq('id', consentId);

    if (error) {
      console.error('Erro ao revogar consentimento:', error);
      return { 
        success: false,
        error: 'Erro ao revogar consentimento' 
      };
    }

    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Erro inesperado ao revogar consentimento:', error);
    return { 
      success: false,
      error: 'Erro interno do servidor' 
    };
  }
}

// Registrar atualização no log de auditoria
export async function updateConsent(consentId: string, consentType: string, version: string, oldConsent: string, newConsent: string): Promise<{success: boolean, error?: string}> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { 
        success: false,
        error: 'UsuÃ¡rio nÃ£o autenticado' 
      };
    }

    // Capturar informações da requisição
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);

    // Registrar atualização no log de auditoria
    await createAuditLog({
      actor_user_id: user.id,
      action_type: AUDIT_ACTION_TYPES.USER_CONSENT_UPDATED,
      resource_type: AUDIT_RESOURCE_TYPES.USER_CONSENT,
      resource_id: consentId,
      organization_id: organizationId,
      details: {
        consent_type: consentType,
        status: 'updated',
        version: version,
      },
      old_value: oldConsent,
      new_value: newConsent,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    // Atualizar consentimento no banco de dados
    const { error } = await supabase
      .from('user_consents')
      .update({
        consent_type: consentType,
        version: version,
      })
      .eq('id', consentId);

    if (error) {
      console.error('Erro ao atualizar consentimento:', error);
      return { 
        success: false,
        error: 'Erro ao atualizar consentimento' 
      };
    }

    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Erro inesperado ao atualizar consentimento:', error);
    return { 
      success: false,
      error: 'Erro interno do servidor' 
    };
  }
} 
