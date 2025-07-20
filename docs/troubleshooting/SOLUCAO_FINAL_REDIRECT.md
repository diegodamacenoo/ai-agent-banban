# 🎯 SOLUÇÃO FINAL - Problema de Redirect no Email de Convite

## 🔍 PROBLEMA IDENTIFICADO

O link recebido no email ainda mostra:
```
https://bopytcghbmuywfltmwhk.supabase.co/auth/v1/verify?token=...&type=invite&redirect_to=http://localhost:3000/
```

Ao invés de:
```
https://bopytcghbmuywfltmwhk.supabase.co/auth/v1/verify?token=...&type=invite&redirect_to=http://localhost:3000/auth/callback?type=invite&next=/setup-account?from=invite
```

## 🎯 CAUSA RAIZ

O **Dashboard do Supabase** tem uma configuração de **Site URL** que está sendo usada como fallback, sobrescrevendo o `redirectTo` definido no código.

## ✅ SOLUÇÃO

### 1. Atualizar Site URL no Dashboard do Supabase

Acesse: https://supabase.com/dashboard/project/bopytcghbmuywfltmwhk/settings/auth

**Configuração Atual:**
- Site URL: `http://localhost:3000/`

**Nova Configuração:**
- Site URL: `http://localhost:3000/auth/callback`

### 2. Adicionar Redirect URLs

Na seção **Redirect URLs**, adicionar:
- `http://localhost:3000/auth/callback`
- `http://localhost:3000/auth/callback?type=invite&next=/setup-account?from=invite`

### 3. Configuração Completa Recomendada

**Authentication > Settings:**
- Site URL: `http://localhost:3000/auth/callback`
- Additional Redirect URLs:
  ```
  http://localhost:3000/auth/callback
  http://localhost:3000/auth/callback?type=invite&next=/setup-account?from=invite
  http://localhost:3000/setup-account
  http://localhost:3000/setup-account?from=invite
  ```

## 🔧 ALTERNATIVA (Se não quiser alterar o Dashboard)

Modificar o código para usar `signUp` ao invés de `inviteUserByEmail`:

```typescript
// Em src/app/actions/invite-user.ts
const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
  email: email,
  password: generateTemporaryPassword(), // Gerar senha temporária
  options: {
    emailRedirectTo: `${baseUrl}/auth/callback?type=invite&next=${encodeURIComponent('/setup-account?from=invite')}`,
    data: {
      role: roleMapping[role] || role,
      organization_id: organizationId,
      is_invite: true,
      invited_by: currentUser.user.id
    }
  }
})
```

## 🎯 RECOMENDAÇÃO

**Opção 1 (Recomendada):** Atualizar o Dashboard do Supabase
**Opção 2:** Usar signUp com senha temporária

A Opção 1 é mais simples e mantém o fluxo atual de convites.

## 📝 PRÓXIMOS PASSOS

1. Acessar Dashboard do Supabase
2. Atualizar Site URL para `http://localhost:3000/auth/callback`
3. Adicionar Redirect URLs conforme listado acima
4. Testar novo convite
5. Verificar se o link agora inclui os parâmetros corretos 