'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Lightbulb, TrendingUp, Package, AlertTriangle } from 'lucide-react';

const InsightsDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Insights Banban</h1>
        <p className="text-muted-foreground">
          Insights acionáveis gerados automaticamente pelo sistema de IA
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">15</div>
            <p className="text-xs text-orange-600">
              Produtos precisam reposição
            </p>
            <Badge variant="outline" className="mt-2">
              Alto Impacto
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Baixa</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">8</div>
            <p className="text-xs text-blue-600">
              Produtos com margem menor que 20%
            </p>
            <Badge variant="outline" className="mt-2">
              Médio Impacto
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oportunidades</CardTitle>
            <Lightbulb className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">24</div>
            <p className="text-xs text-green-600">
              Insights acionáveis identificados
            </p>
            <Badge variant="outline" className="mt-2">
              Crescimento
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Insights Recentes</h2>
        
        <div className="space-y-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Produto slow-moving detectado</CardTitle>
                <Badge variant="destructive">Crítico</Badge>
              </div>
              <CardDescription>
                Tênis Adidas Superstar (SKU: AD001) sem vendas há 45 dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sugestão: Aplicar desconto de 20% ou promover em redes sociais
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Categoria em alta performance</CardTitle>
                <Badge variant="default">Oportunidade</Badge>
              </div>
              <CardDescription>
                Sneakers cresceram 35% nas últimas 2 semanas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sugestão: Aumentar estoque de sneakers femininos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Margem de lucro otimizável</CardTitle>
                <Badge variant="secondary">Moderado</Badge>
              </div>
              <CardDescription>
                15 produtos com margem abaixo da média do segmento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sugestão: Renegociar preços com fornecedores ou ajustar preços de venda
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InsightsDashboard; 