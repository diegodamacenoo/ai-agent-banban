-- Versão simplificada da função de visibilidade
-- Foco: módulos ativos SEMPRE aparecem, módulos arquivados também se tenant tem acesso
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
    bm.slug::TEXT as module_slug,
    bm.name::TEXT as module_name,
    COALESCE(bm.category, '')::TEXT as module_category,
    
    -- LÓGICA SIMPLIFICADA DE VISIBILIDADE
    -- Se o tenant tem assignment ativo, pode ver
    true as can_view,
    
    -- LÓGICA SIMPLIFICADA DE ACESSO  
    -- Se assignment está ativo E implementação não está arquivada, pode acessar
    CASE 
      WHEN tma.is_active = false THEN false
      WHEN bm.deleted_at IS NOT NULL THEN false  -- Módulos soft-deleted bloqueados
      WHEN mi.archived_at IS NOT NULL THEN false -- Implementações arquivadas bloqueadas
      WHEN mi.deleted_at IS NOT NULL THEN false  -- Implementações deletadas bloqueadas
      ELSE true
    END as can_access,
    
    tma.id as assignment_id,
    COALESCE(tma.custom_config, '{}'::jsonb) as custom_config,
    COALESCE(tma.permissions_override, '{}'::jsonb) as permissions_override,
    COALESCE(tma.status, 'active')::TEXT as status,
    COALESCE(mi.implementation_key, 'default')::TEXT as implementation_key,
    COALESCE(mi.component_path, '')::TEXT as component_path
    
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

-- Teste imediato - deve retornar os 3 módulos
SELECT 
    module_slug,
    module_name,
    can_view,
    can_access,
    status
FROM get_user_visible_modules('2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4')
ORDER BY module_slug;