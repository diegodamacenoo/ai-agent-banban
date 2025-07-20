// Audit Action Types
export const AUDIT_ACTION_TYPES = {
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  DATA_EXPORTED: 'data_exported',
  DATA_EXPORT_REQUESTED: 'data_export_requested',
  DATA_EXPORT_COMPLETED: 'data_export_completed',
  DATA_EXPORT_FAILED: 'data_export_failed',
  ORGANIZATION_CREATED: 'organization_created',
  ORGANIZATION_UPDATED: 'organization_updated',
  ORGANIZATION_DELETED: 'organization_deleted',
  SETTINGS_UPDATED: 'settings_updated',
  SECURITY_EVENT: 'security_event',
  ACCESS_GRANTED: 'access_granted',
  ACCESS_REVOKED: 'access_revoked',
  MFA_ENABLED: 'mfa_enabled',
  MFA_DISABLED: 'mfa_disabled',
  USER_ENROLLED_MFA: 'user_enrolled_mfa',
  USER_UNENROLLED_MFA: 'user_unenrolled_mfa',
  SESSION_TERMINATED: 'session_terminated',
  SESSION_CREATED: 'session_created',
  SESSION_EXPIRED: 'session_expired',
  USER_CONSENT_RECORDED: 'user_consent_recorded',
  USER_CONSENT_REVOKED: 'user_consent_revoked',
  USER_CONSENT_UPDATED: 'user_consent_updated',
  USER_RESTORED: 'user_restored',
  USER_DEACTIVATED: 'user_deactivated'
} as const;

// Audit Resource Types
export const AUDIT_RESOURCE_TYPES = {
  USER: 'user',
  ORGANIZATION: 'organization',
  SETTINGS: 'settings',
  DATA_EXPORT: 'data_export',
  DATA_CONTROLLER: 'data_controller',
  USER_DATA: 'user_data',
  SESSION: 'session',
  USER_CONSENT: 'user_consent'
} as const;

// Type Definitions
export type AuditActionType = typeof AUDIT_ACTION_TYPES[keyof typeof AUDIT_ACTION_TYPES];
export type AuditResourceType = typeof AUDIT_RESOURCE_TYPES[keyof typeof AUDIT_RESOURCE_TYPES];

// Tipos específicos para valores antigos e novos
export type AuditValue = string | number | boolean | null | Record<string, unknown>;

export interface AuditLogOptions {
  actorId?: string;
  organizationId?: string;
  entityId?: string;
  entityType?: string;
  oldValue?: AuditValue;
  newValue?: AuditValue;
  details?: Record<string, unknown>;
  isAdmin?: boolean;
}

export interface AuditLogEntry {
  actor_user_id: string;
  action_type: AuditActionType;
  resource_type: AuditResourceType;
  resource_id?: string;
  organization_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  old_value?: AuditValue;
  new_value?: AuditValue;
}

export interface GetAuditLogsOptions {
  organizationId: string;
  page?: number;
  limit?: number;
  filters?: {
    actionType?: AuditActionType;
    resourceType?: AuditResourceType;
    actorId?: string;
    startDate?: string;
    endDate?: string;
    resourceId?: string;
  };
}

export type Result<T, E = Error> = 
  | { success: true; data: T } 
  | { success: false; error: E }; 

export interface AuditLogData {
  actorId: string;
  entityId: string;
  details: string;
} 