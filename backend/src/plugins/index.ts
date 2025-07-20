import { FastifyInstance } from 'fastify';
import { config } from '../config/config';
import { createPluginLogger } from '../utils/logger';

/**
 * Registrar todos os plugins do Fastify
 */
export async function registerPlugins(server: FastifyInstance): Promise<void> {
  const logger = createPluginLogger('registration');
  
  try {
    // Plugin de CORS
    if (config.CORS_ORIGIN) {
      await server.register(import('@fastify/cors'), {
        origin: config.CORS_ORIGIN,
        credentials: config.CORS_CREDENTIALS,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          'X-Client-Type',
          'X-Tenant-Id',
          'X-Organization-Name',
          'X-API-Version'
        ]
      });
      logger.info('CORS plugin registered');
    }

    // Plugin de autenticação JWT
    await server.register(import('./auth'));
    logger.info('JWT authentication plugin registered');

    // Plugin de segurança (Helmet)
    if (config.ENABLE_HELMET) {
      await server.register(import('@fastify/helmet'), {
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", 'http://localhost:3000', 'http://localhost:4000', 'https://*.supabase.co'],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            objectSrc: ["'none'"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'"]
          }
        },
        crossOriginEmbedderPolicy: false
      });
      logger.info('Helmet security plugin registered');
    }

    // Plugin de Rate Limiting
    if (config.ENABLE_RATE_LIMIT) {
      await server.register(import('@fastify/rate-limit'), {
        max: config.RATE_LIMIT_MAX,
        timeWindow: config.RATE_LIMIT_WINDOW,
        allowList: ['127.0.0.1', '::1'], // Localhost sempre permitido
        keyGenerator: (request) => {
          // Rate limit por IP + tenant (se disponível)
          const tenantId = request.headers['x-tenant-id'] as string;
          const clientIp = request.ip;
          return tenantId ? `${clientIp}:${tenantId}` : clientIp;
        },
        errorResponseBuilder: (request, context) => {
          return {
            code: 'RATE_LIMIT_EXCEEDED',
            error: 'Rate limit exceeded',
            message: `Too many requests. Limit: ${context.max} requests per window`,
            retryAfter: context.ttl
          };
        }
      });
      logger.info('Rate limiting plugin registered');
    }

    // Plugin de documentação Swagger
    if (config.ENABLE_SWAGGER) {
      // Registrar Swagger
      const fastifySwagger = await import('@fastify/swagger');
      await server.register(fastifySwagger.default, {
        swagger: {
          info: {
            title: 'BanBan AI Agent - Multi-Tenant Backend API',
            description: 'API backend para sistema multi-tenant que suporta clientes customizados e padrão',
            version: '1.0.0',
            contact: {
              name: 'BanBan AI Agent Team',
              email: 'dev@banban.ai'
            },
            license: {
              name: 'MIT',
              url: 'https://opensource.org/licenses/MIT'
            }
          },
          host: `${config.HOST}:${config.PORT}`,
          schemes: ['http', 'https'],
          consumes: ['application/json'],
          produces: ['application/json'],
          tags: [
            { name: 'health', description: 'Health check endpoints' },
            { name: 'info', description: 'Server information endpoints' },
            { name: 'api', description: 'Main API endpoints' },
            { name: 'multi-tenant', description: 'Multi-tenant specific endpoints' },
            { name: 'custom', description: 'Custom client endpoints' },
            { name: 'standard', description: 'Standard SaaS endpoints' }
          ],
          securityDefinitions: {
            Bearer: {
              type: 'apiKey',
              name: 'Authorization',
              in: 'header',
              description: 'Enter: Bearer {token}'
            }
          },
          security: [{ Bearer: [] }]
        }
      });

      // Registrar Swagger UI
      const fastifySwaggerUi = await import('@fastify/swagger-ui');
      await server.register(fastifySwaggerUi.default, {
        routePrefix: '/docs',
        uiConfig: {
          docExpansion: 'list',
          deepLinking: false,
          defaultModelsExpandDepth: 1,
          defaultModelExpandDepth: 1
        },
        staticCSP: true,
        transformStaticCSP: (header) => header,
        transformSpecification: (swaggerObject, request, reply) => {
          return swaggerObject;
        },
        transformSpecificationClone: true
      });
      
      logger.info('Swagger documentation plugin registered');
    }

    // Plugin personalizado para multi-tenant
    await server.register(async function multiTenantPlugin(server) {
      // Decorator para adicionar informações de tenant no request
      server.decorateRequest('tenant', null);
      server.decorateRequest('clientType', null);
      
      // Hook para extrair informações de tenant
      server.addHook('preHandler', async (request, reply) => {
        const tenantId = request.headers['x-tenant-id'] as string;
        const clientType = (request.headers['x-client-type'] as 'custom' | 'standard') || config.DEFAULT_CLIENT_TYPE;
        
        // Adicionar informações ao request
        (request as any).tenant = {
          id: tenantId,
          clientType
        };
        (request as any).clientType = clientType;
        
        // Log da requisição com contexto de tenant
        if (tenantId) {
          request.log.info({
            tenantId,
            clientType,
            method: request.method,
            url: request.url
          }, 'Multi-tenant request');
        }
      });
    });
    
    logger.info('Multi-tenant plugin registered');
    logger.info('All plugins registered successfully');

  } catch (error) {
    logger.error('Error registering plugins:', error);
    throw error;
  }
} 