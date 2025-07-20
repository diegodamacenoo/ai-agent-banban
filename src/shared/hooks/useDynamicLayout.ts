/**
 * Hook para gerenciar layout dinâmico com sidebar
 * Fase 3 - Dynamic Navigation Implementation
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClientType } from '@/core/modules/types';
import { dynamicModuleRegistry } from '@/core/modules/registry/DynamicModuleRegistry';

interface Organization {
  id: string;
  slug: string;
  name: string;
  client_type: ClientType;
}

interface LayoutState {
  sidebarCollapsed: boolean;
  moduleAccess: Record<string, boolean>;
  navigationLoaded: boolean;
  lastModuleCheck: number;
}

interface UseDynamicLayoutProps {
  organization: Organization;
  enableModuleAccess?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useDynamicLayout({
  organization,
  enableModuleAccess = true,
  autoRefresh = true,
  refreshInterval = 5 * 60 * 1000 // 5 minutos
}: UseDynamicLayoutProps) {
  const [state, setState] = useState<LayoutState>({
    sidebarCollapsed: false,
    moduleAccess: {},
    navigationLoaded: false,
    lastModuleCheck: 0
  });

  // Controle do estado da sidebar
  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setState(prev => ({ ...prev, sidebarCollapsed: collapsed }));
    
    // Salvar preferência no localStorage
    try {
      localStorage.setItem(`sidebar-collapsed-${organization.slug}`, String(collapsed));
    } catch (error) {
      // Ignorar erros de localStorage (SSR, private mode, etc.)
    }
  }, [organization.slug]);

  // Carregar preferência salva da sidebar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`sidebar-collapsed-${organization.slug}`);
      if (saved !== null) {
        setState(prev => ({ ...prev, sidebarCollapsed: saved === 'true' }));
      }
    } catch (error) {
      // Ignorar erros de localStorage
    }
  }, [organization.slug]);

  // Verificar acesso a módulos específicos
  const checkModuleAccess = useCallback(async (moduleSlug: string): Promise<boolean> => {
    if (!enableModuleAccess) return true;

    // Verificar cache primeiro
    const now = Date.now();
    if (state.moduleAccess[moduleSlug] !== undefined && 
        now - state.lastModuleCheck < 60 * 1000) { // Cache de 1 minuto
      return state.moduleAccess[moduleSlug];
    }

    try {
      // Carregar módulos para verificar acesso
      const modules = await dynamicModuleRegistry.loadModuleConfiguration(
        organization.id,
        organization.client_type
      );

      const hasAccess = modules.some(module => 
        module.slug === moduleSlug && 
        module.tenant.is_visible && 
        module.tenant.operational_status === 'ENABLED'
      );

      setState(prev => ({
        ...prev,
        moduleAccess: {
          ...prev.moduleAccess,
          [moduleSlug]: hasAccess
        },
        lastModuleCheck: now
      }));

      return hasAccess;

    } catch (error) {
      console.error(`Erro ao verificar acesso ao módulo ${moduleSlug}:`, error);
      return false;
    }
  }, [organization.id, organization.client_type, enableModuleAccess, state.moduleAccess, state.lastModuleCheck]);

  // Pré-carregar módulos críticos
  const preloadCriticalModules = useCallback(async () => {
    try {
      const modules = await dynamicModuleRegistry.loadModuleConfiguration(
        organization.id,
        organization.client_type
      );

      // Identificar módulos críticos (normalmente home, performance, alerts)
      const criticalModuleSlugs = modules
        .filter(module => 
          ['performance', 'alerts', 'insights'].includes(module.slug) &&
          module.tenant.is_visible &&
          module.tenant.operational_status === 'ENABLED'
        )
        .map(module => module.slug);

      if (criticalModuleSlugs.length > 0) {
        await dynamicModuleRegistry.preloadModules(criticalModuleSlugs);
        console.debug(`✅ Módulos críticos pré-carregados: ${criticalModuleSlugs.join(', ')}`);
      }

      setState(prev => ({ ...prev, navigationLoaded: true }));

    } catch (error) {
      console.error('Erro ao pré-carregar módulos críticos:', error);
    }
  }, [organization.id, organization.client_type]);

  // Carregar navegação inicial e pré-carregar módulos
  useEffect(() => {
    preloadCriticalModules();
  }, [preloadCriticalModules]);

  // Auto-refresh da navegação
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - state.lastModuleCheck > refreshInterval) {
        preloadCriticalModules();
      }
    }, Math.min(refreshInterval / 10, 60 * 1000)); // Verificar a cada minuto ou 1/10 do intervalo

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, state.lastModuleCheck, preloadCriticalModules]);

  // Invalidar cache quando organização mudar
  useEffect(() => {
    dynamicModuleRegistry.invalidateOrganizationCache(organization.id);
    setState(prev => ({
      ...prev,
      moduleAccess: {},
      navigationLoaded: false,
      lastModuleCheck: 0
    }));
  }, [organization.id]);

  // Função para forçar refresh
  const refreshNavigation = useCallback(async () => {
    dynamicModuleRegistry.clearCache();
    setState(prev => ({
      ...prev,
      moduleAccess: {},
      navigationLoaded: false,
      lastModuleCheck: 0
    }));
    await preloadCriticalModules();
  }, [preloadCriticalModules]);

  // Função para verificar se uma rota está acessível
  const isRouteAccessible = useCallback(async (route: string): Promise<boolean> => {
    // Extrair slug do módulo da rota
    const parts = route.split('/').filter(Boolean);
    if (parts.length < 2) return true; // Rotas básicas sempre acessíveis

    // Skip do slug da organização
    const moduleSlug = parts[1];
    return await checkModuleAccess(moduleSlug);
  }, [checkModuleAccess]);

  // Função para obter estatísticas do registry
  const getRegistryStats = useCallback(() => {
    return dynamicModuleRegistry.getStats();
  }, []);

  return {
    // Estado da sidebar
    sidebarCollapsed: state.sidebarCollapsed,
    setSidebarCollapsed,

    // Estado da navegação
    navigationLoaded: state.navigationLoaded,
    moduleAccess: state.moduleAccess,

    // Funções utilitárias
    checkModuleAccess,
    isRouteAccessible,
    refreshNavigation,
    preloadCriticalModules,
    getRegistryStats,

    // Organização
    organization
  };
}

/**
 * Hook simplificado para casos básicos
 */
export function useBasicDynamicLayout(organization: Organization) {
  return useDynamicLayout({
    organization,
    enableModuleAccess: false,
    autoRefresh: false
  });
}

/**
 * Hook com configuração completa para admin
 */
export function useAdminDynamicLayout(organization: Organization) {
  return useDynamicLayout({
    organization,
    enableModuleAccess: true,
    autoRefresh: true,
    refreshInterval: 2 * 60 * 1000 // 2 minutos para admin
  });
}