# Correção de Problema de Recursão nas Políticas RLS

## Problema Identificado

**Sintoma:** Erro ao tentar buscar usuários de uma organização através da função `getUsersByOrganization()`.

**Erro Específico:** Falha na consulta à tabela `profiles` devido a políticas RLS com dependência circular.

## Causa Raiz

As políticas RLS da tabela `profiles` estavam criando uma **dependência circular**:

1. **Política SELECT** da tabela `profiles` tentava consultar a própria tabela `profiles`
2. Isso criava um loop infinito quando o PostgreSQL tentava aplicar as políticas
3. Resultado: Consultas falhavam com erro de política RLS

## Solução Implementada

### 1. Funções Auxiliares SECURITY DEFINER

Criamos funções auxiliares que quebram a dependência circular:
- `get_user_organization_id()` - Retorna organização do usuário
- `is_master_admin()` - Verifica se é master admin
- `is_organization_admin()` - Verifica se é admin da organização

### 2. Políticas RLS Corrigidas

Recriamos as políticas usando as funções auxiliares ao invés de consultas diretas à própria tabela.

## Instruções de Aplicação

### Execução Manual (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/sxqhfxlxwdqwgqgwcfvn
2. Vá para SQL Editor
3. Execute o script `scripts/manual-fix-rls-recursion.sql`

### Script PowerShell
```powershell
.\scripts\fix-rls-recursion.ps1 -Apply
```

## Verificação da Correção

1. ✅ 3 funções auxiliares criadas com SECURITY DEFINER
2. ✅ 4 políticas RLS recriadas sem recursão
3. ✅ Teste funcional: carregar lista de usuários de organização

## Arquivos Relacionados

- `scripts/manual-fix-rls-recursion.sql` - Script para execução manual
- `scripts/fix-rls-recursion.ps1` - Script PowerShell de aplicação
- `supabase/migrations/20250113000001_fix_rls_recursion.sql` - Migração oficial

## Impacto da Correção

**Antes:**
- ❌ Erro ao carregar lista de usuários
- ❌ Páginas de administração não funcionavam

**Após:**
- ✅ Lista de usuários carrega corretamente
- ✅ Políticas de segurança mantidas
- ✅ Funcionalidade completa restaurada