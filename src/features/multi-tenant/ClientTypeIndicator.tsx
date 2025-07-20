'use client';

import { useClientType } from '@/shared/hooks/useClientType';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Building2, Settings, Zap, AlertCircle } from 'lucide-react';

export function ClientTypeIndicator() {
  const { 
    clientType, 
    isCustom, 
    isStandard, 
    isLoading, 
    customModules, 
    standardModules, 
    backendUrl,
    isImplementationComplete,
    organizationName
  } = useClientType();

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Carregando...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {organizationName || 'OrganizaÃ§Ã£o'}
        </CardTitle>
        <CardDescription>
          InformaÃ§Ãµes do cliente multi-tenant
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tipo de Cliente */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Tipo de Cliente:</span>
          <Badge variant={isCustom ? "default" : "secondary"}>
            {isCustom ? "Customizado" : "PadrÃ£o"}
          </Badge>
        </div>

        {/* Status da ImplementaÃ§Ã£o */}
        {isCustom && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">ImplementaÃ§Ã£o:</span>
            <Badge variant={isImplementationComplete ? "default" : "destructive"}>
              {isImplementationComplete ? "Completa" : "Pendente"}
            </Badge>
          </div>
        )}

        {/* Backend URL para clientes customizados */}
        {isCustom && backendUrl && (
          <div className="space-y-1">
            <span className="text-sm font-medium flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Backend Customizado:
            </span>
            <code className="text-xs bg-gray-100 p-1 rounded block break-all">
              {backendUrl}
            </code>
          </div>
        )}

        {/* MÃ³dulos DisponÃ­veis */}
        <div className="space-y-2">
          <span className="text-sm font-medium flex items-center gap-1">
            <Zap className="h-4 w-4" />
            MÃ³dulos DisponÃ­veis:
          </span>
          <div className="flex flex-wrap gap-1">
            {isCustom ? (
              customModules.length > 0 ? (
                customModules.map((module: string) => (
                  <Badge key={module} variant="outline" className="text-xs">
                    {module}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-gray-500">Nenhum mÃ³dulo customizado</span>
              )
            ) : (
              standardModules.length > 0 ? (
                standardModules.map((module: string) => (
                  <Badge key={module} variant="outline" className="text-xs">
                    {module}
                  </Badge>
                ))
              ) : (
                ['performance', 'inventory', 'alerts', 'analytics'].map((module) => (
                  <Badge key={module} variant="outline" className="text-xs">
                    {module}
                  </Badge>
                ))
              )
            )}
          </div>
        </div>

        {/* Aviso para implementaÃ§Ã£o incompleta */}
        {isCustom && !isImplementationComplete && (
          <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded-md">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-xs text-yellow-700">
              <p className="font-medium">ImplementaÃ§Ã£o Pendente</p>
              <p>Entre em contato com o suporte para finalizar a configuraÃ§Ã£o.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
