# Correção do Erro "JSON object requested, multiple (or no) rows returned"

## Problema Identificado

O erro `"Não foi possível determinar a role do usuário via tabela profiles: JSON object requested, multiple (or no) rows returned"` estava ocorrendo devido ao uso inadequado do método `.single()` do Supabase em consultas que podem retornar múltiplas linhas ou nenhuma linha.

### Causa Raiz
- O método `.single()` falha quando:
  - Há múltiplas linhas na resposta
  - Não há nenhuma linha na resposta
  - Isso causa uma exceção que interrompe o fluxo da aplicação

## Solução Implementada

### 1. Utilitário Robusto para Consultas Únicas

Criado o arquivo `src/shared/utils/supabase-helpers.ts` com funções utilitárias:

```typescript
export async function getSingleRecord<T>(
  query: any,
  context?: string
): Promise<{ data: T | null; error: any }> {
  // Usa .limit(1) ao invés de .single()
  // Lida com casos de múltiplas linhas ou nenhuma linha
  // Fornece logs informativos sobre problemas encontrados
}

export async function getUserProfile(supabase: any, userId: string, fields: string = '*') {
  // Função específica para buscar perfis de usuário
}
```

### 2. Arquivos Corrigidos

#### `src/app/actions/admin/organizations.ts`
- **Função**: `verifyMasterAdminAccess()`
- **Mudança**: Substituído `.single()` por `getUserProfile()` utilitário
- **Benefício**: Lida melhor com múltiplos perfis e casos sem perfil

#### `src/core/auth/getUserData.ts`
- **Função**: `getUserPropsInternal()`
- **Mudança**: Substituído `.single()` por `.limit(1)` com tratamento robusto
- **Benefício**: Evita falhas na autenticação quando há problemas de dados

#### `src/app/api/v1/settings/users/profiles/route.ts`
- **Função**: Método `GET`
- **Mudança**: Substituído `.single()` por `.limit(1)` com validação
- **Benefício**: API mais estável para gestão de perfis

#### `src/app/api/v1/admin/users/route.ts`
- **Função**: Método `GET` - verificação de permissões admin
- **Mudança**: Substituído `.single()` por `getUserProfile()` utilitário + correção `super_admin` → `master_admin`
- **Benefício**: API admin mais estável e roles corretas

#### `src/app/api/v1/user-management/users/route.ts`
- **Função**: Método `GET` - verificação de permissões organization_admin
- **Mudança**: Substituído `.single()` por `getUserProfile()` utilitário
- **Benefício**: API de gestão de usuários mais robusta

#### `src/app/actions/user-management/users.ts`
- **Função**: `listUsers()` e outras funções de gestão
- **Mudança**: Substituído `.single()` por `getUserProfile()` utilitário
- **Benefício**: Actions de usuários mais estáveis

#### `src/app/api/v1/audit-logs/export/route.ts`
- **Função**: Exportação de logs de auditoria
- **Mudança**: Substituído `.single()` por `getUserProfile()` utilitário + correção `super_admin` → `master_admin`
- **Benefício**: Exportação de logs mais confiável

### 3. Melhorias de Logging

- **Warnings informativos** quando múltiplos perfis são encontrados
- **Logs de debug** para facilitar troubleshooting
- **Contexto específico** em cada mensagem de log

## Benefícios da Correção

### ✅ Estabilidade
- Elimina crashes causados por consultas `.single()` problemáticas
- Aplicação continua funcionando mesmo com dados inconsistentes

### ✅ Observabilidade
- Logs claros quando há múltiplos registros
- Identificação proativa de problemas de dados
- Facilita debugging e manutenção

### ✅ Robustez
- Funciona com dados perfeitos e imperfeitos
- Graceful handling de casos edge
- Fallback para cliente admin quando necessário

### ✅ Manutenibilidade
- Código reutilizável através de utilitários
- Padrão consistente para consultas únicas
- Fácil de aplicar em outros arquivos

## Padrão Recomendado

Para futuras consultas que precisam de um único registro:

```typescript
// ❌ Evitar (pode falhar)
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('id', id)
  .single();

// ✅ Usar (robusto)
import { getSingleRecord } from '@/shared/utils/supabase-helpers';

const query = supabase
  .from('table')
  .select('*')
  .eq('id', id);

const { data, error } = await getSingleRecord(query, 'context description');
```

## Status

✅ **Correção Aplicada e Testada**
- Servidor backend funcionando normalmente
- Logs de erro eliminados
- Sistema mais estável para produção

## Correções Adicionais Aplicadas

### ✅ **Correção de Roles**
- **Problema**: Uso incorreto de `super_admin` em verificações de permissão
- **Correção**: Substituído por `master_admin` em todos os arquivos
- **Arquivos corrigidos**:
  - `src/app/api/v1/admin/users/route.ts`
  - `src/app/api/v1/admin/jobs/status/route.ts` 
  - `src/app/api/v1/audit-logs/export/route.ts`

## Próximos Passos

1. **Monitorar logs** para identificar outros casos de `.single()` problemáticos
2. **Aplicar padrão** em outros arquivos conforme necessário
3. **Investigar causa raiz** dos múltiplos perfis (se houver)
4. **Considerar constraint única** na tabela profiles se apropriado
5. **Verificar consistência** de roles em todo o sistema (`master_admin` vs outros) 