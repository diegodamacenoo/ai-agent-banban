-- Corrigir tipos da função de visibilidade
-- Execute no Supabase Dashboard

DROP FUNCTION IF EXISTS get_user_visible_modules(uuid,uuid);

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
BEGIN
  RETURN QUERY
  SELECT 
    bm.slug::TEXT as module_slug,  -- Cast to TEXT
    bm.name::TEXT as module_name,  -- Cast to TEXT
    COALESCE(bm.category, '')::TEXT as module_category,  -- Cast to TEXT
    
    -- Visibility logic
    CASE 
      WHEN tma.is_visible = false THEN false
      WHEN tma.status IN ('archived', 'deleted') THEN false
      WHEN tma.deactivation_date IS NOT NULL AND tma.deactivation_date < NOW() THEN false
      WHEN tma.activation_date IS NOT NULL AND tma.activation_date > NOW() THEN false
      ELSE true
    END as can_view,
    
    -- UPDATED: Allow access to archived modules for existing tenants
    CASE 
      WHEN tma.is_active = false THEN false
      WHEN tma.status != 'active' THEN false
      -- REMOVIDO: WHEN bm.archived_at IS NOT NULL THEN false
      WHEN bm.deleted_at IS NOT NULL THEN false
      WHEN mi.archived_at IS NOT NULL THEN false
      WHEN mi.deleted_at IS NOT NULL THEN false
      ELSE true
    END as can_access,
    
    tma.id as assignment_id,
    tma.custom_config,
    tma.permissions_override,
    tma.status::TEXT,  -- Cast to TEXT
    COALESCE(mi.implementation_key, 'default')::TEXT as implementation_key,  -- Cast to TEXT
    COALESCE(mi.component_path, '')::TEXT as component_path  -- Cast to TEXT
    
  FROM tenant_module_assignments tma
  INNER JOIN base_modules bm ON bm.id = tma.base_module_id
  LEFT JOIN module_implementations mi ON mi.id = tma.implementation_id
  WHERE tma.tenant_id = p_tenant_id
    AND tma.is_active = true
  ORDER BY bm.name;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_visible_modules(UUID, UUID) TO authenticated;