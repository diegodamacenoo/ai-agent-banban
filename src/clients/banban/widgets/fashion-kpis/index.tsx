'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { TrendingUp, TrendingDown, Star } from 'lucide-react';
import { formatPercent } from '@/shared/utils/format';
import { BaseWidget, type WidgetProps } from '@/shared/components/widgets/BaseWidget';

interface FashionKPIs {
  period: string;
  period_days: number;
  categories: Array<{
    name: string;
    revenue_share: number;
    margin: number;
    trend: number;
    seasonal_score: number;
  }>;
  seasonal_performance: {
    current_season_score: number;
    previous_season_score: number;
    trend: number;
    top_performers: string[];
  };
  size_performance: Array<{
    size: string;
    turnover_rate: number;
    stockout_frequency: number;
    revenue_share: number;
  }>;
  color_trends: Array<{
    color: string;
    revenue_share: number;
    trend: number;
    seasonal_relevance: number;
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

function SeasonalScore({ score }: { score: number }) {
  return (
    <div className="flex items-center">
      <Star className="h-4 w-4 mr-1 text-yellow-400" />
      <span className="font-bold">{(score * 100).toFixed(0)}</span>
    </div>
  );
}

function FashionKPIsWidget({ data, loading, error }: WidgetProps<FashionKPIs>) {
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
      {/* Categorias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Categorias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.categories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{category.name}</p>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>Margem: {formatPercent(category.margin)}</span>
                    <span>•</span>
                    <SeasonalScore score={category.seasonal_score} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatPercent(category.revenue_share)}</p>
                  <TrendIndicator value={category.trend} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Sazonal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Performance Sazonal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score Atual</p>
                <div className="flex items-center mt-1">
                  <SeasonalScore score={data.seasonal_performance.current_season_score} />
                  <TrendIndicator value={data.seasonal_performance.trend} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Score Anterior</p>
                <SeasonalScore score={data.seasonal_performance.previous_season_score} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Top Performers</p>
              <div className="flex flex-wrap gap-2">
                {data.seasonal_performance.top_performers.map((item, index) => (
                  <Badge key={index} variant="secondary">{item}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance por Tamanho */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Performance por Tamanho</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {data.size_performance.map((size, index) => (
              <div key={index} className="text-center">
                <Badge className="mb-2">{size.size}</Badge>
                <p className="font-bold">{formatPercent(size.revenue_share)}</p>
                <div className="text-sm text-muted-foreground mt-1">
                  <p>Giro: {size.turnover_rate.toFixed(1)}x</p>
                  <p>Stockout: {formatPercent(size.stockout_frequency)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tendências de Cores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Tendências de Cores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.color_trends.map((color, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{color.color}</p>
                  <p className="text-sm text-muted-foreground">
                    Relevância: {formatPercent(color.seasonal_relevance)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatPercent(color.revenue_share)}</p>
                  <TrendIndicator value={color.trend} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BaseWidget(FashionKPIsWidget); 