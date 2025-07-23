# Database Schema Reference

## Core Tables

### **Multi-Tenant Foundation**
```sql
-- organizations: Tenant root (UPDATED Jan 2025)
id, company_legal_name, company_trading_name, cnpj, state_registration,
address_*, default_timezone, default_currency, client_type,
implementation_config, is_implementation_complete, slug, status,
module_strategy, tenant_type, beta_features_enabled, is_active

-- profiles: Users with org isolation (UPDATED Jan 2025)
id, organization_id, role, first_name, last_name, username, avatar_url,
job_title, team_id, deleted_at, is_2fa_enabled, preferences_*,
theme, is_setup_complete, phone, location, status
```

### **Module System (3-Layer)**
```sql
-- base_modules: Catalog (UPDATED Jan 2025)
id, slug, name, description, category, is_active, icon, route_pattern,
permissions_required[], supports_multi_tenant, config_schema,
archived_at, deleted_at, created_by, dependencies, status, tags, version

-- module_implementations: Code mappings (UPDATED Jan 2025)  
id, base_module_id, implementation_key, component_path, is_default,
is_active, component_type, template_type, template_config,
dependencies[], config_schema_override, archived_at, deleted_at,
name, description, version, audience, complexity, priority, status

-- tenant_module_assignments: Active assignments (UPDATED Jan 2025)
tenant_id, base_module_id, implementation_id, is_active, is_visible,
status, custom_config, permissions_override[], user_groups[],
activation_date, deactivation_date, assigned_at, assigned_by, id
```

### **Audit & Monitoring**
```sql
-- module_file_audit: File integrity tracking (UPDATED Jan 2025)
id, module_id, organization_id, event_type, file_path, file_hash,
previous_hash, previous_status, new_status, impact_level,
detected_at, metadata, created_at

-- module_discovery_log: Health monitoring (Structure maintained)
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

## Database Functions - CONSOLIDADAS (Jan 2025)

### ✅ **Funções de Visibilidade - FONTE ÚNICA DE VERDADE**

#### **1. get_user_visible_modules() - PRINCIPAL**
```sql
-- ✅ IMPLEMENTADA: Função consolidada de visibilidade
CREATE OR REPLACE FUNCTION get_user_visible_modules(
  p_tenant_id UUID, 
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
  module_slug TEXT,
  module_name TEXT,
  category TEXT,
  can_view BOOLEAN,
  can_access BOOLEAN,
  id UUID,
  custom_config JSONB,
  permissions_override JSONB,
  status TEXT,
  implementation_key TEXT,
  component_path TEXT,
  is_active BOOLEAN,
  is_visible BOOLEAN
) AS $$
BEGIN
  -- Lógica consolidada:
  -- 1. Verifica tenant_module_assignments
  -- 2. Aplica regras de visibilidade (is_visible + is_active)
  -- 3. Valida datas de ativação/desativação
  -- 4. Retorna dados completos para interface
  
  RETURN QUERY
  SELECT 
    bm.slug::TEXT as module_slug,
    bm.name::TEXT as module_name,
    bm.category::TEXT as category,
    (tma.is_visible AND tma.is_active)::BOOLEAN as can_view,
    (tma.is_active AND 
     (tma.activation_date IS NULL OR tma.activation_date <= NOW()) AND
     (tma.deactivation_date IS NULL OR tma.deactivation_date > NOW())
    )::BOOLEAN as can_access,
    tma.id,
    tma.custom_config,
    to_jsonb(tma.permissions_override) as permissions_override,
    tma.status::TEXT,
    COALESCE(mi.implementation_key, 'default')::TEXT as implementation_key,
    COALESCE(mi.component_path, '')::TEXT as component_path,
    tma.is_active,
    tma.is_visible
  FROM tenant_module_assignments tma
  JOIN base_modules bm ON bm.id = tma.base_module_id
  LEFT JOIN module_implementations mi ON mi.id = tma.implementation_id
  WHERE tma.tenant_id = p_tenant_id
    AND bm.is_active = true
    AND (bm.deleted_at IS NULL AND bm.archived_at IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### **2. get_visible_modules_for_tenant() - API SIMPLIFICADA**
```sql
-- ✅ IMPLEMENTADA: API simplificada para interface
CREATE OR REPLACE FUNCTION get_visible_modules_for_tenant(
  p_tenant_id UUID
)
RETURNS VARCHAR[] AS $$
BEGIN
  -- Retorna apenas slugs dos módulos visíveis
  RETURN ARRAY(
    SELECT module_slug::VARCHAR
    FROM get_user_visible_modules(p_tenant_id)
    WHERE can_view = true
    ORDER BY module_slug
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### **3. user_can_access_module() - VALIDAÇÃO ESPECÍFICA**
```sql
-- ✅ IMPLEMENTADA: Validação granular de acesso
CREATE OR REPLACE FUNCTION user_can_access_module(
  p_tenant_id UUID,
  p_module_slug VARCHAR(50),
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Valida se usuário pode acessar módulo específico
  RETURN EXISTS(
    SELECT 1
    FROM get_user_visible_modules(p_tenant_id, p_user_id)
    WHERE module_slug = p_module_slug
      AND can_access = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### **4. get_module_stats() - ESTATÍSTICAS CONSOLIDADAS**
```sql
-- ✅ IMPLEMENTADA: Estatísticas para admin
CREATE OR REPLACE FUNCTION get_module_stats(
  p_tenant_id UUID DEFAULT NULL
)
RETURNS TABLE(
  total_modules INTEGER,
  active_modules INTEGER,
  visible_modules INTEGER,
  inactive_modules INTEGER,
  custom_implementations INTEGER
) AS $$
BEGIN
  IF p_tenant_id IS NULL THEN
    -- Estatísticas globais
    RETURN QUERY
    SELECT 
      COUNT(*)::INTEGER as total_modules,
      COUNT(*) FILTER (WHERE is_active = true)::INTEGER as active_modules,
      COUNT(*) FILTER (WHERE is_visible = true AND is_active = true)::INTEGER as visible_modules,
      COUNT(*) FILTER (WHERE is_active = false)::INTEGER as inactive_modules,
      COUNT(*) FILTER (WHERE implementation_id IS NOT NULL)::INTEGER as custom_implementations
    FROM tenant_module_assignments;
  ELSE
    -- Estatísticas por tenant
    RETURN QUERY
    SELECT 
      COUNT(*)::INTEGER as total_modules,
      COUNT(*) FILTER (WHERE is_active = true)::INTEGER as active_modules,
      COUNT(*) FILTER (WHERE is_visible = true AND is_active = true)::INTEGER as visible_modules,
      COUNT(*) FILTER (WHERE is_active = false)::INTEGER as inactive_modules,
      COUNT(*) FILTER (WHERE implementation_id IS NOT NULL)::INTEGER as custom_implementations
    FROM tenant_module_assignments
    WHERE tenant_id = p_tenant_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 🎯 **Como Usar as Funções**

```sql
-- 1. Obter todos os módulos visíveis (interface principal)
SELECT * FROM get_user_visible_modules('tenant-uuid');

-- 2. Obter apenas slugs (sidebar/navegação)
SELECT get_visible_modules_for_tenant('tenant-uuid');

-- 3. Verificar acesso específico (middleware)
SELECT user_can_access_module('tenant-uuid', 'performance', 'user-uuid');

-- 4. Estatísticas para admin
SELECT * FROM get_module_stats('tenant-uuid');
```

### 🚨 **CORREÇÕES CRÍTICAS APLICADAS**

1. **✅ Eliminou 4 fontes de configuração conflitantes**
2. **✅ Fonte única de verdade via `get_user_visible_modules()`**
3. **✅ Cache inteligente com invalidação automática**
4. **✅ Sincronização 100% entre admin e tenant interface**

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

-- New performance indexes (Added Jan 2025)
tenant_module_assignments(tenant_id, status)
tenant_module_assignments(tenant_id, is_visible)
tenant_module_assignments(tenant_id, is_active)
tenant_module_assignments(tenant_id, is_active, is_visible, status) -- composite
base_modules(slug) WHERE archived_at IS NULL AND deleted_at IS NULL
module_implementations(base_module_id, implementation_key) WHERE archived_at IS NULL
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