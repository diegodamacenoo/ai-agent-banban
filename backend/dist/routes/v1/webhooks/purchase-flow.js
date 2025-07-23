"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purchaseFlowRoutes = purchaseFlowRoutes;
const webhook_base_1 = require("../../shared/webhook-base");
const banban_purchase_flow_service_1 = require("../../../integrations/banban/flows/purchase/services/banban-purchase-flow-service");
const logger_1 = require("../../utils/logger");
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const PURCHASE_ACTIONS = {
    CREATE_ORDER: 'create_order',
    APPROVE_ORDER: 'approve_order',
    REGISTER_INVOICE: 'register_invoice',
    ARRIVE_AT_CD: 'arrive_at_cd',
    START_CONFERENCE: 'start_conference',
    SCAN_ITEMS: 'scan_items',
    EFFECTUATE_CD: 'effectuate_cd'
};
const PURCHASE_LOG_EVENTS = {
    [PURCHASE_ACTIONS.CREATE_ORDER]: 'purchase_order_created',
    [PURCHASE_ACTIONS.APPROVE_ORDER]: 'purchase_order_approved',
    [PURCHASE_ACTIONS.REGISTER_INVOICE]: 'purchase_invoice_registered',
    [PURCHASE_ACTIONS.ARRIVE_AT_CD]: 'purchase_arrived_at_cd',
    [PURCHASE_ACTIONS.START_CONFERENCE]: 'purchase_conference_started',
    [PURCHASE_ACTIONS.SCAN_ITEMS]: 'purchase_items_scanned',
    [PURCHASE_ACTIONS.EFFECTUATE_CD]: 'purchase_effectuated_cd',
};
async function purchaseFlowRoutes(server) {
    const secretToken = process.env.WEBHOOK_SECRET_TOKEN || 'banban_webhook_secret_2025';
    const purchaseService = new banban_purchase_flow_service_1.BanBanPurchaseFlowService();
    server.options('/*', async (request, reply) => {
        return reply.headers(corsHeaders).send();
    });
    server.post('/', {
        preHandler: (0, webhook_base_1.webhookAuthMiddleware)(secretToken),
        schema: {
            description: 'Webhook unificado para fluxos de compra.',
            tags: ['webhooks', 'purchase'],
            body: {
                type: 'object',
                required: ['action', 'attributes'],
                properties: {
                    action: { type: 'string', enum: Object.values(PURCHASE_ACTIONS) },
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
            const result = await purchaseService.processAction(payload.action, payload.attributes, payload.metadata);
            const processingTime = Date.now() - startTime;
            await (0, webhook_base_1.logWebhookEvent)('purchase', PURCHASE_LOG_EVENTS[payload.action], payload, 'success', result, undefined, processingTime);
            const response = (0, webhook_base_1.generateSuccessResponse)(payload.action, result, { processed_at: new Date().toISOString(), event_uuid: crypto.randomUUID(), processing_time_ms: processingTime });
            return reply.headers(corsHeaders).send(response);
        }
        catch (error) {
            await (0, webhook_base_1.logWebhookEvent)('purchase', PURCHASE_LOG_EVENTS[request.body?.action] || 'unknown', request.body, 'error', undefined, error, Date.now() - startTime);
            const errorResponse = (0, webhook_base_1.generateErrorResponse)(error, request.body?.action || 'unknown');
            return reply.headers(corsHeaders).code(500).send(errorResponse);
        }
    });
    server.get('/', async (request, reply) => {
        try {
            const result = await purchaseService.getPurchaseData(request.query);
            return reply.headers(corsHeaders).send({ success: true, data: result, timestamp: new Date().toISOString() });
        }
        catch (error) {
            logger_1.logger.error('Erro no GET /purchase:', error);
            return reply.headers(corsHeaders).code(500).send({ success: false, error: error.message, timestamp: new Date().toISOString() });
        }
    });
}
//# sourceMappingURL=purchase-flow.js.map