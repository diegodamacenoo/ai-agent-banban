'use server';

import { createSupabaseServerClient } from '@/core/supabase/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminAccess } from './utils';
import { trackServerCall } from './call-tracker';
import { 
  conditionalAuditLog, 
  invalidateConfigCache, 
  getSystemConfig, 
  onDebugModeChanged 
} from './system-config-utils';

// ================================================
// SERVER ACTIONS - CONFIGURAÇÕES DO SISTEMA
// ================================================

export interface SystemSettings {
  autoArchiveAfterDays: number;
  maxImplementationsPerModule: number;
  requireApprovalForNewModules: boolean;
  enableModuleVersioning: boolean;
  defaultModuleLifecycle: string;
  enableAutoBackup: boolean;
  backupFrequency: string;
  retentionPeriodDays: number;
  enableAuditLog: boolean;
  notifyOnCriticalChanges: boolean;
  maintenanceMode: boolean;
  debugMode: boolean;
}

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Buscar configurações do sistema
 */
export async function getSystemSettings(): Promise<ActionResult<SystemSettings>> {
  try {
    trackServerCall('⚙️ SERVER: getSystemSettings');
    
    const { isAuthenticated, isAdmin } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem acessar configurações' };
    }

    const supabase = await createSupabaseServerClient();
    
    // Buscar configurações da tabela secrets
    const { data, error } = await supabase
      .from('secrets')
      .select('name, value')
      .like('name', 'system_settings%');

    if (error) {
      console.error('Erro ao buscar configurações:', error);
      // Retornar configurações padrão se não existir
      return {
        success: true,
        data: getDefaultSettings()
      };
    }

    // Converter array de secrets para objeto de configurações
    const settings = data?.reduce((acc, item) => {
      const key = item.name.replace('system_settings_', '');
      try {
        acc[key] = JSON.parse(item.value);
      } catch {
        acc[key] = item.value;
      }
      return acc;
    }, {} as any) || {};

    // Mesclar com defaults para garantir que todas as chaves existam
    const finalSettings = { ...getDefaultSettings(), ...settings };

    return {
      success: true,
      data: finalSettings
    };

  } catch (error) {
    console.error('Erro ao buscar configurações do sistema:', error);
    return { 
      success: false, 
      error: 'Erro interno do servidor ao buscar configurações' 
    };
  }
}

/**
 * Salvar configurações do sistema
 */
export async function saveSystemSettings(settings: SystemSettings): Promise<ActionResult> {
  try {
    trackServerCall('💾 SERVER: saveSystemSettings');
    
    const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem alterar configurações' };
    }

    // Buscar configuração anterior para detectar mudanças no modo manutenção e debug
    const previousConfig = await getSystemConfig();

    const supabase = await createSupabaseServerClient();

    // Preparar dados para inserção/atualização
    const settingsEntries = Object.entries(settings).map(([key, value]) => ({
      name: `system_settings_${key}`,
      value: JSON.stringify(value),
      updated_at: new Date().toISOString(),
      updated_by: user?.id
    }));

    // Usar upsert para inserir ou atualizar
    const { error } = await supabase
      .from('secrets')
      .upsert(settingsEntries, { onConflict: 'name' });

    if (error) {
      console.error('Erro ao salvar configurações:', error);
      return {
        success: false,
        error: 'Erro ao salvar configurações no banco de dados'
      };
    }

    // Preparar detalhes consolidados do audit log
    const auditDetails: any = {
      ...settings,
      timestamp: new Date().toISOString(),
      changedSettings: []
    };

    let hasSignificantChanges = false;

    // Verificar mudanças específicas importantes
    if (previousConfig.maintenanceMode !== settings.maintenanceMode) {
      auditDetails.changedSettings.push({
        setting: 'maintenanceMode',
        previousValue: previousConfig.maintenanceMode,
        newValue: settings.maintenanceMode
      });
      hasSignificantChanges = true;
    }

    if (previousConfig.debugMode !== settings.debugMode) {
      auditDetails.changedSettings.push({
        setting: 'debugMode',
        previousValue: previousConfig.debugMode,
        newValue: settings.debugMode
      });
      hasSignificantChanges = true;
      
      // Atualizar cache do debug síncrono se debugMode foi alterado
      try {
        await onDebugModeChanged();
      } catch (debugError) {
        console.warn('Erro ao atualizar cache de debug:', debugError);
      }
    }

    // Um único log consolidado em vez de múltiplos
    if (hasSignificantChanges) {
      try {
        await conditionalAuditLog({
          actor_user_id: user?.id || '',
          action_type: 'UPDATE_SYSTEM_SETTINGS',
          resource_type: 'system_settings',
          details: auditDetails,
          organization_id: undefined // Configurações são globais
        });
      } catch (auditError) {
        console.warn('Erro ao registrar audit log:', auditError);
        // Não falhar a operação por causa do audit log
      }
    }

    // Invalidar cache para que novas configurações sejam aplicadas imediatamente
    try {
      invalidateConfigCache();
    } catch (cacheError) {
      console.warn('Erro ao invalidar cache:', cacheError);
    }

    // Revalidar cache se necessário
    revalidatePath('/admin/modules/management');

    return {
      success: true,
      message: 'Configurações salvas com sucesso'
    };

  } catch (error) {
    console.error('Erro ao salvar configurações do sistema:', error);
    return { 
      success: false, 
      error: 'Erro interno do servidor ao salvar configurações' 
    };
  }
}

/**
 * Configurações padrão do sistema
 */
function getDefaultSettings(): SystemSettings {
  return {
    autoArchiveAfterDays: 90,
    maxImplementationsPerModule: 10,
    requireApprovalForNewModules: true,
    enableModuleVersioning: true,
    defaultModuleLifecycle: 'active',
    enableAutoBackup: true,
    backupFrequency: 'daily',
    retentionPeriodDays: 30,
    enableAuditLog: true,
    notifyOnCriticalChanges: true,
    maintenanceMode: false,
    debugMode: false
  };
}

/**
 * Obter uma configuração específica
 */
export async function getSystemSetting(key: keyof SystemSettings): Promise<ActionResult<any>> {
  try {
    const result = await getSystemSettings();
    
    if (!result.success) {
      return result;
    }

    return {
      success: true,
      data: result.data?.[key]
    };

  } catch (error) {
    console.error(`Erro ao buscar configuração ${key}:`, error);
    return { 
      success: false, 
      error: 'Erro interno do servidor' 
    };
  }
}