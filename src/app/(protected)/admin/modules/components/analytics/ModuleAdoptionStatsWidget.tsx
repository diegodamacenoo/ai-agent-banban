'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { TrendingUp, TrendingDown, Users, Building2 } from 'lucide-react';

interface AdoptionStats {
  totalModules: number;
  highAdoptionModules: number;
  averageAdoptionRate: number;
  totalOrganizations: number;
  activeOrganizations: number;
  trend: 'up' | 'down' | 'stable';
  topModules: Array<{
    name: string;
    adoptionRate: number;
  }>;
}

export function ModuleAdoptionStatsWidget() {
  const [stats, setStats] = useState<AdoptionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdoptionStats();
    
    // Auto-refresh every 10 minutes
    const interval = setInterval(fetchAdoptionStats, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAdoptionStats]); // ✅ Includes dependency used inside the callback

  const fetchAdoptionStats = useCallback(async () => {
    try {
      // TODO: Replace with actual API call
      const mockStats: AdoptionStats = {
        totalModules: 24,
        highAdoptionModules: 8,
        averageAdoptionRate: 67,
        totalOrganizations: 47,
        activeOrganizations: 42,
        trend: 'up',
        topModules: [
          { name: 'Analytics', adoptionRate: 89 },
          { name: 'Inventory', adoptionRate: 84 },
          { name: 'Sales', adoptionRate: 78 }
        ]
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch adoption stats:', error);
    } finally {
      setLoading(false);
    }
  }, []); // ✅ No dependencies needed - only uses state setters

  const getTrendIcon = (trend: AdoptionStats['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend: AdoptionStats['trend']) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-zinc-500';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estatísticas de Adoção</CardTitle>
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

  if (!stats) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-zinc-600" />
          Estatísticas de Adoção
          <Badge variant={stats.trend === 'up' ? 'success' : stats.trend === 'down' ? 'destructive' : 'outline'} className="text-xs">
            {getTrendIcon(stats.trend)}
            {stats.trend === 'up' ? 'Crescendo' : stats.trend === 'down' ? 'Declinando' : 'Estável'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Average Adoption Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Taxa Média de Adoção</span>
            <span className="text-lg font-medium">{stats.averageAdoptionRate}%</span>
          </div>
          
          <Progress value={stats.averageAdoptionRate} className="h-2" />
          
          <div className="text-xs text-zinc-500 text-center">
            {stats.activeOrganizations} de {stats.totalOrganizations} organizações ativas
          </div>
        </div>

        {/* Module Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-green-50 rounded border border-green-200">
            <div className="text-lg font-medium text-green-700">{stats.highAdoptionModules}</div>
            <div className="text-xs text-green-600">Alta adoção</div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded border border-blue-200">
            <div className="text-lg font-medium text-blue-700">{stats.totalModules}</div>
            <div className="text-xs text-blue-600">Total módulos</div>
          </div>
        </div>

        {/* Top Modules */}
        <div className="pt-3 border-t">
          <div className="text-sm font-medium text-zinc-700 mb-2">Módulos Populares</div>
          <div className="space-y-2">
            {stats.topModules.map((module, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="truncate max-w-[80px]">{module.name}</span>
                <Badge variant="success" className="text-xs">
                  {module.adoptionRate}%
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Organization Activity */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-zinc-500" />
              <span className="text-sm">Organizações Ativas</span>
            </div>
            <div className={`flex items-center gap-1 text-sm ${getTrendColor(stats.trend)}`}>
              <span className="font-medium">{stats.activeOrganizations}</span>
              {getTrendIcon(stats.trend)}
            </div>
          </div>
        </div>

        {/* Last Update */}
        <div className="pt-3 border-t">
          <div className="text-xs text-zinc-500 text-center">
            Última atualização: há 10 min
          </div>
        </div>
      </CardContent>
    </Card>
  );
}