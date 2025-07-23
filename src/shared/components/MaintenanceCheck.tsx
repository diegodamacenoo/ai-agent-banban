'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { AlertTriangle, Wrench } from 'lucide-react';

interface MaintenanceStatus {
  inMaintenance: boolean;
  message?: string;
}

interface MaintenanceCheckProps {
  showForAllUsers?: boolean;
  variant?: 'admin' | 'user';
  className?: string;
}

/**
 * Componente para verificar e exibir status de manutenção
 */
export function MaintenanceCheck({ showForAllUsers = false, variant = 'admin', className = '' }: MaintenanceCheckProps = {}) {
  const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceStatus | null>(null);

  useEffect(() => {
    checkMaintenanceStatus();
  }, []);

  const checkMaintenanceStatus = async () => {
    try {
      // Fazer uma chamada para verificar o status
      const response = await fetch('/api/system/maintenance-status');
      if (response.ok) {
        const status = await response.json();
        setMaintenanceStatus(status);
      }
    } catch (error) {
      console.error('Erro ao verificar status de manutenção:', error);
    }
  };

  if (!maintenanceStatus?.inMaintenance) {
    return null;
  }

  // Versão para usuários regulares
  if (variant === 'user') {
    return (
      <Alert variant="warning" className={`mb-4 ${className}`}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          🔧 Sistema em manutenção programada para melhorias.
          Algumas funcionalidades podem estar temporariamente limitadas.
          Agradecemos sua paciência.
        </AlertDescription>
      </Alert>
    );
  }

  // Versão para admins (padrão)
  return (
    <Alert variant="warning" className={`mb-4 ${className}`}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center gap-2">
        <Wrench className="h-4 w-4" />
        <span>
          {maintenanceStatus.message || 'Sistema em modo de manutenção. Algumas funcionalidades podem estar indisponíveis.'}
        </span>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Hook para verificar status de manutenção
 */
export function useMaintenanceStatus() {
  const [status, setStatus] = useState<MaintenanceStatus>({ inMaintenance: false });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/system/maintenance-status');
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (error) {
        console.error('Erro ao verificar manutenção:', error);
      }
    };

    checkStatus();
    
    // Verificar a cada 5 minutos
    const interval = setInterval(checkStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return status;
}