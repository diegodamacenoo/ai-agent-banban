import { createLogger } from '@/shared/utils/logger';

// Módulos disponíveis para depuração
export const DEBUG_MODULES = {
  UI_SETTINGS: 'ui:settings',
  UI_ADMIN: 'ui:admin',
  UI_MONITORING: 'ui:monitoring',
  UI_WEBHOOKS: 'ui:webhooks',
  UI_MULTI_TENANT: 'ui:multi-tenant',
  USER_CONTEXT: 'context:user',
  ORG_CONTEXT: 'context:organization',
  AUTH: 'auth',
  API: 'api',
  SUPABASE: 'supabase',
  PERFORMANCE: 'performance',
  SECURITY: 'security',
  SYSTEM: 'system'
} as const;

// Configuração inicial do debug
export function initDebug() {
  if (typeof window === 'undefined') return;
  
  const logger = createLogger(DEBUG_MODULES.SYSTEM);
  
  // Configuração global
  logger.debug('Inicializando configuração de debug...');
  
  // Configurar módulos ativos
  const activeModules = Object.values(DEBUG_MODULES);
  logger.debug('Módulos disponíveis:', activeModules);
}

// Configurações globais de depuração
export const DEBUG_CONFIG = {
  // Ativa/desativa todos os logs
  enabled: process.env.NODE_ENV === 'development',
  
  // Nível de log (error, warn, info, debug, trace)
  level: 'debug' as const,
  
  // Configurações por módulo
  modules: {
    // Auth
    [DEBUG_MODULES.AUTH]: true,
    
    // API
    [DEBUG_MODULES.API]: false,
    
    // UI
    [DEBUG_MODULES.UI_SETTINGS]: false,
    [DEBUG_MODULES.UI_ADMIN]: false,
    [DEBUG_MODULES.UI_MONITORING]: false,
    [DEBUG_MODULES.UI_WEBHOOKS]: false,
    [DEBUG_MODULES.UI_MULTI_TENANT]: false,
    
    // Core
    [DEBUG_MODULES.USER_CONTEXT]: true,
    [DEBUG_MODULES.ORG_CONTEXT]: false,
    
    // Security
    [DEBUG_MODULES.SECURITY]: true,
    
    // System
    [DEBUG_MODULES.SYSTEM]: false,
    [DEBUG_MODULES.PERFORMANCE]: false,
    [DEBUG_MODULES.SUPABASE]: false
  }
};

/**
 * Inicializa a configuração de depuração
 * Chame esta função no início da aplicação
 */
export function initializeDebugConfig() {
  if (typeof window === 'undefined') return;
  
  const logger = createLogger(DEBUG_MODULES.SYSTEM);
  
  // Log de inicialização
  logger.debug('Debug config inicializada');
}

/**
 * Ativa ou desativa um módulo específico
 */
export function toggleDebugModule(moduleName: string, enabled: boolean) {
  const logger = createLogger(DEBUG_MODULES.SYSTEM);
  logger.debug(`Módulo ${moduleName} ${enabled ? 'ativado' : 'desativado'}`);
}

/**
 * Ativa ou desativa todos os logs
 */
export function toggleDebug(enabled: boolean) {
  const logger = createLogger(DEBUG_MODULES.SYSTEM);
  logger.debug(`Debug ${enabled ? 'ativado' : 'desativado'}`);
}

/**
 * Define o nível de log
 */
export function setDebugLevel(level: 'error' | 'warn' | 'info' | 'debug' | 'trace') {
  const logger = createLogger(DEBUG_MODULES.SYSTEM);
  logger.debug(`Nível de log definido para: ${level}`);
}

// Exporta os helpers para uso rápido em diferentes partes da aplicação
export const debug = {
  enable: toggleDebug,
  setLevel: setDebugLevel,
  toggleModule: toggleDebugModule,
  init: initializeDebugConfig
}; 
