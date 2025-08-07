'use client'

import { useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { createLogger } from '@/shared/utils/logger'
import { DEBUG_MODULES } from '@/shared/utils/debug-config'

const logger = createLogger(DEBUG_MODULES.AUTH)

/**
 * Componente que detecta quando a sessão é encerrada e salva informação no localStorage
 * para que o middleware possa detectar tentativas de acesso subsequentes
 */
export function SessionTerminationDetector() {
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Monitorar mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.debug('🔍 SessionTerminationDetector: Evento de auth:', event)
        
        if (event === 'SIGNED_OUT' && !session) {
          console.debug('🚫 SessionTerminationDetector: Usuário deslogado detectado')
          
          try {
            // Verificar se o usuário foi bloqueado recentemente
            const { data: currentUser } = await supabase.auth.getUser()
            
            // Se não conseguir obter o usuário, tentar buscar do localStorage anterior
            const lastUser = localStorage.getItem('auth_user_id')
            const userId = currentUser?.user?.id || lastUser
            
            if (userId) {
              console.debug('🔍 SessionTerminationDetector: Verificando bloqueio para:', userId)
              
              // Verificar se há bloqueio ativo
              const { data: isBlocked } = await supabase
                .rpc('is_user_session_blocked', { check_user_id: userId })
              
              if (isBlocked) {
                console.debug('🚫 SessionTerminationDetector: Usuário está bloqueado - salvando no localStorage')
                
                // Buscar tempo restante
                const { data: blockInfo } = await supabase
                  .from('user_session_blocks')
                  .select('blocked_until')
                  .eq('user_id', userId)
                  .gte('blocked_until', new Date().toISOString())
                  .single()
                
                if (blockInfo?.blocked_until) {
                  const blockedUntil = new Date(blockInfo.blocked_until)
                  const now = new Date()
                  const timeRemaining = Math.max(0, Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000))
                  
                  // Salvar no localStorage para detecção pelo middleware
                  const terminationInfo = {
                    user_id: userId,
                    blocked_until: timeRemaining,
                    reason: 'session_terminated',
                    timestamp: Date.now()
                  }
                  
                  localStorage.setItem('session_termination', JSON.stringify(terminationInfo))
                  console.debug('💾 SessionTerminationDetector: Informação salva no localStorage:', terminationInfo)
                } else {
                  console.debug('⚠️ SessionTerminationDetector: Bloqueio ativo mas sem tempo restante')
                }
              } else {
                console.debug('✅ SessionTerminationDetector: Usuário não está bloqueado')
                // Limpar qualquer informação antiga
                localStorage.removeItem('session_termination')
              }
            }
          } catch (error) {
            console.debug('❌ SessionTerminationDetector: Erro ao verificar bloqueio:', error)
          }
        }
        
        // Salvar ID do usuário para referência futura
        if (session?.user?.id) {
          localStorage.setItem('auth_user_id', session.user.id)
        } else {
          // Não remover imediatamente - pode ser necessário para detecção de bloqueio
          setTimeout(() => {
            const terminationInfo = localStorage.getItem('session_termination')
            if (!terminationInfo) {
              localStorage.removeItem('auth_user_id')
            }
          }, 5000) // Aguardar 5 segundos antes de limpar
        }
      }
    )

    // Cleanup
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return null // Componente não renderiza nada
}