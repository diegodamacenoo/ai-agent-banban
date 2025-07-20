# Guia de Implementação RBAC (Role-Based Access Control)

## 📋 Visão Geral

Este documento estabelece as diretrizes e padrões para a implementação do sistema RBAC (Role-Based Access Control) na aplicação. O RBAC é fundamental para garantir que usuários tenham acesso apenas aos recursos e funcionalidades apropriados ao seu nível de permissão.

## 🏗️ Arquitetura

### Estrutura de Dados

#### Tabela `roles`
```sql
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Perfis Padrão
1. **organization_admin**
   - Acesso total para administrar a organização
   - Permissões: `["users:create", "users:read", "users:update", "users:delete", "roles:create", "roles:read", "roles:update", "roles:delete"]`

2. **standard_user**
   - Acesso padrão para recursos principais
   - Permissões: `["dashboard:read", "reports:read"]`

3. **reader**
   - Acesso somente leitura
   - Permissões: `["dashboard:read"]`

### Funções Auxiliares SQL

```sql
-- Obter organização do usuário atual
CREATE FUNCTION get_user_organization_id() RETURNS UUID

-- Verificar se é admin da organização  
CREATE FUNCTION is_organization_admin() RETURNS BOOLEAN

-- Verificar se é master admin
CREATE FUNCTION is_master_admin() RETURNS BOOLEAN

-- Verificar acesso à organização
CREATE FUNCTION can_access_organization(UUID) RETURNS BOOLEAN
```

## 🔒 Sistema de Permissões

### Formato das Permissões

As permissões seguem o formato `recurso:ação`, onde:
- **recurso**: O recurso sendo acessado (ex: users, roles, dashboard)
- **ação**: A operação sendo realizada (ex: create, read, update, delete)

### Permissões Disponíveis

#### Usuários e Perfis
- `users:create` - Criar usuários
- `users:read` - Visualizar usuários
- `users:update` - Atualizar usuários
- `users:delete` - Remover usuários
- `roles:create` - Criar perfis
- `roles:read` - Visualizar perfis
- `roles:update` - Atualizar perfis
- `roles:delete` - Remover perfis

#### Dashboard e Relatórios
- `dashboard:read` - Visualizar dashboard
- `reports:read` - Visualizar relatórios
- `reports:export` - Exportar relatórios

#### Configurações
- `settings:read` - Visualizar configurações
- `settings:update` - Atualizar configurações

#### Auditoria
- `audit:read` - Visualizar logs de auditoria
- `audit:export` - Exportar logs de auditoria

## 🛠️ Implementação

### Hook de Autorização

```typescript
// hooks/use-authorization.ts
import { useCallback } from 'react';
import { useUser } from '@/hooks/use-user';

export function useAuthorization() {
  const { user, profile } = useUser();

  const hasPermission = useCallback((permission: string) => {
    if (!user || !profile) return false;
    
    // Master admin tem todas as permissões
    if (profile.role === 'master_admin') return true;
    
    // Verificar permissões específicas do perfil
    const userPermissions = profile.permissions || [];
    return userPermissions.includes(permission);
  }, [user, profile]);

  const hasAnyPermission = useCallback((permissions: string[]) => {
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: string[]) => {
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  };
}
```

### Componente PermissionGate

```typescript
// components/ui/permission-gate.tsx
import { ReactNode } from 'react';
import { useAuthorization } from '@/hooks/use-authorization';

interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({
  permission,
  permissions = [],
  requireAll = false,
  children,
  fallback = null
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuthorization();

  // Verificar permissão única
  if (permission && !hasPermission(permission)) {
    return fallback;
  }

  // Verificar múltiplas permissões
  if (permissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!hasAccess) {
      return fallback;
    }
  }

  return children;
}
```

### Middleware de Proteção

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.delete(name)
        },
      },
    }
  )
  // ... rest of the middleware code ...
}
```

## 📝 Uso

### Em Componentes

```typescript
// Verificação simples
<PermissionGate permission="users:create">
  <Button>Criar Usuário</Button>
</PermissionGate>

// Múltiplas permissões (qualquer uma)
<PermissionGate permissions={['reports:read', 'reports:export']}>
  <ReportsTable />
</PermissionGate>

// Múltiplas permissões (todas necessárias)
<PermissionGate 
  permissions={['reports:read', 'reports:export']} 
  requireAll={true}
>
  <ExportButton />
</PermissionGate>

// Com fallback
<PermissionGate 
  permission="settings:update"
  fallback={<p>Você não tem permissão para editar configurações</p>}
>
  <SettingsForm />
</PermissionGate>
```

### Em Server Actions

```typescript
import { createSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

async function verifyPermission(userId: string, permission: string): Promise<boolean> {
  const cookieStore = await cookies();
  const supabase = createSupabaseClient(cookieStore);

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, permissions')
    .eq('id', userId)
    .single();

  if (!profile) return false;
  if (profile.role === 'master_admin') return true;
  
  return profile.permissions?.includes(permission) || false;
}

export async function updateUserSettings(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createSupabaseClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Não autorizado' };
  }

  const hasPermission = await verifyPermission(user.id, 'settings:update');
  if (!hasPermission) {
    return { error: 'Permissão negada' };
  }

  // Prosseguir com a atualização...
}
```

## 🔍 Auditoria

Todas as operações que envolvem mudanças de permissões devem ser registradas nos logs de auditoria:

```typescript
await createAuditLog({
  actor_user_id: user.id,
  action_type: AUDIT_ACTION_TYPES.USER_ROLE_CHANGED,
  resource_type: AUDIT_RESOURCE_TYPES.USER,
  resource_id: targetUserId,
  organization_id: organizationId,
  details: {
    old_role: oldRole,
    new_role: newRole,
    old_permissions: oldPermissions,
    new_permissions: newPermissions,
  },
  ip_address: ipAddress,
  user_agent: userAgent,
});
```

## ⚠️ Considerações de Segurança

1. **Verificação em Camadas**
   - Sempre verificar permissões tanto no frontend quanto no backend
   - Nunca confiar apenas em verificações do cliente

2. **Cache de Permissões**
   - Implementar cache com invalidação apropriada
   - Atualizar cache após mudanças de permissões

3. **Auditoria**
   - Registrar todas as mudanças de permissões
   - Monitorar tentativas de acesso não autorizado

4. **Princípio do Menor Privilégio**
   - Atribuir apenas as permissões necessárias
   - Revisar periodicamente as permissões atribuídas

## 📚 Próximos Passos

1. Implementar hook `useAuthorization`
2. Criar componente `PermissionGate`
3. Expandir middleware de proteção
4. Adicionar verificações em todas as rotas protegidas
5. Implementar página de acesso negado
6. Criar testes automatizados
7. Documentar todas as permissões disponíveis 