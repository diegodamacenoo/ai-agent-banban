'use client';

import { Package, Store, TrendingUp, BarChart3, Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/utils/utils';
import { Insight } from '../types';

interface ContextCardProps {
  insight: Insight;
}

const formatMetricValue = (value: string | number): string => {
  if (typeof value === 'number') {
    if (value > 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  }
  return value.toString();
};

const getMetricIcon = (key: string) => {
  const iconMap: Record<string, any> = {
    unitsLeft: Package,
    daysToStockout: Calendar,
    averageDailySales: TrendingUp,
    priceDifference: BarChart3,
    affectedProducts: Package,
    demandIncrease: TrendingUp,
    opportunityRevenue: BarChart3,
    salesGrowth: TrendingUp,
    daysEarly: Calendar,
    leadingCategory: Users,
    lowStockProducts: Package,
    seasonalPattern: Calendar,
    delayDays: Calendar,
    affectedOrders: Package,
    hoursLeft: Calendar,
    hoursWithoutStock: Calendar,
    lostSales: TrendingUp
  };
  
  return iconMap[key] || BarChart3;
};

const getMetricColor = (key: string, insight: Insight) => {
  if (insight.type === 'critical') {
    return 'text-red-600 bg-red-50 border-red-200';
  } else if (insight.type === 'attention') {
    return 'text-amber-600 bg-amber-50 border-amber-200';
  } else if (insight.type === 'opportunity') {
    return 'text-green-600 bg-green-50 border-green-200';
  } else if (insight.type === 'achievement') {
    return 'text-purple-600 bg-purple-50 border-purple-200';
  }
  return 'text-blue-600 bg-blue-50 border-blue-200';
};

const formatMetricLabel = (key: string): string => {
  const labelMap: Record<string, string> = {
    unitsLeft: 'Unidades Restantes',
    daysToStockout: 'Dias até Estoque Zero',
    averageDailySales: 'Vendas Médias/Dia',
    priceDifference: 'Diferença de Preço (%)',
    affectedProducts: 'Produtos Afetados',
    demandIncrease: 'Aumento Demanda (%)',
    opportunityRevenue: 'Receita Potencial (R$)',
    salesGrowth: 'Crescimento Vendas (%)',
    daysEarly: 'Dias de Antecedência',
    leadingCategory: 'Categoria Líder',
    lowStockProducts: 'Produtos Baixo Estoque',
    seasonalPattern: 'Padrão Sazonal',
    delayDays: 'Dias de Atraso',
    affectedOrders: 'Pedidos Afetados',
    hoursLeft: 'Horas Restantes',
    hoursWithoutStock: 'Horas sem Estoque',
    lostSales: 'Vendas Perdidas'
  };
  
  return labelMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

// Mock historical data for trend visualization
const getTrendData = (insight: Insight) => {
  const baseData = [
    { date: '26/Jun', value: 85 },
    { date: '27/Jun', value: 72 },
    { date: '28/Jun', value: 58 },
    { date: '29/Jun', value: 31 },
    { date: '30/Jun', value: insight.type === 'critical' ? 8 : 45 }
  ];
  
  return baseData;
};

export function ContextCard({ insight }: ContextCardProps) {
  const trendData = getTrendData(insight);
  const hasMetrics = insight.data.metrics && Object.keys(insight.data.metrics).length > 0;
  const hasProducts = insight.data.products && insight.data.products.length > 0;
  const hasStores = insight.data.stores && insight.data.stores.length > 0;
  const hasSuppliers = insight.data.suppliers && insight.data.suppliers.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Contexto & Dados
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Métricas Principais */}
        {hasMetrics && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">📊 Métricas Principais</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(insight.data.metrics).map(([key, value]) => {
                const IconComponent = getMetricIcon(key);
                const colorClasses = getMetricColor(key, insight);
                
                return (
                  <div 
                    key={key}
                    className={cn(
                      'p-3 rounded-lg border text-center space-y-2',
                      colorClasses
                    )}
                  >
                    <IconComponent className="h-4 w-4 mx-auto" />
                    <div className="space-y-1">
                      <div className="text-lg font-bold">
                        {formatMetricValue(value)}
                      </div>
                      <div className="text-xs font-medium">
                        {formatMetricLabel(key)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mini Trend Chart */}
        {(insight.type === 'critical' || insight.type === 'attention') && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">📈 Tendência (Últimos 5 dias)</h4>
            <div className="space-y-2">
              {trendData.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-12 font-mono">{item.date}</span>
                  <div className="flex-1 bg-muted rounded-full h-2 relative">
                    <div 
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        item.value < 20 ? "bg-red-500" : 
                        item.value < 50 ? "bg-amber-500" : "bg-green-500"
                      )}
                      style={{ width: `${Math.max(item.value, 8)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-8 text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Produtos Afetados */}
        {hasProducts && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produtos Afetados ({insight.data.products.length})
            </h4>
            <div className="space-y-2">
              {insight.data.products.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">{product}</span>
                  <div className="flex items-center gap-2">
                    {insight.type === 'critical' && (
                      <Badge variant="destructive" className="text-xs">
                        {Math.floor(Math.random() * 5) + 1} unidades
                      </Badge>
                    )}
                    {insight.type === 'opportunity' && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                        +{Math.floor(Math.random() * 20) + 30}% demanda
                      </Badge>
                    )}
                    {insight.type === 'attention' && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
                        Verificar preço
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lojas Afetadas */}
        {hasStores && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Store className="h-4 w-4" />
              Lojas Afetadas ({insight.data.stores.length})
            </h4>
            <div className="space-y-2">
              {insight.data.stores.map((store, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">{store}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    {insight.type === 'critical' ? (
                      <Badge variant="destructive" className="text-xs">Crítico</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Monitorar</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fornecedores */}
        {hasSuppliers && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Fornecedores ({insight.data.suppliers.length})
            </h4>
            <div className="space-y-2">
              {insight.data.suppliers.map((supplier, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">{supplier}</span>
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
                    Atraso detectado
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comparação Histórica */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">📅 Comparação Histórica</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground">Semana Passada</div>
              <div className="text-lg font-semibold text-foreground">
                {insight.type === 'critical' ? '45 unidades' : '87%'}
              </div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground">Mesmo Período (Ano Passado)</div>
              <div className="text-lg font-semibold text-foreground">
                {insight.type === 'critical' ? '32 unidades' : '92%'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}