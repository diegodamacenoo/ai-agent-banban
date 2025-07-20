/**
 * Helpers para a Rota Universal (Server-side)
 * Fase 4 - Route Simplification
 */

import { createSupabaseServerClient } from '@/core/supabase/server';
import { dynamicModuleRegistry } from '@/core/modules/registry/DynamicModuleRegistry';
import { ClientType } from '@/core/modules/types';

export interface Organization {
  id: string;
  slug: string;
  name: string;
  client_type: ClientType;
  company_trading_name: string;
  company_legal_name?: string;
  is_implementation_complete?: boolean;
}

/**
 * Buscar organização por slug
 */
export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        id,
        slug,
        company_trading_name,
        company_legal_name,
        client_type,
        is_implementation_complete
      `)
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      slug: data.slug,
      name: data.company_trading_name || data.company_legal_name || slug,
      client_type: data.client_type as ClientType,
      company_trading_name: data.company_trading_name,
      company_legal_name: data.company_legal_name,
      is_implementation_complete: data.is_implementation_complete
    };
  } catch (error) {
    console.error('Erro ao buscar organização:', error);
    return null;
  }
}

/**
 * Verificar se uma organização tem acesso a um módulo específico
 * Usa o DynamicModuleRegistry para verificação unificada
 */
export async function verifyModuleAccess(
  organizationId: string,
  clientType: ClientType,
  moduleSlug: string
): Promise<boolean> {
  try {
    console.debug(`🔐 Verificando acesso: org=${organizationId}, client=${clientType}, module=${moduleSlug}`);

    // 1. Carregar configuração de módulos usando DynamicModuleRegistry
    const modules = await dynamicModuleRegistry.loadModuleConfiguration(
      organizationId
    );

    // 2. Verificar se o módulo existe e está ativo
    const foundModule = modules.find(m => m.slug === moduleSlug);
    
    if (!foundModule) {
      console.debug(`❌ Módulo ${moduleSlug} não encontrado para ${clientType}`);
      return false;
    }

    // 3. Verificar visibilidade e status operacional
    const isVisible = foundModule.tenant.is_visible;
    const isEnabled = foundModule.tenant.operational_status === 'ENABLED';
    
    console.debug(`📊 Status do módulo ${moduleSlug}:`, {
      visible: isVisible,
      status: foundModule.tenant.operational_status,
      enabled: isEnabled
    });

    return isVisible && isEnabled;
  } catch (error) {
    console.error('Erro na verificação de acesso ao módulo:', error);
    return false;
  }
}

/**
 * Buscar dados do módulo para renderização
 */
export async function getModuleData(
  organizationId: string,
  clientType: ClientType,
  moduleSlug: string
) {
  try {
    const modules = await dynamicModuleRegistry.loadModuleConfiguration(
      organizationId
    );

    const foundModule = modules.find(m => m.slug === moduleSlug);
    if (!foundModule) {
      return null;
    }

    return {
      slug: foundModule.slug,
      name: foundModule.name,
      description: foundModule.description,
      navigation: foundModule.navigation,
      implementation: foundModule.implementation,
      tenant: foundModule.tenant
    };
  } catch (error) {
    console.error('Erro ao buscar dados do módulo:', error);
    return null;
  }
}

/**
 * Carregar componente do módulo dinamicamente
 */
export async function loadModuleComponent(
  clientType: ClientType,
  moduleSlug: string,
  componentPath?: string
) {
  try {
    if (componentPath) {
      return await dynamicModuleRegistry.loadComponent(componentPath);
    }

    // Fallback: tentar carregar pelo padrão de nomenclatura
    const standardPath = `@/clients/${clientType}/modules/${moduleSlug}`;
    return await dynamicModuleRegistry.loadComponent(standardPath);
  } catch (error) {
    console.error(`Erro ao carregar componente do módulo ${moduleSlug}:`, error);
    throw error;
  }
}

/**
 * Resolver rota de submódulo para paths aninhados
 */
export function resolveSubModulePath(
  moduleSlug: string,
  subPath: string[]
): {
  component: string;
  route: string;
} {
  const route = `/${moduleSlug}/${subPath.join('/')}`;
  
  // Padrões comuns de sub-páginas
  const subPageMappings: Record<string, string> = {
    'config': 'configuration',
    'settings': 'configuration', 
    'configuração': 'configuration',
    'análise': 'analytics',
    'analytics': 'analytics',
    'relatórios': 'reports',
    'reports': 'reports'
  };
  
  const subPageKey = subPath[0]?.toLowerCase();
  const subPageType = subPageMappings[subPageKey] || subPath[0];
  
  return {
    component: `${moduleSlug}/${subPageType}`,
    route
  };
}

/**
 * Verificar se é uma rota de API ou recurso especial
 */
export function isSpecialRoute(path: string[]): boolean {
  const specialPrefixes = ['api', '_next', 'admin', 'auth'];
  return path.length > 0 && specialPrefixes.includes(path[0]);
}

/**
 * Gerar lista de módulos disponíveis para uma organização
 */
export async function getAvailableModules(organizationId: string, clientType: ClientType) {
  try {
    const modules = await dynamicModuleRegistry.loadModuleConfiguration(
      organizationId
    );

    return modules
      .filter(m => m.tenant.is_visible && m.tenant.operational_status === 'ENABLED')
      .map(m => ({
        slug: m.slug,
        name: m.name,
        description: m.description,
        navigation: m.navigation,
        icon: m.implementation.icon_name
      }));
  } catch (error) {
    console.error('Erro ao carregar módulos disponíveis:', error);
    return [];
  }
}