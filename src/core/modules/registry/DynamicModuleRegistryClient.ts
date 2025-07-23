/**
 * DynamicModuleRegistry - Versão Client-Side Simplificada
 * 
 * Carrega configurações de módulos via API para evitar erros de servidor.
 */

import { NavigationItem } from '@/core/modules/types';

export interface SimpleModuleData {
  id: string;
  name: string;
  slug: string;
  status: string;
  navigation?: {
    title: string;
    href: string;
    icon?: string;
  };
}

export interface ModuleApiResponse {
  modules: SimpleModuleData[];
  navigation: NavigationItem[];
  total: number;
  error?: string;
}

export class DynamicModuleRegistryClient {
  private cache = new Map<string, { data: ModuleApiResponse; timestamp: number }>();
  private readonly CACHE_TTL = 30 * 1000; // 30 segundos para debug

  /**
   * Carregar configurações via API simplificada
   */
  async loadModuleConfiguration(organizationId: string): Promise<ModuleApiResponse> {
    const cacheKey = `modules:${organizationId}`;
    const cached = this.cache.get(cacheKey);
    
    // Verificar cache válido
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.debug('[ModuleRegistry] Usando dados do cache');
      return cached.data;
    }

    try {
      console.debug(`[ModuleRegistry] Carregando via API para org: ${organizationId}`);
      
      const response = await fetch(`/api/modules/configuration?organizationId=${organizationId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Garantir estrutura válida
      const validData: ModuleApiResponse = {
        modules: data.modules || [],
        navigation: data.navigation || [],
        total: data.total || 0,
        error: data.error
      };
      
      // Atualizar cache
      this.cache.set(cacheKey, {
        data: validData,
        timestamp: Date.now()
      });
      
      console.debug(`[ModuleRegistry] ${validData.modules.length} módulos carregados`);
      return validData;
      
    } catch (error) {
      console.error('[ModuleRegistry] Erro ao carregar módulos:', error);
      
      // Tentar cache expirado
      if (cached) {
        console.warn('[ModuleRegistry] Usando cache expirado devido ao erro');
        return cached.data;
      }
      
      // Fallback de emergência
      return this.getFallbackData();
    }
  }

  /**
   * Dados de fallback quando tudo falha
   */
  private getFallbackData(): ModuleApiResponse {
    const fallbackModules: SimpleModuleData[] = [
      {
        id: 'home',
        name: 'Home',
        slug: 'home',
        status: 'active',
        navigation: {
          title: 'Home',
          href: '/',
          icon: 'Home'
        }
      },
      {
        id: 'insights',
        name: 'Insights',
        slug: 'insights',
        status: 'active',
        navigation: {
          title: 'Insights',
          href: '/insights',
          icon: 'BarChart3'
        }
      }
    ];

    const fallbackNavigation: NavigationItem[] = fallbackModules.map(module => ({
      id: module.slug,
      title: module.navigation?.title || module.name,
      href: module.navigation?.href || `/${module.slug}`,
      icon: module.navigation?.icon || 'Package'
    }));

    return {
      modules: fallbackModules,
      navigation: fallbackNavigation,
      total: fallbackModules.length
    };
  }

  /**
   * Limpar cache
   */
  clearCache(): void {
    this.cache.clear();
    console.debug('[ModuleRegistry] Cache limpo');
  }

  /**
   * Verificar se cache tem dados válidos
   */
  hasCachedData(organizationId: string): boolean {
    const cacheKey = `modules:${organizationId}`;
    const cached = this.cache.get(cacheKey);
    return cached !== undefined && Date.now() - cached.timestamp < this.CACHE_TTL;
  }
}

// Singleton para uso global
export const dynamicModuleRegistryClient = new DynamicModuleRegistryClient(); 