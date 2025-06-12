'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrendingUp, Package, DollarSign } from 'lucide-react';

interface ABCData {
  abc_category: 'A' | 'B' | 'C';
  revenue_contribution: number;
  stock_value: number;
  core_product_variants: {
    sku: string;
    core_products: {
      product_name: string;
    };
  };
}

interface ABCAnalysisWidgetProps {
  abcData?: ABCData[];
  className?: string;
}

const ABC_COLORS = {
  A: '#22c55e', // Green
  B: '#eab308', // Yellow  
  C: '#ef4444'  // Red
};

const ABC_DESCRIPTIONS = {
  A: 'Alto valor, gestão prioritária',
  B: 'Valor médio, gestão regular',
  C: 'Baixo valor, gestão simplificada'
};

export function ABCAnalysisWidget({ abcData = [], className }: ABCAnalysisWidgetProps) {
  // Agrupar dados por categoria ABC
  const groupedData = abcData.reduce((acc, item) => {
    const category = item.abc_category;
    if (!acc[category]) {
      acc[category] = {
        category,
        count: 0,
        total_revenue: 0,
        total_stock_value: 0,
        products: []
      };
    }
    
    acc[category].count++;
    acc[category].total_revenue += item.revenue_contribution;
    acc[category].total_stock_value += item.stock_value;
    acc[category].products.push({
      sku: item.core_product_variants.sku,
      product_name: item.core_product_variants.core_products.product_name,
      revenue: item.revenue_contribution
    });
    
    return acc;
  }, {} as Record<string, any>);

  // Dados para o gráfico de pizza (quantidade de produtos)
  const pieData = Object.values(groupedData).map((group: any) => ({
    name: `Categoria ${group.category}`,
    value: group.count,
    category: group.category
  }));

  // Dados para o gráfico de barras (receita)
  const barData = Object.values(groupedData).map((group: any) => ({
    category: `Categoria ${group.category}`,
    revenue: group.total_revenue,
    stock_value: group.total_stock_value
  }));

  // Cálculo de percentuais
  const totalRevenue = Object.values(groupedData).reduce((sum: number, group: any) => sum + group.total_revenue, 0);
  const totalProducts = abcData.length;

  if (!abcData || abcData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 mb-4">
            <CardTitle className="flex items-center text-yellow-600">
              Análise ABC
            </CardTitle>
            <CardDescription>
              Nenhum dado de análise ABC disponível
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2">Dados de análise ABC não encontrados</p>
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
              Análise ABC - Mix de Produtos
            </CardTitle>
            <CardDescription>
              Classificação de produtos por valor de contribuição
            </CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center">
            <Package className="mr-1 h-3 w-3" />
            {totalProducts} produtos
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Resumo por categoria */}
        <div className="grid grid-cols-3 gap-4">
          {['A', 'B', 'C'].map((category) => {
            const group = groupedData[category];
            const revenuePercent = group ? (group.total_revenue / totalRevenue * 100) : 0;
            const productPercent = group ? (group.count / totalProducts * 100) : 0;
            
            return (
              <div 
                key={category} 
                className="p-4 rounded-lg border"
                style={{ borderColor: ABC_COLORS[category as keyof typeof ABC_COLORS] }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: ABC_COLORS[category as keyof typeof ABC_COLORS] }}
                  />
                  <span className="font-semibold">Categoria {category}</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Produtos: </span>
                    <span className="font-medium">{group?.count || 0} ({productPercent.toFixed(1)}%)</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Receita: </span>
                    <span className="font-medium">
                      R$ {group ? (group.total_revenue / 1000).toFixed(0) : 0}k ({revenuePercent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ABC_DESCRIPTIONS[category as keyof typeof ABC_DESCRIPTIONS]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Pizza - Distribuição por Quantidade */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Distribuição por Quantidade de Produtos</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={ABC_COLORS[entry.category as keyof typeof ABC_COLORS]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} produtos`, 'Quantidade']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de Barras - Participação na Receita */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Participação na Receita (R$ mil)</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="category" 
                    className="text-muted-foreground"
                    fontSize={12}
                  />
                  <YAxis 
                    className="text-muted-foreground"
                    fontSize={12}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [
                      `R$ ${(value / 1000).toFixed(1)}k`, 
                      'Receita'
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Principais produtos da categoria A */}
        {groupedData.A && groupedData.A.products.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center">
              <DollarSign className="mr-1 h-4 w-4" />
              Top Produtos - Categoria A
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {groupedData.A.products
                .sort((a: any, b: any) => b.revenue - a.revenue)
                .slice(0, 6)
                .map((product: any, index: number) => (
                  <div key={index} className="p-3 border rounded-lg bg-green-50/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{product.sku}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {product.product_name}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        R$ {(product.revenue / 1000).toFixed(1)}k
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">💡 Insights da Análise ABC</h4>
          <div className="text-sm text-blue-800 space-y-1">
            {groupedData.A && (
              <p>• Categoria A: {groupedData.A.count} produtos geram {((groupedData.A.total_revenue / totalRevenue) * 100).toFixed(1)}% da receita</p>
            )}
            {groupedData.C && (
              <p>• Categoria C: {groupedData.C.count} produtos representam apenas {((groupedData.C.total_revenue / totalRevenue) * 100).toFixed(1)}% da receita</p>
            )}
            <p>• Foque na gestão rigorosa dos produtos da categoria A para maximizar resultados</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 