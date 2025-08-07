'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/core/supabase/client';
import { createLogger } from '@/shared/utils/logger';
import { DEBUG_MODULES } from '@/shared/utils/debug-config';

const logger = createLogger(DEBUG_MODULES.AUTH);

interface SessionSyncOptions {
  onSessionChange?: (hasSession: boolean) => void;
  onSessionExpired?: () => void;
}

/**
 * Hook para sincronizar estado de sessão entre múltiplas abas
 * Monitora mudanças na sessão e coordena refresh de tokens
 */
export function useSessionSync(options: SessionSyncOptions = {}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let authChannel: BroadcastChannel | null = null;
    
    // Criar canal de comunicação entre abas
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      authChannel = new BroadcastChannel('session-sync');
    }

    const checkSession = async () => {
      if (!mounted) return;
      
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (!mounted) return;
        
        if (error) {
          // Ignorar erros de sessão ausente (normal quando não logado)
          if (error.message.includes('Auth session missing') || 
              error.message.includes('session_not_found')) {
            setIsAuthenticated(false);
            setError(null);
          } else {
            logger.error('Erro ao verificar sessão:', error);
            setError(error.message);
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(!!user);
          setError(null);
        }
        
        setIsLoading(false);
        
        // Notificar callback se fornecido
        if (options.onSessionChange) {
          options.onSessionChange(!!user);
        }
      } catch (err) {
        if (!mounted) return;
        
        logger.error('Erro ao verificar sessão:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    // Verificar sessão inicial
    checkSession();
    
    // Também verificar quando a aba ganha foco (útil após refresh)
    const handleFocus = () => {
      if (mounted) {
        logger.debug('Aba ganhou foco, verificando sessão...');
        checkSession();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handleFocus); // Para detecção de cache do navegador

    // Configurar listener do Supabase para mudanças de autenticação
    const supabase = createSupabaseBrowserClient();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      logger.debug(`Evento de autenticação: ${event}`);
      
      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED':
          setIsAuthenticated(true);
          setError(null);
          if (options.onSessionChange) {
            options.onSessionChange(true);
          }
          
          // Notificar outras abas
          if (authChannel) {
            authChannel.postMessage({ type: 'session-updated', hasSession: true });
          }
          break;
          
        case 'SIGNED_OUT':
          setIsAuthenticated(false);
          setError(null);
          if (options.onSessionChange) {
            options.onSessionChange(false);
          }
          if (options.onSessionExpired) {
            options.onSessionExpired();
          }
          
          // Notificar outras abas
          if (authChannel) {
            authChannel.postMessage({ type: 'session-updated', hasSession: false });
          }
          break;
          
        case 'PASSWORD_RECOVERY':
        case 'MFA_CHALLENGE_VERIFIED':
          // Revalidar sessão após esses eventos
          checkSession();
          break;
      }
    });

    // Configurar listener do BroadcastChannel
    if (authChannel) {
      authChannel.onmessage = (event) => {
        if (!mounted) return;
        
        const { type, hasSession } = event.data;
        
        if (type === 'session-updated') {
          logger.debug(`Sessão atualizada em outra aba: ${hasSession ? 'autenticado' : 'não autenticado'}`);
          
          // Revalidar nossa própria sessão
          checkSession();
        }
      };
    }

    // Verificar periodicamente se a sessão ainda é válida
    const intervalId = setInterval(() => {
      if (!mounted) return;
      checkSession();
    }, 30000); // A cada 30 segundos (mais frequente)

    return () => {
      mounted = false;
      
      // Limpar listeners
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
      
      if (authChannel) {
        authChannel.close();
      }
      
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handleFocus);
      
      clearInterval(intervalId);
    };
  }, []);

  return {
    isAuthenticated,
    isLoading,
    error,
    checkSession: async () => {
      setIsLoading(true);
      const supabase = createSupabaseBrowserClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setError(error?.message || null);
      setIsLoading(false);
      return !!user;
    }
  };
}