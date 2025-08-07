'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { 
  Play, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { AlertThreshold } from '../hooks/useThresholds';

interface ThresholdPreviewProps {
  thresholds: AlertThreshold[];
  onTest?: (alertType: string) => void;
  className?: string;
}

interface MockDataPoint {
  product_id: string;
  product_name: string;
  current_value: number;
  threshold_value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  last_updated: string;
}

export function ThresholdPreview({ thresholds, onTest, className }: ThresholdPreviewProps) {
  const [previewData, setPreviewData] = useState<Record<string, MockDataPoint[]>>({});
  const [loading, setLoading] = useState(false);
  const [selectedThreshold, setSelectedThreshold] = useState<string | null>(null);

  // Gerar dados mock para preview
  const generateMockData = (threshold: AlertThreshold): MockDataPoint[] => {
    const mockProducts = [
      'Tênis Nike Air Max',
      'Camisa Polo Lacoste',
      'Calça Jeans Levi\'s',
      'Jaqueta de Couro',
      'Sapato Social',
      'Vestido Floral',
      'Bermuda Tactel',
      'Blusa de Tricot',
    ];

    return mockProducts.slice(0, 5).map((product, index) => {
      const baseValue = getBaseValueForThreshold(threshold);
      const variation = (Math.random() - 0.5) * baseValue * 0.4; // ±20% variation
      const currentValue = Math.max(0, baseValue + variation);
      
      let status: 'normal' | 'warning' | 'critical' = 'normal';
      
      // Determinar status baseado no tipo de threshold
      if (threshold.alert_type.includes('LOW') || threshold.alert_type.includes('CRITICAL')) {
        if (currentValue <= threshold.threshold_value) {
          status = threshold.priority === 'CRITICAL' ? 'critical' : 'warning';
        }
      } else if (threshold.alert_type.includes('OVERSTOCK')) {
        if (currentValue >= threshold.threshold_value) {
          status = 'warning';
        }
      } else {
        // Para outros tipos (MARGIN_LOW, SEASONAL_OPPORTUNITY)
        if (currentValue <= threshold.threshold_value) {
          status = threshold.priority === 'CRITICAL' ? 'critical' : 'warning';
        }
      }

      return {
        product_id: `prod_${index + 1}`,
        product_name: product,
        current_value: currentValue,
        threshold_value: threshold.threshold_value,
        unit: threshold.threshold_unit,
        status,
        trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
        last_updated: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      };
    });
  };

  const generatePreviewForThreshold = (threshold: AlertThreshold) => {
    setLoading(true);
    setSelectedThreshold(threshold.alert_type);
    
    setTimeout(() => {
      const mockData = generateMockData(threshold);
      setPreviewData(prev => ({
        ...prev,
        [threshold.alert_type]: mockData,
      }));
      setLoading(false);
    }, 500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'default';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Minus;
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'percentage') {
      return `${(value * 100).toFixed(1)}%`;
    }
    if (unit === 'units') {
      return `${Math.round(value)} un`;
    }
    if (unit === 'days') {
      return `${Math.round(value)} dias`;
    }
    return value.toFixed(2);
  };

  const calculateProgress = (current: number, threshold: number, isReverse: boolean = false) => {
    if (isReverse) {
      // Para thresholds onde valores menores são piores (STOCK_LOW, MARGIN_LOW)
      return Math.min(100, (current / threshold) * 100);
    } else {
      // Para thresholds onde valores maiores são piores (OVERSTOCK)
      return Math.min(100, (threshold / current) * 100);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold mb-2">Preview de Thresholds</h3>
        <p className="text-sm text-muted-foreground">
          Visualize como os thresholds configurados afetariam produtos reais
        </p>
      </div>

      {/* Lista de Thresholds */}
      <div className="grid gap-4">
        {thresholds.map(threshold => (
          <Card key={threshold.alert_type} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    {formatAlertTypeName(threshold.alert_type)}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Limite: {formatValue(threshold.threshold_value, threshold.threshold_unit)}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusColor(threshold.priority.toLowerCase())}>
                    {threshold.priority}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generatePreviewForThreshold(threshold)}
                    disabled={loading}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Testar
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Preview Data */}
            {previewData[threshold.alert_type] && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {loading && selectedThreshold === threshold.alert_type ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2 text-sm">Gerando preview...</span>
                    </div>
                  ) : (
                    previewData[threshold.alert_type].map((item, index) => (
                      <div key={item.product_id} className="border rounded-lg p-3 bg-muted/20">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">{item.product_name}</span>
                            <Badge variant={getStatusColor(item.status)} className="text-xs">
                              {item.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-1">
                            {React.createElement(getTrendIcon(item.trend), { 
                              className: `h-3 w-3 ${
                                item.trend === 'up' ? 'text-green-500' : 
                                item.trend === 'down' ? 'text-red-500' : 
                                'text-gray-400'
                              }` 
                            })}
                            <span className="text-xs text-muted-foreground">
                              {formatValue(item.current_value, item.unit)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Atual</span>
                            <span>Limite: {formatValue(item.threshold_value, item.unit)}</span>
                          </div>
                          <Progress 
                            value={calculateProgress(
                              item.current_value, 
                              item.threshold_value, 
                              threshold.alert_type.includes('LOW') || threshold.alert_type.includes('CRITICAL')
                            )}
                            className={`h-2 ${item.status === 'critical' ? 'bg-red-100' : item.status === 'warning' ? 'bg-yellow-100' : 'bg-green-100'}`}
                          />
                        </div>

                        {/* Alert Preview */}
                        {item.status !== 'normal' && (
                          <Alert className="mt-2" variant={item.status === 'critical' ? 'destructive' : 'default'}>
                            <AlertTriangle className="h-3 w-3" />
                            <AlertDescription className="text-xs">
                              {generateAlertMessage(threshold, item)}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// Função para gerar valor base baseado no tipo de threshold
function getBaseValueForThreshold(threshold: AlertThreshold): number {
  const baseValues = {
    'STOCK_CRITICAL': 15,
    'STOCK_LOW': 25,
    'MARGIN_LOW': 0.35,
    'SLOW_MOVING': 45,
    'OVERSTOCK': 300,
    'SEASONAL_OPPORTUNITY': 0.65,
  };
  return baseValues[threshold.alert_type] || threshold.threshold_value * 1.5;
}

// Função para formatar nome do tipo de alerta
function formatAlertTypeName(alertType: string): string {
  const names = {
    'STOCK_CRITICAL': 'Estoque Crítico',
    'STOCK_LOW': 'Estoque Baixo',
    'MARGIN_LOW': 'Margem Baixa',
    'SLOW_MOVING': 'Produtos Parados',
    'OVERSTOCK': 'Excesso de Estoque',
    'SEASONAL_OPPORTUNITY': 'Oportunidade Sazonal',
  };
  return names[alertType] || alertType;
}

// Função para gerar mensagem de alerta
function generateAlertMessage(threshold: AlertThreshold, item: MockDataPoint): string {
  const messages = {
    'STOCK_CRITICAL': `Estoque crítico: apenas ${Math.round(item.current_value)} unidades restantes`,
    'STOCK_LOW': `Estoque baixo: ${Math.round(item.current_value)} unidades disponíveis`,
    'MARGIN_LOW': `Margem baixa: ${(item.current_value * 100).toFixed(1)}% atual vs. ${(item.threshold_value * 100).toFixed(1)}% esperado`,
    'SLOW_MOVING': `Produto parado: ${Math.round(item.current_value)} dias sem movimento`,
    'OVERSTOCK': `Excesso de estoque: ${Math.round(item.current_value)} unidades em estoque`,
    'SEASONAL_OPPORTUNITY': `Oportunidade sazonal: potencial de ${(item.current_value * 100).toFixed(1)}%`,
  };
  return messages[threshold.alert_type] || `Threshold violado para ${item.product_name}`;
}