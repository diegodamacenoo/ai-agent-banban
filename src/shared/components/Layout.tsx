'use client';

import React, { ReactNode, createContext, useContext } from 'react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Chip } from '@/shared/ui/chip';

// ==========================================
// TYPES & INTERFACES
// ==========================================

interface LayoutContextProps {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  width?: 'fluid' | 'container';
}

interface LayoutProps {
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
  width?: 'fluid' | 'container';
}

// ==========================================
// CONTEXT
// ==========================================

const LayoutContext = createContext<LayoutContextProps | undefined>(undefined);

function useLayoutContext() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutContext deve ser usado dentro de um Layout');
  }
  return context;
}

// ==========================================
// LOADING & ERROR STATES
// ==========================================

function LoadingOverlay() {
  return (
    <div className="flex items-center justify-center h-full flex-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Carregando...</span>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full flex-1 gap-4 p-6">
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-5 w-5" />
        <span className="font-medium">Erro ao carregar</span>
      </div>
      <p className="text-sm text-muted-foreground text-center max-w-md">{error}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

// ==========================================
// LAYOUT COMPONENTS
// ==========================================

// Header Components
const Title = ({ children }: { children: ReactNode }) => {
  return <div className="text-2xl font-medium text-[hsl(var(--foreground))]">{children}</div>;
};

const Description = ({ children }: { children: ReactNode }) => {
  return <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{children}</p>;
};

const Actions = ({ children }: { children: ReactNode }) => {
  return <div className="flex items-center gap-3">{children}</div>;
};

const Header = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  const { loading, width } = useLayoutContext();
  
  if (loading) {
    const headerContent = (
      <>
        <div className="h-6 bg-zinc-200 rounded animate-pulse w-48"></div>
        <div className="flex gap-3">
          <div className="h-10 bg-zinc-200 rounded animate-pulse w-24"></div>
          <div className="h-10 bg-zinc-200 rounded animate-pulse w-24"></div>
        </div>
      </>
    );

    return (
      <header className={`w-full border-b border-[hsl(var(--border))] ${className}`}>
        <div className={`flex items-center justify-between min-h-[150px] px-4 py-3 ${width === 'container' ? 'max-w-[80%] mx-auto' : ''}`}>
          {headerContent}
        </div>
      </header>
    );
  }

  return (
    <header className={`w-full border-b border-[hsl(var(--border))] ${className}`}>
      <div className={`flex items-center justify-between min-h-[150px] px-4 py-3 ${width === 'container' ? 'max-w-[80%] mx-auto w-full' : ''}`}>
        {children}
      </div>
    </header>
  );
};

// Layout Structure Components
const Sidebar = ({ children, className = '', width = 'w-1/3' }: { children: ReactNode; className?: string; width?: string }) => {
  return <aside className={`px-4 pt-4 ${width} ${className}`}>{children}</aside>;
};

const Content = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  return <main className={`flex-1 flex flex-col gap-6 mt-6 ${className}`}>{children}</main>;
};

const Body = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  const { loading, error, onRetry, width } = useLayoutContext();

  const bodyContent = loading ? (
    <LoadingOverlay />
  ) : error ? (
    <ErrorState error={error} onRetry={onRetry} />
  ) : (
    <div className="flex divide-x divide-zinc-200">
      {children}
    </div>
  );

  return (
    <div className={`flex-1 flex flex-col w-full ${className}`}>
      {width === 'container' ? (
        <div className="max-w-[80%] mx-auto w-full px-4 flex-1 flex flex-col">
          {bodyContent}
        </div>
      ) : (
        bodyContent
      )}
    </div>
  );
};

// ==========================================
// MAIN LAYOUT COMPONENT
// ==========================================

const LayoutRoot = React.forwardRef<HTMLDivElement, LayoutProps>(
  ({ children, loading = false, error = null, onRetry, className = '', width = 'fluid' }, ref) => {
    const contextValue = { loading, error, onRetry, width };

    return (
      <LayoutContext.Provider value={contextValue}>
        <div 
          ref={ref} 
          className={`flex flex-col h-full w-full pb-6 ${className}`}
        >
          {children}
        </div>
      </LayoutContext.Provider>
    );
  }
);
LayoutRoot.displayName = 'Layout';

// ==========================================
// LAYOUT COMPOSITION & TYPES
// ==========================================

type LayoutComponent = typeof LayoutRoot & {
    Header: typeof Header & {
      Title: typeof Title;
      Description: typeof Description;
    };
    Actions: typeof Actions;
    Body: typeof Body;
    Sidebar: typeof Sidebar;
    Content: typeof Content;
};

const Layout = LayoutRoot as LayoutComponent;

// Attach subcomponents
Layout.Header = Header as typeof Header & {
  Title: typeof Title;
  Description: typeof Description;
};
Layout.Header.Title = Title;
Layout.Header.Description = Description;
Layout.Actions = Actions;
Layout.Body = Body;
Layout.Sidebar = Sidebar;
Layout.Content = Content;

export { Layout };

// ==========================================
// UTILITY COMPONENTS (Backward Compatibility)
// ==========================================

export function AnalyticsCard({ 
  title, 
  description, 
  value, 
  icon, 
  iconBgColor = 'bg-zinc-100',
  textColor = 'text-zinc-900',
  trend 
}: {
  title: string;
  description: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor?: string;
  textColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
}) {
  return (
    <div className="flex items-center justify-between px-3 py-3">
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${iconBgColor}`}>
          {icon}
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium leading-none">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend && (
            <div className={`text-xs flex items-center gap-1 ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>{trend.isPositive ? '↗' : '↘'}</span>
              <span>{Math.abs(trend.value)}%</span>
              {trend.label && <span className="text-muted-foreground text-xs">({trend.label})</span>}
            </div>
          )}
        </div>
      </div>
      <div className={`font-medium text-lg ${textColor}`}>
        {value}
      </div>
    </div>
  );
}

export function AnalyticsGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <Card variant="default" size="sm" className={`flex flex-col divide-y divide-zinc-200 p-0 ${className}`}>
      {children}
    </Card>
  );
}