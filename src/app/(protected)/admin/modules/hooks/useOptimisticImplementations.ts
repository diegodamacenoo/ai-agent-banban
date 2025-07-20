'use client';

import { useState, useCallback, useMemo } from 'react';
import { ModuleImplementation } from '../types';
import { useToast } from '@/shared/ui/toast';

interface OptimisticOperation {
  id: string;
  type: 'update' | 'create' | 'delete';
  timestamp: number;
  data?: ModuleImplementation;
  implementationId?: string; // Para operações de delete
}

interface UseOptimisticImplementationsProps {
  initialImplementations: ModuleImplementation[];
  onError?: (error: string, operation: OptimisticOperation) => void;
}

export function useOptimisticImplementations({initialImplementations,
  onError
}: UseOptimisticImplementationsProps) {
  const { toast } = useToast();
  const [baseImplementations, setBaseImplementations] = useState(initialImplementations);
  const [optimisticOperations, setOptimisticOperations] = useState<Map<string, OptimisticOperation>>(new Map());
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());

  // Implementações com updates otimísticos aplicados
  const implementations = useMemo(() => {
    let result = [...baseImplementations];

    // Aplicar operações otimísticas em ordem cronológica
    const sortedOperations = Array.from(optimisticOperations.values())
      .sort((a, b) => a.timestamp - b.timestamp);

    for (const operation of sortedOperations) {
      switch (operation.type) {
        case 'update':
          if (operation.data) {
            result = result.map(impl => 
              impl.id === operation.data!.id ? operation.data! : impl
            );
          }
          break;
        case 'create':
          if (operation.data) {
            result = [...result, operation.data];
          }
          break;
        case 'delete':
          result = result.filter(impl => impl.id !== operation.implementationId);
          break;
      }
    }

    return result;
  }, [baseImplementations, optimisticOperations]);

  // Função para aplicar update otimístico
  const optimisticUpdate = useCallback((updatedImplementation: ModuleImplementation) => {
    const operationId = `update-${updatedImplementation.id}-${Date.now()}`;
    
    const operation: OptimisticOperation = {
      id: operationId,
      type: 'update',
      timestamp: Date.now(),
      data: updatedImplementation
    };

    setOptimisticOperations(prev => new Map(prev.set(operationId, operation)));
    setPendingOperations(prev => new Set(prev.add(operationId)));

    // Auto-cleanup após 10 segundos (caso server action não confirme)
    setTimeout(() => {
      setOptimisticOperations(prev => {
        const newMap = new Map(prev);
        newMap.delete(operationId);
        return newMap;
      });
      setPendingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(operationId);
        return newSet;
      });
    }, 10000);

    return operationId;
  }, []);

  // Função para confirmar operação (quando server action retorna sucesso)
  const confirmOperation = useCallback((operationId: string, serverData?: ModuleImplementation) => {
    const operation = optimisticOperations.get(operationId);
    
    if (serverData) {
      // Servidor retornou dados atualizados
      setBaseImplementations(prev => {
        const exists = prev.some(impl => impl.id === serverData.id);
        
        if (exists) {
          // Update
          return prev.map(impl => impl.id === serverData.id ? serverData : impl);
        } else {
          // Create
          return [...prev, serverData];
        }
      });
    } else if (operation && operation.type === 'create' && operation.data) {
      // Servidor não retornou dados, mas temos dados otimísticos - preservar a criação
      setBaseImplementations(prev => {
        const exists = prev.some(impl => impl.id === operation.data!.id);
        if (!exists) {
          return [...prev, operation.data!];
        }
        return prev;
      });
    } else if (operation && operation.type === 'update' && operation.data) {
      // Servidor confirmou update - atualizar nos baseImplementations
      setBaseImplementations(prev => {
        return prev.map(impl => impl.id === operation.data!.id ? operation.data! : impl);
      });
    } else if (operation && operation.type === 'delete' && operation.implementationId) {
      // Servidor confirmou delete - remover dos baseImplementations
      setBaseImplementations(prev => {
        return prev.filter(impl => impl.id !== operation.implementationId);
      });
    }

    // Remover operação otimística
    setOptimisticOperations(prev => {
      const newMap = new Map(prev);
      newMap.delete(operationId);
      return newMap;
    });
    
    setPendingOperations(prev => {
      const newSet = new Set(prev);
      newSet.delete(operationId);
      return newSet;
    });
  }, [optimisticOperations]);

  // Função para reverter operação (quando server action falha)
  const revertOperation = useCallback((operationId: string, errorMessage?: string) => {
    const operation = optimisticOperations.get(operationId);
    
    // Remover operação otimística
    setOptimisticOperations(prev => {
      const newMap = new Map(prev);
      newMap.delete(operationId);
      return newMap;
    });
    
    setPendingOperations(prev => {
      const newSet = new Set(prev);
      newSet.delete(operationId);
      return newSet;
    });

    // Notificar erro
    if (errorMessage) {
      toast.error(`Erro ao atualizar: ${errorMessage}`);
      onError?.(errorMessage, operation!);
    }
  }, [optimisticOperations, onError]);

  // Função para adicionar nova implementação
  const optimisticCreate = useCallback((newImplementation: ModuleImplementation) => {
    const operationId = `create-${newImplementation.id}-${Date.now()}`;
    
    const operation: OptimisticOperation = {
      id: operationId,
      type: 'create',
      timestamp: Date.now(),
      data: newImplementation
    };

    setOptimisticOperations(prev => new Map(prev.set(operationId, operation)));
    setPendingOperations(prev => new Set(prev.add(operationId)));

    return operationId;
  }, []);

  // Função para remoção otimística
  const optimisticDelete = useCallback((implementationId: string) => {
    const operationId = `delete-${implementationId}-${Date.now()}`;
    
    const operation: OptimisticOperation = {
      id: operationId,
      type: 'delete',
      timestamp: Date.now(),
      implementationId: implementationId
    };

    setOptimisticOperations(prev => new Map(prev.set(operationId, operation)));
    setPendingOperations(prev => new Set(prev.add(operationId)));

    return operationId;
  }, []);

  // Função para sincronizar com dados reais do servidor (fallback)
  const syncWithServer = useCallback((serverImplementations: ModuleImplementation[]) => {
    setBaseImplementations(serverImplementations);
    
    // Limpar operações otimísticas antigas
    setOptimisticOperations(new Map());
    setPendingOperations(new Set());
  }, []);

  // Estado de loading para operações pendentes
  const hasOptimisticOperations = useMemo(() => pendingOperations.size > 0, [pendingOperations]);

  return {
    implementations,
    optimisticUpdate,
    optimisticCreate,
    optimisticDelete,
    confirmOperation,
    revertOperation,
    syncWithServer,
    hasOptimisticOperations,
    pendingOperationsCount: pendingOperations.size,
    setBaseImplementations
  };
}