'use server';

import { createSupabaseServerClient } from '@/core/supabase/server';
import { createSupabaseAdminClient } from '@/core/supabase/admin';
import { z } from 'zod';
import { headers } from 'next/headers';
import { 
  type AuditActionType,
  type AuditResourceType,
  type AuditLogEntry,
  type AuditLogOptions,
  type GetAuditLogsOptions,
  type Result
} from '@/core/schemas/audit';


const AuditLogSchema = z.object({
  actor_user_id: z.string().optional(),
  action_type: z.string(),
  resource_type: z.string(),
  resource_id: z.string().optional(),
  organization_id: z.string().optional(),
  details: z.record(z.unknown()).optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  old_value: z.union([z.string(), z.number(), z.boolean(), z.null(), z.record(z.unknown())]).optional(),
  new_value: z.union([z.string(), z.number(), z.boolean(), z.null(), z.record(z.unknown())]).optional(),
});

/**
 * Helper function to capture request information (IP, User-Agent, organization_id)
 * 
 * @param {string} userId - User ID to fetch organization_id
 * @param {boolean} useAdminClient - Whether to use Admin Client to access data
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
    const headersList = await Promise.resolve(headers());
    
    // Get IP address from various possible headers
    const forwardedFor = headersList.get('x-forwarded-for');
    ipAddress = forwardedFor?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') ||
               headersList.get('x-client-ip') ||
               headersList.get('cf-connecting-ip') ||
               headersList.get('true-client-ip') ||
               headersList.get('x-cluster-client-ip') ||
               undefined;
               
    userAgent = headersList.get('user-agent') || undefined;
  } catch (headerError) {
    // Headers may not be available in some contexts
    // Log suprimido - headers não disponíveis é situação normal
  }
  
  // Capture organization_id from user profile
  try {
    const supabase = useAdminClient 
      ? await createSupabaseAdminClient()
      : await createSupabaseServerClient();
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();
    
    organizationId = profile?.organization_id || undefined;
  } catch (profileError) {
    // Log suprimido - erro ao buscar organização é situação normal
  }
  
  return { ipAddress, userAgent, organizationId };
}

/**
 * Creates an audit log entry
 */
export async function createAuditLog(logData: z.infer<typeof AuditLogSchema>) {
  const validation = AuditLogSchema.safeParse(logData);
  if (!validation.success) {
    console.error('Invalid audit log data:', validation.error);
    return;
  }

  const validatedData = validation.data;
  const { actor_user_id, action_type, ...rest } = validatedData;
  
  try {
    // Para logs de auditoria, usar cliente server normal ao invés de admin
    // O admin só é necessário para consultar logs, não para criar
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Se não houver ator, usar um usuário do sistema ou lançar erro
    const actorId = actor_user_id || user?.id || 'system';

    const { error } = await supabase.from('audit_logs').insert([
      {
        actor_user_id: actorId,
        action_type: validatedData.action_type,
        ...rest,
      },
    ]);

    if (error) {
      console.error('Error creating audit log:', error);
    }
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
}

/**
 * Retrieves audit logs with pagination and filtering
 */
export async function getAuditLogs(
  options: GetAuditLogsOptions
): Promise<Result<{ logs: AuditLogEntry[]; total: number }, Error>> {
  try {
    const { 
      organizationId, 
      page = 1, 
      limit = 10, 
      filters = {} 
    } = options;

    const supabase = await createSupabaseAdminClient();
    
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('timestamp', { ascending: false });

    // Apply any additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: logs, error, count } = await query;

    if (error) {
      return { 
        success: false, 
        error: new Error(`Failed to fetch audit logs: ${error.message}`) 
      };
    }

    return { 
      success: true, 
      data: { 
        logs: logs as AuditLogEntry[], 
        total: count || 0 
      } 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error fetching audit logs') 
    };
  }
} 