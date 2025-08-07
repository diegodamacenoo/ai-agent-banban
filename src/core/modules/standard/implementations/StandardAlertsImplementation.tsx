'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface StandardAlertsImplementationProps {
  params: { slug: string };
  config: Record<string, any>;
  implementation: any;
}

interface AlertData {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved';
  timestamp: string;
}

export default function StandardAlertsImplementation({ 
  params, 
  config, 
  implementation 
}: StandardAlertsImplementationProps) {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados padrão
    const mockAlerts: AlertData[] = [
      {
        id: '1',
        title: 'Sistema de Backup',
        description: 'Backup diário executado com sucesso',
        severity: 'low',
        status: 'resolved',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Uso de CPU Elevado',
        description: 'CPU acima de 80% nos últimos 10 minutos',
        severity: 'medium',
        status: 'active',
        timestamp: new Date().toISOString(),
      }
    ];

    setTimeout(() => {
      setAlerts(mockAlerts);
      setLoading(false);
    }, 800);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertas do Sistema</h1>
          <p className="text-gray-600">
            Implementação padrão para {params.slug}
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          Standard
        </Badge>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <Card key={alert.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Bell className="h-5 w-5 mt-0.5 text-gray-600" />
                  <div>
                    <CardTitle className="text-lg">{alert.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {alert.description}
                    </p>
                  </div>
                </div>
                <Badge className={getSeverityColor(alert.severity)}>
                  {alert.severity.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {new Date(alert.timestamp).toLocaleString('pt-BR')}
                </span>
                {alert.status === 'active' && (
                  <Button size="sm">
                    Marcar como Resolvido
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {alerts.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Nenhum alerta disponível no momento.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}