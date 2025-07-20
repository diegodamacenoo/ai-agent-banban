# Arquitetura Client-Modules

## Visão Geral

O sistema implementa uma **separação clara** entre configurações de frontend (clients) e lógica de backend (modules), permitindo máxima flexibilidade e manutenibilidade na arquitetura multi-tenant.

## Estrutura de Pastas Atual

```
src/
├── clients/                    # 🎨 FRONTEND - UI e Configurações
│   ├── registry.ts            # Sistema de carregamento dinâmico de clientes
│   └── banban/                # Cliente específico BanBan
│       ├── components/        # Componentes React customizados
│       ├── widgets/           # Widgets específicos do cliente
│       ├── hooks/             # Hooks customizados
│       ├── services/          # Serviços de frontend
│       ├── types/             # Tipos específicos de UI
│       ├── docs/              # Documentação do cliente
│       ├── __tests__/         # Testes do cliente
│       ├── config.ts          # Configuração integrada
│       ├── index.ts           # Export principal
│       └── README.md          # Documentação
│
├── core/modules/               # ⚙️ BACKEND - Lógica de Negócio
│   ├── registry/              # Sistema de registro de módulos
│   │   ├── ModuleRegistry.ts
│   │   ├── DynamicModuleRegistry.ts
│   │   ├── ModuleLoader.ts
│   │   ├── types.ts
│   │   └── __tests__/
│   │
│   ├── services/              # Serviços compartilhados
│   │   └── ModuleConfigurationService.ts
│   │
│   ├── types/                 # Tipos compartilhados de módulos
│   ├── loader/                # Carregamento dinâmico
│   ├── examples/              # Exemplos de implementação
│   ├── template/              # Templates para novos módulos
│   ├── __tests__/             # Testes de módulos
│   │
│   ├── banban/                # 🏢 MÓDULOS CUSTOMIZADOS BANBAN
│   │   ├── insights/          # Motor de insights avançado
│   │   │   ├── src/           # Código-fonte modularizado
│   │   │   ├── services/      # Serviços especializados
│   │   │   ├── handlers/      # Handlers de API
│   │   │   ├── types/         # Tipagens específicas
│   │   │   ├── tests/         # Testes completos
│   │   │   ├── migrations/    # Migrações de banco
│   │   │   ├── module.json    # Configuração completa do módulo
│   │   │   ├── module_schema.json # Schema de validação
│   │   │   ├── engine.ts      # Motor principal
│   │   │   ├── index.ts       # Entry point
│   │   │   └── README.md      # Documentação
│   │   │
│   │   ├── inventory/         # Gestão de estoque fashion
│   │   ├── performance/       # Métricas de performance
│   │   ├── alerts/            # Sistema de alertas
│   │   ├── data-processing/   # Processamento de dados
│   │   ├── components/        # Componentes de backend
│   │   ├── services/          # Serviços compartilhados
│   │   ├── repositories/      # Camada de dados
│   │   ├── __tests__/         # Testes do cliente
│   │   ├── config.ts          # Configuração do módulo Banban
│   │   └── permissions.ts     # Permissões específicas
│   │
│   ├── analytics/             # 📊 MÓDULO PADRÃO - Analytics
│   │   └── widget.json        # Configuração de widget
│   │
│   ├── performance/           # 🚀 MÓDULO PADRÃO - Performance  
│   │   └── widget.json        # Configuração de widget
│   │
│   ├── inventory/             # 📦 MÓDULO PADRÃO - Inventory
│   │   └── widget.json        # Configuração de widget
│   │
│   ├── alerts/                # 🔔 MÓDULO PADRÃO - Alerts
│   │   └── widget.json        # Configuração de widget
│   │
│   └── standard/              # Diretório para futuros módulos padrão
│
└── shared/types/
    └── client-module-interface.ts  # Interface de comunicação
```

## Interface de Comunicação

### ClientModuleInterface

Define o contrato entre frontend e backend:

```typescript
interface ClientModuleInterface {
  clientId: string;                    // Identificador único (ex: 'banban')
  frontendConfig: ClientFrontendConfig; // Configurações de UI
  backendModules: string[];            // Módulos utilizados
  apiEndpoints: Record<string, string>; // Mapeamento de endpoints
  customConfig?: Record<string, any>;   // Configurações específicas
}
```

### BanbanModuleConfig (Configuração Real)

Estrutura atual de configuração do cliente Banban:

```typescript
interface BanbanModuleConfig {
  enabled: boolean;
  routes: {
    prefix: string;                    // '/api/modules/banban'
  };
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
  };
  insights: {
    updateInterval: number;            // 300s (5 minutos)
    cacheTimeout: number;              // 1800s (30 minutos)
    maxInsightsPerType: number;        // 50
  };
  alerts: {
    enabled: boolean;
    channels: string[];                // ['email', 'dashboard', 'webhook']
    thresholds: {
      critical: number;                // 0.9 (90%)
      warning: number;                 // 0.7 (70%)
      info: number;                    // 0.4 (40%)
    };
  };
  dataProcessing: {
    maxEventQueueSize: number;         // 1000
    processingTimeout: number;         // 30000ms
    retryAttempts: number;             // 3
  };
  performance: {
    metricsRetentionDays: number;      // 30
    maxMetricsPerModule: number;       // 100
  };
}
```

### Estrutura de Módulo (module.json)

Cada módulo Banban possui configuração completa:

```json
{
  "name": "BanBan Insights",
  "slug": "banban-insights",
  "version": "2.0.0",
  "description": "Módulo avançado de insights para varejo de moda",
  "category": "custom",
  "maturity_status": "GA",
  "pricing_tier": "premium",
  "author": "BanBan Development Team",
  "vendor": "BanBan Fashion Systems",
  "entrypoint": "src/index.ts",
  "compatibility_matrix": {
    "min_axon_version": "1.0.0",
    "max_axon_version": "2.0.0",
    "supported_features": [
      "multi-tenant",
      "rls", 
      "audit-logging",
      "custom-billing",
      "advanced-analytics"
    ]
  },
  "api_endpoints": [
    {
      "path": "/api/modules/banban/insights/health",
      "method": "GET",
      "description": "Health check endpoint",
      "authenticated": false
    },
    {
      "path": "/api/modules/banban/insights",
      "method": "GET", 
      "description": "Get cached insights",
      "authenticated": true
    }
  ],
  "database_tables": [
    "tenant_insights_cache",
    "tenant_insights_history", 
    "tenant_insights_config",
    "tenant_insights_metrics"
  ],
  "features": [
    "low-stock-analysis",
    "margin-optimization",
    "seasonal-trends",
    "predictive-analytics"
  ]
}
```

## Tipos de Módulos

### 1. Módulos Padrão
- **Localização**: `src/core/modules/{module-name}/`
- **Estrutura**: Apenas `widget.json` com configurações básicas
- **Exemplos**: `analytics`, `performance`, `inventory`, `alerts`
- **Propósito**: Funcionalidades genéricas reutilizáveis

### 2. Módulos Customizados (Banban)
- **Localização**: `src/core/modules/banban/{module-name}/`
- **Estrutura**: Arquitetura completa com código, testes, documentação
- **Exemplos**: `insights`, `inventory`, `performance`, `alerts`, `data-processing`
- **Propósito**: Funcionalidades específicas do cliente

### 3. Sistema de Registry
- **Localização**: `src/core/modules/registry/`
- **Componentes**:
  - `ModuleRegistry.ts`: Registro básico
  - `DynamicModuleRegistry.ts`: Carregamento dinâmico
  - `ModuleLoader.ts`: Carregador de módulos
  - `types.ts`: Tipagens do sistema

## Exemplo: Cliente Banban

### Frontend Configuration (`src/clients/banban/config.ts`)

```typescript
export const BANBAN_CONFIG = {
  clientId: 'banban',
  name: 'BanBan Fashion',
  
  // Módulos utilizados
  modules: [
    'banban-insights',      // Módulo customizado
    'banban-inventory',     // Módulo customizado  
    'banban-performance',   // Módulo customizado
    'banban-alerts',        // Módulo customizado
    'analytics',            // Módulo padrão
    'performance'           // Módulo padrão
  ],
  
  // Configurações específicas
  features: {
    fashionMetrics: true,
    inventoryOptimization: true,
    seasonalAnalysis: true,
    customInsights: true
  }
};
```

### Backend Module (`src/core/modules/banban/insights/`)

Estrutura modular avançada:

```
insights/
├── src/                       # Código-fonte modularizado
│   ├── services/             # Serviços especializados
│   ├── handlers/             # Handlers de API  
│   ├── types/                # Tipagens específicas
│   └── utils/                # Utilitários
├── tests/                    # Testes completos
├── migrations/               # Migrações de banco
├── module.json              # Configuração completa
├── module_schema.json       # Schema de validação
├── engine.ts                # Motor principal
├── index.ts                 # Entry point
└── README.md                # Documentação
```

## Princípios da Arquitetura

### 1. Separação Clara por Tipo
- **Módulos Padrão**: Configuração simples, reutilizáveis
- **Módulos Customizados**: Implementação completa, específicos

### 2. Hierarquia Organizacional
- **Clientes** (`src/clients/`): Frontend e configurações de UI
- **Módulos Padrão** (`src/core/modules/{name}/`): Funcionalidades genéricas
- **Módulos Customizados** (`src/core/modules/{client}/`): Lógica específica

### 3. Sistema de Registry Robusto
- **Descoberta Automática**: Detecta módulos no filesystem
- **Carregamento Dinâmico**: Carrega apenas módulos necessários
- **Validação**: Verifica compatibilidade e dependências

### 4. Configuração Flexível
- **module.json**: Metadados completos do módulo
- **widget.json**: Configuração simplificada para padrões
- **config.ts**: Configuração runtime do cliente

## Fluxo de Funcionamento

### 1. Inicialização do Sistema

```typescript
// 1. Sistema carrega registry de módulos
const moduleRegistry = new DynamicModuleRegistry();

// 2. Descobre módulos no filesystem
await moduleRegistry.scanModules();

// 3. Carrega configuração do cliente
const clientConfig = await loadClientConfig('banban');

// 4. Registra módulos específicos do cliente
clientConfig.modules.forEach(moduleId => {
  moduleRegistry.register(moduleId);
});
```

### 2. Renderização do Frontend

```typescript
// Hook carrega componentes específicos do cliente
const { components } = useClientComponents('banban');

// Renderiza dashboard customizado com módulos específicos
<components.Dashboard 
  modules={['banban-insights', 'analytics']}
  slug={slug} 
  organization={org} 
/>
```

### 3. Chamadas de API

```typescript
// Frontend acessa endpoints específicos dos módulos
const insights = await fetch('/api/modules/banban/insights');
const analytics = await fetch('/api/modules/analytics');

// Backend roteia para handlers específicos
app.get('/api/modules/banban/insights', banbanInsightsHandler);
app.get('/api/modules/analytics', standardAnalyticsHandler);
```

## Benefícios da Arquitetura Atual

### ✅ Escalabilidade Modular
- Módulos padrão simples para funcionalidades básicas
- Módulos customizados robustos para necessidades específicas
- Sistema de discovery automático

### ✅ Manutenibilidade
- Código organizado por cliente e tipo de módulo
- Configurações centralizadas e versionadas
- Testes isolados por módulo

### ✅ Flexibilidade
- Clientes podem usar mix de módulos padrão e customizados
- Configuração granular por módulo
- Versionamento independente

### ✅ Performance
- Carregamento dinâmico de módulos
- Cache inteligente de configurações
- Isolamento de dependências

## Migração Concluída

### Estrutura Final Implementada

1. **Módulos Banban**: Estrutura completa em `src/core/modules/banban/`
2. **Módulos Padrão**: Widgets simples na raiz de `src/core/modules/`
3. **Sistema Registry**: Descoberta e carregamento automático
4. **Configurações**: Estrutura hierárquica de configs
5. **Documentação**: Metadados completos por módulo

### Melhorias Implementadas

- **Arquitetura modular avançada** para módulos customizados
- **Sistema de configuração em camadas** (module.json, config.ts, widget.json)
- **Discovery automático** de módulos no filesystem
- **Validação robusta** de compatibilidade e dependências
- **Isolamento completo** entre módulos padrão e customizados

Esta arquitetura garante que o sistema seja **maintível**, **escalável** e **flexível** para atender diferentes clientes com suas necessidades específicas, mantendo a simplicidade para módulos padrão e a robustez para módulos customizados. 