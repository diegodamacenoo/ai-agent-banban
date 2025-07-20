import { NextRequest, NextResponse } from 'next/server';

// VersÃµes suportadas da API
export const API_VERSIONS = {
  V1: 'v1',
  V2: 'v2',
  CURRENT: 'v1', // VersÃ£o atual padrÃ£o
  LATEST: 'v1'   // Ãšltima versÃ£o estÃ¡vel
} as const;

export type ApiVersion = typeof API_VERSIONS[keyof typeof API_VERSIONS];

// ConfiguraÃ§Ã£o de compatibilidade entre versÃµes
const VERSION_COMPATIBILITY = {
  v1: {
    deprecated: false,
    supportedUntil: '2025-12-31',
    migrationGuide: '/docs/api/v1-to-v2'
  },
  v2: {
    deprecated: false,
    supportedUntil: null, // VersÃ£o atual
    migrationGuide: null
  }
} as const;

/**
 * Extrai a versÃ£o da API da URL ou headers
 */
export const extractApiVersion = (request: NextRequest): ApiVersion => {
  const pathname = request.nextUrl.pathname;
  
  // MÃ©todo 1: VersÃ£o na URL (/api/v1/users, /api/v2/users)
  const urlVersionMatch = pathname.match(/^\/api\/(v\d+)\//);
  if (urlVersionMatch) {
    const version = urlVersionMatch[1] as ApiVersion;
    if (isValidVersion(version)) {
      return version;
    }
  }
  
  // MÃ©todo 2: Header Accept-Version
  const headerVersion = request.headers.get('Accept-Version');
  if (headerVersion && isValidVersion(headerVersion as ApiVersion)) {
    return headerVersion as ApiVersion;
  }
  
  // MÃ©todo 3: Header API-Version
  const apiVersionHeader = request.headers.get('API-Version');
  if (apiVersionHeader && isValidVersion(apiVersionHeader as ApiVersion)) {
    return apiVersionHeader as ApiVersion;
  }
  
  // PadrÃ£o: retornar versÃ£o atual
  return API_VERSIONS.CURRENT;
};

/**
 * Verifica se uma versÃ£o Ã© vÃ¡lida
 */
export const isValidVersion = (version: string): boolean => {
  return Object.values(API_VERSIONS).includes(version as ApiVersion);
};

/**
 * Verifica se uma versÃ£o estÃ¡ deprecada
 */
export const isVersionDeprecated = (version: ApiVersion): boolean => {
  return VERSION_COMPATIBILITY[version]?.deprecated || false;
};

/**
 * ObtÃ©m informaÃ§Ãµes sobre uma versÃ£o
 */
export const getVersionInfo = (version: ApiVersion) => {
  return VERSION_COMPATIBILITY[version] || null;
};

/**
 * Adiciona headers de versionamento Ã  resposta
 */
export const addVersionHeaders = (
  response: NextResponse, 
  version: ApiVersion
): NextResponse => {
  response.headers.set('API-Version', version);
  response.headers.set('API-Version-Current', API_VERSIONS.CURRENT);
  response.headers.set('API-Version-Latest', API_VERSIONS.LATEST);
  
  const versionInfo = getVersionInfo(version);
  if (versionInfo) {
    if (versionInfo.deprecated) {
      response.headers.set('API-Deprecated', 'true');
      if (versionInfo.supportedUntil) {
        response.headers.set('API-Sunset', versionInfo.supportedUntil);
      }
      if (versionInfo.migrationGuide) {
        response.headers.set('API-Migration-Guide', versionInfo.migrationGuide);
      }
    }
  }
  
  return response;
};

/**
 * Normaliza o path da API removendo a versÃ£o
 */
export const normalizeApiPath = (pathname: string, version: ApiVersion): string => {
  // Remove a versÃ£o da URL se presente
  const versionPattern = new RegExp(`^/api/${version}/`);
  if (versionPattern.test(pathname)) {
    return pathname.replace(versionPattern, '/api/');
  }
  
  return pathname;
};

/**
 * Middleware para versionamento de API
 */
export const apiVersioningMiddleware = (request: NextRequest): NextResponse | null => {
  // Aplicar apenas para rotas de API
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return null;
  }
  
  const version = extractApiVersion(request);
  
  // Verificar se a versÃ£o Ã© suportada
  if (!isValidVersion(version)) {
    return new NextResponse(
      JSON.stringify({
        error: 'Unsupported API version',
        message: `API version '${version}' is not supported`,
        supportedVersions: Object.values(API_VERSIONS),
        currentVersion: API_VERSIONS.CURRENT
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'API-Version-Current': API_VERSIONS.CURRENT,
          'API-Supported-Versions': Object.values(API_VERSIONS).join(', ')
        }
      }
    );
  }
  
  // Verificar se a versÃ£o estÃ¡ deprecada
  if (isVersionDeprecated(version)) {
    const versionInfo = getVersionInfo(version);
    console.warn(`API version ${version} is deprecated. Migration guide: ${versionInfo?.migrationGuide}`);
  }
  
  return null;
};

/**
 * Wrapper para handlers de API com versionamento
 */
export const withApiVersioning = <T extends any[], R>(
  handlers: Record<ApiVersion, (...args: T) => R>
) => {
  return (request: NextRequest, ...args: any[]): R => {
    const version = extractApiVersion(request);
    const handler = handlers[version];
    
    if (!handler) {
      throw new Error(`No handler found for API version ${version}`);
    }
    
    return handler(...(args as T));
  };
};

// UtilitÃ¡rios para respostas com versionamento
export const createVersionedResponse = (
  data: any,
  version: ApiVersion,
  status: number = 200
): NextResponse => {
  const response = NextResponse.json(data, { status });
  return addVersionHeaders(response, version);
};

// Exportar configuraÃ§Ãµes
export const API_CONFIG = {
  VERSIONS: API_VERSIONS,
  COMPATIBILITY: VERSION_COMPATIBILITY,
  DEFAULT_VERSION: API_VERSIONS.CURRENT
} as const; 
