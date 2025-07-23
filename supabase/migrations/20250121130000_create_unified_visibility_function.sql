-- Create unified visibility function for modules
-- Migration: 20250121130000_create_unified_visibility_function.sql

BEGIN;

-- ================================================
-- FUNÇÃO CONSOLIDADA DE VISIBILIDADE DE MÓDULOS
-- ================================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS get_user_visible_modules(UUID, UUID);

-- Create unified function for module visibility
CREATE OR REPLACE FUNCTION get_user_visible_modules(
  p_tenant_id UUID,
  p_user_id UUID DEFAULT NULL
) 
RETURNS TABLE(
  module_slug TEXT,
  module_name TEXT,
  module_category TEXT,
  can_view BOOLEAN,
  can_access BOOLEAN,
  assignment_id UUID,
  custom_config JSONB,
  permissions_override JSONB,
  status TEXT,
  implementation_key TEXT,
  component_path TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  org_permissions TEXT[];
BEGIN
  -- Get user role if user_id provided
  IF p_user_id IS NOT NULL THEN
    SELECT role INTO user_role
    FROM auth.users 
    WHERE id = p_user_id;
  END IF;

  -- Return modules with unified visibility logic
  RETURN QUERY
  SELECT 
    bm.slug as module_slug,
    bm.name as module_name,
    bm.category as module_category,
    
    -- Unified visibility logic
    CASE 
      WHEN tma.is_visible = false THEN false
      WHEN tma.status IN ('archived', 'deleted') THEN false
      WHEN tma.deactivation_date IS NOT NULL AND tma.deactivation_date < NOW() THEN false
      WHEN tma.activation_date IS NOT NULL AND tma.activation_date > NOW() THEN false
      ELSE true
    END as can_view,
    
    -- Access logic (more strict than visibility)
    CASE 
      WHEN tma.is_active = false THEN false
      WHEN tma.status != 'active' THEN false
      WHEN bm.archived_at IS NOT NULL THEN false
      WHEN bm.deleted_at IS NOT NULL THEN false
      WHEN mi.archived_at IS NOT NULL THEN false
      WHEN mi.deleted_at IS NOT NULL THEN false
      ELSE true
    END as can_access,
    
    tma.id as assignment_id,
    tma.custom_config,
    tma.permissions_override,
    tma.status,
    COALESCE(mi.implementation_key, 'default') as implementation_key,
    mi.component_path
    
  FROM tenant_module_assignments tma
  INNER JOIN base_modules bm ON bm.id = tma.base_module_id
  LEFT JOIN module_implementations mi ON mi.id = tma.implementation_id
  WHERE tma.tenant_id = p_tenant_id
    AND tma.is_active = true  -- Base requirement for any module
  ORDER BY bm.name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_visible_modules(UUID, UUID) TO authenticated;

-- ================================================
-- FUNÇÃO SIMPLIFICADA PARA API
-- ================================================

-- Create simplified function for API calls (only visible modules)
CREATE OR REPLACE FUNCTION get_visible_modules_for_tenant(
  p_tenant_id UUID
)
RETURNS TABLE(
  module_slug TEXT,
  module_name TEXT,
  component_path TEXT,
  custom_config JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.module_slug,
    m.module_name,
    m.component_path,
    m.custom_config
  FROM get_user_visible_modules(p_tenant_id) m
  WHERE m.can_view = true
    AND m.can_access = true;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_visible_modules_for_tenant(UUID) TO authenticated;

-- ================================================
-- FUNÇÃO PARA VERIFICAR PERMISSÕES ESPECÍFICAS
-- ================================================

-- Function to check if user has permission for specific module
CREATE OR REPLACE FUNCTION user_can_access_module(
  p_tenant_id UUID,
  p_module_slug TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  module_accessible BOOLEAN := false;
BEGIN
  SELECT m.can_access INTO module_accessible
  FROM get_user_visible_modules(p_tenant_id, p_user_id) m
  WHERE m.module_slug = p_module_slug
  LIMIT 1;
  
  RETURN COALESCE(module_accessible, false);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION user_can_access_module(UUID, TEXT, UUID) TO authenticated;

-- ================================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ================================================

-- Index for faster module slug lookups
CREATE INDEX IF NOT EXISTS idx_base_modules_slug_active 
ON base_modules(slug) 
WHERE archived_at IS NULL AND deleted_at IS NULL;

-- Index for faster implementation lookups
CREATE INDEX IF NOT EXISTS idx_module_implementations_active 
ON module_implementations(base_module_id, implementation_key) 
WHERE archived_at IS NULL AND deleted_at IS NULL;

-- ================================================
-- COMENTÁRIOS DE DOCUMENTAÇÃO
-- ================================================

COMMENT ON FUNCTION get_user_visible_modules(UUID, UUID) IS 
'Função consolidada que retorna todos os módulos visíveis para um tenant com informações de visibilidade e acesso unificadas';

COMMENT ON FUNCTION get_visible_modules_for_tenant(UUID) IS 
'Função simplificada que retorna apenas módulos visíveis e acessíveis para uso em APIs';

COMMENT ON FUNCTION user_can_access_module(UUID, TEXT, UUID) IS 
'Função para verificar se um usuário específico pode acessar um módulo específico';

COMMIT;