import { createSupabaseBrowserClient } from '@/core/supabase/client';
import { createLogger } from '@/shared/utils/logger';
import { DEBUG_MODULES } from '@/shared/utils/debug-config';

const logger = createLogger(DEBUG_MODULES.AUTH);

// Lista de operaÃ§Ãµes que requerem MFA
export const CRITICAL_OPERATIONS = {
  DELETE_ORGANIZATION: 'delete_organization',
  UPDATE_BILLING: 'update_billing',
  CHANGE_PERMISSIONS: 'change_permissions',
  API_KEY_MANAGEMENT: 'api_key_management',
  SECURITY_SETTINGS: 'security_settings',
  BULK_USER_ACTIONS: 'bulk_user_actions',
  DATA_EXPORT: 'data_export'
} as const;

export type CriticalOperation = typeof CRITICAL_OPERATIONS[keyof typeof CRITICAL_OPERATIONS];

// Cache de verificaÃ§Ãµes MFA recentes (30 minutos)
const mfaVerificationCache = new Map<string, { timestamp: number, operations: Set<CriticalOperation> }>();
const MFA_CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

/**
 * Verifica se uma operaÃ§Ã£o requer MFA
 */
export function requiresMFA(operation: CriticalOperation): boolean {
  return Object.values(CRITICAL_OPERATIONS).includes(operation);
}

/**
 * Verifica se o usuÃ¡rio tem MFA ativo
 */
export async function hasMFAEnabled(): Promise<boolean> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.mfa.listFactors();
    
    if (error) {
      logger.error('Erro ao verificar status MFA:', error);
      return false;
    }

    return data.totp.some((factor: any) => factor.status === 'verified');
  } catch (error) {
    logger.error('Erro ao verificar MFA:', error);
    return false;
  }
}

/**
 * Verifica se uma operaÃ§Ã£o crÃ­tica foi recentemente autenticada com MFA
 */
export function isRecentlyVerified(userId: string, operation: CriticalOperation): boolean {
  const cached = mfaVerificationCache.get(userId);
  if (!cached) return false;

  const isExpired = Date.now() - cached.timestamp > MFA_CACHE_DURATION;
  if (isExpired) {
    mfaVerificationCache.delete(userId);
    return false;
  }

  return cached.operations.has(operation);
}

/**
 * Registra uma verificaÃ§Ã£o MFA bem-sucedida para uma operaÃ§Ã£o
 */
export function registerMFAVerification(userId: string, operation: CriticalOperation): void {
  const cached = mfaVerificationCache.get(userId);
  
  if (cached) {
    cached.operations.add(operation);
    cached.timestamp = Date.now();
  } else {
    mfaVerificationCache.set(userId, {
      timestamp: Date.now(),
      operations: new Set([operation])
    });
  }
}

/**
 * Limpa o cache de verificaÃ§Ãµes MFA para um usuÃ¡rio
 */
export function clearMFAVerification(userId: string): void {
  mfaVerificationCache.delete(userId);
}

/**
 * Verifica se o usuÃ¡rio pode executar uma operaÃ§Ã£o crÃ­tica
 */
export async function canPerformCriticalOperation(
  userId: string, 
  operation: CriticalOperation
): Promise<{ allowed: boolean, requiresVerification: boolean }> {
  try {
    // Verificar se a operaÃ§Ã£o requer MFA
    if (!requiresMFA(operation)) {
      return { allowed: true, requiresVerification: false };
    }

    // Verificar se o usuÃ¡rio tem MFA ativo
    const mfaEnabled = await hasMFAEnabled();
    if (!mfaEnabled) {
      logger.warn(`Tentativa de operaÃ§Ã£o crÃ­tica (${operation}) sem MFA ativo`);
      return { allowed: false, requiresVerification: false };
    }

    // Verificar cache de verificaÃ§Ãµes recentes
    if (isRecentlyVerified(userId, operation)) {
      return { allowed: true, requiresVerification: false };
    }

    // MFA necessÃ¡rio
    return { allowed: false, requiresVerification: true };
  } catch (error) {
    logger.error('Erro ao verificar permissÃ£o para operaÃ§Ã£o crÃ­tica:', error);
    return { allowed: false, requiresVerification: false };
  }
}

/**
 * Hook para verificar e registrar operaÃ§Ãµes crÃ­ticas
 */
export async function withCriticalOperation(
  userId: string,
  operation: CriticalOperation,
  action: () => Promise<any>
): Promise<{ success: boolean, error?: string, data?: any }> {
  try {
    const { allowed, requiresVerification } = await canPerformCriticalOperation(userId, operation);

    if (!allowed && !requiresVerification) {
      return { 
        success: false, 
        error: 'MFA nÃ£o estÃ¡ ativo. Configure a autenticaÃ§Ã£o de dois fatores para realizar esta operaÃ§Ã£o.' 
      };
    }

    if (requiresVerification) {
      return { 
        success: false, 
        error: 'MFA_REQUIRED',
        data: { operation } 
      };
    }

    // Executar a operaÃ§Ã£o
    const result = await action();
    return { success: true, data: result };
  } catch (error: any) {
    logger.error(`Erro ao executar operaÃ§Ã£o crÃ­tica (${operation}):`, error);
    return { 
      success: false, 
      error: error.message || 'Ocorreu um erro ao executar a operaÃ§Ã£o.' 
    };
  }
} 
