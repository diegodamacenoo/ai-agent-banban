"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.salesFlowRoutes = salesFlowRoutes;
const webhook_base_1 = require("@shared/webhook-base");
const banban_sales_flow_service_1 = require("../../modules/custom/banban-sales-flow/services/banban-sales-flow-service");
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
};
async function salesFlowRoutes(server) {
    const salesService = new banban_sales_flow_service_1.BanBanSalesFlowService();
    server.options('/*', async (request, reply) => {
        return reply.headers(corsHeaders).send();
    });
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
    }, async (request, reply) => {
        const startTime = Date.now();
        const payload = request.body;
        try {
            (0, webhook_base_1.validateWebhookPayload)(payload);
            const result = await salesService.processAction(payload.action, payload.attributes, payload.metadata);
            const processingTime = Date.now() - startTime;
            await (0, webhook_base_1.logWebhookEvent)('sales', payload.action, payload, 'success', result, undefined, processingTime);
            const response = (0, webhook_base_1.generateSuccessResponse)(payload.action, result, { processed_at: new Date().toISOString(), event_uuid: crypto.randomUUID(), processing_time_ms: processingTime });
            return reply.headers(corsHeaders).send(response);
        }
        catch (error) {
            await (0, webhook_base_1.logWebhookEvent)('sales', request.body?.action || 'unknown', request.body, 'error', undefined, error.message, Date.now() - startTime);
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
            console.error('Erro no GET /sales:', error);
            return reply.headers(corsHeaders).code(500).send({ success: false, error: error.message, timestamp: new Date().toISOString() });
        }
    });
}
//# sourceMappingURL=sales-flow.js.map