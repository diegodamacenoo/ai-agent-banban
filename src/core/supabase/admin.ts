import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from './server';
import { createServerClient as _createServerClient, type CookieOptions } from '@supabase/ssr';

// Renomeando para evitar conflito com a função exportada
const createServerClient = _createServerClient;

// Valida se as variáveis de ambiente necessárias estão definidas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseServiceRoleKey) {
  throw new Error("Missing env.SUPABASE_SERVICE_ROLE_KEY");
}

/**
 * Verifica se o usuário atual tem permissões de master admin
 */
async function verifyMasterAdminPermissions(): Promise<{ authorized: boolean; userId?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { authorized: false };
    }

    // 1) Verificar role no JWT primeiro (mais performático)
    const roleFromJWT = user.app_metadata?.user_role;
    if (roleFromJWT === 'master_admin') {
      return { authorized: true, userId: user.id };
    }

    // 2) Fallback: consultar role na tabela profiles
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // Importa a função mesmo estando abaixo no arquivo, pois já estará inicializada em tempo de execução
      const adminSupabase = createUnsafeSupabaseAdminClient();
      const adminResult = await adminSupabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      profile = adminResult.data;
      profileError = adminResult.error;
    }

    if (profileError || !profile) {
      console.warn('Não foi possível obter role do usuário na tabela profiles:', profileError?.message);
      return { authorized: false };
    }

    return { authorized: profile.role === 'master_admin', userId: user.id };
  } catch (error) {
    console.error('Erro ao verificar permissões admin:', error);
    return { authorized: false };
  }
}

/**
 * Cria um cliente Supabase com privilégios de administrador APENAS para operações específicas.
 * Este cliente deve ser usado APENAS para operações que realmente precisam ignorar RLS.
 * 
 * IMPORTANTE: Este cliente verifica automaticamente se o usuário tem permissões de master_admin.
 */
export const createSupabaseAdminClient = async () => {
  // Verificar permissões antes de criar o cliente
  const { authorized, userId } = await verifyMasterAdminPermissions();
  
  if (!authorized) {
    throw new Error('Acesso negado: Apenas master admins podem usar este cliente');
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }

  console.debug(`Cliente admin autorizado para usuário: ${userId}`);

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Cliente admin "unsafe" - usado apenas para operações muito específicas
 * onde a verificação de permissão já foi feita externamente.
 * 
 * âš ï¸ NUNCA use este cliente diretamente nas server actions!
 */
export const createUnsafeSupabaseAdminClient = () => {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Operações específicas que realmente precisam de privilégios admin
 */
export const SecureAdminOperations = {
  /**
   * Lista usuários com verificação de permissão
   */
  async getAllUsers() {
    const { authorized } = await verifyMasterAdminPermissions();
    if (!authorized) {
      throw new Error('Acesso negado');
    }

    const supabase = createUnsafeSupabaseAdminClient();
    
    // Buscar profiles primeiro
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        role,
        status,
        organization_id,
        job_title,
        phone,
        created_at,
        organizations!profiles_organization_id_fkey(
          id,
          company_trading_name,
          client_type
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (profilesError) {
      throw new Error(`Erro ao buscar profiles: ${profilesError.message}`);
    }

    // Buscar emails e last_sign_in_at do auth.users para cada profile
    const usersWithAuthData = await Promise.all(
      (profiles || []).map(async (profile) => {
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
          return {
            ...profile,
            email: authUser.user?.email || null,
            last_sign_in_at: authUser.user?.last_sign_in_at || null
          };
        } catch (error) {
          console.warn(`Erro ao buscar dados do auth para usuário ${profile.id}:`, error);
          return {
            ...profile,
            email: null,
            last_sign_in_at: null
          };
        }
      })
    );

    return usersWithAuthData;
  },

  /**
   * Cria usuário via Auth Admin API (requer service role)
   */
  async inviteUser(email: string, userData: any) {
    const { authorized } = await verifyMasterAdminPermissions();
    if (!authorized) {
      throw new Error('Acesso negado');
    }

    const supabase = createUnsafeSupabaseAdminClient();
    
    return await supabase.auth.admin.inviteUserByEmail(email, {
      data: userData
    });
  },

  /**
   * Remove usuário via Auth Admin API (requer service role)
   */
  async deleteUser(userId: string) {
    const { authorized } = await verifyMasterAdminPermissions();
    if (!authorized) {
      throw new Error('Acesso negado');
    }

    const supabase = createUnsafeSupabaseAdminClient();
    
    return await supabase.auth.admin.deleteUser(userId);
  }
}; 
