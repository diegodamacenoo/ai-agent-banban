# Module Troubleshooting Essentials

## 🔄 Archive Behavior Pattern

**Correct:** Module archived → Implementations stay active → Tenants keep access
**Wrong:** Module archived → Implementations archived → Tenants lose access

```typescript
// ✅ Archive only base module
await supabase.from('base_modules').update({ archived_at: NOW() });
// ❌ Don't archive implementations or deactivate assignments
```

## 🔍 Visibility Function Type Safety

```sql
-- ✅ Always cast types explicitly
SELECT 
  bm.slug::TEXT,                    -- VARCHAR to TEXT
  COALESCE(config, '{}'::jsonb),    -- Handle NULLs
  array_to_json(perms)::jsonb       -- Array to JSONB
```

## 🛠️ Orphaned Implementations Fix

```sql
-- Detect: Active modules with archived implementations
-- Fix: Unarchive implementations where parent module is active
UPDATE module_implementations SET archived_at = NULL
WHERE base_module_id IN (
  SELECT id FROM base_modules WHERE archived_at IS NULL
) AND archived_at IS NOT NULL;
```

## 🚫 Critical Anti-Patterns

- **Database triggers** for archive cascade (use application logic)
- **Missing type casts** in Supabase functions  
- **Blocking archived modules** in visibility functions
- **Cascading archive operations** in server actions

## 🎯 Debug Commands

```sql
-- Check module states
SELECT slug, archived_at IS NOT NULL as archived FROM base_modules;

-- Check implementation orphans  
SELECT bm.slug, mi.archived_at IS NOT NULL as impl_archived
FROM base_modules bm JOIN module_implementations mi ON bm.id = mi.base_module_id
WHERE bm.archived_at IS NULL AND mi.archived_at IS NOT NULL;
```