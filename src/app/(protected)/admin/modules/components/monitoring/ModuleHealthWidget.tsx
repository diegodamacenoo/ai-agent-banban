'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { Activity, CheckCircle, AlertTriangle, XCircle, TrendingUp } from 'lucide-react';

interface HealthMetrics {
  overallHealth: number;
  uptime: number;
  performance: number;
  errorRate: number;
  activeIssues: number;
  lastIncident: string | null;
  healthTrend: 'up' | 'down' | 'stable';
  statusIndicators: Array<{
    name: string;
    status: 'healthy' | 'warning' | 'critical';
    value: string;
  }>;
}

interface ModuleHealthWidgetProps {
  moduleId: string;
}

export function ModuleHealthWidget({ moduleId }: ModuleHealthWidgetProps) {
  const [health, setHealth] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthMetrics();
    
    // Auto-refresh every 2 minutes for health data
    const interval = setInterval(fetchHealthMetrics, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [moduleId]);

  const fetchHealthMetrics = async () => {
    try {
      // TODO: Replace with actual API call
      const mockHealth: HealthMetrics = {
        overallHealth: 92,
        uptime: 99.8,
        performance: 87,
        errorRate: 0.3,
        activeIssues: 1,
        lastIncident: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        healthTrend: 'up',
        statusIndicators: [
          { name: 'API Response', status: 'healthy', value: '120ms' },
          { name: 'Memory Usage', status: 'warning', value: '78%' },
          { name: 'CPU Usage', status: 'healthy', value: '34%' },
          { name: 'DB Connections', status: 'healthy', value: '45/100' }
        ]
      };
      
      setHealth(mockHealth);
    } catch (error) {
      console.error('Failed to fetch health metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthBadge = (score: number) => {
    if (score >= 90) return <Badge variant="success">Excelente</Badge>;
    if (score >= 75) return <Badge variant="secondary">Bom</Badge>;
    if (score >= 60) return <Badge variant="warning">Regular</Badge>;
    return <Badge variant="destructive">Crítico</Badge>;
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-3 w-3 text-amber-600" />;
      case 'critical':
        return <XCircle className="h-3 w-3 text-red-600" />;
      default:
        return <Activity className="h-3 w-3 text-zinc-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="success" className="text-xs">OK</Badge>;
      case 'warning':
        return <Badge variant="warning" className="text-xs">Atenção</Badge>;
      case 'critical':
        return <Badge variant="destructive" className="text-xs">Crítico</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Desconhecido</Badge>;
    }
  };

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Nenhum';
    const hours = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60));
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `há ${days}d`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saúde</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
            <div className="h-2 bg-zinc-200 rounded w-full"></div>
            <div className="h-4 bg-zinc-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!health) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-zinc-600" />
          Saúde
          {health.activeIssues > 0 && (
            <Badge variant="warning" className="text-xs">
              {health.activeIssues} issue{health.activeIssues > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Health Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Saúde Geral</span>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-medium ${getHealthColor(health.overallHealth)}`}>
                {health.overallHealth}%
              </span>
              {health.healthTrend === 'up' && (
                <TrendingUp className="h-3 w-3 text-green-600" />
              )}
            </div>
          </div>
          
          <Progress value={health.overallHealth} className="h-2" />
          
          <div className="flex justify-center">
            {getHealthBadge(health.overallHealth)}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center p-2 bg-green-50 rounded border border-green-200">
            <div className="font-medium text-green-700">{health.uptime}%</div>
            <div className="text-green-600">Uptime</div>
          </div>
          
          <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
            <div className="font-medium text-blue-700">{health.performance}%</div>
            <div className="text-blue-600">Performance</div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="pt-3 border-t">
          <div className="text-sm font-medium text-zinc-700 mb-2">Indicadores</div>
          <div className="space-y-2">
            {health.statusIndicators.slice(0, 3).map((indicator, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {getStatusIcon(indicator.status)}
                  <span className="truncate">{indicator.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{indicator.value}</span>
                  {getStatusBadge(indicator.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error Rate */}
        <div className="flex items-center justify-between text-sm">
          <span>Taxa de Erro</span>
          <div className="flex items-center gap-1">
            <span className={`font-medium ${health.errorRate > 1 ? 'text-red-600' : 'text-green-600'}`}>
              {health.errorRate}%
            </span>
            {health.errorRate > 1 ? (
              <XCircle className="h-3 w-3 text-red-600" />
            ) : (
              <CheckCircle className="h-3 w-3 text-green-600" />
            )}
          </div>
        </div>

        {/* Last Incident */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600">Último incidente</span>
            <span className="font-medium">{formatTimeAgo(health.lastIncident)}</span>
          </div>
        </div>

        {/* Real-time indicator */}
        <div className="pt-2">
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Monitoramento ativo</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}