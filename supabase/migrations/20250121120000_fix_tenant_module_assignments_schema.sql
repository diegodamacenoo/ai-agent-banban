-- Fix tenant_module_assignments schema to match documented architecture
-- Migration: 20250121120000_fix_tenant_module_assignments_schema.sql

BEGIN;

-- 1. Add missing essential columns to tenant_module_assignments
-- These columns are critical for admin functionality and were missing from current schema

-- Add id column (UUID for individual record identification, not primary key)
-- Note: Table likely uses composite primary key (tenant_id, base_module_id)
ALTER TABLE tenant_module_assignments 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT uuid_generate_v4();

-- Add is_visible column for granular visibility control
ALTER TABLE tenant_module_assignments 
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Add status column for lifecycle management
ALTER TABLE tenant_module_assignments 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived', 'deleted'));

-- Add permissions_override column for granular permissions
ALTER TABLE tenant_module_assignments 
ADD COLUMN IF NOT EXISTS permissions_override JSONB DEFAULT '[]'::jsonb;

-- Add user_groups column for role-based access
ALTER TABLE tenant_module_assignments 
ADD COLUMN IF NOT EXISTS user_groups TEXT[] DEFAULT '{}';

-- Add activation/deactivation dates for scheduling
ALTER TABLE tenant_module_assignments 
ADD COLUMN IF NOT EXISTS activation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE tenant_module_assignments 
ADD COLUMN IF NOT EXISTS deactivation_date TIMESTAMP WITH TIME ZONE;

-- Add custom_config column for tenant-specific configurations
ALTER TABLE tenant_module_assignments 
ADD COLUMN IF NOT EXISTS custom_config JSONB DEFAULT '{}'::jsonb;

-- Add assigned_at timestamp for audit trail
ALTER TABLE tenant_module_assignments 
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create performance indexes
-- These indexes are critical for fast queries on tenant modules

-- Index for status-based queries
CREATE INDEX IF NOT EXISTS idx_tenant_assignments_status 
ON tenant_module_assignments(tenant_id, status);

-- Index for visibility-based queries
CREATE INDEX IF NOT EXISTS idx_tenant_assignments_visible 
ON tenant_module_assignments(tenant_id, is_visible);

-- Index for active modules queries
CREATE INDEX IF NOT EXISTS idx_tenant_assignments_active 
ON tenant_module_assignments(tenant_id, is_active);

-- Composite index for efficient module listing
CREATE INDEX IF NOT EXISTS idx_tenant_assignments_composite 
ON tenant_module_assignments(tenant_id, is_active, is_visible, status);

-- Index for base_module_id queries
CREATE INDEX IF NOT EXISTS idx_tenant_assignments_base_module 
ON tenant_module_assignments(base_module_id);

-- 3. Add useful constraints and defaults
-- Ensure data consistency and integrity

-- Ensure activation_date is not in the future for active assignments
ALTER TABLE tenant_module_assignments 
ADD CONSTRAINT check_activation_date_for_active 
CHECK (
  status != 'active' OR 
  activation_date IS NULL OR 
  activation_date <= NOW()
);

-- Ensure deactivation_date is after activation_date
ALTER TABLE tenant_module_assignments 
ADD CONSTRAINT check_deactivation_after_activation 
CHECK (
  deactivation_date IS NULL OR 
  activation_date IS NULL OR 
  deactivation_date > activation_date
);

-- 4. Update existing records to have proper defaults
-- Ensure all existing records have the new fields populated

-- Set id for existing records (generate for all existing records)
UPDATE tenant_module_assignments 
SET id = uuid_generate_v4() 
WHERE id IS NULL;

-- Set status based on current is_active flag
UPDATE tenant_module_assignments 
SET status = CASE 
  WHEN is_active = true THEN 'active'
  ELSE 'inactive'
END
WHERE status IS NULL OR status = 'active';

-- Set is_visible to true for all existing active assignments
UPDATE tenant_module_assignments 
SET is_visible = true 
WHERE is_active = true AND is_visible IS NULL;

-- Set assigned_at for existing records
UPDATE tenant_module_assignments 
SET assigned_at = NOW() 
WHERE assigned_at IS NULL;

-- 5. Add comments for documentation
COMMENT ON COLUMN tenant_module_assignments.id IS 'Unique identifier for the assignment record (for individual record tracking)';
COMMENT ON COLUMN tenant_module_assignments.is_visible IS 'Controls if module appears in tenant UI (independent of is_active)';
COMMENT ON COLUMN tenant_module_assignments.status IS 'Lifecycle status: active, inactive, archived, deleted';
COMMENT ON COLUMN tenant_module_assignments.permissions_override IS 'Custom permissions for this specific assignment';
COMMENT ON COLUMN tenant_module_assignments.user_groups IS 'User groups that can access this module assignment';
COMMENT ON COLUMN tenant_module_assignments.custom_config IS 'Tenant-specific configuration for this module';
COMMENT ON COLUMN tenant_module_assignments.activation_date IS 'When this assignment becomes/became active';
COMMENT ON COLUMN tenant_module_assignments.deactivation_date IS 'When this assignment should/did become inactive';

COMMIT;