'use server';

import { createSupabaseServerClient, createSupabaseAdminClient } from '@/core/supabase/server';
import { createUnsafeSupabaseAdminClient } from '@/core/supabase/admin';
import { getUserProfile } from '@/shared/utils/supabase-helpers';
import { createAuditLog } from '@/features/security/audit-logger';
import { AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/core/schemas/audit';
import { captureRequestInfo } from '@/core/auth/request-info';
import { z } from 'zod';

/**
 * Verifica se o usuário atual tem permissões de master admin
 */
async function verifyMasterAdminAccess(): Promise<{ authorized: boolean; userId?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { authorized: false };
    }

    // Verificar role no JWT primeiro
    const roleFromJWT = user.app_metadata?.user_role;
    if (roleFromJWT === 'master_admin') {
      return { authorized: true, userId: user.id };
    }

    // Fallback: verificar role na tabela profiles
    let { data: profile, error: profileError } = await getUserProfile(supabase, user.id, 'role');

    if (profileError) {
      // Tentar com cliente admin se falhar
      const adminSupabase = createUnsafeSupabaseAdminClient();
      const adminResult = await getUserProfile(adminSupabase, user.id, 'role');
      
      profile = adminResult.data;
      profileError = adminResult.error;
    }

    if (profileError || !profile) {
      console.warn('Não foi possível determinar a role do usuário via tabela profiles:', profileError?.message);
      return { authorized: false };
    }

    return { authorized: (profile as any).role === 'master_admin', userId: user.id };
  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
    return { authorized: false };
  }
}

/**
 * Busca todos os usuários de uma organização específica
 */
export async function getUsersByOrganization(organizationId: string): Promise<{ data?: any[]; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Verificar usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { error: 'Erro de autenticação.' };
    }

    // Verificar role do usuário
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return { error: 'Erro ao verificar permissões.' };
    }

    // Verificar se o usuário tem acesso à organização
    if (!userProfile || (userProfile.role !== 'master_admin' && userProfile.organization_id !== organizationId)) {
      return { error: 'Acesso negado.' };
    }

    // Buscar usuários da organização usando o cliente admin
    // INCLUIR usuários desativados (deleted_at não nulo) para permitir visualização e reativação
    const adminSupabase = createUnsafeSupabaseAdminClient();
    const { data: profiles, error: profilesError } = await adminSupabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        role,
        status,
        job_title,
        phone,
        avatar_url,
        created_at,
        updated_at,
        deleted_at
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('[getUsersByOrganization] Erro ao buscar usuários:', profilesError);
      return { error: 'Erro ao carregar usuários da organização.' };
    }

    if (!profiles || profiles.length === 0) {
      return { data: [] };
    }

    // Buscar emails dos usuários usando admin client
    const { data: authUsers, error: authError2 } = await adminSupabase.auth.admin.listUsers();
    
    if (authError2) {
      console.warn('[getUsersByOrganization] Erro ao buscar dados de auth:', authError2);
      // Retornar sem emails se falhar
      return { 
        data: profiles.map(profile => ({
          ...profile,
          email: null,
          last_sign_in_at: null
        }))
      };
    }

    // Combinar dados de profiles com emails e ajustar status baseado em deleted_at
    const usersWithEmails = profiles.map(profile => {
      const authUser = authUsers.users?.find(au => au.id === profile.id);
      
      // Se deleted_at não é null, o usuário está desativado
      const actualStatus = profile.deleted_at ? 'INACTIVE' : profile.status;
      
      return {
        ...profile,
        status: actualStatus, // Sobrescrever status baseado em deleted_at
        email: authUser?.email || null,
        last_sign_in_at: authUser?.last_sign_in_at || null
      };
    });

    return { data: usersWithEmails };
  } catch (e: any) {
    console.error('[getUsersByOrganization] Erro inesperado:', e);
    return { error: 'Um erro inesperado ocorreu.' };
  }
}

/**
 * Busca estatísticas de usuários de uma organização específica
 */
export async function getOrganizationUserStats(organizationId: string): Promise<{ data?: any; error?: string }> {
  try {
    const { authorized } = await verifyMasterAdminAccess();
    if (!authorized) {
      return { error: 'Acesso negado.' };
    }

    if (!organizationId) {
      return { error: 'ID da organização é obrigatório.' };
    }

    const supabase = await createSupabaseServerClient();
    
    // Buscar estatísticas básicas (incluindo usuários desativados)
    let { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, status, created_at, deleted_at')
      .eq('organization_id', organizationId);

    // Se falhar com cliente normal, tentar com admin
    if (profilesError) {
      const adminSupabase = createUnsafeSupabaseAdminClient();
      const adminResult = await adminSupabase
        .from('profiles')
        .select('id, status, created_at, deleted_at')
        .eq('organization_id', organizationId);
      
      profiles = adminResult.data;
      profilesError = adminResult.error;
    }

    if (profilesError) {
      console.error('Erro ao buscar estatísticas de usuários:', profilesError);
      return { error: 'Erro ao carregar estatísticas.' };
    }

    if (!profiles) {
      profiles = [];
    }

    // Calcular estatísticas (considerar deleted_at para determinar status real)
    const totalUsers = profiles.length;
    const activeUsers = profiles.filter(p => !p.deleted_at && p.status === 'ACTIVE').length;
    const inactiveUsers = profiles.filter(p => p.deleted_at || p.status === 'INACTIVE').length;
    const pendingUsers = profiles.filter(p => !p.deleted_at && p.status === 'PENDING').length;

    // Calcular atividade recente (últimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentUsers = profiles.filter(p => 
      new Date(p.created_at) >= sevenDaysAgo
    ).length;

    // Buscar atividade recente de audit logs
    let recentActivity = 0;
    try {
      let { data: auditLogs, error: auditError } = await supabase
        .from('audit_logs')
        .select('id')
        .eq('organization_id', organizationId)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (auditError) {
        // Tentar com admin se falhar
        const adminSupabase = createUnsafeSupabaseAdminClient();
        const adminAuditResult = await adminSupabase
          .from('audit_logs')
          .select('id')
          .eq('organization_id', organizationId)
          .gte('created_at', sevenDaysAgo.toISOString());
        
        auditLogs = adminAuditResult.data;
        auditError = adminAuditResult.error;
      }

      recentActivity = auditLogs?.length || 0;
    } catch (error) {
      console.warn('Erro ao buscar atividade recente:', error);
      recentActivity = 0;
    }

    const stats = {
      total_users: totalUsers,
      active_users: activeUsers,
      inactive_users: inactiveUsers,
      pending_users: pendingUsers,
      recent_activity_count: recentActivity,
      new_users_last_week: recentUsers,
      days_since_creation: 0 // Será calculado no frontend se necessário
    };

    return { data: stats };
  } catch (e: any) {
    console.error('Erro inesperado em getOrganizationUserStats:', e);
    return { error: 'Um erro inesperado ocorreu.' };
  }
}

/**
 * Busca convites pendentes de uma organização específica
 */
export async function getOrganizationInvites(organizationId: string): Promise<{ data?: any[]; error?: string }> {
  try {
    const { authorized } = await verifyMasterAdminAccess();
    if (!authorized) {
      return { error: 'Acesso negado.' };
    }

    if (!organizationId) {
      return { error: 'ID da organização é obrigatório.' };
    }

    const supabase = await createSupabaseServerClient();
    
    // Buscar convites pendentes
    let { data: invites, error: invitesError } = await supabase
      .from('user_invites')
      .select(`
        id,
        email,
        role,
        status,
        created_at,
        expires_at,
        updated_at
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    // Se falhar com cliente normal, tentar com admin
    if (invitesError) {
      const adminSupabase = createUnsafeSupabaseAdminClient();
      const adminResult = await adminSupabase
        .from('user_invites')
        .select(`
          id,
          email,
          role,
          status,
          created_at,
          expires_at,
          updated_at
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });
      
      invites = adminResult.data;
      invitesError = adminResult.error;
    }

    if (invitesError) {
      console.error('Erro ao buscar convites da organização:', invitesError);
      return { error: 'Erro ao carregar convites da organização.' };
    }

    return { data: invites || [] };
  } catch (e: any) {
    console.error('Erro inesperado em getOrganizationInvites:', e);
    return { error: 'Um erro inesperado ocorreu.' };
  }
}

/**
 * Desativa um usuário da organização (soft delete)
 * O usuário pode ser reativado posteriormente
 */
export async function deactivateUserFromOrganization(userId: string, organizationId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    console.debug('[removeUserFromOrganization] Iniciando remoção do usuário:', { userId, organizationId });
    
    const supabase = await createSupabaseServerClient();
    
    // Verificar usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[removeUserFromOrganization] Erro de autenticação:', authError);
      return { error: 'Erro de autenticação.' };
    }

    // Verificar role do usuário atual
    const { data: currentUserProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .is('deleted_at', null)
      .single();

    if (profileError) {
      console.error('[removeUserFromOrganization] Erro ao buscar perfil do usuário:', profileError);
      return { error: 'Erro ao verificar permissões.' };
    }

    console.debug('[removeUserFromOrganization] Perfil do usuário atual:', currentUserProfile);

    // Verificar se o usuário tem permissão para remover
    if (!currentUserProfile || (currentUserProfile.role !== 'master_admin' && currentUserProfile.organization_id !== organizationId)) {
      console.warn('[removeUserFromOrganization] Acesso negado - usuário não tem permissão');
      return { error: 'Acesso negado.' };
    }

    // Usar cliente admin para buscar o usuário a ser removido
    const adminSupabase = createUnsafeSupabaseAdminClient();
    
    // Primeiro, vamos verificar se o usuário existe sem filtros
    const { data: allUserData, error: allUserError } = await adminSupabase
      .from('profiles')
      .select('id, role, organization_id, deleted_at')
      .eq('id', userId);

    console.debug('[removeUserFromOrganization] Dados do usuário (sem filtros):', { allUserData, allUserError });

    // Agora buscar com os filtros corretos
    const { data: userToRemove, error: userError } = await adminSupabase
      .from('profiles')
      .select('role, organization_id, deleted_at')
      .eq('id', userId)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .single();

    console.debug('[removeUserFromOrganization] Resultado da busca do usuário:', { userToRemove, userError });

    if (userError || !userToRemove) {
      console.error('[removeUserFromOrganization] Erro ao buscar usuário a ser removido:', userError);
      return { error: 'Usuário não encontrado ou já foi removido.' };
    }

    // Não permitir remover master_admin
    if (userToRemove.role === 'master_admin') {
      console.warn('[removeUserFromOrganization] Tentativa de remover master_admin');
      return { error: 'Não é possível remover um Master Admin.' };
    }

    // SOFT DELETE: Desativar usuário da organização (mantém no auth para possível reativação)
    console.debug('[deactivateUserFromOrganization] Iniciando desativação do usuário...');
    
    try {
      // 1. Fazer soft delete na tabela profiles
      const { error: profileUpdateError } = await adminSupabase
        .from('profiles')
        .update({
          deleted_at: new Date().toISOString(),
          status: 'INACTIVE'
        })
        .eq('id', userId)
        .eq('organization_id', organizationId)
        .is('deleted_at', null);

      if (profileUpdateError) {
        console.error('[deactivateUserFromOrganization] Erro ao desativar profile:', profileUpdateError);
        return { error: 'Erro ao desativar usuário da organização.' };
      }

      console.debug('[deactivateUserFromOrganization] Usuário desativado com sucesso');

      // 2. Registrar no log de auditoria
      const { ipAddress, userAgent } = await captureRequestInfo(user.id);
      await createAuditLog({
        actor_user_id: user.id,
        action_type: AUDIT_ACTION_TYPES.USER_DEACTIVATED,
        resource_type: AUDIT_RESOURCE_TYPES.USER,
        resource_id: userId,
        organization_id: organizationId,
        details: {
          deactivated_user_id: userId,
          deactivated_from_organization: organizationId,
          deactivated_by_admin: currentUserProfile.role,
          deletion_type: 'soft_delete', // usuário pode ser reativado
          can_be_reactivated: true
        },
        ip_address: ipAddress,
        user_agent: userAgent
      });

      console.debug('[deactivateUserFromOrganization] Desativação realizada com sucesso');
      return { success: true };
      
    } catch (deactivateError) {
      console.error('[deactivateUserFromOrganization] Erro durante desativação:', deactivateError);
      return { error: 'Erro durante o processo de desativação.' };
    }
      } catch (e: any) {
      console.error('[deactivateUserFromOrganization] Erro inesperado:', e);
      return { error: 'Um erro inesperado ocorreu.' };
    }
  }

/**
 * Reativa um usuário previamente desativado
 */
export async function reactivateUser(userId: string, organizationId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    console.debug('[reactivateUser] Iniciando reativação do usuário:', { userId, organizationId });
    
    const supabase = await createSupabaseServerClient();
    
    // Verificar usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[reactivateUser] Erro de autenticação:', authError);
      return { error: 'Erro de autenticação.' };
    }

    // Verificar permissões
    const { data: currentUserProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .is('deleted_at', null)
      .single();

    if (profileError || !currentUserProfile || (currentUserProfile.role !== 'master_admin' && currentUserProfile.organization_id !== organizationId)) {
      return { error: 'Acesso negado.' };
    }

    // Usar cliente admin para reativar
    const adminSupabase = createUnsafeSupabaseAdminClient();
    
    // Verificar se o usuário existe e está desativado
    const { data: userToReactivate, error: userError } = await adminSupabase
      .from('profiles')
      .select('role, organization_id, deleted_at, status')
      .eq('id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (userError || !userToReactivate) {
      return { error: 'Usuário não encontrado.' };
    }

    if (!userToReactivate.deleted_at) {
      return { error: 'Usuário já está ativo.' };
    }

    // Reativar usuário
    const { error: reactivateError } = await adminSupabase
      .from('profiles')
      .update({
        deleted_at: null,
        status: 'ACTIVE'
      })
      .eq('id', userId)
      .eq('organization_id', organizationId);

    if (reactivateError) {
      console.error('[reactivateUser] Erro ao reativar usuário:', reactivateError);
      return { error: 'Erro ao reativar usuário.' };
    }

    // Registrar no log de auditoria
    const { ipAddress, userAgent } = await captureRequestInfo(user.id);
    await createAuditLog({
      actor_user_id: user.id,
      action_type: AUDIT_ACTION_TYPES.USER_RESTORED,
      resource_type: AUDIT_RESOURCE_TYPES.USER,
      resource_id: userId,
      organization_id: organizationId,
      details: {
        reactivated_user_id: userId,
        reactivated_in_organization: organizationId,
        reactivated_by_admin: currentUserProfile.role
      },
      ip_address: ipAddress,
      user_agent: userAgent
    });

    console.debug('[reactivateUser] Usuário reativado com sucesso');
    return { success: true };
    
  } catch (e: any) {
    console.error('[reactivateUser] Erro inesperado:', e);
    return { error: 'Um erro inesperado ocorreu.' };
  }
}

/**
 * Remove permanentemente um usuário do sistema (auth + profiles)
 * ATENÇÃO: Esta ação é irreversível!
 */
export async function permanentlyDeleteUser(userId: string, organizationId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    console.debug('[permanentlyDeleteUser] Iniciando exclusão permanente do usuário:', { userId, organizationId });
    
    const supabase = await createSupabaseServerClient();
    
    // Verificar usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[permanentlyDeleteUser] Erro de autenticação:', authError);
      return { error: 'Erro de autenticação.' };
    }

    // Verificar permissões (apenas master_admin pode fazer exclusão permanente)
    const { data: currentUserProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .is('deleted_at', null)
      .single();

    if (profileError || !currentUserProfile || currentUserProfile.role !== 'master_admin') {
      return { error: 'Acesso negado. Apenas Master Admins podem fazer exclusões permanentes.' };
    }

    // Usar cliente admin
    const adminSupabase = createUnsafeSupabaseAdminClient();
    
    // Verificar se o usuário existe
    const { data: userToDelete, error: userError } = await adminSupabase
      .from('profiles')
      .select('role, organization_id, deleted_at, first_name, last_name')
      .eq('id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (userError || !userToDelete) {
      return { error: 'Usuário não encontrado.' };
    }

    // Não permitir excluir master_admin
    if (userToDelete.role === 'master_admin') {
      return { error: 'Não é possível excluir permanentemente um Master Admin.' };
    }

    // EXCLUSÃO PERMANENTE: Remover do auth primeiro, depois do profiles
    console.debug('[permanentlyDeleteUser] Iniciando exclusão permanente...');
    
    try {
      // 1. Remover do sistema de autenticação
      const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(userId);

      if (authDeleteError) {
        console.error('[permanentlyDeleteUser] Erro ao remover do auth:', authDeleteError);
        return { error: 'Erro ao remover usuário do sistema de autenticação.' };
      }

      console.debug('[permanentlyDeleteUser] Usuário removido do auth com sucesso');

      // 2. Remover completamente da tabela profiles (hard delete)
      const { error: profileDeleteError } = await adminSupabase
        .from('profiles')
        .delete()
        .eq('id', userId)
        .eq('organization_id', organizationId);

      if (profileDeleteError) {
        console.error('[permanentlyDeleteUser] Erro ao remover profile:', profileDeleteError);
        // Não é possível reverter a exclusão do auth neste ponto
        return { error: 'Usuário removido do auth, mas erro ao remover profile.' };
      }

      console.debug('[permanentlyDeleteUser] Profile removido com sucesso');

      // 3. Registrar no log de auditoria
      const { ipAddress, userAgent } = await captureRequestInfo(user.id);
      await createAuditLog({
        actor_user_id: user.id,
        action_type: AUDIT_ACTION_TYPES.USER_DELETED,
        resource_type: AUDIT_RESOURCE_TYPES.USER,
        resource_id: userId,
        organization_id: organizationId,
        details: {
          permanently_deleted_user_id: userId,
          deleted_from_organization: organizationId,
          deleted_by_admin: currentUserProfile.role,
          deletion_type: 'permanent', // irreversível
          user_name: `${userToDelete.first_name} ${userToDelete.last_name}`,
          warning: 'EXCLUSÃO PERMANENTE - IRREVERSÍVEL'
        },
        ip_address: ipAddress,
        user_agent: userAgent
      });

      console.debug('[permanentlyDeleteUser] Exclusão permanente realizada com sucesso');
      return { success: true };
      
    } catch (deleteError) {
      console.error('[permanentlyDeleteUser] Erro durante exclusão permanente:', deleteError);
      return { error: 'Erro durante o processo de exclusão permanente.' };
    }
    
  } catch (e: any) {
    console.error('[permanentlyDeleteUser] Erro inesperado:', e);
    return { error: 'Um erro inesperado ocorreu.' };
  }
} 