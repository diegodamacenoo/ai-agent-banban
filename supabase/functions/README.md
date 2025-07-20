# Edge Functions - BanBan AI Agent

Este diretório contém as Edge Functions do Supabase para receber webhooks do ERP da BanBan.

## Estrutura

```
functions/
├── webhook-orders/          # Webhook para eventos de pedidos
│   └── index.ts
├── webhook-documents/       # Webhook para eventos de documentos (futuro)
├── webhook-inventory/       # Webhook para eventos de estoque (futuro)
├── webhook-movements/       # Webhook para eventos de movimentações (futuro)
├── daily-etl/              # ETL diário existente
└── security-alerts/        # Alertas de segurança existentes
```

## Edge Functions Implementadas

### 1. webhook-orders

**Endpoint:** `/webhook-orders`  
**Método:** POST  
**Descrição:** Recebe eventos de pedidos (compra e transferência) do ERP

**Eventos Suportados:**
- `purchase_order_created` - Pedido de compra criado
- `purchase_order_approved` - Pedido de compra aprovado
- `purchase_order_cancelled` - Pedido de compra cancelado
- `transfer_order_created` - Transferência criada
- `transfer_order_approved` - Transferência aprovada
- `transfer_order_cancelled` - Transferência cancelada
- `MAPA_SEPARACAO_CRIADO` - Mapa de separação gerado
- `AGUARDANDO_SEPARACAO_CD` - Aguardando separação no CD
- `EM_SEPARACAO_CD` - Em processo de separação
- `SEPARACAO_CD_SEM_DIVERGENCIA` - Separação sem divergências
- `SEPARACAO_CD_COM_DIVERGENCIA` - Separação com divergências
- `SEPARADO_PRE_DOCA` - Separado e aguardando embarque
- `EMBARCADO_CD` - Embarcado do CD

## Deploy

### Pré-requisitos

1. Supabase CLI instalado
2. Projeto configurado no Supabase
3. Variáveis de ambiente configuradas

### Comandos de Deploy

```bash
# Deploy de uma função específica
supabase functions deploy webhook-orders

# Deploy de todas as funções
supabase functions deploy

# Verificar status das funções
supabase functions list
```

### Variáveis de Ambiente

Configure as seguintes variáveis no Supabase Dashboard:

```bash
WEBHOOK_SECRET_TOKEN=banban_webhook_secret_2025
SUPABASE_URL=https://bopytcghbmuywfltmwhk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjMxMDg3NSwiZXhwIjoyMDYxODg2ODc1fQ.M0DtA5nTtsEDAg8FPowvKhWuF09lhh0gEcdCWW5Pb4U
```

## Testes

### Teste Local

```bash
# Iniciar servidor local
supabase functions serve

# Testar função específica
curl -X POST http://localhost:54321/functions/v1/webhook-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer banban_webhook_test_2025" \
  -d '{"event_type": "ORDER_EVENT", "event_code": "purchase_order_created", ...}'
```

### Teste Automatizado

Execute o script de teste:

```bash
# Configurar variáveis no script primeiro
node scripts/test-webhook-orders.js
```

## Monitoramento

### Logs

Visualizar logs das funções:

```bash
# Logs em tempo real
supabase functions logs webhook-orders --follow

# Logs específicos por período
supabase functions logs webhook-orders --since=1h
```

### Métricas

Acesse o Dashboard do Supabase para visualizar:
- Taxa de sucesso/erro
- Tempo de resposta
- Volume de requisições
- Uso de recursos

## Troubleshooting

### Problemas Comuns

1. **Erro 401 - Unauthorized**
   - Verificar se o token está correto
   - Verificar se a variável `WEBHOOK_SECRET_TOKEN` está configurada

2. **Erro 400 - Bad Request**
   - Verificar formato do payload
   - Verificar campos obrigatórios
   - Verificar códigos de evento válidos

3. **Erro 500 - Internal Server Error**
   - Verificar logs da função
   - Verificar conectividade com o banco
   - Verificar permissões do service role

### Debug

Para debug detalhado, adicione logs na função:

```typescript
console.log('Payload recebido:', JSON.stringify(payload, null, 2));
console.log('Processando evento:', payload.event_code);
```

## Segurança

### Autenticação

- Todas as requisições devem incluir o header `Authorization: Bearer [TOKEN]`
- O token é validado contra a variável de ambiente `WEBHOOK_SECRET_TOKEN`

### Validação

- Payload é validado contra schema TypeScript
- Campos obrigatórios são verificados
- Códigos de evento são validados contra lista permitida

### Rate Limiting

- Implementar rate limiting se necessário
- Monitorar volume de requisições
- Configurar alertas para uso anômalo

## Desenvolvimento

### Estrutura do Código

```typescript
// Tipos TypeScript para validação
interface WebhookPayload {
  event_type: string;
  event_code: string;
  // ...
}

// Função de validação
function validatePayload(payload: any): WebhookPayload {
  // Validações...
}

// Função de processamento
async function processEvent(supabase: any, payload: WebhookPayload) {
  // Lógica de negócio...
}

// Handler principal
serve(async (req) => {
  // Tratamento da requisição...
});
```

### Boas Práticas

1. **Validação Rigorosa**
   - Validar todos os campos obrigatórios
   - Usar TypeScript para type safety
   - Retornar erros descritivos

2. **Tratamento de Erros**
   - Capturar e logar todos os erros
   - Retornar códigos HTTP apropriados
   - Implementar retry logic quando necessário

3. **Performance**
   - Usar transações quando necessário
   - Otimizar queries do banco
   - Implementar timeout adequado

4. **Logging**
   - Logar eventos importantes
   - Incluir contexto suficiente para debug
   - Não logar informações sensíveis

## Próximos Passos

### Funções Planejadas

1. **webhook-documents** - Eventos de documentos fiscais
2. **webhook-inventory** - Eventos de estoque
3. **webhook-movements** - Eventos de movimentações

### Melhorias

1. Implementar retry policy mais sofisticada
2. Adicionar métricas customizadas
3. Implementar cache para otimização
4. Adicionar testes unitários
5. Implementar webhook signature validation

## Contato

Para dúvidas ou suporte:
- **Desenvolvedor:** Diego Henrique Pinheiro Damaceno
- **Email:** diego.damaceno@banban.com.br
- **Documentação:** `/docs/webhook-integration-guide.md` 