'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, BarChart3, Activity, DollarSign, Percent } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { MarginTrend } from '@/app/query/profitability'

interface MarginTrendsWidgetProps {
  data: MarginTrend[]
}

export default function MarginTrendsWidget({ data }: MarginTrendsWidgetProps) {
  // Preparar dados para gráficos
  const chartData = data.map(item => ({
    ...item,
    month: new Date(item.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    monthFull: new Date(item.date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }))

  // Cálculos de tendência
  const currentMonth = data[data.length - 1]
  const previousMonth = data[data.length - 2]
  const marginTrend = currentMonth && previousMonth ? 
    currentMonth.avg_margin - previousMonth.avg_margin : 0

  const revenueGrowth = currentMonth && previousMonth ?
    ((currentMonth.total_revenue - previousMonth.total_revenue) / previousMonth.total_revenue) * 100 : 0

  // Análise por categoria
  const categoryAnalysis = currentMonth?.category_breakdown || []
  const bestCategory = categoryAnalysis.reduce((best, current) => 
    current.avg_margin > best.avg_margin ? current : best, categoryAnalysis[0])
  
  const worstCategory = categoryAnalysis.reduce((worst, current) => 
    current.avg_margin < worst.avg_margin ? current : worst, categoryAnalysis[0])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600" />
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600" />
    return <Activity className="w-4 h-4 text-gray-600" />
  }

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600'
    if (trend < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Percent className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Margem Atual</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{formatPercentage(currentMonth?.avg_margin || 0)}</p>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(marginTrend)}
                    <span className={`text-sm ${getTrendColor(marginTrend)}`}>
                      {marginTrend > 0 ? '+' : ''}{formatPercentage(marginTrend)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">vs. mês anterior</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita Atual</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{formatCurrency(currentMonth?.total_revenue || 0)}</p>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(revenueGrowth)}
                    <span className={`text-sm ${getTrendColor(revenueGrowth)}`}>
                      {revenueGrowth > 0 ? '+' : ''}{formatPercentage(revenueGrowth)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">vs. mês anterior</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produtos Ativos</p>
                <p className="text-2xl font-bold">{currentMonth?.product_count || 0}</p>
                <p className="text-xs text-muted-foreground">
                  Total no portfólio
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise por categoria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Performance por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Melhor categoria */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-green-700">Melhor Performance</h4>
                <Badge variant="default">{bestCategory?.category}</Badge>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Margem Média</span>
                    <span className="text-lg font-bold text-green-700">
                      {formatPercentage(bestCategory?.avg_margin || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Participação na Receita</span>
                    <span className="text-sm font-medium text-green-700">
                      {formatPercentage(bestCategory?.revenue_share || 0)}
                    </span>
                  </div>
                  <Progress 
                    value={bestCategory?.revenue_share || 0} 
                    className="h-2"
                  />
                </div>
              </div>
            </div>

            {/* Pior categoria */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-red-700">Oportunidade de Melhoria</h4>
                <Badge variant="outline">{worstCategory?.category}</Badge>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Margem Média</span>
                    <span className="text-lg font-bold text-red-700">
                      {formatPercentage(worstCategory?.avg_margin || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Participação na Receita</span>
                    <span className="text-sm font-medium text-red-700">
                      {formatPercentage(worstCategory?.revenue_share || 0)}
                    </span>
                  </div>
                  <Progress 
                    value={worstCategory?.revenue_share || 0} 
                    className="h-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Detalhamento por categoria */}
          <div className="mt-6">
            <h4 className="font-medium mb-4">Todas as Categorias</h4>
            <div className="space-y-3">
              {categoryAnalysis.map((category) => (
                <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium capitalize">{category.category}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatPercentage(category.avg_margin)}</div>
                      <div className="text-xs text-muted-foreground">margem</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatPercentage(category.revenue_share)}</div>
                      <div className="text-xs text-muted-foreground">receita</div>
                    </div>
                    <div className="w-20">
                      <Progress value={category.revenue_share} className="h-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de tendência de margem */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Evolução da Margem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                />
                <Tooltip 
                  formatter={(value: any) => [`${value.toFixed(1)}%`, 'Margem Média']}
                  labelFormatter={(label) => {
                    const item = chartData.find(d => d.month === label)
                    return item?.monthFull || label
                  }}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avg_margin" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  dot={{ fill: '#2563eb', r: 4 }}
                  activeDot={{ r: 6, fill: '#2563eb' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de receita */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Evolução da Receita
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(value), 'Receita Total']}
                  labelFormatter={(label) => {
                    const item = chartData.find(d => d.month === label)
                    return item?.monthFull || label
                  }}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                />
                <Bar 
                  dataKey="total_revenue" 
                  fill="#16a34a"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Análise de Tendências</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium mb-2">Tendência de Margem:</h5>
              <p className="text-muted-foreground">
                {marginTrend > 0 ? 
                  `Crescimento de ${formatPercentage(marginTrend)} indicando melhoria na eficiência operacional.` :
                  marginTrend < 0 ?
                  `Redução de ${formatPercentage(Math.abs(marginTrend))} pode indicar pressão competitiva ou aumento de custos.` :
                  'Margem estável, mantendo consistência operacional.'
                }
              </p>
            </div>
            <div>
              <h5 className="font-medium mb-2">Tendência de Receita:</h5>
              <p className="text-muted-foreground">
                {revenueGrowth > 0 ? 
                  `Crescimento de ${formatPercentage(revenueGrowth)} demonstra expansão positiva do negócio.` :
                  revenueGrowth < 0 ?
                  `Queda de ${formatPercentage(Math.abs(revenueGrowth))} requer atenção às estratégias de venda.` :
                  'Receita estável, foco em otimização de margens.'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 