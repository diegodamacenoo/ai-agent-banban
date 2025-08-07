'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionSync } from '@/hooks/use-session-sync';
import { useToast } from '@/shared/ui/toast/use-toast';
import { createLogger } from '@/shared/utils/logger';
import { DEBUG_MODULES } from '@/shared/utils/debug-config';

const logger = createLogger(DEBUG_MODULES.AUTH);

interface SessionMonitorProps {
  redirectOnExpired?: boolean;
  showNotifications?: boolean;
}

/**
 * Componente para monitorar a sessão do usuário e lidar com expiração
 * Deve ser incluído no layout principal da aplicação
 */
export function SessionMonitor({ 
  redirectOnExpired = true,
  showNotifications = true 
}: SessionMonitorProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const { isAuthenticated, error } = useSessionSync({
    onSessionExpired: () => {
      logger.info('Sessão expirada detectada');
      
      if (showNotifications) {
        toast({
          title: 'Sessão Expirada',
          description: 'Sua sessão expirou. Por favor, faça login novamente.',
          variant: 'destructive',
        });
      }
      
      if (redirectOnExpired) {
        router.push('/login?reason=session_expired');
      }
    },
    onSessionChange: (hasSession) => {
      logger.debug(`Estado da sessão mudou: ${hasSession ? 'autenticado' : 'não autenticado'}`);
    }
  });

  useEffect(() => {
    // Se houver erro crítico de autenticação, redirecionar
    if (error && !error.includes('session_not_found') && !error.includes('Auth session missing')) {
      logger.error('Erro crítico de autenticação:', error);
      
      if (showNotifications) {
        toast({
          title: 'Erro de Autenticação',
          description: 'Ocorreu um erro ao verificar sua sessão. Por favor, faça login novamente.',
          variant: 'destructive',
        });
      }
      
      if (redirectOnExpired) {
        router.push('/login?reason=auth_error');
      }
    }
  }, [error, router, toast, redirectOnExpired, showNotifications]);

  // Este componente não renderiza nada, apenas monitora
  return null;
}