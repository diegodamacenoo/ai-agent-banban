import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
// Importamos createServerClient diretamente do @supabase/ssr para configurar um cliente localmente no middleware
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createLogger } from '@/lib/utils/logger';
import { DEBUG_MODULES } from '@/lib/utils/debug-config';

// Criar logger para o middleware
const logger = createLogger(DEBUG_MODULES.MIDDLEWARE);

export async function middleware(request: NextRequest) {
  // Primeiro, permite que updateSession atualize os cookies e a sessão do Supabase.
  // Isso é crucial e deve acontecer antes de qualquer tentativa de ler o usuário para decisões de rota.
  let response = await updateSession(request);

  // Para decisões de redirecionamento, precisamos ler o estado do usuário
  // APÓS updateSession ter potencialmente atualizado a sessão.
  // Criamos uma instância do cliente Supabase configurada para ler os cookies da REQUISIÇÃO ATUAL.
  // Os cookies da RESPOSTA já foram manipulados por updateSession.
  const supabaseForUserCheck = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Este cliente é SÓ PARA LEITURA do usuário no middleware.
          // A escrita de cookies é tratada por `updateSession`.
          // Portanto, as funções set/remove podem ser no-ops ou logar um aviso.
        },
        remove(name: string, options: CookieOptions) {
          // Idem ao set.
        },
      },
    }
  );

  const { data: { user } } = await supabaseForUserCheck.auth.getUser();

  // Se o usuário existir, verificar se o setup da conta foi concluído
  if (user) {
    const { data: profile, error: profileError } = await supabaseForUserCheck
      .from('profiles')
      .select('is_setup_complete')
      .eq('id', user.id)
      .single();

    // Log usando o novo sistema
    logger.debug('User profile for setup check:', profile); 
    if (profileError) {
      logger.error('Profile error for setup check:', profileError);
      // Considerar como tratar erros aqui - talvez redirecionar para uma página de erro ou login?
      // Por enquanto, se houver erro ao buscar o perfil, a lógica de redirecionamento baseada em setup não será aplicada.
    }

    if (profile && !profile.is_setup_complete) {
      // PRIORIDADE 1: Setup incompleto
      // Se o setup não foi concluído E o usuário não está tentando acessar /setup-account
      // E também não está em rotas da API ou outros caminhos que não deveriam ser redirecionados
      if (
        request.nextUrl.pathname !== '/setup-account' &&
        !request.nextUrl.pathname.startsWith('/api/') && 
        !request.nextUrl.pathname.startsWith('/_next/') && 
        request.nextUrl.pathname !== '/favicon.ico' &&
        request.nextUrl.pathname !== '/login/account-recovery'
      ) {
        const url = request.nextUrl.clone();
        url.pathname = '/setup-account';
        logger.info(`Redirecting to /setup-account (setup not complete) for user: ${user.id} from ${request.nextUrl.pathname}`);
        return NextResponse.redirect(url);
      }
    } else if (profile && profile.is_setup_complete) {
      // PRIORIDADE 2: Setup completo, usuário logado tentando acessar /login
      // Se o usuário está autenticado, completou o setup e está tentando acessar /login, redireciona para /
      if (request.nextUrl.pathname.startsWith('/login')) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }
    // Se o perfil não for encontrado ou houver um erro, ou se nenhuma das condições acima for atendida,
    // a lógica de redirecionamento abaixo (para !user) ou o retorno da response original ainda se aplicam.
  }

  // Lógica de proteção de rota: se NÃO autenticado e tentando acessar uma rota protegida
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // Se vamos redirecionar, não devemos usar a `response` de `updateSession` diretamente,
    // pois ela pode conter cookies que não queremos enviar com o redirecionamento.
    // Criamos uma nova resposta de redirecionamento.
    return NextResponse.redirect(url);
  }

  // Se não houve redirecionamento, retorna a resposta de updateSession, 
  // que contém os cookies de sessão atualizados.
  return response;
}

export const config = {
  matcher: [
    /*
     * Corresponde a todos os caminhos de solicitação, exceto para os que começam com:
     * - _next/static (arquivos estáticos)
     * - _next/image (arquivos de otimização de imagem)
     * - favicon.ico (arquivo favicon)
     * Sinta-se à vontade para modificar este padrão para incluir mais caminhos.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 