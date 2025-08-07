'use client';

// React imports
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsContent } from '@/shared/ui/tabs';
import { Layout } from '@/shared/components/Layout';
import { Skeleton } from '@/shared/ui/skeleton';

// Icons
import {
  RefreshCw,
  Plus,
  Settings,
  Database,
  Users,
  Package,
  Save,
  Shield,
  Bell,
  FileText,
  Loader2
} from 'lucide-react';

// Types
import { type TenantModuleAssignment } from '../hooks/useModuleData';

// Hooks
import { useOptimisticImplementations } from '../hooks/useOptimisticImplementations';
import { useOptimisticAssignments } from '../hooks/useOptimisticAssignments';
import { useOptimisticBaseModules } from '../hooks/useOptimisticBaseModules';
import { useModuleCreationDialog } from '../contexts/ModuleCreationDialogContext';

// Components - Tables and Managers
import { BaseModulesTable } from '../components/shared';
import { ImplementationsManager } from '../components/assignments/implementations-manager';
import { TenantAssignmentsManager } from '../components/assignments/TenantAssignmentsManager';
import { ModuleStatsWidget } from '../components/analytics/ModuleStatsWidget';

import { ModuleCreationWizard } from '../development/components/ModuleCreationWizard';
import { Dialog, DialogTrigger, DialogContent } from '@/shared/ui/dialog';

// Components - Dialogs
import { CreateImplementationDialog } from '../components/assignments/CreateImplementationDialog';
import { NewAssignmentDialog } from '../components/assignments/NewAssignmentDialog';

// Components - Configuration
import { ModuleSettingsFormContent } from '../components/configurations/ModuleSettingsFormContent';
import { SystemConfigProvider } from '../contexts/SystemConfigContext';
// COMENTADOS PARA MVP - recursos avançados para implementação posterior
// import { PermissionManagerContent } from '../components/configurations/PermissionManagerContent';
// import { NotificationManagerContent } from '../components/configurations/NotificationManagerContent';
// import { ModulePoliciesWidgetContent } from '../components/configurations/ModulePoliciesWidgetContent';

// Constants
const TAB_ITEMS = [
  { id: 'overview', label: 'Overview', icon: <FileText className="w-4 h-4" /> },
  { id: 'base-modules', label: 'Módulos Base', icon: <Database className="w-4 h-4" /> },
  { id: 'implementations', label: 'Implementações', icon: <Settings className="w-4 h-4" /> },
  { id: 'assignments', label: 'Atribuições', icon: <Users className="w-4 h-4" /> },
  { id: 'configurations', label: 'Configurações', icon: <Package className="w-4 h-4" /> },
];

const INITIAL_PAGINATION = {
  currentPage: 1,
  totalItems: 0,
  totalPages: 0,
  hasMore: false
};

const DEBOUNCE_DELAY = 300;
const LOAD_MORE_LIMIT = 1000;

/**
 * Página Principal de Gestão de Módulos
 * 
 * Consolida toda a funcionalidade de gestão em abas organizadas:
 * - Overview: Estatísticas e visão geral do sistema
 * - Módulos Base: CRUD de módulos fundamentais
 * - Implementações: Variações específicas dos módulos
 * - Atribuições: Vinculação com organizações
 * - Configurações: Políticas e configurações globais
 * 
 * Mantém toda a funcionalidade da versão anterior com estado otimístico
 * e organização melhorada por contexto.
 */
export default function GestaoModulosPage() {
  const [showArchived, setShowArchived] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Hook para dialog de criação de módulos
  const { openDialog } = useModuleCreationDialog();

  // Filtros específicos para módulos base (dos implementações)
  const [includeArchivedModules, setIncludeArchivedModules] = useState(false);
  const [includeDeletedModules, setIncludeDeletedModules] = useState(false);
  
  // Implementações não usam mais soft delete - removido

  // Estado inicial dos dados
  const [initialBaseModules, setInitialBaseModules] = useState([]);
  const [initialImplementations, setInitialImplementations] = useState([]);
  const [initialAssignments, setInitialAssignments] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [stats, setStats] = useState(null);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Estado de paginação das implementações
  const [implementationsPagination, setImplementationsPagination] = useState({
    currentPage: 1,
    totalItems: 0,
    totalPages: 0,
    hasMore: false
  });
  const [loadingMore, setLoadingMore] = useState(false);

  // Estado otimístico para base modules
  const {
    baseModules,
    optimisticUpdate: optimisticUpdateBaseModule,
    optimisticCreate: optimisticCreateBaseModule,
    optimisticDelete: optimisticDeleteBaseModule,
    optimisticArchive: optimisticArchiveBaseModule,
    optimisticRestore: optimisticRestoreBaseModule,
    optimisticPurge: optimisticPurgeBaseModule,
    confirmOperation: confirmBaseModuleOperation,
    revertOperation: revertBaseModuleOperation,
    syncWithServer: syncBaseModulesWithServer,
    hasOptimisticOperations: hasOptimisticBaseModuleOperations,
    setBaseModules: setBaseBaseModules
  } = useOptimisticBaseModules({
    initialBaseModules,
    onError: (error, operation) => {
      console.error('Erro na operação otimística de base module:', error, operation);
    }
  });

  // Versões filtradas dos módulos para usar em dialogs (sem arquivados e deletados)
  const activeBaseModules = useMemo(() => {
    return baseModules.filter(module =>
      module.is_active && !module.archived_at && !module.deleted_at
    );
  }, [baseModules]);

  // Estado otimístico para implementações
  const {
    implementations,
    optimisticUpdate: optimisticUpdateImplementation,
    optimisticCreate: optimisticCreateImplementation,
    optimisticDelete: optimisticDeleteImplementation,
    confirmOperation: confirmImplementationOperation,
    revertOperation: revertImplementationOperation,
    syncWithServer: syncImplementationsWithServer,
    hasOptimisticOperations: hasOptimisticImplementationOperations,
    setBaseImplementations
  } = useOptimisticImplementations({
    initialImplementations,
    onError: (error, operation) => {
      console.error('Erro na operação otimística de implementação:', error, operation);
    }
  });

  // Estado otimístico para assignments
  const {
    assignments,
    tenantGroups,
    optimisticCreate: optimisticCreateAssignment,
    optimisticUpdate: optimisticUpdateAssignment,
    optimisticDelete: optimisticDeleteAssignment,
    confirmOperation: confirmAssignmentOperation,
    revertOperation: revertAssignmentOperation,
    syncWithServer: syncAssignmentsWithServer,
    hasOptimisticOperations: hasOptimisticAssignmentOperations,
    setBaseAssignments
  } = useOptimisticAssignments({
    initialAssignments,
    onError: (error, operation) => {
      console.error('Erro na operação otimística de assignment:', error, operation);
    }
  });

  // Refs únicos por instância para evitar conflitos entre abas
  const hookId = useRef(`modules-${Math.random().toString(36).substring(2)}`);
  const loadingRef = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(false);
  const loadCalledRef = useRef(false);
  const loadCompletedRef = useRef(false);

  // Função otimizada de carregamento de dados
  const loadData = useCallback(async () => {
    if (loadingRef.current) {
      console.debug('🚫 CLIENT: Carregamento já em progresso, ignorando...');
      return;
    }

    if (loadCompletedRef.current) {
      console.debug('🚫 CLIENT: Dados já carregados, ignorando...');
      return;
    }

    if (!mountedRef.current && mountedRef.current !== false) {
      console.debug('🚫 CLIENT: Component not mounted, skipping loadData');
      return;
    }

    const callId = `LOAD_${Date.now()}_${hookId.current}`;
    console.debug(`🚀 CLIENT: Starting loadData ${callId}`, { hookId: hookId.current });

    loadingRef.current = true;
    setModuleLoading(true);

    try {
      const { getBaseModules, getBaseModuleStats } = await import('@/app/actions/admin/modules/base-modules');
      const { getModuleImplementations } = await import('@/app/actions/admin/modules/module-implementations');
      const { getTenantAssignments } = await import('@/app/actions/admin/modules/tenant-module-assignments');
      const { getAllModulesWithOrganizationAssignments } = await import('@/app/actions/admin/modules/module-organization-data');

      // Carregar todos os dados em paralelo
      const [modulesResult, statsResult, implementationsResult, assignmentsResult, organizationsResult] = await Promise.all([
        getBaseModules({ includeArchived: true, includeDeleted: true }),
        getBaseModuleStats(),
        getModuleImplementations({
          includeArchivedModules: true,
          includeDeletedModules: true,
          limit: LOAD_MORE_LIMIT
        }),
        getTenantAssignments({}),
        getAllModulesWithOrganizationAssignments()
      ]);

      if (modulesResult.success) {
        const modulesData = modulesResult.data?.modules || [];
        setInitialBaseModules(modulesData);
        setBaseBaseModules(modulesData);
      }

      if (statsResult.success) {
        setStats(statsResult.data);
      } else {
        setStats(null);
      }

      if (implementationsResult.success) {
        const implementationsData = implementationsResult.data?.implementations || [];
        setInitialImplementations(implementationsData);
        setBaseImplementations(implementationsData);

        // Atualizar informações de paginação
        const total = implementationsResult.data?.total || 0;
        const pages = implementationsResult.data?.pages || 0;
        setImplementationsPagination({
          currentPage: 1,
          totalItems: total,
          totalPages: pages,
          hasMore: pages > 1
        });
      } else {
        setInitialImplementations([]);
        setBaseImplementations([]);
        setImplementationsPagination({
          currentPage: 1,
          totalItems: 0,
          totalPages: 0,
          hasMore: false
        });
      }


      if (assignmentsResult.success) {
        const assignmentsData = assignmentsResult.data?.assignments || [];
        setInitialAssignments(assignmentsData);
        setBaseAssignments(assignmentsData);
      } else {
        setInitialAssignments([]);
        setBaseAssignments([]);
      }

      if (organizationsResult.success) {
        setOrganizations(organizationsResult.data || []);
      } else {
        setOrganizations([]);
      }
    } catch (error) {
      setStats(null);
      setInitialImplementations([]);
      setBaseImplementations([]);
      setInitialAssignments([]);
      setBaseAssignments([]);
      setOrganizations([]);
    } finally {
      loadingRef.current = false;
      setModuleLoading(false);
      setIsInitialLoad(false);
      loadCompletedRef.current = true;
    }
  }, []); // ✅ No dependencies needed - only uses state setters and refs

  // Carregar dados na montagem
  useEffect(() => {
    if (loadCalledRef.current) {
      console.debug('🚫 CLIENT: loadData já foi chamado, pulando...');
      return;
    }

    loadCalledRef.current = true;
    mountedRef.current = true;

    loadData();

    return () => {
      mountedRef.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [loadData]);

  // Função para carregar mais implementações
  const loadMoreImplementations = useCallback(async () => {
    if (loadingMore || !implementationsPagination.hasMore) return;

    setLoadingMore(true);

    try {
      const { getModuleImplementations } = await import('@/app/actions/admin/modules/module-implementations');

      const nextPage = implementationsPagination.currentPage + 1;
      const result = await getModuleImplementations({
        includeArchivedModules: true,
        includeDeletedModules: true,
        page: nextPage
      });

      if (result.success) {
        const newImplementations = result.data?.implementations || [];
        const currentImplementations = implementations;

        // Adicionar novas implementações às existentes
        const updatedImplementations = [...currentImplementations, ...newImplementations];
        setBaseImplementations(updatedImplementations);

        // Atualizar paginação
        const total = result.data?.total || 0;
        const pages = result.data?.pages || 0;
        setImplementationsPagination({
          currentPage: nextPage,
          totalItems: total,
          totalPages: pages,
          hasMore: nextPage < pages
        });
      }
    } catch (error) {
      console.error('Erro ao carregar mais implementações:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, implementationsPagination, implementations, setBaseImplementations]);

  // Função otimística para atualizar configuração de módulo
  const updateModuleConfig = async (tenantId: string, baseModuleId: string, config: Record<string, any>) => {
    try {
      const { updateTenantModuleConfig } = await import('@/app/actions/admin/modules/tenant-module-assignments');

      const currentAssignment = assignments.find(a =>
        a.tenant_id === tenantId && a.base_module_id === baseModuleId
      );

      if (currentAssignment && handleOptimisticAssignmentUpdate) {
        const updatedAssignment = {
          ...currentAssignment,
          custom_config: config
        };

        const operationId = handleOptimisticAssignmentUpdate(updatedAssignment);
        console.debug('🚀 Update otimístico de config aplicado:', operationId);

        const result = await updateTenantModuleConfig(tenantId, baseModuleId, config);

        if (result.success) {
          handleAssignmentServerOperationSuccess(operationId, updatedAssignment);
          console.debug('✅ Update de config confirmado pelo servidor:', operationId);
        } else {
          handleAssignmentServerOperationError(operationId, result.error || result.message || 'Erro no servidor');
          throw new Error(result.error || result.message || 'Erro ao atualizar configuração');
        }

        return result;
      } else {
        const result = await updateTenantModuleConfig(tenantId, baseModuleId, config);
        if (!result.success) {
          throw new Error(result.error || result.message || 'Erro ao atualizar configuração');
        }
        return result;
      }
    } catch (error) {
      console.error('Erro em updateModuleConfig:', error);
      throw error;
    }
  };

  // ===========================================
  // UTILITY FUNCTIONS
  // ===========================================
  
  const getImplementationsForModule = useCallback((baseModuleId: string) => {
    return implementations.filter(impl => impl.base_module_id === baseModuleId);
  }, [implementations]);


  const getAssignmentsForTenant = useCallback((tenantId: string) => {
    return assignments.filter(assignment => assignment.tenant_id === tenantId);
  }, [assignments]);
  
  const getAssignmentsForModule = useCallback((baseModuleId: string) => {
    return assignments.filter(assignment => assignment.base_module_id === baseModuleId);
  }, [assignments]);

  // ===========================================
  // BASE MODULES HANDLERS
  // ===========================================
  
  const handleBaseModuleChange = useCallback(() => {
    console.debug('🚀 Mudança de base module detectada - usando estado otimístico');
  }, []);

  const handleOptimisticBaseModuleCreate = useCallback((newBaseModule) => {
    console.debug('📝 PAGE: handleOptimisticBaseModuleCreate chamado para:', newBaseModule.name);
    const operationId = optimisticCreateBaseModule(newBaseModule);
    console.debug('📝 PAGE: operationId retornado:', operationId);
    return operationId;
  }, [optimisticCreateBaseModule]);

  const handleOptimisticBaseModuleUpdate = useCallback((updatedBaseModule) => {
    console.debug('✏️ PAGE: handleOptimisticBaseModuleUpdate chamado para:', updatedBaseModule.name);
    const operationId = optimisticUpdateBaseModule(updatedBaseModule);
    console.debug('✏️ PAGE: operationId retornado:', operationId);
    return operationId;
  }, [optimisticUpdateBaseModule]);

  const handleOptimisticBaseModuleDelete = useCallback((moduleId) => {
    return optimisticDeleteBaseModule(moduleId);
  }, [optimisticDeleteBaseModule]);

  const handleOptimisticBaseModuleArchive = useCallback((moduleId) => {
    return optimisticArchiveBaseModule(moduleId);
  }, [optimisticArchiveBaseModule]);

  const handleOptimisticBaseModuleRestore = useCallback((moduleId) => {
    return optimisticRestoreBaseModule(moduleId);
  }, [optimisticRestoreBaseModule]);

  const handleOptimisticBaseModulePurge = useCallback((moduleId) => {
    return optimisticPurgeBaseModule(moduleId);
  }, [optimisticPurgeBaseModule]);

  const handleBaseModuleServerOperationSuccess = useCallback((operationId, serverData = null) => {
    console.debug('✅ PAGE: handleBaseModuleServerOperationSuccess chamado:', operationId, serverData?.name);
    confirmBaseModuleOperation(operationId, serverData);
  }, [confirmBaseModuleOperation]);

  const handleBaseModuleServerOperationError = useCallback((operationId, errorMessage) => {
    console.debug('❌ PAGE: handleBaseModuleServerOperationError chamado:', operationId, errorMessage);
    revertBaseModuleOperation(operationId, errorMessage);
  }, [revertBaseModuleOperation]);

  // ===========================================
  // IMPLEMENTATIONS HANDLERS
  // ===========================================
  
  const handleImplementationChange = useCallback(() => {
    console.debug('🚀 Mudança de implementação detectada - usando estado otimístico');
  }, []);

  const handleOptimisticImplementationUpdate = useCallback((updatedImplementation) => {
    return optimisticUpdateImplementation(updatedImplementation);
  }, [optimisticUpdateImplementation]);

  const handleOptimisticImplementationCreate = useCallback((newImplementation) => {
    return optimisticCreateImplementation(newImplementation);
  }, [optimisticCreateImplementation]);

  const handleOptimisticImplementationDelete = useCallback((implementationId) => {
    return optimisticDeleteImplementation(implementationId);
  }, [optimisticDeleteImplementation]);

  const handleImplementationServerOperationSuccess = useCallback((operationId, serverData = null) => {
    confirmImplementationOperation(operationId, serverData);
  }, [confirmImplementationOperation]);

  const handleImplementationServerOperationError = useCallback((operationId, errorMessage) => {
    revertImplementationOperation(operationId, errorMessage);
  }, [revertImplementationOperation]);

  // ===========================================
  // ASSIGNMENTS HANDLERS
  // ===========================================
  
  const handleAssignmentChange = useCallback(() => {
    console.debug('🚀 Mudança de assignment detectada - usando estado otimístico');
  }, []);

  const handleOptimisticAssignmentCreate = useCallback((newAssignment) => {
    return optimisticCreateAssignment(newAssignment);
  }, [optimisticCreateAssignment]);

  const handleOptimisticAssignmentUpdate = useCallback((updatedAssignment) => {
    return optimisticUpdateAssignment(updatedAssignment);
  }, [optimisticUpdateAssignment]);

  const handleOptimisticAssignmentDelete = useCallback((tenantId, baseModuleId, assignmentInfo) => {
    return optimisticDeleteAssignment(tenantId, baseModuleId, assignmentInfo);
  }, [optimisticDeleteAssignment]);

  const handleAssignmentServerOperationSuccess = useCallback((operationId, serverData = null) => {
    confirmAssignmentOperation(operationId, serverData);
  }, [confirmAssignmentOperation]);

  const handleAssignmentServerOperationError = useCallback((operationId, errorMessage) => {
    revertAssignmentOperation(operationId, errorMessage);
  }, [revertAssignmentOperation]);

  // ===========================================
  // GENERAL HANDLERS
  // ===========================================
  
  const handleReload = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Reset flags para permitir novo carregamento
    loadCompletedRef.current = false;
    loadCalledRef.current = false;
    // Não resetar isInitialLoad durante refresh - mantém false

    // Reset paginação
    setImplementationsPagination(INITIAL_PAGINATION);

    debounceRef.current = setTimeout(() => {
      loadData();
    }, DEBOUNCE_DELAY);
  }, [loadData]);

  const combinedLoading = moduleLoading;
  const hasAnyOptimisticOperations = hasOptimisticBaseModuleOperations || hasOptimisticImplementationOperations || hasOptimisticAssignmentOperations;


  // ===========================================
  // RENDER
  // ===========================================
  
  return (
    <SystemConfigProvider>
      <Layout width="container">
        <Layout.Header>
          <Layout.Header.Title>
            Gestão de Módulos
            <Layout.Header.Description>
              Gerencie módulos, implementações e atribuições de forma centralizada.
            </Layout.Header.Description>
          </Layout.Header.Title>
          <Layout.Actions>
            <Button 
              variant="default"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openDialog}
            >
              Criar Módulo
            </Button>
            <Button 
              variant="secondary" 
              leftIcon={
                !isInitialLoad && moduleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )
              }
              onClick={handleReload} 
              disabled={!isInitialLoad && moduleLoading}
            >
              {!isInitialLoad && moduleLoading ? 'Atualizando' : 'Atualizar'}
            </Button>
          </Layout.Actions>
        </Layout.Header>

        <Layout.Body>
          <Layout.Content>
            <div className="w-full space-y-4">
              <Tabs
                items={TAB_ITEMS}
                value={activeTab}
                onValueChange={setActiveTab}
                variant="underline"
                className="w-full"
                defaultValue="overview"
              />

              {renderOverviewTab()}
              {renderBaseModulesTab()}
              {renderImplementationsTab()}
              {renderAssignmentsTab()}
              {renderConfigurationsTab()}
            </div>
          </Layout.Content>
        </Layout.Body>
      </Layout>
    </SystemConfigProvider>
  );
  
  // ===========================================
  // SKELETON COMPONENTS
  // ===========================================
  
  function OverviewSkeleton() {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} size="sm">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  function BaseModulesSkeleton() {
    return (
      <Card size="sm" variant="ghost">
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-9 w-36" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  function ImplementationsSkeleton() {
    return (
      <Card size="sm" variant="ghost">
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-52" />
              <Skeleton className="h-4 w-80" />
            </div>
            <Skeleton className="h-9 w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-5 w-40" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="p-3 border rounded-lg space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  function AssignmentsSkeleton() {
    return (
      <Card size="sm" variant="ghost">
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-5 w-36" />
                </div>
                <div className="ml-11 space-y-2">
                  {[...Array(2)].map((_, j) => (
                    <div key={j} className="flex items-center justify-between p-2 border rounded">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  function ConfigurationsSkeleton() {
    return (
      <div className="space-y-4">
        <Card size="sm" variant="ghost">
          <CardHeader>
            <div className="flex flex-row items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-4 w-80" />
              </div>
              <Skeleton className="h-9 w-40" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card size="sm" variant="ghost" className="border-dashed">
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-56" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===========================================
  // TAB RENDERERS
  // ===========================================
  
  function renderOverviewTab() {
    return (
      <TabsContent value="overview" activeValue={activeTab}>
        {isInitialLoad && moduleLoading ? (
          <OverviewSkeleton />
        ) : (
          <ModuleStatsWidget
            stats={stats}
            loading={false}
          />
        )}
      </TabsContent>
    );
  }
  
  function renderBaseModulesTab() {
    if (isInitialLoad && moduleLoading) {
      return (
        <TabsContent value="base-modules" activeValue={activeTab}>
          <BaseModulesSkeleton />
        </TabsContent>
      );
    }
    
    return (
      <TabsContent value="base-modules" activeValue={activeTab}>
        <Card size="sm" variant="ghost">
          <CardHeader>
            <div className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Módulos Base do Sistema</CardTitle>
                <CardDescription>
                  Gerencie os módulos base que servem como fundação para implementações específicas.
                </CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="secondary" 
                    className="flex items-center gap-2" 
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Novo Módulo
                  </Button>
                </DialogTrigger>
                <DialogContent size="fullscreen">
                  <ModuleCreationWizard />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <BaseModulesTable
              baseModules={baseModules}
              implementations={implementations}
              assignments={assignments}
              loading={false}
              getImplementationsForModule={getImplementationsForModule}
              getAssignmentsForModule={getAssignmentsForModule}
              onModuleChange={handleReload}
              showArchived={showArchived}
              showDeleted={showDeleted}
              setShowArchived={setShowArchived}
              setShowDeleted={setShowDeleted}
              onOptimisticUpdate={handleOptimisticBaseModuleUpdate}
              onOptimisticArchive={handleOptimisticBaseModuleArchive}
              onOptimisticDelete={handleOptimisticBaseModuleDelete}
              onOptimisticRestore={handleOptimisticBaseModuleRestore}
              onOptimisticPurge={handleOptimisticBaseModulePurge}
              onServerSuccess={handleBaseModuleServerOperationSuccess}
              onServerError={handleBaseModuleServerOperationError}
            />
          </CardContent>
        </Card>
      </TabsContent>
    );
  }
  
  function renderImplementationsTab() {
    if (isInitialLoad && moduleLoading) {
      return (
        <TabsContent value="implementations" activeValue={activeTab}>
          <ImplementationsSkeleton />
        </TabsContent>
      );
    }
    
    return (
      <TabsContent value="implementations" activeValue={activeTab}>
        <Card size="sm" variant="ghost">
          <CardHeader>
            <div className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gestão de Implementações</CardTitle>
                <CardDescription>
                  Configure implementações específicas para cada módulo base (Standard, Banban, Enterprise, etc.).
                </CardDescription>
              </div>
              <CreateImplementationDialog
                baseModules={activeBaseModules}
                onImplementationCreated={handleImplementationChange}
                onOptimisticCreate={handleOptimisticImplementationCreate}
                onServerSuccess={handleImplementationServerOperationSuccess}
                onServerError={handleImplementationServerOperationError}
              >
                <Button 
                  variant="secondary" 
                  className="flex items-center gap-2" 
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Nova Implementação
                </Button>
              </CreateImplementationDialog>
            </div>
          </CardHeader>
          <CardContent>
            <ImplementationsManager
              baseModules={baseModules}
              implementations={implementations}
              loading={false}
              getImplementationsForModule={getImplementationsForModule}
              onDataChange={handleImplementationChange}
              onOptimisticUpdate={handleOptimisticImplementationUpdate}
              onOptimisticDelete={handleOptimisticImplementationDelete}
              onServerSuccess={handleImplementationServerOperationSuccess}
              onServerError={handleImplementationServerOperationError}
              hasOptimisticOperations={hasOptimisticImplementationOperations}
              includeArchivedModules={includeArchivedModules}
              includeDeletedModules={includeDeletedModules}
              onToggleArchivedModules={setIncludeArchivedModules}
              onToggleDeletedModules={setIncludeDeletedModules}
              pagination={implementationsPagination}
              onLoadMore={loadMoreImplementations}
              loadingMore={loadingMore}
            />
          </CardContent>
        </Card>
      </TabsContent>
    );
  }
  
  function renderAssignmentsTab() {
    if (isInitialLoad && moduleLoading) {
      return (
        <TabsContent value="assignments" activeValue={activeTab}>
          <AssignmentsSkeleton />
        </TabsContent>
      );
    }
    
    return (
      <TabsContent value="assignments" activeValue={activeTab}>
        <Card size="sm" variant="ghost">
          <CardHeader>
            <div className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Atribuições por Organização</CardTitle>
                <CardDescription>
                  Gerencie quais implementações cada organização está usando.
                </CardDescription>
              </div>
              <NewAssignmentDialog
                tenants={tenantGroups}
                organizations={organizations}
                baseModules={activeBaseModules}
                implementations={implementations}
                onAssignmentCreated={handleAssignmentChange}
                onOptimisticCreate={handleOptimisticAssignmentCreate}
                onServerSuccess={handleAssignmentServerOperationSuccess}
                onServerError={handleAssignmentServerOperationError}
                trigger={
                  <Button
                    variant="secondary"
                    className="flex items-center gap-2"
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Nova Atribuição
                  </Button>
                }
              />
            </div>
          </CardHeader>
          <CardContent>
            <TenantAssignmentsManager
              tenantGroups={tenantGroups}
              assignments={assignments}
              baseModules={baseModules}
              implementations={implementations}
              organizations={organizations}
              loading={false}
              updateModuleConfig={updateModuleConfig}
              getAssignmentsForTenant={getAssignmentsForTenant}
              onAssignmentCreated={handleAssignmentChange}
              onOptimisticCreate={handleOptimisticAssignmentCreate}
              onOptimisticUpdate={handleOptimisticAssignmentUpdate}
              onOptimisticDelete={handleOptimisticAssignmentDelete}
              onServerSuccess={handleAssignmentServerOperationSuccess}
              onServerError={handleAssignmentServerOperationError}
              hasOptimisticOperations={hasOptimisticAssignmentOperations}
            />
          </CardContent>
        </Card>
      </TabsContent>
    );
  }
  
  function renderConfigurationsTab() {
    if (isInitialLoad && moduleLoading) {
      return (
        <TabsContent value="configurations" activeValue={activeTab}>
          <ConfigurationsSkeleton />
        </TabsContent>
      );
    }
    
    return (
      <TabsContent value="configurations" activeValue={activeTab}>
        <div className="space-y-4">
          {/* Configurações Gerais - ESSENCIAL PARA MVP */}
          <Card size="sm" variant="ghost">
            <CardHeader>
              <div className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Configurações Gerais</CardTitle>
                  <CardDescription>
                    Configure comportamentos padrão e parâmetros globais do sistema.
                  </CardDescription>
                </div>
                <Button
                  variant="secondary"
                  className="flex items-center gap-2"
                  leftIcon={<Save className="w-4 h-4" />}
                  onClick={() => {
                    const saveButton = document.querySelector('[data-save-settings]') as HTMLButtonElement;
                    if (saveButton) {
                      saveButton.click();
                    }
                  }}
                >
                  Salvar Configurações
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ModuleSettingsFormContent />
            </CardContent>
          </Card>

          {/* Placeholder para indicar recursos futuros */}
          <Card size="sm" variant="ghost" className="border-dashed border-muted-foreground/30">
            <CardHeader>
              <CardTitle className="text-muted-foreground">Recursos Avançados (Pós-MVP)</CardTitle>
              <CardDescription>
                Funcionalidades como gerenciamento de permissões, sistema de notificações
                e políticas avançadas serão implementadas nas próximas iterações.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Controle de Acesso Baseado em Roles (RBAC)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <span>Sistema de Notificações Automáticas</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Políticas de Validação e Compliance</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    );
  }
}