import { createSupabaseServerClient } from '@/core/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  
  try {
    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError)
      return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 })
    }

    // Verificar permissão (apenas admins podem acessar métricas)
    if (!['organization_admin', 'master_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Master admins podem ver tudo, organization_admin precisam de organização
    if (profile.role === 'organization_admin' && !profile?.organization_id) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    // Buscar métricas via função RPC
    const { data: metrics, error: metricsError } = await supabase
      .rpc('get_session_analytics', {
        p_org_id: profile.role === 'master_admin' ? null : profile.organization_id,
        p_days_back: 7
      })

    if (metricsError) {
      console.error('Erro nas métricas:', metricsError)
      return NextResponse.json({ 
        error: 'Erro ao buscar métricas',
        details: metricsError.message 
      }, { status: 500 })
    }

    // Buscar estatísticas adicionais da organização
    const { data: orgStats, error: orgStatsError } = await supabase
      .rpc('get_organization_session_stats', {
        p_org_id: profile.role === 'master_admin' ? null : profile.organization_id
      })

    if (orgStatsError) {
      console.error('Erro nas estatísticas da org:', orgStatsError)
      // Não falhar se as estatísticas da org falharem
    }

    return NextResponse.json({
      success: true,
      metrics: metrics || [],
      orgStats: orgStats || [],
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Erro na API de métricas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    )
  }
}

// Endpoint para buscar métricas em tempo real (GET)
export async function GET() {
  const supabase = await createSupabaseServerClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id || !['organization_admin', 'master_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Métricas rápidas para dashboard
    const { data: quickMetrics } = await supabase
      .from('user_sessions')
      .select('id, session_type, last_activity, is_active, created_at')
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true)

    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const stats = {
      total_active: quickMetrics?.length || 0,
      active_last_hour: quickMetrics?.filter(s => 
        new Date(s.last_activity) > oneHourAgo
      ).length || 0,
      new_today: quickMetrics?.filter(s => 
        new Date(s.created_at) > oneDayAgo
      ).length || 0,
      mobile_sessions: quickMetrics?.filter(s => 
        s.session_type === 'mobile'
      ).length || 0,
      web_sessions: quickMetrics?.filter(s => 
        s.session_type === 'web'
      ).length || 0
    }

    return NextResponse.json({
      success: true,
      quickStats: stats,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Erro na API de métricas rápidas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    )
  }
}