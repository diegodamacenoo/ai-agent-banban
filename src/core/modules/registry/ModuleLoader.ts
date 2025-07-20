import { 
  ModuleConfig,
  ModuleLoadOptions,
  ModuleValidationResult,
  ModuleMetadata,
  ModuleId,
  StandardModuleConfig,
  CustomModuleConfig,
  ModuleType
} from './types';
import path from 'path';
import fs from 'fs/promises';

export class ModuleLoader {
  private loadedModules: Map<ModuleId, ModuleConfig>;
  private loadedMetadata: Map<ModuleId, ModuleMetadata>;
  private options: ModuleLoadOptions;

  constructor(options: ModuleLoadOptions = {}) {
    this.loadedModules = new Map();
    this.loadedMetadata = new Map();
    this.options = {
      validateDependencies: true,
      validateEndpoints: true,
      validateConfiguration: true,
      ...options
    };
  }

  /**
   * Carrega um módulo e suas dependências
   */
  async loadModule(
    module: ModuleType,
    options: ModuleLoadOptions = {}
  ): Promise<ModuleValidationResult> {
    try {
      // Validar módulo antes do carregamento
      const validationResult = await this.validateModule(module, options);
      if (!validationResult.isValid) {
        return validationResult;
      }

      // Carregar dependências primeiro
      if (module.dependencies && options.validateDependencies) {
        for (const [depId, version] of Object.entries(module.dependencies)) {
          const depModule = this.loadedModules.get(depId);
          if (!depModule) {
            return {
              isValid: false,
              errors: [`Dependência não encontrada: ${depId}`]
            };
          }
          // TODO: Implementar verificação de versão
        }
      }

      // Validações específicas por tipo
      if (module.isCustom) {
        const customModule = module;
        if (options.validateConfiguration && !customModule.configuration) {
          return {
            isValid: false,
            errors: ['Configuração é obrigatória para módulos customizados']
          };
        }
      } else {
        const standardModule = module;
        if (!standardModule.features || standardModule.features.length === 0) {
          return {
            isValid: false,
            errors: ['Features são obrigatórias para módulos padrão']
          };
        }
      }

      // Registrar módulo
      this.loadedModules.set(module.id, module);

      // Criar e registrar metadata
      const metadata: ModuleMetadata = {
        id: module.id,
        version: module.version,
        status: 'active',
        lastUpdated: new Date()
      };
      this.loadedMetadata.set(module.id, metadata);

      return {
        isValid: true,
        errors: []
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Erro ao carregar módulo: ${(error as Error).message}`]
      };
    }
  }

  /**
   * Descarrega um módulo e suas dependências
   */
  async unloadModule(moduleId: ModuleId): Promise<boolean> {
    try {
      // Verificar se existem módulos dependentes
      for (const [id, module] of this.loadedModules.entries()) {
        if (module.dependencies?.[moduleId]) {
          return false; // Não pode descarregar módulo com dependentes
        }
      }

      // Remover módulo e metadata
      this.loadedModules.delete(moduleId);
      this.loadedMetadata.delete(moduleId);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Valida um módulo antes do carregamento
   */
  private async validateModule(
    module: ModuleType,
    options: ModuleLoadOptions = {}
  ): Promise<ModuleValidationResult> {
    const errors: string[] = [];

    // Validações básicas
    if (!module.id) errors.push('ID do módulo é obrigatório');
    if (!module.version) errors.push('Versão do módulo é obrigatória');
    if (!module.name) errors.push('Nome do módulo é obrigatório');

    // Validar dependências
    if (options.validateDependencies && module.dependencies) {
      for (const [depId, version] of Object.entries(module.dependencies)) {
        if (!this.loadedModules.has(depId)) {
          errors.push(`Dependência não encontrada: ${depId}`);
        }
        // TODO: Implementar validação de versão
      }
    }

    // Validar permissões
    if (options.validatePermissions && module.permissions) {
      const uniquePermIds = new Set();
      for (const perm of module.permissions) {
        if (!perm.id) {
          errors.push('ID da permissão é obrigatório');
        }
        if (uniquePermIds.has(perm.id)) {
          errors.push(`ID de permissão duplicado: ${perm.id}`);
        }
        uniquePermIds.add(perm.id);
      }
    }

    // Validar rotas
    if (options.validateRoutes && module.routes) {
      const validateRoute = (route: any) => {
        if (!route.path) errors.push('Path da rota é obrigatório');
        if (!route.component) errors.push('Componente da rota é obrigatório');
        if (route.children) {
          route.children.forEach(validateRoute);
        }
      };
      module.routes.forEach(validateRoute);
    }

    // Validar endpoints
    if (options.validateEndpoints && module.endpoints) {
      for (const endpoint of module.endpoints) {
        if (!endpoint.path) errors.push('Path do endpoint é obrigatório');
        if (!endpoint.method) errors.push('Método do endpoint é obrigatório');
        if (!endpoint.handler) errors.push('Handler do endpoint é obrigatório');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Retorna um módulo carregado
   */
  getLoadedModule(moduleId: ModuleId): ModuleConfig | undefined {
    return this.loadedModules.get(moduleId);
  }

  /**
   * Retorna todos os módulos carregados
   */
  getAllLoadedModules(): ModuleConfig[] {
    return Array.from(this.loadedModules.values());
  }

  /**
   * Retorna metadata de um módulo
   */
  getModuleMetadata(moduleId: ModuleId): ModuleMetadata | undefined {
    return this.loadedMetadata.get(moduleId);
  }

  /**
   * Retorna metadata de todos os módulos
   */
  getAllModuleMetadata(): ModuleMetadata[] {
    return Array.from(this.loadedMetadata.values());
  }

  private async loadCustomModule(moduleConfig: CustomModuleConfig): Promise<void> {
    const modulePath = path.resolve(process.cwd(), moduleConfig.customCodePath);
    
    try {
      // Verificar se o arquivo existe
      await fs.access(modulePath);
      
      // Carregar módulo dinamicamente
      const moduleImplementation = await import(modulePath);
      
      // Validar implementação do módulo
      if (!moduleImplementation.default) {
        throw new Error(`Módulo ${moduleConfig.id} não exporta uma implementação padrão`);
      }

      // Validar endpoints
      if (this.options.validateEndpoints && moduleConfig.endpoints) {
        for (const endpoint of moduleConfig.endpoints) {
          const handlerName = endpoint.handler.name || 'handler';
          if (!moduleImplementation[handlerName]) {
            throw new Error(`Handler ${handlerName} não encontrado no módulo ${moduleConfig.id}`);
          }
        }
      }

      // Validar configuração
      if (this.options.validateConfiguration) {
        if (!moduleImplementation.validateConfig) {
          throw new Error(`Módulo ${moduleConfig.id} não implementa método validateConfig`);
        }
        const configValidation = await moduleImplementation.validateConfig(moduleConfig.configuration);
        if (!configValidation.isValid) {
          throw new Error(`Configuração inválida para módulo ${moduleConfig.id}: ${configValidation.errors.join(', ')}`);
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Falha ao carregar módulo customizado ${moduleConfig.id}: ${errorMessage}`);
    }
  }

  private async loadStandardModule(moduleConfig: StandardModuleConfig): Promise<void> {
    const modulePath = path.resolve(process.cwd(), 'src/core/modules/standard', moduleConfig.id);
    
    try {
      // Verificar se o diretório existe
      await fs.access(modulePath);
      
      // Carregar implementação padrão
      const moduleImplementation = await import(path.join(modulePath, 'index'));
      
      // Validar implementação do módulo
      if (!moduleImplementation.default) {
        throw new Error(`Módulo ${moduleConfig.id} não exporta uma implementação padrão`);
      }

      // Validar endpoints
      if (this.options.validateEndpoints && moduleConfig.endpoints) {
        for (const endpoint of moduleConfig.endpoints) {
          const routeHandler = moduleImplementation[`handle${endpoint.path.replace('/api/', '').toUpperCase()}`];
          if (!routeHandler) {
            throw new Error(`Handler não encontrado para endpoint ${endpoint.path} no módulo ${moduleConfig.id}`);
          }
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Falha ao carregar módulo padrão ${moduleConfig.id}: ${errorMessage}`);
    }
  }
} 