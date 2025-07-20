import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Cria um cliente Supabase para uso no lado do navegador (client components).
 * 
 * Esta funÃ§Ã£o deve ser chamada dentro dos componentes ou hooks onde o cliente Ã© necessÃ¡rio,
 * garantindo que uma instÃ¢ncia nova e limpa seja usada, evitando problemas de estado
 * durante a navegaÃ§Ã£o client-side do Next.js App Router.
 */
export function createSupabaseBrowserClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Este erro Ã© crÃ­tico e impede o funcionamento da autenticaÃ§Ã£o.
    console.error("FATAL: As variÃ¡veis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY nÃ£o estÃ£o definidas.");
    throw new Error("ConfiguraÃ§Ã£o do cliente Supabase estÃ¡ incompleta. Verifique as variÃ¡veis de ambiente.");
  }

  // Retorna uma nova instÃ¢ncia do cliente a cada chamada.
  // Isso Ã© mais robusto para o App Router do que um singleton.
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  );
}
