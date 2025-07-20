import { NextRequest, NextResponse } from 'next/server';

// Configuração de clientes por subdomínio
export const SUBDOMAIN_CONFIG = {
  'banban': {
    clientType: 'custom',
    organizationName: 'BanBan Fashion',
    customBackendUrl: 'http://localhost:4000',
    isImplementationComplete: true,
    theme: {
      primary: '#8B5CF6', // purple
      secondary: '#EC4899', // pink
      accent: '#06B6D4' // cyan
    },
    features: ['fashion-metrics', 'seasonal-analysis', 'brand-performance'],
    sector: 'fashion'
  },
  'riachuelo': {
    clientType: 'custom',
    organizationName: 'Riachuelo',
    customBackendUrl: 'http://localhost:4000',
    isImplementationComplete: true,
    theme: {
      primary: '#DC2626', // red
      secondary: '#F59E0B', // amber
      accent: '#10B981' // emerald
    },
    features: ['fashion-metrics', 'seasonal-analysis', 'brand-performance'],
    sector: 'fashion'
  },
  'ca': {
    clientType: 'custom',
    organizationName: 'C&A',
    customBackendUrl: 'http://localhost:4000',
    isImplementationComplete: true,
    theme: {
      primary: '#1F2937', // gray
      secondary: '#3B82F6', // blue
      accent: '#EF4444' // red
    },
    features: ['fashion-metrics', 'seasonal-analysis', 'brand-performance'],
    sector: 'fashion'
  }
} as const;

// Mapeamento de organizações para subdomínios
export const ORGANIZATION_TO_SUBDOMAIN_MAP = {
  'BanBan Fashion': 'banban',
  'Riachuelo': 'riachuelo', 
  'C&A': 'ca'
} as const;

export type SubdomainConfig = typeof SUBDOMAIN_CONFIG[keyof typeof SUBDOMAIN_CONFIG];

/**
 * Extrai o subdomínio da URL da requisição
 */
export function extractSubdomain(request: NextRequest): string | null {
  const host = request.headers.get('host') || '';
  
  // Para desenvolvimento local
  if (host.includes('localhost')) {
    const parts = host.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost') {
      return parts[0];
    }
    return null;
  }
  
  // Para produção (assumindo formato: subdomain.domain.com)
  const parts = host.split('.');
  if (parts.length > 2) {
    return parts[0];
  }
  
  return null;
}

/**
 * Obtém a configuração do cliente baseada no subdomínio
 */
export function getSubdomainConfig(subdomain: string | null): SubdomainConfig | null {
  if (!subdomain || !(subdomain in SUBDOMAIN_CONFIG)) {
    return null;
  }
  
  return SUBDOMAIN_CONFIG[subdomain as keyof typeof SUBDOMAIN_CONFIG];
}

/**
 * Obtém o subdomínio baseado no nome da organização
 */
export function getSubdomainByOrganization(organizationName: string): string | null {
  return ORGANIZATION_TO_SUBDOMAIN_MAP[organizationName as keyof typeof ORGANIZATION_TO_SUBDOMAIN_MAP] || null;
}

/**
 * Verifica se um usuário deveria ser redirecionado para seu subdomínio correto
 */
export function shouldRedirectToSubdomain(
  request: NextRequest, 
  organizationName: string
): { shouldRedirect: boolean; targetUrl?: string } {
  const currentSubdomain = extractSubdomain(request);
  const expectedSubdomain = getSubdomainByOrganization(organizationName);
  
  console.debug('ðŸ" [SUBDOMAIN] Current subdomain:', currentSubdomain);
  console.debug('ðŸ" [SUBDOMAIN] Expected subdomain for', organizationName, ':', expectedSubdomain);
  
  // Se não há subdomínio esperado, não redirecionar
  if (!expectedSubdomain) {
    console.debug('ðŸ" [SUBDOMAIN] No expected subdomain, not redirecting');
    return { shouldRedirect: false };
  }
  
  // Se já está no subdomínio correto, não redirecionar
  if (currentSubdomain === expectedSubdomain) {
    console.debug('ðŸ" [SUBDOMAIN] Already on correct subdomain, not redirecting');
    return { shouldRedirect: false };
  }
  
  // Se está em localhost (sem subdomínio) ou subdomínio errado, redirecionar
  const url = request.nextUrl.clone();
  url.hostname = `${expectedSubdomain}.localhost`;
  url.port = '3000'; // Manter a porta para desenvolvimento
  
  console.debug('ðŸ" [SUBDOMAIN] Should redirect to:', url.toString());
  
  return { 
    shouldRedirect: true, 
    targetUrl: url.toString() 
  };
}

/**
 * Middleware para processar subdomínios e adicionar headers de contexto a uma resposta existente
 */
export function processSubdomain(request: NextRequest, response: NextResponse): NextResponse {
  const subdomain = extractSubdomain(request);
  const config = getSubdomainConfig(subdomain);
  
  // Adicionar headers de contexto do cliente à resposta fornecida
  if (config) {
    response.headers.set('X-Client-Subdomain', subdomain!);
    response.headers.set('X-Client-Type', config.clientType);
    response.headers.set('X-Organization-Name', config.organizationName);
    response.headers.set('X-Custom-Backend-URL', config.customBackendUrl);
    response.headers.set('X-Implementation-Complete', config.isImplementationComplete.toString());
    response.headers.set('X-Client-Sector', config.sector);
    response.headers.set('X-Client-Features', JSON.stringify(config.features));
    response.headers.set('X-Client-Theme', JSON.stringify(config.theme));
  } else {
    // Cliente padrão
    response.headers.set('X-Client-Type', 'standard');
    response.headers.set('X-Organization-Name', 'Standard Client');
    response.headers.set('X-Implementation-Complete', 'false');
  }
  
  return response;
}

/**
 * Hook para usar no lado do cliente para obter configuração do subdomínio
 */
export function getClientConfigFromHeaders(): SubdomainConfig | null {
  if (typeof window === 'undefined') return null;
  
  // Em desenvolvimento, podemos simular ou usar uma abordagem diferente
  // Por enquanto, vamos usar o hostname
  const hostname = window.location.hostname;
  const subdomain = hostname.split('.')[0];
  
  if (subdomain === 'localhost' || subdomain === hostname) {
    return null;
  }
  
  return getSubdomainConfig(subdomain);
} 
