"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWebhookRoutes = registerWebhookRoutes;
const purchase_flow_1 = require("./purchase-flow");
const inventory_flow_1 = require("./inventory-flow");
const sales_flow_1 = require("./sales-flow");
const transfer_flow_1 = require("./transfer-flow");
const returns_flow_1 = require("./returns-flow");
const etl_1 = require("./etl");
async function registerWebhookRoutes(server) {
    await server.register(async function webhookRoutes(server) {
        server.get('/health', {
            schema: {
                description: 'Health check para sistema de webhooks',
                tags: ['Webhooks', 'Health'],
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            status: { type: 'string' },
                            timestamp: { type: 'string' },
                            webhooks: {
                                type: 'object',
                                properties: {
                                    purchase_flow: { type: 'string' },
                                    inventory_flow: { type: 'string' },
                                    sales_flow: { type: 'string' },
                                    transfer_flow: { type: 'string' },
                                    returns_flow: { type: 'string' },
                                    etl: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        }, async (request, reply) => {
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                webhooks: {
                    purchase_flow: 'available',
                    inventory_flow: 'available',
                    sales_flow: 'available',
                    transfer_flow: 'available',
                    returns_flow: 'available',
                    etl: 'available'
                }
            };
        });
        await server.register(purchase_flow_1.purchaseFlowRoutes, { prefix: '/purchase' });
        await server.register(inventory_flow_1.inventoryFlowRoutes, { prefix: '/inventory' });
        await server.register(sales_flow_1.salesFlowRoutes, { prefix: '/sales' });
        await server.register(transfer_flow_1.transferFlowRoutes, { prefix: '/transfer' });
        await server.register(returns_flow_1.returnsFlowRoutes, { prefix: '/returns' });
        await server.register(etl_1.etlRoutes, { prefix: '/etl' });
    }, { prefix: '/banban' });
}
//# sourceMappingURL=index.js.map