'use server';

import { cookies, headers } from 'next/headers';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/core/supabase/server';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/features/security/audit-logger';
import { AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES, type AuditLogData } from '@/core/schemas/audit';
import type { UserSession } from '@/app/(protected)/settings/types/session-types';
import { terminateSessionSchema, type TerminateSessionData } from '@/core/schemas/auth';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Busca as sessões ativas do usuário atual
 * @returns {Promise<{data?: UserSession[], error?: string}>} Lista de sessões ou erro
 */
export async function getUserSessions(): Promise<{data?: UserSession[], error?: string}> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Primeiro obtém o usuário atual usando getUser() para maior segurança
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: 'Usuário não autenticado' };
    }
    
    // Busca as sessões do usuário na tabela user_sessions
    const { data, error } = await supabase
      .from('user_sessions')
      .select('id, user_id, created_at, updated_at, user_agent, ip')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Erro ao buscar sessões do usuário:', error);
      return { error: 'Não foi possível carregar as sessões ativas' };
    }
    
    // Obter a sessão atual para marcar (usando getUser para maior segurança)
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    // Formatar os dados para o front-end
    const formattedSessions = data.map(session => {
      // Parsear User-Agent para extrair informações do navegador/dispositivo
      const userAgent = session.user_agent || 'Desconhecido';
      const dispositivo = parseUserAgent(userAgent);
      
      // Para determinar se é a sessão atual, vamos usar uma heurística baseada em tempo
      // A sessão mais recente com IP similar provavelmente é a atual
      const isRecent = new Date(session.created_at).getTime() > (Date.now() - 5 * 60 * 1000); // últimos 5 minutos
      const isCurrent = currentUser && isRecent;
      
      return {
        id: session.id,
        dispositivo,
        local: `IP: ${session.ip || 'Desconhecido'}`,
        dataHoraLogin: new Date(session.created_at).toLocaleString('pt-BR'),
        atual: isCurrent,
        userAgent,
        ip: session.ip
      } as UserSession;
    });
    
    return { data: formattedSessions };
  } catch (error: any) {
    console.error('Erro inesperado em getUserSessions:', error);
    return { error: 'Um erro inesperado ocorreu ao buscar sessões' };
  }
}

/**
 * Encerra uma sessão específica do usuário
 * @param {TerminateSessionData} data Dados da sessão a ser encerrada
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
 */
export async function terminateSession(data: TerminateSessionData): Promise<{success: boolean, error?: string}> {
  const parsed = terminateSessionSchema.safeParse(data);
  if (!parsed.success) {
    return { 
      success: false, 
      error: parsed.error.errors.map(e => e.message).join(', ') 
    };
  }

  const { sessionId } = parsed.data;

  try {
    const supabase = await createSupabaseServerClient();
    
    // Obter usuário atual usando getUser() para maior segurança
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    // Verificar se a sessão pertence ao usuário antes de encerrar
    const { data } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();
      
    if (!data) {
      return { success: false, error: 'Sessão não encontrada ou não pertence ao usuário atual' };
    }
    
    // Verificar se é a sessão atual usando getUser() para maior segurança
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser && sessionId) {
      // Se for a sessão atual, use signOut com escopo local
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
      if (signOutError) {
        console.error('Erro ao encerrar sessão atual:', signOutError);
        return { success: false, error: `Erro ao encerrar a sessão atual: ${signOutError.message}` };
      }
      
      // Registrar log de auditoria para encerramento da própria sessão
      const { ipAddress, userAgent } = await captureHeaders();
      
      await createAuditLog({
        actor_user_id: user.id,
        action_type: AUDIT_ACTION_TYPES.SESSION_TERMINATED,
        resource_type: AUDIT_RESOURCE_TYPES.SESSION,
        resource_id: sessionId,
        details: {
          session_type: 'current_session',
          method: 'self_termination'
        }
      });
    }
    
    // Se não for a sessão atual, precisamos tomar uma abordagem diferente
    try {
      const adminSupabase = await createSupabaseAdminClient();
      
      // Opção 1: Remover diretamente a sessão da tabela auth.sessions usando SQL
      try {
        const { data: rpcResult, error: sqlError } = await adminSupabase.rpc(
          'revoke_session', 
          { session_id: sessionId }
        );
        
        if (sqlError || (rpcResult && !rpcResult.success)) {
          console.warn('Erro ao tentar usar função RPC:', sqlError || rpcResult?.error);
          // Vamos continuar para tentar a próxima abordagem
        } else {
          // Se a remoção foi bem-sucedida, também remova da tabela user_sessions
          await adminSupabase
            .from('user_sessions')
            .delete()
            .eq('id', sessionId);
            
          // Registrar log de auditoria
          const { ipAddress, userAgent } = await captureHeaders();
          await createAuditLog({
            actor_user_id: user.id,
            action_type: AUDIT_ACTION_TYPES.SESSION_TERMINATED,
            resource_type: AUDIT_RESOURCE_TYPES.SESSION,
            resource_id: sessionId,
            details: {
              session_type: 'other_session',
              method: 'rpc_revocation'
            }
          });
            
          revalidatePath('/settings');
          return { success: true };
        }
      } catch (rpcError) {
        console.warn('RPC não disponível:', rpcError);
        // Continua para a próxima abordagem
      }
      
      // Opção 2: Usar o endpoint da API admin para revogar a sessão
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!serviceRoleKey) {
          throw new Error('SUPABASE_SERVICE_ROLE_KEY não está definida');
        }
        
        // O endpoint correto para revogar sessões é /admin/auth/sessions
        const response = await fetch(`${supabaseUrl}/rest/v1/auth/sessions?id=eq.${sessionId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'X-Client-Info': 'supabase-admin-api'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Erro ao revogar sessão via API Admin:', errorText);
          // Continua para a próxima abordagem
        } else {
          // Remoção foi bem-sucedida, também remova da tabela user_sessions
          await adminSupabase
            .from('user_sessions')
            .delete()
            .eq('id', sessionId);
            
          // Registrar log de auditoria
          const { ipAddress, userAgent } = await captureHeaders();
          await createAuditLog({
            actor_user_id: user.id,
            action_type: AUDIT_ACTION_TYPES.SESSION_TERMINATED,
            resource_type: AUDIT_RESOURCE_TYPES.SESSION,
            resource_id: sessionId,
            details: {
              session_type: 'other_session',
              method: 'api_revocation'
            }
          });
            
          revalidatePath('/settings');
          return { success: true };
        }
      } catch (apiError) {
        console.error('Erro ao tentar revogar sessão via API:', apiError);
        return { success: false, error: 'Falha ao encerrar sessão' };
      }
    } catch (error: any) {
      console.error('Erro ao encerrar sessão:', error);
      return { success: false, error: `Erro ao encerrar sessão: ${error.message}` };
    }
  } catch (error: any) {
    console.error('Erro inesperado em terminateSession:', error);
    return { success: false, error: 'Um erro inesperado ocorreu ao encerrar a sessão' };
  }
  
  // Se chegou aqui, todas as tentativas falharam
  return { success: false, error: 'Não foi possível encerrar a sessão após múltiplas tentativas' };
}

/**
 * Encerra todas as outras sessões do usuário atual
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
 */
export async function terminateAllOtherSessions(): Promise<{success: boolean, error?: string}> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    // Buscar todas as sessões do usuário
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('id, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });
    
    if (sessionsError) {
      console.error('Erro ao buscar sessões:', sessionsError);
      return { success: false, error: 'Não foi possível buscar as sessões' };
    }

    if (!sessions || sessions.length === 0) {
      return { success: false, error: 'Nenhuma sessão ativa encontrada' };
    }
    
    // A primeira sessão (mais recente) é considerada a atual
    // Encerrar todas as outras sessões
    const currentSessionId = sessions[0]?.id;
    const otherSessions = sessions.filter(session => session.id !== currentSessionId);
    
    if (otherSessions.length === 0) {
      return { success: true }; // Não há outras sessões para encerrar
    }
    
    // Encerrar cada sessão exceto a atual
    let successCount = 0;
    let errorCount = 0;
    
    for (const session of otherSessions) {
      try {
        const result = await terminateSession({ sessionId: session.id });
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          console.error(`Erro ao encerrar sessão ${session.id}:`, result.error);
        }
      } catch (error) {
        errorCount++;
        console.error(`Erro inesperado ao encerrar sessão ${session.id}:`, error);
      }
    }
    
    // Registrar log de auditoria para operação em lote
    try {
      const { ipAddress, userAgent } = await captureHeaders();
      await createAuditLog({
        actor_user_id: user.id,
        action_type: AUDIT_ACTION_TYPES.SESSION_TERMINATED,
        resource_type: AUDIT_RESOURCE_TYPES.SESSION,
        resource_id: `batch_${Date.now()}`,
        details: {
          session_type: 'bulk_termination',
          method: 'terminate_all_others',
          total_sessions: otherSessions.length,
          success_count: successCount,
          error_count: errorCount
        }
      });
    } catch (auditError) {
      console.error('Erro ao registrar log de auditoria:', auditError);
    }
    
    revalidatePath('/settings');
    
    if (errorCount === 0) {
      return { success: true };
    } else if (successCount > 0) {
      return { 
        success: true, 
        error: `${successCount} sessões encerradas com sucesso, ${errorCount} falharam` 
      };
    } else {
      return { 
        success: false, 
        error: `Falha ao encerrar todas as ${errorCount} sessões` 
      };
    }
  } catch (error: any) {
    console.error('Erro inesperado ao encerrar todas as sessões:', error);
    return { success: false, error: 'Erro inesperado ao encerrar todas as sessões' };
  }
}

/**
 * Parseia o User-Agent para extrair informações do navegador/dispositivo
 * @param {string} userAgent String User-Agent do navegador
 * @returns {string} Descrição amigável do dispositivo/navegador
 */
function parseUserAgent(userAgent: string): string {
  let dispositivo = 'Desconhecido';
  
  // Detecção básica de dispositivo/navegador
  if (!userAgent) return dispositivo;
  
  if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
    dispositivo = 'Dispositivo Móvel';
  } else {
    dispositivo = 'Desktop';
  }
  
  // Detecção de navegador
  if (userAgent.includes('Chrome')) {
    dispositivo += ' - Chrome';
  } else if (userAgent.includes('Firefox')) {
    dispositivo += ' - Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    dispositivo += ' - Safari';
  } else if (userAgent.includes('Edge')) {
    dispositivo += ' - Edge';
  } else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
    dispositivo += ' - Internet Explorer';
  }
  
  return dispositivo;
}

/**
 * Helper para capturar headers IP e User-Agent em contexto de Server Actions
 */
async function captureHeaders(): Promise<{ ipAddress?: string; userAgent?: string }> {
  try {
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     headersList.get('x-real-ip') ||
                     headersList.get('x-client-ip') ||
                     undefined;
    const userAgent = headersList.get('user-agent') || undefined;
    
    return { ipAddress, userAgent };
  } catch (headerError) {
    // Headers podem não estar disponíveis em alguns contextos
    return {};
  }
} 
