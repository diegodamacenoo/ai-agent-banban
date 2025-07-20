# Arquitetura do Sistema Axon - Estado Atual 2025

## Visão Geral

**Axon** evoluiu para uma plataforma enterprise-grade de módulos inteligentes com arquitetura distribuída. O sistema implementa um modelo de 3 camadas (Base Modules → Implementações → Atribuições) com backend independente, monitoramento automático de saúde e multi-tenancy nativo para máxima escalabilidade e flexibilidade.

## Stack Tecnológico Modernizado

### Frontend Layer
- **Next.js 14** (App Router, Server Actions, RSC)
- **React 18** + TypeScript (strict mode)
- **Tailwind CSS** + Radix UI (design system)
- **Supabase Auth** (JWT + MFA)
- **Module System** (dynamic loading por tenant)

### Backend Layer (Independente)
- **Fastify** (high-performance Node.js API)
- **Module Resolver** (resolução automática por tenant)
- **Tenant Manager** (multi-tenant nativo)
- **Base Modules** (funcionalidades reutilizáveis)
- **Custom Modules** (especializações por cliente)

### Data Layer
- **Supabase/PostgreSQL** (RLS nativo)
  - `base_modules` (catálogo de módulos)
  - `module_implementations` (implementações específicas)
  - `tenant_module_assignments` (atribuições por tenant)
  - `module_file_audit` (auditoria completa)
- **Redis Cache** (cache distribuído)
- **Webhook System** (integração com sistemas externos)

### Monitoring & Lifecycle
- **ModuleFileMonitor** (health scanning automático)
- **ModuleDiscoveryService** (descoberta de módulos)
- **Audit System** (rastreamento completo)
- **Health Dashboard** (monitoramento em tempo real)

### Infraestrutura
- **Vercel** (frontend deployment)
- **Node.js Server** (backend independente)
- **Supabase** (BaaS + RLS + Auth)
- **Redis** (cache + rate limiting)

## Nova Arquitetura Multi-tenant

### Sistema de 3 Camadas
```typescript
// 1. CATÁLOGO (base_modules)
interface BaseModule {
  id: string;
  slug: string;                    // 'performance', 'banban-insights'
  name: string;
  category: string;
  supports_multi_tenant: boolean;
}

// 2. IMPLEMENTAÇÕES (module_implementations)
interface ModuleImplementation {
  id: string;
  base_module_id: string;
  implementation_key: string;      // 'default', 'banban-custom'
  component_path: string;          // '/widgets/performance.tsx'
  audience: string;                // 'generic', 'banban'
}

// 3. ATRIBUIÇÕES (tenant_module_assignments)
interface TenantModuleAssignment {
  tenant_id: string;               // organization_id
  base_module_id: string;
  implementation_id?: string;
  is_active: boolean;
  custom_config: Record<string, any>;
}
```

### Isolamento e Segurança
- **RLS Nativo**: Isolamento automático por `tenant_id`
- **Module Permissions**: Controle granular via `permissions_override`
- **Configuration Isolation**: `custom_config` por tenant
- **Audit Trail**: Rastreamento completo em `module_file_audit`

### Identificação Moderna de Tenant
- **URL-based**: `/tenant-slug/module-path`
- **Server Actions**: Resolução automática por organização
- **Module Resolution**: Carregamento dinâmico por atribuição
- **Health Monitoring**: Verificação de integridade por tenant

## Estrutura Modernizada

```
axon-platform/
├── src/                           # FRONTEND (Next.js)
│   ├── app/                       # App Router + Server Actions
│   │   ├── (protected)/           # Rotas autenticadas
│   │   │   ├── [slug]/           # Rotas dinâmicas por tenant
│   │   │   └── admin/            # Interface administrativa
│   │   ├── (public)/             # Rotas públicas
│   │   └── actions/admin/        # Server Actions para módulos
│   │       ├── tenant-modules.ts     # Gestão de atribuições
│   │       ├── base-modules.ts       # Gestão do catálogo
│   │       └── module-implementations.ts # Gestão de implementações
│   ├── clients/                   # Configurações por cliente
│   │   ├── banban/               # Cliente Banban
│   │   └── registry.ts           # Sistema de registro
│   ├── core/                      # Sistema central
│   │   ├── modules/              # Sistema de módulos
│   │   └── services/             # Serviços core
│   │       ├── module-discovery.ts      # Descoberta automática
│   │       └── module-file-monitor.ts   # Health monitoring
│   └── shared/types/              # Tipos TypeScript
│       ├── module-lifecycle.ts       # Tipos de lifecycle
│       └── module-system.ts          # Tipos do sistema
│
├── backend/                       # BACKEND (Fastify)
│   ├── src/
│   │   ├── index.ts              # Servidor principal
│   │   ├── modules/              # Sistema modular
│   │   │   ├── base/             # Módulos reutilizáveis
│   │   │   │   └── performance-base/
│   │   │   └── custom/           # Módulos específicos
│   │   │       ├── banban-performance/
│   │   │       ├── banban-purchase-flow/
│   │   │       └── banban-inventory-flow/
│   │   ├── shared/               # Serviços compartilhados
│   │   │   ├── module-loader/    # Carregamento dinâmico
│   │   │   └── tenant-manager/   # Gestão multi-tenant
│   │   └── routes/               # Rotas e webhooks
│   │       ├── metrics.ts        # Métricas do sistema
│   │       └── webhooks/         # Integrações externas
│   └── package.json              # Dependências independentes
│
├── supabase/                      # DATABASE & FUNCTIONS
│   ├── migrations/               # Schema modular
│   │   └── database-schema.sql   # Estrutura completa
│   └── functions/                # Edge Functions
│
└── context/                       # DOCUMENTAÇÃO
    ├── 02-architecture/          # Arquitetura atualizada
    └── 05-operations/            # Operações e lifecycle
```

## Sistema Modular Implementado

### **Base Modules (Catálogo)**
```sql
base_modules:
├── performance          # Métricas de performance genéricas
├── banban-performance   # Performance especializada para moda
├── banban-insights      # Motor de insights avançado
├── banban-inventory     # Gestão de estoque fashion
└── analytics           # Analytics padrão
```

### **Module Implementations (Código)**
```sql
module_implementations:
├── performance-default      # Implementação genérica
├── performance-banban      # Implementação customizada Banban
├── insights-banban-v2      # Engine de insights avançado
└── inventory-fashion       # Estoque especializado moda
```

### **Backend Modules (Fastify)**
```typescript
backend/src/modules/
├── base/
│   └── performance-base/    # Funcionalidade reutilizável
└── custom/
    ├── banban-performance/  # Especialização Banban
    ├── banban-purchase-flow/# Fluxo de compras
    └── banban-inventory-flow/# Fluxo de estoque
```

### **Lifecycle System**
- **ModuleFileMonitor**: Health scanning automático
- **ModuleDiscoveryService**: Descoberta de novos módulos
- **Health Dashboard**: Monitoramento visual em tempo real
- **Audit System**: `module_file_audit` para compliance

### **Webhooks Integrados**
- **Sales Flow**: Vendas e cancelamentos via webhook
- **Purchase Flow**: Compras com validação automática
- **Inventory Flow**: Ajustes em tempo real
- **Transfer Flow**: Movimentações entre locais
- **ETL Daily**: Processamento batch de dados

## Segurança Enterprise

### **Autenticação Robusta**
- **Supabase Auth** (JWT + MFA support)
- **Server Actions** com validação automática
- **Session Management** com timeout configurável
- **Device Tracking** para detecção de anomalias

### **Autorização Multi-Camada**
- **RLS Policies**: Isolamento automático por `tenant_id`
- **Module Permissions**: Controle granular via `permissions_override`
- **Component Isolation**: Carregamento condicionado por autorização
- **Role-based Access**: Admin, user, viewer com permissões específicas

### **Audit & Compliance**
- **module_file_audit**: Rastreamento completo de mudanças
- **Health Monitoring**: Detecção proativa de problemas
- **Change Detection**: Monitoramento de integridade de arquivos
- **Compliance Reports**: Relatórios automáticos para auditoria

### **Rate Limiting & Protection**
- **Redis-based**: Rate limiting distribuído
- **Endpoint Protection**: Configuração granular por rota
- **DDoS Protection**: Mitigação automática de ataques
- **Health Checks**: Verificação contínua de disponibilidade

## Estado de Desenvolvimento

### **✅ Implementado**
- ✅ Nova estrutura de banco (3 camadas)
- ✅ Server Actions completas
- ✅ Sistema de lifecycle
- ✅ Backend modular (Fastify)
- ✅ Health monitoring
- ✅ Auditoria completa

### **🚧 Em Desenvolvimento**
- 🚧 Interface admin visual
- 🚧 Dashboard de health
- 🚧 Sistema de templates
- 🚧 Notificações automáticas

### **📋 Roadmap**
- 📋 Marketplace de módulos
- 📋 A/B testing de implementações
- 📋 Machine learning para otimização
- 📋 Analytics avançados de uso

## Documentação Relacionada

- 🏗️ [Sistema Client-Modules](./client-modules-architecture.md)
- 🔄 [Module Lifecycle](../05-operations/module-lifecycle-system.md)
- 🗄️ [Database Schema](../database/schema.md)
- 📋 [Padrões e Convenções](./patterns-conventions.md)