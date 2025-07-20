-- ================================================
-- SCRIPT: Setup Payload Limits
-- Description: Configures size limits for critical fields
-- ================================================

-- ================================================
-- 1. CREATE CHECK CONSTRAINTS FOR TEXT FIELDS
-- ================================================

-- Organizations table
ALTER TABLE organizations
    ADD CONSTRAINT check_company_legal_name_length 
    CHECK (length(company_legal_name) <= 200),
    ADD CONSTRAINT check_company_trading_name_length 
    CHECK (length(company_trading_name) <= 200),
    ADD CONSTRAINT check_implementation_config_size 
    CHECK (length(implementation_config::text) <= 10000);

-- Profiles table
ALTER TABLE profiles
    ADD CONSTRAINT check_first_name_length 
    CHECK (length(first_name) <= 100),
    ADD CONSTRAINT check_last_name_length 
    CHECK (length(last_name) <= 100),
    ADD CONSTRAINT check_role_length 
    CHECK (length(role) <= 50),
    ADD CONSTRAINT check_permissions_size 
    CHECK (length(permissions::text) <= 5000);

-- User known devices table
ALTER TABLE user_known_devices
    ADD CONSTRAINT check_device_name_length 
    CHECK (length(device_name) <= 100),
    ADD CONSTRAINT check_device_id_length 
    CHECK (length(device_id) <= 100),
    ADD CONSTRAINT check_metadata_size 
    CHECK (length(metadata::text) <= 1000);

-- Audit logs table
ALTER TABLE audit_logs
    ADD CONSTRAINT check_event_type_length 
    CHECK (length(event_type) <= 50),
    ADD CONSTRAINT check_description_length 
    CHECK (length(description) <= 1000),
    ADD CONSTRAINT check_metadata_size 
    CHECK (length(metadata::text) <= 5000);

-- ================================================
-- 2. CREATE TRIGGERS FOR JSON/JSONB VALIDATION
-- ================================================

-- Function to validate JSON size
CREATE OR REPLACE FUNCTION validate_json_size()
RETURNS trigger AS $$
BEGIN
    -- Check if any JSON/JSONB column exceeds size limit
    IF NEW.metadata IS NOT NULL AND 
       length(NEW.metadata::text) > 5000 THEN
        RAISE EXCEPTION 'JSON metadata size exceeds limit of 5000 characters';
    END IF;
    
    IF NEW.implementation_config IS NOT NULL AND 
       length(NEW.implementation_config::text) > 10000 THEN
        RAISE EXCEPTION 'JSON implementation_config size exceeds limit of 10000 characters';
    END IF;
    
    IF NEW.permissions IS NOT NULL AND 
       length(NEW.permissions::text) > 5000 THEN
        RAISE EXCEPTION 'JSON permissions size exceeds limit of 5000 characters';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for JSON validation
CREATE TRIGGER validate_organization_json
    BEFORE INSERT OR UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION validate_json_size();

CREATE TRIGGER validate_profile_json
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_json_size();

CREATE TRIGGER validate_device_json
    BEFORE INSERT OR UPDATE ON user_known_devices
    FOR EACH ROW
    EXECUTE FUNCTION validate_json_size();

CREATE TRIGGER validate_audit_json
    BEFORE INSERT OR UPDATE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION validate_json_size();

-- ================================================
-- 3. CREATE FUNCTION TO VALIDATE ALL CONSTRAINTS
-- ================================================

CREATE OR REPLACE FUNCTION validate_payload_limits()
RETURNS TABLE (
    table_name text,
    constraint_name text,
    is_valid boolean
) AS $$
BEGIN
    -- Check organizations constraints
    RETURN QUERY
    SELECT 'organizations'::text,
           'check_company_legal_name_length'::text,
           NOT EXISTS (
               SELECT 1 FROM organizations 
               WHERE length(company_legal_name) > 200
           );
           
    RETURN QUERY
    SELECT 'organizations'::text,
           'check_implementation_config_size'::text,
           NOT EXISTS (
               SELECT 1 FROM organizations 
               WHERE length(implementation_config::text) > 10000
           );
           
    -- Check profiles constraints
    RETURN QUERY
    SELECT 'profiles'::text,
           'check_name_length'::text,
           NOT EXISTS (
               SELECT 1 FROM profiles 
               WHERE length(first_name) > 100 
                  OR length(last_name) > 100
           );
           
    RETURN QUERY
    SELECT 'profiles'::text,
           'check_permissions_size'::text,
           NOT EXISTS (
               SELECT 1 FROM profiles 
               WHERE length(permissions::text) > 5000
           );
           
    -- Check devices constraints
    RETURN QUERY
    SELECT 'user_known_devices'::text,
           'check_device_info_length'::text,
           NOT EXISTS (
               SELECT 1 FROM user_known_devices 
               WHERE length(device_name) > 100 
                  OR length(device_id) > 100
           );
           
    -- Check audit logs constraints
    RETURN QUERY
    SELECT 'audit_logs'::text,
           'check_audit_content_length'::text,
           NOT EXISTS (
               SELECT 1 FROM audit_logs 
               WHERE length(event_type) > 50 
                  OR length(description) > 1000
                  OR length(metadata::text) > 5000
           );
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 4. VALIDATION QUERIES
-- ================================================

-- Test all payload limits
SELECT * FROM validate_payload_limits();

-- Show all constraints
SELECT conname, contype, consrc 
FROM pg_constraint 
WHERE conrelid IN (
    'organizations'::regclass,
    'profiles'::regclass,
    'user_known_devices'::regclass,
    'audit_logs'::regclass
);

-- Show all triggers
SELECT 
    tgname AS trigger_name,
    relname AS table_name,
    proname AS function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE relname IN (
    'organizations',
    'profiles',
    'user_known_devices',
    'audit_logs'
); 