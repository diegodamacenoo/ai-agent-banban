'use server';

import { createSupabaseServerClient } from '@/core/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  ActionResult,
  TenantModuleAssignment,
  CreateTenantAssignmentInput,
  UpdateTenantAssignmentInput,
  CreateTenantAssignmentSchema,
  UpdateTenantAssignmentSchema,
} from './schemas';
import { verifyAdminAccess, checkModuleDependenciesForTenant, notifyTenantModuleActivation } from './utils';
import { trackServerCall } from './call-tracker';
import { 
  conditionalAuditLog, 
  conditionalDebugLog, 
  checkMaintenanceMode,
  getConfigValue 
} from './system-config-utils';

// ================================================
// SERVER ACTIONS - TENANT MODULE ASSIGNMENTS
// ================================================

/**
 * Listar assignments com filtros
 */
export async function getTenantAssignments(
  filters: {
    tenant_id?: string;
    base_module_id?: string;
    implementation_id?: string;
    includeArchived?: boolean;
    includeDeleted?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<ActionResult<{ assignments: TenantModuleAssignment[]; total: number; pages: number }>> {
  try {
    trackServerCall('👥 SERVER: getTenantAssignments', filters);
    
    // Verificar autenticação
    const { isAuthenticated, isAdmin } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem visualizar assignments' };
    }

    const supabase = await createSupabaseServerClient();
    const { tenant_id, base_module_id, implementation_id, search, page = 1, limit = 10 } = filters;

    // Construir query base
    let query = supabase
      .from('tenant_module_assignments')
      .select(`
        id,
        tenant_id,
        base_module_id,
        implementation_id,
        is_active,
        is_visible,
        status,
        permissions_override,
        user_groups,
        activation_date,
        deactivation_date,
        custom_config,
        assigned_at,
        organization:organizations(id, company_trading_name, slug),
        base_module:base_modules(name, slug, category, archived_at, deleted_at),
        implementation:module_implementations(name, implementation_key, archived_at, deleted_at)
      `, { count: 'exact' })
      .order('assigned_at', { ascending: false });

    // Aplicar filtros
    if (tenant_id) {
      query = query.eq('tenant_id', tenant_id);
    }

    if (base_module_id) {
      query = query.eq('base_module_id', base_module_id);
    }

    if (implementation_id) {
      query = query.eq('implementation_id', implementation_id);
    }

    // Filtrar por status de base_module e implementation
    if (!filters.includeArchived) {
      // Esta lógica pode precisar de ajuste se as colunas de status não estiverem no select
    }
    if (!filters.includeDeleted) {
      // Esta lógica pode precisar de ajuste se as colunas de status não estiverem no select
    }

    if (search) {
      query = query.or(`
        organization.company_trading_name.ilike.%${search}%,
        base_module.name.ilike.%${search}%,
        implementation.name.ilike.%${search}%
      `);
    }

    // Aplicar paginação
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: assignments, count, error } = await query;

    if (error) {
      console.error('Erro ao buscar assignments:', error);
      return { success: false, error: 'Erro interno ao buscar assignments' };
    }

    const total = count || 0;
    const pages = Math.ceil(total / limit);

    // Achatando os dados para corresponder à interface que o frontend espera
    const flattenedAssignments = assignments.map((a: any) => ({
      id: a.id,
      tenant_id: a.tenant_id,
      base_module_id: a.base_module_id,
      implementation_id: a.implementation_id,
      custom_config: a.custom_config,
      assigned_at: a.assigned_at,
      organization_name: a.organization?.company_trading_name,
      organization_slug: a.organization?.slug,
      module_name: a.base_module?.name,
      module_slug: a.base_module?.slug,
      module_category: a.base_module?.category,
      implementation_name: a.implementation?.name,
      implementation_key: a.implementation?.implementation_key,
      assignment_active: a.is_active,
    }));

    return {
      success: true,
      data: {
        assignments: flattenedAssignments || [],
        total,
        pages,
      },
    };

  } catch (error) {
    console.error('Erro em getTenantAssignments:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Criar novo assignment de módulo para um tenant
 */
export async function createTenantAssignment(input: CreateTenantAssignmentInput): Promise<ActionResult<TenantModuleAssignment>> {
  try {
    // Verificar modo de manutenção
    const { inMaintenance, message } = await checkMaintenanceMode();
    if (inMaintenance) {
      return { success: false, error: message || 'Sistema em manutenção' };
    }

    // Verificar autenticação e permissões
    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem criar assignments' };
    }

    // Validar entrada
    const validation = CreateTenantAssignmentSchema.safeParse(input);
    if (!validation.success) {
      return { 
        success: false, 
        error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}` 
      };
    }

    const data = validation.data;
    const supabase = await createSupabaseServerClient();

    // Verificar se organização existe e está ativa
    const { data: organization } = await supabase
      .from('organizations')
      .select('id, name, status')
      .eq('id', data.tenant_id)
      .single();

    if (!organization) {
      return { success: false, error: 'Organização não encontrada' };
    }

    if (organization.status !== 'ACTIVE') {
      return { success: false, error: 'Organização não está ativa' };
    }

    // Verificar se módulo base existe
    const { data: baseModule } = await supabase
      .from('base_modules')
      .select('id, name, dependencies, supports_multi_tenant, exclusive_tenant_id')
      .eq('id', data.base_module_id)
      .single();

    if (!baseModule) {
      return { success: false, error: 'Módulo base não encontrado' };
    }

    // Validar módulos single-tenant (exclusive)
    if (baseModule.supports_multi_tenant === false && baseModule.exclusive_tenant_id) {
      if (baseModule.exclusive_tenant_id !== data.tenant_id) {
        return { 
          success: false, 
          error: 'Este módulo é exclusivo de outro tenant e não pode ser atribuído a esta organização' 
        };
      }
    }

    // Verificar se implementação existe e está ativa
    const { data: implementation } = await supabase
      .from('module_implementations')
      .select('id, name, is_active, archived_at, deleted_at, base_module_id')
      .eq('id', data.implementation_id)
      .single();

    if (!implementation) {
      return { success: false, error: 'Implementação não encontrada' };
    }

    if (!implementation.is_active || implementation.archived_at || implementation.deleted_at) {
      return { success: false, error: 'Implementação não está ativa ou foi arquivada/deletada' };
    }

    if (implementation.base_module_id !== data.base_module_id) {
      return { success: false, error: 'Implementação não pertence ao módulo base especificado' };
    }

    // Verificar se já existe assignment para esta organização + módulo
    const { data: existingAssignment } = await supabase
      .from('tenant_module_assignments')
      .select('id')
      .eq('tenant_id', data.tenant_id)
      .eq('base_module_id', data.base_module_id)
      .single();

    if (existingAssignment) {
      return { success: false, error: 'Já existe um assignment deste módulo para esta organização' };
    }

    // Verificar dependências do módulo
    if (baseModule.dependencies && baseModule.dependencies.length > 0) {
      const dependencyCheck = await checkModuleDependenciesForTenant(
        data.tenant_id, 
        baseModule.dependencies
      );
      
      if (!dependencyCheck.satisfied) {
        return { 
          success: false, 
          error: `Dependências não satisfeitas: ${dependencyCheck.missing.join(', ')}` 
        };
      }
    }

    // Validar configuração contra schema (se fornecido)
    if (data.configuration && Object.keys(data.configuration).length > 0) {
      // TODO: Implementar validação contra schema do módulo
    }

    // Verificar datas se fornecidas
    if (data.activation_date && data.deactivation_date) {
      const activationDate = new Date(data.activation_date);
      const deactivationDate = new Date(data.deactivation_date);
      
      if (deactivationDate <= activationDate) {
        return { success: false, error: 'Data de desativação deve ser posterior à data de ativação' };
      }
    }

    // Criar assignment
    const { data: newAssignment, error: createError } = await supabase
      .from('tenant_module_assignments')
      .insert({
        tenant_id: data.tenant_id,
        base_module_id: data.base_module_id,
        implementation_id: data.implementation_id,
        configuration: data.configuration,
        permissions_override: data.permissions_override,
        user_groups: data.user_groups,
        activation_date: data.activation_date,
        deactivation_date: data.deactivation_date,
        config_schema: data.config_schema,
        status: data.status,
        created_by: user!.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Erro ao criar assignment:', createError);
      return { success: false, error: 'Erro interno ao criar assignment' };
    }

    // Aplicar configurações automáticas do sistema
    const { applySystemConfigurationsToNewEntity } = await import('./auto-config-applier');
    await applySystemConfigurationsToNewEntity('assignment', `${data.tenant_id}|${data.base_module_id}`, newAssignment);

    // Enviar notificação se solicitado
    if (data.notify_tenant) {
      await notifyTenantModuleActivation(data.tenant_id, baseModule.name, implementation.name);
    }

    // Invalidar cache
    revalidatePath('/admin/assignments');
    revalidatePath(`/admin/organizations/${data.tenant_id}`);
    
    // Invalidar cache de módulos para o tenant específico
    const { invalidateModuleCacheForOrg } = await import('../cache-invalidation');
    await invalidateModuleCacheForOrg(data.tenant_id);

    // Log de auditoria
    await supabase.from('audit_logs').insert({
      user_id: user!.id,
      action: 'create_tenant_assignment',
      resource_type: 'tenant_module_assignment',
      resource_id: newAssignment.id,
      details: {
        tenant_id: data.tenant_id,
        base_module_id: data.base_module_id,
        implementation_id: data.implementation_id,
        status: data.status,
      },
    });

    return {
      success: true,
      message: `Assignment criado com sucesso para ${organization.name}`,
      data: newAssignment,
    };

  } catch (error) {
    console.error('Erro em createTenantAssignment:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Atualizar assignment de módulo para um tenant
 */
export async function updateTenantAssignment(input: UpdateTenantAssignmentInput): Promise<ActionResult<TenantModuleAssignment>> {
  try {
    // Verificar modo de manutenção
    const { inMaintenance, message } = await checkMaintenanceMode();
    if (inMaintenance) {
      return { success: false, error: message || 'Sistema em manutenção' };
    }

    // Verificar autenticação e permissões
    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem editar assignments' };
    }

    // Validar entrada
    const validation = UpdateTenantAssignmentSchema.safeParse(input);
    if (!validation.success) {
      return { 
        success: false, 
        error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}` 
      };
    }

    const { id, ...updateData } = validation.data;
    const supabase = await createSupabaseServerClient();

    // Verificar se assignment existe
    const { data: existingAssignment } = await supabase
      .from('tenant_module_assignments')
      .select('*, base_module:base_modules(dependencies)')
      .eq('id', id)
      .single();

    if (!existingAssignment) {
      return { success: false, error: 'Assignment não encontrado' };
    }

    // Verificar se organização existe e está ativa (se tenant_id for atualizado)
    if (updateData.tenant_id && updateData.tenant_id !== existingAssignment.tenant_id) {
      const { data: organization } = await supabase
        .from('organizations')
        .select('id, name, status')
        .eq('id', updateData.tenant_id)
        .single();

      if (!organization || organization.status !== 'ACTIVE') {
        return { success: false, error: 'Nova organização não encontrada ou não está ativa' };
      }
    }

    // Verificar se módulo base existe (se base_module_id for atualizado)
    let currentBaseModuleId = existingAssignment.base_module_id;
    let currentBaseModuleDependencies = existingAssignment.base_module?.dependencies || [];

    if (updateData.base_module_id && updateData.base_module_id !== existingAssignment.base_module_id) {
      const { data: baseModule } = await supabase
        .from('base_modules')
        .select('id, name, dependencies')
        .eq('id', updateData.base_module_id)
        .single();

      if (!baseModule) {
        return { success: false, error: 'Novo módulo base não encontrado' };
      }
      currentBaseModuleId = baseModule.id;
      currentBaseModuleDependencies = baseModule.dependencies || [];
    }

    // Verificar se implementação existe e está ativa (se implementation_id for atualizado)
    if (updateData.implementation_id && updateData.implementation_id !== existingAssignment.implementation_id) {
      const { data: implementation } = await supabase
        .from('module_implementations')
        .select('id, name, is_active, archived_at, deleted_at, base_module_id')
        .eq('id', updateData.implementation_id)
        .single();

      if (!implementation?.is_active || implementation.archived_at || implementation.deleted_at) {
        return { success: false, error: 'Nova implementação não encontrada ou não está ativa' };
      }
      if (implementation.base_module_id !== currentBaseModuleId) {
        return { success: false, error: 'Nova implementação não pertence ao módulo base especificado' };
      }
    }

    // Verificar dependências do módulo (se base_module_id ou tenant_id for atualizado)
    if (updateData.base_module_id || updateData.tenant_id) {
      const targetTenantId = updateData.tenant_id || existingAssignment.tenant_id;
      const dependencyCheck = await checkModuleDependenciesForTenant(
        targetTenantId, 
        currentBaseModuleDependencies
      );
      
      if (!dependencyCheck.satisfied) {
        return { 
          success: false, 
          error: `Dependências não satisfeitas: ${dependencyCheck.missing.join(', ')}` 
        };
      }
    }

    // Atualizar assignment
    const { data: updatedAssignment, error: updateError } = await supabase
      .from('tenant_module_assignments')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar assignment:', updateError);
      return { success: false, error: 'Erro interno ao atualizar assignment' };
    }

    // Invalidar cache
    revalidatePath('/admin/assignments');
    revalidatePath(`/admin/organizations/${existingAssignment.tenant_id}`);
    if (updateData.tenant_id && updateData.tenant_id !== existingAssignment.tenant_id) {
      revalidatePath(`/admin/organizations/${updateData.tenant_id}`);
    }
    
    // Invalidar cache de módulos para os tenants afetados
    const { invalidateModuleCacheForOrg } = await import('../cache-invalidation');
    await invalidateModuleCacheForOrg(existingAssignment.tenant_id);
    if (updateData.tenant_id && updateData.tenant_id !== existingAssignment.tenant_id) {
      await invalidateModuleCacheForOrg(updateData.tenant_id);
    }

    // Log de auditoria
    await supabase.from('audit_logs').insert({
      user_id: user!.id,
      action: 'update_tenant_assignment',
      resource_type: 'tenant_module_assignment',
      resource_id: id,
      details: {
        updated_fields: Object.keys(updateData),
        tenant_id: updatedAssignment.tenant_id,
        base_module_id: updatedAssignment.base_module_id,
      },
    });

    return {
      success: true,
      message: `Assignment atualizado com sucesso para organização ${updatedAssignment.tenant_id}`,
      data: updatedAssignment,
    };

  } catch (error) {
    console.error('Erro em updateTenantAssignment:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Excluir assignment de módulo para um tenant
 */
export async function deleteTenantAssignment(assignmentId: string): Promise<ActionResult> {
  try {
    // Verificar modo de manutenção
    const { inMaintenance, message } = await checkMaintenanceMode();
    if (inMaintenance) {
      return { success: false, error: message || 'Sistema em manutenção' };
    }

    // Verificar autenticação e permissões
    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem excluir assignments' };
    }

    const supabase = await createSupabaseServerClient();

    // Verificar se assignment existe
    const { data: existingAssignment } = await supabase
      .from('tenant_module_assignments')
      .select('tenant_id')
      .eq('id', assignmentId)
      .single();

    if (!existingAssignment) {
      return { success: false, error: 'Assignment não encontrado' };
    }

    // Excluir assignment
    const { error: deleteError } = await supabase
      .from('tenant_module_assignments')
      .delete()
      .eq('id', assignmentId);

    if (deleteError) {
      console.error('Erro ao excluir assignment:', deleteError);
      return { success: false, error: 'Erro interno ao excluir assignment' };
    }

    // Invalidar cache
    revalidatePath('/admin/assignments');
    revalidatePath(`/admin/organizations/${existingAssignment.tenant_id}`);

    // Log de auditoria
    await supabase.from('audit_logs').insert({
      user_id: user!.id,
      action: 'delete_tenant_assignment',
      resource_type: 'tenant_module_assignment',
      resource_id: assignmentId,
      details: {
        tenant_id: existingAssignment.tenant_id,
      },
    });

    return {
      success: true,
      message: `Assignment excluído com sucesso para organização ${existingAssignment.tenant_id}`,
    };

  } catch (error) {
    console.error('Erro em deleteTenantAssignment:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Criar um novo assignment de forma simplificada a partir do painel de admin.
 */
export async function createSimpleTenantModuleAssignment(
  prevState: { message: string },
  formData: FormData
): Promise<{ message: string }> {
  await conditionalDebugLog('createTenantAssignment iniciado');
  try {
    // Verificar modo de manutenção
    const { inMaintenance, message } = await checkMaintenanceMode();
    if (inMaintenance) {
      return { message: message || 'Sistema em manutenção' };
    }

    await conditionalDebugLog('Iniciando criação de assignment');
    
    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    if (!isAuthenticated || !isAdmin) {
      console.error('[SERVER] Acesso negado - não autenticado ou não é admin');
      return { message: 'Acesso negado.' };
    }
    
    await conditionalDebugLog('Usuário autenticado como admin', { userId: user?.id });

    const supabase = await createSupabaseServerClient();

    const tenantId = formData.get('tenantId') as string;
    const baseModuleId = formData.get('baseModuleId') as string;
    const implementationId = formData.get('implementationId') as string;
    const customConfigStr = formData.get('customConfig') as string;
    const createAsInactive = formData.get('createAsInactive') === 'true'; // Novo parâmetro
    
    await conditionalDebugLog('Dados do formulário', { tenantId, baseModuleId, implementationId, customConfigStr });

    if (!tenantId || !baseModuleId || !implementationId) {
      console.error('[SERVER] Campos obrigatórios ausentes');
      return { message: 'Campos obrigatórios ausentes.' };
    }

    // 1. Verificar se o assignment já existe
    await conditionalDebugLog('Verificando se assignment já existe', { tenantId, baseModuleId });
    const { data: existing, error: checkError } = await supabase
      .from('tenant_module_assignments')
      .select('tenant_id, base_module_id')
      .eq('tenant_id', tenantId)
      .eq('base_module_id', baseModuleId)
      .maybeSingle();
      
    await conditionalDebugLog('Resultado da verificação', { existing, checkError });

    if (existing) {
      return { message: 'Este módulo já está atribuído a esta organização.' };
    }

    // 2. Validar JSON da configuração
    let custom_config = {};
    if (customConfigStr) {
      try {
        custom_config = JSON.parse(customConfigStr);
      } catch (e) {
        return { message: 'O JSON da configuração personalizada é inválido.' };
      }
    }

    // 3. Inserir o novo assignment
    const assignmentData = {
      tenant_id: tenantId,
      base_module_id: baseModuleId,
      implementation_id: implementationId,
      custom_config: custom_config,
      is_active: !createAsInactive, // Usar parâmetro para definir status (inativo se createAsInactive = true)
      assigned_by: user.id,
    };
    
    await conditionalDebugLog('Tentando inserir assignment', assignmentData);
    
    const { data: newAssignment, error } = await supabase
      .from('tenant_module_assignments')
      .insert(assignmentData)
      .select()
      .single();

    if (error) {
      console.error('[SERVER] ❌ Erro ao criar assignment:', error);
      console.error('[SERVER] ❌ Detalhes do erro:', { 
        message: error.message, 
        details: error.details, 
        hint: error.hint, 
        code: error.code 
      });
      return { message: `Erro do banco de dados: ${error.message}` };
    }

    // Aplicar configurações automáticas do sistema
    const { applySystemConfigurationsToNewEntity } = await import('./auto-config-applier');
    await applySystemConfigurationsToNewEntity('assignment', `${tenantId}|${baseModuleId}`, newAssignment);

    // 4. Revalidar o path para atualizar a UI
    revalidatePath('/admin/modules');

    return { message: 'Atribuição criada com sucesso!' };

  } catch (error) {
    console.error('Erro em createSimpleTenantModuleAssignment:', error);
    return { message: 'Ocorreu um erro inesperado no servidor.' };
  }
}

/**
 * Excluir um assignment de forma simplificada a partir do painel de admin.
 */
export async function deleteSimpleTenantAssignment(
  tenantId: string, 
  baseModuleId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Verificar modo de manutenção
    const { inMaintenance, message } = await checkMaintenanceMode();
    if (inMaintenance) {
      return { success: false, message: message || 'Sistema em manutenção' };
    }

    await conditionalDebugLog('Tentando excluir assignment', { tenantId, baseModuleId });
    
    const { isAuthenticated, isAdmin } = await verifyAdminAccess();
    if (!isAuthenticated || !isAdmin) {
      console.error('[SERVER] Acesso negado - não autenticado ou não é admin');
      return { success: false, message: 'Acesso negado.' };
    }

    if (!tenantId || !baseModuleId) {
      console.error('[SERVER] IDs faltando', { tenantId, baseModuleId });
      return { success: false, message: 'IDs da atribuição não fornecidos.' };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from('tenant_module_assignments')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('base_module_id', baseModuleId);

    if (error) {
      console.error('[SERVER] ❌ Erro ao excluir assignment:', error);
      console.error('[SERVER] ❌ Detalhes do erro:', { 
        message: error.message, 
        details: error.details, 
        hint: error.hint, 
        code: error.code 
      });
      return { success: false, message: `Erro do banco de dados: ${error.message}` };
    }

    await conditionalDebugLog('Assignment excluído com sucesso');
    revalidatePath('/admin/modules');

    return { success: true, message: 'Atribuição excluída com sucesso!' };

  } catch (error) {
    console.error('[SERVER] ❌ Erro em deleteSimpleTenantAssignment:', error);
    return { success: false, message: 'Ocorreu um erro inesperado no servidor.' };
  }
}

/**
 * Atualizar configuração de um assignment de forma simplificada.
 */
export async function updateTenantModuleConfig(
  tenantId: string, 
  baseModuleId: string,
  config: Record<string, any>
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    // Verificar modo de manutenção
    const { inMaintenance, message } = await checkMaintenanceMode();
    if (inMaintenance) {
      return { success: false, message: message || 'Sistema em manutenção', error: 'Sistema em manutenção' };
    }

    const { isAuthenticated, isAdmin } = await verifyAdminAccess();
    if (!isAuthenticated || !isAdmin) {
      return { success: false, message: 'Acesso negado.', error: 'Acesso negado.' };
    }

    if (!tenantId || !baseModuleId) {
      return { success: false, message: 'IDs da atribuição não fornecidos.', error: 'IDs da atribuição não fornecidos.' };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from('tenant_module_assignments')
      .update({ custom_config: config })
      .eq('tenant_id', tenantId)
      .eq('base_module_id', baseModuleId);

    if (error) {
      console.error('Erro ao atualizar configuração:', error);
      return { success: false, message: `Erro do banco de dados: ${error.message}`, error: error.message };
    }

    revalidatePath('/admin/modules');

    return { success: true, message: 'Configuração atualizada com sucesso!' };

  } catch (error) {
    console.error('Erro em updateTenantModuleConfig:', error);
    return { success: false, message: 'Ocorreu um erro inesperado no servidor.', error: 'Erro inesperado no servidor.' };
  }
}