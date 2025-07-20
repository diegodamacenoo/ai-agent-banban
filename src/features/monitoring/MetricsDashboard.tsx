'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Progress } from '@/shared/ui/progress';
import { 
  Activity, 
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  Clock,
  HelpCircle,
  XCircle
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface MetricData {
  timestamp: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number;
  activeConnections: number;
  uptime: number;
}

interface AggregatedMetrics {
  averageRPS: number;
  averageResponseTime: number;
  averageErrorRate: number;
  maxMemoryUsage: number;
  currentConnections: number;
  dataPoints: number;
  timeRange: string;
  status: 'healthy' | 'warning' | 'critical';
}

interface MetricsResponse {
  success: boolean;
  data: AggregatedMetrics;
  timestamp: string;
}

export function MetricsDashboard() {
  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMetrics = async () => {
    try {
      setError(null);
      
      // Tentar buscar do backend Fastify primeiro
      const response = await fetch('http://localhost:4000/api/metrics/aggregated?minutes=15');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: MetricsResponse = await response.json();
      
      if (data.success && data.data) {
        setMetrics(data.data);
        setLastUpdated(new Date());
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar métricas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchMetrics, 30000); // Atualizar a cada 30 segundos
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'warning': return <ArrowDown className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatMemory = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Métricas de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <ArrowUp className="h-6 w-6 animate-spin mr-2" />
            Carregando métricas...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Métricas de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar métricas</AlertTitle>
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => {
                  setLoading(true);
                  fetchMetrics();
                }}
              >
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Métricas de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Métricas não disponíveis</AlertTitle>
            <AlertDescription>
              O sistema de métricas está inicializando. Aguarde alguns segundos e tente novamente.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Métricas de Performance
          </h2>
          <p className="text-gray-600">
            Monitoramento em tempo real do backend - {metrics.timeRange}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Pausar' : 'Retomar'} Auto-refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              fetchMetrics();
            }}
          >
            <ArrowUp className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Status Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUp className="h-5 w-5" />
            Status Geral do Sistema
          </CardTitle>
          <CardDescription>
            {lastUpdated && `Última atualização: ${lastUpdated.toLocaleTimeString()}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge 
              variant="secondary" 
              className={`${getStatusColor(metrics.status)} text-white`}
            >
              {getStatusIcon(metrics.status)}
              <span className="ml-1 capitalize">{metrics.status}</span>
            </Badge>
            <span className="text-sm text-gray-600">
              {metrics.dataPoints} pontos de dados coletados
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Requests por Segundo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Requests/Segundo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowUp className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">
                {metrics.averageRPS.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Média dos últimos 15 minutos
            </p>
          </CardContent>
        </Card>

        {/* Tempo de Resposta */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tempo de Resposta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">
                {metrics.averageResponseTime}ms
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Média dos últimos 15 minutos
            </p>
          </CardContent>
        </Card>

        {/* Taxa de Erro */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Taxa de Erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold">
                {metrics.averageErrorRate.toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Média dos últimos 15 minutos
            </p>
          </CardContent>
        </Card>

        {/* Conexões Ativas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Conexões Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowUp className="h-4 w-4 text-purple-500" />
              <span className="text-2xl font-bold">
                {metrics.currentConnections}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Conexões simultâneas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Uso de Recursos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUp className="h-5 w-5" />
            Uso de Recursos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Uso de Memória</span>
              <span className="text-sm text-gray-600">
                {metrics.maxMemoryUsage.toFixed(1)}%
              </span>
            </div>
            <Progress value={metrics.maxMemoryUsage} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              Pico máximo dos últimos 15 minutos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Alertas de Performance */}
      {(metrics.averageResponseTime > 2000 || metrics.averageErrorRate > 5 || metrics.maxMemoryUsage > 75) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Alertas de Performance</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {metrics.averageResponseTime > 2000 && (
                <li>Tempo de resposta elevado: {metrics.averageResponseTime}ms (limite: 2000ms)</li>
              )}
              {metrics.averageErrorRate > 5 && (
                <li>Taxa de erro elevada: {metrics.averageErrorRate.toFixed(2)}% (limite: 5%)</li>
              )}
              {metrics.maxMemoryUsage > 75 && (
                <li>Uso de memória alto: {metrics.maxMemoryUsage.toFixed(1)}% (limite: 75%)</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 
