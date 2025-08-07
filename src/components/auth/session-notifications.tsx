'use client'

import { useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/shared/ui/toast'
import { registerSessionEventCallbacks, checkUserBlocked, type SessionTerminationInfo } from '@/core/auth/session-manager'
import { getCurrentUser } from '@/core/auth/session-manager'
import { createLogger } from '@/shared/utils/logger'
import { DEBUG_MODULES } from '@/shared/utils/debug-config'

const logger = createLogger(DEBUG_MODULES.AUTH)

export function SessionNotifications() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleUrlReason = useCallback((reason: string) => {
    switch (reason) {
      case 'session_terminated':
        const blockedUntil = searchParams.get('blocked_until')
        const timeRemaining = blockedUntil ? parseInt(blockedUntil) : 0
        
        if (timeRemaining > 0) {
          const minutes = Math.ceil(timeRemaining / 60)
          toast.error('Sessão Encerrada', {
            description: `Sua sessão foi encerrada por motivos de segurança. Acesso liberado em ${minutes} minuto(s).`,
            persistent: true
          })
        } else {
          toast.error('Sessão Encerrada', {
            description: 'Sua sessão foi encerrada por motivos de segurança. Você já pode fazer login novamente.',
            persistent: true
          })
        }
        console.debug('🍞 Toast de sessão encerrada mostrado via URL')
        break
      case 'admin_terminated':
        toast.error('Sessão Encerrada', {
          description: 'Sua sessão foi encerrada devido a atividade suspeita.',
          persistent: true
        })
        break
      case 'session_expired':
        toast.warning('Sessão Expirada', {
          description: 'Sua sessão expirou. Faça login novamente.'
        })
        break
      case 'blocked':
        // Não mostrar aqui, será tratado em checkInitialBlockStatus
        break
      default:
        if (reason.startsWith('blocked_until_')) {
          const until = new Date(reason.replace('blocked_until_', ''))
          const timeRemaining = Math.ceil((until.getTime() - Date.now()) / (1000 * 60))
          
          if (timeRemaining > 0) {
            toast.error('Acesso Temporariamente Bloqueado', {
              description: `Você poderá fazer login novamente em ${timeRemaining} minutos.`,
              persistent: true
            })
          }
        }
        break
    }
  }, [searchParams, toast])

  useEffect(() => {
    // Registrar callbacks para eventos de sessão
    registerSessionEventCallbacks({
      onSessionTerminated: (info: SessionTerminationInfo) => {
        if (info.reason === 'admin_terminated') {
          const message = info.message || 'Sua sessão foi encerrada devido a atividade suspeita.'
          toast.error('Sessão Encerrada', {
            description: message,
            persistent: true
          })
        }
      },
      onSessionBlocked: (blockedUntil: string) => {
        const until = new Date(blockedUntil)
        const timeRemaining = Math.ceil((until.getTime() - Date.now()) / (1000 * 60)) // minutos
        
        toast.error('Acesso Temporariamente Bloqueado', {
          description: `Você poderá fazer login novamente em ${timeRemaining} minutos.`,
          persistent: true
        })
      }
    })

    // Verificar razão do redirecionamento na URL
    const reason = searchParams.get('reason')
    if (reason) {
      handleUrlReason(reason)
      // Limpar os parâmetros da URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('reason')
      newUrl.searchParams.delete('blocked_until')
      router.replace(newUrl.pathname + newUrl.search, { scroll: false })
    }

    // NÃO verificar bloqueios automaticamente - apenas quando usuário tentar fazer login
    // checkInitialBlockStatus()
  }, [handleUrlReason, router, searchParams])

  const checkInitialBlockStatus = async () => {
    try {
      const { user, error } = await getCurrentUser()
      
      // Se não há usuário ou erro de autenticação, não fazer nada
      if (!user || error) {
        logger.debug('Usuário não autenticado, pulando verificação de bloqueio')
        return
      }

      const blockStatus = await checkUserBlocked(user.id)
      if (blockStatus.blocked && blockStatus.blockedUntil) {
        const until = new Date(blockStatus.blockedUntil)
        const timeRemaining = Math.ceil((until.getTime() - Date.now()) / (1000 * 60))
        
        if (timeRemaining > 0) {
          toast.error('Acesso Temporariamente Bloqueado', {
            description: blockStatus.message || `Você poderá fazer login novamente em ${timeRemaining} minutos.`,
            persistent: true
          })
        }
      }
    } catch (error) {
      logger.debug('Erro ao verificar status de bloqueio inicial:', error)
    }
  }

  return null // Este componente não renderiza nada visualmente
}