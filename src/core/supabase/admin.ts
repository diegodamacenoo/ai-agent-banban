import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from './server';
import { createServerClient as _createServerClient, type CookieOptions } from '@supabase/ssr';

// Renomeando para evitar conflito com a funÃ§Ã£o exportada
const createServerClient = _createServerClient;

// Valida se as variÃ¡veis de ambiente necessÃ¡rias estÃ£o definidas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseServiceRoleKey) {
  throw new Error("Missing env.SUPABASE_SERVICE_ROLE_KEY");
}

/**
 * Verifica se o usuÃ¡rio atual tem permissÃµes de master admin
 */
async function verifyMasterAdminPermissions(): Promise<{ authorized: boolean; userId?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { authorized: false };
    }

    // 1) Verificar role no JWT primeiro (mais performÃ¡tico)
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
      // Importa a funÃ§Ã£o mesmo estando abaixo no arquivo, pois jÃ¡ estarÃ¡ inicializada em tempo de execuÃ§Ã£o
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
      console.warn('NÃ£o foi possÃ­vel obter role do usuÃ¡rio na tabela profiles:', profileError?.message);
      return { authorized: false };
    }

    return { authorized: profile.role === 'master_admin', userId: user.id };
  } catch (error) {
    console.error('Erro ao verificar permissÃµes admin:', error);
    return { authorized: false };
  }
}

/**
 * Cria um cliente Supabase com privilÃ©gios de administrador APENAS para operaÃ§Ãµes especÃ­ficas.
 * Este cliente deve ser usado APENAS para operaÃ§Ãµes que realmente precisam ignorar RLS.
 * 
 * IMPORTANTE: Este cliente verifica automaticamente se o usuÃ¡rio tem permissÃµes de master_admin.
 */
export const createSupabaseAdminClient = async () => {
  // Verificar permissÃµes antes de criar o cliente
  const { authorized, userId } = await verifyMasterAdminPermissions();
  
  if (!authorized) {
    throw new Error('Acesso negado: Apenas master admins podem usar este cliente');
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }

  console.debug(`Cliente admin autorizado para usuÃ¡rio: ${userId}`);

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Cliente admin "unsafe" - usado apenas para operaÃ§Ãµes muito especÃ­ficas
 * onde a verificaÃ§Ã£o de permissÃ£o jÃ¡ foi feita externamente.
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
 * OperaÃ§Ãµes especÃ­ficas que realmente precisam de privilÃ©gios admin
 */
export const SecureAdminOperations = {
  /**
   * Lista usuÃ¡rios com verificaÃ§Ã£o de permissÃ£o
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
          console.warn(`Erro ao buscar dados do auth para usuÃ¡rio ${profile.id}:`, error);
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
   * Cria usuÃ¡rio via Auth Admin API (requer service role)
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
   * Remove usuÃ¡rio via Auth Admin API (requer service role)
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
