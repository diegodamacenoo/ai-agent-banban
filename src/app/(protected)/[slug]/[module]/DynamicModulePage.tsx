// AIDEV-NOTE: Este componente foi refatorado para usar React.lazy com um mapa de componentes,
// tornando-o escalável e sustentável para futuros módulos.

'use client';

import { Suspense, useMemo } from 'react';
import { createDynamicLazyComponent } from '@/lib/modules/dynamic-loader';
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

// --- Dynamic Module Loading ---
// AIDEV-NOTE: Agora usa o dynamic-loader que carrega automaticamente baseado no component_path do banco
// Não precisa mais de mapa estático - tudo é resolvido dinamicamente
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
    if (!moduleMetadata?.implementation) {
      return null;
    }

    // Usar o dynamic-loader para carregar automaticamente baseado nos dados do banco
    return createDynamicLazyComponent(
      params.module, // moduleSlug
      moduleMetadata.implementation.implementation_key || 'standard',
      moduleMetadata.implementation.component_path || ''
    );
  }, [moduleMetadata, params.module]);

  if (!ModuleComponent) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="default" className="max-w-2xl mx-auto border-orange-200 bg-orange-50">
          <Zap className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900">Módulo em Manutenção</AlertTitle>
          <AlertDescription className="text-orange-800">
            O módulo "{params.module}" está temporariamente indisponível para configuração.
            <br />
            <span className="text-sm text-orange-600 mt-2 block">
              Nossa equipe está trabalhando para disponibilizá-lo em breve.
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