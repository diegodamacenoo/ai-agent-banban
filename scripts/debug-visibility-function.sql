-- Debug da função de visibilidade
-- Execute no Supabase Dashboard

-- Criar função de debug simples primeiro
DROP FUNCTION IF EXISTS debug_visible_modules(uuid);

CREATE OR REPLACE FUNCTION debug_visible_modules(
  p_tenant_id UUID
) 
RETURNS TABLE(
  module_slug TEXT,
  module_name TEXT,
  is_active BOOLEAN,
  assignment_status TEXT,
  base_archived BOOLEAN,
  impl_archived BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bm.slug::TEXT,
    bm.name::TEXT,
    tma.is_active,
    tma.status::TEXT,
    (bm.archived_at IS NOT NULL) as base_archived,
    (mi.archived_at IS NOT NULL) as impl_archived
  FROM tenant_module_assignments tma
  INNER JOIN base_modules bm ON bm.id = tma.base_module_id
  LEFT JOIN module_implementations mi ON mi.id = tma.implementation_id
  WHERE tma.tenant_id = p_tenant_id
  ORDER BY bm.name;
END;
$$;

GRANT EXECUTE ON FUNCTION debug_visible_modules(UUID) TO authenticated;

-- Testar função de debug
SELECT * FROM debug_visible_modules('2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4');