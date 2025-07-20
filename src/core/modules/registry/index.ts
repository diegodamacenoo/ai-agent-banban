export * from './ModuleRegistry';
// ModuleLoader is server-side only due to fs usage - import directly when needed
export * from './types';

// Re-export tipos principais para facilitar o uso
export type { 
  ModuleConfig,
  StandardModuleConfig,
  CustomModuleConfig,
  ModuleType,
  ModuleValidationResult,
  ModuleLoadOptions,
  ModuleRegistryEvents
} from './types'; 