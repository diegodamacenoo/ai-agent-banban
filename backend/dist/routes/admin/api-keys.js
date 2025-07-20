"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeysAdminRoutes = apiKeysAdminRoutes;
const api_keys_service_1 = require("../../shared/services/api-keys-service");
const api_keys_schema_1 = require("@/shared/schemas/api-keys-schema");
const logger_1 = require("../../utils/logger");
async function apiKeysAdminRoutes(server) {
    server.addHook('preHandler', server.authenticateUser);
    server.post('/', {
        schema: {
            description: 'Criar nova API Key',
            tags: ['admin', 'api-keys'],
            body: api_keys_schema_1.CreateApiKeySchema,
            response: {
                201: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                api_key: { type: 'string' },
                                permissions: { type: 'array', items: { type: 'string' } },
                                expires_at: { type: 'string' },
                                created_at: { type: 'string' },
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            logger_1.logger.info('🔑 Criando nova API Key:', request.body.name);
            const organizationId = request.body.organization_id || process.env.BANBAN_ORG_ID;
            const apiKey = await api_keys_service_1.apiKeysService.createApiKey({
                ...request.body,
                organization_id: organizationId,
            });
            logger_1.logger.info('✅ API Key criada com sucesso:', apiKey.id);
            return reply.code(201).send({
                success: true,
                data: apiKey,
            });
        }
        catch (error) {
            logger_1.logger.error('❌ Erro ao criar API Key:', error);
            return reply.code(500).send({
                success: false,
                error: 'Erro interno do servidor',
                message: error.message,
            });
        }
    });
    server.get('/', {
        schema: {
            description: 'Listar API Keys da organização',
            tags: ['admin', 'api-keys'],
            querystring: {
                type: 'object',
                properties: {
                    organization_id: { type: 'string', format: 'uuid' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    name: { type: 'string' },
                                    prefix: { type: 'string' },
                                    permissions: { type: 'array', items: { type: 'string' } },
                                    expires_at: { type: 'string' },
                                    is_active: { type: 'boolean' },
                                    usage_count: { type: 'number' },
                                    last_used_at: { type: 'string' },
                                    created_at: { type: 'string' },
                                }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const organizationId = request.query.organization_id || process.env.BANBAN_ORG_ID;
            const apiKeys = await api_keys_service_1.apiKeysService.listApiKeys(organizationId);
            return reply.send({
                success: true,
                data: apiKeys,
            });
        }
        catch (error) {
            logger_1.logger.error('❌ Erro ao listar API Keys:', error);
            return reply.code(500).send({
                success: false,
                error: 'Erro interno do servidor',
                message: error.message,
            });
        }
    });
    server.put('/:id', {
        schema: {
            description: 'Atualizar API Key',
            tags: ['admin', 'api-keys'],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' }
                },
                required: ['id']
            },
            body: api_keys_schema_1.UpdateApiKeySchema,
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                permissions: { type: 'array', items: { type: 'string' } },
                                expires_at: { type: 'string' },
                                is_active: { type: 'boolean' },
                                updated_at: { type: 'string' },
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const organizationId = process.env.BANBAN_ORG_ID;
            logger_1.logger.info('🔄 Atualizando API Key:', id);
            const updatedApiKey = await api_keys_service_1.apiKeysService.updateApiKey(id, request.body, organizationId);
            logger_1.logger.info('✅ API Key atualizada com sucesso:', id);
            return reply.send({
                success: true,
                data: updatedApiKey,
            });
        }
        catch (error) {
            logger_1.logger.error('❌ Erro ao atualizar API Key:', error);
            return reply.code(500).send({
                success: false,
                error: 'Erro interno do servidor',
                message: error.message,
            });
        }
    });
    server.delete('/:id', {
        schema: {
            description: 'Revogar API Key',
            tags: ['admin', 'api-keys'],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' }
                },
                required: ['id']
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const organizationId = process.env.BANBAN_ORG_ID;
            logger_1.logger.info('🚫 Revogando API Key:', id);
            await api_keys_service_1.apiKeysService.revokeApiKey(id, organizationId);
            logger_1.logger.info('✅ API Key revogada com sucesso:', id);
            return reply.send({
                success: true,
                message: 'API Key revogada com sucesso',
            });
        }
        catch (error) {
            logger_1.logger.error('❌ Erro ao revogar API Key:', error);
            return reply.code(500).send({
                success: false,
                error: 'Erro interno do servidor',
                message: error.message,
            });
        }
    });
    server.get('/:id/stats', {
        schema: {
            description: 'Obter estatísticas de uso da API Key',
            tags: ['admin', 'api-keys'],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' }
                },
                required: ['id']
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                total_requests: { type: 'number' },
                                last_7_days: { type: 'number' },
                                last_30_days: { type: 'number' },
                                average_response_time: { type: 'number' },
                                error_rate: { type: 'number' },
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const organizationId = request.query.organization_id || process.env.BANBAN_ORG_ID;
            const stats = await api_keys_service_1.apiKeysService.getApiKeyStats(id, organizationId);
            return reply.send({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            logger_1.logger.error('❌ Erro ao obter estatísticas:', error);
            return reply.code(500).send({
                success: false,
                error: 'Erro interno do servidor',
                message: error.message,
            });
        }
    });
    server.get('/expiring', {
        schema: {
            description: 'Listar API Keys próximas do vencimento',
            tags: ['admin', 'api-keys'],
            querystring: {
                type: 'object',
                properties: {
                    days_ahead: { type: 'number', minimum: 1, maximum: 365, default: 30 },
                    organization_id: { type: 'string', format: 'uuid' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    name: { type: 'string' },
                                    prefix: { type: 'string' },
                                    expires_at: { type: 'string' },
                                    days_until_expiry: { type: 'number' },
                                }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const query = request.query;
            const organizationId = query.organization_id || process.env.BANBAN_ORG_ID;
            const daysAhead = query.days_ahead || 30;
            const expiringKeys = await api_keys_service_1.apiKeysService.getExpiringApiKeys(organizationId, daysAhead);
            const keysWithDaysLeft = expiringKeys.map(key => {
                const expiryDate = new Date(key.expires_at || '');
                const today = new Date();
                const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return {
                    ...key,
                    days_until_expiry: daysUntilExpiry,
                };
            });
            return reply.send({
                success: true,
                data: keysWithDaysLeft,
            });
        }
        catch (error) {
            logger_1.logger.error('❌ Erro ao listar API Keys próximas do vencimento:', error);
            return reply.code(500).send({
                success: false,
                error: 'Erro interno do servidor',
                message: error.message,
            });
        }
    });
}
//# sourceMappingURL=api-keys.js.map