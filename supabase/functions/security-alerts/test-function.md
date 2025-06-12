# Teste da Edge Function Security Alerts

## ✅ Status do Deploy
- **URL**: https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/security-alerts
- **Status**: ACTIVE ✅
- **Versão**: 6
- **Import Map**: Configurado ✅

## 🧪 Comandos de Teste

### 1. Teste de Novo Dispositivo
```bash
curl -X POST https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/security-alerts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMTA4NzUsImV4cCI6MjA2MTg4Njg3NX0.NTQzZanJrEipj_ylVohXFYSACY4M65zVDcux7eRUOXY" \
  -d '{
    "type": "new_device",
    "user_id": "test-user-uuid",
    "user_email": "test@example.com",
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "device_fingerprint": "test-fingerprint-123"
  }'
```

### 2. Teste de Tentativas Falhadas
```bash
curl -X POST https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/security-alerts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMTA4NzUsImV4cCI6MjA2MTg4Njg3NX0.NTQzZanJrEipj_ylVohXFYSACY4M65zVDcux7eRUOXY" \
  -d '{
    "type": "failed_attempts",
    "user_id": "test-user-uuid",
    "user_email": "test@example.com",
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "details": {
      "attempts_count": 5
    }
  }'
```

### 3. Teste de Remoção de Usuário
```bash
curl -X POST https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/security-alerts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMTA4NzUsImV4cCI6MjA2MTg4Njg3NX0.NTQzZanJrEipj_ylVohXFYSACY4M65zVDcux7eRUOXY" \
  -d '{
    "type": "user_deletion",
    "user_id": "test-user-uuid",
    "user_email": "admin@example.com",
    "details": {
      "deleted_user_email": "removed-user@example.com",
      "actor_email": "admin@example.com"
    }
  }'
```

## 📋 Respostas Esperadas

### Sucesso (alerta enviado):
```json
{
  "success": true,
  "message": "Evento processado e alerta enviado",
  "processed": true,
  "alert_data": {
    "type": "new_device",
    "timestamp": "27/01/2025 15:30:00",
    "ip_address": "192.168.1.100",
    "device_info": "Chrome 120 em Windows",
    "additional_data": {
      "attempts_count": 0,
      "deleted_user_email": null,
      "actor_email": null,
      "device_fingerprint": "test-fingerprint-123"
    }
  }
}
```

### Alerta desabilitado:
```json
{
  "success": true,
  "message": "Evento recebido mas alerta não enviado (desabilitado ou erro)",
  "processed": false
}
```

### Erro de validação:
```json
{
  "success": false,
  "error": "Dados de evento inválidos: type, user_id e user_email são obrigatórios",
  "processed": false
}
```

## ⚙️ Configuração Necessária

### Definir Chave do Resend
```bash
supabase secrets set RESEND_API_KEY=sua_chave_resend_aqui
```

### Verificar Logs
```bash
supabase functions logs security-alerts --follow
```

## 🔧 Debug

Se a função não estiver funcionando:

1. **Verificar secrets**: `supabase secrets list`
2. **Ver logs**: `supabase functions logs security-alerts`
3. **Redeployar**: `supabase functions deploy security-alerts`

## 📧 Configuração de Email

A função usa o domínio `security@banban.com.br` para envio de emails. Certifique-se de que:
- O domínio está verificado no Resend
- A chave da API tem permissões adequadas
- O formato dos emails está sendo aceito pelo Resend 