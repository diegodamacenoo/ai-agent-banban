import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET() {
  console.log("API Route /api/settings/users chamada");
  try {
    const supabase = createSupabaseAdminClient(await cookies());

    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error("Erro do Supabase ao buscar usuários do Auth:", authError);
      return NextResponse.json({ error: `Auth error: ${authError.message}` }, { status: 500 });
    }
    if (!authUsers) {
      console.log("Nenhum usuário encontrado no Auth.");
      return NextResponse.json([]);
    }

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, role, status"); 

    if (profilesError) {
      console.error("Erro do Supabase ao buscar perfis:", profilesError);
      // Não retornar erro fatal aqui, podemos ter usuários no auth sem perfil ainda
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
        // Assumindo que o status ativo é algo como 'active' ou 'enabled'
        // O campo 'status' da tabela profiles será usado diretamente.
        // Se precisar de mapeamento (ex: 'active' -> 'Ativo'), fazer aqui.
        status: profile?.status || 'unknown', // Fallback para status 'unknown'
      };
    });

    console.log("Usuários combinados buscados com sucesso:", combinedUsers.length);
    return NextResponse.json(combinedUsers || []);

  } catch (e: any) {
    console.error("Erro inesperado na API Route /api/settings/users:", e);
    return NextResponse.json({ error: `Unexpected server error: ${e.message}` }, { status: 500 });
  }
} 