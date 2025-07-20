/**
 * Adaptadores para compatibilidade com sistema antigo
 * Fase 3 - Dynamic Navigation Implementation
 * 
 * Mantém compatibilidade com unified-sidebar.tsx existente
 */

'use client';

import React from 'react';
import { DynamicSidebar, DynamicSidebarWrapper } from '../DynamicSidebar';
import { ClientType } from '@/core/modules/types';

// Re-export dos tipos para compatibilidade
export interface SidebarConfig {
  mode: 'admin' | 'tenant';
  slug?: string;
  organizationName?: string;
  navItems: any[];
  headerConfig: {
    title: string;
    subtitle: string;
    iconBg: string;
  };
}

interface NavItem {
  title: string;
  href?: string;
  icon: any;
  exact?: boolean;
  items?: Array<{
    title: string;
    href: string;
  }>;
}

/**
 * Adapter para manter compatibilidade com UnifiedSidebar
 */
export const UnifiedSidebarAdapter: React.FC<{
  organizationSlug: string;
  organizationName: string;
  clientType: ClientType;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}> = ({
  organizationSlug,
  organizationName,
  clientType,
  collapsed,
  onCollapsedChange
}) => {
  // Simulação de organização para o adapter
  const organization = {
    id: `org-${organizationSlug}`, // Idealmente isso viria do contexto/props
    slug: organizationSlug,
    name: organizationName,
    client_type: clientType
  };

  return (
    <DynamicSidebarWrapper
      organization={organization}
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
    />
  );
};

/**
 * Adapter para componentes que esperam configuração estática
 */
export const StaticToEnhancedSidebarAdapter: React.FC<{
  config: SidebarConfig;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}> = ({ config, collapsed, onCollapsedChange }) => {
  // Se é modo admin, usar DynamicSidebar também
  if (config.mode === 'admin') {
    // Para admin sem organização específica, criar uma organização temporária
    const adminOrg = {
      id: 'admin-org',
      slug: 'admin',
      name: 'Administração',
      client_type: 'banban' as ClientType
    };
    
    return (
      <DynamicSidebarWrapper
        organization={adminOrg}
        collapsed={collapsed}
        onCollapsedChange={onCollapsedChange}
      />
    );
  }

  // Para modo tenant, usar DynamicSidebar
  if (config.slug && config.organizationName) {
    return (
      <UnifiedSidebarAdapter
        organizationSlug={config.slug}
        organizationName={config.organizationName}
        clientType="banban" // Default, deve ser configurável
        collapsed={collapsed}
        onCollapsedChange={onCollapsedChange}
      />
    );
  }

  // Fallback se não há informações suficientes
  return (
    <div className="w-64 bg-gray-100 border-r p-4">
      <p className="text-sm text-gray-600">
        Configuração insuficiente para carregar sidebar
      </p>
    </div>
  );
};

/**
 * Hook para migração gradual
 */
export const useMigrationSidebar = (
  useEnhanced: boolean = true
) => {
  const [shouldUseEnhanced, setShouldUseEnhanced] = React.useState(useEnhanced);

  // Função para toggle entre sistema antigo e novo
  const toggleSidebarSystem = React.useCallback(() => {
    setShouldUseEnhanced(prev => !prev);
    
    // Salvar preferência
    try {
      localStorage.setItem('use-enhanced-sidebar', String(!shouldUseEnhanced));
    } catch (error) {
      // Ignorar erros de localStorage
    }
  }, [shouldUseEnhanced]);

  // Carregar preferência salva
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('use-enhanced-sidebar');
      if (saved !== null) {
        setShouldUseEnhanced(saved === 'true');
      }
    } catch (error) {
      // Ignorar erros de localStorage
    }
  }, []);

  return {
    useEnhanced: shouldUseEnhanced,
    toggleSidebarSystem
  };
};

/**
 * Componente para facilitar migração gradual
 */
export const MigrationSidebar: React.FC<{
  // Props do sistema antigo
  legacyConfig?: SidebarConfig;
  
  // Props do sistema novo
  organization?: {
    id: string;
    slug: string;
    name: string;
    client_type: ClientType;
  };
  
  // Controles
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  forceEnhanced?: boolean;
  showMigrationToggle?: boolean;
}> = ({
  legacyConfig,
  organization,
  collapsed,
  onCollapsedChange,
  forceEnhanced = false,
  showMigrationToggle = false
}) => {
  const { useEnhanced, toggleSidebarSystem } = useMigrationSidebar();
  
  const shouldUseEnhanced = forceEnhanced || useEnhanced;

  // Se tem organização e deve usar enhanced, usar DynamicSidebar
  if (shouldUseEnhanced && organization) {
    return (
      <>
        {showMigrationToggle && (
          <div className="fixed top-4 right-4 z-50">
            <button
              onClick={toggleSidebarSystem}
              className="bg-blue-600 text-white px-3 py-1 rounded text-xs"
            >
              Toggle: {shouldUseEnhanced ? 'Novo' : 'Antigo'}
            </button>
          </div>
        )}
        
        <DynamicSidebarWrapper
          organization={organization}
          collapsed={collapsed}
          onCollapsedChange={onCollapsedChange}
        />
      </>
    );
  }

  // Fallback para sistema antigo
  return (
    <>
      {showMigrationToggle && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={toggleSidebarSystem}
            className="bg-gray-600 text-white px-3 py-1 rounded text-xs"
          >
            Toggle: {shouldUseEnhanced ? 'Novo' : 'Antigo'}
          </button>
        </div>
      )}
      
      <StaticToEnhancedSidebarAdapter
        config={legacyConfig || { 
          mode: 'tenant', 
          navItems: [], 
          headerConfig: { title: '', subtitle: '', iconBg: '' } 
        }}
        collapsed={collapsed}
        onCollapsedChange={onCollapsedChange}
      />
    </>
  );
};

export default UnifiedSidebarAdapter;