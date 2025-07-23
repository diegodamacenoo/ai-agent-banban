'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { verifyAdminAccess } from './modules/utils';
import { ActionResult } from './modules/schemas';

/**
 * Invalida cache de módulos para uma organização específica
 */
export async function invalidateModuleCacheForOrg(organizationId: string): Promise<ActionResult> {
  try {
    const { isAuthenticated, isAdmin } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem invalidar cache' };
    }

    // Invalidar cache específico da API de configuração
    revalidateTag(`module-config-${organizationId}`);
    
    // Invalidar rotas relacionadas
    revalidatePath(`/api/modules/configuration`);
    revalidatePath('/admin');
    revalidatePath('/[slug]', 'layout'); // Layout que carrega os módulos
    
    console.debug(`[CacheInvalidation] Cache invalidado para organização: ${organizationId}`);
    
    return { 
      success: true, 
      message: `Cache de módulos invalidado para organização ${organizationId}` 
    };
    
  } catch (error) {
    console.error('[CacheInvalidation] Erro ao invalidar cache:', error);
    return { 
      success: false, 
      error: 'Erro interno ao invalidar cache' 
    };
  }
}

/**
 * Invalida cache global de módulos (para mudanças que afetam múltiplas organizações)
 */
export async function invalidateGlobalModuleCache(): Promise<ActionResult> {
  try {
    const { isAuthenticated, isAdmin } = await verifyAdminAccess();
    
    if (!isAuthenticated) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem invalidar cache' };
    }

    // Invalidar todas as tags relacionadas a módulos
    revalidateTag('modules');
    revalidateTag('base-modules');
    revalidateTag('module-implementations');
    revalidateTag('tenant-assignments');
    
    // Invalidar rotas críticas
    revalidatePath('/api/modules/configuration');
    revalidatePath('/admin');
    revalidatePath('/admin/modules');
    revalidatePath('/[slug]', 'layout');
    
    console.debug('[CacheInvalidation] Cache global de módulos invalidado');
    
    return { 
      success: true, 
      message: 'Cache global de módulos invalidado com sucesso' 
    };
    
  } catch (error) {
    console.error('[CacheInvalidation] Erro ao invalidar cache global:', error);
    return { 
      success: false, 
      error: 'Erro interno ao invalidar cache global' 
    };
  }
}

/**
 * Invalida cache para mudanças em módulos base
 */
export async function invalidateBaseModuleCache(moduleId: string): Promise<ActionResult> {
  try {
    const { isAuthenticated, isAdmin } = await verifyAdminAccess();
    
    if (!isAuthenticated || !isAdmin) {
      return { success: false, error: 'Acesso negado' };
    }

    // Invalidar cache específico do módulo base
    revalidateTag(`base-module-${moduleId}`);
    revalidateTag('base-modules');
    
    // Como mudanças no módulo base afetam todas as organizações que o usam,
    // invalidamos o cache global
    await invalidateGlobalModuleCache();
    
    return { 
      success: true, 
      message: `Cache do módulo base ${moduleId} invalidado` 
    };
    
  } catch (error) {
    console.error('[CacheInvalidation] Erro ao invalidar cache do módulo base:', error);
    return { 
      success: false, 
      error: 'Erro interno ao invalidar cache do módulo base' 
    };
  }
}

/**
 * Invalida cache para mudanças em implementações
 */
export async function invalidateImplementationCache(implementationId: string): Promise<ActionResult> {
  try {
    const { isAuthenticated, isAdmin } = await verifyAdminAccess();
    
    if (!isAuthenticated || !isAdmin) {
      return { success: false, error: 'Acesso negado' };
    }

    // Invalidar cache específico da implementação
    revalidateTag(`implementation-${implementationId}`);
    revalidateTag('module-implementations');
    
    // Implementações podem afetar múltiplas organizações
    await invalidateGlobalModuleCache();
    
    return { 
      success: true, 
      message: `Cache da implementação ${implementationId} invalidado` 
    };
    
  } catch (error) {
    console.error('[CacheInvalidation] Erro ao invalidar cache da implementação:', error);
    return { 
      success: false, 
      error: 'Erro interno ao invalidar cache da implementação' 
    };
  }
}