import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ErrorHandler, NotFoundError } from '../../shared/errors/v2';

/**
 * Rotas REST para business flows
 * Abstração dos flows ECA em formato REST
 */
export async function businessFlowRoutes(server: FastifyInstance) {
  // Health check para flows
  server.get('/health', {
    schema: {
      description: 'Health check para business flows',
      tags: ['Flows', 'Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            flows: {
              type: 'object',
              properties: {
                purchase: { type: 'string' },
                inventory: { type: 'string' },
                sales: { type: 'string' },
                transfer: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      flows: {
        purchase: 'available',
        inventory: 'available', 
        sales: 'available',
        transfer: 'available'
      }
    };
  });

  // Listar flows disponíveis
  server.get('/list', {
    schema: {
      description: 'Lista todos os business flows disponíveis',
      tags: ['Flows'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            flows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  status: { type: 'string' },
                  endpoints: {
                    type: 'object',
                    properties: {
                      webhook: { type: 'string' },
                      rest: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      return reply.send({
        success: true,
        flows: [
          {
            id: 'purchase-flow',
            name: 'Purchase Flow',
            description: 'Fluxo de compras - do pedido à efetivação',
            status: 'active',
            endpoints: {
              webhook: '/api/webhooks/banban/purchase',
              rest: '/api/flows/purchase'
            }
          },
          {
            id: 'inventory-flow',
            name: 'Inventory Flow',
            description: 'Fluxo de inventário - ajustes e contagens',
            status: 'active',
            endpoints: {
              webhook: '/api/webhooks/banban/inventory',
              rest: '/api/flows/inventory'
            }
          },
          {
            id: 'sales-flow',
            name: 'Sales Flow',
            description: 'Fluxo de vendas - processamento e conclusão',
            status: 'active',
            endpoints: {
              webhook: '/api/webhooks/banban/sales',
              rest: '/api/flows/sales'
            }
          },
          {
            id: 'transfer-flow',
            name: 'Transfer Flow',
            description: 'Fluxo de transferências - entre lojas/CDs',
            status: 'active',
            endpoints: {
              webhook: '/api/webhooks/banban/transfer',
              rest: '/api/flows/transfer'
            }
          }
        ]
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Placeholder para rotas específicas de flows (serão implementadas nas próximas fases)
  server.get('/purchase/:id?', async (request: FastifyRequest<{ Params: { id?: string } }>, reply: FastifyReply) => {
    return reply.code(404).send({
      success: false,
      error: {
        type: 'NotFoundError',
        message: 'Purchase flow REST endpoints not implemented yet. Use webhook endpoint: /api/webhooks/banban/purchase',
        timestamp: new Date().toISOString()
      }
    });
  });

  server.get('/inventory/:id?', async (request: FastifyRequest<{ Params: { id?: string } }>, reply: FastifyReply) => {
    return reply.code(404).send({
      success: false,
      error: {
        type: 'NotFoundError',
        message: 'Inventory flow REST endpoints not implemented yet. Use webhook endpoint: /api/webhooks/banban/inventory',
        timestamp: new Date().toISOString()
      }
    });
  });

  server.get('/sales/:id?', async (request: FastifyRequest<{ Params: { id?: string } }>, reply: FastifyReply) => {
    return reply.code(404).send({
      success: false,
      error: {
        type: 'NotFoundError',
        message: 'Sales flow REST endpoints not implemented yet. Use webhook endpoint: /api/webhooks/banban/sales',
        timestamp: new Date().toISOString()
      }
    });
  });

  server.get('/transfer/:id?', async (request: FastifyRequest<{ Params: { id?: string } }>, reply: FastifyReply) => {
    return reply.code(404).send({
      success: false,
      error: {
        type: 'NotFoundError',
        message: 'Transfer flow REST endpoints not implemented yet. Use webhook endpoint: /api/webhooks/banban/transfer',
        timestamp: new Date().toISOString()
      }
    });
  });
}