import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const searchParams = request.nextUrl.searchParams;
    const riskLevel = searchParams.get('risk');

    let query = supabase
      .from('projected_coverage')
      .select(`
        *,
        core_product_variants!inner(
          sku,
          color,
          size,
          core_products(product_name, category)
        ),
        core_locations(location_name)
      `)
      .eq('analysis_date', new Date().toISOString().split('T')[0]);

    if (riskLevel) {
      query = query.eq('risk_level', riskLevel);
    }

    const { data, error } = await query.order('projected_days_coverage', { ascending: true });

    if (error) {
      console.error('Erro na query coverage:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Agrupar por nível de risco para estatísticas
    const riskStats = (data || []).reduce((acc: any, item: any) => {
      const risk = item.risk_level;
      if (!acc[risk]) {
        acc[risk] = {
          level: risk,
          count: 0,
          products: []
        };
      }
      
      acc[risk].count++;
      acc[risk].products.push({
        variant_id: item.variant_id,
        sku: item.core_product_variants.sku,
        product_name: item.core_product_variants.core_products.product_name,
        current_stock: item.current_stock,
        projected_days_coverage: item.projected_days_coverage,
        projected_stockout_date: item.projected_stockout_date,
        avg_daily_sales: item.avg_daily_sales
      });
      
      return acc;
    }, {});

    return NextResponse.json({
      raw_data: data || [],
      risk_stats: Object.values(riskStats)
    });
  } catch (error) {
    console.error('Erro na API coverage:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 