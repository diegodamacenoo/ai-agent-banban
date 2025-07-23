-- Versão final com lógica de arquivamento correta
-- Execute no Supabase Dashboard APENAS após confirmar que módulos voltaram à sidebar

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
    bm.slug::TEXT,
    bm.name::TEXT,
    COALESCE(bm.category::TEXT, ''),
    
    -- VISIBILIDADE: Sempre true se tenant tem assignment ativo
    true as can_view,
    
    -- ACESSO: Bloqueado apenas se implementação está arquivada ou módulo soft-deletado
    CASE 
      WHEN tma.is_active = false THEN false
      WHEN bm.deleted_at IS NOT NULL THEN false  -- Módulo soft-deletado
      WHEN mi.archived_at IS NOT NULL THEN false -- Implementação arquivada
      WHEN mi.deleted_at IS NOT NULL THEN false  -- Implementação deletada
      -- MÓDULO ARQUIVADO (bm.archived_at) NÃO BLOQUEIA ACESSO
      ELSE true
    END as can_access,
    
    tma.id,
    COALESCE(tma.custom_config, '{}'::jsonb),
    CASE 
      WHEN tma.permissions_override IS NULL THEN '[]'::jsonb
      ELSE array_to_json(tma.permissions_override)::jsonb
    END,
    COALESCE(tma.status::TEXT, 'active'),
    COALESCE(mi.implementation_key::TEXT, 'default'),
    COALESCE(mi.component_path::TEXT, '')
    
  FROM tenant_module_assignments tma
  INNER JOIN base_modules bm ON bm.id = tma.base_module_id
  LEFT JOIN module_implementations mi ON mi.id = tma.implementation_id
  WHERE tma.tenant_id = p_tenant_id
    AND tma.is_active = true
  ORDER BY bm.name;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_visible_modules(UUID, UUID) TO authenticated;

-- Teste para verificar se diego-henrique (arquivado) ainda é acessível
SELECT 
    module_slug,
    module_name,
    can_view,
    can_access,
    CASE 
      WHEN module_slug = 'diego-henrique' THEN 'ARQUIVADO - deve ser acessível'
      ELSE 'ATIVO'
    END as expected_behavior
FROM get_user_visible_modules('2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4')
ORDER BY module_slug;