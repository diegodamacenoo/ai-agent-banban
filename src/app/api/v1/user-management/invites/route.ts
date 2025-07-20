import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { cookies, headers } from "next/headers";
import { ratelimit } from "@/shared/utils/rate-limiter";

export async function GET() {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success } = await ratelimit.limit(ip ?? "127.0.0.1");

    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createSupabaseServerClient();

    // Verifica se o usuÃ¡rio estÃ¡ autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Erro de autenticaÃ§Ã£o:', userError);
      return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 });
    }

    // Verificar se o usuÃ¡rio atual Ã© admin
    const { data: currentUserProfile, error: currentUserError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (currentUserError || !currentUserProfile) {
      console.error('Erro ao buscar perfil do usuÃ¡rio atual:', currentUserError);
      return NextResponse.json({ error: 'Perfil do usuÃ¡rio nÃ£o encontrado' }, { status: 404 });
    }

    if (currentUserProfile.role !== 'organization_admin') {
      return NextResponse.json({ error: 'Apenas administradores podem listar convites' }, { status: 403 });
    }

    // Buscar convites da mesma organizaÃ§Ã£o
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
