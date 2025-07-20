'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { 
  Crown, 
  TrendingUp, 
  TrendingDown,
  Building2,
  PieChart
} from 'lucide-react';
import { BrandPerformance } from '../mock-data';

interface BrandPerformanceSectionProps {
  data: BrandPerformance;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getGrowthStatus(growth: number): 'success' | 'warning' | 'danger' {
  if (growth >= 15) return 'success';
  if (growth >= 5) return 'warning';
  return 'danger';
}

function getMarketShareColor(index: number) {
  const colors = [
    'bg-blue-500',
    'bg-purple-500', 
    'bg-pink-500',
    'bg-orange-500',
    'bg-gray-400'
  ];
  return colors[index] || 'bg-gray-400';
}

export function BrandPerformanceSection({ data }: BrandPerformanceSectionProps) {
  const totalMarketShare = data.marketShare.reduce((sum, brand) => sum + brand.percentage, 0);
  
  return (
    <div className="space-y-6">
      {/* Ranking de Marcas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            Ranking de Marcas - Top 5
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.ranking.map((brand, index) => (
              <div 
                key={brand.position}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* Posição */}
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    brand.position === 1 ? 'bg-yellow-500' :
                    brand.position === 2 ? 'bg-gray-400' :
                    brand.position === 3 ? 'bg-orange-600' :
                    'bg-gray-300 text-gray-700'
                  }`}>
                    {brand.position}
                  </div>
                </div>
                
                {/* Informações da Marca */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-semibold text-gray-900">
                      {brand.brand}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {brand.category}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    Market Share: {brand.marketShare.toFixed(1)}%
                  </div>
                </div>
                
                {/* Métricas */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(brand.revenue)}
                    </div>
                    <div className="text-xs text-gray-600">Receita</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-semibold text-green-600">
                      {brand.margin.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">Margem</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      {brand.growth >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span className={`text-sm font-semibold ${
                        brand.growth >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {brand.growth >= 0 ? '+' : ''}{brand.growth.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">Crescimento</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Share Visual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Market Share */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              Participação no Mercado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Visualização simplificada do gráfico de pizza */}
              <div className="space-y-3">
                {data.marketShare.map((brand, index) => (
                  <div key={brand.brand} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getMarketShareColor(index)}`}></div>
                        <span className="text-sm font-medium text-gray-900">
                          {brand.brand}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {brand.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={brand.percentage} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Análise de Crescimento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Análise de Crescimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.ranking.map((brand) => (
                <div key={brand.brand} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">
                      {brand.brand}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={getGrowthStatus(brand.growth) === 'success' ? 'default' : 
                              getGrowthStatus(brand.growth) === 'warning' ? 'secondary' : 'destructive'}
                    >
                      {getGrowthStatus(brand.growth) === 'success' ? 'Alto Crescimento' :
                       getGrowthStatus(brand.growth) === 'warning' ? 'Crescimento Moderado' : 'Baixo Crescimento'}
                    </Badge>
                    
                    <div className="flex items-center gap-1">
                      {brand.growth >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span className={`text-sm font-semibold ${
                        brand.growth >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {brand.growth >= 0 ? '+' : ''}{brand.growth.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-800">
                <strong>Insight:</strong> Nike e Melissa lideram o crescimento com +15% e +24% respectivamente, 
                indicando forte performance no segmento fashion.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}