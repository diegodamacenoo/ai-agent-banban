'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Progress } from '@/shared/ui/progress'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  FileCode,
  TestTube,
  Clock,
  Eye,
  Settings,
  ChevronRight,
  Package,
  Code2,
  Zap,
  GitBranch,
  Target,
  Database,
  Search,
  Activity,
  TrendingUp,
  Shield,
  Users
} from 'lucide-react'
import { ModuleDetailedAnalysis } from '../monitoring/ModuleDetailedAnalysis';

interface ModuleData {
  id: string
  name: string
  path: string
  type: 'banban' | 'standard'
  status: 'healthy' | 'warning' | 'error' | 'incomplete'
  quality: number
  testCoverage: number
  lastUpdated: string
  issues: {
    critical: number
    warning: number
  }
  files: {
    required: string[]
    present: string[]
    missing: string[]
  }
  description: string
}

const modulesData: ModuleData[] = [
  {
    id: 'banban-inventory',
    name: 'Inventory Management',
    path: 'banban/inventory',
    type: 'banban',
    status: 'warning',
    quality: 78,
    testCoverage: 65,
    lastUpdated: '2025-01-24',
    issues: { critical: 1, warning: 3 },
    files: {
      required: ['index.ts', 'types.ts', 'module.config.json', 'README.md'],
      present: ['index.ts', 'module.config.json', 'README.md'],
      missing: ['types.ts']
    },
    description: 'Gerenciamento completo de estoque e inventário'
  },
  {
    id: 'banban-performance',
    name: 'Performance Analytics',
    path: 'banban/performance',
    type: 'banban',
    status: 'healthy',
    quality: 94,
    testCoverage: 88,
    lastUpdated: '2025-01-24',
    issues: { critical: 0, warning: 1 },
    files: {
      required: ['index.ts', 'types.ts', 'module.config.json', 'README.md'],
      present: ['index.ts', 'types.ts', 'module.config.json', 'README.md'],
      missing: []
    },
    description: 'Análise de performance e métricas de vendas'
  },
  {
    id: 'standard-analytics',
    name: 'Analytics Core',
    path: 'standard/analytics',
    type: 'standard',
    status: 'warning',
    quality: 82,
    testCoverage: 45,
    lastUpdated: '2025-01-23',
    issues: { critical: 0, warning: 5 },
    files: {
      required: ['index.ts', 'types.ts', 'module.config.json'],
      present: ['index.ts', 'types.ts', 'module.config.json'],
      missing: []
    },
    description: 'Módulo padrão de analytics e relatórios'
  },
  {
    id: 'standard-reports',
    name: 'Reports Generator',
    path: 'standard/reports',
    type: 'standard',
    status: 'error',
    quality: 56,
    testCoverage: 23,
    lastUpdated: '2025-01-22',
    issues: { critical: 2, warning: 8 },
    files: {
      required: ['index.ts', 'types.ts', 'module.config.json'],
      present: ['index.ts', 'module.config.json'],
      missing: ['types.ts']
    },
    description: 'Geração automática de relatórios'
  }
]

export default function DevelopmentDashboard() {
  const totalModules = modulesData.length
  const healthyModules = modulesData.filter(m => m.status === 'healthy').length
  const warningModules = modulesData.filter(m => m.status === 'warning').length
  const errorModules = modulesData.filter(m => m.status === 'error').length
  const avgQuality = Math.round(modulesData.reduce((acc, m) => acc + m.quality, 0) / totalModules)
  const avgTestCoverage = Math.round(modulesData.reduce((acc, m) => acc + m.testCoverage, 0) / totalModules)

  // Calcular métricas consolidadas do sistema
  const totalCriticalIssues = modulesData.reduce((acc, m) => acc + m.issues.critical, 0)
  const totalWarningIssues = modulesData.reduce((acc, m) => acc + m.issues.warning, 0)
  const totalFiles = modulesData.reduce((acc, m) => acc + m.files.required.length, 0)
  const presentFiles = modulesData.reduce((acc, m) => acc + m.files.present.length, 0)
  const completionRate = Math.round((presentFiles / totalFiles) * 100)
  const systemHealth = Math.round((healthyModules / totalModules) * 100)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Saudável</Badge>
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Atenção</Badge>
      case 'error':
        return <Badge variant="destructive">Erro</Badge>
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Análise Consolidada de Módulos */}
      <Card variant="default" size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Análise Consolidada de Módulos
          </CardTitle>
          <CardDescription>
            Visão detalhada do status e saúde de todos os módulos implementados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {modulesData.map((module) => (
              <Card key={module.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Package className="h-5 w-5 mt-0.5 text-blue-600" />
                      <div>
                        <CardTitle className="text-base">{module.name}</CardTitle>
                        <CardDescription className="font-mono text-xs">
                          {module.path}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(module.status)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {module.description}
                  </p>

                  {/* Métricas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">Qualidade</span>
                        <span className="text-xs">{module.quality}%</span>
                      </div>
                      <Progress value={module.quality} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">Testes</span>
                        <span className="text-xs">{module.testCoverage}%</span>
                      </div>
                      <Progress value={module.testCoverage} className="h-2" />
                    </div>
                  </div>

                  {/* Issues */}
                  {(module.issues.critical > 0 || module.issues.warning > 0) && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Problemas:</span>
                      {module.issues.critical > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {module.issues.critical} críticos
                        </Badge>
                      )}
                      {module.issues.warning > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {module.issues.warning} warnings
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Arquivos */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium">Arquivos Obrigatórios:</div>
                    <div className="flex flex-wrap gap-1">
                      {module.files.required.map((file) => (
                        <Badge 
                          key={file}
                          variant={module.files.present.includes(file) ? "default" : "secondary"}
                          className={`text-xs ${
                            module.files.present.includes(file) 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {file}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Botão de Análise Detalhada */}
                  <div className="flex justify-end pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Search className="h-4 w-4 mr-2" />
                          Análise Detalhada
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Análise Detalhada do Módulo</DialogTitle>
                        </DialogHeader>
                        <ModuleDetailedAnalysis moduleId={module.path} />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Resumo por Tipo de Módulo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t">
            {/* Módulos BanBan */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">BanBan</Badge>
                <span className="text-sm font-medium">
                  {modulesData.filter(m => m.type === 'banban').length} módulos
                </span>
              </div>
              <div className="space-y-1 text-sm text-purple-700">
                <div className="flex justify-between">
                  <span>Qualidade média:</span>
                  <span className="font-medium">
                    {Math.round(modulesData.filter(m => m.type === 'banban').reduce((acc, m) => acc + m.quality, 0) / modulesData.filter(m => m.type === 'banban').length)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-medium">
                    {modulesData.filter(m => m.type === 'banban' && m.status === 'healthy').length} saudáveis, {modulesData.filter(m => m.type === 'banban' && m.status === 'warning').length} atenção
                  </span>
                </div>
              </div>
            </div>

            {/* Módulos Standard */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">Standard</Badge>
                <span className="text-sm font-medium">
                  {modulesData.filter(m => m.type === 'standard').length} módulos
                </span>
              </div>
              <div className="space-y-1 text-sm text-blue-700">
                <div className="flex justify-between">
                  <span>Qualidade média:</span>
                  <span className="font-medium">
                    {Math.round(modulesData.filter(m => m.type === 'standard').reduce((acc, m) => acc + m.quality, 0) / modulesData.filter(m => m.type === 'standard').length)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-medium">
                    {modulesData.filter(m => m.type === 'standard' && m.status === 'healthy').length} saudáveis, {modulesData.filter(m => m.type === 'standard' && m.status === 'error').length} com erro
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas de Desenvolvimento (mantidas para visão detalhada) */}
      <Card variant="default" size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Métricas de Desenvolvimento
          </CardTitle>
          <CardDescription>
            Indicadores técnicos detalhados para análise de desenvolvimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Linhas de Código</CardTitle>
                <Code2 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">18.2k</div>
                <p className="text-xs text-muted-foreground">
                  +2.3k esta semana
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Complexidade Média</CardTitle>
                <Target className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7.2</div>
                <p className="text-xs text-muted-foreground">
                  Meta: ≤ 10
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Débito Técnico</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15h</div>
                <p className="text-xs text-muted-foreground">
                  Estimativa de correção
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 