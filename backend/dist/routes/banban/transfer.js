"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferRoutes = transferRoutes;
const banban_transfer_flow_service_1 = require("../../modules/custom/banban-transfer-flow/services/banban-transfer-flow-service");
const webhook_base_1 = require("../../shared/webhook-base");
async function transferRoutes(server) {
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
    }, async (request, reply) => {
        const { action, attributes, metadata } = request.body;
        const transferService = new banban_transfer_flow_service_1.BanBanTransferFlowService();
        try {
            const result = await transferService.processAction(action, attributes, metadata);
            return reply.send(result);
        }
        catch (error) {
            const errorResponse = (0, webhook_base_1.generateErrorResponse)(error, action);
            return reply.code(400).send(errorResponse);
        }
    });
}
//# sourceMappingURL=transfer.js.map