-- ROLLBACK: Voltar para versão que funcionava antes
-- Execute no Supabase Dashboard se o teste não retornar nada

DROP FUNCTION IF EXISTS get_user_visible_modules(uuid,uuid);

-- Versão minimalista que deve funcionar
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
    bm.slug::TEXT,
    bm.name::TEXT,
    COALESCE(bm.category, '')::TEXT,
    true::BOOLEAN, -- Always visible
    true::BOOLEAN, -- Always accessible (restauramos depois)
    tma.id,
    COALESCE(tma.custom_config, '{}'::jsonb),
    COALESCE(tma.permissions_override, '{}'::jsonb),
    'active'::TEXT,
    COALESCE(mi.implementation_key, 'default')::TEXT,
    COALESCE(mi.component_path, '')::TEXT
    
  FROM tenant_module_assignments tma
  INNER JOIN base_modules bm ON bm.id = tma.base_module_id
  LEFT JOIN module_implementations mi ON mi.id = tma.implementation_id
  WHERE tma.tenant_id = p_tenant_id
    AND tma.is_active = true;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_visible_modules(UUID, UUID) TO authenticated;

-- Teste
SELECT COUNT(*) FROM get_user_visible_modules('2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4');