import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/core/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/shared/types/supabase';
import { createLogger } from '@/shared/utils/logger';
import { DEBUG_MODULES } from '@/shared/utils/debug-config';

const logger = createLogger(DEBUG_MODULES.AUTH);

interface UseUserReturn {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let loadingTimeout: NodeJS.Timeout | null = null;

    async function loadUser() {
      try {
        setLoading(true);
        setError(null);

        // Buscar usuário autenticado usando getUser() para maior segurança
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError) {
          // Se for erro de sessão ausente, não é realmente um erro
          if (authError.message.includes('Auth session missing') || 
              authError.message.includes('session_not_found')) {
            logger.debug('Usuário não autenticado (sessão ausente)');
            setUser(null);
            setProfile(null);
            return;
          }
          throw authError;
        }

        if (!authUser) {
          setUser(null);
          setProfile(null);
          return;
        }

        setUser(authUser);

        // Buscar perfil do usuário
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        setProfile(userProfile);
      } catch (e: any) {
        logger.error('Erro ao carregar usuário:', e);
        setError(e.message || 'Erro ao carregar dados do usuário');
      } finally {
        setLoading(false);
      }
    }

    // Carregar usuário inicial com timeout para evitar loading infinito
    loadUser();
    
    // Timeout de segurança para evitar loading infinito
    loadingTimeout = setTimeout(() => {
      if (loading) {
        logger.warn('Loading do usuário demorou mais que 10 segundos, forçando parada');
        setLoading(false);
      }
    }, 10000);

    // Inscrever para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.debug('Auth state change:', event);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await loadUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    // Remover sincronização entre abas - cada aba é independente

    // Cleanup
    return () => {
      subscription.unsubscribe();
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, []);

  return { user, profile, loading, error };
} 
