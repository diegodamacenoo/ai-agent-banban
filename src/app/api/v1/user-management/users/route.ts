// React e Next.js imports
import { NextResponse, type NextRequest } from "next/server";
import { cookies, headers } from "next/headers";

// UtilitÃ¡rios e Helpers
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/core/supabase/server";
import { ratelimit } from "@/shared/utils/rate-limiter";
import { getUserProfile } from "@/shared/utils/supabase-helpers";


/**
 * API Route para gerenciamento de usuÃ¡rios ativos.
 * 
 * @description Busca todos os usuÃ¡rios ativos da organizaÃ§Ã£o do usuÃ¡rio autenticado.
 * Apenas administradores da organizaÃ§Ã£o podem acessar esta rota.
 * 
 * @returns {Promise<NextResponse>} Lista de usuÃ¡rios ativos com emails e dados de autenticaÃ§Ã£o
 * 
 * @security 
 * - Requer autenticaÃ§Ã£o vÃ¡lida
 * - Requer role 'organization_admin'
 * - Isolamento por organizaÃ§Ã£o (RLS)
 * 
 * @example
 * GET /api/user-management/users
 * Response: { data: [{ id, first_name, last_name, email, role, ... }] }
 */
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success } = await ratelimit.limit(ip ?? "127.0.0.1");

    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createSupabaseServerClient();
    const supabaseAdmin = await createSupabaseAdminClient();

    // VerificaÃ§Ã£o de autenticaÃ§Ã£o
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Erro de autenticaÃ§Ã£o:", userError);
      return NextResponse.json({ error: "NÃ£o autorizado" }, { status: 401 });
    }

    // Busca do perfil do usuÃ¡rio atual para verificaÃ§Ã£o de permissÃµes (usando método robusto)
    const { data: currentUserProfile, error: currentUserError } = await getUserProfile(supabase, user.id, "role, organization_id");

    if (currentUserError || !currentUserProfile) {
      console.error(
        "Erro ao buscar perfil do usuÃ¡rio atual:",
        currentUserError
      );
      return NextResponse.json(
        { error: "Perfil do usuÃ¡rio nÃ£o encontrado" },
        { status: 404 }
      );
    }

    // VerificaÃ§Ã£o de permissÃµes de administrador
    if ((currentUserProfile as any).role !== "organization_admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem listar usuÃ¡rios" },
        { status: 403 }
      );
    }

    // Busca de usuÃ¡rios ativos da mesma organizaÃ§Ã£o
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
      .eq("organization_id", (currentUserProfile as any).organization_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    // Log para depuraÃ§Ã£o
    if (usersError) {
      console.error("Erro ao buscar usuÃ¡rios:", usersError);
      return NextResponse.json(
        { error: "Erro ao buscar usuÃ¡rios" },
        { status: 500 }
      );
    }

    // Busca de emails dos usuÃ¡rios da tabela auth.users usando cliente admin
    const userIds = users?.map((u) => u.id) || [];
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error("Erro ao buscar dados de autenticaÃ§Ã£o:", authError);
      // Se falhar, continuamos sem os dados de auth
      const usersWithoutAuthData = users?.map((profile) => ({
        ...profile,
        email: null,
        last_sign_in_at: null,
      })) || [];
      
      return NextResponse.json({ data: usersWithoutAuthData });
    }

    // CombinaÃ§Ã£o de dados de profiles com emails de auth.users
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

export async function POST(request: NextRequest) {
  // ... (lÃ³gica POST)
}
