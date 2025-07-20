import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { withCache, dashboardCache, cacheConfigs } from '../cache';

interface WidgetQuery {
  widgetId: string;
  queryType: 'rpc' | 'rest' | 'sql';
  queryConfig: {
    endpoint?: string;
    function?: string;
    params?: Record<string, any>;
    sql?: string;
  };
  customParams?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Buscar perfil e organização do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json(
        { error: 'Profile or organization not found' }, 
        { status: 404 }
      );
    }

    const tenantId = profile.organization_id;
    const body = await request.json();
    const { queries }: { queries: WidgetQuery[] } = body;

    if (!queries || !Array.isArray(queries)) {
      return NextResponse.json(
        { error: 'Queries array is required' }, 
        { status: 400 }
      );
    }

    // Executar queries para cada widget
    const widgetData: Record<string, any> = {};
    const errors: Record<string, string> = {};

    for (const query of queries) {
      try {
        // Buscar widget para obter configuração de cache
        const { data: widget } = await supabase
          .from('dashboard_widgets')
          .select('category')
          .eq('id', query.widgetId)
          .single();

        const cacheConfig = cacheConfigs[widget?.category || 'default'];
        
        if (cacheConfig.enabled) {
          // Usar cache
          const data = await withCache(
            tenantId,
            query.widgetId,
            () => executeWidgetQuery(supabase, query, tenantId),
            cacheConfig.ttl,
            query.customParams
          );
          widgetData[query.widgetId] = data;
        } else {
          // Executar sem cache
          const data = await executeWidgetQuery(supabase, query, tenantId);
          widgetData[query.widgetId] = data;
        }
      } catch (error) {
        console.error(`Error executing query for widget ${query.widgetId}:`, error);
        errors[query.widgetId] = error instanceof Error ? error.message : 'Unknown error';
        widgetData[query.widgetId] = null;
      }
    }

    return NextResponse.json({
      success: true,
      data: widgetData,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard data API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

async function executeWidgetQuery(
  supabase: any, 
  query: WidgetQuery, 
  tenantId: string
): Promise<any> {
  const { queryType, queryConfig, customParams } = query;

  // Combinar parâmetros padrão com parâmetros customizados
  const params = {
    ...queryConfig.params,
    ...customParams,
    tenant_id: tenantId // Sempre incluir tenant_id para RLS
  };

  switch (queryType) {
    case 'rpc':
      if (!queryConfig.function) {
        throw new Error('RPC function name is required');
      }
      
      const { data: rpcData, error: rpcError } = await supabase
        .rpc(queryConfig.function, params);
      
      if (rpcError) {
        throw new Error(`RPC error: ${rpcError.message}`);
      }
      
      return rpcData;

    case 'rest':
      if (!queryConfig.endpoint) {
        throw new Error('REST endpoint is required');
      }
      
      // Para REST endpoints, fazemos uma chamada HTTP interna
      const response = await fetch(queryConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`REST error: ${response.statusText}`);
      }

      return await response.json();

    case 'sql':
      if (!queryConfig.sql) {
        throw new Error('SQL query is required');
      }

      // Para SQL queries, usamos uma função RPC genérica que executa SQL
      const { data: sqlData, error: sqlError } = await supabase
        .rpc('execute_sql_query', {
          query: queryConfig.sql,
          params: params
        });

      if (sqlError) {
        throw new Error(`SQL error: ${sqlError.message}`);
      }

      return sqlData;

    default:
      throw new Error(`Unsupported query type: ${queryType}`);
  }
}

// Endpoint para buscar dados de um widget específico
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const widgetId = searchParams.get('widgetId');

    if (!widgetId) {
      return NextResponse.json(
        { error: 'Widget ID is required' }, 
        { status: 400 }
      );
    }

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Buscar perfil e organização do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json(
        { error: 'Profile or organization not found' }, 
        { status: 404 }
      );
    }

    const tenantId = profile.organization_id;

    // Buscar configuração do widget
    const { data: widget, error: widgetError } = await supabase
      .from('tenant_dashboard_widgets')
      .select(`
        *,
        dashboard_widgets (
          query_type,
          query_config,
          default_params
        )
      `)
      .eq('id', widgetId)
      .eq('tenant_id', tenantId)
      .single();

    if (widgetError || !widget) {
      return NextResponse.json(
        { error: 'Widget not found' }, 
        { status: 404 }
      );
    }

    // Executar query do widget
    const query: WidgetQuery = {
      widgetId: widget.id,
      queryType: widget.dashboard_widgets.query_type,
      queryConfig: widget.dashboard_widgets.query_config,
      customParams: widget.custom_params
    };

    const data = await executeWidgetQuery(supabase, query, tenantId);

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Widget data API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}