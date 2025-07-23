'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminAccess } from './utils';
import { conditionalAuditLog, conditionalDebugLog, getConfigValue } from './system-config-utils';

// ================================================
// TIPOS
// ================================================

export interface ModuleBackup {
  id: string;
  implementation_id: string;
  backup_type: 'full' | 'incremental' | 'config_only';
  backup_data: any;
  file_path?: string;
  size_bytes: number;
  created_at: string;
  created_by: string;
  expires_at?: string;
  metadata?: {
    version?: string;
    description?: string;
    module_name?: string;
    implementation_name?: string;
    compressed?: boolean;
    encrypted?: boolean;
  };
}

export interface CreateBackupInput {
  implementation_id: string;
  backup_type: 'full' | 'incremental' | 'config_only';
  description?: string;
}

export interface RestoreBackupInput {
  backup_id: string;
  restore_type: 'full' | 'config_only';
}

interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ================================================
// FUNÇÕES DE BACKUP
// ================================================

/**
 * Criar backup de uma implementação de módulo
 */
export async function createModuleBackup(input: CreateBackupInput): Promise<ActionResult<ModuleBackup>> {
  try {
    // Verificar autenticação e permissões
    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem criar backups' };
    }

    await conditionalDebugLog('Iniciando criação de backup', { 
      implementation_id: input.implementation_id,
      backup_type: input.backup_type 
    });

    const supabase = await createSupabaseServerClient();

    // Buscar dados da implementação
    const { data: implementation, error: implError } = await supabase
      .from('module_implementations')
      .select(`
        *,
        base_module:base_modules(*)
      `)
      .eq('id', input.implementation_id)
      .single();

    if (implError || !implementation) {
      return { success: false, error: 'Implementação não encontrada' };
    }

    // Preparar dados do backup baseado no tipo
    let backupData: any = {};
    
    switch (input.backup_type) {
      case 'full':
        // Backup completo - implementação + configurações + assignments
        const { data: assignments } = await supabase
          .from('tenant_module_assignments')
          .select('*')
          .eq('implementation_id', input.implementation_id);

        backupData = {
          implementation: implementation,
          base_module: implementation.base_module,
          assignments: assignments || [],
          backup_timestamp: new Date().toISOString(),
          backup_version: '1.0'
        };
        break;

      case 'config_only':
        // Apenas configurações
        backupData = {
          implementation_config: {
            template_config: implementation.template_config,
            config_schema_override: implementation.config_schema_override,
            dependencies: implementation.dependencies,
            priority: implementation.priority,
            status: implementation.status,
            audience: implementation.audience,
            complexity: implementation.complexity
          },
          backup_timestamp: new Date().toISOString(),
          backup_version: '1.0'
        };
        break;

      case 'incremental':
        // Backup incremental - apenas mudanças desde último backup
        const { data: lastBackup } = await supabase
          .from('module_backups')
          .select('created_at, backup_data')
          .eq('implementation_id', input.implementation_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (lastBackup) {
          // Comparar com último backup e salvar apenas diferenças
          backupData = {
            changes_since: lastBackup.created_at,
            implementation_changes: implementation.updated_at > lastBackup.created_at ? implementation : null,
            backup_timestamp: new Date().toISOString(),
            backup_version: '1.0'
          };
        } else {
          // Se não há backup anterior, fazer backup completo
          return createModuleBackup({ ...input, backup_type: 'full' });
        }
        break;
    }

    // Calcular tamanho do backup
    const backupSize = new Blob([JSON.stringify(backupData)]).size;

    // Calcular data de expiração baseado na política de retenção
    const retentionDays = await getConfigValue('retentionPeriodDays');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + retentionDays);

    // Criar registro do backup
    const { data: backup, error: backupError } = await supabase
      .from('module_backups')
      .insert({
        implementation_id: input.implementation_id,
        backup_type: input.backup_type,
        backup_data: backupData,
        size_bytes: backupSize,
        created_by: user!.id,
        expires_at: expiresAt.toISOString(),
        metadata: {
          version: implementation.version,
          description: input.description,
          module_name: implementation.base_module.name,
          implementation_name: implementation.name,
          compressed: false, // TODO: Implementar compressão
          encrypted: false   // TODO: Implementar criptografia
        }
      })
      .select()
      .single();

    if (backupError) {
      console.error('Erro ao criar backup:', backupError);
      return { success: false, error: 'Erro ao salvar backup no banco de dados' };
    }

    // Atualizar última data de backup na implementação
    await supabase
      .from('module_implementations')
      .update({
        template_config: {
          ...implementation.template_config,
          lastBackup: new Date().toISOString(),
          lastBackupId: backup.id
        }
      })
      .eq('id', input.implementation_id);

    // Log de auditoria
    await conditionalAuditLog({
      actor_user_id: user!.id,
      action_type: 'CREATE_MODULE_BACKUP',
      resource_type: 'module_backup',
      resource_id: backup.id,
      details: {
        implementation_id: input.implementation_id,
        backup_type: input.backup_type,
        size_bytes: backupSize,
        expires_at: expiresAt.toISOString()
      }
    });

    revalidatePath('/admin/modules');

    return {
      success: true,
      data: backup,
      message: `Backup ${input.backup_type} criado com sucesso`
    };

  } catch (error) {
    console.error('Erro em createModuleBackup:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Listar backups de uma implementação
 */
export async function listModuleBackups(
  implementation_id: string,
  filters?: {
    backup_type?: 'full' | 'incremental' | 'config_only';
    include_expired?: boolean;
  }
): Promise<ActionResult<ModuleBackup[]>> {
  try {
    const { isAuthenticated, isAdmin } = await verifyAdminAccess();
    
    if (!isAuthenticated || !isAdmin) {
      return { success: false, error: 'Acesso negado' };
    }

    const supabase = await createSupabaseServerClient();

    let query = supabase
      .from('module_backups')
      .select('*')
      .eq('implementation_id', implementation_id)
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filters?.backup_type) {
      query = query.eq('backup_type', filters.backup_type);
    }

    if (!filters?.include_expired) {
      query = query.gte('expires_at', new Date().toISOString());
    }

    const { data: backups, error } = await query;

    if (error) {
      console.error('Erro ao listar backups:', error);
      return { success: false, error: 'Erro ao buscar backups' };
    }

    return {
      success: true,
      data: backups || []
    };

  } catch (error) {
    console.error('Erro em listModuleBackups:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Restaurar backup de módulo
 */
export async function restoreModuleBackup(input: RestoreBackupInput): Promise<ActionResult> {
  try {
    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    
    if (!isAuthenticated || !isAdmin) {
      return { success: false, error: 'Acesso negado' };
    }

    await conditionalDebugLog('Iniciando restauração de backup', { backup_id: input.backup_id });

    const supabase = await createSupabaseServerClient();

    // Buscar dados do backup
    const { data: backup, error: backupError } = await supabase
      .from('module_backups')
      .select('*')
      .eq('id', input.backup_id)
      .single();

    if (backupError || !backup) {
      return { success: false, error: 'Backup não encontrado' };
    }

    // Verificar se backup não expirou
    if (backup.expires_at && new Date(backup.expires_at) < new Date()) {
      return { success: false, error: 'Backup expirado. Não é possível restaurar' };
    }

    const backupData = backup.backup_data;

    // Executar restauração baseado no tipo
    switch (input.restore_type) {
      case 'full':
        if (backup.backup_type !== 'full') {
          return { success: false, error: 'Backup selecionado não é do tipo completo' };
        }

        // Restaurar implementação
        if (backupData.implementation) {
          const { error: updateError } = await supabase
            .from('module_implementations')
            .update({
              name: backupData.implementation.name,
              description: backupData.implementation.description,
              version: backupData.implementation.version,
              component_type: backupData.implementation.component_type,
              component_path: backupData.implementation.component_path,
              template_type: backupData.implementation.template_type,
              template_config: backupData.implementation.template_config,
              dependencies: backupData.implementation.dependencies,
              config_schema_override: backupData.implementation.config_schema_override,
              audience: backupData.implementation.audience,
              complexity: backupData.implementation.complexity,
              priority: backupData.implementation.priority,
              status: backupData.implementation.status,
              is_default: backupData.implementation.is_default,
              updated_at: new Date().toISOString()
            })
            .eq('id', backup.implementation_id);

          if (updateError) {
            console.error('Erro ao restaurar implementação:', updateError);
            return { success: false, error: 'Erro ao restaurar dados da implementação' };
          }
        }

        // Restaurar assignments se existirem
        if (backupData.assignments && backupData.assignments.length > 0) {
          // TODO: Implementar restauração de assignments com cuidado para não duplicar
          await conditionalDebugLog('Restauração de assignments não implementada ainda', {
            count: backupData.assignments.length
          });
        }
        break;

      case 'config_only':
        if (!backupData.implementation_config) {
          return { success: false, error: 'Backup não contém dados de configuração' };
        }

        // Restaurar apenas configurações
        const { error: configError } = await supabase
          .from('module_implementations')
          .update({
            template_config: backupData.implementation_config.template_config,
            config_schema_override: backupData.implementation_config.config_schema_override,
            dependencies: backupData.implementation_config.dependencies,
            priority: backupData.implementation_config.priority,
            status: backupData.implementation_config.status,
            audience: backupData.implementation_config.audience,
            complexity: backupData.implementation_config.complexity,
            updated_at: new Date().toISOString()
          })
          .eq('id', backup.implementation_id);

        if (configError) {
          console.error('Erro ao restaurar configurações:', configError);
          return { success: false, error: 'Erro ao restaurar configurações' };
        }
        break;
    }

    // Log de auditoria
    await conditionalAuditLog({
      actor_user_id: user!.id,
      action_type: 'RESTORE_MODULE_BACKUP',
      resource_type: 'module_backup',
      resource_id: backup.id,
      details: {
        implementation_id: backup.implementation_id,
        restore_type: input.restore_type,
        backup_created_at: backup.created_at
      }
    });

    revalidatePath('/admin/modules');

    return {
      success: true,
      message: `Backup restaurado com sucesso (${input.restore_type})`
    };

  } catch (error) {
    console.error('Erro em restoreModuleBackup:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Excluir backup
 */
export async function deleteModuleBackup(backup_id: string): Promise<ActionResult> {
  try {
    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    
    if (!isAuthenticated || !isAdmin) {
      return { success: false, error: 'Acesso negado' };
    }

    const supabase = await createSupabaseServerClient();

    // Buscar backup antes de excluir para log
    const { data: backup } = await supabase
      .from('module_backups')
      .select('implementation_id, backup_type, created_at')
      .eq('id', backup_id)
      .single();

    // Excluir backup
    const { error } = await supabase
      .from('module_backups')
      .delete()
      .eq('id', backup_id);

    if (error) {
      console.error('Erro ao excluir backup:', error);
      return { success: false, error: 'Erro ao excluir backup' };
    }

    // Log de auditoria
    if (backup) {
      await conditionalAuditLog({
        actor_user_id: user!.id,
        action_type: 'DELETE_MODULE_BACKUP',
        resource_type: 'module_backup',
        resource_id: backup_id,
        details: {
          implementation_id: backup.implementation_id,
          backup_type: backup.backup_type,
          created_at: backup.created_at
        }
      });
    }

    revalidatePath('/admin/modules');

    return {
      success: true,
      message: 'Backup excluído com sucesso'
    };

  } catch (error) {
    console.error('Erro em deleteModuleBackup:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Executar backup automático baseado no agendamento
 */
export async function executeScheduledBackups(): Promise<ActionResult<{ processed: number; errors: number }>> {
  try {
    const { isAuthenticated, isAdmin } = await verifyAdminAccess();
    
    if (!isAuthenticated || !isAdmin) {
      return { success: false, error: 'Acesso negado' };
    }

    const supabase = await createSupabaseServerClient();

    // Buscar implementações que precisam de backup
    const { data: implementations, error } = await supabase
      .from('module_implementations')
      .select('id, name, template_config')
      .not('template_config->backupSchedule', 'is', null)
      .lte('template_config->backupSchedule->nextBackup', new Date().toISOString());

    if (error) {
      console.error('Erro ao buscar implementações para backup:', error);
      return { success: false, error: 'Erro ao buscar implementações' };
    }

    let processed = 0;
    let errors = 0;

    // Processar cada implementação
    for (const impl of implementations || []) {
      try {
        // Criar backup automático
        const result = await createModuleBackup({
          implementation_id: impl.id,
          backup_type: 'full',
          description: 'Backup automático agendado'
        });

        if (result.success) {
          processed++;

          // Atualizar próxima data de backup
          const schedule = impl.template_config?.backupSchedule;
          if (schedule) {
            const nextBackup = calculateNextBackupDate(schedule.frequency);
            
            await supabase
              .from('module_implementations')
              .update({
                template_config: {
                  ...impl.template_config,
                  backupSchedule: {
                    ...schedule,
                    lastBackup: new Date().toISOString(),
                    nextBackup: nextBackup.toISOString()
                  }
                }
              })
              .eq('id', impl.id);
          }
        } else {
          errors++;
          console.error(`Erro ao criar backup para ${impl.name}:`, result.error);
        }
      } catch (error) {
        errors++;
        console.error(`Erro ao processar backup para ${impl.name}:`, error);
      }
    }

    await conditionalDebugLog('Backups agendados processados', { 
      total: implementations?.length || 0,
      processed,
      errors 
    });

    return {
      success: true,
      data: { processed, errors },
      message: `Processados ${processed} backups com ${errors} erros`
    };

  } catch (error) {
    console.error('Erro em executeScheduledBackups:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Limpar backups expirados
 */
export async function cleanupExpiredBackups(): Promise<ActionResult<{ deleted: number }>> {
  try {
    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    
    if (!isAuthenticated || !isAdmin) {
      return { success: false, error: 'Acesso negado' };
    }

    const supabase = await createSupabaseServerClient();

    // Buscar backups expirados
    const { data: expiredBackups, error: queryError } = await supabase
      .from('module_backups')
      .select('id')
      .lt('expires_at', new Date().toISOString());

    if (queryError) {
      console.error('Erro ao buscar backups expirados:', queryError);
      return { success: false, error: 'Erro ao buscar backups expirados' };
    }

    const expiredIds = expiredBackups?.map(b => b.id) || [];

    if (expiredIds.length === 0) {
      return {
        success: true,
        data: { deleted: 0 },
        message: 'Nenhum backup expirado encontrado'
      };
    }

    // Excluir backups expirados
    const { error: deleteError } = await supabase
      .from('module_backups')
      .delete()
      .in('id', expiredIds);

    if (deleteError) {
      console.error('Erro ao excluir backups expirados:', deleteError);
      return { success: false, error: 'Erro ao excluir backups expirados' };
    }

    // Log de auditoria
    await conditionalAuditLog({
      actor_user_id: user!.id,
      action_type: 'CLEANUP_EXPIRED_BACKUPS',
      resource_type: 'module_backup',
      details: {
        deleted_count: expiredIds.length,
        deleted_ids: expiredIds
      }
    });

    return {
      success: true,
      data: { deleted: expiredIds.length },
      message: `${expiredIds.length} backups expirados foram removidos`
    };

  } catch (error) {
    console.error('Erro em cleanupExpiredBackups:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

// ================================================
// FUNÇÕES AUXILIARES
// ================================================

/**
 * Calcular próxima data de backup baseado na frequência
 */
function calculateNextBackupDate(frequency: string): Date {
  const nextDate = new Date();
  
  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    default:
      nextDate.setDate(nextDate.getDate() + 7); // Default: weekly
  }
  
  return nextDate;
}