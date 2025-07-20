import { type NextRequest, type NextResponse } from 'next/server';
import { createLogger } from '@/shared/utils/logger';
import { DEBUG_MODULES } from '@/shared/utils/debug-config';

const logger = createLogger(DEBUG_MODULES.SECURITY);

/**
 * ConfiguraÃ§Ã£o do Content Security Policy (CSP)
 * 
 * Diretrizes:
 * - Restringir fontes de conteÃºdo ao mÃ­nimo necessÃ¡rio
 * - Evitar 'unsafe-inline' e 'unsafe-eval' exceto quando absolutamente necessÃ¡rio
 * - Usar nonces para scripts inline quando possÃ­vel
 * - Habilitar report-uri para monitoramento
 */
const getCSPDirectives = (isDev: boolean = process.env.NODE_ENV === 'development') => {
  const directives = {
    // Diretiva padrÃ£o para qualquer recurso nÃ£o especificado
    'default-src': ["'self'"],
    
    // Scripts - Restringir ao mÃ¡ximo, usar nonce quando possÃ­vel
    'script-src': [
      "'self'",
      "'unsafe-inline'", // NecessÃ¡rio para Next.js
      isDev ? "'unsafe-eval'" : '', // Apenas em desenvolvimento
      'https://cdn.jsdelivr.net',
      'https://*.supabase.co',
      'https://supabase.com',
      process.env.NEXT_PUBLIC_SITE_URL || ''
    ].filter(Boolean),
    
    // Estilos - Permitir inline para styled-components
    'style-src': [
      "'self'",
      "'unsafe-inline'", // NecessÃ¡rio para styled-components
      'https://fonts.googleapis.com'
    ],
    
    // Imagens - Permitir data: para avatares/thumbnails
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    ],
    
    // Fontes - Restringir a fontes confiÃ¡veis
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    
    // ConexÃµes - NecessÃ¡rio para API e WebSocket
    'connect-src': [
      "'self'",
      'http://localhost:4000', // Permitir conexÃ£o com o backend local
      'https://*.supabase.co',
      'wss://*.supabase.co',
      'https://supabase.com',
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      isDev ? 'ws://localhost:*' : ''
    ].filter(Boolean),
    
    // Frames - Restringir a mesma origem
    'frame-src': ["'self'"],
    'frame-ancestors': ["'self'"],
    
    // MÃ­dia - Restringir a mesma origem
    'media-src': ["'self'"],
    
    // FormulÃ¡rios - Restringir a mesma origem
    'form-action': ["'self'"],
    
    // URI base - Restringir a mesma origem
    'base-uri': ["'self'"],
    
    // ForÃ§a HTTPS
    'upgrade-insecure-requests': [],
    
    // PolÃ­tica de objetos - Restringir
    'object-src': ["'none'"],
    
    // Manifesto - Restringir a mesma origem
    'manifest-src': ["'self'"],
    
    // Workers - Restringir a mesma origem
    'worker-src': ["'self'"],
    
    // RelatÃ³rios de violaÃ§Ã£o
    'report-uri': [process.env.CSP_REPORT_URI || ''].filter(Boolean),
    'report-to': ['csp-endpoint']
  };

  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
};

/**
 * ConfiguraÃ§Ã£o dos Headers de SeguranÃ§a
 * 
 * ReferÃªncias:
 * - OWASP Secure Headers Project
 * - Mozilla Observatory
 * - Security.txt RFC
 */
const SECURITY_HEADERS = {
  // Previne MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Controla como o site pode ser incorporado em iframes
  'X-Frame-Options': 'SAMEORIGIN',
  
  // Habilita o filtro XSS do navegador
  'X-XSS-Protection': '1; mode=block',
  
  // ForÃ§a HTTPS com preload e includeSubDomains
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  
  // Previne exposiÃ§Ã£o de informaÃ§Ãµes sensÃ­veis
  'X-Permitted-Cross-Domain-Policies': 'none',
  
  // Desabilita cache para conteÃºdo sensÃ­vel
  'Cache-Control': 'no-store, max-age=0, must-revalidate',
  'Pragma': 'no-cache',
  
  // Previne clickjacking e isolamento de contexto
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Resource-Policy': 'same-origin',
  
  // Previne vazamento de referrer
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Habilita recursos de seguranÃ§a modernos
  'Permissions-Policy': [
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=()',
    'battery=()',
    'camera=()',
    'display-capture=()',
    'document-domain=()',
    'encrypted-media=()',
    'execution-while-not-rendered=()',
    'execution-while-out-of-viewport=()',
    'fullscreen=(self)',
    'geolocation=()',
    'gyroscope=()',
    'keyboard-map=()',
    'magnetometer=()',
    'microphone=()',
    'midi=()',
    'navigation-override=()',
    'payment=()',
    'picture-in-picture=()',
    'publickey-credentials-get=()',
    'screen-wake-lock=()',
    'sync-xhr=()',
    'usb=()',
    'web-share=()',
    'xr-spatial-tracking=()'
  ].join(', '),
  
  // ConfiguraÃ§Ã£o de relatÃ³rios de seguranÃ§a
  'Report-To': JSON.stringify({
    'group': 'csp-endpoint',
    'max_age': 10886400,
    'endpoints': [{
      'url': process.env.CSP_REPORT_URI || '/api/csp-report'
    }]
  })
};

/**
 * Aplica os headers de seguranÃ§a Ã  resposta
 * 
 * @param request - RequisiÃ§Ã£o Next.js
 * @param response - Resposta Next.js
 * @param options - OpÃ§Ãµes de configuraÃ§Ã£o
 * @returns Response com headers de seguranÃ§a aplicados
 */
export function applySecurityHeaders(
  request: NextRequest,
  response: NextResponse,
  options: {
    enableCSP?: boolean;
    isDev?: boolean;
    disableCache?: boolean;
  } = {}
): NextResponse {
  const {
    enableCSP = true,
    isDev = process.env.NODE_ENV === 'development',
    disableCache = false
  } = options;
  
  try {
    // Aplicar headers bÃ¡sicos de seguranÃ§a
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Aplicar CSP se habilitado
    if (enableCSP) {
      const csp = getCSPDirectives(isDev);
      response.headers.set('Content-Security-Policy', csp);
    }

    // Configurar cache conforme necessidade
    if (disableCache) {
      response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
    }

    logger.debug('Security headers applied successfully');
    return response;
  } catch (error) {
    logger.error('Error applying security headers:', error);
    return response;
  }
}

/**
 * Verifica se os headers de seguranÃ§a estÃ£o configurados corretamente
 * 
 * @param response - Resposta Next.js
 * @returns boolean indicando se todos os headers necessÃ¡rios estÃ£o presentes
 */
export function validateSecurityHeaders(response: NextResponse): boolean {
  const requiredHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Strict-Transport-Security',
    'Content-Security-Policy',
    'Permissions-Policy',
    'Referrer-Policy',
    'Cross-Origin-Opener-Policy',
    'Cross-Origin-Embedder-Policy'
  ];

  const missingHeaders = requiredHeaders.filter(
    header => !response.headers.get(header)
  );

  if (missingHeaders.length > 0) {
    logger.warn('Missing security headers:', missingHeaders);
    return false;
  }

  // Validar valores especÃ­ficos
  const hstsHeader = response.headers.get('Strict-Transport-Security');
  if (!hstsHeader?.includes('includeSubDomains') || !hstsHeader?.includes('preload')) {
    logger.warn('HSTS header missing required directives');
    return false;
  }

  const cspHeader = response.headers.get('Content-Security-Policy');
  if (!cspHeader?.includes('default-src')) {
    logger.warn('CSP header missing default-src directive');
    return false;
  }

  return true;
} 
