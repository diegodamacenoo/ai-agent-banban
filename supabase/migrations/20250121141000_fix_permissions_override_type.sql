-- Fix permissions_override type in function
-- Migration: 20250121141000_fix_permissions_override_type.sql

BEGIN;

-- Drop existing functions to recreate with correct types
DROP FUNCTION IF EXISTS get_user_visible_modules(UUID, UUID);
DROP FUNCTION IF EXISTS get_visible_modules_for_tenant(UUID);
DROP FUNCTION IF EXISTS user_can_access_module(UUID, VARCHAR(50), UUID);

-- ================================================
-- FUNÇÃO CONSOLIDADA DE VISIBILIDADE (TIPOS CORRETOS v2)
-- ================================================

-- Create unified function for module visibility with correct return types
CREATE OR REPLACE FUNCTION get_user_visible_modules(
  p_tenant_id UUID,
  p_user_id UUID DEFAULT NULL
) 
RETURNS TABLE(
  module_slug VARCHAR(50),
  module_name VARCHAR(100),
  module_category VARCHAR(50),
  can_view BOOLEAN,
  can_access BOOLEAN,
  assignment_id UUID,
  custom_config JSONB,
  permissions_override TEXT[], -- Corrected type
  status TEXT,
  implementation_key VARCHAR(50),
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
    bm.slug::VARCHAR(50) as module_slug,
    bm.name::VARCHAR(100) as module_name,
    bm.category::VARCHAR(50) as module_category,
    
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
    tma.permissions_override, -- No cast needed, already TEXT[]
    tma.status,
    COALESCE(mi.implementation_key, 'default')::VARCHAR(50) as implementation_key,
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
-- FUNÇÃO SIMPLIFICADA PARA API (TIPOS CORRETOS v2)
-- ================================================

-- Create simplified function for API calls (only visible modules)
CREATE OR REPLACE FUNCTION get_visible_modules_for_tenant(
  p_tenant_id UUID
)
RETURNS TABLE(
  module_slug VARCHAR(50),
  module_name VARCHAR(100),
  component_path TEXT,
  custom_config JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.module_slug::VARCHAR(50),
    m.module_name::VARCHAR(100),
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
-- FUNÇÃO PARA VERIFICAR PERMISSÕES ESPECÍFICAS (TIPOS CORRETOS v2)
-- ================================================

-- Function to check if user has permission for specific module
CREATE OR REPLACE FUNCTION user_can_access_module(
  p_tenant_id UUID,
  p_module_slug VARCHAR(50),
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
GRANT EXECUTE ON FUNCTION user_can_access_module(UUID, VARCHAR(50), UUID) TO authenticated;

-- ================================================
-- COMENTÁRIOS DE DOCUMENTAÇÃO
-- ================================================

COMMENT ON FUNCTION get_user_visible_modules(UUID, UUID) IS 
'Função consolidada que retorna todos os módulos visíveis para um tenant com tipos corrigidos v2';

COMMENT ON FUNCTION get_visible_modules_for_tenant(UUID) IS 
'Função simplificada que retorna apenas módulos visíveis e acessíveis para uso em APIs v2';

COMMENT ON FUNCTION user_can_access_module(UUID, VARCHAR(50), UUID) IS 
'Função para verificar se um usuário específico pode acessar um módulo específico v2';

COMMIT;