'use client';

import { createContext, useContext, useEffect } from 'react';
import { useSessionTracking } from '@/core/hooks/use-session-tracking';
import { createSupabaseBrowserClient } from '@/core/supabase/client';
import { createLogger } from '@/shared/utils/logger';
import { DEBUG_MODULES } from '@/shared/utils/debug-config';

const logger = createLogger(DEBUG_MODULES.AUTH);

interface SessionTrackingContextType {
  updateActivity: () => void;
  lastActivity: number;
}

const SessionTrackingContext = createContext<SessionTrackingContextType | null>(null);

interface SessionTrackingProviderProps {
  children: React.ReactNode;
  trackActivity?: boolean;
  updateInterval?: number;
  idleTimeout?: number;
}

export function SessionTrackingProvider({ 
  children, 
  trackActivity = true,
  updateInterval = 5,
  idleTimeout = 30
}: SessionTrackingProviderProps) {
  const supabase = createSupabaseBrowserClient();
  const sessionTracking = useSessionTracking({
    trackActivity,
    updateInterval,
    idleTimeout
  });

  // Verificar se o usuário está autenticado antes de iniciar o tracking
  useEffect(() => {
    const checkAuthAndStartTracking = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && trackActivity) {
          logger.debug('Usuário autenticado - iniciando tracking de sessão');
          sessionTracking.updateActivity();
        }
      } catch (error) {
        logger.error('Erro ao verificar autenticação para tracking:', error);
      }
    };

    checkAuthAndStartTracking();
  }, [supabase, trackActivity, sessionTracking]);

  return (
    <SessionTrackingContext.Provider value={sessionTracking}>
      {children}
    </SessionTrackingContext.Provider>
  );
}

export function useSessionTrackingContext(): SessionTrackingContextType {
  const context = useContext(SessionTrackingContext);
  if (!context) {
    throw new Error('useSessionTrackingContext deve ser usado dentro de SessionTrackingProvider');
  }
  return context;
}