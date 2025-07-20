import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  validateWebhookPayload,
  logWebhookEvent,
  generateErrorResponse,
  generateSuccessResponse,
  webhookAuthMiddleware
} from '../../shared/webhook-base';
import { BanBanInventoryFlowService } from '../../modules/custom/banban-inventory-flow/services/banban-inventory-flow-service';

// --- CONFIGURAÇÃO CENTRAL ---
const BANBAN_ORG_ID = '2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const INVENTORY_ACTIONS = {
    ADJUST_STOCK: 'adjust_stock',
    COUNT_INVENTORY: 'count_inventory',
    RESERVE_STOCK: 'reserve_stock',
    TRANSFER_INTERNAL: 'transfer_internal',
    QUARANTINE_PRODUCT: 'quarantine_product'
} as const;

type InventoryAction = typeof INVENTORY_ACTIONS[keyof typeof INVENTORY_ACTIONS];

interface UnifiedInventoryRequest {
  action: InventoryAction;
  attributes: any;
  metadata?: { [key: string]: any };
}

// --- DEFINIÇÃO DAS ROTAS FASTIFY ---

export async function inventoryFlowRoutes(server: FastifyInstance) {
  const secretToken = process.env.WEBHOOK_SECRET_TOKEN || 'banban_webhook_secret_2025';
  const inventoryService = new BanBanInventoryFlowService();

  server.options('/*', async (request, reply) => {
    return reply.headers(corsHeaders).send();
  });

  // Rota POST para executar ações de inventário
  server.post('/', {
    preHandler: webhookAuthMiddleware(secretToken),
    schema: {
      description: 'Webhook unificado para fluxos de inventário.',
      tags: ['webhooks', 'inventory'],
      body: {
        type: 'object',
        required: ['action', 'attributes'],
        properties: {
          action: { type: 'string', enum: Object.values(INVENTORY_ACTIONS) },
          attributes: { type: 'object' },
          metadata: { type: 'object' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    const payload = request.body as UnifiedInventoryRequest;

    try {
      validateWebhookPayload(payload);

      const result = await inventoryService.processAction(
        payload.action,
        BANBAN_ORG_ID,
        payload.attributes,
        payload.metadata
      );

      const processingTime = Date.now() - startTime;
      await logWebhookEvent('inventory', payload.action, payload, 'success', result, undefined, processingTime);

      const response = generateSuccessResponse(payload.action, result, { processed_at: new Date().toISOString(), event_uuid: crypto.randomUUID(), processing_time_ms: processingTime });
      return reply.headers(corsHeaders).send(response);

    } catch (error: any) {
      await logWebhookEvent('inventory', (request.body as any)?.action || 'unknown', request.body, 'error', undefined, error.message, Date.now() - startTime);
      const errorResponse = generateErrorResponse(error, (request.body as any)?.action || 'unknown');
      return reply.headers(corsHeaders).code(500).send(errorResponse);
    }
  });

  // Rota GET para consultar dados de inventário
  server.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await inventoryService.getInventoryData(BANBAN_ORG_ID, request.query);
      return reply.headers(corsHeaders).send({ success: true, data: result, timestamp: new Date().toISOString() });

    } catch (error: any) {
      console.error('Erro no GET /inventory:', error);
      return reply.headers(corsHeaders).code(500).send({ success: false, error: error.message, timestamp: new Date().toISOString() });
    }
  });
}