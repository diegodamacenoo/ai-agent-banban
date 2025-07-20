-- =============================================
-- Rollback da Migração Inicial - BanBan Data Processing Module v2.0.0
-- Data: 2024-12-19
-- Descrição: Rollback completo e seguro de todas as alterações
-- =============================================

-- IMPORTANTE: Este rollback deve ser executado com extrema cautela
-- pois resultará na perda de todos os dados do módulo data-processing

BEGIN;

-- =============================================
-- 1. REMOVER POLÍTICAS RLS
-- =============================================
DROP POLICY IF EXISTS tenant_data_processing_events_tenant_isolation ON tenant_data_processing_events;
DROP POLICY IF EXISTS tenant_data_processing_log_tenant_isolation ON tenant_data_processing_log;
DROP POLICY IF EXISTS tenant_data_processing_config_tenant_isolation ON tenant_data_processing_config;
DROP POLICY IF EXISTS tenant_data_processing_metrics_tenant_isolation ON tenant_data_processing_metrics;
DROP POLICY IF EXISTS tenant_data_processing_failed_events_tenant_isolation ON tenant_data_processing_failed_events;
DROP POLICY IF EXISTS tenant_data_processing_audit_tenant_isolation ON tenant_data_processing_audit;

-- =============================================
-- 2. REMOVER TRIGGERS
-- =============================================
DROP TRIGGER IF EXISTS trigger_update_tenant_data_processing_events_updated_at ON tenant_data_processing_events;
DROP TRIGGER IF EXISTS trigger_update_tenant_data_processing_config_updated_at ON tenant_data_processing_config;
DROP TRIGGER IF EXISTS trigger_update_tenant_data_processing_failed_events_updated_at ON tenant_data_processing_failed_events;

-- =============================================
-- 3. REMOVER FUNÇÕES DE TRIGGER
-- =============================================
DROP FUNCTION IF EXISTS update_tenant_data_processing_events_updated_at();
DROP FUNCTION IF EXISTS update_tenant_data_processing_config_updated_at();
DROP FUNCTION IF EXISTS update_tenant_data_processing_failed_events_updated_at();

-- =============================================
-- 4. REMOVER ÍNDICES (serão removidos automaticamente com as tabelas)
-- =============================================
-- Nota: Os índices serão removidos automaticamente quando as tabelas forem deletadas

-- =============================================
-- 5. REMOVER TABELAS (ordem inversa para respeitar foreign keys)
-- =============================================

-- Remover tabela de auditoria
DROP TABLE IF EXISTS tenant_data_processing_audit CASCADE;

-- Remover tabela de eventos falhados
DROP TABLE IF EXISTS tenant_data_processing_failed_events CASCADE;

-- Remover tabela de métricas
DROP TABLE IF EXISTS tenant_data_processing_metrics CASCADE;

-- Remover tabela de configuração
DROP TABLE IF EXISTS tenant_data_processing_config CASCADE;

-- Remover tabela de log
DROP TABLE IF EXISTS tenant_data_processing_log CASCADE;

-- Remover tabela principal de eventos
DROP TABLE IF EXISTS tenant_data_processing_events CASCADE;

-- =============================================
-- 6. VERIFICAR SE EXISTEM OUTRAS DEPENDÊNCIAS
-- =============================================

-- Verificar se existem views que dependem das tabelas removidas
DO $$
DECLARE
    view_record RECORD;
BEGIN
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE definition LIKE '%tenant_data_processing_%'
    LOOP
        RAISE NOTICE 'ATENÇÃO: View %.% pode ter dependências das tabelas removidas', 
                     view_record.schemaname, view_record.viewname;
    END LOOP;
END $$;

-- Verificar se existem funções que dependem das tabelas removidas
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT n.nspname as schema_name, p.proname as function_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.prosrc LIKE '%tenant_data_processing_%'
    LOOP
        RAISE NOTICE 'ATENÇÃO: Função %.% pode ter dependências das tabelas removidas', 
                     func_record.schema_name, func_record.function_name;
    END LOOP;
END $$;

-- =============================================
-- 7. LIMPEZA DE DADOS RELACIONADOS
-- =============================================

-- Remover configurações relacionadas ao módulo data-processing de outras tabelas
-- (se existirem referências em outras tabelas do sistema)

-- Exemplo: Remover jobs relacionados (se houver tabela de jobs)
-- DELETE FROM system_jobs WHERE job_name LIKE 'banban-data-processing%';

-- Exemplo: Remover permissões relacionadas (se houver tabela de permissões)
-- DELETE FROM permissions WHERE permission_key LIKE 'banban.data-processing%';

-- Exemplo: Remover logs do sistema relacionados (se desejado)
-- DELETE FROM system_logs WHERE module = 'banban-data-processing';

-- =============================================
-- 8. VERIFICAÇÕES FINAIS
-- =============================================

-- Verificar se todas as tabelas foram removidas
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_name LIKE 'tenant_data_processing_%';
    
    IF table_count > 0 THEN
        RAISE EXCEPTION 'Erro: Ainda existem % tabelas relacionadas ao data-processing', table_count;
    ELSE
        RAISE NOTICE 'Sucesso: Todas as tabelas do módulo data-processing foram removidas';
    END IF;
END $$;

-- Verificar se todas as funções foram removidas
DO $$
DECLARE
    function_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname LIKE '%data_processing%';
    
    IF function_count > 0 THEN
        RAISE NOTICE 'Aviso: Ainda existem % funções relacionadas ao data-processing', function_count;
    ELSE
        RAISE NOTICE 'Sucesso: Todas as funções do módulo data-processing foram removidas';
    END IF;
END $$;

-- =============================================
-- 9. LOG DO ROLLBACK
-- =============================================

-- Inserir log do rollback (se existir tabela de logs do sistema)
DO $$
BEGIN
    -- Tentar inserir log se a tabela existir
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_migration_log') THEN
        INSERT INTO system_migration_log (
            migration_name,
            operation,
            status,
            executed_at,
            notes
        ) VALUES (
            'banban_data_processing_001_initial_setup',
            'rollback',
            'completed',
            NOW(),
            'Rollback completo do módulo BanBan Data Processing v2.0.0 - Todas as tabelas, índices, triggers e políticas RLS foram removidos'
        );
        RAISE NOTICE 'Log do rollback inserido na tabela system_migration_log';
    ELSE
        RAISE NOTICE 'Tabela system_migration_log não encontrada - log não inserido';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao inserir log do rollback: %', SQLERRM;
END $$;

-- =============================================
-- 10. MENSAGEM FINAL
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'ROLLBACK CONCLUÍDO COM SUCESSO';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Módulo: BanBan Data Processing v2.0.0';
    RAISE NOTICE 'Data: %', NOW();
    RAISE NOTICE 'Operação: Rollback completo da migração 001_initial_setup';
    RAISE NOTICE '';
    RAISE NOTICE 'TABELAS REMOVIDAS:';
    RAISE NOTICE '- tenant_data_processing_events';
    RAISE NOTICE '- tenant_data_processing_log';
    RAISE NOTICE '- tenant_data_processing_config';
    RAISE NOTICE '- tenant_data_processing_metrics';
    RAISE NOTICE '- tenant_data_processing_failed_events';
    RAISE NOTICE '- tenant_data_processing_audit';
    RAISE NOTICE '';
    RAISE NOTICE 'OUTROS OBJETOS REMOVIDOS:';
    RAISE NOTICE '- Todos os índices relacionados';
    RAISE NOTICE '- Todos os triggers relacionados';
    RAISE NOTICE '- Todas as funções de trigger relacionadas';
    RAISE NOTICE '- Todas as políticas RLS relacionadas';
    RAISE NOTICE '';
    RAISE NOTICE 'ATENÇÃO: Todos os dados do módulo foram perdidos!';
    RAISE NOTICE '==============================================';
END $$;

COMMIT;

-- Fim do rollback 
-- Rollback da Migração Inicial - BanBan Data Processing Module v2.0.0
-- Data: 2024-12-19
-- Descrição: Rollback completo e seguro de todas as alterações
-- =============================================

-- IMPORTANTE: Este rollback deve ser executado com extrema cautela
-- pois resultará na perda de todos os dados do módulo data-processing

BEGIN;

-- =============================================
-- 1. REMOVER POLÍTICAS RLS
-- =============================================
DROP POLICY IF EXISTS tenant_data_processing_events_tenant_isolation ON tenant_data_processing_events;
DROP POLICY IF EXISTS tenant_data_processing_log_tenant_isolation ON tenant_data_processing_log;
DROP POLICY IF EXISTS tenant_data_processing_config_tenant_isolation ON tenant_data_processing_config;
DROP POLICY IF EXISTS tenant_data_processing_metrics_tenant_isolation ON tenant_data_processing_metrics;
DROP POLICY IF EXISTS tenant_data_processing_failed_events_tenant_isolation ON tenant_data_processing_failed_events;
DROP POLICY IF EXISTS tenant_data_processing_audit_tenant_isolation ON tenant_data_processing_audit;

-- =============================================
-- 2. REMOVER TRIGGERS
-- =============================================
DROP TRIGGER IF EXISTS trigger_update_tenant_data_processing_events_updated_at ON tenant_data_processing_events;
DROP TRIGGER IF EXISTS trigger_update_tenant_data_processing_config_updated_at ON tenant_data_processing_config;
DROP TRIGGER IF EXISTS trigger_update_tenant_data_processing_failed_events_updated_at ON tenant_data_processing_failed_events;

-- =============================================
-- 3. REMOVER FUNÇÕES DE TRIGGER
-- =============================================
DROP FUNCTION IF EXISTS update_tenant_data_processing_events_updated_at();
DROP FUNCTION IF EXISTS update_tenant_data_processing_config_updated_at();
DROP FUNCTION IF EXISTS update_tenant_data_processing_failed_events_updated_at();

-- =============================================
-- 4. REMOVER ÍNDICES (serão removidos automaticamente com as tabelas)
-- =============================================
-- Nota: Os índices serão removidos automaticamente quando as tabelas forem deletadas

-- =============================================
-- 5. REMOVER TABELAS (ordem inversa para respeitar foreign keys)
-- =============================================

-- Remover tabela de auditoria
DROP TABLE IF EXISTS tenant_data_processing_audit CASCADE;

-- Remover tabela de eventos falhados
DROP TABLE IF EXISTS tenant_data_processing_failed_events CASCADE;

-- Remover tabela de métricas
DROP TABLE IF EXISTS tenant_data_processing_metrics CASCADE;

-- Remover tabela de configuração
DROP TABLE IF EXISTS tenant_data_processing_config CASCADE;

-- Remover tabela de log
DROP TABLE IF EXISTS tenant_data_processing_log CASCADE;

-- Remover tabela principal de eventos
DROP TABLE IF EXISTS tenant_data_processing_events CASCADE;

-- =============================================
-- 6. VERIFICAR SE EXISTEM OUTRAS DEPENDÊNCIAS
-- =============================================

-- Verificar se existem views que dependem das tabelas removidas
DO $$
DECLARE
    view_record RECORD;
BEGIN
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE definition LIKE '%tenant_data_processing_%'
    LOOP
        RAISE NOTICE 'ATENÇÃO: View %.% pode ter dependências das tabelas removidas', 
                     view_record.schemaname, view_record.viewname;
    END LOOP;
END $$;

-- Verificar se existem funções que dependem das tabelas removidas
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT n.nspname as schema_name, p.proname as function_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.prosrc LIKE '%tenant_data_processing_%'
    LOOP
        RAISE NOTICE 'ATENÇÃO: Função %.% pode ter dependências das tabelas removidas', 
                     func_record.schema_name, func_record.function_name;
    END LOOP;
END $$;

-- =============================================
-- 7. LIMPEZA DE DADOS RELACIONADOS
-- =============================================

-- Remover configurações relacionadas ao módulo data-processing de outras tabelas
-- (se existirem referências em outras tabelas do sistema)

-- Exemplo: Remover jobs relacionados (se houver tabela de jobs)
-- DELETE FROM system_jobs WHERE job_name LIKE 'banban-data-processing%';

-- Exemplo: Remover permissões relacionadas (se houver tabela de permissões)
-- DELETE FROM permissions WHERE permission_key LIKE 'banban.data-processing%';

-- Exemplo: Remover logs do sistema relacionados (se desejado)
-- DELETE FROM system_logs WHERE module = 'banban-data-processing';

-- =============================================
-- 8. VERIFICAÇÕES FINAIS
-- =============================================

-- Verificar se todas as tabelas foram removidas
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_name LIKE 'tenant_data_processing_%';
    
    IF table_count > 0 THEN
        RAISE EXCEPTION 'Erro: Ainda existem % tabelas relacionadas ao data-processing', table_count;
    ELSE
        RAISE NOTICE 'Sucesso: Todas as tabelas do módulo data-processing foram removidas';
    END IF;
END $$;

-- Verificar se todas as funções foram removidas
DO $$
DECLARE
    function_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname LIKE '%data_processing%';
    
    IF function_count > 0 THEN
        RAISE NOTICE 'Aviso: Ainda existem % funções relacionadas ao data-processing', function_count;
    ELSE
        RAISE NOTICE 'Sucesso: Todas as funções do módulo data-processing foram removidas';
    END IF;
END $$;

-- =============================================
-- 9. LOG DO ROLLBACK
-- =============================================

-- Inserir log do rollback (se existir tabela de logs do sistema)
DO $$
BEGIN
    -- Tentar inserir log se a tabela existir
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_migration_log') THEN
        INSERT INTO system_migration_log (
            migration_name,
            operation,
            status,
            executed_at,
            notes
        ) VALUES (
            'banban_data_processing_001_initial_setup',
            'rollback',
            'completed',
            NOW(),
            'Rollback completo do módulo BanBan Data Processing v2.0.0 - Todas as tabelas, índices, triggers e políticas RLS foram removidos'
        );
        RAISE NOTICE 'Log do rollback inserido na tabela system_migration_log';
    ELSE
        RAISE NOTICE 'Tabela system_migration_log não encontrada - log não inserido';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao inserir log do rollback: %', SQLERRM;
END $$;

-- =============================================
-- 10. MENSAGEM FINAL
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'ROLLBACK CONCLUÍDO COM SUCESSO';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Módulo: BanBan Data Processing v2.0.0';
    RAISE NOTICE 'Data: %', NOW();
    RAISE NOTICE 'Operação: Rollback completo da migração 001_initial_setup';
    RAISE NOTICE '';
    RAISE NOTICE 'TABELAS REMOVIDAS:';
    RAISE NOTICE '- tenant_data_processing_events';
    RAISE NOTICE '- tenant_data_processing_log';
    RAISE NOTICE '- tenant_data_processing_config';
    RAISE NOTICE '- tenant_data_processing_metrics';
    RAISE NOTICE '- tenant_data_processing_failed_events';
    RAISE NOTICE '- tenant_data_processing_audit';
    RAISE NOTICE '';
    RAISE NOTICE 'OUTROS OBJETOS REMOVIDOS:';
    RAISE NOTICE '- Todos os índices relacionados';
    RAISE NOTICE '- Todos os triggers relacionados';
    RAISE NOTICE '- Todas as funções de trigger relacionadas';
    RAISE NOTICE '- Todas as políticas RLS relacionadas';
    RAISE NOTICE '';
    RAISE NOTICE 'ATENÇÃO: Todos os dados do módulo foram perdidos!';
    RAISE NOTICE '==============================================';
END $$;

COMMIT;

-- Fim do rollback 