-- SQL Migration Script: Fix get_modules_stats RPC Function
-- Date: 2025-07-14
-- Description: This script refactors the 'get_modules_stats' function to use the new, correct
--              view 'v_tenant_module_assignments_full' instead of the legacy 'organization_modules' table.
--              This is the final fix for the 'column organizations_1.name does not exist' error chain.

CREATE OR REPLACE FUNCTION public.get_modules_stats(org_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result JSONB;
  where_clause TEXT := '';
BEGIN
  -- If org_id is provided, filter by organization
  IF org_id IS NOT NULL THEN
    -- Check access
    IF NOT (
      org_id = get_user_organization_id() OR 
      is_master_admin()
    ) THEN
      RAISE EXCEPTION 'Access denied to organization';
    END IF;
    where_clause := 'WHERE tenant_id = $1';
  ELSE
    -- Only master admin can see global stats
    IF NOT is_master_admin() THEN
      RAISE EXCEPTION 'Access denied - master admin required';
    END IF;
  END IF;

  -- Build the dynamic query using the NEW VIEW
  -- This query is simplified to fix the immediate error. 
  -- It can be expanded later to include more detailed stats from the new view.
  EXECUTE format('
    SELECT jsonb_build_object(
      ''total'', COUNT(*),
      ''active'', COUNT(*) FILTER (WHERE assignment_active = true),
      ''inactive'', COUNT(*) FILTER (WHERE assignment_active = false),
      ''by_type'', (SELECT jsonb_object_agg(category, count) FROM (SELECT module_category as category, count(*) as count FROM v_tenant_module_assignments_full GROUP BY module_category) as types),
      ''by_priority'', (SELECT jsonb_object_agg(priority, count) FROM (SELECT mi.priority, count(*) as count FROM v_tenant_module_assignments_full tma JOIN module_implementations mi ON tma.implementation_id = mi.id GROUP BY mi.priority) as priorities)
    )
    FROM v_tenant_module_assignments_full %s
  ', where_clause)
  INTO result
  USING org_id;

  RETURN result;
END;
$function$;

-- Fim do script
