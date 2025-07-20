# Database Schema Reference

## Core Tables

### **Multi-Tenant Foundation**
```sql
-- organizations: Tenant root
id, name, slug, domain, settings, created_at

-- profiles: Users with org isolation  
id, user_id, organization_id, role, metadata
```

### **Module System (3-Layer)**
```sql
-- base_modules: Catalog
id, slug, name, category, supports_multi_tenant, metadata

-- module_implementations: Code mappings
id, base_module_id, implementation_key, component_path, audience

-- tenant_module_assignments: Active assignments  
tenant_id, base_module_id, implementation_id, is_active, custom_config
```

### **Audit & Monitoring**
```sql
-- module_file_audit: File integrity tracking
id, module_slug, file_path, checksum, status, tenant_id

-- module_discovery_log: Health monitoring
id, module_slug, status, issues_found, last_check
```

## RLS Patterns

### **Standard Org Isolation**
```sql
-- Default pattern for all tenant data
USING (organization_id = get_user_org_id())

-- Module assignments isolation
USING (tenant_id = get_user_org_id())
```

### **Admin Override** 
```sql
-- Admin tables (no RLS)
base_modules, module_implementations

-- Admin with org access
USING (is_admin() OR organization_id = get_user_org_id())
```

## Key Relationships

### **Tenant Hierarchy**
```
organizations (tenant root)
├── profiles (users)
├── tenant_module_assignments (active modules)
└── module_file_audit (file tracking)
```

### **Module System Flow**
```
base_modules (catalog)
├── module_implementations (code variants)
└── tenant_module_assignments (per-tenant config)
```

## Indexes & Performance

### **Critical Indexes**
```sql
-- Multi-tenant queries
profiles(organization_id, user_id)
tenant_module_assignments(tenant_id, base_module_id)
module_file_audit(tenant_id, module_slug)

-- Module resolution
module_implementations(base_module_id, audience)
base_modules(slug, supports_multi_tenant)
```

### **Composite Indexes**
```sql
-- Health monitoring
module_discovery_log(module_slug, status, last_check)

-- Audit queries  
module_file_audit(tenant_id, status, created_at)
```

## Data Types & Constraints

### **JSONB Configs**
```typescript
// organizations.settings
{
  branding?: BrandingConfig;
  features?: FeatureFlags;
  modules?: ModuleOverrides;
}

// tenant_module_assignments.custom_config  
{
  permissions?: string[];
  ui_overrides?: UIConfig;
  data_sources?: DataSourceConfig;
}
```

### **Enums**
```sql
-- Common status patterns
'active' | 'inactive' | 'pending' | 'error'

-- Module categories
'analytics' | 'insights' | 'inventory' | 'performance'

-- User roles  
'admin' | 'user' | 'viewer'
```

## Security Constraints

### **Tenant Isolation Rules**
- All user data MUST include `organization_id`
- Module assignments MUST use `tenant_id` 
- File audit MUST track `tenant_id`
- No cross-tenant data access (enforced by RLS)

### **Admin Safety**
- Admin tables have no RLS (base_modules, module_implementations)
- Admin users bypass RLS on read operations
- Write operations still respect tenant boundaries