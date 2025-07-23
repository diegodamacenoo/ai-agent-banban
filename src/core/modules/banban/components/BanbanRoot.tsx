'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import InsightsDashboard from './InsightsDashboard';
import PerformanceMetrics from './PerformanceMetrics';
import DataProcessingStatus from './DataProcessingStatus';
import { useClientType } from '@/shared/hooks/useClientType';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { AlertTriangle, BarChart3, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';

const BanbanOverview: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Banban Intelligence</h1>
        <p className="text-muted-foreground">
          Sistema inteligente de processamento de dados ERP e geração de insights para varejo de calçados
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insights Acionáveis</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">
              +12% desde ontem
            </p>
            <Button asChild className="mt-3 w-full">
              <a href="/banban/insights">Ver Insights</a>
            </Button>
          </CardContent>
        </Card>


        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89%</div>
            <p className="text-xs text-muted-foreground">
              Eficiência operacional
            </p>
            <Button asChild className="mt-3 w-full" variant="outline">
              <a href="/banban/performance">Ver Métricas</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Processamento de Dados</CardTitle>
            <CardDescription>
              Status do sistema de processamento em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Listeners Ativos</span>
                <span className="font-mono">12/12</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Eventos Processados (hoje)</span>
                <span className="font-mono">2,847</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Taxa de Sucesso</span>
                <span className="font-mono text-green-600">99.8%</span>
              </div>
            </div>
            <Button asChild className="mt-4 w-full" variant="outline">
              <a href="/banban/data-processing">Ver Detalhes</a>
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

const BanbanSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações Banban</h1>
        <p className="text-muted-foreground">
          Configure os módulos e comportamentos do sistema Banban
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Insights</CardTitle>
            <CardDescription>
              Frequência e tipos de insights gerados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configuração em desenvolvimento...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const BanbanRoot: React.FC = () => {
  const pathname = usePathname();
  const { hasPermission } = useClientType();

  // Verificar permissão básica para acessar o Banban
  if (!hasPermission('view-banban')) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          Você não tem permissão para acessar o módulo Banban.
        </AlertDescription>
      </Alert>
    );
  }

  // Renderizar conteúdo baseado na rota
  const renderContent = () => {
    if (pathname === '/banban' || pathname === '/banban/') {
      return <BanbanOverview />;
    }
    
    if (pathname.startsWith('/banban/insights')) {
      if (!hasPermission('view-banban-insights')) {
        return (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Acesso Negado</AlertTitle>
            <AlertDescription>
              Você não tem permissão para acessar os insights do Banban.
            </AlertDescription>
          </Alert>
        );
      }
      return <InsightsDashboard />;
    }
    
    
    if (pathname.startsWith('/banban/performance')) {
      if (!hasPermission('view-banban-performance')) {
        return (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Acesso Negado</AlertTitle>
            <AlertDescription>
              Você não tem permissão para acessar as métricas de performance.
            </AlertDescription>
          </Alert>
        );
      }
      return <PerformanceMetrics />;
    }
    
    if (pathname.startsWith('/banban/data-processing')) {
      if (!hasPermission('view-banban-data-processing')) {
        return (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Acesso Negado</AlertTitle>
            <AlertDescription>
              Você não tem permissão para acessar o processamento de dados.
            </AlertDescription>
          </Alert>
        );
      }
      return <DataProcessingStatus />;
    }
    
    if (pathname.startsWith('/banban/settings')) {
      if (!hasPermission('config-banban')) {
        return (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Acesso Negado</AlertTitle>
            <AlertDescription>
              Você não tem permissão para acessar as configurações.
            </AlertDescription>
          </Alert>
        );
      }
      return <BanbanSettings />;
    }

    // Rota não encontrada
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Página não encontrada</AlertTitle>
        <AlertDescription>
          A página solicitada não foi encontrada no módulo Banban.
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="p-6">
      {renderContent()}
    </div>
  );
};

export default BanbanRoot; 