# Dashboard API Documentation

Sistema de APIs para dashboard dinâmico e personalizável.

## Endpoints Disponíveis

### 📊 Layout Management

#### `GET /api/dashboard/layout`
Busca layout e widgets habilitados para o tenant atual.

**Response:**
```json
{
  "success": true,
  "data": {
    "layout": {
      "id": "uuid",
      "name": "Default Layout",
      "config": {
        "cols": 12,
        "breakpoints": { "lg": 1200, "md": 996, "sm": 768, "xs": 480, "xxs": 0 },
        "layouts": { "lg": [], "md": [], "sm": [], "xs": [], "xxs": [] }
      },
      "isDefault": false
    },
    "widgets": [
      {
        "id": "uuid",
        "widgetId": "uuid",
        "title": "Performance KPIs",
        "description": "Key performance indicators",
        "componentPath": "/widgets/performance-kpis",
        "moduleId": "analytics",
        "queryType": "rpc",
        "queryConfig": { "function": "get_performance_kpis" },
        "customParams": {},
        "position": { "x": 0, "y": 0, "w": 4, "h": 4 },
        "category": "analytics",
        "tags": ["performance", "kpis"],
        "displayOrder": 0
      }
    ],
    "tenantId": "uuid"
  }
}
```

#### `PUT /api/dashboard/layout`
Salva layout personalizado para o tenant.

**Request Body:**
```json
{
  "layoutConfig": {
    "cols": 12,
    "breakpoints": { "lg": 1200, "md": 996, "sm": 768, "xs": 480, "xxs": 0 },
    "layouts": {
      "lg": [
        { "i": "widget-1", "x": 0, "y": 0, "w": 4, "h": 4 }
      ]
    }
  },
  "layoutName": "My Custom Layout"
}
```

### 📈 Widget Data

#### `POST /api/dashboard/data`
Executa queries para múltiplos widgets (batch processing).

**Request Body:**
```json
{
  "queries": [
    {
      "widgetId": "uuid",
      "queryType": "rpc",
      "queryConfig": {
        "function": "get_performance_kpis",
        "params": { "date_range": "7d" }
      },
      "customParams": { "threshold": 100 }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "widget-uuid-1": {
      "total_sales": 150000,
      "conversion_rate": 0.15,
      "avg_order_value": 85.50
    },
    "widget-uuid-2": [
      { "date": "2025-06-30", "value": 1250 }
    ]
  },
  "errors": {
    "widget-uuid-3": "Connection timeout"
  },
  "timestamp": "2025-06-30T12:00:00.000Z"
}
```

#### `GET /api/dashboard/data?widgetId=uuid`
Busca dados de um widget específico.

### 🧩 Widget Management

#### `GET /api/dashboard/widgets?type=enabled|available|all`
Lista widgets baseado no tipo solicitado.

**Query Parameters:**
- `type`: `enabled` (padrão) | `available` | `all`

**Response (type=enabled):**
```json
{
  "success": true,
  "data": [
    {
      "id": "tenant-widget-uuid",
      "widget_id": "widget-uuid",
      "enabled": true,
      "position_x": 0,
      "position_y": 0,
      "width": 4,
      "height": 4,
      "custom_params": {},
      "display_order": 0,
      "dashboard_widgets": {
        "id": "widget-uuid",
        "title": "Performance KPIs",
        "description": "Key performance indicators",
        "component_path": "/widgets/performance-kpis",
        "module_id": "analytics",
        "query_type": "rpc",
        "query_config": { "function": "get_performance_kpis" },
        "category": "analytics"
      }
    }
  ]
}
```

#### `POST /api/dashboard/widgets`
Habilita widget para o tenant.

**Request Body:**
```json
{
  "widgetId": "uuid",
  "position": { "x": 0, "y": 0, "w": 4, "h": 4 },
  "customParams": { "threshold": 100 },
  "displayOrder": 0
}
```

#### `PUT /api/dashboard/widgets`
Atualiza configuração de widget do tenant.

**Request Body:**
```json
{
  "tenantWidgetId": "uuid",
  "enabled": true,
  "position": { "x": 2, "y": 0, "w": 6, "h": 4 },
  "customParams": { "threshold": 150 },
  "displayOrder": 1
}
```

#### `DELETE /api/dashboard/widgets?tenantWidgetId=uuid`
Desabilita widget do tenant.

### 🚀 Cache Management

#### `GET /api/dashboard/cache`
Obter estatísticas do cache (apenas admins).

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEntries": 25,
    "expiredEntries": 3,
    "memoryUsage": "156 KB",
    "cacheEnabled": true,
    "timestamp": "2025-06-30T12:00:00.000Z"
  }
}
```

#### `DELETE /api/dashboard/cache?tenantId=uuid&widgetId=uuid`
Limpar cache específico ou geral.

**Query Parameters:**
- `tenantId`: UUID do tenant (opcional)
- `widgetId`: UUID do widget (opcional)

**Comportamento:**
- Sem parâmetros: Limpa todo cache (apenas master_admin)
- Apenas `tenantId`: Limpa cache do tenant
- `tenantId` + `widgetId`: Limpa cache do widget específico

## Tipos de Query Suportados

### 1. RPC (Remote Procedure Call)
```json
{
  "queryType": "rpc",
  "queryConfig": {
    "function": "get_performance_kpis",
    "params": { "date_range": "7d" }
  }
}
```

### 2. REST Endpoint
```json
{
  "queryType": "rest",
  "queryConfig": {
    "endpoint": "https://api.example.com/data",
    "params": { "filter": "active" }
  }
}
```

### 3. SQL Query
```json
{
  "queryType": "sql",
  "queryConfig": {
    "sql": "SELECT count(*) FROM orders WHERE tenant_id = $1",
    "params": {}
  }
}
```

## Configurações de Cache

O sistema suporta cache inteligente baseado na categoria do widget:

```typescript
{
  'performance-kpis': { ttl: 15 * 60 * 1000 }, // 15 min
  'sales-overview': { ttl: 10 * 60 * 1000 },   // 10 min
  'low-stock': { ttl: 5 * 60 * 1000 },         // 5 min
  'abc-analysis': { ttl: 30 * 60 * 1000 },     // 30 min
  'active-alerts': { ttl: 2 * 60 * 1000 },     // 2 min
  'default': { ttl: 5 * 60 * 1000 }            // 5 min
}
```

## Segurança

- **Autenticação**: Todas as rotas requerem token JWT válido
- **RLS (Row Level Security)**: Isolamento automático por tenant
- **Autorização**: Controle baseado em roles (`master_admin`, `organization_admin`, etc.)
- **Validação**: Input sanitization e validação de tipos

## Error Handling

Todas as APIs retornam errors consistentes:

```json
{
  "error": "Descriptive error message",
  "details": "Technical details (desenvolvimento apenas)",
  "status": 400
}
```

## Status Codes

- `200`: Sucesso
- `400`: Bad Request (dados inválidos)
- `401`: Unauthorized (não autenticado)
- `403`: Forbidden (sem permissão)
- `404`: Not Found (recurso não encontrado)
- `500`: Internal Server Error