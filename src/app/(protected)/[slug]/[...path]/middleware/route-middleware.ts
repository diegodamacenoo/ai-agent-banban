/**
 * Route Middleware - Verificação automática de acesso para rota universal
 * Fase 4 - Route Simplification
 * 
 * Middleware que centraliza todas as verificações de acesso e redirecionamentos
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { dynamicModuleRegistry } from '@/core/modules/registry/DynamicModuleRegistry';
import { ClientType } from '@/core/modules/types';

export interface RouteContext {
  organization: {
    id: string;
    slug: string;
    name: string;
    client_type: ClientType;
    company_trading_name: string;
    company_legal_name?: string;
    is_implementation_complete?: boolean;
  };
  path: string[];
  routeType: 'home' | 'module' | 'unknown';
  moduleSlug?: string;
  hasAccess: boolean;
  redirectTo?: string;
}

/**
 * Middleware principal para verificação de rotas universais
 */
export async function universalRouteMiddleware(
  request: NextRequest,
  slug: string,
  path: string[] = []
): Promise<RouteContext> {
  console.debug(`🛡️ Route Middleware: /${slug}/${path.join('/')}`);

  // AIDEV-NOTE: Ignorar rotas internas do Next.js e rotas especiais para evitar erros de "Organização não encontrada".
  const specialRoutes = [
    '_next',
    '_vercel',
    'favicon.ico',
    'robots.txt',
    'sitemap.xml',
    'api',
    '.well-known',
    'public',
    'static'
  ];
  
  if (slug.startsWith('_') || specialRoutes.includes(slug) || slug.includes('.')) {
    console.debug(`🔄 Skipping middleware for special route: /${slug}`);
    // Retornar um contexto que permita o prosseguimento da rota sem validação.
    // O ideal é não executar o middleware para essas rotas, mas se executado,
    // precisamos de um bypass seguro.
    return {
      organization: { id: '', slug, name: '', client_type: 'default', company_trading_name: '' },
      path,
      routeType: 'unknown',
      hasAccess: true, // Permitir acesso para que o Next.js possa servir seus próprios arquivos
    };
  }

  // 1. Verificar e carregar organização
  const organization = await verifyOrganization(slug);
  if (!organization) {
    throw new Error(`Organização não encontrada: ${slug}`);
  }

  // 2. Determinar tipo de rota
  const routeType = determineRouteType(path);
  
  // 3. Para rotas home, sempre permitir acesso
  if (routeType === 'home') {
    return {
      organization,
      path,
      routeType: 'home',
      hasAccess: true
    };
  }

  // 4. Para rotas de módulo, verificar acesso
  if (routeType === 'module' && path.length > 0) {
    const moduleSlug = path[0];
    
    // Verificar redirecionamentos legacy primeiro
    const redirectTo = checkLegacyRedirects(moduleSlug);
    if (redirectTo) {
      return {
        organization,
        path,
        routeType: 'module',
        moduleSlug,
        hasAccess: false,
        redirectTo: `/${slug}${redirectTo}`
      };
    }

    // Verificar acesso ao módulo
    const hasAccess = await verifyModuleAccess(
      organization.id,
      organization.client_type,
      moduleSlug
    );

    return {
      organization,
      path,
      routeType: 'module',
      moduleSlug,
      hasAccess
    };
  }

  // 5. Rota não reconhecida
  return {
    organization,
    path,
    routeType: 'unknown',
    hasAccess: false
  };
}

/**
 * Verificar se organização existe e está ativa
 */
async function verifyOrganization(slug: string) {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        id,
        slug,
        company_trading_name,
        company_legal_name,
        client_type,
        status,
        is_implementation_complete
      `)
      .eq('slug', slug)
      .eq('status', 'active') // Apenas organizações ativas
      .single();

    if (error || !data) {
      console.error(`❌ Organização não encontrada ou inativa: ${slug}`, error);
      return null;
    }

    return {
      id: data.id,
      slug: data.slug,
      name: data.company_trading_name || data.company_legal_name || slug,
      client_type: data.client_type as ClientType,
      company_trading_name: data.company_trading_name,
      company_legal_name: data.company_legal_name,
      is_implementation_complete: data.is_implementation_complete
    };
  } catch (error) {
    console.error('Erro na verificação de organização:', error);
    return null;
  }
}

/**
 * Verificar acesso a módulo específico
 */
async function verifyModuleAccess(
  organizationId: string,
  clientType: ClientType,
  moduleSlug: string
): Promise<boolean> {
  try {
    console.debug(`🔐 Middleware: Verificando acesso a ${moduleSlug}`);

    // Usar DynamicModuleRegistry para verificação unificada
    const modules = await dynamicModuleRegistry.loadModuleConfiguration(
      organizationId
    );

    const foundModule = modules.find(m => m.slug === moduleSlug);
    
    if (!foundModule) {
      console.debug(`❌ Módulo ${moduleSlug} não encontrado`);
      return false;
    }

    const hasAccess = foundModule.tenant.is_visible && 
                     foundModule.tenant.operational_status === 'ENABLED';
    
    console.debug(`${hasAccess ? '✅' : '❌'} Acesso a ${moduleSlug}: ${hasAccess}`);
    return hasAccess;

  } catch (error) {
    console.error('Erro na verificação de acesso:', error);
    return false;
  }
}

/**
 * Determinar tipo de rota baseado no path
 */
function determineRouteType(path: string[]): 'home' | 'module' | 'unknown' {
  if (path.length === 0) {
    return 'home';
  }
  
  if (path.length >= 1) {
    return 'module';
  }
  
  return 'unknown';
}

/**
 * Verificar se é uma rota legacy que precisa de redirecionamento
 */
function checkLegacyRedirects(moduleSlug: string): string | null {
  const legacyRedirects: Record<string, string> = {
    // Redirecionamentos de dashboard para home
    'dashboard': '',
    'home': '',
    
    // Redirecionamentos de nomenclatura antiga
    'banban-performance': '/performance',
    'banban-insights': '/insights', 
    'banban-alerts': '/alerts',
    'banban-inventory': '/inventory',
    
    // Redirecionamentos de rotas em português
    'alertas': '/alerts',
    'relatórios': '/reports',
    'relatorios': '/reports',
    'configurações': '/settings',
    'configuracoes': '/settings',
    'inventário': '/inventory',
    'inventario': '/inventory',
    'desempenho': '/performance',
    'análises': '/insights',
    'analises': '/insights'
  };

  return legacyRedirects[moduleSlug] || null;
}

/**
 * Rate limiting simples para requests de módulos
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(organizationId: string, limit: number = 100): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minuto
  
  const key = `${organizationId}`;
  const current = requestCounts.get(key);
  
  if (!current || now > current.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= limit) {
    return false;
  }
  
  current.count++;
  return true;
}

/**
 * Cache de verificações para melhorar performance
 */
const verificationCache = new Map<string, { result: boolean; expiry: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos

export function getCachedVerification(
  organizationId: string,
  moduleSlug: string
): boolean | null {
  const key = `${organizationId}:${moduleSlug}`;
  const cached = verificationCache.get(key);
  
  if (cached && Date.now() < cached.expiry) {
    return cached.result;
  }
  
  return null;
}

export function setCachedVerification(
  organizationId: string,
  moduleSlug: string,
  result: boolean
): void {
  const key = `${organizationId}:${moduleSlug}`;
  verificationCache.set(key, {
    result,
    expiry: Date.now() + CACHE_TTL
  });
}

/**
 * Limpar cache expirado periodicamente
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of verificationCache.entries()) {
    if (now >= value.expiry) {
      verificationCache.delete(key);
    }
  }
}, 5 * 60 * 1000); // A cada 5 minutos

/**
 * Verificação de segurança adicional para paths maliciosos
 */
export function validatePath(path: string[]): boolean {
  const maliciousPatterns = [
    '../',
    '..\\',
    '/etc/',
    '/proc/',
    'eval(',
    '<script',
    'javascript:',
    'data:',
    'vbscript:'
  ];
  
  const fullPath = path.join('/').toLowerCase();
  
  return !maliciousPatterns.some(pattern => 
    fullPath.includes(pattern.toLowerCase())
  );
}

/**
 * Log de auditoria para acessos negados
 */
export async function logAccessDenied(
  organizationId: string,
  moduleSlug: string,
  reason: string,
  userAgent?: string
) {
  try {
    console.warn(`🚫 Acesso negado:`, {
      organizationId,
      moduleSlug,
      reason,
      timestamp: new Date().toISOString(),
      userAgent
    });
    
    // TODO: Integrar com sistema de auditoria se necessário
    // await auditLogger.log('ACCESS_DENIED', { ... });
    
  } catch (error) {
    console.error('Erro ao registrar acesso negado:', error);
  }
}