'use client';

import { useState, useTransition, useOptimistic } from 'react';
import { useToast } from '@/shared/ui/toast';

interface OptimisticActionOptions<T> {
  // FunÃ§Ã£o que aplica a mudanÃ§a otimÃ­stica no estado local
  optimisticUpdate: (data: T) => T;
  // FunÃ§Ã£o que executa a aÃ§Ã£o real (Server Action ou API call)
  action: () => Promise<{ success: boolean; error?: string; data?: any }>;
  // Mensagens para feedback
  messages?: {
    loading?: string;
    success?: string;
    error?: string;
  };
  // Callback executado em caso de sucesso
  onSuccess?: (result?: any) => void;
  // Callback executado em caso de erro
  onError?: (error: string) => void;
}

/**
 * Hook para implementar optimistic updates
 * Atualiza a UI imediatamente e reverte em caso de erro
 */
export function useOptimisticAction<T>(initialData: T) {
  const { toast } = useToast();

  const [isPending, startTransition] = useTransition();
  const [optimisticData, setOptimisticData] = useOptimistic(
    initialData,
    (currentData: T, update: T) => update
  );

  const execute = ({
    optimisticUpdate,
    action,
    messages = {},
    onSuccess,
    onError,
  }: OptimisticActionOptions<T>) => {
    startTransition(async () => {
      // 1. Aplicar mudanÃ§a otimÃ­stica imediatamente
      const optimisticResult = optimisticUpdate(optimisticData);
      setOptimisticData(optimisticResult);

      // 2. Mostrar toast de loading se configurado
      let loadingToast: any;
      if (messages.loading) {
        loadingToast = toast.info(messages.loading, {
          description: "Processando...",
        });
      }

      try {
        // 3. Executar aÃ§Ã£o real
        const result = await action();

        // 4. Processar resultado
        if (result.success) {
          // Sucesso - mantÃ©m a mudanÃ§a otimÃ­stica
          if (messages.success) {
            toast.success(messages.success, {
              description: "OperaÃ§Ã£o concluÃ­da com sucesso.",
            });
          }
          onSuccess?.(result.data);
        } else {
          // Erro - reverte mudanÃ§a otimÃ­stica
          setOptimisticData(initialData);
          const errorMessage = result.error || "Ocorreu um erro inesperado.";
          
          if (messages.error) {
            toast.error(messages.error, {
              description: errorMessage,
            });
          }
          onError?.(errorMessage);
        }
      } catch (error) {
        // Erro de network ou outro - reverte mudanÃ§a otimÃ­stica
        setOptimisticData(initialData);
        const errorMessage = error instanceof Error ? error.message : "Erro de conexÃ£o.";
        
        toast.error(messages.error || "Erro", {
          description: errorMessage,
        });
        onError?.(errorMessage);
      } finally {
        // 5. Limpar toast de loading
        if (loadingToast) {
          loadingToast.dismiss();
        }
      }
    });
  };

  return {
    data: optimisticData,
    isPending,
    execute,
  };
}

/**
 * Hook simplificado para mudanÃ§as de perfil
 */
export function useOptimisticProfileUpdate(initialProfile: any) {
  return useOptimisticAction(initialProfile);
}

/**
 * Hook simplificado para listas (adicionar/remover items)
 */
export function useOptimisticList<T>(initialList: T[]) {
  const { data, isPending, execute } = useOptimisticAction(initialList);

  const addItem = (item: T, action: () => Promise<any>) => {
    execute({
      optimisticUpdate: (currentList) => [...currentList, item],
      action,
      messages: {
        loading: "Adicionando item...",
        success: "Item adicionado!",
        error: "Erro ao adicionar item",
      },
    });
  };

  const removeItem = (itemId: string | number, action: () => Promise<any>) => {
    execute({
      optimisticUpdate: (currentList) => 
        currentList.filter((item: any) => item.id !== itemId),
      action,
      messages: {
        loading: "Removendo item...",
        success: "Item removido!",
        error: "Erro ao remover item",
      },
    });
  };

  const updateItem = (itemId: string | number, updates: Partial<T>, action: () => Promise<any>) => {
    execute({
      optimisticUpdate: (currentList) =>
        currentList.map((item: any) =>
          item.id === itemId ? { ...item, ...updates } : item
        ),
      action,
      messages: {
        loading: "Atualizando item...",
        success: "Item atualizado!",
        error: "Erro ao atualizar item",
      },
    });
  };

  return {
    data,
    isPending,
    addItem,
    removeItem,
    updateItem,
    execute,
  };
} 
