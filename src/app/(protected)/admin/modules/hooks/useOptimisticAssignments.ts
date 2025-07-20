'use client';

import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/shared/ui/toast';

// Tipo para TenantModuleAssignment baseado no que vimos no código
interface TenantModuleAssignment {
  tenant_id: string;
  base_module_id: string;
  implementation_id: string;
  organization_name: string;
  organization_slug: string;
  module_slug: string;
  module_name: string;
  module_category: string;
  implementation_key: string;
  implementation_name: string;
  component_path: string;
  assignment_active: boolean;
  custom_config: Record<string, any>;
  assigned_at: string;
}

interface TenantGroup {
  tenantId: string;
  organizationName: string;
  organizationSlug: string;
  assignments: TenantModuleAssignment[];
}

interface OptimisticAssignmentOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  timestamp: number;
  data?: TenantModuleAssignment;
  tenantId?: string;
  baseModuleId?: string;
}

interface UseOptimisticAssignmentsProps {
  initialAssignments: TenantModuleAssignment[];
  onError?: (error: string, operation: OptimisticAssignmentOperation) => void;
}

export function useOptimisticAssignments({initialAssignments,
  onError
}: UseOptimisticAssignmentsProps) {
  const { toast } = useToast();
  const [baseAssignments, setBaseAssignments] = useState(initialAssignments);
  const [optimisticOperations, setOptimisticOperations] = useState<Map<string, OptimisticAssignmentOperation>>(new Map());
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());

  // Assignments com updates otimísticos aplicados
  const assignments = useMemo(() => {
    let result = [...baseAssignments];

    // Aplicar operações otimísticas em ordem cronológica
    const sortedOperations = Array.from(optimisticOperations.values())
      .sort((a, b) => a.timestamp - b.timestamp);

    for (const operation of sortedOperations) {
      switch (operation.type) {
        case 'create':
          if (operation.data) {
            result = [...result, operation.data];
          }
          break;
        case 'update':
          if (operation.data) {
            result = result.map(assignment => {
              const matches = assignment.tenant_id === operation.data!.tenant_id && 
                            assignment.base_module_id === operation.data!.base_module_id;
              return matches ? operation.data! : assignment;
            });
          }
          break;
        case 'delete':
          result = result.filter(assignment => {
            const matches = assignment.tenant_id === operation.tenantId && 
                          assignment.base_module_id === operation.baseModuleId;
            return !matches;
          });
          break;
      }
    }

    return result;
  }, [baseAssignments, optimisticOperations]);

  // Função para aplicar criação otimística
  const optimisticCreate = useCallback((newAssignment: TenantModuleAssignment) => {
    const operationId = `create-${newAssignment.tenant_id}-${newAssignment.base_module_id}-${Date.now()}`;
    
    const operation: OptimisticAssignmentOperation = {
      id: operationId,
      type: 'create',
      timestamp: Date.now(),
      data: newAssignment
    };

    setOptimisticOperations(prev => new Map(prev.set(operationId, operation)));
    setPendingOperations(prev => new Set(prev.add(operationId)));

    // Auto-cleanup após 10 segundos
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

  // Função para aplicar update otimístico
  const optimisticUpdate = useCallback((updatedAssignment: TenantModuleAssignment) => {
    const operationId = `update-${updatedAssignment.tenant_id}-${updatedAssignment.base_module_id}-${Date.now()}`;
    
    const operation: OptimisticAssignmentOperation = {
      id: operationId,
      type: 'update',
      timestamp: Date.now(),
      data: updatedAssignment
    };

    setOptimisticOperations(prev => new Map(prev.set(operationId, operation)));
    setPendingOperations(prev => new Set(prev.add(operationId)));

    // Auto-cleanup após 10 segundos
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

  // Função para remoção otimística
  const optimisticDelete = useCallback((tenantId: string, baseModuleId: string, assignmentInfo?: { organizationName: string, moduleName: string }) => {
    const operationId = `delete-${tenantId}-${baseModuleId}-${Date.now()}`;
    
    const operation: OptimisticAssignmentOperation = {
      id: operationId,
      type: 'delete',
      timestamp: Date.now(),
      tenantId,
      baseModuleId
    };

    setOptimisticOperations(prev => new Map(prev.set(operationId, operation)));
    setPendingOperations(prev => new Set(prev.add(operationId)));

    return operationId;
  }, []);

  // Função para confirmar operação (quando server action retorna sucesso)
  const confirmOperation = useCallback((operationId: string, serverData?: TenantModuleAssignment) => {
    const operation = optimisticOperations.get(operationId);
    
    if (serverData) {
      // Servidor retornou dados atualizados
      setBaseAssignments(prev => {
        const exists = prev.some(assignment => 
          assignment.tenant_id === serverData.tenant_id && 
          assignment.base_module_id === serverData.base_module_id
        );
        
        if (exists) {
          // Update
          return prev.map(assignment => {
            const matches = assignment.tenant_id === serverData.tenant_id && 
                          assignment.base_module_id === serverData.base_module_id;
            return matches ? serverData : assignment;
          });
        } else {
          // Create
          return [...prev, serverData];
        }
      });
    } else if (operation && operation.type === 'create' && operation.data) {
      // Servidor não retornou dados, mas temos dados otimísticos - preservar a criação
      setBaseAssignments(prev => {
        const exists = prev.some(assignment => 
          assignment.tenant_id === operation.data!.tenant_id && 
          assignment.base_module_id === operation.data!.base_module_id
        );
        
        if (!exists) {
          return [...prev, operation.data!];
        }
        return prev;
      });
    } else if (operation && operation.type === 'update' && operation.data) {
      // Servidor confirmou update - atualizar nos baseAssignments
      setBaseAssignments(prev => {
        return prev.map(assignment => {
          const matches = assignment.tenant_id === operation.data!.tenant_id && 
                        assignment.base_module_id === operation.data!.base_module_id;
          return matches ? operation.data! : assignment;
        });
      });
    } else if (operation && operation.type === 'delete') {
      // Servidor confirmou delete - remover dos baseAssignments
      setBaseAssignments(prev => {
        return prev.filter(assignment => {
          const matches = assignment.tenant_id === operation.tenantId && 
                        assignment.base_module_id === operation.baseModuleId;
          return !matches;
        });
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
      toast.error(`Erro ao processar assignment: ${errorMessage}`);
      onError?.(errorMessage, operation!);
    }
  }, [optimisticOperations, onError]);

  // Função para sincronizar com dados reais do servidor (fallback)
  const syncWithServer = useCallback((serverAssignments: TenantModuleAssignment[]) => {
    setBaseAssignments(serverAssignments);
    
    // Limpar operações otimísticas antigas
    setOptimisticOperations(new Map());
    setPendingOperations(new Set());
  }, []);

  // Função para gerar tenantGroups otimisticamente
  const tenantGroups = useMemo((): TenantGroup[] => {
    if (!assignments) return [];

    const groups = new Map<string, TenantGroup>();

    assignments.forEach(assignment => {
      if (!assignment || !assignment.tenant_id) return;

      const key = assignment.tenant_id;
      if (!groups.has(key)) {
        groups.set(key, {
          tenantId: assignment.tenant_id,
          organizationName: assignment.organization_name,
          organizationSlug: assignment.organization_slug,
          assignments: []
        });
      }
      groups.get(key)!.assignments.push(assignment);
    });

    return Array.from(groups.values()).sort((a, b) => a.organizationName.localeCompare(b.organizationName));
  }, [assignments]);

  // Estado de loading para operações pendentes
  const hasOptimisticOperations = useMemo(() => pendingOperations.size > 0, [pendingOperations]);

  return {
    assignments,
    tenantGroups,
    optimisticCreate,
    optimisticUpdate,
    optimisticDelete,
    confirmOperation,
    revertOperation,
    syncWithServer,
    hasOptimisticOperations,
    pendingOperationsCount: pendingOperations.size,
    setBaseAssignments
  };
}