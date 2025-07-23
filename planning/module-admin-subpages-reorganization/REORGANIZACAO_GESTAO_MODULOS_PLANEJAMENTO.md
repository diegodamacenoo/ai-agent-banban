# Reorganização da Gestão de Módulos - Planejamento v2.0

## Visão Geral

Reorganização da interface de administração de módulos de uma estrutura em abas para **sub-páginas especializadas**, seguindo rigorosamente os padrões arquiteturais existentes: atualização otimística, toast feedback, audit logging, dialogs de confirmação e efeitos cascata.

## Estrutura Atual vs Nova

### ❌ Atual (Abas)
```
/admin/modules (single page)
├── Tab: Módulos Base
├── Tab: Implementações  
├── Tab: Atribuições
├── Tab: Desenvolvimento
├── Tab: Qualidade
└── Tab: Logs
```

### ✅ Nova (Sub-páginas)
```
/admin/modules/
├── /gestao          - Operações administrativas
├── /desenvolvimento - Ferramentas e auxílio para devs
└── /estatisticas    - Performance, métricas e insights
```

## 🎯 Objetivos Expandidos

1. **Melhor UX**: Navegação mais intuitiva por persona
2. **Performance**: Carregamento sob demanda por área
3. **Escalabilidade**: Cada área pode evoluir independentemente
4. **Organização**: Separação clara de responsabilidades
5. **✨ Consistência**: Seguir 100% os padrões existentes
6. **🔒 Segurança**: Audit logging completo + confirmações críticas
7. **⚡ Responsividade**: Atualização otimística + feedback imediato
8. **🔗 Integridade**: Efeitos cascata para manter sincronização

## 📋 Tarefas de Implementação

### **Fase 1: Estrutura e Roteamento** ⏱️ 4-5h

#### 1.1 Criar Nova Estrutura de Pastas (Domain-Driven Organization)
```
src/app/(protected)/admin/modules/
├── page.tsx                    # Landing page com cards navegação
├── layout.tsx                  # Layout compartilhado com Context Providers
├── _shared/                    # Domínio compartilhado
│   ├── providers/
│   │   ├── module-management-context.tsx     # Context global
│   │   └── optimistic-state-provider.tsx    # Estado otimístico
│   ├── hooks/
│   │   ├── use-module-management-data.ts    # Hook principal
│   │   ├── use-audit-logger.ts              # Logging centralizado
│   │   └── use-toast-manager.ts             # Toast com padrões
│   ├── services/
│   │   ├── cascade-manager.ts               # Efeitos cascata
│   │   └── validation-service.ts            # Validações críticas
│   └── types/
│       └── shared-module-types.ts           # Tipos compartilhados
├── gestao/                     # Domínio: Gestão Administrativa
│   ├── page.tsx               # Dashboard gestão + Context
│   ├── _domain/               # Lógica de negócio
│   │   ├── hooks/
│   │   │   ├── use-gestao-operations.ts     # Operações otimísticas
│   │   │   └── use-gestao-cascade.ts        # Efeitos cascata
│   │   ├── services/
│   │   │   ├── gestao-audit-service.ts      # Audit específico
│   │   │   └── gestao-validation.ts         # Validações
│   │   └── types/
│   │       └── gestao-types.ts              # Tipos do domínio
│   ├── modulos-base/
│   │   ├── page.tsx           # Página + audit + toast + cascata
│   │   └── components/        # Componentes migrados + melhorias
│   ├── implementacoes/
│   │   ├── page.tsx           # Página + patterns completos
│   │   └── components/        # Componentes migrados
│   ├── atribuicoes/
│   │   ├── page.tsx           # Página + patterns completos
│   │   └── components/        # Componentes migrados
│   └── configuracoes/         # Nova sub-área
│       ├── page.tsx           # Consolidar configs + audit
│       └── components/        # Novos componentes
├── desenvolvimento/            # Domínio: Ferramentas Dev
│   ├── page.tsx               # Dashboard dev + Context
│   ├── _domain/               # Lógica específica
│   │   ├── hooks/
│   │   │   └── use-dev-operations.ts        # Operações dev
│   │   └── services/
│   │       └── dev-audit-service.ts         # Audit para devs
│   ├── ferramentas/
│   │   ├── page.tsx           # Debug + logs + quality
│   │   └── components/        # Componentes migrados
│   ├── templates/             # Nova: Sistema scaffolding
│   │   ├── page.tsx           # Geração de templates
│   │   └── components/        # Novos componentes
│   └── monitoramento/
│       ├── page.tsx           # Health monitoring expandido
│       └── components/        # Componentes migrados + novos
└── estatisticas/              # Domínio: Analytics e Métricas
    ├── page.tsx               # Dashboard estatísticas + Context
    ├── _domain/               # Lógica analytics
    │   ├── hooks/
    │   │   └── use-stats-operations.ts      # Operações stats
    │   └── services/
    │       └── stats-service.ts             # Cálculos avançados
    ├── performance/
    │   ├── page.tsx           # Métricas performance
    │   └── components/        # Novos componentes
    ├── uso/
    │   ├── page.tsx           # Analytics uso + audit
    │   └── components/        # Novos componentes
    └── relatorios/
        ├── page.tsx           # Relatórios executivos
        └── components/        # Novos componentes
```

#### 1.2 Configurar Roteamento + Context + Providers
- **Landing page** com navegação em cards + estatísticas
- **Layout compartilhado** com Context Providers obrigatórios
- **Breadcrumbs automáticos** baseados na estrutura
- **Middleware** para redirect + audit de navegação
- **Context global** para estado otimístico compartilhado

### **Fase 2: Migração com Padrões Obrigatórios** ⏱️ 8-10h

#### 2.1 Área de Gestão (Padrões Completos)
- ✅ **Módulos Base**: 
  - Migrar `BaseModulesTable` + todos os dialogs
  - **✨ Adicionar**: Audit logging para todas operações
  - **✨ Adicionar**: Toast feedback específico por ação
  - **✨ Adicionar**: Dialogs de confirmação para delete/archive/purge
  - **✨ Adicionar**: Efeito cascata para implementações dependentes
  - **📝 Comentários**: Documentar padrões otimísticos

- ✅ **Implementações**: 
  - Migrar `ImplementationsManager` + componentes
  - **✨ Adicionar**: Validation de dependências circulares
  - **✨ Adicionar**: Audit completo de mudanças
  - **✨ Adicionar**: Confirmação para delete (verificar assignments)
  - **✨ Adicionar**: Toast com ações (ex: "Desfazer")
  - **📝 Comentários**: Explicar lógica de dependências

- ✅ **Atribuições**: 
  - Migrar `TenantAssignmentsManager` + dialogs
  - **✨ Adicionar**: Audit de mudanças de configuração
  - **✨ Adicionar**: Validação de permissões antes de atribuir
  - **✨ Adicionar**: Confirmação para unassign (impacto nos usuários)
  - **✨ Adicionar**: Toast com detalhes do impacto
  - **📝 Comentários**: Documentar efeitos em cascata

- 🆕 **Configurações**: 
  - Consolidar `ModuleSettingsForm`, `PermissionManager`, `NotificationManager`
  - **✨ Implementar**: Sistema completo de audit para configs
  - **✨ Implementar**: Validação crítica antes de salvar
  - **✨ Implementar**: Confirmação para mudanças sensíveis
  - **✨ Implementar**: Preview de impacto das mudanças
  - **📝 Comentários**: Explicar cada configuração sensível

#### 2.2 Área de Desenvolvimento (Foco em Ferramentas)
- ✅ **Dashboard**: 
  - Migrar `DevelopmentDashboard`
  - **✨ Adicionar**: Audit das ações de debug
  - **✨ Adicionar**: Toast para operações de debug
  - **📝 Comentários**: Explicar métricas de desenvolvimento

- ✅ **Ferramentas**: 
  - Migrar `QualityAnalysis`, `DevelopmentLogs`, `DebugToolsPanel`
  - **✨ Adicionar**: Audit de uso de ferramentas
  - **✨ Adicionar**: Confirmação para operações destrutivas (reset, purge)
  - **✨ Adicionar**: Toast detalhado para resultados de debug
  - **📝 Comentários**: Guias de uso das ferramentas

- 🆕 **Templates**: 
  - Criar sistema de scaffolding de módulos
  - **✨ Implementar**: Audit de geração de templates
  - **✨ Implementar**: Validação de nomes e estruturas
  - **✨ Implementar**: Confirmação antes de gerar arquivos
  - **✨ Implementar**: Toast com próximos passos
  - **📝 Comentários**: Explicar processo de scaffolding

- ✅ **Monitoramento**: 
  - Expandir `ModuleHealthCard`, `RealTimeMetrics`
  - **✨ Adicionar**: Audit de verificações de saúde
  - **✨ Adicionar**: Toast para alertas críticos
  - **📝 Comentários**: Explicar métricas e thresholds

#### 2.3 Área de Estatísticas (Analytics Avançadas)
- 🆕 **Performance**: 
  - Criar métricas avançadas de performance
  - **✨ Implementar**: Audit de consultas de métricas
  - **✨ Implementar**: Toast para anomalias detectadas
  - **📝 Comentários**: Explicar cálculos de performance

- 🆕 **Analytics**: 
  - Desenvolver analytics de uso e adoção
  - **✨ Implementar**: Audit de exportação de dados
  - **✨ Implementar**: Confirmação para operações de agregação custosas
  - **✨ Implementar**: Toast com tempo estimado de processamento
  - **📝 Comentários**: Documentar metodologia de cálculo

- ✅ **Health**: 
  - Mover `ModuleStatsWidget`, expandir relatórios
  - **✨ Adicionar**: Audit de acesso a dados sensíveis
  - **✨ Adicionar**: Toast para atualizações de estatísticas
  - **📝 Comentários**: Explicar origem dos dados

- 🆕 **Relatórios**: 
  - Dashboard executivo com insights
  - **✨ Implementar**: Audit de geração de relatórios
  - **✨ Implementar**: Confirmação para relatórios custosos
  - **✨ Implementar**: Toast com status de geração
  - **📝 Comentários**: Guia de interpretação dos insights

### **Fase 3: Componentes Novos (Seguindo Padrões Rigorosos)** ⏱️ 6-8h

#### 3.1 Landing Page Components (Com Audit e Toast)
```typescript
// ModuleManagementLanding.tsx
interface NavigationCard {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  stats?: Record<string, number>;
  // ✨ Padrões obrigatórios
  requiresConfirmation?: boolean;  // Para áreas críticas
  auditAction?: string;           // Action para logging
  toastMessage?: string;          // Feedback ao navegar
}

// ✨ Implementar com:
// - Audit de navegação entre áreas
// - Toast de boas-vindas personalizado por área
// - Confirmação para área de desenvolvimento (se necessário)
// - Comentários explicando cada área
```

#### 3.2 Shared Layout (Com Context Providers Obrigatórios)
```typescript
// ModuleManagementLayout.tsx
interface ModuleLayoutProps {
  children: React.ReactNode;
  currentArea: 'gestao' | 'desenvolvimento' | 'estatisticas';
  // ✨ Padrões obrigatórios
  auditContext: {
    area: string;
    subArea?: string;
    userId: string;
    organizationId: string;
  };
  optimisticState: OptimisticStateManager;
  toastManager: ToastManager;
}

// ✨ Implementar com:
// - Context providers para cada domínio
// - Audit automático de tempo na página
// - Toast manager com padrões específicos
// - Breadcrumbs com audit de navegação
// - Comentários sobre a arquitetura do layout
```

#### 3.3 Novos Dashboards (Patterns Completos)
- **GestaoOverview**: 
  - Resumo operacional com audit de visualização
  - Toast para alertas de módulos
  - Confirmação para ações em lote
  - Comentários sobre métricas exibidas

- **DesenvolvimentoOverview**: 
  - Ferramentas e status dev
  - Audit de uso de ferramentas
  - Toast para status de builds/deploys
  - Confirmação para operações destrutivas
  - Comentários sobre ferramentas disponíveis

- **EstatisticasOverview**: 
  - KPIs e métricas principais
  - Audit de acesso a dados sensíveis
  - Toast para atualizações de métricas
  - Confirmação para exportações grandes
  - Comentários sobre metodologia de cálculo

### **Fase 4: Data Management (Estado Otimístico Global)** ⏱️ 4-5h

#### 4.1 Hooks Compartilhados (Com Todos os Padrões)
```typescript
// useModuleManagementData.ts
export const useModuleManagementData = () => {
  // ✨ Estado global compartilhado entre sub-páginas
  // ✨ Cache inteligente por área
  // ✨ Audit logging integrado
  // ✨ Toast manager integrado
  // ✨ Validações críticas
  // ✨ Efeitos cascata automáticos
  
  return {
    // Dados
    baseModules, implementations, assignments, stats,
    
    // Operações otimísticas
    optimisticOperations: {
      create: (entity, type) => string,  // Retorna operationId
      update: (entity, type) => string,
      delete: (id, type) => string,
      // ✨ Com audit automático
      // ✨ Com toast automático
      // ✨ Com validação automática
    },
    
    // Gerenciamento de estado
    confirmOperation: (operationId, serverData) => void,
    revertOperation: (operationId, error) => void,
    
    // Audit e feedback
    auditAction: (action, details) => Promise<void>,
    showToast: (type, message, options) => void,
    
    // Validações críticas
    validateOperation: (operation) => Promise<ValidationResult>,
    
    // Efeitos cascata
    triggerCascade: (entity, operation) => Promise<void>
  };
}

// ✨ Implementar com comentários detalhados sobre:
// - Fluxo de dados otimístico
// - Estratégias de cache
// - Padrões de audit
// - Gestão de toasts
```

#### 4.2 Context Provider (Arquitetura Robusta)
```typescript
// ModuleManagementContext.tsx
interface ModuleManagementContextValue {
  // Dados principais
  baseModules: BaseModule[];
  implementations: ModuleImplementation[];
  assignments: TenantModuleAssignment[];
  stats: ModuleStats;
  
  // ✨ Estado otimístico
  optimisticState: OptimisticStateManager;
  
  // ✨ Audit logging
  auditLogger: AuditLogger;
  
  // ✨ Toast management
  toastManager: ToastManager;
  
  // ✨ Validação crítica
  validationService: ValidationService;
  
  // ✨ Efeitos cascata
  cascadeManager: CascadeManager;
  
  // ✨ Funções com padrões completos
  operations: {
    // Cada operação inclui automaticamente:
    // - Estado otimístico
    // - Audit logging
    // - Toast feedback
    // - Validação crítica
    // - Efeitos cascata
    createBaseModule: (data) => Promise<OperationResult>;
    updateBaseModule: (id, data) => Promise<OperationResult>;
    deleteBaseModule: (id) => Promise<OperationResult>;
    // ... outras operações
  };
}

// ✨ Implementar com comentários sobre:
// - Responsabilidades de cada service
// - Fluxo de dados entre providers
// - Estratégias de error handling
// - Performance considerations
```

### **Fase 5: Otimizações + Validações Críticas** ⏱️ 3-4h

#### 5.1 Performance (Com Audit)
- **Lazy loading** de componentes por sub-página + audit de carregamento
- **Cache estratégico** de dados por área + audit de cache hits/misses
- **Suspense boundaries** para carregamento otimizado + toast para loading longo
- **Memoização** de operações custosas + comentários sobre trade-offs

#### 5.2 SEO e Navegação (Com Logging)
- **Meta tags** dinâmicas por sub-página + audit de visualizações
- **Breadcrumbs** automáticos + audit de navegação
- **Deep linking** para estados específicos + toast para links copiados

#### 5.3 Validações e Confirmações Críticas
- **Operações destrutivas**: Sempre com dialog de confirmação
- **Mudanças em cascata**: Preview do impacto + confirmação
- **Operações custosas**: Estimativa de tempo + confirmação
- **Dados sensíveis**: Confirmação dupla + audit detalhado

## 🏗️ Padrões e Convenções (Rigorosamente Aplicados)

### **Estrutura de Arquivos (Domain-Driven)**
```
<area>/
├── page.tsx                    # Dashboard principal + Context + Providers
├── _domain/                    # Lógica de negócio do domínio
│   ├── hooks/
│   │   ├── use-{area}-operations.ts        # Operações otimísticas
│   │   ├── use-{area}-cascade.ts           # Efeitos cascata
│   │   └── use-{area}-audit.ts             # Audit específico
│   ├── services/
│   │   ├── {area}-validation.ts            # Validações críticas
│   │   ├── {area}-toast-manager.ts         # Toast padronizado
│   │   └── {area}-audit-service.ts         # Audit logging
│   └── types/
│       └── {area}-types.ts                 # Tipos do domínio
├── components/                 # Componentes específicos da área
│   ├── shared/                # Compartilhados dentro da área
│   ├── dialogs/              # Dialogs de confirmação
│   ├── forms/                # Formulários com validação
│   └── tables/               # Tabelas com estado otimístico
└── <subarea>/                # Sub-áreas quando necessário
    ├── page.tsx              # Página + padrões completos
    └── components/           # Componentes específicos
```

### **Nomenclatura (Estritamente Seguida)**
- **Pastas**: kebab-case (`modulos-base`, `_domain`)
- **Componentes**: PascalCase (`GestaoOverview`, `BaseModuleDialog`)
- **Arquivos**: kebab-case (`gestao-overview.tsx`, `use-audit-logger.ts`)
- **Hooks**: `use-{purpose}-{entity}.ts`
- **Services**: `{area}-{purpose}-service.ts`
- **Types**: `{area}-types.ts`

### **Import Patterns (Organizados)**
```typescript
// ✨ Imports absolutos sempre - ordem específica
// 1. React e Next.js
import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// 2. External libraries
import { toast } from 'sonner';

// 3. Internal shared
import { Layout } from '@/shared/components/Layout';
import { Button } from '@/shared/ui/button';

// 4. Internal domain
import { useModuleManagementData } from '@/app/(protected)/admin/modules/_shared/hooks';
import { auditAction } from '@/app/(protected)/admin/modules/_shared/services';

// 5. Local components
import { BaseModulesTable } from './components/tables';
import { CreateBaseModuleDialog } from './components/dialogs';

// ✨ Re-exports organizados com comentários
export { 
  BaseModulesTable,           // Tabela principal de módulos base
  CreateBaseModuleDialog,     // Dialog para criação com validação
  EditBaseModuleDialog       // Dialog para edição com audit
} from './components';
```

### **Component Patterns (Com Padrões Obrigatórios)**

#### Dashboard Pages
```typescript
'use client';

/**
 * Dashboard da área de gestão de módulos
 * 
 * Responsabilidades:
 * - Fornecer visão geral das operações de gestão
 * - Integrar estado otimístico global
 * - Registrar audit de visualizações
 * - Gerenciar toasts específicos da área
 * 
 * Padrões aplicados:
 * - Atualização otimística via Context
 * - Audit logging automático
 * - Toast feedback para todas ações
 * - Validação crítica antes de operações
 * - Efeitos cascata automáticos
 */
export default function GestaoAreaDashboard() {
  // ✨ Hooks obrigatórios com padrões
  const { operations, auditAction, showToast } = useModuleManagementData();
  const { validateCriticalOperation } = useGestaoValidation();
  const { triggerCascade } = useGestaoCascade();
  
  // ✨ Audit de visualização da página
  useEffect(() => {
    auditAction('GESTAO_DASHBOARD_VIEWED', {
      timestamp: Date.now(),
      area: 'gestao'
    });
  }, []);

  return (
    <ModuleManagementLayout currentArea="gestao">
      {/* Header com estatísticas e actions */}
      <DashboardHeader />
      
      {/* Overview com métricas em tempo real */}
      <StatsOverview />
      
      {/* Ações rápidas com confirmação */}
      <QuickActions 
        onAction={async (action) => {
          // ✨ Padrão completo para ações
          const isValid = await validateCriticalOperation(action);
          if (!isValid) return;
          
          const operationId = await operations[action.type](action.data);
          showToast('success', `${action.name} iniciado`, {
            action: { label: 'Ver detalhes', onClick: () => {} }
          });
          
          await triggerCascade(action.entity, action.type);
        }}
      />
      
      {/* Atividade recente com audit */}
      <RecentActivity />
    </ModuleManagementLayout>
  );
}
```

#### Sub-pages com Padrões Completos
```typescript
'use client';

/**
 * Página de gestão de módulos base
 * 
 * Funcionalidades:
 * - CRUD completo com estado otimístico
 * - Audit logging de todas operações
 * - Toast feedback específico
 * - Dialogs de confirmação para ações críticas
 * - Efeitos cascata para entidades dependentes
 * 
 * Validações críticas:
 * - Delete: Verificar implementações dependentes
 * - Archive: Verificar assignments ativos
 * - Purge: Confirmação dupla obrigatória
 */
export default function ModulosBasePage() {
  // ✨ Hooks com padrões obrigatórios
  const { 
    baseModules, 
    operations, 
    auditAction, 
    showToast 
  } = useModuleManagementData();
  
  const { 
    validateDelete, 
    validateArchive, 
    validatePurge 
  } = useBaseModuleValidation();
  
  const { 
    cascadeToImplementations, 
    cascadeToAssignments 
  } = useBaseModuleCascade();

  // ✨ Handler com padrão completo
  const handleDeleteModule = useCallback(async (moduleId: string) => {
    try {
      // 1. Validação crítica
      const validation = await validateDelete(moduleId);
      if (!validation.isValid) {
        showToast('error', validation.message);
        return;
      }

      // 2. Confirmação obrigatória para delete
      const confirmed = await showConfirmDialog({
        title: 'Deletar Módulo Base',
        description: validation.impactMessage,
        type: 'destructive'
      });
      
      if (!confirmed) return;

      // 3. Operação otimística
      const operationId = operations.deleteBaseModule(moduleId);
      
      // 4. Toast imediato
      showToast('success', 'Módulo deletado', {
        description: 'Processando efeitos em cascata...',
        action: { label: 'Desfazer', onClick: () => operations.revert(operationId) }
      });

      // 5. Audit logging
      await auditAction('BASE_MODULE_DELETED', {
        moduleId,
        impact: validation.impactDetails
      });

      // 6. Efeitos cascata
      await cascadeToImplementations(moduleId, 'delete');
      await cascadeToAssignments(moduleId, 'delete');

    } catch (error) {
      showToast('error', 'Erro ao deletar módulo', {
        description: error.message
      });
    }
  }, [operations, auditAction, showToast, validateDelete, cascadeToImplementations, cascadeToAssignments]);

  return (
    <ModuleManagementLayout currentArea="gestao">
      <PageHeader 
        title="Módulos Base"
        description="Gerencie os módulos base do sistema"
      />
      
      <BaseModulesTable
        modules={baseModules}
        onDelete={handleDeleteModule}
        // ... outros handlers com padrões similares
      />
    </ModuleManagementLayout>
  );
}
```

### **Estado e Cache (Com Audit)**
```typescript
// Hook padrão para todas as áreas com logging
const useAreaData = (area: string) => {
  const cacheKey = `module-management-${area}`;
  
  // ✨ Cache com audit de performance
  useEffect(() => {
    auditAction('CACHE_ACCESS', {
      area,
      cacheKey,
      timestamp: Date.now()
    });
  }, [area]);
  
  // Implementação com cache inteligente + métricas
};
```

### **Breadcrumbs Automáticos (Com Audit)**
```typescript
// Configuração automática baseada na rota + logging
const breadcrumbsConfig = {
  '/admin/modules': {
    items: ['Admin', 'Módulos'],
    auditAction: 'MODULES_LANDING_VIEWED'
  },
  '/admin/modules/gestao': {
    items: ['Admin', 'Módulos', 'Gestão'],
    auditAction: 'GESTAO_AREA_VIEWED'
  },
  '/admin/modules/gestao/modulos-base': {
    items: ['Admin', 'Módulos', 'Gestão', 'Módulos Base'],
    auditAction: 'BASE_MODULES_PAGE_VIEWED'
  }
};
```

## 📊 Timeline de Implementação (Atualizado)

### **Sprint 1: Fundação + Estrutura** (8-10h)
- ✅ **Fase 1**: Estrutura Domain-Driven + Context Providers
- ✅ **Shared Services**: Audit Logger, Toast Manager, Validation Service
- ✅ **Landing Page**: Com audit de navegação + toast de boas-vindas
- ✅ **Layout Base**: Context providers obrigatórios + breadcrumbs com audit

### **Sprint 2: Gestão (Migração Completa)** (10-12h)  
- ✅ **Módulos Base**: Migração + audit + toast + confirmações + cascata
- ✅ **Implementações**: Migração + validação de dependências + feedback
- ✅ **Atribuições**: Migração + validação de permissões + impacto em cascata
- ✅ **Configurações**: Nova área + consolidação + audit crítico

### **Sprint 3: Desenvolvimento + Estatísticas** (8-10h)
- ✅ **Área Desenvolvimento**: Ferramentas + templates + monitoramento + audit
- ✅ **Área Estatísticas**: Performance + analytics + relatórios + audit
- ✅ **Componentes Novos**: Com padrões completos obrigatórios

### **Sprint 4: Data Management + Context** (6-8h)
- ✅ **Context Global**: Estado otimístico + audit + toast + cascata
- ✅ **Hooks Compartilhados**: Operações com padrões completos
- ✅ **Services**: Validation, Cascade, Audit centralizados

### **Sprint 5: Otimizações + Validações** (4-6h)
- ✅ **Performance**: Lazy loading + cache + audit de performance
- ✅ **Validações Críticas**: Confirmações obrigatórias + preview de impacto
- ✅ **SEO + Navegação**: Meta tags + deep linking + audit

### **Sprint 6: Testes + Documentação** (4-5h)
- 🧪 **Testes Críticos**: Fluxos de confirmação + cascata + audit
- 📝 **Documentação**: Padrões + exemplos + troubleshooting
- 🚀 **Deploy + Monitoramento**: Com audit de deployment

**Total Estimado: 40-51 horas** (vs 18-25h original)

## ✅ Critérios de Sucesso (Expandidos)

### **Funcional (Obrigatório)**
- [ ] **100% funcionalidades migradas** com zero regressões
- [ ] **Navegação intuitiva** entre todas as áreas e sub-páginas
- [ ] **Performance melhorada** (< 2s carregamento inicial)
- [ ] **Estado otimístico** funcionando em todas operações
- [ ] **Efeitos cascata** implementados e testados
- [ ] **Todos os caminhos de usuário** funcionais e testados

### **Segurança e Audit (Crítico)**
- [ ] **Audit logging** para 100% das operações críticas
- [ ] **Confirmações obrigatórias** para operações destrutivas
- [ ] **Validações críticas** antes de operações sensíveis
- [ ] **Preview de impacto** para mudanças em cascata
- [ ] **Logs estruturados** com timestamp, userId, organizationId

### **UX e Feedback (Essencial)**
- [ ] **Toast feedback** específico para cada tipo de ação
- [ ] **Toasts com ações** (Desfazer, Ver detalhes, etc.)
- [ ] **Confirmações contextuais** com descrição clara do impacto
- [ ] **Loading states** para operações longas (>2s)
- [ ] **Error handling** com mensagens específicas e actionables

### **Técnico (Qualidade)**
- [ ] **Componentes bem organizados** seguindo Domain-Driven
- [ ] **Cache eficiente** por área com audit de performance
- [ ] **TypeScript strict** compliance + comentários obrigatórios
- [ ] **Imports organizados** seguindo padrão estabelecido
- [ ] **Services centralizados** para audit, toast, validação
- [ ] **Hooks especializados** por domínio e responsabilidade

### **Arquitetura (Padrões)**
- [ ] **Domain-Driven Organization** aplicado rigorosamente
- [ ] **Context Providers** estruturados por responsabilidade
- [ ] **Estado otimístico** centralizado e compartilhado
- [ ] **Efeitos cascata** automáticos e configuráveis
- [ ] **Validation services** reutilizáveis e extensíveis

### **Performance (Otimização)**
- [ ] **Lazy loading** implementado em todas sub-páginas
- [ ] **Cache inteligente** com invalidação automática
- [ ] **Memoização** de operações custosas
- [ ] **Suspense boundaries** para carregamento otimizado
- [ ] **Bundle splitting** por área/domínio

## 🔧 Comandos de Desenvolvimento (Com Audit)

```bash
# Servidor de desenvolvimento
npm run dev

# Linting e formatação (obrigatório antes de commits)
npm run lint
npm run format

# Testes relacionados (incluindo testes de audit)
npm test modules
npm test modules:audit        # Testes específicos de audit logging
npm test modules:optimistic   # Testes de estado otimístico
npm test modules:cascade      # Testes de efeitos cascata

# Build de produção
npm run build

# Validação de padrões (novo)
npm run validate:patterns     # Verificar se padrões foram seguidos
npm run validate:comments     # Verificar documentação inline
npm run validate:audit        # Verificar cobertura de audit logging
```

## 📋 Checklist de Implementação (Obrigatório)

### **✅ Para Cada Página/Componente**
- [ ] **Audit logging** implementado para todas ações críticas
- [ ] **Toast feedback** específico para cada operação
- [ ] **Dialog de confirmação** para operações destrutivas
- [ ] **Validação crítica** antes de executar operações
- [ ] **Efeitos cascata** identificados e implementados
- [ ] **Estado otimístico** integrado (quando aplicável)
- [ ] **Comentários JSDoc** explicando responsabilidades
- [ ] **Imports organizados** seguindo padrão estabelecido
- [ ] **Error handling** robusto com mensagens específicas
- [ ] **Loading states** para operações > 2s

### **✅ Para Cada Hook**
- [ ] **Comentários** explicando propósito e uso
- [ ] **Dependências corretas** em useEffect/useCallback
- [ ] **Error handling** interno
- [ ] **Performance considerations** (memoization)
- [ ] **TypeScript strict** compliance

### **✅ Para Cada Service**
- [ ] **Audit logging** integrado
- [ ] **Error handling** padronizado
- [ ] **Validações** apropriadas
- [ ] **Comentários** sobre algoritmos complexos
- [ ] **Tipos bem definidos**

## 📝 Notas de Implementação (Rigorosas)

### **Compatibilidade (100% Garantida)**
- **Zero breaking changes** - todas URLs antigas devem funcionar
- **Migração gradual** com feature flags se necessário
- **Rollback plan** testado e documentado
- **Backward compatibility** de APIs internas

### **Performance (Otimizada)**
- **Lazy loading** obrigatório para todas sub-páginas
- **React.memo** em componentes que re-renderizam frequentemente
- **useMemo/useCallback** para computações custosas (> 10ms)
- **Bundle splitting** por área para carregamento otimizado
- **Cache strategies** documentadas e testadas

### **Acessibilidade (WCAG 2.1 AA)**
- **Focus management** correto na navegação entre páginas
- **Screen reader** support com aria-labels apropriados
- **Keyboard navigation** completa (Tab, Enter, Escape)
- **Color contrast** adequado (> 4.5:1)
- **Text alternatives** para ícones e gráficos

### **Segurança (Crítica)**
- **Audit trail** completo para operações administrativas
- **Validação dupla** para operações destrutivas
- **Input sanitization** em todos formulários
- **Permission checks** antes de cada operação
- **Error messages** que não vazam informações sensíveis

### **Testing Strategy (Abrangente)**
```typescript
// Padrão de teste para cada página
describe('ModulosBasePage', () => {
  // Funcionalidade básica
  it('should render correctly', () => {});
  it('should load data on mount', () => {});
  
  // Estado otimístico
  it('should handle optimistic operations', () => {});
  it('should revert on server error', () => {});
  
  // Audit logging
  it('should log all critical operations', () => {});
  it('should capture user context', () => {});
  
  // Toast feedback
  it('should show appropriate toasts', () => {});
  it('should include action buttons when applicable', () => {});
  
  // Confirmações
  it('should require confirmation for destructive operations', () => {});
  it('should show impact preview', () => {});
  
  // Efeitos cascata
  it('should trigger cascade effects', () => {});
  it('should handle cascade failures', () => {});
});
```

## 🚨 Critérios de Bloqueio (Não Negociáveis)

### **Antes de Merge:**
1. **100% coverage** de audit logging em operações críticas
2. **Zero console.log** em produção (apenas console.debug)
3. **Todos os dialogs críticos** implementados e testados
4. **Estado otimístico** funcionando sem race conditions
5. **Efeitos cascata** mapeados e implementados
6. **Performance** < 2s para carregamento inicial
7. **TypeScript** strict sem erros ou warnings
8. **Testes** cobrindo todos os fluxos críticos

### **Antes de Deploy:**
1. **Audit logs** sendo gravados corretamente no banco
2. **Toast system** funcionando em todos navegadores
3. **Confirmações** bloqueando operações perigosas
4. **Rollback plan** testado e aprovado
5. **Documentation** atualizada com novos padrões
6. **Performance monitoring** configurado
7. **Error tracking** capturando todos erros críticos

---

**Estimativa Total Atualizada**: 40-51 horas de desenvolvimento
**Complexidade**: Alta (reorganização + padrões rigorosos)
**Impacto**: Muito Alto (melhoria significativa + segurança + auditabilidade)
**ROI**: Alto (base sólida para futuras expansões)