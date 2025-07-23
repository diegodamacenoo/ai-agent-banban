# Module Lifecycle Troubleshooting Patterns

## Overview

Padrões identificados durante troubleshooting do sistema de módulos, com foco em arquivamento, implementações órfãs e problemas de visibilidade.

## 🔄 Module Archive Lifecycle

### Expected Behavior vs Common Issues

#### ✅ Correct Archive Behavior
```sql
-- Archive module: Only base module is archived
UPDATE base_modules SET archived_at = NOW() WHERE id = 'module-id';

-- Implementation remains active
-- Assignments remain active
-- Existing tenants keep access
-- New assignments blocked
```

#### ❌ Common Incorrect Patterns
```sql
-- WRONG: Archiving implementations cascades
UPDATE module_implementations SET archived_at = NOW() WHERE base_module_id = 'module-id';

-- WRONG: Deactivating assignments
UPDATE tenant_module_assignments SET is_active = false WHERE base_module_id = 'module-id';
```

### Visibility Function Patterns

#### ✅ Correct Access Logic
```sql
-- Allow access to archived modules if tenant has active assignment
CASE 
  WHEN tma.is_active = false THEN false
  WHEN bm.deleted_at IS NOT NULL THEN false  -- Soft-deleted modules blocked
  WHEN mi.archived_at IS NOT NULL THEN false -- Archived implementations blocked
  -- IMPORTANT: bm.archived_at does NOT block access
  ELSE true
END as can_access
```

## 🔍 Orphaned Implementations Pattern

### Detection Query
```sql
-- Find implementations archived while parent module is active
SELECT 
    bm.slug as module_slug,
    bm.name as module_name,
    COUNT(CASE WHEN mi.archived_at IS NOT NULL THEN 1 END) as orphaned_implementations
FROM base_modules bm
LEFT JOIN module_implementations mi ON bm.id = mi.base_module_id
WHERE bm.archived_at IS NULL AND bm.deleted_at IS NULL
GROUP BY bm.id, bm.slug, bm.name
HAVING COUNT(CASE WHEN mi.archived_at IS NOT NULL THEN 1 END) > 0;
```

### Cleanup Pattern
```sql
-- Fix orphaned implementations
UPDATE module_implementations 
SET archived_at = NULL, updated_at = NOW()
WHERE id IN (
    SELECT mi.id FROM module_implementations mi
    JOIN base_modules bm ON mi.base_module_id = bm.id
    WHERE bm.archived_at IS NULL AND bm.deleted_at IS NULL
      AND mi.archived_at IS NOT NULL
);
```

## 🛠️ Database Function Type Safety

### Common Type Issues
- `VARCHAR(50)` vs `TEXT` mismatches
- `text[]` vs `JSONB` conversions
- `NULL` handling in COALESCE operations

### Safe Function Pattern
```sql
CREATE OR REPLACE FUNCTION safe_visibility_function(p_tenant_id UUID)
RETURNS TABLE(
  module_slug TEXT,  -- Always cast to TEXT
  -- ... other fields
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bm.slug::TEXT,  -- Explicit cast
    COALESCE(bm.category::TEXT, ''),  -- Handle NULLs
    -- Convert arrays to jsonb safely
    CASE 
      WHEN tma.permissions_override IS NULL THEN '[]'::jsonb
      ELSE array_to_json(tma.permissions_override)::jsonb
    END
  FROM tenant_module_assignments tma
  INNER JOIN base_modules bm ON bm.id = tma.base_module_id;
END;
$$;
```

## 🔧 Server Action Patterns

### Archive Module Pattern
```typescript
export async function archiveBaseModule(moduleId: string) {
  // 1. Archive only the base module
  await supabase
    .from('base_modules')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', moduleId);

  // 2. DON'T archive implementations
  // 3. DON'T deactivate assignments
  // 4. Existing tenants keep access
  
  revalidatePath('/admin/modules');
}
```

### Restore Module Pattern
```typescript
export async function restoreBaseModule(moduleId: string) {
  // 1. Restore only the base module
  await supabase
    .from('base_modules')
    .update({ archived_at: null })
    .eq('id', moduleId);

  // 2. Implementations were never archived
  // 3. Assignments were never deactivated
  // 4. Module becomes available for new assignments
  
  revalidatePath('/admin/modules');
}
```

## 🚫 Anti-Patterns to Avoid

### Database Triggers for Archive Cascade
```sql
-- AVOID: Automatic implementation archiving
CREATE TRIGGER trigger_sync_implementations_archive
AFTER UPDATE OF archived_at ON base_modules
-- This removes tenant access unexpectedly
```

### Overly Restrictive Visibility
```sql
-- AVOID: Blocking archived modules completely
WHEN bm.archived_at IS NOT NULL THEN false  -- Too restrictive
```

### Type Unsafe Function Returns
```sql
-- AVOID: Missing type casts
SELECT bm.slug, bm.name  -- Can cause VARCHAR vs TEXT errors
```

## 🔄 Testing Patterns

### Archive Test Sequence
1. Archive module via admin interface
2. Verify module shows as "Archived" in admin
3. Verify existing tenants still have access
4. Verify new tenants cannot receive assignment
5. Restore module
6. Verify module available for new assignments

### Debug Visibility Issues
```sql
-- Debug function to trace visibility problems
CREATE OR REPLACE FUNCTION debug_module_visibility(p_tenant_id UUID)
RETURNS TABLE(
  module_slug TEXT,
  assignment_active BOOLEAN,
  base_archived BOOLEAN,
  impl_archived BOOLEAN,
  expected_access BOOLEAN
);
```

## 📋 Checklist for Module Lifecycle Changes

- [ ] Server actions only modify intended entities
- [ ] Visibility functions handle all data types correctly
- [ ] Existing tenant access is preserved
- [ ] Admin interface reflects correct status
- [ ] No orphaned implementations created
- [ ] Cache invalidation includes all affected paths
- [ ] Audit logs capture all state changes