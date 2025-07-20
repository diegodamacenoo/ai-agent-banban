'use client';

import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign,
  Percent,
  Package,
  Target,
  RotateCcw,
  AlertTriangle,
  Calendar,
  Crown,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { PerformanceKPIs } from '../types';

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  comparison: string;
  status: 'success' | 'warning' | 'danger' | 'info';
  icon: React.ReactNode;
  onClick?: () => void;
  sparklineData?: number[];
}

function KPICard({ 
  title, 
  value, 
  change, 
  trend, 
  comparison, 
  status, 
  icon, 
  onClick,
  sparklineData 
}: KPICardProps) {
  const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  
  const statusColors = {
    success: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    danger: 'text-red-600 bg-red-50 border-red-200',
    info: 'text-blue-600 bg-blue-50 border-blue-200'
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-gray-600'
  };

  return (
    <Card 
      className={`${statusColors[status]} border-2 transition-all duration-200 hover:shadow-lg ${
        onClick ? 'cursor-pointer hover:scale-[1.02]' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-white/50 flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Valor Principal */}
          <div className="text-2xl font-bold text-gray-900">
            {value}
          </div>
          
          {/* Comparação e Trend */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1 text-sm ${trendColors[trend]}`}>
              <TrendIcon className="h-4 w-4" />
              <span className="font-medium">
                {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {comparison}
            </span>
          </div>

          {/* Sparkline simples (placeholder) */}
          {sparklineData && (
            <div className="h-8 flex items-end gap-1">
              {sparklineData.map((value, index) => (
                <div
                  key={index}
                  className="bg-gray-300 rounded-sm flex-1"
                  style={{ 
                    height: `${Math.max(4, (value / Math.max(...sparklineData)) * 100)}%`,
                    backgroundColor: trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#6b7280'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface PerformanceKPICardsProps {
  kpis: PerformanceKPIs;
  onKPIClick?: (kpiId: string) => void;
  isLoading?: boolean;
}

export function PerformanceKPICards({ 
  kpis, 
  onKPIClick, 
  isLoading = false 
}: PerformanceKPICardsProps) {
  
  // if (isLoading) {
  //   return (
  //     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  //       {Array.from({ length: 6 }).map((_, index) => (
  //         <Card key={index} className="animate-pulse">
  //           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
  //             <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  //             <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
  //           </CardHeader>
  //           <CardContent>
  //             <div className="space-y-3">
  //               <div className="h-8 bg-gray-200 rounded w-3/4"></div>
  //               <div className="flex justify-between">
  //                 <div className="h-4 bg-gray-200 rounded w-1/3"></div>
  //                 <div className="h-4 bg-gray-200 rounded w-1/4"></div>
  //               </div>
  //             </div>
  //           </CardContent>
  //         </Card>
  //       ))}
  //     </div>
  //   );
  // }

  // Adicionada uma verificação para evitar erro se kpis for nulo ou indefinido
  if (!kpis || Object.keys(kpis).length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const mockSparklineData = [65, 59, 80, 81, 56, 55, 40];

  return (
    <div className="space-y-6">
      {/* KPI Summary Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Indicadores Principais
          </h3>
          <p className="text-sm text-gray-600">
            Métricas essenciais de performance do negócio
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Activity className="h-4 w-4 mr-2" />
          Atualizar Dados
        </Button>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <KPICard
          title="Receita Total"
          value={`R$ ${(kpis.total_revenue.value / 1000000).toFixed(2)}M`}
          change={kpis.total_revenue.vs_last_period}
          trend={kpis.total_revenue.trend}
          comparison="vs período anterior"
          status={kpis.total_revenue.trend === 'up' ? 'success' : 'warning'}
          icon={<DollarSign className="h-4 w-4" />}
          onClick={() => onKPIClick?.('total_revenue')}
          sparklineData={mockSparklineData}
        />

        {/* Gross Margin */}
        <KPICard
          title="Margem Bruta"
          value={`${kpis.gross_margin_percentage.value.toFixed(1)}%`}
          change={kpis.gross_margin_percentage.vs_last_period}
          trend={kpis.gross_margin_percentage.vs_last_period > 0 ? 'up' : 'down'}
          comparison="vs período anterior"
          status={kpis.gross_margin_percentage.vs_target >= 0 ? 'success' : 'warning'}
          icon={<Percent className="h-4 w-4" />}
          onClick={() => onKPIClick?.('gross_margin')}
          sparklineData={mockSparklineData.reverse()}
        />

        {/* Average Ticket */}
        <KPICard
          title="Ticket Médio"
          value={`R$ ${kpis.average_ticket.value.toFixed(0)}`}
          change={kpis.average_ticket.vs_last_period}
          trend={kpis.average_ticket.vs_last_period > 0 ? 'up' : 'down'}
          comparison="vs período anterior"
          status={kpis.average_ticket.vs_last_period > 0 ? 'success' : 'warning'}
          icon={<Target className="h-4 w-4" />}
          onClick={() => onKPIClick?.('average_ticket')}
          sparklineData={mockSparklineData}
        />

        {/* Inventory Turnover */}
        <KPICard
          title="Giro de Estoque"
          value={`${kpis.inventory_turnover.value.toFixed(1)}x`}
          change={kpis.inventory_turnover.vs_optimal}
          trend={kpis.inventory_turnover.vs_optimal > 0 ? 'up' : 'down'}
          comparison="vs ideal"
          status={kpis.inventory_turnover.vs_optimal >= 0 ? 'success' : 'warning'}
          icon={<RotateCcw className="h-4 w-4" />}
          onClick={() => onKPIClick?.('inventory_turnover')}
          sparklineData={mockSparklineData.slice(0, 5)}
        />

        {/* Sellthrough Rate */}
        <KPICard
          title="Taxa de Venda"
          value={`${kpis.sellthrough_rate.value.toFixed(1)}%`}
          change={kpis.sellthrough_rate.vs_last_season}
          trend={kpis.sellthrough_rate.vs_last_season > 0 ? 'up' : 'down'}
          comparison="vs estação anterior"
          status={kpis.sellthrough_rate.value >= 70 ? 'success' : 'warning'}
          icon={<TrendingUp className="h-4 w-4" />}
          onClick={() => onKPIClick?.('sellthrough_rate')}
          sparklineData={mockSparklineData.slice(1, 6)}
        />

        {/* Stock Coverage */}
        <KPICard
          title="Cobertura de Estoque"
          value={`${kpis.stock_coverage_days.value} dias`}
          change={kpis.stock_coverage_days.vs_optimal}
          trend={kpis.stock_coverage_days.vs_optimal < 0 ? 'up' : 'down'}
          comparison="vs ideal"
          status={
            kpis.stock_coverage_days.value >= 25 && kpis.stock_coverage_days.value <= 35 
              ? 'success' 
              : 'warning'
          }
          icon={<Package className="h-4 w-4" />}
          onClick={() => onKPIClick?.('stock_coverage')}
          sparklineData={mockSparklineData.slice(2, 7)}
        />
      </div>

      {/* KPI Insights Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">
                Performance Geral
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                {kpis.total_revenue.trend === 'up' ? 
                  '📈 Excelente performance! Receita e margem em crescimento.' :
                  '⚠️ Atenção necessária. Algumas métricas abaixo do esperado.'
                }
              </p>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">
                  {kpis.total_revenue.trend === 'up' ? 'Crescendo' : 'Estável'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Dados atualizados em tempo real
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}