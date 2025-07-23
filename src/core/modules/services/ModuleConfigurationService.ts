/**
 * Service para buscar configurações de módulos do banco de dados
 * Fase 2 - Core Registry Implementation
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { 
  NavigationItem, 
  ModuleConfiguration,
  ModuleCategory,
  ModuleMaturityStatus,
  ModulePricingTier 
} from '../types/index';

// O serviço não deve mais criar seu próprio cliente Supabase.
// A instância do Supabase será passada como argumento para os métodos.

export interface SimpleModuleConfig {
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

export class ModuleConfigurationService {
  /**
   * Carrega configurações de módulos do banco de dados
   */
  static async loadModuleConfigurations(
    supabase: SupabaseClient,
    organizationId: string
  ): Promise<ModuleConfiguration[]> {
    try {
      console.debug(`[ModuleConfigurationService] Carregando módulos para organização: ${organizationId}`);

      // Usar a nova função consolidada de visibilidade
      const { data: modules, error } = await supabase
        .rpc('get_user_visible_modules', {
          p_tenant_id: organizationId
        });

      console.debug(`[ModuleConfigurationService] Query executada. Error:`, error);
      console.debug(`[ModuleConfigurationService] Raw modules:`, modules?.length || 0);

      if (error) {
        console.error('[ModuleConfigurationService] Erro ao consultar função de visibilidade:', error);
        throw error;
      }

      if (!modules || modules.length === 0) {
        console.debug('[ModuleConfigurationService] Nenhum módulo encontrado para esta organização');
        return [];
      }

      // Filtrar apenas módulos que podem ser visualizados
      const visibleModules = modules.filter((module: any) => module.can_view && module.can_access);

      const configurations: ModuleConfiguration[] = visibleModules.map((module: any) => {
        // Adapta a nova estrutura da função consolidada para o tipo ModuleConfiguration esperado
        return {
          slug: module.module_slug,
          name: module.module_name,
          description: '', // Adicionar descrição na função se necessário
          category: module.module_category,
          version: '1.0.0',
          maturity_status: 'stable',
          pricing_tier: 'standard',
          implementation: {
            id: module.assignment_id,
            module_id: module.assignment_id,
            implementation_key: module.implementation_key,
            name: module.module_name,
            component_path: module.component_path,
            audience: 'generic', // Pode ser adicionado na função se necessário
            component_type: 'file'
          },
          navigation: {
            id: module.module_slug,
            nav_title: module.module_name,
            route_path: `/${module.module_slug}`,
            nav_type: 'main',
            is_external: false,
            nav_order: 0,
            parent_id: null
          },
          tenant: {
            is_visible: true, // Já filtrado pela função
            operational_status: module.status.toUpperCase(),
            custom_config: module.custom_config || {},
            installed_at: new Date().toISOString(), // Placeholder
            last_accessed_at: null
          },
        };
      });

      console.debug(`[ModuleConfigurationService] ${configurations.length} módulos carregados com a nova arquitetura`);
      return configurations;

    } catch (error) {
      console.error('[ModuleConfigurationService] Erro crítico:', error);
      return [];
    }
  }

  /**
   * Busca um módulo específico por slug
   */
  static async getModuleBySlug(
    supabase: SupabaseClient,
    organizationId: string,
    moduleSlug: string
  ): Promise<ModuleConfiguration | null> {
    try {
      console.debug(`[ModuleConfigurationService] Buscando módulo "${moduleSlug}" para org: ${organizationId}`);

      // Usar a função consolidada para buscar o módulo específico
      const { data: modules, error } = await supabase
        .rpc('get_user_visible_modules', {
          p_tenant_id: organizationId
        });

      if (error) {
        console.error(`[ModuleConfigurationService] Erro ao buscar módulo "${moduleSlug}":`, error);
        return null;
      }

      // Encontrar o módulo específico e verificar se pode ser acessado
      const module = modules?.find((m: any) => 
        m.module_slug === moduleSlug && m.can_view && m.can_access
      );

      if (!module) {
        console.debug(`[ModuleConfigurationService] Módulo "${moduleSlug}" não encontrado ou sem acesso para a organização.`);
        return null;
      }

      // Adapta a nova estrutura da função consolidada para o tipo ModuleConfiguration esperado
      const configuration: ModuleConfiguration = {
        slug: module.module_slug,
        name: module.module_name,
        description: '', // Placeholder - pode ser adicionado na função se necessário
        category: module.module_category,
        version: '1.0.0',
        maturity_status: 'stable',
        pricing_tier: 'standard',
        implementation: {
          id: module.assignment_id,
          module_id: module.assignment_id,
          implementation_key: module.implementation_key,
          name: module.module_name,
          component_path: module.component_path,
          audience: 'generic',
          component_type: 'file'
        },
        navigation: {
          id: module.module_slug,
          nav_title: module.module_name,
          route_path: `/${module.module_slug}`,
          nav_type: 'main',
          is_external: false,
          nav_order: 0,
          parent_id: null
        },
        tenant: {
          is_visible: true,
          operational_status: module.status.toUpperCase(),
          custom_config: module.custom_config || {},
          installed_at: new Date().toISOString(),
          last_accessed_at: null
        },
      };

      console.debug(`[ModuleConfigurationService] Módulo "${moduleSlug}" encontrado com a nova arquitetura`);
      return configuration;

    } catch (error) {
      console.error(`[ModuleConfigurationService] Erro crítico ao buscar módulo "${moduleSlug}":`, error);
      return null;
    }
  }

  /**
   * Gera navegação para sidebar
   */
  static generateNavigation(modules: ModuleConfiguration[]): NavigationItem[] {
    return modules
      .filter(m => m.navigation) // Garantir que a navegação não seja nula
      .map(module => ({
        id: module.slug,
        title: module.navigation!.nav_title,
        href: module.navigation!.route_path || `/${module.slug}`,
        icon: this.getIconForModule(module.slug, module.category)
      }));
  }

  /**
   * Mapeia ícones para módulos baseado no slug e categoria
   */
  private static getIconForModule(slug: string, category: string): string {
    // Mapeamento específico por slug
    const slugIconMap: Record<string, string> = {
      'diego-henrique': 'User',
      'alerts': 'Bell',
      'performance': 'BarChart3',
      'insights': 'TrendingUp',
      'analytics': 'PieChart',
      'inventory': 'Package',
      'reports': 'FileText',
      'dashboard': 'Home',
      'home': 'Home'
    };

    // Mapeamento por categoria como fallback
    const categoryIconMap: Record<string, string> = {
      'analytics': 'BarChart3',
      'monitoring': 'Activity',
      'operations': 'Settings',
      'insights': 'TrendingUp',
      'reports': 'FileText',
      'admin': 'Shield'
    };

    // Primeiro tenta pelo slug, depois pela categoria, senão usa ícone padrão
    return slugIconMap[slug] || categoryIconMap[category] || 'Package';
  }

  // Método getDefaultModules() removido - não usar fallbacks de módulos padrão
}

// A instância singleton não é mais necessária, pois todos os métodos são estáticos
// e o serviço não mantém mais um estado interno (o cliente supabase).
// export const moduleConfigurationService = new ModuleConfigurationService();