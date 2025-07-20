import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import {
  validateWebhookPayload,
  logWebhookEvent,
  generateErrorResponse,
  generateSuccessResponse
} from '@shared/webhook-base';
import { RETURN_ACTIONS } from '../../shared/enums';
import { BanBanSalesFlowService } from '../../modules/custom/banban-sales-flow/services/banban-sales-flow-service';

// --- CONFIGURAÇÃO CENTRAL ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type ReturnAction = typeof RETURN_ACTIONS[keyof typeof RETURN_ACTIONS];

interface UnifiedReturnRequest {
  action: ReturnAction;
  attributes: any;
  metadata?: { [key: string]: any };
}

// --- DEFINIÇÃO DAS ROTAS FASTIFY ---

export async function returnsFlowRoutes(server: FastifyInstance) {
  const salesService = new BanBanSalesFlowService();

  server.options('/*', async (request, reply) => {
    return reply.headers(corsHeaders).send();
  });

  // Rota POST para executar ações de devolução
  server.post('/', {
    preHandler: server.authenticateService('webhook:returns'),
    schema: {
      description: 'Webhook unificado para fluxos de devolução.',
      tags: ['webhooks', 'returns'],
      body: {
        type: 'object',
        required: ['action', 'attributes'],
        properties: {
          action: { type: 'string', enum: Object.values(RETURN_ACTIONS) },
          attributes: { type: 'object' },
          metadata: { type: 'object' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    const payload = request.body as UnifiedReturnRequest;

    try {
      validateWebhookPayload(payload);

      let result;
      
      // Mapear ações de return para métodos do sales service
      try {
        switch (payload.action) {
          case RETURN_ACTIONS.REQUEST_RETURN:
            result = await salesService.processAction('request_return', payload.attributes, payload.metadata);
            break;
          case RETURN_ACTIONS.COMPLETE_RETURN:
            result = await salesService.processAction('complete_return', payload.attributes, payload.metadata);
            break;
          case RETURN_ACTIONS.TRANSFER_BETWEEN_STORES:
            result = await salesService.processAction('transfer_between_stores', payload.attributes, payload.metadata);
            break;
          default:
            throw new Error(`Ação de devolução desconhecida: ${payload.action}`);
        }
      } catch (e: any) {
        console.error(`ERRO CAPTURADO NA ROTA: ${e.message}`, e.stack);
        throw e; // Re-lança para o handler de erro principal
      }

      const processingTime = Date.now() - startTime;
      await logWebhookEvent('returns', payload.action, payload, 'success', result, undefined, processingTime);

      const response = generateSuccessResponse(payload.action, result, { processed_at: new Date().toISOString(), event_uuid: randomUUID(), processing_time_ms: processingTime });
      return reply.headers(corsHeaders).send(response);

    } catch (error: any) {
      await logWebhookEvent('returns', (request.body as any)?.action || 'unknown', request.body, 'error', undefined, error.message, Date.now() - startTime);
      const errorResponse = generateErrorResponse(error, (request.body as any)?.action || 'unknown');
      return reply.headers(corsHeaders).code(500).send(errorResponse);
    }
  });

  // Rota GET para consultar dados de devolução
  server.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await salesService.getSalesData(request.query as any);
      return reply.headers(corsHeaders).send({ success: true, data: result, timestamp: new Date().toISOString() });

    } catch (error: any) {
      console.error('Erro no GET /returns:', error);
      return reply.headers(corsHeaders).code(500).send({ success: false, error: error.message, timestamp: new Date().toISOString() });
    }
  });
}