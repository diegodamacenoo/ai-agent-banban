'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Progress } from '@/shared/ui/progress'
import { Badge } from '@/shared/ui/badge'
import { 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Target,
  Code2,
  TestTube,
  Shield
} from 'lucide-react'

interface QualityMetric {
  name: string
  current: number
  target: number
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  status: 'good' | 'warning' | 'critical'
}

const qualityMetrics: QualityMetric[] = [
  {
    name: 'Manutenibilidade',
    current: 92,
    target: 85,
    trend: 'up',
    trendValue: 5,
    status: 'good'
  },
  {
    name: 'Confiabilidade',
    current: 88,
    target: 90,
    trend: 'down',
    trendValue: 2,
    status: 'warning'
  },
  {
    name: 'Performance',
    current: 85,
    target: 80,
    trend: 'up',
    trendValue: 8,
    status: 'good'
  },
  {
    name: 'Segurança',
    current: 91,
    target: 95,
    trend: 'stable',
    trendValue: 0,
    status: 'good'
  },
  {
    name: 'Complexidade',
    current: 76,
    target: 70,
    trend: 'down',
    trendValue: 3,
    status: 'warning'
  },
  {
    name: 'Cobertura de Testes',
    current: 73,
    target: 80,
    trend: 'up',
    trendValue: 12,
    status: 'warning'
  }
]

const moduleProblems = [
  {
    module: 'Module A',
    type: 'Complexidade Alta',
    description: 'Função com complexidade ciclomática elevada',
    severity: 'critical' as const
  },
  {
    module: 'Module B',
    type: 'Imports Não Utilizados',
    description: 'Imports detectados sem uso',
    severity: 'warning' as const
  },
  {
    module: 'Module C',
    type: 'Query N+1',
    description: 'Problema de performance detectado',
    severity: 'critical' as const
  },
  {
    module: 'Module D',
    type: 'Configuração',
    description: 'Configuração inadequada detectada',
    severity: 'critical' as const
  }
]

export default function QualityAnalysis() {
  const overallQuality = Math.round(qualityMetrics.reduce((acc, metric) => acc + metric.current, 0) / qualityMetrics.length)

  return (
    <div className="space-y-6">
      {/* Métricas Detalhadas de Qualidade */}
      <Card variant="default" size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Análise Detalhada de Qualidade
          </CardTitle>
          <CardDescription>
            Métricas específicas de qualidade do código em todos os módulos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {qualityMetrics.map((metric) => (
              <Card key={metric.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                    {metric.status === 'good' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {metric.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                    {metric.status === 'critical' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{metric.current}%</span>
                      <div className="flex items-center gap-1">
                        {metric.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                        {metric.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                        <span className={`text-xs ${
                          metric.trend === 'up' ? 'text-green-600' : 
                          metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {metric.trend === 'stable' ? '0%' : `${metric.trendValue}%`}
                        </span>
                      </div>
                    </div>
                    <Progress value={metric.current} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Meta: {metric.target}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top 5 Problemas */}
      <Card variant="default" size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Top Problemas Detectados
          </CardTitle>
          <CardDescription>
            Problemas que mais impactam a qualidade geral dos módulos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {moduleProblems.map((problem, index) => (
            <div 
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                problem.severity === 'critical' 
                  ? 'border-red-200 bg-red-50' 
                  : 'border-yellow-200 bg-yellow-50'
              }`}
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white border-2 border-current">
                <span className="text-xs font-bold">{index + 1}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium">{problem.type}</p>
                  <Badge variant={problem.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                    {problem.severity === 'critical' ? 'Crítico' : 'Warning'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {problem.description}
                </p>
                <p className="text-xs font-mono text-blue-600">
                  {problem.module}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Métricas por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="default" size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Code2 className="h-4 w-4" />
              Code Quality
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Duplicação</span>
              <span className="text-sm font-medium">2.3%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Complexidade Média</span>
              <span className="text-sm font-medium">7.2</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Débito Técnico</span>
              <span className="text-sm font-medium">15h</span>
            </div>
          </CardContent>
        </Card>

        <Card variant="default" size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TestTube className="h-4 w-4" />
              Testing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Testes Unitários</span>
              <span className="text-sm font-medium">73%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Testes Integração</span>
              <span className="text-sm font-medium">45%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Testes E2E</span>
              <span className="text-sm font-medium">12%</span>
            </div>
          </CardContent>
        </Card>

        <Card variant="default" size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Vulnerabilidades</span>
              <span className="text-sm font-medium text-green-600">0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Code Smells</span>
              <span className="text-sm font-medium text-yellow-600">8</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Hotspots</span>
              <span className="text-sm font-medium text-red-600">3</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise de Tendências */}
      <Card variant="default" size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Análise de Tendências
          </CardTitle>
          <CardDescription>
            Evolução da qualidade ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <h4 className="font-medium text-green-800">Melhoria na Manutenibilidade</h4>
                <p className="text-sm text-green-600">+5% esta semana</p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div>
                <h4 className="font-medium text-yellow-800">Atenção: Confiabilidade</h4>
                <p className="text-sm text-yellow-600">-2% esta semana</p>
              </div>
              <TrendingDown className="h-6 w-6 text-yellow-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <h4 className="font-medium text-blue-800">Performance Estável</h4>
                <p className="text-sm text-blue-600">Mantendo bons índices</p>
              </div>
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 