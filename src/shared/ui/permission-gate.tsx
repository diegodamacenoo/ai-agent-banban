import { ReactNode } from 'react';
import { useAuthorization } from '@/shared/hooks/use-authorization';

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

  // Verificar permissÃ£o Ãºnica
  if (permission && !hasPermission(permission)) {
    return fallback;
  }

  // Verificar mÃºltiplas permissÃµes
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
