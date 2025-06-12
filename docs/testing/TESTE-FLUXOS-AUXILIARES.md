# Guia de Teste - Fluxos Auxiliares Implementados

## 🎯 Próximos Passos Implementados

### ✅ 1. Supabase Storage Real
- **Status**: Configurado e funcionando
- **Bucket**: `data-exports` (50MB, tipos: JSON/CSV/PDF/ZIP)
- **RLS**: Políticas implementadas para acesso por usuário
- **Estrutura**: `user_id/export_id.formato`

### ✅ 2. Sistema de Emails com Resend
- **Templates HTML**: Profissionais e responsivos
- **Tipos**: Confirmação exclusão, exportação pronta, cancelamento
- **Auditoria**: Todos os emails são registrados

### ✅ 3. Processamento Real de Arquivos
- **Formatos**: JSON, CSV, PDF
- **Dados**: Perfil, atividades, sessões, auditoria
- **Storage**: Upload automático para Supabase Storage
- **URLs**: Assinadas com validade de 30 dias

### ✅ 4. Sistema de Jobs Background
- **Processamento**: Exportações e exclusões automatizadas
- **Monitoramento**: API de status e saúde
- **Execução**: Manual e agendada (5 minutos)

### ✅ 5. Exclusão Completa de Usuários
- **Backup**: Dados preservados para compliance
- **Cascata**: Exclusão de perfil, sessões, exportações
- **Anonimização**: Logs de auditoria mantidos anonimizados
- **Storage**: Limpeza automática de arquivos

## 🧪 Roteiro de Testes

### Teste 1: Exportação de Dados

1. **Acessar Configurações**
   ```
   https://seudominio.com/settings
   → Aba "Conta"
   → Seção "Fluxos Auxiliares"
   ```

2. **Solicitar Exportação**
   - Escolher formato (JSON/CSV/PDF)
   - Clicar em "Exportar Dados"
   - Verificar mensagem de sucesso

3. **Verificar Processamento**
   - Aguardar alguns segundos
   - Recarregar página
   - Verificar lista de exportações
   - Status deve mudar: `requested` → `processing` → `completed`

4. **Download**
   - Clicar no link de download
   - Verificar se arquivo baixa corretamente
   - Validar conteúdo do arquivo

### Teste 2: Sistema de Emails

#### Configurar Resend
```bash
# No arquivo .env.local
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=noreply@seudominio.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Testar Emails
1. **Email de Exportação**
   - Solicitar exportação
   - Verificar email recebido
   - Validar link de download no email

2. **Email de Exclusão**
   - Solicitar exclusão de conta
   - Verificar email de confirmação
   - Validar link de confirmação

### Teste 3: Exclusão de Conta

1. **Solicitar Exclusão**
   - Ir para Configurações → Conta
   - Inserir senha
   - Clicar "Excluir Conta"
   - Verificar email de confirmação

2. **Confirmar Exclusão**
   - Clicar no link do email
   - Verificar agendamento para 7 dias
   - Status deve ser `confirmed`

3. **Cancelar Exclusão**
   - Fazer login novamente
   - Verificar mensagem de cancelamento
   - Verificar email de cancelamento

### Teste 4: Jobs em Background

#### API de Monitoramento (Super Admin)
```bash
# Verificar status
GET /api/admin/jobs/status

# Executar job manual
POST /api/admin/jobs/status
{
  "jobType": "exports"
}
```

#### Scheduler Automático
```typescript
// Adicionar no app principal
import { startJobScheduler } from '@/lib/jobs/background-jobs';

if (process.env.ENABLE_JOB_SCHEDULER === 'true') {
  startJobScheduler();
}
```

## 🔍 Verificações Importantes

### 1. Supabase Storage
```sql
-- Verificar bucket
SELECT name, public, file_size_limit 
FROM storage.buckets 
WHERE name = 'data-exports';

-- Verificar políticas
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%export%';
```

### 2. Dados no Banco
```sql
-- Exportações pendentes
SELECT id, user_id, status, format, created_at 
FROM user_data_exports 
WHERE status = 'requested';

-- Solicitações de exclusão
SELECT id, user_id, status, scheduled_deletion_date 
FROM user_deletion_requests 
WHERE status IN ('pending', 'confirmed');

-- Logs de auditoria
SELECT action_type, created_at, details 
FROM audit_logs 
WHERE action_type LIKE '%export%' 
   OR action_type LIKE '%deletion%'
ORDER BY created_at DESC;
```

### 3. Arquivos no Storage
```sql
-- Arquivos por usuário
SELECT name, size, created_at 
FROM storage.objects 
WHERE bucket_id = 'data-exports';
```

## 🚨 Possíveis Problemas

### 1. Emails não enviados
- **Causa**: RESEND_API_KEY não configurada
- **Solução**: Configurar variável de ambiente
- **Verificação**: Logs mostram "email_sent: false"

### 2. Arquivos não gerados
- **Causa**: Políticas RLS ou permissões do storage
- **Solução**: Executar script `setup-storage.sql`
- **Verificação**: Erro 403 nos logs

### 3. Jobs não executam
- **Causa**: ENABLE_JOB_SCHEDULER=false ou não configurado
- **Solução**: Configurar variável ou usar cron jobs
- **Verificação**: Status sempre "requested"

### 4. Downloads expirados
- **Causa**: URLs assinadas com validade de 30 dias
- **Solução**: Gerar nova exportação
- **Verificação**: Status 410 no download

## 🔧 Configuração de Produção

### 1. Variáveis de Ambiente
```bash
NEXT_PUBLIC_APP_URL=https://seudominio.com
RESEND_API_KEY=sua_api_key_real
RESEND_FROM_EMAIL=noreply@seudominio.com
ENABLE_JOB_SCHEDULER=true
```

### 2. Cron Jobs (Alternativa)
```bash
# Exportações (a cada 5 minutos)
*/5 * * * * curl -X POST https://seudominio.com/api/admin/jobs/status \
  -H "Content-Type: application/json" \
  -d '{"jobType":"exports"}'

# Exclusões (diário às 2h)
0 2 * * * curl -X POST https://seudominio.com/api/admin/jobs/status \
  -H "Content-Type: application/json" \
  -d '{"jobType":"deletions"}'

# Limpeza (semanal)
0 3 * * 0 curl -X POST https://seudominio.com/api/admin/jobs/status \
  -H "Content-Type: application/json" \
  -d '{"jobType":"cleanup"}'
```

### 3. Monitoramento
- Configure alertas para falhas de jobs
- Monitor exportações acumuladas (>50)
- Monitor exclusões atrasadas (>10)
- Monitor erros de email

## 📊 Métricas de Sucesso

### Exportações
- ✅ Arquivos gerados em <30 segundos
- ✅ Emails enviados em <5 segundos
- ✅ Downloads funcionam por 30 dias
- ✅ 0 falhas de processamento

### Exclusões
- ✅ Confirmação por email em <1 minuto
- ✅ Execução após 7 dias
- ✅ Dados completamente removidos
- ✅ Backup para compliance criado

### Performance
- ✅ Jobs processam <10 itens por execução
- ✅ Sistema healthy 99.9% do tempo
- ✅ Latência de API <500ms
- ✅ Storage <80% da capacidade

## 🎉 Status Final

**✅ IMPLEMENTAÇÃO COMPLETA DOS PRÓXIMOS PASSOS**

Todos os fluxos auxiliares foram implementados com:
- 🗄️ Supabase Storage real configurado
- 📧 Sistema de emails profissional
- 🤖 Jobs background automatizados  
- 🔐 Segurança e compliance GDPR
- 📊 Monitoramento e auditoria
- 🧪 Testes validados

**Próxima etapa**: Deploy em produção e configuração de monitoramento. 