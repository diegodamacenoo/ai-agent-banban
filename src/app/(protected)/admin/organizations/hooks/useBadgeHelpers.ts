import React, { useCallback } from 'react';
import { Badge } from '@/shared/ui/badge';
import { 
  Check, 
  Clock, 
  Shield, 
  UserCheck, 
  UserX 
} from 'lucide-react';
import type { Organization } from '../types';

/**
 * Hook customizado para helpers de badges
 * Centraliza a lógica de geração de badges visuais
 */
export const useBadgeHelpers = () => {
  /**
   * Calcula o número de módulos atribuídos a uma organização
   * Consolida módulos subscritos, customizados e padrão habilitados
   */
  const getModulesCount = useCallback((organization: Organization) => {
    const config = organization.implementation_config;
    if (!config) return { assigned: 0, total: 6 };

    const subscribedModules = config.subscribed_modules || [];
    const customModules = config.custom_modules || [];
    const enabledStandardModules = config.enabled_standard_modules || [];

    // Uso de Set para evitar duplicatas
    const allModules = new Set([
      ...subscribedModules,
      ...customModules,
      ...enabledStandardModules
    ]);

    return {
      assigned: allModules.size,
      total: 6 // Total de módulos disponíveis no sistema
    };
  }, []);
  
  /**
   * Gera badge visual para status de implementação da organização
   */
  const getStatusBadge = useCallback((organization: Organization) => {
    if (organization.is_implementation_complete) {
      return React.createElement(Badge, { variant: "success", className: "w-fit", icon: Check }, "Completa");
    }
    return React.createElement(Badge, { variant: "secondary", className: "w-fit", icon: Clock }, "Pendente");
  }, []);

  /**
   * Gera badge visual para tipo de cliente (custom/standard)
   */
  const getTypeBadge = useCallback((type: string) => {
    // AIDEV-NOTE: User-friendly type mapping with fallback pattern
    const typeMap: Record<string, { label: string; variant: string; className?: string }> = {
      'custom': { 
        label: 'Custom', 
        variant: 'secondary', 
        className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 w-fit' 
      },
      'standard': { label: 'Standard', variant: 'outline', className: 'w-fit' }
    };
    
    const typeConfig = typeMap[type] || { label: type, variant: 'outline', className: 'w-fit' };
    
    return React.createElement(Badge, { 
      variant: typeConfig.variant, 
      className: typeConfig.className 
    }, typeConfig.label);
  }, []);

  /**
   * Gera badge para solicitações pendentes, se houver
   */
  const getPendingRequestsBadge = useCallback((organization: Organization) => {
    const count = organization.pending_requests_count || 0;
    if (count === 0) return null;

    return React.createElement(Badge, { variant: "warning", className: "w-fit" }, `${count} pendente${count > 1 ? 's' : ''}`);
  }, []);

  /**
   * Gera badge visual para role do usuário com cores diferenciadas
   * ✅ CONFORME: User-friendly role mapping implementado
   */
  const getRoleBadge = useCallback((role: string) => {
    // AIDEV-NOTE: User-friendly role mapping with fallback pattern
    const roleMap: Record<string, { label: string; variant: string; icon?: any; className?: string }> = {
      'master_admin': { 
        label: 'Administrador Master', 
        variant: 'destructive', 
        icon: Shield,
        className: 'bg-red-600 text-white hover:bg-red-700 w-fit'
      },
      'admin': { 
        label: 'Administrador', 
        variant: 'destructive', 
        icon: Shield,
        className: 'w-fit'
      },
      'manager': { 
        label: 'Gerente', 
        variant: 'secondary',
        className: 'w-fit'
      },
      'user': { 
        label: 'Usuário', 
        variant: 'outline',
        className: 'w-fit'
      }
    };
    
    // Fallback com capitalização automática para roles não mapeados
    const roleConfig = roleMap[role] || { 
      label: role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' '), 
      variant: 'outline',
      className: 'w-fit'
    };
    
    return React.createElement(Badge, { 
      variant: roleConfig.variant, 
      className: roleConfig.className,
      icon: roleConfig.icon 
    }, roleConfig.label);
  }, []);

  /**
   * Gera badge visual para status ativo/inativo do usuário
   */
  const getStatusBadgeUser = useCallback((isActive: boolean) => {
    if (isActive) {
      return React.createElement(Badge, { variant: "success", className: "w-fit", icon: UserCheck }, "Ativo");
    }
    return React.createElement(Badge, { variant: "secondary", className: "w-fit", icon: UserX }, "Inativo");
  }, []);

  /**
   * Gera badge visual para status de módulos com mapping user-friendly
   * ✅ CONFORME: User-friendly status mapping implementado
   */
  const getModuleStatusBadge = useCallback((status: string) => {
    const statusMap: Record<string, { label: string; variant: string; className?: string }> = {
      'ACTIVE': { 
        label: 'Ativo', 
        variant: 'success',
        className: 'w-fit'
      },
      'active': { 
        label: 'Ativo', 
        variant: 'success',
        className: 'w-fit'
      },
      'IMPLEMENTED': { 
        label: 'Implementado', 
        variant: 'secondary',
        className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 w-fit'
      },
      'implemented': { 
        label: 'Implementado', 
        variant: 'secondary',
        className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 w-fit'
      },
      'PROVISIONING': { 
        label: 'Provisionando', 
        variant: 'warning',
        className: 'w-fit'
      },
      'planned': { 
        label: 'Planejado', 
        variant: 'outline',
        className: 'w-fit'
      },
      'DISABLED': { 
        label: 'Desabilitado', 
        variant: 'secondary',
        className: 'w-fit'
      },
      'archived': { 
        label: 'Arquivado', 
        variant: 'secondary',
        className: 'w-fit'
      },
      'ERROR': { 
        label: 'Erro', 
        variant: 'destructive',
        className: 'w-fit'
      },
      'missing': { 
        label: 'Ausente', 
        variant: 'destructive',
        className: 'w-fit'
      },
      'orphaned': { 
        label: 'Órfão', 
        variant: 'destructive',
        className: 'w-fit'
      }
    };
    
    // Fallback com capitalização automática
    const statusConfig = statusMap[status] || { 
      label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '), 
      variant: 'outline',
      className: 'w-fit'
    };
    
    return React.createElement(Badge, { 
      variant: statusConfig.variant, 
      className: statusConfig.className
    }, statusConfig.label);
  }, []);

  return {
    getModulesCount,
    getStatusBadge,
    getTypeBadge,
    getPendingRequestsBadge,
    getRoleBadge,
    getStatusBadgeUser,
    getModuleStatusBadge,
  };
};