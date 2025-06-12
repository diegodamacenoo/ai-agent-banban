# Sistema de Debug do Agente IA BanBan

Este documento descreve o sistema de depuração implementado no projeto Agente IA BanBan, incluindo instruções sobre como utilizá-lo e como configurá-lo para diferentes casos de uso.

## Visão Geral

O sistema de debug centraliza e padroniza os logs da aplicação, fornecendo:

- Controle granular de níveis de log (error, warn, info, debug, trace)
- Ativação/desativação de logs por módulo
- Destinos configuráveis (console, localStorage)
- Armazenamento de logs para consulta posterior
- Consistência no formato dos logs
- Configuração por ambiente (development, production)

## Estrutura

O sistema é composto pelos seguintes componentes:

- **Logger**: Classe principal que gerencia os logs (`src/lib/utils/logger.ts`)
- **Configuração**: Definições e controles de configuração (`src/lib/utils/debug-config.ts`)
- **Utilidades**: Funções auxiliares para uso simplificado (`src/lib/utils/debug-utils.ts`)
- **Inicialização**: Configuração inicial automática (`src/app/init-debug.tsx`)

## Como Usar

### Método Recomendado (com módulos)

Para registrar logs estruturados por módulo:

```typescript
import { createLogger } from '@/lib/utils/logger';
import { DEBUG_MODULES } from '@/lib/utils/debug-config';

// Criar um logger para o módulo específico
const logger = createLogger(DEBUG_MODULES.UI_DASHBOARD);

// Utilizar os métodos do logger
logger.debug('Dados do dashboard:', dados);
logger.error('Erro ao carregar dashboard:', erro);
```

### Método Simplificado (linha única)

Para registrar logs sem criar uma instância do logger:

```typescript
import { debug } from '@/lib/utils/debug-utils';

// Utilizar diretamente
debug.log(DEBUG_MODULES.API_PROFILES, 'Resposta da API:', resposta);
debug.error(DEBUG_MODULES.AUTH, 'Falha na autenticação:', erro);
```

### Níveis de Log Disponíveis

Os seguintes métodos estão disponíveis para cada nível de log:

- `error`: Erros que afetam o funcionamento
- `warn`: Avisos importantes, comportamentos inesperados
- `info`: Informações relevantes de funcionamento
- `debug`: Detalhes para depuração (nível recomendado para desenvolvimento)
- `trace`: Detalhes extremamente verbosos para troubleshooting

## Módulos Disponíveis

Os módulos estão definidos em `DEBUG_MODULES`:

```typescript
// Auth
AUTH: 'auth',
MFA: 'mfa',

// API
API_PROFILES: 'api:profiles',
API_SETTINGS: 'api:settings',
API_USER_MANAGEMENT: 'api:user-management',

// UI
UI_DASHBOARD: 'ui:dashboard',
UI_SETTINGS: 'ui:settings',
UI_LOGIN: 'ui:login',
UI_AVATAR: 'ui:avatar',

// Core
MIDDLEWARE: 'middleware',
USER_CONTEXT: 'user-context'
```

## Configuração Programática

Para controlar o sistema de debug programaticamente:

```typescript
import { debug } from '@/lib/utils/debug-config';

// Ativar/desativar todos os logs
debug.enable(true);

// Alterar nível de log
debug.setLevel('info');

// Ativar/desativar módulo específico
debug.toggleModule(DEBUG_MODULES.UI_DASHBOARD, false);
```

## Configurações de Desenvolvimento vs. Produção

- Em **ambiente de desenvolvimento**, os logs estão ativos por padrão com nível `debug`.
- Em **ambiente de produção**, os logs são minimizados para apenas `error` e `warn`.

## Dicas para Uso Eficiente

1. **Use o nível apropriado**: Evite usar `debug` para mensagens críticas que deveriam ser `error`.

2. **Estruture os dados**: Prefira passar objetos estruturados em vez de strings concatenadas:
   ```typescript
   // Bom
   logger.debug('Resposta da API:', { status, data, tempo });
   
   // Evite
   logger.debug('Resposta da API: status=' + status + ', data=' + JSON.stringify(data));
   ```

3. **Nomeie módulos de forma consistente**: Siga o padrão existente para os nomes dos módulos.

4. **Mensagens descritivas**: Use mensagens claras que indicam o contexto da operação.

## Contribuindo para o Sistema de Debug

Para adicionar novos módulos ao sistema:

1. Adicione o módulo em `src/lib/utils/debug-config.ts` na constante `DEBUG_MODULES`.
2. Adicione a configuração padrão na constante `DEBUG_CONFIG.modules`.
3. Documente o novo módulo neste arquivo.

## Performance

O sistema foi projetado para ter impacto mínimo de performance, com:

- Avaliação prévia das condições para evitar processamento desnecessário
- Cache de configurações
- Lógica condicional para ambientes de produção vs. desenvolvimento

## Problemas e Soluções Conhecidas

### Gerenciamento de Sessões no Supabase

#### Problema: Não visualização de sessões ativas ou erro ao encerrar sessões

**Sintomas:**
1. Mensagem "Nenhuma sessão ativa encontrada" mesmo quando o usuário está logado.
2. Erro ao tentar encerrar uma sessão: `invalid JWT: unable to parse or verify signature, token is malformed: token contains an invalid number of segments`.
3. Erro "forbidden" ao tentar encerrar sessões usando a API REST do Supabase.

**Causa:**
1. **Para visualização de sessões:** Falta de políticas de RLS para permitir SELECT na tabela `user_sessions`.
2. **Para encerramento de sessões:** Uso incorreto da API `auth.admin.signOut` ou problemas de permissão.
3. **Para erro "forbidden":** Endpoint incorreto ou falta de permissões adequadas para a chave de serviço.

**Solução:**

1. **Para visualização de sessões:**
   ```sql
   -- Adicionar política para permitir que usuários vejam suas próprias sessões
   CREATE POLICY "Users can view their own sessions" ON public.user_sessions
       FOR SELECT
       USING (auth.uid() = user_id);
   
   -- Adicionar política para administradores verem todas as sessões
   CREATE POLICY "Organization admins can view all sessions" ON public.user_sessions
       FOR SELECT
       USING (
           EXISTS (
               SELECT 1 FROM public.profiles
               WHERE 
                   profiles.id = auth.uid() AND
                   profiles.role = 'organization_admin'
           )
       );
   ```

2. **Para encerramento de sessões:**
   - Em vez de usar `auth.admin.signOut(sessionId)`, utilize:
     - Para a sessão atual: `supabase.auth.signOut({ scope: 'local' })`
     - Para todas as outras sessões: `supabase.auth.signOut({ scope: 'others' })`
     - Para sessões específicas: Utilizar função RPC personalizada ou DELETE na tabela auth.sessions

3. **Para resolver erro "forbidden":**
   - Criar uma função RPC personalizada com SECURITY DEFINER:
   ```sql
   CREATE OR REPLACE FUNCTION public.supabase_admin_revoke_session(session_id uuid)
   RETURNS void
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   BEGIN
     -- Verificar se a função está sendo executada pelo role de serviço
     IF NOT is_supabase_admin() THEN
       RAISE EXCEPTION 'Você não tem permissões para executar esta função';
     END IF;

     -- Remover a sessão da tabela auth.sessions
     DELETE FROM auth.sessions WHERE id = session_id;
   END;
   $$;
   ```
   - Utilize a função RPC:
   ```typescript
   const { error } = await adminSupabase.rpc(
     'supabase_admin_revoke_session', 
     { session_id: sessionId }
   );
   ```

**Exemplo de código para encerrar uma sessão específica (abordagem robusta):**
```typescript
// Se for a sessão atual
if (currentSession && currentSession.id === sessionId) {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) {
    console.error('Erro ao encerrar sessão atual:', error);
    return { success: false, error: error.message };
  }
} else {
  // Tentar diferentes abordagens em sequência
  try {
    // 1. Usar RPC personalizada (mais confiável)
    const { error: rpcError } = await adminSupabase.rpc(
      'supabase_admin_revoke_session', 
      { session_id: sessionId }
    );
    
    if (rpcError) {
      console.warn('Erro ao usar RPC:', rpcError);
      
      // 2. Tentar com API REST
      const res = await fetch(`${supabaseUrl}/rest/v1/auth/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'X-Client-Info': 'supabase-admin-api'
        }
      });
      
      if (!res.ok) {
        console.warn('Erro na API REST:', await res.text());
        
        // 3. Fallback: remover apenas de user_sessions
        await adminSupabase.from('user_sessions').delete().eq('id', sessionId);
      }
    }
  } catch (e) {
    console.error('Erro ao encerrar sessão:', e);
    return { success: false, error: e.message };
  }
}
```

#### Manutenção e Limpeza de Sessões

Ocasionalmente, podem surgir sessões órfãs devido a problemas de sincronização entre `auth.sessions` e `public.user_sessions`. Para limpar:

```sql
-- Remover sessões órfãs em public.user_sessions
DELETE FROM public.user_sessions 
WHERE id NOT IN (SELECT id FROM auth.sessions);
```

Essa limpeza pode ser automatizada com funções ou realizada manualmente quando necessário. 