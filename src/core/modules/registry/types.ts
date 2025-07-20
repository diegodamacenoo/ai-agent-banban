import { ComponentType, LazyExoticComponent } from 'react';

export type ModuleId = string;
export type ModuleVersion = string;

export interface ModulePermission {
  id: string;
  name: string;
  description: string;
}

export interface ModuleRoute {
  path: string;
  component: ComponentType<any> | LazyExoticComponent<ComponentType<any>> | (() => Promise<{ default: ComponentType<any> }>);
  permissions?: string[];
  children?: ModuleRoute[];
}

export interface ModuleEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: Function;
}

export interface ModuleConfig {
  id: ModuleId;
  version: ModuleVersion;
  name: string;
  description: string;
  author: string;
  dependencies?: Record<string, string>;
  permissions: ModulePermission[];
  routes: ModuleRoute[];
  endpoints?: ModuleEndpoint[];
  isCustom?: boolean;
}

export interface StandardModuleConfig extends ModuleConfig {
  isCustom: false;
  features: string[];
}

export interface CustomModuleConfig extends ModuleConfig {
  isCustom: true;
  customCodePath: string;
  configuration: Record<string, any>;
}

export interface ModuleMetadata {
  id: ModuleId;
  version: ModuleVersion;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  lastUpdated: Date;
  error?: string;
}

export interface ModuleLoadOptions {
  validateDependencies?: boolean;
  validatePermissions?: boolean;
  validateRoutes?: boolean;
  validateEndpoints?: boolean;
  validateConfiguration?: boolean;
}

export type ModuleValidationResult = {
  isValid: boolean;
  errors: string[];
};

export interface IModuleRegistry {
  registerModule(module: ModuleConfig): Promise<ModuleMetadata>;
  unregisterModule(moduleId: ModuleId): Promise<void>;
  getModule(moduleId: ModuleId): Promise<ModuleConfig | null>;
  listModules(): Promise<ModuleMetadata[]>;
  validateModule(module: ModuleConfig, options?: ModuleLoadOptions): Promise<ModuleValidationResult>;
}

export interface ModuleRegistryEvents {
  onModuleLoaded: (moduleId: string) => void;
  onModuleUnloaded: (moduleId: string) => void;
  onModuleError: (moduleId: string, error: Error) => void;
}

export type ModuleType = StandardModuleConfig | CustomModuleConfig; 