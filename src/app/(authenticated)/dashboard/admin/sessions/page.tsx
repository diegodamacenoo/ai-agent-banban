'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, Users, Activity, Shield, RefreshCw, Monitor, Smartphone, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { SessionMonitor } from '@/components/admin/session-monitor'
import { 
  getOrganizationSessionStats,
  getOrganizationActiveSessions,
  terminateSession,
  terminateAllUserSessions,
  runSessionCleanup,
  detectSuspiciousSessions
} from './actions'

interface SessionData {
  session_id: string
  user_id: string
  email: string
  full_name: string
  created_at: string
  last_activity: string
  device_info: any
  geo_location: any
  session_type: string
  is_active: boolean
  ip: string
}

interface SessionStats {
  metric_name: string
  metric_value: number
  metric_trend: 'up' | 'down' | 'stable'
  metric_details: any
}

interface SecurityAlert {
  alert_type: string
  severity: 'low' | 'medium' | 'high'
  message: string
  recommendations: any
}

export default function SessionsManagementPage() {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [stats, setStats] = useState<SessionStats[]>([])
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const supabase = createClient()

  const loadSessionData = async () => {
    try {
      setLoading(true)

      // 1. Buscar sessões ativas usando server action
      const sessionsResult = await getOrganizationActiveSessions()
      
      if (sessionsResult.success) {
        setSessions(sessionsResult.data)
      } else {
        toast.error(`Erro ao carregar sessões: ${sessionsResult.error}`)
      }

      // 2. Buscar estatísticas usando server action
      const statsResult = await getOrganizationSessionStats()
      
      if (statsResult.success) {
        setStats(statsResult.data)
      } else {
        console.error('Analytics error:', statsResult.error)
      }

      // 3. Buscar alertas de segurança
      const alertsResult = await detectSuspiciousSessions()
      
      if (alertsResult.success) {
        setAlerts(alertsResult.data.map((session: any) => ({
          alert_type: 'suspicious_session',
          severity: session.risk_level as 'low' | 'medium' | 'high',
          message: `Sessão suspeita detectada: ${session.suspicion_reasons.join(', ')}`,
          recommendations: { action: 'verify_user' }
        })))
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados das sessões')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadSessionData()
    toast.success('Dados atualizados com sucesso')
  }

  const endSession = async (sessionId: string) => {
    const result = await terminateSession(sessionId)
    
    if (result.success) {
      toast.success(result.message)
      await loadSessionData()
    } else {
      toast.error(`Erro: ${result.error}`)
    }
  }

  const endAllUserSessions = async (userId: string) => {
    const result = await terminateAllUserSessions(userId)
    
    if (result.success) {
      toast.success(`${result.count} sessões encerradas`)
      await loadSessionData()
    } else {
      toast.error(`Erro: ${result.error}`)
    }
  }

  const runCleanup = async () => {
    const result = await runSessionCleanup()
    
    if (result.success) {
      toast.success(result.message)
      await loadSessionData()
    } else {
      toast.error(`Erro: ${result.error}`)
    }
  }

  useEffect(() => {
    loadSessionData()
  }, [])

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Agora mesmo'
    if (diffMins < 60) return `${diffMins}m atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    return `${diffDays}d atrás`
  }

  const getDeviceIcon = (sessionType: string) => {
    switch (sessionType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />
      case 'web':
        return <Monitor className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando dados das sessões...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Sessões</h1>
          <p className="text-muted-foreground">
            Monitore e gerencie sessões ativas dos usuários
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={runCleanup} variant="destructive">
            <Shield className="h-4 w-4 mr-2" />
            Limpeza
          </Button>
        </div>
      </div>

      {/* Session Monitor */}
      <SessionMonitor organizationId="" refreshInterval={30000} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.metric_name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium capitalize">
                {stat.metric_name.replace(/_/g, ' ')}
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.metric_value}</div>
              <div className="flex items-center space-x-2">
                <Badge variant={
                  stat.metric_trend === 'up' ? 'default' : 
                  stat.metric_trend === 'down' ? 'destructive' : 
                  'secondary'
                }>
                  {stat.metric_trend}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertas de Segurança */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Alertas de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <Badge variant={
                    alert.severity === 'high' ? 'destructive' :
                    alert.severity === 'medium' ? 'default' :
                    'secondary'
                  }>
                    {alert.severity}
                  </Badge>
                  <div>
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-sm text-muted-foreground">
                      Recomendação: {alert.recommendations.action}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs com Sessões */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Sessões Ativas ({sessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sessões Ativas</CardTitle>
              <CardDescription>
                Lista de todas as sessões ativas na organização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.session_id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-4">
                      {getDeviceIcon(session.session_type)}
                      <div>
                        <div className="font-medium">{session.full_name || 'Usuário'}</div>
                        <div className="text-sm text-muted-foreground">
                          {session.ip} • {session.geo_location?.city || 'Local desconhecido'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Última atividade: {formatTimeAgo(session.last_activity)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {session.session_type}
                      </Badge>
                      <Badge variant={session.is_active ? 'default' : 'secondary'}>
                        {session.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => endSession(session.session_id)}
                      >
                        Encerrar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => endAllUserSessions(session.user_id)}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Todas
                      </Button>
                    </div>
                  </div>
                ))}

                {sessions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma sessão ativa encontrada
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}