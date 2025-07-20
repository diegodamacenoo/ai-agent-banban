import { useOrganization } from '@/core/contexts/OrganizationContext';
import { useMemo } from 'react';

// Interfaces para a nova estrutura
interface CustomModule {
  id: string;
  name: string;
  enabled: boolean;
  version?: string;
  config?: Record<string, any>;
}

interface Feature {
  id: string;
  name: string;
  enabled: boolean;
  config?: Record<string, any>;
}

interface ClientTypeConfig {
  modules: {
    standard: string[];
    custom: CustomModule[];
  };
  permissions: string[];
  features: Feature[];
}

export function useClientType() {
  const { organization, isLoading } = useOrganization();
  
  const clientType = organization?.client_type || 'standard';
  const isCustom = clientType === 'custom';
  const isStandard = clientType === 'standard';

  // Configuração completa do tipo de cliente
  const clientTypeConfig: ClientTypeConfig = useMemo(() => {
    // Módulos padrão sempre disponíveis
    const standardModules = ['performance', 'inventory', 'alerts', 'analytics'];
    
    // Extrair módulos customizados do implementation_config
    const implementationConfig = organization?.implementation_config || {};
    const customModules: CustomModule[] = (implementationConfig.enabled_modules || []).map((moduleId: string) => ({
      id: moduleId,
      name: moduleId.charAt(0).toUpperCase() + moduleId.slice(1),
      enabled: true,
      version: implementationConfig.module_versions?.[moduleId] || '1.0.0',
      config: implementationConfig.module_configs?.[moduleId] || {}
    }));

    // Extrair permissões baseadas no role e configuração
    const basePermissions = isCustom ? ['custom:access'] : ['standard:access'];
    const rolePermissions = implementationConfig.permissions || [];
    const permissions = [...basePermissions, ...rolePermissions];

    // Extrair features habilitadas
    const features: Feature[] = (implementationConfig.features || []).map((featureId: string) => ({
      id: featureId,
      name: featureId.charAt(0).toUpperCase() + featureId.slice(1),
      enabled: true,
      config: implementationConfig.feature_configs?.[featureId] || {}
    }));

    return {
      modules: {
        standard: standardModules,
        custom: customModules
      },
      permissions,
      features
    };
  }, [organization, isCustom]);

  // Função para verificar se um módulo está habilitado
  const hasModule = (moduleId: string): boolean => {
    return clientTypeConfig.modules.standard.includes(moduleId) ||
           clientTypeConfig.modules.custom.some(m => m.id === moduleId && m.enabled);
  };

  // Função para verificar permissão
  const hasPermission = (permission: string): boolean => {
    return clientTypeConfig.permissions.includes(permission);
  };

  // Função para verificar feature
  const hasFeature = (featureId: string): boolean => {
    return clientTypeConfig.features.some(f => f.id === featureId && f.enabled);
  };

  // Função para obter configuração de módulo
  const getModuleConfig = (moduleId: string): Record<string, any> | null => {
    const customModule = clientTypeConfig.modules.custom.find(m => m.id === moduleId);
    return customModule?.config || null;
  };

  return {
    // Dados básicos (compatibilidade)
    clientType,
    isCustom,
    isStandard,
    isLoading,
    customModules: clientTypeConfig.modules.custom.map(m => m.id), // Compatibilidade
    standardModules: clientTypeConfig.modules.standard, // Compatibilidade
    backendUrl: organization?.custom_backend_url,
    isImplementationComplete: organization?.is_implementation_complete || false,
    organizationName: organization?.company_trading_name || organization?.company_legal_name,
    
    // Nova estrutura expandida
    config: clientTypeConfig,
    
    // Funções utilitárias
    hasModule,
    hasPermission,
    hasFeature,
    getModuleConfig,
    
    // Dados da organização
    organization: {
      id: organization?.id,
      legalName: organization?.company_legal_name,
      tradingName: organization?.company_trading_name,
      slug: organization?.slug,
      implementationDate: organization?.implementation_date,
      implementationNotes: organization?.implementation_team_notes
    }
  };
} 
