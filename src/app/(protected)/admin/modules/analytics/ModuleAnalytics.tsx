/**
 * ModuleAnalytics - Dashboard de analytics de uso de módulos em tempo real
 * Fase 5: Admin Interface Enhancement
 * 
 * Analytics completos para:
 * - Uso de módulos por organização e usuário
 * - Métricas de performance e adoção
 * - Tendências e insights automáticos
 * - Alertas de comportamento anômalo
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Clock,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Calendar,
  Filter,
  Eye,
  Target,
  Gauge,
  Timer,
  Database,
  Globe,
  Smartphone,
  Monitor,
  Wifi,
  WifiOff,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { useToast } from '@/shared/ui/toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';

interface ModuleAnalyticsProps {
  className?: string;
}

interface ModuleUsageMetrics {
  module_slug: string;
  module_name: string;
  total_sessions: number;
  unique_users: number;
  avg_session_duration: number; // em segundos
  page_views: number;
  bounce_rate: number; // %
  error_rate: number; // %
  load_time_avg: number; // em ms
  user_satisfaction: number; // 0-5
  growth_rate: number; // % comparado ao período anterior
  peak_hours: number[]; // horas do dia com mais uso
  adoption_rate: number; // %
  last_updated: string;
}

interface OrganizationUsage {
  organization_id: string;
  organization_name: string;
  active_modules: number;
  total_sessions: number;
  avg_session_duration: number;
  most_used_module: string;
  least_used_module: string;
  user_count: number;
  last_activity: string;
  tier: 'free' | 'premium' | 'enterprise';
}

interface UserBehaviorMetrics {
  user_id: string;
  user_name: string;
  organization_name: string;
  favorite_modules: string[];
  session_count_today: number;
  total_time_today: number; // em minutos
  feature_adoption_score: number; // 0-100
  last_seen: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  engagement_level: 'high' | 'medium' | 'low';
}

interface SystemHealthMetrics {
  uptime_percentage: number;
  avg_response_time: number; // ms
  error_rate: number; // %
  active_connections: number;
  memory_usage: number; // %
  cpu_usage: number; // %
  db_performance: number; // ms
  cache_hit_rate: number; // %
  cdn_efficiency: number; // %
  alerts_count: number;
}

interface TrendData {
  period: string;
  value: number;
  change: number; // % change from previous period
}

/**
 * Dashboard de analytics de módulos
 */
export const ModuleAnalytics: React.FC<ModuleAnalyticsProps> = ({ className }) => {
  const [moduleMetrics, setModuleMetrics] = useState<ModuleUsageMetrics[]>([]);
  const [organizationUsage, setOrganizationUsage] = useState<OrganizationUsage[]>([]);
  const [userBehavior, setUserBehavior] = useState<UserBehaviorMetrics[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedModule, setSelectedModule] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  // Carregar dados de analytics
  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Simulação de dados - em produção viria da API de analytics
      const mockModuleMetrics: ModuleUsageMetrics[] = [
        {
          module_slug: 'alerts',
          module_name: 'Sistema de Alertas',
          total_sessions: 2847,
          unique_users: 156,
          avg_session_duration: 380, // ~6 minutos
          page_views: 8932,
          bounce_rate: 23.5,
          error_rate: 1.2,
          load_time_avg: 1245,
          user_satisfaction: 4.3,
          growth_rate: 15.8,
          peak_hours: [9, 10, 11, 14, 15, 16],
          adoption_rate: 87.3,
          last_updated: new Date().toISOString()
        },
        {
          module_slug: 'performance',
          module_name: 'Analytics de Performance',
          total_sessions: 1653,
          unique_users: 89,
          avg_session_duration: 720, // 12 minutos
          page_views: 4521,
          bounce_rate: 18.2,
          error_rate: 0.8,
          load_time_avg: 2156,
          user_satisfaction: 4.6,
          growth_rate: 28.4,
          peak_hours: [10, 11, 14, 15, 16, 17],
          adoption_rate: 65.2,
          last_updated: new Date().toISOString()
        },
        {
          module_slug: 'reports',
          module_name: 'Relatórios',
          total_sessions: 892,
          unique_users: 67,
          avg_session_duration: 450,
          page_views: 2341,
          bounce_rate: 31.8,
          error_rate: 2.1,
          load_time_avg: 1890,
          user_satisfaction: 3.9,
          growth_rate: -5.2,
          peak_hours: [9, 10, 17, 18],
          adoption_rate: 45.1,
          last_updated: new Date().toISOString()
        },
        {
          module_slug: 'inventory',
          module_name: 'Gestão de Inventário',
          total_sessions: 234,
          unique_users: 23,
          avg_session_duration: 890,
          page_views: 567,
          bounce_rate: 42.3,
          error_rate: 4.7,
          load_time_avg: 3240,
          user_satisfaction: 3.2,
          growth_rate: 78.9,
          peak_hours: [8, 9, 13, 14],
          adoption_rate: 15.7,
          last_updated: new Date().toISOString()
        }
      ];

      const mockOrganizationUsage: OrganizationUsage[] = [
        {
          organization_id: '1',
          organization_name: 'Banban Corp',
          active_modules: 8,
          total_sessions: 1580,
          avg_session_duration: 420,
          most_used_module: 'alerts',
          least_used_module: 'inventory',
          user_count: 45,
          last_activity: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min atrás
          tier: 'enterprise'
        },
        {
          organization_id: '2',
          organization_name: 'Riachuelo',
          active_modules: 5,
          total_sessions: 892,
          avg_session_duration: 380,
          most_used_module: 'performance',
          least_used_module: 'reports',
          user_count: 28,
          last_activity: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min atrás
          tier: 'premium'
        },
        {
          organization_id: '3',
          organization_name: 'Empresa ABC',
          active_modules: 3,
          total_sessions: 234,
          avg_session_duration: 280,
          most_used_module: 'alerts',
          least_used_module: 'performance',
          user_count: 12,
          last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
          tier: 'free'
        }
      ];

      const mockUserBehavior: UserBehaviorMetrics[] = [
        {
          user_id: '1',
          user_name: 'João Silva',
          organization_name: 'Banban Corp',
          favorite_modules: ['alerts', 'performance', 'reports'],
          session_count_today: 8,
          total_time_today: 240, // 4 horas
          feature_adoption_score: 85,
          last_seen: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          device_type: 'desktop',
          browser: 'Chrome',
          engagement_level: 'high'
        },
        {
          user_id: '2',
          user_name: 'Maria Santos',
          organization_name: 'Riachuelo',
          favorite_modules: ['performance', 'alerts'],
          session_count_today: 5,
          total_time_today: 180,
          feature_adoption_score: 72,
          last_seen: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          device_type: 'mobile',
          browser: 'Safari',
          engagement_level: 'medium'
        },
        {
          user_id: '3',
          user_name: 'Carlos Oliveira',
          organization_name: 'Empresa ABC',
          favorite_modules: ['alerts'],
          session_count_today: 2,
          total_time_today: 45,
          feature_adoption_score: 34,
          last_seen: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          device_type: 'desktop',
          browser: 'Firefox',
          engagement_level: 'low'
        }
      ];

      const mockSystemHealth: SystemHealthMetrics = {
        uptime_percentage: 99.94,
        avg_response_time: 245,
        error_rate: 0.8,
        active_connections: 1247,
        memory_usage: 68.5,
        cpu_usage: 42.3,
        db_performance: 89,
        cache_hit_rate: 94.2,
        cdn_efficiency: 97.8,
        alerts_count: 3
      };

      setModuleMetrics(mockModuleMetrics);
      setOrganizationUsage(mockOrganizationUsage);
      setUserBehavior(mockUserBehavior);
      setSystemHealth(mockSystemHealth);

      console.debug(`✅ Analytics carregados: ${mockModuleMetrics.length} módulos, ${mockOrganizationUsage.length} organizações`);

    } catch (error) {
      console.error('❌ Erro ao carregar analytics:', error);
      toast.error("Não foi possível carregar os dados de analytics.", {
        title: "Erro ao carregar analytics",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const getGrowthBadge = (growth: number) => {
    if (growth > 0) {
      return (
        <Badge variant="light_success" className="flex items-center gap-1">
          <ArrowUp className="w-3 h-3" />
          +{growth.toFixed(1)}%
        </Badge>
      );
    } else if (growth < 0) {
      return (
        <Badge variant="light_destructive" className="flex items-center gap-1">
          <ArrowDown className="w-3 h-3" />
          {growth.toFixed(1)}%
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Minus className="w-3 h-3" />
          0%
        </Badge>
      );
    }
  };

  const getTierBadge = (tier: string) => {
    const variants = {
      free: 'secondary',
      premium: 'default',
      enterprise: 'light_success'
    } as const;
    
    const labels = {
      free: 'Gratuito',
      premium: 'Premium',
      enterprise: 'Enterprise'
    } as const;
    
    return (
      <Badge variant={variants[tier as keyof typeof variants] || 'outline'}>
        {labels[tier as keyof typeof labels] || tier}
      </Badge>
    );
  };

  const getEngagementBadge = (level: string) => {
    const variants = {
      high: 'light_success',
      medium: 'light_warning',
      low: 'light_destructive'
    } as const;
    
    const labels = {
      high: 'Alto',
      medium: 'Médio',
      low: 'Baixo'
    } as const;
    
    return (
      <Badge variant={variants[level as keyof typeof variants] || 'outline'}>
        {labels[level as keyof typeof labels] || level}
      </Badge>
    );
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile': return Smartphone;
      case 'tablet': return Smartphone;
      default: return Monitor;
    }
  };

  const getHealthStatus = (value: number, threshold: { good: number; warning: number }) => {
    if (value >= threshold.good) return { variant: 'light_success', label: 'Bom' };
    if (value >= threshold.warning) return { variant: 'light_warning', label: 'Atenção' };
    return { variant: 'light_destructive', label: 'Crítico' };
  };

  // Carregar dados na inicialização
  useEffect(() => {
    loadAnalytics();
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header com controles */}
      <Card size="sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics de Módulos
                <Badge variant="outline" className="ml-2">
                  Tempo Real
                </Badge>
              </CardTitle>
              <CardDescription>
                Métricas de uso, performance e comportamento dos usuários em tempo real.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32" icon={Calendar}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Hoje</SelectItem>
                  <SelectItem value="7d">7 dias</SelectItem>
                  <SelectItem value="30d">30 dias</SelectItem>
                  <SelectItem value="90d">90 dias</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={loadAnalytics}
                disabled={loading}
                leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
              >
                Atualizar
              </Button>
              <Button
                variant="outline"
                leftIcon={<Download className="w-4 h-4" />}
              >
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* System Health Overview */}
      {systemHealth && (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{systemHealth.uptime_percentage}%</div>
                <div className="text-xs text-muted-foreground">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{systemHealth.avg_response_time}ms</div>
                <div className="text-xs text-muted-foreground">Resposta Média</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatNumber(systemHealth.active_connections)}</div>
                <div className="text-xs text-muted-foreground">Conexões Ativas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{systemHealth.cache_hit_rate}%</div>
                <div className="text-xs text-muted-foreground">Cache Hit Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{systemHealth.alerts_count}</div>
                <div className="text-xs text-muted-foreground">Alertas Ativos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="organizations">Organizações</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card size="sm">
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-sm font-medium leading-none">Sessões Totais</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(moduleMetrics.reduce((sum, m) => sum + m.total_sessions, 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent>
                <div className="flex items-center">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-sm font-medium leading-none">Page Views</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(moduleMetrics.reduce((sum, m) => sum + m.page_views, 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-sm font-medium leading-none">Tempo Médio</p>
                    <p className="text-2xl font-bold">
                      {Math.round(moduleMetrics.reduce((sum, m) => sum + m.avg_session_duration, 0) / moduleMetrics.length / 60)}m
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent>
                <div className="flex items-center">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-sm font-medium leading-none">Satisfação</p>
                    <p className="text-2xl font-bold">
                      {(moduleMetrics.reduce((sum, m) => sum + m.user_satisfaction, 0) / moduleMetrics.length).toFixed(1)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Modules Performance */}
          <Card size="sm">
            <CardHeader>
              <CardTitle>Performance dos Módulos</CardTitle>
              <CardDescription>
                Métricas de performance e uso dos principais módulos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Sessões</TableHead>
                    <TableHead>Usuários</TableHead>
                    <TableHead>Duração Média</TableHead>
                    <TableHead>Satisfação</TableHead>
                    <TableHead>Crescimento</TableHead>
                    <TableHead>Load Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {moduleMetrics.slice(0, 4).map((module) => (
                    <TableRow key={module.module_slug}>
                      <TableCell>
                        <div className="font-medium">{module.module_name}</div>
                        <div className="text-sm text-muted-foreground">{module.module_slug}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-lg font-semibold">{formatNumber(module.total_sessions)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-lg font-semibold">{module.unique_users}</div>
                      </TableCell>
                      <TableCell>
                        <div>{formatDuration(module.avg_session_duration)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{module.user_satisfaction.toFixed(1)}</span>
                          <span className="text-muted-foreground">/5</span>
                        </div>
                      </TableCell>
                      <TableCell>{getGrowthBadge(module.growth_rate)}</TableCell>
                      <TableCell>
                        <div className={`font-medium ${module.load_time_avg > 2000 ? 'text-red-600' : module.load_time_avg > 1000 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {module.load_time_avg}ms
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Módulos */}
        <TabsContent value="modules">
          <Card size="sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Analytics Detalhado por Módulo</CardTitle>
                  <CardDescription>
                    Métricas completas de uso e performance por módulo.
                  </CardDescription>
                </div>
                <Select value={selectedModule} onValueChange={setSelectedModule}>
                  <SelectTrigger className="w-48" icon={Filter}>
                    <SelectValue placeholder="Módulo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os módulos</SelectItem>
                    {moduleMetrics.map(module => (
                      <SelectItem key={module.module_slug} value={module.module_slug}>
                        {module.module_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Adoção</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Bounce Rate</TableHead>
                    <TableHead>Error Rate</TableHead>
                    <TableHead>Pico de Uso</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {moduleMetrics.map((module) => (
                    <TableRow key={module.module_slug}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{module.module_name}</div>
                          <div className="text-sm text-muted-foreground">{module.module_slug}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="text-lg font-semibold">{module.adoption_rate.toFixed(1)}%</div>
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${module.adoption_rate}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{formatNumber(module.total_sessions)}</div>
                          <div className="text-xs text-muted-foreground">{module.unique_users} usuários</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${module.bounce_rate > 40 ? 'text-red-600' : module.bounce_rate > 25 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {module.bounce_rate.toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${module.error_rate > 3 ? 'text-red-600' : module.error_rate > 1 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {module.error_rate.toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {module.peak_hours.slice(0, 3).map(hour => `${hour}h`).join(', ')}
                          {module.peak_hours.length > 3 && '...'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {module.error_rate > 3 ? (
                          <Badge variant="light_destructive" className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Atenção
                          </Badge>
                        ) : (
                          <Badge variant="light_success" className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Saudável
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Organizações */}
        <TabsContent value="organizations">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Uso por Organização</CardTitle>
              <CardDescription>
                Analytics de uso e engagement por organização.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organização</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Módulos Ativos</TableHead>
                    <TableHead>Sessões</TableHead>
                    <TableHead>Usuários</TableHead>
                    <TableHead>Módulo Favorito</TableHead>
                    <TableHead>Última Atividade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizationUsage.map((org) => (
                    <TableRow key={org.organization_id}>
                      <TableCell>
                        <div className="font-medium">{org.organization_name}</div>
                      </TableCell>
                      <TableCell>{getTierBadge(org.tier)}</TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{org.active_modules}</div>
                          <div className="text-xs text-muted-foreground">módulos</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{formatNumber(org.total_sessions)}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDuration(org.avg_session_duration)} média
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{org.user_count}</div>
                          <div className="text-xs text-muted-foreground">usuários</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{org.most_used_module}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(org.last_activity).toLocaleString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {Date.now() - new Date(org.last_activity).getTime() < 30 * 60 * 1000 ? (
                          <Badge variant="light_success" className="flex items-center gap-1">
                            <Wifi className="w-3 h-3" />
                            Online
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <WifiOff className="w-3 h-3" />
                            Offline
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Usuários */}
        <TabsContent value="users">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Comportamento de Usuários</CardTitle>
              <CardDescription>
                Analytics de engagement e comportamento individual.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Organização</TableHead>
                    <TableHead>Sessões Hoje</TableHead>
                    <TableHead>Tempo Hoje</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Módulos Favoritos</TableHead>
                    <TableHead>Última Atividade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userBehavior.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div className="font-medium">{user.user_name}</div>
                        <div className="text-xs text-muted-foreground">
                          Score: {user.feature_adoption_score}/100
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{user.organization_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{user.session_count_today}</div>
                          <div className="text-xs text-muted-foreground">sessões</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{Math.floor(user.total_time_today / 60)}h</div>
                          <div className="text-xs text-muted-foreground">{user.total_time_today % 60}m</div>
                        </div>
                      </TableCell>
                      <TableCell>{getEngagementBadge(user.engagement_level)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {React.createElement(getDeviceIcon(user.device_type), { className: "w-4 h-4" })}
                          <div>
                            <div className="text-sm">{user.device_type}</div>
                            <div className="text-xs text-muted-foreground">{user.browser}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.favorite_modules.slice(0, 2).map(module => (
                            <Badge key={module} variant="outline" className="text-xs">
                              {module}
                            </Badge>
                          ))}
                          {user.favorite_modules.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{user.favorite_modules.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(user.last_seen).toLocaleString('pt-BR')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ModuleAnalytics;
