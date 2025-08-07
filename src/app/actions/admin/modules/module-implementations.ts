'use server';

import { createSupabaseServerClient } from '@/core/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  ActionResult,
  ModuleImplementation,
  CreateModuleImplementationInput,
  UpdateModuleImplementationInput,
  CreateModuleImplementationSchema,
  UpdateModuleImplementationSchema,
} from './schemas';
import { verifyAdminAccess } from './utils';
import { trackServerCall } from './call-tracker';
import { 
  conditionalAuditLog, 
  conditionalDebugLog, 
  checkMaintenanceMode,
  getConfigValue 
} from './system-config-utils';

// Helper para consolidar revalidações e evitar calls redundantes
function revalidateImplementationsPaths() {
  revalidatePath('/admin/modules', 'layout');
}

// ================================================
// SERVER ACTIONS - MODULE IMPLEMENTATIONS
// ================================================

/**
 * Listar implementações com filtros
 */
export async function getModuleImplementations(
  filters: {
    base_module_id?: string;
    search?: string;
    audience?: 'generic' | 'client-specific' | 'enterprise';
    complexity?: 'basic' | 'standard' | 'advanced' | 'enterprise';
    includeArchivedModules?: boolean;
    includeDeletedModules?: boolean;
    page?: number;
    limit?: number;
  } = {}
): Promise<ActionResult<{ implementations: ModuleImplementation[]; total: number; pages: number }>> {
  try {
    trackServerCall('⚙️ SERVER: getModuleImplementations', filters);
    
    // Verificar autenticação
    const { isAuthenticated, isAdmin } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem visualizar implementações' };
    }

    const supabase = await createSupabaseServerClient();
    const { page = 1, limit = 50 } = filters;

    // Versão defensiva que funciona mesmo se a tabela não existir
    try {
      // Construir query base com informações do módulo base
      let query = supabase
        .from('module_implementations')
        .select(`
          id,
          base_module_id,
          implementation_key,
          name,
          description,
          version,
          component_type,
          template_type,
          component_path,
          audience,
          complexity,
          priority,
          status,
          is_default,
          is_active,
          created_at,
          updated_at,
          base_module:base_modules (
            id,
            name,
            slug,
            archived_at,
            deleted_at
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.base_module_id) {
        query = query.eq('base_module_id', filters.base_module_id);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,implementation_key.ilike.%${filters.search}%`);
      }

      if (filters.audience) {
        query = query.eq('audience', filters.audience);
      }

      if (filters.complexity) {
        query = query.eq('complexity', filters.complexity);
      }

      // Implementações não têm soft delete - sempre retornar todas as ativas

      // Filtrar por status do módulo base pai
      if (!filters.includeArchivedModules) {
        query = query.is('base_modules.archived_at', null);
      }
      if (!filters.includeDeletedModules) {
        query = query.is('base_modules.deleted_at', null);
      }

      // Aplicar paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: implementations, count, error } = await query;

      if (error) {
        console.warn('Erro ao buscar implementações:', error);
        // Retornar dados vazios em caso de erro
        return {
          success: true,
          data: {
            implementations: [],
            total: 0,
            pages: 0
          }
        };
      }

      const total = count || 0;
      const pages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          implementations: implementations || [],
          total,
          pages,
        },
      };

    } catch (tableError) {
      console.error('Erro ao acessar tabela module_implementations:', tableError);
      return { 
        success: false, 
        error: 'Erro ao acessar tabela de implementações. Verifique se a migração foi executada corretamente.' 
      };
    }

  } catch (error) {
    console.error('Erro em getModuleImplementations:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Gerar componente a partir de template
 */
async function generateComponentFromTemplate(
  implementationId: string, 
  templateType: string, 
  templateConfig: Record<string, any>
): Promise<void> {
  try {
    // TODO: Implementar engine de geração de template
    // Por enquanto, apenas log do que seria gerado
    await conditionalDebugLog('Gerando componente', {
      implementationId,
      templateType,
      templateConfig,
    });

    // Futura implementação:
    // 1. Ler template base do sistema de arquivos
    // 2. Processar configuração e gerar código React
    // 3. Salvar arquivo no local correto
    // 4. Atualizar component_path na implementação
    
  } catch (error) {
    console.error('Erro ao gerar componente:', error);
    // Não falhar a criação da implementação por erro de geração
  }
}

/**
 * Criar nova implementação de módulo
 */
export async function createModuleImplementation(input: CreateModuleImplementationInput): Promise<ActionResult<ModuleImplementation>> {
  try {
    console.debug('🔥 createModuleImplementation iniciado com input:', input);
    
    // Verificar modo de manutenção
    const { inMaintenance, message } = await checkMaintenanceMode();
    if (inMaintenance) {
      console.debug('🔥 Sistema em manutenção');
      return { success: false, error: message || 'Sistema em manutenção' };
    }

    // Verificar autenticação e permissões
    console.debug('🔥 Verificando autenticação...');
    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      console.debug('🔥 Usuário não autenticado');
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      console.debug('🔥 Usuário não é admin');
      return { success: false, error: 'Acesso negado. Apenas administradores podem criar implementações' };
    }
    
    console.debug('🔥 Autenticação OK, usuário:', user?.id);

    // Verificar se criação de novos módulos requer aprovação
    const requireApproval = await getConfigValue('requireApprovalForNewModules');
    if (requireApproval) {
      // Para implementações, verificar se é uma extensão de módulo existente
      await conditionalDebugLog('Verificando necessidade de aprovação para nova implementação', { 
        userId: user?.id, 
        requireApproval 
      });
    }

    // Debug log se habilitado
    await conditionalDebugLog('createModuleImplementation iniciado', { input, userId: user?.id });

    // Validar entrada
    console.debug('🔥 Validando entrada...');
    const validation = CreateModuleImplementationSchema.safeParse(input);
    if (!validation.success) {
      console.debug('🔥 Erro de validação:', validation.error.issues);
      return { 
        success: false, 
        error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}` 
      };
    }

    console.debug('🔥 Validação OK');
    const data = validation.data;
    const supabase = await createSupabaseServerClient();

    // Verificar se o base_module_id existe
    console.debug('🔥 Verificando se base_module_id existe:', data.base_module_id);
    const { data: baseModule, error: baseModuleError } = await supabase
      .from('base_modules')
      .select('id')
      .eq('id', data.base_module_id)
      .single();

    if (baseModuleError) {
      console.debug('🔥 Erro ao buscar base module:', baseModuleError);
    }

    if (!baseModule) {
      console.debug('🔥 Módulo base não encontrado');
      return { success: false, error: 'Módulo base não encontrado' };
    }
    
    console.debug('🔥 Base module encontrado:', baseModule);

    // Verificar se já existe uma implementação com a mesma chave para o mesmo módulo base
    const { data: existingImpl } = await supabase
      .from('module_implementations')
      .select('id')
      .eq('base_module_id', data.base_module_id)
      .eq('implementation_key', data.implementation_key)
      .single();

    if (existingImpl) {
      return { success: false, error: 'Já existe uma implementação com esta chave para este módulo base' };
    }

    // Verificar limite máximo de implementações por módulo
    const maxImplementations = await getConfigValue('maxImplementationsPerModule');
    const { count: currentCount } = await supabase
      .from('module_implementations')
      .select('id', { count: 'exact' })
      .eq('base_module_id', data.base_module_id)
      .is('deleted_at', null);

    if (currentCount && currentCount >= maxImplementations) {
      await conditionalDebugLog('Limite de implementações atingido', { 
        baseModuleId: data.base_module_id, 
        currentCount, 
        maxImplementations 
      });
      return { 
        success: false, 
        error: `Limite de ${maxImplementations} implementações por módulo atingido. Configure um limite maior nas configurações do sistema.` 
      };
    }

    // Se está marcando como padrão, desmarcar outras implementações padrão do mesmo módulo
    if (data.is_default) {
      await supabase
        .from('module_implementations')
        .update({ is_default: false })
        .eq('base_module_id', data.base_module_id);
    }

    // Criar registro da implementação
    const { data: newImpl, error: createError } = await supabase
      .from('module_implementations')
      .insert({
        base_module_id: data.base_module_id,
        implementation_key: data.implementation_key,
        name: data.name,
        description: data.description,
        version: data.version,
        component_type: data.component_type,
        template_type: data.template_type,
        template_config: data.template_config,
        component_path: data.component_path,
        dependencies: data.dependencies,
        config_schema_override: data.config_schema_override,
        audience: data.audience,
        complexity: data.complexity,
        priority: data.priority,
        status: data.status,
        is_default: data.is_default,
        created_by: user!.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Erro ao criar implementação:', createError);
      return { success: false, error: 'Erro interno ao criar implementação' };
    }

    // Gerar componente se for do tipo 'generated'
    if (newImpl.component_type === 'generated' && newImpl.template_type) {
      await generateComponentFromTemplate(newImpl.id, newImpl.template_type, newImpl.template_config);
    }

    // Aplicar configurações automáticas do sistema
    const { applySystemConfigurationsToNewEntity } = await import('./auto-config-applier');
    await applySystemConfigurationsToNewEntity('implementation', newImpl.id, newImpl);

    // Invalidar cache (consolidado)
    revalidateImplementationsPaths();

    // Log de auditoria condicional
    await conditionalAuditLog({
      actor_user_id: user!.id,
      action_type: 'CREATE_MODULE_IMPLEMENTATION',
      resource_type: 'module_implementation',
      resource_id: newImpl.id,
      details: {
        implementation_name: data.name,
        implementation_key: data.implementation_key,
        base_module_id: data.base_module_id,
        current_implementations_count: currentCount,
        max_allowed: maxImplementations,
      },
    });

    return {
      success: true,
      message: `Implementação "${data.name}" criada com sucesso`,
      data: newImpl,
    };

  } catch (error) {
    console.error('🔥 Erro em createModuleImplementation:', error);
    console.error('🔥 Stack trace:', error instanceof Error ? error.stack : 'No stack');
    return { success: false, error: 'Erro interno ao criar implementação' };
  }
}

/**
 * Atualizar implementação de módulo
 */
export async function updateModuleImplementation(input: UpdateModuleImplementationInput): Promise<ActionResult<ModuleImplementation>> {
  try {
    // Verificar autenticação e permissões
    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem editar implementações' };
    }

    // Validar entrada
    const validation = UpdateModuleImplementationSchema.safeParse(input);
    if (!validation.success) {
      return { 
        success: false, 
        error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}` 
      };
    }

    const { id, ...updateData } = validation.data;
    const supabase = await createSupabaseServerClient();

    // Verificar se implementação existe
    const { data: existingImpl } = await supabase
      .from('module_implementations')
      .select(`
        id,
        base_module_id,
        implementation_key,
        name,
        description,
        version,
        is_default,
        is_active,
        archived_at,
        deleted_at
      `)
      .eq('id', id)
      .single();

    if (!existingImpl) {
      return { success: false, error: 'Implementação não encontrada' };
    }

    // Verificar conflito de chave se houver mudança
    if (updateData.implementation_key && updateData.implementation_key !== existingImpl.implementation_key) {
      const { data: keyConflict } = await supabase
        .from('module_implementations')
        .select('id')
        .eq('base_module_id', existingImpl.base_module_id)
        .eq('implementation_key', updateData.implementation_key)
        .neq('id', id)
        .single();

      if (keyConflict) {
        return { success: false, error: 'Já existe outra implementação com esta chave para este módulo' };
      }
    }

    // Se está marcando como padrão, desmarcar outras implementações padrão do mesmo módulo
    if (updateData.is_default) {
      await supabase
        .from('module_implementations')
        .update({ is_default: false })
        .eq('base_module_id', existingImpl.base_module_id)
        .neq('id', id);
    }

    // Atualizar implementação
    const { data: updatedImpl, error: updateError } = await supabase
      .from('module_implementations')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar implementação:', updateError);
      return { success: false, error: 'Erro interno ao atualizar implementação' };
    }

    // Invalidar cache (consolidado)
    revalidateImplementationsPaths();

    // Log de auditoria
    await supabase.from('audit_logs').insert({
      user_id: user!.id,
      action: 'update_module_implementation',
      resource_type: 'module_implementation',
      resource_id: id,
      details: {
        updated_fields: Object.keys(updateData),
        implementation_key: updatedImpl.implementation_key,
      },
    });

    return {
      success: true,
      message: `Implementação "${updatedImpl.name}" atualizada com sucesso`,
      data: updatedImpl,
    };

  } catch (error) {
    console.error('Erro em updateModuleImplementation:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Excluir implementação de módulo
 */
export async function deleteModuleImplementation(implementationId: string): Promise<ActionResult> {
  try {
    // Verificar autenticação e permissões
    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem excluir implementações' };
    }

    const supabase = await createSupabaseServerClient();

    // Verificar se implementação existe
    const { data: existingImpl } = await supabase
      .from('module_implementations')
      .select('name, is_default, base_module_id')
      .eq('id', implementationId)
      .single();

    if (!existingImpl) {
      return { success: false, error: 'Implementação não encontrada' };
    }

    // Verificar se há assignments usando esta implementação
    const { data: assignments, count: assignCount } = await supabase
      .from('tenant_module_assignments')
      .select('id', { count: 'exact' })
      .eq('implementation_id', implementationId);

    if (assignCount && assignCount > 0) {
      return { 
        success: false, 
        error: `Não é possível excluir a implementação. Existem ${assignCount} assignments usando-a. Remova-os primeiro.` 
      };
    }

    // Soft-excluir implementação
    const { error: deleteError } = await supabase
      .from('module_implementations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', implementationId);

    if (deleteError) {
      console.error('Erro ao soft-excluir implementação:', deleteError);
      return { success: false, error: 'Erro interno ao soft-excluir implementação' };
    }

    // Se era a implementação padrão, marcar outra como padrão (se existir)
    if (existingImpl.is_default) {
      const { data: nextDefault } = await supabase
        .from('module_implementations')
        .select('id')
        .eq('base_module_id', existingImpl.base_module_id)
        .limit(1)
        .single();

      if (nextDefault) {
        await supabase
          .from('module_implementations')
          .update({ is_default: true })
          .eq('id', nextDefault.id);
      }
    }

    // Invalidar cache (consolidado)
    revalidateImplementationsPaths();

    // Log de auditoria
    await supabase.from('audit_logs').insert({
      user_id: user!.id,
      action: 'delete_module_implementation',
      resource_type: 'module_implementation',
      resource_id: implementationId,
      details: {
        implementation_name: existingImpl.name,
        was_default: existingImpl.is_default,
      },
    });

    return {
      success: true,
      message: `Implementação "${existingImpl.name}" excluída com sucesso`,
    };

  } catch (error) {
    console.error('Erro em deleteModuleImplementation:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Arquivar implementação de módulo (soft archive)
 */
export async function archiveModuleImplementation(implementationId: string): Promise<ActionResult> {
  try {
    // Verificar autenticação e permissões
    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem arquivar implementações' };
    }

    const supabase = await createSupabaseServerClient();

    // Verificar se implementação existe e não está soft-deletada
    const { data: existingImpl } = await supabase
      .from('module_implementations')
      .select('name, deleted_at')
      .eq('id', implementationId)
      .is('deleted_at', null)
      .single();

    if (!existingImpl) {
      return { success: false, error: 'Implementação não encontrada ou já soft-deletada' };
    }

    // Arquivar implementação
    const { error: archiveError } = await supabase
      .from('module_implementations')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', implementationId);

    if (archiveError) {
      console.error('Erro ao arquivar implementação:', archiveError);
      return { success: false, error: 'Erro interno ao arquivar implementação' };
    }

    // Invalidar cache (consolidado)
    revalidateImplementationsPaths();

    // Log de auditoria
    await supabase.from('audit_logs').insert({
      user_id: user!.id,
      action: 'archive_module_implementation',
      resource_type: 'module_implementation',
      resource_id: implementationId,
      details: {
        implementation_name: existingImpl.name,
      },
    });

    return {
      success: true,
      message: `Implementação "${existingImpl.name}" arquivada com sucesso`,
    };

  } catch (error) {
    console.error('Erro em archiveModuleImplementation:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Restaurar implementação de módulo (desarquivar ou desfazer soft delete)
 */
export async function restoreModuleImplementation(implementationId: string): Promise<ActionResult> {
  try {
    // Verificar autenticação e permissões
    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem restaurar implementações' };
    }

    const supabase = await createSupabaseServerClient();

    // Verificar se implementação existe (pode estar arquivada ou soft-deletada)
    const { data: existingImpl } = await supabase
      .from('module_implementations')
      .select('name, archived_at, deleted_at')
      .eq('id', implementationId)
      .single();

    if (!existingImpl) {
      return { success: false, error: 'Implementação não encontrada' };
    }

    if (existingImpl.archived_at === null && existingImpl.deleted_at === null) {
      return { success: false, error: 'Implementação já está ativa e não precisa ser restaurada' };
    }

    // Restaurar implementação
    const { error: restoreError } = await supabase
      .from('module_implementations')
      .update({ archived_at: null, deleted_at: null })
      .eq('id', implementationId);

    if (restoreError) {
      console.error('Erro ao restaurar implementação:', restoreError);
      return { success: false, error: 'Erro interno ao restaurar implementação' };
    }

    // Invalidar cache (consolidado)
    revalidateImplementationsPaths();

    // Log de auditoria
    await supabase.from('audit_logs').insert({
      user_id: user!.id,
      action: 'restore_module_implementation',
      resource_type: 'module_implementation',
      resource_id: implementationId,
      details: {
        implementation_name: existingImpl.name,
      },
    });

    return {
      success: true,
      message: `Implementação "${existingImpl.name}" restaurada com sucesso`,
    };

  } catch (error) {
    console.error('Erro em restoreModuleImplementation:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Excluir implementação de módulo permanentemente (hard delete)
 */
export async function purgeModuleImplementation(implementationId: string): Promise<ActionResult> {
  try {
    // Verificar autenticação e permissões
    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem excluir implementações permanentemente' };
    }

    const supabase = await createSupabaseServerClient();

    // Verificar se implementação existe e se está soft-deletada
    const { data: existingImpl } = await supabase
      .from('module_implementations')
      .select('name, deleted_at')
      .eq('id', implementationId)
      .single();

    if (!existingImpl) {
      return { success: false, error: 'Implementação não encontrada' };
    }

    if (existingImpl.deleted_at === null) {
      return { success: false, error: 'Implementação não está soft-deletada. Use a função de soft delete primeiro.' };
    }

    // Verificar se há assignments usando esta implementação (mesmo que soft-deletados)
    const { count: assignCount } = await supabase
      .from('tenant_module_assignments')
      .select('id', { count: 'exact' })
      .eq('implementation_id', implementationId);

    if (assignCount && assignCount > 0) {
      return { 
        success: false, 
        error: `Não é possível excluir permanentemente a implementação. Existem ${assignCount} assignments usando-a. Remova-os primeiro.` 
      };
    }

    // Excluir implementação permanentemente
    const { error: deleteError } = await supabase
      .from('module_implementations')
      .delete()
      .eq('id', implementationId);

    if (deleteError) {
      console.error('Erro ao excluir implementação permanentemente:', deleteError);
      return { success: false, error: 'Erro interno ao excluir implementação permanentemente' };
    }

    // Invalidar cache (consolidado)
    revalidateImplementationsPaths();

    // Log de auditoria
    await supabase.from('audit_logs').insert({
      user_id: user!.id,
      action: 'purge_module_implementation',
      resource_type: 'module_implementation',
      resource_id: implementationId,
      details: {
        implementation_name: existingImpl.name,
      },
    });

    return {
      success: true,
      message: `Implementação "${existingImpl.name}" excluída permanentemente com sucesso`,
    };

  } catch (error) {
    console.error('Erro em purgeModuleImplementation:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Excluir implementação de módulo permanentemente (hard delete)
 */
export async function deleteImplementation(implementationId: string): Promise<ActionResult> {
  try {
    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    if (!isAuthenticated || !isAdmin) {
      return { success: false, error: 'Acesso negado.' };
    }

    if (!implementationId) {
      return { success: false, error: 'ID da implementação é obrigatório.' };
    }

    const supabase = await createSupabaseServerClient();

    // Verificar se a implementação existe
    const { data: existingImpl, error: fetchError } = await supabase
      .from('module_implementations')
      .select('id, name')
      .eq('id', implementationId)
      .single();

    if (fetchError || !existingImpl) {
      return { success: false, error: 'Implementação não encontrada.' };
    }

    // Verificar se há assignments usando esta implementação
    const { count: assignCount } = await supabase
      .from('tenant_module_assignments')
      .select('id', { count: 'exact' })
      .eq('implementation_id', implementationId);

    if (assignCount && assignCount > 0) {
      return { 
        success: false, 
        error: `Não é possível excluir a implementação. Existem ${assignCount} assignments usando-a. Remova-os primeiro.` 
      };
    }

    // Excluir implementação permanentemente (hard delete)
    const { error: deleteError } = await supabase
      .from('module_implementations')
      .delete()
      .eq('id', implementationId);

    if (deleteError) {
      console.error('Erro ao excluir implementação:', deleteError);
      return { success: false, error: 'Erro interno ao excluir implementação.' };
    }

    revalidateImplementationsPaths();

    await supabase.from('audit_logs').insert({
      user_id: user!.id,
      action: 'delete_module_implementation',
      resource_type: 'module_implementation',
      resource_id: implementationId,
      details: { 
        implementation_name: existingImpl.name,
        action_performed: 'hard_delete'
      },
    });

    return { success: true, message: 'Implementação excluída com sucesso.' };
  } catch (error) {
    console.error('Erro inesperado em deleteImplementation:', error);
    return { success: false, error: 'Ocorreu um erro inesperado.' };
  }
}

