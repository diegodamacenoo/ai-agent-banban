import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/core/supabase/server";
import { cookies, headers } from "next/headers";
import { ratelimit } from "@/shared/utils/rate-limiter";

export async function GET() {
  console.debug("API Route /api/settings/users chamada");
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success } = await ratelimit.limit(ip ?? "127.0.0.1");

    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createSupabaseAdminClient();

    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error("Erro do Supabase ao buscar usuÃ¡rios do Auth:", authError);
      return NextResponse.json({ error: `Auth error: ${authError.message}` }, { status: 500 });
    }
    if (!authUsers) {
      console.debug("Nenhum usuÃ¡rio encontrado no Auth.");
      return NextResponse.json([]);
    }

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, role, status"); 

    if (profilesError) {
      console.error("Erro do Supabase ao buscar perfis:", profilesError);
      // NÃ£o retornar erro fatal aqui, podemos ter usuÃ¡rios no auth sem perfil ainda
    }

    const profilesMap = new Map((profiles || []).map(p => [p.id, p]));

    const combinedUsers = authUsers.map(authUser => {
      const profile = profilesMap.get(authUser.id);
      const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");
      return {
        id: authUser.id,
        email: authUser.email,
        nome: fullName || authUser.email?.split('@')[0] || 'N/A',
        perfil: profile?.role || 'leitor', // Fallback para perfil 'leitor'
        // O status ativo é 'ACTIVE'
        // O campo 'status' da tabela profiles serÃ¡ usado diretamente.
        // Se precisar de mapeamento (ex: 'active' -> 'Ativo'), fazer aqui.
        status: profile?.status || 'unknown', // Fallback para status 'unknown'
      };
    });

    console.debug("UsuÃ¡rios combinados buscados com sucesso:", combinedUsers.length);
    return NextResponse.json(combinedUsers || []);

  } catch (e: any) {
    console.error("Erro inesperado na API Route /api/settings/users:", e);
    return NextResponse.json({ error: `Unexpected server error: ${e.message}` }, { status: 500 });
  }
} 
