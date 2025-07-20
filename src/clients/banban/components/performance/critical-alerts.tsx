'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { 
  AlertTriangle, 
  Clock, 
  Eye,
  ChevronRight
} from 'lucide-react';
import { CriticalAlert } from '../mock-data';

interface CriticalAlertsProps {
  alerts: CriticalAlert[];
  onViewAll?: () => void;
  maxDisplay?: number;
}

function getSeverityColor(severity: CriticalAlert['severity']) {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'low':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function getSeverityLabel(severity: CriticalAlert['severity']) {
  switch (severity) {
    case 'critical':
      return 'Crítico';
    case 'high':
      return 'Alto';
    case 'medium':
      return 'Médio';
    case 'low':
      return 'Baixo';
    default:
      return 'Desconhecido';
  }
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m atrás`;
  } else if (diffInMinutes < 24 * 60) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h atrás`;
  } else {
    const days = Math.floor(diffInMinutes / (24 * 60));
    return `${days}d atrás`;
  }
}

export function CriticalAlerts({ 
  alerts, 
  onViewAll,
  maxDisplay = 3 
}: CriticalAlertsProps) {
  const displayedAlerts = alerts.slice(0, maxDisplay);
  const hasMoreAlerts = alerts.length > maxDisplay;

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-green-600" />
            Alertas Críticos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-green-200 bg-green-50">
            <AlertTriangle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Nenhum alerta crítico no momento. Todos os indicadores estão dentro dos parâmetros normais.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Alertas Críticos
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alerts.length}
              </Badge>
            )}
          </CardTitle>
          
          {hasMoreAlerts && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onViewAll}
              className="text-blue-600 hover:text-blue-700"
            >
              Ver todos
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {displayedAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                    {alert.title}
                  </h4>
                  <Badge 
                    variant="outline" 
                    className={`flex-shrink-0 text-xs ${getSeverityColor(alert.severity)}`}
                  >
                    {getSeverityLabel(alert.severity)}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {alert.description}
                </p>
                
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(alert.timestamp)}
                  </div>
                  <span>•</span>
                  <span>{alert.category}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {hasMoreAlerts && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onViewAll}
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver todos os {alerts.length} alertas
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}