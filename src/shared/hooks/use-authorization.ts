import { useCallback } from 'react';
import { useUser } from '@/shared/hooks/use-user';

export function useAuthorization() {
  const { user, profile } = useUser();

  const hasPermission = useCallback((permission: string) => {
    if (!user || !profile) return false;
    
    // Master admin tem todas as permissÃµes
    if (profile.role === 'master_admin') return true;
    
    // Verificar permissÃµes especÃ­ficas do perfil
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
