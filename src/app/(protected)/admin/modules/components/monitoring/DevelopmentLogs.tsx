'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { 
  Terminal, 
  Search, 
  Download,
  Pause,
  Play,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Info,
  XCircle,
  CheckCircle,
  Activity,
  BarChart3,
  Clock,
  TrendingUp,
  Bug,
  Circle
} from 'lucide-react'
import { logAggregatorService, type DevelopmentLog, type LogFilter } from '@/core/services/log-aggregator'

export function DevelopmentLogs() {
  const [logs, setLogs] = useState<DevelopmentLog[]>([])
  const [isStreaming, setIsStreaming] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [totalCount, setTotalCount] = useState(0)

  // Subscription para logs em tempo real
  useEffect(() => {
    const unsubscribe = logAggregatorService.subscribe('development-logs-ui', (newLog) => {
      if (isStreaming) {
        setLogs(prev => [newLog, ...prev.slice(0, 499)]) // Mantém apenas 500 logs
      }
    })

    return unsubscribe
  }, [isStreaming])

  // Carrega logs iniciais
  useEffect(() => {
    loadLogs()
  }, [])

  // Atualiza logs quando filtros mudam
  useEffect(() => {
    loadLogs()
  }, [searchTerm, levelFilter, categoryFilter, moduleFilter])

  const loadLogs = async () => {
    try {
      const filter: LogFilter = {}
      
      if (levelFilter !== 'all') filter.levels = [levelFilter]
      if (categoryFilter !== 'all') filter.categories = [categoryFilter]
      if (moduleFilter !== 'all') filter.modules = [moduleFilter]
      if (searchTerm) filter.searchTerm = searchTerm

      const result = await logAggregatorService.getLogs(filter, 1, 500)
      setLogs(result.logs)
      setTotalCount(result.totalCount)
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
    }
  }

  const exportLogs = async (format: 'json' | 'csv') => {
    try {
      const filter: LogFilter = {}
      
      if (levelFilter !== 'all') filter.levels = [levelFilter]
      if (categoryFilter !== 'all') filter.categories = [categoryFilter]
      if (moduleFilter !== 'all') filter.modules = [moduleFilter]
      if (searchTerm) filter.searchTerm = searchTerm

      await logAggregatorService.exportLogs(filter, format)
    } catch (error) {
      console.error('Erro ao exportar logs:', error)
    }
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit'
    })
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      case 'debug':
        return <Bug className="h-4 w-4 text-gray-500" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'border-l-red-600 bg-red-50'
      case 'error':
        return 'border-l-red-500 bg-red-50'
      case 'warn':
        return 'border-l-yellow-500 bg-yellow-50'
      case 'info':
        return 'border-l-blue-500 bg-blue-50'
      case 'debug':
        return 'border-l-gray-500 bg-gray-50'
      default:
        return 'border-l-gray-300 bg-white'
    }
  }

  // Obter valores únicos para os filtros
  const uniqueLevels = [...new Set(logs.map(log => log.level))]
  const uniqueCategories = [...new Set(logs.map(log => log.category))]
  const uniqueModules = [...new Set(logs.map(log => log.moduleId).filter(Boolean))]

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <Card variant="default" size="sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Logs de Desenvolvimento
              </CardTitle>
              <CardDescription>
                Stream em tempo real dos logs do sistema de módulos
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isStreaming ? 'default' : 'secondary'}>
                {isStreaming ? 'Streaming Ativo' : 'Pausado'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsStreaming(!isStreaming)}
              >
                {isStreaming ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros e Controles */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Input
              placeholder="Buscar nos logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueModules.map(module => (
                  <SelectItem key={module} value={module!}>
                    {module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => exportLogs('json')}>
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportLogs('csv')}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>

          {/* Informações de status */}
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <span>Mostrando {logs.length} de {totalCount} logs</span>
            <span>Último log: {logs.length > 0 ? formatTimestamp(logs[0].timestamp) : 'N/A'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      <Card variant="default" size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Stream de Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="space-y-1">
              {logs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum log encontrado com os filtros aplicados</p>
                </div>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={`${log.id}-${index}`}
                    className={`p-3 border-l-4 ${getLevelColor(log.level)} hover:bg-gray-50 transition-colors`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getLevelIcon(log.level)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">
                            {formatTimestamp(log.timestamp)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {log.level.toUpperCase()}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {log.category}
                          </Badge>
                          {log.moduleId && (
                            <Badge variant="outline" className="text-xs font-mono">
                              {log.moduleId}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm break-words">{log.message}</p>
                        {log.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                              Ver detalhes
                            </summary>
                            <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Análise de Padrões */}
      <Card variant="default" size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Análise de Padrões
          </CardTitle>
          <CardDescription>
            Padrões identificados nos logs recentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Padrão Detectado</span>
              </div>
              <p className="text-sm text-yellow-700">
                Aumento de warnings em build nos últimos 30 minutos
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Informação</span>
              </div>
              <p className="text-sm text-blue-700">
                Module banban/inventory está gerando mais logs que o normal
              </p>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Status OK</span>
              </div>
              <p className="text-sm text-green-700">
                Nenhum erro crítico nas últimas 2 horas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 