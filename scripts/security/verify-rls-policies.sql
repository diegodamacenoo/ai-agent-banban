-- ================================================
-- SCRIPT: Verify and Fix RLS Policies
-- FASE 3 - Database Security Enhancement
-- Data: 2024-03-20
-- ================================================

-- ================================================
-- 1. VERIFY RLS ENABLED ON ALL TABLES
-- ================================================

DO $$
DECLARE
    table_record RECORD;
    rls_disabled_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE '_prisma_%'
    LOOP
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = table_record.tablename 
            AND rowsecurity = true
        ) THEN
            rls_disabled_tables := array_append(rls_disabled_tables, table_record.tablename);
            RAISE NOTICE 'Enabling RLS on table: %', table_record.tablename;
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_record.tablename);
        END IF;
    END LOOP;

    IF array_length(rls_disabled_tables, 1) > 0 THEN
        RAISE NOTICE 'RLS was enabled on the following tables: %', array_to_string(rls_disabled_tables, ', ');
    ELSE
        RAISE NOTICE 'RLS is already enabled on all tables';
    END IF;
END
$$;

-- ================================================
-- 2. VERIFY ESSENTIAL SECURITY FUNCTIONS
-- ================================================

-- Check and create get_user_organization_id if not exists
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

-- Check and create is_organization_admin if not exists
CREATE OR REPLACE FUNCTION is_organization_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('organization_admin', 'master_admin')
  );
$$;

-- Check and create is_master_admin if not exists
CREATE OR REPLACE FUNCTION is_master_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'master_admin'
  );
$$;

-- Check and create can_access_organization if not exists
CREATE OR REPLACE FUNCTION can_access_organization(org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (organization_id = org_id OR role = 'master_admin')
  );
$$;

-- ================================================
-- 3. VERIFY CRITICAL POLICIES
-- ================================================

DO $$
DECLARE
    missing_policies TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Check profiles policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_insert_policy') THEN
        missing_policies := array_append(missing_policies, 'profiles_insert_policy');
    END IF;

    -- Check organizations policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'organization_isolation') THEN
        missing_policies := array_append(missing_policies, 'organization_isolation');
    END IF;

    -- Check audit_logs policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'audit_logs_organization_access') THEN
        missing_policies := array_append(missing_policies, 'audit_logs_organization_access');
    END IF;

    IF array_length(missing_policies, 1) > 0 THEN
        RAISE WARNING 'Missing critical policies: %', array_to_string(missing_policies, ', ');
    ELSE
        RAISE NOTICE 'All critical policies are in place';
    END IF;
END
$$;

-- ================================================
-- 4. VERIFY SECURITY INDEXES
-- ================================================

DO $$
DECLARE
    missing_indexes TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Check critical indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_organization_id') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id)';
        missing_indexes := array_append(missing_indexes, 'idx_profiles_organization_id');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_logs_actor_org') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_org ON audit_logs(actor_user_id, organization_id)';
        missing_indexes := array_append(missing_indexes, 'idx_audit_logs_actor_org');
    END IF;

    IF array_length(missing_indexes, 1) > 0 THEN
        RAISE NOTICE 'Created missing security indexes: %', array_to_string(missing_indexes, ', ');
    ELSE
        RAISE NOTICE 'All critical security indexes are in place';
    END IF;
END
$$;

-- ================================================
-- 5. VERIFY SERVICE ROLE POLICIES
-- ================================================

DO $$
BEGIN
    -- Ensure service role has necessary access
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'service_role_audit_logs') THEN
        CREATE POLICY "service_role_audit_logs" ON audit_logs
            FOR ALL USING (auth.role() = 'service_role')
            WITH CHECK (auth.role() = 'service_role');
        RAISE NOTICE 'Created missing service role policy for audit_logs';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'metrics_cache' AND policyname = 'service_role_metrics_cache') THEN
        CREATE POLICY "service_role_metrics_cache" ON metrics_cache
            FOR ALL USING (auth.role() = 'service_role')
            WITH CHECK (auth.role() = 'service_role');
        RAISE NOTICE 'Created missing service role policy for metrics_cache';
    END IF;
END
$$;

-- ================================================
-- 6. VERIFY RESULTS
-- ================================================

-- List all tables with RLS status
SELECT 
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN 'Enabled' ELSE 'Disabled' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename NOT LIKE 'pg_%'
AND tablename NOT LIKE '_prisma_%'
ORDER BY tablename;

-- List all policies
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
ORDER BY tablename, policyname;

-- List security-related indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND (
    indexname LIKE '%organization%'
    OR indexname LIKE '%user%'
    OR indexname LIKE '%audit%'
    OR indexname LIKE '%security%'
)
ORDER BY tablename, indexname; 