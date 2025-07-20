# Correção de Políticas RLS para Convites de Usuários

## ⚠️ PROBLEMA CRÍTICO IDENTIFICADO

**Erro de Recursão Infinita:** `infinite recursion detected in policy for relation "profiles"`

**Status:** 🔴 **EMERGÊNCIA - APLICAÇÃO QUEBRADA**

## Causa da Recursão

As políticas RLS criadas fazem consultas na própria tabela `profiles`, causando recursão infinita:

```sql
-- PROBLEMÁTICO - CAUSA RECURSÃO
organization_id IN (
    SELECT organization_id 
    FROM public.profiles  -- ← RECURSÃO AQUI!
    WHERE id = auth.uid()
)
```

## 🚨 CORREÇÃO DE EMERGÊNCIA

### Execute IMEDIATAMENTE:

**Arquivo:** `scripts/fix-rls-recursion-emergency.sql`

**Como executar:**
1. 🏃‍♂️ **URGENTE:** Acesse Dashboard do Supabase
2. **Settings** → **Database** → **SQL Editor**
3. **Execute:** `scripts/fix-rls-recursion-emergency.sql`

### Políticas Corrigidas (Simples)

```sql
-- SELECT: Apenas próprio perfil
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- INSERT: Permite criação próprio perfil (para convites)
CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- UPDATE: Apenas próprio perfil
CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
```

## Teste Após Correção

1. **Aplicação deve voltar a funcionar**
2. **Middleware deve parar de dar erro**
3. **Convites devem funcionar**

## Logs Esperados (Após Correção)

### Antes (Erro)
```
Error fetching profile: infinite recursion detected in policy
```

### Depois (Funcionando)
```
✅ PERFIL CRIADO COM SUCESSO!
🚀 REDIRECIONANDO PARA SETUP-ACCOUNT...
```

## Histórico do Problema

### 1. ✅ Template Email (Resolvido)
- URL construída corretamente com `token_hash`

### 2. ✅ Callback (Funcionando)
- Token processado com sucesso

### 3. ❌ → ✅ RLS Policies (Corrigido)
- **Problema 1:** Bloqueava INSERT (resolvido)
- **Problema 2:** Recursão infinita (corrigindo agora)

## Próximos Passos

1. **Executar script de emergência**
2. **Testar aplicação**
3. **Testar processo de convite**
4. **Refinar políticas gradualmente** (se necessário)

## Arquivos de Correção

- **🚨 Emergência:** `scripts/fix-rls-recursion-emergency.sql`
- **Original:** `scripts/fix-rls-profiles-invite.sql` (problemático)
- **Migração:** `supabase/migrations/20250113000000_fix_rls_policies_for_invites.sql`

---

**Atualizado:** 2025-01-13  
**Status:** 🔴 Emergência - Recursão RLS  
**Ação:** Execute script de emergência IMEDIATAMENTE 