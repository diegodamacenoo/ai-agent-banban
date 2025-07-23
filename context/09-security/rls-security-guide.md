# Security & RLS Guide

## RLS Policy Patterns

### **Standard Tenant Isolation**
```sql
-- Default pattern for all tenant data
CREATE POLICY "tenant_isolation" ON table_name
FOR ALL 
USING (organization_id = get_user_org_id());

-- Read-only tenant isolation
CREATE POLICY "tenant_read" ON table_name
FOR SELECT 
USING (organization_id = get_user_org_id());

-- Admin bypass with tenant access
CREATE POLICY "admin_or_tenant" ON table_name
FOR ALL 
USING (is_admin() OR organization_id = get_user_org_id());
```

### **Module System Security**
```sql
-- Base modules (admin-only write, public read)
CREATE POLICY "base_modules_read" ON base_modules
FOR SELECT USING (true);

CREATE POLICY "base_modules_admin" ON base_modules
FOR INSERT, UPDATE, DELETE USING (is_admin());

-- Module assignments (tenant-specific)
CREATE POLICY "assignments_tenant" ON tenant_module_assignments
FOR ALL USING (tenant_id = get_user_org_id());

-- Module audit (tenant + admin read)
CREATE POLICY "audit_read" ON module_file_audit
FOR SELECT USING (
  tenant_id = get_user_org_id() OR is_admin()
);
```

### **Role-Based Policies**
```sql
-- Admin-only tables
CREATE POLICY "admin_only" ON admin_table
FOR ALL USING (is_admin());

-- User role filtering
CREATE POLICY "user_role_access" ON sensitive_data
FOR SELECT USING (
  organization_id = get_user_org_id() 
  AND has_permission('read_sensitive_data')
);

-- Owner-only access
CREATE POLICY "owner_only" ON user_profiles
FOR ALL USING (user_id = auth.uid());
```

## Authentication Patterns

### **Server-Side Auth Check**
```typescript
import { createServerClient } from '@/lib/supabase/server';

export async function getCurrentUser() {
  const supabase = createServerClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  // Get profile with organization context
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organization:organizations(*)')
    .eq('user_id', user.id)
    .single();
    
  return {
    ...user,
    profile,
    organization_id: profile?.organization_id,
    is_admin: profile?.role === 'admin',
  };
}
```

### **Client-Side Auth Context**
```typescript
'use client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const supabase = createClientClient();
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  return { user, loading };
}
```

## Authorization Patterns

### **Permission System**
```typescript
export function hasPermission(user: User, permission: string): boolean {
  if (!user?.profile) return false;
  
  // Admin has all permissions
  if (user.profile.role === 'admin') return true;
  
  // Check explicit permissions
  const userPermissions = user.profile.permissions || [];
  return userPermissions.includes(permission);
}

export function requirePermission(permission: string) {
  return async function() {
    const user = await getCurrentUser();
    
    if (!hasPermission(user, permission)) {
      throw new Error(`Permission required: ${permission}`);
    }
    
    return user;
  };
}
```

### **Module Access Control**
```typescript
export async function canAccessModule(
  user: User, 
  moduleSlug: string
): Promise<boolean> {
  // Admin can access all modules
  if (user.is_admin) return true;
  
  // Check if module is assigned to user's organization
  const { data: assignment } = await supabase
    .from('tenant_module_assignments')
    .select('*')
    .eq('tenant_id', user.organization_id)
    .eq('base_module_id', moduleSlug)
    .eq('is_active', true)
    .single();
    
  if (!assignment) return false;
  
  // Check permissions override
  if (assignment.permissions_override) {
    return assignment.permissions_override.some(permission =>
      hasPermission(user, permission)
    );
  }
  
  return true;
}
```

## Data Sanitization

### **Input Validation**
```typescript
import DOMPurify from 'dompurify';
import { z } from 'zod';

// Sanitize HTML content
export function sanitizeHtml(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
}

// SQL injection prevention (using Zod)
export const SafeStringSchema = z.string()
  .max(1000)
  .regex(/^[a-zA-Z0-9\s\-_.@]+$/, 'Invalid characters');

// XSS prevention for user inputs
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
```

### **Safe Database Queries**
```typescript
// Always use parameterized queries
export async function safeQuery(userId: string, orgId: string) {
  // ✅ Safe - uses parameters
  const { data } = await supabase
    .from('user_data')
    .select('*')
    .eq('user_id', userId)
    .eq('organization_id', orgId);
    
  return data;
}

// ❌ Never use string concatenation
export async function unsafeQuery(userId: string) {
  // ❌ NEVER DO THIS - SQL injection risk
  const query = `SELECT * FROM user_data WHERE user_id = '${userId}'`;
}
```

## Rate Limiting

### **Server-Side Rate Limiting**
```typescript
import { ratelimit } from '@/lib/ratelimit';

export async function rateLimitedAction(identifier: string) {
  // Check rate limit
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);
  
  if (!success) {
    return { 
      success: false, 
      error: 'Rate limit exceeded',
      retryAfter: reset,
    };
  }
  
  // Proceed with action
  return await performAction();
}
```

### **Client-Side Throttling**
```typescript
import { throttle } from 'lodash';

// Throttle user actions
export const throttledSubmit = throttle(async (data) => {
  await submitForm(data);
}, 1000, { leading: true, trailing: false });
```

## Security Headers

### **Content Security Policy**
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co",
    ].join('; '),
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
];
```

## Audit Trail

### **Action Logging**
```typescript
export async function auditLog(
  action: string,
  resource: string,
  details?: Record<string, any>
) {
  const user = await getCurrentUser();
  
  await supabase.from('audit_logs').insert({
    user_id: user?.id,
    organization_id: user?.organization_id,
    action,
    resource,
    details,
    ip_address: await getClientIP(),
    user_agent: headers().get('user-agent'),
    timestamp: new Date().toISOString(),
  });
}

// Usage in server actions
export async function sensitiveAction(input: any) {
  const result = await performAction(input);
  
  // Log the action
  await auditLog('UPDATE', 'module_configuration', {
    module_id: input.module_id,
    changes: input.changes,
  });
  
  return result;
}
```

## Service Role Key Security

### **❌ NEVER Use Service Role Key in Application Logic**

The service role key bypasses RLS policies and should only be used for admin operations or migrations.

```typescript
// ❌ BAD - Bypasses security
import { createSupabaseAdminClient } from '@/core/supabase/server';

export async function getUserData() {
  const supabase = await createSupabaseAdminClient(); // Uses service role
  // This bypasses RLS - security risk!
}

// ✅ GOOD - Uses authenticated client
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getUserData() {
  const supabase = await createSupabaseServerClient(); // Uses user context
  
  // Verify authentication first
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Not authenticated');
  }
  
  // RLS policies automatically filter data
  const { data } = await supabase
    .from('user_data')
    .select('*');
    
  return data;
}
```

### **Secure API Routes Pattern**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  
  // Always verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Verify organization access
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();
    
  if (!profile) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // RLS policies ensure data isolation
  const { data } = await supabase
    .from('protected_data')
    .select('*');
    
  return NextResponse.json({ data });
}
```

### **Server Actions Security Pattern**

```typescript
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifyAdminAccess } from '@/app/actions/admin/modules/utils';

export async function secureServerAction(input: FormData) {
  // Check maintenance mode
  const { inMaintenance, message } = await checkMaintenanceMode();
  if (inMaintenance) {
    return { success: false, error: message };
  }
  
  // Verify authentication and permissions
  const { isAuthenticated, isAdmin, user } = await verifyAdminAccess();
  if (!isAuthenticated) {
    return { success: false, error: 'Not authenticated' };
  }
  
  // Use authenticated client (not admin client)
  const supabase = await createSupabaseServerClient();
  
  // RLS policies protect data access
  const { data, error } = await supabase
    .from('protected_table')
    .insert(sanitizedData);
    
  return { success: !error, data };
}
```

### **When Service Role is Acceptable**

Only use `createSupabaseAdminClient()` for:

1. **Database Migrations**: Setting up initial data
2. **System Health Checks**: Monitoring without user context  
3. **Background Jobs**: Cron tasks, cleanup operations
4. **Admin-Only Operations**: When explicitly verified admin access

```typescript
// ✅ Acceptable use case
export async function systemHealthCheck() {
  const supabase = await createSupabaseAdminClient();
  
  // Only for system monitoring - no user data
  const { data } = await supabase
    .from('system_status')
    .select('status');
    
  return data;
}
```

## Common Vulnerabilities Prevention

### **CSRF Protection**
```typescript
// Server actions have built-in CSRF protection
// No additional measures needed for Next.js server actions

// For API routes, use CSRF tokens
import { verifyCSRFToken } from '@/lib/csrf';

export async function POST(request: Request) {
  const token = request.headers.get('X-CSRF-Token');
  
  if (!verifyCSRFToken(token)) {
    return new Response('Invalid CSRF token', { status: 403 });
  }
  
  // Process request...
}
```

### **Data Exposure Prevention**
```typescript
// Always sanitize response data
export function sanitizeUserData(user: any) {
  const { password, jwt_secret, ...safeData } = user;
  return safeData;
}

// Use explicit field selection
export async function getUserData(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('id, name, email, role') // Explicit fields only
    .eq('id', userId)
    .single();
    
  return data;
}
```