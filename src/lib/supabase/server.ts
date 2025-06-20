import { createServerClient, type CookieOptions } from '@supabase/ssr';
// import { cookies } from 'next/headers'; // Não é mais chamado aqui diretamente
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

// Cliente Supabase padrão (usa chave anônima)
export function createSupabaseClient(cookieStore: ReadonlyRequestCookies) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Em Server Actions, o cookieStore é ReadonlyRequestCookies.
          // A modificação de cookies deve ser tratada pelo middleware ou pela resposta da rota.
          // console.log(`Supabase client (server) attempted to set cookie: ${name}`);
        },
        remove(name: string, options: CookieOptions) {
          // Em Server Actions, o cookieStore é ReadonlyRequestCookies.
          // console.log(`Supabase client (server) attempted to remove cookie: ${name}`);
        },
      },
    }
  );
}

// Cliente Supabase Admin (usa chave de serviço)
export function createSupabaseAdminClient(cookieStore: ReadonlyRequestCookies) {
  // Verifica se a chave de serviço está definida
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.');
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Usa a chave de serviço!
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Em Server Actions, o cookieStore é ReadonlyRequestCookies.
          // A modificação de cookies deve ser tratada pelo middleware ou pela resposta da rota.
          // console.log(`Supabase admin client (server) attempted to set cookie: ${name}`);
        },
        remove(name: string, options: CookieOptions) {
          // Em Server Actions, o cookieStore é ReadonlyRequestCookies.
          // console.log(`Supabase admin client (server) attempted to remove cookie: ${name}`);
        },
      },
      // Importante: Especificar auth.autoRefreshToken como false para clientes de serviço
      // pode ser uma boa prática para evitar chamadas desnecessárias de refresh,
      // já que a chave de serviço não expira como um token de usuário.
      // auth: {
      //   autoRefreshToken: false,
      //   persistSession: false
      // }
    }
  );
} 