import { z } from 'zod';

// ================================================
// TIPOS E SCHEMAS DE VALIDAÇÃO
// ================================================

// Schema para criação de módulo base
export const CreateBaseModuleSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífen'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').max(500, 'Descrição muito longa'),
  category: z.string().min(2, 'Categoria é obrigatória'),
  icon: z.string().min(2, 'Ícone é obrigatório'),
  route_pattern: z.string().min(1, 'Padrão de rota é obrigatório'),
  permissions_required: z.array(z.string()).optional().default([]),
  supports_multi_tenant: z.boolean().default(true),
  config_schema: z.record(z.any()).optional().default({}),
  dependencies: z.array(z.string()).optional().default([]),
  version: z.string().default('1.0.0'),
  tags: z.array(z.string()).optional().default([]),
  auto_create_standard: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

// Schema para atualização de módulo base
export const UpdateBaseModuleSchema = CreateBaseModuleSchema.partial().extend({
  id: z.string().uuid('ID deve ser um UUID válido'),
});

// Schema para formulário de edição (sem ID)
export const UpdateBaseModuleFormSchema = CreateBaseModuleSchema.partial().transform(data => ({
  ...data,
  dependencies: data.dependencies || [],
  tags: data.tags || [],
  permissions_required: data.permissions_required || [],
}));

// Tipos TypeScript inferidos dos schemas
export type CreateBaseModuleInput = z.infer<typeof CreateBaseModuleSchema>;
export type UpdateBaseModuleInput = z.infer<typeof UpdateBaseModuleSchema>;

// Tipo de retorno padrão das actions
export type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
};

// Interface para módulo base completo
export interface BaseModule {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  route_pattern: string;
  permissions_required: string[];
  supports_multi_tenant: boolean;
  config_schema: Record<string, any>;
  dependencies: string[];
  version: string;
  tags: string[];
  archived_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Schemas para implementações de módulos
export const CreateModuleImplementationSchema = z.object({
  base_module_id: z.string().uuid('ID do módulo base deve ser um UUID válido'),
  implementation_key: z.string().min(2, 'Chave deve ter pelo menos 2 caracteres').max(50, 'Chave muito longa')
    .regex(/^[a-z0-9-]+$/, 'Chave deve conter apenas letras minúsculas, números e hífen'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').max(500, 'Descrição muito longa'),
  version: z.string().default('1.0.0'),
  component_type: z.enum(['file', 'generated'], {
    required_error: 'Tipo de componente é obrigatório',
  }),
  template_type: z.string().nullable().optional(),
  template_config: z.record(z.any()).optional().default({}),
  component_path: z.string().optional(), // Para component_type = 'file'
  dependencies: z.array(z.string()).optional().default([]),
  config_schema_override: z.record(z.any()).optional(),
  audience: z.enum(['generic', 'client-specific', 'enterprise']).default('generic'),
  complexity: z.enum(['basic', 'standard', 'advanced', 'enterprise']).default('standard'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['active', 'inactive']).default('active'),
  is_default: z.boolean().default(false),
});

export const UpdateModuleImplementationSchema = CreateModuleImplementationSchema.partial().extend({
  id: z.string().uuid('ID deve ser um UUID válido'),
});

export type CreateModuleImplementationInput = z.infer<typeof CreateModuleImplementationSchema>;
export type UpdateModuleImplementationInput = z.infer<typeof UpdateModuleImplementationSchema>;

export interface ModuleImplementation {
  id: string;
  base_module_id: string;
  implementation_key: string;
  name: string;
  description: string;
  version: string;
  component_type: 'file' | 'generated';
  template_type?: string;
  template_config: Record<string, any>;
  component_path?: string;
  dependencies: string[];
  config_schema_override?: Record<string, any>;
  audience: 'generic' | 'client-specific' | 'enterprise';
  complexity: 'basic' | 'standard' | 'advanced' | 'enterprise';
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_default: boolean;
  archived_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  // Relacionamentos
  base_module?: BaseModule;
}

// Schemas para assignments de tenants
export const CreateTenantAssignmentSchema = z.object({
  organization_id: z.string().uuid('ID da organização deve ser um UUID válido'),
  base_module_id: z.string().uuid('ID do módulo base deve ser um UUID válido'),
  implementation_id: z.string().uuid('ID da implementação deve ser um UUID válido'),
  configuration: z.record(z.any()).default({}),
  permissions_override: z.array(z.string()).optional(),
  user_groups: z.array(z.string()).optional(),
  activation_date: z.string().datetime().optional(),
  deactivation_date: z.string().datetime().optional(),
  config_schema: z.record(z.any()).optional(),
  status: z.enum(['active', 'inactive', 'scheduled']).default('active'),
  notify_tenant: z.boolean().default(true),
});

export const UpdateTenantAssignmentSchema = CreateTenantAssignmentSchema.partial().extend({
  id: z.string().uuid('ID deve ser um UUID válido'),
});

export type CreateTenantAssignmentInput = z.infer<typeof CreateTenantAssignmentSchema>;
export type UpdateTenantAssignmentInput = z.infer<typeof UpdateTenantAssignmentSchema>;

export interface TenantModuleAssignment {
  organization_id: string;
  base_module_id: string;
  implementation_id: string;
  configuration: Record<string, any>;
  permissions_override?: string[];
  user_groups?: string[];
  activation_date?: string;
  deactivation_date?: string;
  config_schema?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string;
  // Relacionamentos
  organization?: { id: string; name: string; slug: string };
  base_module?: BaseModule;
  implementation?: ModuleImplementation;
}