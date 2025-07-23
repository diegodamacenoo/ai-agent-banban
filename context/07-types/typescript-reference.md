# TypeScript Reference

## Core Module System Types

### **Base Module (Catalog)**
```typescript
interface BaseModule {
  id: string;
  slug: string;                    // 'performance', 'banban-insights'
  name: string;
  category: string;                // 'analytics', 'inventory', 'insights'
  supports_multi_tenant: boolean;
  permissions_required: string[];
  route_pattern: string;           // '/performance', '/insights/:id'
  config_schema: Record<string, any>;
  dependencies: string[];          // Other module slugs
  status: 'active' | 'inactive';
  archived_at: string | null;
  created_at: string;
}
```

### **Module Implementation (Code Mapping)**
```typescript
interface ModuleImplementation {
  id: string;
  base_module_id: string;
  implementation_key: string;      // 'default', 'banban-custom'
  component_path: string;          // '/widgets/performance.tsx'
  component_type: 'file' | 'generated';
  audience: 'generic' | 'client-specific' | 'enterprise';
  complexity: 'basic' | 'standard' | 'advanced' | 'enterprise';
  is_default: boolean;
  template_config: Record<string, any>;
  created_at: string;
}
```

### **Tenant Assignment (Active Config)**
```typescript  
interface TenantModuleAssignment {
  organization_id: string;         // Tenant ID
  base_module_id: string;
  implementation_id: string;
  configuration: Record<string, any>;
  permissions_override?: string[];
  user_groups?: string[];
  activation_date?: string;
  status: 'active' | 'inactive' | 'scheduled';
  created_at: string;
}
```

## Validation Schemas (Zod)

### **Create Module Schema**
```typescript
const CreateBaseModuleSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  category: z.string().min(2),
  supports_multi_tenant: z.boolean().default(true),
  permissions_required: z.array(z.string()).default([]),
  route_pattern: z.string().min(1),
  config_schema: z.record(z.any()).default({}),
  dependencies: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
});

type CreateBaseModuleInput = z.infer<typeof CreateBaseModuleSchema>;
```

### **Implementation Schema**
```typescript
const CreateModuleImplementationSchema = z.object({
  base_module_id: z.string().uuid(),
  implementation_key: z.string().regex(/^[a-z0-9-]+$/),
  component_path: z.string().optional(),
  component_type: z.enum(['file', 'generated']),
  audience: z.enum(['generic', 'client-specific', 'enterprise']),
  complexity: z.enum(['basic', 'standard', 'advanced', 'enterprise']),
  is_default: z.boolean().default(false),
});
```

## Organization & Multi-Tenancy

### **Organization (Tenant Root)**
```typescript
interface Organization {
  id: string;                      // Used as tenant_id
  name: string;
  slug: string;                    // URL-friendly identifier  
  domain?: string;                 // Custom domain
  settings: {
    branding?: BrandingConfig;
    features?: FeatureFlags;
    modules?: ModuleOverrides;
  };
  created_at: string;
}
```

### **User Profile**
```typescript
interface Profile {
  id: string;
  user_id: string;                 // Supabase auth.users.id
  organization_id: string;         // RLS isolation key
  role: 'admin' | 'user' | 'viewer';
  metadata: {
    avatar_url?: string;
    display_name?: string;
    permissions?: string[];
  };
  created_at: string;
}
```

## Server Action Patterns

### **Action Result Type**
```typescript
type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
};
```

### **Server Action Structure**
```typescript
// ALL exports must be async functions
export async function createBaseModule(
  input: CreateBaseModuleInput
): Promise<ActionResult<BaseModule>> {
  try {
    // 1. Validate input
    const validatedInput = CreateBaseModuleSchema.parse(input);
    
    // 2. Auth check
    const user = await getCurrentUser();
    if (!user?.is_admin) {
      return { success: false, error: 'Unauthorized' };
    }
    
    // 3. Database operation
    const result = await supabase
      .from('base_modules')
      .insert(validatedInput)
      .select()
      .single();
    
    // 4. Return standardized result
    return { 
      success: true, 
      data: result.data,
      message: 'Module created successfully' 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

## Client System Types

### **Client Configuration**
```typescript
interface ClientConfig {
  type: 'banban' | 'riachuelo' | 'ca';
  branding: {
    logo: string;
    colors: Record<string, string>;
    theme: 'light' | 'dark';
  };
  features: {
    modules: string[];               // Enabled module slugs
    permissions: string[];
    integrations: string[];
  };
  customizations: Record<string, any>;
}
```

### **Client Module Interface**
```typescript
interface ClientModuleInterface {
  slug: string;
  implementation: string;
  config: Record<string, any>;
  permissions: string[];
  routes: string[];
}
```

## Database Helper Types

### **RLS Context**
```typescript
// Functions available in RLS policies
declare function get_user_org_id(): string;
declare function is_admin(): boolean;
declare function has_permission(permission: string): boolean;
```

### **Supabase Client Types (UPDATED Jan 2025)**
```typescript
// Generated types from: npx supabase gen types typescript --linked
import { Database } from '@/types/database.types';

type Tables = Database['public']['Tables'];
type BaseModuleRow = Tables['base_modules']['Row'];
type ModuleImplementationRow = Tables['module_implementations']['Row'];
type TenantAssignmentRow = Tables['tenant_module_assignments']['Row'];
type OrganizationRow = Tables['organizations']['Row'];
type ProfileRow = Tables['profiles']['Row'];

// Database functions
type GetUserVisibleModules = Database['public']['Functions']['get_user_visible_modules'];
type GetVisibleModulesForTenant = Database['public']['Functions']['get_visible_modules_for_tenant'];
```

## Error Handling Types

### **Standard Error Response**
```typescript
interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

interface ValidationError {
  field: string;
  code: string;
  message: string;
}
```

### **Module System Errors**
```typescript
type ModuleError = 
  | 'MODULE_NOT_FOUND'
  | 'IMPLEMENTATION_NOT_FOUND'
  | 'TENANT_NOT_AUTHORIZED'
  | 'MODULE_DEPENDENCY_MISSING'
  | 'CONFIGURATION_INVALID';
```