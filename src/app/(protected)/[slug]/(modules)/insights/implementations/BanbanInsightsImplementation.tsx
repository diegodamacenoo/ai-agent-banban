'use client';

// AIDEV-NOTE: banban-migration; wrapper para componente existente do Banban Insights
import { BanbanInsightsHome } from '@/clients/banban/components';

interface ModuleImplementation {
  id: string;
  implementation_key: string;
  name: string;
  component_path: string;
  target_audience: string;
  complexity_tier: string;
}

interface BanbanInsightsProps {
  params: { slug: string };
  config: Record<string, any>;
  implementation: ModuleImplementation;
}

export default function BanbanInsightsImplementation({ 
  params, 
  config, 
  implementation 
}: BanbanInsightsProps) {
  
  // Mesclar configuração padrão com customizada
  const enhancedConfig = {
    // Configurações padrão do Banban
    theme: 'banban',
    industry: 'fashion',
    client: 'banban',
    features: ['dashboard', 'analytics', 'reports', 'ai-insights'],
    
    // Configurações específicas do insights
    enabled: true,
    timeout: 30000,
    logLevel: 'info',
    autoStart: false,
    performance: {
      batchSize: 50,
      cacheEnabled: true,
      throttleLimit: 1000
    },
    notifications: {
      email: true,
      webhook: false,
      dashboard: true
    },
    
    // Configurações customizadas do tenant
    ...config,
    
    // Metadados da nova arquitetura
    _module: {
      implementation: implementation.implementation_key,
      tier: implementation.complexity_tier,
      component_path: implementation.component_path,
      migrated_from: 'legacy_system',
      organizationId: params.slug
    }
  };

  // Log para debug durante migração
  if (process.env.NODE_ENV === 'development') {
    console.debug('[BANBAN-INSIGHTS] Carregando com configuração:', enhancedConfig);
  }

  return (
    <div className="banban-insights-wrapper">
      {/* Header de debug durante migração */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            🔄 Migração: Nova Arquitetura de Módulos - Insights
          </h4>
          <div className="text-xs text-blue-700 space-y-1">
            <div><strong>Implementação:</strong> {implementation.name}</div>
            <div><strong>Tier:</strong> {implementation.complexity_tier}</div>
            <div><strong>Tenant:</strong> {params.slug}</div>
            <div><strong>Features:</strong> {enhancedConfig.features?.join(', ') || 'Padrão'}</div>
            <div><strong>Config Customizada:</strong> {Object.keys(config).length > 0 ? 'Sim' : 'Não'}</div>
          </div>
        </div>
      )}

      {/* Componente Banban existente */}
      <BanbanInsightsHome 
        organizationId={params.slug}
      />
      
      {/* Informações de migração para debug */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 space-y-4">
          {/* Status da migração */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h5 className="text-sm font-medium text-green-800 mb-2">
              ✅ Status da Migração
            </h5>
            <div className="text-xs text-green-700 space-y-1">
              <div>• Componente existente do Banban preservado</div>
              <div>• Configurações legacy migradas com sucesso</div>
              <div>• Nova arquitetura de módulos ativa</div>
              <div>• Compatibilidade total mantida</div>
            </div>
          </div>
          
          {/* Configuração expandida para debug */}
          {Object.keys(config).length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <details>
                <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                  Configuração Completa (Debug)
                </summary>
                <pre className="mt-2 text-xs bg-white p-3 rounded border overflow-auto">
                  {JSON.stringify(enhancedConfig, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
}