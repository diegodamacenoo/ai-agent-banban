"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BanBanETLFlowModule = void 0;
const crypto_1 = require("crypto");
const supabase_service_1 = require("../../../../shared/services/supabase-service");
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};
class BanBanETLFlowModule {
    constructor() {
        this.name = 'banban-etl-flow';
        this.version = '2.0.0';
        this.description = 'Módulo ETL para processamento de dados Banban';
        this.baseModule = 'flow-base';
    }
    async register(fastify, prefix) {
        const secretToken = process.env.WEBHOOK_SECRET_TOKEN || 'banban_webhook_secret_2025';
        fastify.options('/api/webhooks/banban/etl/*', async (request, reply) => {
            return reply.headers(corsHeaders).send();
        });
        fastify.post('/api/webhooks/banban/etl/daily', {
            schema: {
                description: 'Executa ETL diário para dados Banban',
                tags: ['Banban', 'ETL', 'Webhooks'],
                body: {
                    type: 'object',
                    properties: {
                        force: { type: 'boolean', default: false },
                        organization_id: { type: 'string' }
                    }
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            action: { type: 'string' },
                            attributes: { type: 'object' },
                            metadata: { type: 'object' }
                        }
                    }
                }
            }
        }, async (request, reply) => {
            const startTime = Date.now();
            try {
                const eventUuid = (0, crypto_1.randomUUID)();
                const payload = request.body;
                console.debug('ETL daily process started:', {
                    event_uuid: eventUuid,
                    organization_id: payload?.organization_id,
                    force: payload?.force
                });
                const { data, error } = await supabase_service_1.supabaseService.getClient().rpc('run_daily_etl', {
                    organization_id: payload?.organization_id,
                    force_run: payload?.force || false
                });
                if (error) {
                    console.error('ETL Supabase RPC error:', error);
                    throw new Error(`ETL RPC failed: ${error.message}`);
                }
                const result = {
                    message: 'ETL diário executado com sucesso',
                    event_uuid: eventUuid,
                    records_processed: data?.records_processed || 0,
                    records_updated: data?.records_updated || 0,
                    records_created: data?.records_created || 0,
                    execution_time_ms: data?.execution_time_ms || 0,
                    data
                };
                const processingTime = Date.now() - startTime;
                console.debug('ETL daily process completed:', {
                    event_uuid: eventUuid,
                    processing_time_ms: processingTime,
                    result
                });
                return reply.headers(corsHeaders).send({
                    success: true,
                    action: 'daily_etl',
                    attributes: {
                        success: true,
                        summary: {
                            message: 'ETL diário executado com sucesso',
                            records_processed: result.records_processed,
                            records_successful: result.records_updated + result.records_created,
                            records_failed: 0
                        },
                        details: result
                    },
                    metadata: {
                        processed_at: new Date().toISOString(),
                        event_uuid: eventUuid,
                        processing_time_ms: processingTime,
                        action: 'daily_etl'
                    }
                });
            }
            catch (error) {
                const processingTime = Date.now() - startTime;
                console.error('ETL daily process error:', {
                    error: error.message,
                    processing_time_ms: processingTime
                });
                return reply.headers(corsHeaders).code(500).send({
                    success: false,
                    action: 'daily_etl',
                    attributes: {
                        success: false,
                        summary: {
                            message: error.message
                        }
                    },
                    metadata: {
                        processed_at: new Date().toISOString(),
                        processing_time_ms: processingTime,
                        action: 'daily_etl',
                        event_uuid: (0, crypto_1.randomUUID)()
                    },
                    error: {
                        code: 'ETL_PROCESSING_ERROR',
                        message: error.message,
                        details: {
                            timestamp: new Date().toISOString()
                        }
                    }
                });
            }
        });
        fastify.post('/api/webhooks/banban/etl/custom', {
            schema: {
                description: 'Executa ETL personalizado com parâmetros específicos',
                tags: ['Banban', 'ETL', 'Webhooks'],
                body: {
                    type: 'object',
                    required: ['etl_type', 'organization_id'],
                    properties: {
                        etl_type: { type: 'string', enum: ['inventory', 'sales', 'transfers', 'full'] },
                        organization_id: { type: 'string' },
                        date_from: { type: 'string', format: 'date' },
                        date_to: { type: 'string', format: 'date' },
                        parameters: { type: 'object' }
                    }
                }
            }
        }, async (request, reply) => {
            const startTime = Date.now();
            const payload = request.body;
            try {
                const eventUuid = (0, crypto_1.randomUUID)();
                console.debug('ETL custom process started:', {
                    event_uuid: eventUuid,
                    etl_type: payload.etl_type,
                    organization_id: payload.organization_id
                });
                const { data, error } = await supabase_service_1.supabaseService.getClient().rpc('run_custom_etl', {
                    etl_type: payload.etl_type,
                    organization_id: payload.organization_id,
                    date_from: payload.date_from,
                    date_to: payload.date_to,
                    parameters: payload.parameters || {}
                });
                if (error) {
                    console.error('ETL Custom Supabase RPC error:', error);
                    throw new Error(`Custom ETL RPC failed: ${error.message}`);
                }
                const result = {
                    message: `ETL ${payload.etl_type} executado com sucesso`,
                    event_uuid: eventUuid,
                    etl_type: payload.etl_type,
                    records_processed: data?.records_processed || 0,
                    records_updated: data?.records_updated || 0,
                    records_created: data?.records_created || 0,
                    execution_time_ms: data?.execution_time_ms || 0,
                    data
                };
                const processingTime = Date.now() - startTime;
                return reply.headers(corsHeaders).send({
                    success: true,
                    action: 'custom_etl',
                    attributes: {
                        success: true,
                        summary: {
                            message: result.message,
                            records_processed: result.records_processed,
                            records_successful: result.records_updated + result.records_created,
                            records_failed: 0
                        },
                        details: result
                    },
                    metadata: {
                        processed_at: new Date().toISOString(),
                        event_uuid: eventUuid,
                        processing_time_ms: processingTime,
                        action: 'custom_etl'
                    }
                });
            }
            catch (error) {
                const processingTime = Date.now() - startTime;
                console.error('ETL custom process error:', {
                    error: error.message,
                    processing_time_ms: processingTime
                });
                return reply.headers(corsHeaders).code(500).send({
                    success: false,
                    action: 'custom_etl',
                    error: {
                        code: 'ETL_CUSTOM_ERROR',
                        message: error.message,
                        details: {
                            timestamp: new Date().toISOString()
                        }
                    }
                });
            }
        });
        fastify.get('/api/webhooks/banban/etl/status', {
            schema: {
                description: 'Consulta status das execuções ETL',
                tags: ['Banban', 'ETL'],
                querystring: {
                    type: 'object',
                    properties: {
                        organization_id: { type: 'string' },
                        limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
                    }
                }
            }
        }, async (request, reply) => {
            try {
                const query = request.query;
                const { data, error } = await supabase_service_1.supabaseService.getClient()
                    .from('etl_execution_log')
                    .select('*')
                    .eq('organization_id', query.organization_id)
                    .order('created_at', { ascending: false })
                    .limit(query.limit || 10);
                if (error) {
                    throw new Error(`Query ETL status failed: ${error.message}`);
                }
                return reply.headers(corsHeaders).send({
                    success: true,
                    data: {
                        executions: data || [],
                        total: data?.length || 0
                    },
                    timestamp: new Date().toISOString()
                });
            }
            catch (error) {
                console.error('ETL status query error:', error);
                return reply.headers(corsHeaders).code(500).send({
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });
        fastify.get('/api/integrations/banban/etl/health', {
            schema: {
                description: 'Health check do módulo ETL Flow',
                tags: ['Banban', 'ETL', 'Health']
            }
        }, async (request, reply) => {
            return reply.headers(corsHeaders).send({
                module: this.name,
                status: 'healthy',
                version: this.version,
                baseModule: this.baseModule,
                features: [
                    'daily-etl',
                    'custom-etl',
                    'inventory-processing',
                    'sales-aggregation',
                    'transfer-consolidation',
                    'execution-monitoring'
                ],
                etl_types: ['inventory', 'sales', 'transfers', 'full'],
                timestamp: new Date().toISOString()
            });
        });
    }
    async handleRequest(request, reply) {
        return reply.send({
            message: 'BanBan ETL Flow Module is active',
            version: this.version,
            timestamp: new Date().toISOString()
        });
    }
    getModuleInfo() {
        return {
            name: this.name,
            type: 'custom',
            version: this.version,
            description: this.description,
            endpoints: [
                '/api/webhooks/banban/etl/daily',
                '/api/webhooks/banban/etl/custom',
                '/api/webhooks/banban/etl/status',
                '/api/integrations/banban/etl/health'
            ],
            features: [
                'daily-etl',
                'custom-etl',
                'inventory-processing',
                'sales-aggregation',
                'transfer-consolidation',
                'execution-monitoring'
            ],
            inheritsFrom: this.baseModule
        };
    }
    getEndpoints() {
        return this.getModuleInfo().endpoints;
    }
}
exports.BanBanETLFlowModule = BanBanETLFlowModule;
//# sourceMappingURL=index.js.map