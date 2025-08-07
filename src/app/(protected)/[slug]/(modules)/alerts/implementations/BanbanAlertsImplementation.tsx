'use client';

import { Suspense } from 'react';
import { 
  AlertTriangle, 
  Bell, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Package,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  Zap
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { useAlerts } from '../hooks/useAlerts';
import { AlertSeverity, AlertType, AlertStatus } from '@/core/modules/banban/alerts/services/alert-processor';

interface ModuleImplementation {
  id: string;
  implementation_key: string;
  name: string;
  component_path: string;
  [key: string]: any;
}

interface BanbanAlertsProps {
  params: { slug: string };
  config: Record<string, any>;
  implementation: ModuleImplementation;
}

function AlertCard({ alert, onAcknowledge, onResolve }: any) {
  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case AlertSeverity.WARNING:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case AlertSeverity.INFO:
        return <Info className="w-5 h-5 text-blue-500" />;
      case AlertSeverity.OPPORTUNITY:
        return <Zap className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return 'border-red-200 bg-red-50';
      case AlertSeverity.WARNING:
        return 'border-yellow-200 bg-yellow-50';
      case AlertSeverity.INFO:
        return 'border-blue-200 bg-blue-50';
      case AlertSeverity.OPPORTUNITY:
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case AlertStatus.ACTIVE:
        return <Badge variant="destructive">Ativo</Badge>;
      case AlertStatus.ACKNOWLEDGED:
        return <Badge variant="secondary">Reconhecido</Badge>;
      case AlertStatus.RESOLVED:
        return <Badge variant="default">Resolvido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className={`${getSeverityColor(alert.severity)} hover:shadow-md transition-shadow`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {getSeverityIcon(alert.severity)}
            <CardTitle className="text-sm font-medium">{alert.title}</CardTitle>
          </div>
          {getStatusBadge(alert.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-700">{alert.message}</p>
        
        {alert.metadata && (
          <div className="space-y-1 text-xs text-gray-600">
            <div>SKU: {alert.metadata.sku}</div>
            {alert.metadata.store && <div>Loja: {alert.metadata.store}</div>}
            {alert.daysUntilCritical && (
              <div className="text-orange-600 font-medium">
                ⏰ {alert.daysUntilCritical} dias até crítico
              </div>
            )}
            {alert.autoEscalate && (
              <div className="text-purple-600 font-medium">
                🔄 Escalação automática: {alert.escalationLevel || 0}/3
              </div>
            )}
            {alert.nextEscalationAt && (
              <div className="text-yellow-600 text-xs">
                ⏰ Próxima escalação: {new Date(alert.nextEscalationAt).toLocaleTimeString()}
              </div>
            )}
          </div>
        )}

        {alert.status === AlertStatus.ACTIVE && (
          <div className="flex space-x-2 pt-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onAcknowledge(alert.id)}
              className="text-xs"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Reconhecer
            </Button>
            <Button 
              size="sm" 
              variant="default"
              onClick={() => onResolve(alert.id)}
              className="text-xs"
            >
              Resolver
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function BanbanAlertsImplementation({ params, config, implementation }: BanbanAlertsProps) {
  const { 
    alerts, 
    loading, 
    error, 
    summary,
    metrics,
    config: moduleConfig,
    refreshAlerts,
    acknowledgeAlert,
    resolveAlert,
    getAnalytics 
  } = useAlerts({
    organizationId: params.slug, // Usando slug como organizationId
    autoRefresh: true,
    refreshInterval: 300000 // 5 minutos
  });

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">Erro ao Carregar Alertas</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refreshAlerts}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Bell className="w-6 h-6 mr-3 text-blue-600" />
            Alertas BanBan Fashion
          </h1>
          <p className="text-gray-600 mt-1">
            Sistema inteligente de alertas para varejo de moda • v{moduleConfig.version}
            {moduleConfig.escalationEnabled && <span className="ml-2 text-xs text-green-600">• Escalação Ativa</span>}
            {moduleConfig.metricsEnabled && <span className="ml-1 text-xs text-blue-600">• Analytics</span>}
          </p>
        </div>
        <Button 
          onClick={refreshAlerts}
          variant="outline"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.critical}</div>
            <p className="text-xs text-red-600 mt-1">Requerem ação imediata</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Avisos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.warning}</div>
            <p className="text-xs text-yellow-600 mt-1">Necessitam atenção</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
              <Info className="w-4 h-4 mr-2" />
              Informativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.info}</div>
            <p className="text-xs text-blue-600 mt-1">Para acompanhamento</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              Oportunidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.opportunity}</div>
            <p className="text-xs text-green-600 mt-1">Ações estratégicas</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Alertas Ativos ({summary.active})
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Package className="w-4 h-4" />
            <span>Total: {summary.total}</span>
          </div>
        </div>

        {alerts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum alerta ativo</h3>
              <p className="text-gray-500">Tudo funcionando perfeitamente! 🎉</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts
              .filter(alert => alert.status === AlertStatus.ACTIVE)
              .map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={acknowledgeAlert}
                  onResolve={resolveAlert}
                />
              ))}
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      {metrics && moduleConfig.metricsEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Métricas de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.avgProcessingTime.toFixed(0)}ms
                </div>
                <div className="text-xs text-gray-600">Tempo Médio de Processamento</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(metrics.deliverySuccessRate * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">Taxa de Entrega</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {(metrics.escalationRate * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">Taxa de Escalação</div>
              </div>
            </div>
            
            {!metrics.healthStatus.healthy && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <div className="flex items-center text-red-700 text-sm font-medium mb-2">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Problemas de Performance Detectados
                </div>
                <ul className="text-xs text-red-600 space-y-1">
                  {metrics.healthStatus.issues.map((issue, index) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* System Info */}
      {Object.keys(config).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Configuração do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-medium text-gray-700 mb-2">Features Ativas:</div>
                <ul className="space-y-1">
                  {moduleConfig.features.map(feature => (
                    <li key={feature} className="text-green-600">✓ {feature}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-medium text-gray-700 mb-2">Configuração:</div>
                <pre className="bg-gray-50 p-2 rounded overflow-auto text-xs">
                  {JSON.stringify({
                    version: moduleConfig.version,
                    escalation: moduleConfig.escalationEnabled,
                    analytics: moduleConfig.metricsEnabled
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}