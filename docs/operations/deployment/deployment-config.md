# Configuração de Deploy - Edge Functions BanBan

## Informações do Projeto

**Project ID:** `bopytcghbmuywfltmwhk`  
**URL:** `https://bopytcghbmuywfltmwhk.supabase.co`  
**Região:** East US (us-east-1)

## Variáveis de Ambiente

### Produção

Configure as seguintes variáveis no Supabase Dashboard → Settings → Edge Functions:

```bash
WEBHOOK_SECRET_TOKEN=banban_webhook_secret_2025
SUPABASE_URL=https://bopytcghbmuywfltmwhk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjMxMDg3NSwiZXhwIjoyMDYxODg2ODc1fQ.M0DtA5nTtsEDAg8FPowvKhWuF09lhh0gEcdCWW5Pb4U
```

### Teste

Para ambiente de teste, use:

```bash
WEBHOOK_SECRET_TOKEN=banban_webhook_test_2025
SUPABASE_URL=https://bopytcghbmuywfltmwhk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjMxMDg3NSwiZXhwIjoyMDYxODg2ODc1fQ.M0DtA5nTtsEDAg8FPowvKhWuF09lhh0gEcdCWW5Pb4U
```

## URLs dos Endpoints

### Webhook Orders
- **Produção:** `https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-orders`
- **Teste:** `https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-orders`

### Futuros Endpoints
- **Documents:** `https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-documents`
- **Inventory:** `https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-inventory`
- **Movements:** `https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-movements`

## Comandos de Deploy

### Instalar Supabase CLI

```bash
# Windows (via npm)
npm install -g supabase

# Ou via Chocolatey
choco install supabase

# Verificar instalação
supabase --version
```

### Login e Configuração

```bash
# Login no Supabase
supabase login

# Linkar projeto local
supabase link --project-ref bopytcghbmuywfltmwhk
```

### Deploy das Funções

```bash
# Deploy da função webhook-orders
supabase functions deploy webhook-orders

# Deploy de todas as funções
supabase functions deploy

# Verificar status
supabase functions list
```

### Configurar Variáveis

```bash
# Configurar token de webhook
supabase secrets set WEBHOOK_SECRET_TOKEN=banban_webhook_secret_2025

# Configurar URL do Supabase
supabase secrets set SUPABASE_URL=https://bopytcghbmuywfltmwhk.supabase.co

# Configurar service role key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjMxMDg3NSwiZXhwIjoyMDYxODg2ODc1fQ.M0DtA5nTtsEDAg8FPowvKhWuF09lhh0gEcdCWW5Pb4U
```

## Teste Pós-Deploy

### Teste Manual

```bash
curl -X POST https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer banban_webhook_secret_2025" \
  -d '{
    "event_type": "ORDER_EVENT",
    "event_code": "purchase_order_created",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "order_id": "TEST-DEPLOY-001",
    "order_type": "PURCHASE",
    "status": "NOVO",
    "supplier_id": "TEST-SUPPLIER",
    "destination_location_id": "CD-PRINCIPAL"
  }'
```

### Teste Automatizado

```bash
# Executar script de teste
node scripts/test-webhook-orders.js
```

## Monitoramento

### Logs

```bash
# Logs em tempo real
supabase functions logs webhook-orders --follow

# Logs por período
supabase functions logs webhook-orders --since=1h
```

### Dashboard

Acesse: https://supabase.com/dashboard/project/bopytcghbmuywfltmwhk/functions

## Configuração do ERP

### URL para Configurar no ERP

```
https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-orders
```

### Headers Obrigatórios

```http
Content-Type: application/json
Authorization: Bearer banban_webhook_secret_2025
```

### Timeout Recomendado

```
30 segundos
```

### Retry Policy Recomendada

- 1ª tentativa: Imediata
- 2ª tentativa: Após 1 minuto
- 3ª tentativa: Após 5 minutos
- 4ª tentativa: Após 15 minutos
- 5ª tentativa: Após 1 hora

## Contatos

**Desenvolvedor:** Diego Henrique Pinheiro Damaceno  
**Email:** diego.damaceno@banban.com.br  
**Telefone:** +55 (11) 99999-9999

**Suporte Técnico BanBan:**  
**Email:** suporte.ti@banban.com.br  
**Telefone:** +55 (11) 3000-0000

---

**Última Atualização:** 15/01/2025  
**Status:** ✅ Configuração Completa 