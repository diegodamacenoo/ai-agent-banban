import { createSupabaseClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { cookies, headers } from 'next/headers';

// Tipos para logs de auditoria
export interface AuditLogData {
  actor_user_id: string;
  action_type: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  organization_id?: string;
}

/**
 * Função helper para capturar informações de request (IP, User-Agent, organization_id)
 * 
 * @param {string} userId - ID do usuário para buscar organization_id
 * @param {boolean} useAdminClient - Se deve usar Admin Client para acessar dados
 * @returns {Promise<{ipAddress?: string, userAgent?: string, organizationId?: string}>}
 */
export async function captureRequestInfo(
  userId: string, 
  useAdminClient: boolean = false
): Promise<{
  ipAddress?: string;
  userAgent?: string;
  organizationId?: string;
}> {
  let ipAddress: string | undefined;
  let userAgent: string | undefined;
  let organizationId: string | undefined;
  
  try {
    const headersList = await headers();
    ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') ||
               headersList.get('x-client-ip') ||
               headersList.get('cf-connecting-ip') ||
               headersList.get('true-client-ip') ||
               headersList.get('x-cluster-client-ip') ||
               undefined;
    userAgent = headersList.get('user-agent') || undefined;
  } catch (headerError) {
    // Headers podem não estar disponíveis em alguns contextos
    console.log('[AUDIT] Headers não disponíveis:', headerError);
  }
  
  // Capturar organization_id do perfil do usuário
  try {
    const cookieStore = await cookies();
    const supabase = useAdminClient 
      ? createSupabaseAdminClient(cookieStore)
      : createSupabaseClient(cookieStore);
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();
    
    organizationId = profile?.organization_id || undefined;
  } catch (profileError) {
    console.log('[AUDIT] Erro ao buscar organization_id:', profileError);
  }
  
  return { ipAddress, userAgent, organizationId };
}

// Função para detectar se estamos em um contexto que tem acesso a headers
async function canAccessHeaders(): Promise<boolean> {
  try {
    await headers();
    return true;
  } catch {
    return false;
  }
}

// Função para registrar logs de auditoria
export async function createAuditLog(data: AuditLogData): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    // Tentar capturar IP e User-Agent automaticamente se não fornecidos
    let ipAddress = data.ip_address;
    let userAgent = data.user_agent;
    
    // Verificar se headers estão disponíveis antes de tentar acessá-los
    if ((!ipAddress || !userAgent) && await canAccessHeaders()) {
      try {
        const headersList = await headers();
        
        if (!ipAddress) {
          ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     headersList.get('x-real-ip') ||
                     headersList.get('x-client-ip') ||
                     headersList.get('cf-connecting-ip') || // Cloudflare
                     headersList.get('true-client-ip') || // Cloudflare Enterprise
                     headersList.get('x-cluster-client-ip') || // Cluster/load balancer
                     undefined;
        }
        
        if (!userAgent) {
          userAgent = headersList.get('user-agent') || undefined;
        }
        
      } catch (headersError) {
        // Se falhar ao acessar headers, continuar sem IP/user-agent
        console.log('[AUDIT] Erro ao acessar headers:', headersError);
      }
    }
    
    // Se ainda não temos IP ou user-agent, tentar fallback para API Route
    if (!ipAddress || !userAgent) {
      try {
        return await createAuditLogClient(data);
      } catch (apiError) {
        console.log('[AUDIT] Fallback para API Route falhou:', apiError);
        // Continuar com inserção direta sem IP/user-agent
      }
    }
    
    const auditData = {
      actor_user_id: data.actor_user_id,
      action_type: data.action_type,
      resource_type: data.resource_type,
      resource_id: data.resource_id,
      details: data.details || {},
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      organization_id: data.organization_id || null,
      action_timestamp: new Date().toISOString()
    };

    const { error } = await supabase
      .from('audit_logs')
      .insert(auditData);

    if (error) {
      console.error('Erro ao registrar log de auditoria:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro inesperado ao registrar log de auditoria:', error);
    return false;
  }
}

// Função para registrar logs de auditoria do lado do cliente (via API)
export async function createAuditLogClient(data: Omit<AuditLogData, 'ip_address' | 'user_agent'>): Promise<boolean> {
  try {
    const response = await fetch('/api/audit-logs/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      console.error('Erro ao registrar log de auditoria via API:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro inesperado ao registrar log de auditoria via API:', error);
    return false;
  }
}

// Tipos de ação comuns para padronizar
export const AUDIT_ACTION_TYPES = {
  // Usuários
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  USER_RESTORED: 'user_restored',
  USER_ROLE_CHANGED: 'user_role_changed',
  USER_INVITE_SENT: 'user_invite_sent',
  USER_INVITE_CANCELLED: 'user_invite_cancelled',
  USER_INVITE_RESENT: 'user_invite_resent',
  USER_ENROLLED_MFA: 'user_enrolled_mfa',
  USER_UNENROLLED_MFA: 'user_unenrolled_mfa',
  
  // Perfis/Roles
  ROLE_CREATED: 'role_created',
  ROLE_UPDATED: 'role_updated',
  ROLE_DELETED: 'role_deleted',
  
  // Conta/Perfil
  PROFILE_UPDATED: 'profile_updated',
  PASSWORD_CHANGED: 'password_changed',
  EMAIL_CHANGED: 'email_changed',
  TWO_FACTOR_ENABLED: 'two_factor_enabled',
  TWO_FACTOR_DISABLED: 'two_factor_disabled',
  
  // Segurança
  SECURITY_SETTINGS_UPDATED: 'security_settings_updated',
  KNOWN_DEVICE_ADDED: 'known_device_added',
  KNOWN_DEVICE_REMOVED: 'known_device_removed',
  SESSION_TERMINATED: 'session_terminated',
  ALL_SESSIONS_TERMINATED: 'all_sessions_terminated',
  SECURITY_ALERT_CONFIGURED: 'security_alert_configured',
  SECURITY_ALERT_SETTINGS_UPDATED: 'security_alert_settings_updated',

  // Organização
  ORGANIZATION_SETTINGS_UPDATED: 'organization_settings_updated',

  // Consentimentos
  USER_CONSENT_RECORDED: 'user_consent_recorded',

  // Notificações
  NOTIFICATION_PREFERENCES_UPDATED: 'notification_preferences_updated',

  // Data Controller
  DATA_EXPORT_REQUESTED: 'data_export_requested',

  // Sistema
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  DATA_EXPORTED: 'data_exported',
  AUDIT_LOGS_EXPORTED: 'audit_logs_exported'
} as const;

// Tipos de recurso comuns
export const AUDIT_RESOURCE_TYPES = {
  USER: 'user',
  PROFILE: 'profile',
  INVITE: 'invite',
  ROLE: 'role',
  SESSION: 'session',
  SECURITY_SETTINGS: 'security_settings',
  KNOWN_DEVICE: 'known_device',
  AUDIT_LOGS: 'audit_logs',
  SYSTEM: 'system',
  SECURITY_ALERT_SETTINGS: 'security_alert_settings',
  ORGANIZATION: 'organization',
  USER_CONSENT: 'user_consent',
  NOTIFICATION_PREFERENCES: 'notification_preferences',
  DATA_CONTROLLER: 'data_controller'
} as const; 