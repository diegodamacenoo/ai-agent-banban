import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    // Verifica se o usuário está autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Erro de autenticação:', userError);
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o usuário atual é admin
    const { data: currentUserProfile, error: currentUserError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (currentUserError || !currentUserProfile) {
      console.error('Erro ao buscar perfil do usuário atual:', currentUserError);
      return NextResponse.json({ error: 'Perfil do usuário não encontrado' }, { status: 404 });
    }

    if (currentUserProfile.role !== 'organization_admin') {
      return NextResponse.json({ error: 'Apenas administradores podem listar convites' }, { status: 403 });
    }

    // Buscar convites da mesma organização
    const { data, error } = await supabase
      .from("user_invites")
      .select("id, email, created_at, status, expires_at, updated_at, role")
      .eq('organization_id', currentUserProfile.organization_id)
      .order("created_at", { ascending: false });
      
    if (error) {
      console.error("Erro ao buscar convites:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data || [] });
  } catch (e: any) {
    console.error("Erro inesperado na API Route /api/user-management/invites:", e);
    return NextResponse.json({ error: `Unexpected server error: ${e.message}` }, { status: 500 });
  }
} 