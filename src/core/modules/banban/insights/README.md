# BanBan Insights Module

> Módulo avançado de insights para varejo de moda, gerando análises inteligentes sobre estoque, vendas e oportunidades de negócio.

## 📋 Visão Geral

O **BanBan Insights** é um módulo customizado que analisa dados de vendas, estoque e comportamento do cliente para gerar insights acionáveis específicos para o varejo de moda. Utiliza algoritmos de análise preditiva e regras de negócio especializadas para identificar oportunidades e riscos.

### ✨ Principais Funcionalidades

- 📊 **Análise de Estoque Baixo** - Identifica produtos com estoque crítico
- 💰 **Otimização de Margem** - Detecta oportunidades de melhoria de margem
- 🐌 **Produtos Parados** - Identifica itens com baixa rotatividade
- 📈 **Tendências Sazonais** - Análise de padrões sazonais de vendas
- 🤝 **Cross-selling** - Identifica oportunidades de venda cruzada
- 🏭 **Performance de Fornecedores** - Monitora desempenho de fornecedores
- 📍 **Otimização de Distribuição** - Sugere melhorias na distribuição
- 💵 **Cálculo de Impacto Financeiro** - Quantifica o impacto das oportunidades

## 🏗️ Arquitetura

### Estrutura do Módulo

```
banban/insights/
├── module.json              # Manifesto do módulo
├── module_schema.json       # Schema de configurações
├── README.md               # Esta documentação
├── src/
│   └── index.ts           # Entrypoint com register()
├── migrations/
│   ├── 001_initial_setup.sql
│   └── rollback/
│       └── 001_rollback.sql
├── types/
│   └── index.ts           # Interfaces TypeScript
├── services/              # Lógica de negócio
├── handlers/              # API handlers
└── utils/                 # Utilitários
```

### Tabelas do Banco de Dados

| Tabela | Propósito |
|--------|-----------|
| `tenant_insights_cache` | Cache de insights para performance |
| `tenant_insights_history` | Histórico de insights gerados |
| `tenant_insights_config` | Configurações por tenant |
| `tenant_insights_metrics` | Métricas de uso e performance |

## 🚀 Instalação e Configuração

### 1. Executar Migrations

```sql
-- Executar a migration inicial
\i src/core/modules/banban/insights/migrations/001_initial_setup.sql
```

### 2. Configuração do Módulo

```typescript
import { register } from './src/core/modules/banban/insights/src/index';

// Registrar o módulo
const module = await register();

// Inicializar com configurações customizadas
await module.initialize({
  updateInterval: 300000,      // 5 minutos
  cacheTimeout: 1800000,       // 30 minutos
  stockThreshold: 10,          // Estoque crítico
  marginThreshold: 0.31,       // Margem mínima (31%)
  slowMovingDays: 30          // Dias para produto parado
});
```

### 3. Configuração via JSON Schema

```json
{
  "general": {
    "enabled": true,
    "update_interval": 300,
    "max_insights_per_generation": 50
  },
  "business_rules": {
    "critical_stock_level": 10,
    "low_margin_threshold": 0.31,
    "slow_moving_days_threshold": 30
  },
  "caching": {
    "enabled": true,
    "ttl": 1800,
    "max_entries": 1000
  }
}
```

## 📖 Uso da API

### Endpoints Disponíveis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/modules/banban/insights/health` | GET | Health check |
| `/api/modules/banban/insights` | GET | Obter insights cached |
| `/api/modules/banban/insights/generate` | POST | Gerar novos insights |
| `/api/modules/banban/insights/analysis/category` | GET | Análise por categoria |
| `/api/modules/banban/insights/forecast` | GET | Previsão de vendas |
| `/api/modules/banban/insights/opportunities` | GET | Oportunidades de negócio |
| `/api/modules/banban/insights/financial-impact` | GET | Impacto financeiro |
| `/api/modules/banban/insights/metrics` | GET | Métricas do módulo |

### Exemplos de Uso

#### Gerar Insights

```typescript
// Via função register()
const module = await register();
const insights = await generateInsights('org-id', {
  timeframe: {
    start: '2025-01-01',
    end: '2025-01-31'
  },
  filters: {
    categories: ['roupas', 'calçados']
  }
});

// Via API REST
const response = await fetch('/api/modules/banban/insights/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organizationId: 'org-id',
    timeframe: { start: '2025-01-01', end: '2025-01-31' }
  })
});
```

#### Obter Insights Cached

```typescript
const insights = await fetch('/api/modules/banban/insights?orgId=org-id');
const data = await insights.json();
```

#### Health Check

```typescript
const health = await fetch('/api/modules/banban/insights/health');
const status = await health.json();
// { healthy: true, status: 'healthy', details: {...} }
```

## 🔧 Configuração Avançada

### Regras de Negócio

```json
{
  "business_rules": {
    "critical_stock_level": 10,
    "low_margin_threshold": 0.31,
    "slow_moving_days_threshold": 30,
    "priority_weights": {
      "financial": 0.4,
      "urgency": 0.3,
      "impact": 0.3
    }
  }
}
```

### Configurações de Performance

```json
{
  "performance": {
    "max_concurrent_analysis": 5,
    "timeout_ms": 30000,
    "retry_attempts": 3,
    "target_generation_time_ms": 5000
  }
}
```

### Notificações

```json
{
  "notifications": {
    "enabled": true,
    "channels": ["dashboard", "email"],
    "severity_filter": ["CRITICAL", "ATTENTION"]
  }
}
```

## 📊 Tipos de Insights

### 1. LOW_STOCK (Estoque Baixo)
- **Descrição**: Produtos com estoque abaixo do nível crítico
- **Severidade**: CRITICAL ou ATTENTION
- **Ação Sugerida**: Reabastecer estoque urgentemente

### 2. LOW_MARGIN (Margem Baixa)
- **Descrição**: Produtos com margem abaixo do threshold
- **Severidade**: MODERATE ou ATTENTION
- **Ação Sugerida**: Revisar precificação ou negociar com fornecedor

### 3. SLOW_MOVING (Produto Parado)
- **Descrição**: Produtos sem vendas nos últimos X dias
- **Severidade**: MODERATE
- **Ação Sugerida**: Promoção ou liquidação

### 4. OPPORTUNITY (Oportunidade)
- **Descrição**: Oportunidades de cross-selling ou upselling
- **Severidade**: OPPORTUNITY
- **Ação Sugerida**: Implementar estratégia de vendas

### 5. SEASONAL_TREND (Tendência Sazonal)
- **Descrição**: Padrões sazonais identificados
- **Severidade**: OPPORTUNITY
- **Ação Sugerida**: Ajustar estoque para sazonalidade

## 🧪 Testes

### Executar Testes

```bash
# Testes unitários
npm run test:unit src/core/modules/banban/insights

# Testes de integração
npm run test:integration src/core/modules/banban/insights

# Coverage
npm run test:coverage src/core/modules/banban/insights
```

### Exemplo de Teste

```typescript
import { describe, it, expect } from 'vitest';
import { register } from './src/index';

describe('BanBan Insights Module', () => {
  it('should register successfully', async () => {
    const module = await register();
    expect(module.id).toBe('banban-insights');
    expect(module.name).toBe('BanBan Insights');
  });

  it('should pass health check', async () => {
    const module = await register();
    const health = await module.healthCheck();
    expect(health.healthy).toBe(true);
  });
});
```

## 🔄 Migrations

### Aplicar Migration

```sql
\i src/core/modules/banban/insights/migrations/001_initial_setup.sql
```

### Rollback

```sql
\i src/core/modules/banban/insights/migrations/rollback/001_rollback.sql
```

## 📈 Monitoramento

### Métricas Disponíveis

```typescript
const metrics = module.getMetrics();
// {
//   insights: { generated: 150, cached: 45, errors: 2 },
//   performance: { avgGenerationTime: 2500, cacheHitRate: 0.75, errorRate: 0.01 },
//   financial: { totalImpactCalculated: 125000, avgImpactPerInsight: 833 }
// }
```

### Health Check

```typescript
const health = await module.healthCheck();
// {
//   healthy: true,
//   status: 'healthy',
//   details: { module: 'banban-insights', uptime: 3600 },
//   timestamp: '2025-01-03T10:30:00Z'
// }
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Insights não sendo gerados
- Verificar se o módulo está habilitado
- Verificar logs de erro
- Validar configurações de business rules

#### 2. Performance lenta
- Verificar configurações de cache
- Ajustar `max_concurrent_analysis`
- Verificar índices do banco de dados

#### 3. Dados inconsistentes
- Executar health check
- Verificar integridade dos dados
- Considerar limpeza de cache

### Logs

```typescript
// Habilitar logs de debug
{
  "general": {
    "log_level": "debug"
  }
}
```

## 🔐 Segurança

- **RLS**: Todas as tabelas têm Row Level Security habilitado
- **Auditoria**: Todas as operações são auditadas
- **Criptografia**: Dados sensíveis são criptografados
- **Controle de Acesso**: Baseado em roles organizacionais

## 📝 Changelog

### v2.0.0 (2025-01-03)
- ✅ Refatoração completa para nova arquitetura
- ✅ Implementação da função `register()`
- ✅ Criação de manifesto e schema JSON
- ✅ Migrations SQL idempotentes
- ✅ Documentação completa

### v1.x.x (Versões anteriores)
- Implementação inicial do sistema de insights
- Arquitetura modular básica

## 🤝 Contribuição

1. Seguir padrões de código TypeScript
2. Testes obrigatórios (coverage ≥70%)
3. Documentação atualizada
4. Migrations idempotentes
5. Compatibilidade mantida

## 📞 Suporte

- **Email**: dev@banban.com.br
- **Documentação**: https://docs.banban.com.br/modules/insights
- **Repository**: https://github.com/banban/modules/banban-insights

---

**Status**: ✅ **Refatorado e Conforme** (Fase 2 - Arquitetura v2.0) 
const insights = await fetch('/api/modules/banban/insights?orgId=org-id');
const data = await insights.json();
```

#### Health Check

```typescript
const health = await fetch('/api/modules/banban/insights/health');
const status = await health.json();
// { healthy: true, status: 'healthy', details: {...} }
```

## 🔧 Configuração Avançada

### Regras de Negócio

```json
{
  "business_rules": {
    "critical_stock_level": 10,
    "low_margin_threshold": 0.31,
    "slow_moving_days_threshold": 30,
    "priority_weights": {
      "financial": 0.4,
      "urgency": 0.3,
      "impact": 0.3
    }
  }
}
```

### Configurações de Performance

```json
{
  "performance": {
    "max_concurrent_analysis": 5,
    "timeout_ms": 30000,
    "retry_attempts": 3,
    "target_generation_time_ms": 5000
  }
}
```

### Notificações

```json
{
  "notifications": {
    "enabled": true,
    "channels": ["dashboard", "email"],
    "severity_filter": ["CRITICAL", "ATTENTION"]
  }
}
```

## 📊 Tipos de Insights

### 1. LOW_STOCK (Estoque Baixo)
- **Descrição**: Produtos com estoque abaixo do nível crítico
- **Severidade**: CRITICAL ou ATTENTION
- **Ação Sugerida**: Reabastecer estoque urgentemente

### 2. LOW_MARGIN (Margem Baixa)
- **Descrição**: Produtos com margem abaixo do threshold
- **Severidade**: MODERATE ou ATTENTION
- **Ação Sugerida**: Revisar precificação ou negociar com fornecedor

### 3. SLOW_MOVING (Produto Parado)
- **Descrição**: Produtos sem vendas nos últimos X dias
- **Severidade**: MODERATE
- **Ação Sugerida**: Promoção ou liquidação

### 4. OPPORTUNITY (Oportunidade)
- **Descrição**: Oportunidades de cross-selling ou upselling
- **Severidade**: OPPORTUNITY
- **Ação Sugerida**: Implementar estratégia de vendas

### 5. SEASONAL_TREND (Tendência Sazonal)
- **Descrição**: Padrões sazonais identificados
- **Severidade**: OPPORTUNITY
- **Ação Sugerida**: Ajustar estoque para sazonalidade

## 🧪 Testes

### Executar Testes

```bash
# Testes unitários
npm run test:unit src/core/modules/banban/insights

# Testes de integração
npm run test:integration src/core/modules/banban/insights

# Coverage
npm run test:coverage src/core/modules/banban/insights
```

### Exemplo de Teste

```typescript
import { describe, it, expect } from 'vitest';
import { register } from './src/index';

describe('BanBan Insights Module', () => {
  it('should register successfully', async () => {
    const module = await register();
    expect(module.id).toBe('banban-insights');
    expect(module.name).toBe('BanBan Insights');
  });

  it('should pass health check', async () => {
    const module = await register();
    const health = await module.healthCheck();
    expect(health.healthy).toBe(true);
  });
});
```

## 🔄 Migrations

### Aplicar Migration

```sql
\i src/core/modules/banban/insights/migrations/001_initial_setup.sql
```

### Rollback

```sql
\i src/core/modules/banban/insights/migrations/rollback/001_rollback.sql
```

## 📈 Monitoramento

### Métricas Disponíveis

```typescript
const metrics = module.getMetrics();
// {
//   insights: { generated: 150, cached: 45, errors: 2 },
//   performance: { avgGenerationTime: 2500, cacheHitRate: 0.75, errorRate: 0.01 },
//   financial: { totalImpactCalculated: 125000, avgImpactPerInsight: 833 }
// }
```

### Health Check

```typescript
const health = await module.healthCheck();
// {
//   healthy: true,
//   status: 'healthy',
//   details: { module: 'banban-insights', uptime: 3600 },
//   timestamp: '2025-01-03T10:30:00Z'
// }
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Insights não sendo gerados
- Verificar se o módulo está habilitado
- Verificar logs de erro
- Validar configurações de business rules

#### 2. Performance lenta
- Verificar configurações de cache
- Ajustar `max_concurrent_analysis`
- Verificar índices do banco de dados

#### 3. Dados inconsistentes
- Executar health check
- Verificar integridade dos dados
- Considerar limpeza de cache

### Logs

```typescript
// Habilitar logs de debug
{
  "general": {
    "log_level": "debug"
  }
}
```

## 🔐 Segurança

- **RLS**: Todas as tabelas têm Row Level Security habilitado
- **Auditoria**: Todas as operações são auditadas
- **Criptografia**: Dados sensíveis são criptografados
- **Controle de Acesso**: Baseado em roles organizacionais

## 📝 Changelog

### v2.0.0 (2025-01-03)
- ✅ Refatoração completa para nova arquitetura
- ✅ Implementação da função `register()`
- ✅ Criação de manifesto e schema JSON
- ✅ Migrations SQL idempotentes
- ✅ Documentação completa

### v1.x.x (Versões anteriores)
- Implementação inicial do sistema de insights
- Arquitetura modular básica

## 🤝 Contribuição

1. Seguir padrões de código TypeScript
2. Testes obrigatórios (coverage ≥70%)
3. Documentação atualizada
4. Migrations idempotentes
5. Compatibilidade mantida

## 📞 Suporte

- **Email**: dev@banban.com.br
- **Documentação**: https://docs.banban.com.br/modules/insights
- **Repository**: https://github.com/banban/modules/banban-insights

---

**Status**: ✅ **Refatorado e Conforme** (Fase 2 - Arquitetura v2.0) 