# Deploy Manual das Edge Functions - Supabase Dashboard

Como o Docker Desktop não está disponível, você pode fazer o deploy das edge functions diretamente pelo Supabase Dashboard.

## Acesso ao Dashboard

1. Acesse: https://supabase.com/dashboard/project/bopytcghbmuywfltmwhk/functions
2. Faça login com sua conta Supabase

## Instruções de Deploy

### 1. webhook-purchase-flow

1. Clique em "webhook-purchase-flow" na lista de functions
2. Clique em "Edit Function"
3. Substitua todo o código pelo conteúdo do arquivo: `supabase/functions/webhook-purchase-flow/index.ts`
4. Clique em "Deploy Function"

### 2. webhook-transfer-flow

1. Clique em "webhook-transfer-flow" na lista de functions
2. Clique em "Edit Function"
3. Substitua todo o código pelo conteúdo do arquivo: `supabase/functions/webhook-transfer-flow/index.ts`
4. Clique em "Deploy Function"

### 3. webhook-sales-flow

1. Clique em "webhook-sales-flow" na lista de functions
2. Clique em "Edit Function"
3. Substitua todo o código pelo conteúdo do arquivo: `supabase/functions/webhook-sales-flow/index.ts`
4. Clique em "Deploy Function"

### 4. webhook-inventory-flow

1. Clique em "webhook-inventory-flow" na lista de functions
2. Clique em "Edit Function"
3. Substitua todo o código pelo conteúdo do arquivo: `supabase/functions/webhook-inventory-flow/index.ts`
4. Clique em "Deploy Function"

## Verificação do Deploy

Após cada deploy, verifique:

1. **Status**: Function deve aparecer como "Active"
2. **Logs**: Clique em "Logs" para verificar se não há erros
3. **Test**: Use o botão "Invoke" para testar a function

## URLs das Functions (Pós-Deploy)

- **Purchase Flow**: `https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-purchase-flow`
- **Transfer Flow**: `https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-transfer-flow`
- **Sales Flow**: `https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-sales-flow`
- **Inventory Flow**: `https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-inventory-flow`

## Teste Rápido

Após o deploy, você pode testar cada function com:

```bash
# Purchase Flow
curl -X POST https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-purchase-flow \
  -H "Authorization: Bearer banban_webhook_test_2025" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"purchase_order_created","timestamp":"2025-01-27T10:00:00Z","data":{"purchase_order":{"order_number":"PO-TEST-001"}}}'

# Transfer Flow
curl -X POST https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-transfer-flow \
  -H "Authorization: Bearer banban_webhook_test_2025" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"transfer_order_created","timestamp":"2025-01-27T10:00:00Z","data":{"transfer_order":{"order_number":"TR-TEST-001"}}}'

# Sales Flow
curl -X POST https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-sales-flow \
  -H "Authorization: Bearer banban_webhook_test_2025" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"sale_completed","timestamp":"2025-01-27T10:00:00Z","data":{"sale":{"sale_id":"SALE-TEST-001"}}}'

# Inventory Flow
curl -X POST https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-inventory-flow \
  -H "Authorization: Bearer banban_webhook_test_2025" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"product_sync","timestamp":"2025-01-27T10:00:00Z","data":{"product_sync":{"products":[]}}}'
```

## Troubleshooting

### Erro de Compilação
- Verifique se todo o código foi copiado corretamente
- Certifique-se de que não há caracteres especiais ou quebras de linha incorretas

### Erro de Runtime
- Verifique os logs da function no dashboard
- Teste com payloads simples primeiro
- Verifique se as variáveis de ambiente estão configuradas

### Erro de Autenticação
- Confirme que está usando o token correto
- Verifique se o header `Authorization: Bearer <token>` está correto

## Próximos Passos

Após o deploy bem-sucedido:

1. Execute os scripts de teste: `node scripts/test-webhook-purchase-flow.js`
2. Monitore os logs das functions
3. Informe a equipe do ERP sobre as mudanças nos endpoints
4. Atualize a documentação de integração 