'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { Activity, Monitor, Database, Clock } from 'lucide-react';

interface StandardPerformanceImplementationProps {
  params: { slug: string };
  config: Record<string, any>;
  implementation: any;
}

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  uptime: string;
  activeConnections: number;
}

export default function StandardPerformanceImplementation({ 
  params, 
  config, 
  implementation 
}: StandardPerformanceImplementationProps) {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de métricas de sistema padrão
    const mockMetrics: SystemMetrics = {
      cpuUsage: 45.2,
      memoryUsage: 62.8,
      diskUsage: 78.3,
      networkLatency: 12.5,
      uptime: '15 dias, 4h 23min',
      activeConnections: 847
    };

    setTimeout(() => {
      setMetrics(mockMetrics);
      setLoading(false);
    }, 900);
  }, []);

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return 'bg-red-500';
    if (usage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance do Sistema</h1>
          <p className="text-gray-600">
            Métricas padrão de sistema para {params.slug}
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          Standard System Monitor
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                CPU Usage
              </CardTitle>
              <Monitor className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {metrics.cpuUsage}%
            </div>
            <Progress 
              value={metrics.cpuUsage} 
              className={`mt-2 h-2 ${getUsageColor(metrics.cpuUsage)}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Memory Usage
              </CardTitle>
              <Database className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {metrics.memoryUsage}%
            </div>
            <Progress 
              value={metrics.memoryUsage} 
              className={`mt-2 h-2 ${getUsageColor(metrics.memoryUsage)}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Disk Usage
              </CardTitle>
              <Database className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {metrics.diskUsage}%
            </div>
            <Progress 
              value={metrics.diskUsage} 
              className={`mt-2 h-2 ${getUsageColor(metrics.diskUsage)}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Network Latency
              </CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {metrics.networkLatency}ms
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Avg response time
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>System Uptime</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-green-600">
              {metrics.uptime}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Sistema funcionando continuamente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Active Connections</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-blue-600">
              {metrics.activeConnections}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Conexões simultâneas ativas
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}