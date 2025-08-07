"use client";

import { usePathname } from 'next/navigation';
import { TooltipProvider } from "@/shared/ui/tooltip";
import { SessionTimeoutWarning } from "@/shared/ui/session-timeout-warning";
import { initSessionManager } from "@/core/auth/session-manager";
import { ModuleRegistryProvider } from '@/core/modules/registry/ModuleRegistryProvider';
import { MaintenanceCheck } from '@/shared/components/MaintenanceCheck';
import { useEffect } from 'react';

export default function ProtectedLayoutClient({
  userData,
  children
}: {
  userData: any;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSetupPage = pathname.includes('/setup-account');

  // Inicializar gerenciador de sessão no lado do cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initSessionManager();
    }
  }, []);

  // Se for a página de setup, renderiza um layout mínimo
  if (isSetupPage) {
    return (
      <ModuleRegistryProvider>
        {children}
        <SessionTimeoutWarning />
      </ModuleRegistryProvider>
    );
  }

  // Para todas as outras páginas protegidas, renderiza o layout completo
  // Nota: Sidebar específica é renderizada pelos layouts de admin/tenant
  return (
    <ModuleRegistryProvider>
      <TooltipProvider>
            <div className="flex-1 overflow-auto">
              <MaintenanceCheck variant="user" />
              {children}
            </div>
            <SessionTimeoutWarning />
      </TooltipProvider>
    </ModuleRegistryProvider>
  );
} 
