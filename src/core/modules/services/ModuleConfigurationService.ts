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

      const { data: assignments, error } = await supabase
        .from('tenant_module_assignments')
        .select(`
          is_active,
          custom_config,
          assigned_at,
          base_modules (
            id,
            slug,
            name,
            description,
            category
          ),
          module_implementations (
            id,
            implementation_key,
            name,
            component_path,
            target_audience,
            complexity_tier
          )
        `)
        .eq('tenant_id', organizationId)
        .eq('is_active', true);

      if (error) {
        console.error('[ModuleConfigurationService] Erro ao consultar tenant_module_assignments:', error);
        throw error;
      }

      if (!assignments || assignments.length === 0) {
        console.debug('[ModuleConfigurationService] Nenhum módulo encontrado para esta organização');
        return [];
      }

      const configurations: ModuleConfiguration[] = assignments.map((assignment: any) => {
        // Adapta a nova estrutura para o tipo ModuleConfiguration esperado
        return {
          slug: assignment.base_modules.slug,
          name: assignment.base_modules.name,
          description: assignment.base_modules.description,
          category: assignment.base_modules.category,
          version: '1.0.0', // O versionamento pode ser adicionado a base_modules se necessário
          maturity_status: 'stable', // Pode ser adicionado a base_modules
          pricing_tier: 'standard', // Pode ser adicionado a base_modules
          implementation: {
            id: assignment.module_implementations.id,
            module_id: assignment.base_modules.id,
            ...assignment.module_implementations
          },
          // A navegação agora é mais simples e direta
          navigation: {
            id: assignment.base_modules.slug,
            nav_title: assignment.base_modules.name,
            route_path: `/${assignment.base_modules.slug}`,
            nav_type: 'main',
            is_external: false,
            nav_order: 0,
            parent_id: null
          },
          tenant: {
            is_visible: assignment.is_active,
            operational_status: assignment.is_active ? 'ENABLED' : 'DISABLED',
            custom_config: assignment.custom_config,
            installed_at: assignment.assigned_at,
            last_accessed_at: null // Este campo não existe na nova tabela
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

      const { data: assignment, error } = await supabase
        .from('tenant_module_assignments')
        .select(`
          is_active,
          custom_config,
          assigned_at,
          base_modules!inner (
            id,
            slug,
            name,
            description,
            category
          ),
          module_implementations (
            id,
            implementation_key,
            name,
            component_path,
            target_audience,
            complexity_tier
          )
        `)
        .eq('tenant_id', organizationId)
        .eq('base_modules.slug', moduleSlug)
        .eq('is_active', true)
        .single();

      if (error || !assignment) {
        console.debug(`[ModuleConfigurationService] Módulo "${moduleSlug}" não encontrado ou inativo para a organização.`);
        return null;
      }

      // Adapta a nova estrutura para o tipo ModuleConfiguration esperado
      const configuration: ModuleConfiguration = {
        slug: assignment.base_modules.slug,
        name: assignment.base_modules.name,
        description: assignment.base_modules.description,
        category: assignment.base_modules.category,
        version: '1.0.0', // Placeholder
        maturity_status: 'stable', // Placeholder
        pricing_tier: 'standard', // Placeholder
        implementation: {
          id: assignment.module_implementations.id,
          module_id: assignment.base_modules.id,
          ...assignment.module_implementations
        },
        navigation: {
          id: assignment.base_modules.slug,
          nav_title: assignment.base_modules.name,
          route_path: `/${assignment.base_modules.slug}`,
          nav_type: 'main',
          is_external: false,
          nav_order: 0,
          parent_id: null
        },
        tenant: {
          is_visible: assignment.is_active,
          operational_status: assignment.is_active ? 'ENABLED' : 'DISABLED',
          custom_config: assignment.custom_config,
          installed_at: assignment.assigned_at,
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
        // O ícone agora precisa vir de um mapeamento ou ser armazenado de outra forma
      }));
  }

  // Método getDefaultModules() removido - não usar fallbacks de módulos padrão
}

// A instância singleton não é mais necessária, pois todos os métodos são estáticos
// e o serviço não mantém mais um estado interno (o cliente supabase).
// export const moduleConfigurationService = new ModuleConfigurationService();