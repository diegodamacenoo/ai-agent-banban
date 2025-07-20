-- ================================================
-- SCRIPT: Phase 3 RLS Policies Implementation
-- Data: 2024-03-21
-- ================================================

-- ================================================
-- 1. ENABLE RLS ON CRITICAL TABLES
-- ================================================

ALTER TABLE IF EXISTS organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_known_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 2. HELPER FUNCTIONS
-- ================================================

-- Function to get user's organization ID
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

-- Function to check if user can manage organization settings
CREATE OR REPLACE FUNCTION can_manage_organization_settings()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE id = auth.uid() 
        AND (
            role IN ('organization_admin', 'master_admin')
            OR permissions->>'manage_settings' = 'true'
        )
    );
END;
$$;

-- Function to check if user can view audit logs
CREATE OR REPLACE FUNCTION can_view_audit_logs()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE id = auth.uid() 
        AND (
            role IN ('organization_admin', 'master_admin', 'security_admin')
            OR permissions->>'view_audit_logs' = 'true'
        )
    );
END;
$$;

-- ================================================
-- 3. ORGANIZATIONS TABLE POLICIES
-- ================================================

-- Policy for viewing organization
DROP POLICY IF EXISTS "organizations_view_policy" ON organizations;
CREATE POLICY "organizations_view_policy" ON organizations
    FOR SELECT
    USING (
        -- Users can view their own organization or master_admin can view all
        id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'master_admin'
        )
    );

-- Policy for managing organization
DROP POLICY IF EXISTS "organizations_manage_policy" ON organizations;
CREATE POLICY "organizations_manage_policy" ON organizations
    FOR ALL
    USING (
        -- Only organization admins can manage their org, master_admin can manage all
        id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
        AND can_manage_organization_settings()
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'master_admin'
        )
    );

-- ================================================
-- 4. PROFILES TABLE POLICIES
-- ================================================

-- Policy for viewing profiles
DROP POLICY IF EXISTS "profiles_view_policy" ON profiles;
CREATE POLICY "profiles_view_policy" ON profiles
    FOR SELECT
    USING (
        -- Users can view profiles from their organization
        organization_id = get_user_organization_id()
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'master_admin'
        )
    );

-- Policy for managing profiles
DROP POLICY IF EXISTS "profiles_manage_policy" ON profiles;
CREATE POLICY "profiles_manage_policy" ON profiles
    FOR ALL
    USING (
        -- Only admins can manage profiles
        organization_id = get_user_organization_id()
        AND can_manage_organization_settings()
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'master_admin'
        )
    );

-- ================================================
-- 5. USER_KNOWN_DEVICES TABLE POLICIES
-- ================================================

-- Policy for viewing devices
DROP POLICY IF EXISTS "devices_view_policy" ON user_known_devices;
CREATE POLICY "devices_view_policy" ON user_known_devices
    FOR SELECT
    USING (
        -- Users can view their own devices, admins can view all devices in their org
        user_id = auth.uid()
        OR (
            EXISTS (
                SELECT 1 FROM profiles p1
                WHERE p1.id = auth.uid()
                AND p1.role IN ('organization_admin', 'master_admin')
                AND EXISTS (
                    SELECT 1 FROM profiles p2
                    WHERE p2.id = user_known_devices.user_id
                    AND p2.organization_id = p1.organization_id
                )
            )
        )
    );

-- Policy for managing devices
DROP POLICY IF EXISTS "devices_manage_policy" ON user_known_devices;
CREATE POLICY "devices_manage_policy" ON user_known_devices
    FOR INSERT
    WITH CHECK (
        -- Users can only add their own devices
        user_id = auth.uid()
    );

-- Policy for updating devices
DROP POLICY IF EXISTS "devices_update_policy" ON user_known_devices;
CREATE POLICY "devices_update_policy" ON user_known_devices
    FOR UPDATE
    USING (
        -- Users can update their own devices, admins can update all in their org
        user_id = auth.uid()
        OR (
            EXISTS (
                SELECT 1 FROM profiles p1
                WHERE p1.id = auth.uid()
                AND p1.role IN ('organization_admin', 'master_admin')
                AND EXISTS (
                    SELECT 1 FROM profiles p2
                    WHERE p2.id = user_known_devices.user_id
                    AND p2.organization_id = p1.organization_id
                )
            )
        )
    );

-- ================================================
-- 6. AUDIT_LOGS TABLE POLICIES
-- ================================================

-- Policy for viewing audit logs
DROP POLICY IF EXISTS "audit_logs_view_policy" ON audit_logs;
CREATE POLICY "audit_logs_view_policy" ON audit_logs
    FOR SELECT
    USING (
        -- Only users with audit log access can view logs from their organization
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.organization_id = audit_logs.organization_id
            AND can_view_audit_logs()
        )
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'master_admin'
        )
    );

-- Policy for creating audit logs
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON audit_logs
    FOR INSERT
    WITH CHECK (
        -- System can create logs for any organization
        -- Regular users can only create logs for their organization
        organization_id = (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
        OR auth.uid() IS NULL
    );

-- ================================================
-- 7. INDEXES FOR OPTIMIZATION
-- ================================================

-- Organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_id ON organizations(id);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- User known devices indexes
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON user_known_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_organization_id ON user_known_devices(organization_id);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);

-- ================================================
-- 8. VALIDATION QUERIES
-- ================================================

-- Test organization policies
SELECT has_table_privilege('authenticated', 'organizations', 'SELECT');
SELECT has_table_privilege('authenticated', 'organizations', 'INSERT');
SELECT has_table_privilege('authenticated', 'organizations', 'UPDATE');

-- Test profiles policies
SELECT has_table_privilege('authenticated', 'profiles', 'SELECT');
SELECT has_table_privilege('authenticated', 'profiles', 'INSERT');
SELECT has_table_privilege('authenticated', 'profiles', 'UPDATE');

-- Test devices policies
SELECT has_table_privilege('authenticated', 'user_known_devices', 'SELECT');
SELECT has_table_privilege('authenticated', 'user_known_devices', 'INSERT');
SELECT has_table_privilege('authenticated', 'user_known_devices', 'UPDATE');

-- Test audit logs policies
SELECT has_table_privilege('authenticated', 'audit_logs', 'SELECT');
SELECT has_table_privilege('authenticated', 'audit_logs', 'INSERT'); 