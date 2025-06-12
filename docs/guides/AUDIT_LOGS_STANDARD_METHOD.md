# 📋 Método Padrão para Registrar Audit Logs

## 🎯 Visão Geral

Este documento estabelece o **método padrão** para implementação de logs de auditoria em novas funcionalidades do sistema. Seguindo estas diretrizes, você garantirá consistência, rastreabilidade e conformidade em todo o sistema.

## 🚨 Regra Fundamental

> **TODA ação que modifica dados do usuário, sistema ou configurações DEVE registrar um log de auditoria usando o método padrão.**

---

## 📦 Importações Obrigatórias

### Para Server Actions
```typescript
import { 
  createAuditLog, 
  captureRequestInfo,
  AUDIT_ACTION_TYPES, 
  AUDIT_RESOURCE_TYPES 
} from '@/lib/utils/audit-logger';
```

### Para Client Components (quando necessário)
```typescript
import { createAuditLogClient } from '@/lib/utils/audit-logger';
```

---

## 🔧 Método Padrão - Server Actions

### Template Básico
```typescript
export async function minhaServerAction(data: MeuTipoData) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    // 1. Verificar autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // 2. Buscar dados atuais (se aplicável)
    const { data: currentData } = await supabase
      .from('minha_tabela')
      .select('*')
      .eq('id', resourceId)
      .single();

    // 3. Executar a operação principal
    const { data: result, error } = await supabase
      .from('minha_tabela')
      .update(data)
      .eq('id', resourceId)
      .select()
      .single();

    if (error) {
      console.error('Erro na operação:', error);
      return { success: false, error: 'Erro ao executar operação' };
    }

    // 4. OBRIGATÓRIO: Registrar log de auditoria
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);
    await createAuditLog({
      actor_user_id: user.id,
      action_type: AUDIT_ACTION_TYPES.RECURSO_ATUALIZADO, // Usar tipo apropriado
      resource_type: AUDIT_RESOURCE_TYPES.MEU_RECURSO,    // Usar tipo apropriado
      resource_id: resourceId,
      ip_address: ipAddress,
      user_agent: userAgent,
      organization_id: organizationId,
      details: {
        changes: data,
        previous_values: currentData || {},
        method: 'self_service'
      }
    });

    // 5. Revalidar cache se necessário
    revalidatePath('/minha-rota');
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Erro inesperado:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}
```

### Exemplo Prático - Atualização de Perfil
```typescript
export async function updateUserProfile(profileData: ProfileData) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Buscar dados atuais para comparação
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Executar atualização
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        bio: profileData.bio,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar perfil:', error);
      return { success: false, error: 'Erro ao atualizar perfil' };
    }

    // Registrar audit log com captura automática de IP/User-Agent
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);
    await createAuditLog({
      actor_user_id: user.id,
      action_type: AUDIT_ACTION_TYPES.PROFILE_UPDATED,
      resource_type: AUDIT_RESOURCE_TYPES.PROFILE,
      resource_id: user.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      organization_id: organizationId,
      details: {
        changes: {
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          bio: profileData.bio
        },
        previous_values: {
          first_name: currentProfile?.first_name,
          last_name: currentProfile?.last_name,
          bio: currentProfile?.bio
        },
        method: 'self_service'
      }
    });

    revalidatePath('/settings');
    return { success: true, data: updatedProfile };
  } catch (error) {
    console.error('Erro inesperado:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}
```

---

## 🌐 Método para Client Components

### Quando Usar
- Ações executadas via API Routes
- Operações que não podem usar Server Actions
- Logs de eventos client-side específicos

### Template
```typescript
const handleClientAction = async () => {
  try {
    // Executar operação via API
    const response = await fetch('/api/minha-rota', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Falha na operação');
    }

    const result = await response.json();

    // Registrar log de auditoria (IP/User-Agent capturados automaticamente)
    await createAuditLogClient({
      actor_user_id: user.id,
      action_type: AUDIT_ACTION_TYPES.RECURSO_ATUALIZADO,
      resource_type: AUDIT_RESOURCE_TYPES.MEU_RECURSO,
      resource_id: result.id,
      details: {
        changes: data,
        method: 'api_call'
      }
    });

    toast.success('Operação realizada com sucesso');
  } catch (error) {
    console.error('Erro:', error);
    toast.error('Erro na operação');
  }
};
```

---

## 📊 Estrutura Padrão do Log

### Campos Obrigatórios
```typescript
interface AuditLogData {
  actor_user_id: string;      // ID do usuário que executou a ação
  action_type: string;        // Tipo da ação (usar AUDIT_ACTION_TYPES)
  resource_type: string;      // Tipo do recurso (usar AUDIT_RESOURCE_TYPES)
  resource_id?: string;       // ID do recurso afetado
  ip_address?: string;        // IP (capturado automaticamente)
  user_agent?: string;        // User-Agent (capturado automaticamente)
  organization_id?: string;   // ID da organização (capturado automaticamente)
  details?: Record<string, any>; // Detalhes específicos
}
```

### Detalhes Recomendados
```typescript
details: {
  changes?: object;              // Dados que foram alterados
  previous_values?: object;      // Valores anteriores (para comparação)
  target_user_email?: string;    // Email do usuário afetado (se aplicável)
  target_user_name?: string;     // Nome do usuário afetado (se aplicável)
  method?: string;               // Método: 'self_service', 'admin_action', 'api_call'
  additional_context?: any;      // Contexto adicional relevante
  error_details?: string;        // Detalhes de erro (se houver)
  file_size_bytes?: number;      // Tamanho de arquivo (uploads)
  format?: string;               // Formato de exportação/arquivo
}
```

---

## 🎨 Tipos Padronizados Disponíveis

### Action Types
```typescript
AUDIT_ACTION_TYPES = {
  // Usuários
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  USER_RESTORED: 'user_restored',
  USER_ROLE_CHANGED: 'user_role_changed',
  USER_INVITE_SENT: 'user_invite_sent',
  USER_INVITE_CANCELLED: 'user_invite_cancelled',
  USER_INVITE_RESENT: 'user_invite_resent',
  
  // Conta/Perfil
  PROFILE_UPDATED: 'profile_updated',
  PASSWORD_CHANGED: 'password_changed',
  EMAIL_CHANGED: 'email_changed',
  TWO_FACTOR_ENABLED: 'two_factor_enabled',
  TWO_FACTOR_DISABLED: 'two_factor_disabled',
  
  // Segurança
  SECURITY_SETTINGS_UPDATED: 'security_settings_updated',
  KNOWN_DEVICE_ADDED: 'known_device_added',
  KNOWN_DEVICE_REMOVED: 'known_device_removed',
  SESSION_TERMINATED: 'session_terminated',
  ALL_SESSIONS_TERMINATED: 'all_sessions_terminated',
  SECURITY_ALERT_CONFIGURED: 'security_alert_configured',
  
  // Sistema
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  DATA_EXPORTED: 'data_exported',
  AUDIT_LOGS_EXPORTED: 'audit_logs_exported'
}
```

### Resource Types
```typescript
AUDIT_RESOURCE_TYPES = {
  USER: 'user',
  PROFILE: 'profile',
  INVITE: 'invite',
  SESSION: 'session',
  SECURITY_SETTINGS: 'security_settings',
  KNOWN_DEVICE: 'known_device',
  AUDIT_LOGS: 'audit_logs',
  SYSTEM: 'system'
}
```

---

## 🔍 Função captureRequestInfo()

### Funcionalidade
A função `captureRequestInfo()` captura automaticamente:
- **IP Address**: De vários headers (x-forwarded-for, x-real-ip, cf-connecting-ip, etc.)
- **User-Agent**: Para identificação do dispositivo/navegador
- **Organization ID**: Do perfil do usuário

### Uso
```typescript
// Captura automática para Server Actions
const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);

// Para contextos que usam Admin Client (como data-export-processor)
const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id, true);
```

### Headers Suportados
- `x-forwarded-for` (proxies, load balancers)
- `x-real-ip` (Nginx)
- `x-client-ip` (Apache)
- `cf-connecting-ip` (Cloudflare)
- `true-client-ip` (Cloudflare Enterprise)
- `x-cluster-client-ip` (clusters)

---

## ✅ Checklist de Implementação

### Para Cada Nova Server Action:
- [ ] Importar `createAuditLog`, `captureRequestInfo` e tipos
- [ ] Verificar autenticação do usuário
- [ ] Buscar dados atuais (se aplicável)
- [ ] Executar a operação principal
- [ ] **Capturar informações de request** com `captureRequestInfo()`
- [ ] **Registrar log de auditoria** com dados completos
- [ ] Incluir `changes` e `previous_values` nos detalhes
- [ ] Usar tipos padronizados para `action_type` e `resource_type`
- [ ] Revalidar cache se necessário
- [ ] Tratar erros apropriadamente

### Para Cada Nova API Route:
- [ ] Implementar endpoint `/api/audit-logs/create` se necessário
- [ ] Usar `createAuditLogClient()` no frontend
- [ ] Validar dados com Zod
- [ ] Capturar IP/User-Agent automaticamente
- [ ] Proteger contra logs de outros usuários

---

## 🧪 Testes

### Validação Manual
1. Executar a ação no sistema
2. Verificar log em `/settings` → Segurança → Logs de Auditoria
3. Confirmar dados de IP e dispositivo estão presentes
4. Verificar detalhes da ação estão completos

### Validação via SQL
```sql
SELECT 
  action_type,
  resource_type,
  action_timestamp,
  ip_address,
  user_agent,
  details
FROM audit_logs 
WHERE actor_user_id = 'seu-user-id' 
ORDER BY action_timestamp DESC 
LIMIT 5;
```

### Validação via API
```bash
curl -X GET "/api/audit-logs?limit=5" \
  -H "Authorization: Bearer token"
```

---

## 🚨 Coisas que NÃO Fazer

❌ **Nunca registrar logs sem `captureRequestInfo()`**
❌ **Nunca usar strings hardcoded para action_type/resource_type**
❌ **Nunca omitir dados de `previous_values` em updates**
❌ **Nunca registrar senhas ou dados sensíveis nos detalhes**
❌ **Nunca falhar silenciosamente na criação do log**

---

## 💡 Dicas e Boas Práticas

✅ **Sempre use `await` na criação do log**
✅ **Inclua contexto suficiente nos detalhes**
✅ **Use `method` para indicar origem da ação**
✅ **Capture dados antes da operação para comparação**
✅ **Use tipos TypeScript para safety**
✅ **Documente novos action_types se necessário**

---

## 📞 Suporte

Para dúvidas sobre implementação de audit logs:
1. Consulte este documento primeiro
2. Verifique exemplos em `src/app/actions/auth/`
3. Consulte `docs/guides/audit-logging-requirements.md`
4. Revise `src/lib/utils/audit-logger.ts`

---

**Última atualização**: Dezembro 2024  
**Versão**: 2.0 (com captureRequestInfo) 