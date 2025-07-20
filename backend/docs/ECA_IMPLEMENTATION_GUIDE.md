# Guia de Implementação ECA - Metodologia Padronizada

## 📋 Sumário

- [Introdução](#introdução)
- [Conceitos Fundamentais](#conceitos-fundamentais)
- [Arquitetura ECA](#arquitetura-eca)
- [Implementação Passo a Passo](#implementação-passo-a-passo)
- [Padrões de Desenvolvimento](#padrões-de-desenvolvimento)
- [Estrutura de Módulos](#estrutura-de-módulos)
- [Integração com Banco de Dados](#integração-com-banco-de-dados)
- [Testes e Validação](#testes-e-validação)
- [Deployment e Monitoramento](#deployment-e-monitoramento)
- [Melhores Práticas](#melhores-práticas)
- [Resolução de Problemas](#resolução-de-problemas)

---

## 🎯 Introdução

Este guia fornece uma metodologia padronizada para implementar a arquitetura **ECA (Event-Condition-Action)** em novos projetos ou clientes. A metodologia foi desenvolvida com base na implementação bem-sucedida do projeto BanBan e incorpora melhorias identificadas durante a análise.

### Público-Alvo
- Desenvolvedores backend
- Arquitetos de software
- Gerentes de projeto
- Equipes de integração

### Pré-requisitos
- Conhecimento em TypeScript/Node.js
- Experiência com Fastify
- Familiaridade com Supabase
- Conhecimentos básicos de arquitetura multi-tenant

---

## 🧠 Conceitos Fundamentais

### Metodologia ECA

A arquitetura **ECA (Event-Condition-Action)** é baseada em três componentes fundamentais:

1. **Event**: Gatilho que inicia um processo de negócio
2. **Condition**: Validações e regras de negócio aplicadas
3. **Action**: Ação executada quando as condições são atendidas

### Princípios Arquiteturais

#### 1. External ID First
```typescript
// Todas as entidades devem ter identificadores externos
interface BusinessEntity {
  id: string;           // UUID interno
  external_id: string;  // Identificador do sistema externo
  tenant_id: string;    // Isolamento multi-tenant
  // ... outros campos
}
```

#### 2. Estado Imutável
- Cada transição de estado é registrada como um evento
- Histórico completo de mudanças é mantido
- Rollbacks e auditorias são possíveis

#### 3. Multi-Tenancy
- Isolamento completo entre tenants
- Módulos específicos por cliente
- Configurações flexíveis por tenant

#### 4. Modularidade
- Módulos independentes e plugáveis
- Contratos bem definidos entre módulos
- Facilita manutenção e evolução

---

## 🏗️ Arquitetura ECA

### Estrutura de Dados

#### Tabelas Principais
```sql
-- Entidades de negócio (produtos, fornecedores, localizações)
CREATE TABLE tenant_business_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) NOT NULL,
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(external_id, tenant_id)
);

-- Transações de negócio (pedidos, notas fiscais, transferências)
CREATE TABLE tenant_business_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) NOT NULL,
    tenant_id UUID NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(external_id, tenant_id)
);

-- Relacionamentos entre entidades e transações
CREATE TABLE tenant_business_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    source_entity_id UUID,
    target_entity_id UUID,
    source_transaction_id UUID,
    target_transaction_id UUID,
    relationship_type VARCHAR(50) NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tipos de Entidades
```typescript
export enum EntityType {
  PRODUCT = 'PRODUCT',
  SUPPLIER = 'SUPPLIER',
  LOCATION = 'LOCATION',
  CUSTOMER = 'CUSTOMER'
}
```

#### Tipos de Transações
```typescript
export enum TransactionType {
  ORDER_PURCHASE = 'ORDER_PURCHASE',
  DOCUMENT_SUPPLIER_IN = 'DOCUMENT_SUPPLIER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  TRANSFER_IN = 'TRANSFER_IN',
  DOCUMENT_SALE = 'DOCUMENT_SALE',
  DOCUMENT_RETURN = 'DOCUMENT_RETURN',
  INVENTORY_MOVEMENT = 'INVENTORY_MOVEMENT'
}
```

### Fluxo de Estados

#### Máquina de Estados Genérica
```typescript
interface StateTransition {
  from: string;
  to: string;
  action: string;
  conditions?: string[];
}

interface StateMachine {
  initialState: string;
  transitions: StateTransition[];
  finalStates: string[];
}
```

#### Exemplo: Purchase Flow
```typescript
const purchaseFlowStates: StateMachine = {
  initialState: 'PENDENTE',
  transitions: [
    { from: 'PENDENTE', to: 'APPROVED', action: 'approve_order' },
    { from: 'APPROVED', to: 'PRE_BAIXA', action: 'register_invoice' },
    { from: 'PRE_BAIXA', to: 'AGUARDANDO_CONFERENCIA_CD', action: 'arrive_at_cd' },
    { from: 'AGUARDANDO_CONFERENCIA_CD', to: 'EM_CONFERENCIA_CD', action: 'start_conference' },
    { from: 'EM_CONFERENCIA_CD', to: 'CONFERENCIA_CD_SEM_DIVERGENCIA', action: 'scan_items', conditions: ['no_discrepancy'] },
    { from: 'EM_CONFERENCIA_CD', to: 'CONFERENCIA_CD_COM_DIVERGENCIA', action: 'scan_items', conditions: ['has_discrepancy'] },
    { from: 'CONFERENCIA_CD_SEM_DIVERGENCIA', to: 'EFETIVADO_CD', action: 'effectuate_cd' },
    { from: 'CONFERENCIA_CD_COM_DIVERGENCIA', to: 'EFETIVADO_CD', action: 'effectuate_cd' }
  ],
  finalStates: ['EFETIVADO_CD']
};
```

---

## 📝 Implementação Passo a Passo

### Fase 1: Preparação do Ambiente

#### 1.1 Estrutura de Projeto
```bash
backend/
├── src/
│   ├── config/
│   │   └── config.ts
│   ├── modules/
│   │   ├── base/
│   │   └── custom/
│   │       └── {client-name}/
│   ├── shared/
│   │   ├── module-loader/
│   │   ├── tenant-manager/
│   │   └── webhook-base/
│   ├── routes/
│   ├── types/
│   └── utils/
├── migrations/
├── tests/
└── docs/
```

#### 1.2 Configuração Base
```typescript
// src/config/config.ts
import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string(),
  WEBHOOK_SECRET: z.string(),
  CORS_ORIGIN: z.string().default('*')
});

export const config = configSchema.parse(process.env);
```

### Fase 2: Implementação do Core

#### 2.1 Tenant Manager
```typescript
// src/shared/tenant-manager/tenant-manager.ts
export class TenantManager {
  private tenantCache = new Map<string, TenantInfo>();

  async resolveTenant(request: FastifyRequest): Promise<TenantInfo> {
    // Resolver por header
    const tenantHeader = request.headers['x-tenant-id'] as string;
    if (tenantHeader) {
      return this.getTenantInfo(tenantHeader);
    }

    // Resolver por subdomain
    const host = request.headers.host;
    if (host) {
      const subdomain = host.split('.')[0];
      return this.getTenantInfo(subdomain);
    }

    // Fallback para tenant padrão
    return this.getTenantInfo('default');
  }

  private async getTenantInfo(tenantId: string): Promise<TenantInfo> {
    if (this.tenantCache.has(tenantId)) {
      return this.tenantCache.get(tenantId)!;
    }

    const tenantInfo = await this.loadTenantFromDatabase(tenantId);
    this.tenantCache.set(tenantId, tenantInfo);
    return tenantInfo;
  }

  private async loadTenantFromDatabase(tenantId: string): Promise<TenantInfo> {
    // Implementar carregamento do banco de dados
    return {
      id: tenantId,
      name: tenantId,
      config: {},
      modules: []
    };
  }
}
```

#### 2.2 Module Loader
```typescript
// src/shared/module-loader/module-resolver.ts
export class ModuleResolver {
  private moduleCache = new Map<string, ModuleInstance[]>();

  async resolveModulesForTenant(tenantId: string): Promise<ModuleInstance[]> {
    if (this.moduleCache.has(tenantId)) {
      return this.moduleCache.get(tenantId)!;
    }

    const modules = await this.loadModulesForTenant(tenantId);
    this.moduleCache.set(tenantId, modules);
    return modules;
  }

  private async loadModulesForTenant(tenantId: string): Promise<ModuleInstance[]> {
    const modules: ModuleInstance[] = [];
    
    // Carregar módulos base
    const baseModules = await this.loadBaseModules();
    modules.push(...baseModules);

    // Carregar módulos específicos do cliente
    const customModules = await this.loadCustomModules(tenantId);
    modules.push(...customModules);

    return modules;
  }

  private async loadBaseModules(): Promise<ModuleInstance[]> {
    // Implementar carregamento de módulos base
    return [];
  }

  private async loadCustomModules(tenantId: string): Promise<ModuleInstance[]> {
    // Implementar carregamento de módulos customizados
    return [];
  }
}
```

### Fase 3: Implementação de Módulos

#### 3.1 Estrutura de Módulo
```typescript
// src/modules/base/template-module/index.ts
export interface ModuleInstance {
  name: string;
  version: string;
  routes: ModuleRoute[];
  services: ModuleService[];
  initialize(): Promise<void>;
  health(): Promise<ModuleHealth>;
}

export interface ModuleRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  handler: FastifyHandler;
  schema?: object;
}

export interface ModuleService {
  processEvent(event: BusinessEvent): Promise<ProcessResult>;
}
```

#### 3.2 Implementação de Módulo
```typescript
// src/modules/custom/client-name/purchase-flow/index.ts
export class PurchaseFlowModule implements ModuleInstance {
  name = 'purchase-flow';
  version = '1.0.0';

  routes: ModuleRoute[] = [
    {
      method: 'POST',
      path: '/api/v1/:tenant/purchase',
      handler: this.handleWebhook.bind(this),
      schema: PurchaseFlowSchema
    },
    {
      method: 'GET',
      path: '/api/v1/:tenant/purchase',
      handler: this.handleQuery.bind(this),
      schema: PurchaseQuerySchema
    },
    {
      method: 'GET',
      path: '/api/v1/:tenant/purchase/analytics',
      handler: this.handleAnalytics.bind(this),
      schema: PurchaseAnalyticsSchema
    },
    {
      method: 'GET',
      path: '/api/v1/:tenant/purchase/health',
      handler: this.handleHealth.bind(this)
    }
  ];

  services = [new PurchaseFlowService()];

  async initialize(): Promise<void> {
    // Inicializar módulo
  }

  async health(): Promise<ModuleHealth> {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }

  private async handleWebhook(request: FastifyRequest, reply: FastifyReply) {
    const { action, attributes } = request.body as WebhookPayload;
    const service = this.services[0] as PurchaseFlowService;
    
    try {
      const result = await service.processEvent({
        action,
        attributes,
        tenant: request.params.tenant
      });
      
      reply.send(result);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  }

  private async handleQuery(request: FastifyRequest, reply: FastifyReply) {
    // Implementar query handler
  }

  private async handleAnalytics(request: FastifyRequest, reply: FastifyReply) {
    // Implementar analytics handler
  }

  private async handleHealth(request: FastifyRequest, reply: FastifyReply) {
    const health = await this.health();
    reply.send(health);
  }
}
```

#### 3.3 Service Layer
```typescript
// src/modules/custom/client-name/purchase-flow/services/purchase-flow-service.ts
export class PurchaseFlowService implements ModuleService {
  private stateMachine: StateMachine;
  private entityResolver: EntityResolver;

  constructor() {
    this.stateMachine = purchaseFlowStates;
    this.entityResolver = new EntityResolver();
  }

  async processEvent(event: BusinessEvent): Promise<ProcessResult> {
    const { action, attributes, tenant } = event;

    // Validar transição de estado
    const currentState = await this.getCurrentState(attributes.external_id, tenant);
    const isValidTransition = this.validateTransition(currentState, action);
    
    if (!isValidTransition) {
      throw new Error(`Invalid state transition: ${currentState} -> ${action}`);
    }

    // Processar evento baseado na ação
    switch (action) {
      case 'create_order':
        return this.handleCreateOrder(attributes, tenant);
      case 'approve_order':
        return this.handleApproveOrder(attributes, tenant);
      case 'register_invoice':
        return this.handleRegisterInvoice(attributes, tenant);
      case 'arrive_at_cd':
        return this.handleArriveAtCD(attributes, tenant);
      case 'start_conference':
        return this.handleStartConference(attributes, tenant);
      case 'scan_items':
        return this.handleScanItems(attributes, tenant);
      case 'effectuate_cd':
        return this.handleEffectuateCD(attributes, tenant);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async handleCreateOrder(attributes: any, tenant: string): Promise<ProcessResult> {
    // Criar entidades necessárias
    const supplier = await this.entityResolver.resolveSupplier(
      attributes.supplier_external_id,
      tenant
    );

    const products = await Promise.all(
      attributes.items.map(item => 
        this.entityResolver.resolveProduct(item.product_external_id, tenant)
      )
    );

    // Criar transação de pedido
    const transaction = await this.createTransaction({
      external_id: attributes.external_id,
      tenant_id: tenant,
      transaction_type: TransactionType.ORDER_PURCHASE,
      status: 'PENDENTE',
      attributes: {
        supplier_id: supplier.id,
        items: attributes.items,
        total_value: this.calculateTotal(attributes.items),
        created_at: new Date().toISOString()
      }
    });

    // Criar relacionamentos
    await this.createRelationships(transaction.id, [supplier.id, ...products.map(p => p.id)], tenant);

    return {
      success: true,
      transaction_id: transaction.id,
      status: 'PENDENTE',
      message: 'Pedido criado com sucesso'
    };
  }

  private async handleApproveOrder(attributes: any, tenant: string): Promise<ProcessResult> {
    // Atualizar status da transação
    const transaction = await this.updateTransactionStatus(
      attributes.external_id,
      tenant,
      'APPROVED'
    );

    return {
      success: true,
      transaction_id: transaction.id,
      status: 'APPROVED',
      message: 'Pedido aprovado com sucesso'
    };
  }

  // Implementar outros handlers...

  private validateTransition(currentState: string, action: string): boolean {
    const validTransitions = this.stateMachine.transitions.filter(
      t => t.from === currentState && t.action === action
    );
    return validTransitions.length > 0;
  }

  private async getCurrentState(externalId: string, tenant: string): Promise<string> {
    // Buscar estado atual da transação
    const transaction = await this.getTransactionByExternalId(externalId, tenant);
    return transaction?.status || this.stateMachine.initialState;
  }

  private calculateTotal(items: any[]): number {
    return items.reduce((total, item) => total + (item.quantity * item.unit_price), 0);
  }

  // Implementar métodos de banco de dados...
}
```

### Fase 4: Schemas e Validação

#### 4.1 Schemas Fastify
```typescript
// src/modules/custom/client-name/purchase-flow/schemas/purchase-flow-schemas.ts
export const PurchaseFlowSchema = {
  body: {
    type: 'object',
    required: ['action', 'attributes'],
    properties: {
      action: {
        type: 'string',
        enum: [
          'create_order',
          'approve_order',
          'register_invoice',
          'arrive_at_cd',
          'start_conference',
          'scan_items',
          'effectuate_cd'
        ]
      },
      attributes: {
        type: 'object',
        properties: {
          external_id: { type: 'string' },
          supplier_external_id: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['product_external_id', 'quantity'],
              properties: {
                product_external_id: { type: 'string' },
                quantity: { type: 'number', minimum: 1 },
                unit_price: { type: 'number', minimum: 0 }
              }
            }
          }
        }
      }
    }
  }
};

export const PurchaseQuerySchema = {
  querystring: {
    type: 'object',
    properties: {
      external_id: { type: 'string' },
      status: { type: 'string' },
      supplier_external_id: { type: 'string' },
      limit: { type: 'number', minimum: 1, maximum: 100, default: 10 },
      offset: { type: 'number', minimum: 0, default: 0 }
    }
  }
};

export const PurchaseAnalyticsSchema = {
  querystring: {
    type: 'object',
    properties: {
      date_from: { type: 'string', format: 'date' },
      date_to: { type: 'string', format: 'date' },
      supplier_external_id: { type: 'string' },
      group_by: { type: 'string', enum: ['day', 'week', 'month'] }
    }
  }
};
```

---

## 🔧 Padrões de Desenvolvimento

### Princípios de Código

#### 1. SOLID Principles
- **Single Responsibility**: Cada classe tem uma única responsabilidade
- **Open/Closed**: Aberto para extensão, fechado para modificação
- **Liskov Substitution**: Subclasses devem ser substituíveis por suas superclasses
- **Interface Segregation**: Interfaces específicas são melhores que interfaces genéricas
- **Dependency Inversion**: Dependa de abstrações, não de concreções

#### 2. Error Handling
```typescript
// Hierarquia de erros customizada
export class ECAError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ECAError';
  }
}

export class ValidationError extends ECAError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, context);
  }
}

export class StateTransitionError extends ECAError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'STATE_TRANSITION_ERROR', 422, context);
  }
}
```

#### 3. Logging Padronizado
```typescript
// Logger estruturado
export class Logger {
  private pino: pino.Logger;

  constructor(context: string) {
    this.pino = pino({
      name: context,
      level: config.LOG_LEVEL,
      formatters: {
        level: (label) => ({ level: label }),
        log: (object) => ({
          ...object,
          timestamp: new Date().toISOString(),
          tenant: object.tenant,
          correlation_id: object.correlation_id
        })
      }
    });
  }

  info(message: string, context?: Record<string, any>) {
    this.pino.info(context, message);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.pino.error({ ...context, error: error?.stack }, message);
  }

  debug(message: string, context?: Record<string, any>) {
    this.pino.debug(context, message);
  }
}
```

#### 4. Middleware Patterns
```typescript
// Middleware de autenticação
export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, config.WEBHOOK_SECRET);
    request.user = decoded;
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid token' });
  }
};

// Middleware de tenant
export const tenantMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  const tenantManager = new TenantManager();
  const tenant = await tenantManager.resolveTenant(request);
  
  if (!tenant) {
    return reply.status(404).send({ error: 'Tenant not found' });
  }
  
  request.tenant = tenant;
};
```

---

## 🏢 Estrutura de Módulos

### Organização de Arquivos

```
src/modules/custom/client-name/flow-name/
├── index.ts                    # Registro do módulo
├── schemas/
│   └── flow-schemas.ts        # Schemas de validação
├── services/
│   └── flow-service.ts        # Lógica de negócio
├── types/
│   └── flow-types.ts          # Tipos específicos
├── utils/
│   └── flow-utils.ts          # Utilitários
└── tests/
    ├── flow-service.test.ts   # Testes unitários
    └── flow-integration.test.ts # Testes de integração
```

### Template de Módulo

```typescript
// Template básico para novos módulos
export class FlowModule implements ModuleInstance {
  name = 'flow-name';
  version = '1.0.0';

  routes: ModuleRoute[] = [
    {
      method: 'POST',
      path: '/api/v1/:tenant/flow-name',
      handler: this.handleWebhook.bind(this),
      schema: FlowSchema
    },
    {
      method: 'GET',
      path: '/api/v1/:tenant/flow-name',
      handler: this.handleQuery.bind(this),
      schema: FlowQuerySchema
    },
    {
      method: 'GET',
      path: '/api/v1/:tenant/flow-name/analytics',
      handler: this.handleAnalytics.bind(this),
      schema: FlowAnalyticsSchema
    },
    {
      method: 'GET',
      path: '/api/v1/:tenant/flow-name/health',
      handler: this.handleHealth.bind(this)
    }
  ];

  services = [new FlowService()];

  async initialize(): Promise<void> {
    // Inicialização do módulo
  }

  async health(): Promise<ModuleHealth> {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      module: this.name,
      version: this.version
    };
  }

  // Implementar handlers...
}
```

---

## 🗄️ Integração com Banco de Dados

### Configuração Supabase

```typescript
// src/config/database.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Client com RLS habilitado
export const supabaseRLS = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_ANON_KEY
);
```

### Operações de Banco

```typescript
// src/shared/database/base-repository.ts
export abstract class BaseRepository<T> {
  protected tableName: string;
  protected tenantId: string;

  constructor(tableName: string, tenantId: string) {
    this.tableName = tableName;
    this.tenantId = tenantId;
  }

  async create(data: Partial<T>): Promise<T> {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert({ ...data, tenant_id: this.tenantId })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create ${this.tableName}: ${error.message}`);
    }

    return result;
  }

  async findByExternalId(externalId: string): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select()
      .eq('external_id', externalId)
      .eq('tenant_id', this.tenantId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find ${this.tableName}: ${error.message}`);
    }

    return data;
  }

  async update(externalId: string, updates: Partial<T>): Promise<T> {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('external_id', externalId)
      .eq('tenant_id', this.tenantId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update ${this.tableName}: ${error.message}`);
    }

    return data;
  }

  async list(filters: Record<string, any> = {}, limit = 10, offset = 0): Promise<T[]> {
    let query = supabase
      .from(this.tableName)
      .select()
      .eq('tenant_id', this.tenantId);

    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    });

    const { data, error } = await query
      .limit(limit)
      .offset(offset)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list ${this.tableName}: ${error.message}`);
    }

    return data || [];
  }
}
```

### Migrations

```sql
-- migrations/001_create_base_tables.sql
-- Criar tabelas base ECA
CREATE TABLE IF NOT EXISTS tenant_business_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) NOT NULL,
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(external_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS tenant_business_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) NOT NULL,
    tenant_id UUID NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(external_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS tenant_business_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    source_entity_id UUID,
    target_entity_id UUID,
    source_transaction_id UUID,
    target_transaction_id UUID,
    relationship_type VARCHAR(50) NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (source_entity_id) REFERENCES tenant_business_entities(id),
    FOREIGN KEY (target_entity_id) REFERENCES tenant_business_entities(id),
    FOREIGN KEY (source_transaction_id) REFERENCES tenant_business_transactions(id),
    FOREIGN KEY (target_transaction_id) REFERENCES tenant_business_transactions(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_entities_external_id ON tenant_business_entities(external_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_entities_type ON tenant_business_entities(entity_type, tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON tenant_business_transactions(external_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON tenant_business_transactions(transaction_type, tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON tenant_business_transactions(status, tenant_id);
CREATE INDEX IF NOT EXISTS idx_relationships_tenant ON tenant_business_relationships(tenant_id);

-- RLS Policies
ALTER TABLE tenant_business_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_business_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_business_relationships ENABLE ROW LEVEL SECURITY;

-- Policies para isolamento de tenant
CREATE POLICY entities_tenant_isolation ON tenant_business_entities
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);

CREATE POLICY transactions_tenant_isolation ON tenant_business_transactions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);

CREATE POLICY relationships_tenant_isolation ON tenant_business_relationships
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

---

## 🧪 Testes e Validação

### Estrutura de Testes

```typescript
// tests/setup.ts
import { afterAll, beforeAll } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp({ logger: false });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

export { app };
```

### Testes Unitários

```typescript
// tests/unit/purchase-flow-service.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PurchaseFlowService } from '../../src/modules/custom/client-name/purchase-flow/services/purchase-flow-service';

describe('PurchaseFlowService', () => {
  let service: PurchaseFlowService;
  let mockEntityResolver: jest.Mocked<EntityResolver>;

  beforeEach(() => {
    mockEntityResolver = {
      resolveSupplier: jest.fn(),
      resolveProduct: jest.fn(),
      resolveLocation: jest.fn()
    };
    
    service = new PurchaseFlowService();
    service['entityResolver'] = mockEntityResolver;
  });

  describe('processEvent', () => {
    it('should create order successfully', async () => {
      // Arrange
      const event = {
        action: 'create_order',
        attributes: {
          external_id: 'ORDER-001',
          supplier_external_id: 'SUPPLIER-001',
          items: [
            {
              product_external_id: 'PRODUCT-001',
              quantity: 10,
              unit_price: 9.99
            }
          ]
        },
        tenant: 'test-tenant'
      };

      mockEntityResolver.resolveSupplier.mockResolvedValue({
        id: 'supplier-uuid',
        external_id: 'SUPPLIER-001',
        name: 'Test Supplier'
      });

      mockEntityResolver.resolveProduct.mockResolvedValue({
        id: 'product-uuid',
        external_id: 'PRODUCT-001',
        name: 'Test Product'
      });

      // Act
      const result = await service.processEvent(event);

      // Assert
      expect(result.success).toBe(true);
      expect(result.status).toBe('PENDENTE');
      expect(mockEntityResolver.resolveSupplier).toHaveBeenCalledWith('SUPPLIER-001', 'test-tenant');
      expect(mockEntityResolver.resolveProduct).toHaveBeenCalledWith('PRODUCT-001', 'test-tenant');
    });

    it('should throw error for invalid state transition', async () => {
      // Arrange
      const event = {
        action: 'effectuate_cd',
        attributes: {
          external_id: 'ORDER-001'
        },
        tenant: 'test-tenant'
      };

      // Mock current state as PENDENTE
      jest.spyOn(service as any, 'getCurrentState').mockResolvedValue('PENDENTE');

      // Act & Assert
      await expect(service.processEvent(event)).rejects.toThrow('Invalid state transition');
    });
  });
});
```

### Testes de Integração

```typescript
// tests/integration/purchase-flow.test.ts
import { describe, it, expect } from '@jest/globals';
import { app } from '../setup';

describe('Purchase Flow Integration', () => {
  const baseUrl = '/api/v1/test-tenant/purchase';
  const authHeader = 'Bearer test-token';

  describe('POST /purchase', () => {
    it('should create purchase order successfully', async () => {
      // Arrange
      const payload = {
        action: 'create_order',
        attributes: {
          external_id: 'ORDER-INTEGRATION-001',
          supplier_external_id: 'SUPPLIER-001',
          items: [
            {
              product_external_id: 'PRODUCT-001',
              quantity: 5,
              unit_price: 19.99
            }
          ]
        }
      };

      // Act
      const response = await app.inject({
        method: 'POST',
        url: baseUrl,
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        payload
      });

      // Assert
      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.body);
      expect(result.success).toBe(true);
      expect(result.status).toBe('PENDENTE');
      expect(result.transaction_id).toBeDefined();
    });

    it('should validate required fields', async () => {
      // Arrange
      const payload = {
        action: 'create_order',
        attributes: {
          external_id: 'ORDER-INVALID-001'
          // Missing required fields
        }
      };

      // Act
      const response = await app.inject({
        method: 'POST',
        url: baseUrl,
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        payload
      });

      // Assert
      expect(response.statusCode).toBe(400);
      
      const result = JSON.parse(response.body);
      expect(result.error).toBeDefined();
    });
  });

  describe('GET /purchase', () => {
    it('should query purchases with filters', async () => {
      // Act
      const response = await app.inject({
        method: 'GET',
        url: `${baseUrl}?status=PENDENTE&limit=5`,
        headers: {
          'Authorization': authHeader
        }
      });

      // Assert
      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.body);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data.transactions)).toBe(true);
    });
  });
});
```

### Testes de Carga

```typescript
// tests/load/purchase-flow-load.test.ts
import { describe, it, expect } from '@jest/globals';
import { performance } from 'perf_hooks';
import { app } from '../setup';

describe('Purchase Flow Load Tests', () => {
  it('should handle concurrent requests', async () => {
    const concurrency = 50;
    const requests = [];
    
    // Criar múltiplas requisições simultâneas
    for (let i = 0; i < concurrency; i++) {
      const payload = {
        action: 'create_order',
        attributes: {
          external_id: `ORDER-LOAD-${i}`,
          supplier_external_id: 'SUPPLIER-001',
          items: [
            {
              product_external_id: 'PRODUCT-001',
              quantity: 1,
              unit_price: 9.99
            }
          ]
        }
      };

      requests.push(
        app.inject({
          method: 'POST',
          url: '/api/v1/test-tenant/purchase',
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          },
          payload
        })
      );
    }

    // Executar requests em paralelo
    const start = performance.now();
    const responses = await Promise.all(requests);
    const end = performance.now();

    // Verificar resultados
    const successCount = responses.filter(r => r.statusCode === 200).length;
    const avgResponseTime = (end - start) / concurrency;

    expect(successCount).toBe(concurrency);
    expect(avgResponseTime).toBeLessThan(100); // Menos de 100ms por request
  });
});
```

---

## 🚀 Deployment e Monitoramento

### Configuração de Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY src ./src

# Build da aplicação
RUN npm run build

# Estágio final
FROM node:20-alpine

WORKDIR /app

# Copiar apenas os arquivos necessários
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Alterar proprietário
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expor porta
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Comando de inicialização
CMD ["node", "dist/index.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - PORT=4000
      - HOST=0.0.0.0
      - LOG_LEVEL=info
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - WEBHOOK_SECRET=${WEBHOOK_SECRET}
      - CORS_ORIGIN=${CORS_ORIGIN}
    depends_on:
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  redis_data:
```

### Monitoramento

```typescript
// src/monitoring/metrics.ts
import { register, Counter, Histogram, Gauge } from 'prom-client';

export const metrics = {
  httpRequestsTotal: new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code', 'tenant']
  }),

  httpRequestDuration: new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'tenant'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  }),

  moduleProcessingTime: new Histogram({
    name: 'module_processing_time_seconds',
    help: 'Time taken to process module events',
    labelNames: ['module', 'action', 'tenant'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
  }),

  activeConnections: new Gauge({
    name: 'active_connections',
    help: 'Number of active connections',
    labelNames: ['tenant']
  }),

  databaseQueries: new Counter({
    name: 'database_queries_total',
    help: 'Total number of database queries',
    labelNames: ['table', 'operation', 'tenant']
  })
};

// Middleware para coleta de métricas
export const metricsMiddleware = (request: FastifyRequest, reply: FastifyReply, done: Function) => {
  const start = Date.now();
  
  reply.addHook('onSend', (req, res, payload, next) => {
    const duration = (Date.now() - start) / 1000;
    
    metrics.httpRequestsTotal.inc({
      method: req.method,
      route: req.routerPath,
      status_code: res.statusCode,
      tenant: req.tenant?.id || 'unknown'
    });

    metrics.httpRequestDuration.observe(
      {
        method: req.method,
        route: req.routerPath,
        tenant: req.tenant?.id || 'unknown'
      },
      duration
    );

    next();
  });

  done();
};

// Endpoint de métricas
export async function metricsHandler(request: FastifyRequest, reply: FastifyReply) {
  reply.header('Content-Type', register.contentType);
  return register.metrics();
}
```

### Health Checks

```typescript
// src/health/health-check.ts
export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  duration?: number;
}

export class HealthChecker {
  private checks: Map<string, () => Promise<HealthCheck>> = new Map();

  register(name: string, check: () => Promise<HealthCheck>) {
    this.checks.set(name, check);
  }

  async runChecks(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    checks: HealthCheck[];
    timestamp: string;
  }> {
    const results: HealthCheck[] = [];
    
    for (const [name, check] of this.checks) {
      try {
        const start = Date.now();
        const result = await check();
        result.duration = Date.now() - start;
        results.push(result);
      } catch (error) {
        results.push({
          name,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - Date.now()
        });
      }
    }

    // Determinar status geral
    const hasUnhealthy = results.some(r => r.status === 'unhealthy');
    const hasDegraded = results.some(r => r.status === 'degraded');
    
    const overallStatus = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';

    return {
      status: overallStatus,
      checks: results,
      timestamp: new Date().toISOString()
    };
  }
}

// Checks específicos
export const databaseHealthCheck = async (): Promise<HealthCheck> => {
  try {
    const start = Date.now();
    const { data, error } = await supabase.from('health_check').select('1').limit(1);
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      name: 'database',
      status: 'healthy',
      message: 'Database connection is healthy',
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
};

export const moduleHealthCheck = async (): Promise<HealthCheck> => {
  try {
    const moduleResolver = new ModuleResolver();
    const modules = await moduleResolver.resolveModulesForTenant('default');
    
    const unhealthyModules = [];
    for (const module of modules) {
      const health = await module.health();
      if (health.status !== 'healthy') {
        unhealthyModules.push(module.name);
      }
    }

    if (unhealthyModules.length > 0) {
      return {
        name: 'modules',
        status: 'degraded',
        message: `Unhealthy modules: ${unhealthyModules.join(', ')}`
      };
    }

    return {
      name: 'modules',
      status: 'healthy',
      message: `All ${modules.length} modules are healthy`
    };
  } catch (error) {
    return {
      name: 'modules',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Module check failed'
    };
  }
};
```

---

## 📚 Melhores Práticas

### Segurança

1. **Autenticação e Autorização**
   - Implementar JWT tokens com expiração
   - Usar RBAC (Role-Based Access Control)
   - Validar permissões por tenant

2. **Validação de Entrada**
   - Validar todos os inputs com schemas
   - Sanitizar dados antes de processar
   - Implementar rate limiting

3. **Comunicação Segura**
   - Usar HTTPS em produção
   - Implementar CORS adequadamente
   - Configurar headers de segurança

### Performance

1. **Caching**
   - Cache de consultas frequentes
   - Cache de resolução de módulos
   - Cache de informações de tenant

2. **Otimização de Banco**
   - Usar índices apropriados
   - Implementar connection pooling
   - Otimizar queries complexas

3. **Monitoramento**
   - Métricas de performance
   - Alertas proativos
   - Logging estruturado

### Manutenibilidade

1. **Código Limpo**
   - Seguir princípios SOLID
   - Usar naming conventions consistentes
   - Documentar código complexo

2. **Testes**
   - Cobertura de testes alta
   - Testes automatizados
   - Testes de integração

3. **Documentação**
   - Documentar APIs
   - Manter ADRs atualizados
   - Guias de troubleshooting

### Escalabilidade

1. **Arquitetura**
   - Módulos independentes
   - Loose coupling
   - Event-driven architecture

2. **Deployment**
   - Containerização
   - Horizontal scaling
   - Load balancing

3. **Monitoramento**
   - Métricas de sistema
   - Alertas de capacidade
   - Performance monitoring

---

## 🔍 Resolução de Problemas

### Problemas Comuns

#### 1. Estado Inválido
```
Erro: Invalid state transition: PENDENTE -> effectuate_cd
```

**Solução:**
- Verificar se a sequência de estados está correta
- Consultar documentação da máquina de estados
- Validar se todas as condições foram atendidas

#### 2. Tenant não Encontrado
```
Erro: Tenant not found
```

**Solução:**
- Verificar header `X-Tenant-ID`
- Confirmar configuração de subdomain
- Validar registro do tenant no banco

#### 3. Módulo não Carregado
```
Erro: Module not found for tenant
```

**Solução:**
- Verificar registro do módulo
- Confirmar configuração do tenant
- Validar imports do módulo

#### 4. Erro de Validação
```
Erro: body/action must be equal to one of the allowed values
```

**Solução:**
- Verificar schema do endpoint
- Confirmar formato da action
- Validar payload completo

### Debugging

#### 1. Logs Estruturados
```typescript
// Habilitar logs de debug
export const DEBUG_CONFIG = {
  level: 'debug',
  requests: true,
  responses: true,
  database: true,
  modules: true
};
```

#### 2. Tracing de Requisições
```typescript
// Adicionar correlation ID
export const addCorrelationId = (request: FastifyRequest, reply: FastifyReply, done: Function) => {
  const correlationId = request.headers['x-correlation-id'] || uuidv4();
  request.correlationId = correlationId;
  reply.header('X-Correlation-ID', correlationId);
  done();
};
```

#### 3. Monitoramento de Performance
```typescript
// Monitorar tempo de resposta
export const performanceMonitor = (request: FastifyRequest, reply: FastifyReply, done: Function) => {
  const start = Date.now();
  
  reply.addHook('onSend', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn(`Slow request detected: ${request.method} ${request.url} - ${duration}ms`);
    }
  });
  
  done();
};
```

### Ferramentas de Diagnóstico

#### 1. Health Check Endpoint
```bash
curl -X GET http://localhost:4000/health
```

#### 2. Métricas
```bash
curl -X GET http://localhost:4000/metrics
```

#### 3. Debug de Módulos
```bash
curl -X GET http://localhost:4000/api/v1/debug/modules
```

---

## 📖 Conclusão

Este guia fornece uma metodologia completa para implementar a arquitetura ECA em novos projetos. A implementação seguindo estes padrões garantirá:

- **Consistência**: Todos os projetos seguem os mesmos padrões
- **Qualidade**: Código testado e bem documentado
- **Escalabilidade**: Arquitetura preparada para crescimento
- **Manutenibilidade**: Código limpo e bem estruturado
- **Segurança**: Implementação segura por padrão

### Próximos Passos

1. **Implementar projeto piloto** usando este guia
2. **Coletar feedback** da equipe de desenvolvimento
3. **Refinar metodologia** baseado nas lições aprendidas
4. **Criar templates** automatizados para novos projetos
5. **Treinar equipe** nos padrões estabelecidos

### Recursos Adicionais

- [Documentação da API](./ECA_API_GUIDE.md)
- [Guia de Arquitetura](./ECA_ARCHITECTURE_GUIDE.md)
- [Melhores Práticas](./ECA_BEST_PRACTICES.md)
- [Troubleshooting](./ECA_TROUBLESHOOTING.md)

---

**Versão**: 1.0  
**Última atualização**: 2025-07-09  
**Autor**: Equipe de Arquitetura ECA  
**Revisão**: Equipe de Desenvolvimento Backend