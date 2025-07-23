import { createSupabaseBrowserClient } from './client';
import { SupabaseClient } from '@supabase/supabase-js';

interface UserWithProfile {
  user: any;
  profile: any;
  error: string | null;
}

/**
 * Helper robusto para obter usuário e perfil com retry e tratamento de erro
 */
export async function getUserWithProfile(): Promise<UserWithProfile> {
  const maxRetries = 3;
  let lastError: string | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const supabase = createSupabaseBrowserClient();
      
      // Primeiro, obter o usuário autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        lastError = `Auth error: ${userError.message}`;
        console.warn(`[getUserWithProfile] Attempt ${attempt} - ${lastError}`);
        
        // Se for erro de autenticação definitivo, parar
        if (userError.message.includes('Invalid JWT') || 
            userError.message.includes('Auth session missing')) {
          return { user: null, profile: null, error: lastError };
        }
        
        // Aguardar antes de tentar novamente
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
          continue;
        }
      }
      
      if (!user) {
        return { user: null, profile: null, error: 'Usuário não autenticado' };
      }
      
      // Agora buscar o perfil com tratamento de erro
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          console.warn(`[getUserWithProfile] Profile fetch error:`, profileError);
          
          // Se for erro 401, pode ser problema de RLS
          if (profileError.code === '401' || profileError.message.includes('401')) {
            // Tentar criar um perfil básico se não existir
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email,
                role: 'reader',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();
              
            if (!createError && newProfile) {
              return { user, profile: newProfile, error: null };
            }
          }
          
          // Retornar usuário mesmo sem perfil
          return { 
            user, 
            profile: null, 
            error: `Profile error: ${profileError.message}` 
          };
        }
        
        return { user, profile, error: null };
        
      } catch (profileErr: any) {
        console.warn(`[getUserWithProfile] Unexpected profile error:`, profileErr);
        // Retornar usuário mesmo com erro no perfil
        return { 
          user, 
          profile: null, 
          error: `Profile fetch failed: ${profileErr.message}` 
        };
      }
      
    } catch (err: any) {
      lastError = `Unexpected error: ${err.message}`;
      console.warn(`[getUserWithProfile] Attempt ${attempt} - ${lastError}`);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }
  }
  
  return { user: null, profile: null, error: lastError || 'Falha após múltiplas tentativas' };
}

/**
 * Helper para verificar se usuário tem organização
 */
export async function getUserOrganizationSafe(userId?: string): Promise<string | null> {
  try {
    const supabase = createSupabaseBrowserClient();
    
    // Se não passou userId, pegar do usuário atual
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      userId = user.id;
    }
    
    // Buscar organization_id com tratamento de erro
    const { data, error } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .maybeSingle(); // Usar maybeSingle para não dar erro se não encontrar
    
    if (error) {
      console.warn('[getUserOrganizationSafe] Error:', error);
      return null;
    }
    
    return data?.organization_id || null;
    
  } catch (err: any) {
    console.warn('[getUserOrganizationSafe] Unexpected error:', err);
    return null;
  }
}

/**
 * Helper para verificar autenticação sem erros
 */
export async function checkAuthSafe(): Promise<boolean> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}