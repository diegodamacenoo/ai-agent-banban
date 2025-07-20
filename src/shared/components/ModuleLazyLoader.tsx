'use client';

import { Suspense, ReactNode } from 'react';
import { Skeleton } from '@/shared/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useClientType } from '@/shared/hooks/useClientType';

interface ModuleLazyLoaderProps {
  moduleId: string;
  children: ReactNode;
  fallbackMessage?: string;
}

// Componente de loading padrão
const DefaultLoadingComponent = () => (
  <div className="space-y-4 p-4">
    <div className="flex items-center gap-2">
      <Skeleton className="h-6 w-6 rounded" />
      <Skeleton className="h-6 w-32" />
    </div>
    <div className="grid gap-4">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  </div>
);

// Componente de fallback padrão
const DefaultFallbackComponent = ({ message }: { message?: string }) => (
  <Alert className="m-4">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Módulo não disponível</AlertTitle>
    <AlertDescription>
      {message || 'Este módulo não está disponível para o seu tipo de conta.'}
    </AlertDescription>
  </Alert>
);

export function ModuleLazyLoader({
  moduleId,
  children,
  fallbackMessage
}: ModuleLazyLoaderProps) {
  const { hasModule, isLoading } = useClientType();

  // Se ainda está carregando informações do cliente
  if (isLoading) {
    return <DefaultLoadingComponent />;
  }

  // Se o usuário não tem acesso ao módulo
  if (!hasModule(moduleId)) {
    return <DefaultFallbackComponent message={fallbackMessage} />;
  }

  // Renderizar children com Suspense
  return (
    <Suspense fallback={<DefaultLoadingComponent />}>
      {children}
    </Suspense>
  );
}

// Hook para pré-carregar módulos
export function useModulePreloader() {
  const { config } = useClientType();

  const preloadModules = async () => {
    // Implementação simplificada de preload
    const allModules = [
      ...config.modules.standard,
      ...config.modules.custom.map(m => m.id)
    ];

    console.debug('Módulos disponíveis para preload:', allModules);
    
    // TODO: Implementar preload real quando necessário
    return Promise.resolve();
  };

  return {
    preloadModules
  };
}

// Componente wrapper para páginas de módulo
export function ModulePage({ 
  moduleId, 
  children,
  fallbackMessage
}: { 
  moduleId: string; 
  children: ReactNode;
  fallbackMessage?: string;
}) {
  return (
    <ModuleLazyLoader 
      moduleId={moduleId} 
      fallbackMessage={fallbackMessage}
    >
      {children}
    </ModuleLazyLoader>
  );
} 