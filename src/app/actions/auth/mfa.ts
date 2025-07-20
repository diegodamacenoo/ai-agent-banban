'use server';

import { createSupabaseServerClient } from '@/core/supabase/server';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/features/security/audit-logger';
import { AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/core/schemas/audit';
import { headers } from 'next/headers';
import { verifyMFASchema, unenrollMFASchema, type VerifyMFAData, type UnenrollMFAData } from '@/core/schemas/auth';

/**
 * Inicia o processo de inscrição em MFA
 * @returns {Promise<{success: boolean, error?: string, data?: any}>} Resultado da operação
 */
export async function enrollMFA(): Promise<{ success: boolean, error?: string, data?: any }> {
  try {
    console.debug("[DEBUG] Iniciando processo de inscrição MFA");
    const supabase = await createSupabaseServerClient();
    
    // Verificar o usuário atual para garantir que está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("[DEBUG] Erro ao obter usuário atual:", authError);
      return { 
        success: false, 
        error: "Usuário não está autenticado. Por favor, faça login novamente." 
      };
    }
    
    console.debug("[DEBUG] Usuário autenticado:", user.id);
    
    // Listar fatores existentes para verificar se já existe um fator pendente
    const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
    
    if (factorsError) {
      console.error("[DEBUG] Erro ao listar fatores existentes:", factorsError);
      return { 
        success: false, 
        error: "Não foi possível verificar os métodos de autenticação existentes." 
      };
    }
    
    // Tentar remover fatores pendentes, se existirem
    if (factorsData && factorsData.totp && factorsData.totp.length > 0) {
      console.debug("[DEBUG] Fatores existentes encontrados:", factorsData.totp.length);
      
      // Verificar fatores pendentes
      const unverifiedFactors = factorsData.totp.filter(f => f.status === 'unverified');
      if (unverifiedFactors.length > 0) {
        console.debug("[DEBUG] Removendo fatores pendentes:", unverifiedFactors.length);
        
        // Remover fatores pendentes
        for (const factor of unverifiedFactors) {
          try {
            const { error: unenrollError } = await supabase.auth.mfa.unenroll({
              factorId: factor.id
            });
            
            if (unenrollError) {
              console.error(`[DEBUG] Erro ao remover fator pendente ${factor.id}:`, unenrollError);
            } else {
              console.debug(`[DEBUG] Fator pendente removido com sucesso: ${factor.id}`);
            }
          } catch (err) {
            console.error(`[DEBUG] Exceção ao remover fator pendente ${factor.id}:`, err);
          }
        }
      }
    }
    
    console.debug("[DEBUG] Chamando supabase.auth.mfa.enroll");
    
    // Inicia o processo de inscrição em MFA/TOTP
    const enrollResponse = await supabase.auth.mfa.enroll({
      factorType: 'totp'
    });
    
    console.debug("[DEBUG] Resposta do enroll:", 
      enrollResponse.error ? `Erro: ${JSON.stringify(enrollResponse.error)}` : "Sucesso");
    
    const { data, error } = enrollResponse;
    
    if (error) {
      console.error('[DEBUG] Erro detalhado ao iniciar inscrição MFA:', JSON.stringify(error));
      return { success: false, error: 'Não foi possível iniciar a configuração de autenticação de dois fatores.' };
    }
    
    if (!data?.totp) {
      console.error('[DEBUG] Resposta sem dados válidos:', data);
      return { 
        success: false, 
        error: 'Resposta inválida do servidor. Por favor, tente novamente.' 
      };
    }
    
    console.debug('[DEBUG] Inscrição MFA iniciada com sucesso, retornando dados');
    
    return { 
      success: true, 
      data: {
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri
      } 
    };
  } catch (e: any) {
    console.error('[DEBUG] Erro inesperado em enrollMFA:', e);
    console.error('[DEBUG] Detalhes do erro:', e.message);
    console.error('[DEBUG] Stack trace:', e.stack);
    return { success: false, error: 'Ocorreu um erro inesperado ao configurar autenticação de dois fatores.' };
  }
}

/**
 * Verifica um código TOTP para finalizar a inscrição em MFA
 * @param {VerifyMFAData} data Dados de verificação MFA
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
 */
export async function verifyMFA(data: VerifyMFAData): Promise<{ success: boolean, error?: string }> {
  const parsed = verifyMFASchema.safeParse(data);
  if (!parsed.success) {
    return { 
      success: false, 
      error: parsed.error.errors.map(e => e.message).join(', ') 
    };
  }

  const { factorId, code } = parsed.data;
  try {
    const supabase = await createSupabaseServerClient();
    
    // Cria um desafio para o fator
    const challengeResponse = await supabase.auth.mfa.challenge({
      factorId
    });
    
    if (challengeResponse.error) {
      console.error('Erro ao criar desafio MFA:', challengeResponse.error);
      return { success: false, error: 'Não foi possível verificar o código de autenticação.' };
    }
    
    const challengeId = challengeResponse.data.id;

    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    // Verifica o código fornecido
    const verifyResponse = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code
    });
    
    if (verifyResponse.error) {
      console.error('Erro ao verificar código MFA:', verifyResponse.error);
      return { success: false, error: 'Código inválido ou expirado. Tente novamente.' };
    }
    
    // Atualiza a sessão após verificação bem-sucedida
    await supabase.auth.refreshSession();

    // Registrar ativação do 2FA no audit log
    await createAuditLog({
      actor_user_id: user.id,
      action_type: AUDIT_ACTION_TYPES.MFA_ENABLED,
      resource_type: AUDIT_RESOURCE_TYPES.USER,
      resource_id: user.id,
      details: {
        factor_id: factorId,
        method: 'totp'
      }
    });
    
    revalidatePath('/settings');
    return { success: true };
  } catch (e: any) {
    console.error('Erro inesperado em verifyMFA:', e);
    return { success: false, error: 'Ocorreu um erro inesperado ao verificar o código de autenticação.' };
  }
}

/**
 * Lista fatores MFA ativos para o usuário atual
 * @returns {Promise<{success: boolean, error?: string, data?: any}>} Resultado da operação
 */
export async function listMFAFactors(): Promise<{ success: boolean, error?: string, data?: any }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase.auth.mfa.listFactors();
    
    if (error) {
      console.error('Erro ao listar fatores MFA:', error);
      return { success: false, error: 'Não foi possível recuperar informações de autenticação de dois fatores.' };
    }
    
    return { 
      success: true, 
      data: {
        totp: data.totp,
        hasEnabledFactors: !!data.totp.find(factor => factor.status === 'verified')
      } 
    };
  } catch (e: any) {
    console.error('Erro inesperado em listMFAFactors:', e);
    return { success: false, error: 'Ocorreu um erro inesperado ao verificar fatores de autenticação.' };
  }
}

/**
 * Desativa um fator MFA existente
 * @param {string} factorId ID do fator MFA a ser desativado
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
 */
export async function unenrollMFA(factorId: string): Promise<{ success: boolean, error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { error } = await supabase.auth.mfa.unenroll({
      factorId
    });
    
    if (error) {
      console.error('Erro ao desinscrever fator MFA:', error);
      return { success: false, error: 'Não foi possível desativar a autenticação de dois fatores.' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    // Registrar desativação do 2FA no audit log
    await createAuditLog({
      actor_user_id: user.id,
      action_type: AUDIT_ACTION_TYPES.MFA_DISABLED,
      resource_type: AUDIT_RESOURCE_TYPES.USER,
      resource_id: user.id,
      details: {
        factor_id: factorId,
        method: 'totp'
      }
    });
    
    revalidatePath('/settings');
    return { success: true };
  } catch (e: any) {
    console.error('Erro inesperado em unenrollMFA:', e);
    return { success: false, error: 'Ocorreu um erro inesperado ao desativar a autenticação de dois fatores.' };
  }
}

/**
 * Obtém o nível de garantia de autenticação atual
 * @returns {Promise<{success: boolean, error?: string, data?: any}>} Resultado da operação
 */
export async function getAuthLevel(): Promise<{ success: boolean, error?: string, data?: any }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    
    if (error) {
      console.error('Erro ao obter nível de autenticação:', error);
      return { success: false, error: 'Não foi possível verificar o nível de autenticação.' };
    }
    
    return { 
      success: true, 
      data: {
        currentLevel: data.currentLevel,
        nextLevel: data.nextLevel,
        // Se currentLevel for igual a aal2, significa que o usuário está autenticado com MFA
        hasCompletedMFA: data.currentLevel === 'aal2'
      } 
    };
  } catch (e: any) {
    console.error('Erro inesperado em getAuthLevel:', e);
    return { success: false, error: 'Ocorreu um erro inesperado ao verificar o nível de autenticação.' };
  }
} 
