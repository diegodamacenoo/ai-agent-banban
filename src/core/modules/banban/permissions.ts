import { Permission } from '../../../core/types/permission';

export const permissions: Permission[] = [
  {
    id: 'view-banban',
    name: 'View Banban',
    description: 'Permite visualizar o módulo Banban'
  },
  {
    id: 'manage-banban',
    name: 'Manage Banban',
    description: 'Permite gerenciar o módulo Banban'
  },
  {
    id: 'view-banban-insights',
    name: 'View Banban Insights',
    description: 'Permite visualizar insights do Banban'
  },
  {
    id: 'manage-banban-insights',
    name: 'Manage Banban Insights',
    description: 'Permite gerenciar insights do Banban'
  },
  {
    id: 'view-banban-alerts',
    name: 'View Banban Alerts',
    description: 'Permite visualizar alertas do Banban'
  },
  {
    id: 'manage-banban-alerts',
    name: 'Manage Banban Alerts',
    description: 'Permite gerenciar alertas do Banban'
  },
  {
    id: 'view-banban-inventory',
    name: 'View Banban Inventory',
    description: 'Permite visualizar estoque do Banban'
  },
  {
    id: 'manage-banban-inventory',
    name: 'Manage Banban Inventory',
    description: 'Permite gerenciar estoque do Banban'
  },
  {
    id: 'view-banban-performance',
    name: 'View Banban Performance',
    description: 'Permite visualizar performance do Banban'
  },
  {
    id: 'manage-banban-performance',
    name: 'Manage Banban Performance',
    description: 'Permite gerenciar performance do Banban'
  },
  {
    id: 'view-banban-data-processing',
    name: 'View Banban Data Processing',
    description: 'Permite visualizar processamento de dados do Banban'
  },
  {
    id: 'manage-banban-data-processing',
    name: 'Manage Banban Data Processing',
    description: 'Permite gerenciar processamento de dados do Banban'
  }
];

// Definição das permissões do módulo Banban
export const BANBAN_PERMISSIONS = {
  // Permissões gerais do módulo
  VIEW_BANBAN: 'view-banban',
  MANAGE_BANBAN: 'manage-banban',

  // Permissões para Insights
  VIEW_INSIGHTS: 'view-banban-insights',
  MANAGE_INSIGHTS: 'manage-banban-insights',
  CREATE_INSIGHTS: 'create-banban-insights',
  DELETE_INSIGHTS: 'delete-banban-insights',

  // Permissões para Alertas
  VIEW_ALERTS: 'view-banban-alerts',
  MANAGE_ALERTS: 'manage-banban-alerts',
  CREATE_ALERTS: 'create-banban-alerts',
  DELETE_ALERTS: 'delete-banban-alerts',

  // Permissões para Inventário
  VIEW_INVENTORY: 'view-banban-inventory',
  MANAGE_INVENTORY: 'manage-banban-inventory',
  UPDATE_INVENTORY: 'update-banban-inventory',

  // Permissões para Performance
  VIEW_PERFORMANCE: 'view-banban-performance',
  MANAGE_PERFORMANCE: 'manage-banban-performance',
  ANALYZE_PERFORMANCE: 'analyze-banban-performance',

  // Permissões para Processamento de Dados
  VIEW_DATA_PROCESSING: 'view-banban-data-processing',
  MANAGE_DATA_PROCESSING: 'manage-banban-data-processing',
  PROCESS_EVENTS: 'process-banban-events',

  // Permissões de sistema
  ADMIN_BANBAN: 'admin-banban',
  CONFIG_BANBAN: 'config-banban'
} as const;

// Tipo que representa todas as permissões possíveis
export type BanbanPermission = typeof BANBAN_PERMISSIONS[keyof typeof BANBAN_PERMISSIONS];

// Grupos de permissões pré-definidos
export const BANBAN_PERMISSION_GROUPS = {
  // Grupo com todas as permissões (Super Admin)
  SUPER_ADMIN: Object.values(BANBAN_PERMISSIONS),

  // Grupo de administrador (sem acesso a configurações de sistema)
  ADMIN: [
    BANBAN_PERMISSIONS.VIEW_BANBAN,
    BANBAN_PERMISSIONS.MANAGE_BANBAN,
    BANBAN_PERMISSIONS.VIEW_INSIGHTS,
    BANBAN_PERMISSIONS.MANAGE_INSIGHTS,
    BANBAN_PERMISSIONS.CREATE_INSIGHTS,
    BANBAN_PERMISSIONS.VIEW_ALERTS,
    BANBAN_PERMISSIONS.MANAGE_ALERTS,
    BANBAN_PERMISSIONS.CREATE_ALERTS,
    BANBAN_PERMISSIONS.VIEW_INVENTORY,
    BANBAN_PERMISSIONS.MANAGE_INVENTORY,
    BANBAN_PERMISSIONS.UPDATE_INVENTORY,
    BANBAN_PERMISSIONS.VIEW_PERFORMANCE,
    BANBAN_PERMISSIONS.MANAGE_PERFORMANCE,
    BANBAN_PERMISSIONS.ANALYZE_PERFORMANCE,
    BANBAN_PERMISSIONS.VIEW_DATA_PROCESSING,
    BANBAN_PERMISSIONS.MANAGE_DATA_PROCESSING,
    BANBAN_PERMISSIONS.PROCESS_EVENTS
  ],

  // Grupo de gerente (pode visualizar e gerenciar, mas não deletar)
  MANAGER: [
    BANBAN_PERMISSIONS.VIEW_BANBAN,
    BANBAN_PERMISSIONS.VIEW_INSIGHTS,
    BANBAN_PERMISSIONS.MANAGE_INSIGHTS,
    BANBAN_PERMISSIONS.VIEW_ALERTS,
    BANBAN_PERMISSIONS.MANAGE_ALERTS,
    BANBAN_PERMISSIONS.VIEW_INVENTORY,
    BANBAN_PERMISSIONS.UPDATE_INVENTORY,
    BANBAN_PERMISSIONS.VIEW_PERFORMANCE,
    BANBAN_PERMISSIONS.ANALYZE_PERFORMANCE,
    BANBAN_PERMISSIONS.VIEW_DATA_PROCESSING
  ],

  // Grupo analista (foco em insights e performance)
  ANALYST: [
    BANBAN_PERMISSIONS.VIEW_BANBAN,
    BANBAN_PERMISSIONS.VIEW_INSIGHTS,
    BANBAN_PERMISSIONS.CREATE_INSIGHTS,
    BANBAN_PERMISSIONS.VIEW_ALERTS,
    BANBAN_PERMISSIONS.VIEW_INVENTORY,
    BANBAN_PERMISSIONS.VIEW_PERFORMANCE,
    BANBAN_PERMISSIONS.ANALYZE_PERFORMANCE,
    BANBAN_PERMISSIONS.VIEW_DATA_PROCESSING
  ],

  // Grupo operacional (foco em inventário e alertas)
  OPERATOR: [
    BANBAN_PERMISSIONS.VIEW_BANBAN,
    BANBAN_PERMISSIONS.VIEW_INSIGHTS,
    BANBAN_PERMISSIONS.VIEW_ALERTS,
    BANBAN_PERMISSIONS.VIEW_INVENTORY,
    BANBAN_PERMISSIONS.UPDATE_INVENTORY,
    BANBAN_PERMISSIONS.VIEW_PERFORMANCE
  ],

  // Grupo somente leitura (visualização apenas)
  VIEWER: [
    BANBAN_PERMISSIONS.VIEW_BANBAN,
    BANBAN_PERMISSIONS.VIEW_INSIGHTS,
    BANBAN_PERMISSIONS.VIEW_ALERTS,
    BANBAN_PERMISSIONS.VIEW_INVENTORY,
    BANBAN_PERMISSIONS.VIEW_PERFORMANCE,
    BANBAN_PERMISSIONS.VIEW_DATA_PROCESSING
  ],

  // Grupo técnico (foco em processamento de dados)
  TECHNICAL: [
    BANBAN_PERMISSIONS.VIEW_BANBAN,
    BANBAN_PERMISSIONS.VIEW_DATA_PROCESSING,
    BANBAN_PERMISSIONS.MANAGE_DATA_PROCESSING,
    BANBAN_PERMISSIONS.PROCESS_EVENTS,
    BANBAN_PERMISSIONS.VIEW_PERFORMANCE,
    BANBAN_PERMISSIONS.CONFIG_BANBAN
  ]
} as const;

// Função para verificar se um usuário tem uma permissão específica
export function hasPermission(userPermissions: string[], requiredPermission: BanbanPermission): boolean {
  return userPermissions.includes(requiredPermission);
}

// Função para verificar se um usuário tem todas as permissões de um grupo
export function hasPermissionGroup(userPermissions: string[], groupName: keyof typeof BANBAN_PERMISSION_GROUPS): boolean {
  const requiredPermissions = BANBAN_PERMISSION_GROUPS[groupName];
  return requiredPermissions.every(permission => userPermissions.includes(permission));
}

// Função para obter todas as permissões de um grupo
export function getPermissionGroup(groupName: keyof typeof BANBAN_PERMISSION_GROUPS): readonly string[] {
  return BANBAN_PERMISSION_GROUPS[groupName];
}

// Função para validar permissões baseadas no módulo específico
export function validateModulePermissions(userPermissions: string[], moduleId: string, action: string): boolean {
  const requiredPermission = `${action}-banban-${moduleId}` as BanbanPermission;
  return hasPermission(userPermissions, requiredPermission);
} 