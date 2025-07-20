'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Eye, Download, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';

// Componentes do novo sistema
import { UnifiedFilters } from './filters/UnifiedFilters';
import { PerformanceKPICards } from './kpis/PerformanceKPICards';
import { SalesByCategoryChart } from './charts/SalesByCategoryChart';
import { TemporalAnalysis } from './temporal/TemporalAnalysis';
import { DrillDownProvider, DrillDownBreadcrumb, useDrillDownActions } from './drill-down/DrillDownProvider';

// Types
import { UnifiedFilters as UnifiedFiltersType, PerformanceKPIs } from './types';

interface PerformanceDashboardProps {
  params?: {
    slug: string;
    module: string;
  };
  organization?: {
    id: string;
    slug: string;
    client_type: string;
    company_trading_name?: string;
    company_legal_name?: string;
  };
}

// Mock data baseado no plano
const mockKPIs: PerformanceKPIs = {
  total_revenue: {
    value: 2847230,
    vs_last_period: 12.5,
    vs_last_year: 18.3,
    trend: 'up'
  },
  gross_margin_percentage: {
    value: 42.8,
    vs_target: 2.8,
    vs_last_period: 3.2
  },
  average_ticket: {
    value: 156.50,
    vs_last_period: 8.1,
    breakdown_by_category: {
      'Calçados Femininos': 180.20,
      'Calçados Masculinos': 165.80,
      'Bolsas': 245.90,
      'Acessórios': 89.30
    }
  },
  inventory_turnover: {
    value: 7.2,
    vs_optimal: 15.3,
    by_category: {
      'Calçados Femininos': 8.1,
      'Calçados Masculinos': 6.8,
      'Bolsas': 5.9,
      'Acessórios': 12.4
    }
  },
  sellthrough_rate: {
    value: 68.4,
    vs_last_season: 8.1,
    full_price_rate: 52.3
  },
  stock_coverage_days: {
    value: 28,
    vs_optimal: -5,
    by_location: {
      'Shopping Center Norte': 32,
      'Shopping Iguatemi': 25,
      'Rua Oscar Freire': 18,
      'Shopping Morumbi': 35
    }
  }
};

const defaultFilters: UnifiedFiltersType = {
  date_range: {
    preset: 'last_30_days',
    start_date: '',
    end_date: '',
    comparison_period: 'previous_period'
  },
  categories: [],
  brands: [],
  stores: [],
  price_ranges: [],
  seasons: [],
  collections: [],
  sizes: [],
  colors: []
};

function DashboardContent({ 
  organization,
  kpiData,
  isLoading,
  filters,
  onFiltersChange,
  activeContext,
  onContextChange,
  onExport
}: { 
  organization?: PerformanceDashboardProps['organization'],
  kpiData: PerformanceKPIs,
  isLoading: boolean,
  filters: UnifiedFiltersType,
  onFiltersChange: (filters: UnifiedFiltersType) => void,
  activeContext: 'overview' | 'temporal' | 'detailed',
  onContextChange: (context: 'overview' | 'temporal' | 'detailed') => void,
  onExport: () => void
}) {
  const { drillDownToCategory, drillDownToKPI } = useDrillDownActions();

  const handleKPIClick = (kpiId: string) => {
    drillDownToKPI(kpiId, { filters, timestamp: new Date() });
  };

  const handleCategoryClick = (category: string) => {
    drillDownToCategory(category, { filters, timestamp: new Date() });
  };

  const organizationName = organization?.company_trading_name || 
                          organization?.company_legal_name || 
                          organization?.slug || 
                          'Banban Fashion';

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
         <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Performance BI</h1>
              <p className="text-lg text-gray-600">Dashboard inteligente para {organizationName}</p>
            </div>
          </div>
        <PerformanceKPICards isLoading={true} kpis={{} as any} />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header do Dashboard */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Performance BI</h1>
              <p className="text-lg text-gray-600">Dashboard inteligente para {organizationName}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default" className="bg-purple-100 text-purple-700 border-purple-200">
              Dashboard BI
            </Badge>
            <Badge variant="outline" className="border-green-300 text-green-700">
              Dados em Tempo Real
            </Badge>
            <Badge variant="secondary">
              Módulo Customizado BanBan
            </Badge>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          <Button 
            variant="outline" 
            size="default"
            onClick={() => onContextChange(activeContext === 'overview' ? 'temporal' : 'overview')}
          >
            <Eye className="h-4 w-4 mr-2" />
            {activeContext === 'overview' ? 'Análise Temporal' : 'Visão Geral'}
          </Button>
          
          <Button 
            variant="outline" 
            size="default"
            onClick={onExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>

          <Button 
            variant="outline" 
            size="default"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
        </div>
      </div>

      {/* Breadcrumb de Drill-down */}
      <DrillDownBreadcrumb />

      {/* Sistema de Filtros Unificado */}
      <UnifiedFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        onExport={onExport}
        isLoading={isLoading}
      />

      {/* Conteúdo Principal baseado no Contexto */}
      {activeContext === 'overview' && (
        <div className="space-y-8">
          {/* KPIs Principais */}
          <section>
            <PerformanceKPICards
              kpis={kpiData}
              onKPIClick={handleKPIClick}
              isLoading={isLoading}
            />
          </section>

          {/* Gráfico Principal: Vendas por Categoria */}
          <section>
            <SalesByCategoryChart
              onCategoryClick={handleCategoryClick}
              onViewDetails={() => onContextChange('detailed')}
              isLoading={isLoading}
              period={filters.date_range.preset === 'last_30_days' ? 'Últimos 30 dias' : 'Período personalizado'}
            />
          </section>

          {/* Análise de Rankings - Placeholder */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Rankings & Comparações
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Top performers, bottom performers e análises comparativas
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Top Products */}
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-blue-900 mb-3">🏆 Top Produtos</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Tênis Nike Air Max</span>
                          <span className="text-sm font-medium">R$ 89k</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Bolsa Melissa</span>
                          <span className="text-sm font-medium">R$ 76k</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Sapato Social</span>
                          <span className="text-sm font-medium">R$ 65k</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Brands */}
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-green-900 mb-3">🚀 Top Marcas</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Nike</span>
                          <span className="text-sm font-medium">28.5%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Adidas</span>
                          <span className="text-sm font-medium">22.7%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Melissa</span>
                          <span className="text-sm font-medium">17.3%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Performance Matrix */}
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-purple-900 mb-3">📊 Matriz Performance</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Alto Vol. + Alta Margem</span>
                          <span className="text-sm font-medium">156 itens</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Alto Vol. + Baixa Margem</span>
                          <span className="text-sm font-medium">89 itens</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Baixo Vol. + Alta Margem</span>
                          <span className="text-sm font-medium">234 itens</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}

      {activeContext === 'temporal' && (
        <div className="space-y-8">
          <TemporalAnalysis
            onPeriodClick={(period) => console.log('Period clicked:', period)}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Footer com informações */}
      <div className="mt-12 pt-6 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <div>
            Última atualização: {new Date().toLocaleString('pt-BR')} • 
            Dados processados em tempo real
          </div>
          <div className="flex items-center gap-4 mt-2 md:mt-0">
            <span>✅ 1.2M registros processados</span>
            <span>⚡ Latência: 150ms</span>
            <span>🔄 Sincronizado</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PerformanceDashboard(props: PerformanceDashboardProps) {
  const [filters, setFilters] = useState<UnifiedFiltersType>(defaultFilters);
  const [kpiData, setKpiData] = useState<PerformanceKPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeContext, setActiveContext] = useState<'overview' | 'temporal' | 'detailed'>('overview');
  
  useEffect(() => {
    // Este efeito busca os dados quando os filtros mudam.
    setIsLoading(true);
    console.debug("Iniciando busca de dados de performance para filtros:", filters);
    
    setTimeout(() => {
      console.debug("Dados de performance recebidos.");
      setKpiData(mockKPIs);
      setIsLoading(false);
    }, 1500);
  }, [filters]);

  // Este efeito busca os dados na montagem inicial do componente.
  useEffect(() => {
    console.debug("Montagem inicial do PerformanceDashboard. Buscando dados...");
    handleFiltersChange(defaultFilters);
  }, []);

  const handleFiltersChange = (newFilters: UnifiedFiltersType) => {
    setFilters(newFilters);
  };

  const handleExport = () => {
    console.log('Exportando dados...', { filters, activeContext });
  };

  return (
    <DrillDownProvider
      onDrillChange={(path, level) => {
        console.log('Drill-down changed:', { path, level });
      }}
    >
      <DashboardContent 
        {...props}
        kpiData={kpiData!}
        isLoading={isLoading}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        activeContext={activeContext}
        onContextChange={setActiveContext}
        onExport={handleExport}
      />
    </DrillDownProvider>
  );
}
