'use server';

import { createSupabaseServerClient } from '@/core/supabase/server';

/**
 * Verifica se o usuÃ¡rio atual tem role de master_admin
 */
export async function checkMasterAdminAuth(): Promise<{
  isAuthorized: boolean;
  user: any | null;
  error?: string;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Verificar autenticaÃ§Ã£o
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        isAuthorized: false,
        user: null,
        error: 'UsuÃ¡rio nÃ£o autenticado'
      };
    }

    // Buscar perfil do usuÃ¡rio
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role, status, organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return {
        isAuthorized: false,
        user: null,
        error: 'Perfil nÃ£o encontrado'
      };
    }

    // Verificar se Ã© master admin
    const isMasterAdmin = profile.role === 'master_admin';
    
    if (!isMasterAdmin) {
      return {
        isAuthorized: false,
        user: { ...user, profile },
        error: 'Acesso negado: apenas administradores master podem acessar esta Ã¡rea'
      };
    }

    // Verificar se o usuÃ¡rio estÃ¡ ativo
    if (profile.status !== 'ACTIVE') {
      return {
        isAuthorized: false,
        user: { ...user, profile },
        error: 'Conta inativa'
      };
    }

    return {
      isAuthorized: true,
      user: { ...user, profile }
    };

  } catch (error) {
    console.error('Erro ao verificar autenticaÃ§Ã£o master admin:', error);
    return {
      isAuthorized: false,
      user: null,
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Middleware helper para proteger rotas admin
 */
export async function requireMasterAdmin() {
  const authResult = await checkMasterAdminAuth();
  
  if (!authResult.isAuthorized) {
    throw new Error(authResult.error || 'Acesso nÃ£o autorizado');
  }
  
  return authResult.user;
}

/**
 * Verificar se o usuÃ¡rio pode acessar dados de uma organizaÃ§Ã£o especÃ­fica
 * Master admin pode acessar qualquer organizaÃ§Ã£o
 */
export async function canAccessOrganization(organizationId: string): Promise<boolean> {
  const authResult = await checkMasterAdminAuth();
  
  // Master admin pode acessar qualquer organizaÃ§Ã£o
  return authResult.isAuthorized;
}

/**
 * Verificar se o usuÃ¡rio pode gerenciar usuÃ¡rios globalmente
 */
export async function canManageGlobalUsers(): Promise<boolean> {
  const authResult = await checkMasterAdminAuth();
  return authResult.isAuthorized;
} 
