/**
 * DynamicModulePage - FASE 3
 * 
 * Componente genérico que carrega qualquer módulo dinamicamente
 * baseado no component_path do banco, substituindo o mapeamento estático
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getModuleImplementation, logModuleOperation } from '@/lib/modules';
import { createDynamicLazyComponent } from '@/lib/modules/dynamic-loader';

// Loading skeleton reutilizável
function ModuleLoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}

// Componente de módulo inativo
function InactiveModuleComponent({ 
  moduleSlug, 
  moduleName 
}: { 
  moduleSlug: string; 
  moduleName: string; 
}) {
  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center">
        <div className="text-6xl mb-4">📴</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Módulo {moduleName} Inativo
        </h2>
        <p className="text-gray-600">
          Este módulo não está ativo para sua organização.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Módulo: {moduleSlug}
        </p>
      </div>
    </div>
  );
}

// Componente de erro de carregamento
function ModuleErrorComponent({ 
  moduleSlug, 
  error 
}: { 
  moduleSlug: string; 
  error: string; 
}) {
  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center">
        <div className="text-6xl mb-4">💥</div>
        <h2 className="text-xl font-semibold text-red-600 mb-2">
          Erro ao Carregar Módulo
        </h2>
        <p className="text-gray-600 mb-4">
          Ocorreu um erro ao carregar o módulo {moduleSlug}.
        </p>
        <div className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-700 mb-4 max-w-md">
          {error}
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
        >
          Tentar Novamente
        </button>
        <button 
          onClick={() => window.history.back()} 
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}

interface DynamicModulePageProps {
  params: Promise<{ slug: string }>;
  moduleSlug: string;
}

export default async function DynamicModulePage({ 
  params, 
  moduleSlug 
}: DynamicModulePageProps) {
  const { slug } = await params;

  try {
    // Buscar implementação ativa para este tenant usando nova arquitetura
    const moduleResult = await getModuleImplementation(slug, moduleSlug);

    if (!moduleResult) {
      logModuleOperation('MODULE_NOT_FOUND', slug, moduleSlug);
      notFound();
    }

    const { implementation, config, isActive, baseModule } = moduleResult;

    // Verificar se módulo está ativo
    if (!isActive) {
      logModuleOperation('MODULE_INACTIVE', slug, moduleSlug, { 
        implementation: implementation.implementation_key 
      });
      
      return (
        <InactiveModuleComponent 
          moduleSlug={moduleSlug}
          moduleName={baseModule.name}
        />
      );
    }

    // Log único de carregamento
    logModuleOperation('MODULE_LOADING', slug, moduleSlug, {
      implementation: implementation.implementation_key,
      component_path: implementation.component_path,
      hasCustomConfig: Object.keys(config).length > 0,
      loadingMethod: 'dynamic'
    });

    // Criar componente dinâmico baseado no component_path do banco
    const DynamicComponent = createDynamicLazyComponent(
      implementation.component_path,
      moduleSlug,
      implementation.implementation_key
    );

    return (
      <Suspense fallback={<ModuleLoadingSkeleton />}>
        <DynamicComponent 
          params={{ slug }}
          config={config}
          implementation={implementation}
        />
      </Suspense>
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logModuleOperation('MODULE_ERROR', slug, moduleSlug, { 
      error: errorMessage,
      loadingMethod: 'dynamic'
    });
    
    return (
      <ModuleErrorComponent 
        moduleSlug={moduleSlug}
        error={errorMessage}
      />
    );
  }
}

/**
 * Função helper para gerar metadata dinamicamente
 */
export function createModuleMetadata(moduleSlug: string) {
  return async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    
    // Tentar buscar informações do módulo para metadata mais específica
    try {
      const moduleResult = await getModuleImplementation(slug, moduleSlug);
      const moduleName = moduleResult?.baseModule.name || moduleSlug;
      const moduleDescription = moduleResult?.baseModule.description || `Módulo ${moduleSlug}`;
      
      return {
        title: `${moduleName} - ${slug}`,
        description: moduleDescription,
        keywords: [moduleSlug, slug, 'módulo', 'dashboard'],
      };
    } catch (error) {
      // Fallback metadata
      return {
        title: `${moduleSlug} - ${slug}`,
        description: `Módulo ${moduleSlug} para ${slug}`,
        keywords: [moduleSlug, slug, 'módulo'],
      };
    }
  };
}