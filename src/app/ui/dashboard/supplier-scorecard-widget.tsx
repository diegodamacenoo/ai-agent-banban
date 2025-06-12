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
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Truck,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Package
} from 'lucide-react';

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

interface SupplierScorecardWidgetProps {
  supplierData?: SupplierMetric[];
  className?: string;
}

export function SupplierScorecardWidget({ supplierData = [], className }: SupplierScorecardWidgetProps) {
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('performance_score');

  // Filtrar e ordenar dados
  const filteredData = selectedSupplier === 'all'
    ? supplierData
    : supplierData.filter(s => s.supplier_id === selectedSupplier);

  const sortedData = [...filteredData].sort((a, b) => {
    switch (sortBy) {
      case 'performance_score':
        return b.performance_score - a.performance_score;
      case 'fill_rate_percentage':
        return b.fill_rate_percentage - a.fill_rate_percentage;
      case 'on_time_delivery_rate':
        return b.on_time_delivery_rate - a.on_time_delivery_rate;
      case 'quality_score':
        return b.quality_score - a.quality_score;
      default:
        return 0;
    }
  });

  // Funções auxiliares
  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getPerformanceIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-4 w-4" />;
    if (score >= 70) return <TrendingUp className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 90) return 'Excelente';
    if (score >= 80) return 'Bom';
    if (score >= 70) return 'Regular';
    return 'Precisa Melhorar';
  };

  const getSLAStatus = (avgLeadTime: number, slaLeadTime: number) => {
    const ratio = avgLeadTime / slaLeadTime;
    if (ratio <= 1.0) return { status: 'within', color: 'text-green-600', icon: <CheckCircle className="h-4 w-4" /> };
    if (ratio <= 1.2) return { status: 'close', color: 'text-yellow-600', icon: <Clock className="h-4 w-4" /> };
    return { status: 'exceeded', color: 'text-red-600', icon: <AlertTriangle className="h-4 w-4" /> };
  };

  // Estatísticas resumidas
  const avgPerformance = supplierData.length > 0
    ? supplierData.reduce((sum, s) => sum + s.performance_score, 0) / supplierData.length
    : 0;

  const avgFillRate = supplierData.length > 0
    ? supplierData.reduce((sum, s) => sum + s.fill_rate_percentage, 0) / supplierData.length
    : 0;

  const avgOnTimeDelivery = supplierData.length > 0
    ? supplierData.reduce((sum, s) => sum + s.on_time_delivery_rate, 0) / supplierData.length
    : 0;

  if (!supplierData || supplierData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <div>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="flex items-center text-yellow-600">
                Desempenho dos Fornecedores
              </CardTitle>
              <CardDescription>
                Performance e métricas operacionais dos fornecedores
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2">Dados de fornecedores não encontrados</p>
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
              Desempenho dos Fornecedores
            </CardTitle>
            <CardDescription>
              Performance e métricas operacionais dos fornecedores
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecionar fornecedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os fornecedores</SelectItem>
                {supplierData.map((supplier) => (
                  <SelectItem key={supplier.supplier_id} value={supplier.supplier_id}>
                    {supplier.trade_name || 'Fornecedor'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="performance_score">Performance Geral</SelectItem>
                <SelectItem value="fill_rate_percentage">Taxa de Preenchimento</SelectItem>
                <SelectItem value="on_time_delivery_rate">Entrega no Prazo</SelectItem>
                <SelectItem value="quality_score">Qualidade</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Métricas resumidas */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="text-xs font-semibold">Performance Média</span>
            </div>  
            <p className="text-2xl font-semibold mt-2">
              {avgPerformance.toFixed(1)}%
            </p>
          </div>

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
              <Clock className="h-4 w-4" />
              <span className="text-xs font-semibold">Entrega no Prazo</span>
            </div>
            <p className="text-2xl font-semibold mt-2">
              {avgOnTimeDelivery.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead className="text-center">SLA Lead Time</TableHead>
                <TableHead className="text-center">Fill Rate</TableHead>
                <TableHead className="text-center">Entrega no Prazo</TableHead>
                <TableHead className="text-center">Qualidade</TableHead>
                <TableHead className="text-center">Pedidos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((supplier) => {
                const slaStatus = getSLAStatus(supplier.avg_lead_time_days, supplier.sla_lead_time_days);

                return (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{supplier.trade_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {supplier.legal_name}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`${getPerformanceColor(supplier.performance_score)} flex items-center gap-1`}
                        >
                          {getPerformanceIcon(supplier.performance_score)}
                          {supplier.performance_score.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="mt-1">
                        <Progress
                          value={supplier.performance_score}
                          className="h-1 w-20"
                        />
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className={`flex items-center justify-center gap-1 ${slaStatus.color}`}>
                        {slaStatus.icon}
                        <span className="font-mono text-sm">
                          {supplier.avg_lead_time_days.toFixed(1)}d
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        SLA: {supplier.sla_lead_time_days}d
                      </p>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="font-mono font-semibold">
                        {supplier.fill_rate_percentage.toFixed(1)}%
                      </div>
                      <Progress
                        value={supplier.fill_rate_percentage}
                        className="h-1 w-16 mx-auto mt-1"
                      />
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="font-mono font-semibold">
                        {supplier.on_time_delivery_rate.toFixed(1)}%
                      </div>
                      <Progress
                        value={supplier.on_time_delivery_rate}
                        className="h-1 w-16 mx-auto mt-1"
                      />
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="font-semibold">
                        {supplier.quality_score.toFixed(1)}/10
                      </div>
                      <div className="flex justify-center mt-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full mr-1 ${i < supplier.quality_score / 2
                                ? 'bg-yellow-400'
                                : 'bg-gray-200'
                              }`}
                          />
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="text-center font-mono">
                      {supplier.total_orders}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {sortedData.length === 0 && selectedSupplier !== 'all' && (
          <div className="text-center py-6 text-muted-foreground">
            <Package className="mx-auto h-8 w-8 mb-2" />
            <p>Nenhum dado encontrado para o fornecedor selecionado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 