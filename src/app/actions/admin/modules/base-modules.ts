'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  ActionResult,
  BaseModule,
  CreateBaseModuleInput,
  UpdateBaseModuleInput,
} from './schemas';
import {
  verifyAdminAccess,
  generateSlugFromName,
  validateJsonSchema,
  checkCircularDependencies,
} from './utils';
import { trackServerCall } from './call-tracker';

// ================================================
// SERVER ACTIONS - CRUD MÓDULOS BASE
// ================================================

/**
 * Listar módulos base com filtros e paginação
 */
export async function getBaseModules(
  filters: {
    search?: string;
    category?: string;
    includeArchived?: boolean;
    includeDeleted?: boolean;
    onlyArchived?: boolean;
    onlyDeleted?: boolean;
    page?: number;
    limit?: number;
  } = {}
): Promise<ActionResult<{ modules: BaseModule[]; total: number; pages: number }>> {
  try {
    trackServerCall('🔄 SERVER: getBaseModules', filters);
    
    // Verificar autenticação
    const { isAuthenticated, isAdmin } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem visualizar módulos' };
    }

    const supabase = await createSupabaseServerClient();
    const { search, category, page = 1, limit = 10 } = filters;

    // Construir query base
    let query = supabase
      .from('base_modules')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    // Filtrar por archived_at e deleted_at
    // Se onlyArchived ou onlyDeleted estão ativos, aplicar filtros exclusivos
    if (filters.onlyArchived) {
      query = query.not('archived_at', 'is', null);
    } else if (filters.onlyDeleted) {
      query = query.not('deleted_at', 'is', null);
    } else {
      // Lógica padrão para incluir/excluir
      if (!filters.includeArchived) {
        query = query.is('archived_at', null);
      }
      if (!filters.includeDeleted) {
        query = query.is('deleted_at', null);
      }
    }

    // Aplicar paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: modules, error: queryError, count } = await query;

    if (queryError) {
      return { success: false, error: 'Erro ao buscar módulos: ' + queryError.message };
    }

    const total = count || 0;
    const pages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        modules: modules || [],
        total,
        pages
      }
    };
  } catch (error) {
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Criar novo módulo base
 */
export async function createBaseModule(input: CreateBaseModuleInput): Promise<ActionResult<BaseModule>> {
  try {
    // Verificar autenticação e permissões
    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem criar módulos' };
    }

    // Validar entrada
    // AIDEV-NOTE: CreateBaseModuleSchema é importado de schemas.ts
    const { CreateBaseModuleSchema } = await import('./schemas');
    const validation = CreateBaseModuleSchema.safeParse(input);
    if (!validation.success) {
      return { 
        success: false, 
        error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}` 
      };
    }

    const data = validation.data;
    const supabase = await createSupabaseServerClient();

    // Gerar slug se não fornecido
    if (!data.slug || data.slug === '') {
      data.slug = generateSlugFromName(data.name);
    }

    // Verificar se nome já existe
    const { data: existingByName } = await supabase
      .from('base_modules')
      .select('id')
      .eq('name', data.name)
      .single();

    if (existingByName) {
      return { success: false, error: 'Já existe um módulo com este nome' };
    }

    // Verificar se slug já existe
    const { data: existingBySlug } = await supabase
      .from('base_modules')
      .select('id')
      .eq('slug', data.slug)
      .single();

    if (existingBySlug) {
      return { success: false, error: 'Já existe um módulo com este slug' };
    }

    // Validar JSON Schema se fornecido
    if (data.config_schema && Object.keys(data.config_schema).length > 0) {
      if (!validateJsonSchema(data.config_schema)) {
        return { success: false, error: 'Schema de configuração inválido' };
      }
    }

    // Verificar se dependências existem
    if (data.dependencies && data.dependencies.length > 0) {
      const { data: depModules, error: depError } = await supabase
        .from('base_modules')
        .select('id')
        .in('id', data.dependencies);

      if (depError || !depModules || depModules.length !== data.dependencies.length) {
        return { success: false, error: 'Uma ou mais dependências não foram encontradas' };
      }
    }

    // Criar registro do módulo
    const { data: newModule, error: createError } = await supabase
      .from('base_modules')
      .insert({
        name: data.name,
        slug: data.slug,
        description: data.description,
        category: data.category,
        icon: data.icon,
        route_pattern: data.route_pattern,
        permissions_required: data.permissions_required,
        supports_multi_tenant: data.supports_multi_tenant,
        config_schema: data.config_schema,
        dependencies: data.dependencies,
        version: data.version,
        tags: data.tags,
        status: 'active',
        created_by: user!.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Erro ao criar módulo base:', createError);
      return { success: false, error: 'Erro interno ao criar módulo' };
    }

    // Auto-criar implementação standard se solicitado
    if (data.auto_create_standard) {
      await createStandardImplementation(newModule.id, user!.id);
    }

    // Invalidar cache
    revalidatePath('/admin/modules');


    // Log de auditoria
    await supabase.from('audit_logs').insert({
      user_id: user!.id,
      action: 'create_base_module',
      resource_type: 'base_module',
      resource_id: newModule.id,
      details: {
        module_name: data.name,
        module_slug: data.slug,
        auto_create_standard: data.auto_create_standard,
      },
    });

    return {
      success: true,
      message: `Módulo "${data.name}" criado com sucesso`,
      data: newModule,
    };

  } catch (error) {
    console.error('Erro em createBaseModule:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Criar implementação standard automaticamente
 */
async function createStandardImplementation(baseModuleId: string, userId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  
  // Buscar dados do módulo base
  const { data: baseModule } = await supabase
    .from('base_modules')
    .select('name, slug')
    .eq('id', baseModuleId)
    .single();

  if (!baseModule) return;

  // Criar implementação standard
  await supabase.from('module_implementations').insert({
    base_module_id: baseModuleId,
    implementation_key: 'standard',
    name: `${baseModule.name} - Standard`,
    description: `Implementação padrão do módulo ${baseModule.name}`,
    version: '1.0.0',
    component_type: 'generated',
    template_type: 'dashboard',
    template_config: {
      layout: 'grid',
      components: [
        { type: 'kpi-card', title: 'Total', value: '0', trend: 'neutral' },
        { type: 'chart', chartType: 'line', title: 'Tendência' },
      ],
    },
    audience: 'generic',
    complexity: 'standard',
    priority: 'medium',
    status: 'active',
    is_default: true,
    created_by: userId,
  });
}

/**
 * Atualizar módulo base existente
 */
export async function updateBaseModule(input: UpdateBaseModuleInput): Promise<ActionResult<BaseModule>> {
  try {
    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem editar módulos' };
    }

    const { UpdateBaseModuleSchema } = await import('./schemas');
    const validation = UpdateBaseModuleSchema.safeParse(input);
    if (!validation.success) {
      return { 
        success: false, 
        error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}` 
      };
    }

    const { id, ...updateData } = validation.data;
    
    console.debug('updateBaseModule - Dados para atualização:', updateData);
    
    const supabase = await createSupabaseServerClient();

    // Se is_active está sendo alterado, buscar estado atual para implementar cascata
    let shouldPropagateState = false;
    let newActiveState: boolean | undefined;
    
    if ('is_active' in updateData) {
      const { data: currentModule } = await supabase
        .from('base_modules')
        .select('is_active, name')
        .eq('id', id)
        .single();
        
      if (currentModule && currentModule.is_active !== updateData.is_active) {
        shouldPropagateState = true;
        newActiveState = updateData.is_active;
      }
    }

    const { data: updatedModule, error: updateError } = await supabase
      .from('base_modules')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: `Erro do banco de dados: ${updateError.message}` };
    }

    // Implementar propagação em cascata se is_active foi alterado
    if (shouldPropagateState && newActiveState !== undefined) {
      // Propagar para implementações
      const { error: implError } = await supabase
        .from('module_implementations')
        .update({ is_active: newActiveState })
        .eq('base_module_id', id);

      // Propagar para assignments
      const { data: existingAssignments, count: totalAssignments } = await supabase
        .from('tenant_module_assignments')
        .select('*', { count: 'exact' })
        .eq('base_module_id', id);
      
      let assignError: any = null;
      let assignCount: number | null = null;
      
      const { error: simpleUpdateError, count: simpleCount } = await supabase
        .from('tenant_module_assignments')
        .update({ 
          is_active: newActiveState,
          updated_at: new Date().toISOString(),
        })
        .eq('base_module_id', id);

      if (simpleUpdateError) {
        // Se falhar (provável constraint do assigned_by), tentar com assigned_by
        const { error: fallbackError, count: fallbackCount } = await supabase
          .from('tenant_module_assignments')
          .update({ 
            is_active: newActiveState,
            updated_at: new Date().toISOString(),
            assigned_by: user!.id,
          })
          .eq('base_module_id', id);
          
        assignError = fallbackError;
        assignCount = fallbackCount;
      } else {
        assignError = null;
        assignCount = simpleCount;
      }

      // Log de auditoria para propagação
      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: newActiveState ? 'activate_module_cascade' : 'deactivate_module_cascade',
        resource_type: 'base_module',
        resource_id: id,
        details: {
          module_name: updatedModule.name,
          propagated_to: ['implementations', 'assignments'],
          new_active_state: newActiveState,
          total_assignments: totalAssignments,
          updated_assignments: assignCount,
          propagation_errors: {
            implementations: implError ? implError.message : null,
            assignments: assignError ? assignError.message : null,
          },
        },
      });
    }

    revalidatePath('/admin/modules');
    revalidatePath(`/admin/modules/${updatedModule.slug}`);

    return {
      success: true,
      message: `Módulo "${updatedModule.name}" atualizado com sucesso`,
      data: updatedModule,
    };

  } catch (error) {
    return { success: false, error: 'Erro interno do servidor.' };
  }
}

/**
 * Excluir módulo base
 */
export async function deleteBaseModule(moduleId: string): Promise<ActionResult> {
  try {
    // Verificar autenticação e permissões
    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem excluir módulos' };
    }

    const supabase = await createSupabaseServerClient();

    // Verificar se módulo existe
    const { data: existingModule } = await supabase
      .from('base_modules')
      .select('name')
      .eq('id', moduleId)
      .single();

    if (!existingModule) {
      return { success: false, error: 'Módulo não encontrado' };
    }

    // Verificar se há implementações associadas
    const { data: implementations, count: implCount } = await supabase
      .from('module_implementations')
      .select('id', { count: 'exact' })
      .eq('base_module_id', moduleId);

    if (implCount && implCount > 0) {
      return { 
        success: false, 
        error: `Não é possível excluir o módulo. Existem ${implCount} implementações associadas. Exclua-as primeiro.` 
      };
    }

    // Verificar se há assignments de tenants
    const { data: assignments, count: assignCount } = await supabase
      .from('tenant_module_assignments')
      .select('id', { count: 'exact' })
      .eq('base_module_id', moduleId);

    if (assignCount && assignCount > 0) {
      return { 
        success: false, 
        error: `Não é possível excluir o módulo. Existem ${assignCount} assignments para tenants. Remova-os primeiro.` 
      };
    }

    // Verificar se é dependência de outros módulos
    const { data: dependents, count: depCount } = await supabase
      .from('base_modules')
      .select('name', { count: 'exact' })
      .contains('dependencies', [moduleId]);

    if (depCount && depCount > 0) {
      const dependentNames = dependents?.map(d => d.name).join(', ') || '';
      return { 
        success: false, 
        error: `Não é possível excluir o módulo. Ele é dependência de outros módulos: ${dependentNames}` 
      };
    }

    // Soft-excluir módulo
    const { error: deleteError } = await supabase
      .from('base_modules')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', moduleId);

    if (deleteError) {
      console.error('Erro ao soft-excluir módulo:', deleteError);
      return { success: false, error: 'Erro interno ao soft-excluir módulo' };
    }

    // Soft-excluir implementações associadas
    await supabase
      .from('module_implementations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('base_module_id', moduleId);

    // Desativar assignments associados
    await supabase
      .from('tenant_module_assignments')
      .update({ is_active: false })
      .eq('base_module_id', moduleId);

    // Invalidar cache
    revalidatePath('/admin/modules');


    // Log de auditoria
    await supabase.from('audit_logs').insert({
      user_id: user!.id,
      action: 'delete_base_module',
      resource_type: 'base_module',
      resource_id: moduleId,
      details: {
        module_name: existingModule.name,
      },
    });

    return {
      success: true,
      message: `Módulo "${existingModule.name}" excluído com sucesso`,
    };

  } catch (error) {
    console.error('Erro em deleteBaseModule:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Arquivar módulo base (soft archive)
 */
export async function archiveBaseModule(moduleId: string): Promise<ActionResult> {
  try {
    // Verificar autenticação e permissões
    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem arquivar módulos' };
    }

    const supabase = await createSupabaseServerClient();

    // Verificar se módulo existe e não está soft-deletado
    const { data: existingModule } = await supabase
      .from('base_modules')
      .select('name, deleted_at')
      .eq('id', moduleId)
      .is('deleted_at', null)
      .single();

    if (!existingModule) {
      return { success: false, error: 'Módulo não encontrado ou já soft-deletado' };
    }

    // Arquivar módulo
    const { error: archiveError } = await supabase
      .from('base_modules')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', moduleId);

    if (archiveError) {
      console.error('Erro ao arquivar módulo:', archiveError);
      return { success: false, error: 'Erro interno ao arquivar módulo' };
    }

    // Arquivar implementações associadas
    await supabase
      .from('module_implementations')
      .update({ archived_at: new Date().toISOString() })
      .eq('base_module_id', moduleId);

    // Desativar assignments associados
    await supabase
      .from('tenant_module_assignments')
      .update({ is_active: false })
      .eq('base_module_id', moduleId);

    // Invalidar cache
    revalidatePath('/admin/modules');


    // Log de auditoria
    await supabase.from('audit_logs').insert({
      user_id: user!.id,
      action: 'archive_base_module',
      resource_type: 'base_module',
      resource_id: moduleId,
      details: {
        module_name: existingModule.name,
      },
    });

    return {
      success: true,
      message: `Módulo "${existingModule.name}" arquivado com sucesso`,
    };

  } catch (error) {
    console.error('Erro em archiveBaseModule:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Restaurar módulo base (desarquivar ou desfazer soft delete)
 */
export async function restoreBaseModule(moduleId: string): Promise<ActionResult> {
  try {
    // Verificar autenticação e permissões
    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem restaurar módulos' };
    }

    const supabase = await createSupabaseServerClient();

    // Verificar se módulo existe (pode estar arquivado ou soft-deletado)
    const { data: existingModule } = await supabase
      .from('base_modules')
      .select('name, archived_at, deleted_at')
      .eq('id', moduleId)
      .single();

    if (!existingModule) {
      return { success: false, error: 'Módulo não encontrado' };
    }

    if (existingModule.archived_at === null && existingModule.deleted_at === null) {
      return { success: false, error: 'Módulo já está ativo e não precisa ser restaurado' };
    }

    // Restaurar módulo
    const { error: restoreError } = await supabase
      .from('base_modules')
      .update({ archived_at: null, deleted_at: null })
      .eq('id', moduleId);

    if (restoreError) {
      console.error('Erro ao restaurar módulo:', restoreError);
      return { success: false, error: 'Erro interno ao restaurar módulo' };
    }

    // Restaurar implementações associadas
    await supabase
      .from('module_implementations')
      .update({ archived_at: null, deleted_at: null })
      .eq('base_module_id', moduleId);

    // Reativar assignments associados (que não estavam inativo por outros motivos)
    await supabase
      .from('tenant_module_assignments')
      .update({ is_active: true })
      .eq('base_module_id', moduleId)
      .eq('is_active', false);

    // Invalidar cache
    revalidatePath('/admin/modules');


    // Log de auditoria
    await supabase.from('audit_logs').insert({
      user_id: user!.id,
      action: 'restore_base_module',
      resource_type: 'base_module',
      resource_id: moduleId,
      details: {
        module_name: existingModule.name,
      },
    });

    return {
      success: true,
      message: `Módulo "${existingModule.name}" restaurado com sucesso`,
    };

  } catch (error) {
    console.error('Erro em restoreBaseModule:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Excluir módulo base permanentemente (hard delete)
 */
export async function purgeBaseModule(moduleId: string): Promise<ActionResult> {
  try {
    // Verificar autenticação e permissões
    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem excluir módulos permanentemente' };
    }

    const supabase = await createSupabaseServerClient();

    // Verificar se módulo existe e se está soft-deletado
    const { data: existingModule } = await supabase
      .from('base_modules')
      .select('name, deleted_at')
      .eq('id', moduleId)
      .single();

    if (!existingModule) {
      return { success: false, error: 'Módulo não encontrado' };
    }

    if (existingModule.deleted_at === null) {
      return { success: false, error: 'Módulo não está soft-deletado. Use a função de soft delete primeiro.' };
    }

    // Verificar se há implementações associadas (mesmo que soft-deletadas)
    const { count: implCount } = await supabase
      .from('module_implementations')
      .select('id', { count: 'exact' })
      .eq('base_module_id', moduleId);

    if (implCount && implCount > 0) {
      return { 
        success: false, 
        error: `Não é possível excluir permanentemente o módulo. Existem ${implCount} implementações associadas (mesmo que soft-deletadas). Purge-as primeiro.` 
      };
    }

    // Remover assignments associados permanentemente
    await supabase
      .from('tenant_module_assignments')
      .delete()
      .eq('base_module_id', moduleId);

    // Excluir módulo permanentemente
    const { error: deleteError } = await supabase
      .from('base_modules')
      .delete()
      .eq('id', moduleId);

    if (deleteError) {
      console.error('Erro ao excluir módulo permanentemente:', deleteError);
      return { success: false, error: 'Erro interno ao excluir módulo permanentemente' };
    }

    // Invalidar cache
    revalidatePath('/admin/modules');


    // Log de auditoria
    await supabase.from('audit_logs').insert({
      user_id: user!.id,
      action: 'purge_base_module',
      resource_type: 'base_module',
      resource_id: moduleId,
      details: {
        module_name: existingModule.name,
      },
    });

    return {
      success: true,
      message: `Módulo "${existingModule.name}" excluído permanentemente com sucesso`,
    };

  } catch (error) {
    console.error('Erro em purgeBaseModule:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Buscar módulo base por ID
 */
export async function getBaseModuleById(moduleId: string): Promise<ActionResult<BaseModule>> {
  try {
    // Verificar autenticação
    const { isAuthenticated, isAdmin } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado' };
    }

    const supabase = await createSupabaseServerClient();

    const { data: module, error } = await supabase
      .from('base_modules')
      .select('*')
      .eq('id', moduleId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Módulo não encontrado' };
      }
      console.error('Erro ao buscar módulo:', error);
      return { success: false, error: 'Erro interno ao buscar módulo' };
    }

    return {
      success: true,
      data: module,
    };

  } catch (error) {
    console.error('Erro em getBaseModuleById:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}



/**
 * Obter permissões disponíveis no sistema
 */
export async function getAvailablePermissions(): Promise<ActionResult<string[]>> {
  try {
    // Lista de permissões conhecidas do sistema
    // TODO: Esta lista pode ser dinamizada no futuro
    const permissions = [
      'read:modules',
      'write:modules',
      'admin:modules',
      'read:analytics',
      'write:analytics',
      'read:users',
      'write:users',
      'admin:users',
      'read:settings',
      'write:settings',
      'admin:settings',
      'read:reports',
      'write:reports',
      'admin:reports',
    ];

    return {
      success: true,
      data: permissions,
    };

  } catch (error) {
    console.error('Erro em getAvailablePermissions:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Obter categorias disponíveis
 */
export async function getAvailableCategories(): Promise<ActionResult<string[]>> {
  try {
    const supabase = await createSupabaseServerClient();

    // Buscar categorias únicas dos módulos existentes
    const { data: categories, error } = await supabase
      .from('base_modules')
      .select('category')
      .not('category', 'is', null);

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      return { success: false, error: 'Erro ao buscar categorias' };
    }

    // Extrair categorias únicas e adicionar algumas padrão
    const uniqueCategories = Array.from(
      new Set([
        ...categories.map(c => c.category),
        'Analytics',
        'Dashboard',
        'Reports',
        'Management',
        'Integration',
        'Security',
        'Communication',
      ])
    ).sort();

    return {
      success: true,
      data: uniqueCategories,
    };

  } catch (error) {
    console.error('Erro em getAvailableCategories:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * NOVA FUNÇÃO: Calcula estatísticas dos módulos com nova estrutura
 */
export async function getBaseModuleStats(): Promise<ActionResult<any>> {
  try {
    trackServerCall('📊 SERVER: getBaseModuleStats');
    
    const supabase = await createSupabaseServerClient();
    
    // Verificar se as tabelas existem primeiro
    const { isAuthenticated, isAdmin } = await verifyAdminAccess();
    
    if (!isAuthenticated || !isAdmin) {
      return {
        success: false,
        error: 'Acesso negado'
      };
    }
    
    // Versão simplificada que funciona sem dependências de tabelas que podem não existir
    const stats = {
      overview: {
        totalBaseModules: 0,
        totalImplementations: 0,
        totalActiveAssignments: 0,
        totalOrganizations: 0,
        healthScore: 100
      },
      implementationsByType: {},
      adoptionByModule: [],
      orphanModules: []
    };

    // Tentar carregar dados reais se as tabelas existirem
    try {
      const { data: baseModules, count: baseModulesCount } = await supabase
        .from('base_modules')
        .select('id, name, category', { count: 'exact' })
        .is('deleted_at', null);

      if (baseModules) {
        stats.overview.totalBaseModules = baseModulesCount || 0;
        stats.adoptionByModule = baseModules.map(module => ({
          moduleId: module.id,
          moduleName: module.name,
          category: module.category || 'Unknown',
          totalTenants: 0,
          adoptionRate: 0
        }));
      }
    } catch (error) {
      console.warn('Tabela base_modules não encontrada:', error);
    }

    try {
      const { data: implementations, count: implementationsCount } = await supabase
        .from('module_implementations')
        .select('id, implementation_key', { count: 'exact' });

      if (implementations) {
        stats.overview.totalImplementations = implementationsCount || 0;
        stats.implementationsByType = implementations.reduce((acc, impl) => {
          const key = impl.implementation_key || 'unknown';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }
    } catch (error) {
      console.warn('Tabela module_implementations não encontrada:', error);
    }

    try {
      const { count: organizationsCount } = await supabase
        .from('organizations')
        .select('id', { count: 'exact' })
        .eq('status', 'active');

      stats.overview.totalOrganizations = organizationsCount || 0;
    } catch (error) {
      console.warn('Tabela organizations não encontrada:', error);
    }

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Erro ao calcular estatísticas dos módulos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}