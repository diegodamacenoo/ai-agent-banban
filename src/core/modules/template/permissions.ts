import { Permission } from '../../types/permission';

export const permissions: Permission[] = [
  {
    id: 'view-template',
    name: 'View Template',
    description: 'Permite visualizar o módulo template'
  },
  {
    id: 'manage-template',
    name: 'Manage Template',
    description: 'Permite gerenciar o módulo template'
  },
  {
    id: 'view-resource1',
    name: 'View Resource 1',
    description: 'Permite visualizar o recurso 1'
  },
  {
    id: 'manage-resource1',
    name: 'Manage Resource 1',
    description: 'Permite gerenciar o recurso 1'
  },
  {
    id: 'view-resource2',
    name: 'View Resource 2',
    description: 'Permite visualizar o recurso 2'
  },
  {
    id: 'manage-resource2',
    name: 'Manage Resource 2',
    description: 'Permite gerenciar o recurso 2'
  }
];

// Definição das permissões do módulo template
export const TEMPLATE_PERMISSIONS = {
  // Permissões para Resource1
  VIEW_RESOURCE1: 'view-resource1',
  MANAGE_RESOURCE1: 'manage-resource1',
  DELETE_RESOURCE1: 'delete-resource1',

  // Permissões para Resource2
  VIEW_RESOURCE2: 'view-resource2',
  MANAGE_RESOURCE2: 'manage-resource2',
  DELETE_RESOURCE2: 'delete-resource2'
} as const;

// Tipo que representa todas as permissões possíveis
export type TemplatePermission = typeof TEMPLATE_PERMISSIONS[keyof typeof TEMPLATE_PERMISSIONS];

// Grupos de permissões pré-definidos
export const TEMPLATE_PERMISSION_GROUPS = {
  // Grupo com todas as permissões
  ADMIN: Object.values(TEMPLATE_PERMISSIONS),

  // Grupo somente leitura
  VIEWER: [
    TEMPLATE_PERMISSIONS.VIEW_RESOURCE1,
    TEMPLATE_PERMISSIONS.VIEW_RESOURCE2
  ],

  // Grupo com permissões de gerenciamento (sem delete)
  MANAGER: [
    TEMPLATE_PERMISSIONS.VIEW_RESOURCE1,
    TEMPLATE_PERMISSIONS.MANAGE_RESOURCE1,
    TEMPLATE_PERMISSIONS.VIEW_RESOURCE2,
    TEMPLATE_PERMISSIONS.MANAGE_RESOURCE2
  ]
} as const; 