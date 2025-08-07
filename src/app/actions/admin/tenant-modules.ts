'use server';

import { createSupabaseServerClient, createSupabaseAdminClient } from "@/core/supabase/server";
import { revalidatePath } from "next/cache";
import { conditionalAuditLog, checkMaintenanceMode } from './modules/system-config-utils';
import { verifyAdminAccess } from './modules/utils';

// Interface baseada na nova arquitetura de módulos
interface TenantModuleAssignment {
  tenant_id: string;
  base_module_id: string;
  implementation_id?: string;
  is_active: boolean;
  custom_config?: Record<string, any>;
  assigned_at: string;
  updated_at?: string;
  base_modules?: {
    id: string;
    slug: string;
    name: string;
    description: string;
    category: string;
    status: string;
    version?: string;
  };
  module_implementations?: {
    id: string;
    implementation_key: string;
    name: string;
    component_path: string;
    component_type: string;
  };
}

// Tipo para compatibilidade com interface existente
export interface TenantModuleDetails {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  organization_id: string;
  is_active: boolean;
  is_visible: boolean;
  operational_status: string;
  health_status: string;
  custom_config?: Record<string, any>;
  implementation_key?: string;
  component_path?: string;
  assigned_at: string;
  updated_at?: string;
}

/**
 * Busca todos os módulos atribuídos a uma organização
 * Usa a nova arquitetura: base_modules + module_implementations + tenant_module_assignments
 */
export async function getAssignedModulesForOrg(organizationId: string): Promise<{ success: boolean; data?: TenantModuleDetails[]; error?: string }> {
  if (!organizationId) {
    return { success: false, error: 'Organization ID is required.' };
  }

  try {
    const supabase = await createSupabaseServerClient();
    
    // Usar nova estrutura de tabelas
    const { data: assignments, error } = await supabase
      .from('tenant_module_assignments')
      .select(`
        tenant_id,
        base_module_id,
        implementation_id,
        is_active,
        custom_config,
        assigned_at,
        updated_at,
        base_modules (
          id,
          slug,
          name,
          description,
          category,
          status,
          version
        ),
        module_implementations (
          id,
          implementation_key,
          name,
          component_path,
          component_type
        )
      `)
      .eq('tenant_id', organizationId);

    if (error) {
      console.error('[ Server ] Error fetching tenant modules:', error);
      throw error;
    }

    if (!assignments || assignments.length === 0) {
      return { success: true, data: [] };
    }

    // Converter para formato esperado pela interface
    const modules: TenantModuleDetails[] = assignments.map((assignment: any) => {
      const baseModule = assignment.base_modules;
      const implementation = assignment.module_implementations;
      
      if (!baseModule) {
        console.warn(`Base module não encontrado para assignment: ${assignment.base_module_id}`);
        return null;
      }

      return {
        id: baseModule.id,
        slug: baseModule.slug,
        name: baseModule.name,
        description: baseModule.description,
        category: baseModule.category,
        organization_id: assignment.tenant_id,
        is_active: assignment.is_active,
        is_visible: assignment.is_active, // Para compatibilidade
        operational_status: assignment.is_active ? 'ENABLED' : 'DISABLED',
        health_status: 'healthy', // Valor padrão
        custom_config: assignment.custom_config,
        implementation_key: implementation?.implementation_key,
        component_path: implementation?.component_path,
        assigned_at: assignment.assigned_at,
        updated_at: assignment.updated_at,
      };
    }).filter(Boolean) as TenantModuleDetails[];

    return { success: true, data: modules };

  } catch (error: any) {
    console.error('[ Server ] Error fetching tenant modules:', error);
    return { 
      success: false, 
      error: 'Falha ao buscar módulos do tenant. Por favor, tente novamente.' 
    };
  }
}

/**
 * Busca módulos base disponíveis para atribuição
 */
export async function getAvailableModulesForOrg(organizationId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
  if (!organizationId) {
    return { success: false, error: 'Organization ID is required.' };
  }
  
  try {
    const supabase = await createSupabaseServerClient();
    
    // 1. Buscar módulos já atribuídos
    const { data: assignedModules, error: assignedError } = await supabase
      .from('tenant_module_assignments')
      .select('base_module_id')
      .eq('tenant_id', organizationId);

    if (assignedError) throw assignedError;

    const assignedIds = assignedModules?.map(a => a.base_module_id) || [];

    // 2. Buscar módulos base disponíveis (não atribuídos)
    let query = supabase
      .from('base_modules')
      .select(`
        id,
        slug,
        name,
        description,
        category,
        status,
        is_active,
        supports_multi_tenant,
        version
      `)
      .eq('is_active', true)
      .neq('status', 'archived');

    if (assignedIds.length > 0) {
      query = query.not('id', 'in', `(${assignedIds.map(id => `"${id}"`).join(',')})`);
    }

    const { data: availableModules, error: availableError } = await query;

    if (availableError) throw availableError;

    return { success: true, data: availableModules || [] };
    
  } catch (error: any) {
    console.error('Error fetching available modules:', error);
    return { 
      success: false, 
      error: 'Falha ao buscar módulos disponíveis. Tente novamente.' 
    };
  }
}

/**
 * Atribui um módulo base a uma organização
 */
export async function assignModuleToOrg(organizationId: string, baseModuleId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar modo de manutenção
    const { inMaintenance, message } = await checkMaintenanceMode();
    if (inMaintenance) {
      return { success: false, error: message || 'Sistema em manutenção' };
    }

    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem atribuir módulos' };
    }

    const supabase = await createSupabaseServerClient();
    
    // Verificar se módulo base existe
    const { data: baseModule, error: moduleError } = await supabase
      .from('base_modules')
      .select('id, name, is_active')
      .eq('id', baseModuleId)
      .single();

    if (moduleError || !baseModule) {
      return { success: false, error: 'Módulo não encontrado' };
    }

    if (!baseModule.is_active) {
      return { success: false, error: 'Módulo não está ativo' };
    }

    // Verificar se já existe atribuição
    const { data: existing } = await supabase
      .from('tenant_module_assignments')
      .select('tenant_id')
      .eq('tenant_id', organizationId)
      .eq('base_module_id', baseModuleId)
      .single();

    if (existing) {
      return { success: false, error: 'Módulo já está atribuído a esta organização' };
    }

    // Buscar implementação padrão
    const { data: defaultImpl, error: implError } = await supabase
      .from('module_implementations')
      .select('id')
      .eq('base_module_id', baseModuleId)
      .eq('is_default', true)
      .single();

    // Criar atribuição
    const { error: assignError } = await supabase
      .from('tenant_module_assignments')
      .insert({
        tenant_id: organizationId,
        base_module_id: baseModuleId,
        implementation_id: defaultImpl?.id,
        is_active: true,
        assigned_at: new Date().toISOString(),
        custom_config: {}
      });

    if (assignError) {
      console.error('Error assigning module:', assignError);
      return { success: false, error: 'Erro ao atribuir módulo' };
    }

    // Log de auditoria
    await conditionalAuditLog({
      actor_user_id: user?.id || '',
      action_type: 'ASSIGN_MODULE_TO_TENANT',
      resource_type: 'tenant_module_assignment',
      details: {
        tenant_id: organizationId,
        base_module_id: baseModuleId,
        module_name: baseModule.name
      }
    });
    
    revalidatePath(`/admin/organizations/${organizationId}`);
    return { success: true };

  } catch (error: any) {
    console.error('Unexpected error in assignModuleToOrg:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Remove atribuição de um módulo de uma organização
 */
export async function unassignModuleFromOrg(organizationId: string, baseModuleId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar modo de manutenção
    const { inMaintenance, message } = await checkMaintenanceMode();
    if (inMaintenance) {
      return { success: false, error: message || 'Sistema em manutenção' };
    }

    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem remover módulos' };
    }

    const supabase = await createSupabaseServerClient();
    
    // Verificar se atribuição existe
    const { data: assignment } = await supabase
      .from('tenant_module_assignments')
      .select('tenant_id')
      .eq('tenant_id', organizationId)
      .eq('base_module_id', baseModuleId)
      .single();

    if (!assignment) {
      return { success: false, error: 'Atribuição não encontrada' };
    }

    // Remover atribuição
    const { error } = await supabase
      .from('tenant_module_assignments')
      .delete()
      .eq('tenant_id', organizationId)
      .eq('base_module_id', baseModuleId);

    if (error) {
      console.error('Error unassigning module:', error);
      return { success: false, error: 'Erro ao remover atribuição do módulo' };
    }

    // Log de auditoria
    await conditionalAuditLog({
      actor_user_id: user?.id || '',
      action_type: 'UNASSIGN_MODULE_FROM_TENANT',
      resource_type: 'tenant_module_assignment',
      details: {
        tenant_id: organizationId,
        base_module_id: baseModuleId
      }
    });

    revalidatePath(`/admin/organizations/${organizationId}`);
    return { success: true };

  } catch (error: any) {
    console.error('Unexpected error in unassignModuleFromOrg:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Atualiza status de um módulo atribuído
 */
export async function updateTenantModuleStatus(organizationId: string, baseModuleId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar modo de manutenção
    const { inMaintenance, message } = await checkMaintenanceMode();
    if (inMaintenance) {
      return { success: false, error: message || 'Sistema em manutenção' };
    }

    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem alterar status' };
    }

    const supabase = await createSupabaseServerClient();
    
    // Atualizar status
    const { error } = await supabase
      .from('tenant_module_assignments')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', organizationId)
      .eq('base_module_id', baseModuleId);

    if (error) {
      console.error('Error updating module status:', error);
      return { success: false, error: 'Erro ao atualizar status do módulo' };
    }

    // Log de auditoria
    await conditionalAuditLog({
      actor_user_id: user?.id || '',
      action_type: isActive ? 'ENABLE_TENANT_MODULE' : 'DISABLE_TENANT_MODULE',
      resource_type: 'tenant_module_assignment',
      details: {
        tenant_id: organizationId,
        base_module_id: baseModuleId,
        new_status: isActive
      }
    });

    // Revalidar caches
    revalidatePath(`/admin/organizations/${organizationId}`);
    
    // Revalidar rotas do tenant
    const { data: orgData } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', organizationId)
      .single();
    
    if (orgData?.slug) {
      revalidatePath(`/${orgData.slug}`);
    }

    return { success: true };

  } catch (error: any) {
    console.error('Unexpected error in updateTenantModuleStatus:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Busca módulos visíveis para o tenant (para sidebar)
 */
export async function getVisibleModulesForTenant(organizationId: string): Promise<{ success: boolean; data?: string[]; error?: string }> {
  if (!organizationId) {
    return { success: false, error: 'Organization ID is required.' };
  }

  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: assignments, error } = await supabase
      .from('tenant_module_assignments')
      .select(`
        base_module_id,
        is_active,
        base_modules (
          slug
        )
      `)
      .eq('tenant_id', organizationId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching visible modules:', error);
      throw error;
    }

    if (!assignments || assignments.length === 0) {
      return { success: true, data: [] };
    }

    // Invalidar cache da página para atualizar sidebar
    revalidatePath('/[slug]', 'page');
    
    // Extrair slugs dos módulos ativos
    const visibleSlugs = assignments
      .map((assignment: any) => assignment.base_modules?.slug)
      .filter(Boolean);

    return { success: true, data: visibleSlugs };

  } catch (error: any) {
    console.error('Error fetching visible modules for tenant:', error);
    return { 
      success: false, 
      error: 'Falha ao buscar módulos visíveis. Tente novamente.' 
    };
  }
}

/**
 * Atualiza visibilidade de módulo (alias para updateTenantModuleStatus)
 */
export async function updateTenantModuleVisibility(
  organizationId: string,
  moduleId: string,
  isVisible: boolean
): Promise<{ success: boolean; error?: string }> {
  return updateTenantModuleStatus(organizationId, moduleId, isVisible);
}