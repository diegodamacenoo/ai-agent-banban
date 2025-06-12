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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, Clock, ShieldAlert, CheckCircle } from 'lucide-react';

interface CoverageData {
  variant_id: string;
  current_stock: number;
  avg_daily_sales: number;
  projected_days_coverage: number;
  projected_stockout_date?: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  core_product_variants: {
    sku: string;
    core_products: {
      product_name: string;
    };
  };
  core_locations: {
    location_name: string;
  };
}

interface CoverageWidgetProps {
  coverageData?: CoverageData[];
  className?: string;
}

export function CoverageWidget({ coverageData = [], className }: CoverageWidgetProps) {
  const [selectedRisk, setSelectedRisk] = useState<string>('all');

  // Filtrar dados por nível de risco
  const filteredData = selectedRisk === 'all'
    ? coverageData
    : coverageData.filter(item => item.risk_level === selectedRisk);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return <ShieldAlert className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getRiskLabel = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'Crítico';
      case 'high': return 'Alto';
      case 'medium': return 'Médio';
      case 'low': return 'Baixo';
      default: return 'Desconhecido';
    }
  };

  // Estatísticas resumidas
  const riskStats = coverageData.reduce((acc, item) => {
    acc[item.risk_level] = (acc[item.risk_level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!coverageData || coverageData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center text-yellow-600">
            <Clock className="mr-2 h-5 w-5" />
            Cobertura de Estoque
          </CardTitle>
          <CardDescription>
            Nenhum dado de cobertura disponível
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2">Dados de cobertura não encontrados</p>
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
              Cobertura de Estoque
            </CardTitle>
            <CardDescription>
              Produtos com risco de ruptura projetada
            </CardDescription>
          </div>
          <div className="flex gap-4">
            <Select value={selectedRisk} onValueChange={setSelectedRisk}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por risco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
                <SelectItem value="high">Alto</SelectItem>
                <SelectItem value="medium">Médio</SelectItem>
                <SelectItem value="low">Baixo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Resumo por nível de risco */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {['critical', 'high', 'medium', 'low'].map((level) => (
            <div key={level} className={`p-3 rounded-lg border ${getRiskColor(level)}`}>
              <div className="flex items-center gap-2">
                {getRiskIcon(level)}
                <span className="text-sm font-medium">{getRiskLabel(level)}</span>
              </div>
              <p className="text-lg font-bold mt-1">
                {riskStats[level] || 0}
              </p>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Local</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="text-right">Dias Restantes</TableHead>
                <TableHead className="text-right">Venda Diária</TableHead>
                <TableHead>Risco</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.slice(0, 10).map((item) => (
                <TableRow key={`${item.variant_id}-${item.core_locations?.location_name}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.core_product_variants?.sku}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.core_product_variants?.core_products?.product_name}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.core_locations?.location_name}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {item.current_stock}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {item.projected_days_coverage.toFixed(0)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {item.avg_daily_sales.toFixed(1)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${getRiskColor(item.risk_level)} flex items-center gap-1 w-fit`}
                    >
                      {getRiskIcon(item.risk_level)}
                      {getRiskLabel(item.risk_level)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="mx-auto h-8 w-8 mb-2" />
            <p>Nenhum produto encontrado para o filtro selecionado</p>
          </div>
        )}

        {filteredData.length > 10 && (
          <div className="text-center mt-4 text-sm text-muted-foreground">
            Mostrando 10 de {filteredData.length} produtos. Use os filtros para refinar.
          </div>
        )}
      </CardContent>
    </Card>
  );
} 