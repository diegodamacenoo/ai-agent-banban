import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const searchParams = request.nextUrl.searchParams;
    const horizonDays = searchParams.get('horizon') || '7';
    const variantId = searchParams.get('variant');

    let query = supabase
      .from('forecast_sales')
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
      .eq('forecast_date', new Date().toISOString().split('T')[0]);

    if (horizonDays) {
      query = query.eq('forecast_horizon_days', parseInt(horizonDays));
    }

    if (variantId) {
      query = query.eq('variant_id', variantId);
    }

    const { data, error } = await query.order('predicted_sales', { ascending: false });

    if (error) {
      console.error('Erro na query forecast:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Erro na API forecast:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 