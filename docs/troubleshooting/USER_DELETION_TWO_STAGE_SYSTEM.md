# Sistema de Exclusão de Usuários em Dois Estágios

## Problema Identificado

**Observação do Usuário:** "Parece que na exclusão, excluímos o usuário de profiles, mas ele continua em auth"

**Análise:** O sistema anterior fazia apenas **soft delete** na tabela `profiles`, mas mantinha o usuário no sistema de autenticação (`auth.users`), causando:
- ❌ Usuário ainda pode fazer login
- ❌ Usuário ainda consome "vaga" no plano
- ❌ Dados inconsistentes entre `profiles` e `auth`

## Solução Implementada: Sistema de Dois Estágios

### Estágio 1: Desativação (Soft Delete)
**Função:** `deactivateUserFromOrganization()`

**O que faz:**
- ✅ Remove usuário da organização (soft delete em `profiles`)
- ✅ Mantém usuário no sistema de autenticação
- ✅ Permite reativação posterior
- ✅ Mantém histórico completo

**Quando usar:**
- Suspensão temporária
- Usuário que pode retornar
- Primeira ação de "remoção"

### Estágio 2: Exclusão Permanente
**Função:** `permanentlyDeleteUser()`

**O que faz:**
- ✅ Remove usuário do sistema de autenticação (`auth.users`)
- ✅ Remove completamente da tabela `profiles` (hard delete)
- ❌ **IRREVERSÍVEL** - não pode ser desfeito
- ✅ Libera "vaga" no plano do Supabase

**Quando usar:**
- Exclusão definitiva
- Usuário não retornará
- Apenas **Master Admins** podem executar

### Função Adicional: Reativação
**Função:** `reactivateUser()`

**O que faz:**
- ✅ Restaura usuário previamente desativado
- ✅ Remove `deleted_at` e define `status: 'active'`
- ✅ Usuário volta a ter acesso normal

## Fluxo de Trabalho Recomendado

```
1. DESATIVAR → 2. AVALIAR → 3. REATIVAR ou EXCLUIR PERMANENTEMENTE
     ↓              ↓                    ↓
 Soft Delete   Período de      Restaurar ou Deletar
               Quarentena       (irreversível)
```

### Cenário 1: Remoção Temporária
```
Usuário violou política → DESATIVAR → Após correção → REATIVAR
```

### Cenário 2: Remoção Definitiva
```
Usuário saiu da empresa → DESATIVAR → Após 30 dias → EXCLUIR PERMANENTEMENTE
```

## Implementação Técnica

### 1. Funções Criadas

#### `deactivateUserFromOrganization(userId, organizationId)`
```typescript
// Soft delete - mantém no auth
profiles.update({
  deleted_at: new Date().toISOString(),
  status: 'inactive'
})
// NÃO remove de auth.users
```

#### `reactivateUser(userId, organizationId)`
```typescript
// Restaura usuário
profiles.update({
  deleted_at: null,
  status: 'active'
})
```

#### `permanentlyDeleteUser(userId, organizationId)`
```typescript
// Exclusão permanente - IRREVERSÍVEL
auth.admin.deleteUser(userId)  // Remove do auth
profiles.delete()              // Hard delete
```

### 2. Permissões

| Função | Master Admin | Org Admin | Usuário |
|--------|--------------|-----------|---------|
| `deactivateUserFromOrganization` | ✅ | ✅ (mesma org) | ❌ |
| `reactivateUser` | ✅ | ✅ (mesma org) | ❌ |
| `permanentlyDeleteUser` | ✅ | ❌ | ❌ |

### 3. Auditoria

Todas as ações são registradas no log de auditoria:
- `USER_DEACTIVATED` - Desativação
- `USER_RESTORED` - Reativação  
- `USER_DELETED` - Exclusão permanente

## Interface do Usuário (Futuro)

### Menu de Ações do Usuário
```
┌─ Ações do Usuário ──────────┐
│ ✏️  Editar                   │
│ 🔄  Reativar (se inativo)    │
│ ⏸️  Desativar               │
│ ──────────────────────────   │
│ 🗑️  Excluir Permanentemente │
│    (apenas Master Admin)     │
└─────────────────────────────┘
```

### Estados Visuais
- 🟢 **Ativo** - Badge verde
- 🟡 **Desativado** - Badge cinza + opção "Reativar"
- 🔴 **Excluído** - Não aparece na lista

## Benefícios da Abordagem

### ✅ Segurança
- Prevenção de exclusões acidentais
- Período de "quarentena" para revisão
- Permissões granulares

### ✅ Flexibilidade
- Possibilidade de reverter desativações
- Diferentes níveis de remoção
- Controle fino sobre o processo

### ✅ Conformidade
- Auditoria completa de todas as ações
- Histórico preservado
- Rastreabilidade total

### ✅ Economia
- Exclusão permanente libera vagas no plano
- Soft delete não consome recursos extras
- Otimização de custos

## Migração do Sistema Anterior

### Usuários Já "Removidos"
Usuários que foram "removidos" com o sistema anterior:
- ✅ Estão marcados como `deleted_at` em `profiles`
- ❌ Ainda existem em `auth.users`
- 🔄 Podem ser **reativados** com `reactivateUser()`
- 🗑️ Podem ser **excluídos permanentemente** com `permanentlyDeleteUser()`

### Script de Limpeza (Opcional)
```sql
-- Listar usuários "órfãos" (em auth mas não em profiles ativos)
SELECT au.id, au.email 
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id AND p.deleted_at IS NULL
WHERE p.id IS NULL;
```

## Arquivos Modificados

- `src/app/actions/admin/organization-users.ts` - Funções backend
- `src/app/(protected)/admin/organizations/[id]/components/UsersTab.tsx` - Interface
- `docs/troubleshooting/USER_DELETION_TWO_STAGE_SYSTEM.md` - Esta documentação

## Próximos Passos

1. ✅ **Implementação Backend** - Concluída
2. 🔄 **Atualização da Interface** - Em andamento
3. ⏳ **Testes de Integração** - Pendente
4. ⏳ **Script de Migração** - Pendente
5. ⏳ **Documentação do Usuário** - Pendente

## Considerações Importantes

### ⚠️ Exclusão Permanente
- **IRREVERSÍVEL** - não pode ser desfeita
- Apenas Master Admins podem executar
- Remove completamente do sistema
- Libera vaga no plano do Supabase

### 🔄 Reativação
- Funciona apenas para usuários desativados
- Não funciona para usuários excluídos permanentemente
- Restaura acesso completo

### 📊 Impacto no Plano
- **Desativação:** Mantém usuário no plano
- **Exclusão Permanente:** Libera vaga no plano 