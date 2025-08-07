'use client'

import { useEffect } from 'react'

/**
 * Intercepta requisições para adicionar header de terminação quando necessário
 */
export function useSessionTerminationInterceptor() {
  useEffect(() => {
    // Interceptar fetch requests para adicionar header customizado
    const originalFetch = window.fetch
    
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
      // Verificar se há informação de terminação no localStorage
      const terminationInfo = localStorage.getItem('session_termination')
      
      if (terminationInfo) {
        try {
          const info = JSON.parse(terminationInfo)
          
          // Verificar se ainda é válido (não expirou)
          const age = Date.now() - info.timestamp
          const maxAge = 15 * 60 * 1000 // 15 minutos
          
          if (age < maxAge && info.blocked_until > 0) {
            console.debug('🔍 SessionTerminationInterceptor: Adicionando header de terminação à requisição')
            
            // Adicionar header customizado
            const headers = new Headers(init?.headers)
            headers.set('x-session-termination', JSON.stringify({
              user_id: info.user_id,
              blocked_until: info.blocked_until,
              reason: info.reason
            }))
            
            init = {
              ...init,
              headers
            }
          } else {
            // Informação expirada, remover
            console.debug('🔍 SessionTerminationInterceptor: Informação de terminação expirada, removendo')
            localStorage.removeItem('session_termination')
            localStorage.removeItem('auth_user_id')
          }
        } catch (error) {
          console.debug('❌ SessionTerminationInterceptor: Erro ao processar informação de terminação:', error)
          localStorage.removeItem('session_termination')
        }
      }
      
      return originalFetch(input, init)
    }
    
    // Cleanup
    return () => {
      window.fetch = originalFetch
    }
  }, [])
}

/**
 * Componente que inicializa o interceptor
 */
export function SessionTerminationInterceptor() {
  useSessionTerminationInterceptor()
  return null
}