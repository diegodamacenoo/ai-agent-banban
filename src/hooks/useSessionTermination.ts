'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/shared/ui/toast/use-toast'
import { conditionalDebugLogSync } from '@/shared/utils/conditional-debug-sync'

/**
 * Hook para gerenciar detecção e feedback de sessões encerradas
 * Centraliza toda a lógica relacionada a encerramento de sessão
 */
export function useSessionTermination() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const processedRef = useRef(false)

  useEffect(() => {
    // Evitar processamento múltiplo
    if (processedRef.current) return

    const reason = searchParams.get('reason')
    const blockedUntil = searchParams.get('blocked_until')

    // Processar apenas se for encerramento de sessão
    if (reason !== 'session_terminated') return

    conditionalDebugLogSync('useSessionTermination: Processando encerramento de sessão', { reason, blockedUntil })
    processedRef.current = true

    // Determinar tipo de toast baseado no tempo de bloqueio
    const timeRemaining = blockedUntil ? parseInt(blockedUntil) : 0

    // Atrasar a limpeza da URL para permitir que outros componentes leiam os parâmetros
    setTimeout(() => {
      const url = new URL(window.location.href)
      url.searchParams.delete('reason')
      url.searchParams.delete('blocked_until')
      window.history.replaceState({}, '', url.toString())
    }, 500)

    if (timeRemaining > 0) {
      const minutes = Math.ceil(timeRemaining / 60)
      toast.error('Sessão Encerrada', {
        description: `Sua sessão foi encerrada por motivos de segurança. Acesso liberado em ${minutes} minuto(s).`,
        duration: 8000,
        persistent: true
      })
    } else {
      toast.warning('Sessão Encerrada', {
        description: 'Sua sessão foi encerrada por motivos de segurança. Você já pode fazer login novamente.',
        duration: 6000,
        persistent: true
      })
    }
  }, [searchParams, toast, router])

  return {
    isProcessed: processedRef.current,
    timeRemaining: searchParams.get('blocked_until') ? parseInt(searchParams.get('blocked_until')!) : null
  }
}