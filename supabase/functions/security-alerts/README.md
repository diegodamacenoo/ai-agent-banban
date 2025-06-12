# Security Alerts Edge Function

Esta Edge Function processa eventos de segurança e envia alertas por email de forma simplificada.

## Mudanças Principais

- ✅ **Sem HTML complexo**: Retorna apenas dados JSON estruturados
- ✅ **Email simples**: Templates básicos gerados dinamicamente
- ✅ **Melhor estrutura de resposta**: Dados do alerta processado incluídos na resposta

## Estrutura de Request

```json
{
  "type": "new_device" | "failed_attempts" | "user_deletion",
  "user_id": "uuid",
  "user_email": "email@example.com",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "device_fingerprint": "hash123",
  "details": {
    "attempts_count": 5,
    "deleted_user_email": "deleted@example.com",
    "actor_email": "admin@example.com"
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

## Estrutura de Response

### Sucesso (alerta enviado):
```json
{
  "success": true,
  "message": "Evento processado e alerta enviado",
  "processed": true,
  "alert_data": {
    "type": "new_device",
    "timestamp": "01/01/2024 10:00:00",
    "ip_address": "192.168.1.1",
    "device_info": "Chrome 120 em Windows",
    "additional_data": {
      "attempts_count": 0,
      "deleted_user_email": null,
      "actor_email": null,
      "device_fingerprint": "hash123"
    }
  }
}
```

### Sucesso (alerta não enviado):
```json
{
  "success": true,
  "message": "Evento recebido mas alerta não enviado (desabilitado ou erro)",
  "processed": false
}
```

### Erro:
```json
{
  "success": false,
  "error": "Dados de evento inválidos: type, user_id e user_email são obrigatórios",
  "processed": false
}
```

## Deploy

```bash
# Fazer deploy da função
supabase functions deploy security-alerts

# Definir variável de ambiente
supabase secrets set RESEND_API_KEY=your_api_key_here
```

## Teste

```bash
# Teste de novo dispositivo
curl -X POST https://[project].supabase.co/functions/v1/security-alerts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [anon-key]" \
  -d '{
    "type": "new_device",
    "user_id": "user-uuid",
    "user_email": "test@example.com",
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "device_fingerprint": "test123"
  }'

# Teste de tentativas falhadas
curl -X POST https://[project].supabase.co/functions/v1/security-alerts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [anon-key]" \
  -d '{
    "type": "failed_attempts",
    "user_id": "user-uuid", 
    "user_email": "test@example.com",
    "ip_address": "192.168.1.100",
    "details": {
      "attempts_count": 5
    }
  }'
```

## Arquivos Necessários

1. **index.ts**: Código principal da função
2. **deno.json**: Configuração de imports e compilador (arquivo separado obrigatório)

O `deno.json` **deve** estar em arquivo separado - não pode ser incluído no index.ts pois é uma configuração específica do Deno. 