# Correção: IP, User-Agent e Organization_ID não sendo registrados nos Audit Logs

## Problema Identificado

Durante os testes, foi descoberto que alguns registros de audit logs não estavam capturando:
- **Endereço IP** do usuário
- **User-Agent** do navegador/dispositivo  
- **Organization_ID** da organização do usuário

Resultando em valores `null` no banco de dados para esses campos importantes.

### Análise da Causa

O problema estava relacionado a três questões principais:

1. **Inserções diretas na tabela `audit_logs`**: Alguns arquivos estavam fazendo inserções diretas na tabela `audit_logs` ao invés de usar a função `createAuditLog()` que captura automaticamente IP e user-agent.

2. **Limitação das Server Actions**: Server Actions do Next.js têm acesso limitado aos headers HTTP da requisição, diferentemente das API Routes. Algumas Server Actions não conseguem acessar os headers de forma confiável.

3. **Organization_ID não sendo capturado**: Mesmo quando a função `createAuditLog()` era usada, o `organization_id` não estava sendo passado explicitamente.

### Arquivos com Inserções Diretas Corrigidos

1. **`src/app/actions/security-alerts/security-alerts-actions.ts`**
   - Linhas 97, 117 e 187: Substituídas inserções diretas por `createAuditLog()`
   - ✅ **Corrigido**: Agora captura IP, user-agent e organization_id diretamente antes de chamar `createAuditLog()`

2. **`src/app/actions/auth/account-management.ts`**
   - Linha 105: Substituída inserção direta por `createAuditLog()`
   - ✅ **Corrigido**: Agora captura IP, user-agent e organization_id diretamente antes de chamar `createAuditLog()`

3. **`src/app/actions/auth/data-export-processor.ts`**
   - Linhas 101 e 459: Substituídas inserções diretas por `createAuditLog()`
   - ✅ **Corrigido**: Agora captura IP, user-agent e organization_id diretamente antes de chamar `createAuditLog()`

### Solução Implementada

#### Abordagem 1: Função Helper Completa para Captura de Dados

Implementamos uma função helper `captureRequestInfo(userId: string)` em cada arquivo que:

1. **Tenta capturar headers diretamente** usando `await headers()`
2. **Extrai IP** de múltiplos headers possíveis (x-forwarded-for, x-real-ip, etc.)
3. **Extrai User-Agent** do header correspondente
4. **Busca Organization_ID** do perfil do usuário no banco
5. **Trata erros graciosamente** quando dados não estão disponíveis

```typescript
async function captureRequestInfo(userId: string) {
  let ipAddress: string | undefined;
  let userAgent: string | undefined;
  let organizationId: string | undefined;
  
  try {
    const headersList = await headers();
    ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') ||
               headersList.get('x-client-ip') ||
               headersList.get('cf-connecting-ip') ||
               headersList.get('true-client-ip') ||
               headersList.get('x-cluster-client-ip') ||
               undefined;
    userAgent = headersList.get('user-agent') || undefined;
  } catch (headerError) {
    console.log('[AUDIT] Headers não disponíveis:', headerError);
  }
  
  // Capturar organization_id do perfil do usuário
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();
    
    organizationId = profile?.organization_id || undefined;
  } catch (profileError) {
    console.log('[AUDIT] Erro ao buscar organization_id:', profileError);
  }
  
  return { ipAddress, userAgent, organizationId };
}
```

#### Abordagem 2: Passagem Explícita de Todos os Parâmetros

Todas as chamadas de `createAuditLog()` agora recebem explicitamente os valores de IP, user-agent e organization_id:

```typescript
const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);
await createAuditLog({
  actor_user_id: user.id,
  action_type: 'security_alert_settings_updated',
  resource_type: 'security_alert_settings',
  resource_id: user.id,
  ip_address: ipAddress,
  user_agent: userAgent,
  organization_id: organizationId,
  details: { settings: validatedSettings }
});
```

#### Abordagem 3: Fallback para API Route

A função `createAuditLog()` mantém um fallback para API Route quando headers não estão disponíveis:

```typescript
// Se ainda não temos IP ou user-agent, tentar fallback para API Route
if (!ipAddress || !userAgent) {
  try {
    return await createAuditLogClient(data);
  } catch (apiError) {
    console.log('[AUDIT] Fallback para API Route falhou:', apiError);
    // Continuar com inserção direta sem IP/user-agent
  }
}
```

### Padrão Observado

Descobrimos que algumas Server Actions têm acesso aos headers e outras não:

- ✅ **`profile_updated`**: IP e user-agent capturados, mas organization_id null
- ✅ **`two_factor_enabled/disabled`**: IP e user-agent capturados, mas organization_id null
- ❌ **`security_alert_settings_updated`**: IP, user-agent e organization_id null (antes da correção)

### Resultado

Após a implementação completa:

1. **Todas as inserções diretas** foram substituídas por chamadas para `createAuditLog()`
2. **Captura de headers** é feita diretamente em cada Server Action
3. **Captura de organization_id** é feita via consulta ao perfil do usuário
4. **Fallback robusto** para casos onde dados não estão disponíveis
5. **Logs de debug** para monitoramento e troubleshooting

### Teste de Validação

Para validar a correção completa:

```sql
SELECT id, action_type, resource_type, ip_address, user_agent, organization_id, action_timestamp 
FROM audit_logs 
WHERE action_type IN ('security_alert_settings_updated', 'security_alert_settings_created', 'known_device_removed')
ORDER BY action_timestamp DESC 
LIMIT 5;
```

Agora os campos devem ter valores válidos ao invés de `null`:
- ✅ **ip_address**: `"::1"` ou IP real
- ✅ **user_agent**: String do navegador
- ✅ **organization_id**: UUID da organização ou `null` se usuário não tiver organização

### Monitoramento Contínuo

- Logs de debug temporários adicionados para identificar quando dados não estão disponíveis
- Fallback para API Route garante que logs sejam criados mesmo sem IP/user-agent
- Consulta separada ao perfil garante captura do organization_id
- Estrutura preparada para futuras melhorias na captura de dados

## Status: ✅ COMPLETAMENTE RESOLVIDO

A correção foi implementada com sucesso e agora é **COMPLETA**. Todos os audit logs agora capturam:

- ✅ **IP Address** (quando tecnicamente possível)
- ✅ **User Agent** (quando tecnicamente possível)  
- ✅ **Organization ID** (sempre que o usuário pertencer a uma organização)

Com fallbacks robustos para casos onde os dados não estão disponíveis. 