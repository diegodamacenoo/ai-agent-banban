"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnsFlowRoutes = returnsFlowRoutes;
const crypto_1 = require("crypto");
const webhook_base_1 = require("@shared/webhook-base");
const enums_1 = require("../../../shared/enums");
const banban_sales_flow_service_1 = require("../../modules/custom/banban-sales-flow/services/banban-sales-flow-service");
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
async function returnsFlowRoutes(server) {
    const secretToken = process.env.WEBHOOK_SECRET_TOKEN || 'banban_webhook_secret_2025';
    const salesService = new banban_sales_flow_service_1.BanBanSalesFlowService();
    server.options('/*', async (request, reply) => {
        return reply.headers(corsHeaders).send();
    });
    server.post('/', {
        preHandler: (0, webhook_base_1.webhookAuthMiddleware)(secretToken),
        schema: {
            description: 'Webhook unificado para fluxos de devolução.',
            tags: ['webhooks', 'returns'],
            body: {
                type: 'object',
                required: ['action', 'attributes'],
                properties: {
                    action: { type: 'string', enum: Object.values(enums_1.RETURN_ACTIONS) },
                    attributes: { type: 'object' },
                    metadata: { type: 'object' }
                }
            }
        }
    }, async (request, reply) => {
        const startTime = Date.now();
        const payload = request.body;
        try {
            (0, webhook_base_1.validateWebhookPayload)(payload);
            let result;
            try {
                switch (payload.action) {
                    case enums_1.RETURN_ACTIONS.REQUEST_RETURN:
                        result = await salesService.processAction('request_return', payload.attributes, payload.metadata);
                        break;
                    case enums_1.RETURN_ACTIONS.COMPLETE_RETURN:
                        result = await salesService.processAction('complete_return', payload.attributes, payload.metadata);
                        break;
                    case enums_1.RETURN_ACTIONS.TRANSFER_BETWEEN_STORES:
                        result = await salesService.processAction('transfer_between_stores', payload.attributes, payload.metadata);
                        break;
                    default:
                        throw new Error(`Ação de devolução desconhecida: ${payload.action}`);
                }
            }
            catch (e) {
                console.error(`ERRO CAPTURADO NA ROTA: ${e.message}`, e.stack);
                throw e;
            }
            const processingTime = Date.now() - startTime;
            await (0, webhook_base_1.logWebhookEvent)('returns', payload.action, payload, 'success', result, undefined, processingTime);
            const response = (0, webhook_base_1.generateSuccessResponse)(payload.action, result, { processed_at: new Date().toISOString(), event_uuid: (0, crypto_1.randomUUID)(), processing_time_ms: processingTime });
            return reply.headers(corsHeaders).send(response);
        }
        catch (error) {
            await (0, webhook_base_1.logWebhookEvent)('returns', request.body?.action || 'unknown', request.body, 'error', undefined, error.message, Date.now() - startTime);
            const errorResponse = (0, webhook_base_1.generateErrorResponse)(error, request.body?.action || 'unknown');
            return reply.headers(corsHeaders).code(500).send(errorResponse);
        }
    });
    server.get('/', async (request, reply) => {
        try {
            const result = await salesService.getSalesData(request.query);
            return reply.headers(corsHeaders).send({ success: true, data: result, timestamp: new Date().toISOString() });
        }
        catch (error) {
            console.error('Erro no GET /returns:', error);
            return reply.headers(corsHeaders).code(500).send({ success: false, error: error.message, timestamp: new Date().toISOString() });
        }
    });
}
//# sourceMappingURL=returns-flow.js.map