'use client';

import { useState, useCallback, useRef } from 'react';
import { BaseModule } from '../types';

interface ModulesData {
  baseModules: BaseModule[];
  implementations: any[];
  assignments: any[];
  organizations: any[];
  stats: any;
}

interface UseModulesDataOptions {
  enableAutoLoad?: boolean;
  debounceDelay?: number;
  loadMoreLimit?: number;
}

/**
 * Hook customizado para gerenciamento de dados de módulos
 * Substitui o anti-pattern de useEffect para data fetching
 */
export function useModulesData(options: UseModulesDataOptions = {}) {
  const {
    enableAutoLoad = true,
    debounceDelay = 300,
    loadMoreLimit = 1000
  } = options;

  // Estados
  const [data, setData] = useState<ModulesData>({
    baseModules: [],
    implementations: [],
    assignments: [],
    organizations: [],
    stats: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Refs para controle de chamadas
  const loadingRef = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Estados de paginação para implementações
  const [implementationsPagination, setImplementationsPagination] = useState({
    currentPage: 1,
    totalItems: 0,
    totalPages: 0,
    hasMore: false
  });
  const [loadingMore, setLoadingMore] = useState(false);

  /**
   * Função principal de carregamento de dados
   * Carrega todos os dados necessários em paralelo
   */
  const loadData = useCallback(async () => {
    if (loadingRef.current) {
      console.debug('🚫 CLIENT: Carregamento já em progresso, ignorando...');
      return { success: false, error: 'Carregamento já em progresso' };
    }

    if (!mountedRef.current) {
      console.debug('🚫 CLIENT: Component not mounted, skipping loadData');
      return { success: false, error: 'Component não montado' };
    }

    const callId = `LOAD_${Date.now()}`;
    console.debug(`🚀 CLIENT: Starting loadData ${callId}`);

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Import dinâmico das server actions (apenas uma vez por hook instance)
      const [
        { getBaseModules, getBaseModuleStats },
        { getModuleImplementations },
        { getTenantAssignments },
        { getAllModulesWithOrganizationAssignments }
      ] = await Promise.all([
        import('@/app/actions/admin/modules/base-modules'),
        import('@/app/actions/admin/modules/module-implementations'),
        import('@/app/actions/admin/modules/tenant-module-assignments'),
        import('@/app/actions/admin/modules/module-organization-data')
      ]);

      // Carregar todos os dados em paralelo
      const [
        modulesResult,
        statsResult,
        implementationsResult,
        allImplementationsResult,
        assignmentsResult,
        organizationsResult
      ] = await Promise.all([
        getBaseModules({ includeArchived: true, includeDeleted: true }),
        getBaseModuleStats(),
        getModuleImplementations({
          includeArchivedModules: true,
          includeDeletedModules: true
        }),
        getModuleImplementations({
          includeArchivedModules: true,
          includeDeletedModules: true,
          limit: loadMoreLimit
        }),
        getTenantAssignments({}),
        getAllModulesWithOrganizationAssignments()
      ]);

      // Processar resultados
      const newData: ModulesData = {
        baseModules: modulesResult.success ? (modulesResult.data?.modules || []) : [],
        implementations: implementationsResult.success ? (implementationsResult.data?.implementations || []) : [],
        assignments: assignmentsResult.success ? (assignmentsResult.data?.assignments || []) : [],
        organizations: organizationsResult.success ? (organizationsResult.data || []) : [],
        stats: statsResult.success ? statsResult.data : null
      };

      // Atualizar paginação das implementações
      if (implementationsResult.success) {
        const total = implementationsResult.data?.total || 0;
        const pages = implementationsResult.data?.pages || 0;
        setImplementationsPagination({
          currentPage: 1,
          totalItems: total,
          totalPages: pages,
          hasMore: pages > 1
        });
      }

      setData(newData);
      setIsInitialLoad(false);
      
      return { success: true, data: newData };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`❌ CLIENT: Error in loadData ${callId}:`, error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [loadMoreLimit]);

  /**
   * Função para carregar mais implementações com paginação
   */
  const loadMoreImplementations = useCallback(async () => {
    if (loadingMore || !implementationsPagination.hasMore) {
      return { success: false, error: 'Não há mais dados para carregar' };
    }

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
        
        // Atualizar dados existentes
        setData(prevData => ({
          ...prevData,
          implementations: [...prevData.implementations, ...newImplementations]
        }));

        // Atualizar paginação
        const total = result.data?.total || 0;
        const pages = result.data?.pages || 0;
        setImplementationsPagination({
          currentPage: nextPage,
          totalItems: total,
          totalPages: pages,
          hasMore: nextPage < pages
        });

        return { success: true, data: newImplementations };
      } else {
        throw new Error(result.error || 'Erro ao carregar mais implementações');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao carregar mais implementações:', error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, implementationsPagination]);

  /**
   * Função para recarregar dados com debounce
   */
  const reload = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      loadData();
    }, debounceDelay);
  }, [loadData, debounceDelay]);

  /**
   * Função para limpeza de recursos
   */
  const cleanup = useCallback(() => {
    mountedRef.current = false;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  // Interface pública do hook
  return {
    // Dados
    data,
    loading,
    error,
    isInitialLoad,
    
    // Paginação
    implementationsPagination,
    loadingMore,
    
    // Ações
    loadData,
    loadMoreImplementations,
    reload,
    cleanup,
    
    // Helpers para componentes que esperam dados específicos
    baseModules: data.baseModules,
    implementations: data.implementations,
    assignments: data.assignments,
    organizations: data.organizations,
    stats: data.stats,
  };
}