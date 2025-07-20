-- ================================================
-- ROLLBACK 001: Initial Setup - BanBan Insights Module
-- Description: Remove todas as tabelas e objetos criados na migration 001
-- Author: BanBan Development Team
-- Date: 2025-01-03
-- ================================================

DO $$
BEGIN
    RAISE NOTICE 'Starting rollback of BanBan Insights Module - Migration 001';

    -- ================================================
    -- 1. REMOVER TRIGGERS
    -- ================================================
    
    DROP TRIGGER IF EXISTS update_tenant_insights_config_updated_at ON tenant_insights_config;
    DROP TRIGGER IF EXISTS update_tenant_insights_metrics_updated_at ON tenant_insights_metrics;
    
    RAISE NOTICE 'Dropped triggers';

    -- ================================================
    -- 2. REMOVER TABELAS (ordem reversa devido a dependências)
    -- ================================================
    
    -- Remover tenant_insights_metrics
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'tenant_insights_metrics') THEN
        DROP TABLE tenant_insights_metrics CASCADE;
        RAISE NOTICE 'Dropped table: tenant_insights_metrics';
    END IF;
    
    -- Remover tenant_insights_config
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'tenant_insights_config') THEN
        DROP TABLE tenant_insights_config CASCADE;
        RAISE NOTICE 'Dropped table: tenant_insights_config';
    END IF;
    
    -- Remover tenant_insights_history
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'tenant_insights_history') THEN
        DROP TABLE tenant_insights_history CASCADE;
        RAISE NOTICE 'Dropped table: tenant_insights_history';
    END IF;
    
    -- Remover tenant_insights_cache
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'tenant_insights_cache') THEN
        DROP TABLE tenant_insights_cache CASCADE;
        RAISE NOTICE 'Dropped table: tenant_insights_cache';
    END IF;

    -- ================================================
    -- 3. REMOVER FUNÇÃO (se não for usada por outras tabelas)
    -- ================================================
    
    -- Verificar se a função update_updated_at_column é usada por outras tabelas
    -- Se não for, podemos removê-la (comentado para segurança)
    -- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

    -- ================================================
    -- 4. LIMPEZA FINAL
    -- ================================================
    
    -- Remover dados relacionados de outras tabelas (se existirem)
    -- Por exemplo, remover registros de module_usage_logs
    DELETE FROM module_usage_logs 
    WHERE module_slug = 'banban-insights' 
    AND tenant_id IN (SELECT id FROM organizations);
    
    RAISE NOTICE 'Cleaned up related data';

    RAISE NOTICE 'BanBan Insights Module - Rollback 001 completed successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during rollback: %', SQLERRM;
        RAISE;
        
END $$; 
-- ROLLBACK 001: Initial Setup - BanBan Insights Module
-- Description: Remove todas as tabelas e objetos criados na migration 001
-- Author: BanBan Development Team
-- Date: 2025-01-03
-- ================================================

DO $$
BEGIN
    RAISE NOTICE 'Starting rollback of BanBan Insights Module - Migration 001';

    -- ================================================
    -- 1. REMOVER TRIGGERS
    -- ================================================
    
    DROP TRIGGER IF EXISTS update_tenant_insights_config_updated_at ON tenant_insights_config;
    DROP TRIGGER IF EXISTS update_tenant_insights_metrics_updated_at ON tenant_insights_metrics;
    
    RAISE NOTICE 'Dropped triggers';

    -- ================================================
    -- 2. REMOVER TABELAS (ordem reversa devido a dependências)
    -- ================================================
    
    -- Remover tenant_insights_metrics
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'tenant_insights_metrics') THEN
        DROP TABLE tenant_insights_metrics CASCADE;
        RAISE NOTICE 'Dropped table: tenant_insights_metrics';
    END IF;
    
    -- Remover tenant_insights_config
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'tenant_insights_config') THEN
        DROP TABLE tenant_insights_config CASCADE;
        RAISE NOTICE 'Dropped table: tenant_insights_config';
    END IF;
    
    -- Remover tenant_insights_history
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'tenant_insights_history') THEN
        DROP TABLE tenant_insights_history CASCADE;
        RAISE NOTICE 'Dropped table: tenant_insights_history';
    END IF;
    
    -- Remover tenant_insights_cache
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'tenant_insights_cache') THEN
        DROP TABLE tenant_insights_cache CASCADE;
        RAISE NOTICE 'Dropped table: tenant_insights_cache';
    END IF;

    -- ================================================
    -- 3. REMOVER FUNÇÃO (se não for usada por outras tabelas)
    -- ================================================
    
    -- Verificar se a função update_updated_at_column é usada por outras tabelas
    -- Se não for, podemos removê-la (comentado para segurança)
    -- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

    -- ================================================
    -- 4. LIMPEZA FINAL
    -- ================================================
    
    -- Remover dados relacionados de outras tabelas (se existirem)
    -- Por exemplo, remover registros de module_usage_logs
    DELETE FROM module_usage_logs 
    WHERE module_slug = 'banban-insights' 
    AND tenant_id IN (SELECT id FROM organizations);
    
    RAISE NOTICE 'Cleaned up related data';

    RAISE NOTICE 'BanBan Insights Module - Rollback 001 completed successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during rollback: %', SQLERRM;
        RAISE;
        
END $$; 