import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import {
  validateWebhookPayload,
  logWebhookEvent,
  generateErrorResponse,
  generateSuccessResponse
} from '@shared/webhook-base';
import { TRANSFER_ACTIONS, TransferAction } from '../../shared/enums';
import { BanBanTransferFlowService } from '../../integrations/banban/flows/transfer/services/banban-transfer-flow-service';

// --- CONFIGURAÇÃO CENTRAL ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};



interface UnifiedTransferRequest {
  action: TransferAction;
  attributes: any;
  metadata?: { [key: string]: any };
}

// --- DEFINIÇÃO DAS ROTAS FASTIFY ---

export async function transferFlowRoutes(server: FastifyInstance) {
  const transferService = new BanBanTransferFlowService();

  server.options('/*', async (request, reply) => {
    return reply.headers(corsHeaders).send();
  });

  // Rota POST para executar ações de transferência
  server.post('/', {
    preHandler: server.authenticateService('webhook:transfer'),
    schema: {
      description: 'Webhook unificado para fluxos de transferência.',
      tags: ['webhooks', 'transfer'],
      body: {
        type: 'object',
        required: ['action', 'attributes'],
        properties: {
          action: { type: 'string', enum: Object.values(TRANSFER_ACTIONS) },
          attributes: { type: 'object' },
          metadata: { type: 'object' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    const payload = request.body as UnifiedTransferRequest;

    try {
      validateWebhookPayload(payload);

      const result = await transferService.processAction(
        payload.action,
        payload.attributes,
        payload.metadata
      );

      const processingTime = Date.now() - startTime;
      await logWebhookEvent('transfer', payload.action, payload, 'success', result, undefined, processingTime);

      const response = generateSuccessResponse(payload.action, result, { processed_at: new Date().toISOString(), event_uuid: randomUUID(), processing_time_ms: processingTime });
      return reply.headers(corsHeaders).send(response);

    } catch (error: any) {
      await logWebhookEvent('transfer', (request.body as any)?.action || 'unknown', request.body, 'error', undefined, error.message, Date.now() - startTime);
      const errorResponse = generateErrorResponse(error, (request.body as any)?.action || 'unknown');
      return reply.headers(corsHeaders).code(500).send(errorResponse);
    }
  });

  // Rota GET para consultar dados de transferência e analytics
  server.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await transferService.getTransferData(request.query as any);
      return reply.headers(corsHeaders).send({ success: true, data: result, timestamp: new Date().toISOString() });

    } catch (error: any) {
      console.error('Erro no GET /transfer:', error);
      return reply.headers(corsHeaders).code(500).send({ success: false, error: error.message, timestamp: new Date().toISOString() });
    }
  });
}