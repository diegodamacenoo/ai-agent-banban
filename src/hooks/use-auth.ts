'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/core/supabase/client';
import { createLogger } from '@/shared/utils/logger';
import { DEBUG_MODULES } from '@/shared/utils/debug-config';

const logger = createLogger(DEBUG_MODULES.AUTH);

/**
 * Hook simples para autenticação - cada aba é independente
 * Sem coordenação entre abas, sem broadcast channels
 */
export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      if (!mounted) return;

      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (!mounted) return;

        if (error) {
          // Ignorar erros normais de "não autenticado"
          if (error.message.includes('Auth session missing') || 
              error.message.includes('session_not_found')) {
            setUser(null);
            setError(null);
          } else {
            logger.error('Erro ao verificar autenticação:', error);
            setError(error.message);
            setUser(null);
          }
        } else {
          setUser(user);
          setError(null);
        }
        
        setLoading(false);
      } catch (err) {
        if (!mounted) return;
        
        logger.error('Erro ao verificar autenticação:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setUser(null);
        setLoading(false);
      }
    };

    // Verificação inicial
    checkAuth();

    // Escutar mudanças de autenticação do Supabase
    const supabase = createSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      logger.debug(`Evento de autenticação: ${event}`);
      
      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED':
          setUser(session?.user || null);
          setError(null);
          setLoading(false);
          break;
          
        case 'SIGNED_OUT':
          setUser(null);
          setError(null);
          setLoading(false);
          break;
          
        default:
          // Para outros eventos, revalidar
          checkAuth();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
  };

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    signOut
  };
}