'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/shared/ui/toast'
import { useSessionTermination } from './useSessionTermination'

/**
 * Hook para gerenciar countdown de bloqueio no login
 */
export function useLoginCountdown() {
  const [countdown, setCountdown] = useState<number | null>(null)
  const [hasShownUnblockToast, setHasShownUnblockToast] = useState(false)
  const { toast } = useToast()
  const { timeRemaining: sessionTimeRemaining } = useSessionTermination()

  // Configurar countdown se há tempo de bloqueio da sessão encerrada
  useEffect(() => {
    if (sessionTimeRemaining && sessionTimeRemaining > 0 && countdown === null) {
      setCountdown(sessionTimeRemaining)
      setHasShownUnblockToast(false)
    }
  }, [sessionTimeRemaining, countdown])

  // Timer do countdown
  useEffect(() => {
    if (countdown === null || countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          return null
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  // Toast quando countdown termina
  useEffect(() => {
    if (countdown === null && !hasShownUnblockToast) {
      setHasShownUnblockToast(true)

      const timer = setTimeout(() => {
        toast.success("Bloqueio removido", {
          description: "Você já pode tentar fazer login novamente.",
          duration: 5000
        })
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [countdown, hasShownUnblockToast, toast])

  const formatCountdown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${remainingSeconds}s`
  }

  const isBlocked = countdown !== null && countdown > 0

  return {
    countdown,
    isBlocked,
    formatCountdown
  }
}