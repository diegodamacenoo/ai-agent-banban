# Arquitetura Client-Modules - Estado Atual

## Visão Geral

O sistema evoluiu para uma **arquitetura modular baseada em base modules, implementações e atribuições de tenant**. Esta nova estrutura permite separação clara entre módulos base (catálogo), implementações específicas e atribuições por organização, garantindo máxima flexibilidade e escalabilidade na arquitetura multi-tenant.

## Nova Arquitetura de Banco de Dados

### Estrutura Principal

```sql
-- 1. CATÁLOGO DE MÓDULOS BASE
base_modules {
  id, slug, name, description, category,
  is_active, route_pattern, permissions_required,
  supports_multi_tenant, config_schema,
  archived_at, deleted_at, status, version
}

-- 2. IMPLEMENTAÇÕES ESPECÍFICAS  
module_implementations {
  id, base_module_id, implementation_key,
  component_path, is_default, is_active,
  component_type, template_type, template_config,
  dependencies, archived_at, deleted_at,
  audience, complexity, priority
}

-- 3. ATRIBUIÇÕES POR TENANT
tenant_module_assignments {
  tenant_id, base_module_id, implementation_id,
  is_active, custom_config, assigned_at,
  permissions_override, user_groups,
  activation_date, deactivation_date
}
```

## Estrutura de Pastas Atual

```
src/
├── clients/                    # 🎨 FRONTEND - UI e Configurações
│   ├── registry.ts            # Sistema de carregamento dinâmico de clientes
│   └── banban/                # Cliente específico BanBan
│       ├── components/        # Componentes React customizados
│       ├── services/          # Serviços de frontend
│       ├── types/             # Tipos específicos de UI
│       └── config.ts          # Configuração integrada
│
├── core/                      # ⚙️ CORE SYSTEM
│   ├── modules/
│   │   ├── registry/          # Sistema de registro de módulos
│   │   ├── services/          # Serviços compartilhados  
│   │   └── types/             # Tipos compartilhados
│   │
│   └── services/              # Serviços core
│       ├── module-discovery.ts    # Descoberta de módulos
│       └── module-file-monitor.ts # Monitoramento de arquivos
│
├── app/actions/admin/         # 📋 SERVER ACTIONS
│   ├── tenant-modules.ts      # Gestão de atribuições
│   ├── base-modules.ts        # Gestão do catálogo
│   └── module-implementations.ts # Gestão de implementações
│
├── shared/types/              # 🔗 TIPOS COMPARTILHADOS
│   ├── module-lifecycle.ts    # Tipos de lifecycle
│   ├── module-system.ts       # Tipos do sistema
│   └── client-module-interface.ts
│
└── backend/                   # 🚀 BACKEND SEPARADO (Fastify)
    ├── src/modules/
    │   ├── base/              # Módulos base reutilizáveis
    │   │   └── performance-base/
    │   └── custom/            # Módulos customizados
    │       ├── banban-performance/
    │       ├── banban-purchase-flow/
    │       └── banban-inventory-flow/
    │
    └── src/shared/
        ├── module-loader/     # Carregamento dinâmico
        └── tenant-manager/    # Gestão multi-tenant
```

## Sistema de Módulos Atualizado

### Fluxo de Gestão de Módulos

```typescript
// 1. CATÁLOGO (base_modules)
interface BaseModule {
  id: string;
  slug: string;                        // 'performance', 'banban-insights'
  name: string;                        // 'Performance Analytics'
  description: string;
  category: string;                    // 'analytics', 'operations'
  supports_multi_tenant: boolean;
  config_schema: Record<string, any>;
}

// 2. IMPLEMENTAÇÕES (module_implementations)  
interface ModuleImplementation {
  id: string;
  base_module_id: string;
  implementation_key: string;          // 'default', 'banban-custom'
  component_path: string;              // '/widgets/performance-widget.tsx'
  component_type: 'file' | 'generated';
  template_type?: 'dashboard' | 'table' | 'chart';
  dependencies?: string[];
  audience: 'generic' | 'banban' | 'riachuelo';
}

// 3. ATRIBUIÇÕES (tenant_module_assignments)
interface TenantModuleAssignment {
  tenant_id: string;                   // organization_id
  base_module_id: string;
  implementation_id?: string;
  is_active: boolean;
  custom_config: Record<string, any>;
  permissions_override?: string[];
}
```

### Server Actions Implementadas

```typescript
// Gestão de atribuições de módulos
getAssignedModulesForOrg(orgId): Promise<TenantModuleDetails[]>
getAvailableModulesForOrg(orgId): Promise<BaseModule[]>
assignModuleToOrg(orgId, moduleId): Promise<ActionResult>
unassignModuleFromOrg(orgId, moduleId): Promise<ActionResult>

// Controle de status e visibilidade
updateTenantModuleStatus(orgId, moduleId, isEnabled): Promise<ActionResult>
updateTenantModuleVisibility(orgId, moduleId, isVisible): Promise<ActionResult>
getVisibleModulesForTenant(orgId): Promise<string[]>

// Gestão do catálogo base
getAllBaseModules(): Promise<BaseModule[]>
createBaseModule(moduleData): Promise<ActionResult>
updateBaseModule(moduleId, moduleData): Promise<ActionResult>

// Gestão de implementações
getImplementationsForModule(moduleId): Promise<ModuleImplementation[]>
createModuleImplementation(implData): Promise<ActionResult>
```

### Backend Modular (Fastify)

Nova arquitetura backend separada com sistema modular:

```typescript
// backend/src/modules/base/performance-base/
interface PerformanceBaseModule {
  name: 'performance-base';
  schemas: PerformanceSchemas;
  services: PerformanceService;
  routes: PerformanceRoutes;
  
  // Implementação base reutilizável
  calculateMetrics(tenantId: string): Promise<Metrics>;
  getPerformanceData(filters: Filters): Promise<Data>;
}

// backend/src/modules/custom/banban-performance/
interface BanbanPerformanceModule extends PerformanceBaseModule {
  name: 'banban-performance';
  
  // Especialização para Banban
  calculateFashionMetrics(tenantId: string): Promise<FashionMetrics>;
  getSeasonalTrends(period: Period): Promise<Trends>;
  optimizeInventory(params: OptimizationParams): Promise<Suggestions>;
}
```

### Configuração Multi-Tenant

```typescript
// backend/src/shared/tenant-manager/
interface TenantModuleConfig {
  tenantId: string;
  modules: {
    [moduleId: string]: {
      enabled: boolean;
      implementation: 'base' | 'custom';
      config: Record<string, any>;
      permissions: string[];
    }
  };
}

// Exemplo configuração Banban
const banbanConfig: TenantModuleConfig = {
  tenantId: 'banban-org-123',
  modules: {
    'performance': {
      enabled: true,
      implementation: 'custom',  // usa banban-performance
      config: {
        fashionMetrics: true,
        seasonalAnalysis: true,
        customInsights: ['margin-optimization', 'trend-analysis']
      },
      permissions: ['read:performance', 'write:optimization']
    },
    'purchase-flow': {
      enabled: true,
      implementation: 'custom',  // usa banban-purchase-flow
      config: {
        automaticReorder: true,
        supplierIntegration: true
      }
    }
  }
};
```

## Nova Taxonomia de Módulos

### 1. Base Modules (Catálogo)
- **Tabela**: `base_modules`  
- **Função**: Definições conceituais de módulos
- **Características**:
  - Slug único (`performance`, `banban-insights`)
  - Metadados (nome, descrição, categoria)
  - Schema de configuração
  - Suporte multi-tenant

### 2. Module Implementations (Implementações)
- **Tabela**: `module_implementations`
- **Função**: Implementações específicas de módulos base
- **Características**:
  - Referência ao `base_module_id`
  - `component_path` para localização do código
  - `audience` (generic, banban, riachuelo)
  - `template_type` (dashboard, table, chart)

### 3. Tenant Module Assignments (Atribuições)
- **Tabela**: `tenant_module_assignments`
- **Função**: Associa módulos a organizações específicas
- **Características**:
  - `tenant_id` + `base_module_id` (chave composta)
  - `implementation_id` opcional
  - `is_active` para controle de status
  - `custom_config` para configurações específicas

### 4. Sistema de Lifecycle
- **Componentes**:
  - `ModuleFileMonitor`: Monitoramento de arquivos
  - `ModuleDiscoveryService`: Descoberta automática
  - `module_file_audit`: Auditoria de mudanças

## Fluxo de Funcionamento Atualizado

### 1. Criação de Módulo Base

```typescript
// Admin cria um novo módulo no catálogo
const baseModule = await createBaseModule({
  slug: 'banban-performance',
  name: 'Performance Analytics Banban',
  description: 'Métricas de performance para varejo de moda',
  category: 'analytics',
  supports_multi_tenant: true,
  config_schema: {
    fashionMetrics: { type: 'boolean', default: true },
    seasonalAnalysis: { type: 'boolean', default: false }
  }
});
```

### 2. Criação de Implementação

```typescript
// Desenvolvedores criam implementações específicas
const implementation = await createModuleImplementation({
  base_module_id: baseModule.id,
  implementation_key: 'banban-custom',
  component_path: '/widgets/banban-performance-widget.tsx',
  component_type: 'file',
  template_type: 'dashboard',
  audience: 'banban',
  dependencies: ['chart-lib', 'date-utils']
});
```

### 3. Atribuição para Tenant

```typescript
// Admin atribui módulo para organização
await assignModuleToOrg('org-banban-123', baseModule.id);

// Sistema cria registro em tenant_module_assignments
{
  tenant_id: 'org-banban-123',
  base_module_id: baseModule.id,
  implementation_id: implementation.id,
  is_active: true,
  custom_config: {
    fashionMetrics: true,
    seasonalAnalysis: true,
    alertThresholds: { critical: 90, warning: 70 }
  }
}
```

### 4. Renderização Frontend

```typescript
// Sistema carrega módulos atribuídos ao tenant
const assignedModules = await getAssignedModulesForOrg(orgId);

// Filtra módulos visíveis
const visibleModules = await getVisibleModulesForTenant(orgId);

// Renderiza componentes baseado em implementações
visibleModules.forEach(moduleSlug => {
  const implementation = findImplementationForModule(moduleSlug);
  const Component = loadComponent(implementation.component_path);
  render(<Component config={implementation.custom_config} />);
});
```

## Princípios da Nova Arquitetura

### 1. Separação em Três Camadas
- **Base Modules**: Catálogo conceitual de módulos disponíveis
- **Implementations**: Implementações concretas com código específico
- **Assignments**: Atribuições personalizadas por tenant

### 2. Multi-Tenancy Nativo
- **Isolamento**: Cada tenant tem suas próprias atribuições
- **Personalização**: Configurações específicas via `custom_config`
- **Permissões**: Controle granular via `permissions_override`

### 3. Sistema de Lifecycle Robusto
- **Health Monitoring**: Verificação automática de integridade
- **File Tracking**: Monitoramento de arquivos e mudanças
- **Auditoria**: Registro completo de mudanças via `module_file_audit`

### 4. Flexibilidade de Implementação
- **Component Types**: file, generated, template-based
- **Template Types**: dashboard, table, chart, form, custom
- **Audience Targeting**: generic, client-specific
- **Dependency Management**: Controle de dependências entre módulos

### 5. Backend Modular (Fastify)
- **Base Modules**: Funcionalidades reutilizáveis
- **Custom Modules**: Especializações para clientes específicos
- **Tenant Manager**: Resolução automática de configuração por tenant
- **Module Loader**: Carregamento dinâmico baseado em configuração

## Estado Atual vs Documentado

### ✅ Implementado

1. **Nova Estrutura de Banco**
   - ✅ `base_modules` - Catálogo de módulos
   - ✅ `module_implementations` - Implementações específicas  
   - ✅ `tenant_module_assignments` - Atribuições por tenant
   - ✅ `module_file_audit` - Auditoria de mudanças

2. **Server Actions Completas**
   - ✅ Gestão de atribuições (`assignModuleToOrg`, `unassignModuleFromOrg`)
   - ✅ Controle de status (`updateTenantModuleStatus`, `updateTenantModuleVisibility`)
   - ✅ Consulta de módulos (`getAssignedModulesForOrg`, `getAvailableModulesForOrg`)

3. **Sistema de Lifecycle**
   - ✅ `ModuleFileMonitor` - Monitoramento de arquivos
   - ✅ `ModuleDiscoveryService` - Descoberta automática
   - ✅ Health scanning e auditoria

4. **Backend Modular (Fastify)**
   - ✅ Estrutura `base/` e `custom/` 
   - ✅ Módulos Banban implementados
   - ✅ Sistema de resolução por tenant

### 🚧 Em Desenvolvimento

- 🚧 Interface admin para gestão visual de módulos
- 🚧 Sistema de templates automáticos
- 🚧 Dashboard de health monitoring
- 🚧 Notificações de mudanças

### 📋 Planejado

- 📋 Marketplace de módulos
- 📋 Versionamento avançado
- 📋 A/B testing de implementações
- 📋 Analytics de uso de módulos

## Benefícios da Nova Arquitetura

### ✅ Escalabilidade Extrema
- **Catálogo Base**: Módulos conceituais reutilizáveis
- **Implementações Múltiplas**: Várias implementações por módulo base
- **Atribuições Flexíveis**: Configuração granular por tenant
- **Backend Modular**: Processamento distribuído via Fastify

### ✅ Manutenibilidade Avançada
- **Separação Clara**: Base/Implementações/Atribuições
- **Health Monitoring**: Detecção automática de problemas
- **Auditoria Completa**: Rastreamento de todas as mudanças
- **Versionamento**: Controle independente por implementação

### ✅ Flexibilidade Total
- **Mix de Implementações**: Genéricas + específicas por cliente
- **Configuração Dinâmica**: `custom_config` por atribuição
- **Controle Granular**: Ativar/desativar por tenant
- **Audience Targeting**: Implementações específicas por cliente

### ✅ Performance Otimizada
- **Carregamento Sob Demanda**: Apenas módulos atribuídos
- **Cache Inteligente**: Configurações cached por tenant
- **Backend Separado**: Processamento independente
- **Health Scanning**: Detecção proativa de problemas

### ✅ Multi-Tenancy Nativo
- **Isolamento Total**: Configurações por tenant
- **Permissões Granulares**: Controle específico por módulo
- **Sincronização Dupla**: Estruturada + compatibilidade
- **Visibilidade Controlada**: Módulos visíveis por sidebar

## Migração Concluída - Nova Era

### Estrutura Final Implementada

1. **Base de Dados Moderna**: Arquitetura de 3 camadas
2. **Server Actions Robustas**: CRUD completo para módulos
3. **Sistema de Lifecycle**: Health monitoring automático
4. **Backend Modular**: Fastify com resolução por tenant
5. **Auditoria Completa**: Rastreamento de mudanças

### Transformações Realizadas

- **Database Schema**: Migração completa para nova estrutura
- **API Layer**: Server actions replacing old endpoints
- **Health System**: Monitoramento automático de integridade
- **Multi-Tenant Core**: Isolamento nativo por organização
- **Modular Backend**: Fastify com sistema de módulos

**Esta nova arquitetura estabelece uma base sólida para crescimento exponencial, mantendo simplicidade para casos básicos e robustez para necessidades complexas de clientes enterprise.** 