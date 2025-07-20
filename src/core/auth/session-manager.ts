import { createBrowserClient } from '@supabase/ssr'
import { createLogger } from '@/shared/utils/logger'
import { DEBUG_MODULES } from '@/shared/utils/debug-config'

const logger = createLogger(DEBUG_MODULES.AUTH)

// Configurações de timeout (em minutos)
export const SESSION_TIMEOUT = {
  IDLE: 30,          // Timeout por inatividade
  ABSOLUTE: 480,     // Timeout absoluto (8 horas)
  WARNING: 5,        // Aviso antes do timeout (5 minutos)
  REFRESH: 15        // Intervalo de refresh do token (15 minutos)
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

  // Calcular tempo restante (o menor entre idle e absolute)
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
 * Encerra a sessão atual
 */
export async function terminateSession(reason: 'idle' | 'absolute' | 'user'): Promise<void> {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut();
    
    // Limpar estado da sessão
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
 * Atualiza o token de autenticação
 */
export async function refreshSession(): Promise<void> {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      logger.error('Erro ao atualizar sessão:', error);
      throw error;
    }

    if (data.session) {
      sessionState.lastActivity = Date.now();
      logger.debug('Sessão atualizada com sucesso');
    }
  } catch (error) {
    logger.error('Erro ao atualizar token:', error);
    throw error;
  }
}

/**
 * Inicializa o gerenciador de sessão
 */
export function initSessionManager() {
  // Atualizar atividade em eventos do usuário
  if (typeof window !== 'undefined') {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, updateLastActivity);
    });

    // Verificar expiração periodicamente
    setInterval(async () => {
      const { expired, reason } = await checkSessionExpiration();
      if (expired) {
        await terminateSession(reason!);
        window.location.href = '/login?reason=session_expired';
      }
    }, 60 * 1000); // Verificar a cada minuto

    // Atualizar token periodicamente
    setInterval(async () => {
      try {
        await refreshSession();
      } catch (error) {
        logger.warn('Falha ao atualizar token:', error);
      }
    }, SESSION_TIMEOUT.REFRESH * 60 * 1000);
  }
}

/**
 * Verifica o usuário atual usando getUser() para maior segurança
 * @returns Promise<{user: User | null, error: string | null}>
 */
export async function getCurrentUser() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  try {
    // Usar getUser() ao invés de getSession() para maior segurança
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      logger.error('Erro ao verificar usuário:', error);
      return { user: null, error: error.message };
    }

    if (!user) {
      return { user: null, error: 'Usuário não autenticado' };
    }

    // Atualizar timestamp de atividade
    updateLastActivity();
    
    return { user, error: null };
  } catch (error: any) {
    logger.error('Erro ao verificar usuário:', error);
    return { user: null, error: error.message };
  }
} 
