import { FastifyInstance } from 'fastify';
import { purchaseFlowRoutes } from './purchase-flow';
import { inventoryFlowRoutes } from './inventory-flow';
import { salesFlowRoutes } from './sales-flow';
import { transferFlowRoutes } from './transfer-flow';
import { returnsFlowRoutes } from './returns-flow';
import { etlRoutes } from './etl';

/**
 * Registra todas as rotas de webhook - Sistema ECA BanBan
 * Migrado de /api/v1/webhooks/* para /api/webhooks/*
 */
export async function registerWebhookRoutes(server: FastifyInstance) {
  // Registrar todas as rotas de webhook
  await server.register(async function webhookRoutes(server) {
    // Rota de health check para webhooks
    server.get('/health', {
      schema: {
        description: 'Health check para sistema de webhooks',
        tags: ['Webhooks', 'Health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              webhooks: {
                type: 'object',
                properties: {
                  purchase_flow: { type: 'string' },
                  inventory_flow: { type: 'string' },
                  sales_flow: { type: 'string' },
                  transfer_flow: { type: 'string' },
                  returns_flow: { type: 'string' },
                  etl: { type: 'string' }
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
        webhooks: {
          purchase_flow: 'available',
          inventory_flow: 'available',
          sales_flow: 'available',
          transfer_flow: 'available',
          returns_flow: 'available',
          etl: 'available'
        }
      };
    });

    // Registrar rotas específicas de cada fluxo ECA BanBan
    await server.register(purchaseFlowRoutes, { prefix: '/purchase' });
    await server.register(inventoryFlowRoutes, { prefix: '/inventory' });
    await server.register(salesFlowRoutes, { prefix: '/sales' });
    await server.register(transferFlowRoutes, { prefix: '/transfer' });
    await server.register(returnsFlowRoutes, { prefix: '/returns' });
    await server.register(etlRoutes, { prefix: '/etl' });
  }, { prefix: '/banban' });
}