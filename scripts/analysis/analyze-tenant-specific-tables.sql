-- Script de Análise: Tabelas Específicas de Tenant
-- Objetivo: Mapear todas as tabelas que precisam ser refatoradas para o schema genérico
-- Data: 2025-01-14

-- =====================================================
-- 1. ANÁLISE DE TABELAS CORE (ESPECÍFICAS BANBAN)
-- =====================================================

-- Tabelas core identificadas
WITH core_tables AS (
    SELECT 
        schemaname,
        tablename,
        n_tup_ins as total_records,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_records,
        n_dead_tup as dead_records
    FROM pg_stat_user_tables 
    WHERE tablename LIKE 'core_%'
    ORDER BY n_live_tup DESC
)
SELECT 
    'CORE TABLES ANALYSIS' as analysis_type,
    tablename as table_name,
    total_records,
    live_records,
    CASE 
        WHEN tablename = 'core_products' THEN 'products (high priority)'
        WHEN tablename = 'core_suppliers' THEN 'suppliers (high priority)'
        WHEN tablename = 'core_locations' THEN 'locations (high priority)'
        WHEN tablename = 'core_orders' THEN 'orders (medium priority)'
        WHEN tablename = 'core_documents' THEN 'documents (medium priority)'
        WHEN tablename = 'core_movements' THEN 'movements (low priority)'
        WHEN tablename = 'core_product_variants' THEN 'product_variants (high priority)'
        WHEN tablename = 'core_product_pricing' THEN 'product_pricing (medium priority)'
        ELSE 'analyze_manually'
    END as migration_target,
    CASE 
        WHEN live_records > 10000 THEN 'complex'
        WHEN live_records > 1000 THEN 'medium'
        ELSE 'simple'
    END as migration_complexity
FROM core_tables;

-- =====================================================
-- 2. ANÁLISE DE TABELAS TENANT (ESPECÍFICAS POR MÓDULO)
-- =====================================================

WITH tenant_tables AS (
    SELECT 
        schemaname,
        tablename,
        n_tup_ins as total_records,
        n_live_tup as live_records,
        n_dead_tup as dead_records
    FROM pg_stat_user_tables 
    WHERE tablename LIKE 'tenant_%'
    ORDER BY n_live_tup DESC
)
SELECT 
    'TENANT TABLES ANALYSIS' as analysis_type,
    tablename as table_name,
    total_records,
    live_records,
    CASE 
        WHEN tablename LIKE 'tenant_inventory_%' THEN 'inventory_system'
        WHEN tablename LIKE 'tenant_performance_%' THEN 'performance_system'
        WHEN tablename LIKE 'tenant_insights_%' THEN 'insights_system'
        WHEN tablename LIKE 'tenant_data_processing_%' THEN 'data_processing_system'
        WHEN tablename LIKE 'tenant_modules%' THEN 'module_management (keep as-is)'
        WHEN tablename LIKE 'tenant_dashboard_%' THEN 'dashboard_system (keep as-is)'
        ELSE 'analyze_manually'
    END as migration_category,
    CASE 
        WHEN live_records > 5000 THEN 'high_volume'
        WHEN live_records > 500 THEN 'medium_volume'
        ELSE 'low_volume'
    END as data_volume
FROM tenant_tables;

-- =====================================================
-- 3. ANÁLISE DE ESTRUTURA DAS COLUNAS
-- =====================================================

-- Analisar colunas das tabelas core para identificar campos que precisam ser genéricos
SELECT 
    'CORE COLUMNS ANALYSIS' as analysis_type,
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    CASE 
        WHEN c.column_name IN ('id', 'created_at', 'updated_at') THEN 'standard_audit'
        WHEN c.column_name = 'external_id' THEN 'required_generic'
        WHEN c.column_name LIKE '%_name' OR c.column_name = 'name' THEN 'required_generic'
        WHEN c.column_name LIKE '%_id' AND c.column_name != 'id' THEN 'reference_field'
        WHEN c.data_type = 'jsonb' THEN 'flexible_field'
        ELSE 'candidate_for_jsonb'
    END as field_classification
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_name LIKE 'core_%'
    AND t.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- =====================================================
-- 4. ANÁLISE DE RELACIONAMENTOS E DEPENDENCIES
-- =====================================================

-- Identificar chaves estrangeiras que precisam ser atualizadas
SELECT 
    'FOREIGN KEY ANALYSIS' as analysis_type,
    tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_name as target_table,
    ccu.column_name as target_column,
    CASE 
        WHEN tc.table_name LIKE 'core_%' AND ccu.table_name LIKE 'core_%' THEN 'core_to_core'
        WHEN tc.table_name LIKE 'tenant_%' AND ccu.table_name = 'organizations' THEN 'tenant_to_org'
        WHEN tc.table_name LIKE 'core_%' AND ccu.table_name = 'organizations' THEN 'needs_org_id'
        ELSE 'review_manually'
    END as relationship_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (tc.table_name LIKE 'core_%' OR tc.table_name LIKE 'tenant_%');

-- =====================================================
-- 5. ANÁLISE DE CAMPOS JSONB EXISTENTES
-- =====================================================

-- Identificar tabelas que já usam JSONB (padrão a seguir)
SELECT 
    'JSONB USAGE ANALYSIS' as analysis_type,
    table_name,
    column_name,
    'existing_jsonb_pattern' as classification
FROM information_schema.columns
WHERE data_type = 'jsonb'
    AND table_schema = 'public'
    AND (table_name LIKE 'core_%' OR table_name LIKE 'tenant_%')
ORDER BY table_name;

-- =====================================================
-- 6. ANÁLISE DE VOLUME DE DADOS POR ORGANIZAÇÃO
-- =====================================================

-- Verificar se há dados de múltiplas organizações nas tabelas tenant
WITH org_data_distribution AS (
    SELECT 
        'tenant_inventory_items' as table_name,
        tenant_id as organization_id,
        COUNT(*) as record_count
    FROM tenant_inventory_items
    GROUP BY tenant_id
    
    UNION ALL
    
    SELECT 
        'tenant_performance_metrics' as table_name,
        tenant_id as organization_id,
        COUNT(*) as record_count
    FROM tenant_performance_metrics
    GROUP BY tenant_id
    
    UNION ALL
    
    SELECT 
        'tenant_insights_cache' as table_name,
        tenant_id as organization_id,
        COUNT(*) as record_count
    FROM tenant_insights_cache
    GROUP BY tenant_id
)
SELECT 
    'DATA DISTRIBUTION ANALYSIS' as analysis_type,
    table_name,
    COUNT(DISTINCT organization_id) as unique_tenants,
    SUM(record_count) as total_records,
    AVG(record_count) as avg_records_per_tenant,
    MAX(record_count) as max_records_per_tenant
FROM org_data_distribution
GROUP BY table_name
ORDER BY total_records DESC;

-- =====================================================
-- 7. ESTIMATIVA DE COMPLEXIDADE DE MIGRAÇÃO
-- =====================================================

WITH migration_complexity AS (
    SELECT 
        table_name,
        CASE 
            WHEN n_live_tup > 50000 THEN 5
            WHEN n_live_tup > 10000 THEN 4
            WHEN n_live_tup > 1000 THEN 3
            WHEN n_live_tup > 100 THEN 2
            ELSE 1
        END as volume_score,
        CASE 
            WHEN table_name LIKE 'core_%' THEN 3  -- Específico do Banban
            WHEN table_name LIKE 'tenant_%' THEN 2  -- Já tem tenant_id
            ELSE 1
        END as structure_score
    FROM pg_stat_user_tables
    WHERE (table_name LIKE 'core_%' OR table_name LIKE 'tenant_%')
        AND schemaname = 'public'
)
SELECT 
    'MIGRATION COMPLEXITY ESTIMATE' as analysis_type,
    table_name,
    volume_score,
    structure_score,
    (volume_score + structure_score) as total_complexity,
    CASE 
        WHEN (volume_score + structure_score) >= 7 THEN 'HIGH - Need careful planning'
        WHEN (volume_score + structure_score) >= 5 THEN 'MEDIUM - Standard migration'
        ELSE 'LOW - Quick migration'
    END as complexity_level
FROM migration_complexity
ORDER BY total_complexity DESC;

-- =====================================================
-- 8. ANÁLISE DE DEPENDÊNCIAS DE CÓDIGO
-- =====================================================

-- Esta query identifica tabelas que são referenciadas em outras partes do sistema
SELECT 
    'DEPENDENCIES SUMMARY' as analysis_type,
    'Review these tables first' as recommendation,
    string_agg(tablename, ', ') as high_priority_tables
FROM pg_stat_user_tables 
WHERE tablename IN ('core_products', 'core_suppliers', 'core_locations', 'tenant_inventory_items')
    AND schemaname = 'public';

-- =====================================================
-- 9. RESUMO EXECUTIVO
-- =====================================================

SELECT 
    'EXECUTIVE SUMMARY' as section,
    COUNT(CASE WHEN tablename LIKE 'core_%' THEN 1 END) as core_tables_count,
    COUNT(CASE WHEN tablename LIKE 'tenant_%' THEN 1 END) as tenant_tables_count,
    SUM(CASE WHEN tablename LIKE 'core_%' THEN n_live_tup ELSE 0 END) as core_records_total,
    SUM(CASE WHEN tablename LIKE 'tenant_%' THEN n_live_tup ELSE 0 END) as tenant_records_total,
    COUNT(*) as total_tables_to_migrate
FROM pg_stat_user_tables 
WHERE (tablename LIKE 'core_%' OR tablename LIKE 'tenant_%')
    AND schemaname = 'public';

-- Recomendações finais
SELECT 
    'FINAL RECOMMENDATIONS' as section,
    'Start with core_products, core_suppliers, core_locations (Banban specific)' as phase_1,
    'Then migrate tenant_inventory_items, tenant_performance_metrics (high volume)' as phase_2,
    'Finally migrate remaining tenant_* tables (lower volume)' as phase_3,
    'Keep tenant_modules, tenant_dashboard_* as-is (system tables)' as exclusions; 