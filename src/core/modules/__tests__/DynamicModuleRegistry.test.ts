/**
 * Testes unitários para DynamicModuleRegistry
 * Fase 2 - Core Registry Implementation
 */

import React from 'react';
import { DynamicModuleRegistry } from '../registry/DynamicModuleRegistry';
import { moduleConfigurationService } from '../services/ModuleConfigurationService';
import { ModuleConfiguration, ClientType } from '../types';

// Mock do service
jest.mock('../services/ModuleConfigurationService', () => ({
  moduleConfigurationService: {
    getModuleConfigurations: jest.fn(),
    getModuleBySlug: jest.fn(),
    hasModuleAccess: jest.fn(),
    updateLastAccess: jest.fn(),
  }
}));

// Mock de importação dinâmica
const mockImport = jest.fn();
jest.mock('dynamic import', () => mockImport);

describe('DynamicModuleRegistry', () => {
  let registry: DynamicModuleRegistry;
  const mockModuleConfigurationService = moduleConfigurationService as jest.Mocked<typeof moduleConfigurationService>;

  beforeEach(() => {
    // Resetar singleton para cada teste
    (DynamicModuleRegistry as any).instance = undefined;
    registry = DynamicModuleRegistry.getInstance({
      enableCache: false // Desabilitar cache para testes
    });
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    registry.clearCache();
  });

  describe('Singleton Pattern', () => {
    it('deve retornar a mesma instância', () => {
      const instance1 = DynamicModuleRegistry.getInstance();
      const instance2 = DynamicModuleRegistry.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('loadModuleConfiguration', () => {
    const mockModules: ModuleConfiguration[] = [
      {
        slug: 'performance',
        name: 'Performance Analytics',
        description: 'Performance module',
        category: 'analytics',
        version: '1.0.0',
        maturity_status: 'GA',
        pricing_tier: 'FREE',
        implementation: {
          id: 'impl-1',
          client_type: 'banban',
          component_path: '@/clients/banban/components/PerformancePage',
          name: 'Performance',
          icon_name: 'Activity',
          permissions: ['performance.view'],
          config: {},
          is_available: true
        },
        navigation: {
          id: 'nav-1',
          nav_type: 'direct',
          nav_title: 'Performance',
          nav_order: 1,
          parent_id: null,
          route_path: '/performance',
          is_external: false
        },
        tenant: {
          id: 'tenant-1',
          is_visible: true,
          operational_status: 'ENABLED',
          custom_config: {},
          installed_at: '2023-01-01T00:00:00Z',
          last_accessed_at: null
        }
      }
    ];

    beforeEach(() => {
      mockModuleConfigurationService.getModuleConfigurations.mockResolvedValue({
        modules: mockModules,
        total: 1,
        cached: false,
        queryTime: 100
      });
    });

    it('deve carregar configurações de módulos', async () => {
      const result = await registry.loadModuleConfiguration('org-1', 'banban');
      
      expect(result).toEqual(mockModules);
      expect(mockModuleConfigurationService.getModuleConfigurations).toHaveBeenCalledWith({
        organizationId: 'org-1',
        clientType: 'banban',
        includeNavigation: true,
        onlyVisible: true,
        onlyEnabled: true
      });
    });

    it('deve lidar com erros ao carregar configurações', async () => {
      const error = new Error('Database error');
      mockModuleConfigurationService.getModuleConfigurations.mockRejectedValue(error);
      
      await expect(registry.loadModuleConfiguration('org-1', 'banban'))
        .rejects.toThrow('Database error');
    });
  });

  describe('loadComponent', () => {
    const mockComponent = () => React.createElement('div', null, 'Mock Component');

    beforeEach(() => {
      // Mock global import function
      (global as any).import = jest.fn();
    });

    it('deve carregar componente com sucesso', async () => {
      ((global as any).import as jest.Mock).mockResolvedValue({
        default: mockComponent
      });

      const result = await registry.loadComponent('@/test/component');
      
      expect(result).toBe(mockComponent);
      expect((global as any).import).toHaveBeenCalledWith('@/test/component');
    });

    it('deve tentar diferentes estratégias de import', async () => {
      // Primeira tentativa falha
      ((global as any).import as jest.Mock)
        .mockRejectedValueOnce(new Error('Not found'))
        .mockResolvedValueOnce({ default: mockComponent });

      const result = await registry.loadComponent('@/test/component');
      
      expect(result).toBe(mockComponent);
      expect((global as any).import).toHaveBeenCalledTimes(2);
    });

    it('deve lidar com componente não encontrado', async () => {
      ((global as any).import as jest.Mock).mockRejectedValue(new Error('Module not found'));

      await expect(registry.loadComponent('@/nonexistent'))
        .rejects.toThrow('Componente não encontrado');
    });
  });

  describe('generateNavigation', () => {
    it('deve gerar navegação para módulos diretos', () => {
      const modules: ModuleConfiguration[] = [
        {
          slug: 'performance',
          name: 'Performance',
          description: null,
          category: 'analytics',
          version: '1.0.0',
          maturity_status: 'GA',
          pricing_tier: 'FREE',
          implementation: {
            id: 'impl-1',
            client_type: 'banban',
            component_path: '@/test',
            name: null,
            icon_name: 'Activity',
            permissions: [],
            config: {},
            is_available: true
          },
          navigation: {
            id: 'nav-1',
            nav_type: 'direct',
            nav_title: 'Performance',
            nav_order: 1,
            parent_id: null,
            route_path: '/performance',
            is_external: false
          },
          tenant: {
            id: 'tenant-1',
            is_visible: true,
            operational_status: 'ENABLED',
            custom_config: {},
            installed_at: '2023-01-01T00:00:00Z',
            last_accessed_at: null
          }
        }
      ];

      const navigation = registry.generateNavigation(modules);
      
      expect(navigation).toEqual([
        {
          id: 'performance',
          title: 'Performance',
          icon: 'Activity',
          href: '/performance',
          exact: false
        }
      ]);
    });

    it('deve gerar navegação para módulos com submenu', () => {
      const modules: ModuleConfiguration[] = [
        {
          slug: 'insights',
          name: 'Insights',
          description: null,
          category: 'analytics',
          version: '1.0.0',
          maturity_status: 'GA',
          pricing_tier: 'FREE',
          implementation: {
            id: 'impl-1',
            client_type: 'banban',
            component_path: '@/test',
            name: null,
            icon_name: 'BarChart3',
            permissions: [],
            config: {},
            is_available: true
          },
          navigation: {
            id: 'nav-1',
            nav_type: 'submenu',
            nav_title: 'Insights',
            nav_order: 1,
            parent_id: null,
            route_path: null,
            is_external: false,
            children: [
              {
                id: 'nav-2',
                nav_title: 'Dashboard',
                nav_order: 1,
                route_path: '/insights',
                is_external: false
              },
              {
                id: 'nav-3',
                nav_title: 'Reports',
                nav_order: 2,
                route_path: '/insights/reports',
                is_external: false
              }
            ]
          },
          tenant: {
            id: 'tenant-1',
            is_visible: true,
            operational_status: 'ENABLED',
            custom_config: {},
            installed_at: '2023-01-01T00:00:00Z',
            last_accessed_at: null
          }
        }
      ];

      const navigation = registry.generateNavigation(modules);
      
      expect(navigation).toEqual([
        {
          id: 'insights',
          title: 'Insights',
          icon: 'BarChart3',
          items: [
            { title: 'Dashboard', href: '/insights' },
            { title: 'Reports', href: '/insights/reports' }
          ]
        }
      ]);
    });

    it('deve ordenar navegação por nav_order', () => {
      const modules: ModuleConfiguration[] = [
        {
          slug: 'module-b',
          name: 'Module B',
          description: null,
          category: 'analytics',
          version: '1.0.0',
          maturity_status: 'GA',
          pricing_tier: 'FREE',
          implementation: {
            id: 'impl-2',
            client_type: 'banban',
            component_path: '@/test',
            name: null,
            icon_name: 'Star',
            permissions: [],
            config: {},
            is_available: true
          },
          navigation: {
            id: 'nav-2',
            nav_type: 'direct',
            nav_title: 'Module B',
            nav_order: 2,
            parent_id: null,
            route_path: '/module-b',
            is_external: false
          },
          tenant: {
            id: 'tenant-2',
            is_visible: true,
            operational_status: 'ENABLED',
            custom_config: {},
            installed_at: '2023-01-01T00:00:00Z',
            last_accessed_at: null
          }
        },
        {
          slug: 'module-a',
          name: 'Module A',
          description: null,
          category: 'analytics',
          version: '1.0.0',
          maturity_status: 'GA',
          pricing_tier: 'FREE',
          implementation: {
            id: 'impl-1',
            client_type: 'banban',
            component_path: '@/test',
            name: null,
            icon_name: 'Circle',
            permissions: [],
            config: {},
            is_available: true
          },
          navigation: {
            id: 'nav-1',
            nav_type: 'direct',
            nav_title: 'Module A',
            nav_order: 1,
            parent_id: null,
            route_path: '/module-a',
            is_external: false
          },
          tenant: {
            id: 'tenant-1',
            is_visible: true,
            operational_status: 'ENABLED',
            custom_config: {},
            installed_at: '2023-01-01T00:00:00Z',
            last_accessed_at: null
          }
        }
      ];

      const navigation = registry.generateNavigation(modules);
      
      expect(navigation[0].title).toBe('Module A');
      expect(navigation[1].title).toBe('Module B');
    });
  });

  describe('getModule', () => {
    it('deve retornar null para módulo não encontrado', () => {
      const result = registry.getModule('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('deve limpar todos os caches', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      registry.clearCache();
      
      expect(consoleSpy).toHaveBeenCalledWith('🗑️ DynamicModuleRegistry: Cache limpo');
      
      consoleSpy.mockRestore();
    });
  });

  describe('loadModuleWithComponent', () => {
    it('deve carregar módulo e componente juntos', async () => {
      const mockComponent = () => React.createElement('div', null, 'Test');
      
      mockModuleConfigurationService.getModuleConfigurations.mockResolvedValue({
        modules: [{
          slug: 'test-module',
          name: 'Test',
          description: null,
          category: 'analytics',
          version: '1.0.0',
          maturity_status: 'GA',
          pricing_tier: 'FREE',
          implementation: {
            id: 'impl-1',
            client_type: 'banban',
            component_path: '@/test/component',
            name: null,
            icon_name: 'Test',
            permissions: [],
            config: {},
            is_available: true
          },
          navigation: null,
          tenant: {
            id: 'tenant-1',
            is_visible: true,
            operational_status: 'ENABLED',
            custom_config: {},
            installed_at: '2023-01-01T00:00:00Z',
            last_accessed_at: null
          }
        }],
        total: 1,
        cached: false,
        queryTime: 100
      });

      ((global as any).import as jest.Mock).mockResolvedValue({
        default: mockComponent
      });

      const result = await registry.loadModuleWithComponent('org-1', 'banban', 'test-module');
      
      expect(result.success).toBe(true);
      expect(result.component).toBe(mockComponent);
    });

    it('deve retornar erro se módulo não encontrado', async () => {
      mockModuleConfigurationService.getModuleConfigurations.mockResolvedValue({
        modules: [],
        total: 0,
        cached: false,
        queryTime: 100
      });

      const result = await registry.loadModuleWithComponent('org-1', 'banban', 'nonexistent');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('não encontrado');
    });
  });
}); 