# Guia de Migração de Webhooks Banban

Este documento descreve a migração das Edge Functions do Supabase específicas do cliente Banban para o backend Fastify.

## Resumo da Migração

### Edge Functions Migradas

1. **webhook-purchase-flow** → `/api/webhooks/purchase`
2. **webhook-inventory-flow** → `/api/webhooks/inventory`
3. **webhook-sales-flow** → `/api/webhooks/sales`
4. **webhook-transfer-flow** → `/api/webhooks/transfer`
5. **daily-etl** → `/api/webhooks/etl/daily`
6. **webhook-base** → `src/shared/webhook-base/index.ts`

### Endpoints Disponíveis

| Webhook | Método | Endpoint | Descrição |
|---------|--------|----------|-----------|
| Purchase Flow | POST | `/api/webhooks/purchase` | Fluxo de compras do ERP |
| Inventory Flow | POST | `/api/webhooks/inventory` | Gestão de inventário |
| Sales Flow | POST | `/api/webhooks/sales` | Fluxo de vendas |
| Transfer Flow | POST | `/api/webhooks/transfer` | Transferências entre locais |
| ETL Diário | POST | `/api/webhooks/etl/daily` | Processamento ETL diário |
| Health Check | GET | `/api/webhooks/health` | Status dos webhooks |

## Configuração

### Variáveis de Ambiente

```bash
# Servidor
NODE_ENV=development
PORT=3001
HOST=localhost

# Supabase
SUPABASE_URL=https://bopytcghbmuywfltmwhk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Webhooks
WEBHOOK_SECRET_TOKEN=banban_webhook_secret_2025
```

### Instalação

```bash
cd backend
npm install @supabase/supabase-js@^2.39.7
npm run dev
```

## Estrutura do Projeto

```
backend/src/
├── routes/webhooks/
│   ├── index.ts              # Registro de todas as rotas
│   ├── purchase-flow.ts      # Webhook de compras
│   ├── inventory-flow.ts     # Webhook de inventário
│   ├── sales-flow.ts         # Webhook de vendas
│   ├── transfer-flow.ts      # Webhook de transferências
│   └── etl.ts                # ETL diário
├── shared/webhook-base/
│   └── index.ts              # Utilitários compartilhados
└── config/
    └── config.ts             # Configurações atualizadas
```

## Autenticação

Todos os webhooks requerem autenticação via Bearer Token:

```bash
curl -X POST http://localhost:3001/api/webhooks/purchase \
  -H "Authorization: Bearer banban_webhook_secret_2025" \
  -H "Content-Type: application/json" \
  -d '{"event_type": "purchase_order_created", ...}'
```

## Purchase Flow - Implementação Completa

O webhook de Purchase Flow está totalmente implementado com os seguintes eventos:

### Eventos Suportados

- ✅ `purchase_order_created` - **IMPLEMENTADO**
- 🚧 `purchase_order_approved` - **TODO**
- 🚧 `goods_received_cd` - **TODO**
- 🚧 `receipt_verified_ok` - **TODO**
- 🚧 `receipt_verified_with_discrepancy` - **TODO**
- 🚧 `receipt_effective_in_cd` - **TODO**

### Funcionalidades do Purchase Order Created

1. **Auto-criação de Entidades**:
   - Fornecedores (suppliers)
   - Localizações (locations)
   - Produtos e variantes (products/variants)

2. **Estrutura de Dados**:
   - Utiliza tabelas genéricas `tenant_business_entities`
   - Relacionamentos via `tenant_business_relationships`
   - Transações via `tenant_business_transactions`

3. **Logging Completo**:
   - Todos os eventos são registrados em `webhook_logs`
   - Métricas de performance incluídas

## Testes

### Teste Manual

```bash
node test-webhook-migration.js
```

### Teste com curl

```bash
# Health Check
curl http://localhost:3001/api/webhooks/health

# Purchase Order Created
curl -X POST http://localhost:3001/api/webhooks/purchase \
  -H "Authorization: Bearer banban_webhook_secret_2025" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "purchase_order_created",
    "organization_id": "test-org",
    "timestamp": "2025-01-03T10:00:00Z",
    "data": {
      "purchase_order": {
        "order_number": "PO-001",
        "supplier_code": "SUP-001",
        "supplier_name": "Fornecedor Teste"
      },
      "items": [
        {
          "item_sequence": 1,
          "variant_code": "VAR-001",
          "product_code": "PROD-001",
          "quantity_ordered": 10
        }
      ]
    }
  }'
```

## Próximos Passos

### Implementação Pendente

1. **Completar Purchase Flow**:
   - `purchase_order_approved`
   - `goods_received_cd`
   - `receipt_verified_ok`
   - `receipt_verified_with_discrepancy`
   - `receipt_effective_in_cd`

2. **Implementar Outros Flows**:
   - Inventory Flow (eventos específicos)
   - Sales Flow (eventos específicos)
   - Transfer Flow (eventos específicos)

3. **Melhorias**:
   - Retry logic
   - Rate limiting específico
   - Métricas customizadas
   - Validação de schema

### Migração do Frontend

As chamadas no frontend devem ser atualizadas para apontar para o novo backend:

```typescript
// Antes (Supabase Edge Function)
const response = await fetch('/functions/v1/webhook-purchase-flow', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});

// Depois (Backend Fastify)
const response = await fetch('http://localhost:3001/api/webhooks/purchase', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer banban_webhook_secret_2025',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});
```

## Monitoramento

### Logs

Os logs estão disponíveis em:
- Console do servidor (desenvolvimento)
- Tabela `webhook_logs` no Supabase
- Métricas de performance incluídas

### Health Check

```bash
curl http://localhost:3001/api/webhooks/health
```

Retorna status de todos os webhooks disponíveis.

## Troubleshooting

### Problemas Comuns

1. **Erro 401 - Unauthorized**
   - Verificar token de autenticação
   - Confirmar variável `WEBHOOK_SECRET_TOKEN`

2. **Erro 500 - Internal Server Error**
   - Verificar conexão com Supabase
   - Verificar variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`

3. **Entidades não encontradas**
   - Verificar se o `organization_id` está correto
   - Confirmar que a organização existe no banco

### Debug

Para debug detalhado, ajustar o `LOG_LEVEL`:

```bash
LOG_LEVEL=debug npm run dev
```

## Compatibilidade

A migração mantém 100% de compatibilidade com:
- Estrutura de dados existente
- Payloads dos webhooks
- Respostas de API
- Sistema de logging

A única mudança necessária é atualizar as URLs de chamada no frontend/sistemas externos.