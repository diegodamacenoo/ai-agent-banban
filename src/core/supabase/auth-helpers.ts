import { createSupabaseBrowserClient } from './client';
import { useState } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Helper para getUser() com tratamento robusto de AuthRetryableFetchError
 */
export async function safeGetUser() {
  try {
    const supabase = createSupabaseBrowserClient();
    
    console.debug('ðŸ" Tentando obter usuário...');
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.warn('âš ï¸ Erro ao obter usuário:', error);
      return { user: null, error: error.message };
    }
    
    console.debug('âœ Usuário obtido:', data.user ? 'autenticado' : 'não autenticado');
    return { user: data.user, error: null };
    
  } catch (err: any) {
    console.warn('âš ï¸ Erro inesperado em getUser():', err);
    
    // Tratar especificamente AuthRetryableFetchError
    if (err.name === 'AuthRetryableFetchError' || err.message?.includes('Failed to fetch')) {
      return { 
        user: null, 
        error: 'Erro de conectividade com servidor de autenticação. Tentando novamente...' 
      };
    }
    
    return { 
      user: null, 
      error: err.message || 'Erro desconhecido ao verificar autenticação' 
    };
  }
}

/**
 * Helper para verificar se o usuário está autenticado
 */
export async function isUserAuthenticated(): Promise<boolean> {
  const { user } = await safeGetUser();
  return !!user;
}

/**
 * Helper para fazer getUser com retry automático
 * Usado quando precisamos de mais robustez na verificação de usuário
 */
export async function getUserWithRetry(maxRetries = 3, delay = 500, supabase?: SupabaseClient) {
  if (!supabase) {
    throw new Error('Cliente Supabase é obrigatório');
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.warn(`âš ï¸ Tentativa ${attempt}/${maxRetries} getUserWithRetry`);
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (!error && user) {
        console.warn(`âœ [AUTH RETRY] Sucesso na tentativa ${attempt} - User ID: ${user.id}`);
        return { user, error: null };
      }
      
      // Se for erro de autenticação específico, não fazer retry
      if (error && (
        error.message.includes('Invalid JWT') ||
        error.message.includes('Auth session missing') ||
        error.message.includes('No session')
      )) {
        console.warn(`âš ï¸ Erro de autenticação específico, sem retry: ${error.message}`);
        return { user: null, error };
      }
      
      // Para outros erros, fazer retry
      if (attempt < maxRetries) {
        console.warn(`âš ï¸ Erro na tentativa ${attempt}, aguardando ${delay}ms... Erro: ${error?.message || 'Desconhecido'}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return { user: null, error };
    } catch (error: any) {
      console.warn(`âš ï¸ Exception na tentativa ${attempt}:`, error.message || 'Erro desconhecido');
      
      if (attempt === maxRetries) {
        return { user: null, error: error.message || 'Erro inesperado' };
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Fallback (nunca deveria chegar aqui)
  return { user: null, error: 'Falha após todas as tentativas' };
}

/**
 * Helper para obter usuário com fallback para modo offline
 */
export async function getUserWithOfflineFallback() {
  try {
    // Primeira tentativa normal
    const supabase = createSupabaseBrowserClient();
    const result = await getUserWithRetry(3, 500, supabase);
    
    if (result.user || !result.error?.includes('conectividade')) {
      return result;
    }
    
    // Fallback: tentar obter dados do localStorage/sessionStorage
    console.debug('ðŸ" Tentando fallback offline...');
    
    const cachedSession = localStorage.getItem('sb-bopytcghbmuywfltmwhk-auth-token');
    if (cachedSession) {
      try {
        const sessionData = JSON.parse(cachedSession);
        if (sessionData.user && sessionData.expires_at > Date.now() / 1000) {
          console.debug('âœ Usuário obtido do cache offline');
          console.debug('âœ… UsuÃ¡rio obtido do cache offline');
          return { user: sessionData.user, error: null };
        }
      } catch (parseError) {
        console.warn('âš ï¸ Erro ao parsear sessÃ£o em cache:', parseError);
      }
    }
    
    return {
      user: null,
      error: 'Sem conectividade e sem dados em cache vÃ¡lidos'
    };
    
  } catch (error: any) {
    return {
      user: null,
      error: `Erro crÃ­tico: ${error.message}`
    };
  }
}

/**
 * Helper para detectar problemas de conectividade
 */
export async function checkSupabaseConnectivity(): Promise<{ connected: boolean; latency?: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    const supabase = createSupabaseBrowserClient();
    
    // Teste simples de conectividade
    const { error } = await supabase.from('profiles').select('count').limit(1);
    
    const latency = Date.now() - startTime;
    
    if (error && error.message.includes('Failed to fetch')) {
      return { connected: false, error: 'Falha de conectividade' };
    }
    
    return { connected: true, latency };
    
  } catch (error: any) {
    return { 
      connected: false, 
      latency: Date.now() - startTime,
      error: error.message 
    };
  }
}

/**
 * Hook React para usar autenticaÃ§Ã£o com tratamento de erro robusto
 */
export function useAuthWithRetry() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchUser = async (attempt = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createSupabaseBrowserClient();
      const result = await getUserWithRetry(3, 1000, supabase);
      
      if (result.user) {
        setUser(result.user);
        setRetryCount(0);
      } else {
        setError(result.error || 'Erro desconhecido');
        setRetryCount(attempt);
      }
    } catch (err: any) {
      setError(err.message || 'Erro crítico');
      setRetryCount(attempt);
    } finally {
      setLoading(false);
    }
  };

  const retry = () => {
    fetchUser(retryCount + 1);
  };

  return {
    user,
    loading,
    error,
    retry,
    retryCount
  };
}

/**
 * Helper para fazer signInWithPassword com retry automÃ¡tico
 * Usado quando precisamos de mais robustez no login
 */
export async function signInWithPasswordWithRetry(
  supabase: SupabaseClient, 
  email: string, 
  password: string, 
  maxRetries = 3, 
  delay = 500
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.warn(`âš ï¸ [LOGIN RETRY] Tentativa ${attempt}/${maxRetries} para ${email}`);
      const result = await supabase.auth.signInWithPassword({ email, password });
      
      if (!result.error) {
        console.warn(`âœ… [LOGIN RETRY] Sucesso na tentativa ${attempt}`);
        return result;
      }
      
      // Se for erro de credenciais, nÃ£o fazer retry
      if (result.error.message.includes('Invalid login credentials') || 
          result.error.message.includes('Email not confirmed')) {
        return result;
      }
      
      // Para outros erros, fazer retry
      if (attempt < maxRetries) {
        console.warn(`âš ï¸ [LOGIN RETRY] Erro na tentativa ${attempt}, aguardando ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      return result; // Retorna o Ãºltimo resultado se todas as tentativas falharam
    } catch (error) {
      console.warn(`âš ï¸ [LOGIN RETRY] Exception na tentativa ${attempt}:`, error);
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
} 
