import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { withRateLimit } from '@/core/api/rate-limiter';

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success, headers: rateHeaders } = await withRateLimit('standard', 'analytics-abc-api');
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

    // Verificar se tem acesso aos analytics
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: 'Acesso negado. Usuário sem organização.' },
        { status: 403 }
      );
    }

    // TODO: Implementar lógica de análise ABC
    const mockData = {
      categories: {
        A: { items: 150, revenue: 250000 },
        B: { items: 300, revenue: 150000 },
        C: { items: 550, revenue: 100000 }
      },
      total_items: 1000,
      total_revenue: 500000,
      period: {
        start: '2024-01-01',
        end: '2024-03-31'
      }
    };

    return NextResponse.json(mockData);

  } catch (error) {
    console.error('Erro na API de análise ABC:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 
