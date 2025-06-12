'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface ForecastData {
  variant_id: string;
  sku: string;
  product_name: string;
  forecast_horizon_days: number;
  predicted_sales: number;
  confidence_interval_low: number;
  confidence_interval_high: number;
  model_accuracy: number;
  forecast_date: string;
}

interface ForecastWidgetProps {
  forecastData?: ForecastData[];
  className?: string;
}

export function ForecastWidget({ forecastData = [], className }: ForecastWidgetProps) {
  const [selectedHorizon, setSelectedHorizon] = useState<7 | 14 | 30>(7);
  const [selectedVariant, setSelectedVariant] = useState<string>('');

  // Filtrar dados por horizonte
  const filteredData = forecastData.filter(f => f.forecast_horizon_days === selectedHorizon);
  
  // Obter variantes únicas
  const uniqueVariants = Array.from(
    new Set(filteredData.map(f => f.variant_id))
  ).map(variantId => {
    const forecast = filteredData.find(f => f.variant_id === variantId);
    return {
      id: variantId,
      name: `${forecast?.sku} - ${forecast?.product_name}` || 'Produto não identificado'
    };
  });

  // Selecionar primeiro variant se não houver seleção
  React.useEffect(() => {
    if (uniqueVariants.length > 0 && !selectedVariant) {
      setSelectedVariant(uniqueVariants[0].id);
    }
  }, [uniqueVariants, selectedVariant]);

  // Dados do variant selecionado
  const selectedData = filteredData.filter(f => f.variant_id === selectedVariant);
  const accuracy = selectedData.length > 0 ? selectedData[0].model_accuracy : 0;

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'bg-green-500';
    if (accuracy >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Formatar dados para o gráfico
  const chartData = selectedData.map((item, index) => ({
    name: `Dia ${index + 1}`,
    forecast: item.predicted_sales,
    confidenceHigh: item.confidence_interval_high,
    confidenceLow: item.confidence_interval_low
  }));

  if (!forecastData || forecastData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center text-yellow-600">
            <Activity className="mr-2 h-5 w-5" />
            Forecast de Vendas
          </CardTitle>
          <CardDescription>
            Nenhum dado de previsão disponível
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Activity className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2">Dados de forecast não encontrados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <CardTitle className="flex items-center text-lg font-semibold">
              Forecast de Vendas
            </CardTitle>
            <CardDescription>
              Previsão de vendas com intervalo de confiança
            </CardDescription>
          </div>
          {accuracy > 0 && (
            <Badge className={`${getAccuracyColor(accuracy)} text-white`}>
              {accuracy.toFixed(1)}% Accuracy
            </Badge>
          )}
        </div>
        
        <div className="flex gap-4">
          <Select value={selectedVariant} onValueChange={setSelectedVariant}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selecionar produto" />
            </SelectTrigger>
            <SelectContent>
              {uniqueVariants.map((variant) => (
                <SelectItem key={variant.id} value={variant.id}>
                  {variant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={selectedHorizon.toString()} 
            onValueChange={(value) => setSelectedHorizon(Number(value) as 7 | 14 | 30)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="14">14 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-muted-foreground"
                fontSize={12}
              />
              <YAxis 
                className="text-muted-foreground"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              
              {/* Área de confiança */}
              <Line
                type="monotone"
                dataKey="confidenceHigh"
                stroke="#3b82f6"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="Limite Superior"
              />
              <Line
                type="monotone"
                dataKey="confidenceLow"
                stroke="#3b82f6"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="Limite Inferior"
              />
              
              {/* Linha principal de previsão */}
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                name="Previsão"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Estatísticas resumidas */}
        {selectedData.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">Vendas Previstas</p>
              <p className="text-lg font-semibold text-blue-600">
                {selectedData.reduce((sum, item) => sum + item.predicted_sales, 0).toFixed(0)} un
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Período</p>
              <p className="text-lg font-semibold">{selectedHorizon} dias</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Acurácia Modelo</p>
              <p className="text-lg font-semibold text-green-600">{accuracy.toFixed(1)}%</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 