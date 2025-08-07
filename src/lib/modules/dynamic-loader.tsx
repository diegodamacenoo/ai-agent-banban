/**
 * Dynamic Module Loader - FASE 3
 * 
 * Carrega implementações de módulos dinamicamente baseado no component_path do banco
 * Em vez de usar mapeamento estático, usa o campo component_path para carregamento real
 */

import { ComponentType, lazy } from 'react';
import { conditionalDebugLogSync } from '@/shared/utils/conditional-debug-sync';
import { UNIFIED_COMPONENTS_REGISTRY } from '@/core/modules/components-registry';

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

// Limpar cache na inicialização para desenvolvimento
if (process.env.NODE_ENV === 'development') {
  componentCache.clear();
}

// Lista de implementações conhecidas para fallback
const KNOWN_IMPLEMENTATIONS: Record<string, string | (() => Promise<any>)> = {
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
  
  // Alerts - USANDO IMPORT DINÂMICO ABSOLUTO
  'StandardAlertsImplementation': () => import('@/app/(protected)/[slug]/(modules)/alerts/implementations/StandardAlertsImplementation'),
  'BanbanAlertsImplementation': () => import('@/app/(protected)/[slug]/(modules)/alerts/implementations/BanbanAlertsImplementation'),
  'EnterpriseAlertsImplementation': () => import('@/app/(protected)/[slug]/(modules)/alerts/implementations/EnterpriseAlertsImplementation'),
  
  // Inventory
  'StandardInventoryImplementation': './inventory/implementations/StandardInventoryImplementation',
  'BanbanInventoryImplementation': './inventory/implementations/BanbanInventoryImplementation',
};

/**
 * Carrega uma implementação de módulo dinamicamente - ESTRUTURA UNIFICADA
 * 
 * Agora usa APENAS o component_path do banco de dados (path absoluto)
 * Elimina os 5 fallbacks complexos em favor de uma única fonte de verdade
 * 
 * @param componentPath - Caminho absoluto do componente (@/core/modules/...)
 * @param moduleSlug - Slug do módulo (para debug/cache)
 * @param implementationKey - Chave da implementação (para debug/cache)
 * @param routePattern - Não mais usado (mantido para compatibilidade)
 * @returns Promise<ModuleImplementationComponent>
 */
export async function loadModuleImplementation(
  componentPath: string,
  moduleSlug: string,
  implementationKey: string = 'standard',
  routePattern?: string | null
): Promise<ModuleImplementationComponent> {
  
  const cacheKey = `${componentPath}:${moduleSlug}:${implementationKey}`;
  
  // Verificar cache primeiro
  if (componentCache.has(cacheKey)) {
    const cached = componentCache.get(cacheKey)!;
    conditionalDebugLogSync('[DynamicLoader] Cache hit', { cacheKey });
    return cached;
  }

  // ESTRATÉGIA UNIFICADA: Usar APENAS o component_path do banco de dados
  try {
    if (!componentPath?.trim()) {
      throw new Error(`Component path vazio para módulo ${moduleSlug}`);
    }

    const component = await loadByComponentPath(componentPath);
    if (component) {
      componentCache.set(cacheKey, component);
      conditionalDebugLogSync('[DynamicLoader] Loaded via unified structure', { 
        componentPath,
        moduleSlug,
        implementationKey
      });
      return component;
    }

    throw new Error(`Falhou ao carregar component do path: ${componentPath}`);
    
  } catch (error) {
    console.error(`[DynamicLoader] Failed to load component: ${componentPath}`, error);
    
    // Único fallback: componente de erro
    const errorComponent = createErrorComponent(moduleSlug, implementationKey, componentPath);
    componentCache.set(cacheKey, errorComponent);
    return errorComponent;
  }
}

/**
 * Carregar componente pelo component_path absoluto - ESTRUTURA UNIFICADA
 * Usa Components Registry para garantir resolução em build time
 */
async function loadByComponentPath(componentPath: string): Promise<ModuleImplementationComponent | null> {
  if (!componentPath) return null;
  
  // NOVA ABORDAGEM: Usar Components Registry para resolver imports
  try {
    conditionalDebugLogSync('[DynamicLoader] Using Components Registry', { 
      componentPath,
      isRegistered: !!UNIFIED_COMPONENTS_REGISTRY[componentPath]
    });

    // Primeiro, tentar carregar via registry
    if (UNIFIED_COMPONENTS_REGISTRY[componentPath]) {
      const loader = UNIFIED_COMPONENTS_REGISTRY[componentPath];
      const module = await loader();
      
      if (module.default) {
        conditionalDebugLogSync('[DynamicLoader] Component loaded via registry', { 
          componentPath
        });
        return module.default as ModuleImplementationComponent;
      }
    }

    // Se não estiver no registry, não tentar dynamic import
    // (evita erros de build em produção)
    console.warn(`[DynamicLoader] Component não encontrado no registry: ${componentPath}`);
    console.warn(`[DynamicLoader] Disponíveis:`, Object.keys(UNIFIED_COMPONENTS_REGISTRY));
    
    return null;
  } catch (error) {
    conditionalDebugLogSync('[DynamicLoader] All import methods failed', { 
      componentPath,
      error: error.message
    });
    return null;
  }
}

// ESTRUTURA UNIFICADA: Funções de fallback removidas
// Agora usa exclusivamente component_path do banco de dados

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
 * Criar componente de erro para estrutura unificada
 */
function createErrorComponent(
  moduleSlug: string, 
  implementationKey: string, 
  componentPath: string
): ModuleImplementationComponent {
  return function UnifiedModuleError({ params }: ModuleImplementationProps) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center max-w-lg">
          <div className="text-6xl mb-4">🔧</div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Componente não encontrado
          </h2>
          <p className="text-gray-600 mb-4">
            O component_path especificado no banco de dados não foi encontrado.
          </p>
          <div className="bg-red-50 border border-red-200 p-4 rounded text-sm text-left mb-4">
            <strong>Path configurado:</strong><br />
            <code className="bg-red-100 px-2 py-1 rounded">{componentPath || 'não especificado'}</code>
            
            <div className="mt-3">
              <strong>Módulo:</strong> {moduleSlug}<br />
              <strong>Implementação:</strong> {implementationKey}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm mb-4">
            <strong>📋 Para corrigir:</strong><br />
            1. Verifique se o arquivo existe no path especificado<br />
            2. Confirme que tem export default ou named export<br />
            3. Use path absoluto: <code>@/core/modules/[namespace]/implementations/[Component]</code>
          </div>
          <div className="text-sm text-gray-500">
            Estrutura Unificada - Uma fonte de verdade (database)
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
  implementationKey: string = 'standard',
  routePattern?: string | null
): ComponentType<ModuleImplementationProps> {
  return lazy(async () => {
    const Component = await loadModuleImplementation(componentPath, moduleSlug, implementationKey, routePattern);
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