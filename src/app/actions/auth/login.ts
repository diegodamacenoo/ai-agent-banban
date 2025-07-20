'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/features/security/audit-logger';
import { AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/core/schemas/audit';
import { captureRequestInfo } from '@/core/auth/request-info';
import { safeLogger } from '@/features/security/safe-logger';

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
    
    // Autenticar usuário
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