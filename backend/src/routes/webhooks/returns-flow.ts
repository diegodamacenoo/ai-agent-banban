import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import {
  validateWebhookPayload,
  logWebhookEvent,
  generateErrorResponse,
  generateSuccessResponse
} from '@shared/webhook-base';
import { RETURN_ACTIONS } from '../../shared/enums';
import { BanBanReturnsFlowService } from '../../integrations/banban/flows/returns/services/banban-returns-flow-service';

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
  const returnsService = new BanBanReturnsFlowService();

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
        result = await returnsService.processAction(
          payload.action,
          payload.attributes,
          payload.metadata
        );
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
      const result = await returnsService.getReturnsData(request.query as any);
      return reply.headers(corsHeaders).send({ success: true, data: result, timestamp: new Date().toISOString() });

    } catch (error: any) {
      console.error('Erro no GET /returns:', error);
      return reply.headers(corsHeaders).code(500).send({ success: false, error: error.message, timestamp: new Date().toISOString() });
    }
  });
}