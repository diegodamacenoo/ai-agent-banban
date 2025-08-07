import { createBrowserClient } from '@supabase/ssr'
import { createLogger } from '@/shared/utils/logger'
import { DEBUG_MODULES } from '@/shared/utils/debug-config'

const logger = createLogger(DEBUG_MODULES.AUTH)

// Tipos para notificações de sessão
export interface SessionTerminationInfo {
  reason: 'admin_terminated' | 'idle' | 'absolute' | 'user';
  adminId?: string;
  adminName?: string;
  blockedUntil?: string;
  message?: string;
}

// Callbacks para eventos de sessão
interface SessionEventCallbacks {
  onSessionTerminated?: (info: SessionTerminationInfo) => void;
  onSessionBlocked?: (blockedUntil: string) => void;
}

let sessionEventCallbacks: SessionEventCallbacks = {}

// Configurações de timeout (em minutos)
export const SESSION_TIMEOUT = {
  IDLE: 30,          // Timeout por inatividade
  ABSOLUTE: 480,     // Timeout absoluto (8 horas)
  WARNING: 5,        // Aviso antes do timeout (5 minutos)
  REFRESH: 25        // Intervalo de refresh do token (25 minutos) - reduzir conflitos
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

// Mutex para evitar múltiplos refreshes simultâneos (global entre abas)
let refreshInProgress = false;
let refreshPromise: Promise<void> | null = null;

// BroadcastChannel para comunicação entre abas
let authChannel: BroadcastChannel | null = null;
let isMainTab = false;
let tabId: string | null = null;

// Inicializar BroadcastChannel se disponível
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  authChannel = new BroadcastChannel('auth-sync');
  // Gerar ID único para esta aba
  tabId = Math.random().toString(36).substring(2) + Date.now().toString(36);
}

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
 * Registra callbacks para eventos de sessão
 */
export function registerSessionEventCallbacks(callbacks: SessionEventCallbacks) {
  sessionEventCallbacks = { ...sessionEventCallbacks, ...callbacks };
}

/**
 * Verifica se o usuário está bloqueado temporariamente
 */
export async function checkUserBlocked(userId: string): Promise<{ blocked: boolean; blockedUntil?: string; message?: string }> {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('user_session_blocks')
      .select('blocked_until, reason')
      .eq('user_id', userId)
      .gte('blocked_until', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Erro ao verificar bloqueio:', error);
      return { blocked: false };
    }

    if (data) {
      return {
        blocked: true,
        blockedUntil: data.blocked_until,
        message: data.reason || 'Sua conta foi temporariamente bloqueada por motivos de segurança.'
      };
    }

    return { blocked: false };
  } catch (error) {
    logger.error('Erro ao verificar bloqueio do usuário:', error);
    return { blocked: false };
  }
}

/**
 * Verifica se a sessão foi encerrada por um admin
 * TEMPORARIAMENTE DESABILITADO - o sistema principal funciona via server action
 */
export async function checkAdminTermination(userId: string): Promise<SessionTerminationInfo | null> {
  // Funcionalidade desabilitada - o redirecionamento via server action já funciona
  logger.debug('checkAdminTermination desabilitado - usando redirecionamento via server action');
  return null;
}

/**
 * Encerra a sessão atual
 */
export async function terminateSession(reason: 'idle' | 'absolute' | 'user', info?: SessionTerminationInfo): Promise<void> {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Chamar callback se fornecido
    if (info && sessionEventCallbacks.onSessionTerminated) {
      sessionEventCallbacks.onSessionTerminated(info);
    }

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
 * Determina se esta aba deve ser a principal (responsável por refresh)
 */
function determineMainTab(): boolean {
  if (!authChannel || !tabId) return true;
  
  // Usar localStorage para coordenar qual aba é a principal
  const mainTabData = localStorage.getItem('auth-main-tab');
  
  if (!mainTabData) {
    // Não há aba principal, esta aba se torna a principal
    const tabData = { id: tabId, timestamp: Date.now() };
    localStorage.setItem('auth-main-tab', JSON.stringify(tabData));
    return true;
  }
  
  try {
    const { id: mainTabId, timestamp } = JSON.parse(mainTabData);
    const now = Date.now();
    
    // Se a aba principal está inativa há mais de 10 segundos, assumir controle
    if (now - timestamp > 10000) {
      const tabData = { id: tabId, timestamp: now };
      localStorage.setItem('auth-main-tab', JSON.stringify(tabData));
      logger.debug('Assumindo controle como aba principal (aba anterior inativa)');
      return true;
    }
    
    // Se esta é a aba principal registrada
    if (mainTabId === tabId) {
      // Atualizar timestamp para mostrar que ainda está ativa
      const tabData = { id: tabId, timestamp: now };
      localStorage.setItem('auth-main-tab', JSON.stringify(tabData));
      return true;
    }
    
    return false;
  } catch (e) {
    // Em caso de erro no parse, assumir controle
    const tabData = { id: tabId, timestamp: Date.now() };
    localStorage.setItem('auth-main-tab', JSON.stringify(tabData));
    return true;
  }
}

/**
 * Atualiza o token de autenticação com mutex para evitar conflitos
 * Sincronizado entre abas usando BroadcastChannel
 */
export async function refreshSession(): Promise<void> {
  // Se já existe um refresh em progresso, aguardar sua conclusão
  if (refreshInProgress && refreshPromise) {
    logger.debug('Refresh já em progresso, aguardando...');
    return refreshPromise;
  }

  // Verificar se esta aba deve fazer o refresh
  // Se não é a aba principal, verificar se ainda está ativa
  if (!isMainTab && authChannel) {
    const mainTabData = localStorage.getItem('auth-main-tab');
    if (mainTabData) {
      try {
        const { timestamp } = JSON.parse(mainTabData);
        const now = Date.now();
        
        // Se a aba principal está inativa há mais de 5 segundos, assumir controle
        if (now - timestamp > 5000) {
          logger.debug('Aba principal inativa, assumindo controle do refresh');
          isMainTab = true;
          const tabData = { id: tabId, timestamp: now };
          localStorage.setItem('auth-main-tab', JSON.stringify(tabData));
        } else {
          logger.debug('Não é a aba principal, aguardando refresh de outra aba');
          return;
        }
      } catch (e) {
        // Em caso de erro, assumir controle
        logger.debug('Erro ao verificar aba principal, assumindo controle');
        isMainTab = true;
        const tabData = { id: tabId, timestamp: Date.now() };
        localStorage.setItem('auth-main-tab', JSON.stringify(tabData));
      }
    } else {
      // Não há aba principal registrada, assumir controle
      logger.debug('Não há aba principal registrada, assumindo controle');
      isMainTab = true;
      const tabData = { id: tabId, timestamp: Date.now() };
      localStorage.setItem('auth-main-tab', JSON.stringify(tabData));
    }
  }

  // Marcar refresh como em progresso
  refreshInProgress = true;
  
  // Notificar outras abas que o refresh iniciou
  if (authChannel) {
    authChannel.postMessage({ type: 'refresh-started', tabId });
  }
  
  refreshPromise = (async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      logger.debug('Iniciando refresh da sessão...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        // Ignorar erros de token já usado ou não encontrado
        if (error.message.includes('refresh_token_already_used') || 
            error.message.includes('refresh_token_not_found')) {
          logger.debug('Token já foi atualizado por outro processo');
          // Notificar outras abas que o refresh foi completado
          if (authChannel) {
            authChannel.postMessage({ type: 'refresh-completed', tabId });
          }
          return;
        }
        
        // Ignorar erros de sessão ausente (normal quando encerrada pelo admin)
        if (error.message.includes('Auth session missing') || 
            error.message.includes('session_not_found') ||
            error.message.includes('no active session found')) {
          logger.debug('Sessão não existe mais (possivelmente encerrada)');
          // Notificar outras abas que a sessão foi encerrada
          if (authChannel) {
            authChannel.postMessage({ type: 'session-ended', tabId });
          }
          return;
        }
        
        logger.error('Erro ao atualizar sessão:', error);
        throw error;
      }

      if (data.session) {
        sessionState.lastActivity = Date.now();
        logger.debug('Sessão atualizada com sucesso');
        
        // Notificar outras abas que o refresh foi bem-sucedido
        if (authChannel) {
          authChannel.postMessage({ type: 'refresh-completed', session: data.session, tabId });
        }
      }
    } catch (error: any) {
      // Não logar erros de sessão ausente como erro (é esperado quando encerrada pelo admin)
      if (error.message?.includes('Auth session missing') || 
          error.message?.includes('session_not_found') ||
          error.message?.includes('no active session found')) {
        logger.debug('Sessão não existe mais durante refresh (esperado)');
        // Notificar outras abas que a sessão foi encerrada
        if (authChannel) {
          authChannel.postMessage({ type: 'session-ended', tabId });
        }
        return;
      }
      
      logger.error('Erro ao atualizar token:', error);
      
      // Notificar outras abas sobre o erro
      if (authChannel) {
        authChannel.postMessage({ type: 'refresh-error', error: error.message, tabId });
      }
      
      throw error;
    } finally {
      // Liberar mutex
      refreshInProgress = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Inicializa o gerenciador de sessão
 */
export function initSessionManager() {
  // Atualizar atividade em eventos do usuário
  if (typeof window !== 'undefined') {
    // Gerar ID único para esta aba se ainda não foi feito
    if (!tabId) {
      tabId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
    
    // Determinar se esta é a aba principal
    isMainTab = determineMainTab();
    logger.debug(`Inicializando session manager - Tab principal: ${isMainTab}, Tab ID: ${tabId}`);
    
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, updateLastActivity);
    });

    // Configurar listener para BroadcastChannel
    if (authChannel) {
      authChannel.onmessage = (event) => {
        const { type, session, error, tabId: senderTabId } = event.data;
        
        // Ignorar mensagens da própria aba
        if (senderTabId === tabId) return;
        
        switch (type) {
          case 'refresh-started':
            logger.debug('Refresh iniciado por outra aba');
            refreshInProgress = true;
            break;
            
          case 'refresh-completed':
            logger.debug('Refresh completado por outra aba');
            refreshInProgress = false;
            refreshPromise = null;
            if (session) {
              sessionState.lastActivity = Date.now();
            }
            break;
            
          case 'refresh-error':
            logger.debug('Erro no refresh em outra aba:', error);
            refreshInProgress = false;
            refreshPromise = null;
            break;
            
          case 'session-ended':
            logger.debug('Sessão encerrada detectada por outra aba');
            window.location.href = '/login?reason=session_ended';
            break;
            
          case 'tab-closed':
            // Se a aba principal foi fechada, esta aba pode se tornar a principal
            if (!isMainTab) {
              // Aguardar um momento para evitar race conditions
              setTimeout(() => {
                isMainTab = determineMainTab();
                logger.debug(`Verificando se deve assumir como aba principal: ${isMainTab}`);
              }, 100);
            }
            break;
            
          case 'heartbeat':
            // Heartbeat da aba principal para mostrar que está ativa
            if (!isMainTab) {
              logger.debug('Heartbeat recebido da aba principal');
            }
            break;
        }
      };
    }

    // Detectar quando a aba é fechada para notificar outras abas
    window.addEventListener('beforeunload', () => {
      if (authChannel) {
        authChannel.postMessage({ type: 'tab-closed', tabId });
        if (isMainTab) {
          localStorage.removeItem('auth-main-tab');
        }
      }
    });

    // Verificar se precisa reassumir controle após refresh da página
    setTimeout(() => {
      if (!isMainTab) {
        const newIsMainTab = determineMainTab();
        if (newIsMainTab !== isMainTab) {
          isMainTab = newIsMainTab;
          logger.debug(`Status de aba principal atualizado após inicialização: ${isMainTab}`);
        }
      }
    }, 1000);
    
    // Apenas a aba principal executa verificações periódicas
    if (isMainTab) {
      // Heartbeat para mostrar que a aba principal está ativa
      setInterval(() => {
        if (isMainTab && authChannel) {
          authChannel.postMessage({ type: 'heartbeat', tabId });
          // Atualizar timestamp no localStorage
          const tabData = { id: tabId, timestamp: Date.now() };
          localStorage.setItem('auth-main-tab', JSON.stringify(tabData));
        }
      }, 3000); // A cada 3 segundos (mais frequente)
      
      // Verificar expiração e terminação administrativa periodicamente
      setInterval(async () => {
        try {
          const { user, error } = await getCurrentUser();
          
          // Se não há usuário autenticado, pular verificação
          if (!user || error) {
            logger.debug('Usuário não autenticado, pulando verificação de sessão');
            return;
          }

          // Verificar se a sessão foi encerrada por um admin
          const adminTermination = await checkAdminTermination(user.id);
          if (adminTermination) {
            await terminateSession('user', adminTermination);
            
            // Notificar outras abas
            if (authChannel) {
              authChannel.postMessage({ type: 'session-ended', tabId });
            }
            
            window.location.href = '/login?reason=admin_terminated';
            return;
          }

          // Verificar expiração normal
          const { expired, reason } = await checkSessionExpiration();
          if (expired) {
            await terminateSession(reason!);
            
            // Notificar outras abas
            if (authChannel) {
              authChannel.postMessage({ type: 'session-ended', tabId });
            }
            
            window.location.href = '/login?reason=session_expired';
          }
        } catch (error) {
          logger.debug('Erro na verificação de sessão:', error);
        }
      }, 30 * 1000); // Verificar a cada 30 segundos para maior responsividade

      // Atualizar token periodicamente (apenas aba principal)
      setInterval(async () => {
        try {
          // Verificar se há usuário autenticado antes de tentar refresh
          const { user, error } = await getCurrentUser();
          if (!user || error) {
            logger.debug('Sem usuário autenticado, pulando refresh');
            return;
          }
          
          await refreshSession();
        } catch (error) {
          logger.debug('Falha ao atualizar token (esperado se sessão encerrada):', error);
        }
      }, SESSION_TIMEOUT.REFRESH * 60 * 1000);
    }
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
      // Se for erro de sessão ausente, não logar como erro (é normal quando não logado)
      if (error.message.includes('Auth session missing') || error.message.includes('session_not_found')) {
        logger.debug('Usuário não autenticado (sessão ausente)');
        return { user: null, error: null };
      }
      
      logger.error('Erro ao verificar usuário:', error);
      return { user: null, error: error.message };
    }

    if (!user) {
      logger.debug('Nenhum usuário autenticado');
      return { user: null, error: null };
    }

    // Atualizar timestamp de atividade
    updateLastActivity();
    
    return { user, error: null };
  } catch (error: any) {
    // Se for erro de sessão ausente, não logar como erro
    if (error.message?.includes('Auth session missing') || error.message?.includes('session_not_found')) {
      logger.debug('Usuário não autenticado (sessão ausente - catch)');
      return { user: null, error: null };
    }
    
    logger.error('Erro ao verificar usuário:', error);
    return { user: null, error: error.message };
  }
} 
