'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Calculator, Lightbulb, AlertTriangle, DollarSign, Percent, BarChart3 } from 'lucide-react'
import { PricingSimulation } from '@/app/query/profitability'

interface PricingOptimizationWidgetProps {
  data: PricingSimulation[]
}

export default function PricingOptimizationWidget({ data }: PricingOptimizationWidgetProps) {
  const [viewMode, setViewMode] = useState<'best' | 'all'>('best')
  
  // Análise das simulações
  const bestOpportunities = data
    .filter(item => item.projected_revenue_impact > 0)
    .sort((a, b) => b.projected_revenue_impact - a.projected_revenue_impact)
    .slice(0, 10)

  const worstPerformers = data
    .filter(item => item.projected_revenue_impact < 0)
    .sort((a, b) => a.projected_revenue_impact - b.projected_revenue_impact)
    .slice(0, 5)

  // Estatísticas gerais
  const totalRevenuePotential = data.reduce((sum, item) => sum + item.projected_revenue_impact, 0)
  const positiveSimulations = data.filter(item => item.projected_revenue_impact > 0)
  const avgMarginImprovement = data.reduce((sum, item) => sum + (item.projected_margin_percentage - item.current_margin_percentage), 0) / data.length

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getMarginImpactColor = (current: number, projected: number) => {
    const diff = projected - current
    if (diff > 5) return 'text-green-600'
    if (diff > 0) return 'text-green-500'
    if (diff > -5) return 'text-orange-500'
    return 'text-red-600'
  }

  const getRevenueImpactIcon = (impact: number) => {
    if (impact > 1000) return <TrendingUp className="w-4 h-4 text-green-600" />
    if (impact > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (impact > -1000) return <TrendingDown className="w-4 h-4 text-orange-500" />
    return <TrendingDown className="w-4 h-4 text-red-600" />
  }

  return (
    <div className="space-y-6">
      {/* Métricas resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Potencial de Receita</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenuePotential)}</p>
                <p className="text-xs text-muted-foreground">
                  {positiveSimulations.length} oportunidades identificadas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Percent className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Melhoria de Margem</p>
                <p className="text-2xl font-bold">
                  {avgMarginImprovement > 0 ? '+' : ''}{formatPercentage(avgMarginImprovement)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Média das simulações
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">
                  {formatPercentage((positiveSimulations.length / data.length) * 100)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.length} simulações analisadas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights principais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Insights de Otimização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Melhores oportunidades */}
            <div className="space-y-3">
              <h4 className="font-medium text-green-700 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Maiores Oportunidades
              </h4>
              {bestOpportunities.slice(0, 3).map((item, index) => (
                <div key={`${item.variant_id}-${item.location_id}`} className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">{item.size} - {item.color}</p>
                      <p className="text-xs text-muted-foreground">{item.location_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-700">
                        +{formatCurrency(item.projected_revenue_impact)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Margem: {formatPercentage(item.current_margin_percentage)} → {formatPercentage(item.projected_margin_percentage)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Riscos identificados */}
            <div className="space-y-3">
              <h4 className="font-medium text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Riscos Identificados
              </h4>
              {worstPerformers.slice(0, 3).map((item, index) => (
                <div key={`${item.variant_id}-${item.location_id}-risk`} className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">{item.size} - {item.color}</p>
                      <p className="text-xs text-muted-foreground">{item.location_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-700">
                        {formatCurrency(item.projected_revenue_impact)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Margem: {formatPercentage(item.current_margin_percentage)} → {formatPercentage(item.projected_margin_percentage)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controles de visualização */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Simulações de Preço
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'best' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('best')}
              >
                Melhores Oportunidades
              </Button>
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('all')}
              >
                Todas as Simulações
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead className="text-right">Preço Atual</TableHead>
                  <TableHead className="text-right">Preço Simulado</TableHead>
                  <TableHead className="text-right">Var. Margem</TableHead>
                  <TableHead className="text-right">Impacto Volume</TableHead>
                  <TableHead className="text-right">Impacto Receita</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(viewMode === 'best' ? bestOpportunities : data).slice(0, 15).map((item) => (
                  <TableRow key={`${item.variant_id}-${item.location_id}-table`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.size} - {item.color}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{item.location_name}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.current_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {item.simulated_price > item.current_price ? (
                          <TrendingUp className="w-3 h-3 text-green-600" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-600" />
                        )}
                        {formatCurrency(item.simulated_price)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={getMarginImpactColor(item.current_margin_percentage, item.projected_margin_percentage)}>
                        {formatPercentage(item.current_margin_percentage)} → {formatPercentage(item.projected_margin_percentage)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {item.projected_volume_impact > 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-600" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-600" />
                        )}
                        {formatPercentage(item.projected_volume_impact)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {getRevenueImpactIcon(item.projected_revenue_impact)}
                        <span className={item.projected_revenue_impact > 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(item.projected_revenue_impact)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={
                          item.projected_revenue_impact > 1000 ? 'default' :
                          item.projected_revenue_impact > 0 ? 'secondary' : 'destructive'
                        }
                      >
                        {item.projected_revenue_impact > 1000 ? 'Alta Prioridade' :
                         item.projected_revenue_impact > 0 ? 'Oportunidade' : 'Risco'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Mostrando {viewMode === 'best' ? Math.min(15, bestOpportunities.length) : Math.min(15, data.length)} de{' '}
              {viewMode === 'best' ? bestOpportunities.length : data.length} simulações.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notas das simulações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Metodologia das Simulações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <h5 className="font-medium text-foreground mb-2">Tipos de Análise:</h5>
              <ul className="space-y-1">
                <li>• Análise de competitividade</li>
                <li>• Teste de elasticidade de preço</li>
                <li>• Otimização de margem</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-foreground mb-2">Fatores Considerados:</h5>
              <ul className="space-y-1">
                <li>• Elasticidade histórica da demanda</li>
                <li>• Análise de preços da concorrência</li>
                <li>• Sazonalidade e tendências</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 