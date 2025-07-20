'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Clock, CheckCircle, Timer, TrendingUp, TrendingDown } from 'lucide-react';

interface ApprovalsStats {
  totalPending: number;
  approvalRate: number; // percentage
  averageTimeHours: number;
  trend: {
    pending: 'up' | 'down' | 'stable';
    rate: 'up' | 'down' | 'stable';
    time: 'up' | 'down' | 'stable';
  };
}

export function ApprovalsStatsWidget() {
  const [stats, setStats] = useState<ApprovalsStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      // TODO: Replace with actual API call
      const mockStats: ApprovalsStats = {
        totalPending: 8,
        approvalRate: 94.5,
        averageTimeHours: 1.5,
        trend: {
          pending: 'up',
          rate: 'up',
          time: 'down'
        }
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch approval stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-red-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-green-600" />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable', isGoodWhenUp: boolean = false) => {
    if (trend === 'stable') return 'text-zinc-500';
    const isPositive = isGoodWhenUp ? trend === 'up' : trend === 'down';
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estatísticas de Aprovação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
            <div className="h-4 bg-zinc-200 rounded w-1/2"></div>
            <div className="h-4 bg-zinc-200 rounded w-2/3"></div>
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
          <Clock className="h-4 w-4 text-zinc-600" />
          Estatísticas de Aprovação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Pending */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-600">
            Solicitações pendentes
          </div>
          <div className="flex items-center gap-1">
            <span className="text-lg font-medium">{stats.totalPending}</span>
            {getTrendIcon(stats.trend.pending)}
          </div>
        </div>

        {/* Approval Rate */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-600">
            Taxa de aprovação
          </div>
          <div className="flex items-center gap-1">
            <span className="text-lg font-medium">{stats.approvalRate}%</span>
            <span className={`text-xs ${getTrendColor(stats.trend.rate, true)}`}>
              {getTrendIcon(stats.trend.rate)}
            </span>
          </div>
        </div>

        {/* Average Time */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-600">
            Tempo médio
          </div>
          <div className="flex items-center gap-1">
            <span className="text-lg font-medium">{stats.averageTimeHours}h</span>
            <span className={`text-xs ${getTrendColor(stats.trend.time)}`}>
              {getTrendIcon(stats.trend.time)}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="pt-2 border-t">
          <Badge 
            variant={stats.totalPending > 10 ? "destructive" : stats.totalPending > 5 ? "warning" : "success"}
            className="w-full justify-center"
          >
            {stats.totalPending > 10 ? "Alta demanda" : 
             stats.totalPending > 5 ? "Demanda moderada" : 
             "Demanda baixa"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}