'use client';

import React from 'react';
import { WidgetProps, MetricDisplay } from '../../BaseWidget';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PerformanceKPIData {
  revenue: {
    current: number;
    previous: number;
    change_percent: number;
  };
  orders: {
    current: number;
    previous: number;
    change_percent: number;
  };
  conversion_rate: {
    current: number;
    previous: number;
    change_percent: number;
  };
  avg_order_value: {
    current: number;
    previous: number;
    change_percent: number;
  };
  period: {
    start_date: string;
    end_date: string;
    range: string;
  };
}

export default function PerformanceKPIsWidget({ 
  data, 
  params, 
  loading, 
  error,
  onRefresh,
  onUpdateParams 
}: WidgetProps) {
  const kpiData = data as PerformanceKPIData;

  if (loading) {
    return (
      <div className="space-y-4 h-full">
        <div className="grid grid-cols-2 gap-4 h-full">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-8 bg-muted rounded animate-pulse" />
              <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !kpiData) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 bg-destructive/10 rounded mx-auto flex items-center justify-center">
            <span className="text-destructive">⚠️</span>
          </div>
          <p className="text-sm text-muted-foreground">Erro ao carregar KPIs</p>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
    );
  }

  const getTrend = (changePercent: number) => {
    if (changePercent > 1) return 'up';
    if (changePercent < -1) return 'down';
    return 'stable';
  };

  return (
    <div className="space-y-4 h-full">
      <div className="grid grid-cols-2 gap-4 h-full">
        <MetricDisplay
          label="Receita"
          value={kpiData.revenue.current}
          change={kpiData.revenue.change_percent}
          trend={getTrend(kpiData.revenue.change_percent)}
          format="currency"
        />
        
        <MetricDisplay
          label="Pedidos"
          value={kpiData.orders.current}
          change={kpiData.orders.change_percent}
          trend={getTrend(kpiData.orders.change_percent)}
          format="number"
        />
        
        <MetricDisplay
          label="Taxa de Conversão"
          value={kpiData.conversion_rate.current}
          change={kpiData.conversion_rate.change_percent}
          trend={getTrend(kpiData.conversion_rate.change_percent)}
          format="percentage"
        />
        
        <MetricDisplay
          label="Ticket Médio"
          value={kpiData.avg_order_value.current}
          change={kpiData.avg_order_value.change_percent}
          trend={getTrend(kpiData.avg_order_value.change_percent)}
          format="currency"
        />
      </div>
      
      <div className="mt-4 pt-3 border-t">
        <p className="text-xs text-muted-foreground text-center">
          Período: {kpiData.period.range} | 
          Última atualização: {new Date().toLocaleTimeString('pt-BR')}
        </p>
      </div>
    </div>
  );
}