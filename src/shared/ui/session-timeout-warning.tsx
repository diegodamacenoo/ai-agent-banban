"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { shouldShowWarning, refreshSession, terminateSession, SESSION_TIMEOUT } from '@/core/auth/session-manager';
import { AlertTriangle } from 'lucide-react';

export function SessionTimeoutWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(SESSION_TIMEOUT.WARNING * 60);

  useEffect(() => {
    // Verificar aviso de timeout periodicamente
    const checkWarning = async () => {
      const shouldShow = await shouldShowWarning();
      setShowWarning(shouldShow);
    };

    const warningInterval = setInterval(checkWarning, 60 * 1000);
    checkWarning(); // Verificar imediatamente

    return () => clearInterval(warningInterval);
  }, []);

  useEffect(() => {
    // Atualizar contador regressivo
    if (showWarning) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 0) {
            clearInterval(timer);
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showWarning]);

  const handleExtendSession = async () => {
    try {
      await refreshSession();
      setShowWarning(false);
      setTimeRemaining(SESSION_TIMEOUT.WARNING * 60);
    } catch (error) {
              console.error('Erro ao estender sessão:', error);
      handleLogout();
    }
  };

  const handleLogout = async () => {
    await terminateSession('user');
    window.location.href = '/login?reason=session_expired';
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!showWarning) return null;

  return (
    <Dialog open={showWarning} onOpenChange={setShowWarning}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aviso de Expiração de Sessão</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sua sessão irá expirar em {formatTime(timeRemaining)}. 
            Deseja continuar conectado?
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="mr-2"
          >
            Encerrar Sessão
          </Button>
          <Button
            onClick={handleExtendSession}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Continuar Conectado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
