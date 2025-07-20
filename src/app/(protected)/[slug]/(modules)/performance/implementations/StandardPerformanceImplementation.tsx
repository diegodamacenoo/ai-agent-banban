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

interface KPI {
  name: string;
  value: string;
  change: string;
}

interface PerformanceData {
  kpis: KPI[];
}

interface StandardPerformanceProps {
  params: { slug: string };
  config: Record<string, any>;
  implementation: ModuleImplementation;
}

export default function StandardPerformanceImplementation({ 
  params, 
  config, 
  implementation 
}: StandardPerformanceProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PerformanceData | null>(null);

  useEffect(() => {
    // Simular carregamento de dados
    const timer = setTimeout(() => {
      setData({
        kpis: [
          { name: 'Vendas Totais', value: 'R$ 125.300', change: '+12.5%' },
          { name: 'Margem Bruta', value: '34.2%', change: '+2.1%' },
          { name: 'Produtos Ativos', value: '1.248', change: '-3.2%' },
          { name: 'Taxa Conversão', value: '3.8%', change: '+0.9%' }
        ]
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Performance Analytics
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Dashboard padrão de performance e métricas
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
            <strong>Implementação:</strong> {implementation.implementation_key} | 
            <strong> Tier:</strong> {implementation.complexity_tier} | 
            <strong> Config:</strong> {Object.keys(config).length > 0 ? 'Customizada' : 'Padrão'}
          </div>
        )}
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data?.kpis.map((kpi, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {kpi.name}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {kpi.value}
                </p>
              </div>
              <div className={`text-sm font-medium ${
                kpi.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
              }`}>
                {kpi.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Vendas por Período
          </h3>
          <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
            <p className="text-gray-500">Gráfico de vendas - Implementação padrão</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Performance por Categoria
          </h3>
          <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
            <p className="text-gray-500">Gráfico de categorias - Implementação padrão</p>
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

      {/* Standard Features */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Recursos Disponíveis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">KPIs Básicos</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Gráficos Padrão</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Exportação Básica</span>
          </div>
        </div>
      </div>
    </div>
  );
}