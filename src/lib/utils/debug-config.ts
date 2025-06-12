import { getLogger } from '@/lib/utils/logger';

// Módulos disponíveis para depuração
export const DEBUG_MODULES = {
  // Auth
  AUTH: 'auth',
  MFA: 'mfa',
  
  // API
  API_PROFILES: 'api:profiles',
  API_SETTINGS: 'api:settings',
  API_USER_MANAGEMENT: 'api:user-management',
  
  // UI
  UI_DASHBOARD: 'ui:dashboard',
  UI_SETTINGS: 'ui:settings',
  UI_LOGIN: 'ui:login',
  UI_AVATAR: 'ui:avatar',
  
  // Core
  MIDDLEWARE: 'middleware',
  USER_CONTEXT: 'user-context'
};

// Configurações globais de depuração
export const DEBUG_CONFIG = {
  // Ativa/desativa todos os logs
  enabled: process.env.NODE_ENV === 'development',
  
  // Nível de log (error, warn, info, debug, trace)
  level: 'debug' as const,
  
  // Configurações por módulo
  modules: {
    // Auth
    [DEBUG_MODULES.AUTH]: false,
    [DEBUG_MODULES.MFA]: false,
    
    // API
    [DEBUG_MODULES.API_PROFILES]: false,
    [DEBUG_MODULES.API_SETTINGS]: false, 
    [DEBUG_MODULES.API_USER_MANAGEMENT]: false,
    
    // UI
    [DEBUG_MODULES.UI_DASHBOARD]: false,
    [DEBUG_MODULES.UI_SETTINGS]: false,
    [DEBUG_MODULES.UI_LOGIN]: false,
    [DEBUG_MODULES.UI_AVATAR]: false,
    
    // Core
    [DEBUG_MODULES.MIDDLEWARE]: false,
    [DEBUG_MODULES.USER_CONTEXT]: false
  }
};

/**
 * Inicializa a configuração de depuração
 * Chame esta função no início da aplicação
 */
export function initializeDebugConfig() {
  if (typeof window === 'undefined') return;
  
  const logger = getLogger();
  
  // Configuração global
  logger.enable(DEBUG_CONFIG.enabled);
  logger.setLevel(DEBUG_CONFIG.level);
  
  // Configuração por módulo
  Object.entries(DEBUG_CONFIG.modules).forEach(([module, enabled]) => {
    logger.enableModule(module, enabled);
  });
  
  // Ativar armazenamento de logs no localStorage (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    logger.setTargets({ localStorage: true });
  }
}

/**
 * Ativa ou desativa um módulo específico
 */
export function toggleDebugModule(moduleName: string, enabled: boolean) {
  const logger = getLogger();
  logger.enableModule(moduleName, enabled);
}

/**
 * Ativa ou desativa todos os logs
 */
export function toggleDebug(enabled: boolean) {
  const logger = getLogger();
  logger.enable(enabled);
}

/**
 * Define o nível de log
 */
export function setDebugLevel(level: 'error' | 'warn' | 'info' | 'debug' | 'trace') {
  const logger = getLogger();
  logger.setLevel(level);
}

// Exporta os helpers para uso rápido em diferentes partes da aplicação
export const debug = {
  enable: toggleDebug,
  setLevel: setDebugLevel,
  toggleModule: toggleDebugModule,
  init: initializeDebugConfig
}; 