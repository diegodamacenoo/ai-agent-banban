import React, { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { useToast } from '@/shared/ui/toast';
import { 
  BarChart3, 
  TrendingUp, 
  Eye,
  Settings,
  Download,
  RefreshCw
} from 'lucide-react';

// Importar apenas os componentes que existem
import { BanbanInsightsHome } from './BanbanInsightsHome';
import { PerformancePage } from './performance/PerformancePage';

// Manter o hook que existe
import { useBanbanService } from '../hooks/useBanbanService';

import type { CustomDashboardProps } from '@/clients/registry';

export function BanBanDashboardWrapper({ slug, organization }: CustomDashboardProps) {
  const [activeTab, setActiveTab] = useState('home');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Unified service integration
  const banbanService = useBanbanService(organization.id);
  const { toast } = useToast();

  // Função para forçar refresh dos componentes
  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    toast.success("Dashboard atualizado", {
      description: "Todos os módulos foram atualizados com os dados mais recentes.",
    });
  }, [toast]);

  // Enhanced export functionality (simplificado)
  const handleExportReport = useCallback(async () => {
    try {
      const reportRequest = {
        orgId: organization.id,
        type: 'executive' as const,
        format: 'pdf' as const,
        period: '30d' as const,
        includeCharts: true
      };

      const report = await banbanService.generateReport(reportRequest);
      
      if (report) {
        toast.success("Relatório gerado", {
          description: `Relatório ${report.title} foi gerado com sucesso.`,
        });
      } else {
        throw new Error("Falha ao gerar relatório");
      }
    } catch (error) {
      toast.error("Erro", {
        description: "Não foi possível gerar o relatório. Tente novamente.",
      });
    }
  }, [banbanService, organization.id, toast]);

  // Check if this is the tenant home route (no specific tab selected)
  const isHome = !activeTab || activeTab === 'home';

  // If it's the home route, show the insights home dashboard
  if (isHome) {
    return (
      <BanbanInsightsHome 
        organizationId={organization.id}
        userName={organization.company_trading_name || 'Usuário'}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header do Dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Dashboard BanBan Fashion
          </h1>
          <p className="text-muted-foreground">
            {organization.company_trading_name || organization.company_legal_name} • Análise completa do varejo
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <BarChart3 className="h-4 w-4 mr-1" />
            Sistema Simplificado
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={banbanService.loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${banbanService.loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportReport}
            disabled={banbanService.loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Sistema de Abas simplificado - apenas essenciais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full">
          <TabsTrigger value="home" className="flex items-center space-x-2 flex-1">
            <Eye className="h-4 w-4" />
            <span>Home</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2 flex-1">
            <TrendingUp className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
        </TabsList>

        {/* Aba Home - Insights Dashboard */}
        <TabsContent value="home" className="space-y-6">
          <BanbanInsightsHome 
            organizationId={organization.id}
            userName={organization.company_trading_name || 'Usuário'}
          />
        </TabsContent>

        {/* Aba Performance */}
        <TabsContent value="performance" className="space-y-6">
          <PerformancePage 
            key={`performance-${refreshKey}`}
            organizationId={organization.id}
          />
        </TabsContent>
      </Tabs>

      {/* Footer com informações rápidas */}
      <Card className="bg-gray-50">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>Dashboard BanBan Fashion Simplificado</span>
              <span>•</span>
              <span>Última sincronização: {new Date().toLocaleTimeString('pt-BR')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Sistema funcionando
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 