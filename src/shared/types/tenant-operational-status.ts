// ================================================
// TENANT OPERATIONAL STATUS TYPES
// ================================================
// Tipos TypeScript para o sistema refinado de gestão de status operacional por tenant

// ================================================
// ENUMS DE STATUS OPERACIONAL
// ================================================

/**
 * Status operacional de um módulo para um tenant específico (10 estados)
 */
export type TenantOperationalStatus = 
  | 'REQUESTED'         // Tenant clicou Enable
  | 'PENDING_APPROVAL'  // Aguardando aprovação humana ou crédito
  | 'PROVISIONING'      // Infra, tabelas, chaves
  | 'ENABLED'           // Pronto para uso
  | 'UPGRADING'         // Executando scripts de upgrade
  | 'UP_TO_DATE'        // Última versão GA
  | 'SUSPENDED'         // Pagamento/límites
  | 'DISABLED'          // Desligado pelo tenant
  | 'ARCHIVED'          // Dados exportados/purgados
  | 'ERROR';            // Falha de setup/upgrade

/**
 * Políticas de visibilidade no marketplace
 */
export type ModuleVisibilityPolicy = 
  | 'HIDDEN'    // Não aparece no marketplace
  | 'INTERNAL'  // Apenas para internal testers
  | 'PUBLIC';   // Visível para todos

/**
 * Políticas de solicitação/aprovação
 */
export type ModuleRequestPolicy = 
  | 'DENY_ALL'        // Botão Enable desabilitado
  | 'MANUAL_APPROVAL' // Requer aprovação humana
  | 'AUTO_APPROVE';   // Aprovação automática

/**
 * Políticas de auto-habilitação
 */
export type ModuleAutoEnablePolicy = 
  | 'NONE'        // Não habilita automaticamente
  | 'NEW_TENANTS' // Habilita para novos tenants
  | 'ALL_TENANTS'; // Habilita para todos os tenants

/**
 * Tipos de tenant
 */
export type TenantType = 
  | 'STANDARD'        // Tenant padrão
  | 'INTERNAL_TESTER' // Testador interno
  | 'BETA_TESTER'     // Testador beta
  | 'ENTERPRISE';     // Cliente enterprise

/**
 * Status de saúde do módulo
 */
export type ModuleHealthStatus = 
  | 'healthy'  // Funcionando normalmente
  | 'warning'  // Funcionando com alertas
  | 'critical' // Funcionando com problemas críticos
  | 'unknown'; // Status desconhecido

// ================================================
// INTERFACES PRINCIPAIS
// ================================================

/**
 * Módulo do catálogo com políticas de disponibilidade
 */
export interface CoreModuleWithPolicies {
  id: string;
  module_id: string;
  slug: string;
  name: string;
  description: string;
  maturity: string;
  status: string;
  
  // Políticas de disponibilidade
  default_visibility: ModuleVisibilityPolicy;
  request_policy: ModuleRequestPolicy;
  auto_enable_policy: ModuleAutoEnablePolicy;
  internal_notes?: string;
  approval_required_reason?: string;
  
  // Metadados
  created_at: string;
  updated_at: string;
  
  // Campos opcionais do catálogo
  dependencies?: string[];
  category?: string;
  pricing_tier?: string;
  is_available?: boolean;
  requires_approval?: boolean;
}

/**
 * Módulo operacional por tenant (estado completo)
 */
export interface TenantModuleOperational {
  organization_id: string;
  module_id: string;
  
  // Status operacional
  operational_status: TenantOperationalStatus;
  last_status_change: string;
  status_change_reason?: string;
  
  // Aprovação
  approval_requested_at?: string;
  approved_by?: string;
  approved_at?: string;
  
  // Provisioning
  provisioning_started_at?: string;
  provisioning_completed_at?: string;
  
  // Saúde e monitoramento
  last_health_check?: string;
  health_status: ModuleHealthStatus;
  error_details?: Record<string, any>;
  retry_count: number;
  
  // Billing e limites
  billing_enabled: boolean;
  usage_limits: Record<string, any>;
  current_usage: Record<string, any>;
  
  // Configuração
  auto_upgrade: boolean;
  locked_version: boolean;
  
  // Metadados
  activated_at?: string;
  updated_at: string;
  
  // Dados do módulo (join)
  core_module?: CoreModuleWithPolicies;
}

/**
 * Histórico de mudanças de status
 */
export interface TenantModuleStatusHistory {
  id: string;
  organization_id: string;
  module_id: string;
  previous_status?: TenantOperationalStatus;
  new_status: TenantOperationalStatus;
  changed_by?: string;
  change_reason?: string;
  change_metadata: Record<string, any>;
  created_at: string;
}

/**
 * Solicitação de aprovação de módulo
 */
export interface ModuleApprovalRequest {
  id: string;
  organization_id: string;
  module_id: string;
  requested_by: string;
  request_reason?: string;
  request_metadata: Record<string, any>;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'CANCELLED';
  reviewed_by?: string;
  review_notes?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  
  // Dados relacionados (joins)
  module?: CoreModuleWithPolicies;
  requester?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  reviewer?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

/**
 * Organização com tipo de tenant
 */
export interface OrganizationWithTenantType {
  id: string;
  company_legal_name: string;
  company_trading_name: string;
  tenant_type: TenantType;
  beta_features_enabled: boolean;
  internal_tester: boolean;
  created_at: string;
  updated_at: string;
}

// ================================================
// INTERFACES DE CONSULTA E RESPOSTA
// ================================================

/**
 * Módulo disponível para solicitação por um tenant
 */
export interface AvailableModuleForTenant {
  module_id: string;
  name: string;
  description: string;
  maturity: string;
  default_visibility: ModuleVisibilityPolicy;
  request_policy: ModuleRequestPolicy;
  can_request: boolean;
  
  // Dados adicionais do catálogo
  category?: string;
  pricing_tier?: string;
  dependencies?: string[];
  requires_approval?: boolean;
}

/**
 * Estatísticas de status operacional
 */
export interface TenantOperationalStats {
  total_modules: number;
  by_status: {
    REQUESTED: number;
    PENDING_APPROVAL: number;
    PROVISIONING: number;
    ENABLED: number;
    UPGRADING: number;
    UP_TO_DATE: number;
    SUSPENDED: number;
    DISABLED: number;
    ARCHIVED: number;
    ERROR: number;
  };
  health_summary: {
    healthy: number;
    warning: number;
    critical: number;
    unknown: number;
  };
}

/**
 * Resultado de transição de status
 */
export interface StatusTransitionResult {
  success: boolean;
  previous_status?: TenantOperationalStatus;
  new_status?: TenantOperationalStatus;
  error?: string;
  validation_errors?: string[];
  metadata?: Record<string, any>;
}

// ================================================
// INTERFACES DE AÇÃO E OPERAÇÃO
// ================================================

/**
 * Parâmetros para atualização de status
 */
export interface UpdateStatusParams {
  organization_id: string;
  module_id: string;
  new_status: TenantOperationalStatus;
  changed_by?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Parâmetros para solicitação de módulo
 */
export interface ModuleRequestParams {
  organization_id: string;
  module_id: string;
  requested_by: string;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Parâmetros para aprovação/negação de solicitação
 */
export interface ApprovalDecisionParams {
  request_id: string;
  decision: 'APPROVED' | 'DENIED';
  reviewed_by: string;
  review_notes?: string;
  metadata?: Record<string, any>;
}

// ================================================
// MAPEAMENTOS E UTILITÁRIOS
// ================================================

/**
 * Rótulos em português para status operacional
 */
export const OPERATIONAL_STATUS_LABELS: Record<TenantOperationalStatus, string> = {
  'REQUESTED': 'Solicitado',
  'PENDING_APPROVAL': 'Aguardando Aprovação',
  'PROVISIONING': 'Provisionando',
  'ENABLED': 'Habilitado',
  'UPGRADING': 'Atualizando',
  'UP_TO_DATE': 'Atualizado',
  'SUSPENDED': 'Suspenso',
  'DISABLED': 'Desabilitado',
  'ARCHIVED': 'Arquivado',
  'ERROR': 'Erro'
};

/**
 * Descrições detalhadas para tooltips
 */
export const OPERATIONAL_STATUS_DESCRIPTIONS: Record<TenantOperationalStatus, string> = {
  'REQUESTED': 'Módulo foi solicitado pelo tenant mas ainda não foi processado',
  'PENDING_APPROVAL': 'Solicitação aguardando aprovação manual ou verificação de créditos',
  'PROVISIONING': 'Sistema está criando infraestrutura, tabelas e configurações necessárias',
  'ENABLED': 'Módulo está ativo e pronto para uso pelo tenant',
  'UPGRADING': 'Sistema está executando scripts de atualização para nova versão',
  'UP_TO_DATE': 'Módulo está na última versão estável disponível',
  'SUSPENDED': 'Módulo foi suspenso devido a problemas de pagamento ou limites excedidos',
  'DISABLED': 'Módulo foi desabilitado pelo tenant ou administrador',
  'ARCHIVED': 'Dados do módulo foram exportados e purgados do sistema',
  'ERROR': 'Ocorreu um erro durante setup, upgrade ou operação do módulo'
};

/**
 * Cores/variantes para badges de status
 */
export const OPERATIONAL_STATUS_VARIANTS: Record<TenantOperationalStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  'REQUESTED': 'outline',
  'PENDING_APPROVAL': 'secondary',
  'PROVISIONING': 'secondary',
  'ENABLED': 'success',
  'UPGRADING': 'secondary',
  'UP_TO_DATE': 'success',
  'SUSPENDED': 'warning',
  'DISABLED': 'outline',
  'ARCHIVED': 'outline',
  'ERROR': 'destructive'
};

/**
 * Transições válidas entre status
 */
export const VALID_STATUS_TRANSITIONS: Record<TenantOperationalStatus, TenantOperationalStatus[]> = {
  'REQUESTED': ['PENDING_APPROVAL', 'PROVISIONING', 'ERROR'],
  'PENDING_APPROVAL': ['PROVISIONING', 'ERROR'],
  'PROVISIONING': ['ENABLED', 'ERROR'],
  'ENABLED': ['UP_TO_DATE', 'UPGRADING', 'SUSPENDED', 'DISABLED', 'ERROR'],
  'UPGRADING': ['UP_TO_DATE', 'ERROR'],
  'UP_TO_DATE': ['UPGRADING', 'SUSPENDED', 'DISABLED'],
  'SUSPENDED': ['ENABLED', 'DISABLED', 'ARCHIVED'],
  'DISABLED': ['ENABLED', 'ARCHIVED'],
  'ARCHIVED': ['DISABLED'],
  'ERROR': ['PROVISIONING', 'UPGRADING', 'DISABLED']
};

/**
 * Rótulos para políticas de visibilidade
 */
export const VISIBILITY_POLICY_LABELS: Record<ModuleVisibilityPolicy, string> = {
  'HIDDEN': 'Oculto',
  'INTERNAL': 'Interno',
  'PUBLIC': 'Público'
};

/**
 * Rótulos para políticas de solicitação
 */
export const REQUEST_POLICY_LABELS: Record<ModuleRequestPolicy, string> = {
  'DENY_ALL': 'Bloqueado',
  'MANUAL_APPROVAL': 'Aprovação Manual',
  'AUTO_APPROVE': 'Aprovação Automática'
};

/**
 * Rótulos para políticas de auto-habilitação
 */
export const AUTO_ENABLE_POLICY_LABELS: Record<ModuleAutoEnablePolicy, string> = {
  'NONE': 'Nenhuma',
  'NEW_TENANTS': 'Novos Tenants',
  'ALL_TENANTS': 'Todos os Tenants'
};

/**
 * Rótulos para tipos de tenant
 */
export const TENANT_TYPE_LABELS: Record<TenantType, string> = {
  'STANDARD': 'Padrão',
  'INTERNAL_TESTER': 'Testador Interno',
  'BETA_TESTER': 'Testador Beta',
  'ENTERPRISE': 'Empresarial'
};

// ================================================
// FUNÇÕES UTILITÁRIAS
// ================================================

/**
 * Verifica se uma transição de status é válida
 */
export function isValidStatusTransition(
  currentStatus: TenantOperationalStatus,
  newStatus: TenantOperationalStatus
): boolean {
  return VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

/**
 * Obtém próximos status válidos para um status atual
 */
export function getValidNextStatuses(
  currentStatus: TenantOperationalStatus
): TenantOperationalStatus[] {
  return VALID_STATUS_TRANSITIONS[currentStatus] ?? [];
}

/**
 * Verifica se um módulo pode ser solicitado por um tenant
 */
export function canTenantRequestModule(
  module: CoreModuleWithPolicies,
  tenantType: TenantType,
  isInternalTester: boolean = false
): boolean {
  // Verificar política de solicitação
  if (module.request_policy === 'DENY_ALL') {
    return false;
  }
  
  // Verificar visibilidade
  if (module.default_visibility === 'HIDDEN') {
    return false;
  }
  
  if (module.default_visibility === 'INTERNAL' && !isInternalTester) {
    return false;
  }
  
  return true;
}

/**
 * Determina se um módulo deve ser auto-habilitado para um tenant
 */
export function shouldAutoEnableForTenant(
  module: CoreModuleWithPolicies,
  isNewTenant: boolean = false
): boolean {
  if (module.auto_enable_policy === 'NONE') {
    return false;
  }
  
  if (module.auto_enable_policy === 'NEW_TENANTS' && isNewTenant) {
    return true;
  }
  
  if (module.auto_enable_policy === 'ALL_TENANTS') {
    return true;
  }
  
  return false;
} 