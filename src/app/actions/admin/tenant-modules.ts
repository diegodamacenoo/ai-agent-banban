'use server';

import { createSupabaseServerClient } from "@/core/supabase/server";
import { CoreModule } from "@/shared/types/module-catalog";
import { revalidatePath } from "next/cache";

interface TenantModule {
  organization_id: string;
  module_id: string;
  operational_status?: string;
  health_status?: string;
  core_modules: CoreModule | null;
}

// Tipo combinado para a UI
export type TenantModuleDetails = CoreModule & {
  organization_id: string;
  operational_status?: string; // status operacional do módulo
  health_status?: string;   // status de saúde do módulo
  is_visible?: boolean;     // calculado baseado no operational_status (para compatibilidade)
};

/**
 * Busca todos os módulos atribuídos a uma organização, juntando com os detalhes do catálogo.
 */
export async function getAssignedModulesForOrg(organizationId: string): Promise<{ success: boolean; data?: TenantModuleDetails[]; error?: string }> {
  if (!organizationId) return { success: false, error: 'Organization ID is required.' };

  const supabase = await createSupabaseServerClient();
  try {
    // CORREÇÃO: Usar tenant_module_assignments que está implementada e funcional
    // A tabela tenant_module_assignments/base_modules/module_implementations foi migrada e está operacional
    const { data: rawData, error } = await supabase
      .from('tenant_module_assignments')
      .select(`
        tenant_id, // organization_id agora é tenant_id
        base_module_id, // module_id agora é base_module_id
        is_active, // status agora é is_active
        custom_config, // configuration agora é custom_config
        assigned_at, // installed_at agora é assigned_at
        updated_at,
        base_modules ( // Adicionar join com base_modules
          id,
          slug,
          name,
          description,
          category
        ),
        module_implementations ( // Adicionar join com module_implementations
          id,
          implementation_key,
          name,
          component_path
        )
      `)
      .eq('tenant_id', organizationId);

    if (error) throw error;

    if (!rawData) return { success: true, data: [] };

    // Converter dados do tenant_module_assignments para o formato esperado
    const modules: TenantModuleDetails[] = rawData.map(item => {
      // Calcular is_visible baseado no status
      const isVisible = item.status === 'active' || 
                        item.status === 'implemented' ||
                        item.status === 'discovered';

             const moduleDetails: TenantModuleDetails = {
         // Simular campos do CoreModule baseado nos dados disponíveis
         id: item.module_id,
         slug: item.module_id,
         name: item.base_modules?.name || item.module_id,
         description: `Módulo ${item.module_name || item.module_id}`,
         pricing_tier: 'free',
         maturity_status: 'GA',
         status: 'ACTIVE',
         archived_at: undefined,
         created_at: item.installed_at || new Date().toISOString(),
         updated_at: item.updated_at || new Date().toISOString(),
         dependencies: undefined,
         category: 'custom',
         author: undefined,
         vendor: undefined,
         repository_url: undefined,
         documentation_url: undefined,
         is_available: true,
         requires_approval: false,
         base_price_monthly: undefined,
         usage_based_pricing: undefined,
         deprecated_at: undefined,
         
         // Campos específicos do tenant
         organization_id: item.organization_id,
         is_visible: isVisible,
         operational_status: item.status,
         health_status: 'healthy' // Valor padrão já que a coluna não existe
       };

      return moduleDetails;
    });

    return { success: true, data: modules };
  } catch (error) {
    console.error('Error fetching tenant modules:', error);
    return { 
      success: false, 
      error: 'Falha ao buscar módulos do tenant. Por favor, tente novamente.' 
    };
  }
}

/**
 * Busca módulos do catálogo que ainda não foram atribuídos a uma organização.
 */
export async function getAvailableModulesForOrg(organizationId: string): Promise<{ success: boolean; data?: CoreModule[]; error?: string }> {
  if (!organizationId) return { success: false, error: 'Organization ID is required.' };
  
  const supabase = await createSupabaseServerClient();
  try {
    // 1. Pega os IDs dos módulos já atribuídos
    const { data: assignedIdsData, error: assignedIdsError } = await supabase
      .from('tenant_module_assignments')
      .select('base_module_id') // module_id agora é base_module_id
      .eq('tenant_id', organizationId);

    if (assignedIdsError) throw assignedIdsError;
    const assignedIds = assignedIdsData.map(item => item.module_id);

    // 2. Busca todos os módulos do catálogo que não estão na lista de atribuídos
    const query = supabase
      .from('core_modules')
      .select('*');

    if (assignedIds.length > 0) {
      query.not('id', 'in', `(${assignedIds.join(',')})`);
    }

    const { data: availableModules, error: availableModulesError } = await query;

    if (availableModulesError) throw availableModulesError;

    return { success: true, data: availableModules as CoreModule[] };
  } catch (e: any) {
    console.error('Unexpected error in getAvailableModulesForOrg:', e);
    return { success: false, error: e.message || 'An unexpected error occurred' };
  }
}

/**
 * Atribui um novo módulo a uma organização.
 * IMPORTANTE: Esta função sincroniza tanto tenant_module_assignments quanto organizations.implementation_config
 */
export async function assignModuleToOrg(organizationId: string, moduleId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  try {
    // 1. Inserir na tabela tenant_module_assignments
    const { error } = await supabase
      .from('tenant_module_assignments')
      .insert({
        tenant_id: organizationId, // organization_id agora é tenant_id
        base_module_id: moduleId, // module_id agora é base_module_id
        is_active: true, // operational_status agora é is_active
        assigned_at: new Date().toISOString(), // last_status_change agora é assigned_at
        // status_change_reason não existe diretamente em tenant_module_assignments
      });

    if (error) throw error;
    
    // 2. Sincronizar com organizations.implementation_config.subscribed_modules
    const { data: organization, error: orgFetchError } = await supabase
      .from('organizations')
      .select('implementation_config')
      .eq('id', organizationId)
      .single();

    if (!orgFetchError && organization) {
      const currentConfig = organization.implementation_config || {};
      const currentSubscribedModules = currentConfig.subscribed_modules || [];

      if (!currentSubscribedModules.includes(moduleId)) {
        const updatedConfig = {
          ...currentConfig,
          subscribed_modules: [...currentSubscribedModules, moduleId]
        };

        await supabase
          .from('organizations')
          .update({ 
            implementation_config: updatedConfig,
            updated_at: new Date().toISOString()
          })
          .eq('id', organizationId);

        console.debug(`✅ Módulo ${moduleId} adicionado a subscribed_modules`);
      }
    }
    
    revalidatePath(`/admin/organizations/${organizationId}`);
    return { success: true };
  } catch (e: any) {
    console.error('Unexpected error in assignModuleToOrg:', e);
    return { success: false, error: e.message || 'An unexpected error occurred' };
  }
}

/**
 * Remove a atribuição de um módulo de uma organização.
 * IMPORTANTE: Esta função sincroniza tanto tenant_module_assignments quanto organizations.implementation_config
 */
export async function unassignModuleFromOrg(organizationId: string, moduleId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  try {
    // 1. Remover da tabela tenant_module_assignments
    const { error } = await supabase
      .from('tenant_module_assignments')
      .delete()
      .eq('tenant_id', organizationId)
      .eq('base_module_id', moduleId);

    if (error) throw error;

    // 2. Sincronizar com organizations.implementation_config.subscribed_modules
    const { data: organization, error: orgFetchError } = await supabase
      .from('organizations')
      .select('implementation_config')
      .eq('id', organizationId)
      .single();

    if (!orgFetchError && organization) {
      const currentConfig = organization.implementation_config || {};
      const currentSubscribedModules = currentConfig.subscribed_modules || [];

      if (currentSubscribedModules.includes(moduleId)) {
        const updatedConfig = {
          ...currentConfig,
          subscribed_modules: currentSubscribedModules.filter((id: string) => id !== moduleId)
        };

        await supabase
          .from('organizations')
          .update({ 
            implementation_config: updatedConfig,
            updated_at: new Date().toISOString()
          })
          .eq('id', organizationId);

        console.debug(`✅ Módulo ${moduleId} removido de subscribed_modules`);
      }
    }

    revalidatePath(`/admin/organizations/${organizationId}`);
    return { success: true };
  } catch (e: any) {
    console.error('Unexpected error in unassignModuleFromOrg:', e);
    return { success: false, error: e.message || 'An unexpected error occurred' };
  }
}

/**
 * Atualiza o status (habilitado/desabilitado) de um módulo para uma organização.
 * IMPORTANTE: Esta função sincroniza tanto tenant_module_assignments quanto organizations.implementation_config
 */
export async function updateTenantModuleStatus(organizationId: string, moduleId: string, isEnabled: boolean): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  try {
    // 1. Atualizar tabela tenant_module_assignments
    const newOperationalStatus = isEnabled ? 'ENABLED' : 'DISABLED';
    const { error: tenantModuleError } = await supabase
      .from('tenant_module_assignments')
      .update({ 
        is_active: newOperationalStatus === 'ENABLED', // Mapear operational_status para is_active
        updated_at: new Date().toISOString()
        // last_status_change e status_change_reason não existem diretamente em tenant_module_assignments
      })
      .eq('tenant_id', organizationId) // organization_id agora é tenant_id
      .eq('base_module_id', moduleId); // module_id agora é base_module_id

    if (tenantModuleError) throw tenantModuleError;

    // 2. Sincronizar com organizations.implementation_config.subscribed_modules
    // Primeiro buscar a organização atual
    const { data: organization, error: orgFetchError } = await supabase
      .from('organizations')
      .select('implementation_config')
      .eq('id', organizationId)
      .single();

    if (orgFetchError) {
      console.warn('Erro ao buscar organização para sincronização:', orgFetchError);
      // Não falhar a operação principal, apenas logar o aviso
    } else if (organization) {
      const currentConfig = organization.implementation_config || {};
      const currentSubscribedModules = currentConfig.subscribed_modules || [];

      let updatedSubscribedModules;
      
      if (isEnabled) {
        // Adicionar módulo se não estiver na lista
        if (!currentSubscribedModules.includes(moduleId)) {
          updatedSubscribedModules = [...currentSubscribedModules, moduleId];
        } else {
          updatedSubscribedModules = currentSubscribedModules;
        }
      } else {
        // Remover módulo da lista
        updatedSubscribedModules = currentSubscribedModules.filter((id: string) => id !== moduleId);
      }

      // Atualizar apenas se houve mudança
      if (JSON.stringify(updatedSubscribedModules) !== JSON.stringify(currentSubscribedModules)) {
        const updatedConfig = {
          ...currentConfig,
          subscribed_modules: updatedSubscribedModules
        };

        const { error: orgUpdateError } = await supabase
          .from('organizations')
          .update({ 
            implementation_config: updatedConfig,
            updated_at: new Date().toISOString()
          })
          .eq('id', organizationId);

        if (orgUpdateError) {
          console.error('Erro ao sincronizar implementation_config:', orgUpdateError);
          // Não falhar a operação principal, mas logar o erro
        } else {
          console.debug(`✅ Sincronização concluída: Módulo ${moduleId} ${isEnabled ? 'adicionado a' : 'removido de'} subscribed_modules`);
        }
      }
    }

    // 3. Revalidar caches para forçar atualização da interface
    revalidatePath(`/admin/organizations/${organizationId}`);
    
    // Importante: Revalidar também as rotas do tenant para forçar reload da sidebar
    const { data: orgData } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', organizationId)
      .single();
    
    if (orgData?.slug) {
      revalidatePath(`/${orgData.slug}`);
      revalidatePath(`/${orgData.slug}/dashboard`);
             // Revalidar várias rotas do tenant para garantir que a sidebar seja atualizada
       const commonRoutes = ['', '/insights', '/performance', '/alerts', '/inventory', '/analytics', '/data-processing'];
       commonRoutes.forEach((route: string) => {
         revalidatePath(`/${orgData.slug}${route}`);
       });
    }

    return { success: true };
  } catch (e: any) {
    console.error('Unexpected error in updateTenantModuleStatus:', e);
    return { success: false, error: e.message || 'An unexpected error occurred' };
  }
}

/**
 * Atualiza a visibilidade de um módulo para um tenant.
 * Isso controla se o módulo aparece ou não na interface do cliente através do operational_status.
 */
export async function updateTenantModuleVisibility(
    organizationId: string,
    moduleId: string,
    isVisible: boolean
): Promise<{ success: boolean; error?: string }> {
    if (!organizationId) return { success: false, error: 'Organization ID is required.' };
    if (!moduleId) return { success: false, error: 'Module ID is required.' };

    const supabase = await createSupabaseServerClient();
    
    try {
        // Atualizar o operational_status baseado na visibilidade desejada
        const newOperationalStatus = isVisible ? 'ENABLED' : 'DISABLED';
        const { error } = await supabase
            .from('tenant_module_assignments')
            .update({ 
                is_active: isVisible, // Mapear visibilidade para is_active
                updated_at: new Date().toISOString()
                // operational_status, last_status_change, status_change_reason não existem diretamente em tenant_module_assignments
            })
            .eq('tenant_id', organizationId) // organization_id agora é tenant_id
            .eq('base_module_id', moduleId); // module_id agora é base_module_id

        if (error) throw error;
        
        // Revalidar as rotas do tenant para forçar reload da sidebar
        const { data: orgData } = await supabase
            .from('organizations')
            .select('slug')
            .eq('id', organizationId)
            .single();

        if (orgData?.slug) {
            // Revalidar várias rotas do tenant para garantir que a sidebar seja atualizada
            const commonRoutes = ['', '/insights', '/performance', '/alerts', '/inventory', '/analytics', '/data-processing'];
            commonRoutes.forEach((route: string) => {
                revalidatePath(`/${orgData.slug}${route}`);
            });
            console.debug(`✅ Rotas do tenant revalidadas para organização ${orgData.slug}`);
        }

        // Também revalidar a página admin
        revalidatePath(`/admin/organizations/${organizationId}`);
        
        return { success: true };
    } catch (error) {
        console.error('Error updating module visibility:', error);
        return { 
            success: false, 
            error: 'Falha ao atualizar a visibilidade do módulo. Por favor, tente novamente.'
        };
    }
}

/**
 * Busca apenas os módulos visíveis para uma organização (para uso na sidebar do tenant).
 * Esta função considera o operational_status para determinar visibilidade.
 */
export async function getVisibleModulesForTenant(organizationId: string): Promise<{ success: boolean; data?: string[]; error?: string }> {
  if (!organizationId) return { success: false, error: 'Organization ID is required.' };

  const supabase = await createSupabaseServerClient();
  try {
    const { data: rawData, error } = await supabase
      .from('tenant_module_assignments')
      .select(`
        base_module_id, // module_id agora é base_module_id
        is_active, // operational_status agora é is_active
        base_modules ( // core_modules agora é base_modules
          slug
        )
      `)
      .eq('tenant_id', organizationId) // organization_id agora é tenant_id
      .eq('is_active', true); // Apenas módulos ativos

    if (error) throw error;

    if (!rawData) return { success: true, data: [] };

    // Extrair os slugs dos módulos visíveis
    const visibleModuleSlugs = rawData
      .filter(item => item.core_modules && !Array.isArray(item.core_modules))
      .map(item => (item.core_modules as any).slug)
      .filter(slug => slug); // Remove valores null/undefined

    console.debug('🔍 getVisibleModulesForTenant: Módulos visíveis encontrados:', visibleModuleSlugs);

    return { success: true, data: visibleModuleSlugs };
  } catch (error) {
    console.error('Error fetching visible modules for tenant:', error);
    return { 
      success: false, 
      error: 'Falha ao buscar módulos visíveis do tenant. Por favor, tente novamente.' 
    };
  }
} 