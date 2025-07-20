import { ModuleLoader } from '../ModuleLoader';
import { ModuleType, StandardModuleConfig, CustomModuleConfig } from '../types';
import path from 'path';

jest.mock('fs/promises', () => ({
  access: jest.fn().mockResolvedValue(undefined)
}));

describe('ModuleLoader', () => {
  let moduleLoader: ModuleLoader;

  beforeEach(() => {
    moduleLoader = new ModuleLoader();
    jest.clearAllMocks();
  });

  const mockStandardModule: StandardModuleConfig = {
    id: 'inventory',
    name: 'Inventory Module',
    version: '1.0.0',
    clientType: 'standard',
    isActive: true,
    features: ['stock-control', 'inventory-tracking'],
    endpoints: ['/api/inventory']
  };

  const mockCustomModule: CustomModuleConfig = {
    id: 'custom-inventory',
    name: 'Custom Inventory Module',
    version: '1.0.0',
    clientType: 'custom',
    isActive: true,
    customCodePath: path.join('src', 'modules', 'custom', 'inventory'),
    apiEndpoints: [
      { path: '/api/custom/inventory', method: 'GET', handler: 'handleInventory' }
    ],
    configuration: {
      stockThreshold: 100
    }
  };

  describe('loadModule', () => {
    it('should load a standard module successfully', async () => {
      jest.mock(path.join(process.cwd(), 'src/core/modules/standard/inventory'), () => ({
        default: class {},
        handleINVENTORY: () => {}
      }), { virtual: true });

      const result = await moduleLoader.loadModule(mockStandardModule);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should load a custom module successfully', async () => {
      jest.mock(path.join(process.cwd(), mockCustomModule.customCodePath), () => ({
        default: class {},
        handleInventory: () => {},
        validateConfig: () => ({ isValid: true, errors: [] })
      }), { virtual: true });

      const result = await moduleLoader.loadModule(mockCustomModule);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate module configuration', async () => {
      const invalidModule: StandardModuleConfig = {
        ...mockStandardModule,
        id: ''
      };

      const result = await moduleLoader.loadModule(invalidModule);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ID do módulo é obrigatório');
    });

    it('should validate dependencies', async () => {
      const moduleWithDeps: StandardModuleConfig = {
        ...mockStandardModule,
        dependencies: ['non-existent-module']
      };

      const result = await moduleLoader.loadModule(moduleWithDeps);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Dependência não encontrada: non-existent-module');
    });
  });

  describe('unloadModule', () => {
    it('should unload a module successfully', async () => {
      // Primeiro carrega o módulo
      await moduleLoader.loadModule(mockStandardModule);

      // Depois tenta descarregar
      const result = await moduleLoader.unloadModule(mockStandardModule.id);
      expect(result).toBe(true);
    });

    it('should return false for non-existent module', async () => {
      const result = await moduleLoader.unloadModule('non-existent');
      expect(result).toBe(false);
    });

    it('should call cleanup for custom modules', async () => {
      const cleanup = jest.fn();
      jest.mock(path.join(process.cwd(), mockCustomModule.customCodePath), () => ({
        default: class {},
        handleInventory: () => {},
        validateConfig: () => ({ isValid: true, errors: [] }),
        cleanup
      }), { virtual: true });

      await moduleLoader.loadModule(mockCustomModule);
      await moduleLoader.unloadModule(mockCustomModule.id);

      expect(cleanup).toHaveBeenCalled();
    });
  });

  describe('getLoadedModule and getAllLoadedModules', () => {
    beforeEach(async () => {
      await moduleLoader.loadModule(mockStandardModule);
      await moduleLoader.loadModule(mockCustomModule);
    });

    it('should get a specific loaded module', () => {
      const loadedModule = moduleLoader.getLoadedModule(mockStandardModule.id);
      expect(loadedModule).toEqual(mockStandardModule);
    });

    it('should get all loaded modules', () => {
      const modules = moduleLoader.getAllLoadedModules();
      expect(modules).toHaveLength(2);
      expect(modules).toContainEqual(mockStandardModule);
      expect(modules).toContainEqual(mockCustomModule);
    });
  });
}); 