/**
 * DynamicModuleLoader - Carregador universal de módulos
 * Fase 2 - Core Registry Implementation
 */

'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { ComponentType } from 'react';
import {
  ModuleLoaderProps,
  ModuleConfiguration,
  ClientType
} from '../types';
import { dynamicModuleRegistry } from '../registry/DynamicModuleRegistry';

// Componentes de fallback
const ModuleLoadingSkeleton: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px] p-8">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="text-gray-600 text-sm">Carregando módulo...</p>
    </div>
  </div>
);

const ModuleErrorFallback: React.FC<{ error: string; onRetry?: () => void }> = ({ 
  error, 
  onRetry 
}) => (
  <div className="flex items-center justify-center min-h-[400px] p-8">
    <div className="text-center space-y-4 max-w-md">
      <div className="text-red-500 text-6xl">⚠️</div>
      <h3 className="text-lg font-semibold text-gray-900">
        Erro ao carregar módulo
      </h3>
      <p className="text-gray-600 text-sm">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Tentar novamente
        </button>
      )}
    </div>
  </div>
);

const ModuleNotFound: React.FC<{ moduleSlug: string }> = ({ moduleSlug }) => (
  <div className="flex items-center justify-center min-h-[400px] p-8">
    <div className="text-center space-y-4 max-w-md">
      <div className="text-gray-400 text-6xl">📦</div>
      <h3 className="text-lg font-semibold text-gray-900">
        Módulo não encontrado
      </h3>
      <p className="text-gray-600 text-sm">
        O módulo "{moduleSlug}" não está disponível ou você não tem permissão para acessá-lo.
      </p>
    </div>
  </div>
);

/**
 * Hook para carregar módulos dinamicamente
 */
export const useModuleLoader = (
  organizationId: string,
  clientType: ClientType,
  moduleSlug: string
) => {
  const [component, setComponent] = useState<ComponentType<any> | null>(null);
  const [config, setConfig] = useState<ModuleConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadModule = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.debug(`🔄 useModuleLoader: Carregando ${moduleSlug} para org=${organizationId}, client=${clientType}`);

      // Carregar configuração do módulo
      const moduleConfig = await dynamicModuleRegistry.getModuleBySlug(
        organizationId,
        clientType,
        moduleSlug
      );

      if (!moduleConfig) {
        throw new Error(`Módulo '${moduleSlug}' não encontrado para esta organização`);
      }

      // Carregar componente
      const moduleComponent = await dynamicModuleRegistry.loadComponent(
        moduleConfig.implementation.component_path
      );

      setComponent(() => moduleComponent);
      setConfig(moduleConfig);

      console.debug(`✅ useModuleLoader: ${moduleSlug} carregado com sucesso`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error(`❌ useModuleLoader: Erro ao carregar ${moduleSlug}:`, err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [organizationId, clientType, moduleSlug]);

  useEffect(() => {
    loadModule();
  }, [loadModule]);

  return {
    component,
    config,
    loading,
    error,
    retry: loadModule
  };
};

/**
 * Componente ModuleLoader principal
 */
export const DynamicModuleLoader: React.FC<ModuleLoaderProps> = ({
  organizationId,
  clientType,
  moduleSlug,
  params,
  organization,
  fallbackComponent: CustomFallback,
  onError,
  onLoaded,
  ...props
}) => {
  const { component, config, loading, error, retry } = useModuleLoader(
    organizationId,
    clientType,
    moduleSlug
  );

  // Callback de erro
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Callback de carregamento
  useEffect(() => {
    if (config && onLoaded) {
      onLoaded(config);
    }
  }, [config, onLoaded]);

  // Estados de renderização
  if (loading) {
    return <ModuleLoadingSkeleton />;
  }

  if (error) {
    return CustomFallback ? (
      <CustomFallback error={error} />
    ) : (
      <ModuleErrorFallback error={error} onRetry={retry} />
    );
  }

  if (!component) {
    return <ModuleNotFound moduleSlug={moduleSlug} />;
  }

  // Preparar props para o componente
  const moduleProps = {
    params: params || { slug: organization?.slug || '', module: moduleSlug },
    organization,
    moduleConfig: config,
    ...props
  };

  // Renderizar componente com Suspense
  const Component = component;
  return (
    <Suspense fallback={<ModuleLoadingSkeleton />}>
      <Component {...moduleProps} />
    </Suspense>
  );
};

/**
 * HOC para envolver componentes com carregamento de módulo
 */
export const withModuleLoader = <P extends object>(
  WrappedComponent: ComponentType<P>,
  moduleConfig: {
    organizationId: string;
    clientType: ClientType;
    moduleSlug: string;
  }
) => {
  const WithModuleLoaderComponent: React.FC<P> = (props) => {
    return (
      <DynamicModuleLoader
        {...moduleConfig}
        fallbackComponent={({ error }) => (
          <div>Erro ao carregar módulo: {error}</div>
        )}
      >
        <WrappedComponent {...props} />
      </DynamicModuleLoader>
    );
  };

  WithModuleLoaderComponent.displayName = `withModuleLoader(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithModuleLoaderComponent;
};

/**
 * Componente para pré-carregamento de módulos
 */
export const ModulePreloader: React.FC<{
  modules: string[];
  onProgress?: (loaded: number, total: number) => void;
  onComplete?: () => void;
}> = ({ modules, onProgress, onComplete }) => {
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    const preloadModules = async () => {
      try {
        await dynamicModuleRegistry.preloadModules(modules);
        setLoaded(modules.length);
        onComplete?.();
      } catch (error) {
        console.error('Erro no pré-carregamento:', error);
      }
    };

    preloadModules();
  }, [modules, onComplete]);

  useEffect(() => {
    onProgress?.(loaded, modules.length);
  }, [loaded, modules.length, onProgress]);

  return null; // Componente invisível
};

/**
 * Context para compartilhar estado do module loader
 */
export const ModuleLoaderContext = React.createContext<{
  registry: typeof dynamicModuleRegistry;
  clearCache: () => void;
}>({
  registry: dynamicModuleRegistry,
  clearCache: () => dynamicModuleRegistry.clearCache()
});

/**
 * Provider para o context
 */
export const ModuleLoaderProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const clearCache = useCallback(() => {
    dynamicModuleRegistry.clearCache();
  }, []);

  return (
    <ModuleLoaderContext.Provider
      value={{
        registry: dynamicModuleRegistry,
        clearCache
      }}
    >
      {children}
    </ModuleLoaderContext.Provider>
  );
};

/**
 * Hook para usar o context
 */
export const useModuleRegistry = () => {
  const context = React.useContext(ModuleLoaderContext);
  if (!context) {
    throw new Error('useModuleRegistry deve ser usado dentro de ModuleLoaderProvider');
  }
  return context;
};

// Export default
export default DynamicModuleLoader;