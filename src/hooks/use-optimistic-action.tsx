'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

interface OptimisticActionOptions {
  action: () => Promise<any>;
  messages?: {
    loading?: string;
    success?: string;
    error?: string;
  };
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
}

export function useOptimisticAction() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<Error | null>(null);

  const execute = (options: OptimisticActionOptions) => {
    const {
      action,
      messages = {},
      onSuccess,
      onError
    } = options;

    setError(null);

    // Mostrar toast de loading se fornecido
    let loadingToast: string | number | undefined;
    if (messages.loading) {
      loadingToast = toast.loading(messages.loading);
    }

    startTransition(() => {
      action().then((result) => {
        // Verificar se a ação foi bem-sucedida
        if (result?.success === false) {
          throw new Error(result.error || 'Erro na operação');
        }

        // Toast de sucesso
        if (loadingToast) {
          toast.dismiss(loadingToast);
        }
        if (messages.success) {
          toast.success(messages.success);
        }

        // Callback de sucesso
        onSuccess?.(result);

      }).catch((error: any) => {
        setError(error);

        // Toast de erro
        if (loadingToast) {
          toast.dismiss(loadingToast);
        }
        const errorMessage = error?.message || messages.error || 'Erro inesperado';
        toast.error(errorMessage);

        // Callback de erro
        onError?.(error);

        console.error('Action failed:', error);
      });
    });
  };

  return {
    isPending,
    error,
    execute
  };
}

// Hook para delayed loading states (evitar flashes)
export function useDelayedLoading(loading: boolean, delay = 300) {
  const [showLoading, setShowLoading] = useState(false);

  useState(() => {
    let timeoutId: NodeJS.Timeout;

    if (loading) {
      timeoutId = setTimeout(() => {
        setShowLoading(true);
      }, delay);
    } else {
      setShowLoading(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  });

  return showLoading;
}

// Hook para toast simples (wrapper do sonner)
export function useToast() {
  return {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    loading: (message: string) => toast.loading(message),
    dismiss: (toastId: string | number) => toast.dismiss(toastId),
    promise: (
      promise: Promise<any>,
      messages: {
        loading: string;
        success: string;
        error: string;
      }
    ) => toast.promise(promise, messages)
  };
}

export function useOptimisticProfileUpdate(initialProfile: any) {
  // Wrapper simples reutilizando useOptimisticAction para perfis
  const optimistic = useOptimisticAction();
  return {
    ...optimistic,
    data: initialProfile,
  } as const;
} 