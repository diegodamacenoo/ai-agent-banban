import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Detectar domÃ­nio configurado via env (ex: .meudominio.com). Em dev, deixar host-only.
          const configuredDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN ?? undefined;

          const cookieOptions: CookieOptions & { domain?: string } = {
            ...options,
            path: '/',
            // Apenas definir secure em produÃ§Ã£o
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          };

          if (configuredDomain) {
            cookieOptions.domain = configuredDomain;
          }

          request.cookies.set({
            name,
            value,
            ...cookieOptions,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...cookieOptions,
          });
        },
        remove(name: string, options: CookieOptions) {
          const configuredDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN ?? undefined;

          const removeOptions: CookieOptions & { domain?: string } = {
            ...options,
            path: '/',
            maxAge: 0,
          };

          if (configuredDomain) {
            removeOptions.domain = configuredDomain;
          }

          request.cookies.set({
            name,
            value: '',
            ...removeOptions,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.delete({
            name,
            ...removeOptions,
          });
        },
      },
    }
  );

  // IMPORTANT:Refreshing the session also make sure the JWT is refreshed effectively.
  // It must be awaited although it does not return anything.
  await supabase.auth.getUser();

  return response;
} 
