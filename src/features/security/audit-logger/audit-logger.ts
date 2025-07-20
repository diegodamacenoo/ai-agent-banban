import { createSupabaseBrowserClient } from '@/core/supabase/client';
import { createSupabaseAdminClient } from '@/core/supabase/admin';
import { AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/core/schemas/audit';
import type { AuditLogEntry, AuditActionType, AuditResourceType, AuditValue } from '@/core/schemas/audit';
import { captureRequestInfo } from '@/core/auth/request-info';

/**
 * Creates an audit log entry
 */
export async function createAuditLog({
  actor_user_id,
  action_type,
  resource_type,
  resource_id,
  organization_id,
  details,
  ip_address,
  user_agent,
  old_value,
  new_value
}: {
  actor_user_id: string;
  action_type: AuditActionType;
  resource_type: AuditResourceType;
  resource_id?: string;
  organization_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  old_value?: AuditValue;
  new_value?: AuditValue;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!actor_user_id) {
      return { 
        success: false, 
        error: 'Actor ID is required for audit logging'
      };
    }

    const requestInfo = await captureRequestInfo(actor_user_id);
    
    const logEntry: AuditLogEntry = {
      actor_user_id,
      action_type,
      resource_type,
      resource_id,
      organization_id: organization_id || requestInfo.organizationId,
      ip_address: ip_address || requestInfo.ipAddress,
      user_agent: user_agent || requestInfo.userAgent,
      timestamp: new Date().toISOString(),
      old_value,
      new_value,
      details: typeof details === 'string' ? { message: details } : details
    };

    const supabase = await createSupabaseAdminClient();

    const { error } = await supabase
      .from('audit_logs')
      .insert(logEntry);

    if (error) {
      return { 
        success: false, 
        error: `Failed to create audit log: ${error.message}`
      };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error in audit logging'
    };
  }
} 