import dotenv from 'dotenv';
dotenv.config();

import Fastify, { FastifyInstance } from 'fastify';
import { config } from './config/config';
import { registerPlugins } from './plugins/index';
import { registerRoutes } from './routes/index';
import { logger } from './utils/logger';
import { MetricsCollector } from './monitoring/metrics-collector';
import { ModuleResolver } from './shared/module-loader/module-resolver';
import { TenantManager } from './shared/tenant-manager/tenant-manager';

/**
 * Servidor Fastify Multi-Tenant para BanBan AI Agent
 * Suporta clientes customizados e padrão
 */
async function buildServer(): Promise<FastifyInstance> {
  console.log('🔧 Building Fastify server...');
  
  const server = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      transport: config.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      } : undefined
    },
    trustProxy: true,
    bodyLimit: 10485760, // 10MB
    keepAliveTimeout: 30000,
    connectionTimeout: 0
  });

  console.log('✅ Fastify instance created');

  // Registrar plugins
  await registerPlugins(server);
  console.log('✅ Plugins registered');

  // Inicializar sistema de métricas
  const metricsCollector = new MetricsCollector(server);
  (server as any).metricsCollector = metricsCollector;
  console.log('✅ Metrics system initialized');

  // Inicializar sistema de módulos multi-tenant
  const moduleResolver = new ModuleResolver();
  const tenantManager = new TenantManager();
  (server as any).moduleResolver = moduleResolver;
  (server as any).tenantManager = tenantManager;
  console.log('✅ Multi-tenant module system initialized');

  // Registrar hook para resolver tenant e módulos
  server.addHook('preHandler', async (request, reply) => {
    const tenantInfo = await tenantManager.resolveTenant(request);
    
    if (tenantInfo) {
      // Resolver módulos específicos para este tenant
      try {
        const modules = await moduleResolver.resolveModulesForTenant(tenantInfo.id);
        
        // Anexar informações à requisição
        (request as any).tenant = tenantInfo;
        (request as any).tenantModules = modules;
        (request as any).clientType = tenantInfo.clientType;
        
        logger.debug('Tenant and modules resolved', {
          tenantId: tenantInfo.id,
          clientType: tenantInfo.clientType,
          moduleCount: Object.keys(modules).length
        });
      } catch (error) {
        logger.error('Failed to resolve modules for tenant:', error);
        // Continuar sem módulos específicos
        (request as any).tenant = tenantInfo;
        (request as any).tenantModules = {};
        (request as any).clientType = tenantInfo.clientType;
      }
    }
  });
  console.log('✅ Multi-tenant hooks registered');

  // Registrar módulos customizados BanBan ANTES das rotas dinâmicas
  server.register(async function banbanModules(server) {
    const banbanModules = await moduleResolver.resolveModulesForTenant('banban-org-id');
    
    if (banbanModules.performance) {
      await banbanModules.performance.register(server);
      console.log('✅ BanBan Performance custom module registered');
      console.log('🎯 BanBan Performance endpoints:', banbanModules.performance.getModuleInfo().endpoints);
    }
    
    if (banbanModules.purchaseFlow) {
      await banbanModules.purchaseFlow.register(server);
      console.log('✅ BanBan Purchase Flow module registered');
      console.log('🎯 BanBan Purchase Flow endpoints:', banbanModules.purchaseFlow.getModuleInfo().endpoints);
    }
    
    if (banbanModules.inventoryFlow) {
      await banbanModules.inventoryFlow.register(server);
      console.log('✅ BanBan Inventory Flow module registered');
      console.log('🎯 BanBan Inventory Flow endpoints:', banbanModules.inventoryFlow.getModuleInfo().endpoints);
    }
    
    if (banbanModules.salesFlow) {
      await banbanModules.salesFlow.register(server);
      console.log('✅ BanBan Sales Flow module registered');
      console.log('🎯 BanBan Sales Flow endpoints:', banbanModules.salesFlow.getModuleInfo().endpoints);
    }
    
    if (banbanModules.transferFlow) {
      await banbanModules.transferFlow.register(server);
      console.log('✅ BanBan Transfer Flow module registered');
      console.log('🎯 BanBan Transfer Flow endpoints:', banbanModules.transferFlow.getModuleInfo().endpoints);
    }
  });

  // Registrar rotas dinâmicas para módulos
  server.register(async function dynamicModuleRoutes(server) {
    // Rota genérica para módulos: /api/modules/:module/*
    server.get('/api/modules/:module/*', async (request, reply) => {
      const { module } = request.params as { module: string };
      const tenantModules = (request as any).tenantModules;
      const tenant = (request as any).tenant;
      
      if (!tenantModules || !tenantModules[module]) {
        return reply.code(404).send({ 
          error: 'Module not found',
          message: `Module '${module}' not available for this tenant`,
          tenant: tenant?.id || 'unknown'
        });
      }
      
      // Executar o módulo específico do tenant
      return tenantModules[module].handleRequest(request, reply);
    });

    // Rota para listar módulos disponíveis do tenant
    server.get('/api/modules', async (request, reply) => {
      const tenantModules = (request as any).tenantModules;
      const tenant = (request as any).tenant;
      
      if (!tenantModules) {
        return reply.code(404).send({
          error: 'No modules available',
          tenant: tenant?.id || 'unknown'
        });
      }

      const moduleList = Object.keys(tenantModules).map(moduleName => {
        const moduleInstance = tenantModules[moduleName];
        return {
          name: moduleName,
          ...moduleInstance.getModuleInfo()
        };
      });

      return {
        success: true,
        tenant: {
          id: tenant?.id,
          name: tenant?.name,
          clientType: tenant?.clientType
        },
        modules: moduleList,
        totalModules: moduleList.length
      };
    });
  });
  console.log('✅ Dynamic module routes registered');

  // AIDEV-TODO: O registro do módulo de performance base foi desativado pois o 'standard-client-id' foi removido.
  //             Se for necessário para testes, reativar com um tenant válido.
  // server.register(async function performanceModule(server) {
  //   const performanceModule = await moduleResolver.resolveModulesForTenant('standard-client-id');
  //   if (performanceModule.performance) {
  //     await performanceModule.performance.register(server, '/api/performance');
  //     console.log('✅ Performance base module registered at /api/performance');
  //   }
  // });


  // Registrar rotas estáticas
  await registerRoutes(server);
  console.log('✅ Static routes registered');

  // Health check endpoint
  server.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            environment: { type: 'string' },
            version: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.NODE_ENV,
      version: '1.0.0'
    };
  });

  // Endpoint de informações do servidor
  server.get('/info', {
    schema: {
      description: 'Server information endpoint',
      tags: ['info'],
      response: {
        200: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            version: { type: 'string' },
            environment: { type: 'string' },
            features: {
              type: 'array',
              items: { type: 'string' }
            },
            endpoints: {
              type: 'object',
              properties: {
                health: { type: 'string' },
                docs: { type: 'string' },
                api: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    return {
      name: 'Axon - Multi-Tenant AI Agents Platform',
      version: '1.0.0',
      environment: config.NODE_ENV,
      features: [
        'Multi-tenant routing',
        'Custom client support',
        'Modular AI agents',
        'API documentation',
        'Rate limiting',
        'CORS support',
        'Security headers'
      ],
      endpoints: {
        health: '/health',
        docs: '/docs',
        api: '/api'
      }
    };
  });

  // Handler global de erro para respostas JSON amigáveis
  server.setErrorHandler((error, request, reply) => {
    server.log.error(error);
    // Se for erro de validação Fastify
    if (error.validation && error.validation.length > 0) {
      const messages = error.validation.map(v => v.message).join('; ');
      return reply.status(400).send({
        success: false,
        error: {
          type: error.code || 'FST_ERR_VALIDATION',
          message: `Erro de validação: ${messages}`,
          timestamp: new Date().toISOString(),
          details: error.validation
        }
      });
    }
    // Se o erro for string, converta para objeto
    const message = typeof error === 'string' ? error : (error.message || 'Erro interno do servidor');
    reply.status(error.statusCode || 500).send({
      success: false,
      error: {
        type: error.code || 'INTERNAL_ERROR',
        message,
        timestamp: new Date().toISOString(),
        details: error.validation || undefined
      }
    });
  });

  // Handler para rotas não encontradas (404)
  server.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: {
        type: 'NOT_FOUND',
        message: `Endpoint não encontrado: ${request.url}`,
        timestamp: new Date().toISOString()
      }
    });
  });

  return server;
}

/**
 * Iniciar o servidor
 */
async function start(): Promise<void> {
  try {
    console.log('🚀 Starting server...');
    console.log('📋 Config:', {
      PORT: config.PORT,
      HOST: config.HOST,
      NODE_ENV: config.NODE_ENV,
      LOG_LEVEL: config.LOG_LEVEL
    });
    
    const server = await buildServer();
    console.log('✅ Server built successfully');
    
    // Registrar handler para graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      try {
        await server.close();
        logger.info('Server closed successfully');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    console.log(`🔌 Attempting to listen on ${config.HOST}:${config.PORT}...`);
    
    // Iniciar servidor
    await server.listen({
      port: config.PORT,
      host: config.HOST
    });

    console.log('✅ Server is listening successfully!');
    logger.info(`🚀 Server running at http://${config.HOST}:${config.PORT}`);
    logger.info(`📚 API Documentation available at http://${config.HOST}:${config.PORT}/docs`);
    logger.info(`💚 Health check at http://${config.HOST}:${config.PORT}/health`);
    logger.info(`ℹ️  Server info at http://${config.HOST}:${config.PORT}/info`);

  } catch (error) {
    logger.error('Error starting server:', error);
    console.error('❌ Detailed error:', error);
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    process.exit(1);
  }
}

// Iniciar servidor se executado diretamente
if (require.main === module) {
  start();
}

export { buildServer, start }; 