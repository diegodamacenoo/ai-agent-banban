-- SQL Migration Script: Create get_tenant_operational_stats function
-- Date: 2025-07-18
-- Description: Creates the missing get_tenant_operational_stats RPC function
--              that returns operational statistics for tenant modules

CREATE OR REPLACE FUNCTION public.get_tenant_operational_stats(
  p_organization_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  result JSONB;
  where_clause TEXT := '';
  total_count INTEGER := 0;
  -- Status counts
  requested_count INTEGER := 0;
  pending_approval_count INTEGER := 0;
  provisioning_count INTEGER := 0;
  enabled_count INTEGER := 0;
  upgrading_count INTEGER := 0;
  up_to_date_count INTEGER := 0;
  suspended_count INTEGER := 0;
  disabled_count INTEGER := 0;
  archived_count INTEGER := 0;
  error_count INTEGER := 0;
  -- Health counts
  healthy_count INTEGER := 0;
  warning_count INTEGER := 0;
  critical_count INTEGER := 0;
  unknown_count INTEGER := 0;
BEGIN
  -- Build WHERE clause based on organization filter
  IF p_organization_id IS NOT NULL THEN
    -- Check access: user must belong to organization or be master admin
    IF NOT (
      p_organization_id = get_user_organization_id() OR 
      is_master_admin()
    ) THEN
      RAISE EXCEPTION 'Access denied to organization';
    END IF;
    where_clause := 'WHERE organization_id = $1';
  ELSE
    -- Only master admin can see global stats
    IF NOT is_master_admin() THEN
      RAISE EXCEPTION 'Access denied - master admin required';
    END IF;
  END IF;

  -- Get total count
  EXECUTE format('
    SELECT COUNT(*)
    FROM tenant_module_assignments %s
  ', where_clause)
  INTO total_count
  USING p_organization_id;

  -- Get counts by operational status
  EXECUTE format('
    SELECT 
      COUNT(*) FILTER (WHERE operational_status = ''REQUESTED''),
      COUNT(*) FILTER (WHERE operational_status = ''PENDING_APPROVAL''),
      COUNT(*) FILTER (WHERE operational_status = ''PROVISIONING''),
      COUNT(*) FILTER (WHERE operational_status = ''ENABLED''),
      COUNT(*) FILTER (WHERE operational_status = ''UPGRADING''),
      COUNT(*) FILTER (WHERE operational_status = ''UP_TO_DATE''),
      COUNT(*) FILTER (WHERE operational_status = ''SUSPENDED''),
      COUNT(*) FILTER (WHERE operational_status = ''DISABLED''),
      COUNT(*) FILTER (WHERE operational_status = ''ARCHIVED''),
      COUNT(*) FILTER (WHERE operational_status = ''ERROR'')
    FROM tenant_module_assignments %s
  ', where_clause)
  INTO 
    requested_count,
    pending_approval_count,
    provisioning_count,
    enabled_count,
    upgrading_count,
    up_to_date_count,
    suspended_count,
    disabled_count,
    archived_count,
    error_count
  USING p_organization_id;

  -- Get counts by health status
  EXECUTE format('
    SELECT 
      COUNT(*) FILTER (WHERE health_status = ''healthy''),
      COUNT(*) FILTER (WHERE health_status = ''warning''),
      COUNT(*) FILTER (WHERE health_status = ''critical''),
      COUNT(*) FILTER (WHERE health_status = ''unknown'')
    FROM tenant_module_assignments %s
  ', where_clause)
  INTO 
    healthy_count,
    warning_count,
    critical_count,
    unknown_count
  USING p_organization_id;

  -- Build result JSON
  result := jsonb_build_object(
    'total_modules', total_count,
    'by_status', jsonb_build_object(
      'REQUESTED', requested_count,
      'PENDING_APPROVAL', pending_approval_count,
      'PROVISIONING', provisioning_count,
      'ENABLED', enabled_count,
      'UPGRADING', upgrading_count,
      'UP_TO_DATE', up_to_date_count,
      'SUSPENDED', suspended_count,
      'DISABLED', disabled_count,
      'ARCHIVED', archived_count,
      'ERROR', error_count
    ),
    'health_summary', jsonb_build_object(
      'healthy', healthy_count,
      'warning', warning_count,
      'critical', critical_count,
      'unknown', unknown_count
    )
  );

  RETURN result;
END;
$function$;

-- Add comment explaining the function
COMMENT ON FUNCTION public.get_tenant_operational_stats(UUID) IS 
'Returns operational statistics for tenant modules. 
If organization_id is provided, returns stats for that organization only (requires access).
If organization_id is NULL, returns global stats (requires master admin).';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_tenant_operational_stats(UUID) TO authenticated;