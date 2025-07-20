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

interface Insight {
  id: number;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  impact: 'positive' | 'negative' | 'neutral';
}

interface InsightsData {
  insights: Insight[];
  summary: {
    totalInsights: number;
    actionableItems: number;
    trends: string;
  };
}

interface StandardInsightsProps {
  params: { slug: string };
  config: Record<string, any>;
  implementation: ModuleImplementation;
}

export default function StandardInsightsImplementation({ 
  params, 
  config, 
  implementation 
}: StandardInsightsProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InsightsData | null>(null);

  useEffect(() => {
    // Simular carregamento de insights
    const timer = setTimeout(() => {
      setData({
        insights: [
          {
            id: 1,
            title: 'Vendas em Alta',
            description: 'Crescimento de 15% nas vendas este mês comparado ao anterior',
            priority: 'high',
            category: 'sales',
            impact: 'positive'
          },
          {
            id: 2,
            title: 'Estoque Baixo',
            description: '23 produtos com estoque abaixo do mínimo recomendado',
            priority: 'medium',
            category: 'inventory',
            impact: 'negative'
          },
          {
            id: 3,
            title: 'Novo Segmento',
            description: 'Identificado novo segmento de clientes com potencial de 30% de aumento nas vendas',
            priority: 'high',
            category: 'customers',
            impact: 'positive'
          }
        ],
        summary: {
          totalInsights: 3,
          actionableItems: 2,
          trends: 'positive'
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
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return '📈';
      case 'warning': return '⚠️';
      case 'negative': return '📉';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Smart Insights
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Análises inteligentes e insights automatizados para seu negócio
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
                  {data?.summary.totalInsights}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Insights</p>
              <p className="text-2xl font-bold text-gray-900">{data?.summary.totalInsights}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">
                  {data?.summary.actionableItems}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Itens Acionáveis</p>
              <p className="text-2xl font-bold text-gray-900">{data?.summary.actionableItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tendência Geral</p>
              <p className="text-2xl font-bold text-green-600 capitalize">{data?.summary.trends}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights List */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Insights Recentes
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {data?.insights.map((insight) => (
            <div key={insight.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{getImpactIcon(insight.impact)}</span>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {insight.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {insight.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(insight.priority)}`}>
                        {insight.priority}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {insight.category}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="ml-4 px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50">
                  Ver Detalhes
                </button>
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
            <span className="text-sm text-gray-700">Insights Básicos</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Análise de Tendências</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Relatórios Automáticos</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Alertas por Email</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Dashboard Padrão</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Exportação CSV</span>
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