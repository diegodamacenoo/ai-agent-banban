/**
 * ModuleErrorFallback - Tratamento de erros para módulos
 * Fase 4 - Route Simplification
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  ExternalLink,
  Package,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { Organization } from '../lib/route-helpers';

interface ModuleErrorFallbackProps {
  error: string;
  moduleSlug: string;
  organization: Organization;
  onRetry?: () => void;
}

/**
 * Componente de erro elegante para falhas no carregamento de módulos
 */
export const ModuleErrorFallback: React.FC<ModuleErrorFallbackProps> = ({
  error,
  moduleSlug,
  organization,
  onRetry
}) => {
  const getErrorType = (errorMessage: string) => {
    if (errorMessage.includes('não encontrado')) {
      return 'not_found';
    }
    if (errorMessage.includes('acesso') || errorMessage.includes('permissão')) {
      return 'access_denied';
    }
    if (errorMessage.includes('carregamento') || errorMessage.includes('import')) {
      return 'load_error';
    }
    return 'unknown';
  };

  const errorType = getErrorType(error);

  const getErrorConfig = (type: string) => {
    switch (type) {
      case 'not_found':
        return {
          title: 'Módulo não encontrado',
          description: `O módulo "${moduleSlug}" não está disponível para sua organização.`,
          icon: Package,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
      
      case 'access_denied':
        return {
          title: 'Acesso negado',
          description: `Você não tem permissão para acessar o módulo "${moduleSlug}".`,
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      
      case 'load_error':
        return {
          title: 'Erro no carregamento',
          description: `Ocorreu um erro ao carregar o módulo "${moduleSlug}". Tente novamente.`,
          icon: RefreshCw,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      
      default:
        return {
          title: 'Erro inesperado',
          description: `Ocorreu um erro inesperado com o módulo "${moduleSlug}".`,
          icon: AlertTriangle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getErrorConfig(errorType);
  const Icon = config.icon;

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <Card className={`${config.bgColor} ${config.borderColor}`}>
        <CardHeader className="text-center">
          <div className={`mx-auto w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mb-4`}>
            <Icon className={`w-8 h-8 ${config.color}`} />
          </div>
          
          <CardTitle className={`text-xl ${config.color}`}>
            {config.title}
          </CardTitle>
          
          <p className="text-muted-foreground">
            {config.description}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Detalhes do erro */}
          <div className="bg-white rounded-lg p-4 border">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Detalhes
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Módulo:</span>
                <Badge variant="outline">{moduleSlug}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organização:</span>
                <span>{organization.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente:</span>
                <Badge variant="secondary">{organization.client_type}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Erro:</span>
                <span className="text-right text-xs font-mono max-w-xs break-all">
                  {error}
                </span>
              </div>
            </div>
          </div>

          {/* Ações disponíveis */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onRetry && errorType === 'load_error' && (
              <Button onClick={onRetry} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </Button>
            )}
            
            <Button variant="outline" asChild>
              <Link href={`/${organization.slug}`}>
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Início
              </Link>
            </Button>

            {errorType === 'not_found' && (
              <Button variant="outline" asChild>
                <Link href={`/${organization.slug}/settings`}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </Link>
              </Button>
            )}
          </div>

          {/* Sugestões de módulos alternativos */}
          {errorType === 'not_found' && (
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Módulos Sugeridos
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {getCommonModules(organization.client_type).map((module) => (
                  <Button
                    key={module.slug}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    asChild
                  >
                    <Link href={`/${organization.slug}/${module.slug}`}>
                      {module.name}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Informações de debug (apenas em desenvolvimento) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="bg-gray-100 rounded p-3">
              <summary className="cursor-pointer font-medium text-sm">
                Debug Info (desenvolvimento)
              </summary>
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify({
                  error,
                  moduleSlug,
                  organization: {
                    id: organization.id,
                    slug: organization.slug,
                    client_type: organization.client_type
                  },
                  errorType,
                  timestamp: new Date().toISOString()
                }, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Retorna módulos comuns baseado no tipo de cliente
 */
function getCommonModules(clientType: string) {
  const commonModules = [
    { slug: 'alerts', name: 'Alertas' },
    { slug: 'reports', name: 'Relatórios' },
    { slug: 'settings', name: 'Configurações' }
  ];

  if (clientType === 'banban') {
    return [
      ...commonModules,
      { slug: 'performance', name: 'Performance' },
      { slug: 'insights', name: 'Insights' },
      { slug: 'inventory', name: 'Inventário' }
    ];
  }

  return commonModules;
}

export default ModuleErrorFallback;