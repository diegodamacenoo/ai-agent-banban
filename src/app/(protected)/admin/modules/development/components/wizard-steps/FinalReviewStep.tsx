'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { 
  FileCheck, 
  CheckSquare, 
  AlertCircle, 
  Loader2, 
  Package,
  Wrench,
  Building2,
  CheckCircle2,
  ExternalLink,
  Code,
  Settings,
  Play,
  FileText,
  Clock
} from 'lucide-react';
import { useModuleWizardContext } from '../../../contexts/ModuleWizardContext';
import { createFullModule } from '@/app/actions/admin/modules/base-modules';
import { InteractiveChecklistItem, ChecklistTask } from '../checklist/InteractiveChecklistItem';
import { useChecklistProgress } from '../../hooks/useChecklistProgress';

// Componente para o checklist de implementação usando o sistema completo
function ChecklistImplementacao({ config, creationResult }: { config: any, creationResult: any }) {
  const moduleDirectory = config.basic?.route_pattern || config.basic?.slug || 'new-module';
  const componentPath = config.implementation?.component_path || `${config.basic?.slug}Implementation`;
  const clientSlug = config.client_assignment?.selectedOrganization?.slug || 'tenant';
  
  const tasks: ChecklistTask[] = [
    {
      id: 'create-unified-structure',
      title: '1. Criar estrutura unificada (Core + Frontend)',
      description: `Criar a estrutura de diretórios para o módulo em src/core/modules/${moduleDirectory}/`,
      completed: false,
      estimatedTime: '5 min',
      actionType: 'open-folder',
      actionData: {
        path: `${process.cwd()}/src/core/modules/`
      },
      instructions: {
        summary: 'Crie a estrutura de pastas necessária para o novo módulo seguindo a convenção da arquitetura unificada.',
        commands: [
          `mkdir -p src/core/modules/${moduleDirectory}`,
          `mkdir -p src/core/modules/${moduleDirectory}/components`,
          `mkdir -p src/core/modules/${moduleDirectory}/hooks`,
          `mkdir -p src/core/modules/${moduleDirectory}/types`,
          `mkdir -p src/core/modules/${moduleDirectory}/utils`
        ],
        notes: [
          'A estrutura unificada centraliza tanto lógica de negócio quanto componentes UI',
          'Cada módulo deve ser auto-contido e reutilizável',
          'Use kebab-case para nomes de diretórios'
        ]
      }
    },
    {
      id: 'implement-module-interface',
      title: '2. Implementar ModuleInterface',
      description: `Criar o arquivo index.ts com a interface do módulo`,
      completed: false,
      estimatedTime: '10 min',
      actionType: 'open-file',
      actionData: {
        filePath: `${process.cwd()}/src/core/modules/${moduleDirectory}/index.ts`
      },
      instructions: {
        summary: 'Implemente a interface principal do módulo que será utilizada pelo sistema de registro dinâmico.',
        codeExample: `// src/core/modules/${moduleDirectory}/index.ts
import { ModuleInterface } from '@/core/modules/types';
import { ${componentPath} } from './${componentPath}';

export const ${config.basic?.slug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Module: ModuleInterface = {
  id: '${config.basic?.slug}',
  name: '${config.basic?.name}',
  description: '${config.basic?.description}',
  version: '${config.basic?.version || '1.0.0'}',
  category: '${config.basic?.category}',
  component: ${componentPath},
  permissions: [],
  dependencies: [],
  metadata: {
    supports_multi_tenant: ${config.basic?.supports_multi_tenant ?? true},
    route_pattern: '${moduleDirectory}'
  }
};`,
        notes: [
          'Esta interface é usada pelo DynamicModuleRegistry para carregamento dinâmico',
          'O campo "component" deve referenciar o componente React principal',
          'Mantenha consistência com os dados salvos no banco de dados'
        ]
      }
    },
    {
      id: 'verify-wizard-records',
      title: '3. Verificar registros criados pelo wizard',
      description: 'Confirmar que o módulo base e implementação foram criados corretamente no sistema',
      completed: false,
      estimatedTime: '2 min',
      actionType: 'external-link',
      actionData: {
        url: '/admin/modules/management'
      }
    },
    {
      id: 'create-backend-module',
      title: '4. Criar módulo backend (Fastify)',
      description: `Criar estrutura backend em backend/src/modules/base/${moduleDirectory}/`,
      completed: false,
      estimatedTime: '15 min',
      actionType: 'open-folder',
      actionData: {
        path: `${process.cwd()}/backend/src/modules/base/`
      }
    },
    {
      id: 'create-typescript-types',
      title: '5. Criar tipos TypeScript do Core',
      description: `Definir interfaces e tipos em src/core/modules/${moduleDirectory}/types.ts`,
      completed: false,
      estimatedTime: '8 min',
      actionType: 'open-file',
      actionData: {
        filePath: `${process.cwd()}/src/core/modules/${moduleDirectory}/types.ts`
      }
    },
    {
      id: 'plan-database-schema',
      title: '6. Planejar schema da tabela',
      description: 'Definir estrutura das tabelas necessárias para o módulo',
      completed: false,
      estimatedTime: '10 min',
      actionType: 'open-folder',
      actionData: {
        path: `${process.cwd()}/supabase/migrations/`
      }
    },
    {
      id: 'create-sql-migration',
      title: '7. Criar migração SQL',
      description: `Executar: npx supabase migration new ${config.basic?.slug?.replace(/-/g, '_')}_tables`,
      completed: false,
      estimatedTime: '12 min',
      actionType: 'open-folder',
      actionData: {
        path: `${process.cwd()}/supabase/migrations/`
      },
      instructions: {
        summary: 'Crie as tabelas necessárias para o módulo com estrutura adequada para multi-tenancy.',
        commands: [
          `npx supabase migration new ${config.basic?.slug?.replace(/-/g, '_')}_tables`,
          'npx supabase gen types typescript --linked > src/types/database.types.ts'
        ],
        codeExample: `-- Exemplo de estrutura de tabela para o módulo
CREATE TABLE IF NOT EXISTS public.${config.basic?.slug?.replace(/-/g, '_')}_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS ${config.basic?.slug?.replace(/-/g, '_')}_data_tenant_id_idx ON public.${config.basic?.slug?.replace(/-/g, '_')}_data(tenant_id);
CREATE INDEX IF NOT EXISTS ${config.basic?.slug?.replace(/-/g, '_')}_data_created_at_idx ON public.${config.basic?.slug?.replace(/-/g, '_')}_data(created_at);`,
        notes: [
          'Sempre inclua tenant_id para suporte multi-tenant',
          'Use UUIDs como chave primária',
          'Inclua campos created_at e updated_at',
          'Crie índices adequados para performance'
        ]
      }
    },
    {
      id: 'configure-rls-policies',
      title: '8. Configurar RLS policies',
      description: 'Implementar Row Level Security para as tabelas do módulo',
      completed: false,
      estimatedTime: '15 min',
      actionType: 'external-link',
      actionData: {
        url: 'https://supabase.com/docs/guides/auth/row-level-security'
      }
    },
    {
      id: 'create-server-actions',
      title: '9. Criar Server Actions CRUD',
      description: `Implementar actions em src/app/actions/modules/${moduleDirectory}/`,
      completed: false,
      estimatedTime: '20 min',
      actionType: 'open-folder',
      actionData: {
        path: `${process.cwd()}/src/app/actions/`
      },
      instructions: {
        summary: 'Implemente Server Actions para operações CRUD seguindo os padrões de segurança e autenticação.',
        commands: [
          `mkdir -p src/app/actions/modules/${moduleDirectory}`,
          `touch src/app/actions/modules/${moduleDirectory}/index.ts`
        ],
        codeExample: `'use server';

import { createServerClient } from '@/core/supabase/server';
import { getCurrentUser } from '@/core/auth/session-manager';
import { revalidatePath } from 'next/cache';

interface Create${config.basic?.slug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Data {
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

export async function create${config.basic?.slug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}(data: Create${config.basic?.slug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Data) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const supabase = createServerClient();
    
    const { data: result, error } = await supabase
      .from('${config.basic?.slug?.replace(/-/g, '_')}_data')
      .insert({
        tenant_id: user.id,
        title: data.title,
        description: data.description,
        metadata: data.metadata || {}
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/[slug]/${moduleDirectory}');
    return { success: true, data: result };
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno' 
    };
  }
}`,
        notes: [
          'Sempre valide autenticação antes de operações',
          'Use revalidatePath para invalidar cache',
          'Implemente tratamento completo de erros',
          'Siga o padrão { success, data, error } para respostas'
        ]
      }
    },
    {
      id: 'create-main-page',
      title: '10. Criar arquivo principal page.tsx',
      description: `Implementar página principal em src/app/(protected)/[slug]/(modules)/${moduleDirectory}/page.tsx`,
      completed: false,
      estimatedTime: '10 min',
      actionType: 'open-folder',
      actionData: {
        path: `${process.cwd()}/src/app/(protected)/[slug]/(modules)/`
      }
    },
    {
      id: 'create-implementations',
      title: '11. Criar implementações específicas',
      description: `Implementar ${componentPath}.tsx com a lógica específica do módulo`,
      completed: false,
      estimatedTime: '25 min',
      actionType: 'open-file',
      actionData: {
        filePath: `${process.cwd()}/src/core/modules/${moduleDirectory}/${componentPath}.tsx`
      },
      instructions: {
        summary: 'Crie o componente React principal que implementa a funcionalidade do módulo.',
        codeExample: `'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { use${config.basic?.slug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')} } from './hooks';

export function ${componentPath}() {
  const { data, loading, error } = use${config.basic?.slug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600">Erro: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>${config.basic?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            ${config.basic?.description}
          </p>
          
          {/* Implemente sua interface aqui */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.map((item: any) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}`,
        notes: [
          'Use componentes do design system (@/shared/ui)',
          'Implemente estados de loading e erro',
          'Siga os padrões de layout da aplicação',
          'Torne o componente responsivo',
          'Use o hook personalizado para gerenciar dados'
        ]
      }
    },
    {
      id: 'create-custom-hook',
      title: '12. Criar hook personalizado',
      description: `Implementar hook useModule${config.basic?.slug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`,
      completed: false,
      estimatedTime: '15 min',
      actionType: 'open-file',
      actionData: {
        filePath: `${process.cwd()}/src/core/modules/${moduleDirectory}/hooks/index.ts`
      },
      instructions: {
        summary: 'Crie um hook personalizado para gerenciar o estado e operações do módulo.',
        commands: [
          `touch src/core/modules/${moduleDirectory}/hooks/index.ts`,
          `touch src/core/modules/${moduleDirectory}/hooks/use${config.basic?.slug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}.ts`
        ],
        codeExample: `'use client';

import { useState, useEffect, useCallback } from 'react';
import { create${config.basic?.slug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')} } from '@/app/actions/modules/${moduleDirectory}';

export function use${config.basic?.slug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Implementar lógica de busca
      // const result = await fetchDataAction();
      // setData(result.data || []);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = useCallback(async (itemData: any) => {
    try {
      const result = await create${config.basic?.slug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}(itemData);
      
      if (result.success) {
        await fetchData(); // Atualizar lista
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao criar item' 
      };
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    createItem
  };
}`,
        notes: [
          'Centralize toda lógica de estado do módulo no hook',
          'Implemente funções para CRUD completo',
          'Use useCallback para otimizar performance',
          'Inclua tratamento de erro robusto',
          'Exponha funções para refetch de dados'
        ]
      }
    },
    {
      id: 'assign-to-tenant',
      title: '13. Atribuir módulo ao tenant',
      description: `Ativar módulo para ${clientSlug} no painel de administração`,
      completed: false,
      estimatedTime: '5 min',
      actionType: 'external-link',
      actionData: {
        url: '/admin/modules/management'
      }
    },
    {
      id: 'local-testing',
      title: '14. Executar testes locais',
      description: 'Executar npm run dev e testar funcionalidades do módulo',
      completed: false,
      estimatedTime: '10 min',
      actionType: 'none'
    },
    {
      id: 'build-deploy',
      title: '15. Build e deploy',
      description: 'Executar build de produção e deploy das alterações',
      completed: false,
      estimatedTime: '8 min',
      actionType: 'external-link',
      actionData: {
        url: '/admin/modules/development'
      }
    }
  ];

  const { 
    tasksWithStatus, 
    progress, 
    toggleTask, 
    exportProgress 
  } = useChecklistProgress(tasks);

  const handleExportProgress = () => {
    const metadata = {
      moduleName: config.basic?.name || 'Módulo sem nome',
      moduleSlug: config.basic?.slug || 'modulo',
      createdAt: new Date().toISOString(),
      moduleId: creationResult?.module?.id || undefined
    };
    
    const exported = exportProgress('markdown', metadata);
    
    // Criar e baixar arquivo
    const blob = new Blob([exported.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exported.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header de sucesso */}
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-medium text-emerald-900 mb-2">Módulo Criado com Sucesso!</h3>
        <p className="text-emerald-700/80 leading-relaxed">
          Siga as <strong>15 tarefas técnicas</strong> abaixo para completar a implementação
        </p>
      </div>

      {/* Progress Header com funcionalidades do sistema completo */}
      <div className="bg-slate-50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-medium text-slate-900">Progresso da Implementação Técnica</h4>
            <p className="text-sm text-slate-600">
              {progress.completed} de {progress.total} tarefas concluídas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm text-slate-600">
              <Clock className="h-4 w-4" />
              {progress.estimatedTimeRemaining} restantes
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {progress.percentage}%
            </div>
          </div>
        </div>
        
        <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
          <div 
            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        
        {/* Botão de exportar */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportProgress}
            className="text-xs"
          >
            <FileText className="h-3 w-3 mr-1" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Tasks usando o componente interativo completo */}
      <div className="space-y-3">
        {tasksWithStatus.map((task) => (
          <InteractiveChecklistItem
            key={task.id}
            task={task}
            moduleData={creationResult}
            onToggle={(taskId, completed) => toggleTask(taskId, completed)}
          />
        ))}
      </div>

      {/* Footer com parabéns quando completo */}
      {progress.percentage === 100 && (
        <div className="text-center py-6 bg-emerald-50 rounded-xl border border-emerald-200">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <h4 className="font-medium text-emerald-900 mb-1">Parabéns! 🎉</h4>
          <p className="text-sm text-emerald-700">
            Você completou todas as etapas de implementação do módulo.
          </p>
        </div>
      )}
    </div>
  );
}

export function FinalReviewStep() {
  const { state, updateConfig } = useModuleWizardContext();
  const [isCreating, setIsCreating] = useState(false);
  const [creationResult, setCreationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('review');
  
  const config = state.config;

  const handleCreateModule = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const moduleData = {
        name: config.basic?.name || '',
        slug: config.basic?.slug || '',
        description: config.basic?.description || '',
        category: config.basic?.category || '',
        icon: config.basic?.icon || 'Package',
        route_pattern: config.basic?.route_pattern || '',
        version: config.basic?.version || '1.0.0',
        supports_multi_tenant: config.basic?.supports_multi_tenant ?? true,
        exclusive_tenant_id: config.basic?.exclusive_tenant_id || null,
        tags: config.basic?.tags || [],
        permissions_required: [],
        config_schema: {},
        dependencies: []
      };

      const implementationData = config.basic?.auto_create_standard ? null : {
        name: config.implementation?.name || `${moduleData.name} - Implementação`,
        implementation_key: config.implementation?.implementation_key || `${moduleData.slug}-impl`,
        description: config.implementation?.description || `Implementação do módulo ${moduleData.name}`,
        version: config.implementation?.version || moduleData.version,
        component_type: config.implementation?.component_type || 'file',
        component_path: config.implementation?.component_path || `${moduleData.slug}Implementation`,
        template_type: config.implementation?.template_type || 'dashboard',
        audience: config.implementation?.audience || 'generic',
        complexity: config.implementation?.complexity || 'standard',
        priority: config.implementation?.priority || 'medium',
        status: config.implementation?.status || 'active',
        is_default: config.implementation?.is_default ?? true,
        template_config: config.implementation?.template_config || {}
      };

      const clientAssignment = config.client_assignment;
      const assignmentsData = clientAssignment?.createAssignment && clientAssignment?.selectedOrganization ? [{
        tenant_id: clientAssignment.selectedOrganization.id,
        is_active: false
      }] : [];

      const result = await createFullModule({
        module: moduleData,
        implementation: implementationData,
        assignments: assignmentsData
      });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar módulo');
      }

      setCreationResult(result.data);
      updateConfig('creation_result', result.data);
      setActiveTab('checklist');

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header minimalista */}
      <div className="text-center space-y-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto transition-all duration-300 ${
          creationResult ? 'bg-emerald-50 ring-2 ring-emerald-100' : 'bg-slate-50 ring-2 ring-slate-100'
        }`}>
          {creationResult ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          ) : (
            <Package className="h-6 w-6 text-slate-600" />
          )}
        </div>
        <div>
          <h2 className={`text-2xl font-light tracking-tight ${
            creationResult ? 'text-emerald-900' : 'text-slate-900'
          }`}>
            {creationResult ? 'Módulo Criado' : 'Revisão Final'}
          </h2>
          <p className="text-slate-500 mt-1">
            {creationResult 
              ? 'Implementação concluída com sucesso'
              : 'Confirme as configurações antes de prosseguir'
            }
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-5 bg-red-50/50 border border-red-100 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
            <div className="flex-1 pt-0.5">
              <p className="font-medium text-red-900 text-sm">Erro na criação do módulo</p>
              <p className="text-red-700/80 text-sm mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs redesenhadas */}
      <div className="bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-sm">
        {/* Tab Navigation */}
        <div className="p-1.5 border-b border-slate-100">
          <div className="flex bg-slate-50/50 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('review')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'review' 
                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <FileCheck className="h-4 w-4" />
              Resumo
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              disabled={!creationResult}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'checklist' 
                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              } ${!creationResult ? 'opacity-40 cursor-not-allowed hover:bg-transparent hover:text-slate-600' : ''}`}
            >
              <CheckSquare className="h-4 w-4" />
              Checklist
              {creationResult && (
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'review' && (
            <div className="space-y-8">
              {/* Informações Básicas */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Package className="h-4 w-4 text-slate-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">Informações Básicas</h3>
                </div>
                
                <div className="bg-slate-50/50 rounded-xl p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nome</dt>
                      <dd className="text-slate-900 font-medium">{config.basic?.name}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Slug</dt>
                      <dd className="font-mono text-sm text-slate-700 bg-white px-3 py-1.5 rounded-lg border">
                        {config.basic?.slug}
                      </dd>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Descrição</dt>
                    <dd className="text-slate-700 leading-relaxed">{config.basic?.description}</dd>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 pt-2">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border">
                      <span className="text-xs font-medium text-slate-500">Categoria</span>
                      <span className="text-sm font-medium text-slate-900">{config.basic?.category}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border">
                      <span className="text-xs font-medium text-slate-500">Versão</span>
                      <span className="text-sm font-medium text-slate-900">{config.basic?.version}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border">
                      <span className="text-xs font-medium text-slate-500">Tipo</span>
                      <span className="text-sm font-medium text-slate-900">
                        {config.type === 'standard' ? 'Padrão' : 'Personalizado'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Implementação */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Wrench className="h-4 w-4 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">Implementação</h3>
                </div>
                
                <div className="bg-purple-50/50 rounded-xl p-6 space-y-5">
                  {/* Chave e Componente */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <dt className="text-xs font-medium text-purple-600 uppercase tracking-wider">Chave</dt>
                      <dd className="font-mono text-sm text-slate-700 bg-white px-3 py-1.5 rounded-lg border">
                        {config.implementation?.implementation_key || `${config.basic?.slug}-impl`}
                      </dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-xs font-medium text-purple-600 uppercase tracking-wider">Componente</dt>
                      <dd className="font-mono text-sm text-slate-700 bg-white px-3 py-1.5 rounded-lg border">
                        {config.implementation?.component_path || `${config.basic?.slug}Implementation`}
                      </dd>
                    </div>
                  </div>

                  {/* Nome e Descrição da Implementação */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <dt className="text-xs font-medium text-purple-600 uppercase tracking-wider">Nome</dt>
                      <dd className="text-slate-900 font-medium">
                        {config.implementation?.name || `${config.basic?.name} - Implementação`}
                      </dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-xs font-medium text-purple-600 uppercase tracking-wider">Template</dt>
                      <dd className="text-slate-700">
                        {config.implementation?.template_type || 'Dashboard'}
                      </dd>
                    </div>
                  </div>

                  {/* Metadados da Implementação */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border">
                      <span className="text-xs font-medium text-purple-600">Público</span>
                      <span className="text-sm font-medium text-slate-900">
                        {config.implementation?.audience || 'Genérico'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border">
                      <span className="text-xs font-medium text-purple-600">Complexidade</span>
                      <span className="text-sm font-medium text-slate-900">
                        {config.implementation?.complexity || 'Standard'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border">
                      <span className="text-xs font-medium text-purple-600">Status</span>
                      <span className="text-sm font-medium text-slate-900">
                        {config.implementation?.status || 'Ativo'}
                      </span>
                    </div>
                    {config.implementation?.is_default !== false && (
                      <div className="flex items-center gap-2 bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200">
                        <span className="text-xs font-medium text-purple-700">Padrão</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Atribuição de Cliente */}
              {config.client_assignment?.createAssignment && config.client_assignment?.selectedOrganization && (
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">Atribuição de Cliente</h3>
                  </div>
                  
                  <div className="bg-blue-50/50 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <dt className="text-xs font-medium text-blue-600 uppercase tracking-wider">Organização</dt>
                        <dd className="text-slate-900 font-medium">
                          {config.client_assignment.selectedOrganization.company_trading_name || 
                           config.client_assignment.selectedOrganization.company_legal_name}
                        </dd>
                      </div>
                      <div className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg text-sm font-medium">
                        Inativo
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Botão de Criação */}
              {!creationResult && (
                <div className="flex justify-center pt-4">
                  <Button 
                    size="lg" 
                    onClick={handleCreateModule}
                    disabled={isCreating}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Package className="mr-2 h-4 w-4" />
                        Criar Módulo
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'checklist' && (
            <div>
              {!creationResult ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckSquare className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Checklist Bloqueado</h3>
                  <p className="text-slate-500">
                    Crie o módulo primeiro para acessar o checklist de implementação
                  </p>
                </div>
              ) : (
                <ChecklistImplementacao config={config} creationResult={creationResult} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}