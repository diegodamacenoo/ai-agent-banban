// React e Next.js imports
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Bibliotecas de terceiros
// (nenhuma biblioteca de terceiros neste arquivo)

// Tipos
// (tipos são inferidos do Supabase)

// Componentes da UI (design system, genéricos)
// (não aplicável para API routes)

// Componentes da aplicação (específicos de features)
// (não aplicável para API routes)

// Hooks personalizados
// (não aplicável para API routes)

// Utilitários e Helpers
import { createSupabaseClient, createSupabaseAdminClient } from '@/lib/supabase/server';

// Estilos
// (não aplicável para API routes)

/**
 * API Route para gerenciamento de usuários excluídos (soft delete).
 * 
 * @description Busca todos os usuários excluídos (soft delete) da organização do usuário autenticado.
 * Apenas administradores da organização podem acessar esta rota.
 * 
 * @returns {Promise<NextResponse>} Lista de usuários excluídos com emails e dados de autenticação
 * 
 * @security 
 * - Requer autenticação válida
 * - Requer role 'organization_admin'
 * - Isolamento por organização (RLS)
 * 
 * @example
 * GET /api/user-management/users/deleted
 * Response: { data: [{ id, first_name, last_name, email, deleted_at, ... }] }
 */
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    const supabaseAdmin = createSupabaseAdminClient(cookieStore);

    // Verificação de autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Erro de autenticação:', userError);
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Busca do perfil do usuário atual para verificação de permissões
    const { data: currentUserProfile, error: currentUserError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (currentUserError || !currentUserProfile) {
      console.error('Erro ao buscar perfil do usuário atual:', currentUserError);
      return NextResponse.json({ error: 'Perfil do usuário não encontrado' }, { status: 404 });
    }

    // Verificação de permissões de administrador
    if (currentUserProfile.role !== 'organization_admin') {
      return NextResponse.json({ error: 'Apenas administradores podem listar usuários excluídos' }, { status: 403 });
    }

    // Busca de usuários excluídos da mesma organização
    const { data: deletedUsers, error: deletedUsersError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        role,
        created_at,
        updated_at,
        deleted_at,
        avatar_url,
        job_title,
        phone,
        location,
        team_id,
        status
      `)
      .eq('organization_id', currentUserProfile.organization_id)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (deletedUsersError) {
      console.error('Erro ao buscar usuários excluídos:', deletedUsersError);
      return NextResponse.json({ error: 'Erro ao buscar usuários excluídos' }, { status: 500 });
    }

    // Busca de emails dos usuários da tabela auth.users usando cliente admin
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Erro ao buscar dados de autenticação:', authError);
      // Se falhar, continuamos sem os dados de auth
      const deletedUsersWithoutAuthData = deletedUsers?.map((profile) => ({
        ...profile,
        email: null,
        last_sign_in_at: null,
      })) || [];
      
      return NextResponse.json({ data: deletedUsersWithoutAuthData });
    }

    // Combinação de dados de profiles com emails de auth.users
    const deletedUsersWithEmails = deletedUsers?.map(profile => {
      const authUser = authUsers.users.find(au => au.id === profile.id);
      return {
        ...profile,
        email: authUser?.email || null,
        last_sign_in_at: authUser?.last_sign_in_at || null
      };
    }) || [];

    return NextResponse.json({ data: deletedUsersWithEmails });
  } catch (error) {
    console.error('Erro na rota GET:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 