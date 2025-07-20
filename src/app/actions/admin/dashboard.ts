'use server';

import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { createSupabaseAdminClient } from '@/core/supabase/admin';
import { createSupabaseBrowserClient } from '@/core/supabase/client';
import type { Profile } from '@/shared/types/supabase';
import type { Organization } from '@/core/contexts/OrganizationContext';

/**
 * Verifica se o usuário atual tem permissões de master admin
 */
async function verifyMasterAdminAccess(): Promise<{ authorized: boolean; userId?: string }> {
  try {
    console.debug('[AUTH] Iniciando verificação de permissões...');
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('[AUTH] Erro de autenticação:', authError);
      return { authorized: false };
    }
    
    if (!user) {
      console.debug('[AUTH] Usuário não encontrado');
      return { authorized: false };
    }

    console.debug('[AUTH] Usuário encontrado:', {
      id: user.id,
      email: user.email,
      app_metadata: user.app_metadata
    });

    // Primeiro, verificar role no JWT token (método preferido)
    const userRoleFromJWT = user.app_metadata?.user_role;
    console.debug('[AUTH] Role do JWT:', userRoleFromJWT);
    
    if (userRoleFromJWT === 'master_admin') {
      console.debug('[AUTH] Usuário autorizado via JWT como master_admin');
      return { authorized: true, userId: user.id };
    }

    // Fallback: verificar role na tabela profiles
    console.debug('[AUTH] JWT não tem master_admin, verificando tabela profiles...');
    
    // Tentar com cliente normal primeiro
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Se falhar com cliente normal, usar admin
    if (profileError) {
      console.debug('[AUTH] Erro com cliente normal, tentando com admin:', profileError.message);
      const adminSupabase = await createSupabaseAdminClient();
      
      const adminResult = await adminSupabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      profile = adminResult.data;
      profileError = adminResult.error;
    }

    if (profileError || !profile) {
      console.error('[AUTH] Erro ao buscar perfil do usuário:', profileError);
      return { authorized: false };
    }

    console.debug('[AUTH] Role da tabela profiles:', profile.role);
    
    if (profile.role !== 'master_admin') {
      console.warn(`[AUTH] Acesso negado para usuário ${user.id} com role: ${profile.role}`);
      return { authorized: false };
    }

    console.debug('[AUTH] Usuário autorizado via tabela profiles como master_admin');
    return { authorized: true, userId: user.id };
  } catch (error) {
    console.error('[AUTH] Erro ao verificar permissões:', error);
    return { authorized: false };
  }
}

interface DashboardStats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  activeUsers: number;
  recentActivity: any[];
}

/**
 * Carrega dados do dashboard admin
 */
export async function getDashboardStats(): Promise<{ data?: DashboardStats; error?: string }> {
  try {
    console.debug('[DASHBOARD] Iniciando carregamento de dados...');
    
    const { authorized } = await verifyMasterAdminAccess();
    if (!authorized) {
      console.debug('[DASHBOARD] Acesso negado - usuário não autorizado');
      return { error: 'Acesso negado: Apenas master admins podem acessar esta função.' };
    }

    console.debug('[DASHBOARD] Usuário autorizado, buscando dados...');
    const supabase = await createSupabaseServerClient();

    // Tentar com cliente normal primeiro
    console.debug('[DASHBOARD] Tentando com cliente normal...');
    let organizationsResult = await supabase
      .from('organizations')
      .select('id, client_type, is_implementation_complete', { count: 'exact' })
      .is('deleted_at', null);

    let usersResult = await supabase
      .from('profiles')
      .select('id, status, role', { count: 'exact' })
      .is('deleted_at', null);

    let activityResult = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    // Se alguma consulta falhar com cliente normal, usar admin
    if (organizationsResult.error || usersResult.error || activityResult.error) {
      console.debug('[DASHBOARD] Usando cliente admin devido a erros RLS:', {
        orgError: organizationsResult.error?.message,
        userError: usersResult.error?.message,
        activityError: activityResult.error?.message
      });
      
      const adminSupabase = await createSupabaseAdminClient();

      if (organizationsResult.error) {
        console.debug('[DASHBOARD] Buscando organizações com cliente admin...');
        organizationsResult = await adminSupabase
          .from('organizations')
          .select('id, client_type, is_implementation_complete', { count: 'exact' })
          .is('deleted_at', null);
      }

      if (usersResult.error) {
        console.debug('[DASHBOARD] Buscando usuários com cliente admin...');
        usersResult = await adminSupabase
          .from('profiles')
          .select('id, status, role', { count: 'exact' })
          .is('deleted_at', null);
      }

      if (activityResult.error) {
        console.debug('[DASHBOARD] Buscando atividades com cliente admin...');
        activityResult = await adminSupabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
      }
    }

    // Verificar se ainda há erros
    if (organizationsResult.error) {
      console.error('[DASHBOARD] Erro ao buscar organizações:', organizationsResult.error);
      return { error: 'Erro ao carregar dados das organizações.' };
    }

    if (usersResult.error) {
      console.error('[DASHBOARD] Erro ao buscar usuários:', usersResult.error);
      return { error: 'Erro ao carregar dados dos usuários.' };
    }

    if (activityResult.error) {
      console.error('[DASHBOARD] Erro ao buscar atividades:', activityResult.error);
      return { error: 'Erro ao carregar atividades recentes.' };
    }

    console.debug('[DASHBOARD] Dados carregados com sucesso:', {
      orgs: organizationsResult.count,
      users: usersResult.count,
      activities: activityResult.data?.length
    });

    // Processar dados das organizações
    const organizations = organizationsResult.data || [];
    const totalOrganizations = organizationsResult.count || 0;
    const activeOrganizations = organizations.filter(org => 
      org.is_implementation_complete === true
    ).length;

    // Processar dados dos usuários
    const users = usersResult.data || [];
    const totalUsers = usersResult.count || 0;
    const activeUsers = users.filter(user => user.status === 'ACTIVE').length;

    const stats: DashboardStats = {
      totalOrganizations,
      activeOrganizations,
      totalUsers,
      activeUsers,
      recentActivity: activityResult.data || []
    };

    console.debug('[DASHBOARD] Estatísticas processadas:', stats);
    return { data: stats };
  } catch (e: any) {
    console.error('[DASHBOARD] Erro inesperado em getDashboardStats:', e);
    return { error: e.message || 'Um erro inesperado ocorreu ao carregar o dashboard.' };
  }
}

/**
 * Obtém estatísticas rápidas para o dashboard
 */
export async function getQuickStats(): Promise<{ data?: any; error?: string }> {
  try {
    console.debug('[AUTH] Iniciando verificação de permissões...');
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) return { error: 'Erro de autenticação' };
    if (!user) return { error: 'Usuário não autenticado' };

    // Verificar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.debug('[AUTH] Erro com cliente normal, tentando com admin:', profileError.message);
      const adminSupabase = await createSupabaseAdminClient();
      
      const adminResult = await adminSupabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (adminResult.error) return { error: 'Erro ao buscar perfil do usuário' };
      if (!adminResult.data) return { error: 'Perfil não encontrado' };
      
      return { data: { user, profile: adminResult.data } };
    }

    return { data: { user, profile } };
  } catch (error: any) {
    console.error('[DASHBOARD] Erro ao buscar estatísticas:', error);
    return { error: error.message || 'Erro inesperado' };
  }
}

/**
 * Função de debug para verificar informações do usuário atual
 */
export async function debugUserInfo(): Promise<{ data?: any; error?: string }> {
  try {
    console.debug('[DEBUG] Verificando informações do usuário...');
    const supabase = await createSupabaseServerClient();
    
    // Verificar usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('[DEBUG] Erro de autenticação:', authError);
      return { error: 'Erro de autenticação' };
    }
    
    if (!user) {
      console.debug('[DEBUG] Usuário não autenticado');
      return { error: 'Usuário não autenticado' };
    }

    console.debug('[DEBUG] Dados do usuário Auth:', {
      id: user.id,
      email: user.email,
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata
    });

    // Verificar perfil no banco
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[DEBUG] Erro ao buscar perfil:', profileError);
      
      // Tentar com cliente admin
      const adminSupabase = await createSupabaseAdminClient();
      const { data: adminProfile, error: adminProfileError } = await adminSupabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (adminProfileError) {
        console.error('[DEBUG] Erro ao buscar perfil com admin:', adminProfileError);
        return { error: 'Erro ao buscar perfil do usuário' };
      }

      console.debug('[DEBUG] Perfil encontrado com cliente admin:', adminProfile);
      return {
        data: {
          auth_user: {
            id: user.id,
            email: user.email,
            app_metadata: user.app_metadata,
            user_metadata: user.user_metadata
          },
          profile: adminProfile,
          method: 'admin_client'
        }
      };
    }

    console.debug('[DEBUG] Perfil encontrado:', profile);
    return {
      data: {
        auth_user: {
          id: user.id,
          email: user.email,
          app_metadata: user.app_metadata,
          user_metadata: user.user_metadata
        },
        profile: profile,
        method: 'normal_client'
      }
    };
  } catch (e: any) {
    console.error('[DEBUG] Erro inesperado:', e);
    return { error: e.message || 'Erro inesperado' };
  }
} 
