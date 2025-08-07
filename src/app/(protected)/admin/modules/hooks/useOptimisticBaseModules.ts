'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { BaseModule } from '../types';
import { useToast } from '@/shared/ui/toast';

interface OptimisticOperation {
  id: string;
  type: 'update' | 'create' | 'delete' | 'soft_delete' | 'archive' | 'restore';
  timestamp: number;
  data?: BaseModule;
  moduleId?: string; // Para operações de delete/archive/restore
}

interface UseOptimisticBaseModulesProps {
  initialBaseModules: BaseModule[];
  onError?: (error: string, operation: OptimisticOperation) => void;
}

export function useOptimisticBaseModules({
  initialBaseModules,
  onError
}: UseOptimisticBaseModulesProps) {
  const { toast } = useToast();
  const [baseModules, setBaseBaseModules] = useState(initialBaseModules);
  const [optimisticOperations, setOptimisticOperations] = useState<Map<string, OptimisticOperation>>(new Map());
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());

  // Sincronizar com initialBaseModules quando mudar
  useEffect(() => {
    setBaseBaseModules(initialBaseModules);
  }, [initialBaseModules]);

  // Módulos base com updates otimísticos aplicados
  const optimisticBaseModules = useMemo(() => {
    let result = [...baseModules];
    

    // Aplicar operações otimísticas em ordem cronológica
    const sortedOperations = Array.from(optimisticOperations.values())
      .sort((a, b) => a.timestamp - b.timestamp);

    for (const operation of sortedOperations) {
      
      switch (operation.type) {
        case 'update':
          if (operation.data) {
            result = result.map(module => 
              module.id === operation.data!.id ? operation.data! : module
            );
          }
          break;
        case 'create':
          if (operation.data) {
            result = [...result, operation.data];
          }
          break;
        case 'soft_delete':
          if (operation.moduleId) {
            result = result.map(module => 
              module.id === operation.moduleId 
                ? { ...module, deleted_at: new Date().toISOString() }
                : module
            );
          }
          break;
        case 'delete':
          if (operation.moduleId) {
            result = result.filter(module => module.id !== operation.moduleId);
          }
          break;
        case 'archive':
          if (operation.moduleId) {
            result = result.map(module => 
              module.id === operation.moduleId 
                ? { ...module, archived_at: new Date().toISOString() }
                : module
            );
          }
          break;
        case 'restore':
          if (operation.moduleId) {
            result = result.map(module => 
              module.id === operation.moduleId 
                ? { ...module, archived_at: null, deleted_at: null }
                : module
            );
          }
          break;
      }
    }

    return result;
  }, [baseModules, optimisticOperations]);

  // Função para criar operação otimística
  const createOptimisticOperation = useCallback((
    type: OptimisticOperation['type'],
    data?: BaseModule,
    moduleId?: string
  ): string => {
    const operationId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const operation: OptimisticOperation = {
      id: operationId,
      type,
      timestamp: Date.now(),
      data,
      moduleId
    };

    setOptimisticOperations(prev => new Map(prev).set(operationId, operation));
    setPendingOperations(prev => new Set(prev).add(operationId));

    
    return operationId;
  }, []);

  // Update otimístico de módulo base
  const optimisticUpdate = useCallback((updatedModule: BaseModule): string => {
    return createOptimisticOperation('update', updatedModule);
  }, [createOptimisticOperation]);

  // Create otimístico de módulo base
  const optimisticCreate = useCallback((newModule: BaseModule): string => {
    const operationId = createOptimisticOperation('create', newModule);
    return operationId;
  }, [createOptimisticOperation]);

  // Delete otimístico de módulo base (soft delete)
  const optimisticDelete = useCallback((moduleId: string): string => {
    return createOptimisticOperation('soft_delete', undefined, moduleId);
  }, [createOptimisticOperation]);

  // Archive otimístico de módulo base
  const optimisticArchive = useCallback((moduleId: string): string => {
    return createOptimisticOperation('archive', undefined, moduleId);
  }, [createOptimisticOperation]);

  // Restore otimístico de módulo base
  const optimisticRestore = useCallback((moduleId: string): string => {
    return createOptimisticOperation('restore', undefined, moduleId);
  }, [createOptimisticOperation]);

  // Purge otimístico de módulo base (hard delete)
  const optimisticPurge = useCallback((moduleId: string): string => {
    return createOptimisticOperation('delete', undefined, moduleId);
  }, [createOptimisticOperation]);

  // Confirmar operação do servidor
  const confirmOperation = useCallback((operationId: string, serverData?: BaseModule) => {
    const operation = optimisticOperations.get(operationId);
    if (!operation) return;

    // Se o servidor retornou dados, atualizar os dados base
    if (serverData && (operation.type === 'create' || operation.type === 'update')) {
      setBaseBaseModules(prev => {
        if (operation.type === 'create') {
          // Verificar se já existe para evitar duplicatas
          const exists = prev.some(module => module.id === serverData.id);
          return exists ? prev : [...prev, serverData];
        } else {
          return prev.map(module => 
            module.id === serverData.id ? serverData : module
          );
        }
      });
    } else if (operation.type === 'soft_delete' && operation.moduleId) {
      setBaseBaseModules(prev => prev.map(module => 
        module.id === operation.moduleId 
          ? { ...module, deleted_at: new Date().toISOString() }
          : module
      ));
    } else if (operation.type === 'delete' && operation.moduleId) {
      setBaseBaseModules(prev => prev.filter(module => module.id !== operation.moduleId));
    } else if (operation.type === 'archive' && operation.moduleId) {
      setBaseBaseModules(prev => prev.map(module => 
        module.id === operation.moduleId 
          ? { ...module, archived_at: new Date().toISOString() }
          : module
      ));
    } else if (operation.type === 'restore' && operation.moduleId) {
      setBaseBaseModules(prev => prev.map(module => 
        module.id === operation.moduleId 
          ? { ...module, archived_at: null, deleted_at: null }
          : module
      ));
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

  // Reverter operação (em caso de erro)
  const revertOperation = useCallback((operationId: string, errorMessage?: string) => {
    const operation = optimisticOperations.get(operationId);
    if (!operation) return;

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

    // Mostrar erro
    const message = errorMessage || 'Operação falhou e foi revertida';
    toast.error(message, {
      title: `Erro na operação ${operation.type}`,
    });
    
    // Callback de erro
    onError?.(message, operation);

  }, [optimisticOperations, toast, onError]);

  // Sincronizar com dados do servidor
  const syncWithServer = useCallback((serverData: BaseModule[]) => {
    setBaseBaseModules(serverData);
  }, []);

  // Atualizar dados base (usado pelo componente pai)
  const setBaseModules = useCallback((modules: BaseModule[]) => {
    setBaseBaseModules(modules);
  }, []);

  return {
    baseModules: optimisticBaseModules,
    optimisticUpdate,
    optimisticCreate,
    optimisticDelete,
    optimisticArchive,
    optimisticRestore,
    optimisticPurge,
    confirmOperation,
    revertOperation,
    syncWithServer,
    setBaseModules,
    hasOptimisticOperations: optimisticOperations.size > 0,
    pendingOperations: Array.from(pendingOperations)
  };
}