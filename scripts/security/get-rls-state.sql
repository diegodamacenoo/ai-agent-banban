-- scripts/security/get-rls-state.sql
-- Este script consulta o catálogo do PostgreSQL para obter o estado real das políticas RLS.
-- Ele foi projetado para ser executado pelo script de compliance unificado.
-- A saída é um formato simples de chave-valor para ser facilmente analisada pelo PowerShell.

DO $$
DECLARE
    total_policies INT;
    total_rls_enabled_tables INT;
BEGIN
    -- Conta o número total de políticas RLS em todas as tabelas (excluindo o esquema 'pg_catalog')
    SELECT COUNT(*)
    INTO total_policies
    FROM pg_policies
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'storage', 'graphql', 'graphql_public', 'pgsodium', 'pgsodium_masks', 'vault');

    -- Conta o número de tabelas com RLS habilitado (excluindo os esquemas do sistema)
    SELECT COUNT(*)
    INTO total_rls_enabled_tables
    FROM pg_tables
    WHERE rowsecurity = TRUE
      AND schemaname NOT IN ('pg_catalog', 'information_schema', 'storage', 'graphql', 'graphql_public', 'pgsodium', 'pgsodium_masks', 'vault');

    -- Imprime os resultados em um formato chave-valor
    RAISE NOTICE 'rls_policies_count:%', total_policies;
    RAISE NOTICE 'rls_enabled_tables_count:%', total_rls_enabled_tables;
END $$; 