import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/shared/ui/toast';
import { getBaseModules, getBaseModuleStats } from '@/app/actions/admin/modules/base-modules';
import { getModuleImplementations } from '@/app/actions/admin/modules/module-implementations';
import { getTenantAssignments, updateTenantAssignment } from '@/app/actions/admin/modules/tenant-module-assignments';
import { getAllOrganizations } from '@/app/actions/admin/organizations';

// ================================================
// TIPOS PARA NOVA ESTRUTURA FASE 5
// ================================================

export interface BaseModule {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  is_active: boolean;
  archived_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModuleImplementation {
  id: string;
  base_module_id: string;
  implementation_key: string;
  name: string;
  component_path: string;
  audience: string;
  complexity: string;
  is_default: boolean;
  is_active: boolean;
  archived_at: string | null;
  deleted_at: string | null;
}

export interface TenantModuleAssignment {
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

export interface ModuleStats {
  overview: {
    totalBaseModules: number;
    totalImplementations: number;
    totalActiveAssignments: number;
    totalOrganizations: number;
    healthScore: number;
  };
  implementationsByType: Record<string, number>;
  adoptionByModule: Array<{
    moduleId: string;
    moduleName: string;
    category: string;
    totalTenants: number;
    adoptionRate: number;
  }>;
  orphanModules: Array<{
    id: string;
    name: string;
    category: string;
  }>;
}

export interface Organization {
  id: string;
  company_trading_name: string;
  company_legal_name: string;
  client_type: string;
  created_at: string;
  updated_at: string;
}

export interface UseModuleDataReturn {
  baseModules: BaseModule[];
  implementations: ModuleImplementation[];
  assignments: TenantModuleAssignment[];
  organizations: Organization[];
  stats: ModuleStats | null;
  loading: boolean;
  loadingStats: boolean;
  loadData: () => Promise<void>;
  updateModuleConfig: (tenantId: string, baseModuleId: string, config: Record<string, any>) => Promise<void>;
  getImplementationsForModule: (baseModuleId: string) => ModuleImplementation[];
  getAssignmentsForTenant: (tenantId: string) => TenantModuleAssignment[];
  getAssignmentsForModule: (baseModuleId: string) => TenantModuleAssignment[];
}

// ================================================
// HOOK PRINCIPAL PARA FASE 5
// ================================================

export function useModuleData(): UseModuleDataReturn {
  const { toast } = useToast();

  const [baseModules, setBaseModules] = useState<BaseModule[]>([]);
  const [implementations, setImplementations] = useState<ModuleImplementation[]>([]);
  const [assignments, setAssignments] = useState<TenantModuleAssignment[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState<ModuleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  const loadData = useCallback(async (filters: { includeArchived?: boolean; includeDeleted?: boolean } = {}) => {
    try {
      setLoading(true);
      const [baseModulesResult, assignmentsResult, statsResult, organizationsResult] = await Promise.all([
        getBaseModules(filters),
        getTenantAssignments(filters),
        getBaseModuleStats(),
        getAllOrganizations()
      ]);

      if (baseModulesResult.success && baseModulesResult.data) {
        setBaseModules(baseModulesResult.data.modules || []);
        // Temporary disable implementations loading to prevent multiple POST requests
        setImplementations([]);
        
        // TODO: Load implementations on demand instead of all at once
        // const implementationPromises = baseModulesResult.data.modules.map(module => 
        //   getModuleImplementations({ base_module_id: module.id, ...filters })
        // );
        // const implementationResults = await Promise.all(implementationPromises);
        // 
        // const allImplementations = implementationResults.flatMap(result => 
        //   result.success && result.data ? result.data.implementations : []
        // );
        // setImplementations(allImplementations);
      } else {
        toast.error(baseModulesResult.error, {
          title: "Erro ao carregar módulos base",
        });
        setBaseModules([]);
        setImplementations([]);
      }

      if (assignmentsResult.success && assignmentsResult.data) {
        setAssignments(assignmentsResult.data.assignments || []);
      } else {
        toast.error(assignmentsResult.error, {
          title: "Erro ao carregar assignments",
        });
        setAssignments([]);
      }

      if (statsResult.success) {
        setStats(statsResult.data);
      } else {
        toast.error(statsResult.error, {
          title: "Erro ao carregar estatísticas",
        });
        setStats(null);
      }

      if (organizationsResult.data) {
        setOrganizations(organizationsResult.data);
      } else {
        toast.error(organizationsResult.error, {
          title: "Erro ao carregar organizações",
        });
        setOrganizations([]);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Ocorreu um erro ao carregar os dados dos módulos: ${errorMessage}`, {
        title: "Erro inesperado",
      });
    } finally {
      setLoading(false);
      setLoadingStats(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateConfig = useCallback(async (
    tenantId: string, 
    baseModuleId: string, 
    config: Record<string, any>
  ) => {
    const assignment = assignments.find(a => a.tenant_id === tenantId && a.base_module_id === baseModuleId);
    if (!assignment) {
      toast.error("Assignment do módulo não encontrado para esta organização.", {
        title: "Erro",
      });
      return;
    }

    const result = await updateTenantAssignment({ id: assignment.id, configuration: config });
    if (result.success) {
      toast.success("As configurações do módulo foram salvas.", {
        title: "Configuração atualizada",
      });
      // Removed loadData() call to prevent infinite loop
    } else {
      toast.error(result.error, {
        title: "Erro ao atualizar",
      });
    }
  }, [assignments]);

  const getImplementationsForModule = useCallback((baseModuleId: string) => {
    return implementations.filter(impl => impl.base_module_id === baseModuleId);
  }, [implementations]);

  const getAssignmentsForTenant = useCallback((tenantId: string) => {
    return assignments.filter(assignment => assignment.tenant_id === tenantId);
  }, [assignments]);

  const getAssignmentsForModule = useCallback((baseModuleId: string) => {
    return assignments.filter(assignment => assignment.base_module_id === baseModuleId);
  }, [assignments]);

  return {
    baseModules,
    implementations,
    assignments,
    organizations,
    stats,
    loading,
    loadingStats,
    loadData,
    updateModuleConfig: handleUpdateConfig,
    getImplementationsForModule,
    getAssignmentsForTenant,
    getAssignmentsForModule
  };
}

export function useModuleStats() {
  const { toast } = useToast();
  const [stats, setStats] = useState<ModuleStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getBaseModuleStats();
      if (result.success) {
        setStats(result.data);
      } else {
        toast.error(result.error, {
          title: "Erro ao carregar estatísticas",
        });
        setStats(null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Ocorreu um erro ao carregar estatísticas: ${errorMessage}`, {
        title: "Erro inesperado",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, loading, refresh };
}
