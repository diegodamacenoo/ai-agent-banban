import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/core/supabase/middleware';
// Importamos createServerClient diretamente do @supabase/ssr para configurar um cliente localmente no middleware
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { conditionalDebugLogSync } from '@/shared/utils/conditional-debug-sync';
import { addTenantHeaders, shouldRedirectToTenant, extractTenantSlug } from '@/shared/utils/tenant-middleware';
import { withRateLimit, getClientIP } from '@/core/api/rate-limiter';
import { corsMiddleware, applyCorsHeaders } from '@/features/security/cors';
import { checkPayloadSize } from '@/features/security/payload-limiter';
import { apiVersioningMiddleware, addVersionHeaders, extractApiVersion } from '@/core/api/versioning';
import { applySecurityHeaders, validateSecurityHeaders } from '@/features/security/security-headers';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { moduleRoutingMiddleware } from './module-routing';
import { trackUserSession } from './session-tracking';


interface ProfileWithOrganization {
  role: string;
  organization_id: string | null;
  is_setup_complete: boolean;
  organizations: {
    slug: string;
    client_type: 'custom' | 'standard';
    implementation_config: any;
  } | null;
}

const protectedRoutes = [
  {
    path: '/admin',
    permissions: ['admin:access']
  }
  // Adicionar mais rotas protegidas conforme necessário
];

const publicRoutes = [
  '/login',
  '/access-denied',
  '/setup-account',
  '/auth', // Adicionar rota de autenticação (callback, etc.)
  '/api',
  '/_next',
  '/favicon.ico'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  conditionalDebugLogSync('Middleware executado', { pathname });

  // Rota para ignorar o middleware de autenticação e lógica de tenant
  const ignoredPaths = [
    '/api',
    '/_next',
    '/static',
    '/public',
    '/favicon.ico',
    '/login',
    '/auth',
    '/setup-account',
    '/access-denied'
  ];

  // Se o caminho começar com um dos prefixos ignorados, pular o resto do middleware
  if (ignoredPaths.some(prefix => pathname.startsWith(prefix))) {
    // Para rotas de API, aplicamos apenas os headers de CORS e segurança
    if (pathname.startsWith('/api')) {
      const response = NextResponse.next();
      return applyCorsHeaders(request, response);
    }
    return NextResponse.next();
  }

  // Aplicar rate limiting para as rotas protegidas
  const rateLimitResult = await withRateLimit('standard');
  if (!rateLimitResult.success) {
    return applySecurityHeaders(request, new NextResponse(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...rateLimitResult.headers
        }
      }
    ));
  }

  // Verificar tamanho do payload para requests que não são GET
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const payloadCheck = checkPayloadSize(request);
    if (payloadCheck) {
      return applySecurityHeaders(request, payloadCheck);
    }
  }

  // Atualizar sessão primeiro para garantir que cookies estão corretos
  const sessionResponse = await updateSession(request);
  
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Verificar se há bloqueios muito recentes que podem indicar sessão recém-encerrada
    try {
      const { data: recentBlocks } = await supabase
        .rpc('get_recent_user_blocks', { 
          minutes_ago: 5,
          limit_count: 1 
        });
      
      if (recentBlocks && recentBlocks.length > 0) {
        const mostRecentBlock = recentBlocks[0];
        const blockAge = Date.now() - new Date(mostRecentBlock.created_at).getTime();
        
        // Se o bloqueio foi criado há menos de 2 minutos, assumir que é sessão encerrada
        if (blockAge <= 2 * 60 * 1000) {
          const blockedUntil = new Date(mostRecentBlock.blocked_until);
          const now = new Date();
          const timeRemaining = Math.max(0, Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000));
          
          const loginUrl = new URL('/login', request.url);
          loginUrl.searchParams.set('reason', 'session_terminated');
          if (timeRemaining > 0) {
            loginUrl.searchParams.set('blocked_until', timeRemaining.toString());
          }
          
          return applySecurityHeaders(request, NextResponse.redirect(loginUrl));
        }
      }
    } catch (error) {
      // Continuar com redirecionamento normal em caso de erro
    }
    
    return applySecurityHeaders(request, NextResponse.redirect(new URL('/login', request.url)));
  }


  // Verificar se o usuário está bloqueado por encerramento de sessão (exceto na página de login e auth)
  const isLoginPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/auth');
  
  if (!isLoginPage) {
    try {
      const { data: isBlocked } = await supabase
        .rpc('is_user_session_blocked', { check_user_id: user.id });
      
      if (isBlocked) {
        // Buscar informações detalhadas do bloqueio para calcular tempo restante
        const { data: blockInfo } = await supabase
          .from('user_session_blocks')
          .select('blocked_until')
          .eq('user_id', user.id)
          .gte('blocked_until', new Date().toISOString())
          .single();
        
        // Desativar todas as sessões ativas do usuário
        await supabase
          .from('user_sessions')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString(),
            security_flags: {
              ended_at: new Date().toISOString(),
              ended_reason: 'blocked_user_access_attempt'
            }
          })
          .eq('user_id', user.id);
        
        // Invalidar JWT via admin API
        try {
          await supabase.auth.admin.signOut(user.id, 'global');
        } catch (signOutError) {
          // Continuar se falhar
        }
        
        // Calcular tempo restante em segundos
        let timeRemaining = 0;
        if (blockInfo?.blocked_until) {
          const blockedUntil = new Date(blockInfo.blocked_until);
          const now = new Date();
          timeRemaining = Math.max(0, Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000));
        }
        
        // Adicionar parâmetros para garantir que o toast seja exibido
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('reason', 'session_terminated');
        if (timeRemaining > 0) {
          loginUrl.searchParams.set('blocked_until', timeRemaining.toString());
        }
        
        return applySecurityHeaders(request, NextResponse.redirect(loginUrl));
      }
    } catch (error) {
      // Continuar sem bloquear em caso de erro na verificação
    }
  }

  // Buscar perfil do usuário com organização
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      role,
      organization_id,
      is_setup_complete,
      organizations (
        slug,
        client_type,
        implementation_config
      )
    `)
    .eq('id', user.id)
    .single<ProfileWithOrganization>();

  if (!profile) {
    return applySecurityHeaders(request, NextResponse.redirect(new URL('/setup-account', request.url)));
  }

  // Se o setup não foi completado, redirecionar para setup-account (exceto se já estiver lá)
  // Master admins não precisam de setup de organização
  if (!profile.is_setup_complete && profile.role !== 'master_admin' && !request.nextUrl.pathname.startsWith('/setup-account')) {
    return applySecurityHeaders(request, NextResponse.redirect(new URL('/setup-account', request.url)));
  }

  // Registrar atividade da sessão
  await trackUserSession(request, user.id, profile.organization_id);

  // Verificar permissões para rotas protegidas
  for (const route of protectedRoutes) {
    if (request.nextUrl.pathname.startsWith(route.path)) {
      // Se é rota admin, verificar se é master_admin
      if (route.path === '/admin' && profile.role !== 'master_admin') {
        return applySecurityHeaders(request, NextResponse.redirect(new URL('/access-denied', request.url)));
      }
    }
  }

  // Aplicar middleware de roteamento de módulos
  if (profile.organizations) {
    const userPermissions: string[] = []; // TODO: Extrair permissões do perfil
    const userModules = profile.organizations.implementation_config?.enabled_modules || [];
    const clientType = profile.organizations.client_type;

    const moduleRouteResult = await moduleRoutingMiddleware(
      request,
      userPermissions,
      userModules,
      clientType
    );

    if (moduleRouteResult) {
      return applySecurityHeaders(request, moduleRouteResult);
    }
  }

  // MIGRATION PHASE 6: Redirects de rotas legacy para sistema universal
  if (profile.organizations?.slug) {
    const organizationSlug = profile.organizations.slug;
    const legacyRoutes: Record<string, string> = {
      '/alertas': '/alerts',
      '/catalog': '/catalog',
      '/events': '/events', 
      '/reports': '/reports',
      '/performance': '/performance',
      '/insights': '/insights'
    };

    // Verificar se é uma rota legacy que precisa ser redirecionada
    const currentPath = request.nextUrl.pathname;
    if (legacyRoutes[currentPath]) {
      const newPath = `/${organizationSlug}${legacyRoutes[currentPath]}`;
      const newUrl = new URL(newPath, request.url);
      conditionalDebugLogSync('Legacy route redirect', { currentPath, newPath });
      return applySecurityHeaders(request, NextResponse.redirect(newUrl));
    }
  }

  // Se não é master_admin e não está em uma rota protegida, redirecionar para o tenant
  if (profile.role !== 'master_admin' && profile.organization_id && profile.organizations?.slug) {
    const currentSlug = request.nextUrl.pathname.split('/')[1];
    const organizationSlug = profile.organizations.slug;

    // Se não está na URL correta do tenant, redirecionar
    if (currentSlug !== organizationSlug) {
      const newUrl = new URL(`/${organizationSlug}${request.nextUrl.pathname}`, request.url);
      return applySecurityHeaders(request, NextResponse.redirect(newUrl));
    }
  }

  return applySecurityHeaders(request, sessionResponse);
}

export const config = {
  matcher: [
    /*
     * O matcher agora é mais simples e captura a maioria das rotas.
     * A lógica de exclusão foi movida para o início da função de middleware
     * para maior clareza, confiabilidade e controle.
     */
    '/((?!_next/static|.*\..*).*)',
  ],
}; 
