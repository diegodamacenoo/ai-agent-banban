-- Migration: Add route_pattern field to base_modules table
-- Purpose: Support unified module structure with flexible namespace organization
-- Date: 2025-08-06

-- Add route_pattern column to base_modules
ALTER TABLE public.base_modules 
ADD COLUMN route_pattern TEXT DEFAULT NULL;

-- Add comment explaining the field
COMMENT ON COLUMN public.base_modules.route_pattern IS 
'Optional namespace pattern for organizing module files. Examples: "standard", "banban", "pco/v1". When null, falls back to type-based organization.';

-- Create index for performance on route_pattern queries
CREATE INDEX idx_base_modules_route_pattern ON public.base_modules(route_pattern) WHERE route_pattern IS NOT NULL;

-- Update RLS policies to include route_pattern (if needed)
-- The existing RLS policies should automatically cover this new column
-- since they're based on organization access patterns

-- Example data for documentation (commented out)
-- UPDATE base_modules SET route_pattern = 'standard' WHERE slug IN ('reports', 'settings');
-- UPDATE base_modules SET route_pattern = 'banban' WHERE slug LIKE '%banban%';
-- UPDATE base_modules SET route_pattern = 'pco' WHERE slug LIKE '%pco%';