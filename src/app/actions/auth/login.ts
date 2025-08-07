'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/features/security/audit-logger';
import { AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/core/schemas/audit';
import { captureRequestInfo } from '@/core/auth/request-info';
import { safeLogger } from '@/features/security/safe-logger';
import { conditionalDebugLog } from '@/app/actions/admin/modules/system-config-utils';

// Schema de validação
const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Realiza o login do usuário e retorna o redirecionamento apropriado
 */
export async function signInWithPassword(data: LoginInput): Promise<{
  success: boolean;
  error?: string;
  redirect?: string;
}> {
  try {
    // Validar input
    const validation = LoginSchema.safeParse(data);
    if (!validation.success) {
      return { 
        success: false, 
        error: validation.error.errors.map(e => e.message).join(', ') 
      };
    }

    const supabase = await createSupabaseServerClient();
    
    // Primeiro, tentar autenticar para obter o user ID
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });

    if (authError) {
      safeLogger.warn('Falha na autenticação', {
        action: 'login_failed',
        error: authError.message
      });
      return { success: false, error: 'Credenciais inválidas' };
    }

    if (!authData.user) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    // VERIFICAR SE O USUÁRIO ESTÁ BLOQUEADO
    await conditionalDebugLog('ServerAction: Verificando bloqueio para usuário', { userId: authData.user.id });
    
    try {
      const { data: isBlocked } = await supabase
        .rpc('is_user_session_blocked', { check_user_id: authData.user.id });
      
      await conditionalDebugLog('ServerAction: Resultado do bloqueio', { isBlocked });
      
      if (isBlocked) {
        await conditionalDebugLog('ServerAction: Usuário bloqueado - fazendo logout e redirecionando', { userId: authData.user.id });
        
        // Fazer logout imediatamente
        await supabase.auth.signOut();
        
        // Buscar tempo restante usando uma RPC mais simples
        await conditionalDebugLog('ServerAction: Buscando tempo de bloqueio para usuário', { userId: authData.user.id });
        
        let timeRemaining = 0;
        
        try {
          // Criar uma RPC simples para obter tempo restante de bloqueio
          const { data: blockData, error: blockRpcError } = await supabase
            .rpc('get_user_block_remaining_time', { check_user_id: authData.user.id });
          
          await conditionalDebugLog('ServerAction: Resultado RPC tempo restante', { blockData, blockRpcError });
          
          if (blockData && typeof blockData === 'number' && blockData > 0) {
            timeRemaining = blockData;
            await conditionalDebugLog('ServerAction: Tempo restante via RPC', { timeRemaining });
          } else {
            await conditionalDebugLog('ServerAction: Sem tempo de bloqueio ou bloqueio expirado', {});
          }
        } catch (error) {
          await conditionalDebugLog('ServerAction: Erro ao buscar tempo via RPC', { error });
          // Fallback: assumir 5 minutos se recém bloqueado
          timeRemaining = 5 * 60; // 5 minutos em segundos
          await conditionalDebugLog('ServerAction: Usando fallback de 5 minutos', { timeRemaining });
        }
        
        await conditionalDebugLog('ServerAction: Redirecionando para login com bloqueio', { timeRemaining });
        
        // Retornar redirecionamento com parâmetros - sempre incluir blocked_until mesmo se 0
        return { 
          success: true, 
          redirect: `/login?reason=session_terminated&blocked_until=${timeRemaining}`
        };
      }
    } catch (error) {
      await conditionalDebugLog('ServerAction: Erro ao verificar bloqueio', { error });
      // Continuar com login se erro na verificação
    }

    // Buscar perfil e organização do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        role,
        organization_id,
        organizations (
          company_legal_name,
          company_trading_name
        )
      `)
      .eq('id', authData.user.id)
      .single();

    // Registrar log de auditoria
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(authData.user.id);
    await createAuditLog({
      actor_user_id: authData.user.id,
      action_type: AUDIT_ACTION_TYPES.USER_LOGGED_IN,
      resource_type: AUDIT_RESOURCE_TYPES.USER,
      resource_id: authData.user.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      organization_id: organizationId,
      details: {
        method: 'password'
      }
    });

    // Determinar redirecionamento
    let redirect = '/';
    
    if (profile?.role === 'master_admin') {
      redirect = '/admin';
    } else if (profile?.organizations) {
      const org = Array.isArray(profile.organizations) 
        ? profile.organizations[0] 
        : profile.organizations;
      
      const orgName = org.company_trading_name || org.company_legal_name;
      if (orgName) {
        const slug = orgName.toLowerCase().replace(/\s+/g, '-');
        redirect = `/${slug}`;
      }
    }

    revalidatePath('/');
    return { success: true, redirect };
  } catch (e: any) {
    safeLogger.error('Erro inesperado ao realizar login', {
      action: 'login_error'
    });
    return { success: false, error: 'Ocorreu um erro inesperado ao realizar login.' };
  }
} 