// ================================================
// MODULE LIFECYCLE TYPES
// ================================================
// Tipos TypeScript para o sistema de ciclo de vida de módulos

import { ModuleInfo, OrganizationModule } from './module-system';

// ================================================
// HEALTH STATUS
// ================================================

export type ModuleHealthStatus = 
  | 'DISCOVERED'     // Módulo descoberto mas não registrado
  | 'IMPLEMENTED'    // Módulo implementado e funcionando
  | 'ACTIVE'         // Módulo ativo em produção
  | 'MISSING'        // Arquivo do módulo não encontrado
  | 'ORPHANED'       // Módulo registrado mas sem arquivo
  | 'ARCHIVED';      // Módulo arquivado/desabilitado

// ================================================
// ESTATÍSTICAS DE HEALTH
// ================================================

export interface ModuleHealthStats {
  discovered: number;
  implemented: number;
  active: number;
  planned: number;
  missing: number;
  orphaned: number;
  archived: number;
  total: number;
}

// ================================================
// INFORMAÇÕES DE ARQUIVO
// ================================================

export interface ModuleFileInfo {
  file_path: string;
  file_hash: string;
  file_last_seen: string;
  module_version?: string;
  missing_since?: string;
  missing_notified: boolean;
  locked_version?: string;
}

// ================================================
// AUDITORIA DE ARQUIVO
// ================================================

export interface ModuleFileAudit {
  id: string;
  organization_id: string;
  module_id: string;
  file_path: string;
  file_hash: string;
  change_type: 'file_created' | 'file_updated' | 'file_deleted' | 'hash_changed';
  detected_at: string;
  previous_hash?: string;
  metadata?: Record<string, any>;
}

// ================================================
// RESULTADOS DE ESCANEAMENTO
// ================================================

export interface ModuleScanResult {
  moduleId: string;
  status: ModuleHealthStatus;
  filePath?: string;
  fileHash?: string;
  version?: string;
  lastSeen: string;
  changes: ModuleFileChange[];
  errors?: string[];
}

export interface ModuleFileChange {
  type: 'discovered' | 'updated' | 'missing' | 'restored';
  timestamp: string;
  details: string;
  previousHash?: string;
  currentHash?: string;
}

export interface HealthScanResults {
  totalScanned: number;
  discovered: ModuleScanResult[];
  updated: ModuleScanResult[];
  missing: ModuleScanResult[];
  errors: Array<{
    moduleId: string;
    error: string;
  }>;
  timestamp: string;
  duration: number;
}

// ================================================
// INTERFACES DE MONITORAMENTO
// ================================================

export interface ModuleFileMonitorConfig {
  scanIntervalMinutes: number;
  enableAutoScanning: boolean;
  notifyOnMissing: boolean;
  retryAttempts: number;
  hashAlgorithm: 'md5' | 'sha256';
}

export interface ModuleHealthAlert {
  id: string;
  organization_id: string;
  module_id: string;
  alert_type: 'missing_file' | 'hash_changed' | 'version_mismatch' | 'module_restored';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, any>;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

// ================================================
// MÓDULO LIFECYCLE EXTENDIDO
// ================================================

export interface ModuleLifecycleInfo extends OrganizationModule {
  health_status: ModuleHealthStatus;
  file_info?: ModuleFileInfo;
  last_scan?: string;
  scan_errors?: string[];
  file_history?: ModuleFileAudit[];
  alerts?: ModuleHealthAlert[];
}

// ================================================
// RESPONSES DA API
// ================================================

export interface ModuleHealthStatsResponse {
  success: boolean;
  data?: ModuleHealthStats;
  error?: string;
  code?: string;
  timestamp: string;
}

export interface ModuleScanResponse {
  success: boolean;
  data?: HealthScanResults;
  error?: string;
  code?: string;
  timestamp: string;
}

export interface ModuleFileHistoryResponse {
  success: boolean;
  data?: ModuleFileAudit[];
  error?: string;
  code?: string;
  timestamp: string;
}

// ================================================
// FILTROS E CONSULTAS
// ================================================

export interface ModuleHealthFilter {
  status?: ModuleHealthStatus[];
  organization_id?: string;
  module_type?: 'standard' | 'custom';
  has_alerts?: boolean;
  missing_since?: {
    from?: string;
    to?: string;
  };
  last_seen?: {
    from?: string;
    to?: string;
  };
}

export interface ModuleHealthQuery {
  filters: ModuleHealthFilter;
  sort?: {
    field: keyof ModuleLifecycleInfo;
    direction: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

// ================================================
// ACTIONS DO LIFECYCLE
// ================================================

export interface ModuleLifecycleAction {
  type: 'mark_missing' | 'restore_module' | 'archive_module' | 'force_rescan' | 'update_version';
  moduleId: string;
  organizationId: string;
  params?: Record<string, any>;
  reason?: string;
}

export interface ModuleLifecycleActionResult {
  success: boolean;
  action: ModuleLifecycleAction;
  before_status: ModuleHealthStatus;
  after_status: ModuleHealthStatus;
  changes: string[];
  timestamp: string;
  error?: string;
}

// ================================================
// CONFIGURAÇÃO DE ORGANIZAÇÃO
// ================================================

export interface OrganizationModuleLifecycleConfig {
  organization_id: string;
  enable_auto_scanning: boolean;
  scan_frequency_minutes: number;
  notify_on_missing: boolean;
  notify_on_changes: boolean;
  auto_archive_missing_days: number;
  allowed_module_types: ('standard' | 'custom')[];
  version_lock_enabled: boolean;
  health_check_endpoints?: string[];
}

// ================================================
// MÉTRICAS E RELATÓRIOS
// ================================================

export interface ModuleHealthMetrics {
  organization_id: string;
  period_start: string;
  period_end: string;
  total_modules: number;
  health_distribution: Record<ModuleHealthStatus, number>;
  avg_uptime_percentage: number;
  incidents_count: number;
  resolved_incidents_count: number;
  mean_time_to_resolution_hours: number;
  modules_discovered: number;
  modules_archived: number;
  file_changes_detected: number;
}

export interface ModuleHealthTrend {
  date: string;
  total_modules: number;
  healthy_modules: number;
  missing_modules: number;
  health_percentage: number;
}

export interface ModuleHealthReport {
  organization: {
    id: string;
    name: string;
  };
  period: {
    start: string;
    end: string;
  };
  summary: ModuleHealthMetrics;
  trends: ModuleHealthTrend[];
  critical_issues: ModuleHealthAlert[];
  recommendations: string[];
  generated_at: string;
} 