'use client';

import { useState, useTransition, useOptimistic } from 'react';
import { toast } from '@/hooks/use-toast';

interface OptimisticActionOptions<T> {
  // Função que aplica a mudança otimística no estado local
  optimisticUpdate: (data: T) => T;
  // Função que executa a ação real (Server Action ou API call)
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
      // 1. Aplicar mudança otimística imediatamente
      const optimisticResult = optimisticUpdate(optimisticData);
      setOptimisticData(optimisticResult);

      // 2. Mostrar toast de loading se configurado
      let loadingToast: any;
      if (messages.loading) {
        loadingToast = toast({
          title: messages.loading,
          description: "Processando...",
        });
      }

      try {
        // 3. Executar ação real
        const result = await action();

        // 4. Processar resultado
        if (result.success) {
          // Sucesso - mantém a mudança otimística
          if (messages.success) {
            toast({
              title: messages.success,
              description: "Operação concluída com sucesso.",
            });
          }
          onSuccess?.(result.data);
        } else {
          // Erro - reverte mudança otimística
          setOptimisticData(initialData);
          const errorMessage = result.error || "Ocorreu um erro inesperado.";
          
          if (messages.error) {
            toast({
              title: messages.error,
              description: errorMessage,
              variant: "destructive",
            });
          }
          onError?.(errorMessage);
        }
      } catch (error) {
        // Erro de network ou outro - reverte mudança otimística
        setOptimisticData(initialData);
        const errorMessage = error instanceof Error ? error.message : "Erro de conexão.";
        
        toast({
          title: messages.error || "Erro",
          description: errorMessage,
          variant: "destructive",
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
 * Hook simplificado para mudanças de perfil
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