// ================================================
// CONDITIONAL DEBUG SYNC - Versão Síncrona
// ================================================
// Para middleware e funções síncronas que não podem usar await
// Arquivo separado para evitar conflito com 'use server'

// Cache para debugMode (usado pela versão síncrona)
let debugModeCache: { value: boolean; expiry: number } | null = null;
const DEBUG_CACHE_DURATION = 30 * 1000; // 30 segundos

/**
 * Helper para log de debug condicional (SYNC) - Para middleware e funções síncronas
 * 
 * LIMITAÇÕES:
 * - Usa cache do debugMode (pode ter atraso de até 30s para refletir mudanças)
 * - Não salva logs no banco (apenas console.debug)
 * - Para casos onde await não é possível (middleware, funções síncronas)
 */
export function conditionalDebugLogSync(message: string, data?: any) {
  // Verificar cache
  const now = Date.now();
  if (!debugModeCache || now > debugModeCache.expiry) {
    // Cache expirado ou não existe - assumir false por segurança
    // Note: Em um ambiente real, poderíamos usar uma abordagem mais sofisticada
    return;
  }
  
  if (debugModeCache.value) {
    console.debug(`[DEBUG-SYNC] ${message}`, data);
    // Note: Versão síncrona não salva no banco por limitação
  }
}

/**
 * Atualiza o cache interno (chamado pelas funções async do system-config-utils)
 */
export function updateDebugModeCache(value: boolean) {
  debugModeCache = {
    value,
    expiry: Date.now() + DEBUG_CACHE_DURATION
  };
}

/**
 * Obtém o status atual do cache (para debug)
 */
export function getDebugCacheStatus() {
  if (!debugModeCache) {
    return { status: 'not-initialized', value: null, expired: true };
  }
  
  const now = Date.now();
  const expired = now > debugModeCache.expiry;
  
  return {
    status: expired ? 'expired' : 'active',
    value: debugModeCache.value,
    expired,
    expiresIn: Math.max(0, debugModeCache.expiry - now)
  };
}