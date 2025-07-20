// AIDEV-NOTE: Este componente foi refatorado para usar React.lazy com um mapa de componentes,
// tornando-o escalável e sustentável para futuros módulos.

'use client';

import { Suspense, lazy, useMemo, ComponentType } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { 
  AlertTriangle, 
  Loader2, 
  RefreshCw,
  ArrowLeft,
  Shield,
  Zap
} from 'lucide-react';
import Link from 'next/link';

// --- Mapa de Componentes Dinâmicos ---
// AIDEV-NOTE: Para adicionar um novo módulo dinâmico, adicione uma entrada neste mapa.
// A chave deve ser o valor exato da coluna 'component_path' no banco de dados.
const moduleMap: Record<string, ComponentType<any>> = {
  '@/clients/banban/components/performance/PerformancePage': lazy(() =>
    import(`@/clients/banban/components/performance/PerformancePage`).then(module => ({ default: module.PerformancePage }))
  ),
  // Exemplo para um futuro módulo de 'insights':
  // '@/features/insights/components/InsightsDashboard': lazy(() =>
  //   import(`@/features/insights/components/InsightsDashboard`).then(module => ({ default: module.InsightsDashboard }))
  // ),
};
// -----------------------------------------

interface Organization {
  id: string;
  slug: string;
  client_type: string;
  company_trading_name: string;
  company_legal_name: string;
  is_implementation_complete: boolean;
}

interface DynamicModulePageProps {
  params: {
    slug: string;
    module: string;
  };
  organization: Organization;
  moduleMetadata: any; // Metadados passados pelo componente de servidor
}

// Loading component
function ModuleLoadingSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DynamicModulePage({
  params,
  organization,
  moduleMetadata
}: DynamicModulePageProps) {

  const ModuleComponent = useMemo(() => {
    const componentPath = moduleMetadata?.implementation?.component_path;
    if (!componentPath) {
      return null;
    }
    return moduleMap[componentPath] || null;
  }, [moduleMetadata]);

  if (!ModuleComponent) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro Crítico de Configuração</AlertTitle>
          <AlertDescription>
            O componente para o módulo "{params.module}" não está registrado no mapa de componentes da DynamicModulePage.tsx.
            <br />
            <span className="text-sm text-gray-500 mt-2 block">
              Caminho do DB: {moduleMetadata?.implementation?.component_path || 'Não encontrado'}
            </span>
            <div className="mt-4">
              <Link href={`/${params.slug}`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Dashboard
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <Suspense fallback={<ModuleLoadingSkeleton />}>
      <ModuleComponent 
        params={params}
        organization={organization}
        moduleConfig={moduleMetadata}
      />
    </Suspense>
  );
}