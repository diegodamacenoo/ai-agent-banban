'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Progress } from '@/shared/ui/progress'
import { 
  Activity, 
  Users, 
  Smartphone, 
  Monitor, 
  Globe, 
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

interface SessionMetric {
  metric_name: string
  metric_value: number
  metric_trend: 'up' | 'down' | 'stable'
  metric_details: any
}

interface SessionMonitorProps {
  organizationId: string
  refreshInterval?: number
}

export function SessionMonitor({ organizationId, refreshInterval = 30000 }: SessionMonitorProps) {
  const [metrics, setMetrics] = useState<SessionMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/sessions/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId })
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar métricas')
      }

      const data = await response.json()
      setMetrics(data.metrics || [])
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Erro ao buscar métricas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()

    const interval = setInterval(fetchMetrics, refreshInterval)
    return () => clearInterval(interval)
  }, [organizationId, refreshInterval])

  const getMetricIcon = (metricName: string) => {
    switch (metricName) {
      case 'active_sessions':
        return <Activity className="h-4 w-4" />
      case 'unique_active_users':
        return <Users className="h-4 w-4" />
      case 'mobile_percentage':
        return <Smartphone className="h-4 w-4" />
      case 'avg_session_duration_hours':
        return <Monitor className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />
      default:
        return <Activity className="h-3 w-3 text-gray-500" />
    }
  }

  const formatMetricName = (name: string) => {
    const names = {
      'active_sessions': 'Sessões Ativas',
      'unique_active_users': 'Usuários Únicos',
      'mobile_percentage': 'Mobile (%)',
      'avg_session_duration_hours': 'Duração Média (h)'
    }
    return names[name as keyof typeof names] || name.replace(/_/g, ' ')
  }

  const formatMetricValue = (name: string, value: number) => {
    switch (name) {
      case 'mobile_percentage':
        return `${value}%`
      case 'avg_session_duration_hours':
        return `${value}h`
      default:
        return value.toString()
    }
  }

  const getHealthScore = () => {
    if (metrics.length === 0) return 0

    const activeSessionsMetric = metrics.find(m => m.metric_name === 'active_sessions')
    const uniqueUsersMetric = metrics.find(m => m.metric_name === 'unique_active_users')
    const durationMetric = metrics.find(m => m.metric_name === 'avg_session_duration_hours')

    let score = 50 // Base score

    // Mais usuários únicos = melhor score
    if (uniqueUsersMetric && uniqueUsersMetric.metric_value > 10) {
      score += 20
    }

    // Duração de sessão balanceada (2-8h) = melhor score
    if (durationMetric && durationMetric.metric_value >= 2 && durationMetric.metric_value <= 8) {
      score += 20
    }

    // Tendências positivas = melhor score
    const positiveTrends = metrics.filter(m => m.metric_trend === 'up').length
    score += positiveTrends * 5

    return Math.min(score, 100)
  }

  const healthScore = getHealthScore()
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-pulse" />
            Carregando Métricas...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Health Score Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Saúde do Sistema
            </span>
            <Badge variant={healthScore >= 80 ? 'default' : healthScore >= 60 ? 'secondary' : 'destructive'}>
              {healthScore}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Progress value={healthScore} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className={getHealthColor(healthScore)}>
                {healthScore >= 80 ? 'Excelente' : healthScore >= 60 ? 'Bom' : 'Atenção Necessária'}
              </span>
              {lastUpdate && (
                <span className="text-muted-foreground">
                  Atualizado: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.metric_name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {formatMetricName(metric.metric_name)}
              </CardTitle>
              {getMetricIcon(metric.metric_name)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatMetricValue(metric.metric_name, metric.metric_value)}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                {getTrendIcon(metric.metric_trend)}
                <span className="text-xs text-muted-foreground capitalize">
                  {metric.metric_trend}
                </span>
                {metric.metric_details?.trend_percentage && (
                  <span className="text-xs text-muted-foreground">
                    ({metric.metric_details.trend_percentage > 0 ? '+' : ''}{metric.metric_details.trend_percentage}%)
                  </span>
                )}
              </div>
              
              {/* Detalhes específicos por métrica */}
              {metric.metric_name === 'mobile_percentage' && metric.metric_details && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Mobile: {metric.metric_details.mobile_sessions} | 
                  Web: {metric.metric_details.web_sessions}
                </div>
              )}
              
              {metric.metric_name === 'avg_session_duration_hours' && metric.metric_details?.interpretation && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {metric.metric_details.interpretation}
                </div>
              )}
              
              {metric.metric_name === 'unique_active_users' && metric.metric_details?.engagement_score && (
                <div className="mt-2">
                  <Badge variant={
                    metric.metric_details.engagement_score === 'high' ? 'default' :
                    metric.metric_details.engagement_score === 'medium' ? 'secondary' :
                    'outline'
                  } className="text-xs">
                    Engajamento: {metric.metric_details.engagement_score}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
          <CardDescription>
            Monitoramento e manutenção do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={fetchMetrics}>
              <Activity className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="outline" size="sm">
              <Shield className="h-4 w-4 mr-2" />
              Verificar Segurança
            </Button>
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Relatório Completo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}