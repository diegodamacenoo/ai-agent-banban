import { FastifyInstance } from 'fastify';
import { config } from '../../config/config';

export async function coreV1Routes(server: FastifyInstance) {
  const logger = server.log.child({ module: 'core-v1-routes' });

  // Rota de teste básica com informações de tenant
  server.get('/test', {
    schema: {
      description: 'Test endpoint with tenant information',
      tags: ['api', 'v1'],
      headers: {
        type: 'object',
        properties: {
          'x-tenant-id': { type: 'string' },
          'x-client-type': { type: 'string' },
          'x-organization-name': { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            timestamp: { type: 'string' },
            clientType: { type: 'string' },
            tenantId: { type: 'string' },
            organizationName: { type: 'string' },
            backendType: { type: 'string' },
            headers: { type: 'object' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const tenant = (request as any).tenant;
    const clientType = (request as any).clientType;
    const headers = request.headers;
    
    logger.info('Test endpoint called', {
      tenantId: tenant?.id,
      clientType,
      organizationName: headers['x-organization-name'],
      userAgent: headers['user-agent']
    });
    
    return {
      message: 'Backend API is working! 🚀 (v1)',
      timestamp: new Date().toISOString(),
      clientType: clientType || 'unknown',
      tenantId: tenant?.id || headers['x-tenant-id'] || 'no-tenant',
      organizationName: headers['x-organization-name'] || 'unknown',
      backendType: 'custom-fastify',
      headers: {
        'x-tenant-id': headers['x-tenant-id'],
        'x-client-type': headers['x-client-type'],
        'x-organization-name': headers['x-organization-name']
      }
    };
  });

  // Rota específica para clientes customizados
  server.get('/custom/info', {
    schema: {
      description: 'Custom client information endpoint',
      tags: ['custom', 'v1'],
      headers: {
        type: 'object',
        properties: {
          'x-tenant-id': { type: 'string' },
          'x-client-type': { type: 'string', enum: ['custom'] },
          'x-organization-name': { type: 'string' }
        },
        required: ['x-tenant-id', 'x-client-type']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            tenantId: { type: 'string' },
            organizationName: { type: 'string' },
            features: {
              type: 'array',
              items: { type: 'string' }
            },
            customEndpoints: {
              type: 'array',
              items: { type: 'string' }
            },
            backendInfo: { type: 'object' }
          }
        }
      }
    },
    preHandler: async (request, reply) => {
      const clientType = request.headers['x-client-type'];
      if (clientType !== 'custom') {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'This endpoint is only available for custom clients'
        });
      }
    }
  }, async (request, reply) => {
    const tenant = (request as any).tenant;
    const headers = request.headers;
    
    logger.info('Custom info endpoint called', {
      tenantId: tenant?.id,
      organizationName: headers['x-organization-name']
    });
    
    return {
      type: 'custom',
      tenantId: tenant?.id || headers['x-tenant-id'] || 'unknown',
      organizationName: headers['x-organization-name'] || 'unknown',
      features: [
        'Custom modules',
        'Dedicated backend',
        'Personalized UI',
        'Advanced analytics',
        'Custom integrations',
        'Priority support'
      ],
      customEndpoints: [
        '/api/v1/custom/modules',
        '/api/v1/custom/config',
        '/api/v1/custom/analytics',
        '/api/v1/custom/integrations'
      ],
      backendInfo: {
        server: 'Fastify',
        version: '1.0.0',
        environment: config.NODE_ENV,
        port: config.PORT
      }
    };
  });

  // Rota específica para clientes padrão
  server.get('/standard/info', {
    schema: {
      description: 'Standard client information endpoint',
      tags: ['standard', 'v1'],
      response: {
        200: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            features: {
              type: 'array',
              items: { type: 'string' }
            },
            availableModules: {
              type: 'array',
              items: { type: 'string' }
            },
            note: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    logger.info('Standard info endpoint called');
    
    return {
      type: 'standard',
      features: [
        'Standard modules',
        'Shared infrastructure',
        'Standard UI',
        'Basic analytics',
        'Community support'
      ],
      availableModules: [
        'analytics',
        'reports',
        'dashboard',
        'notifications',
        'alerts'
      ],
      note: 'This endpoint would typically be handled by Next.js API routes for standard clients'
    };
  });

  // Rota de roteamento dinâmico
  server.get('/route/:module/:endpoint', {
    schema: {
      description: 'Dynamic routing endpoint for testing',
      tags: ['multi-tenant', 'v1'],
      params: {
        type: 'object',
        properties: {
          module: { type: 'string' },
          endpoint: { type: 'string' }
        },
        required: ['module', 'endpoint']
      },
      headers: {
        type: 'object',
        properties: {
          'x-tenant-id': { type: 'string' },
          'x-client-type': { type: 'string' },
          'x-organization-name': { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            routed: { type: 'boolean' },
            clientType: { type: 'string' },
            tenantId: { type: 'string' },
            organizationName: { type: 'string' },
            module: { type: 'string' },
            endpoint: { type: 'string' },
            message: { type: 'string' },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { module, endpoint } = request.params as { module: string; endpoint: string };
    const clientType = (request as any).clientType;
    const tenant = (request as any).tenant;
    const headers = request.headers;
    
    logger.info('Dynamic routing called', {
      module,
      endpoint,
      clientType,
      tenantId: tenant?.id,
      organizationName: headers['x-organization-name']
    });
    
    // Simular roteamento baseado no tipo de cliente
    if (clientType === 'custom') {
      return {
        routed: true,
        clientType,
        tenantId: tenant?.id || headers['x-tenant-id'] || 'unknown',
        organizationName: headers['x-organization-name'] || 'unknown',
        module,
        endpoint,
        message: `✅ Successfully routed to custom backend! Module: ${module}, Endpoint: ${endpoint} (v1)`,
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        routed: true,
        clientType,
        tenantId: tenant?.id || 'standard-client',
        organizationName: headers['x-organization-name'] || 'standard-org',
        module,
        endpoint,
        message: `✅ Successfully routed to standard module! Module: ${module}, Endpoint: ${endpoint} (v1)`,
        timestamp: new Date().toISOString()
      };
    }
  });

  // Nova rota para testar integração end-to-end
  server.get('/integration/test', {
    schema: {
      description: 'Integration test endpoint',
      tags: ['integration', 'v1'],
      headers: {
        type: 'object',
        properties: {
          'x-tenant-id': { type: 'string' },
          'x-client-type': { type: 'string' },
          'x-organization-name': { type: 'string' },
          'authorization': { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            integration: { type: 'object' },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const tenant = (request as any).tenant;
    const clientType = (request as any).clientType;
    const headers = request.headers;
    
    const integrationResult = {
      success: true,
      message: '🎉 End-to-end integration working perfectly! (v1)',
      integration: {
        frontend: 'Next.js APIRouter',
        backend: 'Fastify Multi-Tenant',
        authentication: headers.authorization ? 'Bearer token present' : 'No auth token',
        tenantDetection: tenant?.id ? 'Success' : 'Fallback to headers',
        clientTypeDetection: clientType || headers['x-client-type'] || 'unknown',
        organizationName: headers['x-organization-name'] || 'unknown',
        backendPort: config.PORT,
        environment: config.NODE_ENV
      },
      timestamp: new Date().toISOString()
    };
    
    logger.info('Integration test successful', integrationResult.integration);
    
    return integrationResult;
  });
}
