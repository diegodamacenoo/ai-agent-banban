"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBanbanWebhooks = registerBanbanWebhooks;
const banban_1 = __importDefault(require("../../../integrations/banban"));
async function registerBanbanWebhooks(fastify) {
    const banbanHub = new banban_1.default();
    await banbanHub.register(fastify);
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    };
    fastify.post('/api/webhooks/banban', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    event_type: { type: 'string' },
                    organization_id: { type: 'string' },
                    data: { type: 'object' }
                },
                required: ['event_type', 'organization_id', 'data']
            }
        }
    }, async (request, reply) => {
        const startTime = Date.now();
        try {
            const payload = request.body;
            let targetPath;
            if (['sale_completed', 'sale_cancelled', 'return_processed'].includes(payload.event_type)) {
                targetPath = '/api/modules/banban/sales-flow';
            }
            else if (['purchase_created', 'purchase_approved', 'purchase_delivered'].includes(payload.event_type)) {
                targetPath = '/api/modules/banban/purchase-flow';
            }
            else if (['inventory_adjusted', 'inventory_counted', 'stock_reserved'].includes(payload.event_type)) {
                targetPath = '/api/modules/banban/inventory-flow';
            }
            else if (['transfer_created', 'transfer_shipped', 'transfer_completed'].includes(payload.event_type)) {
                targetPath = '/api/modules/banban/transfer-flow';
            }
            else {
                return reply.headers(corsHeaders).code(400).send({
                    success: false,
                    error: `Unsupported event type: ${payload.event_type}`,
                    supported_events: [
                        'sale_completed', 'sale_cancelled', 'return_processed',
                        'purchase_created', 'purchase_approved', 'purchase_delivered',
                        'inventory_adjusted', 'inventory_counted', 'stock_reserved',
                        'transfer_created', 'transfer_shipped', 'transfer_completed'
                    ]
                });
            }
            console.log(`📡 Routing webhook ${payload.event_type} to ${targetPath}`);
            const processingTime = Date.now() - startTime;
            return reply.headers(corsHeaders).send({
                success: true,
                action: payload.event_type,
                routed_to: targetPath,
                attributes: {
                    success: true,
                    summary: {
                        message: `Webhook ${payload.event_type} processed successfully`,
                        processing_time_ms: processingTime
                    }
                },
                metadata: {
                    processed_at: new Date().toISOString(),
                    processing_time_ms: processingTime,
                    organization_id: payload.organization_id,
                    event_uuid: crypto.randomUUID()
                }
            });
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            return reply.headers(corsHeaders).code(500).send({
                success: false,
                error: error.message,
                metadata: {
                    processed_at: new Date().toISOString(),
                    processing_time_ms: processingTime
                }
            });
        }
    });
    fastify.options('/api/webhooks/banban', async (request, reply) => {
        return reply.headers(corsHeaders).send();
    });
    fastify.get('/api/webhooks/banban/health', async (request, reply) => {
        return reply.headers(corsHeaders).send({
            webhook: 'banban-consolidated',
            status: 'operational',
            supported_flows: [
                'sales-flow', 'purchase-flow', 'inventory-flow', 'transfer-flow'
            ],
            supported_events: [
                'sale_completed', 'sale_cancelled', 'return_processed',
                'purchase_created', 'purchase_approved', 'purchase_delivered',
                'inventory_adjusted', 'inventory_counted', 'stock_reserved',
                'transfer_created', 'transfer_shipped', 'transfer_completed'
            ],
            timestamp: new Date().toISOString()
        });
    });
    console.log('✅ Banban consolidated webhooks registered');
}
//# sourceMappingURL=webhooks.js.map