import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/core/supabase/server';

export async function GET(request: NextRequest) {
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

    // Buscar layout ativo do tenant
    const { data: layout, error: layoutError } = await supabase
      .from('tenant_dashboard_layouts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('is_default', { ascending: false })
      .limit(1)
      .single();

    // Se não há layout personalizado, retornar layout padrão
    const layoutConfig = layout?.layout_config || {
      cols: 12,
      breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
      layouts: {
        lg: [],
        md: [],
        sm: [],
        xs: [],
        xxs: []
      }
    };

    // Buscar widgets habilitados para o tenant
    const { data: widgets, error: widgetsError } = await supabase
      .from('tenant_dashboard_widgets')
      .select(`
        *,
        dashboard_widgets (
          id,
          title,
          description,
          component_path,
          module_id,
          query_type,
          query_config,
          default_params,
          category,
          tags
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('enabled', true)
      .order('display_order');

    if (widgetsError) {
      console.error('Error fetching widgets:', widgetsError);
      return NextResponse.json(
        { error: 'Failed to fetch widgets' }, 
        { status: 500 }
      );
    }

    // Transformar dados para o formato esperado pelo frontend
    const formattedWidgets = widgets?.map(widget => ({
      id: widget.id,
      widgetId: widget.widget_id,
      title: widget.dashboard_widgets.title,
      description: widget.dashboard_widgets.description,
      componentPath: widget.dashboard_widgets.component_path,
      moduleId: widget.dashboard_widgets.module_id,
      queryType: widget.dashboard_widgets.query_type,
      queryConfig: widget.dashboard_widgets.query_config,
      defaultParams: widget.dashboard_widgets.default_params,
      customParams: widget.custom_params,
      position: {
        x: widget.position_x,
        y: widget.position_y,
        w: widget.width,
        h: widget.height
      },
      category: widget.dashboard_widgets.category,
      tags: widget.dashboard_widgets.tags,
      displayOrder: widget.display_order
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        layout: {
          id: layout?.id,
          name: layout?.layout_name || 'Default Layout',
          config: layoutConfig,
          isDefault: layout?.is_default || false
        },
        widgets: formattedWidgets,
        tenantId
      }
    });

  } catch (error) {
    console.error('Dashboard layout API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    
    const { layoutConfig, layoutName = 'Custom Layout' } = body;

    if (!layoutConfig) {
      return NextResponse.json(
        { error: 'Layout configuration is required' }, 
        { status: 400 }
      );
    }

    // Desativar layouts existentes
    await supabase
      .from('tenant_dashboard_layouts')
      .update({ is_active: false })
      .eq('tenant_id', tenantId);

    // Criar novo layout
    const { data: newLayout, error: insertError } = await supabase
      .from('tenant_dashboard_layouts')
      .insert({
        tenant_id: tenantId,
        layout_name: layoutName,
        layout_config: layoutConfig,
        is_active: true,
        is_default: false,
        created_by: user.id
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving layout:', insertError);
      return NextResponse.json(
        { error: 'Failed to save layout' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newLayout.id,
        name: newLayout.layout_name,
        config: newLayout.layout_config,
        isDefault: newLayout.is_default
      }
    });

  } catch (error) {
    console.error('Dashboard layout update API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}