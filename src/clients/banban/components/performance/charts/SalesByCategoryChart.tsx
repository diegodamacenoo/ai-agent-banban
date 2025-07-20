'use client';

import { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { CategoryPerformanceData } from '../types';

interface CategoryData extends CategoryPerformanceData {
  color: string;
  trend: 'up' | 'down' | 'stable';
}

interface SalesByCategoryChartProps {
  data: CategoryData[];
  onCategoryClick?: (category: string) => void;
  onViewDetails?: () => void;
  isLoading?: boolean;
  period?: string;
}

// Mock data baseado no plano
const mockCategoryData: CategoryData[] = [
  {
    rank: 1,
    category: 'Calçados Femininos',
    revenue: 1245600,
    market_share: 35.2,
    growth_percentage: 18.5,
    margin: 45.2,
    velocity: 156,
    color: '#E91E63',
    trend: 'up'
  },
  {
    rank: 2,
    category: 'Bolsas e Carteiras',
    revenue: 876400,
    market_share: 24.8,
    growth_percentage: 23.1,
    margin: 52.8,
    velocity: 134,
    color: '#9C27B0',
    trend: 'up'
  },
  {
    rank: 3,
    category: 'Calçados Masculinos',
    revenue: 654300,
    market_share: 18.5,
    growth_percentage: 8.9,
    margin: 38.7,
    velocity: 98,
    color: '#3F51B5',
    trend: 'up'
  },
  {
    rank: 4,
    category: 'Acessórios',
    revenue: 342800,
    market_share: 9.7,
    growth_percentage: 31.2,
    margin: 48.3,
    velocity: 189,
    color: '#FF9800',
    trend: 'up'
  },
  {
    rank: 5,
    category: 'Infantil',
    revenue: 284700,
    market_share: 8.1,
    growth_percentage: -5.2,
    margin: 42.1,
    velocity: 67,
    color: '#4CAF50',
    trend: 'down'
  },
  {
    rank: 6,
    category: 'Esportivos',
    revenue: 132500,
    market_share: 3.7,
    growth_percentage: 12.8,
    margin: 35.9,
    velocity: 45,
    color: '#00BCD4',
    trend: 'up'
  }
];

function CategoryBar({ 
  category, 
  value, 
  maxValue, 
  percentage, 
  color, 
  onClick,
  growth,
  trend,
  margin,
  velocity
}: {
  category: string;
  value: number;
  maxValue: number;
  percentage: number;
  color: string;
  onClick?: () => void;
  growth: number;
  trend: 'up' | 'down' | 'stable';
  margin: number;
  velocity: number;
}) {
  const barWidth = (value / maxValue) * 100;
  
  return (
    <div 
      className="group p-4 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer border border-transparent hover:border-gray-200"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: color }}
          />
          <span className="font-medium text-gray-900 group-hover:text-gray-700">
            {category}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {percentage.toFixed(1)}%
          </Badge>
          <div className={`flex items-center gap-1 text-xs ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : 
             trend === 'down' ? <ArrowDownRight className="h-3 w-3" /> : null}
            {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
          </div>
        </div>
      </div>
      
      {/* Barra de Progresso */}
      <div className="mb-2">
        <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${barWidth}%`, 
              backgroundColor: color,
              opacity: 0.8
            }}
          />
          {/* Animação de brilho */}
          <div 
            className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 transform -skew-x-12 group-hover:animate-pulse"
            style={{ 
              transform: `translateX(${barWidth}%)`,
              transition: 'transform 0.5s ease-out'
            }}
          />
        </div>
      </div>
      
      {/* Métricas Detalhadas */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <div className="flex gap-4">
          <span>R$ {(value / 1000).toFixed(0)}k</span>
          <span>Margem: {margin.toFixed(1)}%</span>
          <span>Velocidade: {velocity}/dia</span>
        </div>
        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function SalesByCategoryChart({ 
  data = mockCategoryData, 
  onCategoryClick,
  onViewDetails,
  isLoading = false,
  period = "Últimos 30 dias"
}: SalesByCategoryChartProps) {
  const [sortBy, setSortBy] = useState<'revenue' | 'growth' | 'margin'>('revenue');
  const [showAll, setShowAll] = useState(false);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex justify-between mb-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="flex justify-between mt-2">
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Ordenação dos dados
  const sortedData = [...data].sort((a, b) => {
    switch (sortBy) {
      case 'revenue':
        return b.revenue - a.revenue;
      case 'growth':
        return b.growth_percentage - a.growth_percentage;
      case 'margin':
        return b.margin - a.margin;
      default:
        return b.revenue - a.revenue;
    }
  });

  const displayData = showAll ? sortedData : sortedData.slice(0, 6);
  const maxValue = Math.max(...sortedData.map(d => d.revenue));
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Vendas por Categoria
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Distribuição de vendas e performance por categoria de produto • {period}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <span className="font-medium">Total:</span>
                <span>R$ {(totalRevenue / 1000000).toFixed(2)}M</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>+15.8% vs período anterior</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Ordenar por: {
                    sortBy === 'revenue' ? 'Receita' :
                    sortBy === 'growth' ? 'Crescimento' : 'Margem'
                  }
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortBy('revenue')}>
                  Receita
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('growth')}>
                  Crescimento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('margin')}>
                  Margem
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={onViewDetails}>
                  Ver detalhes completos
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Exportar dados
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Configurar alertas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-1">
          {displayData.map((item, index) => (
            <CategoryBar
              key={item.category}
              category={item.category}
              value={item.revenue}
              maxValue={maxValue}
              percentage={item.market_share}
              color={item.color}
              growth={item.growth_percentage}
              trend={item.trend}
              margin={item.margin}
              velocity={item.velocity}
              onClick={() => onCategoryClick?.(item.category)}
            />
          ))}
        </div>
        
        {/* Mostrar Mais/Menos */}
        {data.length > 6 && (
          <div className="mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAll(!showAll)}
              className="w-full"
            >
              {showAll ? 'Mostrar Menos' : `Mostrar Mais (+${data.length - 6} categorias)`}
            </Button>
          </div>
        )}

        {/* Summary Footer */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-600">Top Performer</div>
              <div className="font-semibold text-gray-900">
                {sortedData[0]?.category}
              </div>
              <div className="text-xs text-green-600">
                +{sortedData[0]?.growth_percentage.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Maior Margem</div>
              <div className="font-semibold text-gray-900">
                {[...sortedData].sort((a, b) => b.margin - a.margin)[0]?.category}
              </div>
              <div className="text-xs text-blue-600">
                {[...sortedData].sort((a, b) => b.margin - a.margin)[0]?.margin.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Maior Velocidade</div>
              <div className="font-semibold text-gray-900">
                {[...sortedData].sort((a, b) => b.velocity - a.velocity)[0]?.category}
              </div>
              <div className="text-xs text-purple-600">
                {[...sortedData].sort((a, b) => b.velocity - a.velocity)[0]?.velocity}/dia
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}