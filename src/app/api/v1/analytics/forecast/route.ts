import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { withRateLimit } from '@/core/api/rate-limiter';

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success, headers: rateHeaders } = await withRateLimit('standard', 'analytics-forecast-api');
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

    // TODO: Implementar lógica de forecast
    const mockData = {
      forecast_metrics: {
        total_revenue: {
          current: 500000,
          forecast: 750000,
          growth: 50
        },
        categories: {
          'Categoria A': { current: 250000, forecast: 375000, growth: 50 },
          'Categoria B': { current: 150000, forecast: 225000, growth: 50 },
          'Categoria C': { current: 100000, forecast: 150000, growth: 50 }
        }
      },
      period: {
        current: {
          start: '2024-01-01',
          end: '2024-03-31'
        },
        forecast: {
          start: '2024-04-01',
          end: '2024-06-30'
        }
      }
    };

    return NextResponse.json(mockData);

  } catch (error) {
    console.error('Erro na API de forecast:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 
