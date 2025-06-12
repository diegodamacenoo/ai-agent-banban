// React e Next.js imports
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Utilitários e Helpers
import { createSupabaseClient, createSupabaseAdminClient } from "@/lib/supabase/server";


/**
 * API Route para gerenciamento de usuários ativos.
 * 
 * @description Busca todos os usuários ativos da organização do usuário autenticado.
 * Apenas administradores da organização podem acessar esta rota.
 * 
 * @returns {Promise<NextResponse>} Lista de usuários ativos com emails e dados de autenticação
 * 
 * @security 
 * - Requer autenticação válida
 * - Requer role 'organization_admin'
 * - Isolamento por organização (RLS)
 * 
 * @example
 * GET /api/user-management/users
 * Response: { data: [{ id, first_name, last_name, email, role, ... }] }
 */
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    const supabaseAdmin = createSupabaseAdminClient(cookieStore);

    // Verificação de autenticação
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Erro de autenticação:", userError);
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Busca do perfil do usuário atual para verificação de permissões
    const { data: currentUserProfile, error: currentUserError } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if (currentUserError || !currentUserProfile) {
      console.error(
        "Erro ao buscar perfil do usuário atual:",
        currentUserError
      );
      return NextResponse.json(
        { error: "Perfil do usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificação de permissões de administrador
    if (currentUserProfile.role !== "organization_admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem listar usuários" },
        { status: 403 }
      );
    }

    // Busca de usuários ativos da mesma organização
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select(
        `
        id,
        first_name,
        last_name,
        role,
        created_at,
        updated_at,
        avatar_url,
        job_title,
        phone,
        location,
        team_id,
        status
      `
      )
      .eq("organization_id", currentUserProfile.organization_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    // Log para depuração
    if (usersError) {
      console.error("Erro ao buscar usuários:", usersError);
      return NextResponse.json(
        { error: "Erro ao buscar usuários" },
        { status: 500 }
      );
    }

    // Busca de emails dos usuários da tabela auth.users usando cliente admin
    const userIds = users?.map((u) => u.id) || [];
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error("Erro ao buscar dados de autenticação:", authError);
      // Se falhar, continuamos sem os dados de auth
      const usersWithoutAuthData = users?.map((profile) => ({
        ...profile,
        email: null,
        last_sign_in_at: null,
      })) || [];
      
      return NextResponse.json({ data: usersWithoutAuthData });
    }

    // Combinação de dados de profiles com emails de auth.users
    const usersWithEmails =
      users?.map((profile) => {
        const authUser = authUsers.users.find((au) => au.id === profile.id);
        return {
          ...profile,
          email: authUser?.email || null,
          last_sign_in_at: authUser?.last_sign_in_at || null,
        };
      }) || [];

    return NextResponse.json({ data: usersWithEmails });
  } catch (error) {
    console.error("Erro na rota GET:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
