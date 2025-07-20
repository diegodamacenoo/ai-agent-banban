# 🚦 Rate Limiting para Next.js - Opções e Implementação

## 📋 **Opções Disponíveis**

### 1. **🔴 Upstash Redis** (RECOMENDADO - Produção)
**Pros:** Distribuído, persistente, analytics, escalável  
**Contras:** Custo adicional, dependência externa  
**Ideal para:** Produção, múltiplas instâncias  

### 2. **🟡 In-Memory** (Desenvolvimento)
**Pros:** Simples, sem dependências, gratuito  
**Contras:** Não persistente, não distribuído  
**Ideal para:** Desenvolvimento, single instance  

### 3. **🟢 Vercel KV** (Vercel Deploy)
**Pros:** Integração nativa, managed  
**Contras:** Vendor lock-in, só funciona na Vercel  
**Ideal para:** Deploy na Vercel  

---

## 🚀 **IMPLEMENTAÇÃO COMPLETA**

### Opção 1: Upstash Redis (Produção)

#### Setup
```bash
npm install @upstash/redis @upstash/ratelimit
```

#### Configuração `.env`
```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

#### `src/lib/security/rate-limiter.ts`
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Auth endpoints (login, register, reset password)
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: 'rl:auth',
});

// General API endpoints
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'rl:api',
});

// File upload endpoints
export const uploadLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
  prefix: 'rl:upload',
});

// Password reset (mais restritivo)
export const passwordResetLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  analytics: true,
  prefix: 'rl:pwd-reset',
});
```

### Opção 2: In-Memory (Desenvolvimento)

#### `src/lib/security/rate-limiter-memory.ts`
```typescript
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
  
  // Cleanup old entries
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
  
  // Filter valid requests within window
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

// Helper functions for different endpoints
export const authLimiter = {
  limit: (identifier: string) => 
    checkRateLimit(identifier, 5, 15 * 60 * 1000) // 5 req/15min
};

export const apiLimiter = {
  limit: (identifier: string) => 
    checkRateLimit(identifier, 100, 60 * 1000) // 100 req/min
};

export const uploadLimiter = {
  limit: (identifier: string) => 
    checkRateLimit(identifier, 10, 60 * 60 * 1000) // 10 req/hour
};
```

### Opção 3: Vercel KV

#### Setup
```bash
npm install @vercel/kv
```

#### `src/lib/security/rate-limiter-vercel.ts`
```typescript
import { kv } from '@vercel/kv';

export const rateLimitVercel = async (
  identifier: string,
  limit: number,
  windowMs: number
) => {
  const key = `ratelimit:${identifier}`;
  const window = Math.floor(Date.now() / windowMs);
  const windowKey = `${key}:${window}`;
  
  const current = await kv.incr(windowKey);
  
  if (current === 1) {
    await kv.expire(windowKey, Math.ceil(windowMs / 1000));
  }
  
  return {
    success: current <= limit,
    remaining: Math.max(0, limit - current),
    reset: (window + 1) * windowMs
  };
};
```

---

## 🔧 **IMPLEMENTAÇÃO EM API ROUTES**

### Exemplo: `/api/auth/login/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { authLimiter } from '@/lib/security/rate-limiter';

export async function POST(request: NextRequest) {
  const ip = request.ip ?? 
    request.headers.get('x-forwarded-for') ?? 
    request.headers.get('x-real-ip') ?? 
    '127.0.0.1';
  
  // Rate limiting check
  const { success, remaining, reset } = await authLimiter.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { 
        error: 'Too many login attempts. Try again later.',
        retryAfter: Math.ceil((reset - Date.now()) / 1000)
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString()
        }
      }
    );
  }
  
  try {
    // Login logic here...
    const result = await authenticateUser(request);
    
    const response = NextResponse.json(result);
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    return response;
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}
```

### Exemplo: Middleware Global
```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { apiLimiter } from '@/lib/security/rate-limiter';

export async function middleware(request: NextRequest) {
  // Skip rate limiting for static files
  if (
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip ?? '127.0.0.1';
    const { success, remaining } = await apiLimiter.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many API requests' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60'
          }
        }
      );
    }
    
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

---

## 🧪 **TESTES DE VALIDAÇÃO**

### Teste Manual
```bash
# Testar rate limiting de login
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "Status: %{http_code}\n"
done
```

### Teste Automatizado
```typescript
// __tests__/rate-limiting.test.ts
import { authLimiter } from '@/lib/security/rate-limiter';

describe('Rate Limiting', () => {
  it('should allow requests within limit', async () => {
    const identifier = 'test-ip-1';
    
    for (let i = 0; i < 5; i++) {
      const result = await authLimiter.limit(identifier);
      expect(result.success).toBe(true);
    }
  });
  
  it('should block requests over limit', async () => {
    const identifier = 'test-ip-2';
    
    // Use up the limit
    for (let i = 0; i < 5; i++) {
      await authLimiter.limit(identifier);
    }
    
    // This should be blocked
    const result = await authLimiter.limit(identifier);
    expect(result.success).toBe(false);
  });
});
```

---

## 📊 **MONITORAMENTO**

### Dashboard de Rate Limiting
```typescript
// src/app/api/admin/rate-limit-stats/route.ts
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    // Get analytics from Upstash
    const analytics = await redis.eval(`
      return redis.call('keys', 'rl:*')
    `, []);
    
    return NextResponse.json({ analytics });
  }
  
  return NextResponse.json({ message: 'Analytics only available in production' });
}
```

### Alertas
```typescript
// src/lib/monitoring/rate-limit-alerts.ts
export const checkRateLimitAlerts = async () => {
  const threshold = 1000; // requests per minute
  const currentRate = await getCurrentRequestRate();
  
  if (currentRate > threshold) {
    await sendAlert({
      type: 'RATE_LIMIT_HIGH',
      message: `High request rate detected: ${currentRate} req/min`,
      severity: 'HIGH'
    });
  }
};
```

---

## 🚨 **RECOMENDAÇÃO FINAL**

**Para o Banban Fashion:**

1. **Desenvolvimento:** Usar **In-Memory** (simples, sem custos)
2. **Produção:** Usar **Upstash Redis** (robusto, analytics)
3. **Se deploy na Vercel:** Considerar **Vercel KV**

**Implementação sugerida:**
- Começar com In-Memory para testar
- Migrar para Upstash Redis antes do deploy de produção
- Configurar monitoramento e alertas
- Testar todos os endpoints críticos

**Custos estimados:**
- Upstash Redis: ~$5-20/mês (dependendo do volume)
- Vercel KV: Incluído no plano Pro da Vercel
- In-Memory: Gratuito 