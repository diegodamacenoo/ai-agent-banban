import { NextRequest, NextResponse } from 'next/server';

// Lista de domÃ­nios permitidos - em produÃ§Ã£o, usar variÃ¡vel de ambiente
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://localhost:3000',
  process.env.NEXT_PUBLIC_APP_URL,
  // Adicionar domÃ­nios de produÃ§Ã£o quando necessÃ¡rio
].filter(Boolean);

/**
 * Verifica se a origem Ã© permitida
 */
const isOriginAllowed = (origin: string | null): boolean => {
  if (!origin) return true; // Requests sem origem (same-origin)
  
  return ALLOWED_ORIGINS.some(allowedOrigin => {
    if (allowedOrigin === origin) return true;
    
    // Permitir subdomÃ­nios para domÃ­nios de produÃ§Ã£o
    if (allowedOrigin?.includes('://')) {
      const domain = allowedOrigin.split('://')[1];
      return origin.endsWith(`.${domain}`) || origin === domain;
    }
    
    return false;
  });
};

/**
 * Aplica headers CORS seguros
 */
export const applyCorsHeaders = (
  request: NextRequest, 
  response: NextResponse
): NextResponse => {
  const origin = request.headers.get('origin');
  
  // Verificar se a origem Ã© permitida
  if (isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
  }
  
  // Headers CORS seguros
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 
    'Content-Type, Authorization, X-Requested-With, Accept, Origin'
  );
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 horas
  
  return response;
};

/**
 * Handler para requests OPTIONS (preflight)
 */
export const handleCorsOptions = (request: NextRequest): NextResponse => {
  const origin = request.headers.get('origin');
  
  const response = new NextResponse(null, { status: 204 });
  
  if (isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
  }
  
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 
    'Content-Type, Authorization, X-Requested-With, Accept, Origin'
  );
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
};

/**
 * Middleware CORS para APIs
 */
export const corsMiddleware = (request: NextRequest): NextResponse | null => {
  // Aplicar CORS apenas para rotas de API
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return null;
  }
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return handleCorsOptions(request);
  }
  
  return null;
};

// ConfiguraÃ§Ãµes exportadas
export const CORS_CONFIG = {
  ALLOWED_ORIGINS,
  MAX_AGE: 86400,
  ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
} as const; 
