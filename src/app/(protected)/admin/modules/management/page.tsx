'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsContent } from '@/shared/ui/tabs';
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
  FileText
} from 'lucide-react';
import { Layout } from '@/shared/components/Layout';

// Hooks e componentes para gestão de módulos
import { type TenantModuleAssignment } from '../hooks/useModuleData';
import { useOptimisticImplementations } from '../hooks/useOptimisticImplementations';
import { useOptimisticAssignments } from '../hooks/useOptimisticAssignments';
import { useOptimisticBaseModules } from '../hooks/useOptimisticBaseModules';

// Componentes principais
import { BaseModulesTable } from '../components/shared';
import { ImplementationsManager } from '../components/assignments/implementations-manager';
import { TenantAssignmentsManager } from '../components/assignments/TenantAssignmentsManager';
import { ModuleStatsWidget } from '../components/analytics/ModuleStatsWidget';
import { CreateImplementationDialog } from '../components/assignments/CreateImplementationDialog';
import { NewAssignmentDialog } from '../components/assignments/NewAssignmentDialog';
import { CreateBaseModuleDialog } from '../components/lifecycle/CreateBaseModuleDialog';

// Componentes de configuração (versões sem card wrapper)
import { ModuleSettingsFormContent } from '../components/configurations/ModuleSettingsFormContent';
import { SystemConfigProvider } from '../contexts/SystemConfigContext';
// COMENTADOS PARA MVP - recursos avançados para implementação posterior
// import { PermissionManagerContent } from '../components/configurations/PermissionManagerContent';
// import { NotificationManagerContent } from '../components/configurations/NotificationManagerContent';
// import { ModulePoliciesWidgetContent } from '../components/configurations/ModulePoliciesWidgetContent';

/**
 * Página Principal de Gestão de Módulos
 * 
 * Consolida toda a funcionalidade de gestão em abas organizadas:
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
  const [activeTab, setActiveTab] = useState('base-modules');

  // Filtros específicos para implementações
  const [includeArchivedModules, setIncludeArchivedModules] = useState(false);
  const [includeDeletedModules, setIncludeDeletedModules] = useState(false);

  // Estado inicial dos dados
  const [initialBaseModules, setInitialBaseModules] = useState([]);
  const [initialImplementations, setInitialImplementations] = useState([]);
  const [allImplementationsForCounting, setAllImplementationsForCounting] = useState([]); // Para contagem na tab Módulos Base
  const [initialAssignments, setInitialAssignments] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [stats, setStats] = useState(null);
  const [moduleLoading, setModuleLoading] = useState(false);

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

    const callId = `LOAD_${Date.now()}`;
    console.debug(`🚀 CLIENT: Starting loadData ${callId}`);

    loadingRef.current = true;
    setModuleLoading(true);

    try {
      const { getBaseModules, getBaseModuleStats } = await import('@/app/actions/admin/modules/base-modules');
      const { getModuleImplementations } = await import('@/app/actions/admin/modules/module-implementations');
      const { getTenantAssignments } = await import('@/app/actions/admin/modules/tenant-module-assignments');
      const { getAllModulesWithOrganizationAssignments } = await import('@/app/actions/admin/modules/module-organization-data');

      // Carregar todos os dados em paralelo
      const [modulesResult, statsResult, implementationsResult, allImplementationsResult, assignmentsResult, organizationsResult] = await Promise.all([
        getBaseModules({ includeArchived: true, includeDeleted: true }),
        getBaseModuleStats(),
        getModuleImplementations({
          includeArchived: true,
          includeDeleted: true,
          includeArchivedModules: true,
          includeDeletedModules: true
        }),
        // Carregar TODAS as implementações para contagem (sem limite)
        getModuleImplementations({
          includeArchived: true,
          includeDeleted: true,
          includeArchivedModules: true,
          includeDeletedModules: true,
          limit: 1000 // Limite alto para pegar todas
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

      // Processar TODAS as implementações para contagem
      if (allImplementationsResult.success) {
        const allImplementationsData = allImplementationsResult.data?.implementations || [];
        setAllImplementationsForCounting(allImplementationsData);
      } else {
        setAllImplementationsForCounting([]);
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
      loadCompletedRef.current = true;
      console.debug(`✅ CLIENT: Completed loadData ${callId}`);
    }
  }, []); // Empty dependency array to prevent recreation

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
        includeArchived: true,
        includeDeleted: true,
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

  // Funções auxiliares
  const getImplementationsForModule = (baseModuleId: string) => {
    return implementations.filter(impl => impl.base_module_id === baseModuleId);
  };

  // Função separada para contagem na tab Módulos Base (usa TODAS as implementações)
  const getImplementationsForModuleCounting = (baseModuleId: string) => {
    return allImplementationsForCounting.filter(impl => impl.base_module_id === baseModuleId);
  };

  const getAssignmentsForTenant = (tenantId: string) => {
    return assignments.filter(assignment => assignment.tenant_id === tenantId);
  };
  const getAssignmentsForModule = (baseModuleId: string) => {
    return assignments.filter(assignment => assignment.base_module_id === baseModuleId);
  };

  const moduleStats = stats;
  const statsLoading = moduleLoading;

  // Callbacks otimísticos para base modules
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

  // Callbacks para operações de base modules do servidor
  const handleBaseModuleServerOperationSuccess = useCallback((operationId, serverData = null) => {
    console.debug('✅ PAGE: handleBaseModuleServerOperationSuccess chamado:', operationId, serverData?.name);
    confirmBaseModuleOperation(operationId, serverData);
  }, [confirmBaseModuleOperation]);

  const handleBaseModuleServerOperationError = useCallback((operationId, errorMessage) => {
    console.debug('❌ PAGE: handleBaseModuleServerOperationError chamado:', operationId, errorMessage);
    revertBaseModuleOperation(operationId, errorMessage);
  }, [revertBaseModuleOperation]);

  // Callbacks otimísticos para implementações
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

  // Callbacks para operações de implementações do servidor
  const handleImplementationServerOperationSuccess = useCallback((operationId, serverData = null) => {
    confirmImplementationOperation(operationId, serverData);
  }, [confirmImplementationOperation]);

  const handleImplementationServerOperationError = useCallback((operationId, errorMessage) => {
    revertImplementationOperation(operationId, errorMessage);
  }, [revertImplementationOperation]);

  // Callbacks otimísticos para assignments
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

  // Callbacks para operações de assignments do servidor
  const handleAssignmentServerOperationSuccess = useCallback((operationId, serverData = null) => {
    confirmAssignmentOperation(operationId, serverData);
  }, [confirmAssignmentOperation]);

  const handleAssignmentServerOperationError = useCallback((operationId, errorMessage) => {
    revertAssignmentOperation(operationId, errorMessage);
  }, [revertAssignmentOperation]);

  // Callback tradicional para recarregamento
  const handleReload = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Reset flags para permitir novo carregamento
    loadCompletedRef.current = false;
    loadCalledRef.current = false;

    // Reset paginação
    setImplementationsPagination({
      currentPage: 1,
      totalItems: 0,
      totalPages: 0,
      hasMore: false
    });

    debounceRef.current = setTimeout(() => {
      loadData();
    }, 300); // Aumentar debounce para 300ms
  }, [loadData]);

  const combinedLoading = moduleLoading || statsLoading;
  const hasAnyOptimisticOperations = hasOptimisticBaseModuleOperations || hasOptimisticImplementationOperations || hasOptimisticAssignmentOperations;

  const tabItems = [
    { id: 'base-modules', label: 'Módulos Base', icon: <Database className="w-4 h-4" /> },
    { id: 'implementations', label: 'Implementações', icon: <Settings className="w-4 h-4" /> },
    { id: 'assignments', label: 'Atribuições', icon: <Users className="w-4 h-4" /> },
    { id: 'configurations', label: 'Configurações', icon: <Package className="w-4 h-4" /> },
  ];

  // Sidebar content com estatísticas
  const sidebarContent = (
    <div className="flex flex-col gap-4">
      <ModuleStatsWidget
        stats={moduleStats}
        loading={statsLoading}
      />
    </div>
  );

  return (
    <SystemConfigProvider>
      <Layout loading={combinedLoading}>
        <Layout.Header>
          <Layout.Breadcrumbs items={[
            { title: 'Módulos', icon: Package },
            { title: 'Gestão de Módulos' }
          ]} />
          <Layout.Actions>
            <Button variant="secondary" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={handleReload} disabled={combinedLoading}>
              Atualizar
            </Button>
          </Layout.Actions>
        </Layout.Header>

        <Layout.Body>
          <Layout.Sidebar width="w-80">
            {sidebarContent}
          </Layout.Sidebar>

          <Layout.Content>
            <div className="w-full space-y-4">
              <Tabs
                items={tabItems}
                value={activeTab}
                onValueChange={setActiveTab}
                variant="underline"
                className="w-full"
                defaultValue="base-modules"
              />

              {/* Tab: Módulos Base */}
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
                      <CreateBaseModuleDialog
                        onSuccess={handleBaseModuleChange}
                        onOptimisticCreate={handleOptimisticBaseModuleCreate}
                        onServerSuccess={handleBaseModuleServerOperationSuccess}
                        onServerError={handleBaseModuleServerOperationError}
                        trigger={
                          <Button variant="secondary" className="flex items-center gap-2" leftIcon={<Plus className="w-4 h-4" />}>
                            Novo Módulo Base
                          </Button>
                        }
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <BaseModulesTable
                      baseModules={baseModules}
                      implementations={allImplementationsForCounting}
                      assignments={assignments}
                      loading={moduleLoading}
                      getImplementationsForModule={getImplementationsForModuleCounting}
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

              {/* Tab: Implementações */}
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
                        <Button variant="secondary" className="flex items-center gap-2" leftIcon={<Plus className="w-4 h-4" />}>
                          Nova Implementação
                        </Button>
                      </CreateImplementationDialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ImplementationsManager
                      baseModules={baseModules}
                      implementations={implementations}
                      loading={moduleLoading}
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

              {/* Tab: Atribuições */}
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
                            leftIcon={<Plus className="w-4 h-4" />}>
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
                      loading={moduleLoading}
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

              {/* Tab: Configurações */}
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
                            // O formulário gerencia seu próprio estado de salvamento
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

                  {/* RECURSOS AVANÇADOS - COMENTADOS PARA PÓS-MVP */}
                  {/* 
                Gerenciamento de Permissões - AVANÇADO
                Sistema robusto de RBAC com controle granular
                Implementar após MVP quando houver múltiplos usuários
                */}
                  {/*
                <Card size="sm" variant="ghost">
                  <CardHeader>
                    <div className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Permissões e Controle de Acesso</CardTitle>
                        <CardDescription>
                          Configure roles, permissões e controle de acesso.
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" className="flex items-center gap-2" leftIcon={<RefreshCw className="w-4 h-4" />}>
                          Atualizar
                        </Button>
                        <Button variant="secondary" className="flex items-center gap-2" leftIcon={<Plus className="w-4 h-4" />}>
                          Nova Permissão
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PermissionManagerContent />
                  </CardContent>
                </Card>
                */}

                  {/* 
                Sistema de Notificações - AVANÇADO
                Notificações automáticas e alertas em tempo real
                Implementar após MVP quando houver integração com email/SMS
                */}
                  {/*
                <Card size="sm" variant="ghost">
                  <CardHeader>
                    <div className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Sistema de Notificações</CardTitle>
                        <CardDescription>
                          Configure alertas e notificações automáticas.
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" className="flex items-center gap-2" leftIcon={<RefreshCw className="w-4 h-4" />}>
                          Atualizar
                        </Button>
                        <Button variant="secondary" className="flex items-center gap-2" leftIcon={<Plus className="w-4 h-4" />}>
                          Nova Regra
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <NotificationManagerContent />
                  </CardContent>
                </Card>
                */}

                  {/* 
                Políticas e Regras - AVANÇADO
                Sistema complexo de validação e políticas de segurança
                Implementar após MVP quando houver necessidade de compliance avançado
                */}
                  {/*
                <Card size="sm" variant="ghost">
                  <CardHeader>
                    <div className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Políticas e Regras</CardTitle>
                        <CardDescription>
                          Defina regras de validação e políticas de segurança.
                        </CardDescription>
                      </div>
                      <Button variant="secondary" className="flex items-center gap-2" leftIcon={<FileText className="w-4 h-4" />}>
                        Configurar Políticas
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ModulePoliciesWidgetContent />
                  </CardContent>
                </Card>
                */}

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
            </div>
          </Layout.Content>
        </Layout.Body>
      </Layout>
    </SystemConfigProvider>
  );
}