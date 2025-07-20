'use server';

import { createSupabaseAdminClient } from '@/core/supabase/admin';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/features/security/audit-logger';
import { AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/core/schemas/audit';
import { captureRequestInfo } from '@/core/auth/request-info';
import { z } from 'zod';
import { safeLogger } from '@/features/security/safe-logger';
import type { Organization } from '@/core/contexts/OrganizationContext';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getUserProfile } from '@/shared/utils/supabase-helpers';

// Schema para validação de dados de organização
const organizationSchema = z.object({
  company_legal_name: z.string().min(1, 'Razão social é obrigatória'),
  company_trading_name: z.string().min(1, 'Nome fantasia é obrigatório'),
  slug: z.string()
    .min(1, 'Slug é obrigatório')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens')
    .transform(val => val.toLowerCase()),
  client_type: z.enum(['standard', 'custom']).default('standard'),
  implementation_config: z.record(z.any()).optional().nullable(),
  is_implementation_complete: z.boolean().default(false)
});

const updateOrganizationSchema = organizationSchema.extend({
  id: z.string().uuid(),
}).partial().extend({
  id: z.string().uuid(),
});

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

    // 1) Verificar role no JWT primeiro
    const roleFromJWT = user.app_metadata?.user_role;
    if (roleFromJWT === 'master_admin') {
      return { authorized: true, userId: user.id };
    }

    // 2) Fallback: verificar role na tabela profiles (usando utilitário robusto)
    let { data: profile, error: profileError } = await getUserProfile(supabase, user.id, 'role');

    if (profileError) {
      // Tentar com cliente admin se falhar
      const adminSupabase = await createSupabaseAdminClient();
      const adminResult = await getUserProfile(adminSupabase, user.id, 'role');
      
      profile = adminResult.data;
      profileError = adminResult.error;
    }

    if (profileError) {
      console.warn('Não foi possível determinar a role do usuário via tabela profiles:', profileError?.message);
      return { authorized: false };
    }

    if (!profile) {
      console.warn('Nenhum perfil encontrado para o usuário:', user.id);
      return { authorized: false };
    }
    return { authorized: (profile as any).role === 'master_admin', userId: user.id };
  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
    return { authorized: false };
  }
}

/**
 * Lista todas as organizações (apenas para admin master)
 */
export async function getAllOrganizations() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        id,
        company_legal_name,
        company_trading_name,
        client_type,
        custom_backend_url,
        is_implementation_complete,
        implementation_date,
        implementation_config,
        created_at,
        updated_at
      `)
      .is('deleted_at', null)
      .order('company_trading_name');

    if (error) {
      safeLogger.error('Erro ao buscar organizações:', error);
      return { error: 'Erro ao carregar dados.' };
    }

    return { data };
  } catch (e: any) {
    safeLogger.error('Erro inesperado em getAllOrganizations:', e);
    return { error: e.message || 'Um erro inesperado ocorreu.' };
  }
}

/**
 * Busca uma organização específica por ID
 */
export async function getOrganizationById(id: string): Promise<{ data?: any; error?: string }> {
  try {
    const { authorized } = await verifyMasterAdminAccess();
    if (!authorized) {
      return { error: 'Acesso negado.' };
    }

    const supabase = await createSupabaseServerClient();

    // Tentar com cliente normal primeiro
    let { data, error } = await supabase
      .from('organizations')
      .select(`
        id,
        company_legal_name,
        company_trading_name,
        client_type,
        custom_backend_url,
        is_implementation_complete,
        implementation_date,
        implementation_config,
        created_at,
        updated_at,
        slug
      `)
      .eq('id', id)
      .single();

    // Se falhar com cliente normal, usar admin
    if (error) {
      const adminSupabase = await createSupabaseAdminClient();
      const adminResult = await adminSupabase
        .from('organizations')
        .select(`
          id,
          company_legal_name,
          company_trading_name,
          client_type,
          custom_backend_url,
          is_implementation_complete,
          implementation_date,
          implementation_config,
          created_at,
          updated_at,
          slug
        `)
        .eq('id', id)
        .single();
      
      data = adminResult.data;
      error = adminResult.error;
    }

    if (error) {
      console.error('Erro ao buscar organização:', error);
      return { error: 'Organização não encontrada.' };
    }

    return { data };
  } catch (e: any) {
    console.error('Erro inesperado em getOrganizationById:', e);
    return { error: 'Um erro inesperado ocorreu.' };
  }
}

/**
 * Cria uma nova organização
 */
export async function createOrganization(formData: z.infer<typeof organizationSchema>): Promise<{ success: boolean; data?: any; error?: string }> {
  const validation = organizationSchema.safeParse(formData);
  
  if (!validation.success) {
    return { 
      success: false,
      error: validation.error.errors.map(e => e.message).join(', ') 
    };
  }

  try {
    const { authorized, userId: adminUserId } = await verifyMasterAdminAccess();
    if (!authorized) {
      return { success: false, error: 'Acesso negado.' };
    }

    // Usar cliente admin para inserção (garantir que funcione)
    const adminSupabase = await createSupabaseAdminClient();
    
    const { data: newOrganization, error } = await adminSupabase
      .from('organizations')
      .insert(validation.data)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar organização:', error);
      return { 
        success: false,
        error: 'Não foi possível criar a organização.' 
      };
    }

    // Registrar no log de auditoria
    if (adminUserId) {
      const { ipAddress, userAgent } = await captureRequestInfo(adminUserId);
      await createAuditLog({
        actor_user_id: adminUserId,
        action_type: AUDIT_ACTION_TYPES.ORGANIZATION_CREATED,
        resource_type: AUDIT_RESOURCE_TYPES.ORGANIZATION,
        resource_id: newOrganization.id,
        organization_id: newOrganization.id,
        details: {
          company_legal_name: validation.data.company_legal_name,
          company_trading_name: validation.data.company_trading_name,
          client_type: validation.data.client_type,
          created_by_admin: true,
        },
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    }

    revalidatePath('/admin');
    revalidatePath('/admin/organizations');

    return { 
      success: true, 
      data: newOrganization 
    };
  } catch (e: any) {
    console.error('Erro inesperado em createOrganization:', e);
    return { 
      success: false,
      error: e.message || 'Um erro inesperado ocorreu.' 
    };
  }
}

/**
 * Atualiza uma organização existente
 */
export async function updateOrganization(formData: z.infer<typeof updateOrganizationSchema>): Promise<{ success: boolean; data?: any; error?: string }> {
  const validation = updateOrganizationSchema.safeParse(formData);
  
  if (!validation.success) {
    return { 
      success: false,
      error: validation.error.errors.map(e => e.message).join(', ') 
    };
  }

  try {
    const { authorized, userId: adminUserId } = await verifyMasterAdminAccess();
    if (!authorized) {
      return { success: false, error: 'Acesso negado.' };
    }

    const { id, ...updateData } = validation.data;

    // Usar cliente admin para atualização
    const adminSupabase = await createSupabaseAdminClient();
    
    const { data: updatedOrganization, error } = await adminSupabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar organização:', error);
      return { 
        success: false,
        error: 'Não foi possível atualizar a organização.' 
      };
    }

    // Registrar no log de auditoria
    if (adminUserId) {
      const { ipAddress, userAgent } = await captureRequestInfo(adminUserId);
      await createAuditLog({
        actor_user_id: adminUserId,
        action_type: AUDIT_ACTION_TYPES.ORGANIZATION_UPDATED,
        resource_type: AUDIT_RESOURCE_TYPES.ORGANIZATION,
        resource_id: id,
        organization_id: id,
        details: {
          updated_fields: Object.keys(updateData),
          updated_by_admin: true,
        },
        old_value: validation.data,
        new_value: updatedOrganization,
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    }

    revalidatePath('/admin');
    revalidatePath('/admin/organizations');

    return { 
      success: true, 
      data: updatedOrganization 
    };
  } catch (e: any) {
    console.error('Erro inesperado em updateOrganization:', e);
    return { 
      success: false,
      error: e.message || 'Um erro inesperado ocorreu.' 
    };
  }
}

/**
 * Remove uma organização (soft delete)
 */
export async function deleteOrganization(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { authorized, userId: adminUserId } = await verifyMasterAdminAccess();
    if (!authorized) {
      return { success: false, error: 'Acesso negado.' };
    }

    // Usar cliente admin para soft delete
    const adminSupabase = await createSupabaseAdminClient();
    
    // Buscar dados da organização antes de remover
    const { data: organization, error: fetchError } = await adminSupabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !organization) {
      return { success: false, error: 'Organização não encontrada.' };
    }

    // Verificar se há usuários ativos na organização
    const { data: activeUsers, error: usersError } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('organization_id', id)
      .is('deleted_at', null);

    if (usersError) {
      console.error('Erro ao verificar usuários:', usersError);
      return { success: false, error: 'Erro ao verificar usuários da organização.' };
    }

    if (activeUsers && activeUsers.length > 0) {
      return { 
        success: false, 
        error: `Não é possível remover a organização. Existem ${activeUsers.length} usuário(s) ativo(s) vinculado(s).` 
      };
    }

    // Realizar soft delete
    const { error: deleteError } = await adminSupabase
      .from('organizations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (deleteError) {
      console.error('Erro ao remover organização:', deleteError);
      return { success: false, error: 'Não foi possível remover a organização.' };
    }

    // Registrar no log de auditoria
    if (adminUserId) {
      const { ipAddress, userAgent } = await captureRequestInfo(adminUserId);
      await createAuditLog({
        actor_user_id: adminUserId,
        action_type: AUDIT_ACTION_TYPES.ORGANIZATION_DELETED,
        resource_type: AUDIT_RESOURCE_TYPES.ORGANIZATION,
        resource_id: id,
        organization_id: id,
        details: {
          deleted_by_admin: true,
        },
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    }

    revalidatePath('/admin');
    revalidatePath('/admin/organizations');

    return { success: true };
  } catch (e: any) {
    console.error('Erro inesperado em deleteOrganization:', e);
    return { 
      success: false,
      error: e.message || 'Um erro inesperado ocorreu.' 
    };
  }
}

/**
 * Obtém estatísticas de organizações
 */
export async function getOrganizationStats(): Promise<{ data?: any; error?: string }> {
  try {
    const { authorized } = await verifyMasterAdminAccess();
    if (!authorized) {
      return { error: 'Acesso negado.' };
    }

    const supabase = await createSupabaseServerClient();

    // Tentar com cliente normal primeiro
    let { data, error } = await supabase
      .from('organizations')
      .select('client_type, is_implementation_complete')
      .is('deleted_at', null);

    // Se falhar com cliente normal, usar admin
    if (error) {
      const adminSupabase = await createSupabaseAdminClient();
      const adminResult = await adminSupabase
        .from('organizations')
        .select('client_type, is_implementation_complete')
        .is('deleted_at', null);
      
      data = adminResult.data;
      error = adminResult.error;
    }

    if (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return { error: 'Não foi possível carregar as estatísticas.' };
    }

    const organizations = data || [];
    const stats = {
      total: organizations.length,
      standard: organizations.filter(org => org.client_type === 'standard').length,
      custom: organizations.filter(org => org.client_type === 'custom').length,
      implemented: organizations.filter(org => org.is_implementation_complete).length,
      pending: organizations.filter(org => !org.is_implementation_complete).length,
    };

    return { data: stats };
  } catch (e: any) {
    console.error('Erro inesperado em getOrganizationStats:', e);
    return { error: e.message || 'Um erro inesperado ocorreu.' };
  }
}

/**
 * Atualiza a configuração de módulos de uma organização COM INTEGRAÇÃO DO LIFECYCLE
 */
export async function updateOrganizationModules(
  organizationId: string,
  moduleConfig: {
    client_type: 'standard' | 'custom';
    custom_backend_url?: string | null;
    is_implementation_complete: boolean;
    implementation_config: {
      subscribed_modules: string[];
      custom_modules: string[];
      enabled_standard_modules: string[];
      features: string[];
    };
  }
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { authorized, userId: adminUserId } = await verifyMasterAdminAccess();
    if (!authorized) {
      return { success: false, error: 'Acesso negado.' };
    }

    // Usar cliente admin para atualização
    const adminSupabase = await createSupabaseAdminClient();
    
    // 1. Atualizar configuração na tabela organizations
    const { data: updatedOrganization, error } = await adminSupabase
      .from('organizations')
      .update({
        client_type: moduleConfig.client_type,
        custom_backend_url: moduleConfig.custom_backend_url,
        is_implementation_complete: moduleConfig.is_implementation_complete,
        implementation_config: moduleConfig.implementation_config,
        updated_at: new Date().toISOString()
      })
      .eq('id', organizationId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar módulos da organização:', error);
      return { 
        success: false,
        error: 'Não foi possível atualizar a configuração dos módulos.' 
      };
    }

    // 2. SINCRONAÇÃO AVANÇADA COM LIFECYCLE SYSTEM
    try {
      // 2.1 Executar scan de módulos para verificar arquivos disponíveis
      const { ModuleFileMonitor } = await import('@/core/services/module-file-monitor');
      const monitor = new ModuleFileMonitor();
      const healthResults = await monitor.performHealthScan();

      // 2.2 Remover módulos existentes da organização
      await adminSupabase
        .from('tenant_module_assignments')
        .delete()
        .eq('organization_id', organizationId);

      // 2.3 Inserir novos módulos com informações de lifecycle
      if (moduleConfig.implementation_config.subscribed_modules.length > 0) {
        const modulesToInsert = await Promise.all(
          moduleConfig.implementation_config.subscribed_modules.map(async (moduleId) => {
            // Determinar nome e tipo do módulo DINAMICAMENTE
            const moduleName = await getModuleName(moduleId);
            const moduleType = moduleId.startsWith('banban-') ? 'custom' : 'standard';
            
            // Verificar se módulo foi descoberto no filesystem
            const discoveredModule = healthResults.discovered.find(m => m.moduleId === moduleId) ||
                                    healthResults.updated.find(m => m.moduleId === moduleId);
            
            // Determinar status baseado no scan e configuração
            let moduleStatus = 'planned'; // Status padrão
            let filePath: string | undefined;
            let fileHash: string | undefined;
            let moduleVersion = '1.0.0';
            
            if (discoveredModule) {
              moduleStatus = moduleConfig.is_implementation_complete ? 'ACTIVE' : 'IMPLEMENTED';
              filePath = discoveredModule.filePath;
              fileHash = discoveredModule.fileHash;
              moduleVersion = discoveredModule.version || '1.0.0';
            } else if (moduleConfig.is_implementation_complete) {
              // Se marcado como completo mas não encontrado, marcar como ausente
              moduleStatus = 'missing';
            }
            
            return {
              organization_id: organizationId,
              module_id: moduleId,
              module_name: moduleName,
              module_type: moduleType,
              status: moduleStatus,
              configuration: {
                features: moduleConfig.implementation_config.features.filter(f => 
                  f.includes(moduleId.replace('banban-', ''))
                ),
                enabled: true,
                assigned_at: new Date().toISOString(),
                lifecycle_managed: true
              },
              priority: 'high',
              implemented_at: discoveredModule ? new Date().toISOString() : null,
              activated_at: (moduleConfig.is_implementation_complete && discoveredModule) ? 
                           new Date().toISOString() : null,
              
              // NOVOS CAMPOS DO LIFECYCLE
              file_path: filePath || null,
              file_hash: fileHash || null,
              file_last_seen: discoveredModule ? new Date().toISOString() : null,
              module_version: moduleVersion,
              missing_since: moduleStatus === 'missing' ? new Date().toISOString() : null,
              missing_notified: false,
              locked_version: false
            };
          })
        );

        const { error: insertError } = await adminSupabase
          .from('tenant_module_assignments')
          .insert(modulesToInsert);

        if (insertError) {
          console.warn('Erro ao sincronizar com tenant_module_assignments:', insertError);
        } else {
          console.debug(`✅ Sincronizados ${modulesToInsert.length} módulos com lifecycle para organização ${organizationId}`);
          
          // 2.4 Registrar eventos de lifecycle para cada módulo
          const auditEvents = modulesToInsert.map(module => ({
            module_id: module.module_id,
            organization_id: organizationId,
            event_type: module.status === 'missing' ? 'missing' : 
                       module.file_path ? 'discovered' : 'assigned',
            file_path: module.file_path,
            file_hash: module.file_hash,
            new_status: module.status,
            impact_level: module.status === 'missing' ? 'high' : 'medium',
            metadata: {
              assigned_by_admin: true,
              admin_user_id: adminUserId,
              implementation_complete: moduleConfig.is_implementation_complete
            }
          }));

          // Inserir eventos de auditoria
          await adminSupabase
            .from('module_file_audit')
            .insert(auditEvents);
        }
      }
    } catch (syncError) {
      console.warn('Erro na sincronização avançada com lifecycle:', syncError);
      // Fallback para sincronização básica se lifecycle falhar
      await basicModulesSync(adminSupabase, organizationId, moduleConfig);
    }

    // 3. Registrar no log de auditoria
    if (adminUserId) {
      const { ipAddress, userAgent } = await captureRequestInfo(adminUserId);
      await createAuditLog({
        actor_user_id: adminUserId,
        action_type: AUDIT_ACTION_TYPES.ORGANIZATION_UPDATED,
        resource_type: AUDIT_RESOURCE_TYPES.ORGANIZATION,
        resource_id: organizationId,
        organization_id: organizationId,
        details: {
          updated_fields: ['client_type', 'custom_backend_url', 'is_implementation_complete', 'implementation_config'],
          new_client_type: moduleConfig.client_type,
          modules_count: moduleConfig.implementation_config.subscribed_modules.length,
          updated_by_admin: true,
          synced_tenant_module_assignments: true,
          lifecycle_integration: true
        },
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    }

    revalidatePath('/admin');
    revalidatePath('/admin/organizations');
    revalidatePath(`/admin/organizations/${organizationId}`);

    return { 
      success: true, 
      data: {
        ...updatedOrganization,
        lifecycle_sync: true,
        modules_synced: moduleConfig.implementation_config.subscribed_modules.length
      }
    };
  } catch (e: any) {
    console.error('Erro inesperado em updateOrganizationModules:', e);
    return { 
      success: false,
      error: e.message || 'Um erro inesperado ocorreu.' 
    };
  }
}

/**
 * Sincronização básica como fallback (compatibilidade com versão anterior)
 */
async function basicModulesSync(
  adminSupabase: any,
  organizationId: string,
  moduleConfig: any
) {
  if (moduleConfig.implementation_config.subscribed_modules.length > 0) {
        const modulesToInsert = await Promise.all(
      moduleConfig.implementation_config.subscribed_modules.map(async (moduleId: string) => {
        const moduleName = await getModuleName(moduleId);
        const moduleType = moduleId.startsWith('banban-') ? 'custom' : 'standard';
        
        return {
          organization_id: organizationId,
          module_id: moduleId,
          module_name: moduleName,
          module_type: moduleType,
          status: moduleConfig.is_implementation_complete ? 'ACTIVE' : 'IMPLEMENTED',
          configuration: {
            features: moduleConfig.implementation_config.features.filter((f: string) => 
              f.includes(moduleId.replace('banban-', ''))
            ),
            enabled: true,
            assigned_at: new Date().toISOString(),
            lifecycle_managed: false // Marca como não gerenciado pelo lifecycle
          },
          priority: 'high',
          implemented_at: new Date().toISOString(),
          activated_at: moduleConfig.is_implementation_complete ? new Date().toISOString() : null
        };
      })
    );

    await adminSupabase
      .from('tenant_module_assignments')
      .insert(modulesToInsert);
  }
}

/**
 * Função auxiliar para obter nome amigável do módulo DINAMICAMENTE
 * ✅ CORRIGIDO: Usa metadados dos arquivos module.json ao invés de lista hardcoded
 */
async function getModuleName(moduleId: string): Promise<string> {
  try {
    // Importar o serviço dinâmico
    const { getModuleFriendlyName } = await import('@/core/services/module-metadata');
    
    // Obter nome do module.json
    const friendlyName = await getModuleFriendlyName(moduleId);
    console.debug(`📋 [getModuleName] ${moduleId} → ${friendlyName}`);
    
    return friendlyName;
  } catch (error) {
    console.warn(`⚠️ [getModuleName] Erro ao obter nome de ${moduleId}, usando fallback:`, error);
    
    // Fallback para formatação básica
    return moduleId.charAt(0).toUpperCase() + moduleId.slice(1).replace(/-/g, ' ');
  }
}
