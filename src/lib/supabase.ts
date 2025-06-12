import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createSupabaseClientBrowser() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export async function createSupabaseClientServer() {
  const cookieStore = await cookies()
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (error) {
          // Ignorar erros de cookies em componentes server
        }
      },
    },
  })
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 