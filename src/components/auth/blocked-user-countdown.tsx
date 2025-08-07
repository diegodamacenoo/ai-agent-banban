'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/shared/ui/toast/toast-context'
import { checkUserBlocked } from '@/core/auth/session-manager'
import { createLogger } from '@/shared/utils/logger'
import { DEBUG_MODULES } from '@/shared/utils/debug-config'

const logger = createLogger(DEBUG_MODULES.AUTH)

interface BlockedUserCountdownProps {
  userId: string
  onBlockStatusChange?: (blocked: boolean) => void
}

export function BlockedUserCountdown({ userId, onBlockStatusChange }: BlockedUserCountdownProps) {
  const { toast, dismiss } = useToast()
  const [toastId, setToastId] = useState<string | null>(null)
  const [isBlocked, setIsBlocked] = useState(false)

  useEffect(() => {
    // Se não há userId, não fazer nada
    if (!userId) {
      return
    }

    let intervalId: NodeJS.Timeout | null = null
    let checkIntervalId: NodeJS.Timeout | null = null

    const checkBlockStatus = async () => {
      try {
        const blockStatus = await checkUserBlocked(userId)
        
        if (blockStatus.blocked && blockStatus.blockedUntil) {
          const until = new Date(blockStatus.blockedUntil)
          const now = Date.now()
          const timeRemaining = until.getTime() - now

          if (timeRemaining > 0) {
            setIsBlocked(true)
            onBlockStatusChange?.(true)
            startCountdown(until, blockStatus.message)
          } else {
            // Bloqueio expirou
            if (isBlocked) {
              setIsBlocked(false)
              onBlockStatusChange?.(false)
              if (toastId) {
                dismiss(toastId)
                setToastId(null)
              }
            }
          }
        } else {
          // Não está bloqueado
          if (isBlocked) {
            setIsBlocked(false)
            onBlockStatusChange?.(false)
            if (toastId) {
              dismiss(toastId)
              setToastId(null)
            }
          }
        }
      } catch (error) {
        logger.error('Erro ao verificar status de bloqueio:', error)
      }
    }

    const startCountdown = (until: Date, message?: string) => {
      // Limpar interval anterior se existir
      if (intervalId) {
        clearInterval(intervalId)
      }

      const updateCountdown = () => {
        const now = Date.now()
        const timeRemaining = until.getTime() - now

        if (timeRemaining <= 0) {
          // Bloqueio expirou
          setIsBlocked(false)
          onBlockStatusChange?.(false)
          if (toastId) {
            dismiss(toastId)
            setToastId(null)
          }
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }
          return
        }

        const minutes = Math.floor(timeRemaining / (1000 * 60))
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000)

        const countdownMessage = minutes > 0 
          ? `${minutes}m ${seconds}s`
          : `${seconds}s`

        // Mostrar mensagem adequada baseada no contexto
        const toastTitle = 'Acesso Temporariamente Bloqueado'
        const toastMessage = `Acesso suspenso por motivos de segurança. Aguarde ${countdownMessage} para fazer login novamente.`

        if (toastId) {
          // Atualizar toast existente usando a referência do hook
          update(toastId, {
            title: toastTitle,
            description: toastMessage,
            variant: 'destructive' as const,
            persistent: true
          })
        } else {
          // Criar novo toast
          const newToastId = toast({
            title: toastTitle,
            description: toastMessage,
            variant: 'destructive' as const,
            persistent: true
          })
          setToastId(newToastId)
        }
      }

      // Atualizar imediatamente
      updateCountdown()

      // Atualizar a cada segundo
      intervalId = setInterval(updateCountdown, 1000)
    }

    // Verificar status inicial
    checkBlockStatus()

    // Verificar status periodicamente (a cada 30 segundos)
    checkIntervalId = setInterval(checkBlockStatus, 30 * 1000)

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
      if (checkIntervalId) {
        clearInterval(checkIntervalId)
      }
      if (toastId) {
        dismiss(toastId)
      }
    }
  }, [userId, onBlockStatusChange])

  return null // Este componente não renderiza nada visualmente
}

// Hook para usar o countdown em componentes funcionais
export function useBlockedUserCountdown(userId: string) {
  const [isBlocked, setIsBlocked] = useState(false)

  return {
    isBlocked,
    BlockedCountdown: () => (
      <BlockedUserCountdown 
        userId={userId} 
        onBlockStatusChange={setIsBlocked}
      />
    )
  }
}