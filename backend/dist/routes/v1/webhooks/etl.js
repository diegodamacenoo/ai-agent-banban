"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.etlRoutes = etlRoutes;
const webhook_base_1 = require("@shared/webhook-base");
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
async function etlRoutes(server) {
    const secretToken = process.env.WEBHOOK_SECRET_TOKEN || 'banban_webhook_secret_2025';
    server.options('/*', async (request, reply) => {
        return reply.headers(corsHeaders).send();
    });
    server.post('/daily', {
        preHandler: (0, webhook_base_1.webhookAuthMiddleware)(secretToken),
        schema: {
            description: 'Daily ETL Process',
            tags: ['webhooks', 'etl']
        }
    }, async (request, reply) => {
        const startTime = Date.now();
        try {
            const eventUuid = crypto.randomUUID();
            const { data, error } = await webhook_base_1.supabase.rpc('run_daily_etl');
            if (error)
                throw error;
            const result = {
                message: 'ETL diário executado com sucesso',
                event_uuid: eventUuid,
                data
            };
            const processingTime = Date.now() - startTime;
            await (0, webhook_base_1.logWebhookEvent)('etl', 'daily_etl', {}, 'success', result, undefined, processingTime);
            const response = (0, webhook_base_1.generateSuccessResponse)('daily_etl', result, {
                processed_at: new Date().toISOString(),
                event_uuid: eventUuid,
                processing_time_ms: processingTime
            });
            return reply.headers(corsHeaders).send(response);
        }
        catch (error) {
            await (0, webhook_base_1.logWebhookEvent)('etl', 'daily_etl', {}, 'error', undefined, error.message, Date.now() - startTime);
            const errorResponse = (0, webhook_base_1.generateErrorResponse)(error, 'daily_etl');
            return reply.headers(corsHeaders).code(500).send(errorResponse);
        }
    });
}
//# sourceMappingURL=etl.js.map