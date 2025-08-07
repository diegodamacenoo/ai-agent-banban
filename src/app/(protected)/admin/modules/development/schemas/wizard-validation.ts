import { z } from 'zod';

/**
 * Schema central unificado para validação do wizard de criação de módulos.
 * Define todas as regras de validação em um local único para evitar divergência.
 */

// Schema para configuração básica
export const BasicConfigSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-Z0-9\s\-_áàâãéèêíìîóòôõúùûç]+$/, 'Nome contém caracteres inválidos'),
  
  slug: z.string()
    .min(2, 'Slug deve ter pelo menos 2 caracteres')
    .max(50, 'Slug deve ter no máximo 50 caracteres')
    .regex(/^[a-z0-9\-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  
  description: z.string()
    .min(10, 'Descrição deve ter pelo menos 10 caracteres')
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),
  
  version: z.string()
    .regex(/^\d+\.\d+\.\d+$/, 'Versão deve seguir o formato semver (ex: 1.0.0)'),
  
  category: z.string()
    .min(1, 'Categoria é obrigatória'),
  
  icon: z.string()
    .min(1, 'Ícone é obrigatório')
    .default('Package'),
  
  route_pattern: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true; // Opcional, então vazio é válido
      // Validar padrão de rota se fornecido
      return /^\/[a-z0-9\-\/\[\]]*$/.test(val);
    }, 'Padrão de rota inválido'),
  
  supports_multi_tenant: z.boolean()
    .default(true),
  
  exclusive_tenant_id: z.string()
    .nullable()
    .optional(),
  
  auto_create_standard: z.boolean()
    .default(true),
  
  tags: z.array(z.string())
    .default([])
});

// Schema para implementação
export const ImplementationConfigSchema = z.object({
  name: z.string()
    .min(3, 'Nome da implementação deve ter pelo menos 3 caracteres')
    .max(150, 'Nome da implementação deve ter no máximo 150 caracteres'),
  
  implementation_key: z.string()
    .min(2, 'Chave deve ter pelo menos 2 caracteres')
    .max(50, 'Chave deve ter no máximo 50 caracteres')
    .regex(/^[a-z0-9\-]+$/, 'Chave deve conter apenas letras minúsculas, números e hífens'),
  
  description: z.string()
    .min(10, 'Descrição deve ter pelo menos 10 caracteres')
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),
  
  version: z.string()
    .regex(/^\d+\.\d+\.\d+$/, 'Versão deve seguir o formato semver (ex: 1.0.0)'),
  
  component_type: z.enum(['file', 'generated', 'dynamic'])
    .default('file'),
  
  component_path: z.string()
    .min(2, 'Caminho do componente é obrigatório')
    .max(100, 'Caminho do componente deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-Z][a-zA-Z0-9_\/]*$/, 'Caminho do componente inválido'),
  
  template_type: z.enum(['dashboard', 'table', 'chart', 'form', 'custom'])
    .default('dashboard'),
  
  audience: z.enum(['generic', 'client-specific', 'enterprise'])
    .default('generic'),
  
  complexity: z.enum(['basic', 'standard', 'advanced', 'enterprise'])
    .default('standard'),
  
  priority: z.enum(['low', 'medium', 'high', 'critical'])
    .default('medium'),
  
  status: z.enum(['active', 'inactive', 'deprecated'])
    .default('active'),
  
  is_default: z.boolean()
    .default(true),
  
  template_config: z.record(z.any())
    .default({}),
  
  config_schema_override: z.record(z.any())
    .default({})
});

// Schema para atribuições de cliente
export const ClientAssignmentSchema = z.object({
  tenant_id: z.string()
    .uuid('ID do tenant inválido'),
  
  tenant_name: z.string()
    .min(1, 'Nome do tenant é obrigatório'),
  
  is_active: z.boolean()
    .default(true)
});

// Schema principal do wizard
export const WizardConfigSchema = z.object({
  type: z.enum(['standard', 'custom'])
    .refine(val => val !== undefined, 'Tipo do módulo é obrigatório'),
  
  basic: BasicConfigSchema,
  
  implementation: ImplementationConfigSchema
    .optional(),
  
  client_assignments: z.array(ClientAssignmentSchema)
    .default([]),
  
  auto_generated: z.object({
    slug: z.string(),
    implementation_key: z.string(),
    component_path: z.string()
  }).optional(),
  
  creation_result: z.any()
    .optional()
});

/**
 * Validação por step - extrai apenas os campos relevantes do schema principal
 */
export const StepValidationSchemas = {
  'module-type': WizardConfigSchema.pick({ type: true }),
  
  'basic-config': WizardConfigSchema.pick({ basic: true }),
  
  'implementation-config': WizardConfigSchema.pick({ 
    implementation: true,
    auto_generated: true 
  }),
  
  'client-config': WizardConfigSchema.pick({ 
    client_assignments: true 
  }),
  
  'final-review': WizardConfigSchema.pick({
    type: true,
    basic: true,
    implementation: true,
    client_assignments: true
  })
};

/**
 * Função helper para validar um step específico
 */
export function validateWizardStep(stepId: string, config: any) {
  const schema = StepValidationSchemas[stepId as keyof typeof StepValidationSchemas];
  
  if (!schema) {
    return { success: false, error: 'Step de validação não encontrado' };
  }
  
  try {
    const result = schema.safeParse(config);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        error: 'Dados inválidos',
        issues: result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: 'Erro interno de validação',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Validação completa de todo o wizard
 */
export function validateFullWizard(config: any) {
  return WizardConfigSchema.safeParse(config);
}

/**
 * Função superRefine para validações condicionais complexas
 */
export const WizardConfigSchemaWithSuperRefine = WizardConfigSchema.superRefine((data, ctx) => {
  // Se tipo é standard e auto_create_standard é false, implementação é obrigatória
  if (data.type === 'standard' && !data.basic.auto_create_standard && !data.implementation) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Implementação é obrigatória quando auto_create_standard está desabilitado',
      path: ['implementation']
    });
  }
  
  // Se tipo é custom, implementação é sempre obrigatória
  if (data.type === 'custom' && !data.implementation) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Implementação é obrigatória para módulos personalizados',
      path: ['implementation']
    });
  }
  
  // Se supports_multi_tenant é false, exclusive_tenant_id é obrigatório
  if (!data.basic.supports_multi_tenant && !data.basic.exclusive_tenant_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Tenant exclusivo é obrigatório quando multi-tenant está desabilitado',
      path: ['basic', 'exclusive_tenant_id']
    });
  }
  
  // Validar consistência entre slug básico e implementation_key
  if (data.implementation && data.auto_generated) {
    const expectedKey = `${data.basic.slug}-impl`;
    if (data.implementation.implementation_key !== expectedKey && 
        data.auto_generated.implementation_key !== expectedKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Chave da implementação deve ser consistente com o slug do módulo',
        path: ['implementation', 'implementation_key']
      });
    }
  }
});

export type WizardConfig = z.infer<typeof WizardConfigSchema>;
export type BasicConfig = z.infer<typeof BasicConfigSchema>;
export type ImplementationConfig = z.infer<typeof ImplementationConfigSchema>;
export type ClientAssignment = z.infer<typeof ClientAssignmentSchema>;