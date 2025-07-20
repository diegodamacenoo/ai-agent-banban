'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign,
  Grid3X3,
  Target
} from 'lucide-react';
import { MarginAnalysis } from '../mock-data';

interface MarginAnalysisSectionProps {
  data: MarginAnalysis;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function getTrendIcon(trend: 'up' | 'down' | 'stable') {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-3 w-3 text-green-600" />;
    case 'down':
      return <TrendingDown className="h-3 w-3 text-red-600" />;
    case 'stable':
      return <Minus className="h-3 w-3 text-gray-600" />;
  }
}

function getTrendColor(trend: 'up' | 'down' | 'stable') {
  switch (trend) {
    case 'up':
      return 'text-green-600';
    case 'down':
      return 'text-red-600';
    case 'stable':
      return 'text-gray-600';
  }
}

function getVarianceStatus(variance: number): 'success' | 'warning' | 'danger' {
  if (variance >= 0) return 'success';
  if (variance >= -2) return 'warning';
  return 'danger';
}

function getMarginColor(margin: number) {
  if (margin >= 50) return 'bg-green-500';
  if (margin >= 45) return 'bg-yellow-500';
  if (margin >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

function getMarginTextColor(margin: number) {
  if (margin >= 45) return 'text-green-700';
  if (margin >= 40) return 'text-yellow-700';
  return 'text-red-700';
}

export function MarginAnalysisSection({ data }: MarginAnalysisSectionProps) {
  const averageMargin = data.byCategory.reduce((sum, cat) => sum + cat.currentMargin, 0) / data.byCategory.length;
  const averageTarget = data.byCategory.reduce((sum, cat) => sum + cat.targetMargin, 0) / data.byCategory.length;
  
  return (
    <div className="space-y-6">
      {/* Resumo de Margens */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-blue-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Margem Média Atual</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {averageMargin.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Todas as categorias
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-green-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Meta Média</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {averageTarget.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Objetivo estratégico
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-purple-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Variação vs Meta</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {(averageMargin - averageTarget).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {averageMargin >= averageTarget ? 'Acima da meta' : 'Abaixo da meta'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Margens por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Margens por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.byCategory.map((category, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900">
                      {category.category}
                    </h4>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(category.trend)}
                      <span className={`text-xs font-medium ${getTrendColor(category.trend)}`}>
                        {category.trend === 'up' ? 'Em alta' : 
                         category.trend === 'down' ? 'Em baixa' : 'Estável'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Margem Atual</span>
                      <span className={`text-sm font-semibold ${getMarginTextColor(category.currentMargin)}`}>
                        {category.currentMargin.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={category.currentMargin} 
                      className="h-2"
                    />
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Meta: {category.targetMargin.toFixed(1)}%</span>
                      <span>
                        Variação: 
                        <span className={category.variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {category.variance >= 0 ? '+' : ''}{category.variance.toFixed(1)}%
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <Badge 
                    variant={getVarianceStatus(category.variance) === 'success' ? 'default' : 
                            getVarianceStatus(category.variance) === 'warning' ? 'secondary' : 'destructive'}
                  >
                    {getVarianceStatus(category.variance) === 'success' ? 'Meta Atingida' :
                     getVarianceStatus(category.variance) === 'warning' ? 'Próximo da Meta' : 'Abaixo da Meta'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Matriz Tamanho/Cor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Grid3X3 className="h-5 w-5 text-purple-600" />
            Matriz de Performance - Tamanho × Cor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data.sizeColorMatrix.map((sizeData, sizeIndex) => (
              <div key={sizeIndex} className="space-y-3">
                <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-2">
                  Tamanho {sizeData.size}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {sizeData.colors.map((colorData, colorIndex) => (
                    <Card key={colorIndex} className="border-l-4" style={{ borderLeftColor: getMarginColor(colorData.margin) }}>
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">
                              {colorData.color}
                            </span>
                            <span className={`text-sm font-bold ${getMarginTextColor(colorData.margin)}`}>
                              {colorData.margin.toFixed(1)}%
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex justify-between">
                              <span>Unidades:</span>
                              <span className="font-medium">{formatNumber(colorData.units)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Receita:</span>
                              <span className="font-medium">{formatCurrency(colorData.revenue)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-sm text-purple-800">
              <strong>Insight:</strong> Tamanhos 36 e 37 apresentam as melhores margens, 
              especialmente nas cores Nude e Preto. Considere aumentar o estoque dessas combinações.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}