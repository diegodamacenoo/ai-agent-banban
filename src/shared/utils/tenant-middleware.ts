import { NextRequest, NextResponse } from 'next/server';

// Import para debug condicional síncrono (para middleware)
import { conditionalDebugLogSync } from './conditional-debug-sync';

// Configurações padrão por tipo de industria
export const INDUSTRY_DEFAULTS = {
  fashion: {
    theme: {
      primary: '#8B5CF6', // purple
      secondary: '#EC4899', // pink
      accent: '#06B6D4' // cyan
    },
    features: ['fashion-metrics', 'seasonal-analysis', 'brand-performance'],
    defaultBackendUrl: 'http://localhost:4000'
  },
  grocery: {
    theme: {
      primary: '#10B981', // emerald
      secondary: '#F59E0B', // amber
      accent: '#3B82F6' // blue
    },
    features: ['inventory-tracking', 'demand-forecasting', 'supply-chain'],
    defaultBackendUrl: 'http://localhost:4000'
  },
  healthcare: {
    theme: {
      primary: '#06B6D4', // cyan
      secondary: '#8B5CF6', // purple
      accent: '#10B981' // emerald
    },
    features: ['patient-tracking', 'compliance-monitoring', 'resource-management'],
    defaultBackendUrl: 'http://localhost:4000'
  },
  generic: {
    theme: {
      primary: '#3B82F6', // blue
      secondary: '#6B7280', // gray
      accent: '#10B981' // emerald
    },
    features: ['basic-analytics', 'reporting', 'user-management'],
    defaultBackendUrl: 'http://localhost:4000'
  }
} as const;

// DEPRECATED: Esta configuração hardcoded será removida em favor de dados do banco
// Mantida temporariamente para compatibilidade
export const LEGACY_TENANT_CONFIG = {
  'banban': {
    clientType: 'custom' as const,
    organizationName: 'BanBan Fashion',
    customBackendUrl: 'http://localhost:4000',
    isImplementationComplete: true,
    sector: 'fashion'
  }
} as const;

export type TenantConfig = typeof LEGACY_TENANT_CONFIG[keyof typeof LEGACY_TENANT_CONFIG];
export type IndustryType = keyof typeof INDUSTRY_DEFAULTS;

/**
 * Extrai o slug do tenant do pathname
 */
export function extractTenantSlug(pathname: string): string | null {
  // Remove leading slash e pega o primeiro segmento
  const segments = pathname.replace(/^\/+/, '').split('/');
  const firstSegment = segments[0];
  
  // Verifica se é um slug válido (letras, números e hífens)
  if (firstSegment && /^[a-z0-9-]+$/.test(firstSegment)) {
    return firstSegment;
  }
  
  return null;
}

/**
 * Obtém a configuração do tenant baseada no slug (DEPRECATED)
 * @deprecated Use getOrganizationFromDatabase() instead
 */
export function getTenantConfig(slug: string | null): TenantConfig | null {
  if (!slug || !(slug in LEGACY_TENANT_CONFIG)) {
    return null;
  }
  
  return LEGACY_TENANT_CONFIG[slug as keyof typeof LEGACY_TENANT_CONFIG];
}

/**
 * Obtém configurações padrão baseadas no tipo de industria
 */
export function getIndustryDefaults(industryType: IndustryType) {
  return INDUSTRY_DEFAULTS[industryType] || INDUSTRY_DEFAULTS.generic;
}

/**
 * Verifica se um usuário deveria ser redirecionado para seu tenant correto
 */
export function shouldRedirectToTenant(
  request: NextRequest, 
  organizationSlug: string
): { shouldRedirect: boolean; targetUrl?: string } {
  const currentSlug = extractTenantSlug(request.nextUrl.pathname);
  
  conditionalDebugLogSync('TENANT: Checking redirect', { pathname: request.nextUrl.pathname, currentSlug, expectedSlug: organizationSlug });
  
  // Se não há slug esperado, não redirecionar
  if (!organizationSlug) {
    conditionalDebugLogSync('TENANT: No expected slug, not redirecting');
    return { shouldRedirect: false };
  }
  
  // Se já está no slug correto, não redirecionar
  if (currentSlug === organizationSlug) {
    conditionalDebugLogSync('TENANT: Already on correct tenant', { currentSlug });
    return { shouldRedirect: false };
  }

  // Não redirecionar se estiver em rotas especiais
  const isSpecialRoute = request.nextUrl.pathname.startsWith('/api/') || 
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/setup-account') ||
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/access-denied');

  if (isSpecialRoute) {
    conditionalDebugLogSync('TENANT: Special route detected', { pathname: request.nextUrl.pathname });
    return { shouldRedirect: false };
  }
  
  // Se está em um tenant errado ou sem tenant, redirecionar
  const url = request.nextUrl.clone();
  
  // Se está em outro tenant, substituir
  if (currentSlug) {
    url.pathname = url.pathname.replace(`/${currentSlug}`, `/${organizationSlug}`);
    conditionalDebugLogSync('TENANT: Replacing tenant in URL', { pathname: url.pathname });
  } else {
    // Se não está em nenhum tenant, adicionar o slug
    url.pathname = `/${organizationSlug}${url.pathname === '/' ? '' : url.pathname}`;
    conditionalDebugLogSync('TENANT: Adding tenant to URL', { pathname: url.pathname });
  }
  
  conditionalDebugLogSync('TENANT: Will redirect to', { targetUrl: url.toString() });
  
  return { 
    shouldRedirect: true, 
    targetUrl: url.toString() 
  };
}

/**
 * Adiciona headers de contexto do tenant
 */
export function addTenantHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const slug = extractTenantSlug(request.nextUrl.pathname);
  
  if (slug) {
    response.headers.set('X-Client-Slug', slug);
  }
  
  return response;
} 
