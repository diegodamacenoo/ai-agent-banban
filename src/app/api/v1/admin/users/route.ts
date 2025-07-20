import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { withRateLimit } from '@/core/api/rate-limiter';
import { getUserProfile } from '@/shared/utils/supabase-helpers';

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success, headers: rateHeaders } = await withRateLimit('standard', 'admin-users-api');
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { 
        status: 429,
        headers: rateHeaders
      });
    }

    const supabase = await createSupabaseServerClient();
    
    // Verificar autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se é admin (usando método robusto)
    const { data: profile, error: profileError } = await getUserProfile(supabase, user.id, 'role');

    if (profileError) {
      console.error('Erro ao buscar perfil do usuário:', profileError);
      return NextResponse.json(
        { error: 'Erro ao verificar permissões' },
        { status: 500 }
      );
    }

    if (!profile || (profile as any).role !== 'master_admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas master admins podem acessar esta API.' },
        { status: 403 }
      );
    }

    // Buscar lista de usuários
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role, status, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar usuários' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users,
      total: users?.length || 0
    });

  } catch (error) {
    console.error('Erro na API de usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 
