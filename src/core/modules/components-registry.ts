/**
 * Registry de Componentes - Estrutura Unificada
 * 
 * Mapeamento estático de component_paths para imports dinâmicos
 * Necessário para que o webpack/Next.js possa resolver os imports em build time
 */

import { ComponentType } from 'react';

// Interface padrão para implementações de módulos
export interface ModuleImplementationProps {
  params: { slug: string };
  config: Record<string, any>;
  implementation: any;
}

export type ModuleImplementationComponent = ComponentType<ModuleImplementationProps>;

// Registry de componentes da estrutura unificada
// IMPORTANTE: Só incluir imports para arquivos que realmente existem
export const UNIFIED_COMPONENTS_REGISTRY: Record<string, () => Promise<{ default: ModuleImplementationComponent }>> = {
  // Banban Implementations
  '@/core/modules/banban/implementations/BanbanAlertsImplementation': () => 
    import('@/core/modules/banban/implementations/BanbanAlertsImplementation'),
  '@/core/modules/banban/implementations/BanbanPerformanceImplementation': () => 
    import('@/core/modules/banban/implementations/BanbanPerformanceImplementation'),

  // Standard Implementations
  '@/core/modules/standard/implementations/StandardAlertsImplementation': () => 
    import('@/core/modules/standard/implementations/StandardAlertsImplementation'),
  '@/core/modules/standard/implementations/StandardPerformanceImplementation': () => 
    import('@/core/modules/standard/implementations/StandardPerformanceImplementation'),
};

/**
 * Carrega componente usando o registry unificado
 */
export async function loadUnifiedComponent(componentPath: string): Promise<ModuleImplementationComponent | null> {
  const loader = UNIFIED_COMPONENTS_REGISTRY[componentPath];
  
  if (!loader) {
    console.warn(`[ComponentsRegistry] Component não encontrado no registry: ${componentPath}`);
    return null;
  }

  try {
    const module = await loader();
    return module.default;
  } catch (error) {
    console.error(`[ComponentsRegistry] Erro ao carregar componente: ${componentPath}`, error);
    return null;
  }
}

/**
 * Lista todos os component paths disponíveis
 */
export function getAvailableComponents(): string[] {
  return Object.keys(UNIFIED_COMPONENTS_REGISTRY);
}

/**
 * Adiciona um novo componente ao registry dinamicamente
 * Útil para desenvolvimento e testes
 */
export function addComponentToRegistry(
  componentPath: string, 
  loader: () => Promise<{ default: ModuleImplementationComponent }>
) {
  (UNIFIED_COMPONENTS_REGISTRY as any)[componentPath] = loader;
  console.log(`[ComponentsRegistry] Adicionado: ${componentPath}`);
}