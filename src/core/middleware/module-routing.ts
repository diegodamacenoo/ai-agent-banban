import { type NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/shared/utils/logger';
import { DEBUG_MODULES } from '@/shared/utils/debug-config';

const logger = createLogger(DEBUG_MODULES.SYSTEM);

interface ModuleRoute {
  path: string;
  moduleId: string;
  requiredPermissions?: string[];
  requiredModules?: string[];
  clientTypes?: ('custom' | 'standard')[];
  fallbackPath?: string;
}

// Configuração de rotas de módulos
const MODULE_ROUTES: ModuleRoute[] = [
  {
    path: '/performance',
    moduleId: 'performance',
    requiredModules: ['performance'],
    fallbackPath: '/dashboard'
  },
  {
    path: '/alertas',
    moduleId: 'alerts',
    requiredModules: ['alerts'],
    fallbackPath: '/dashboard'
  },
  {
    path: '/catalog',
    moduleId: 'inventory',
    requiredModules: ['inventory'],
    fallbackPath: '/dashboard'
  },
  {
    path: '/webhooks',
    moduleId: 'webhooks',
    requiredPermissions: ['webhooks:view'],
    fallbackPath: '/access-denied'
  },
  {
    path: '/banban-performance',
    moduleId: 'fashion-analytics',
    requiredModules: ['fashion-analytics'],
    clientTypes: ['custom'],
    fallbackPath: '/performance'
  }
];

/**
 * Middleware para validação de rotas de módulos
 */
export async function moduleRoutingMiddleware(
  request: NextRequest,
  userPermissions: string[] = [],
  userModules: string[] = [],
  clientType: 'custom' | 'standard' = 'standard'
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  
  // Encontrar rota correspondente
  const matchedRoute = MODULE_ROUTES.find(route => 
    pathname.startsWith(route.path)
  );
  
  if (!matchedRoute) {
    return null; // Não é uma rota de módulo
  }

  logger.debug('Validating module route', {
    path: pathname,
    moduleId: matchedRoute.moduleId,
    clientType,
    userPermissions,
    userModules
  });

  // Verificar tipo de cliente
  if (matchedRoute.clientTypes && !matchedRoute.clientTypes.includes(clientType)) {
    logger.warn('Client type not allowed for route', {
      path: pathname,
      requiredTypes: matchedRoute.clientTypes,
      userType: clientType
    });
    
    if (matchedRoute.fallbackPath) {
      return NextResponse.redirect(
        new URL(matchedRoute.fallbackPath, request.url)
      );
    }
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Verificar permissões necessárias
  if (matchedRoute.requiredPermissions) {
    const hasAllPermissions = matchedRoute.requiredPermissions.every(
      permission => userPermissions.includes(permission)
    );
    
    if (!hasAllPermissions) {
      logger.warn('Missing required permissions for route', {
        path: pathname,
        required: matchedRoute.requiredPermissions,
        user: userPermissions
      });
      
      if (matchedRoute.fallbackPath) {
        return NextResponse.redirect(
          new URL(matchedRoute.fallbackPath, request.url)
        );
      }
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // Verificar módulos necessários
  if (matchedRoute.requiredModules) {
    const hasAllModules = matchedRoute.requiredModules.every(
      module => userModules.includes(module)
    );
    
    if (!hasAllModules) {
      logger.warn('Missing required modules for route', {
        path: pathname,
        required: matchedRoute.requiredModules,
        user: userModules
      });
      
      if (matchedRoute.fallbackPath) {
        return NextResponse.redirect(
          new URL(matchedRoute.fallbackPath, request.url)
        );
      }
      return new NextResponse('Module not available', { status: 404 });
    }
  }

  // Adicionar headers de módulo para o lazy loading
  const response = NextResponse.next();
  response.headers.set('X-Module-ID', matchedRoute.moduleId);
  response.headers.set('X-Module-Validated', 'true');
  
  logger.debug('Module route validated successfully', {
    path: pathname,
    moduleId: matchedRoute.moduleId
  });

  return response;
}

/**
 * Função para obter informações de rota de módulo
 */
export function getModuleRouteInfo(pathname: string): ModuleRoute | null {
  return MODULE_ROUTES.find(route => 
    pathname.startsWith(route.path)
  ) || null;
}

/**
 * Função para verificar se uma rota é de módulo
 */
export function isModuleRoute(pathname: string): boolean {
  return MODULE_ROUTES.some(route => 
    pathname.startsWith(route.path)
  );
} 