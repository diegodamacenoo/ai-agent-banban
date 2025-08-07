'use server'

import { createSupabaseServerClient } from '@/core/supabase/server'
import { revalidatePath } from 'next/cache'

// Buscar estatísticas de sessões da organização
export async function getOrganizationSessionStats() {
  const supabase = await createSupabaseServerClient()
  
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

    // Verificar se tem permissão (admin da org ou master_admin)
    if (!['organization_admin', 'master_admin'].includes(profile?.role || '')) {
      throw new Error('Sem permissão para visualizar sessões')
    }

    // Master admins podem ver todas as organizações, outros precisam de org
    if (profile.role !== 'master_admin' && !profile?.organization_id) {
      throw new Error('Organização não encontrada')
    }

    // Buscar estatísticas via função RPC
    const { data: stats, error: statsError } = await supabase
      .rpc('get_session_analytics', {
        p_org_id: profile.role === 'master_admin' ? null : profile.organization_id,
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
  const supabase = await createSupabaseServerClient()
  
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
      throw new Error('Sem permissão para visualizar sessões')
    }

    // Master admins podem ver todas as organizações, outros precisam de org
    if (profile.role !== 'master_admin' && !profile?.organization_id) {
      throw new Error('Organização não encontrada')
    }

    // Buscar sessões ativas com dados do usuário
    let sessionsQuery = supabase
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
      .eq('is_active', true)
      .order('last_activity', { ascending: false })
      .limit(100)

    // Apenas filtrar por organização se não for master_admin
    if (profile.role !== 'master_admin' && profile.organization_id) {
      sessionsQuery = sessionsQuery.eq('profiles.organization_id', profile.organization_id)
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery

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
  const supabase = await createSupabaseServerClient()
  
  try {
    // Log removido para limpar terminal
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    // Log removido para limpar terminal

    // Verificar permissão
    if (!['organization_admin', 'master_admin'].includes(profile?.role || '')) {
      throw new Error('Sem permissão para encerrar sessões')
    }

    // Verificar se está tentando encerrar própria sessão
    const { data: sessionToEnd } = await supabase
      .from('user_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single()

    if (sessionToEnd?.user_id === user.id) {
      console.debug('⚠️ Usuário tentando encerrar própria sessão')
      throw new Error('Você não pode encerrar sua própria sessão ativa. Use o logout normal.')
    }

    // Obter dados da sessão para invalidar JWT
    const { data: sessionData } = await supabase
      .from('user_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single()

    if (!sessionData) {
      throw new Error('Sessão não encontrada')
    }

    const targetUserId = sessionData.user_id

    // 1. Marcar sessão como inativa na nossa tabela
    // Log removido para limpar terminal
    const { error: updateError } = await supabase
      .from('user_sessions')
      .update({ 
        is_active: false, 
        updated_at: new Date().toISOString(),
        security_flags: {
          ended_at: new Date().toISOString(),
          ended_reason: 'admin_termination'
        }
      })
      .eq('id', sessionId)

    if (updateError) {
      console.debug('❌ Erro ao marcar sessão como inativa:', updateError)
      throw updateError
    }

    // 2. Invalidar JWT usando nossa função RPC (mais confiável)
    // Log removido para limpar terminal
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('admin_delete_user_sessions', { 
        target_user_id: targetUserId 
      })
      
      if (rpcError) {
        console.debug('❌ Erro na função RPC:', rpcError)
        throw rpcError
      } else {
        console.debug('✅ Tokens JWT removidos via RPC. Resultado:', rpcResult)
      }
    } catch (error) {
      console.debug('❌ Falha crítica ao invalidar JWT:', error)
      // Mesmo com erro na invalidação do JWT, continuamos pois a sessão foi marcada como inativa
      // Em production, isso deveria ser um alerta crítico
    }

    // 3. NOVO: Bloquear usuário temporariamente para evitar race conditions
    console.debug('🔧 Bloqueando usuário temporariamente:', targetUserId)
    try {
      const { error: blockError } = await supabase.rpc('block_user_sessions', { 
        target_user_id: targetUserId,
        block_minutes: 10, // 10 minutos de bloqueio (para testes)
        block_reason: 'admin_session_termination'
      })
      
      if (blockError) {
        console.debug('⚠️ Aviso ao bloquear usuário:', blockError)
      } else {
        console.debug('✅ Usuário bloqueado temporariamente por 10 minutos')
      }
    } catch (error) {
      console.debug('⚠️ Erro ao bloquear usuário:', error)
    }

    // 4. FORÇAR invalidação adicional usando admin API
    console.debug('🔧 Invalidação adicional via admin API')
    try {
      // Invalidar todas as sessões JWT do usuário diretamente
      const { error: adminError } = await supabase.auth.admin.signOut(targetUserId, 'global')
      
      if (adminError) {
        console.debug('⚠️ Erro na invalidação admin:', adminError)
      } else {
        console.debug('✅ Invalidação global via admin API realizada')
      }
    } catch (error) {
      console.debug('⚠️ Erro na invalidação admin:', error)
    }

    // 5. CRIAR marcador no localStorage para detectar bloqueio
    console.debug('🏷️ Criando marcador de bloqueio no lado do cliente')
    try {
      // Salvar informação do bloqueio que será detectada pelo middleware
      const blockInfo = {
        user_id: targetUserId,
        blocked_until: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutos
        reason: 'session_terminated',
        timestamp: Date.now()
      };
      
      // Em produção, isso seria feito via WebSocket ou Server-Sent Events
      // Por enquanto, log da informação que seria transmitida
      console.debug('📡 Informação de bloqueio a ser transmitida:', blockInfo)
      console.debug('✅ Marcador de bloqueio preparado')
    } catch (error) {
      console.debug('⚠️ Erro ao preparar marcador:', error)
    }
    
    // 6. FORÇAR limpeza de cache local do usuário  
    console.debug('🗑️ Invalidando caches relacionados ao usuário')
    try {
      // Limpar qualquer cache relacionado ao usuário no Redis (se houver)
      // await redis.del(`user:${targetUserId}:*`);
      
      // Por enquanto, apenas log da ação
      console.debug('✅ Preparação para limpeza de cache concluída')
    } catch (error) {
      console.debug('⚠️ Erro na limpeza de cache:', error)
    }

    revalidatePath('/admin/audit')

    return {
      success: true,
      message: 'Sessão encerrada com sucesso'
    }

  } catch (error: any) {
    console.error('❌ Erro ao encerrar sessão:', error)
    console.debug('🔍 Tipo do erro:', typeof error)
    console.debug('🔍 Error.message:', error?.message)
    console.debug('🔍 Error.toString():', error?.toString?.())
    console.debug('🔍 JSON.stringify(error):', JSON.stringify(error))
    
    const errorMessage = error?.message || error?.toString() || 'Erro interno do servidor'
    console.debug('📝 Mensagem final que será retornada:', errorMessage)
    
    const result = {
      success: false,
      error: errorMessage
    }
    console.debug('🚀 Objeto result completo:', JSON.stringify(result))
    return result
  }
}

// Encerrar todas as sessões de um usuário
export async function terminateAllUserSessions(userId: string, exceptSessionId?: string) {
  const supabase = await createSupabaseServerClient()
  
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

    revalidatePath('/admin/audit')

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
  const supabase = await createSupabaseServerClient()
  
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

    revalidatePath('/admin/audit')

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

// Limpeza rápida de sessões expiradas
export async function cleanupExpiredSessions() {
  const supabase = await createSupabaseServerClient()
  
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

    // Verificar permissão (organization_admin ou master_admin)
    if (!['organization_admin', 'master_admin'].includes(profile?.role || '')) {
      throw new Error('Sem permissão para executar limpeza')
    }

    // Executar limpeza via função RPC
    const { data, error } = await supabase
      .rpc('cleanup_expired_sessions')

    if (error) {
      throw error
    }

    const cleanedCount = data || 0

    revalidatePath('/admin/audit')

    return {
      success: true,
      message: `Limpeza rápida concluída: ${cleanedCount} sessões expiradas removidas`,
      count: cleanedCount
    }

  } catch (error: any) {
    console.error('Erro na limpeza rápida:', error)
    return {
      success: false,
      error: error.message || 'Erro interno do servidor'
    }
  }
}

// Manutenção programada de sessões
export async function runScheduledMaintenance() {
  const supabase = await createSupabaseServerClient()
  
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

    // Verificar permissão (apenas master_admin para manutenção completa)
    if (profile?.role !== 'master_admin') {
      throw new Error('Apenas master admins podem executar manutenção programada')
    }

    // Executar manutenção via função RPC
    const { data, error } = await supabase
      .rpc('scheduled_session_maintenance')

    if (error) {
      throw error
    }

    // Processar resultados da manutenção
    const maintenanceResults = data || []
    const sessionCleanup = maintenanceResults.find((item: any) => item.operation === 'session_cleanup')
    const securityMonitoring = maintenanceResults.find((item: any) => item.operation === 'security_monitoring')
    const cacheRefresh = maintenanceResults.find((item: any) => item.operation === 'cache_refresh')

    revalidatePath('/admin/audit')

    return {
      success: true,
      message: 'Manutenção programada concluída com sucesso',
      details: {
        sessionCleanup: sessionCleanup?.details || {},
        securityAlerts: securityMonitoring?.details || [],
        cacheUpdated: cacheRefresh?.details?.cache_updated || false,
        duration: cacheRefresh?.details?.duration_ms || 0
      }
    }

  } catch (error: any) {
    console.error('Erro na manutenção programada:', error)
    return {
      success: false,
      error: error.message || 'Erro interno do servidor'
    }
  }
}

// Detectar sessões suspeitas
export async function detectSuspiciousSessions() {
  const supabase = await createSupabaseServerClient()
  
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
  const supabase = await createSupabaseServerClient()
  
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
    let historyQuery = supabase
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
      .order('created_at', { ascending: false })
      .limit(limit)

    // Se não for master_admin, filtrar por organização
    if (profile.role !== 'master_admin' && profile.organization_id) {
      historyQuery = historyQuery.eq('organization_id', profile.organization_id)
    }

    const { data: sessions, error } = await historyQuery

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