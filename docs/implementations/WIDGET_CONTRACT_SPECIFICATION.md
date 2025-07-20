# Especificação do Contrato Widget.json

Este documento define a especificação completa para contratos de widgets no sistema de dashboard dinâmico.

## Visão Geral

O arquivo `widget.json` é o contrato que define como um módulo expõe seus widgets para o sistema de dashboard. Ele especifica:

- **Metadados do módulo** (ID, versão, descrição)
- **Lista de widgets** fornecidos
- **Configurações de query** para buscar dados
- **Interface de configuração** para personalização
- **Compatibilidade** e permissões

## Estrutura do Arquivo

### Campos Obrigatórios

```json
{
  "moduleId": "analytics",
  "version": "1.0.0",
  "widgets": [
    {
      "id": "performance-kpis",
      "title": "Performance KPIs",
      "componentPath": "/widgets/analytics/performance-kpis",
      "queryConfig": {
        "type": "rpc",
        "function": "get_performance_kpis"
      }
    }
  ]
}
```

### Campos Opcionais

```json
{
  "description": "Módulo de analytics com widgets de performance",
  "dependencies": [
    {
      "moduleId": "core",
      "minVersion": "1.0.0"
    }
  ]
}
```

## Definição de Widgets

### Campos Básicos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | ✅ | Identificador único (kebab-case) |
| `title` | string | ✅ | Título exibido |
| `componentPath` | string | ✅ | Caminho do componente React |
| `queryConfig` | object | ✅ | Configuração da query de dados |
| `description` | string | ❌ | Descrição do widget |
| `category` | enum | ❌ | Categoria para organização |
| `tags` | array | ❌ | Tags para busca |

### Configuração de Query

#### 1. RPC (Supabase Functions)
```json
{
  "queryConfig": {
    "type": "rpc",
    "function": "get_performance_kpis",
    "params": {
      "date_range": "7d",
      "include_trends": true
    }
  }
}
```

#### 2. REST Endpoints
```json
{
  "queryConfig": {
    "type": "rest",
    "endpoint": "https://api.module.com/data",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    },
    "params": {
      "filter": "active"
    }
  }
}
```

#### 3. SQL Queries
```json
{
  "queryConfig": {
    "type": "sql",
    "query": "SELECT count(*) as total FROM orders WHERE tenant_id = $1 AND created_at >= $2",
    "params": {
      "date_from": "2025-01-01"
    }
  }
}
```

### Configuração de Layout

```json
{
  "defaultSize": { "width": 4, "height": 4 },
  "minSize": { "width": 2, "height": 2 },
  "maxSize": { "width": 8, "height": 6 },
  "resizable": true
}
```

### Schema de Configuração

Para widgets configuráveis, definir schema JSON:

```json
{
  "configurable": true,
  "configSchema": {
    "type": "object",
    "properties": {
      "threshold": {
        "type": "number",
        "title": "Limite de Estoque",
        "description": "Valor mínimo para alertas",
        "default": 10,
        "minimum": 1,
        "maximum": 1000
      },
      "showTrends": {
        "type": "boolean",
        "title": "Mostrar Tendências",
        "default": true
      },
      "period": {
        "type": "string",
        "title": "Período",
        "enum": ["7d", "30d", "90d"],
        "default": "30d"
      }
    },
    "required": ["threshold"]
  }
}
```

### Compatibilidade e Permissões

```json
{
  "permissions": ["analytics:read", "dashboard:view"],
  "compatibility": {
    "minScreenWidth": 768,
    "mobile": true,
    "clientTypes": ["standard", "banban", "riachuelo"]
  },
  "refreshInterval": 300
}
```

## Exemplos Completos

### Widget Simples (KPI)
```json
{
  "id": "total-sales",
  "title": "Total de Vendas",
  "description": "Vendas totais do período selecionado",
  "componentPath": "/widgets/analytics/total-sales",
  "category": "analytics",
  "tags": ["sales", "kpi", "revenue"],
  "queryConfig": {
    "type": "rpc",
    "function": "get_total_sales",
    "params": {
      "period": "30d"
    }
  },
  "defaultSize": { "width": 3, "height": 2 },
  "refreshInterval": 300,
  "configurable": true,
  "configSchema": {
    "type": "object",
    "properties": {
      "period": {
        "type": "string",
        "title": "Período",
        "enum": ["7d", "30d", "90d", "1y"],
        "default": "30d"
      },
      "currency": {
        "type": "string",
        "title": "Moeda",
        "enum": ["BRL", "USD", "EUR"],
        "default": "BRL"
      }
    }
  }
}
```

### Widget Complexo (Chart)
```json
{
  "id": "sales-trend-chart",
  "title": "Tendência de Vendas",
  "description": "Gráfico de linha mostrando evolução das vendas",
  "componentPath": "/widgets/analytics/sales-trend-chart",
  "category": "analytics",
  "tags": ["sales", "chart", "trends", "timeline"],
  "queryConfig": {
    "type": "rpc",
    "function": "get_sales_trend",
    "params": {
      "period": "30d",
      "granularity": "daily"
    }
  },
  "defaultSize": { "width": 8, "height": 5 },
  "minSize": { "width": 6, "height": 4 },
  "maxSize": { "width": 12, "height": 8 },
  "refreshInterval": 600,
  "permissions": ["analytics:read", "sales:view"],
  "configurable": true,
  "configSchema": {
    "type": "object",
    "properties": {
      "period": {
        "type": "string",
        "title": "Período",
        "enum": ["7d", "30d", "90d", "1y"],
        "default": "30d"
      },
      "granularity": {
        "type": "string",
        "title": "Granularidade",
        "enum": ["hourly", "daily", "weekly", "monthly"],
        "default": "daily"
      },
      "showAverage": {
        "type": "boolean",
        "title": "Mostrar Média",
        "default": true
      },
      "chartType": {
        "type": "string",
        "title": "Tipo de Gráfico",
        "enum": ["line", "bar", "area"],
        "default": "line"
      }
    },
    "required": ["period", "granularity"]
  },
  "compatibility": {
    "minScreenWidth": 768,
    "mobile": false,
    "clientTypes": ["standard", "banban"]
  }
}
```

## Validação do Schema

Todos os arquivos `widget.json` devem seguir o schema JSON definido em `/docs/implementations/widget-contract-schema.json`.

### Validação Manual
```bash
# Usando jsonschema (Python)
jsonschema -i module/widget.json widget-contract-schema.json

# Usando ajv-cli (Node.js)
ajv validate -s widget-contract-schema.json -d module/widget.json
```

### Validação no Pipeline
O script `publish_widgets.ts` incluirá validação automática antes de publicar widgets.

## Versionamento

### Versão do Schema
- Atual: `1.0.0`
- Backward compatibility garantida dentro da major version

### Versão do Módulo
- Seguir Semantic Versioning (`major.minor.patch`)
- Breaking changes requerem incremento da major version

## Boas Práticas

### 1. Naming Conventions
- **IDs**: kebab-case (`performance-kpis`, `low-stock-alerts`)
- **Títulos**: Title Case (`Performance KPIs`, `Low Stock Alerts`)
- **Tags**: lowercase (`sales`, `inventory`, `kpi`)

### 2. Componentização
- Componentes devem ser independentes e reutilizáveis
- Props definidas através do `defaultParams` e `customParams`
- Tratamento de estados de loading e error

### 3. Performance
- Definir `refreshInterval` apropriado para o tipo de dados
- Usar cache quando possível (configurado no BFF)
- Otimizar queries para evitar N+1 problems

### 4. UX/UI
- Tamanhos responsivos (`minSize`, `maxSize`)
- Compatibilidade móvel quando aplicável
- Feedback visual para estados de carregamento

### 5. Configuração
- Schema de configuração bem definido
- Valores padrão sensatos
- Validação de input nos componentes

## Migração de Contratos

### Adicionando Campos
Novos campos opcionais podem ser adicionados sem quebrar compatibilidade.

### Removendo Campos
Campos deprecated devem ser mantidos por pelo menos uma major version.

### Mudando Tipos
Mudanças de tipo requerem nova major version e migration script.

## Exemplos de Uso

Os módulos existentes implementarão os seguintes widgets:

- **Analytics**: Performance KPIs, Sales Overview, Trend Charts
- **Inventory**: Low Stock, ABC Analysis, Movement History  
- **Performance**: System Metrics, Uptime, Response Time
- **Alerts**: Active Alerts, Alert History, Configuration

Cada exemplo será implementado seguindo esta especificação.