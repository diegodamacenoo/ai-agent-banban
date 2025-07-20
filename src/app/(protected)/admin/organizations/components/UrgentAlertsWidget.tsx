'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { AlertTriangle, Clock, Star, Building2 } from 'lucide-react';

interface UrgentAlert {
  id: string;
  type: 'overdue' | 'enterprise' | 'critical_module';
  organizationName: string;
  moduleName: string;
  requestedHours: number;
  priority: 'high' | 'medium' | 'low';
}

export function UrgentAlertsWidget() {
  const [alerts, setAlerts] = useState<UrgentAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUrgentAlerts();
    
    // Auto-refresh every 3 minutes
    const interval = setInterval(fetchUrgentAlerts, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchUrgentAlerts = async () => {
    try {
      // TODO: Replace with actual API call
      const mockAlerts: UrgentAlert[] = [
        {
          id: '1',
          type: 'overdue',
          organizationName: 'Banban Fashion',
          moduleName: 'Analytics Dashboard',
          requestedHours: 25,
          priority: 'high'
        },
        {
          id: '2',
          type: 'enterprise',
          organizationName: 'CA Store',
          moduleName: 'Inventory Module',
          requestedHours: 30,
          priority: 'high'
        },
        {
          id: '3',
          type: 'critical_module',
          organizationName: 'Riachuelo',
          moduleName: 'Payment Gateway',
          requestedHours: 8,
          priority: 'medium'
        }
      ];
      
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Failed to fetch urgent alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: UrgentAlert['type']) => {
    switch (type) {
      case 'overdue':
        return <Clock className="h-4 w-4 text-red-600" />;
      case 'enterprise':
        return <Star className="h-4 w-4 text-purple-600" />;
      case 'critical_module':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-zinc-600" />;
    }
  };

  const getAlertLabel = (type: UrgentAlert['type']) => {
    switch (type) {
      case 'overdue':
        return 'Atrasada';
      case 'enterprise':
        return 'Enterprise';
      case 'critical_module':
        return 'Módulo Crítico';
      default:
        return '';
    }
  };

  const getAlertVariant = (type: UrgentAlert['type']) => {
    switch (type) {
      case 'overdue':
        return 'destructive' as const;
      case 'enterprise':
        return 'secondary' as const;
      case 'critical_module':
        return 'warning' as const;
      default:
        return 'outline' as const;
    }
  };

  const formatTimeAgo = (hours: number) => {
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alertas de Urgência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-zinc-200 rounded w-full"></div>
            <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
            <div className="h-4 bg-zinc-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-zinc-600" />
            Alertas de Urgência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-sm text-zinc-500">
              Nenhum alerta urgente
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              Todas as solicitações estão dentro do prazo
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-amber-400">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          Alertas de Urgência
          <Badge variant="destructive" className="ml-auto">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.slice(0, 3).map((alert) => (
          <div key={alert.id} className="space-y-2 p-3 bg-zinc-50 rounded border">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getAlertIcon(alert.type)}
                <Badge variant={getAlertVariant(alert.type)} className="text-xs">
                  {getAlertLabel(alert.type)}
                </Badge>
              </div>
              <span className="text-xs text-zinc-500">
                {formatTimeAgo(alert.requestedHours)}
              </span>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm">
                <Building2 className="h-3 w-3 text-zinc-500" />
                <span className="font-medium">{alert.organizationName}</span>
              </div>
              <div className="text-sm text-zinc-600 pl-4">
                {alert.moduleName}
              </div>
            </div>
          </div>
        ))}

        {alerts.length > 3 && (
          <div className="text-center pt-2">
            <Button variant="ghost" size="sm" className="text-xs">
              Ver mais {alerts.length - 3} alertas
            </Button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-3 border-t space-y-2">
          <Button size="sm" className="w-full" variant="outline">
            Aprovar Todas Urgentes
          </Button>
          <Button size="sm" className="w-full" variant="ghost">
            Escalar para Supervisor
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}