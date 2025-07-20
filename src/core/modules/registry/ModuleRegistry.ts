import { 
  IModuleRegistry,
  ModuleConfig,
  ModuleId,
  ModuleMetadata,
  ModuleLoadOptions,
  ModuleValidationResult,
  ModuleRegistryEvents
} from './types';

export class ModuleRegistry implements IModuleRegistry {
  private modules: Map<ModuleId, ModuleConfig>;
  private metadata: Map<ModuleId, ModuleMetadata>;
  private events: ModuleRegistryEvents;

  constructor(events?: ModuleRegistryEvents) {
    this.modules = new Map();
    this.metadata = new Map();
    this.events = events || {
      onModuleLoaded: () => {},
      onModuleUnloaded: () => {},
      onModuleError: () => {}
    };
  }

  async registerModule(module: ModuleConfig): Promise<ModuleMetadata> {
    try {
      // Validar módulo antes do registro
      const validation = await this.validateModule(module);
      if (!validation.isValid) {
        throw new Error(`Module validation failed: ${validation.errors.join(', ')}`);
      }

      // Registrar módulo
      this.modules.set(module.id, module);

      // Criar e armazenar metadata
      const metadata: ModuleMetadata = {
        id: module.id,
        version: module.version,
        status: 'ACTIVE',
        lastUpdated: new Date()
      };
      this.metadata.set(module.id, metadata);

      // Notificar carregamento
      this.events.onModuleLoaded(module.id);

      return metadata;
    } catch (error) {
      // Notificar erro
      this.events.onModuleError(module.id, error as Error);
      throw error;
    }
  }

  async unregisterModule(moduleId: ModuleId): Promise<void> {
    if (!this.modules.has(moduleId)) {
      throw new Error(`Module ${moduleId} not found`);
    }

    // Remover módulo e metadata
    this.modules.delete(moduleId);
    this.metadata.delete(moduleId);

    // Notificar descarregamento
    this.events.onModuleUnloaded(moduleId);
  }

  async getModule(moduleId: ModuleId): Promise<ModuleConfig | null> {
    return this.modules.get(moduleId) || null;
  }

  async listModules(): Promise<ModuleMetadata[]> {
    return Array.from(this.metadata.values());
  }

  async validateModule(
    module: ModuleConfig, 
    options: ModuleLoadOptions = {}
  ): Promise<ModuleValidationResult> {
    const errors: string[] = [];

    // Validações básicas
    if (!module.id) errors.push('Module ID is required');
    if (!module.version) errors.push('Module version is required');
    if (!module.name) errors.push('Module name is required');

    // Validar dependências
    if (options.validateDependencies && module.dependencies) {
      for (const [depId, version] of Object.entries(module.dependencies)) {
        const dep = await this.getModule(depId);
        if (!dep) {
          errors.push(`Dependency ${depId} not found`);
        }
      }
    }

    // Validar permissões
    if (options.validatePermissions && module.permissions) {
      const uniquePermIds = new Set();
      for (const perm of module.permissions) {
        if (!perm.id) {
          errors.push('Permission ID is required');
        }
        if (uniquePermIds.has(perm.id)) {
          errors.push(`Duplicate permission ID: ${perm.id}`);
        }
        uniquePermIds.add(perm.id);
      }
    }

    // Validar rotas
    if (options.validateRoutes && module.routes) {
      const validateRoute = (route: any) => {
        if (!route.path) errors.push('Route path is required');
        if (!route.component) errors.push('Route component is required');
        if (route.children) {
          route.children.forEach(validateRoute);
        }
      };
      module.routes.forEach(validateRoute);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 