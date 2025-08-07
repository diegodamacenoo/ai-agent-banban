'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useToast } from '@/shared/ui/toast'

interface BlockValidationResult {
  isBlocked: boolean
  timeRemaining?: number
}

/**
 * Hook para validar se um usuário está bloqueado antes do login
 */
export function useLoginBlockValidation() {
  const { toast } = useToast()

  const validateUserBlock = async (email: string): Promise<BlockValidationResult> => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Buscar usuário pelo email
      const { data: userData } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .single()

      if (!userData?.id) {
        return { isBlocked: false }
      }

      // Verificar se usuário está bloqueado
      const { data: isBlocked } = await supabase
        .rpc('is_user_session_blocked', { check_user_id: userData.id })

      if (!isBlocked) {
        return { isBlocked: false }
      }

      // Buscar informações do bloqueio
      const { data: blockInfo } = await supabase
        .from('user_session_blocks')
        .select('blocked_until, reason')
        .eq('user_id', userData.id)
        .gte('blocked_until', new Date().toISOString())
        .single()

      if (!blockInfo?.blocked_until) {
        return { isBlocked: false }
      }

      const blockedUntil = new Date(blockInfo.blocked_until)
      const now = new Date()
      const timeRemaining = Math.max(0, Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000))

      if (timeRemaining > 0) {
        const minutes = Math.ceil(timeRemaining / 60)
        const seconds = timeRemaining % 60
        const timeText = minutes > 0 ? `${minutes} minuto(s)` : `${seconds} segundos`

        toast.warning("Login Temporariamente Bloqueado", {
          description: `Acesso suspenso por motivos de segurança. Aguarde ${timeText} para tentar novamente.`,
          duration: 8000
        })

        return { isBlocked: true, timeRemaining }
      }

      return { isBlocked: false }
    } catch (error) {
      // Em caso de erro, permitir login
      return { isBlocked: false }
    }
  }

  return { validateUserBlock }
}