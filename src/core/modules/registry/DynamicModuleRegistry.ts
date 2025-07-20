/**
 * DynamicModuleRegistry - Sistema de carregamento dinâmico de módulos
 * Fase 2 - Core Registry Implementation
 */
import { ComponentType } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  ModuleConfiguration,
  NavigationItem,
  IModuleRegistry,
  ModuleRegistryConfig,
  LoadedModule,
  ClientType
} from '../types';
import { ModuleConfigurationService } from '../services/ModuleConfigurationService';
import { SupabaseClient } from '@supabase/supabase-js';

// A instância singleton será criada abaixo.

/**
 * Registry principal para gerenciamento de módulos
 */
export class DynamicModuleRegistry implements IModuleRegistry {
  private static instance: DynamicModuleRegistry;
  private componentCache = new Map<string, LoadedModule>();
  private configCache = new Map<string, ModuleConfiguration[]>();
  private config: ModuleRegistryConfig;
  private supabase: SupabaseClient;

  private constructor(supabase: SupabaseClient, config?: Partial<ModuleRegistryConfig>) {
    this.supabase = supabase;
    this.config = {
      enableCache: true,
      cacheTimeout: 5 * 60 * 1000, // 5 minutos
      ...config
    };
  }

  /**
   * Singleton pattern para garantir uma única instância.
   * A instância é criada com um cliente de navegador padrão, mas deve ser
   * inicializada com um cliente autenticado através do `initialize` ou de um provider.
   */
  static getInstance(supabase?: SupabaseClient): DynamicModuleRegistry {
    if (!DynamicModuleRegistry.instance) {
      const client = supabase || createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      DynamicModuleRegistry.instance = new DynamicModuleRegistry(client);
    } else if (supabase) {
      DynamicModuleRegistry.instance.supabase = supabase;
    }
    return DynamicModuleRegistry.instance;
  }

  /**
   * Permite que a aplicação hidrate a instância singleton com o cliente correto.
   */
  initialize(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async loadModuleConfiguration(
    organizationId: string
  ): Promise<ModuleConfiguration[]> {
    const cacheKey = `modules_${organizationId}`;
    const cached = this.configCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Refatorado: Chamada de serviço não precisa mais de clientType
    const modules = await ModuleConfigurationService.loadModuleConfigurations(
      this.supabase,
      organizationId
    );
    
    this.configCache.set(cacheKey, modules);
    return modules;
  }

  async loadAndGetComponent(organizationId: string, moduleSlug: string): Promise<LoadedModule | null> {
    // Primeiro, carrega todas as configurações para o tenant (usa o cache)
    const modules = await this.loadModuleConfiguration(organizationId);
    const moduleConfig = modules.find(m => m.slug === moduleSlug);

    if (!moduleConfig || !moduleConfig.implementation?.component_path) {
      console.error(`[Registry] Configuração ou caminho do componente não encontrado para o módulo ${moduleSlug}`);
      return null;
    }

    const componentPath = moduleConfig.implementation.component_path;

    // Agora, carrega o componente (usa o cache de componentes)
    const component = await this.loadComponent(componentPath);
    
    return {
      component,
      config: moduleConfig,
      loadedAt: Date.now()
    };
  }

  async loadComponent(componentPath: string): Promise<ComponentType<any>> {
    if (this.componentCache.has(componentPath)) {
      return this.componentCache.get(componentPath)!.component;
    }
    
    // Usar import dinâmico com estratégia de fallback
    try {
      // Estratégia 1: Tentar carregar o componente direto
      let importedModule: any;
      
      // Mapeamento de caminhos conhecidos para evitar dynamic imports com expressões
      const componentMap: Record<string, () => Promise<any>> = {
        '@/clients/banban/modules/alerts': () => import('@/clients/banban/modules/alerts'),
        '@/clients/banban/modules/performance': () => import('@/clients/banban/modules/performance'),
        '@/clients/banban/modules/reports': () => import('@/clients/banban/modules/reports'),
        '@/clients/banban/modules/settings': () => import('@/clients/banban/modules/settings'),
        '@/clients/standard/modules/alerts': () => import('@/clients/standard/modules/alerts'),
        '@/clients/standard/modules/performance': () => import('@/clients/standard/modules/performance'),
        '@/clients/standard/modules/reports': () => import('@/clients/standard/modules/reports'),
        '@/clients/standard/modules/settings': () => import('@/clients/standard/modules/settings'),
      };
      
      const importFunction = componentMap[componentPath];
      if (importFunction) {
        importedModule = await importFunction();
      } else {
        // Fallback para import dinâmico (pode gerar warning)
        importedModule = await import(/* webpackIgnore: true */ componentPath);
      }
      
      const component = importedModule.default || importedModule.Component || Object.values(importedModule)[0];

      if (!component) {
        throw new Error(`Nenhum componente encontrado em ${componentPath}`);
      }

      this.componentCache.set(componentPath, {
        component,
        config: {} as any,
        loadedAt: Date.now(),
      });

      return component;
    } catch (error) {
      console.error(`Erro ao carregar componente ${componentPath}:`, error);
      throw new Error(`Falha ao carregar o componente: ${componentPath}`);
    }
  }

  generateNavigation(modules: ModuleConfiguration[]): NavigationItem[] {
    return ModuleConfigurationService.generateNavigation(modules);
  }

  getModule(slug: string): ModuleConfiguration | null {
    for (const modules of this.configCache.values()) {
      const found = modules.find(m => m.slug === slug);
      if (found) return found;
    }
    return null;
  }
  
  clearCache(): void {
    this.componentCache.clear();
    this.configCache.clear();
  }

  // Outros métodos como preloadModules, etc. podem ser adicionados aqui.
}

// Exporta a instância singleton para ser usada em toda a aplicação.
// O provider irá garantir que ela seja inicializada corretamente.
export const dynamicModuleRegistry = DynamicModuleRegistry.getInstance();
