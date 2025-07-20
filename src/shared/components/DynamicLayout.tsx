/**
 * DynamicLayout - Layout integrado com sidebar dinâmica
 * Fase 3 - Dynamic Navigation Implementation
 */

'use client';

import React from 'react';
import { motion } from 'motion/react';
import { DynamicSidebar } from './DynamicSidebar';
import { SidebarContent } from '@/shared/ui/new-sidebar';
import { useDynamicLayout } from '@/shared/hooks/useDynamicLayout';
import { ClientType } from '@/core/modules/types';
import { cn } from '@/shared/utils/utils';

interface Organization {
  id: string;
  slug: string;
  name: string;
  client_type: ClientType;
}

interface DynamicLayoutProps {
  organization: Organization;
  children: React.ReactNode;
  className?: string;
  sidebarVariant?: 'default' | 'elevated' | 'ghost';
  sidebarSize?: 'sm' | 'default' | 'lg' | 'xl';
  enableModuleAccess?: boolean;
  autoRefresh?: boolean;
}

/**
 * Layout principal com sidebar dinâmica
 */
export const DynamicLayout: React.FC<DynamicLayoutProps> = ({
  organization,
  children,
  className,
  sidebarVariant = 'default',
  sidebarSize = 'default',
  enableModuleAccess = true,
  autoRefresh = true
}) => {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    navigationLoaded
  } = useDynamicLayout({
    organization,
    enableModuleAccess,
    autoRefresh
  });

  return (
    <div className={cn("flex min-h-screen bg-background", className)}>
      {/* Sidebar dinâmica */}
      <DynamicSidebar
        organizationId={organization.id}
        organizationSlug={organization.slug}
        organizationName={organization.name}
        clientType={organization.client_type}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        variant={sidebarVariant}
        size={sidebarSize}
        position="fixed"
      />

      {/* Conteúdo principal */}
      <SidebarContent
        sidebarCollapsed={sidebarCollapsed}
        className="flex-1 flex flex-col"
        position="fixed"
      >
        {/* Indicador de carregamento da navegação */}
        {!navigationLoaded && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-700"
          >
            🔄 Carregando navegação dinâmica...
          </motion.div>
        )}

        {/* Conteúdo da página */}
        <main className="flex-1">
          {children}
        </main>
      </SidebarContent>
    </div>
  );
};

/**
 * Layout com header customizado
 */
export const DynamicLayoutWithHeader: React.FC<DynamicLayoutProps & {
  header?: React.ReactNode;
}> = ({
  organization,
  children,
  header,
  className,
  ...props
}) => {
  return (
    <DynamicLayout
      organization={organization}
      className={className}
      {...props}
    >
      {header && (
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          {header}
        </header>
      )}
      <div className="flex-1 p-6">
        {children}
      </div>
    </DynamicLayout>
  );
};

/**
 * Layout para páginas de módulos
 */
export const DynamicModuleLayout: React.FC<DynamicLayoutProps & {
  moduleSlug: string;
  moduleName?: string;
  breadcrumbs?: Array<{ title: string; href?: string }>;
}> = ({
  organization,
  children,
  moduleSlug,
  moduleName,
  breadcrumbs,
  className,
  ...props
}) => {
  const header = (
    <div className="flex items-center justify-between">
      <div>
        {breadcrumbs && (
          <nav className="text-sm text-gray-500 mb-1">
            {breadcrumbs.map((crumb, index) => (
              <span key={index}>
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-gray-700">
                    {crumb.title}
                  </a>
                ) : (
                  crumb.title
                )}
                {index < breadcrumbs.length - 1 && ' / '}
              </span>
            ))}
          </nav>
        )}
        {moduleName && (
          <h1 className="text-2xl font-bold text-gray-900">
            {moduleName}
          </h1>
        )}
      </div>
      <div className="text-sm text-gray-500">
        {organization.name}
      </div>
    </div>
  );

  return (
    <DynamicLayoutWithHeader
      organization={organization}
      header={header}
      className={className}
      {...props}
    >
      {children}
    </DynamicLayoutWithHeader>
  );
};

/**
 * Layout responsivo para mobile
 */
export const ResponsiveDynamicLayout: React.FC<DynamicLayoutProps> = ({
  organization,
  children,
  className,
  ...props
}) => {
  const {
    sidebarCollapsed,
    setSidebarCollapsed
  } = useDynamicLayout({
    organization,
    enableModuleAccess: props.enableModuleAccess,
    autoRefresh: props.autoRefresh
  });

  // Auto-collapse em mobile
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Verificar na montagem

    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarCollapsed]);

  return (
    <DynamicLayout
      organization={organization}
      className={cn("relative", className)}
      {...props}
    >
      {/* Overlay para mobile */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      
      {children}
    </DynamicLayout>
  );
};

/**
 * HOC para adicionar layout dinâmico a páginas
 */
export function withDynamicLayout<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  layoutProps?: Partial<DynamicLayoutProps>
) {
  const WithDynamicLayoutComponent: React.FC<P & { organization: Organization }> = ({
    organization,
    ...props
  }) => {
    return (
      <DynamicLayout
        organization={organization}
        {...layoutProps}
      >
        <WrappedComponent {...(props as P)} />
      </DynamicLayout>
    );
  };

  WithDynamicLayoutComponent.displayName = `withDynamicLayout(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithDynamicLayoutComponent;
}

export default DynamicLayout;