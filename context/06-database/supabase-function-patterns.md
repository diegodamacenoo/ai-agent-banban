# Supabase Function Patterns

## Overview

Padrões para criar funções Supabase robustas, com foco em type safety, performance e manutenibilidade.

## 🔒 Type Safety Patterns

### Explicit Type Casting

```sql
-- ✅ Always cast to expected return types
CREATE OR REPLACE FUNCTION get_user_visible_modules(p_tenant_id UUID)
RETURNS TABLE(
  module_slug TEXT,  -- Declare exact return types
  module_name TEXT,
  custom_config JSONB
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bm.slug::TEXT,              -- Cast VARCHAR to TEXT
    bm.name::TEXT,              -- Cast VARCHAR to TEXT
    COALESCE(tma.custom_config, '{}'::jsonb)  -- Handle NULLs
  FROM tenant_module_assignments tma
  INNER JOIN base_modules bm ON bm.id = tma.base_module_id
  WHERE tma.tenant_id = p_tenant_id;
END;
$$;
```

### Array to JSONB Conversion

```sql
-- ✅ Safe conversion of text[] to jsonb
CASE 
  WHEN tma.permissions_override IS NULL THEN '[]'::jsonb
  ELSE array_to_json(tma.permissions_override)::jsonb
END as permissions_override
```

### NULL Handling Patterns

```sql
-- ✅ Consistent NULL handling
COALESCE(bm.category::TEXT, '') as module_category,
COALESCE(tma.is_visible, true) = false as is_hidden,
COALESCE(tma.status, 'active')::TEXT as status
```

## 🎯 Access Control Patterns

### Archived vs Deleted Logic

```sql
-- ✅ Correct access logic for module lifecycle
CASE 
  WHEN tma.is_active = false THEN false
  WHEN tma.status != 'active' THEN false
  
  -- CRITICAL: Archived modules (bm.archived_at) don't block access
  -- Only soft-deleted modules block access
  WHEN bm.deleted_at IS NOT NULL THEN false
  
  -- Archived implementations DO block access
  WHEN mi.archived_at IS NOT NULL THEN false
  WHEN mi.deleted_at IS NOT NULL THEN false
  
  ELSE true
END as can_access
```

### Multi-level Visibility

```sql
-- ✅ Separate visibility and access logic
-- can_view: Controls UI display
CASE 
  WHEN COALESCE(tma.is_visible, true) = false THEN false
  WHEN tma.deactivation_date IS NOT NULL AND tma.deactivation_date < NOW() THEN false
  ELSE true
END as can_view,

-- can_access: Controls actual functionality
CASE 
  WHEN tma.is_active = false THEN false
  WHEN bm.deleted_at IS NOT NULL THEN false
  WHEN mi.archived_at IS NOT NULL THEN false
  ELSE true
END as can_access
```

## 🔍 Debug Function Patterns

### Troubleshooting Helper Functions

```sql
-- ✅ Create debug functions for complex queries
CREATE OR REPLACE FUNCTION debug_module_visibility(p_tenant_id UUID)
RETURNS TABLE(
  module_slug TEXT,
  assignment_active BOOLEAN,
  base_archived BOOLEAN,
  impl_archived BOOLEAN,
  assignment_status TEXT
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bm.slug::TEXT,
    tma.is_active,
    (bm.archived_at IS NOT NULL) as base_archived,
    (mi.archived_at IS NOT NULL) as impl_archived,
    tma.status::TEXT
  FROM tenant_module_assignments tma
  INNER JOIN base_modules bm ON bm.id = tma.base_module_id
  LEFT JOIN module_implementations mi ON mi.id = tma.implementation_id
  WHERE tma.tenant_id = p_tenant_id
  ORDER BY bm.name;
END;
$$;
```

## 🔄 Function Evolution Patterns

### Safe Function Updates

```sql
-- ✅ Pattern for updating existing functions
-- 1. Drop existing function
DROP FUNCTION IF EXISTS get_user_visible_modules(uuid,uuid);

-- 2. Create with new signature/logic
CREATE OR REPLACE FUNCTION get_user_visible_modules(
  p_tenant_id UUID,
  p_user_id UUID DEFAULT NULL  -- Add new optional parameters
) 
RETURNS TABLE(
  -- Update return types as needed
  module_slug TEXT,
  module_name TEXT
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
-- New implementation
$$;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION get_user_visible_modules(UUID, UUID) TO authenticated;
```

## 📊 Performance Patterns

### Efficient Filtering

```sql
-- ✅ Filter at WHERE clause level, not in CASE statements
SELECT 
  bm.slug::TEXT,
  bm.name::TEXT,
  true as can_access  -- Simple logic when pre-filtered
FROM tenant_module_assignments tma
INNER JOIN base_modules bm ON bm.id = tma.base_module_id
LEFT JOIN module_implementations mi ON mi.id = tma.implementation_id
WHERE tma.tenant_id = p_tenant_id
  AND tma.is_active = true              -- Base filtering
  AND bm.deleted_at IS NULL             -- Exclude soft-deleted
  AND COALESCE(mi.archived_at, mi.deleted_at) IS NULL  -- Exclude bad implementations
ORDER BY bm.name;
```

### Index-Friendly Queries

```sql
-- ✅ Use conditions that can leverage indexes
WHERE tma.tenant_id = p_tenant_id  -- Uses primary key/index
  AND tma.is_active = true         -- Boolean index friendly

-- ✅ Avoid functions in WHERE that prevent index usage
-- Instead of: WHERE LOWER(bm.slug) = 'value'
-- Use: WHERE bm.slug = 'value'  -- If case is known
```

## 🛡️ Security Patterns

### SECURITY DEFINER Usage

```sql
-- ✅ Use SECURITY DEFINER for functions that need elevated access
CREATE OR REPLACE FUNCTION get_user_visible_modules(p_tenant_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with function owner's permissions
AS $$
BEGIN
  -- Validate input to prevent SQL injection
  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_id cannot be null';
  END IF;
  
  -- Implementation
END;
$$;

-- ✅ Grant specific permissions
GRANT EXECUTE ON FUNCTION get_user_visible_modules(UUID) TO authenticated;
-- Don't grant to public unless necessary
```

## 🔧 Error Handling Patterns

### Graceful Degradation

```sql
-- ✅ Handle missing tables gracefully
CREATE OR REPLACE FUNCTION safe_module_stats()
RETURNS TABLE(total_modules INTEGER)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  module_count INTEGER := 0;
BEGIN
  -- Try to get real data
  BEGIN
    SELECT COUNT(*)::INTEGER INTO module_count
    FROM base_modules 
    WHERE deleted_at IS NULL;
  EXCEPTION 
    WHEN undefined_table THEN
      -- Table doesn't exist, return default
      module_count := 0;
    WHEN OTHERS THEN
      -- Other errors, log and return default
      RAISE WARNING 'Error in safe_module_stats: %', SQLERRM;
      module_count := 0;
  END;
  
  RETURN QUERY SELECT module_count;
END;
$$;
```

## 📋 Function Documentation Patterns

### Comprehensive Comments

```sql
-- ✅ Document function purpose and behavior
COMMENT ON FUNCTION get_user_visible_modules(UUID, UUID) IS 
'Returns modules visible to a tenant with access control.
- Archived modules remain accessible to existing tenants
- Soft-deleted modules are blocked
- Archived implementations are blocked
- Respects tenant-specific visibility settings';

COMMENT ON FUNCTION debug_module_visibility(UUID) IS 
'Debug helper for troubleshooting module visibility issues.
Returns raw state information for analysis.';
```

## 🚫 Anti-Patterns to Avoid

### ❌ Inconsistent Type Handling
```sql
-- WRONG: Mixing types without casting
SELECT bm.slug, bm.name  -- VARCHAR vs TEXT mismatch
```

### ❌ Complex Logic in SELECT
```sql
-- WRONG: Too much logic in CASE statements
CASE 
  WHEN complex_subquery_here THEN value1
  WHEN another_complex_condition THEN value2
  -- Move to WHERE clause or separate function
END
```

### ❌ Missing NULL Handling
```sql
-- WRONG: Not handling NULLs consistently
tma.is_visible = false  -- Fails when is_visible is NULL
-- CORRECT: COALESCE(tma.is_visible, true) = false
```

### ❌ Overly Broad Permissions
```sql
-- WRONG: Too permissive
GRANT EXECUTE ON FUNCTION sensitive_function() TO public;
-- CORRECT: GRANT EXECUTE ON FUNCTION sensitive_function() TO authenticated;
```