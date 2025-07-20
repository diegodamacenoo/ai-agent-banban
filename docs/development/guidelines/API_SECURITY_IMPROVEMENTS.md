# Melhorias de Segurança nas APIs

## Sumário
Este documento detalha as melhorias de segurança implementadas nas APIs do sistema, incluindo tratamento de erros padronizado, rate limiting e configuração de CORS.

## 1. Rate Limiting

### 1.1 Implementação
- **Tecnologia**: Upstash Redis (recomendado para produção)
- **Alternativas**:
  - In-Memory (desenvolvimento)
  - Vercel KV (deploy Vercel)

### 1.2 Limites Configurados
- **Padrão**: 60 requisições por minuto
- **Autenticação**: 5 tentativas por minuto
- **Webhooks**: 120 requisições por minuto

### 1.3 Headers de Resposta
- `X-RateLimit-Limit`: Limite total de requisições
- `X-RateLimit-Remaining`: Requisições restantes
- `X-RateLimit-Reset`: Timestamp de reset do limite

## 2. Tratamento de Erros

### 2.1 Tipos de Erro Padronizados
- `VALIDATION_ERROR` (400)
- `AUTHENTICATION_ERROR` (401)
- `AUTHORIZATION_ERROR` (403)
- `NOT_FOUND` (404)
- `RATE_LIMIT_ERROR` (429)
- `DATABASE_ERROR` (500)
- `INTERNAL_SERVER_ERROR` (500)

### 2.2 Formato de Resposta
```json
{
  "error": "TIPO_DO_ERRO",
  "message": "Mensagem descritiva do erro",
  "details": {} // Detalhes adicionais (apenas em desenvolvimento)
}
```

### 2.3 Validação de Payload
- Implementado usando Zod
- Validação automática de tipos e formatos
- Mensagens de erro descritivas

## 3. Configuração de CORS

### 3.1 Origens Permitidas
- `http://localhost:3000`
- `https://banban.com.br`
- `*.banban.com.br`

### 3.2 Headers Configurados
- `Access-Control-Allow-Methods`: GET, POST, PUT, DELETE, OPTIONS
- `Access-Control-Allow-Headers`: Content-Type, Authorization, X-Requested-With
- `Access-Control-Max-Age`: 86400 (24 horas)

### 3.3 Comportamento
- Bloqueio automático de origens não permitidas (403 Forbidden)
- Suporte a requisições OPTIONS (preflight)
- Headers CORS adicionados automaticamente às respostas

## 4. Como Usar

### 4.1 Rate Limiting
```typescript
import { withRateLimit } from '@/lib/api/rate-limiter'

const rateLimit = await withRateLimit('standard')
if (!rateLimit.success) {
  throw createError(ErrorType.RATE_LIMIT, 'Muitas requisições')
}
```

### 4.2 Tratamento de Erros
```typescript
import { withErrorHandler, createError } from '@/lib/api/error-handler'

const handler = async (req: Request) => {
  // ... lógica da API ...
}

export const POST = withErrorHandler(handler)
```

### 4.3 CORS
```typescript
import { withCors } from '@/lib/api/cors-config'

export const POST = withCors(withErrorHandler(handler))
```

## 5. Monitoramento

### 5.1 Logs
- Erros são registrados automaticamente
- Detalhes completos em ambiente de desenvolvimento
- Logs sanitizados em produção

### 5.2 Métricas
- Taxa de erros por tipo
- Taxa de bloqueio por rate limiting
- Origens bloqueadas por CORS

## 6. Próximos Passos
1. Implementar monitoramento em tempo real
2. Adicionar blacklist de IPs
3. Configurar alertas automáticos
4. Implementar cache de respostas

## 7. Referências
- [Documentação do Upstash Redis](https://docs.upstash.com/redis)
- [Documentação do Next.js sobre API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Guia de Segurança OWASP](https://owasp.org/www-project-api-security/) 