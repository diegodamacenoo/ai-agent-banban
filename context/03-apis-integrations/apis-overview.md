# APIs e Integrações

## APIs Principais

### 1. Next.js API Routes (BFF)
```
/api/
├── auth/
│   ├── login/route.ts
│   ├── logout/route.ts
│   └── verify/route.ts
├── documents/
│   ├── route.ts              # GET, POST
│   └── [id]/route.ts         # GET, PUT, DELETE
├── products/
│   ├── route.ts
│   └── [id]/route.ts
├── admin/
│   ├── users/route.ts
│   └── organizations/route.ts
└── webhooks/
    ├── sales/route.ts
    ├── purchase/route.ts
    ├── inventory/route.ts
    └── transfer/route.ts
```

### 2. Fastify Backend API
```
Backend (localhost:4000)
├── /health                   # Health check
├── /api/test                 # Test endpoint
├── /metrics                  # Prometheus metrics
└── /api/v1/
    ├── documents/
    ├── products/
    ├── analytics/
    └── performance/
```

### 3. Supabase APIs
```
Supabase
├── Auth API                  # Autenticação
├── Database API              # CRUD operations
├── Storage API               # File uploads
├── Edge Functions API        # Webhooks
└── Realtime API             # WebSocket subscriptions
```

## Webhooks (Edge Functions)

### 1. Sales Flow
```typescript
// webhook-sales-flow
POST /functions/v1/webhook-sales-flow

Eventos:
- sale_completed
- sale_cancelled  
- return_processed (com transferência automática)

Payload:
{
  "event_type": "sale_completed",
  "organization_id": "uuid",
  "document_id": "uuid",
  "total_amount": 1500.00,
  "items": [...],
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 2. Purchase Flow
```typescript
// webhook-purchase-flow
POST /functions/v1/webhook-purchase-flow

Eventos:
- purchase_completed
- purchase_cancelled
- purchase_returned

Payload:
{
  "event_type": "purchase_completed",
  "organization_id": "uuid",
  "supplier_id": "uuid",
  "items": [...],
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 3. Inventory Flow
```typescript
// webhook-inventory-flow
POST /functions/v1/webhook-inventory-flow

Eventos:
- inventory_adjustment
- inventory_count
- inventory_transfer

Payload:
{
  "event_type": "inventory_adjustment",
  "organization_id": "uuid",
  "product_id": "uuid",
  "quantity_change": -5,
  "reason": "DAMAGED",
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 4. Transfer Flow
```typescript
// webhook-transfer-flow
POST /functions/v1/webhook-transfer-flow

Eventos:
- transfer_initiated
- transfer_completed
- transfer_cancelled

Payload:
{
  "event_type": "transfer_completed",
  "organization_id": "uuid",
  "from_location": "STORE_A",
  "to_location": "STORE_B",
  "items": [...],
  "timestamp": "2024-01-01T10:00:00Z"
}
```

## Integrações Externas

### 1. ERP Banban (Sistema Legado)
```typescript
// Configuração no backend
const erpConfig = {
  baseUrl: process.env.BANBAN_ERP_URL,
  apiKey: process.env.BANBAN_ERP_KEY,
  timeout: 30000,
  retries: 3
}

// Endpoints principais
GET  /api/documents        # Sincronização de documentos
GET  /api/products         # Catálogo de produtos
POST /api/inventory        # Ajustes de estoque
GET  /api/reports          # Relatórios financeiros
```

### 2. Sistema Fiscal
```typescript
// Integração com sistema fiscal
const fiscalConfig = {
  baseUrl: process.env.FISCAL_SYSTEM_URL,
  certificate: process.env.FISCAL_CERTIFICATE,
  environment: 'production' // ou 'sandbox'
}

// Operações
POST /api/nfe/emit         # Emissão de NF-e
GET  /api/nfe/status       # Status da NF-e
POST /api/nfce/emit        # Emissão de NFC-e
```

### 3. Sistema de BI
```typescript
// Integração com BI
const biConfig = {
  baseUrl: process.env.BI_SYSTEM_URL,
  database: 'banban_analytics',
  refreshInterval: 3600000 // 1 hora
}

// Endpoints
GET  /api/dashboards       # Dashboards disponíveis
GET  /api/reports          # Relatórios
POST /api/data-refresh     # Refresh de dados
```

## Autenticação e Autorização

### 1. JWT Tokens
```typescript
// Estrutura do JWT
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "admin",
  "organization_id": "org-uuid",
  "iat": 1640995200,
  "exp": 1640998800
}

// Validação
const { data: { user } } = await supabase.auth.getUser(token)
```

### 2. API Keys (Webhooks)
```typescript
// Validação de webhook
const signature = request.headers.get('x-webhook-signature')
const payload = await request.text()

const expectedSignature = crypto
  .createHmac('sha256', process.env.WEBHOOK_SECRET)
  .update(payload)
  .digest('hex')

if (signature !== expectedSignature) {
  throw new Error('Invalid signature')
}
```

### 3. Rate Limiting
```typescript
// Configuração por endpoint
const rateLimits = {
  '/api/auth/login': { requests: 5, window: '1m' },
  '/api/documents': { requests: 100, window: '1m' },
  '/api/webhooks/*': { requests: 1000, window: '1m' }
}

// Implementação
const { success } = await ratelimit.limit(
  `${endpoint}:${clientIP}`
)
```

## Monitoramento e Observabilidade

### 1. Health Checks
```typescript
// Next.js API
GET /api/health
{
  "status": "healthy",
  "timestamp": "2024-01-01T10:00:00Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "backend": "healthy"
  }
}

// Fastify Backend
GET /health
{
  "status": "ok",
  "uptime": 3600,
  "memory": { "used": "50MB", "total": "512MB" },
  "database": "connected"
}
```

### 2. Metrics (Prometheus)
```typescript
// Métricas coletadas
GET /metrics

# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/documents",status="200"} 1500

# HELP http_request_duration_seconds HTTP request duration
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 1200
```

### 3. Logs Estruturados
```typescript
// Formato de log
{
  "timestamp": "2024-01-01T10:00:00Z",
  "level": "info",
  "message": "Document created",
  "context": {
    "user_id": "user-uuid",
    "organization_id": "org-uuid",
    "document_id": "doc-uuid",
    "ip_address": "192.168.1.1"
  }
}
```

## Configuração de Ambiente

### 1. Variáveis Essenciais
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Cliente
NEXT_PUBLIC_CLIENT_TYPE=banban

# Integrações
BANBAN_ERP_URL=
BANBAN_ERP_KEY=
FISCAL_SYSTEM_URL=
WEBHOOK_SECRET=
```

### 2. Configuração por Ambiente
```typescript
// config/environments.ts
const environments = {
  development: {
    apiUrl: 'http://localhost:4000',
    logLevel: 'debug',
    rateLimitEnabled: false
  },
  staging: {
    apiUrl: 'https://api-staging.axon.com',
    logLevel: 'info',
    rateLimitEnabled: true
  },
  production: {
    apiUrl: 'https://api.axon.com',
    logLevel: 'warn',
    rateLimitEnabled: true
  }
}
``` 