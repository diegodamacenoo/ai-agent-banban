-- Script manual para corrigir acesso a módulos arquivados
-- Execute este script no Supabase Dashboard como service role

-- ================================================
-- 1. REMOVER TRIGGERS DE ARQUIVAMENTO AUTOMÁTICO
-- ================================================

-- Remove trigger that automatically archives implementations when module is archived
DROP TRIGGER IF EXISTS trigger_sync_implementations_archive ON base_modules;

-- Remove the function if it exists (may not exist if triggers were never created)
DROP FUNCTION IF EXISTS sync_implementations_archive_status();

-- ================================================
-- 2. DROPAR E RECRIAR FUNÇÃO DE VISIBILIDADE
-- ================================================

-- Drop existing function
DROP FUNCTION IF EXISTS get_user_visible_modules(uuid,uuid);

-- Recreate with updated logic
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

  -- Return modules with updated visibility logic
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
    
    -- UPDATED ACCESS LOGIC: Allow access to archived modules if tenant has active assignment
    CASE 
      WHEN tma.is_active = false THEN false
      WHEN tma.status != 'active' THEN false
      -- REMOVIDO: WHEN bm.archived_at IS NOT NULL THEN false (permite acesso a módulos arquivados)
      WHEN bm.deleted_at IS NOT NULL THEN false  -- Soft-deleted modules still blocked
      WHEN mi.archived_at IS NOT NULL THEN false -- Archived implementations blocked
      WHEN mi.deleted_at IS NOT NULL THEN false  -- Deleted implementations blocked
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

-- ================================================
-- 3. FUNÇÃO AUXILIAR PARA VERIFICAR DISPONIBILIDADE
-- ================================================

-- Create function to check if module is available for new assignments
CREATE OR REPLACE FUNCTION is_module_available_for_assignment(
  p_module_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  module_archived BOOLEAN := false;
  module_deleted BOOLEAN := false;
BEGIN
  SELECT 
    (archived_at IS NOT NULL) as is_archived,
    (deleted_at IS NOT NULL) as is_deleted
  INTO module_archived, module_deleted
  FROM base_modules 
  WHERE id = p_module_id;
  
  -- Module is available if it's not archived and not deleted
  RETURN NOT COALESCE(module_archived, true) AND NOT COALESCE(module_deleted, true);
END;
$$;

-- ================================================
-- 4. GRANTS DE PERMISSÃO
-- ================================================

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_visible_modules(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_module_available_for_assignment(UUID) TO authenticated;

-- ================================================
-- 5. DOCUMENTAÇÃO
-- ================================================

COMMENT ON FUNCTION get_user_visible_modules(UUID, UUID) IS 
'Função atualizada que permite acesso a módulos arquivados para tenants com assignments ativos, impedindo apenas novas atribuições';

COMMENT ON FUNCTION is_module_available_for_assignment(UUID) IS 
'Verifica se um módulo está disponível para novas atribuições (não arquivado e não deletado)';

-- ================================================
-- 6. VALIDAÇÃO
-- ================================================

-- Verificar se triggers foram removidos
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name LIKE '%sync_implementations_archive%';

-- Deve retornar 0 linhas se o trigger foi removido corretamente

-- ================================================
-- 7. TESTE
-- ================================================

-- Testar a função para banban-fashion (descomente para testar)
/*
SELECT 
    module_slug,
    module_name,
    can_view,
    can_access,
    status
FROM get_user_visible_modules('2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4')
WHERE module_slug = 'diego-henrique';
*/