import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ConfiguraÃ§Ã£o do Redis (serÃ¡ configurado via env vars)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiters para diferentes endpoints
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, '15 m'), // 50 tentativas por 15 minutos (AUMENTADO PARA TESTES)
  analytics: true,
  prefix: 'rl:auth',
});

export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests por minuto
  analytics: true,
  prefix: 'rl:api',
});

export const uploadLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 uploads por hora
  analytics: true,
  prefix: 'rl:upload',
});

export const passwordResetLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'), // 3 resets por hora
  analytics: true,
  prefix: 'rl:pwd-reset',
});

// Fallback para desenvolvimento (in-memory)
interface RateLimitData {
  requests: number[];
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitData>();

export const checkRateLimit = (
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; reset: number } => {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Cleanup old entries periodicamente
  if (rateLimitStore.size > 10000) {
    const cutoff = now - (windowMs * 2);
    for (const [key, data] of rateLimitStore.entries()) {
      if (data.windowStart < cutoff) {
        rateLimitStore.delete(key);
      }
    }
  }
  
  let data = rateLimitStore.get(identifier);
  if (!data) {
    data = { requests: [], windowStart: now };
    rateLimitStore.set(identifier, data);
  }
  
  // Filtra requests vÃ¡lidos dentro da janela
  data.requests = data.requests.filter(time => time > windowStart);
  
  if (data.requests.length >= limit) {
    return {
      success: false,
      remaining: 0,
      reset: Math.min(...data.requests) + windowMs
    };
  }
  
  data.requests.push(now);
  data.windowStart = windowStart;
  
  return {
    success: true,
    remaining: limit - data.requests.length,
    reset: now + windowMs
  };
};

// Fallback limiters para desenvolvimento
export const authLimiterFallback = {
  limit: (identifier: string) => 
    checkRateLimit(identifier, 50, 15 * 60 * 1000) // 50 req/15min (AUMENTADO PARA TESTES)
};

export const apiLimiterFallback = {
  limit: (identifier: string) => 
    checkRateLimit(identifier, 100, 60 * 1000) // 100 req/min
};

export const uploadLimiterFallback = {
  limit: (identifier: string) => 
    checkRateLimit(identifier, 10, 60 * 60 * 1000) // 10 req/hour
};

// FunÃ§Ã£o para obter IP do request
export const getClientIP = (request: Request): string => {
  // Tenta vÃ¡rias fontes de IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP.trim();
  }
  
  if (cfIP) {
    return cfIP.trim();
  }
  
  return '127.0.0.1'; // fallback
};

// FunÃ§Ã£o para verificar se deve usar Redis ou fallback
export const shouldUseRedis = (): boolean => {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
};

// Wrapper para rate limiting que escolhe automaticamente Redis ou fallback
export const rateLimitWrapper = async (
  identifier: string,
  limiterType: 'auth' | 'api' | 'upload' | 'password-reset'
) => {
  try {
    if (shouldUseRedis()) {
      // Usa Redis se configurado
      switch (limiterType) {
        case 'auth':
          return await authLimiter.limit(identifier);
        case 'api':
          return await apiLimiter.limit(identifier);
        case 'upload':
          return await uploadLimiter.limit(identifier);
        case 'password-reset':
          return await passwordResetLimiter.limit(identifier);
        default:
          return await apiLimiter.limit(identifier);
      }
    } else {
      // Fallback para in-memory
      switch (limiterType) {
        case 'auth':
          return authLimiterFallback.limit(identifier);
        case 'api':
          return apiLimiterFallback.limit(identifier);
        case 'upload':
          return uploadLimiterFallback.limit(identifier);
        case 'password-reset':
          return checkRateLimit(identifier, 3, 60 * 60 * 1000);
        default:
          return apiLimiterFallback.limit(identifier);
      }
    }
  } catch (error) {
    console.warn('Rate limiting error, allowing request:', error);
    // Em caso de erro, permite o request (fail-open)
    return {
      success: true,
      remaining: 999,
      reset: Date.now() + 60000
    };
  }
};

// Tipos para TypeScript
export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

export type LimiterType = 'auth' | 'api' | 'upload' | 'password-reset'; 
