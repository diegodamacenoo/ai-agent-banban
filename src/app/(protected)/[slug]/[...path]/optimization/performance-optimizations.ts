/**
 * Performance Optimizations - Fase 4: Route Simplification
 * 
 * Otimizações específicas para a rota universal e sistema de módulos dinâmicos
 */

import { unstable_cache } from 'next/cache';
import { dynamicModuleRegistry } from '@/core/modules/registry/DynamicModuleRegistry';
import { ClientType } from '@/core/modules/types';

// =====================================
// 1. CACHE DE ORGANIZAÇÕES
// =====================================

interface CachedOrganization {
  id: string;
  slug: string;
  name: string;
  client_type: ClientType;
}

/**
 * Cache de organização com revalidação automática
 */
export const getCachedOrganization = unstable_cache(
  async (slug: string): Promise<CachedOrganization | null> => {
    const { createSupabaseServerClient } = await import('@/core/supabase/server');
    
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('organizations')
      .select('id, slug, company_trading_name, company_legal_name, client_type')
      .eq('slug', slug)
      .eq('status', 'active')
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      slug: data.slug,
      name: data.company_trading_name || data.company_legal_name || slug,
      client_type: data.client_type as ClientType
    };
  },
  ['organization'],
  {
    revalidate: 300, // 5 minutos
    tags: ['organizations']
  }
);

// =====================================
// 2. CACHE DE MÓDULOS POR ORGANIZAÇÃO
// =====================================

/**
 * Cache de configuração de módulos com invalidação inteligente
 */
export const getCachedModuleConfiguration = unstable_cache(
  async (organizationId: string) => {
    return await dynamicModuleRegistry.loadModuleConfiguration(
      organizationId
    );
  },
  ['module-config'],
  {
    revalidate: 300, // 5 minutos
    tags: ['modules', 'tenant-modules']
  }
);

// =====================================
// 3. PRELOADING DE COMPONENTES CRÍTICOS
// =====================================

const criticalModules = ['alerts', 'performance', 'reports', 'settings'];

/**
 * Preload de módulos críticos para reduzir lazy loading
 */
export async function preloadCriticalModules(clientType: ClientType) {
  const preloadPromises = criticalModules.map(async (moduleSlug) => {
    try {
      const componentPath = `@/clients/${clientType}/modules/${moduleSlug}`;
      await dynamicModuleRegistry.loadComponent(componentPath);
      console.debug(`✅ Preloaded: ${componentPath}`);
    } catch (error) {
      console.debug(`⚠️ Failed to preload: ${moduleSlug}`, error);
    }
  });

  await Promise.allSettled(preloadPromises);
}

// =====================================
// 4. OTIMIZAÇÃO DE QUERIES
// =====================================

/**
 * Batch loading de verificações de acesso
 */
export async function batchVerifyModuleAccess(
  organizationId: string,
  clientType: ClientType,
  moduleSlugs: string[]
): Promise<Record<string, boolean>> {
  try {
    const modules = await getCachedModuleConfiguration(organizationId);
    
    const accessMap: Record<string, boolean> = {};
    
    for (const moduleSlug of moduleSlugs) {
      const moduleData = modules.find(m => m.slug === moduleSlug);
      accessMap[moduleSlug] = moduleData ? 
        moduleData.tenant.is_visible && moduleData.tenant.operational_status === 'ENABLED' :
        false;
    }

    return accessMap;
  } catch (error) {
    console.error('Erro no batch verify:', error);
    return moduleSlugs.reduce((acc, slug) => ({ ...acc, [slug]: false }), {});
  }
}

// =====================================
// 5. CACHE DE NAVEGAÇÃO
// =====================================

/**
 * Cache da estrutura de navegação gerada
 */
export const getCachedNavigation = unstable_cache(
  async (organizationId: string, clientType: ClientType) => {
    const modules = await getCachedModuleConfiguration(organizationId);
    return dynamicModuleRegistry.generateNavigation(modules);
  },
  ['navigation'],
  {
    revalidate: 300, // 5 minutos
    tags: ['navigation', 'modules']
  }
);

// =====================================
// 6. STREAMING E SUSPENSE
// =====================================

interface StreamingDataProps {
  organizationId: string;
  clientType: ClientType;
  moduleSlug?: string;
}

/**
 * Dados para streaming em chunks
 */
export async function getStreamingData({ 
  organizationId, 
  clientType, 
  moduleSlug 
}: StreamingDataProps) {
  // Chunk 1: Dados básicos (rápido)  
  // Nota: getCachedOrganization espera slug, não id
  // Para usar com id, seria necessário criar uma função separada
  const basicData = {
    organization: null, // Temporariamente null até refatorar
    timestamp: Date.now()
  };

  // Chunk 2: Navegação (médio)
  const navigationPromise = getCachedNavigation(organizationId, clientType);

  // Chunk 3: Módulo específico (se necessário)
  const modulePromise = moduleSlug ? 
    getCachedModuleConfiguration(organizationId).then(modules =>
      modules.find(m => m.slug === moduleSlug)
    ) : 
    Promise.resolve(null);

  return {
    basic: basicData,
    navigation: await navigationPromise,
    module: await modulePromise
  };
}

// =====================================
// 7. INVALIDAÇÃO INTELIGENTE
// =====================================

/**
 * Invalidar cache quando módulos são alterados
 */
export async function invalidateModuleCache(organizationId: string) {
  const { revalidateTag } = await import('next/cache');
  
  // Invalidar tags específicas
  revalidateTag('modules');
  revalidateTag('navigation');
  revalidateTag('tenant-modules');
  
  // Limpar cache do registry também
  dynamicModuleRegistry.clearCache();
  
  console.debug(`🔄 Cache invalidado para organização: ${organizationId}`);
}

/**
 * Invalidar cache de organização
 */
export async function invalidateOrganizationCache(slug: string) {
  const { revalidateTag } = await import('next/cache');
  
  revalidateTag('organizations');
  
  console.debug(`🔄 Cache de organização invalidado: ${slug}`);
}

// =====================================
// 8. MONITORING E MÉTRICAS
// =====================================

interface PerformanceMetrics {
  routeLoadTime: number;
  moduleLoadTime: number;
  cacheHitRate: number;
  errorRate: number;
}

const metrics: PerformanceMetrics = {
  routeLoadTime: 0,
  moduleLoadTime: 0,
  cacheHitRate: 0,
  errorRate: 0
};

/**
 * Tracking de performance da rota universal
 */
export function trackRoutePerformance<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Log performance em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.debug(`⚡ ${operation}: ${duration.toFixed(2)}ms`);
      }
      
      // Atualizar métricas
      if (operation.includes('route')) {
        metrics.routeLoadTime = duration;
      } else if (operation.includes('module')) {
        metrics.moduleLoadTime = duration;
      }
      
      resolve(result);
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.error(`❌ ${operation} failed after ${duration.toFixed(2)}ms:`, error);
      metrics.errorRate += 1;
      
      reject(error);
    }
  });
}

/**
 * Obter métricas de performance
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return { ...metrics };
}

// =====================================
// 9. PRELOAD DE RECURSOS ESTÁTICOS
// =====================================

/**
 * Preload de recursos críticos para o módulo
 */
export function preloadModuleResources(moduleSlug: string) {
  if (typeof window === 'undefined') return;

  // Preload de CSS específico do módulo (se existir)
  const cssLink = document.createElement('link');
  cssLink.rel = 'preload';
  cssLink.as = 'style';
  cssLink.href = `/modules/${moduleSlug}/styles.css`;
  cssLink.onload = () => console.debug(`🎨 CSS preloaded: ${moduleSlug}`);
  cssLink.onerror = () => {}; // Ignorar se não existir
  document.head.appendChild(cssLink);

  // Preload de dados do módulo
  const dataLink = document.createElement('link');
  dataLink.rel = 'prefetch';
  dataLink.href = `/api/modules/${moduleSlug}/data`;
  dataLink.onload = () => console.debug(`📊 Data prefetched: ${moduleSlug}`);
  dataLink.onerror = () => {}; // Ignorar se não existir
  document.head.appendChild(dataLink);
}

// =====================================
// 10. COMPRESSÃO E BUNDLE OPTIMIZATION
// =====================================

/**
 * Configuração para otimização de bundle por módulo
 */
export const moduleChunkConfig = {
  // Módulos que devem ser agrupados
  shared: ['alerts', 'reports', 'settings'],
  
  // Módulos que devem ser lazy-loaded
  lazy: ['performance', 'insights', 'inventory'],
  
  // Módulos críticos (incluir no bundle principal)
  critical: ['home', 'navigation']
};

/**
 * Determinar estratégia de loading baseada no módulo
 */
export function getLoadingStrategy(moduleSlug: string): 'eager' | 'lazy' | 'prefetch' {
  if (moduleChunkConfig.critical.includes(moduleSlug)) {
    return 'eager';
  }
  
  if (moduleChunkConfig.shared.includes(moduleSlug)) {
    return 'prefetch';
  }
  
  return 'lazy';
}

// =====================================
// 11. ERROR BOUNDARY COM RETRY
// =====================================

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000
};

/**
 * Wrapper com retry automático para operações que podem falhar
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay } = { ...defaultRetryConfig, ...config };
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff com jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      );
      
      console.warn(`⚠️ Retry ${attempt + 1}/${maxRetries} após ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

export default {
  getCachedOrganization,
  getCachedModuleConfiguration,
  getCachedNavigation,
  preloadCriticalModules,
  batchVerifyModuleAccess,
  trackRoutePerformance,
  getPerformanceMetrics,
  invalidateModuleCache,
  invalidateOrganizationCache,
  withRetry
};