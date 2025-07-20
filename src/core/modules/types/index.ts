/**
 * Tipos TypeScript para o Sistema de Módulos Dinâmico
 * Fase 2 - Core Registry Implementation
 */

import { ComponentType } from 'react';

// =============================================
// TIPOS BASE DO BANCO DE DADOS
// =============================================

export interface CoreModule {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: ModuleCategory;
  version: string;
  maturity_status: ModuleMaturityStatus;
  pricing_tier: ModulePricingTier;
  created_at: string;
  updated_at: string;
}

export interface ModuleImplementation {
  id: string;
  module_id: string;
  client_type: ClientType;
  component_path: string;
  name: string | null;
  icon_name: string | null;
  permissions: string[];
  config: Record<string, any>;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModuleNavigation {
  id: string;
  implementation_id: string;
  nav_type: NavigationType;
  nav_title: string;
  nav_order: number;
  parent_id: string | null;
  route_path: string | null;
  is_external: boolean;
  created_at: string;
}

export interface TenantModule {
  organization_id: string;
  module_id: string;
  implementation_id: string;
  is_visible: boolean;
  operational_status: OperationalStatus;
  custom_config: Record<string, any>;
  installed_at: string;
  last_accessed_at: string | null;
}

// =============================================
// ENUMS E TIPOS AUXILIARES
// =============================================

export type ModuleCategory = 'analytics' | 'operations' | 'insights' | 'reports' | 'settings' | 'admin';

export type ModuleMaturityStatus = 'ALPHA' | 'BETA' | 'GA' | 'DEPRECATED';

export type ModulePricingTier = 'FREE' | 'PREMIUM' | 'ENTERPRISE';

export type ClientType = 'banban' | 'riachuelo' | 'ca' | 'custom' | 'default';

export type NavigationType = 'direct' | 'submenu';

export type OperationalStatus = 'ENABLED' | 'DISABLED' | 'UPGRADING' | 'MAINTENANCE';

// =============================================
// TIPOS COMPOSTOS PARA USO NA APLICAÇÃO
// =============================================

export interface ModuleConfiguration {
  // Core module info
  slug: string;
  name: string;
  description: string | null;
  category: ModuleCategory;
  version: string;
  maturity_status: ModuleMaturityStatus;
  pricing_tier: ModulePricingTier;
  
  // Implementation info
  implementation: {
    id: string;
    client_type: ClientType;
    component_path: string;
    name: string | null;
    icon_name: string | null;
    permissions: string[];
    config: Record<string, any>;
    is_available: boolean;
  };
  
  // Navigation info (pode ser null se não houver navegação)
  navigation: {
    id: string;
    nav_type: NavigationType;
    nav_title: string;
    nav_order: number;
    parent_id: string | null;
    route_path: string | null;
    is_external: boolean;
    children?: ModuleNavigationItem[];
  } | null;
  
  // Tenant-specific info
  tenant: {
    is_visible: boolean;
    operational_status: OperationalStatus;
    custom_config: Record<string, any>;
    installed_at: string;
    last_accessed_at: string | null;
  };
}

export interface ModuleNavigationItem {
  id: string;
  nav_title: string;
  nav_order: number;
  route_path: string | null;
  is_external: boolean;
  children?: ModuleNavigationItem[];
}

// =============================================
// TIPOS PARA NAVEGAÇÃO DINÂMICA
// =============================================

export interface NavigationItem {
  id: string;
  title: string;
  icon?: string;
  href?: string;
  exact?: boolean;
  items?: Array<{
    title: string;
    href: string;
  }>;
}

export interface SidebarConfiguration {
  mode: 'admin' | 'tenant';
  slug?: string;
  organizationName?: string;
  navItems: NavigationItem[];
  headerConfig: {
    title: string;
    subtitle: string;
    iconBg: string;
  };
}

// =============================================
// TIPOS PARA MODULE REGISTRY
// =============================================

export interface ModuleRegistryConfig {
  enableCache: boolean;
  cacheTimeout: number; // em milissegundos
  fallbackComponent?: ComponentType<any>;
  errorComponent?: ComponentType<{ error: string }>;
  loadingComponent?: ComponentType<any>;
}

export interface LoadedModule {
  component: ComponentType<any>;
  config: ModuleConfiguration;
  loadedAt: number;
}

export interface ModuleLoadResult {
  success: boolean;
  component?: ComponentType<any>;
  error?: string;
  cached?: boolean;
}

// =============================================
// TIPOS PARA MODULE LOADER
// =============================================

export interface ModuleLoaderProps {
  organizationId: string;
  clientType: ClientType;
  moduleSlug: string;
  params?: Record<string, any>;
  organization?: any;
  fallbackComponent?: ComponentType<any>;
  onError?: (error: string) => void;
  onLoaded?: (config: ModuleConfiguration) => void;
}

export interface ModuleComponentProps {
  params: {
    slug: string;
    module: string;
  };
  organization?: any;
  moduleConfig?: ModuleConfiguration;
}

// =============================================
// TIPOS PARA BUSCA NO BANCO DE DADOS
// =============================================

export interface ModuleQueryParams {
  organizationId: string;
  clientType: ClientType;
  includeNavigation?: boolean;
  onlyVisible?: boolean;
  onlyEnabled?: boolean;
}

export interface ModuleQueryResult {
  modules: ModuleConfiguration[];
  total: number;
  cached: boolean;
  queryTime: number;
}

// =============================================
// TIPOS PARA CACHE E PERFORMANCE
// =============================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface ModuleCacheManager {
  get<T>(key: string): T | null;
  set<T>(key: string, data: T, ttl?: number): void;
  invalidate(key: string): void;
  clear(): void;
  size(): number;
}

// =============================================
// TIPOS PARA ERROS E VALIDAÇÃO
// =============================================

export interface ModuleError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
}

export interface ModuleValidationResult {
  valid: boolean;
  errors: ModuleError[];
  warnings: string[];
}

// =============================================
// TIPOS PARA HOOKS E CONTEXT
// =============================================

export interface ModuleContextValue {
  modules: ModuleConfiguration[];
  loading: boolean;
  error: string | null;
  refreshModules: () => Promise<void>;
  getModule: (slug: string) => ModuleConfiguration | null;
  hasAccess: (moduleSlug: string) => boolean;
}

export interface UseModuleRegistryReturn {
  registry: ModuleRegistry | null;
  loading: boolean;
  error: string | null;
  loadModule: (slug: string) => Promise<ComponentType<any> | null>;
  getConfiguration: (slug: string) => ModuleConfiguration | null;
  getNavigation: () => NavigationItem[];
}

// =============================================
// TIPOS PARA A CLASSE MODULE REGISTRY
// =============================================

export interface IModuleRegistry {
  loadModuleConfiguration(organizationId: string, clientType: ClientType): Promise<ModuleConfiguration[]>;
  loadComponent(componentPath: string): Promise<ComponentType<any>>;
  generateNavigation(modules: ModuleConfiguration[]): NavigationItem[];
  getModule(slug: string): ModuleConfiguration | null;
  clearCache(): void;
  preloadModules(modules: string[]): Promise<void>;
}

// =============================================
// TIPOS PARA ADMINISTRAÇÃO
// =============================================

export interface ModuleAdminConfig {
  canEdit: boolean;
  canDelete: boolean;
  canInstall: boolean;
  canConfigure: boolean;
}

export interface ModuleInstallRequest {
  organizationId: string;
  moduleSlug: string;
  implementationType: ClientType;
  customConfig?: Record<string, any>;
  autoEnable?: boolean;
}

export interface ModuleUpdateRequest {
  tenantModuleId: string;
  isVisible?: boolean;
  operationalStatus?: OperationalStatus;
  customConfig?: Record<string, any>;
}

// =============================================
// TIPOS PARA ANALYTICS E MONITORAMENTO
// =============================================

export interface ModuleUsageStats {
  moduleSlug: string;
  totalOrganizations: number;
  activeUsers: number;
  lastAccessed: string;
  averageLoadTime: number;
  errorRate: number;
}

export interface ModulePerformanceMetrics {
  loadTime: number;
  cacheHitRate: number;
  errorCount: number;
  memoryUsage: number;
}

// =============================================
// RE-EXPORTS PARA COMPATIBILIDADE
// =============================================

// Manter compatibilidade com sistema antigo
export type { ModuleComponent } from '@/shared/utils/module-component-registry';

// Export da interface principal para uso externo
export type ModuleRegistry = IModuleRegistry;