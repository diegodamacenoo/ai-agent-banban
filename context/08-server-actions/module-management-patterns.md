# Module Management Server Actions Patterns

## Overview

Padrões específicos para server actions de gerenciamento de módulos, com foco em operações de ciclo de vida e consistência de dados.

## 🏗️ Archive/Restore Patterns

### Archive Module (Correct Implementation)

```typescript
export async function archiveBaseModule(moduleId: string): Promise<ActionResult> {
  const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
  
  if (!isAuthenticated || !isAdmin) {
    return { success: false, error: 'Acesso negado' };
  }

  const supabase = await createSupabaseServerClient();

  // ✅ Archive only the base module
  const { error: archiveError } = await supabase
    .from('base_modules')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', moduleId);

  if (archiveError) {
    return { success: false, error: 'Erro ao arquivar módulo' };
  }

  // ✅ DON'T archive implementations
  // ✅ DON'T deactivate assignments
  // ✅ Existing tenants keep access
  
  revalidatePath('/admin/modules');
  
  return { success: true, message: 'Módulo arquivado com sucesso' };
}
```

### Restore Module Pattern

```typescript
export async function restoreBaseModule(moduleId: string): Promise<ActionResult> {
  // ✅ Restore only the base module
  await supabase
    .from('base_modules')
    .update({ archived_at: null, deleted_at: null })
    .eq('id', moduleId);

  // ✅ Implementations were never archived, no action needed
  // ✅ Assignments were never deactivated, no action needed
  
  revalidatePath('/admin/modules');
}
```

## 🔄 State Propagation Patterns

### Controlled Cascade (for is_active changes)

```typescript
export async function updateBaseModule(input: UpdateBaseModuleInput) {
  const { id, ...updateData } = input;
  
  // Check if is_active is being changed
  let shouldPropagateState = false;
  let newActiveState: boolean | undefined;
  
  if ('is_active' in updateData) {
    const { data: currentModule } = await supabase
      .from('base_modules')
      .select('is_active, name')
      .eq('id', id)
      .single();
      
    if (currentModule && currentModule.is_active !== updateData.is_active) {
      shouldPropagateState = true;
      newActiveState = updateData.is_active;
    }
  }

  // Update base module
  await supabase
    .from('base_modules')
    .update(updateData)
    .eq('id', id);

  // ✅ Propagate is_active changes (but not archive status)
  if (shouldPropagateState && newActiveState !== undefined) {
    await supabase
      .from('module_implementations')
      .update({ is_active: newActiveState })
      .eq('base_module_id', id);

    await supabase
      .from('tenant_module_assignments')
      .update({ is_active: newActiveState })
      .eq('base_module_id', id);
  }
}
```

## 🛡️ Validation Patterns

### Pre-deletion Checks

```typescript
export async function deleteBaseModule(moduleId: string): Promise<ActionResult> {
  // ✅ Check for active implementations
  const { count: implCount } = await supabase
    .from('module_implementations')
    .select('id', { count: 'exact' })
    .eq('base_module_id', moduleId);

  if (implCount && implCount > 0) {
    return { 
      success: false, 
      error: `Não é possível excluir. Existem ${implCount} implementações associadas.` 
    };
  }

  // ✅ Check for active assignments
  const { count: assignCount } = await supabase
    .from('tenant_module_assignments')
    .select('id', { count: 'exact' })
    .eq('base_module_id', moduleId);

  if (assignCount && assignCount > 0) {
    return { 
      success: false, 
      error: `Não é possível excluir. Existem ${assignCount} assignments ativos.` 
    };
  }

  // ✅ Check for dependencies
  const { data: dependents, count: depCount } = await supabase
    .from('base_modules')
    .select('name', { count: 'exact' })
    .contains('dependencies', [moduleId]);

  if (depCount && depCount > 0) {
    const dependentNames = dependents?.map(d => d.name).join(', ') || '';
    return { 
      success: false, 
      error: `Módulo é dependência de: ${dependentNames}` 
    };
  }

  // Safe to delete
  await supabase
    .from('base_modules')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', moduleId);
}
```

## 📊 Audit Logging Patterns

### Comprehensive State Change Logging

```typescript
// ✅ Log with context and impact details
await supabase.from('audit_logs').insert({
  user_id: user!.id,
  action: 'archive_base_module',
  resource_type: 'base_module',
  resource_id: moduleId,
  details: {
    module_name: existingModule.name,
    impact: {
      implementations_affected: false,
      assignments_affected: false,
      tenants_keep_access: true,
      new_assignments_blocked: true
    },
    timestamp: new Date().toISOString()
  },
});
```

## 🔍 Error Handling Patterns

### Graceful Degradation

```typescript
export async function getBaseModuleStats(): Promise<ActionResult<any>> {
  try {
    const stats = {
      overview: {
        totalBaseModules: 0,
        totalImplementations: 0,
        healthScore: 100
      }
    };

    // ✅ Try to load real data, but continue if tables don't exist
    try {
      const { count: baseModulesCount } = await supabase
        .from('base_modules')
        .select('id', { count: 'exact' })
        .is('deleted_at', null);

      stats.overview.totalBaseModules = baseModulesCount || 0;
    } catch (error) {
      console.warn('base_modules table not accessible:', error);
      // Continue with default values
    }

    return { success: true, data: stats };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}
```

## 🚫 Anti-Patterns to Avoid

### ❌ Cascading Archives Automatically
```typescript
// WRONG: Don't do this in archive function
await supabase
  .from('module_implementations')
  .update({ archived_at: new Date().toISOString() })
  .eq('base_module_id', moduleId);
```

### ❌ Deactivating Assignments on Archive
```typescript
// WRONG: Removes tenant access unexpectedly
await supabase
  .from('tenant_module_assignments')
  .update({ is_active: false })
  .eq('base_module_id', moduleId);
```

### ❌ Missing Validation
```typescript
// WRONG: No checks before destructive operations
await supabase
  .from('base_modules')
  .delete()  // Hard delete without checks
  .eq('id', moduleId);
```

## 🔄 Cache Management

### Strategic Invalidation

```typescript
// ✅ Invalidate specific paths affected by changes
revalidatePath('/admin/modules');
revalidatePath(`/admin/modules/${moduleSlug}`);

// ✅ For tenant-facing changes
revalidatePath('/[slug]/modules', 'page');
```

## 📋 Testing Patterns

### State Verification Tests

```typescript
// Test archive behavior
test('archiveBaseModule preserves tenant access', async () => {
  // 1. Create module with implementation and assignment
  // 2. Archive module
  // 3. Verify module archived but implementation active
  // 4. Verify tenant can still access
  // 5. Verify admin can't create new assignments
});
```