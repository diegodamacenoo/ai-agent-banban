# 🔧 Checklist de Implementação - Correções de Segurança

## 🚨 **FASE 1 - CRÍTICO (24-48h)**

### ✅ **1. Correções XSS (Prioridade MÁXIMA)**

#### 1.1 Setup Inicial
- [ ] `npm install dompurify @types/dompurify`
- [ ] `npm install html-react-parser` (alternativa segura)
- [ ] Criar pasta `src/lib/security/`
- [ ] Criar hook `useSafeHTML()` centralizado

#### 1.2 Arquivo: `autenticacao-dois-fatores.tsx`
```typescript
// ❌ ANTES (VULNERÁVEL)
<div dangerouslySetInnerHTML={{ __html: userMessage }} />

// ✅ DEPOIS (SEGURO)
import DOMPurify from 'dompurify';
const sanitizedHTML = DOMPurify.sanitize(userMessage);
<div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
```
- [ ] Localizar instâncias de `dangerouslySetInnerHTML`
- [ ] Implementar sanitização com DOMPurify
- [ ] Testar com payloads XSS: `<script>alert('xss')</script>`
- [ ] Validar que scripts são removidos

#### 1.3 Arquivo: `text-highlighter.tsx`
```typescript
// ❌ ANTES
element.innerHTML = highlightedText;

// ✅ DEPOIS
import { createRoot } from 'react-dom/client';
const safeComponent = <HighlightedText text={highlightedText} />;
```
- [ ] Substituir `innerHTML` por componente React
- [ ] Implementar escape de caracteres especiais
- [ ] Testar highlighting com conteúdo malicioso

#### 1.4 Arquivo: `chart.tsx` (2 instâncias)
```typescript
// ❌ ANTES
<div dangerouslySetInnerHTML={{ __html: chartSVG }} />

// ✅ DEPOIS
import { sanitizeChartData } from '@/lib/security/chart-sanitizer';
const safeChartData = sanitizeChartData(chartData);
```
- [ ] Implementar sanitizador específico para SVG
- [ ] Remover scripts de dados de chart
- [ ] Validar que apenas tags SVG são permitidas
- [ ] Testar com payloads em dados de chart

#### 1.5 Arquivo: `toaster.tsx`
```typescript
// ❌ ANTES
toast.innerHTML = message;

// ✅ DEPOIS
const SafeToast = ({ message }: { message: string }) => (
  <div>{escapeHtml(message)}</div>
);
```
- [ ] Criar componente ToastMessage seguro
- [ ] Implementar escape de HTML
- [ ] Testar notificações com XSS payload

#### 1.6 Arquivo: `chat-sidebar.tsx`
```typescript
// ❌ ANTES
<div dangerouslySetInnerHTML={{ __html: chatMessage }} />

// ✅ DEPOIS
import { sanitizeChatMessage } from '@/lib/security/chat-sanitizer';
<ChatMessage content={sanitizeChatMessage(chatMessage)} />
```
- [ ] Implementar sanitizador de mensagens de chat
- [ ] Permitir apenas tags seguras: `<b>`, `<i>`, `<u>`, `<br>`
- [ ] Testar com markdown e HTML malicioso

#### 1.7 Utilities de Segurança
Criar `src/lib/security/sanitizers.ts`:
```typescript
import DOMPurify from 'dompurify';

export const sanitizeHTML = (dirty: string) => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'br', 'p', 'span'],
    ALLOWED_ATTR: ['class']
  });
};

export const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};
```
- [ ] Implementar sanitizadores centralizados
- [ ] Criar whitelist de tags permitidas
- [ ] Adicionar escape de caracteres
- [ ] Documentar uso correto

### ✅ **2. Logs com Dados Sensíveis**

#### 2.1 Sistema de Log Seguro
Criar `src/lib/security/safe-logger.ts`:
```typescript
export const safeLogger = {
  info: (message: string, data?: any) => {
    const sanitizedData = redactSensitiveData(data);
    console.log(message, sanitizedData);
  },
  error: (message: string, error?: any) => {
    const sanitizedError = redactSensitiveData(error);
    console.error(message, sanitizedError);
  }
};

const redactSensitiveData = (data: any) => {
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey'];
  // Implementation to redact sensitive fields
};
```

#### 2.2 Arquivo: `account-recovery-form.tsx`
```typescript
// ❌ ANTES
console.log('Recovery attempt:', { password, token });

// ✅ DEPOIS
safeLogger.info('Recovery attempt initiated', { 
  userId: user.id,
  timestamp: new Date().toISOString()
});
```
- [ ] Remover logs de senhas
- [ ] Implementar audit trail sem dados sensíveis
- [ ] Logar apenas metadados seguros

#### 2.3 Arquivo: `login-form.tsx`
```typescript
// ❌ ANTES
console.error('Login failed:', { email, password });

// ✅ DEPOIS
safeLogger.error('Login failed', { 
  email: email.substring(0, 3) + '***',
  attempt: attemptNumber,
  ip: req.ip
});
```
- [ ] Mascarar emails parcialmente
- [ ] Remover senhas dos logs
- [ ] Adicionar contexto de segurança (IP, tentativas)

#### 2.4 Arquivo: `password.ts`
```typescript
// ❌ ANTES
console.log('Password update:', newPassword);

// ✅ DEPOIS
safeLogger.info('Password updated successfully', {
  userId: user.id,
  timestamp: new Date().toISOString(),
  strength: passwordStrength(newPassword)
});
```
- [ ] Remover senhas dos logs
- [ ] Logar apenas força da senha
- [ ] Adicionar auditoria de mudanças

### ✅ **3. Headers de Segurança**

#### 3.1 Content Security Policy
Editar `src/middleware.ts`:
```typescript
import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  const response = NextResponse.next();
  
  // CSP Headers
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://trusted-cdn.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self' https://api.supabase.com"
  );
  
  return response;
}
```
- [ ] Configurar CSP restritivo
- [ ] Testar que aplicação funciona com CSP
- [ ] Monitorar violations no console
- [ ] Ajustar políticas conforme necessário

---

## ⚠️ **FASE 2 - ALTO (48-72h)**

### ✅ **4. Rate Limiting (Next.js)**

#### 4.1 Instalar Dependências
- [ ] `npm install @upstash/redis @upstash/ratelimit`
- [ ] `npm install limiter` (alternativa local)

#### 4.2 Configuração Base (Opção 1: Redis)
Criar `src/lib/security/rate-limiter.ts`:
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Redis-based rate limiting (recomendado para produção)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 requests per 15 minutes
  analytics: true,
});

export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
});
```

#### 4.2 Configuração Base (Opção 2: In-Memory)
```typescript
// In-memory rate limiting (para desenvolvimento/pequenos projetos)
const rateLimitMap = new Map();

export const checkRateLimit = (identifier: string, limit: number, windowMs: number) => {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitMap.has(identifier)) {
    rateLimitMap.set(identifier, []);
  }
  
  const requests = rateLimitMap.get(identifier);
  const validRequests = requests.filter((time: number) => time > windowStart);
  
  if (validRequests.length >= limit) {
    return { success: false, remaining: 0 };
  }
  
  validRequests.push(now);
  rateLimitMap.set(identifier, validRequests);
  
  return { success: true, remaining: limit - validRequests.length - 1 };
};
```

#### 4.3 Implementar em API Routes
Exemplo em `/api/auth/login/route.ts`:
```typescript
import { authLimiter } from '@/lib/security/rate-limiter';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  
  // Rate limiting check
  const { success, remaining } = await authLimiter.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again in 15 minutes.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
    );
  }
  
  // Continue with login logic...
  const response = NextResponse.json({ success: true });
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  return response;
}
```

#### 4.4 Implementar no Middleware
Editar `src/middleware.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { apiLimiter } from '@/lib/security/rate-limiter';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Rate limiting para rotas API
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip ?? '127.0.0.1';
    const { success, remaining } = await apiLimiter.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many API requests' },
        { status: 429 }
      );
    }
    
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
  }
  
  return response;
}
```

#### 4.5 Checklist de Implementação
- [ ] Escolher estratégia: Redis (produção) ou In-Memory (dev)
- [ ] Configurar variáveis de ambiente se usar Redis
- [ ] Implementar rate limiting em `/api/auth/login`
- [ ] Implementar rate limiting em `/api/auth/reset-password`
- [ ] Adicionar rate limiting no middleware para rotas gerais
- [ ] Testar com múltiplas tentativas
- [ ] Verificar headers `X-RateLimit-Remaining`
- [ ] Testar que IPs são bloqueados temporariamente

### ✅ **5. CORS Configuration**

#### 5.1 Configuração Segura
Editar `next.config.js`:
```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://app.banban.com.br'
              : 'http://localhost:3000'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          }
        ]
      }
    ];
  }
};
```
- [ ] Remover wildcard `*` de CORS
- [ ] Configurar origins específicos por ambiente
- [ ] Testar requests de origins não autorizados
- [ ] Verificar que são bloqueados

---

## 📊 **FASE 3 - MÉDIO (1-2 semanas)**

### ✅ **6. Database Security**

#### 6.1 RLS Policies
Criar `scripts/security/rls-policies.sql`:
```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- User isolation policies
CREATE POLICY "users_own_data" ON profiles
  FOR ALL USING (auth.uid() = user_id);

-- Admin access policies  
CREATE POLICY "admin_full_access" ON audit_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Organization isolation
CREATE POLICY "organization_isolation" ON orders
  FOR ALL USING (organization_id = get_user_org());
```
- [ ] Revisar todas as tabelas
- [ ] Implementar políticas granulares
- [ ] Testar isolamento entre usuários
- [ ] Verificar que admins têm acesso necessário

#### 6.2 Security Indexes
```sql
-- Performance + Security indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_orders_org_id ON orders(organization_id);
CREATE INDEX idx_audit_user_action ON audit_logs(user_id, action);
CREATE INDEX idx_sessions_expiry ON user_sessions(expires_at);
```
- [ ] Criar indexes em colunas de segurança
- [ ] Otimizar queries de autenticação
- [ ] Monitorar performance pós-indexes

### ✅ **7. Backup/Recovery**

#### 7.1 Configuração Supabase
Editar `supabase/config.toml`:
```toml
[db]
# Enable point-in-time recovery
enable_pitr = true

# Backup retention
backup_retention_days = 30

[storage]
# File backup configuration
backup_enabled = true
```
- [ ] Habilitar PITR no Supabase
- [ ] Configurar retenção de 30 dias
- [ ] Testar processo de restore
- [ ] Documentar procedimentos de recovery

---

## 🧪 **TESTES DE VALIDAÇÃO**

### Security Testing
- [ ] **XSS Testing:** Injetar payloads em todos os inputs
- [ ] **Rate Limit Testing:** Simular ataques de força bruta
- [ ] **CORS Testing:** Testar requests de origins maliciosos
- [ ] **RLS Testing:** Tentar acessar dados de outros usuários
- [ ] **SQL Injection:** Testar inputs de database

### Performance Testing
- [ ] **Load Testing:** Verificar que rate limits não afetam users legítimos
- [ ] **Database Performance:** Monitorar queries pós-RLS
- [ ] **CSP Impact:** Verificar que CSP não quebra funcionalidades

### Penetration Testing
- [ ] **Automated Scans:** OWASP ZAP ou similar
- [ ] **Manual Testing:** Teste manual de vulnerabilidades
- [ ] **Social Engineering:** Testes de phishing interno

---

## 📊 **MÉTRICAS DE VALIDAÇÃO**

### Antes das Correções
- [ ] Executar: `./scripts/unified-compliance-check.ps1 -SecurityOnly`
- [ ] Documentar pontuação baseline: **72.53%**
- [ ] Listar todos os problemas encontrados: **25 críticos/altos**

### Após Cada Fase
- [ ] **Fase 1:** Expectativa > 85% segurança
- [ ] **Fase 2:** Expectativa > 92% segurança  
- [ ] **Fase 3:** Expectativa > 95% segurança

### Validação Final
- [ ] **Pontuação final:** 95%+ no script de compliance
- [ ] **Zero vulnerabilidades críticas**
- [ ] **Auditoria externa:** Pentesting aprovado
- [ ] **Performance:** Sem degradação > 5%

---

**🚨 IMPORTANTE:** Cada item deve ser testado individualmente antes de marcar como concluído. Sempre fazer backup antes de implementar mudanças críticas.

**📅 Deadline Fase 1:** 48 horas  
**👥 Responsáveis:** [Nome do Tech Lead], [Nome do Security Lead]  
**📊 Tracking:** [Link para board/dashboard] 