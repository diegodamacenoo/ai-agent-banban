// Types específicos para página de detalhes do módulo

export interface ModuleDetail {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  is_active: boolean;
  implementations: ModuleImplementation[];
  tenant_assignments: TenantModuleAssignment[];
  created_at: string;
  updated_at: string;
}

export interface ModuleImplementation {
  id: string;
  base_module_id: string;
  implementation_key: string;
  name: string;
  component_path: string;
  audience: string;
  complexity: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantModuleAssignment {
  tenant_id: string;
  base_module_id: string;
  implementation_id: string;
  is_active: boolean;
  custom_config: Record<string, any>;
  assigned_at: string;
  updated_at: string;
  // Dados relacionados
  tenant_name?: string;
  tenant_slug?: string;
  implementation?: ModuleImplementation;
}

export interface RealTimeMetrics {
  module_id: string;
  current_usage: number;
  avg_response_time: number;
  uptime_percentage: number;
  cache_hit_rate: number;
  last_sync: string;
  total_requests_today: number;
  active_connections: number;
}

export interface TenantStatus {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  implementation_key: string;
  implementation_name: string;
  is_online: boolean;
  last_activity: string;
  response_time: number;
  error_count: number;
  status_color: 'green' | 'yellow' | 'red';
}

export interface ActivityLog {
  id: string;
  module_id: string;
  tenant_id?: string;
  tenant_name?: string;
  event_type: 'access' | 'error' | 'config_change' | 'system' | 'performance';
  event_description: string;
  metadata: Record<string, any>;
  created_at: string;
  severity: 'info' | 'warning' | 'error';
}

export interface ModuleIssue {
  id: string;
  module_id: string;
  tenant_id?: string;
  tenant_name?: string;
  issue_type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  suggested_actions: string[];
  is_resolved: boolean;
  created_at: string;
  resolved_at?: string;
}

export interface UsageChartData {
  date: string;
  requests: number;
  response_time: number;
  errors: number;
  unique_users: number;
}

export interface TestResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
  execution_time: number;
  timestamp: string;
}

export interface LoadTestResult {
  requests_per_second: number;
  avg_response_time: number;
  error_rate: number;
  peak_memory_usage: number;
  success: boolean;
  timestamp: string;
}

export interface ValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  config_health_score: number;
}

export interface RestartResult {
  success: boolean;
  message: string;
  downtime_seconds: number;
  timestamp: string;
}

export interface CacheResult {
  success: boolean;
  cleared_entries: number;
  memory_freed: string;
  timestamp: string;
}