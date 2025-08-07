'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { TrendingUp, TrendingDown, Activity, Users, ShoppingBag } from 'lucide-react';

interface BanbanPerformanceImplementationProps {
  params: { slug: string };
  config: Record<string, any>;
  implementation: any;
}

interface PerformanceMetrics {
  totalSales: number;
  salesGrowth: number;
  activeUsers: number;
  conversionRate: number;
  avgOrderValue: number;
  topCategories: Array<{ name: string; sales: number; growth: number }>;
}

export default function BanbanPerformanceImplementation({ 
  params, 
  config, 
  implementation 
}: BanbanPerformanceImplementationProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de métricas específicas do Banban
    const mockMetrics: PerformanceMetrics = {
      totalSales: 89750.30,
      salesGrowth: 23.5,
      activeUsers: 1248,
      conversionRate: 3.2,
      avgOrderValue: 185.50,
      topCategories: [
        { name: 'Roupas Femininas', sales: 32500, growth: 18.2 },
        { name: 'Acessórios', sales: 21800, growth: 31.1 },
        { name: 'Calçados', sales: 19200, growth: -5.3 },
        { name: 'Bolsas', sales: 16250, growth: 42.7 }
      ]
    };

    setTimeout(() => {
      setMetrics(mockMetrics);
      setLoading(false);
    }, 1200);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Banban</h1>
          <p className="text-gray-600">
            Analytics customizado para fashion e varejo - {params.slug}
          </p>
        </div>
        <Badge variant="outline" className="bg-purple-50 text-purple-700">
          Banban Fashion Analytics
        </Badge>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Vendas Totais
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              R$ {metrics.totalSales.toLocaleString('pt-BR')}
            </div>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600">
                +{metrics.salesGrowth}% vs mês anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Usuários Ativos
              </CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {metrics.activeUsers.toLocaleString('pt-BR')}
            </div>
            <div className="flex items-center mt-1">
              <Activity className="h-3 w-3 text-blue-500 mr-1" />
              <span className="text-xs text-blue-600">
                Taxa conversão: {metrics.conversionRate}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Ticket Médio
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              R$ {metrics.avgOrderValue.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Por pedido finalizado
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Categorias */}
      <Card>
        <CardHeader>
          <CardTitle>Top Categorias - Fashion Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.topCategories.map((category, index) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-semibold">
                      R$ {category.sales.toLocaleString('pt-BR')}
                    </div>
                    <div className={`text-xs flex items-center ${
                      category.growth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {category.growth >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(category.growth)}%
                    </div>
                  </div>
                  <div className="w-24">
                    <Progress 
                      value={(category.sales / metrics.totalSales) * 100} 
                      className="h-2"
                    />
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