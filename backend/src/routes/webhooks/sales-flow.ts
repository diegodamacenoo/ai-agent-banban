import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import {
  validateWebhookPayload,
  logWebhookEvent,
  generateErrorResponse,
  generateSuccessResponse
} from '@shared/webhook-base';
import { BanBanSalesFlowService } from '../../integrations/banban/flows/sales/services/banban-sales-flow-service';

// --- CONFIGURAÇÃO CENTRAL ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SALES_ACTIONS = {
  REGISTER_SALE: 'register_sale',
  REGISTER_PAYMENT: 'register_payment',
  REGISTER_CANCELLATION: 'register_cancellation',
  REGISTER_RETURN: 'register_return',
  COMPLETE_RETURN: 'complete_return',
  TRANSFER_BETWEEN_STORES: 'transfer_between_stores',
  REGISTER_FISCAL_DATA: 'register_fiscal_data',
} as const;

type SalesAction = typeof SALES_ACTIONS[keyof typeof SALES_ACTIONS];

interface UnifiedSalesRequest {
  action: SalesAction;
  attributes: any;
  metadata?: { [key: string]: any };
}

// --- DEFINIÇÃO DAS ROTAS FASTIFY ---

export async function salesFlowRoutes(server: FastifyInstance) {
  const salesService = new BanBanSalesFlowService();

  server.options('/*', async (request, reply) => {
    return reply.headers(corsHeaders).send();
  });

  // Rota POST para executar ações de vendas
  server.post('/', {
    preHandler: server.authenticateService('webhook:sales'),
    schema: {
      description: 'Webhook unificado para fluxos de vendas.',
      tags: ['webhooks', 'sales'],
      body: {
        type: 'object',
        required: ['action', 'attributes'],
        properties: {
          action: { type: 'string', enum: Object.values(SALES_ACTIONS) },
          attributes: { type: 'object' },
          metadata: { type: 'object' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    const payload = request.body as UnifiedSalesRequest;

    try {
      validateWebhookPayload(payload);

      const result = await salesService.processAction(
        payload.action,
        payload.attributes,
        payload.metadata
      );

      const processingTime = Date.now() - startTime;
      await logWebhookEvent('sales', payload.action, payload, 'success', result, undefined, processingTime);

      const response = generateSuccessResponse(payload.action, result, { processed_at: new Date().toISOString(), event_uuid: randomUUID(), processing_time_ms: processingTime });
      return reply.headers(corsHeaders).send(response);

    } catch (error: any) {
      await logWebhookEvent('sales', (request.body as any)?.action || 'unknown', request.body, 'error', undefined, error.message, Date.now() - startTime);
      const errorResponse = generateErrorResponse(error, (request.body as any)?.action || 'unknown');
      return reply.headers(corsHeaders).code(500).send(errorResponse);
    }
  });

  // Rota GET para consultar dados de vendas e analytics
  server.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await salesService.getSalesData(request.query);
      return reply.headers(corsHeaders).send({ success: true, data: result, timestamp: new Date().toISOString() });

    } catch (error: any) {
      console.error('Erro no GET /sales:', error);
      return reply.headers(corsHeaders).code(500).send({ success: false, error: error.message, timestamp: new Date().toISOString() });
    }
  });
}