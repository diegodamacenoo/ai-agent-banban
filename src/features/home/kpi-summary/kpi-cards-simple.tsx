'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPIData {
  sales: number;
  margin: number;
  cover_days: number;
  sell_through: number;
}

interface KPICardsSimpleProps {
  data: KPIData;
}

export function KPICardsSimple({ data }: KPICardsSimpleProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatDays = (value: number) => {
    return `${value} dias`;
  };

  const kpis = [
    {
      title: 'Vendas',
      value: formatCurrency(data.sales),
      trend: 0.12, // +12%
      description: 'Total de vendas no período'
    },
    {
      title: 'Margem',
      value: formatCurrency(data.margin),
      trend: -0.05, // -5%
      description: 'Margem de contribuição'
    },
    {
      title: 'Cobertura',
      value: formatDays(data.cover_days),
      trend: 0.08, // +8%
      description: 'Dias de estoque'
    },
    {
      title: 'Sell-Through',
      value: formatPercentage(data.sell_through),
      trend: 0.15, // +15%
      description: 'Taxa de conversão'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {kpi.title}
            </CardTitle>
            {kpi.trend > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <p className="text-xs text-muted-foreground">
              {kpi.description}
            </p>
            <div className={`text-xs mt-1 ${
              kpi.trend > 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {kpi.trend > 0 ? '+' : ''}{(kpi.trend * 100).toFixed(1)}% em relação ao período anterior
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 