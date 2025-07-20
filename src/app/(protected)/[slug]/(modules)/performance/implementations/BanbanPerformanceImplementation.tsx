'use client';

// AIDEV-NOTE: banban-migration; wrapper para componente existente do Banban
import { PerformancePage as BanbanPerformancePage } from '@/clients/banban/components/performance';

interface ModuleImplementation {
  id: string;
  implementation_key: string;
  name: string;
  component_path: string;
  target_audience: string;
  complexity_tier: string;
}

interface BanbanPerformanceProps {
  params: { slug: string };
  config: Record<string, any>;
  implementation: ModuleImplementation;
}

export default function BanbanPerformanceImplementation({ 
  params, 
  config, 
  implementation 
}: BanbanPerformanceProps) {
  
  // Mesclar configuração padrão com customizada
  const enhancedConfig = {
    // Configurações padrão do Banban
    theme: 'banban',
    specialization: 'fashion',
    advanced_features: true,
    industry: 'fashion',
    client: 'banban',
    
    // Configurações customizadas do tenant
    ...config,
    
    // Metadados da nova arquitetura
    _module: {
      implementation: implementation.implementation_key,
      tier: implementation.complexity_tier,
      component_path: implementation.component_path,
      migrated_from: 'legacy_system'
    }
  };

  // Log para debug durante migração
  if (process.env.NODE_ENV === 'development') {
    console.debug('[BANBAN-PERFORMANCE] Carregando com configuração:', enhancedConfig);
  }

  return (
    <div className="banban-performance-wrapper">
      {/* Header de debug durante migração */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-purple-800 mb-2">
            🔄 Migração: Nova Arquitetura de Módulos
          </h4>
          <div className="text-xs text-purple-700 space-y-1">
            <div><strong>Implementação:</strong> {implementation.name}</div>
            <div><strong>Tier:</strong> {implementation.complexity_tier}</div>
            <div><strong>Tenant:</strong> {params.slug}</div>
            <div><strong>Config Customizada:</strong> {Object.keys(config).length > 0 ? 'Sim' : 'Não'}</div>
          </div>
        </div>
      )}

      {/* Componente Banban existente */}
      <BanbanPerformancePage 
        params={{ ...params, module: 'performance' }}
      />
      
      {/* Configuração expandida para debug */}
      {process.env.NODE_ENV === 'development' && Object.keys(config).length > 0 && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <details>
            <summary className="text-sm font-medium text-gray-700 cursor-pointer">
              Configuração Customizada (Debug)
            </summary>
            <pre className="mt-2 text-xs bg-white p-3 rounded border overflow-auto">
              {JSON.stringify(enhancedConfig, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}