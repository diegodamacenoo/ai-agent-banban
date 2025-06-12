import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const { data, error } = await supabase
      .from('abc_analysis')
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
      .eq('analysis_date', new Date().toISOString().split('T')[0])
      .order('priority_score', { ascending: false });

    if (error) {
      console.error('Erro na query ABC:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Agrupar por categoria ABC para o gráfico
    const grouped = (data || []).reduce((acc: any, item: any) => {
      const category = item.abc_category;
      if (!acc[category]) {
        acc[category] = {
          category,
          count: 0,
          total_revenue: 0,
          products: []
        };
      }
      
      acc[category].count++;
      acc[category].total_revenue += item.revenue_contribution;
      acc[category].products.push({
        variant_id: item.variant_id,
        sku: item.core_product_variants.sku,
        product_name: item.core_product_variants.core_products.product_name,
        revenue_contribution: item.revenue_contribution,
        turnover_rate: item.turnover_rate
      });
      
      return acc;
    }, {});

    return NextResponse.json({
      raw_data: data || [],
      grouped_data: Object.values(grouped)
    });
  } catch (error) {
    console.error('Erro na API ABC:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 