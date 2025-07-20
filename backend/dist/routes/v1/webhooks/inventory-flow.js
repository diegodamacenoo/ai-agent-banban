"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryFlowRoutes = inventoryFlowRoutes;
const webhook_base_1 = require("../../shared/webhook-base");
const banban_inventory_flow_service_1 = require("../../modules/custom/banban-inventory-flow/services/banban-inventory-flow-service");
const BANBAN_ORG_ID = '2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4';
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const INVENTORY_ACTIONS = {
    ADJUST_STOCK: 'adjust_stock',
    COUNT_INVENTORY: 'count_inventory',
    RESERVE_STOCK: 'reserve_stock',
    TRANSFER_INTERNAL: 'transfer_internal',
    QUARANTINE_PRODUCT: 'quarantine_product'
};
async function inventoryFlowRoutes(server) {
    const secretToken = process.env.WEBHOOK_SECRET_TOKEN || 'banban_webhook_secret_2025';
    const inventoryService = new banban_inventory_flow_service_1.BanBanInventoryFlowService();
    server.options('/*', async (request, reply) => {
        return reply.headers(corsHeaders).send();
    });
    server.post('/', {
        preHandler: (0, webhook_base_1.webhookAuthMiddleware)(secretToken),
        schema: {
            description: 'Webhook unificado para fluxos de inventário.',
            tags: ['webhooks', 'inventory'],
            body: {
                type: 'object',
                required: ['action', 'attributes'],
                properties: {
                    action: { type: 'string', enum: Object.values(INVENTORY_ACTIONS) },
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
            const result = await inventoryService.processAction(payload.action, BANBAN_ORG_ID, payload.attributes, payload.metadata);
            const processingTime = Date.now() - startTime;
            await (0, webhook_base_1.logWebhookEvent)('inventory', payload.action, payload, 'success', result, undefined, processingTime);
            const response = (0, webhook_base_1.generateSuccessResponse)(payload.action, result, { processed_at: new Date().toISOString(), event_uuid: crypto.randomUUID(), processing_time_ms: processingTime });
            return reply.headers(corsHeaders).send(response);
        }
        catch (error) {
            await (0, webhook_base_1.logWebhookEvent)('inventory', request.body?.action || 'unknown', request.body, 'error', undefined, error.message, Date.now() - startTime);
            const errorResponse = (0, webhook_base_1.generateErrorResponse)(error, request.body?.action || 'unknown');
            return reply.headers(corsHeaders).code(500).send(errorResponse);
        }
    });
    server.get('/', async (request, reply) => {
        try {
            const result = await inventoryService.getInventoryData(BANBAN_ORG_ID, request.query);
            return reply.headers(corsHeaders).send({ success: true, data: result, timestamp: new Date().toISOString() });
        }
        catch (error) {
            console.error('Erro no GET /inventory:', error);
            return reply.headers(corsHeaders).code(500).send({ success: false, error: error.message, timestamp: new Date().toISOString() });
        }
    });
}
//# sourceMappingURL=inventory-flow.js.map