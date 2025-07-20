# Webhooks Guide - Edge Functions

## Visão Geral

Os webhooks do Axon são implementados como **Supabase Edge Functions**, fornecendo endpoints escaláveis para integração com sistemas externos. Cada webhook processa eventos específicos do domínio de negócio.

## 🎯 Webhooks Disponíveis

### 1. Sales Flow
**Endpoint**: `/functions/v1/webhook-sales-flow`

#### Eventos Suportados
- `sale_completed` - Venda finalizada
- `sale_cancelled` - Venda cancelada  
- `return_processed` - Devolução processada

#### Payload Exemplo
```typescript
{
  "event_type": "sale_completed",
  "organization_id": "uuid",
  "document_id": "uuid", 
  "total_amount": 1500.00,
  "items": [
    {
      "variant_id": "uuid",
      "quantity": 2,
      "unit_price": 750.00
    }
  ],
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 2. Purchase Flow
**Endpoint**: `/functions/v1/webhook-purchase-flow`

#### Eventos Suportados
- `purchase_completed` - Compra finalizada
- `purchase_cancelled` - Compra cancelada
- `purchase_return` - Devolução para fornecedor

#### Payload Exemplo
```typescript
{
  "event_type": "purchase_completed",
  "organization_id": "uuid",
  "supplier_id": "uuid",
  "document_id": "uuid",
  "total_amount": 5000.00,
  "items": [...],
  "expected_delivery": "2024-01-15"
}
```

### 3. Inventory Flow
**Endpoint**: `/functions/v1/webhook-inventory-flow`

#### Eventos Suportados
- `adjustment_processed` - Ajuste de estoque
- `stock_level_critical` - Estoque crítico
- `recount_completed` - Recontagem finalizada

#### Payload Exemplo
```typescript
{
  "event_type": "adjustment_processed",
  "organization_id": "uuid",
  "location_id": "uuid",
  "adjustments": [
    {
      "variant_id": "uuid",
      "old_quantity": 100,
      "new_quantity": 95,
      "reason": "damaged_goods"
    }
  ],
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 4. Transfer Flow
**Endpoint**: `/functions/v1/webhook-transfer-flow`

#### Eventos Suportados
- `transfer_initiated` - Transferência iniciada
- `transfer_completed` - Transferência completada
- `transfer_cancelled` - Transferência cancelada

#### Payload Exemplo
```typescript
{
  "event_type": "transfer_completed",
  "organization_id": "uuid",
  "from_location_id": "uuid",
  "to_location_id": "uuid",
  "items": [...],
  "transfer_date": "2024-01-01"
}
```

## 🔧 Configuração

### Deploy de Edge Functions
```bash
# Deploy individual
supabase functions deploy webhook-sales-flow

# Deploy todas as functions
supabase functions deploy
```

### Variáveis de Ambiente
```env
# No dashboard Supabase > Edge Functions > Settings
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=your-database-url
WEBHOOK_SECRET=your-webhook-secret
```

### Headers de Segurança
```typescript
// Todas as functions requerem
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer [token]',
  'X-Webhook-Secret': '[secret]'
}
```

## 🔐 Autenticação e Segurança

### Validação de Webhook Secret
```typescript
// Cada function valida o secret
const webhookSecret = req.headers.get('x-webhook-secret');
if (webhookSecret !== Deno.env.get('WEBHOOK_SECRET')) {
  return new Response('Unauthorized', { status: 401 });
}
```

### Rate Limiting
- **Limite**: 100 requests/minuto por organization_id
- **Headers retornados**: `X-RateLimit-*`

### Validação de Payload
```typescript
// Schema validation com Zod
const salesEventSchema = z.object({
  event_type: z.enum(['sale_completed', 'sale_cancelled', 'return_processed']),
  organization_id: z.string().uuid(),
  document_id: z.string().uuid(),
  // ...outros campos
});
```

## 📊 Monitoramento

### Logs das Functions
```bash
# Ver logs em tempo real
supabase functions logs webhook-sales-flow --follow

# Ver logs específicos
supabase functions logs webhook-sales-flow --since=1h
```

### Métricas Disponíveis
- **Requests por minuto**
- **Taxa de erro**
- **Latência média**
- **Uso de recursos**

### Health Check
```bash
# Endpoint de health para cada function
GET /functions/v1/webhook-sales-flow/health

# Response
{
  "status": "healthy",
  "timestamp": "2024-01-01T10:00:00Z",
  "version": "1.0.0"
}
```

## 🧪 Testing

### Teste Local
```bash
# Iniciar functions localmente
supabase functions serve

# Testar endpoint
curl -X POST http://localhost:54321/functions/v1/webhook-sales-flow \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: test-secret" \
  -d '{"event_type": "sale_completed", ...}'
```

### Teste de Integração
```typescript
// Exemplo de teste
const response = await fetch('/functions/v1/webhook-sales-flow', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Secret': process.env.WEBHOOK_SECRET
  },
  body: JSON.stringify(testPayload)
});

expect(response.status).toBe(200);
```

## 🔄 Retry e Error Handling

### Estratégia de Retry
- **Tentativas**: 3 tentativas automáticas
- **Backoff**: Exponencial (1s, 2s, 4s)
- **Timeout**: 30 segundos por tentativa

### Códigos de Resposta
- `200` - Processado com sucesso
- `400` - Payload inválido
- `401` - Não autorizado
- `429` - Rate limit excedido
- `500` - Erro interno

### Dead Letter Queue
Eventos que falham após todas as tentativas são enviados para uma tabela de `failed_webhook_events` para processamento manual.

## 📚 Próximas Seções

- 🔌 [APIs Overview](./apis-overview.md)
- 🔗 [External Integrations](./external-integrations.md)
- 🔐 [Authentication & Security](./authentication-security.md)