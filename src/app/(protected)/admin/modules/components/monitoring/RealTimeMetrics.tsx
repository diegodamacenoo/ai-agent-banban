'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Activity, Clock, Zap, Database, Users, Wifi } from 'lucide-react';
import type { RealTimeMetrics } from '../../types/module-details';

interface RealTimeMetricsProps {
  metrics: RealTimeMetrics | null;
  moduleId: string;
}

// Hook para simular atualização em tempo real
function useRealTimeUpdates(initialMetrics: RealTimeMetrics | null, moduleId: string) {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!initialMetrics) return;

    // Simular atualizações em tempo real a cada 30 segundos
    const interval = setInterval(() => {
      setMetrics(prevMetrics => {
        if (!prevMetrics) return null;
        
        return {
          ...prevMetrics,
          current_usage: Math.max(1, prevMetrics.current_usage + Math.floor(Math.random() * 10 - 5)),
          avg_response_time: Math.max(50, prevMetrics.avg_response_time + Math.floor(Math.random() * 40 - 20)),
          cache_hit_rate: Math.min(100, Math.max(80, prevMetrics.cache_hit_rate + Math.random() * 2 - 1)),
          active_connections: Math.max(0, prevMetrics.active_connections + Math.floor(Math.random() * 6 - 3)),
          last_sync: new Date().toISOString()
        };
      });
    }, 30000); // 30 segundos

    // Simular desconexão ocasional
    const connectionCheck = setInterval(() => {
      setIsLive(prev => Math.random() > 0.1 ? true : prev); // 90% chance de manter conexão
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(connectionCheck);
    };
  }, [initialMetrics, moduleId]);

  return { metrics, isLive };
}

export default function RealTimeMetrics({ metrics: initialMetrics, moduleId }: RealTimeMetricsProps) {
  const { metrics, isLive } = useRealTimeUpdates(initialMetrics, moduleId);

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Métricas em Tempo Real
            <Badge variant="destructive" className="ml-auto">Offline</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Não foi possível carregar as métricas do módulo.</p>
        </CardContent>
      </Card>
    );
  }

  // Determinar cores baseadas nos valores
  const getResponseTimeColor = (time: number) => {
    if (time < 200) return 'text-green-600';
    if (time < 400) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99.5) return 'text-green-600';
    if (uptime >= 98) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatLastSync = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s atrás`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min atrás`;
    return new Date(timestamp).toLocaleTimeString('pt-BR');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Métricas em Tempo Real
          <div className="ml-auto flex items-center space-x-2">
            <Badge variant={isLive ? "default" : "destructive"} className="text-xs">
              <Wifi className="w-3 h-3 mr-1" />
              {isLive ? "Live" : "Desconectado"}
            </Badge>
            <span className="text-xs text-gray-500">
              {formatLastSync(metrics.last_sync)}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Uso Atual */}
          <div className="space-y-1">
            <div className="flex items-center text-sm text-gray-600">
              <Users className="w-4 h-4 mr-1" />
              Uso Atual
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.current_usage}
            </div>
            <div className="text-xs text-gray-500">usuários ativos</div>
          </div>

          {/* Tempo de Resposta */}
          <div className="space-y-1">
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              Tempo Resp.
            </div>
            <div className={`text-2xl font-bold ${getResponseTimeColor(metrics.avg_response_time)}`}>
              {Math.round(metrics.avg_response_time)}ms
            </div>
            <div className="text-xs text-gray-500">média</div>
          </div>

          {/* Uptime */}
          <div className="space-y-1">
            <div className="flex items-center text-sm text-gray-600">
              <Zap className="w-4 h-4 mr-1" />
              Uptime
            </div>
            <div className={`text-2xl font-bold ${getUptimeColor(metrics.uptime_percentage)}`}>
              {metrics.uptime_percentage.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">últimos 30 dias</div>
          </div>

          {/* Cache Hit Rate */}
          <div className="space-y-1">
            <div className="flex items-center text-sm text-gray-600">
              <Database className="w-4 h-4 mr-1" />
              Cache Hit
            </div>
            <div className="text-2xl font-bold text-green-600">
              {metrics.cache_hit_rate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">taxa de acerto</div>
          </div>

          {/* Requests Hoje */}
          <div className="space-y-1">
            <div className="flex items-center text-sm text-gray-600">
              <Activity className="w-4 h-4 mr-1" />
              Requests
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {metrics.total_requests_today.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">hoje</div>
          </div>

          {/* Conexões Ativas */}
          <div className="space-y-1">
            <div className="flex items-center text-sm text-gray-600">
              <Wifi className="w-4 h-4 mr-1" />
              Conexões
            </div>
            <div className="text-2xl font-bold text-indigo-600">
              {metrics.active_connections}
            </div>
            <div className="text-xs text-gray-500">ativas agora</div>
          </div>
        </div>

        {/* Indicadores de Saúde */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Status Geral:</span>
            <div className="flex items-center space-x-4">
              <Badge 
                variant={metrics.avg_response_time < 300 ? "default" : "secondary"}
                className="text-xs"
              >
                {metrics.avg_response_time < 300 ? "Performance OK" : "Performance Degradada"}
              </Badge>
              <Badge 
                variant={metrics.uptime_percentage >= 99.5 ? "default" : "destructive"}
                className="text-xs"
              >
                {metrics.uptime_percentage >= 99.5 ? "Sistema Estável" : "Sistema Instável"}
              </Badge>
              <Badge 
                variant={metrics.cache_hit_rate >= 90 ? "default" : "secondary"}
                className="text-xs"
              >
                {metrics.cache_hit_rate >= 90 ? "Cache Otimizado" : "Cache Subótimo"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}