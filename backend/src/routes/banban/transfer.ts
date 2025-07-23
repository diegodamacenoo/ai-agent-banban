
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BanBanTransferFlowService } from '../../integrations/banban/flows/transfer/services/banban-transfer-flow-service';
import { generateErrorResponse } from '../../shared/webhook-base';

export async function transferRoutes(server: FastifyInstance) {

  server.post('/transfer', {
    schema: {
      description: 'Endpoint to process transfer flow actions for BanBan.',
      tags: ['banban', 'transfer'],
      body: {
        type: 'object',
        required: ['action', 'attributes'],
        properties: {
          action: { type: 'string' },
          attributes: { type: 'object' },
          metadata: { type: 'object' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { action, attributes, metadata } = request.body as any;
    const transferService = new BanBanTransferFlowService();

    try {
      const result = await transferService.processAction(action, attributes, metadata);
      return reply.send(result);
    } catch (error) {
      const errorResponse = generateErrorResponse(error as Error, action);
      return reply.code(400).send(errorResponse);
    }
  });
}
