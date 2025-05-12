import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // se "next" estiver presente, use-o como o caminho de redirecionamento
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient(); // Usa o server client que lê cookies da requisição
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('Auth callback error exchanging code:', error);
  } else {
    console.error('Auth callback: No code found in search params');
  }

  // retornar para uma página de erro ou login em caso de falha
  const redirectUrl = new URL('/login', origin);
  redirectUrl.searchParams.set('error', 'auth_callback_error');
  redirectUrl.searchParams.set('message', 'Falha no callback de autenticação.');
  return NextResponse.redirect(redirectUrl);
} 