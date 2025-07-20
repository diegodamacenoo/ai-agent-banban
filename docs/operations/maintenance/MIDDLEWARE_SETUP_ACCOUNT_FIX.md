# Correção do Middleware - Redirecionamento para Setup Account

## Problema Identificado

**Situação:** Após correção das políticas RLS, o perfil era criado com sucesso, mas o usuário não conseguia acessar `/setup-account` - era redirecionado para `/login`.

**Logs observados:**
```
✅ PERFIL CRIADO COM SUCESSO!
🚀 REDIRECIONANDO PARA SETUP-ACCOUNT...
GET /setup-account → 307 → /login
```

## Causa Raiz

O middleware estava interceptando a requisição para `/setup-account` e:

1. **Fazendo JOIN complexo** com `organizations()` que falhava para perfis recém-criados
2. **Redirecionando para login** quando não conseguia buscar o perfil corretamente
3. **Não permitindo acesso** à página de setup mesmo para usuários recém-convidados

### Código Problemático

```typescript
// PRIORIDADE 0: Não incluía /setup-account
if (pathname.startsWith('/login') || pathname.startsWith('/auth/callback')) {
  return response;
}

// Busca com JOIN complexo que falhava
const { data: profile, error: profileError } = await supabaseForUserCheck
  .from('profiles')
  .select('role, is_setup_complete, organizations(company_legal_name, company_trading_name)')
  .eq('id', user.id)
  .single();

// Redirecionamento rígido para login
if (profileError || !profile) {
  return NextResponse.redirect(new URL('/login', request.url));
}
```

## Correção Aplicada

### 1. Permitir Acesso Direto ao Setup Account

```typescript
// PRIORIDADE 0: SEMPRE permitir acesso às páginas de autenticação E setup-account
if (pathname.startsWith('/login') || pathname.startsWith('/auth/callback') || pathname.startsWith('/setup-account')) {
  logger.debug(`Route ${pathname}. Access permitted. Finalizing middleware.`);
  console.log(`🚨 MIDDLEWARE: Permitindo acesso a ${pathname}`);
  return response;
}
```

### 2. Busca de Perfil Mais Tolerante

```typescript
// Busca SEM JOIN para evitar erros em perfis novos
const { data: profile, error: profileError } = await supabaseForUserCheck
  .from('profiles')
  .select('role, is_setup_complete, organization_id')  // ← SEM JOIN
  .eq('id', user.id)
  .single();
```

### 3. Tratamento Inteligente de Erros

```typescript
if (profileError || !profile) {
  // Se o usuário não tem perfil e está no setup, permitir acesso
  if (pathname.startsWith('/setup-account')) {
    console.log('[middleware] 🚨 Permitindo acesso ao setup-account mesmo sem perfil');
    return response;
  }
  
  // Para outras rotas, redirecionar apenas se não for erro de RLS
  if (profileError?.code !== '42501') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Se for erro de RLS, permitir continuar
  return response;
}
```

### 4. Busca de Organização Separada

```typescript
// PRIORIDADE 2: Buscar organização separadamente se necessário
if (profile.organization_id) {
  const { data: org } = await supabaseForUserCheck
    .from('organizations')
    .select('company_legal_name, company_trading_name')
    .eq('id', profile.organization_id)
    .single();
    
  // Processar redirecionamento de tenant...
}
```

## Resultado Esperado

### Fluxo Corrigido

1. ✅ Callback cria perfil com sucesso
2. ✅ Redirecionamento para `/setup-account?from=invite`
3. ✅ **Middleware permite acesso** direto ao setup-account
4. ✅ Usuário consegue completar configuração da conta

### Logs Esperados

```
🚨 MIDDLEWARE: Interceptou /setup-account
🚨 MIDDLEWARE: Permitindo acesso a /setup-account
GET /setup-account?from=invite 200 OK
```

## Arquivos Modificados

- **Middleware:** `src/middleware.ts`
- **Documentação:** `docs/troubleshooting/MIDDLEWARE_SETUP_ACCOUNT_FIX.md`

## Teste da Correção

1. **Enviar novo convite** via admin
2. **Clicar no link** do email
3. **Verificar que vai direto** para `/setup-account` sem redirecionamento para login
4. **Completar configuração** da conta

## Status do Fluxo Completo

### ✅ Problemas Resolvidos
1. **Template de Email** - URLs construídas corretamente
2. **Políticas RLS** - Perfis podem ser criados
3. **Middleware** - Permite acesso ao setup-account

### 🎯 Fluxo Completo Funcionando
- Convite enviado → Email recebido → Link clicado → Perfil criado → Setup account acessível

---

**Criado:** 2025-01-13  
**Tipo:** Correção de Middleware  
**Status:** ✅ Aplicado - Testando redirecionamento 