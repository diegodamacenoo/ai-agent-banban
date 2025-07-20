import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/core/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/shared/types/supabase';

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

    async function loadUser() {
      try {
        setLoading(true);
        setError(null);

        // Buscar usuário autenticado usando getUser() para maior segurança
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError) {
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
        console.error('Erro ao carregar usuário:', e);
        setError(e.message || 'Erro ao carregar dados do usuário');
      } finally {
        setLoading(false);
      }
    }

    // Carregar usuário inicial
    loadUser();

    // Inscrever para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await loadUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading, error };
} 
