'use client';

import { useState, useEffect } from 'react';

interface ModuleImplementation {
  id: string;
  implementation_key: string;
  name: string;
  component_path: string;
  target_audience: string;
  complexity_tier: string;
}

interface Alert {
  id: number;
  title: string;
  message: string;
  type: 'warning' | 'success' | 'info' | 'error';
  timestamp: string;
  status: 'active' | 'acknowledged';
}

interface AlertsData {
  alerts: Alert[];
  summary: {
    total: number;
    active: number;
    acknowledged: number;
  };
}

interface StandardAlertsProps {
  params: { slug: string };
  config: Record<string, any>;
  implementation: ModuleImplementation;
}

export default function StandardAlertsImplementation({ 
  params, 
  config, 
  implementation 
}: StandardAlertsProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AlertsData | null>(null);

  useEffect(() => {
    // Simular carregamento de alertas
    const timer = setTimeout(() => {
      setData({
        alerts: [
          {
            id: 1,
            title: 'Estoque Baixo',
            message: 'Produto XYZ está com apenas 5 unidades em estoque',
            type: 'warning',
            timestamp: '2025-07-11T10:30:00Z',
            status: 'active'
          },
          {
            id: 2,
            title: 'Meta Atingida',
            message: 'Parabéns! Meta de vendas do mês foi atingida',
            type: 'success',
            timestamp: '2025-07-11T09:15:00Z',
            status: 'active'
          },
          {
            id: 3,
            title: 'Sistema Atualizado',
            message: 'Nova versão do sistema foi instalada com sucesso',
            type: 'info',
            timestamp: '2025-07-11T08:00:00Z',
            status: 'acknowledged'
          }
        ],
        summary: {
          total: 3,
          active: 2,
          acknowledged: 1
        }
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return '🚨';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Alert Management
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Sistema de alertas e notificações em tempo real
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
            <strong>Implementação:</strong> {implementation.implementation_key} | 
            <strong> Tier:</strong> {implementation.complexity_tier} | 
            <strong> Config:</strong> {Object.keys(config).length > 0 ? 'Customizada' : 'Padrão'}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">
                  {data?.summary.total}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Alertas</p>
              <p className="text-2xl font-bold text-gray-900">{data?.summary.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-bold text-sm">
                  {data?.summary.active}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Alertas Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{data?.summary.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">
                  {data?.summary.acknowledged}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Reconhecidos</p>
              <p className="text-2xl font-bold text-gray-900">{data?.summary.acknowledged}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Alertas Recentes
          </h3>
          <button className="px-3 py-1 text-sm font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50">
            Configurar Alertas
          </button>
        </div>
        <div className="divide-y divide-gray-200">
          {data?.alerts.map((alert) => (
            <div key={alert.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <span className="text-xl">{getAlertIcon(alert.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {alert.title}
                      </h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAlertColor(alert.type)}`}>
                        {alert.type}
                      </span>
                      {alert.status === 'acknowledged' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Reconhecido
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.timestamp).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  {alert.status === 'active' && (
                    <button className="px-3 py-1 text-xs font-medium text-green-600 border border-green-600 rounded hover:bg-green-50">
                      Reconhecer
                    </button>
                  )}
                  <button className="px-3 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                    Detalhes
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Standard Features */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Recursos Disponíveis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Alertas em Tempo Real</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Notificações por Email</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Classificação por Tipo</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Histórico de Alertas</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Dashboard Básico</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Configuração Simples</span>
          </div>
        </div>
      </div>

      {/* Configuration Display */}
      {Object.keys(config).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Configuração Customizada
          </h3>
          <pre className="text-sm bg-gray-50 p-4 rounded overflow-auto">
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}