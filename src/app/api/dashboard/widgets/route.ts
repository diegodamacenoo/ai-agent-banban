import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/core/supabase/server';

// GET - Buscar widgets disponíveis ou habilitados para o tenant
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'enabled'; // 'enabled' | 'available' | 'all'
    
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

    if (type === 'available') {
      // Buscar todos os widgets disponíveis no sistema
      const { data: widgets, error: widgetsError } = await supabase
        .from('dashboard_widgets')
        .select('*')
        .eq('status', 'active')
        .order('category', { ascending: true })
        .order('title', { ascending: true });

      if (widgetsError) {
        return NextResponse.json(
          { error: 'Failed to fetch available widgets' }, 
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: widgets
      });
    }

    if (type === 'enabled') {
      // Buscar widgets habilitados para o tenant
      const { data: widgets, error: widgetsError } = await supabase
        .from('tenant_dashboard_widgets')
        .select(`
          *,
          dashboard_widgets (*)
        `)
        .eq('tenant_id', tenantId)
        .eq('enabled', true)
        .order('display_order');

      if (widgetsError) {
        return NextResponse.json(
          { error: 'Failed to fetch enabled widgets' }, 
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: widgets
      });
    }

    // type === 'all' - Buscar widgets com status de habilitação
    const { data: allWidgets, error: allWidgetsError } = await supabase
      .from('dashboard_widgets')
      .select(`
        *,
        tenant_dashboard_widgets!left (
          id,
          enabled,
          position_x,
          position_y,
          width,
          height,
          custom_params,
          display_order
        )
      `)
      .eq('status', 'active')
      .eq('tenant_dashboard_widgets.tenant_id', tenantId)
      .order('category', { ascending: true })
      .order('title', { ascending: true });

    if (allWidgetsError) {
      return NextResponse.json(
        { error: 'Failed to fetch widgets' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: allWidgets
    });

  } catch (error) {
    console.error('Dashboard widgets API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// POST - Habilitar widget para o tenant
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
    
    const { 
      widgetId, 
      position = { x: 0, y: 0, w: 4, h: 4 },
      customParams = {},
      displayOrder = 0
    } = body;

    if (!widgetId) {
      return NextResponse.json(
        { error: 'Widget ID is required' }, 
        { status: 400 }
      );
    }

    // Verificar se o widget existe
    const { data: widget, error: widgetError } = await supabase
      .from('dashboard_widgets')
      .select('*')
      .eq('id', widgetId)
      .eq('status', 'active')
      .single();

    if (widgetError || !widget) {
      return NextResponse.json(
        { error: 'Widget not found' }, 
        { status: 404 }
      );
    }

    // Tentar inserir ou atualizar o widget do tenant
    const { data: tenantWidget, error: insertError } = await supabase
      .from('tenant_dashboard_widgets')
      .upsert({
        tenant_id: tenantId,
        widget_id: widgetId,
        enabled: true,
        position_x: position.x,
        position_y: position.y,
        width: position.w,
        height: position.h,
        custom_params: customParams,
        display_order: displayOrder
      }, {
        onConflict: 'tenant_id,widget_id'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error enabling widget:', insertError);
      return NextResponse.json(
        { error: 'Failed to enable widget' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tenantWidget
    });

  } catch (error) {
    console.error('Dashboard widget enable API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// PUT - Atualizar configuração de widget do tenant
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
    
    const { 
      tenantWidgetId,
      enabled,
      position,
      customParams,
      displayOrder
    } = body;

    if (!tenantWidgetId) {
      return NextResponse.json(
        { error: 'Tenant widget ID is required' }, 
        { status: 400 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {};
    if (typeof enabled === 'boolean') updateData.enabled = enabled;
    if (position) {
      updateData.position_x = position.x;
      updateData.position_y = position.y;
      updateData.width = position.w;
      updateData.height = position.h;
    }
    if (customParams) updateData.custom_params = customParams;
    if (typeof displayOrder === 'number') updateData.display_order = displayOrder;

    // Atualizar widget do tenant
    const { data: updatedWidget, error: updateError } = await supabase
      .from('tenant_dashboard_widgets')
      .update(updateData)
      .eq('id', tenantWidgetId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating widget:', updateError);
      return NextResponse.json(
        { error: 'Failed to update widget' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedWidget
    });

  } catch (error) {
    console.error('Dashboard widget update API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// DELETE - Desabilitar widget do tenant
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const tenantWidgetId = searchParams.get('tenantWidgetId');
    
    if (!tenantWidgetId) {
      return NextResponse.json(
        { error: 'Tenant widget ID is required' }, 
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

    // Desabilitar widget (ou remover completamente)
    const { error: deleteError } = await supabase
      .from('tenant_dashboard_widgets')
      .delete()
      .eq('id', tenantWidgetId)
      .eq('tenant_id', tenantId);

    if (deleteError) {
      console.error('Error disabling widget:', deleteError);
      return NextResponse.json(
        { error: 'Failed to disable widget' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Widget disabled successfully'
    });

  } catch (error) {
    console.error('Dashboard widget disable API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}