// ================================================
// TYPES: MODULE SYSTEM
// ================================================
// Tipos para sistema de gestão de módulos
// Suporte a módulos planejados e implementados

export type ModuleStatus = 'PLANNED' | 'IMPLEMENTED' | 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'PAUSED';
export type ModuleType = 'standard' | 'custom';
export type ModulePriority = 'high' | 'medium' | 'low';
export type ModuleApproach = 'planned' | 'discovered';

// ================================================
// INTERFACES PRINCIPAIS
// ================================================

export interface OrganizationModule {
  id: string;
  organization_id: string;
  module_id: string;
  module_name: string;
  module_type: ModuleType;
  status: ModuleStatus;
  configuration: Record<string, any>;
  expected_features: string[];
  implementation_notes?: string;
  priority: ModulePriority;
  created_at: string;
  updated_at: string;
  implemented_at?: string;
  activated_at?: string;
}

export interface ModuleInfo {
  id: string;
  name: string;
  type: ModuleType;
  version: string;
  description: string;
  status: 'IMPLEMENTED' | 'ACTIVE' | 'INACTIVE' | 'INCOMPLETE' | 'BROKEN' | 'MISSING_FILES';
  requiredConfig: ConfigSchema;
  dependencies: string[];
  isAvailable: boolean;
  templatePath?: string;
  author?: string;
  vendor?: string;
  lastUpdated?: string;
  features?: string[];
  missingFiles?: string[];
  implementationHealth?: {
    status: 'healthy' | 'incomplete' | 'broken';
    missingComponents: string[];
    errors: string[];
    completionPercentage: number;
  };
}

export interface PlannedModule {
  id: string;
  name: string;
  type: ModuleType;
  expectedFeatures: string[];
  configurationTemplate: Record<string, any>;
  implementationNotes: string;
  priority: ModulePriority;
  estimatedHours?: number;
  requiredSkills?: string[];
  features?: string[];
  vendor?: string;
}

export interface ImplementedModule extends ModuleInfo {
  status: 'IMPLEMENTED';
  implementationDate: string;
  implementedBy?: string;
  testResults?: TestResult[];
  documentation?: string;
}

// ================================================
// CONFIGURAÇÃO E VALIDAÇÃO
// ================================================

export interface ConfigSchema {
  type: 'object';
  properties: Record<string, ConfigProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface ConfigProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  default?: any;
  enum?: any[];
  items?: ConfigProperty;
  properties?: Record<string, ConfigProperty>;
  required?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

// ================================================
// ESTRATÉGIA DE MÓDULOS
// ================================================

export interface ModuleStrategy {
  approach: ModuleApproach;
  expected_modules: string[];
  implementation_priority: ModulePriority;
  auto_discovery: boolean;
  last_scan?: string;
}

export interface ModuleDiscoveryResult {
  discovered: ModuleInfo[];
  planned: PlannedModule[];
  conflicts: ModuleConflict[];
  recommendations: ModuleRecommendation[];
}

export interface ModuleConflict {
  moduleId: string;
  type: 'dependency' | 'version' | 'configuration';
  description: string;
  severity: 'error' | 'warning';
  resolution?: string;
}

export interface ModuleRecommendation {
  type: 'add' | 'remove' | 'update' | 'configure';
  moduleId: string;
  reason: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
}

// ================================================
// ESTATÍSTICAS E MÉTRICAS
// ================================================

export interface ModuleStats {
  total: number;
  planned: number;
  implemented: number;
  active: number;
  inactive: number;
  cancelled: number;
  paused: number;
  by_type: {
    standard: number;
    custom: number;
  };
  by_priority: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface ModuleMetrics {
  organization_id: string;
  stats: ModuleStats;
  implementation_rate: number; // % de módulos implementados
  activation_rate: number; // % de módulos ativos
  average_implementation_time: number; // dias
  last_updated: string;
}

// ================================================
// TEMPLATES E GERAÇÃO
// ================================================

export interface ModuleTemplate {
  id: string;
  name: string;
  type: ModuleType;
  description: string;
  files: ModuleTemplateFile[];
  configuration: ConfigSchema;
  dependencies: string[];
  instructions: string[];
}

export interface ModuleTemplateFile {
  path: string;
  content: string;
  type: 'typescript' | 'javascript' | 'json' | 'markdown' | 'sql';
  description?: string;
}

// ================================================
// DETECÇÃO DE MÓDULOS ÓRFÃOS
// ================================================

export interface OrphanModule {
  id: string;
  name: string;
  reason: 'no_physical_files' | 'directory_exists_but_no_index' | 'invalid_structure';
  description: string;
  path: string;
  canAutoFix: boolean;
  severity: 'error' | 'warning' | 'info';
}

export interface IntegrityRecommendation {
  type: 'cleanup' | 'repair' | 'success';
  severity: 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  action: 'remove_orphan_records' | 'fix_implementation' | 'none';
  moduleIds: string[];
}

export interface ModuleIntegrityReport {
  totalModules: number;
  validModules: number;
  brokenModules: number;
  orphanModules: number;
  modules: {
    valid: ModuleInfo[];
    broken: ModuleInfo[];
    orphan: OrphanModule[];
  };
  recommendations: IntegrityRecommendation[];
}

// ================================================
// TESTES E QUALIDADE
// ================================================

export interface TestResult {
  type: 'unit' | 'integration' | 'e2e';
  passed: boolean;
  coverage?: number;
  duration: number;
  errors?: string[];
  timestamp: string;
}

export interface ModuleHealth {
  moduleId: string;
  status: 'healthy' | 'warning' | 'error';
  uptime: number;
  performance: {
    avg_response_time: number;
    error_rate: number;
    requests_per_minute: number;
  };
  dependencies: {
    name: string;
    status: 'healthy' | 'degraded' | 'down';
  }[];
  last_check: string;
}

// ================================================
// FORMULÁRIOS E UI
// ================================================

export interface CreateModuleFormData {
  module_id: string;
  module_name: string;
  module_type: ModuleType;
  expected_features: string[];
  implementation_notes: string;
  priority: ModulePriority;
  configuration: Record<string, any>;
}

export interface UpdateModuleFormData extends Partial<CreateModuleFormData> {
  id: string;
  status?: ModuleStatus;
}

export interface ModuleConfigFormData {
  moduleId: string;
  configuration: Record<string, any>;
  notes?: string;
}

// ================================================
// API RESPONSES
// ================================================

export interface ModuleApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
}

export interface ModuleListResponse extends ModuleApiResponse {
  data: {
    modules: OrganizationModule[];
    total: number;
    page: number;
    limit: number;
    filters: Record<string, any>;
  };
}

export interface ModuleStatsResponse extends ModuleApiResponse {
  data: ModuleStats;
}

export interface ModuleDiscoveryResponse extends ModuleApiResponse {
  data: ModuleDiscoveryResult;
}

// ================================================
// EVENTOS E AUDITORIA
// ================================================

export interface ModuleEvent {
  id: string;
  organization_id: string;
  module_id: string;
  event_type: 'created' | 'updated' | 'activated' | 'deactivated' | 'implemented' | 'cancelled';
  actor_user_id: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface ModuleAuditLog {
  id: string;
  organization_id: string;
  module_id: string;
  action: string;
  actor: string;
  before: Record<string, any>;
  after: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

// ================================================
// UTILITÁRIOS DE TIPO
// ================================================

export type ModuleStatusFilter = ModuleStatus | 'all';
export type ModuleTypeFilter = ModuleType | 'all';
export type ModulePriorityFilter = ModulePriority | 'all';

export interface ModuleFilters {
  status?: ModuleStatusFilter;
  type?: ModuleTypeFilter;
  priority?: ModulePriorityFilter;
  search?: string;
  organization_id?: string;
}

export interface ModuleSortOptions {
  field: 'name' | 'created_at' | 'updated_at' | 'priority' | 'status';
  direction: 'asc' | 'desc';
}

// ================================================
// CONSTANTES E ENUMS
// ================================================

export const MODULE_TYPE_LABELS: Record<ModuleType, string> = {
  standard: 'Padrão',
  custom: 'Customizado'
};

export const MODULE_PRIORITY_LABELS: Record<ModulePriority, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa'
};

export const MODULE_PRIORITY_COLORS: Record<ModulePriority, string> = {
  high: 'red',
  medium: 'yellow',
  low: 'green'
}; 