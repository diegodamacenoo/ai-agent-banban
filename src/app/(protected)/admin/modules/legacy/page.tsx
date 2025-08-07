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
  ArrowLeft
} from 'lucide-react';
import { Layout } from '@/shared/components/Layout';
import { AdminSidebar } from '../../components/admin-sidebar';
import Link from 'next/link';

// Novos hooks e componentes para Fase 5
import { type TenantModuleAssignment } from '../hooks/useModuleData';
import { useOptimisticImplementations } from '../hooks/useOptimisticImplementations';
import { useOptimisticAssignments } from '../hooks/useOptimisticAssignments';
import { useOptimisticBaseModules } from '../hooks/useOptimisticBaseModules';

// Componentes existentes (mantidos)
import { ModuleHealthCard } from '../components/monitoring/ModuleHealthCard';
import DevelopmentDashboard from '../components/analytics/DevelopmentDashboard';
import QualityAnalysis from '../components/monitoring/QualityAnalysis';
import { DevelopmentLogs } from '../components/monitoring/DevelopmentLogs';

// Novos componentes para Fase 5 (a serem criados)
import { BaseModulesTable } from '../components/shared';
import { ImplementationsManager } from '../components/assignments/implementations-manager';
import { TenantAssignmentsManager } from '../components/assignments/TenantAssignmentsManager';
import { ModuleStatsWidget } from '../components/analytics/ModuleStatsWidget';
import { CreateImplementationDialog } from '../components/assignments/CreateImplementationDialog';
import { NewAssignmentDialog } from '../components/assignments/NewAssignmentDialog';
import { CreateBaseModuleDialog } from '../components/lifecycle/CreateBaseModuleDialog';

/**
 * Versão Legacy da Gestão de Módulos
 * 
 * Esta é a versão anterior mantida durante o período de transição.
 * Mantém toda a funcionalidade original em abas.
 */
export default function ModulesLegacyPage() {
  const [showArchived, setShowArchived] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [activeTab, setActiveTab] = useState('base-modules');
  
  // Filtros específicos para módulos base (dos implementações)
  const [includeArchivedModules, setIncludeArchivedModules] = useState(false);
  const [includeDeletedModules, setIncludeDeletedModules] = useState(false);
  
  // Implementações não usam mais soft delete - removido

  // Manual state management to identify the source of multiple requests
  const [initialBaseModules, setInitialBaseModules] = useState([]);
  const [initialImplementations, setInitialImplementations] = useState([]);
  const [initialAssignments, setInitialAssignments] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [stats, setStats] = useState(null);
  const [moduleLoading, setModuleLoading] = useState(false);

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

  // Debug: Log quando baseModules mudar
  useEffect(() => {
    console.debug('📋 PAGE: Lista de baseModules atualizada:', baseModules.length, 'módulos');
    baseModules.forEach(module => console.debug('  -', module.name, module.id));
  }, [baseModules]);

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
  const hookId = useRef(`legacy-modules-${Math.random().toString(36).substring(2)}`);
  const loadingRef = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(false);
  const loadCalledRef = useRef(false);
  const loadCompletedRef = useRef(false);

  // Optimized load function with controlled execution
  const loadData = useCallback(async () => {
    // Usar ref para evitar múltiplas chamadas simultâneas
    if (loadingRef.current) {
      return;
    }
    
    // Verificar se o componente ainda está montado
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
      
      // Carregar todos os dados em paralelo (sempre incluindo arquivados e deletados para filtros otimísticos)
      const [modulesResult, statsResult, implementationsResult, assignmentsResult, organizationsResult] = await Promise.all([
        getBaseModules({ includeArchived: true, includeDeleted: true }),
        getBaseModuleStats(),
        getModuleImplementations({ 
          includeArchivedModules: true,
          includeDeletedModules: true
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
      } else {
        setInitialImplementations([]);
        setBaseImplementations([]);
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
    }
  }, []); // Empty dependency array to prevent recreation

  // Single useEffect with empty dependency array
  useEffect(() => {
    // Strict mode protection
    if (loadCalledRef.current) {
      console.debug('🚫 CLIENT: loadData já foi chamado, pulando...');
      return;
    }
    
    loadCalledRef.current = true;
    mountedRef.current = true;
    
    loadData();
    
    // Cleanup function
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Função otimística para atualizar configuração de módulo
  const updateModuleConfig = async (tenantId: string, baseModuleId: string, config: Record<string, any>) => {
    try {
      const { updateTenantModuleConfig } = await import('@/app/actions/admin/modules/tenant-module-assignments');
      
      // Encontrar o assignment atual para fazer update otimístico
      const currentAssignment = assignments.find(a => 
        a.tenant_id === tenantId && a.base_module_id === baseModuleId
      );

      if (currentAssignment && handleOptimisticAssignmentUpdate) {
        // Update otimístico imediato
        const updatedAssignment = {
          ...currentAssignment,
          custom_config: config
        };
        
        const operationId = handleOptimisticAssignmentUpdate(updatedAssignment);
        console.debug('🚀 Update otimístico de config aplicado:', operationId);

        // Server action em background
        const result = await updateTenantModuleConfig(tenantId, baseModuleId, config);
        
        if (result.success) {
          // Confirmar operação otimística
          handleAssignmentServerOperationSuccess(operationId, updatedAssignment);
          console.debug('✅ Update de config confirmado pelo servidor:', operationId);
        } else {
          // Reverter operação otimística
          handleAssignmentServerOperationError(operationId, result.error || result.message || 'Erro no servidor');
          throw new Error(result.error || result.message || 'Erro ao atualizar configuração');
        }
        
        return result;
      } else {
        // Fallback: sem estado otimístico
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
  const getImplementationsForModule = (baseModuleId: string) => {
    return implementations.filter(impl => impl.base_module_id === baseModuleId);
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
    // Para base modules, não precisamos recarregar - estado otimístico cuida
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
    // Para implementações, não precisamos recarregar - estado otimístico cuida
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
    // Para assignments, não precisamos recarregar - estado otimístico cuida
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

  // Callback tradicional para outras entidades (assignments, módulos base)
  const handleReload = useCallback(() => {
    // Debounce para evitar múltiplas chamadas
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      loadData();
    }, 100);
  }, []);

  // FILTROS OTIMÍSTICOS: Não recarregamos dados do servidor ao mudar filtros
  // A filtragem acontece instantaneamente no frontend via BaseModulesTable



  const combinedLoading = moduleLoading || statsLoading;
  const hasAnyOptimisticOperations = hasOptimisticBaseModuleOperations || hasOptimisticImplementationOperations || hasOptimisticAssignmentOperations;

  const tabItems = [
    { id: 'base-modules', label: 'Módulos Base', icon: <Database className="w-4 h-4" /> },
    { id: 'implementations', label: 'Implementações', icon: <Settings className="w-4 h-4" /> },
    { id: 'assignments', label: 'Atribuições', icon: <Users className="w-4 h-4" /> },
    { id: 'development', label: 'Desenvolvimento' },
    { id: 'quality', label: 'Qualidade' },
    { id: 'logs', label: 'Logs' },
  ];

  // Sidebar content com estatísticas da nova estrutura
  const sidebarContent = (
    <div className="flex flex-col gap-4">
      <h3 className="font-medium text-lg">Estatísticas</h3>
      <ModuleStatsWidget
        stats={moduleStats}
        loading={statsLoading}
      />

      {/* Resumo rápido */}
      {stats && (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Módulos Base:</span>
              <span className="font-semibold">{stats.overview.totalBaseModules}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Implementações:</span>
              <span className="font-semibold">{stats.overview.totalImplementations}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Atribuições:</span>
              <span className="font-semibold">{stats.overview.totalActiveAssignments}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Saúde Geral:</span>
              <span className="font-semibold text-green-600">{stats.overview.healthScore}%</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <Layout loading={combinedLoading}>
      <Layout.Header>
        <Layout.Breadcrumbs items={[
          { title: 'Admin' },
          { title: 'Módulos' },
          { title: 'Versão Legacy' }
        ]} />
        <Layout.Actions>
          <Button variant="outline" asChild>
            <Link href="/admin/modules">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Nova Versão
            </Link>
          </Button>
          <Button variant="secondary" onClick={handleReload} disabled={combinedLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </Layout.Actions>
      </Layout.Header>

      <Layout.Body>        
        <Layout.Sidebar width="w-80">
          {sidebarContent}
        </Layout.Sidebar>

        <Layout.Content>
          {/* Health Card (mantido) */}
          {/* {moduleStats && <ModuleHealthCard healthStats={moduleStats} />} */}

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
                    implementations={implementations}
                    assignments={assignments}
                    loading={moduleLoading}
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

            {/* Tabs existentes (mantidas) */}
            <TabsContent value="development" activeValue={activeTab}>
              <DevelopmentDashboard />
            </TabsContent>

            <TabsContent value="quality" activeValue={activeTab}>
              <QualityAnalysis />
            </TabsContent>

            <TabsContent value="logs" activeValue={activeTab}>
              <DevelopmentLogs />
            </TabsContent>
          </div>
        </Layout.Content>
      </Layout.Body>
    </Layout>
  );
}