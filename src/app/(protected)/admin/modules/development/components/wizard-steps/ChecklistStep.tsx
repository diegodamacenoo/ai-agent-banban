'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/ui/accordion';
import { Copy, Check, CheckCircle, RotateCcw, Printer, Clock, CheckCircle2, X, ClipboardList, Info, AlertTriangle, Lightbulb, Code, Database, Folder, FileText, Terminal, Download, BarChart3 } from 'lucide-react';
import { useModuleWizardContext } from '../../../contexts/ModuleWizardContext';
import { InteractiveChecklistItem, type ChecklistTask } from '../checklist/InteractiveChecklistItem';
import { useChecklistProgress } from '../../hooks/useChecklistProgress';

/**
 * Step 4: Checklist de implementação do módulo - 100% conforme documentação /context
 */
export function ChecklistStep() {
  const { state, reset } = useModuleWizardContext();
  const config = state.config;
  
  // Dados do módulo criado
  const moduleData = {
    id: (config as any).created_base_module_id,
    name: config.basic?.name,
    slug: config.basic?.slug,
    implementationData: (config as any).implementation || (config as any).auto_created_implementation
  };

  // Gerar checklist baseado na configuração
  const generateChecklist = () => {
    const moduleName = config.basic?.name || 'módulo';
    const moduleSlug = config.basic?.slug || 'module';
    const isExclusive = !config.basic?.supports_multi_tenant;
    
    // NOVA ESTRATÉGIA: Estrutura Unificada com route_pattern
    const resolveModuleDirectory = () => {
      const selectedOrg = (config as any).selected_organization;
      
      // 1. PRIORIDADE: route_pattern definido pelo usuário no passo 2
      if (config.basic?.route_pattern?.trim()) {
        return config.basic.route_pattern.trim();
      }
      
      // 2. FALLBACK: Baseado no tipo do módulo
      if (config.type === 'standard') {
        return 'standard';
      }
      
      // 3. FALLBACK: Primeira palavra do slug da organização
      if (selectedOrg?.slug) {
        const segments = selectedOrg.slug.toLowerCase().split('-');
        return segments.length > 0 ? segments[0] : 'custom';
      }
      
      // 4. FALLBACK FINAL: Genérico
      return 'standard';
    };
    
    const moduleDirectory = resolveModuleDirectory();
    const getModulePath = () => `src/core/modules/${moduleDirectory}`;
    
    const getClientName = () => {
      const selectedOrg = (config as any).selected_organization;
      if (selectedOrg) {
        return selectedOrg.company_trading_name || selectedOrg.company_legal_name || selectedOrg.name || selectedOrg.slug || 'organização';
      }
      return config.type === 'standard' ? 'standard' : 'cliente';
    };
    
    const modulePath = getModulePath();
    const clientName = getClientName();
    

    return {
      steps: [
        // PASSO 0: Estrutura Unificada (Core + Frontend)
        {
          step: 0,
          task: `Criar estrutura unificada para ${moduleSlug}`,
          description: `Criar estrutura unificada que combina lógica de negócio e frontend`,
          estimated: '20min',
          priority: 'high',
          detailedInstructions: [
            {
              title: "Estrutura Unificada (Core + Frontend)",
              content: `Criar estrutura completa:`,
              codeBlock: `src/core/modules/${moduleDirectory}/
├── index.ts                # ModuleInterface implementation
├── config.ts               # Configurações do módulo
├── services/               # Lógica de negócio (backend)
│   ├── ${moduleSlug}-service.ts
│   └── index.ts
├── components/             # Componentes React (frontend)
│   └── index.ts
├── implementations/        # Implementações por cliente
│   ├── ${moduleDirectory === 'standard' ? 'Standard' : moduleDirectory.charAt(0).toUpperCase() + moduleDirectory.slice(1)}${moduleSlug.charAt(0).toUpperCase() + moduleSlug.slice(1)}Implementation.tsx
│   └── index.ts
├── hooks/                  # React hooks
│   └── index.ts
├── types/                  # Tipos TypeScript
│   └── index.ts
├── migrations/             # Schema do banco
│   └── schema.sql
└── utils/                  # Utilitários gerais`
            },
            {
              title: "Comandos Terminal - Estrutura Unificada",
              content: `Execute para criar toda a estrutura:`,
              codeBlock: `mkdir -p "src/core/modules/${moduleDirectory}/services"
mkdir -p "src/core/modules/${moduleDirectory}/components"
mkdir -p "src/core/modules/${moduleDirectory}/implementations"
mkdir -p "src/core/modules/${moduleDirectory}/hooks"
mkdir -p "src/core/modules/${moduleDirectory}/types"
mkdir -p "src/core/modules/${moduleDirectory}/migrations"
mkdir -p "src/core/modules/${moduleDirectory}/utils"`
            },
            {
              title: "Vantagens da Estrutura Unificada",
              content: `ESTRUTURA UNIFICADA (src/core/modules/${moduleDirectory}/) contém:

✅ Organização centralizada por namespace (route_pattern)
✅ Frontend e backend no mesmo diretório  
✅ Resolução simples via database component_path
✅ Escalabilidade sem modificar código
✅ Consistência entre projetos

Component path para database:
@/core/modules/${moduleDirectory}/implementations/[ComponentName]

O que INCLUIR na Estrutura Unificada:
• Lógica de negócio (services/)
• Componentes React (components/ + implementations/) 
• Hooks React (hooks/)
• Tipos TypeScript (types/)
• Configurações (config.ts)
• Migrations (migrations/)`
            }
          ]
        },

        // PASSO 1: Implementar ModuleInterface
        {
          step: 1,
          task: 'Implementar ModuleInterface no Módulo Unificado',
          description: `Criar classe que implementa a interface padrão do sistema de módulos`,
          estimated: '45min',
          priority: 'high',
          detailedInstructions: [
            {
              title: "ModuleInterface Implementation",
              content: `Criar src/core/modules/${moduleDirectory}/index.ts:`,
              codeBlock: `import { ModuleInterface, ModuleConfig, HealthStatus } from '@/shared/types/module-system';
import { ${moduleName.replace(/\s+/g, '')}Service } from './services';
import { ${moduleName.replace(/\s+/g, '')}Config } from './config';

export class ${moduleName.replace(/\s+/g, '')}Module implements ModuleInterface {
  private config: ${moduleName.replace(/\s+/g, '')}Config;
  private service: ${moduleName.replace(/\s+/g, '')}Service;

  constructor() {
    this.config = new ${moduleName.replace(/\s+/g, '')}Config();
    this.service = new ${moduleName.replace(/\s+/g, '')}Service();
  }

  async initialize(moduleConfig: ModuleConfig): Promise<void> {
    this.config.updateConfig(moduleConfig);
    await this.service.initialize(this.config);
  }

  async getHealthStatus(): Promise<HealthStatus> {
    return await this.service.checkHealth();
  }

  async processData(data: any): Promise<any> {
    return await this.service.processData(data);
  }

  getModuleInfo() {
    return {
      name: '${moduleName}',
      version: '1.0.0',
      description: 'Módulo ${moduleName} para ${clientName}',
      author: 'Sistema',
      dependencies: []
    };
  }
}`
            }
          ]
        },

        // PASSO 2: Verificar Registros Criados pelo Wizard
        {
          step: 2,
          task: `Verificar registros criados automaticamente`,
          description: 'O wizard criou o base module e implementation - verificar se funcionou corretamente',
          estimated: '5min',
          priority: 'high',
          detailedInstructions: [
            {
              title: "Registros Criados pelo Wizard",
              content: `O wizard executou automaticamente durante a criação:`,
              codeBlock: `[CRIADO] Módulo base registrado em base_modules:
   - slug: '${moduleSlug}'
   - name: '${moduleName}'
   - categoria: '${config.basic?.category || 'custom'}'
   - route_pattern: '${config.basic?.route_pattern || moduleDirectory}'
   - multi-tenant: ${!isExclusive}

[CRIADO] Implementação criada em module_implementations:
   - audience: '${clientName}'
   - component_path: '@/core/modules/${moduleDirectory}/implementations/${moduleDirectory === 'standard' ? 'Standard' : moduleDirectory.charAt(0).toUpperCase() + moduleDirectory.slice(1)}${moduleSlug.charAt(0).toUpperCase() + moduleSlug.slice(1)}Implementation'
   - template_type: dashboard/table/chart/etc

[IMPORTANTE] Component Path Unificado:
   O component_path agora usa estrutura unificada com path absoluto
   que funciona tanto para frontend quanto backend.`
            },
            {
              title: "Verificação no Painel Admin",
              content: `Para verificar se os registros foram criados:`,
              codeBlock: `1. Acesse /admin/modules/management
2. Procure pelo módulo '${moduleSlug}' na lista
3. Verifique se tem implementação(ões) associada(s)
4. Confirme que está ativo e visível`
            },
            {
              title: "Verificação via SQL (Opcional)",
              content: `Para verificar diretamente no banco:`,
              codeBlock: `-- Verificar módulo base criado
SELECT slug, name, route_pattern, supports_multi_tenant, is_active 
FROM base_modules 
WHERE slug = '${moduleSlug}';

-- Verificar implementação criada
SELECT implementation_key, audience, component_path 
FROM module_implementations mi
JOIN base_modules bm ON mi.base_module_id = bm.id
WHERE bm.slug = '${moduleSlug}';`
            }
          ]
        },

        // PASSO 4: Backend Module Structure
        {
          step: 3,
          task: `Criar módulo backend (Fastify)`,
          description: 'Implementar módulo no backend modular Fastify',
          estimated: '1 hora',
          priority: 'medium',
          detailedInstructions: [
            {
              title: "Estrutura Backend",
              content: `Criar estrutura no backend modular:`,
              codeBlock: `backend/src/modules/custom/${moduleDirectory}/
├── index.ts            # Plugin Fastify
├── routes/             # Rotas específicas
│   └── ${moduleSlug}-routes.ts
├── services/           # Serviços backend
│   └── ${moduleSlug}-service.ts
├── schemas/            # Validação Fastify
│   └── ${moduleSlug}-schemas.ts
└── types/              # Tipos backend
    └── index.ts`
            },
            {
              title: "Plugin Fastify Base",
              content: `Criar backend/src/modules/custom/${moduleDirectory}/index.ts:`,
              codeBlock: `import { FastifyPluginAsync } from 'fastify';
import { ${moduleSlug}Routes } from './routes/${moduleSlug}-routes';

const ${moduleName.replace(/\s+/g, '')}Plugin: FastifyPluginAsync = async (fastify) => {
  // Registrar rotas
  await fastify.register(${moduleSlug}Routes, { prefix: '/${moduleSlug}' });
  
  // Registrar schemas
  // Registrar hooks se necessário
};

export default ${moduleName.replace(/\s+/g, '')}Plugin;`
            }
          ]
        },

        // PASSO 5: Definir Tipos TypeScript Core
        {
          step: 4,
          task: 'Criar tipos TypeScript do Core',
          description: `Definir interfaces e tipos do módulo core`,
          estimated: '30min',
          priority: 'high',
          detailedInstructions: [
            {
              title: "Tipos Core Module",
              content: `Criar src/core/modules/${moduleDirectory}/types/index.ts:`,
              codeBlock: `// Tipos principais do Core Module ${moduleName}
export interface ${moduleName.replace(/\s+/g, '')}Data {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// Configuração do módulo
export interface ${moduleName.replace(/\s+/g, '')}Config {
  thresholds: {
    warning: number;
    critical: number;
  };
  features: {
    [key: string]: boolean;
  };
  integrations: {
    [key: string]: any;
  };
}

// Serviço do módulo
export interface ${moduleName.replace(/\s+/g, '')}ServiceInterface {
  initialize(config: ${moduleName.replace(/\s+/g, '')}Config): Promise<void>;
  processData(data: any): Promise<any>;
  checkHealth(): Promise<HealthStatus>;
}`
            }
          ]
        },

        // PASSO 6: Planejar Schema do Banco
        {
          step: 5,
          task: `Planejar schema da tabela ${moduleSlug}_data`,
          description: 'Nesta etapa vamos definir cuidadosamente a estrutura do banco de dados do seu módulo. É importante planejar bem antes de criar a migração.',
          estimated: '1-2 horas',
          priority: 'high',
          detailedInstructions: [
            {
              title: "Por que planejar o schema primeiro?",
              content: `Antes de criarmos a migração, é essencial planejar bem a estrutura da tabela do seu módulo. Isso evita problemas futuros e garante que seguimos as melhores práticas do sistema.
              
Um bom planejamento significa menos retrabalho e um módulo mais robusto desde o início.`,
              codeBlock: ``
            },
            {
              title: "Colunas Obrigatórias do Sistema",
              content: `Todo módulo no sistema deve incluir essas colunas básicas para funcionar corretamente:

• id: Identificador único da tabela  
• tenant_id: Para isolamento multi-tenant (muito importante!)  
• created_at e updated_at: Para auditoria  
• deleted_at: Para exclusão lógica (soft delete)`,
              codeBlock: `id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id: UUID NOT NULL (FK para organizations.id)
created_at: TIMESTAMPTZ DEFAULT NOW()  
updated_at: TIMESTAMPTZ DEFAULT NOW()
deleted_at: TIMESTAMPTZ (soft delete)`
            },
            {
              title: "Estrutura Completa do Schema",
              content: `Agora vamos definir o schema completo da sua tabela. Este será o arquivo que você criará em:

Localização: src/core/modules/${moduleDirectory}/migrations/schema.sql

Este arquivo servirá como referência para criar a migração no próximo passo. Ajuste os campos específicos conforme a necessidade do seu módulo:`,
              codeBlock: `-- Schema planejado para ${moduleSlug}_data
CREATE TABLE IF NOT EXISTS public.${moduleSlug}_data (
    -- Colunas obrigatórias do sistema
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Campos específicos do seu módulo (personalize conforme necessário)
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    
    -- Configuração flexível em JSON
    config JSONB DEFAULT '{}',
    
    -- Campos de auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Constraints importantes
    CONSTRAINT ${moduleSlug}_data_name_tenant_unique UNIQUE (name, tenant_id, deleted_at)
);`
            },
            {
              title: "Próximo passo",
              content: `Após planejar o schema, você criará a migração real no próximo passo. 

Dica: Revise bem os campos específicos do seu módulo antes de continuar. É mais fácil ajustar agora do que depois da migração estar aplicada.`
            }
          ]
        },

        // PASSO 7: Criar Migração
        {
          step: 6,
          task: 'Criar migração SQL',
          description: `Criar e executar migração do banco de dados`,
          estimated: '30min',
          priority: 'high',
          detailedInstructions: [
            {
              title: "Criar Migração",
              content: `Execute no terminal:`,
              codeBlock: `npx supabase migration new create_${moduleSlug}_tables`,
              additionalInfo: `Isso criará um arquivo em supabase/migrations/ com timestamp.`
            },
            {
              title: "SQL Completo da Migração",
              content: `No arquivo de migração criado, copie o SQL do schema planejado + RLS:`,
              codeBlock: `-- Create ${moduleSlug}_data table
CREATE TABLE IF NOT EXISTS public.${moduleSlug}_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Campos específicos do módulo
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    config JSONB DEFAULT '{}',
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT ${moduleSlug}_data_name_tenant_unique UNIQUE (name, tenant_id, deleted_at)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_${moduleSlug}_data_tenant_id ON public.${moduleSlug}_data(tenant_id);
CREATE INDEX IF NOT EXISTS idx_${moduleSlug}_data_deleted_at ON public.${moduleSlug}_data(deleted_at);
CREATE INDEX IF NOT EXISTS idx_${moduleSlug}_data_status ON public.${moduleSlug}_data(status);

-- RLS Enable
ALTER TABLE public.${moduleSlug}_data ENABLE ROW LEVEL SECURITY;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_${moduleSlug}_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_${moduleSlug}_data_updated_at
    BEFORE UPDATE ON public.${moduleSlug}_data
    FOR EACH ROW
    EXECUTE FUNCTION update_${moduleSlug}_data_updated_at();`
            },
            {
              title: "Aplicar Migração",
              content: `Após criar o SQL, execute:`,
              codeBlock: `npx supabase db push`,
              additionalInfo: `Verifique se não há erros na aplicação.`
            }
          ]
        },

        // PASSO 8: Configurar RLS Policies
        {
          step: 7,
          task: isExclusive 
            ? `Configurar RLS para tenant exclusivo: ${clientName}`
            : 'Configurar RLS policies multi-tenant',
          description: 'Implementar políticas de segurança para isolamento de dados',
          estimated: '1 hora',
          priority: 'high',
          detailedInstructions: [
            {
              title: "Políticas RLS Completas",
              content: `Adicionar ao arquivo de migração:`,
              codeBlock: `-- RLS Policies para ${moduleSlug}_data
CREATE POLICY "${moduleSlug}_data_tenant_isolation" ON public.${moduleSlug}_data
    FOR ALL USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

-- Policy para SELECT
CREATE POLICY "${moduleSlug}_data_select" ON public.${moduleSlug}_data
    FOR SELECT USING (
        tenant_id = auth.jwt() ->> 'tenant_id'::text
        AND deleted_at IS NULL
    );

-- Policy para INSERT
CREATE POLICY "${moduleSlug}_data_insert" ON public.${moduleSlug}_data
    FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id'::text);

-- Policy para UPDATE
CREATE POLICY "${moduleSlug}_data_update" ON public.${moduleSlug}_data
    FOR UPDATE USING (
        tenant_id = auth.jwt() ->> 'tenant_id'::text
        AND deleted_at IS NULL
    );

-- Policy para DELETE (soft delete)
CREATE POLICY "${moduleSlug}_data_delete" ON public.${moduleSlug}_data
    FOR UPDATE USING (
        tenant_id = auth.jwt() ->> 'tenant_id'::text
        AND deleted_at IS NULL
    );`
            }
          ]
        },

        // PASSO 9: Criar Server Actions CRUD
        {
          step: 8,
          task: 'Criar Server Actions CRUD',
          description: `Implementar Server Actions seguindo padrões documentados`,
          estimated: '2-3 horas',
          priority: 'high',
          detailedInstructions: [
            {
              title: "Server Actions Estruturadas",
              content: `Criar src/app/actions/modules/${moduleSlug}.ts:`,
              codeBlock: `'use server';

import { createClient } from '@/core/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser, getUserOrgId } from '@/core/auth/session-manager';
import { invalidateModuleCacheForOrg } from '@/app/actions/admin/modules/cache-invalidation';
import type { ActionResult } from '@/shared/types/action-result';

// Schemas de validação
const create${moduleName.replace(/\s+/g, '')}Schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  config: z.record(z.any()).default({})
});

// CREATE - Seguindo padrão documentado
export async function create${moduleName.replace(/\s+/g, '')}(
  input: z.infer<typeof create${moduleName.replace(/\s+/g, '')}Schema>
): Promise<ActionResult<any>> {
  try {
    // 1. Input validation
    const validated = create${moduleName.replace(/\s+/g, '')}Schema.parse(input);
    
    // 2. Authentication check
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    
    // 3. Authorization check (multi-tenant)
    const orgId = await getUserOrgId();
    if (!orgId) return { success: false, error: 'Organization required' };
    
    // 4. Business logic
    const supabase = createClient();
    const { data, error } = await supabase
      .from('${moduleSlug}_data')
      .insert({
        ...validated,
        tenant_id: orgId
      })
      .select()
      .single();

    if (error) throw error;

    // 5. Cache invalidation
    revalidatePath('/[slug]/(modules)/${moduleSlug}');
    await invalidateModuleCacheForOrg(orgId);
    
    // 6. Success response
    return { 
      success: true, 
      data,
      message: '${moduleName} criado com sucesso' 
    };
  } catch (error) {
    // 7. Error handling
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

// READ
export async function get${moduleName.replace(/\s+/g, '')}List(): Promise<ActionResult<any[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    
    const orgId = await getUserOrgId();
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('${moduleSlug}_data')
      .select('*')
      .eq('tenant_id', orgId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao carregar dados' 
    };
  }
}`
            }
          ]
        },

        // PASSO 10: Página Principal
        {
          step: 9,
          task: 'Criar arquivo principal page.tsx',
          description: `Implementar a página principal do módulo com layout responsivo`,
          estimated: '30min',
          priority: 'high',
          detailedInstructions: [
            {
              title: "Template Base",
              content: `Criar o arquivo src/app/(protected)/[slug]/(modules)/${moduleSlug}/page.tsx:`,
              codeBlock: `import { Metadata } from 'next';
import { DynamicModulePage } from '@/app/(protected)/[slug]/(modules)/components/DynamicModulePage';

export const metadata: Metadata = {
  title: '${moduleName}',
  description: 'Módulo ${moduleName} para gestão...'
};

export default function ${moduleName.replace(/\s+/g, '')}Page({
  params
}: {
  params: { slug: string }
}) {
  return (
    <DynamicModulePage
      moduleSlug="${moduleSlug}"
      tenantSlug={params.slug}
    />
  );
}`
            },
            {
              title: "Integração com Sistema de Módulos",
              content: `A página usa DynamicModulePage que:
- Resolve automaticamente a implementação correta
- Carrega configurações do tenant
- Aplica permissões e visibilidade
- Fornece error boundaries
- Gerencia estados de loading`
            }
          ]
        },

        // PASSO 11: Criar Implementações por Cliente
        {
          step: 10,
          task: 'Criar implementações específicas',
          description: `Implementar componentes específicos por cliente`,
          estimated: '3-4 horas',
          priority: 'high',
          detailedInstructions: [
            {
              title: "Implementação Específica do Cliente",
              content: `Criar implementação no diretório unificado:`,
              codeBlock: `'use client';

import { useState, useEffect } from 'react';
import { get${moduleName.replace(/\s+/g, '')}List } from '@/app/actions/modules/${moduleSlug}';
import type { ${moduleName.replace(/\s+/g, '')}Data } from '@/core/modules/${moduleDirectory}/types';

interface ModuleImplementationProps {
  config?: any;
  tenantId: string;
}

export default function Implementation({ config, tenantId }: ModuleImplementationProps) {
  const [items, setItems] = useState<${moduleName.replace(/\s+/g, '')}Data[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const result = await get${moduleName.replace(/\s+/g, '')}List();
      if (result.success) {
        setItems(result.data || []);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">${moduleName} - ${clientName}</h1>
        {/* Ações específicas do ${clientName} */}
      </div>
      
      <div className="grid gap-6">
        {/* Layout específico para ${clientName} */}
        {items.map((item) => (
          <div key={item.id} className="border p-4 rounded-lg">
            <h3 className="font-semibold">{item.name}</h3>
            {item.description && <p className="text-gray-600">{item.description}</p>}
            <span className={\`px-2 py-1 rounded text-xs \${
              item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }\`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}`
            }
          ]
        },

        // PASSO 12: Criar Custom Hook
        {
          step: 11,
          task: 'Criar hook personalizado',
          description: `Implementar hook para gerenciar estado e operações do módulo`,
          estimated: '1-2 horas',
          priority: 'medium',
          detailedInstructions: [
            {
              title: "Hook Personalizado",
              content: `Criar src/app/(protected)/[slug]/(modules)/${moduleSlug}/hooks/use${moduleName.replace(/\s+/g, '')}.ts:`,
              codeBlock: `'use client';

import { useState, useCallback } from 'react';
import { 
  get${moduleName.replace(/\s+/g, '')}List,
  create${moduleName.replace(/\s+/g, '')}
} from '@/app/actions/modules/${moduleSlug}';
import type { ${moduleName.replace(/\s+/g, '')}Data } from '@/${modulePath.replace('src/', '')}/types';

interface Create${moduleName.replace(/\s+/g, '')}Data {
  name: string;
  description?: string;
  status?: 'active' | 'inactive';
  config?: Record<string, any>;
}

export function use${moduleName.replace(/\s+/g, '')}() {
  const [items, setItems] = useState<${moduleName.replace(/\s+/g, '')}Data[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await get${moduleName.replace(/\s+/g, '')}List();
      if (result.success) {
        setItems(result.data || []);
      } else {
        setError(result.error || 'Erro ao carregar dados');
      }
    } catch (err) {
      setError('Erro inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = useCallback(async (data: Create${moduleName.replace(/\s+/g, '')}Data) => {
    const result = await create${moduleName.replace(/\s+/g, '')}(data);
    if (result.success) {
      await loadItems(); // Recarregar lista
    }
    return result;
  }, [loadItems]);

  return {
    items,
    loading,
    error,
    loadItems,
    createItem,
  };
}`
            }
          ]
        },

        // PASSO 13: Atribuir Módulo para Tenant
        {
          step: 12,
          task: (config as any).assignment_created ? 'Ativar módulo no tenant' : 'Atribuir módulo ao tenant',
          description: (config as any).assignment_created 
            ? 'O módulo já foi atribuído automaticamente (inativo). Ative quando estiver pronto.' 
            : 'Configurar visibilidade e acesso do módulo',
          estimated: '15min',
          priority: (config as any).assignment_created ? 'medium' : 'high',
          detailedInstructions: (config as any).assignment_created ? [
            {
              title: "Atribuição Já Criada",
              content: `O wizard criou automaticamente uma atribuição inativa para desenvolvimento.`,
              codeBlock: `[ATRIBUÍDO] Módulo atribuído para: ${clientName}
[STATUS] INATIVO (desenvolvimento)
[CONFIG] development_mode = true

Para ativar quando estiver pronto:
1. Acesse /admin/modules/management
2. Encontre o módulo '${moduleSlug}'
3. Clique em "Ativar" na organização ${clientName}`
            },
            {
              title: "Verificação Manual (Opcional)",
              content: `Para verificar a atribuição criada:`,
              codeBlock: `-- Verificar atribuição criada
SELECT 
  tma.is_active,
  tma.status,
  tma.custom_config,
  o.company_trading_name,
  bm.name as module_name
FROM tenant_module_assignments tma
JOIN organizations o ON tma.tenant_id = o.id
JOIN base_modules bm ON tma.base_module_id = bm.id
WHERE bm.slug = '${moduleSlug}' 
  AND o.slug LIKE '%${clientName}%';`
            }
          ] : [
            {
              title: "Atribuição Manual",
              content: `Usar painel admin para atribuir o módulo:`,
              codeBlock: `1. Acesse /admin/modules/management
2. Encontre o módulo '${moduleSlug}' 
3. Clique em "Atribuir"
4. Selecione a organização ${clientName}
5. Configure como ativo quando estiver pronto`
            },
            {
              title: "Verificar Visibilidade",
              content: `Verificar se módulo aparece no menu lateral automaticamente.`
            }
          ]
        },

        // PASSO 14: Testes
        {
          step: 13,
          task: 'Executar testes locais',
          description: 'Validar funcionamento completo do módulo',
          estimated: '30min',
          priority: 'high',
          detailedInstructions: [
            {
              title: "Testes Essenciais",
              content: `Executar:`,
              codeBlock: `npm test
npm run lint
npm run typecheck`,
              additionalInfo: `Verificar se todos os testes passam e coverage adequado.`
            }
          ]
        },

        // PASSO 15: Build e Deploy
        {
          step: 14,
          task: 'Build e deploy',
          description: 'Compilar e fazer deploy do módulo',
          estimated: '30min',
          priority: 'high',
          detailedInstructions: [
            {
              title: "Build",
              content: `Executar build:`,
              codeBlock: `npm run build`,
              additionalInfo: `Resolver todos os warnings antes de continuar.`
            },
            {
              title: "Deploy",
              content: `Fazer deploy para staging primeiro, depois produção.`
            }
          ]
        }
      ]
    };
  };

  const checklist = generateChecklist();
  const allTasks = checklist.steps;

  // Converter para format interativo
  const interactiveTasks: ChecklistTask[] = useMemo(() => {
    const moduleSlug = config.basic?.slug || 'module';
    const resolveModuleDirectory = () => {
      if (config.basic?.route_pattern?.trim()) {
        return config.basic.route_pattern.trim();
      }
      if (config.type === 'standard') {
        return 'standard';
      }
      const selectedOrg = (config as any).selected_organization;
      if (selectedOrg?.slug) {
        const segments = selectedOrg.slug.toLowerCase().split('-');
        return segments.length > 0 ? segments[0] : 'custom';
      }
      return 'standard';
    };
    const moduleDirectory = resolveModuleDirectory();
    const absolutePath = process.cwd ? process.cwd() : 'C:\\Users\\brcom\\ai-agent';
    
    return allTasks.map((task, index) => ({
      id: `task-${index}`,
      title: task.task,
      description: task.description,
      completed: false,
      estimatedTime: task.estimated,
      actionType: (() => {
        const taskLower = task.task.toLowerCase();
        if (taskLower.includes('estrutura') || taskLower.includes('criar arquivo')) {
          return 'open-folder' as const;
        }
        if (taskLower.includes('migração') || taskLower.includes('sql')) {
          return 'open-file' as const;
        }
        if (taskLower.includes('painel') || taskLower.includes('admin')) {
          return 'external-link' as const;
        }
        return 'none' as const;
      })(),
      actionData: (() => {
        const taskLower = task.task.toLowerCase();
        if (taskLower.includes('estrutura')) {
          return { path: `${absolutePath}\\src\\core\\modules\\${moduleDirectory}` };
        }
        if (taskLower.includes('migração')) {
          return { filePath: `${absolutePath}\\supabase\\migrations` };
        }
        if (taskLower.includes('painel admin')) {
          return { url: '/admin/modules/management' };
        }
        if (taskLower.includes('verificar registros')) {
          return { url: '/admin/modules/management' };
        }
        return {};
      })()
    }));
  }, [allTasks, config]);

  // Integração com tracking de progresso
  const {
    completedTasks,
    progress,
    toggleTask: updateTaskProgress,
    resetProgress,
    exportProgressJSON,
    exportProgressMarkdown
  } = useChecklistProgress(interactiveTasks, moduleData.slug || moduleData.id || 'temp-module');

  const exportReportAsJson = () =>
    exportProgressJSON({
      moduleName: moduleData.name || 'Novo Módulo',
      moduleSlug: moduleData.slug || 'module',
      createdAt: new Date().toISOString(),
      moduleId: moduleData.id
    });

  const exportReportAsMarkdown = () =>
    exportProgressMarkdown({
      moduleName: moduleData.name || 'Novo Módulo',
      moduleSlug: moduleData.slug || 'module',
      createdAt: new Date().toISOString(),
      moduleId: moduleData.id
    });
  
  // Extrair variáveis necessárias da checklist
  const moduleSlug = config.basic?.slug || 'module';
  const getClientName = () => {
    const selectedOrg = (config as any).selected_organization;
    if (selectedOrg) {
      return selectedOrg.company_trading_name || selectedOrg.company_legal_name || selectedOrg.slug || 'organização';
    }
    return config.type === 'standard' ? 'standard' : 'cliente';
  };
  
  const getModulePath = () => {
    const selectedOrg = (config as any).selected_organization;
    
    // 1. PRIORIDADE: route_pattern definido pelo usuário no passo 2
    if (config.basic?.route_pattern && config.basic.route_pattern.trim()) {
      return `src/core/modules/${config.basic.route_pattern.trim()}`;
    }
    
    // 2. FALLBACK: Lógica dinâmica baseada no tipo de módulo
    if (config.type === 'standard') {
      return `src/core/modules/standard/${moduleSlug}`;
    }
    
    if (config.type === 'custom' && selectedOrg?.slug) {
      // Esta seção não é mais necessária na estrutura unificada
      // Usar estrutura unificada baseada no moduleDirectory
      return `src/core/modules/${moduleDirectory}`;
    }
    
    // Fallback seguro para standard
    return `src/core/modules/standard/${moduleSlug}`;
  };
  
  const clientName = getClientName();
  const modulePath = getModulePath();
  
  // Extrair client slug do modulePath que já considera route_pattern
  // moduleDirectory já foi definido acima na nova arquitetura
  
  const totalEstimatedHours = allTasks.reduce((total, item) => {
    const match = item.estimated.match(/(\d+)(?:-(\d+))?\s*h/);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      return total + (min + max) / 2;
    }
    return total + 0.5; // Default para itens em minutos
  }, 0);

  // Componente auxiliar para bloco de código com botão copiar
  const CodeBlock = ({ code }: { code: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.debug('Erro ao copiar:', err);
      }
    };

    return (
      <div className="relative">
        <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto font-mono pr-12">
          <code>{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
          title={copied ? "Copiado!" : "Copiar código"}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-400" />
          ) : (
            <Copy className="h-3 w-3 text-gray-300 hover:text-white" />
          )}
        </button>
      </div>
    );
  };

  // Componente auxiliar para renderizar detalhes de forma mais amigável
  const InstructionDetail = ({ instruction }: { instruction: any }) => {
    // Determinar ícone baseado no título
    const getIcon = (title: string) => {
      const lower = title.toLowerCase();
      if (lower.includes('comando') || lower.includes('terminal')) return Terminal;
      if (lower.includes('estrutura') || lower.includes('pasta')) return Folder;
      if (lower.includes('schema') || lower.includes('banco')) return Database;
      if (lower.includes('código') || lower.includes('implementa')) return Code;
      if (lower.includes('arquivo') || lower.includes('migration')) return FileText;
      if (lower.includes('dica') || lower.includes('próximo')) return Lightbulb;
      if (lower.includes('importante') || lower.includes('atenção')) return AlertTriangle;
      return Info;
    };

    // Determinar cor do card baseado no tipo
    const getCardStyle = (title: string) => {
      const lower = title.toLowerCase();
      if (lower.includes('comando') || lower.includes('terminal')) 
        return 'bg-slate-50 border-slate-200';
      if (lower.includes('estrutura') || lower.includes('pasta')) 
        return 'bg-blue-50 border-blue-200';
      if (lower.includes('schema') || lower.includes('banco')) 
        return 'bg-purple-50 border-purple-200';
      if (lower.includes('dica') || lower.includes('próximo')) 
        return 'bg-yellow-50 border-yellow-200';
      if (lower.includes('importante') || lower.includes('atenção')) 
        return 'bg-red-50 border-red-200';
      return 'bg-gray-50 border-gray-200';
    };

    const Icon = getIcon(instruction.title);
    const cardStyle = getCardStyle(instruction.title);

    return (
      <div className={`border rounded-lg p-4 ${cardStyle}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Icon className="h-4 w-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h6 className="font-medium text-sm text-gray-800 mb-2 flex items-center gap-2">
              {instruction.title}
            </h6>
            {instruction.content && (
              <div className="text-xs text-gray-700 mb-3 whitespace-pre-line leading-relaxed">
                {instruction.content}
              </div>
            )}
            {instruction.codeBlock && instruction.codeBlock.trim() && (
              <div className="mt-3">
                <CodeBlock code={instruction.codeBlock} />
              </div>
            )}
            {instruction.additionalInfo && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 italic">
                <Info className="h-3 w-3 inline mr-1" />
                {instruction.additionalInfo}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-green-800">Módulo Criado com Sucesso!</h2>
        <p className="text-sm text-gray-600">
          Siga este guia passo-a-passo para implementar o módulo "{config.basic?.name}"
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <BarChart3 className="h-5 w-5" />
            Progresso da Implementação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {completedTasks.length}
              </div>
              <div className="text-sm text-blue-700">Tarefas Concluídas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {interactiveTasks.length}
              </div>
              <div className="text-sm text-purple-700">Total de Tarefas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {progress.percentage}%
              </div>
              <div className="text-sm text-green-700">Progresso</div>
            </div>
          </div>

          <Progress value={progress.percentage} className="mb-4" />

          <div className="text-xs text-gray-600 text-center">
            Tempo estimado restante: {progress.estimatedTimeRemaining}
          </div>
        </CardContent>
      </Card>

      {/* Interactive Checklist */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Checklist Interativo</h3>
            <Badge variant="outline">
              {completedTasks.length}/{interactiveTasks.length}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportReportAsJson}
              title="Exportar relatório como JSON"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportReportAsMarkdown}
              title="Exportar relatório como Markdown"
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {interactiveTasks.map((task, index) => (
            <InteractiveChecklistItem
              key={task.id}
              task={{
                ...task,
                completed: completedTasks.includes(task.id)
              }}
              moduleData={moduleData}
              onToggle={updateTaskProgress}
            />
          ))}
        </div>
      </div>

      {/* Detailed Instructions Accordion - Keep for reference */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Code className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-800">Instruções Detalhadas</h3>
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            Referência Completa
          </Badge>
        </div>

        <Accordion type="multiple" className="space-y-3">
          {allTasks.map((item, index) => (
            <AccordionItem key={index} value={`step-${index}`} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mt-0.5">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <AccordionTrigger className="py-0 hover:no-underline">
                      <div className="flex items-center justify-between w-full mr-2">
                        <h4 className="font-medium text-sm text-left">
                          {item.task}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            item.priority === 'high' ? 'bg-red-100 text-red-700' :
                            item.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.estimated}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <div className="space-y-4">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800 font-medium mb-1">Descrição do Passo</p>
                          <p className="text-xs text-blue-700">{item.description}</p>
                        </div>
                        
                        {item.detailedInstructions && (
                          <div className="space-y-4">
                            {item.detailedInstructions.map((instruction: any, idx: number) => (
                              <InstructionDetail key={idx} instruction={instruction} />
                            ))}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </div>
                </div>
              </div>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-center pt-6 border-t">
        <Button 
          variant="outline" 
          onClick={() => {
            resetProgress();
            reset();
          }}
          className="px-6 py-2"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Criar Outro Módulo
        </Button>
        <Button 
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2"
        >
          <Printer className="mr-2 h-4 w-4" />
          Imprimir Guia
        </Button>
      </div>
    </div>
  );
}