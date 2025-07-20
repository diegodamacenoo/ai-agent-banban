'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { 
  Shirt, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Calendar,
  Crown
} from 'lucide-react';
import { FashionMetrics } from '../mock-data';

interface FashionMetricsSectionProps {
  data: FashionMetrics;
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

function getPerformanceStatus(current: number, target: number) {
  const percentage = (current / target) * 100;
  if (percentage >= 95) return { status: 'success', label: 'Excelente' };
  if (percentage >= 85) return { status: 'warning', label: 'Bom' };
  return { status: 'danger', label: 'Abaixo da Meta' };
}

function getCollectionStatus(sellThrough: number): 'success' | 'warning' | 'danger' {
  if (sellThrough >= 70) return 'success';
  if (sellThrough >= 50) return 'warning';
  return 'danger';
}

export function FashionMetricsSection({ data }: FashionMetricsSectionProps) {
  const seasonalStatus = getPerformanceStatus(data.seasonal.performance, data.seasonal.target);
  
  return (
    <div className="space-y-6">
      {/* Performance Sazonal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Performance Sazonal - {data.seasonal.current}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Performance Atual</span>
                <Badge 
                  variant={seasonalStatus.status === 'success' ? 'default' : 
                          seasonalStatus.status === 'warning' ? 'secondary' : 'destructive'}
                >
                  {seasonalStatus.label}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {data.seasonal.performance.toFixed(1)}%
              </div>
              <Progress 
                value={data.seasonal.performance} 
                className="h-2"
              />
              <div className="text-xs text-gray-500">
                Meta: {data.seasonal.target}%
              </div>
            </div>
            
            <div className="space-y-2">
              <span className="text-sm text-gray-600">vs Ano Anterior</span>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-gray-900">
                  {data.seasonal.previousYear.toFixed(1)}%
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    +{(data.seasonal.performance - data.seasonal.previousYear).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Crescimento sazonal
              </div>
            </div>
            
            <div className="space-y-2">
              <span className="text-sm text-gray-600">Status da Meta</span>
              <div className="text-2xl font-bold text-gray-900">
                {((data.seasonal.performance / data.seasonal.target) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">
                {data.seasonal.performance >= data.seasonal.target ? 'Meta atingida' : 
                 `Faltam ${(data.seasonal.target - data.seasonal.performance).toFixed(1)}% para a meta`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shirt className="h-5 w-5 text-purple-600" />
            Performance por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.categories.map((category, index) => (
              <Card key={index} className="border-l-4 border-purple-400">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">
                        {category.name}
                      </h4>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Receita</span>
                        <span className="text-sm font-semibold">
                          {formatCurrency(category.revenue)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Margem</span>
                        <span className="text-sm font-semibold text-green-600">
                          {category.margin.toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Unidades</span>
                        <span className="text-sm font-semibold">
                          {formatNumber(category.units)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Crescimento</span>
                        <div className="flex items-center gap-1">
                          {category.growth >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )}
                          <span className={`text-sm font-semibold ${
                            category.growth >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {category.growth >= 0 ? '+' : ''}{category.growth.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance das Coleções */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            Performance das Coleções
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.collections.map((collection, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900">
                      {collection.name}
                    </h4>
                    <Badge 
                      variant={collection.status === 'success' ? 'default' : 
                              collection.status === 'warning' ? 'secondary' : 'destructive'}
                    >
                      {getCollectionStatus(collection.sellThrough) === 'success' ? 'Excelente' :
                       getCollectionStatus(collection.sellThrough) === 'warning' ? 'Bom' : 'Atenção'}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    Lançamento: {new Date(collection.launchDate).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(collection.revenue)}
                    </div>
                    <div className="text-xs text-gray-600">Receita</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-semibold text-green-600">
                      {collection.roi.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">ROI</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-semibold text-blue-600">
                      {collection.sellThrough.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">Sell Through</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}