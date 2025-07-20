// ========================================
// FASE 4: SCRIPT PARA CRIAR MÓDULOS RESTANTES
// Data: 2025-07-11
// Objetivo: Gerar estrutura para alerts, inventory e analytics
// ========================================

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Configuração dos módulos restantes
const modules = [
  {
    slug: 'alerts',
    name: 'Alert Management',
    description: 'Sistema de alertas e notificações em tempo real',
    category: 'monitoring',
    banbanComponent: '@/clients/banban/components/BanbanAlertsManager'
  },
  {
    slug: 'inventory',
    name: 'Inventory Management', 
    description: 'Gestão e controle de estoque com análises avançadas',
    category: 'operations',
    banbanComponent: '@/clients/banban/components/BanbanInventoryAnalytics'
  },
  {
    slug: 'analytics',
    name: 'General Analytics',
    description: 'Análises gerais e dashboards estatísticos',
    category: 'analytics',
    banbanComponent: '@/clients/banban/components/BanbanAnalytics'
  }
];

// Template para page.tsx de cada módulo
function generatePageTemplate(module: any): string {
  return `import { Suspense, lazy } from 'react';
import { notFound } from 'next/navigation';
import { getModuleImplementation, logModuleOperation } from '@/lib/modules';

// AIDEV-NOTE: module-router; dynamic imports for ${module.slug} implementations
// Imports dinâmicos das implementações
const StandardImplementation = lazy(() => import('./implementations/Standard${module.slug.charAt(0).toUpperCase() + module.slug.slice(1)}Implementation'));
const BanbanImplementation = lazy(() => import('./implementations/Banban${module.slug.charAt(0).toUpperCase() + module.slug.slice(1)}Implementation'));
const EnterpriseImplementation = lazy(() => import('./implementations/Enterprise${module.slug.charAt(0).toUpperCase() + module.slug.slice(1)}Implementation'));

// Mapeamento de implementações
const implementationMap = {
  'standard': StandardImplementation,
  'banban': BanbanImplementation,
  'enterprise': EnterpriseImplementation,
} as const;

// Loading skeleton específico do módulo
function ModuleLoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}

interface ${module.slug.charAt(0).toUpperCase() + module.slug.slice(1)}PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ${module.slug.charAt(0).toUpperCase() + module.slug.slice(1)}Page({ params }: ${module.slug.charAt(0).toUpperCase() + module.slug.slice(1)}PageProps) {
  const { slug } = await params;

  try {
    // Buscar implementação ativa para este tenant
    const moduleResult = await getModuleImplementation(slug, '${module.slug}');

    if (!moduleResult) {
      logModuleOperation('MODULE_NOT_FOUND', slug, '${module.slug}');
      notFound();
    }

    const { implementation, config, isActive } = moduleResult;

    if (!isActive) {
      logModuleOperation('MODULE_INACTIVE', slug, '${module.slug}', { implementation: implementation.implementation_key });
      return (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Módulo ${module.name} Inativo
            </h2>
            <p className="text-gray-600">
              Este módulo não está ativo para sua organização.
            </p>
          </div>
        </div>
      );
    }

    // Selecionar implementação baseada na chave
    const ImplementationComponent = implementationMap[implementation.implementation_key as keyof typeof implementationMap] 
      || implementationMap['standard'];

    logModuleOperation('MODULE_LOADED', slug, '${module.slug}', {
      implementation: implementation.implementation_key,
      component: implementation.component_path,
      hasCustomConfig: Object.keys(config).length > 0
    });

    return (
      <Suspense fallback={<ModuleLoadingSkeleton />}>
        <ImplementationComponent 
          params={params}
          config={config}
          implementation={implementation}
        />
      </Suspense>
    );

  } catch (error) {
    console.error('Erro ao carregar módulo ${module.name}:', error);
    logModuleOperation('MODULE_ERROR', slug, '${module.slug}', { error: error.message });
    
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Erro ao Carregar Módulo
          </h2>
          <p className="text-gray-600 mb-4">
            Ocorreu um erro ao carregar o módulo ${module.name}.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }
}

// Metadata para SEO
export async function generateMetadata({ params }: ${module.slug.charAt(0).toUpperCase() + module.slug.slice(1)}PageProps) {
  const { slug } = await params;
  return {
    title: \`${module.name} - \${slug}\`,
    description: '${module.description}'
  };
}`;
}

// Template para implementação Banban
function generateBanbanImplementation(module: any): string {
  const componentName = module.banbanComponent.split('/').pop();
  
  return `'use client';

// AIDEV-NOTE: banban-migration; wrapper para componente existente do Banban ${module.slug}
import { ${componentName} } from '${module.banbanComponent}';

interface ModuleImplementation {
  id: string;
  implementation_key: string;
  name: string;
  component_path: string;
  target_audience: string;
  complexity_tier: string;
}

interface Banban${module.slug.charAt(0).toUpperCase() + module.slug.slice(1)}Props {
  params: { slug: string };
  config: Record<string, any>;
  implementation: ModuleImplementation;
}

export default function Banban${module.slug.charAt(0).toUpperCase() + module.slug.slice(1)}Implementation({ 
  params, 
  config, 
  implementation 
}: Banban${module.slug.charAt(0).toUpperCase() + module.slug.slice(1)}Props) {
  
  // Mesclar configuração padrão com customizada
  const enhancedConfig = {
    // Configurações padrão do Banban
    theme: 'banban',
    industry: 'fashion',
    client: 'banban',
    
    // Configurações específicas do ${module.slug}
    ${module.slug === 'alerts' ? `
    enabled: true,
    auto_notifications: true,
    features: ['banban-alerts', 'notifications', 'dashboard'],` : ''}
    ${module.slug === 'inventory' ? `
    real_time: true,
    features: ['stock-control', 'alerts', 'analytics'],` : ''}
    ${module.slug === 'analytics' ? `
    dashboards: ['sales', 'customers', 'products'],
    advanced_features: true,` : ''}
    
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
    console.debug('[BANBAN-${module.slug.toUpperCase()}] Carregando com configuração:', enhancedConfig);
  }

  return (
    <div className="banban-${module.slug}-wrapper">
      {/* Header de debug durante migração */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-orange-800 mb-2">
            🔄 Migração: Nova Arquitetura de Módulos - ${module.name}
          </h4>
          <div className="text-xs text-orange-700 space-y-1">
            <div><strong>Implementação:</strong> {implementation.name}</div>
            <div><strong>Tier:</strong> {implementation.complexity_tier}</div>
            <div><strong>Tenant:</strong> {params.slug}</div>
            <div><strong>Config Customizada:</strong> {Object.keys(config).length > 0 ? 'Sim' : 'Não'}</div>
          </div>
        </div>
      )}

      {/* Componente Banban existente */}
      <${componentName}
        tenantSlug={params.slug}
        config={enhancedConfig}
        // Props adicionais para compatibilidade
        {...params}
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
}`;
}

// Template para implementação padrão
function generateStandardImplementation(module: any): string {
  return `'use client';

import { useState, useEffect } from 'react';

interface ModuleImplementation {
  id: string;
  implementation_key: string;
  name: string;
  component_path: string;
  target_audience: string;
  complexity_tier: string;
}

interface Standard${module.slug.charAt(0).toUpperCase() + module.slug.slice(1)}Props {
  params: { slug: string };
  config: Record<string, any>;
  implementation: ModuleImplementation;
}

export default function Standard${module.slug.charAt(0).toUpperCase() + module.slug.slice(1)}Implementation({ 
  params, 
  config, 
  implementation 
}: Standard${module.slug.charAt(0).toUpperCase() + module.slug.slice(1)}Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    // Simular carregamento de dados
    const timer = setTimeout(() => {
      setData({
        // Dados específicos do módulo ${module.slug}
        summary: 'Implementação padrão do módulo ${module.name}'
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
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          ${module.name}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          ${module.description}
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
            <strong>Implementação:</strong> {implementation.implementation_key} | 
            <strong> Tier:</strong> {implementation.complexity_tier} | 
            <strong> Config:</strong> {Object.keys(config).length > 0 ? 'Customizada' : 'Padrão'}
          </div>
        )}
      </div>

      {/* Conteúdo específico do módulo ${module.slug} */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Dashboard ${module.name}
        </h3>
        <p className="text-gray-600">
          Esta é a implementação padrão do módulo ${module.name}.
          Configure funcionalidades específicas através das configurações customizadas.
        </p>
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
}`;
}

// Função principal para gerar todos os arquivos
function generateModuleFiles() {
  const baseDir = 'src/app/(protected)/[slug]/(modules)';

  modules.forEach(module => {
    const moduleDir = join(baseDir, module.slug);
    const implementationsDir = join(moduleDir, 'implementations');

    // Criar diretórios
    mkdirSync(implementationsDir, { recursive: true });

    // Gerar page.tsx
    const pageContent = generatePageTemplate(module);
    writeFileSync(join(moduleDir, 'page.tsx'), pageContent);

    // Gerar implementação Banban
    const banbanContent = generateBanbanImplementation(module);
    writeFileSync(
      join(implementationsDir, `Banban${module.slug.charAt(0).toUpperCase() + module.slug.slice(1)}Implementation.tsx`), 
      banbanContent
    );

    // Gerar implementação padrão
    const standardContent = generateStandardImplementation(module);
    writeFileSync(
      join(implementationsDir, `Standard${module.slug.charAt(0).toUpperCase() + module.slug.slice(1)}Implementation.tsx`), 
      standardContent
    );

    console.log(`✅ Módulo ${module.slug} criado com sucesso!`);
  });

  console.log('\n🎉 Todos os módulos foram criados com sucesso!');
  console.log('\nPróximos passos:');
  console.log('1. Revisar os arquivos gerados');
  console.log('2. Ajustar imports dos componentes Banban');
  console.log('3. Testar cada módulo individualmente');
  console.log('4. Implementar funcionalidades específicas');
}

// Executar se chamado diretamente
if (require.main === module) {
  generateModuleFiles();
}

export { generateModuleFiles, modules };