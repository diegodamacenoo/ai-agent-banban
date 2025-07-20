-- ================================================
-- BANBAN PERFORMANCE MODULE - ROLLBACK MIGRATION 001
-- ================================================
-- Migration Rollback: 001_rollback.sql
-- Description: Rollback completo da migration inicial do módulo de performance BanBan
-- Author: BanBan Development Team
-- Created: 2025-01-03
-- Version: 2.1.0

-- ================================================
-- ROLLBACK CONFIRMATION
-- ================================================

DO $$
BEGIN
    RAISE NOTICE 'Starting rollback of BanBan Performance Module migration 001_initial_setup';
    RAISE NOTICE 'This will remove all tables, functions, triggers, and policies created by the migration';
    RAISE WARNING 'ALL DATA IN PERFORMANCE TABLES WILL BE LOST!';
END $$;

-- ================================================
-- DROP TRIGGERS
-- ================================================

-- Drop triggers first to avoid dependency issues
DROP TRIGGER IF EXISTS trigger_update_tenant_performance_metrics_updated_at ON tenant_performance_metrics;
DROP TRIGGER IF EXISTS trigger_update_tenant_performance_cache_updated_at ON tenant_performance_cache;
DROP TRIGGER IF EXISTS trigger_update_tenant_performance_config_updated_at ON tenant_performance_config;
DROP TRIGGER IF EXISTS trigger_update_tenant_performance_alerts_updated_at ON tenant_performance_alerts;

-- ================================================
-- DROP FUNCTIONS
-- ================================================

-- Drop trigger functions
DROP FUNCTION IF EXISTS update_tenant_performance_metrics_updated_at();
DROP FUNCTION IF EXISTS update_tenant_performance_cache_updated_at();
DROP FUNCTION IF EXISTS update_tenant_performance_config_updated_at();
DROP FUNCTION IF EXISTS update_tenant_performance_alerts_updated_at();

-- Drop utility functions
DROP FUNCTION IF EXISTS cleanup_expired_performance_cache();
DROP FUNCTION IF EXISTS calculate_performance_metrics(UUID, VARCHAR(50), TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);

-- ================================================
-- DROP RLS POLICIES
-- ================================================

-- Drop RLS policies for all tables
DROP POLICY IF EXISTS "tenant_performance_metrics_tenant_isolation" ON tenant_performance_metrics;
DROP POLICY IF EXISTS "tenant_performance_cache_tenant_isolation" ON tenant_performance_cache;
DROP POLICY IF EXISTS "tenant_performance_config_tenant_isolation" ON tenant_performance_config;
DROP POLICY IF EXISTS "tenant_performance_alerts_tenant_isolation" ON tenant_performance_alerts;

-- ================================================
-- DROP INDEXES
-- ================================================

-- Drop indexes for tenant_performance_metrics
DROP INDEX IF EXISTS idx_tenant_performance_metrics_tenant_id;
DROP INDEX IF EXISTS idx_tenant_performance_metrics_type_period;
DROP INDEX IF EXISTS idx_tenant_performance_metrics_dimension;
DROP INDEX IF EXISTS idx_tenant_performance_metrics_created_at;

-- Drop indexes for tenant_performance_cache
DROP INDEX IF EXISTS idx_tenant_performance_cache_tenant_key;
DROP INDEX IF EXISTS idx_tenant_performance_cache_expires_at;
DROP INDEX IF EXISTS idx_tenant_performance_cache_type;

-- Drop indexes for tenant_performance_config
DROP INDEX IF EXISTS idx_tenant_performance_config_tenant_id;
DROP INDEX IF EXISTS idx_tenant_performance_config_section;
DROP INDEX IF EXISTS idx_tenant_performance_config_active;

-- Drop indexes for tenant_performance_alerts
DROP INDEX IF EXISTS idx_tenant_performance_alerts_tenant_id;
DROP INDEX IF EXISTS idx_tenant_performance_alerts_type_level;
DROP INDEX IF EXISTS idx_tenant_performance_alerts_status;
DROP INDEX IF EXISTS idx_tenant_performance_alerts_created_at;

-- ================================================
-- REVOKE GRANTS
-- ================================================

-- Revoke permissions from authenticated users
REVOKE ALL ON tenant_performance_metrics FROM authenticated;
REVOKE ALL ON tenant_performance_cache FROM authenticated;
REVOKE ALL ON tenant_performance_config FROM authenticated;
REVOKE ALL ON tenant_performance_alerts FROM authenticated;

-- Revoke permissions from service role
REVOKE ALL ON tenant_performance_metrics FROM service_role;
REVOKE ALL ON tenant_performance_cache FROM service_role;
REVOKE ALL ON tenant_performance_config FROM service_role;
REVOKE ALL ON tenant_performance_alerts FROM service_role;

-- ================================================
-- DROP TABLES
-- ================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS tenant_performance_alerts CASCADE;
DROP TABLE IF EXISTS tenant_performance_config CASCADE;
DROP TABLE IF EXISTS tenant_performance_cache CASCADE;
DROP TABLE IF EXISTS tenant_performance_metrics CASCADE;

-- ================================================
-- CLEANUP VERIFICATION
-- ================================================

-- Verify all objects have been dropped
DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    trigger_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Check for remaining tables
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_name LIKE 'tenant_performance_%' 
    AND table_schema = 'public';
    
    -- Check for remaining functions
    SELECT COUNT(*) INTO function_count 
    FROM information_schema.routines 
    WHERE routine_name LIKE '%tenant_performance_%' 
    AND routine_schema = 'public';
    
    -- Check for remaining triggers
    SELECT COUNT(*) INTO trigger_count 
    FROM information_schema.triggers 
    WHERE trigger_name LIKE '%tenant_performance_%';
    
    -- Check for remaining policies
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE policyname LIKE '%tenant_performance_%';
    
    IF table_count > 0 THEN
        RAISE WARNING 'Warning: % performance tables still exist', table_count;
    END IF;
    
    IF function_count > 0 THEN
        RAISE WARNING 'Warning: % performance functions still exist', function_count;
    END IF;
    
    IF trigger_count > 0 THEN
        RAISE WARNING 'Warning: % performance triggers still exist', trigger_count;
    END IF;
    
    IF policy_count > 0 THEN
        RAISE WARNING 'Warning: % performance policies still exist', policy_count;
    END IF;
    
    IF table_count = 0 AND function_count = 0 AND trigger_count = 0 AND policy_count = 0 THEN
        RAISE NOTICE 'Rollback completed successfully - all performance objects removed';
    ELSE
        RAISE WARNING 'Rollback may not be complete - some objects may still exist';
    END IF;
END $$;

-- ================================================
-- ROLLBACK COMPLETE
-- ================================================

DO $$
BEGIN
    RAISE NOTICE 'BanBan Performance Module - Migration 001_initial_setup rollback completed';
    RAISE NOTICE 'Removed tables: tenant_performance_metrics, tenant_performance_cache, tenant_performance_config, tenant_performance_alerts';
    RAISE NOTICE 'Removed all associated indexes, RLS policies, triggers, functions, and permissions';
    RAISE NOTICE 'Module version: 2.1.0';
    RAISE WARNING 'All performance data has been permanently deleted';
END $$; 
-- BANBAN PERFORMANCE MODULE - ROLLBACK MIGRATION 001
-- ================================================
-- Migration Rollback: 001_rollback.sql
-- Description: Rollback completo da migration inicial do módulo de performance BanBan
-- Author: BanBan Development Team
-- Created: 2025-01-03
-- Version: 2.1.0

-- ================================================
-- ROLLBACK CONFIRMATION
-- ================================================

DO $$
BEGIN
    RAISE NOTICE 'Starting rollback of BanBan Performance Module migration 001_initial_setup';
    RAISE NOTICE 'This will remove all tables, functions, triggers, and policies created by the migration';
    RAISE WARNING 'ALL DATA IN PERFORMANCE TABLES WILL BE LOST!';
END $$;

-- ================================================
-- DROP TRIGGERS
-- ================================================

-- Drop triggers first to avoid dependency issues
DROP TRIGGER IF EXISTS trigger_update_tenant_performance_metrics_updated_at ON tenant_performance_metrics;
DROP TRIGGER IF EXISTS trigger_update_tenant_performance_cache_updated_at ON tenant_performance_cache;
DROP TRIGGER IF EXISTS trigger_update_tenant_performance_config_updated_at ON tenant_performance_config;
DROP TRIGGER IF EXISTS trigger_update_tenant_performance_alerts_updated_at ON tenant_performance_alerts;

-- ================================================
-- DROP FUNCTIONS
-- ================================================

-- Drop trigger functions
DROP FUNCTION IF EXISTS update_tenant_performance_metrics_updated_at();
DROP FUNCTION IF EXISTS update_tenant_performance_cache_updated_at();
DROP FUNCTION IF EXISTS update_tenant_performance_config_updated_at();
DROP FUNCTION IF EXISTS update_tenant_performance_alerts_updated_at();

-- Drop utility functions
DROP FUNCTION IF EXISTS cleanup_expired_performance_cache();
DROP FUNCTION IF EXISTS calculate_performance_metrics(UUID, VARCHAR(50), TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);

-- ================================================
-- DROP RLS POLICIES
-- ================================================

-- Drop RLS policies for all tables
DROP POLICY IF EXISTS "tenant_performance_metrics_tenant_isolation" ON tenant_performance_metrics;
DROP POLICY IF EXISTS "tenant_performance_cache_tenant_isolation" ON tenant_performance_cache;
DROP POLICY IF EXISTS "tenant_performance_config_tenant_isolation" ON tenant_performance_config;
DROP POLICY IF EXISTS "tenant_performance_alerts_tenant_isolation" ON tenant_performance_alerts;

-- ================================================
-- DROP INDEXES
-- ================================================

-- Drop indexes for tenant_performance_metrics
DROP INDEX IF EXISTS idx_tenant_performance_metrics_tenant_id;
DROP INDEX IF EXISTS idx_tenant_performance_metrics_type_period;
DROP INDEX IF EXISTS idx_tenant_performance_metrics_dimension;
DROP INDEX IF EXISTS idx_tenant_performance_metrics_created_at;

-- Drop indexes for tenant_performance_cache
DROP INDEX IF EXISTS idx_tenant_performance_cache_tenant_key;
DROP INDEX IF EXISTS idx_tenant_performance_cache_expires_at;
DROP INDEX IF EXISTS idx_tenant_performance_cache_type;

-- Drop indexes for tenant_performance_config
DROP INDEX IF EXISTS idx_tenant_performance_config_tenant_id;
DROP INDEX IF EXISTS idx_tenant_performance_config_section;
DROP INDEX IF EXISTS idx_tenant_performance_config_active;

-- Drop indexes for tenant_performance_alerts
DROP INDEX IF EXISTS idx_tenant_performance_alerts_tenant_id;
DROP INDEX IF EXISTS idx_tenant_performance_alerts_type_level;
DROP INDEX IF EXISTS idx_tenant_performance_alerts_status;
DROP INDEX IF EXISTS idx_tenant_performance_alerts_created_at;

-- ================================================
-- REVOKE GRANTS
-- ================================================

-- Revoke permissions from authenticated users
REVOKE ALL ON tenant_performance_metrics FROM authenticated;
REVOKE ALL ON tenant_performance_cache FROM authenticated;
REVOKE ALL ON tenant_performance_config FROM authenticated;
REVOKE ALL ON tenant_performance_alerts FROM authenticated;

-- Revoke permissions from service role
REVOKE ALL ON tenant_performance_metrics FROM service_role;
REVOKE ALL ON tenant_performance_cache FROM service_role;
REVOKE ALL ON tenant_performance_config FROM service_role;
REVOKE ALL ON tenant_performance_alerts FROM service_role;

-- ================================================
-- DROP TABLES
-- ================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS tenant_performance_alerts CASCADE;
DROP TABLE IF EXISTS tenant_performance_config CASCADE;
DROP TABLE IF EXISTS tenant_performance_cache CASCADE;
DROP TABLE IF EXISTS tenant_performance_metrics CASCADE;

-- ================================================
-- CLEANUP VERIFICATION
-- ================================================

-- Verify all objects have been dropped
DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    trigger_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Check for remaining tables
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_name LIKE 'tenant_performance_%' 
    AND table_schema = 'public';
    
    -- Check for remaining functions
    SELECT COUNT(*) INTO function_count 
    FROM information_schema.routines 
    WHERE routine_name LIKE '%tenant_performance_%' 
    AND routine_schema = 'public';
    
    -- Check for remaining triggers
    SELECT COUNT(*) INTO trigger_count 
    FROM information_schema.triggers 
    WHERE trigger_name LIKE '%tenant_performance_%';
    
    -- Check for remaining policies
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE policyname LIKE '%tenant_performance_%';
    
    IF table_count > 0 THEN
        RAISE WARNING 'Warning: % performance tables still exist', table_count;
    END IF;
    
    IF function_count > 0 THEN
        RAISE WARNING 'Warning: % performance functions still exist', function_count;
    END IF;
    
    IF trigger_count > 0 THEN
        RAISE WARNING 'Warning: % performance triggers still exist', trigger_count;
    END IF;
    
    IF policy_count > 0 THEN
        RAISE WARNING 'Warning: % performance policies still exist', policy_count;
    END IF;
    
    IF table_count = 0 AND function_count = 0 AND trigger_count = 0 AND policy_count = 0 THEN
        RAISE NOTICE 'Rollback completed successfully - all performance objects removed';
    ELSE
        RAISE WARNING 'Rollback may not be complete - some objects may still exist';
    END IF;
END $$;

-- ================================================
-- ROLLBACK COMPLETE
-- ================================================

DO $$
BEGIN
    RAISE NOTICE 'BanBan Performance Module - Migration 001_initial_setup rollback completed';
    RAISE NOTICE 'Removed tables: tenant_performance_metrics, tenant_performance_cache, tenant_performance_config, tenant_performance_alerts';
    RAISE NOTICE 'Removed all associated indexes, RLS policies, triggers, functions, and permissions';
    RAISE NOTICE 'Module version: 2.1.0';
    RAISE WARNING 'All performance data has been permanently deleted';
END $$; 