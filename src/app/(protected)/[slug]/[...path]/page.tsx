/**
 * Rota Universal - Fase 4: Route Simplification
 * 
 * Rota unificada que substitui múltiplas rotas estáticas e dinâmicas.
 * Usa o DynamicModuleRegistry para carregamento dinâmico e verificações.
 * 
 * Padrões suportados:
 * - /[slug] → Dashboard (home)
 * - /[slug]/[module] → Módulo específico
 * - /[slug]/[module]/[...subpath] → Sub-páginas de módulos
 */

import { notFound, redirect } from 'next/navigation';
import { UniversalRouteHandler } from './components/UniversalRouteHandler';
import { 
  universalRouteMiddleware, 
  checkRateLimit, 
  validatePath,
  logAccessDenied 
} from './middleware/route-middleware';
import { 
  trackRoutePerformance,
  preloadCriticalModules,
  withRetry,
  getCachedOrganization
} from './optimization/performance-optimizations';

interface UniversalPageProps {
  params: Promise<{
    slug: string;
    path?: string[];
  }>;
  searchParams?: Promise<Record<string, string>>;
}

export default async function UniversalPage({ params, searchParams }: UniversalPageProps) {
  const { slug, path = [] } = await params;

  // Adicionado para ignorar rotas internas do Next.js e rotas especiais
  if (slug.startsWith('_')) {
    return notFound();
  }

  // Filtrar requisições .well-known do Chrome DevTools silenciosamente
  if (slug.startsWith('.well-known') || path.some(segment => segment?.startsWith('.well-known'))) {
    console.debug(`🤖 Ignorando requisição .well-known: /${slug}${path.length ? '/' + path.join('/') : ''}`);
    return notFound();
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  
  return await trackRoutePerformance(`universal-route-${slug}`, async () => {
    console.debug(`🌐 Universal Route: /${slug}/${path.join('/')}`);

    // 1. Validação de segurança do path
    if (!validatePath(path)) {
      console.error(`🚫 Path malicioso detectado: ${path.join('/')}`);
      return notFound();
    }

    // 2. Executar middleware de verificação
    const routeContext = await universalRouteMiddleware(null as any, slug, path);
    
    // Se o contexto não for retornado (ex: organização não encontrada), parar
    if (!routeContext) {
        console.warn(`⚠️ Contexto de rota não encontrado para slug: ${slug}`);
        return notFound();
    }

    const { organization, routeType, moduleSlug, hasAccess, redirectTo } = routeContext;

    // 3. Preload de módulos críticos em background (não bloqueia)
    if (routeType === 'home' || routeType === 'module') {
      preloadCriticalModules(organization.client_type).catch(error => 
        console.warn('Preload failed:', error)
      );
    }

    // 4. Rate limiting por organização
    if (!checkRateLimit(organization.id)) {
      console.warn(`⚠️ Rate limit excedido para organização: ${organization.id}`);
      await logAccessDenied(organization.id, moduleSlug || 'unknown', 'rate_limit');
      return notFound();
    }

    // 5. Tratar redirecionamentos
    if (redirectTo) {
      console.debug(`🔄 Redirecionando: ${path.join('/')} → ${redirectTo}`);
      return redirect(redirectTo);
    }

    // 6. Verificar acesso para módulos
    if (routeType === 'module' && !hasAccess) {
      await logAccessDenied(
        organization.id, 
        moduleSlug || 'unknown', 
        'access_denied'
      );
      return notFound();
    }

    // 7. Renderizar baseado no tipo de rota
    switch (routeType) {
      case 'home':
        return (
          <UniversalRouteHandler
            type="home"
            organization={organization}
            searchParams={resolvedSearchParams}
          />
        );
      
      case 'module':
        return (
          <UniversalRouteHandler
            type="module"
            organization={organization}
            moduleSlug={moduleSlug!}
            subPath={path.slice(1)} // Remove o primeiro item (moduleSlug)
            searchParams={resolvedSearchParams}
            originalParams={{ slug, module: moduleSlug, path }}
          />
        );
      
      default:
        console.error(`❌ Tipo de rota não reconhecido: ${routeType}`);
        return notFound();
    }
  });
}


/**
 * Gerar metadata dinâmica baseada na rota
 */
export async function generateMetadata({ params }: UniversalPageProps) {
  const { slug, path = [] } = await params;
  
  // Metadata simplificada para evitar erros de compilação
  if (path.length === 0) {
    return {
      title: `${slug} - Dashboard`,
      description: `Dashboard principal de ${slug}`
    };
  }
  
  if (path.length >= 1) {
    const moduleSlug = path[0];
    return {
      title: `${moduleSlug} - ${slug}`,
      description: `Módulo ${moduleSlug} de ${slug}`
    };
  }
  
  return {
    title: slug,
    description: `Sistema de ${slug}`
  };
}