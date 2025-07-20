import { ModuleRegistry } from '../ModuleRegistry';
import { ModuleConfig, ModulePermission, ModuleEndpoint, ModuleRoute } from '../types';
import { ReactNode } from 'react';

describe('ModuleRegistry', () => {
  let moduleRegistry: ModuleRegistry;
  let mockEvents: {
    onModuleLoaded: jest.Mock;
    onModuleUnloaded: jest.Mock;
    onModuleError: jest.Mock;
  };

  beforeEach(() => {
    mockEvents = {
      onModuleLoaded: jest.fn(),
      onModuleUnloaded: jest.fn(),
      onModuleError: jest.fn()
    };
    moduleRegistry = new ModuleRegistry(mockEvents);
  });

  const TestComponent = () => null;
  const CustomTestComponent = () => null;

  const mockStandardModule: ModuleConfig = {
    id: 'test-module',
    name: 'Test Module',
    version: '1.0.0',
    description: 'Test module description',
    author: 'Test Author',
    permissions: [
      {
        id: 'test-permission',
        name: 'Test Permission',
        description: 'Test permission description'
      }
    ],
    routes: [
      {
        path: '/test',
        component: TestComponent as unknown as ReactNode
      }
    ],
    endpoints: [
      {
        path: '/api/test',
        method: 'GET',
        handler: () => null
      }
    ]
  };

  const mockCustomModule: ModuleConfig = {
    id: 'custom-test',
    name: 'Custom Test Module',
    version: '1.0.0',
    description: 'Custom test module description',
    author: 'Custom Test Author',
    permissions: [
      {
        id: 'custom-permission',
        name: 'Custom Permission',
        description: 'Custom permission description'
      }
    ],
    routes: [
      {
        path: '/custom/test',
        component: CustomTestComponent as unknown as ReactNode
      }
    ],
    endpoints: [
      {
        path: '/api/custom/test',
        method: 'GET',
        handler: () => null
      }
    ]
  };

  describe('registerModule', () => {
    it('should successfully register a standard module', async () => {
      const metadata = await moduleRegistry.registerModule(mockStandardModule);
      
      expect(metadata).toBeDefined();
      expect(metadata.id).toBe(mockStandardModule.id);
      expect(metadata.version).toBe(mockStandardModule.version);
      expect(metadata.status).toBe('ACTIVE');
      expect(mockEvents.onModuleLoaded).toHaveBeenCalledWith(mockStandardModule.id);
    });

    it('should successfully register a custom module', async () => {
      const metadata = await moduleRegistry.registerModule(mockCustomModule);
      
      expect(metadata).toBeDefined();
      expect(metadata.id).toBe(mockCustomModule.id);
      expect(metadata.version).toBe(mockCustomModule.version);
      expect(metadata.status).toBe('ACTIVE');
      expect(mockEvents.onModuleLoaded).toHaveBeenCalledWith(mockCustomModule.id);
    });

    it('should fail to register module without required fields', async () => {
      const invalidModule = { ...mockStandardModule, id: '' };
      
      await expect(moduleRegistry.registerModule(invalidModule))
        .rejects.toThrow('Module validation failed');
      expect(mockEvents.onModuleError).toHaveBeenCalled();
    });

    it('should validate dependencies if present', async () => {
      const moduleWithDeps = {
        ...mockStandardModule,
        id: 'module-with-deps',
        dependencies: { 'test-module': '1.0.0' }
      };

      // Primeiro registra a dependência
      await moduleRegistry.registerModule(mockStandardModule);
      
      // Depois registra o módulo que depende dela
      const metadata = await moduleRegistry.registerModule(moduleWithDeps);
      
      expect(metadata).toBeDefined();
      expect(metadata.status).toBe('ACTIVE');
    });
  });

  describe('unregisterModule', () => {
    it('should successfully unregister a module', async () => {
      await moduleRegistry.registerModule(mockStandardModule);
      await moduleRegistry.unregisterModule(mockStandardModule.id);
      
      const testModule = await moduleRegistry.getModule(mockStandardModule.id);
      expect(testModule).toBeNull();
      expect(mockEvents.onModuleUnloaded).toHaveBeenCalledWith(mockStandardModule.id);
    });

    it('should throw error when unregistering non-existent module', async () => {
      await expect(moduleRegistry.unregisterModule('non-existent'))
        .rejects.toThrow('Module non-existent not found');
    });
  });

  describe('getModule', () => {
    it('should return registered module', async () => {
      await moduleRegistry.registerModule(mockStandardModule);
      
      const testModule = await moduleRegistry.getModule(mockStandardModule.id);
      expect(testModule).toEqual(mockStandardModule);
    });

    it('should return null for non-existent module', async () => {
      const testModule = await moduleRegistry.getModule('non-existent');
      expect(testModule).toBeNull();
    });
  });

  describe('listModules', () => {
    it('should list all registered modules', async () => {
      await moduleRegistry.registerModule(mockStandardModule);
      await moduleRegistry.registerModule(mockCustomModule);
      
      const modules = await moduleRegistry.listModules();
      expect(modules).toHaveLength(2);
      expect(modules.map(m => m.id)).toContain(mockStandardModule.id);
      expect(modules.map(m => m.id)).toContain(mockCustomModule.id);
    });

    it('should return empty array when no modules registered', async () => {
      const modules = await moduleRegistry.listModules();
      expect(modules).toHaveLength(0);
    });
  });

  describe('validateModule', () => {
    it('should validate module with all required fields', async () => {
      const result = await moduleRegistry.validateModule(mockStandardModule);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing required fields', async () => {
      const invalidModule = {
        ...mockStandardModule,
        id: '',
        version: ''
      };

      const result = await moduleRegistry.validateModule(invalidModule);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Module ID is required');
      expect(result.errors).toContain('Module version is required');
    });

    it('should validate module permissions when option enabled', async () => {
      const moduleWithDuplicatePerms: ModuleConfig = {
        ...mockStandardModule,
        permissions: [
          { id: 'perm1', name: 'Permission 1', description: 'Test permission' },
          { id: 'perm1', name: 'Permission 1 Duplicate', description: 'Test permission duplicate' }
        ]
      };

      const result = await moduleRegistry.validateModule(moduleWithDuplicatePerms, {
        validatePermissions: true
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Duplicate permission ID: perm1');
    });

    it('should validate module routes when option enabled', async () => {
      const moduleWithInvalidRoutes: ModuleConfig = {
        ...mockStandardModule,
        routes: [
          { path: '', component: TestComponent as unknown as ReactNode }
        ]
      };

      const result = await moduleRegistry.validateModule(moduleWithInvalidRoutes, {
        validateRoutes: true
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Route path is required');
    });
  });

  describe('getModulesByType', () => {
    beforeEach(async () => {
      await moduleRegistry.registerModule(mockStandardModule);
      await moduleRegistry.registerModule(mockCustomModule);
    });

    it('deve retornar apenas módulos padrão', () => {
      const standardModules = moduleRegistry.getModulesByType('standard');
      
      expect(standardModules).toHaveLength(1);
      expect(standardModules[0].id).toBe(mockStandardModule.id);
    });

    it('deve retornar apenas módulos customizados', () => {
      const customModules = moduleRegistry.getModulesByType('custom');
      
      expect(customModules).toHaveLength(1);
      expect(customModules[0].id).toBe(mockCustomModule.id);
    });
  });

  describe('getActiveModules', () => {
    it('deve retornar apenas módulos ativos', async () => {
      const inactiveModule: ModuleConfig = {
        ...mockStandardModule,
        id: 'inactive-module',
        isActive: false
      };

      await moduleRegistry.registerModule(mockStandardModule);
      await moduleRegistry.registerModule(inactiveModule);

      const activeModules = moduleRegistry.getActiveModules();
      
      expect(activeModules).toHaveLength(1);
      expect(activeModules[0].id).toBe(mockStandardModule.id);
    });
  });

  describe('initializeStandardModules', () => {
    it('deve inicializar todos os módulos padrão', async () => {
      await moduleRegistry.initializeStandardModules();
      const standardModules = moduleRegistry.getModulesByType('standard');
      
      expect(standardModules).toHaveLength(3); // inventory, performance, analytics
      expect(standardModules.map(m => m.id)).toContain('inventory');
      expect(standardModules.map(m => m.id)).toContain('performance');
      expect(standardModules.map(m => m.id)).toContain('analytics');
    });
  });
}); 