# Server Actions Patterns Guide

## Core Patterns

### **Standard Action Structure**
```typescript
'use server';

export async function actionName(
  input: ValidationSchema
): Promise<ActionResult<ReturnType>> {
  try {
    // 1. Input validation
    const validated = Schema.parse(input);
    
    // 2. Authentication check
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    
    // 3. Authorization check (multi-tenant)
    const orgId = await getUserOrgId();
    if (!hasPermission(user, 'required_permission')) {
      return { success: false, error: 'Forbidden' };
    }
    
    // 4. Business logic
    const result = await performOperation(validated, orgId);
    
    // 5. Success response
    return { 
      success: true, 
      data: result,
      message: 'Operation successful' 
    };
  } catch (error) {
    // 6. Error handling
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

### **Multi-Tenant Isolation Pattern**
```typescript
// ALWAYS include organization_id in queries
export async function getOrganizationData() {
  const user = await getCurrentUser();
  const orgId = user.organization_id;
  
  // RLS automatically filters, but explicit filtering is safer
  const { data } = await supabase
    .from('tenant_data')
    .select('*')
    .eq('organization_id', orgId);
    
  return data;
}

// For admin operations (bypass tenant isolation)
export async function adminOperation() {
  const user = await getCurrentUser();
  if (!user.is_admin) {
    throw new Error('Admin access required');
  }
  
  // Admin can access all data
  const { data } = await supabase
    .from('admin_table')
    .select('*');
    
  return data;
}
```

## Module System Patterns

### **Module CRUD Operations**
```typescript
export async function createModule(input: CreateModuleInput) {
  const validated = CreateModuleSchema.parse(input);
  
  // Check admin permissions
  const user = await getCurrentUser();
  if (!user.is_admin) {
    return { success: false, error: 'Admin access required' };
  }
  
  // Create with audit trail
  const { data, error } = await supabase
    .from('base_modules')
    .insert({
      ...validated,
      created_by: user.id,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
    
  if (error) {
    return { success: false, error: error.message };
  }
  
  // Revalidate relevant paths
  revalidatePath('/admin/modules');
  
  return { success: true, data };
}
```

### **Cache Invalidation Pattern (Added Jan 2025)**
```typescript
export async function updateTenantModule(input: UpdateInput) {
  try {
    // Standard validation and update logic
    const result = await performUpdate(input);
    
    // Standard path revalidation
    revalidatePath('/admin/assignments');
    revalidatePath(`/admin/organizations/${input.tenant_id}`);
    
    // NEW: Module-specific cache invalidation
    const { invalidateModuleCacheForOrg } = await import('../cache-invalidation');
    await invalidateModuleCacheForOrg(input.tenant_id);
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Global cache invalidation for system-wide changes
export async function updateBaseModule(input: BaseModuleInput) {
  try {
    const result = await performUpdate(input);
    
    // Standard revalidation
    revalidatePath('/admin/modules');
    
    // NEW: Global cache invalidation (affects all tenants)
    const { invalidateGlobalModuleCache } = await import('../cache-invalidation');
    await invalidateGlobalModuleCache();
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### **Tenant Assignment Pattern**
```typescript
export async function assignModuleToTenant(input: AssignmentInput) {
  const validated = AssignmentSchema.parse(input);
  
  // Verify module exists and is active
  const module = await getBaseModule(validated.base_module_id);
  if (!module || !module.is_active) {
    return { success: false, error: 'Module not available' };
  }
  
  // Check implementation compatibility
  const implementation = await getImplementation(validated.implementation_id);
  if (implementation.base_module_id !== module.id) {
    return { success: false, error: 'Implementation mismatch' };
  }
  
  // Create assignment with tenant isolation
  const assignment = await supabase
    .from('tenant_module_assignments')
    .insert({
      ...validated,
      tenant_id: validated.organization_id, // Explicit tenant binding
      created_by: user.id,
    });
    
  // Trigger module discovery for tenant
  await triggerModuleDiscovery(validated.organization_id);
  
  return { success: true, data: assignment.data };
}
```

## Validation Patterns

### **Zod Schema with Transform**
```typescript
const ModuleConfigSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string()
    .regex(/^[a-z0-9-]+$/, 'Invalid slug format')
    .transform(slug => slug.toLowerCase()),
  permissions: z.array(z.string()).default([]),
  config: z.record(z.any()).default({}),
}).transform(data => ({
  ...data,
  // Auto-generate fields
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));
```

### **Conditional Validation**
```typescript
const ConditionalSchema = z.object({
  component_type: z.enum(['file', 'generated']),
  component_path: z.string().optional(),
  template_type: z.string().optional(),
}).refine(data => {
  // File type requires component_path
  if (data.component_type === 'file' && !data.component_path) {
    return false;
  }
  // Generated type requires template_type
  if (data.component_type === 'generated' && !data.template_type) {
    return false;
  }
  return true;
}, {
  message: "Component type and path/template requirements don't match"
});
```

## Error Handling Patterns

### **Structured Error Response**
```typescript
function createErrorResponse(error: unknown): ActionResult {
  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: 'Validation failed',
      details: error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    };
  }
  
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
    };
  }
  
  return {
    success: false,
    error: 'Unknown error occurred',
  };
}
```

### **Database Error Handling**
```typescript
export async function safeDbOperation() {
  try {
    const { data, error } = await supabase
      .from('table')
      .insert(payload);
      
    if (error) {
      // Handle specific Postgres errors
      if (error.code === '23505') { // Unique violation
        return { success: false, error: 'Resource already exists' };
      }
      if (error.code === '23503') { // Foreign key violation
        return { success: false, error: 'Referenced resource not found' };
      }
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    return createErrorResponse(error);
  }
}
```

## Performance Patterns

### **Optimistic Updates**
```typescript
export async function optimisticUpdate(id: string, updates: Partial<Entity>) {
  // Return optimistic data immediately
  const optimisticResult = { ...currentData, ...updates };
  
  // Perform actual update in background
  const { data, error } = await supabase
    .from('entities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    // Revert optimistic update
    revalidatePath('/current-path');
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
}
```

### **Batch Operations**
```typescript
export async function batchOperation(items: Array<BatchItem>) {
  const results = [];
  const errors = [];
  
  // Process in chunks to avoid timeouts
  const chunks = chunkArray(items, 10);
  
  for (const chunk of chunks) {
    try {
      const { data, error } = await supabase
        .from('table')
        .upsert(chunk)
        .select();
        
      if (error) {
        errors.push(error);
      } else {
        results.push(...data);
      }
    } catch (error) {
      errors.push(error);
    }
  }
  
  return {
    success: errors.length === 0,
    data: results,
    errors: errors.length > 0 ? errors : undefined,
  };
}
```

## Security Patterns

### **Admin-Only Actions**
```typescript
export async function adminOnlyAction() {
  const user = await getCurrentUser();
  
  if (!user?.is_admin) {
    return { success: false, error: 'Admin access required' };
  }
  
  // Admin operation...
}
```

### **Permission-Based Access**
```typescript
export async function permissionBasedAction(requiredPermission: string) {
  const user = await getCurrentUser();
  
  if (!hasPermission(user, requiredPermission)) {
    return { success: false, error: `Permission required: ${requiredPermission}` };
  }
  
  // Authorized operation...
}
```

## Performance & Cache Patterns

- **Global Cache**: Use global cache for data that changes infrequently (see `cache-patterns.md`)
- **Request Tracking**: Add `trackServerCall()` to all server actions for debugging  
- **Consolidate revalidatePath**: Avoid redundant cache invalidations

## Anti-Patterns (AVOID)

### **❌ Sync Function Exports**
```typescript
// NEVER export sync functions from server action files
export function syncUtility() { } // ❌ Will cause runtime errors
```

### **❌ Direct Error Throwing**
```typescript
// NEVER throw errors directly in server actions
export async function badAction() {
  throw new Error('This breaks the UI'); // ❌ Breaks client
}
```

### **❌ Missing Tenant Isolation**
```typescript
// NEVER query without tenant context
export async function unsafeQuery() {
  const data = await supabase.from('user_data').select(); // ❌ Data leak
}
```