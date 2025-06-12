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
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { Package, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface SupplierMetric {
  id: string;
  supplier_id: string;
  analysis_period_start: string;
  analysis_period_end: string;
  total_orders: number;
  avg_lead_time_days: number;
  sla_lead_time_days: number;
  lead_time_variance: number;
  fill_rate_percentage: number;
  divergence_rate_percentage: number;
  on_time_delivery_rate: number;
  quality_score: number;
  performance_score: number;
  trade_name?: string;
  legal_name?: string;
}

interface FillRateMetricsWidgetProps {
  supplierData?: SupplierMetric[];
  className?: string;
}

export function FillRateMetricsWidget({ supplierData = [], className }: FillRateMetricsWidgetProps) {
  const [viewType, setViewType] = useState<'overview' | 'comparison' | 'distribution'>('overview');

  // Preparar dados
  const fillRateData = supplierData.map((supplier, index) => ({
    name: supplier.trade_name?.substring(0, 12) || `Fornecedor ${index + 1}`,
    fullName: supplier.trade_name || 'Fornecedor',
    fillRate: parseFloat(supplier.fill_rate_percentage.toString()),
    divergenceRate: parseFloat(supplier.divergence_rate_percentage.toString()),
    orders: supplier.total_orders,
    performanceScore: parseFloat(supplier.performance_score.toString()),
  }));

  // Distribuição de fill rate
  const getDistributionData = () => {
    const ranges = [
      { name: '95-100%', min: 95, max: 100, color: '#10b981' },
      { name: '90-94%', min: 90, max: 95, color: '#3b82f6' },
      { name: '85-89%', min: 85, max: 90, color: '#f59e0b' },
      { name: '<85%', min: 0, max: 85, color: '#ef4444' },
    ];

    return ranges.map(range => ({
      name: range.name,
      count: supplierData.filter(s => 
        parseFloat(s.fill_rate_percentage.toString()) >= range.min && 
        parseFloat(s.fill_rate_percentage.toString()) < range.max
      ).length,
      color: range.color,
    }));
  };

  // Estatísticas resumidas
  const avgFillRate = supplierData.length > 0 
    ? supplierData.reduce((sum, s) => sum + parseFloat(s.fill_rate_percentage.toString()), 0) / supplierData.length 
    : 0;

  const avgDivergenceRate = supplierData.length > 0 
    ? supplierData.reduce((sum, s) => sum + parseFloat(s.divergence_rate_percentage.toString()), 0) / supplierData.length 
    : 0;

  const excellentSuppliers = supplierData.filter(s => 
    parseFloat(s.fill_rate_percentage.toString()) >= 95
  ).length;

  const totalOrders = supplierData.reduce((sum, s) => sum + s.total_orders, 0);

  // Cores para gráficos
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}${entry.dataKey.includes('Rate') ? '%' : ''}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Dados para gráfico radial
  const radialData = fillRateData.slice(0, 4).map((supplier, index) => ({
    name: supplier.name,
    fillRate: supplier.fillRate,
    fill: COLORS[index % COLORS.length],
  }));

  if (!supplierData || supplierData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center text-yellow-600">
            <Package className="mr-2 h-5 w-5" />
            Métricas de Fill Rate
          </CardTitle>
          <CardDescription>
            Nenhum dado de fill rate disponível
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2">Dados de fill rate não encontrados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="flex items-center text-lg font-semibold">
              Métricas de Fill Rate
            </CardTitle>
            <CardDescription>
              Taxa de preenchimento e divergências por fornecedor
            </CardDescription>
          </div>
          
          <Select value={viewType} onValueChange={(value: any) => setViewType(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Visão Geral</SelectItem>
              <SelectItem value="comparison">Comparação</SelectItem>
              <SelectItem value="distribution">Distribuição</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Métricas resumidas */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="text-xs font-semibold">Fill Rate Médio</span>
            </div>
            <p className="text-2xl font-semibold mt-2">
              {avgFillRate.toFixed(1)}%
            </p>
          </div>
          
          <div className="p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs font-semibold">Divergência Média</span>
            </div>
            <p className="text-2xl font-semibold mt-2">
              {avgDivergenceRate.toFixed(1)}%
            </p>
          </div>
          
          <div className="p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs font-semibold">Fornec. Excelentes</span>
            </div>
            <p className="text-2xl font-semibold mt-2">
              {excellentSuppliers}/{supplierData.length}
            </p>
          </div>
          
          <div className="p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-semibold">Total Pedidos</span>
            </div>
            <p className="text-2xl font-semibold mt-2">
              {totalOrders}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {viewType === 'overview' && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-4">Fill Rate por Fornecedor</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={radialData}>
                    <RadialBar 
                      dataKey="fillRate" 
                      cornerRadius={10} 
                      fill="#10b981"
                    />
                    <Legend 
                      iconSize={8}
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-4">Performance Individual</h4>
              <div className="space-y-3">
                {fillRateData.slice(0, 6).map((supplier, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{supplier.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={supplier.fillRate} className="h-2 flex-1" />
                        <span className="text-sm font-mono font-semibold min-w-12">
                          {supplier.fillRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <Badge 
                        variant={supplier.fillRate >= 95 ? 'default' : supplier.fillRate >= 90 ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {supplier.orders} pedidos
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {viewType === 'comparison' && (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fillRateData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                <Bar 
                  dataKey="fillRate" 
                  fill="#10b981" 
                  name="Fill Rate (%)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="divergenceRate" 
                  fill="#ef4444" 
                  name="Taxa de Divergência (%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {viewType === 'distribution' && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-4">Distribuição por Faixa</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getDistributionData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, count }) => `${name}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {getDistributionData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-4">Análise Detalhada</h4>
              <div className="space-y-4">
                {getDistributionData().map((range, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: range.color }}
                      />
                      <div>
                        <p className="font-medium">{range.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {range.count} fornecedores
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {supplierData.length > 0 ? Math.round((range.count / supplierData.length) * 100) : 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        do total
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="mt-6 flex gap-2 flex-wrap">
          {avgFillRate >= 95 && (
            <Badge variant="default" className="bg-green-100 text-green-800 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Excelente fill rate médio
            </Badge>
          )}
          
          {avgDivergenceRate > 10 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Alta taxa de divergência
            </Badge>
          )}
          
          {excellentSuppliers === supplierData.length && (
            <Badge variant="default" className="bg-blue-100 text-blue-800 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Todos os fornecedores excelentes
            </Badge>
          )}
          
          {excellentSuppliers < supplierData.length / 2 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Oportunidade de melhoria
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 