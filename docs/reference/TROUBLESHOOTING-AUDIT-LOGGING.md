# 🔧 Troubleshooting - Logs de Auditoria

## 📋 **Referência Rápida**

🔗 **Para implementações novas**: Consulte [`AUDIT_LOGS_STANDARD_METHOD.md`](../guides/AUDIT_LOGS_STANDARD_METHOD.md)  
🔗 **Para requisitos obrigatórios**: Consulte [`audit-logging-requirements.md`](../guides/audit-logging-requirements.md)

---

## 🚨 **Problemas Comuns e Soluções**

### **1. IP e User-Agent não Exibidos nos Logs**

#### **Sintomas:**
- Campos `ip` e `dispositivo` aparecem como "N/A" na interface
- Dados estão sendo salvos no banco mas não exibidos

#### **Causa Identificada (Dezembro 2024):**
- API de logs (`/api/audit-logs/route.ts`) não estava selecionando campos `ip_address` e `user_agent` diretamente
- Query selecionava apenas `details` mas dados estavam nas colunas diretas
- Mapeamento tentava acessar `log.details?.ip_address` em vez de `log.ip_address`

#### **Solução Aplicada:**
```typescript
// CORRIGIDO: Query agora inclui campos diretos
let query = supabase
  .from('audit_logs')
  .select(`
    id,
    action_type,
    resource_type,
    resource_id,
    action_timestamp,
    ip_address,        // ✅ ADICIONADO
    user_agent,        // ✅ ADICIONADO
    organization_id,   // ✅ ADICIONADO
    details
  `, { count: 'exact' })

// CORRIGIDO: Mapeamento usa campos diretos
const transformedLogs = logs?.map(log => ({
  ip: maskIP(log.ip_address || 'N/A'),           // ✅ log.ip_address
  dispositivo: formatUserAgent(log.user_agent || 'N/A'), // ✅ log.user_agent
  // ...
}))

// CORRIGIDO: Filtro de IP usa campo direto  
if (ipAddress && ipAddress.trim()) {
  query = query.ilike('ip_address', `%${ipAddress.trim()}%`); // ✅ ip_address direto
}
```

### **2. IP e User-Agent não Capturados (Problema Resolvido)**

#### **Sintomas:**
- Campos `ip_address` e `user_agent` vazios nos logs
- Falta de informações de contexto sobre dispositivos/localização

#### **Causa:**
- Função `createAuditLog` não estava capturando headers automaticamente
- Headers não sendo extraídos nas Server Actions

#### **Solução (Implementada):**
```typescript
// ✅ Função captureRequestInfo() criada e centralizada
const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);

await createAuditLog({
  actor_user_id: user.id,
  action_type: AUDIT_ACTION_TYPES.PROFILE_UPDATED,
  resource_type: AUDIT_RESOURCE_TYPES.PROFILE,
  resource_id: user.id,
  ip_address: ipAddress,     // ✅ Capturado automaticamente
  user_agent: userAgent,     // ✅ Capturado automaticamente
  organization_id: organizationId, // ✅ Capturado automaticamente
  details: { ... }
});
```

### **3. Função captureRequestInfo Duplicada**

#### **Sintomas:**
- Função `captureRequestInfo` repetida em múltiplos arquivos
- Inconsistência na captura de dados
- Dificuldade de manutenção

#### **Solução Aplicada:**
- ✅ Função centralizada em `src/lib/utils/audit-logger.ts`
- ✅ Importação única: `import { captureRequestInfo } from '@/lib/utils/audit-logger'`
- ✅ Suporte a `useAdminClient` para contextos específicos
- ✅ Headers múltiplos suportados (Cloudflare, Nginx, Apache, etc.)

### **4. Logs de Visualização Desnecessários**

#### **Sintomas:**
- Ao visualizar logs de auditoria, novos logs são criados
- Logs do tipo `audit_logs_viewed` sendo registrados
- Volume excessivo de logs

#### **Causa:**
- API de consulta estava registrando visualizações como ações de auditoria
- Violação do princípio de que apenas modificações devem ser registradas

#### **Solução:**
```typescript
// REMOVIDO de /api/audit-logs/route.ts
// await supabase
//   .from('audit_logs')
//   .insert({
//     actor_user_id: user.id,
//     action_type: 'audit_logs_viewed',
//     // ...
//   });
```

### **5. 2FA sem Logs de Auditoria**

#### **Sintomas:**
- Ativação/desativação de 2FA não aparece nos logs
- Ausência de rastreamento de mudanças de segurança

#### **Causa:**
- Server Actions de MFA não tinham logs implementados

#### **Solução:**
```typescript
// Em verifyMFA() - após verificação bem-sucedida
await createAuditLog({
  actor_user_id: userData.user.id,
  action_type: AUDIT_ACTION_TYPES.TWO_FACTOR_ENABLED,
  resource_type: AUDIT_RESOURCE_TYPES.PROFILE,
  resource_id: userData.user.id,
  details: {
    factor_id: factorId,
    method: 'totp'
  }
});

// Em unenrollMFA() - após desinscrição bem-sucedida  
await createAuditLog({
  actor_user_id: userData.user.id,
  action_type: AUDIT_ACTION_TYPES.TWO_FACTOR_DISABLED,
  resource_type: AUDIT_RESOURCE_TYPES.PROFILE,
  resource_id: userData.user.id,
  details: {
    factor_id: factorId,
    method: 'totp'
  }
});
```

### **6. Sessões sem Logs de Auditoria**

#### **Sintomas:**
- Encerramento de sessões não registrado nos logs
- Falta de rastreamento de ações de segurança

#### **Causa:**
- Funções de sessão não tinham logs implementados

#### **Solução:**
```typescript
// Em terminateSession()
await createAuditLog({
  actor_user_id: user.id,
  action_type: AUDIT_ACTION_TYPES.SESSION_TERMINATED,
  resource_type: AUDIT_RESOURCE_TYPES.SESSION,
  resource_id: sessionId,
  details: {
    session_type: 'other_session',
    method: 'admin_api_revocation'
  }
});

// Em terminateAllOtherSessions()
await createAuditLog({
  actor_user_id: user.id,
  action_type: AUDIT_ACTION_TYPES.ALL_SESSIONS_TERMINATED,
  resource_type: AUDIT_RESOURCE_TYPES.SESSION,
  details: {
    method: 'signout_scope_others',
    excluded_current: true
  }
});
```

---

## 🔍 **Validação Rápida**

### **Verificar se Audit Logs Estão Funcionando:**
1. Executar uma ação (ex: mudar senha)
2. Ir em `/settings` → Segurança → Logs de Auditoria
3. Verificar se o log aparece com IP e dispositivo preenchidos

### **Problemas Persistentes:**
1. Verificar se `captureRequestInfo()` está sendo usado
2. Confirmar que os campos estão sendo selecionados na API
3. Validar que os dados estão sendo salvos no banco
4. Consultar o [método padrão](../guides/AUDIT_LOGS_STANDARD_METHOD.md) para novas implementações

---

**Última atualização**: Dezembro 2024  
**Status**: Problemas principais resolvidos ✅ 