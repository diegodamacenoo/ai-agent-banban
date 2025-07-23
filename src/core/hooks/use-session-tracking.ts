'use client';

import { useEffect, useCallback, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/core/supabase/client';
import { createLogger } from '@/shared/utils/logger';
import { DEBUG_MODULES } from '@/shared/utils/debug-config';

const logger = createLogger(DEBUG_MODULES.AUTH);

interface SessionTrackingOptions {
  trackActivity?: boolean;
  updateInterval?: number; // em minutos
  idleTimeout?: number; // em minutos
}

const DEFAULT_OPTIONS: SessionTrackingOptions = {
  trackActivity: true,
  updateInterval: 5, // Atualizar a cada 5 minutos
  idleTimeout: 30 // Considerar inativo após 30 minutos
};

export function useSessionTracking(options: SessionTrackingOptions = {}) {
  const { trackActivity, updateInterval, idleTimeout } = { ...DEFAULT_OPTIONS, ...options };
  const supabase = createSupabaseBrowserClient();
  const lastActivityRef = useRef(Date.now());
  const intervalRef = useRef<NodeJS.Timeout>();
  const activityTimeoutRef = useRef<NodeJS.Timeout>();

  // Atualizar timestamp da última atividade
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Resetar timeout de inatividade
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    
    // Configurar novo timeout
    activityTimeoutRef.current = setTimeout(() => {
      logger.debug('Usuário inativo há mais de 30 minutos');
      // Aqui podemos implementar ações específicas para inatividade
    }, idleTimeout! * 60 * 1000);
  }, [idleTimeout]);

  // Atualizar sessão no servidor
  const updateSessionActivity = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fazer uma requisição para um endpoint que irá atualizar a sessão
      const response = await fetch('/api/session/update-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          last_activity: new Date(lastActivityRef.current).toISOString()
        })
      });

      if (!response.ok) {
        logger.warn('Falha ao atualizar atividade da sessão');
      } else {
        logger.debug('Atividade da sessão atualizada');
      }
    } catch (error) {
      logger.error('Erro ao atualizar atividade da sessão:', error);
    }
  }, [supabase]);

  // Configurar listeners de atividade
  useEffect(() => {
    if (!trackActivity) return;

    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    const throttledUpdateActivity = throttle(updateActivity, 1000); // Throttle de 1 segundo

    events.forEach(event => {
      document.addEventListener(event, throttledUpdateActivity, true);
    });

    // Configurar intervalo de atualização
    intervalRef.current = setInterval(updateSessionActivity, updateInterval! * 60 * 1000);

    // Atualizar atividade inicial
    updateActivity();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledUpdateActivity, true);
      });
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [trackActivity, updateActivity, updateSessionActivity, updateInterval]);

  // Monitorar mudanças na autenticação
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        logger.debug('Usuário logou - iniciando tracking de sessão');
        updateActivity();
      } else if (event === 'SIGNED_OUT') {
        logger.debug('Usuário deslogou - parando tracking de sessão');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (activityTimeoutRef.current) {
          clearTimeout(activityTimeoutRef.current);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, updateActivity]);

  return {
    updateActivity,
    lastActivity: lastActivityRef.current
  };
}

// Função helper para throttle
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}