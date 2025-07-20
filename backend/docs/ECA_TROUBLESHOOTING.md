# Guia de Troubleshooting ECA - Resolução de Problemas

## 📋 Sumário

- [Problemas Comuns](#problemas-comuns)
- [Erros de Estado](#erros-de-estado)
- [Problemas de Integração](#problemas-de-integração)
- [Problemas de Performance](#problemas-de-performance)
- [Problemas de Segurança](#problemas-de-segurança)
- [Problemas de Banco de Dados](#problemas-de-banco-de-dados)
- [Problemas de Cache](#problemas-de-cache)
- [Problemas de Deployment](#problemas-de-deployment)
- [Ferramentas de Diagnóstico](#ferramentas-de-diagnóstico)
- [Logs e Monitoramento](#logs-e-monitoramento)

---

## 🚨 Problemas Comuns

### 1. Erro de Validação de Schema

**Erro:**
```
body/action must be equal to one of the allowed values
```

**Causa:**
- Action enviada não existe no schema
- Formato incorreto (ex: `CREATE_ORDER` em vez de `create_order`)
- Typo no nome da action

**Solução:**
```typescript
// ✅ Correto
{
  "action": "create_order",
  "attributes": {
    "external_id": "ORDER-001",
    "supplier_external_id": "SUPPLIER-001"
  }
}

// ❌ Incorreto
{
  "action": "CREATE_ORDER", // Deve ser snake_case
  "attributes": {
    "external_id": "ORDER-001"
  }
}
```

**Debugging:**
```bash
# Verificar schemas disponíveis
curl -X GET http://localhost:4000/api/v1/debug/schemas

# Verificar actions válidas para um módulo
curl -X GET http://localhost:4000/api/v1/debug/modules/purchase-flow/actions
```

### 2. Erro de Autenticação JWT

**Erro:**
```
{
  "statusCode": 401,
  "code": "FST_JWT_AUTHORIZATION_TOKEN_INVALID",
  "error": "Unauthorized",
  "message": "Authorization token is invalid"
}
```

**Causa:**
- Token ausente ou malformado
- Token expirado
- Secret incorreto

**Solução:**
```bash
# Verificar header de autorização
curl -X POST http://localhost:4000/api/v1/banban/purchase \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"

# Verificar se o token está válido
curl -X GET http://localhost:4000/api/v1/debug/token \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Debugging:**
```typescript
// Verificar token JWT
import jwt from 'jsonwebtoken';

const token = 'YOUR_TOKEN_HERE';
const secret = process.env.WEBHOOK_SECRET;

try {
  const decoded = jwt.verify(token, secret);
  console.log('Token válido:', decoded);
} catch (error) {
  console.error('Token inválido:', error.message);
}
```

### 3. Erro de Tenant não Encontrado

**Erro:**
```
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Tenant not found"
}
```

**Causa:**
- Header `X-Tenant-ID` ausente
- Tenant não existe no sistema
- Problema na resolução de tenant

**Solução:**
```bash
# Incluir header de tenant
curl -X POST http://localhost:4000/api/v1/banban/purchase \
  -H "X-Tenant-ID: banban" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Verificar tenants disponíveis
curl -X GET http://localhost:4000/api/v1/debug/tenants
```

---

## 🔄 Erros de Estado

### 1. Transição de Estado Inválida

**Erro:**
```
Invalid state transition: PENDENTE -> effectuate_cd
```

**Causa:**
- Tentativa de executar action fora da sequência correta
- Estado atual não permite a transição

**Solução:**
```typescript
// Verificar estado atual
const currentState = await getCurrentState('ORDER-001');
console.log('Estado atual:', currentState);

// Verificar transições válidas
const validTransitions = getValidTransitions(currentState);
console.log('Transições válidas:', validTransitions);

// Executar actions na ordem correta
// PENDENTE -> approve_order -> APPROVED
// APPROVED -> register_invoice -> PRE_BAIXA
// PRE_BAIXA -> arrive_at_cd -> AGUARDANDO_CONFERENCIA_CD
```

**Debugging:**
```bash
# Verificar estado atual da transação
curl -X GET "http://localhost:4000/api/v1/banban/purchase?external_id=ORDER-001" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Verificar máquina de estados
curl -X GET "http://localhost:4000/api/v1/debug/state-machine/purchase-flow" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Estado Inconsistente

**Erro:**
```
State machine inconsistency detected
```

**Causa:**
- Corrupção de dados
- Transação parcialmente executada
- Problema de concorrência

**Solução:**
```typescript
// Verificar histórico de estados
const history = await getStateHistory('ORDER-001');
console.log('Histórico de estados:', history);

// Reparar estado se necessário
await repairState('ORDER-001', 'CORRECT_STATE');

// Reprocessar se necessário
await reprocessTransaction('ORDER-001');
```

**Debugging:**
```sql
-- Verificar histórico de estados no banco
SELECT * FROM tenant_business_transactions 
WHERE external_id = 'ORDER-001' 
ORDER BY updated_at DESC;

-- Verificar eventos relacionados
SELECT * FROM business_events 
WHERE aggregate_id = 'ORDER-001' 
ORDER BY timestamp;
```

---

## 🔌 Problemas de Integração

### 1. Erro de Resolução de Entidade

**Erro:**
```
Entity not found: supplier with external_id SUPPLIER-001
```

**Causa:**
- Entidade não existe no sistema
- External ID incorreto
- Problema na resolução de entidade

**Solução:**
```typescript
// Verificar se a entidade existe
const supplier = await entityResolver.resolveSupplier('SUPPLIER-001', 'banban');
if (!supplier) {
  console.log('Supplier não encontrado, criando...');
  await entityResolver.createSupplier({
    external_id: 'SUPPLIER-001',
    name: 'Supplier Name',
    tenant_id: 'banban'
  });
}
```

**Debugging:**
```bash
# Verificar entidades existentes
curl -X GET "http://localhost:4000/api/v1/debug/entities?type=SUPPLIER" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Criar entidade se necessário
curl -X POST "http://localhost:4000/api/v1/debug/entities" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_type": "SUPPLIER",
    "external_id": "SUPPLIER-001",
    "name": "Test Supplier"
  }'
```

### 2. Erro de Webhook Timeout

**Erro:**
```
Request timeout after 30000ms
```

**Causa:**
- Processamento muito lento
- Deadlock no banco de dados
- Problema de rede

**Solução:**
```typescript
// Aumentar timeout se necessário
const config = {
  requestTimeout: 60000, // 60 segundos
  bodyLimit: 1048576,    // 1MB
  connectionTimeout: 10000
};

// Implementar retry mechanism
const maxRetries = 3;
let retryCount = 0;

while (retryCount < maxRetries) {
  try {
    await processWebhook(payload);
    break;
  } catch (error) {
    retryCount++;
    if (retryCount >= maxRetries) {
      throw error;
    }
    await sleep(1000 * retryCount); // Backoff exponencial
  }
}
```

**Debugging:**
```bash
# Verificar logs de performance
curl -X GET "http://localhost:4000/api/v1/debug/performance" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Verificar conexões ativas
curl -X GET "http://localhost:4000/api/v1/debug/connections" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚡ Problemas de Performance

### 1. Consultas Lentas

**Erro:**
```
Query execution time: 5.2s (threshold: 1s)
```

**Causa:**
- Falta de índices
- Query mal otimizada
- Muitos dados sem paginação

**Solução:**
```sql
-- Criar índices necessários
CREATE INDEX IF NOT EXISTS idx_transactions_external_id 
ON tenant_business_transactions(external_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_transactions_status 
ON tenant_business_transactions(status, tenant_id);

-- Analisar query performance
EXPLAIN ANALYZE SELECT * FROM tenant_business_transactions 
WHERE external_id = 'ORDER-001' AND tenant_id = 'banban';
```

**Debugging:**
```bash
# Verificar slow queries
curl -X GET "http://localhost:4000/api/v1/debug/slow-queries" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Verificar índices
curl -X GET "http://localhost:4000/api/v1/debug/indexes" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Memory Leak

**Erro:**
```
Process memory usage: 2.1GB (threshold: 1GB)
```

**Causa:**
- Cache não está sendo limpo
- Event listeners não removidos
- Objetos grandes não coletados

**Solução:**
```typescript
// Configurar limpeza de cache
const cacheConfig = {
  maxAge: 3600000, // 1 hora
  maxSize: 1000,   // 1000 itens
  autoCleanup: true
};

// Implementar cleanup manual
setInterval(() => {
  cache.cleanup();
  global.gc && global.gc(); // Force garbage collection
}, 300000); // 5 minutos

// Monitorar memory usage
const memoryUsage = process.memoryUsage();
console.log('Memory usage:', {
  rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
  heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
  heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB'
});
```

**Debugging:**
```bash
# Verificar memory usage
curl -X GET "http://localhost:4000/api/v1/debug/memory" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Força garbage collection
curl -X POST "http://localhost:4000/api/v1/debug/gc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔒 Problemas de Segurança

### 1. Acesso Negado

**Erro:**
```
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

**Causa:**
- Usuário não tem permissão necessária
- Tentativa de acesso cross-tenant
- Token com escopo limitado

**Solução:**
```typescript
// Verificar permissões do usuário
const userPermissions = await getUserPermissions(userId);
console.log('Permissões:', userPermissions);

// Verificar se tem permissão específica
const hasPermission = userPermissions.includes('orders:create');
if (!hasPermission) {
  throw new ForbiddenError('Permission denied: orders:create');
}

// Verificar tenant correto
if (order.tenant_id !== user.tenant_id) {
  throw new ForbiddenError('Cross-tenant access denied');
}
```

**Debugging:**
```bash
# Verificar permissões do token
curl -X GET "http://localhost:4000/api/v1/debug/permissions" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Verificar usuário atual
curl -X GET "http://localhost:4000/api/v1/debug/user" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Rate Limit Exceeded

**Erro:**
```
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded"
}
```

**Causa:**
- Muitas requisições em pouco tempo
- Ataque de força bruta
- Loop infinito no cliente

**Solução:**
```typescript
// Implementar backoff exponencial
const maxRetries = 3;
let retryCount = 0;

while (retryCount < maxRetries) {
  try {
    const response = await makeRequest();
    return response;
  } catch (error) {
    if (error.statusCode === 429) {
      const retryAfter = error.headers['retry-after'] || (2 ** retryCount);
      await sleep(retryAfter * 1000);
      retryCount++;
    } else {
      throw error;
    }
  }
}
```

**Debugging:**
```bash
# Verificar rate limit status
curl -X GET "http://localhost:4000/api/v1/debug/rate-limit" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Reset rate limit (admin only)
curl -X POST "http://localhost:4000/api/v1/debug/rate-limit/reset" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 🗄️ Problemas de Banco de Dados

### 1. Conexão Perdida

**Erro:**
```
Connection lost: The server closed the connection
```

**Causa:**
- Problemas de rede
- Timeout de conexão
- Servidor de banco sobrecarregado

**Solução:**
```typescript
// Configurar reconnection
const dbConfig = {
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 60000,
    idleTimeoutMillis: 600000
  },
  reconnect: true,
  maxRetries: 3
};

// Implementar retry para queries
const executeWithRetry = async (query: string, params: any[] = []) => {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      return await db.query(query, params);
    } catch (error) {
      if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        retryCount++;
        if (retryCount >= maxRetries) throw error;
        await sleep(1000 * retryCount);
      } else {
        throw error;
      }
    }
  }
};
```

**Debugging:**
```bash
# Verificar status da conexão
curl -X GET "http://localhost:4000/api/v1/debug/database/status" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Verificar pool de conexões
curl -X GET "http://localhost:4000/api/v1/debug/database/pool" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Deadlock Detectado

**Erro:**
```
deadlock detected
```

**Causa:**
- Múltiplas transações travando recursos
- Ordem inconsistente de lock
- Transações muito longas

**Solução:**
```typescript
// Implementar retry para deadlocks
const executeTransaction = async (callback: () => Promise<void>) => {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    const transaction = await db.beginTransaction();
    
    try {
      await callback();
      await transaction.commit();
      return;
    } catch (error) {
      await transaction.rollback();
      
      if (error.code === '40P01') { // Deadlock
        retryCount++;
        if (retryCount >= maxRetries) throw error;
        await sleep(Math.random() * 1000); // Random delay
      } else {
        throw error;
      }
    }
  }
};

// Usar ordem consistente de locks
const lockOrder = ['suppliers', 'products', 'orders'];
for (const table of lockOrder) {
  await db.query(`LOCK TABLE ${table} IN SHARE MODE`);
}
```

**Debugging:**
```sql
-- Verificar locks ativos
SELECT * FROM pg_locks WHERE NOT granted;

-- Verificar transações longas
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

---

## 📦 Problemas de Cache

### 1. Cache Miss Alto

**Erro:**
```
Cache hit rate: 15% (threshold: 80%)
```

**Causa:**
- TTL muito baixo
- Chaves de cache incorretas
- Invalidação prematura

**Solução:**
```typescript
// Otimizar TTL
const cacheConfig = {
  default: 3600,      // 1 hora
  entities: 7200,     // 2 horas
  static: 86400,      // 24 horas
  dynamic: 300        // 5 minutos
};

// Implementar cache warming
const warmupCache = async () => {
  const popularEntities = await getPopularEntities();
  
  for (const entity of popularEntities) {
    await cache.set(
      `entity:${entity.id}`,
      entity,
      cacheConfig.entities
    );
  }
};

// Implementar cache hierarchy
const getCachedEntity = async (id: string) => {
  // L1: Memory cache
  let entity = memoryCache.get(`entity:${id}`);
  if (entity) return entity;
  
  // L2: Redis cache
  entity = await redisCache.get(`entity:${id}`);
  if (entity) {
    memoryCache.set(`entity:${id}`, entity, 60); // 1 minuto
    return entity;
  }
  
  // L3: Database
  entity = await database.findById(id);
  if (entity) {
    await redisCache.set(`entity:${id}`, entity, 3600); // 1 hora
    memoryCache.set(`entity:${id}`, entity, 60); // 1 minuto
  }
  
  return entity;
};
```

**Debugging:**
```bash
# Verificar cache statistics
curl -X GET "http://localhost:4000/api/v1/debug/cache/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Verificar cache keys
curl -X GET "http://localhost:4000/api/v1/debug/cache/keys" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Cache Inconsistente

**Erro:**
```
Cache data inconsistent with database
```

**Causa:**
- Invalidação não funcionando
- Updates bypassing cache
- Problemas de concorrência

**Solução:**
```typescript
// Implementar cache-aside pattern
const updateEntity = async (id: string, data: any) => {
  // 1. Update database
  await database.update(id, data);
  
  // 2. Invalidate cache
  await cache.del(`entity:${id}`);
  
  // 3. Warm cache (optional)
  const updated = await database.findById(id);
  await cache.set(`entity:${id}`, updated, 3600);
};

// Implementar write-through pattern
const writeThrough = async (id: string, data: any) => {
  // 1. Update database and cache atomically
  await Promise.all([
    database.update(id, data),
    cache.set(`entity:${id}`, data, 3600)
  ]);
};

// Implementar cache versioning
const versionedCache = {
  async get(key: string) {
    const cached = await cache.get(key);
    if (cached && cached.version === CURRENT_VERSION) {
      return cached.data;
    }
    return null;
  },
  
  async set(key: string, data: any, ttl: number) {
    await cache.set(key, {
      data,
      version: CURRENT_VERSION,
      timestamp: Date.now()
    }, ttl);
  }
};
```

**Debugging:**
```bash
# Flush cache
curl -X POST "http://localhost:4000/api/v1/debug/cache/flush" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Verificar cache consistency
curl -X GET "http://localhost:4000/api/v1/debug/cache/consistency" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🚀 Problemas de Deployment

### 1. Container não Inicia

**Erro:**
```
Container exited with code 1
```

**Causa:**
- Variáveis de ambiente faltando
- Portas não disponíveis
- Dependências não instaladas

**Solução:**
```bash
# Verificar logs do container
docker logs container-name

# Verificar variáveis de ambiente
docker exec container-name env

# Verificar portas
docker port container-name

# Verificar recursos
docker stats container-name
```

**Debugging:**
```dockerfile
# Adicionar health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Adicionar debug information
RUN echo "Node version: $(node --version)" && \
    echo "NPM version: $(npm --version)" && \
    echo "OS: $(uname -a)"
```

### 2. Falha no Health Check

**Erro:**
```
Health check failed: timeout
```

**Causa:**
- Aplicação não responde
- Dependências indisponíveis
- Recursos insuficientes

**Solução:**
```typescript
// Implementar health check robusto
const healthCheck = async () => {
  const checks = {
    database: await checkDatabase(),
    cache: await checkCache(),
    memory: checkMemory(),
    disk: await checkDisk()
  };
  
  const healthy = Object.values(checks).every(check => check.healthy);
  
  return {
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks
  };
};

const checkDatabase = async () => {
  try {
    await db.query('SELECT 1');
    return { healthy: true, message: 'Database OK' };
  } catch (error) {
    return { healthy: false, message: error.message };
  }
};

const checkMemory = () => {
  const usage = process.memoryUsage();
  const threshold = 1024 * 1024 * 1024; // 1GB
  
  return {
    healthy: usage.heapUsed < threshold,
    message: `Memory usage: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    details: usage
  };
};
```

**Debugging:**
```bash
# Verificar health check manualmente
curl -X GET "http://localhost:4000/health"

# Verificar dependências
curl -X GET "http://localhost:4000/health/dependencies"

# Verificar recursos
curl -X GET "http://localhost:4000/health/resources"
```

---

## 🔧 Ferramentas de Diagnóstico

### 1. Debug Endpoints

```typescript
// Debug endpoints para diagnóstico
app.get('/api/v1/debug/info', async (request, reply) => {
  return {
    version: process.env.npm_package_version,
    nodeVersion: process.version,
    platform: process.platform,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV
  };
});

app.get('/api/v1/debug/modules', async (request, reply) => {
  const modules = await moduleResolver.getLoadedModules();
  return modules.map(m => ({
    name: m.name,
    version: m.version,
    status: m.status,
    health: await m.health()
  }));
});

app.get('/api/v1/debug/database', async (request, reply) => {
  const stats = await database.getStats();
  return {
    connections: stats.connections,
    queries: stats.queries,
    slowQueries: stats.slowQueries,
    errors: stats.errors
  };
});
```

### 2. Profiling

```typescript
// CPU profiling
const startProfiling = () => {
  const profiler = require('v8-profiler-next');
  profiler.startProfiling('CPU Profile');
  
  setTimeout(() => {
    const profile = profiler.stopProfiling();
    profile.export((error, result) => {
      if (!error) {
        require('fs').writeFileSync('./profile.cpuprofile', result);
      }
    });
  }, 30000); // 30 segundos
};

// Memory profiling
const takeHeapSnapshot = () => {
  const profiler = require('v8-profiler-next');
  const snapshot = profiler.takeSnapshot();
  
  snapshot.export((error, result) => {
    if (!error) {
      require('fs').writeFileSync('./heap.heapsnapshot', result);
    }
  });
};
```

### 3. Monitoring Dashboard

```typescript
// Endpoint para métricas em tempo real
app.get('/api/v1/debug/metrics', async (request, reply) => {
  const metrics = await metricsCollector.collect();
  return {
    timestamp: new Date().toISOString(),
    metrics: {
      requests: metrics.httpRequests,
      errors: metrics.errors,
      latency: metrics.latency,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  };
});

// WebSocket para métricas em tempo real
app.register(websocket);

app.get('/api/v1/debug/metrics/stream', { websocket: true }, (connection) => {
  const interval = setInterval(async () => {
    const metrics = await metricsCollector.collect();
    connection.send(JSON.stringify(metrics));
  }, 1000);
  
  connection.on('close', () => {
    clearInterval(interval);
  });
});
```

---

## 📊 Logs e Monitoramento

### 1. Structured Logging

```typescript
// Logger estruturado para debugging
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
    log: (object) => {
      const { req, res, err, ...rest } = object;
      return {
        ...rest,
        request: req ? {
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: req.body
        } : undefined,
        response: res ? {
          statusCode: res.statusCode,
          headers: res.headers
        } : undefined,
        error: err ? {
          name: err.name,
          message: err.message,
          stack: err.stack
        } : undefined
      };
    }
  }
});

// Exemplo de uso
logger.info('Processing order', {
  orderId: 'ORDER-001',
  tenantId: 'banban',
  action: 'create_order',
  correlationId: 'abc-123'
});
```

### 2. Error Tracking

```typescript
// Error tracking com contexto
const trackError = (error: Error, context: any) => {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version
  };
  
  // Log local
  logger.error('Error tracked', errorInfo);
  
  // Enviar para serviço de tracking (Sentry, etc.)
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
      tags: {
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version
      }
    });
  }
};
```

### 3. Performance Monitoring

```typescript
// Performance monitoring
const performanceMonitor = (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function (...args: any[]) {
    const start = Date.now();
    const methodName = `${target.constructor.name}.${propertyName}`;
    
    try {
      const result = await originalMethod.apply(this, args);
      const duration = Date.now() - start;
      
      // Log performance
      logger.debug('Method execution', {
        method: methodName,
        duration,
        args: args.length
      });
      
      // Alerta se muito lento
      if (duration > 1000) {
        logger.warn('Slow method execution', {
          method: methodName,
          duration,
          threshold: 1000
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      logger.error('Method execution failed', {
        method: methodName,
        duration,
        error: error.message
      });
      
      throw error;
    }
  };
};

// Uso do decorator
class OrderService {
  @performanceMonitor
  async createOrder(data: CreateOrderDto): Promise<Order> {
    // Implementação...
  }
}
```

---

## 📖 Conclusão

Este guia de troubleshooting fornece soluções para os problemas mais comuns encontrados em implementações ECA. Para problemas não cobertos aqui:

1. **Consulte os logs** estruturados do sistema
2. **Use as ferramentas de debug** disponíveis
3. **Verifique as métricas** de performance
4. **Analise o health check** de dependências
5. **Consulte a documentação** específica do módulo

### Ferramentas Essenciais

- **Logs**: Pino, Winston
- **Métricas**: Prometheus, Grafana
- **APM**: New Relic, Datadog
- **Error Tracking**: Sentry, Rollbar
- **Database**: PgAdmin, DataGrip
- **Cache**: Redis CLI, RedisInsight
- **Profiling**: Clinic.js, 0x

### Contatos de Suporte

- **Desenvolvimento**: dev@banban.com
- **Infraestrutura**: infra@banban.com
- **Urgências**: oncall@banban.com

---

**Versão**: 1.0  
**Última atualização**: 2025-07-09  
**Autor**: Equipe de Arquitetura ECA  
**Revisão**: Equipe de Desenvolvimento Backend