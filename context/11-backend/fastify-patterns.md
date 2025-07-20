# Backend Architecture Guide

## Fastify Server Structure

### **Main Server Setup**
```typescript
// backend/src/index.ts
import Fastify from 'fastify';
import { registerPlugins } from './plugins';
import { registerRoutes } from './routes';
import { TenantManager } from './shared/tenant-manager';
import { ModuleResolver } from './shared/module-loader';

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Plugin registration order matters
await server.register(registerPlugins);
await server.register(registerRoutes);

// Multi-tenant setup
server.decorate('tenantManager', new TenantManager());
server.decorate('moduleResolver', new ModuleResolver());

await server.listen({ 
  port: process.env.PORT || 4000,
  host: process.env.HOST || '0.0.0.0',
});
```

### **Plugin System**
```typescript
// backend/src/plugins/index.ts
import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

export async function registerPlugins(fastify: FastifyInstance) {
  // Security
  await fastify.register(helmet);
  await fastify.register(cors, {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });
  
  // Rate limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });
  
  // Custom plugins
  await fastify.register(authPlugin);
  await fastify.register(tenantPlugin);
}
```

## Module System Architecture

### **Module Resolver**
```typescript
// backend/src/shared/module-loader/module-resolver.ts
export class ModuleResolver {
  private modules = new Map<string, ModuleInterface>();
  
  async loadModule(slug: string, tenantId: string): Promise<ModuleInterface> {
    const cacheKey = `${tenantId}:${slug}`;
    
    if (this.modules.has(cacheKey)) {
      return this.modules.get(cacheKey)!;
    }
    
    // Resolve module path based on tenant config
    const modulePath = await this.resolveModulePath(slug, tenantId);
    const module = await import(modulePath);
    
    this.modules.set(cacheKey, module.default);
    return module.default;
  }
  
  private async resolveModulePath(slug: string, tenantId: string): Promise<string> {
    // Check for custom implementation first
    const customPath = `./modules/custom/${tenantId}-${slug}`;
    if (await this.moduleExists(customPath)) {
      return customPath;
    }
    
    // Fall back to base module
    return `./modules/base/${slug}-base`;
  }
}
```

### **Base Module Pattern**
```typescript
// backend/src/modules/base/performance-base/index.ts
import { BaseModuleInterface } from '../../types';
import { PerformanceService } from './services/performance-service';
import { performanceSchemas } from './schemas/performance-schemas';

export default class PerformanceModule implements BaseModuleInterface {
  slug = 'performance';
  version = '1.0.0';
  dependencies = [];
  
  private service: PerformanceService;
  
  constructor(tenantId: string) {
    this.service = new PerformanceService(tenantId);
  }
  
  async initialize(): Promise<void> {
    await this.service.initialize();
  }
  
  getRoutes() {
    return [
      {
        method: 'GET',
        url: '/performance/metrics',
        handler: this.getMetrics.bind(this),
        schema: performanceSchemas.getMetrics,
      },
      {
        method: 'POST',
        url: '/performance/record',
        handler: this.recordMetric.bind(this),
        schema: performanceSchemas.recordMetric,
      },
    ];
  }
  
  async getMetrics(request: FastifyRequest, reply: FastifyReply) {
    const metrics = await this.service.getMetrics(request.query);
    return reply.send(metrics);
  }
  
  async recordMetric(request: FastifyRequest, reply: FastifyReply) {
    const result = await this.service.recordMetric(request.body);
    return reply.send(result);
  }
}
```

### **Custom Module Extension**
```typescript
// backend/src/modules/custom/banban-performance/index.ts
import PerformanceModule from '../../base/performance-base';
import { BanbanPerformanceService } from './services/banban-performance-service';

export default class BanbanPerformanceModule extends PerformanceModule {
  slug = 'banban-performance';
  
  constructor(tenantId: string) {
    super(tenantId);
    // Override with Banban-specific service
    this.service = new BanbanPerformanceService(tenantId);
  }
  
  getRoutes() {
    return [
      ...super.getRoutes(),
      // Add Banban-specific routes
      {
        method: 'GET',
        url: '/performance/fashion-metrics',
        handler: this.getFashionMetrics.bind(this),
      },
    ];
  }
  
  async getFashionMetrics(request: FastifyRequest, reply: FastifyReply) {
    const metrics = await this.service.getFashionSpecificMetrics();
    return reply.send(metrics);
  }
}
```

## Webhook System

### **Webhook Base Class**
```typescript
// backend/src/shared/webhook-base/index.ts
export abstract class WebhookBase {
  abstract slug: string;
  abstract version: string;
  
  constructor(protected tenantId: string) {}
  
  abstract validate(payload: any): boolean;
  abstract process(payload: any): Promise<any>;
  
  async handle(request: FastifyRequest, reply: FastifyReply) {
    try {
      // 1. Validate payload
      if (!this.validate(request.body)) {
        return reply.code(400).send({ error: 'Invalid payload' });
      }
      
      // 2. Process webhook
      const result = await this.process(request.body);
      
      // 3. Return success
      return reply.send({ success: true, result });
    } catch (error) {
      // 4. Handle errors
      request.log.error(error);
      return reply.code(500).send({ error: 'Processing failed' });
    }
  }
}
```

### **Webhook Implementation**
```typescript
// backend/src/routes/webhooks/purchase-flow.ts
import { WebhookBase } from '../../shared/webhook-base';
import { z } from 'zod';

const PurchasePayloadSchema = z.object({
  order_id: z.string(),
  items: z.array(z.object({
    sku: z.string(),
    quantity: z.number(),
    price: z.number(),
  })),
  total: z.number(),
  customer_id: z.string(),
});

export class PurchaseFlowWebhook extends WebhookBase {
  slug = 'purchase-flow';
  version = '1.0.0';
  
  validate(payload: any): boolean {
    const result = PurchasePayloadSchema.safeParse(payload);
    return result.success;
  }
  
  async process(payload: any) {
    const purchase = PurchasePayloadSchema.parse(payload);
    
    // Process purchase logic
    await this.updateInventory(purchase.items);
    await this.recordSale(purchase);
    await this.updateMetrics(purchase);
    
    return { processed: true, order_id: purchase.order_id };
  }
  
  private async updateInventory(items: any[]) {
    // Inventory update logic
  }
  
  private async recordSale(purchase: any) {
    // Sales recording logic
  }
  
  private async updateMetrics(purchase: any) {
    // Metrics update logic
  }
}
```

## Multi-Tenant Management

### **Tenant Manager**
```typescript
// backend/src/shared/tenant-manager/tenant-manager.ts
export class TenantManager {
  private tenantConfigs = new Map<string, TenantConfig>();
  
  async resolveTenant(request: FastifyRequest): Promise<string> {
    // Try various resolution methods
    const tenantId = 
      this.resolveTenantFromHeaders(request) ||
      this.resolveTenantFromSubdomain(request) ||
      this.resolveTenantFromAuth(request);
      
    if (!tenantId) {
      throw new Error('Tenant not found');
    }
    
    return tenantId;
  }
  
  async getTenantConfig(tenantId: string): Promise<TenantConfig> {
    if (this.tenantConfigs.has(tenantId)) {
      return this.tenantConfigs.get(tenantId)!;
    }
    
    const config = await this.loadTenantConfig(tenantId);
    this.tenantConfigs.set(tenantId, config);
    return config;
  }
  
  private resolveTenantFromHeaders(request: FastifyRequest): string | null {
    return request.headers['x-tenant-id'] as string || null;
  }
  
  private resolveTenantFromSubdomain(request: FastifyRequest): string | null {
    const host = request.headers.host;
    if (!host) return null;
    
    const subdomain = host.split('.')[0];
    return subdomain !== 'www' ? subdomain : null;
  }
}
```

### **Tenant Plugin**
```typescript
// backend/src/plugins/tenant.ts
import fp from 'fastify-plugin';

export default fp(async function(fastify: FastifyInstance) {
  fastify.decorateRequest('tenantId', '');
  fastify.decorateRequest('tenantConfig', null);
  
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      const tenantId = await fastify.tenantManager.resolveTenant(request);
      const tenantConfig = await fastify.tenantManager.getTenantConfig(tenantId);
      
      request.tenantId = tenantId;
      request.tenantConfig = tenantConfig;
    } catch (error) {
      return reply.code(400).send({ error: 'Invalid tenant' });
    }
  });
});
```

## Route Patterns

### **Versioned API Routes**
```typescript
// backend/src/routes/v1/modules.ts
export default async function moduleRoutes(fastify: FastifyInstance) {
  fastify.register(async function(fastify) {
    // Prefix all routes with /v1/modules
    await fastify.register(async function(fastify) {
      fastify.get('/', listModules);
      fastify.get('/:slug', getModule);
      fastify.post('/', { preHandler: [authRequired] }, createModule);
    }, { prefix: '/v1/modules' });
  });
}

async function listModules(request: FastifyRequest, reply: FastifyReply) {
  const tenantId = request.tenantId;
  const modules = await fastify.moduleResolver.getAvailableModules(tenantId);
  return reply.send(modules);
}
```

### **Webhook Routes**
```typescript
// backend/src/routes/webhooks/index.ts
export default async function webhookRoutes(fastify: FastifyInstance) {
  // Register all webhook handlers
  const webhooks = [
    new PurchaseFlowWebhook(),
    new InventoryFlowWebhook(),
    new SalesFlowWebhook(),
  ];
  
  webhooks.forEach(webhook => {
    fastify.post(`/webhooks/${webhook.slug}`, {
      schema: {
        body: webhook.getSchema?.() || {},
      },
    }, webhook.handle.bind(webhook));
  });
}
```

## Error Handling

### **Global Error Handler**
```typescript
// backend/src/plugins/error-handler.ts
export default fp(async function(fastify: FastifyInstance) {
  fastify.setErrorHandler(async (error, request, reply) => {
    // Log error
    request.log.error(error);
    
    // Handle different error types
    if (error.validation) {
      return reply.code(400).send({
        error: 'Validation failed',
        details: error.validation,
      });
    }
    
    if (error.statusCode === 401) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    
    if (error.statusCode === 403) {
      return reply.code(403).send({ error: 'Forbidden' });
    }
    
    // Generic error
    return reply.code(500).send({ 
      error: 'Internal server error',
      requestId: request.id,
    });
  });
});
```

## Performance Monitoring

### **Metrics Collection**
```typescript
// backend/src/monitoring/metrics-collector.ts
import { MetricsRegistry } from 'prom-client';

export class MetricsCollector {
  private registry = new MetricsRegistry();
  
  constructor() {
    this.setupDefaultMetrics();
  }
  
  private setupDefaultMetrics() {
    // HTTP request duration
    this.httpDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code', 'tenant_id'],
      registers: [this.registry],
    });
    
    // Module load time
    this.moduleLoadTime = new Histogram({
      name: 'module_load_duration_seconds',
      help: 'Module loading duration in seconds',
      labelNames: ['module_slug', 'tenant_id'],
      registers: [this.registry],
    });
  }
  
  recordHttpRequest(duration: number, labels: any) {
    this.httpDuration.observe(labels, duration);
  }
  
  recordModuleLoad(duration: number, labels: any) {
    this.moduleLoadTime.observe(labels, duration);
  }
}
```