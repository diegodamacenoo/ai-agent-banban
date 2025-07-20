import { useState, useCallback } from 'react';
import { withCriticalOperation, type CriticalOperation } from '@/core/auth/critical-operations';

interface UseCriticalOperationOptions {
  operation: CriticalOperation;
  userId: string;
  onSuccess?: (data?: any) => void;
  onError?: (error: string) => void;
}

interface UseCriticalOperationResult {
  execute: (action: () => Promise<any>) => Promise<void>;
  showMFADialog: boolean;
  setShowMFADialog: (show: boolean) => void;
  loading: boolean;
  error: string | null;
}

export function useCriticalOperation({
  operation,
  userId,
  onSuccess,
  onError
}: UseCriticalOperationOptions): UseCriticalOperationResult {
  const [showMFADialog, setShowMFADialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (action: () => Promise<any>) => {
    setLoading(true);
    setError(null);

    try {
      const result = await withCriticalOperation(userId, operation, action);

      if (result.success) {
        onSuccess?.(result.data);
      } else if (result.error === 'MFA_REQUIRED') {
        setShowMFADialog(true);
      } else {
        setError(result.error || 'Ocorreu um erro ao executar a operaÃ§Ã£o.');
        onError?.(result.error || 'Ocorreu um erro ao executar a operaÃ§Ã£o.');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Ocorreu um erro inesperado.';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, operation, onSuccess, onError]);

  return {
    execute,
    showMFADialog,
    setShowMFADialog,
    loading,
    error
  };
} 
