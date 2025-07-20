import { NextRequest, NextResponse } from 'next/server';

// ConfiguraÃ§Ãµes de limite por tipo de endpoint
const PAYLOAD_LIMITS = {
  // Limites em bytes
  DEFAULT: 1024 * 1024, // 1MB padrÃ£o
  UPLOAD: 50 * 1024 * 1024, // 50MB para uploads
  AUTH: 1024, // 1KB para autenticaÃ§Ã£o
  API: 10 * 1024, // 10KB para APIs gerais
  CHAT: 5 * 1024, // 5KB para mensagens de chat
} as const;

// Mapeamento de rotas para limites especÃ­ficos
const ROUTE_LIMITS: Record<string, number> = {
  '/api/auth/': PAYLOAD_LIMITS.AUTH,
  '/api/upload/': PAYLOAD_LIMITS.UPLOAD,
  '/api/chat/': PAYLOAD_LIMITS.CHAT,
  '/api/profiles/': PAYLOAD_LIMITS.API,
  '/api/settings/': PAYLOAD_LIMITS.API,
};

/**
 * Determina o limite de payload para uma rota especÃ­fica
 */
const getPayloadLimit = (pathname: string): number => {
  // Verificar se a rota corresponde a algum padrÃ£o especÃ­fico
  for (const [routePattern, limit] of Object.entries(ROUTE_LIMITS)) {
    if (pathname.startsWith(routePattern)) {
      return limit;
    }
  }
  
  // Retornar limite padrÃ£o
  return PAYLOAD_LIMITS.DEFAULT;
};

/**
 * Converte bytes para formato legÃ­vel
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
};

/**
 * ObtÃ©m o tamanho do payload da requisiÃ§Ã£o
 */
const getPayloadSize = (request: NextRequest): number => {
  const contentLength = request.headers.get('content-length');
  return contentLength ? parseInt(contentLength, 10) : 0;
};

/**
 * Middleware para verificar tamanho do payload
 */
export const checkPayloadSize = (request: NextRequest): NextResponse | null => {
  // Aplicar apenas para mÃ©todos que podem ter payload
  const methodsWithPayload = ['POST', 'PUT', 'PATCH'];
  if (!methodsWithPayload.includes(request.method)) {
    return null;
  }

  // Aplicar apenas para rotas de API
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return null;
  }

  const payloadSize = getPayloadSize(request);
  const limit = getPayloadLimit(request.nextUrl.pathname);

  // Verificar se excede o limite
  if (payloadSize > limit) {
    return new NextResponse(
      JSON.stringify({
        error: 'Payload too large',
        message: `Request payload size (${formatBytes(payloadSize)}) exceeds the limit of ${formatBytes(limit)}`,
        limit: formatBytes(limit),
        received: formatBytes(payloadSize)
      }),
      {
        status: 413, // Payload Too Large
        headers: {
          'Content-Type': 'application/json',
          'X-Payload-Limit': limit.toString(),
          'X-Payload-Size': payloadSize.toString()
        }
      }
    );
  }

  return null;
};

/**
 * ConfiguraÃ§Ã£o para Next.js API routes
 */
export const createPayloadConfig = (routeType: keyof typeof PAYLOAD_LIMITS = 'DEFAULT') => {
  const limit = PAYLOAD_LIMITS[routeType];
  
  return {
    api: {
      bodyParser: {
        sizeLimit: `${Math.ceil(limit / 1024)}kb`, // Converter para KB
      },
    },
  };
};

/**
 * Wrapper para API routes com verificaÃ§Ã£o de payload
 */
export const withPayloadValidation = (
  handler: (req: any, res: any) => Promise<void>,
  limit?: number
) => {
  return async (req: any, res: any) => {
    // Verificar tamanho se especificado
    if (limit) {
      const contentLength = parseInt(req.headers['content-length'] || '0', 10);
      if (contentLength > limit) {
        return res.status(413).json({
          error: 'Payload too large',
          message: `Request size exceeds ${formatBytes(limit)}`,
          limit: formatBytes(limit)
        });
      }
    }
    
    return handler(req, res);
  };
};

// Exportar configuraÃ§Ãµes
export const PAYLOAD_CONFIG = {
  LIMITS: PAYLOAD_LIMITS,
  ROUTE_LIMITS,
  formatBytes,
  getPayloadLimit
} as const;

// Tipos para TypeScript
export type PayloadLimitType = keyof typeof PAYLOAD_LIMITS;
export type PayloadConfig = ReturnType<typeof createPayloadConfig>; 
