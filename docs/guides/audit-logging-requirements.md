# Requisitos Obrigatórios para Logs de Auditoria

## 📋 Visão Geral

Este documento estabelece os **requisitos obrigatórios** para implementação de logs de auditoria em todas as funcionalidades do sistema. O registro de auditoria é **OBRIGATÓRIO** para garantir rastreabilidade, segurança e conformidade.

## 🚨 Regra Fundamental

> **TODA ação que modifica dados do usuário, sistema ou configurações DEVE registrar um log de auditoria.**

## 📚 Biblioteca Padrão

### Importação Obrigatória
```typescript
import { createAuditLog, AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/lib/utils/audit-logger';
```

### Para Client Components
```typescript
import { createAuditLogClient } from '@/lib/utils/audit-logger';
```

## 🎯 Ações que DEVEM ter Logs de Auditoria

### 👤 Gestão de Usuários
- ✅ Criação de usuário
- ✅ Atualização de perfil/dados
- ✅ Exclusão (soft/hard delete)
- ✅ Restauração de usuário
- ✅ Mudança de role/permissões
- ✅ Ativação/desativação

### 🔐 Autenticação e Segurança
- ✅ Login bem-sucedido
- ✅ Tentativas de login falhadas
- ✅ Mudança de senha
- ✅ Alteração de email
- ✅ Ativação/desativação 2FA
- ✅ Configuração de alertas de segurança
- ✅ Gerenciamento de dispositivos conhecidos
- ✅ Encerramento de sessões

### 📧 Convites e Organizações
- ✅ Envio de convite
- ✅ Reenvio de convite
- ✅ Cancelamento de convite
- ✅ Aceitação de convite

### 📊 Dados e Configurações
- ✅ Exportação de dados
- ✅ Visualização de logs de auditoria
- ✅ Alteração de configurações do sistema
- ✅ Upload/alteração de avatar

## 🔧 Implementação Padrão

### Server Actions
```typescript
export async function updateUserProfile(data: ProfileData) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }
    
    // Buscar dados atuais para comparação (OBRIGATÓRIO)
    const { data: currentData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    // Executar a operação
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    // OBRIGATÓRIO: Registrar log de auditoria
    await createAuditLog({
      actor_user_id: user.id,
      action_type: AUDIT_ACTION_TYPES.PROFILE_UPDATED,
      resource_type: AUDIT_RESOURCE_TYPES.PROFILE,
      resource_id: user.id,
      details: {
        changes: data,
        previous_values: currentData || {}
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Erro:', error);
    return { success: false, error: 'Erro interno' };
  }
}
```

### Client Components
```typescript
const handleUpdate = async () => {
  try {
    // Executar a operação via API
    const response = await fetch('/api/profiles/update', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      // OBRIGATÓRIO: Registrar log de auditoria
      await createAuditLogClient({
        actor_user_id: user.id,
        action_type: AUDIT_ACTION_TYPES.PROFILE_UPDATED,
        resource_type: AUDIT_RESOURCE_TYPES.PROFILE,
        resource_id: user.id,
        details: { changes: data }
      });
    }
  } catch (error) {
    console.error('Erro:', error);
  }
};
```

## 📝 Estrutura Obrigatória do Log

### Campos Obrigatórios
```typescript
{
  actor_user_id: string;     // ID do usuário que executou a ação
  action_type: string;       // Tipo da ação (usar AUDIT_ACTION_TYPES)
  resource_type: string;     // Tipo do recurso (usar AUDIT_RESOURCE_TYPES)
  resource_id?: string;      // ID do recurso afetado
  details?: object;          // Detalhes específicos da ação
}
```

### Detalhes Recomendados
```typescript
details: {
  changes?: object;          // Dados alterados
  previous_values?: object;  // Valores anteriores
  target_user_email?: string; // Email do usuário afetado
  target_user_name?: string;  // Nome do usuário afetado
  method?: string;           // Método usado (ex: 'self_service', 'admin_action')
  additional_context?: any;  // Contexto adicional relevante
}
```

## 🎨 Tipos Padronizados

### Action Types Disponíveis
```typescript
AUDIT_ACTION_TYPES = {
  // Usuários
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  USER_RESTORED: 'user_restored',
  USER_ROLE_CHANGED: 'user_role_changed',
  
  // Perfil/Conta
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
  
  // Sistema
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  DATA_EXPORTED: 'data_exported',
  AUDIT_LOGS_VIEWED: 'audit_logs_viewed'
}
```

### Resource Types Disponíveis
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

## ✅ Checklist de Implementação

Antes de fazer merge de qualquer PR que modifica dados:

- [ ] **Identificou todas as ações que modificam dados?**
- [ ] **Importou a biblioteca de audit logging?**
- [ ] **Implementou createAuditLog() após cada operação bem-sucedida?**
- [ ] **Incluiu dados anteriores para comparação (quando aplicável)?**
- [ ] **Usou tipos padronizados (AUDIT_ACTION_TYPES/AUDIT_RESOURCE_TYPES)?**
- [ ] **Incluiu detalhes relevantes no campo 'details'?**
- [ ] **Testou se os logs estão sendo criados corretamente?**

## 🚫 Exceções

As únicas operações que **NÃO** precisam de logs de auditoria:

1. **Leitura de dados** (GET operations)
2. **Operações de cache/performance**
3. **Logs internos do sistema**
4. **Health checks**

## 🔍 Validação

### Como Verificar se os Logs Estão Funcionando

1. **Durante desenvolvimento:**
```sql
SELECT * FROM audit_logs 
WHERE actor_user_id = 'seu-user-id' 
ORDER BY action_timestamp DESC 
LIMIT 10;
```

2. **Via interface:**
- Acesse `/settings` → Segurança → Logs de Auditoria
- Verifique se a ação aparece na lista

## 📋 Responsabilidades

### Desenvolvedor
- Implementar logs em TODAS as ações que modificam dados
- Usar tipos padronizados
- Incluir detalhes relevantes
- Testar a implementação

### Code Review
- Verificar se logs de auditoria foram implementados
- Validar uso correto dos tipos padronizados
- Confirmar que detalhes relevantes estão incluídos

### QA
- Testar se logs estão sendo criados
- Verificar se informações estão corretas
- Validar que logs aparecem na interface

## 🚨 Consequências do Não Cumprimento

- **PR será rejeitado** se não incluir logs de auditoria obrigatórios
- **Problemas de conformidade** e rastreabilidade
- **Dificuldade em debugging** e investigação de problemas
- **Riscos de segurança** por falta de rastreabilidade

---

**Lembre-se: Logs de auditoria não são opcionais - são um requisito fundamental para a segurança e conformidade do sistema.** 