'use server';

import { createSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { captureRequestInfo, createAuditLog, AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/lib/utils/audit-logger';
import { ConsentSchema, GetConsentHistorySchema, MultipleConsentsSchema } from '@/lib/schemas/consent';

export type ConsentData = z.infer<typeof ConsentSchema>;

/**
 * Registra um novo consentimento do usuário
 * @param data - Dados do consentimento
 * @returns Promise com resultado da operação
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

    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return { 
        success: false,
        error: 'Usuário não autenticado' 
      };
    }

    // Capturar informações da requisição
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(session.user.id);

    // Registrar o consentimento
    const { error } = await supabase
      .from('user_consents')
      .insert({
        user_id: session.user.id,
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
      actor_user_id: session.user.id,
      action_type: AUDIT_ACTION_TYPES.USER_CONSENT_RECORDED,
      resource_type: AUDIT_RESOURCE_TYPES.USER_CONSENT,
      ip_address: ipAddress,
      user_agent: userAgent,
      organization_id: organizationId,
      details: {
        consent_type: data.consent_type,
        version: data.version,
        method: 'self_service'
      }
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
 * Busca o histórico de consentimentos do usuário atual
 * @returns Promise com histórico de consentimentos
 */
export async function getConsentHistory(): Promise<{data?: any[], error?: string}> {
  const validation = GetConsentHistorySchema.safeParse({});
  if (!validation.success) {
    return { error: 'Validation failed' };
  }
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return { error: 'Usuário não autenticado' };
    }

    const { data, error } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', session.user.id)
      .order('accepted_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar histórico de consentimentos:', error);
      return { error: 'Erro ao buscar histórico' };
    }

    return { data };
  } catch (error: any) {
    console.error('Erro inesperado ao buscar histórico:', error);
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Registra múltiplos consentimentos (usado no setup da conta)
 * @param consents - Array de consentimentos
 * @returns Promise com resultado da operação
 */
export async function recordMultipleConsents(consents: ConsentData[]): Promise<{success: boolean, error?: string}> {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return { 
        success: false,
        error: 'Usuário não autenticado' 
      };
    }

    // Validar todos os consentimentos
    const validation = MultipleConsentsSchema.safeParse(consents);
    if (!validation.success) {
      return { 
        success: false,
        error: `Erro de validação: ${validation.error.errors.map(e => e.message).join(', ')}` 
      };
    }

    // Capturar informações da requisição
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(session.user.id);

    // Preparar dados para inserção
    const consentRecords = consents.map(consent => ({
      user_id: session.user.id,
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
        actor_user_id: session.user.id,
        action_type: AUDIT_ACTION_TYPES.USER_CONSENT_RECORDED,
        resource_type: AUDIT_RESOURCE_TYPES.USER_CONSENT,
        ip_address: ipAddress,
        user_agent: userAgent,
        organization_id: organizationId,
        details: {
          consent_type: consent.consent_type,
          version: consent.version,
          method: 'account_setup'
        }
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