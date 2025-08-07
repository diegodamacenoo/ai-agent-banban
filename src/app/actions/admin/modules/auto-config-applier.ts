'use server';

import { getSystemConfig, conditionalDebugLog } from './system-config-utils';
import { createSupabaseServerClient } from '@/core/supabase/server';

/**
 * Aplicar configurações automaticamente para novas implementações/assignments
 */
export async function applySystemConfigurationsToNewEntity(
  entityType: 'implementation' | 'assignment' | 'base_module',
  entityId: string,
  entityData: any
) {
  try {
    const config = await getSystemConfig();
    const supabase = await createSupabaseServerClient();

    // Aplicar configurações específicas baseadas no tipo de entidade
    switch (entityType) {
      case 'implementation':
        await applyImplementationConfigurations(config, entityId, entityData);
        break;
        
      case 'assignment':
        await applyAssignmentConfigurations(config, entityId, entityData);
        break;
        
      case 'base_module':
        await applyBaseModuleConfigurations(config, entityId, entityData);
        break;
    }

  } catch (error) {
    console.error('Erro ao aplicar configurações automáticas:', error);
    // Não falhar a operação principal por causa da aplicação de configurações
  }
}

/**
 * Aplicar configurações para implementações
 */
async function applyImplementationConfigurations(
  config: any,
  implementationId: string,
  implementationData: any
) {
  const supabase = await createSupabaseServerClient();

  // Se versionamento está habilitado e usuário optou por automático
  if (config.enableModuleVersioning && (implementationData.__useAutoVersion || !implementationData.version)) {
    await supabase
      .from('module_implementations')
      .update({ version: '1.0.0' })
      .eq('id', implementationId);
      
    await conditionalDebugLog('Versão automática aplicada para implementação', { 
      implementationId, 
      version: '1.0.0',
      userChoice: !!implementationData.__useAutoVersion 
    });
  }

  // Aplicar status do lifecycle padrão se usuário optou por automático
  if (config.defaultModuleLifecycle && (implementationData.__useAutoStatus || !implementationData.status)) {
    await supabase
      .from('module_implementations')
      .update({ status: config.defaultModuleLifecycle })
      .eq('id', implementationId);
      
    await conditionalDebugLog('Status automático aplicado para implementação', { 
      implementationId, 
      status: config.defaultModuleLifecycle,
      userChoice: !!implementationData.__useAutoStatus 
    });
  }

  // Se backup automático está habilitado, agendar backup
  if (config.enableAutoBackup) {
    await scheduleBackupForImplementation(implementationId, config.backupFrequency);
  }
}

/**
 * Aplicar configurações para atribuições
 */
async function applyAssignmentConfigurations(
  config: any,
  assignmentKey: string,
  assignmentData: any
) {
  const supabase = await createSupabaseServerClient();

  // Se notificações críticas estão habilitadas, configurar alertas
  if (config.notifyOnCriticalChanges) {
    await setupNotificationsForAssignment(assignmentKey, assignmentData);
  }

  // Se aprovação é necessária para novos módulos, marcar para aprovação
  if (config.requireApprovalForNewModules) {
    // Para assignments, verificar se é um módulo novo para o tenant
    const [tenantId, baseModuleId] = assignmentKey.split('|');
    
    const { count: existingAssignments } = await supabase
      .from('tenant_module_assignments')
      .select('tenant_id', { count: 'exact' })
      .eq('tenant_id', tenantId);

    // Se é o primeiro módulo do tenant, pode precisar de aprovação especial
    if (existingAssignments === 0) {
      await createApprovalRequest(tenantId, baseModuleId, 'FIRST_MODULE_ASSIGNMENT');
    }
  }

  // Aplicar configurações de retenção
  if (config.retentionPeriodDays > 0) {
    await setRetentionPolicyForAssignment(assignmentKey, config.retentionPeriodDays);
  }
}

/**
 * Aplicar configurações para módulos base
 */
async function applyBaseModuleConfigurations(
  config: any,
  moduleId: string,
  moduleData: any
) {
  const supabase = await createSupabaseServerClient();

  // Se auto-arquivamento está configurado, agendar
  if (config.autoArchiveAfterDays > 0) {
    const archiveDate = new Date();
    archiveDate.setDate(archiveDate.getDate() + config.autoArchiveAfterDays);
    
    // Salvar metadata para job futuro de arquivamento
    await supabase
      .from('base_modules')
      .update({ 
        status: config.defaultModuleLifecycle,
        tags: moduleData.tags ? [
          ...moduleData.tags, 
          `auto-archive:${archiveDate.toISOString().split('T')[0]}`
        ] : [`auto-archive:${archiveDate.toISOString().split('T')[0]}`]
      })
      .eq('id', moduleId);

    await conditionalDebugLog(`Auto-arquivamento configurado para módulo`, { 
      moduleId, 
      archiveDate: archiveDate.toISOString(),
      daysFromNow: config.autoArchiveAfterDays 
    });
  }

  // Aplicar versionamento se habilitado e usuário optou por automático
  if (config.enableModuleVersioning && (moduleData.__useAutoVersion || !moduleData.version)) {
    await supabase
      .from('base_modules')
      .update({ version: '1.0.0' })
      .eq('id', moduleId);
      
    await conditionalDebugLog('Versão automática aplicada para módulo base', { 
      moduleId, 
      version: '1.0.0',
      userChoice: !!moduleData.__useAutoVersion 
    });
  }
}

/**
 * Helper para agendar backup
 */
async function scheduleBackupForImplementation(implementationId: string, frequency: string) {
  try {
    const supabase = await createSupabaseServerClient();

    // Calcular próxima data de backup baseado na frequência
    const nextBackupDate = new Date();
    switch (frequency) {
      case 'daily':
        nextBackupDate.setDate(nextBackupDate.getDate() + 1);
        break;
      case 'weekly':
        nextBackupDate.setDate(nextBackupDate.getDate() + 7);
        break;
      case 'monthly':
        nextBackupDate.setMonth(nextBackupDate.getMonth() + 1);
        break;
      default:
        nextBackupDate.setDate(nextBackupDate.getDate() + 7); // Default: weekly
    }

    // Salvar configuração de backup como metadata na implementação
    await supabase
      .from('module_implementations')
      .update({
        template_config: {
          backupSchedule: {
            enabled: true,
            frequency,
            nextBackup: nextBackupDate.toISOString(),
            configuredAt: new Date().toISOString()
          }
        }
      })
      .eq('id', implementationId);

    await conditionalDebugLog(`Backup ${frequency} agendado para implementação`, { 
      implementationId, 
      nextBackup: nextBackupDate.toISOString() 
    });
  } catch (error) {
    console.error('Erro ao agendar backup:', error);
  }
}

/**
 * Helper para configurar notificações
 */
async function setupNotificationsForAssignment(assignmentKey: string, assignmentData: any) {
  try {
    const supabase = await createSupabaseServerClient();
    const [tenantId, baseModuleId] = assignmentKey.split('|');

    // Buscar admins da organização para notificar
    const { data: orgAdmins } = await supabase
      .from('profiles')
      .select('user_id, email')
      .eq('organization_id', tenantId)
      .eq('role', 'admin');

    if (orgAdmins && orgAdmins.length > 0) {
      // Criar notificações no sistema
      const notifications = orgAdmins.map(admin => ({
        user_id: admin.user_id,
        title: 'Novo módulo atribuído',
        message: `Um novo módulo foi atribuído à sua organização e está pronto para uso.`,
        type: 'module_activation',
        metadata: {
          assignment_key: assignmentKey,
          tenant_id: tenantId,
          base_module_id: baseModuleId,
          auto_generated: true
        },
        read: false,
        created_at: new Date().toISOString()
      }));

      await supabase
        .from('notifications')
        .insert(notifications);

      await conditionalDebugLog(`Notificações criadas para ${orgAdmins.length} admins`, { assignmentKey });
    }
  } catch (error) {
    console.error('Erro ao configurar notificações:', error);
    // Não falhar a operação principal por causa de erro de notificação
  }
}

/**
 * Helper para criar solicitação de aprovação
 */
async function createApprovalRequest(tenantId: string, moduleId: string, type: string) {
  const supabase = await createSupabaseServerClient();
  
  try {
    await supabase
      .from('module_approval_requests')
      .insert({
        organization_id: tenantId,
        module_id: moduleId,
        requested_by: null, // Sistema automático
        request_reason: `Aprovação automática necessária: ${type}`,
        request_metadata: { 
          auto_generated: true, 
          type,
          created_by_system: true 
        },
        status: 'PENDING'
      });
  } catch (error) {
    console.error('Erro ao criar solicitação de aprovação:', error);
  }
}

/**
 * Helper para configurar política de retenção
 */
async function setRetentionPolicyForAssignment(assignmentKey: string, retentionDays: number) {
  try {
    const supabase = await createSupabaseServerClient();
    const [tenantId, baseModuleId] = assignmentKey.split('|');

    // Criar uma entrada na tabela de políticas de retenção (ou metadata)
    // Por enquanto, salvar como metadata na tabela de assignments
    await supabase
      .from('tenant_module_assignments')
      .update({
        custom_config: { 
          retentionPolicy: {
            enabled: true,
            retentionDays,
            configuredAt: new Date().toISOString()
          }
        }
      })
      .eq('tenant_id', tenantId)
      .eq('base_module_id', baseModuleId);

    await conditionalDebugLog(`Política de retenção de ${retentionDays} dias configurada`, { assignmentKey });
  } catch (error) {
    console.error('Erro ao configurar política de retenção:', error);
  }
}

/**
 * Verificar se entidade deve ser criada baseado nas configurações
 */
export async function shouldCreateEntity(
  entityType: 'implementation' | 'assignment' | 'base_module',
  entityData: any,
  userId: string
): Promise<{ allowed: boolean; reason?: string; requiresApproval?: boolean }> {
  try {
    const config = await getSystemConfig();

    // Verificar se modo de manutenção bloqueia criação
    if (config.maintenanceMode) {
      return { 
        allowed: false, 
        reason: 'Sistema em modo de manutenção. Criação de novas entidades está temporariamente bloqueada.' 
      };
    }

    // Verificar se requer aprovação
    if (config.requireApprovalForNewModules && entityType !== 'assignment') {
      return { 
        allowed: true, 
        requiresApproval: true,
        reason: 'Entidade será criada, mas requer aprovação antes de ficar ativa.' 
      };
    }

    return { allowed: true };

  } catch (error) {
    console.error('Erro ao verificar se entidade deve ser criada:', error);
    // Em caso de erro, permitir criação para não bloquear operações
    return { allowed: true };
  }
}