import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { headers } from 'next/headers'

// ConfiguraÃ§Ã£o do Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

// InstÃ¢ncias do Rate Limiter
const limiters = {
  standard: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '60s'), // 60 requisiÃ§Ãµes por 60 segundos
    analytics: true,
    prefix: 'ratelimit:standard'
  }),
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '60s'), // 5 tentativas por 60 segundos
    analytics: true,
    prefix: 'ratelimit:auth'
  }),
  webhook: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(120, '60s'), // 120 requisiÃ§Ãµes por 60 segundos
    analytics: true,
    prefix: 'ratelimit:webhook'
  })
}

// FunÃ§Ã£o para obter o IP do cliente
export async function getClientIP() {
  const headersList = await headers()
  const list = headersList.get('x-forwarded-for')
  return list?.split(',')[0] || headersList.get('x-real-ip') || 'unknown'
}

// FunÃ§Ã£o para aplicar rate limiting
export async function applyRateLimit(
  type: keyof typeof limiters = 'standard',
  identifier?: string
) {
  const ip = await getClientIP()
  const key = identifier ? `${ip}:${identifier}` : ip

  const { success, limit, reset, remaining } = await limiters[type].limit(key)

  return {
    success,
    limit,
    reset,
    remaining,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString()
    }
  }
}

// FunÃ§Ã£o para verificar se Ã© ambiente de desenvolvimento
export function isDevelopment() {
  return process.env.NODE_ENV === 'development'
}

// Middleware de Rate Limiting
export async function withRateLimit(
  type: keyof typeof limiters = 'standard',
  identifier?: string
) {
  // Em desenvolvimento, nÃ£o aplicar rate limiting
  if (isDevelopment()) {
    return {
      success: true,
      headers: {}
    }
  }

  return applyRateLimit(type, identifier)
} 
