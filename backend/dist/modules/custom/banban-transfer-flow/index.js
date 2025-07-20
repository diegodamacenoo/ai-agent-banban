"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BanBanTransferFlowModule = void 0;
const banban_transfer_flow_service_1 = require("./services/banban-transfer-flow-service");
const banban_transfer_flow_schemas_1 = require("./schemas/banban-transfer-flow-schemas");
const enums_1 = require("../../../shared/enums");
class BanBanTransferFlowModule {
    constructor() {
        this.name = 'BanBan Transfer Flow';
        this.version = '1.0.0';
        this.description = 'Módulo para processamento de transferências/logística BanBan';
    }
    async register(fastify) {
        this.service = new banban_transfer_flow_service_1.BanBanTransferFlowService();
        await this.registerRoutes(fastify);
        fastify.log.info('BanBan Transfer Flow Module registered successfully');
    }
    async registerRoutes(fastify) {
        fastify.post('/api/modules/banban/transfer-flow', {
            schema: banban_transfer_flow_schemas_1.ECATransferWebhookSchema,
            handler: async (request, reply) => {
                return this.handleWebhook(request, reply);
            }
        });
        fastify.get('/api/modules/banban/transfer-flow', {
            schema: banban_transfer_flow_schemas_1.QueryTransfersSchema,
            handler: async (request, reply) => {
                return this.handleQuery(request, reply);
            }
        });
        fastify.get('/api/modules/banban/transfer-flow/analytics', {
            schema: banban_transfer_flow_schemas_1.AnalyticsSchema,
            handler: async (request, reply) => {
                return this.handleAnalytics(request, reply);
            }
        });
        fastify.get('/api/modules/banban/transfer-flow/health', {
            schema: banban_transfer_flow_schemas_1.HealthCheckSchema,
            handler: async (request, reply) => {
                return this.handleHealthCheck(request, reply);
            }
        });
    }
    async handleWebhook(request, reply) {
        const startTime = Date.now();
        const { event_type, organization_id, data } = request.body;
        const eventUuid = this.generateUuid();
        try {
            request.log.info(`Processing transfer webhook: ${event_type} for org: ${organization_id}`);
            if (!Object.values(enums_1.TRANSFER_ACTIONS).includes(event_type)) {
                throw new Error(`Invalid transfer action: ${event_type}`);
            }
            const result = await this.service.processAction(event_type, data, {});
            const processingTime = Date.now() - startTime;
            const eventUuid = this.generateUuid();
            const recordsProcessed = 1;
            const recordsSuccessful = recordsProcessed;
            const recordsFailed = 0;
            const successRate = '100.00%';
            const responseData = {
                success: true,
                action: event_type,
                transaction_id: result.transaction_id,
                entity_ids: result.entityIds || [],
                relationship_ids: result.relationshipIds || [],
                state_transition: result.stateTransition || undefined,
                attributes: {
                    success: result.success,
                    entityType: result.entityType,
                    entityId: result.entityId,
                    summary: {
                        message: result.summary.message,
                        records_processed: result.summary.records_processed,
                        records_successful: result.summary.records_successful,
                        records_failed: result.summary.records_failed
                    }
                },
                metadata: {
                    processed_at: new Date().toISOString(),
                    processing_time_ms: processingTime,
                    organization_id: organization_id,
                    action: event_type,
                    event_uuid: eventUuid
                }
            };
            request.log.info(`Transfer webhook processed successfully in ${processingTime}ms`);
            reply
                .code(200)
                .header('Content-Type', 'application/json')
                .send(responseData);
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            request.log.error(`Transfer webhook error: ${errorMessage}`);
            const errorResponse = {
                success: false,
                action: request.body?.event_type || 'unknown',
                attributes: {
                    success: false,
                    summary: {
                        message: errorMessage
                    }
                },
                metadata: {
                    processed_at: new Date().toISOString(),
                    processing_time_ms: processingTime,
                    organization_id: request.body?.organization_id || 'unknown',
                    action: request.body?.event_type || 'unknown',
                    event_uuid: this.generateUuid()
                },
                error: {
                    code: 'PROCESSING_ERROR',
                    message: errorMessage,
                    details: {
                        timestamp: new Date().toISOString()
                    }
                }
            };
            reply
                .code(500)
                .header('Content-Type', 'application/json')
                .send(errorResponse);
        }
    }
    async handleQuery(request, reply) {
        try {
            const { org, transfer_id, origin_location_id, destination_location_id, status, from_date, to_date, limit = 50, offset = 0 } = request.query;
            request.log.info(`Querying transfers for org: ${org}`);
            const filters = {
                org,
                transfer_id,
                origin_location_id,
                destination_location_id,
                status,
                from_date,
                to_date,
                limit,
                offset
            };
            const result = await this.service.getTransferData(filters);
            reply
                .code(200)
                .header('Content-Type', 'application/json')
                .send({
                success: true,
                data: result
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            request.log.error(`Query transfers error: ${errorMessage}`);
            reply
                .code(500)
                .header('Content-Type', 'application/json')
                .send({
                success: false,
                message: 'Error querying transfers',
                error: {
                    type: 'QUERY_ERROR',
                    message: errorMessage,
                    timestamp: new Date().toISOString()
                }
            });
        }
    }
    async handleAnalytics(request, reply) {
        try {
            const { org, from_date, to_date, location_id, product_id } = request.query;
            request.log.info(`Getting transfer analytics for org: ${org}`);
            const filters = {
                org,
                from_date,
                to_date,
                location_id,
                product_id
            };
            const analytics = await this.service.getTransferAnalytics(filters);
            reply
                .code(200)
                .header('Content-Type', 'application/json')
                .send({
                success: true,
                data: analytics
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            request.log.error(`Transfer analytics error: ${errorMessage}`);
            reply
                .code(500)
                .header('Content-Type', 'application/json')
                .send({
                success: false,
                message: 'Error getting transfer analytics',
                error: {
                    type: 'ANALYTICS_ERROR',
                    message: errorMessage,
                    timestamp: new Date().toISOString()
                }
            });
        }
    }
    async handleHealthCheck(request, reply) {
        try {
            const healthData = {
                status: 'healthy',
                module: 'BanBanTransferFlow',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                database_connection: 'healthy',
                last_processed_event: new Date().toISOString()
            };
            reply
                .code(200)
                .header('Content-Type', 'application/json')
                .send(healthData);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            request.log.error(`Transfer flow health check error: ${errorMessage}`);
            reply
                .code(503)
                .header('Content-Type', 'application/json')
                .send({
                status: 'unhealthy',
                module: 'BanBanTransferFlow',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                error: errorMessage
            });
        }
    }
    generateUuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    async handleRequest(_request, _reply) {
        return {
            module: 'BanBan Transfer Flow',
            version: '1.0.0',
            status: 'active',
            message: 'Use specific endpoints for transfer operations',
            endpoints: this.getEndpoints()
        };
    }
    getEndpoints() {
        return [
            'POST /api/modules/banban/transfer-flow',
            'GET /api/modules/banban/transfer-flow',
            'GET /api/modules/banban/transfer-flow/analytics',
            'GET /api/modules/banban/transfer-flow/health'
        ];
    }
    isActive() {
        return true;
    }
    getModuleInfo() {
        return {
            name: 'BanBan Transfer Flow',
            type: 'custom',
            version: '1.0.0',
            description: 'Módulo para processamento de transferências/logística BanBan',
            status: 'active',
            features: [
                'transfer-request-processing',
                'shipping-tracking',
                'inventory-transfers',
                'cancellation-handling',
                'analytics-reporting'
            ],
            endpoints: this.getEndpoints()
        };
    }
}
exports.BanBanTransferFlowModule = BanBanTransferFlowModule;
//# sourceMappingURL=index.js.map