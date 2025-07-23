-- Script para corrigir implementações órfãs (arquivadas quando módulo pai está ativo)
-- Execute este script no Supabase Dashboard

-- ================================================
-- 1. DIAGNÓSTICO: Verificar problema antes da correção
-- ================================================

-- Modules with orphaned implementations
SELECT 
    bm.slug as module_slug,
    bm.name as module_name,
    COUNT(*) as total_implementations,
    COUNT(CASE WHEN mi.archived_at IS NOT NULL THEN 1 END) as archived_implementations,
    COUNT(CASE WHEN mi.archived_at IS NULL THEN 1 END) as active_implementations,
    string_agg(
        CASE WHEN mi.archived_at IS NOT NULL 
        THEN mi.implementation_key || ' (archived: ' || mi.archived_at::date || ')'
        ELSE NULL END, 
        ', '
    ) as orphaned_implementations
FROM base_modules bm
LEFT JOIN module_implementations mi ON bm.id = mi.base_module_id
WHERE bm.archived_at IS NULL  -- Active modules only
  AND bm.deleted_at IS NULL
GROUP BY bm.id, bm.slug, bm.name
HAVING COUNT(CASE WHEN mi.archived_at IS NOT NULL THEN 1 END) > 0
ORDER BY archived_implementations DESC;

-- ================================================
-- 2. CORREÇÃO: Desarquivar implementações órfãs
-- ================================================

-- Fix orphaned implementations (unarchive implementations of active modules)
UPDATE module_implementations 
SET 
    archived_at = NULL,
    updated_at = NOW()
WHERE id IN (
    SELECT mi.id
    FROM module_implementations mi
    JOIN base_modules bm ON mi.base_module_id = bm.id
    WHERE bm.archived_at IS NULL  -- Parent module is active
      AND bm.deleted_at IS NULL
      AND mi.archived_at IS NOT NULL  -- But implementation is archived
);

-- ================================================
-- 3. VERIFICAÇÃO: Confirmar que problema foi resolvido
-- ================================================

-- Verify fix - should return no results
SELECT 
    bm.slug as module_slug,
    bm.name as module_name,
    COUNT(*) as total_implementations,
    COUNT(CASE WHEN mi.archived_at IS NOT NULL THEN 1 END) as archived_implementations,
    COUNT(CASE WHEN mi.archived_at IS NULL THEN 1 END) as active_implementations
FROM base_modules bm
LEFT JOIN module_implementations mi ON bm.id = mi.base_module_id
WHERE bm.archived_at IS NULL  -- Active modules only
  AND bm.deleted_at IS NULL
GROUP BY bm.id, bm.slug, bm.name
HAVING COUNT(CASE WHEN mi.archived_at IS NOT NULL THEN 1 END) > 0
ORDER BY archived_implementations DESC;

-- ================================================
-- 4. VALIDAÇÃO: Testar função get_user_visible_modules
-- ================================================

-- Test visibility function for banban-fashion after fix
SELECT 
    module_slug,
    module_name,
    can_view,
    can_access,
    status,
    implementation_key
FROM get_user_visible_modules('2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4')
WHERE module_slug IN ('inventory', 'analytics', 'insights')
ORDER BY module_slug;