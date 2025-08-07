'use client';

import { createBrowserClient } from '@supabase/ssr'
import { createLogger } from '@/shared/utils/logger'
import { DEBUG_MODULES } from '@/shared/utils/debug-config'

const logger = createLogger(DEBUG_MODULES.AUTH)

/**
 * Gerenciador de sessão SIMPLES - cada aba é independente
 * Sem coordenação entre abas, sem broadcast channels, sem complexidade
 */

// Configurações de timeout (em minutos)
export const SESSION_TIMEOUT = {
  IDLE: 30,          // Timeout por inatividade
  ABSOLUTE: 480,     // Timeout absoluto (8 horas)
  WARNING: 5,        // Aviso antes do timeout
  REFRESH: 25        // Intervalo de refresh do token
};

interface SessionState {
  lastActivity: number;
  sessionStart: number;
  warningShown: boolean;
}

let sessionState: SessionState = {
  lastActivity: Date.now(),
  sessionStart: Date.now(),
  warningShown: false
};

/**
 * Atualiza o timestamp da última atividade
 */
export function updateLastActivity() {
  sessionState.lastActivity = Date.now();
  sessionState.warningShown = false;
  logger.debug('Atividade do usuário atualizada');
}

/**
 * Verifica se a sessão expirou
 */
export async function checkSessionExpiration(): Promise<{
  expired: boolean;
  reason?: 'idle' | 'absolute';
  timeRemaining?: number;
}> {
  const now = Date.now();
  const idleTime = now - sessionState.lastActivity;
  const sessionDuration = now - sessionState.sessionStart;

  // Verificar timeout por inatividade
  if (idleTime >= SESSION_TIMEOUT.IDLE * 60 * 1000) {
    logger.warn('Sessão expirada por inatividade');
    return { expired: true, reason: 'idle' };
  }

  // Verificar timeout absoluto
  if (sessionDuration >= SESSION_TIMEOUT.ABSOLUTE * 60 * 1000) {
    logger.warn('Sessão expirada por tempo máximo');
    return { expired: true, reason: 'absolute' };
  }

  // Calcular tempo restante
  const idleRemaining = (SESSION_TIMEOUT.IDLE * 60 * 1000) - idleTime;
  const absoluteRemaining = (SESSION_TIMEOUT.ABSOLUTE * 60 * 1000) - sessionDuration;
  const timeRemaining = Math.min(idleRemaining, absoluteRemaining);

  return { 
    expired: false,
    timeRemaining
  };
}

/**
 * Verifica se deve mostrar aviso de expiração
 */
export async function shouldShowWarning(): Promise<boolean> {
  if (sessionState.warningShown) return false;

  const expirationCheck = await checkSessionExpiration();
  if (!expirationCheck.expired && 
      expirationCheck.timeRemaining && 
      expirationCheck.timeRemaining <= SESSION_TIMEOUT.WARNING * 60 * 1000) {
    sessionState.warningShown = true;
    return true;
  }

  return false;
}

/**
 * Atualiza o token de autenticação
 * SIMPLES: cada aba faz seu próprio refresh independentemente
 */
export async function refreshSession(): Promise<void> {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    logger.debug('Fazendo refresh da sessão...');
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      // Se o token já foi usado por outra aba, tudo bem - ignorar
      if (error.message.includes('refresh_token_already_used') || 
          error.message.includes('refresh_token_not_found')) {
        logger.debug('Token já foi atualizado (provavelmente por outra aba) - OK');
        return;
      }
      
      // Se não há sessão, também OK (usuário não está logado)
      if (error.message.includes('Auth session missing') || 
          error.message.includes('session_not_found')) {
        logger.debug('Não há sessão ativa - OK');
        return;
      }
      
      logger.error('Erro ao fazer refresh da sessão:', error);
      throw error;
    }

    if (data.session) {
      sessionState.lastActivity = Date.now();
      logger.debug('Sessão atualizada com sucesso');
    }
  } catch (error: any) {
    logger.error('Erro ao atualizar token:', error);
    throw error;
  }
}

/**
 * Encerra a sessão atual
 */
export async function terminateSession(reason: 'idle' | 'absolute' | 'user'): Promise<void> {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    await supabase.auth.signOut();
    
    // Resetar estado da sessão
    sessionState = {
      lastActivity: Date.now(),
      sessionStart: Date.now(),
      warningShown: false
    };

    logger.info(`Sessão encerrada. Motivo: ${reason}`);
  } catch (error) {
    logger.error('Erro ao encerrar sessão:', error);
    throw error;
  }
}

/**
 * Verifica o usuário atual
 */
export async function getCurrentUser() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      if (error.message.includes('Auth session missing') || error.message.includes('session_not_found')) {
        logger.debug('Usuário não autenticado');
        return { user: null, error: null };
      }
      
      logger.error('Erro ao verificar usuário:', error);
      return { user: null, error: error.message };
    }

    if (user) {
      updateLastActivity();
    }
    
    return { user, error: null };
  } catch (error: any) {
    logger.error('Erro ao verificar usuário:', error);
    return { user: null, error: error.message };
  }
}

/**
 * Inicializa o gerenciador de sessão
 */
export function initSessionManager() {
  if (typeof window === 'undefined') return;

  logger.debug('Inicializando gerenciador de sessão simples');

  // Atualizar atividade em eventos do usuário
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  events.forEach(event => {
    window.addEventListener(event, updateLastActivity);
  });

  // Verificar expiração periodicamente
  setInterval(async () => {
    try {
      const { user, error } = await getCurrentUser();
      
      if (!user || error) {
        logger.debug('Usuário não autenticado, pulando verificação');
        return;
      }

      const { expired, reason } = await checkSessionExpiration();
      if (expired) {
        await terminateSession(reason!);
        window.location.href = '/login?reason=session_expired';
      }
    } catch (error) {
      logger.debug('Erro na verificação de sessão:', error);
    }
  }, 30000); // A cada 30 segundos

  // Fazer refresh do token periodicamente
  setInterval(async () => {
    try {
      const { user, error } = await getCurrentUser();
      if (!user || error) {
        logger.debug('Sem usuário autenticado, pulando refresh');
        return;
      }
      
      await refreshSession();
    } catch (error) {
      logger.debug('Falha ao atualizar token:', error);
    }
  }, SESSION_TIMEOUT.REFRESH * 60 * 1000);
}