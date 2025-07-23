'use client';

import React, { createContext, useContext, useCallback, useRef } from 'react';
import { getSystemSettings, type SystemSettings } from '@/app/actions/admin/modules/module-settings';

interface SystemConfigState {
  cache: SystemSettings | null;
  cacheTimestamp: number;
  loading: boolean;
  loadingPromise: Promise<SystemSettings | null> | null;
}

interface SystemConfigContextValue {
  getConfig: () => Promise<SystemSettings | null>;
  invalidateCache: () => void;
  isLoading: () => boolean;
}

const SystemConfigContext = createContext<SystemConfigContextValue | null>(null);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Deep comparison otimizada para verificar se objetos são realmente diferentes
 */
function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
}

/**
 * Provider otimizado para configurações do sistema
 * - Cache global inteligente 
 * - Deduplicação de requisições
 * - Invalidação automática
 * - Performance otimizada sem re-renders desnecessários
 */
export function SystemConfigProvider({ children }: { children: React.ReactNode }) {
  const stateRef = useRef<SystemConfigState>({
    cache: null,
    cacheTimestamp: 0,
    loading: false,
    loadingPromise: null
  });

  const getConfig = useCallback(async (): Promise<SystemSettings | null> => {
    const now = Date.now();
    const state = stateRef.current;
    const cacheAge = now - state.cacheTimestamp;

    // 1. Verificar cache válido
    if (state.cache && cacheAge < CACHE_DURATION) {
      return state.cache;
    }

    // 2. Se já existe requisição em andamento, aguardar
    if (state.loadingPromise) {
      return state.loadingPromise;
    }

    // 3. Nova requisição
    state.loading = true;
    
    const loadingPromise = (async () => {
      try {
        const result = await getSystemSettings();
        
        if (result.success && result.data) {
          state.cache = result.data;
          state.cacheTimestamp = now;
          return result.data;
        } else {
          // Retornar defaults em caso de erro
          const defaults: SystemSettings = {
            autoArchiveAfterDays: 90,
            maxImplementationsPerModule: 10,
            requireApprovalForNewModules: true,
            enableModuleVersioning: true,
            defaultModuleLifecycle: 'active',
            enableAutoBackup: true,
            backupFrequency: 'daily',
            retentionPeriodDays: 30,
            enableAuditLog: true,
            notifyOnCriticalChanges: true,
            maintenanceMode: false,
            debugMode: false
          };
          state.cache = defaults;
          state.cacheTimestamp = now;
          return defaults;
        }
      } catch (error) {
        console.error('SystemConfigContext: Erro na requisição:', error);
        return null;
      } finally {
        state.loading = false;
        state.loadingPromise = null;
      }
    })();

    state.loadingPromise = loadingPromise;
    return loadingPromise;
  }, []);

  const invalidateCache = useCallback(() => {
    const state = stateRef.current;
    state.cache = null;
    state.cacheTimestamp = 0;
    state.loadingPromise = null;
  }, []);

  const isLoading = useCallback(() => {
    return stateRef.current.loading;
  }, []);

  const contextValue: SystemConfigContextValue = {
    getConfig,
    invalidateCache,
    isLoading
  };

  return (
    <SystemConfigContext.Provider value={contextValue}>
      {children}
    </SystemConfigContext.Provider>
  );
}

/**
 * Hook otimizado para acessar configurações do sistema
 * - Uma única chamada de estado
 * - Sincronização estável
 * - Sem re-renders desnecessários
 */
export function useSystemConfig() {
  const context = useContext(SystemConfigContext);
  
  if (!context) {
    throw new Error('useSystemConfig deve ser usado dentro de SystemConfigProvider');
  }

  const [state, setState] = React.useState<{
    config: SystemSettings | null;
    loading: boolean;
    error: string | null;
  }>({
    config: null,
    loading: true,
    error: null
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  React.useEffect(() => {
    let mounted = true;
    
    const loadConfig = async () => {
      try {
        const result = await context.getConfig();
        
        if (mounted) {
          setState(prevState => {
            // Só atualizar se realmente mudou
            const hasChanged = !prevState.config || !deepEqual(prevState.config, result);
            
            if (!hasChanged && !prevState.loading) {
              // Nenhuma mudança e não está mais carregando - manter estado atual
              return prevState;
            }
            
            return {
              config: result,
              loading: false,
              error: result ? null : 'Erro ao carregar configurações'
            };
          });
        }
      } catch (err) {
        console.error('useSystemConfig: Erro:', err);
        if (mounted) {
          setState(prevState => ({
            ...prevState,
            loading: false,
            error: 'Erro inesperado'
          }));
        }
      }
    };

    loadConfig();

    return () => {
      mounted = false;
    };
  }, [context]); // Dependência estável

  return {
    config: state.config,
    loading: state.loading,
    error: state.error,
    isVersioningEnabled: state.config?.enableModuleVersioning || false,
    defaultLifecycle: state.config?.defaultModuleLifecycle || 'active',
    isMaintenanceMode: state.config?.maintenanceMode || false,
    isDebugMode: state.config?.debugMode || false,
    invalidateCache: context.invalidateCache
  };
}