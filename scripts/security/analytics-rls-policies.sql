-- ================================================
-- SCRIPT: Enhanced RLS Policies for Analytics Tables
-- FASE 3 - Database Security Enhancement
-- Data: 2024-03-20
-- ================================================

-- ================================================
-- 1. ENABLE RLS ON ALL ANALYTICS TABLES
-- ================================================

ALTER TABLE IF EXISTS forecast_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projected_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS abc_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS supplier_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS price_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS price_elasticity ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS dynamic_safety_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS promotion_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS metrics_cache ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 2. HELPER FUNCTIONS FOR ANALYTICS ACCESS
-- ================================================

-- Function to check if user has analytics access
CREATE OR REPLACE FUNCTION has_analytics_access()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (
      role IN ('organization_admin', 'master_admin', 'analytics_user')
      OR permissions->>'analytics_access' = 'true'
    )
  );
$$;

-- Function to check if user can modify analytics
CREATE OR REPLACE FUNCTION can_modify_analytics()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (
      role IN ('organization_admin', 'master_admin')
      OR permissions->>'analytics_modify' = 'true'
    )
  );
$$;

-- ================================================
-- 3. POLICIES FOR FORECAST AND COVERAGE TABLES
-- ================================================

-- FORECAST_SALES: Read-only for analytics users, modify for admins
DROP POLICY IF EXISTS "forecast_sales_isolation" ON forecast_sales;
CREATE POLICY "forecast_sales_isolation" ON forecast_sales
  FOR SELECT USING (
    has_analytics_access() AND (
      EXISTS (
        SELECT 1 FROM core_product_variants v
        JOIN core_products p ON v.product_id = p.id
        WHERE v.id = forecast_sales.variant_id
        AND p.organization_id = get_user_organization_id()
      )
      OR is_master_admin()
    )
  );

CREATE POLICY "forecast_sales_modify" ON forecast_sales
  FOR ALL USING (
    can_modify_analytics() AND (
      EXISTS (
        SELECT 1 FROM core_product_variants v
        JOIN core_products p ON v.product_id = p.id
        WHERE v.id = forecast_sales.variant_id
        AND p.organization_id = get_user_organization_id()
      )
      OR is_master_admin()
    )
  );

-- PROJECTED_COVERAGE: Similar to forecast_sales
DROP POLICY IF EXISTS "projected_coverage_isolation" ON projected_coverage;
CREATE POLICY "projected_coverage_isolation" ON projected_coverage
  FOR SELECT USING (
    has_analytics_access() AND (
      EXISTS (
        SELECT 1 FROM core_product_variants v
        JOIN core_products p ON v.product_id = p.id
        WHERE v.id = projected_coverage.variant_id
        AND p.organization_id = get_user_organization_id()
      )
      OR is_master_admin()
    )
  );

CREATE POLICY "projected_coverage_modify" ON projected_coverage
  FOR ALL USING (
    can_modify_analytics() AND (
      EXISTS (
        SELECT 1 FROM core_product_variants v
        JOIN core_products p ON v.product_id = p.id
        WHERE v.id = projected_coverage.variant_id
        AND p.organization_id = get_user_organization_id()
      )
      OR is_master_admin()
    )
  );

-- ================================================
-- 4. POLICIES FOR ANALYSIS TABLES
-- ================================================

-- ABC_ANALYSIS: Organization isolation with analytics access
DROP POLICY IF EXISTS "abc_analysis_isolation" ON abc_analysis;
CREATE POLICY "abc_analysis_isolation" ON abc_analysis
  FOR SELECT USING (
    has_analytics_access() AND (
      EXISTS (
        SELECT 1 FROM core_product_variants v
        JOIN core_products p ON v.product_id = p.id
        WHERE v.id = abc_analysis.variant_id
        AND p.organization_id = get_user_organization_id()
      )
      OR is_master_admin()
    )
  );

CREATE POLICY "abc_analysis_modify" ON abc_analysis
  FOR ALL USING (
    can_modify_analytics() AND (
      EXISTS (
        SELECT 1 FROM core_product_variants v
        JOIN core_products p ON v.product_id = p.id
        WHERE v.id = abc_analysis.variant_id
        AND p.organization_id = get_user_organization_id()
      )
      OR is_master_admin()
    )
  );

-- ================================================
-- 5. POLICIES FOR PRICING TABLES
-- ================================================

-- PRICE_SIMULATIONS: Strict access control
DROP POLICY IF EXISTS "price_simulations_isolation" ON price_simulations;
CREATE POLICY "price_simulations_isolation" ON price_simulations
  FOR SELECT USING (
    has_analytics_access() AND (
      EXISTS (
        SELECT 1 FROM core_product_variants v
        JOIN core_products p ON v.product_id = p.id
        WHERE v.id = price_simulations.variant_id
        AND p.organization_id = get_user_organization_id()
      )
      OR is_master_admin()
    )
  );

CREATE POLICY "price_simulations_modify" ON price_simulations
  FOR ALL USING (
    can_modify_analytics() AND (
      EXISTS (
        SELECT 1 FROM core_product_variants v
        JOIN core_products p ON v.product_id = p.id
        WHERE v.id = price_simulations.variant_id
        AND p.organization_id = get_user_organization_id()
      )
      OR is_master_admin()
    )
  );

-- PRICE_ELASTICITY: Similar to price_simulations
DROP POLICY IF EXISTS "price_elasticity_isolation" ON price_elasticity;
CREATE POLICY "price_elasticity_isolation" ON price_elasticity
  FOR SELECT USING (
    has_analytics_access() AND (
      EXISTS (
        SELECT 1 FROM core_product_variants v
        JOIN core_products p ON v.product_id = p.id
        WHERE v.id = price_elasticity.variant_id
        AND p.organization_id = get_user_organization_id()
      )
      OR is_master_admin()
    )
  );

CREATE POLICY "price_elasticity_modify" ON price_elasticity
  FOR ALL USING (
    can_modify_analytics() AND (
      EXISTS (
        SELECT 1 FROM core_product_variants v
        JOIN core_products p ON v.product_id = p.id
        WHERE v.id = price_elasticity.variant_id
        AND p.organization_id = get_user_organization_id()
      )
      OR is_master_admin()
    )
  );

-- ================================================
-- 6. POLICIES FOR CONFIGURATION TABLES
-- ================================================

-- ANALYTICS_CONFIG: Organization-level configuration
DROP POLICY IF EXISTS "analytics_config_isolation" ON analytics_config;
CREATE POLICY "analytics_config_isolation" ON analytics_config
  FOR SELECT USING (
    has_analytics_access() AND (
      organization_id = get_user_organization_id()
      OR is_master_admin()
    )
  );

CREATE POLICY "analytics_config_modify" ON analytics_config
  FOR ALL USING (
    can_modify_analytics() AND (
      organization_id = get_user_organization_id()
      OR is_master_admin()
    )
  );

-- METRICS_CACHE: Shared within organization
DROP POLICY IF EXISTS "metrics_cache_isolation" ON metrics_cache;
CREATE POLICY "metrics_cache_isolation" ON metrics_cache
  FOR SELECT USING (
    has_analytics_access() AND (
      -- Cache is shared within organization for performance
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND organization_id = get_user_organization_id()
      )
      OR is_master_admin()
    )
  );

CREATE POLICY "metrics_cache_modify" ON metrics_cache
  FOR ALL USING (
    can_modify_analytics() AND (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND organization_id = get_user_organization_id()
      )
      OR is_master_admin()
    )
  );

-- ================================================
-- 7. SERVICE ROLE ACCESS
-- ================================================

-- Allow service role to manage analytics data
CREATE POLICY "service_role_analytics_access" ON analytics_config
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_role_metrics_cache_access" ON metrics_cache
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ================================================
-- 8. VERIFY POLICIES
-- ================================================

-- List all analytics-related policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'forecast_sales',
    'projected_coverage',
    'abc_analysis',
    'price_simulations',
    'price_elasticity',
    'analytics_config',
    'metrics_cache'
)
ORDER BY tablename, policyname; 