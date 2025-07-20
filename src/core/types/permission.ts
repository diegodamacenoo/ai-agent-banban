// Tipos de Permissão para o Sistema Axon

export interface Permission {
  id: string;
  name: string;
  description: string;
  module?: string;
  group?: string;
  priority?: number;
}

export interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  hierarchy?: number;
}

export interface UserPermissions {
  userId: string;
  role: string;
  permissions: string[];
  groups: string[];
  organizationId: string;
}

// Tipos auxiliares para validação de permissões
export type PermissionValidator = (userPermissions: string[], requiredPermission: string) => boolean;

export type PermissionGroupValidator = (userPermissions: string[], requiredGroup: string[]) => boolean;

// Enum de roles padrão do sistema
export enum SystemRole {
  MASTER_ADMIN = 'master_admin',
  ORGANIZATION_ADMIN = 'organization_admin',
  MANAGER = 'manager',
  ANALYST = 'analyst',
  OPERATOR = 'operator',
  USER = 'user',
  VIEWER = 'viewer'
}

// Constantes para permissões do sistema
export const SYSTEM_PERMISSIONS = {
  // Permissões de administração
  ADMIN_FULL: 'admin-full',
  ADMIN_USERS: 'admin-users',
  ADMIN_ORGANIZATIONS: 'admin-organizations',
  ADMIN_SYSTEM: 'admin-system',
  
  // Permissões de visualização
  VIEW_DASHBOARD: 'view-dashboard',
  VIEW_REPORTS: 'view-reports',
  VIEW_ANALYTICS: 'view-analytics',
  
  // Permissões de gestão
  MANAGE_USERS: 'manage-users',
  MANAGE_CONTENT: 'manage-content',
  MANAGE_SETTINGS: 'manage-settings',
  
  // Permissões de operação
  CREATE_RECORDS: 'create-records',
  UPDATE_RECORDS: 'update-records',
  DELETE_RECORDS: 'delete-records'
} as const;

export type SystemPermission = typeof SYSTEM_PERMISSIONS[keyof typeof SYSTEM_PERMISSIONS]; 