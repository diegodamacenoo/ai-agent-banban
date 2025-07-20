import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Configuração do cliente Supabase para o servidor
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie errors in SSR
            console.warn('Error setting cookie:', error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            console.warn('Error removing cookie:', error)
          }
        },
      },
    }
  )
}

// Cliente Supabase para o servidor com timeout e retry
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Função segura para obter usuário com retry
export async function getUserWithRetry(maxRetries = 3, delayMs = 500) {
  let lastError
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(
        (await supabaseAdmin.auth.getUser()).data.user?.id || ''
      )
      
      if (error) throw error
      return { user, error: null }
    } catch (error) {
      lastError = error
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)))
      }
    }
  }
  
  return { user: null, error: lastError }
} 