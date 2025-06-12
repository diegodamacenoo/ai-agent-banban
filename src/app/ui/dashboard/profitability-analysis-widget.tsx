'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, BarChart3, Filter, DollarSign, Package, Target } from 'lucide-react'
import { ProfitabilityData } from '@/app/query/profitability'

interface ProfitabilityAnalysisWidgetProps {
  data: ProfitabilityData[]
}

export default function ProfitabilityAnalysisWidget({ data }: ProfitabilityAnalysisWidgetProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [abcFilter, setAbcFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('revenue_contribution')
  
  // Filtrar dados
  const filteredData = data.filter(item => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
    if (abcFilter !== 'all' && item.abc_category !== abcFilter) return false
    if (locationFilter !== 'all' && item.location_name !== locationFilter) return false
    return true
  })

  // Ordenar dados
  const sortedData = [...filteredData].sort((a, b) => {
    switch (sortBy) {
      case 'revenue_contribution':
        return b.revenue_contribution - a.revenue_contribution
      case 'turnover_rate':
        return b.turnover_rate - a.turnover_rate
      case 'priority_score':
        return b.priority_score - a.priority_score
      case 'product_name':
        return a.product_name.localeCompare(b.product_name)
      default:
        return b.revenue_contribution - a.revenue_contribution
    }
  })

  // Estatísticas agregadas
  const totalRevenue = filteredData.reduce((sum, item) => sum + item.revenue_contribution, 0)
  const avgTurnover = filteredData.reduce((sum, item) => sum + item.turnover_rate, 0) / filteredData.length || 0
  const avgPriorityScore = filteredData.reduce((sum, item) => sum + item.priority_score, 0) / filteredData.length || 0
  
  const categoryBreakdown = data.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { revenue: 0, count: 0 }
    }
    acc[item.category].revenue += item.revenue_contribution
    acc[item.category].count += 1
    return acc
  }, {} as Record<string, { revenue: number; count: number }>)

  const abcBreakdown = data.reduce((acc, item) => {
    if (!acc[item.abc_category]) {
      acc[item.abc_category] = { revenue: 0, count: 0 }
    }
    acc[item.abc_category].revenue += item.revenue_contribution
    acc[item.abc_category].count += 1
    return acc
  }, {} as Record<string, { revenue: number; count: number }>)

  const uniqueCategories = [...new Set(data.map(item => item.category))]
  const uniqueLocations = [...new Set(data.map(item => item.location_name))]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
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
                <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">
                  {filteredData.length} produtos selecionados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Giro Médio</p>
                <p className="text-2xl font-bold">{avgTurnover.toFixed(1)}x</p>
                <p className="text-xs text-muted-foreground">
                  Por ano
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Score Prioridade</p>
                <p className="text-2xl font-bold">{avgPriorityScore.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">
                  Média ponderada
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown por categoria e ABC */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Análise por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(categoryBreakdown).map(([category, stats]) => (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">{category}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(stats.revenue)}
                    </span>
                  </div>
                  <Progress 
                    value={(stats.revenue / totalRevenue) * 100} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{stats.count} produtos</span>
                    <span>{formatPercentage((stats.revenue / totalRevenue) * 100)} da receita</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Classificação ABC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(abcBreakdown).map(([category, stats]) => (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={category === 'A' ? 'default' : category === 'B' ? 'secondary' : 'outline'}
                      >
                        Classe {category}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(stats.revenue)}
                    </span>
                  </div>
                  <Progress 
                    value={(stats.revenue / totalRevenue) * 100} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{stats.count} produtos</span>
                    <span>{formatPercentage((stats.revenue / totalRevenue) * 100)} da receita</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros e Detalhamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {uniqueCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={abcFilter} onValueChange={setAbcFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Classe ABC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as classes</SelectItem>
                <SelectItem value="A">Classe A</SelectItem>
                <SelectItem value="B">Classe B</SelectItem>
                <SelectItem value="C">Classe C</SelectItem>
              </SelectContent>
            </Select>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Localização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as localizações</SelectItem>
                {uniqueLocations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue_contribution">Receita</SelectItem>
                <SelectItem value="turnover_rate">Giro</SelectItem>
                <SelectItem value="priority_score">Prioridade</SelectItem>
                <SelectItem value="product_name">Nome</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela detalhada */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Giro</TableHead>
                  <TableHead className="text-right">Estoque (dias)</TableHead>
                  <TableHead className="text-center">Classe ABC</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.slice(0, 10).map((item) => (
                  <TableRow key={`${item.variant_id}-${item.location_id}`}>
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
                      {formatCurrency(item.revenue_contribution)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {item.turnover_rate >= 8 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        {item.turnover_rate.toFixed(1)}x
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.days_of_inventory.toFixed(0)} dias
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={
                          item.abc_category === 'A' ? 'default' : 
                          item.abc_category === 'B' ? 'secondary' : 'outline'
                        }
                      >
                        {item.abc_category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Progress 
                          value={item.priority_score} 
                          className="w-16 h-2"
                        />
                        <span className="text-sm font-medium">
                          {item.priority_score.toFixed(0)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {sortedData.length > 10 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Mostrando 10 de {sortedData.length} produtos. 
                Use os filtros para refinar a busca.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
