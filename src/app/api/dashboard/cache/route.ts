import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { dashboardCache } from '../cache';

// GET - Obter estatísticas do cache
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Verificar autenticação e se é admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Apenas admins podem ver estatísticas de cache
    if (profile?.role !== 'master_admin') {
      return NextResponse.json(
        { error: 'Forbidden' }, 
        { status: 403 }
      );
    }

    const stats = dashboardCache.getStats();

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        cacheEnabled: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Cache stats API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// DELETE - Limpar cache
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const widgetId = searchParams.get('widgetId');
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' }, 
        { status: 404 }
      );
    }

    // Verificar permissões
    if (profile.role === 'master_admin') {
      // Admin pode limpar qualquer cache
      if (tenantId && widgetId) {
        dashboardCache.invalidateWidget(tenantId, widgetId);
      } else if (tenantId) {
        dashboardCache.invalidateTenant(tenantId);
      } else {
        dashboardCache.clear();
      }
    } else if (profile.organization_id) {
      // Usuários normais só podem limpar cache da própria organização
      const userTenantId = profile.organization_id;
      
      if (tenantId && tenantId !== userTenantId) {
        return NextResponse.json(
          { error: 'Forbidden: Can only clear own organization cache' }, 
          { status: 403 }
        );
      }

      if (widgetId) {
        dashboardCache.invalidateWidget(userTenantId, widgetId);
      } else {
        dashboardCache.invalidateTenant(userTenantId);
      }
    } else {
      return NextResponse.json(
        { error: 'No organization associated' }, 
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully'
    });

  } catch (error) {
    console.error('Cache clear API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}