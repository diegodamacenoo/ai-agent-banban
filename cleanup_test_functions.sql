-- ================================================
-- SCRIPT: Limpeza de Funções de Teste Não Utilizadas
-- Projeto: Banban - Limpeza do Banco de Dados
-- Data: $(date)
-- ================================================

-- IMPORTANTE: Execute este script em ambiente de desenvolvimento primeiro!
-- Essas funções são apenas para teste e não são usadas no código da aplicação.

BEGIN;

-- ================================================
-- 1. DELETAR FUNÇÕES DE TESTE RLS
-- ================================================

-- Função para verificar permissão de execução de teste RLS
DROP FUNCTION IF EXISTS public.can_execute_test_rls() CASCADE;

-- Função de teste RLS (versão com role)
DROP FUNCTION IF EXISTS public.test_rls(query text, role text) CASCADE;

-- Função de teste RLS (versão com user_id e user_role)
DROP FUNCTION IF EXISTS public.test_rls(query text, user_id uuid, user_role text) CASCADE;

-- ================================================
-- 2. DELETAR FUNÇÕES UTILITÁRIAS DESNECESSÁRIAS
-- ================================================

-- Função de limpeza de tentativas de login antigas (se não for usada em cron jobs)
DROP FUNCTION IF EXISTS public.cleanup_old_login_attempts() CASCADE;

-- Função de trigger para templates de implementação (se a tabela não existe)
DROP FUNCTION IF EXISTS public.update_implementation_templates_updated_at() CASCADE;

-- ================================================
-- 3. VERIFICAÇÃO FINAL
-- ================================================

-- Listar funções restantes para confirmação
SELECT 'FUNÇÕES RESTANTES NO SCHEMA PUBLIC:' as status;
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    CASE 
        WHEN p.proname LIKE '%test%' THEN '⚠️ TEST'
        WHEN p.proname LIKE '%temp%' THEN '⚠️ TEMP'
        WHEN p.proname LIKE '%cleanup%' THEN '⚠️ CLEANUP'
        ELSE '✅ PRODUCTION'
    END as status
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prokind = 'f'
AND (
    p.proname LIKE '%test%' 
    OR p.proname LIKE '%temp%' 
    OR p.proname LIKE '%cleanup%'
    OR p.proname LIKE '%demo%'
    OR p.proname LIKE '%example%'
)
ORDER BY p.proname;

COMMIT;

-- ================================================
-- RESUMO DAS FUNÇÕES DELETADAS
-- ================================================

/*
FUNÇÕES DELETADAS:
1. can_execute_test_rls() - Função para verificar permissão de teste RLS
2. test_rls(text, text) - Função de teste RLS com role
3. test_rls(text, uuid, text) - Função de teste RLS com user_id
4. cleanup_old_login_attempts() - Limpeza automática (se não usada)
5. update_implementation_templates_updated_at() - Trigger para tabela inexistente

MOTIVOS DA REMOÇÃO:
- Funções apenas para desenvolvimento/teste
- Não referenciadas no código da aplicação
- Não utilizadas em produção
- Redução de overhead e complexidade

BENEFÍCIOS:
- Menor superfície de ataque
- Código mais limpo
- Menos overhead no banco
- Documentação simplificada
*/ 