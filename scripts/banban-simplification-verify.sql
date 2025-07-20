-- BanBan Simplification Verification Script
-- Phase 5: Verify migration and cleanup success
-- Date: 2025-01-03

-- ============================================================================
-- VERIFICATION REPORT: BanBan Simplification Phase 5
-- ============================================================================

\echo '🔍 BANBAN SIMPLIFICATION VERIFICATION REPORT'
\echo '=============================================='
\echo ''

-- ============================================================================
-- 1. Migration Status Check
-- ============================================================================

\echo '📋 1. MIGRATION STATUS'
\echo '---------------------'

SELECT 
  action,
  resource_id,
  new_values->>'description' as description,
  created_at
FROM audit_logs 
WHERE action IN ('BANBAN_SIMPLIFICATION_MIGRATION', 'BANBAN_SIMPLIFICATION_CLEANUP')
ORDER BY created_at;

\echo ''

-- ============================================================================
-- 2. Table Count Analysis  
-- ============================================================================

\echo '📊 2. TABLE COUNT ANALYSIS'
\echo '--------------------------'

-- Current table count
SELECT 
  'Current Total Tables' as metric,
  COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public'

UNION ALL

-- Generic tables count
SELECT 
  'Generic Tables (tenant_business_*)' as metric,
  COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'tenant_business_%'

UNION ALL

-- Remaining specialized tables
SELECT 
  'Remaining Specialized Tables' as metric,
  COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE ANY(ARRAY['analytics_%', 'performance_%', 'forecast_%', 'mart_%']);

\echo ''

-- ============================================================================
-- 3. Migrated Data Verification
-- ============================================================================

\echo '📁 3. MIGRATED DATA VERIFICATION'
\echo '--------------------------------'

-- Check migrated transactions by type
SELECT 
  transaction_type,
  COUNT(*) as record_count,
  business_data->>'migrated_from' as source_table,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record
FROM tenant_business_transactions 
WHERE business_data ? 'migrated_from'
GROUP BY transaction_type, business_data->>'migrated_from'
ORDER BY transaction_type;

\echo ''

-- Check migrated entities by type
SELECT 
  entity_type,
  COUNT(*) as record_count,
  properties->>'migrated_from' as source_table,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record
FROM tenant_business_entities 
WHERE properties ? 'migrated_from'
GROUP BY entity_type, properties->>'migrated_from'
ORDER BY entity_type;

\echo ''

-- ============================================================================
-- 4. Data Integrity Check
-- ============================================================================

\echo '🔐 4. DATA INTEGRITY CHECK'
\echo '--------------------------'

-- Check for orphaned records
SELECT 
  'tenant_business_entities' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as with_org_id,
  COUNT(*) FILTER (WHERE organization_id IS NULL) as orphaned_records
FROM tenant_business_entities

UNION ALL

SELECT 
  'tenant_business_transactions' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as with_org_id,
  COUNT(*) FILTER (WHERE organization_id IS NULL) as orphaned_records
FROM tenant_business_transactions;

\echo ''

-- ============================================================================
-- 5. Performance Impact Analysis
-- ============================================================================

\echo '⚡ 5. PERFORMANCE IMPACT ANALYSIS'
\echo '--------------------------------'

-- Table sizes analysis
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename LIKE ANY(ARRAY['tenant_business_%', 'organizations', 'profiles'])
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

\echo ''

-- ============================================================================
-- 6. Module System Status
-- ============================================================================

\echo '🧩 6. MODULE SYSTEM STATUS'
\echo '--------------------------'

-- Check module status after cleanup
SELECT 
  slug,
  name,
  maturity_status,
  category,
  updated_at
FROM core_modules 
WHERE slug LIKE 'banban%'
ORDER BY slug;

\echo ''

-- Organization modules status
SELECT 
  om.module_id,
  om.module_name,
  om.status,
  om.health_status,
  COUNT(*) as organization_count
FROM organization_modules om
WHERE om.module_id LIKE 'banban%'
GROUP BY om.module_id, om.module_name, om.status, om.health_status
ORDER BY om.module_id;

\echo ''

-- ============================================================================
-- 7. Widget System Status
-- ============================================================================

\echo '🎛️ 7. WIDGET SYSTEM STATUS'
\echo '---------------------------'

-- Check remaining widgets
SELECT 
  name,
  widget_type,
  created_at
FROM dashboard_widgets
ORDER BY created_at DESC;

\echo ''

-- Widget type distribution
SELECT 
  widget_type,
  COUNT(*) as count
FROM dashboard_widgets
GROUP BY widget_type
ORDER BY count DESC;

\echo ''

-- ============================================================================
-- 8. Business Logic Validation
-- ============================================================================

\echo '🏢 8. BUSINESS LOGIC VALIDATION'
\echo '-------------------------------'

-- Sample migrated analytics data
SELECT 
  'Sample Analytics Data' as data_type,
  COUNT(*) as total_records,
  COUNT(DISTINCT organization_id) as organizations,
  array_agg(DISTINCT business_data->>'migrated_from') as source_tables
FROM tenant_business_transactions 
WHERE transaction_type IN ('ANALYTICS_DATA_POINT', 'ANALYTICS_METRIC')
  AND business_data ? 'migrated_from';

\echo ''

-- Sample migrated forecast data
SELECT 
  'Sample Forecast Data' as data_type,
  COUNT(*) as total_records,
  COUNT(DISTINCT business_data->>'variant_id') as unique_variants,
  MIN((business_data->>'forecast_date')::date) as earliest_forecast,
  MAX((business_data->>'forecast_date')::date) as latest_forecast
FROM tenant_business_transactions 
WHERE transaction_type = 'FORECAST_PREDICTION'
  AND business_data ? 'migrated_from';

\echo ''

-- ============================================================================
-- 9. Summary & Recommendations
-- ============================================================================

\echo '📋 9. SUMMARY & RECOMMENDATIONS'
\echo '-------------------------------'

-- Generate summary statistics
WITH migration_stats AS (
  SELECT 
    COUNT(DISTINCT CASE WHEN properties ? 'migrated_from' THEN 1 END) as migrated_entities,
    COUNT(*) as total_entities
  FROM tenant_business_entities
),
transaction_stats AS (
  SELECT 
    COUNT(DISTINCT CASE WHEN business_data ? 'migrated_from' THEN 1 END) as migrated_transactions,
    COUNT(*) as total_transactions
  FROM tenant_business_transactions
),
table_stats AS (
  SELECT 
    COUNT(*) FILTER (WHERE tablename LIKE 'tenant_business_%') as generic_tables,
    COUNT(*) FILTER (WHERE tablename LIKE ANY(ARRAY['analytics_%', 'performance_%', 'forecast_%', 'mart_%'])) as specialized_tables_remaining,
    COUNT(*) as total_tables
  FROM pg_tables 
  WHERE schemaname = 'public'
)
SELECT 
  'Migration Success Rate' as metric,
  ROUND(
    (ms.migrated_entities + ts.migrated_transactions) * 100.0 / 
    NULLIF(ms.total_entities + ts.total_transactions, 0), 
    2
  ) || '%' as value
FROM migration_stats ms, transaction_stats ts, table_stats tbs

UNION ALL

SELECT 
  'Table Reduction',
  CASE 
    WHEN tbs.specialized_tables_remaining = 0 
    THEN '✅ All specialized tables removed'
    ELSE '⚠️ ' || tbs.specialized_tables_remaining || ' specialized tables remain'
  END as value
FROM table_stats tbs

UNION ALL

SELECT 
  'Generic Tables Active',
  tbs.generic_tables::text || ' tables'
FROM table_stats tbs;

\echo ''
\echo '=============================================='
\echo '✅ BanBan Simplification Phase 5 Complete'
\echo '=============================================='
\echo ''
\echo 'Next Steps:'
\echo '1. Validate application functionality'
\echo '2. Run performance tests'
\echo '3. Update documentation'
\echo '4. Deploy to production'
\echo ''