"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferFlowRoutes = transferFlowRoutes;
const crypto_1 = require("crypto");
const webhook_base_1 = require("@shared/webhook-base");
const enums_1 = require("../../shared/enums");
const banban_transfer_flow_service_1 = require("../../modules/custom/banban-transfer-flow/services/banban-transfer-flow-service");
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
async function transferFlowRoutes(server) {
    const transferService = new banban_transfer_flow_service_1.BanBanTransferFlowService();
    server.options('/*', async (request, reply) => {
        return reply.headers(corsHeaders).send();
    });
    server.post('/', {
        preHandler: server.authenticateService('webhook:transfer'),
        schema: {
            description: 'Webhook unificado para fluxos de transferência.',
            tags: ['webhooks', 'transfer'],
            body: {
                type: 'object',
                required: ['action', 'attributes'],
                properties: {
                    action: { type: 'string', enum: Object.values(enums_1.TRANSFER_ACTIONS) },
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
            const result = await transferService.processAction(payload.action, payload.attributes, payload.metadata);
            const processingTime = Date.now() - startTime;
            await (0, webhook_base_1.logWebhookEvent)('transfer', payload.action, payload, 'success', result, undefined, processingTime);
            const response = (0, webhook_base_1.generateSuccessResponse)(payload.action, result, { processed_at: new Date().toISOString(), event_uuid: (0, crypto_1.randomUUID)(), processing_time_ms: processingTime });
            return reply.headers(corsHeaders).send(response);
        }
        catch (error) {
            await (0, webhook_base_1.logWebhookEvent)('transfer', request.body?.action || 'unknown', request.body, 'error', undefined, error.message, Date.now() - startTime);
            const errorResponse = (0, webhook_base_1.generateErrorResponse)(error, request.body?.action || 'unknown');
            return reply.headers(corsHeaders).code(500).send(errorResponse);
        }
    });
    server.get('/', async (request, reply) => {
        try {
            const result = await transferService.getTransferData(request.query);
            return reply.headers(corsHeaders).send({ success: true, data: result, timestamp: new Date().toISOString() });
        }
        catch (error) {
            console.error('Erro no GET /transfer:', error);
            return reply.headers(corsHeaders).code(500).send({ success: false, error: error.message, timestamp: new Date().toISOString() });
        }
    });
}
//# sourceMappingURL=transfer-flow.js.map