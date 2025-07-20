import { createSupabaseBrowserClient } from '@/core/supabase/client';
import { createSupabaseAdminClient } from '@/core/supabase/admin';
import { cookies, headers } from 'next/headers';
import { getClientIP, getUserAgent } from './security-detector';

type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

export const AuditEvent = {
  // ... (enum de eventos)
} as const;

export type AuditEvent = typeof AuditEvent[keyof typeof AuditEvent];

export interface AuditLogOptions {
  actorId?: string;
  organizationId?: string;
  entityId?: string;
  entityType?: string;
  oldValue?: any;
  newValue?: any;
  details?: string;
  isAdmin?: boolean;
}

export interface AuditLogEntry {
  id: string;
  // ... (outros campos da entrada de log)
}

export interface GetAuditLogsOptions {
  organizationId: string;
  page?: number;
  limit?: number;
  filters?: Record<string, any>;
}

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
 * FunÃ§Ã£o helper para capturar informaÃ§Ãµes de request (IP, User-Agent, organization_id)
 * 
 * @param {string} userId - ID do usuÃ¡rio para buscar organization_id
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
    // Headers podem nÃ£o estar disponÃ­veis em alguns contextos
    console.debug('[AUDIT] Headers nÃ£o disponÃ­veis:', headerError);
  }
  
  // Capturar organization_id do perfil do usuÃ¡rio
  try {
    const supabase = useAdminClient 
      ? await createSupabaseAdminClient()
      : createSupabaseBrowserClient();
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();
    
    organizationId = profile?.organization_id || undefined;
  } catch (profileError) {
    console.debug('[AUDIT] Erro ao buscar organization_id:', profileError);
  }
  
  return { ipAddress, userAgent, organizationId };
}

// FunÃ§Ã£o para detectar se estamos em um contexto que tem acesso a headers
async function canAccessHeaders(): Promise<boolean> {
  try {
    await headers();
    return true;
  } catch {
    return false;
  }
}

// FunÃ§Ã£o para registrar logs de auditoria
export async function createAuditLog(data: AuditLogData): Promise<boolean> {
  try {
    const supabase = createSupabaseBrowserClient();
    
    // Tentar capturar IP e User-Agent automaticamente se nÃ£o fornecidos
    let ipAddress = data.ip_address;
    let userAgent = data.user_agent;
    
    // Verificar se headers estÃ£o disponÃ­veis antes de tentar acessÃ¡-los
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
        console.debug('[AUDIT] Erro ao acessar headers:', headersError);
      }
    }
    
    // Se ainda nÃ£o temos IP ou user-agent, tentar fallback para API Route
    if (!ipAddress || !userAgent) {
      try {
        return await createAuditLogClient(data);
      } catch (apiError) {
        console.debug('[AUDIT] Fallback para API Route falhou:', apiError);
        // Continuar com inserÃ§Ã£o direta sem IP/user-agent
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

// FunÃ§Ã£o para registrar logs de auditoria do lado do cliente (via API)
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

// Tipos de aÃ§Ã£o comuns para padronizar
export const AUDIT_ACTION_TYPES = {
  // UsuÃ¡rios
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  USER_RESTORED: 'user_restored',
  USER_DEACTIVATED: 'user_deactivated',
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
  
  // SeguranÃ§a
  SECURITY_SETTINGS_UPDATED: 'security_settings_updated',
  KNOWN_DEVICE_ADDED: 'known_device_added',
  KNOWN_DEVICE_REMOVED: 'known_device_removed',
  SESSION_TERMINATED: 'session_terminated',
  ALL_SESSIONS_TERMINATED: 'all_sessions_terminated',
  SECURITY_ALERT_CONFIGURED: 'security_alert_configured',
  SECURITY_ALERT_SETTINGS_UPDATED: 'security_alert_settings_updated',

  // OrganizaÃ§Ã£o
  ORGANIZATION_CREATED: 'organization_created',
  ORGANIZATION_UPDATED: 'organization_updated',
  ORGANIZATION_DELETED: 'organization_deleted',
  ORGANIZATION_SETTINGS_UPDATED: 'organization_settings_updated'
} as const;

async function getSupabase(isAdmin: boolean) {
  return isAdmin ? await createSupabaseAdminClient() : createSupabaseBrowserClient();
}

export async function audit(action: string, options: AuditLogOptions = {}) {
  try {
    const supabase = await getSupabase(options.isAdmin || false);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('UsuÃ¡rio nÃ£o autenticado');
    }

    const { ipAddress, userAgent } = await captureRequestInfo(user.id, options.isAdmin || false);

    const auditData = {
      actor_user_id: options.actorId || user.id,
      action_type: action,
      resource_type: options.entityType || 'unknown',
      resource_id: options.entityId,
      details: {
        old_value: options.oldValue,
        new_value: options.newValue,
        ...options.details ? { custom: options.details } : {}
      },
      ip_address: ipAddress,
      user_agent: userAgent,
      organization_id: options.organizationId
    };

    return await createAuditLog(auditData);
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
    return false;
  }
}

export const getAuditLogs = async (
  options: GetAuditLogsOptions
): Promise<Result<AuditLogEntry[], Error>> => {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('UsuÃ¡rio nÃ£o autenticado');
    }

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('organization_id', options.organizationId)
      .order('action_timestamp', { ascending: false })
      .range(
        ((options.page || 1) - 1) * (options.limit || 10),
        ((options.page || 1) * (options.limit || 10)) - 1
      );

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}; 
