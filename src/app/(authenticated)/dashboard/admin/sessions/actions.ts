'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Buscar estatísticas de sessões da organização
export async function getOrganizationSessionStats() {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      throw new Error('Organização não encontrada')
    }

    // Verificar se tem permissão (admin da org)
    if (!['organization_admin', 'master_admin'].includes(profile.role)) {
      throw new Error('Sem permissão para visualizar sessões')
    }

    // Buscar estatísticas via função RPC
    const { data: stats, error: statsError } = await supabase
      .rpc('get_session_analytics', {
        p_org_id: profile.organization_id,
        p_days_back: 7
      })

    if (statsError) {
      console.error('Erro nas estatísticas:', statsError)
      throw statsError
    }

    return {
      success: true,
      data: stats || []
    }

  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error)
    return {
      success: false,
      error: error.message || 'Erro interno do servidor'
    }
  }
}

// Buscar sessões ativas da organização
export async function getOrganizationActiveSessions() {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      throw new Error('Organização não encontrada')
    }

    // Verificar permissão
    if (!['organization_admin', 'master_admin'].includes(profile.role)) {
      throw new Error('Sem permissão para visualizar sessões')
    }

    // Buscar sessões ativas com dados do usuário
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select(`
        id,
        user_id,
        created_at,
        updated_at,
        last_activity,
        device_info,
        geo_location,
        session_type,
        login_method,
        is_active,
        ip,
        user_agent,
        expires_at,
        security_flags,
        profiles!inner(
          first_name,
          last_name,
          role,
          organization_id
        )
      `)
      .eq('profiles.organization_id', profile.organization_id)
      .eq('is_active', true)
      .order('last_activity', { ascending: false })
      .limit(100)

    if (sessionsError) {
      throw sessionsError
    }

    // Formatear dados para a UI
    const formattedSessions = sessions?.map(session => ({
      session_id: session.id,
      user_id: session.user_id,
      full_name: `${session.profiles?.first_name || ''} ${session.profiles?.last_name || ''}`.trim(),
      user_role: session.profiles?.role,
      created_at: session.created_at,
      last_activity: session.last_activity,
      device_info: session.device_info,
      geo_location: session.geo_location,
      session_type: session.session_type,
      login_method: session.login_method,
      is_active: session.is_active,
      ip: session.ip,
      user_agent: session.user_agent,
      expires_at: session.expires_at,
      security_flags: session.security_flags
    })) || []

    return {
      success: true,
      data: formattedSessions
    }

  } catch (error: any) {
    console.error('Erro ao buscar sessões:', error)
    return {
      success: false,
      error: error.message || 'Erro interno do servidor'
    }
  }
}

// Encerrar sessão específica
export async function terminateSession(sessionId: string) {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    // Verificar permissão
    if (!['organization_admin', 'master_admin'].includes(profile?.role || '')) {
      throw new Error('Sem permissão para encerrar sessões')
    }

    // Encerrar sessão via função RPC
    const { data, error } = await supabase
      .rpc('end_user_session', {
        p_session_id: sessionId
      })

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error('Sessão não encontrada ou já encerrada')
    }

    revalidatePath('/dashboard/admin/sessions')

    return {
      success: true,
      message: 'Sessão encerrada com sucesso'
    }

  } catch (error: any) {
    console.error('Erro ao encerrar sessão:', error)
    return {
      success: false,
      error: error.message || 'Erro interno do servidor'
    }
  }
}

// Encerrar todas as sessões de um usuário
export async function terminateAllUserSessions(userId: string, exceptSessionId?: string) {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    // Verificar permissão
    if (!['organization_admin', 'master_admin'].includes(profile?.role || '')) {
      throw new Error('Sem permissão para encerrar sessões')
    }

    // Encerrar todas as sessões do usuário via função RPC
    const { data, error } = await supabase
      .rpc('end_all_user_sessions', {
        p_user_id: userId,
        p_except_session_id: exceptSessionId || null
      })

    if (error) {
      throw error
    }

    revalidatePath('/dashboard/admin/sessions')

    return {
      success: true,
      message: `${data || 0} sessões encerradas`,
      count: data || 0
    }

  } catch (error: any) {
    console.error('Erro ao encerrar sessões do usuário:', error)
    return {
      success: false,
      error: error.message || 'Erro interno do servidor'
    }
  }
}

// Executar limpeza de sessões expiradas
export async function runSessionCleanup() {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Verificar permissão (apenas master_admin)
    if (profile?.role !== 'master_admin') {
      throw new Error('Apenas master admins podem executar limpeza')
    }

    // Executar limpeza via função RPC
    const { data, error } = await supabase
      .rpc('batch_cleanup_sessions')

    if (error) {
      throw error
    }

    const summary = data?.find((item: any) => item.operation === 'cleanup_summary')
    const processedCount = summary?.affected_count || 0

    revalidatePath('/dashboard/admin/sessions')

    return {
      success: true,
      message: `Limpeza concluída: ${processedCount} operações`,
      details: data || []
    }

  } catch (error: any) {
    console.error('Erro na limpeza de sessões:', error)
    return {
      success: false,
      error: error.message || 'Erro interno do servidor'
    }
  }
}

// Detectar sessões suspeitas
export async function detectSuspiciousSessions() {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    // Verificar permissão
    if (!['organization_admin', 'master_admin'].includes(profile?.role || '')) {
      throw new Error('Sem permissão para análise de segurança')
    }

    // Executar detecção via função RPC
    const { data, error } = await supabase
      .rpc('detect_suspicious_sessions')

    if (error) {
      throw error
    }

    // Filtrar apenas sessões da organização atual
    const orgSuspiciousSessions = data?.filter((session: any) => {
      // Verificar se o usuário pertence à organização
      // Como a função não filtra por org, vamos fazer isso depois
      return true // Por enquanto retornar todas
    }) || []

    return {
      success: true,
      data: orgSuspiciousSessions
    }

  } catch (error: any) {
    console.error('Erro ao detectar sessões suspeitas:', error)
    return {
      success: false,
      error: error.message || 'Erro interno do servidor'
    }
  }
}

// Buscar histórico de sessões de um usuário específico
export async function getUserSessionHistory(userId: string, limit = 20) {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    // Verificar permissão
    if (!['organization_admin', 'master_admin'].includes(profile?.role || '')) {
      throw new Error('Sem permissão para visualizar histórico')
    }

    // Buscar histórico de sessões
    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select(`
        id,
        created_at,
        updated_at,
        last_activity,
        device_info,
        geo_location,
        session_type,
        login_method,
        is_active,
        ip,
        expires_at,
        security_flags
      `)
      .eq('user_id', userId)
      .eq('organization_id', profile?.organization_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return {
      success: true,
      data: sessions || []
    }

  } catch (error: any) {
    console.error('Erro ao buscar histórico:', error)
    return {
      success: false,
      error: error.message || 'Erro interno do servidor'
    }
  }
}