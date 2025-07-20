import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  logWebhookEvent,
  generateErrorResponse,
  generateSuccessResponse,
  webhookAuthMiddleware,
  supabase
} from '@shared/webhook-base';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export async function etlRoutes(server: FastifyInstance) {
  const secretToken = process.env.WEBHOOK_SECRET_TOKEN || 'banban_webhook_secret_2025';
  
  server.options('/*', async (request, reply) => {
    return reply.headers(corsHeaders).send();
  });

  server.post('/daily', {
    preHandler: webhookAuthMiddleware(secretToken),
    schema: {
      description: 'Daily ETL Process',
      tags: ['webhooks', 'etl']
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();

    try {
      const eventUuid = crypto.randomUUID();

      // Executar ETL diário (chamada para RPC do Supabase)
      const { data, error } = await supabase.rpc('run_daily_etl');

      if (error) throw error;

      const result = {
        message: 'ETL diário executado com sucesso',
        event_uuid: eventUuid,
        data
      };

      const processingTime = Date.now() - startTime;
      await logWebhookEvent(
        'etl',
        'daily_etl',
        {},
        'success',
        result,
        undefined,
        processingTime
      );

      const response = generateSuccessResponse(
        'daily_etl',
        result,
        {
          processed_at: new Date().toISOString(),
          event_uuid: eventUuid,
          processing_time_ms: processingTime
        }
      );

      return reply.headers(corsHeaders).send(response);

    } catch (error: any) {
      await logWebhookEvent(
        'etl',
        'daily_etl',
        {},
        'error',
        undefined,
        error.message,
        Date.now() - startTime
      );

      const errorResponse = generateErrorResponse(error, 'daily_etl');
      return reply.headers(corsHeaders).code(500).send(errorResponse);
    }
  });
}