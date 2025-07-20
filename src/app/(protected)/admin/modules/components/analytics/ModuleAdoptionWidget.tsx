'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { Users, TrendingUp, TrendingDown, Building2 } from 'lucide-react';

interface AdoptionMetrics {
  totalTenants: number;
  activeTenants: number;
  adoptionRate: number;
  newAdoptions: number;
  churnRate: number;
  trend: 'up' | 'down' | 'stable';
  topOrganizations: Array<{
    name: string;
    status: 'ACTIVE' | 'PROVISIONING' | 'DISABLED';
  }>;
}

interface ModuleAdoptionWidgetProps {
  moduleId: string;
}

export function ModuleAdoptionWidget({ moduleId }: ModuleAdoptionWidgetProps) {
  const [metrics, setMetrics] = useState<AdoptionMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdoptionMetrics();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchAdoptionMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [moduleId]);

  const fetchAdoptionMetrics = async () => {
    try {
      // TODO: Replace with actual API call
      const mockMetrics: AdoptionMetrics = {
        totalTenants: 47,
        activeTenants: 32,
        adoptionRate: 68,
        newAdoptions: 5,
        churnRate: 2.1,
        trend: 'up',
        topOrganizations: [
          { name: 'Banban Fashion', status: 'ACTIVE' },
          { name: 'CA Store', status: 'ACTIVE' },
          { name: 'Riachuelo', status: 'PROVISIONING' },
          { name: 'Lojas Americanas', status: 'ACTIVE' },
          { name: 'Casas Bahia', status: 'DISABLED' }
        ]
      };
      
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to fetch adoption metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: AdoptionMetrics['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend: AdoptionMetrics['trend']) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-zinc-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" className="text-xs">Ativo</Badge>;
      case 'provisioning':
        return <Badge variant="warning" className="text-xs">Configurando</Badge>;
      case 'disabled':
        return <Badge variant="outline" className="text-xs">Inativo</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adoção</CardTitle>
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

  if (!metrics) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-zinc-600" />
          Adoção
          <Badge variant={metrics.trend === 'up' ? 'success' : metrics.trend === 'down' ? 'destructive' : 'outline'} className="text-xs">
            {getTrendIcon(metrics.trend)}
            {metrics.trend === 'up' ? 'Crescendo' : metrics.trend === 'down' ? 'Declinando' : 'Estável'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Adoption Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Taxa de Adoção</span>
            <span className="text-lg font-medium">{metrics.adoptionRate}%</span>
          </div>
          
          <Progress value={metrics.adoptionRate} className="h-2" />
          
          <div className="text-xs text-zinc-500 text-center">
            {metrics.activeTenants} de {metrics.totalTenants} organizações
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-green-50 rounded border border-green-200">
            <div className="text-lg font-medium text-green-700">+{metrics.newAdoptions}</div>
            <div className="text-xs text-green-600">Novas adoções</div>
          </div>
          
          <div className="text-center p-3 bg-red-50 rounded border border-red-200">
            <div className="text-lg font-medium text-red-700">{metrics.churnRate}%</div>
            <div className="text-xs text-red-600">Taxa de abandono</div>
          </div>
        </div>

        {/* Top Organizations */}
        <div className="pt-3 border-t">
          <div className="text-sm font-medium text-zinc-700 mb-2">Principais Organizações</div>
          <div className="space-y-2">
            {metrics.topOrganizations.slice(0, 3).map((org, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Building2 className="h-3 w-3 text-zinc-500" />
                  <span className="truncate max-w-[100px]">{org.name}</span>
                </div>
                {getStatusBadge(org.status)}
              </div>
            ))}
            {metrics.topOrganizations.length > 3 && (
              <div className="text-xs text-zinc-500 text-center pt-1">
                +{metrics.topOrganizations.length - 3} mais
              </div>
            )}
          </div>
        </div>

        {/* Adoption Trend */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Tendência</span>
            <div className={`flex items-center gap-1 text-sm ${getTrendColor(metrics.trend)}`}>
              {getTrendIcon(metrics.trend)}
              <span className="font-medium">
                {metrics.trend === 'up' ? 'Crescimento' : 
                 metrics.trend === 'down' ? 'Declínio' : 'Estável'}
              </span>
            </div>
          </div>
        </div>

        {/* Usage Status */}
        <div className="pt-3 border-t">
          <div className="text-xs text-zinc-500 text-center">
            Última atualização: há 5 min
          </div>
        </div>
      </CardContent>
    </Card>
  );
}