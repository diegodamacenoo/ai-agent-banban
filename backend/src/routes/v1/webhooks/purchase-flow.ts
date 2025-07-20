import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  validateWebhookPayload,
  logWebhookEvent,
  generateErrorResponse,
  generateSuccessResponse,
  webhookAuthMiddleware
} from '../../shared/webhook-base';
import { BanBanPurchaseFlowService } from '../../modules/custom/banban-purchase-flow/services/banban-purchase-flow-service';
import { logger } from '../../utils/logger';

// --- CONFIGURAÇÃO CENTRAL ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PURCHASE_ACTIONS = {
  CREATE_ORDER: 'create_order',
  APPROVE_ORDER: 'approve_order',
  REGISTER_INVOICE: 'register_invoice',
  ARRIVE_AT_CD: 'arrive_at_cd',
  START_CONFERENCE: 'start_conference',
  SCAN_ITEMS: 'scan_items',
  EFFECTUATE_CD: 'effectuate_cd'
} as const;

const PURCHASE_LOG_EVENTS: Record<PurchaseAction, string> = {
  [PURCHASE_ACTIONS.CREATE_ORDER]: 'purchase_order_created',
  [PURCHASE_ACTIONS.APPROVE_ORDER]: 'purchase_order_approved',
  [PURCHASE_ACTIONS.REGISTER_INVOICE]: 'purchase_invoice_registered',
  [PURCHASE_ACTIONS.ARRIVE_AT_CD]: 'purchase_arrived_at_cd',
  [PURCHASE_ACTIONS.START_CONFERENCE]: 'purchase_conference_started',
  [PURCHASE_ACTIONS.SCAN_ITEMS]: 'purchase_items_scanned',
  [PURCHASE_ACTIONS.EFFECTUATE_CD]: 'purchase_effectuated_cd',
};

type PurchaseAction = typeof PURCHASE_ACTIONS[keyof typeof PURCHASE_ACTIONS];

interface UnifiedPurchaseRequest {
  action: PurchaseAction;
  attributes: any;
  metadata?: { [key: string]: any };
}

// --- DEFINIÇÃO DAS ROTAS FASTIFY ---

export async function purchaseFlowRoutes(server: FastifyInstance) {
  const secretToken = process.env.WEBHOOK_SECRET_TOKEN || 'banban_webhook_secret_2025';
  const purchaseService = new BanBanPurchaseFlowService();

  server.options('/*', async (request, reply) => {
    return reply.headers(corsHeaders).send();
  });

  // Rota POST para executar ações de compra
  server.post('/', {
    preHandler: webhookAuthMiddleware(secretToken),
    schema: {
      description: 'Webhook unificado para fluxos de compra.',
      tags: ['webhooks', 'purchase'],
      body: {
        type: 'object',
        required: ['action', 'attributes'],
        properties: {
          action: { type: 'string', enum: Object.values(PURCHASE_ACTIONS) },
          attributes: { type: 'object' },
          metadata: { type: 'object' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    const payload = request.body as UnifiedPurchaseRequest;

    try {
      validateWebhookPayload(payload);

      const result = await purchaseService.processAction(
        payload.action,
        payload.attributes,
        payload.metadata
      );

      const processingTime = Date.now() - startTime;
      await logWebhookEvent('purchase', PURCHASE_LOG_EVENTS[payload.action], payload, 'success', result, undefined, processingTime);

      const response = generateSuccessResponse(payload.action, result, { processed_at: new Date().toISOString(), event_uuid: crypto.randomUUID(), processing_time_ms: processingTime });
      return reply.headers(corsHeaders).send(response);

    } catch (error: any) {
      await logWebhookEvent('purchase', (PURCHASE_LOG_EVENTS as any)[(request.body as any)?.action] || 'unknown', request.body, 'error', undefined, error, Date.now() - startTime);
      const errorResponse = generateErrorResponse(error, (request.body as any)?.action || 'unknown');
      return reply.headers(corsHeaders).code(500).send(errorResponse);
    }
  });

  // Rota GET para consultar dados de compra
  server.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await purchaseService.getPurchaseData(request.query);
      return reply.headers(corsHeaders).send({ success: true, data: result, timestamp: new Date().toISOString() });

    } catch (error: any) {
      logger.error('Erro no GET /purchase:', error);
      return reply.headers(corsHeaders).code(500).send({ success: false, error: error.message, timestamp: new Date().toISOString() });
    }
  });
}