'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/shared/utils/format';
import { BaseWidget, type WidgetProps } from '@/shared/components/widgets/BaseWidget';

interface ExecutiveKPIs {
  period: string;
  period_days: number;
  revenue: {
    current_value: number;
    previous_value: number;
    trend: number;
    goal: number;
  };
  margin: {
    current_value: number;
    previous_value: number;
    trend: number;
    goal: number;
  };
  inventory_turnover: {
    current_value: number;
    previous_value: number;
    trend: number;
    goal: number;
  };
  critical_products: {
    stockout_risk: number;
    overstock: number;
    low_turnover: number;
    high_demand: number;
  };
  top_categories: Array<{
    name: string;
    revenue: number;
    margin: number;
    trend: number;
  }>;
}

function TrendIndicator({ value }: { value: number }) {
  if (value > 0) {
    return (
      <Badge variant="success" className="ml-2">
        <TrendingUp className="h-4 w-4 mr-1" />
        +{formatPercent(value)}
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="ml-2">
      <TrendingDown className="h-4 w-4 mr-1" />
      {formatPercent(value)}
    </Badge>
  );
}

function ExecutiveDashboardWidget({ data, loading, error }: WidgetProps<ExecutiveKPIs>) {
  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div>Erro ao carregar dados: {error}</div>;
  }

  if (!data) {
    return <div>Nenhum dado disponível</div>;
  }

  return (
    <div className="grid gap-4">
      {/* KPIs Principais */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.revenue.current_value)}
              <TrendIndicator value={data.revenue.trend} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Meta: {formatCurrency(data.revenue.goal)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Margem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercent(data.margin.current_value)}
              <TrendIndicator value={data.margin.trend} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Meta: {formatPercent(data.margin.goal)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Giro de Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.inventory_turnover.current_value.toFixed(1)}x
              <TrendIndicator value={data.inventory_turnover.trend} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Meta: {data.inventory_turnover.goal.toFixed(1)}x
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Produtos Críticos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Produtos Críticos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Badge variant="destructive" className="mb-2">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Risco de Stockout
              </Badge>
              <p className="text-2xl font-bold">{data.critical_products.stockout_risk}</p>
            </div>
            <div>
              <Badge variant="warning" className="mb-2">Overstock</Badge>
              <p className="text-2xl font-bold">{data.critical_products.overstock}</p>
            </div>
            <div>
              <Badge variant="secondary" className="mb-2">Baixo Giro</Badge>
              <p className="text-2xl font-bold">{data.critical_products.low_turnover}</p>
            </div>
            <div>
              <Badge variant="success" className="mb-2">Alta Demanda</Badge>
              <p className="text-2xl font-bold">{data.critical_products.high_demand}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Categorias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Categorias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.top_categories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Margem: {formatPercent(category.margin)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(category.revenue)}</p>
                  <TrendIndicator value={category.trend} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BaseWidget(ExecutiveDashboardWidget); 