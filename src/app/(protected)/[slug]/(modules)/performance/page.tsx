import { Suspense, lazy } from 'react';
import { notFound } from 'next/navigation';
import { getModuleImplementation, logModuleOperation } from '@/lib/modules';

// AIDEV-NOTE: module-router; dynamic imports for performance implementations
// Imports dinâmicos das implementações
const StandardImplementation = lazy(() => import('./implementations/StandardPerformanceImplementation'));
const BanbanImplementation = lazy(() => import('./implementations/BanbanPerformanceImplementation'));
const EnterpriseImplementation = lazy(() => import('./implementations/EnterprisePerformanceImplementation'));

// Mapeamento de implementações
const implementationMap = {
  'standard': StandardImplementation,
  'banban': BanbanImplementation,
  'enterprise': EnterpriseImplementation,
} as const;

// Loading skeleton específico do módulo
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

interface PerformancePageProps {
  params: Promise<{ slug: string }>;
}

export default async function PerformancePage({ params }: PerformancePageProps) {
  const { slug } = await params;

  try {
    // Buscar implementação ativa para este tenant
    const moduleResult = await getModuleImplementation(slug, 'performance');

    if (!moduleResult) {
      logModuleOperation('MODULE_NOT_FOUND', slug, 'performance');
      notFound();
    }

    const { implementation, config, isActive } = moduleResult;

    if (!isActive) {
      logModuleOperation('MODULE_INACTIVE', slug, 'performance', { implementation: implementation.implementation_key });
      return (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Módulo Performance Inativo
            </h2>
            <p className="text-gray-600">
              Este módulo não está ativo para sua organização.
            </p>
          </div>
        </div>
      );
    }

    // Selecionar implementação baseada na chave
    const ImplementationComponent = implementationMap[implementation.implementation_key as keyof typeof implementationMap] 
      || implementationMap['standard'];

    logModuleOperation('MODULE_LOADED', slug, 'performance', {
      implementation: implementation.implementation_key,
      component: implementation.component_path,
      hasCustomConfig: Object.keys(config).length > 0
    });

    return (
      <Suspense fallback={<ModuleLoadingSkeleton />}>
        <ImplementationComponent 
          params={{ slug }}
          config={config}
          implementation={implementation}
        />
      </Suspense>
    );

  } catch (error) {
    console.error('Erro ao carregar módulo Performance:', error);
    logModuleOperation('MODULE_ERROR', slug, 'performance', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Erro ao Carregar Módulo
          </h2>
          <p className="text-gray-600 mb-4">
            Ocorreu um erro ao carregar o módulo Performance.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }
}

// Metadata para SEO
export async function generateMetadata({ params }: PerformancePageProps) {
  const { slug } = await params;
  return {
    title: `Performance Analytics - ${slug}`,
    description: 'Dashboard de performance e métricas de KPIs'
  };
}