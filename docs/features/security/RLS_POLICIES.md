# Row Level Security (RLS) Policies Documentation

## Overview

This document describes the Row Level Security (RLS) policies implemented in the BanBan project. These policies ensure data isolation and access control at the database level.

## Security Functions

### Core Functions

1. `get_user_organization_id()`
   - Returns the organization ID of the currently authenticated user
   - Used for organization-level data isolation

2. `is_organization_admin()`
   - Checks if the current user is an organization admin
   - Returns true for both organization_admin and master_admin roles

3. `is_master_admin()`
   - Checks if the current user is a master admin
   - Highest level of access in the system

4. `can_access_organization(org_id UUID)`
   - Checks if the user can access data for a specific organization
   - Returns true for users in the organization or master admins

### Analytics Functions

1. `has_analytics_access()`
   - Checks if the user has access to analytics features
   - True for:
     - organization_admin
     - master_admin
     - analytics_user
     - Users with analytics_access permission

2. `can_modify_analytics()`
   - Checks if the user can modify analytics data
   - True for:
     - organization_admin
     - master_admin
     - Users with analytics_modify permission

## Table Policies

### Core Tables

#### Profiles
- Users can view/edit their own profile
- Organization admins can view/edit profiles in their organization
- Master admins can view/edit all profiles

```sql
CREATE POLICY "profiles_isolation" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR 
    (is_organization_admin() AND organization_id = get_user_organization_id()) OR
    is_master_admin()
  );
```

#### Organizations
- Users can only access their own organization
- Master admins can access all organizations

```sql
CREATE POLICY "organizations_isolation" ON organizations
  FOR ALL USING (
    id = get_user_organization_id() OR is_master_admin()
  );
```

#### Audit Logs
- Users can view their own audit logs
- Organization admins can view logs for their organization
- Master admins can view all logs
- Service role can insert logs

### Analytics Tables

#### Forecast Sales
- Read access requires analytics_access permission
- Modify access requires analytics_modify permission
- Data isolated by organization through product relationships

```sql
CREATE POLICY "forecast_sales_isolation" ON forecast_sales
  FOR SELECT USING (
    has_analytics_access() AND (
      EXISTS (
        SELECT 1 FROM core_product_variants v
        JOIN core_products p ON v.product_id = p.id
        WHERE v.id = forecast_sales.variant_id
        AND p.organization_id = get_user_organization_id()
      )
      OR is_master_admin()
    )
  );
```

#### Analytics Config
- Organization-level configuration
- Read access requires analytics_access
- Modify access requires analytics_modify
- Service role has full access for ETL operations

## Service Role Access

Special policies exist for the service role to:
- Insert audit logs
- Manage analytics data
- Access metrics cache
- Perform ETL operations

```sql
CREATE POLICY "service_role_analytics_access" ON analytics_config
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

## Security Indexes

### Core Indexes
- `idx_profiles_organization_id`
- `idx_audit_logs_actor_org`
- `idx_core_products_org`
- `idx_core_locations_org`

### Analytics Indexes
- `idx_forecast_sales_variant_location`
- `idx_projected_coverage_variant_location`
- `idx_abc_analysis_variant_location`
- `idx_price_simulations_variant_date`
- `idx_analytics_config_org_type`

## Best Practices

1. **Always Use RLS Functions**
   - Never hardcode user IDs or organization IDs
   - Use the provided security functions

2. **Service Role Usage**
   - Only use service role for system operations
   - Always include proper checks in service role policies

3. **Performance Considerations**
   - Use provided indexes for RLS-related queries
   - Avoid nested subqueries in policies when possible

4. **Policy Maintenance**
   - Test policies thoroughly after changes
   - Keep policy definitions simple and focused
   - Document any policy changes

## Testing RLS Policies

To test RLS policies:

1. Connect as different user roles:
```sql
SET ROLE authenticated;
SET ROLE service_role;
RESET ROLE;
```

2. Verify access patterns:
```sql
SELECT * FROM profiles; -- Should only show allowed rows
SELECT * FROM analytics_config; -- Should respect analytics access
```

3. Verify organization isolation:
```sql
SELECT * FROM core_products; -- Should only show organization's products
```

## Troubleshooting

Common issues and solutions:

1. **Access Denied Unexpectedly**
   - Verify user role and permissions
   - Check organization relationships
   - Validate RLS function logic

2. **Performance Issues**
   - Ensure indexes are being used
   - Check EXPLAIN ANALYZE output
   - Optimize policy conditions

3. **Service Role Issues**
   - Verify role is set correctly
   - Check policy definitions
   - Validate authentication context 