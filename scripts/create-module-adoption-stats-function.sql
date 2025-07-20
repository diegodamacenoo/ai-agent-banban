-- Create function to get module adoption statistics
-- This function provides real data about which modules are adopted by which organizations

CREATE OR REPLACE FUNCTION get_module_adoption_stats()
RETURNS TABLE (
  module_id TEXT,
  module_name TEXT,
  module_slug TEXT,
  category TEXT,
  pricing_tier TEXT,
  maturity TEXT,
  status TEXT,
  total_organizations BIGINT,
  active_organizations BIGINT,
  adoption_rate NUMERIC(5,2),
  total_assignments BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_orgs_count BIGINT;
BEGIN
  -- Get total number of active organizations
  SELECT COUNT(*) INTO total_orgs_count
  FROM organizations 
  WHERE deleted_at IS NULL;

  -- Return module adoption statistics
  RETURN QUERY
  SELECT 
    cm.id::TEXT as module_id,
    cm.name as module_name,
    cm.slug as module_slug,
    cm.category,
    cm.pricing_tier,
    cm.maturity,
    cm.status,
    COALESCE(stats.total_orgs, 0) as total_organizations,
    COALESCE(stats.active_orgs, 0) as active_organizations,
    CASE 
      WHEN total_orgs_count > 0 THEN 
        ROUND((COALESCE(stats.total_orgs, 0)::NUMERIC / total_orgs_count::NUMERIC) * 100, 2)
      ELSE 0
    END as adoption_rate,
    COALESCE(stats.total_assignments, 0) as total_assignments
  FROM core_modules cm
  LEFT JOIN (
    SELECT 
      tm.module_id,
      COUNT(DISTINCT tm.organization_id) as total_orgs,
      COUNT(DISTINCT CASE 
        WHEN tm.is_visible = true AND tm.status != 'DISABLED' 
        THEN tm.organization_id 
        ELSE NULL 
      END) as active_orgs,
      COUNT(*) as total_assignments
    FROM tenant_modules tm
    INNER JOIN organizations o ON tm.organization_id = o.id
    WHERE o.deleted_at IS NULL
    GROUP BY tm.module_id
  ) stats ON cm.id::TEXT = stats.module_id
  WHERE cm.archived_at IS NULL
  ORDER BY adoption_rate DESC, total_organizations DESC;
END;
$$;

-- Create function to get module adoption details for a specific module
CREATE OR REPLACE FUNCTION get_module_adoption_details(p_module_id TEXT)
RETURNS TABLE (
  module_id TEXT,
  module_name TEXT,
  module_slug TEXT,
  organization_id UUID,
  organization_name TEXT,
  client_type TEXT,
  is_active BOOLEAN,
  assignment_status TEXT,
  assigned_at TIMESTAMPTZ,
  is_visible BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id::TEXT as module_id,
    cm.name as module_name,
    cm.slug as module_slug,
    o.id as organization_id,
    o.company_trading_name as organization_name,
    o.client_type,
    (tm.is_visible = true AND tm.status != 'DISABLED') as is_active,
    tm.status as assignment_status,
    tm.created_at as assigned_at,
    tm.is_visible
  FROM core_modules cm
  INNER JOIN tenant_modules tm ON cm.id::TEXT = tm.module_id
  INNER JOIN organizations o ON tm.organization_id = o.id
  WHERE cm.id::TEXT = p_module_id
    AND o.deleted_at IS NULL
    AND cm.archived_at IS NULL
  ORDER BY tm.created_at DESC;
END;
$$;

-- Create function to get adoption summary statistics
CREATE OR REPLACE FUNCTION get_module_adoption_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  total_orgs BIGINT;
  total_modules BIGINT;
  total_assignments BIGINT;
  avg_adoption NUMERIC;
BEGIN
  -- Get counts
  SELECT COUNT(*) INTO total_orgs FROM organizations WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO total_modules FROM core_modules WHERE archived_at IS NULL;
  SELECT COUNT(*) INTO total_assignments FROM tenant_modules tm 
    INNER JOIN organizations o ON tm.organization_id = o.id 
    WHERE o.deleted_at IS NULL;

  -- Calculate average adoption rate
  SELECT AVG(adoption_rate) INTO avg_adoption
  FROM get_module_adoption_stats();

  -- Build result
  SELECT jsonb_build_object(
    'total_organizations', total_orgs,
    'total_modules', total_modules,
    'total_assignments', total_assignments,
    'average_adoption_rate', COALESCE(ROUND(avg_adoption, 2), 0),
    'by_category', (
      SELECT jsonb_object_agg(category, count)
      FROM (
        SELECT 
          COALESCE(category, 'uncategorized') as category,
          COUNT(*) as count
        FROM core_modules 
        WHERE archived_at IS NULL
        GROUP BY category
      ) cat_stats
    ),
    'by_pricing_tier', (
      SELECT jsonb_object_agg(pricing_tier, count)
      FROM (
        SELECT 
          COALESCE(pricing_tier, 'unknown') as pricing_tier,
          COUNT(*) as count
        FROM core_modules 
        WHERE archived_at IS NULL
        GROUP BY pricing_tier
      ) tier_stats
    ),
    'by_maturity', (
      SELECT jsonb_object_agg(maturity, count)
      FROM (
        SELECT 
          COALESCE(maturity, 'unknown') as maturity,
          COUNT(*) as count
        FROM core_modules 
        WHERE archived_at IS NULL
        GROUP BY maturity
      ) maturity_stats
    ),
    'top_adopted_modules', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'module_id', module_id,
          'module_name', module_name,
          'adoption_rate', adoption_rate,
          'total_organizations', total_organizations
        )
      )
      FROM (
        SELECT * FROM get_module_adoption_stats()
        WHERE total_organizations > 0
        ORDER BY adoption_rate DESC
        LIMIT 5
      ) top_modules
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_module_adoption_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_module_adoption_details(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_module_adoption_summary() TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_module_adoption_stats() IS 'Returns module adoption statistics showing which modules are used by how many organizations';
COMMENT ON FUNCTION get_module_adoption_details(TEXT) IS 'Returns detailed adoption information for a specific module';
COMMENT ON FUNCTION get_module_adoption_summary() IS 'Returns summary statistics about module adoption across the system';