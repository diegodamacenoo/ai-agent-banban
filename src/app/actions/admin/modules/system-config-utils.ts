'use server';

import { createSupabaseServerClient } from '@/core/supabase/server';
import { type SystemSettings } from './module-settings';

// Cache das configurações em memória para performance
let configCache: SystemSettings | null = null;
let cacheExpiry: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Buscar configurações com cache
 */
export async function getSystemConfig(): Promise<SystemSettings> {
  // Verificar cache
  if (configCache && Date.now() < cacheExpiry) {
    return configCache;
  }

  try {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('secrets')
      .select('name, value')
      .like('name', 'system_settings%');

    if (error) {
      console.warn('Erro ao buscar configurações, usando defaults:', error);
      return getDefaultConfig();
    }

    // Converter para objeto
    const settings = data?.reduce((acc, item) => {
      const key = item.name.replace('system_settings_', '');
      try {
        acc[key] = JSON.parse(item.value);
      } catch {
        acc[key] = item.value;
      }
      return acc;
    }, {} as any) || {};

    // Mesclar com defaults
    const finalSettings = { ...getDefaultConfig(), ...settings };

    // Atualizar cache
    configCache = finalSettings;
    cacheExpiry = Date.now() + CACHE_DURATION;

    return finalSettings;

  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return getDefaultConfig();
  }
}

/**
 * Configurações padrão
 */
function getDefaultConfig(): SystemSettings {
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
 * Invalidar cache (chamar quando configurações são atualizadas)
 */
export async function invalidateConfigCache() {
  configCache = null;
  cacheExpiry = 0;
}

/**
 * Verificar se audit log está habilitado
 */
export async function isAuditLogEnabled(): Promise<boolean> {
  const config = await getSystemConfig();
  return config.enableAuditLog;
}

/**
 * Verificar se sistema está em modo de manutenção
 */
export async function isMaintenanceMode(): Promise<boolean> {
  const config = await getSystemConfig();
  return config.maintenanceMode;
}

/**
 * Verificar se debug está habilitado
 */
export async function isDebugMode(): Promise<boolean> {
  const config = await getSystemConfig();
  return config.debugMode;
}

/**
 * Obter configuração específica
 */
export async function getConfigValue<K extends keyof SystemSettings>(
  key: K
): Promise<SystemSettings[K]> {
  const config = await getSystemConfig();
  return config[key];
}

/**
 * Helper para registrar audit log condicionalmente
 */
export async function conditionalAuditLog(
  data: {
    actor_user_id: string;
    action_type: string;
    resource_type: string;
    resource_id?: string;
    details?: any;
    organization_id?: string;
  }
) {
  try {
    // Verificar se audit log está habilitado
    const auditEnabled = await isAuditLogEnabled();
    
    if (!auditEnabled) {
      // Log apenas no console se desabilitado
      console.debug('Audit log desabilitado:', data.action_type);
      return;
    }

    const supabase = await createSupabaseServerClient();
    
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        actor_user_id: data.actor_user_id,
        action_type: data.action_type,
        resource_type: data.resource_type,
        resource_id: data.resource_id,
        details: data.details,
        organization_id: data.organization_id,
        ip_address: null, // TODO: capturar IP se necessário
      });

    if (error) {
      console.error('Erro ao registrar audit log:', error);
    }

  } catch (error) {
    console.error('Erro em conditionalAuditLog:', error);
  }
}

/**
 * Helper para log de debug condicional (ASYNC)
 */
export async function conditionalDebugLog(message: string, data?: any) {
  // Só fazer a consulta se estivermos em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[DEBUG] ${message}`, data);
  }
  
  // Remover persistência em DB que causa overhead desnecessário
  // A funcionalidade pode ser habilitada via flag específica se necessário
}

// Import da versão síncrona (arquivo separado para evitar conflito com 'use server')
import { updateDebugModeCache } from '@/shared/utils/conditional-debug-sync';

/**
 * Função para popular cache do debugMode (deve ser chamada periodicamente)
 * Pode ser chamada por um interval ou triggered por mudanças de configuração
 */
export async function refreshDebugModeCache() {
  try {
    const debugEnabled = await isDebugMode();
    updateDebugModeCache(debugEnabled);
  } catch (error) {
    console.warn('Erro ao atualizar cache do debug mode:', error);
    // Em caso de erro, assumir false por segurança
    updateDebugModeCache(false);
  }
}

/**
 * Inicializa o sistema de debug síncrono
 * Deve ser chamado na inicialização da aplicação
 */
export async function initializeSyncDebugSystem() {
  // Inicializar cache imediatamente
  await refreshDebugModeCache();
  
  // DESABILITADO: setInterval causa múltiplas requisições desnecessárias
  // Refresh será feito apenas quando necessário via onDebugModeChanged()
  
  // // Configurar refresh automático a cada 30 segundos
  // const DEBUG_CACHE_DURATION = 30 * 1000; // 30 segundos
  // setInterval(async () => {
  //   await refreshDebugModeCache();
  // }, DEBUG_CACHE_DURATION);
}

/**
 * Força atualização do cache quando configurações são alteradas
 * Deve ser chamado sempre que debugMode é modificado via interface admin
 */
export async function onDebugModeChanged() {
  await invalidateConfigCache(); // Limpa cache geral
  await refreshDebugModeCache();  // Atualiza cache do debug síncrono
}

/**
 * Middleware para verificar modo de manutenção
 */
export async function checkMaintenanceMode(): Promise<{ inMaintenance: boolean; message?: string }> {
  const maintenance = await isMaintenanceMode();
  
  if (maintenance) {
    return {
      inMaintenance: true,
      message: 'Sistema em modo de manutenção programada. Operações administrativas estão temporariamente indisponíveis para garantir melhorias no sistema. Tente novamente em alguns minutos.'
    };
  }
  
  return { inMaintenance: false };
}