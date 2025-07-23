/**
 * Dynamic Module Loader - FASE 3
 * 
 * Carrega implementações de módulos dinamicamente baseado no component_path do banco
 * Em vez de usar mapeamento estático, usa o campo component_path para carregamento real
 */

import { ComponentType, lazy } from 'react';
import { conditionalDebugLogSync } from '@/shared/utils/conditional-debug-sync';

// Interface padrão que todas as implementações devem seguir
export interface ModuleImplementationProps {
  params: { slug: string };
  config: Record<string, any>;
  implementation: {
    id: string;
    implementation_key: string;
    component_path: string;
    [key: string]: any;
  };
}

// Tipo para componentes de implementação
export type ModuleImplementationComponent = ComponentType<ModuleImplementationProps>;

// Cache de componentes carregados para performance
const componentCache = new Map<string, ModuleImplementationComponent>();

// Lista de implementações conhecidas para fallback
const KNOWN_IMPLEMENTATIONS: Record<string, string> = {
  // Performance
  'StandardPerformanceImplementation': './performance/implementations/StandardPerformanceImplementation',
  'BanbanPerformanceImplementation': './performance/implementations/BanbanPerformanceImplementation', 
  'EnterprisePerformanceImplementation': './performance/implementations/EnterprisePerformanceImplementation',
  
  // Analytics
  'StandardAnalyticsImplementation': './analytics/implementations/StandardAnalyticsImplementation',
  'BanbanAnalyticsImplementation': './analytics/implementations/BanbanAnalyticsImplementation',
  
  // Insights
  'StandardInsightsImplementation': './insights/implementations/StandardInsightsImplementation',
  'BanbanInsightsImplementation': './insights/implementations/BanbanInsightsImplementation',
  
  // Alerts
  'StandardAlertsImplementation': './alerts/implementations/StandardAlertsImplementation',
  'BanbanAlertsImplementation': './alerts/implementations/BanbanAlertsImplementation',
  
  // Inventory
  'StandardInventoryImplementation': './inventory/implementations/StandardInventoryImplementation',
  'BanbanInventoryImplementation': './inventory/implementations/BanbanInventoryImplementation',
};

/**
 * Carrega uma implementação de módulo dinamicamente
 * 
 * @param componentPath - Caminho do componente no banco de dados
 * @param moduleSlug - Slug do módulo (para fallback)
 * @param implementationKey - Chave da implementação (para fallback)
 * @returns Promise<ModuleImplementationComponent>
 */
export async function loadModuleImplementation(
  componentPath: string,
  moduleSlug: string,
  implementationKey: string = 'standard'
): Promise<ModuleImplementationComponent> {
  
  const cacheKey = `${moduleSlug}:${implementationKey}:${componentPath}`;
  
  // Verificar cache primeiro
  if (componentCache.has(cacheKey)) {
    const cached = componentCache.get(cacheKey)!;
    conditionalDebugLogSync('[DynamicLoader] Cache hit', { cacheKey });
    return cached;
  }

  try {
    // Tentar carregar pelo component_path do banco
    const component = await loadByComponentPath(componentPath);
    if (component) {
      componentCache.set(cacheKey, component);
      conditionalDebugLogSync('[DynamicLoader] Loaded via component_path', { componentPath });
      return component;
    }
  } catch (error) {
    console.warn(`[DynamicLoader] Failed to load via component_path: ${componentPath}`, error);
  }

  try {
    // Fallback 1: Tentar por implementação conhecida
    const component = await loadByImplementationKey(moduleSlug, implementationKey);
    if (component) {
      componentCache.set(cacheKey, component);
      conditionalDebugLogSync('[DynamicLoader] Loaded via fallback implementation', { moduleSlug, implementationKey });
      return component;
    }
  } catch (error) {
    console.warn(`[DynamicLoader] Failed to load via implementation key: ${moduleSlug}/${implementationKey}`, error);
  }

  try {
    // Fallback 1.5: Tentar normalizar implementation_key (ex: 'standard-home' -> 'standard')
    const normalizedKey = implementationKey.split('-')[0];
    if (normalizedKey !== implementationKey) {
      const component = await loadByImplementationKey(moduleSlug, normalizedKey);
      if (component) {
        componentCache.set(cacheKey, component);
        conditionalDebugLogSync('[DynamicLoader] Loaded via normalized implementation', { moduleSlug, normalizedKey });
        return component;
      }
    }
  } catch (error) {
    console.warn(`[DynamicLoader] Failed to load via normalized key: ${moduleSlug}/${implementationKey.split('-')[0]}`, error);
  }

  // Fallback 2: Carregar implementação padrão do módulo
  try {
    const component = await loadByImplementationKey(moduleSlug, 'standard');
    if (component) {
      componentCache.set(cacheKey, component);
      conditionalDebugLogSync('[DynamicLoader] Loaded via standard fallback', { moduleSlug });
      return component;
    }
  } catch (error) {
    console.warn(`[DynamicLoader] Failed to load standard implementation: ${moduleSlug}/standard`, error);
  }

  // Fallback 3: Componente de erro genérico
  console.error(`[DynamicLoader] All loading methods failed for: ${cacheKey}`);
  conditionalDebugLogSync('[DynamicLoader] Debug info', {
    moduleSlug,
    implementationKey,
    originalComponentPath: componentPath,
    suggestedFix: `Corrija o component_path no banco para: /implementations/Standard${moduleSlug.charAt(0).toUpperCase() + moduleSlug.slice(1)}Implementation`
  });
  
  const errorComponent = createErrorComponent(moduleSlug, implementationKey, componentPath);
  componentCache.set(cacheKey, errorComponent);
  return errorComponent;
}

/**
 * Tentar carregar componente pelo component_path do banco
 */
async function loadByComponentPath(componentPath: string): Promise<ModuleImplementationComponent | null> {
  if (!componentPath) return null;
  
  // Limpar path absoluto inválido (ex: "/standard" -> "standard")
  let cleanPath = componentPath.replace(/^\/+/, '');
  
  // Normalizar o path para relativo
  let normalizedPath = cleanPath.startsWith('./') ? cleanPath : `./${cleanPath}`;
  
  // Se não termina com extensão, assumir que é um diretório com index
  if (!normalizedPath.includes('.') && !normalizedPath.endsWith('/')) {
    normalizedPath = `${normalizedPath}/index`;
  }
  
  try {
    // Dynamic import do componente
    const module = await import(/* webpackChunkName: "dynamic-module" */ normalizedPath);
    
    // Verificar se tem export default
    if (module.default) {
      return module.default as ModuleImplementationComponent;
    }
    
    // Verificar se tem named export com nome do componente
    const componentName = getComponentNameFromPath(componentPath);
    if (module[componentName]) {
      return module[componentName] as ModuleImplementationComponent;
    }
    
    return null;
  } catch (error) {
    conditionalDebugLogSync('[DynamicLoader] Import failed for path', { normalizedPath, error: error.message });
    return null;
  }
}

/**
 * Fallback: carregar por implementação conhecida
 */
async function loadByImplementationKey(
  moduleSlug: string, 
  implementationKey: string
): Promise<ModuleImplementationComponent | null> {
  
  // Gerar nome do componente baseado no módulo e implementação
  const componentName = generateComponentName(moduleSlug, implementationKey);
  
  // Verificar se temos mapeamento conhecido
  const knownPath = KNOWN_IMPLEMENTATIONS[componentName];
  if (knownPath) {
    try {
      const module = await import(/* webpackChunkName: "known-module" */ knownPath);
      return module.default || module[componentName] || null;
    } catch (error) {
      conditionalDebugLogSync('[DynamicLoader] Known implementation failed', { knownPath, error: error.message });
    }
  }
  
  // Tentar path convencional
  const conventionalPath = `./${moduleSlug}/implementations/${componentName}`;
  try {
    const module = await import(/* webpackChunkName: "conventional-module" */ conventionalPath);
    return module.default || module[componentName] || null;
  } catch (error) {
    conditionalDebugLogSync('[DynamicLoader] Conventional path failed', { conventionalPath, error: error.message });
    return null;
  }
}

/**
 * Gerar nome de componente baseado no módulo e implementação
 */
function generateComponentName(moduleSlug: string, implementationKey: string): string {
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
  const moduleCapitalized = capitalize(moduleSlug);
  const implementationCapitalized = capitalize(implementationKey);
  
  return `${implementationCapitalized}${moduleCapitalized}Implementation`;
}

/**
 * Extrair nome do componente do component_path
 */
function getComponentNameFromPath(componentPath: string): string {
  const parts = componentPath.split('/');
  const lastPart = parts[parts.length - 1];
  
  // Remover extensão se houver
  const withoutExtension = lastPart.replace(/\.(tsx?|jsx?)$/, '');
  
  // Se for 'index', usar o nome do diretório pai
  if (withoutExtension === 'index' && parts.length > 1) {
    return parts[parts.length - 2];
  }
  
  return withoutExtension;
}

/**
 * Criar componente de erro para quando nada funciona
 */
function createErrorComponent(
  moduleSlug: string, 
  implementationKey: string, 
  componentPath: string
): ModuleImplementationComponent {
  return function ModuleNotFoundError({ params }: ModuleImplementationProps) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Implementação não encontrada
          </h2>
          <p className="text-gray-600 mb-4">
            Não foi possível carregar a implementação do módulo.
          </p>
          <div className="bg-gray-100 p-3 rounded text-sm text-left mb-4">
            <strong>Detalhes:</strong><br />
            Módulo: {moduleSlug}<br />
            Implementação: {implementationKey}<br />
            Path: {componentPath || 'não especificado'}
          </div>
          <div className="text-sm text-gray-500">
            Recarregue a página para tentar novamente
          </div>
        </div>
      </div>
    );
  };
}

/**
 * Criar componente lazy com o dynamic loader
 */
export function createDynamicLazyComponent(
  componentPath: string,
  moduleSlug: string,
  implementationKey: string = 'standard'
): ComponentType<ModuleImplementationProps> {
  return lazy(async () => {
    const Component = await loadModuleImplementation(componentPath, moduleSlug, implementationKey);
    return { default: Component };
  });
}

/**
 * Limpar cache de componentes (útil para desenvolvimento)
 */
export function clearComponentCache(): void {
  componentCache.clear();
  conditionalDebugLogSync('[DynamicLoader] Component cache cleared', {});
}

/**
 * Estatísticas do cache (para debugging)
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: componentCache.size,
    keys: Array.from(componentCache.keys())
  };
}