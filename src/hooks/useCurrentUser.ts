'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

/**
 * Hook para obter o usuário atual
 */
export function useCurrentUser() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setCurrentUserId(user.id)
        }
      } catch (error) {
        // Erro ao obter usuário atual - continuar
      }
    }

    getCurrentUser()
  }, [])

  return { currentUserId }
}