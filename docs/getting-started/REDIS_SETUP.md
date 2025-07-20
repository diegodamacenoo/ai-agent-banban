# Configuração do Redis (Upstash) para Rate Limiting

## 📋 **Pré-requisitos**

- Conta no [Upstash](https://console.upstash.com/)
- Projeto Next.js configurado

## 🚀 **Setup Rápido**

### 1. **Criar Database Redis no Upstash**

1. Acesse [Upstash Console](https://console.upstash.com/)
2. Clique em **"Create Database"**
3. Configure:
   - **Name:** `banban-rate-limiting`
   - **Type:** `Regional` (mais barato)
   - **Region:** Escolha a mais próxima (ex: `us-east-1`)
   - **TLS:** Habilitado (recomendado)

### 2. **Obter Credenciais**

Após criar o database, copie:
- **UPSTASH_REDIS_REST_URL**
- **UPSTASH_REDIS_REST_TOKEN**

### 3. **Configurar Variáveis de Ambiente**

Adicione ao seu arquivo `.env.local`:

```env
# Redis Configuration (Upstash)
UPSTASH_REDIS_REST_URL=https://your-database-id.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

### 4. **Testar Configuração**

Execute o projeto e teste uma rota de API:

```bash
npm run dev
```

Teste fazendo múltiplas requisições rapidamente para `/api/auth/login` - deve retornar erro 429 após o limite.

## 📊 **Configurações de Rate Limiting**

### **Limites Atuais:**

- **Autenticação:** 5 tentativas por 15 minutos
- **APIs Gerais:** 100 requests por minuto  
- **Upload:** 10 uploads por hora
- **Chat:** 50 mensagens por hora

### **Personalizar Limites:**

Edite `src/lib/security/rate-limiter.ts`:

```typescript
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // ← Altere aqui
  analytics: true,
  prefix: 'rl:auth',
});
```

## 💰 **Custos Estimados**

### **Plano Free (Upstash):**
- **10.000 requests/dia**
- **Perfeito para desenvolvimento**

### **Plano Pay-as-you-go:**
- **$0.2 por 100k requests**
- **~R$ 25-100/mês em produção**

## 🔧 **Troubleshooting**

### **Erro: "Redis connection failed"**

1. Verifique as variáveis de ambiente
2. Confirme que o database está ativo no Upstash
3. Teste a conexão:

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_DATABASE_ID.upstash.io/ping"
```

### **Rate Limiting não funciona**

1. Verifique se o middleware está ativo
2. Confirme que as rotas estão sendo interceptadas
3. Teste com diferentes IPs

### **Performance Issues**

1. Use Redis regional próximo aos usuários
2. Configure TTL adequado para os limites
3. Monitor uso no dashboard Upstash

## 🔒 **Segurança**

### **Boas Práticas:**

- ✅ Use HTTPS sempre
- ✅ Mantenha tokens em variáveis de ambiente
- ✅ Configure TLS no Redis
- ✅ Monitor logs de acesso
- ✅ Use prefixos diferentes por ambiente

### **Não Faça:**

- ❌ Committar tokens no código
- ❌ Usar HTTP em produção
- ❌ Compartilhar credenciais
- ❌ Desabilitar TLS

## 📈 **Monitoramento**

### **Dashboard Upstash:**
- Requests por segundo
- Latência média
- Uso de memória
- Erros de conexão

### **Logs da Aplicação:**
```typescript
// Ver logs de rate limiting
safeLogger.info('Rate limit status', {
  remaining: result.remaining,
  reset: result.reset,
  success: result.success
});
```

## 🔄 **Alternativas de Desenvolvimento**

### **In-Memory (Sem Redis):**

Para desenvolvimento local sem Redis:

```typescript
// src/lib/security/rate-limiter-dev.ts
const inMemoryStore = new Map();

export const rateLimitWrapper = async (identifier: string, type: string) => {
  // Implementação simples em memória
  const key = `${type}:${identifier}`;
  const now = Date.now();
  
  // Lógica de rate limiting em memória
  // ...
};
```

## 📞 **Suporte**

- **Upstash Docs:** https://docs.upstash.com/
- **Discord Upstash:** https://discord.gg/w9SenAtbme
- **Issues GitHub:** Reporte problemas no repositório

---

**⚠️ Importante:** Configure o Redis antes de fazer deploy em produção. O rate limiting é essencial para segurança da aplicação. 