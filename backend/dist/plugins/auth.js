"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const config_1 = require("../config/config");
const api_keys_service_1 = require("../shared/services/api-keys-service");
const logger_1 = require("../utils/logger");
async function authPlugin(fastify) {
    if (!config_1.config.JWT_SECRET) {
        throw new Error('JWT_SECRET is required for authentication');
    }
    fastify.register(jwt_1.default, {
        secret: config_1.config.JWT_SECRET,
    });
    fastify.decorate('authenticate', async (request, reply) => {
        try {
            await request.jwtVerify();
            request.authType = 'jwt';
        }
        catch (err) {
            reply.code(401).send({
                error: 'Unauthorized',
                message: 'Invalid or missing token'
            });
        }
    });
    fastify.decorate('authenticateUser', async (request, reply) => {
        try {
            await request.jwtVerify();
            request.authType = 'jwt';
            logger_1.logger.debug('✅ Autenticação JWT bem-sucedida');
        }
        catch (err) {
            logger_1.logger.debug('❌ Falha na autenticação JWT:', err.message);
            reply.code(401).send({
                error: 'Unauthorized',
                message: 'Invalid or missing JWT token'
            });
        }
    });
    fastify.decorate('authenticateService', (requiredPermission) => {
        return async (request, reply) => {
            const authHeader = request.headers.authorization;
            if (!authHeader) {
                logger_1.logger.debug('❌ Cabeçalho Authorization ausente');
                return reply.code(401).send({
                    error: 'Unauthorized',
                    message: 'Authorization header required'
                });
            }
            if (!authHeader.startsWith('Bearer ')) {
                logger_1.logger.debug('❌ Formato Authorization inválido');
                return reply.code(401).send({
                    error: 'Unauthorized',
                    message: 'Invalid authorization format'
                });
            }
            const apiKey = authHeader.substring(7);
            if (!apiKey.startsWith('ak_')) {
                logger_1.logger.debug('❌ Não é uma API Key válida');
                return reply.code(401).send({
                    error: 'Unauthorized',
                    message: 'Invalid API key format'
                });
            }
            try {
                const validation = await api_keys_service_1.apiKeysService.validateApiKey(apiKey, requiredPermission);
                if (!validation.valid) {
                    logger_1.logger.debug('❌ Validação de API Key falhou:', validation.error);
                    return reply.code(401).send({
                        error: 'Unauthorized',
                        message: validation.error || 'Invalid API key'
                    });
                }
                request.authType = 'api_key';
                request.organizationId = validation.organization_id;
                request.apiKeyId = validation.api_key_id;
                request.permissions = validation.permissions;
                if (validation.api_key_id && validation.organization_id) {
                    await api_keys_service_1.apiKeysService.logApiKeyUsage(validation.api_key_id, request.url, request.method, 200, validation.organization_id, request.ip, request.headers['user-agent']);
                }
                logger_1.logger.debug('✅ Autenticação API Key bem-sucedida');
            }
            catch (error) {
                logger_1.logger.error('❌ Erro na autenticação API Key:', error);
                return reply.code(500).send({
                    error: 'Internal Server Error',
                    message: 'Authentication service error'
                });
            }
        };
    });
    fastify.decorate('authenticateHybrid', (requiredPermission) => {
        return async (request, reply) => {
            const authHeader = request.headers.authorization;
            if (!authHeader) {
                logger_1.logger.debug('❌ Cabeçalho Authorization ausente');
                return reply.code(401).send({
                    error: 'Unauthorized',
                    message: 'Authorization header required'
                });
            }
            if (!authHeader.startsWith('Bearer ')) {
                logger_1.logger.debug('❌ Formato Authorization inválido');
                return reply.code(401).send({
                    error: 'Unauthorized',
                    message: 'Invalid authorization format'
                });
            }
            const token = authHeader.substring(7);
            if (token.startsWith('ak_')) {
                try {
                    const validation = await api_keys_service_1.apiKeysService.validateApiKey(token, requiredPermission);
                    if (!validation.valid) {
                        logger_1.logger.debug('❌ Validação de API Key falhou:', validation.error);
                        return reply.code(401).send({
                            error: 'Unauthorized',
                            message: validation.error || 'Invalid API key'
                        });
                    }
                    request.authType = 'api_key';
                    request.organizationId = validation.organization_id;
                    request.apiKeyId = validation.api_key_id;
                    request.permissions = validation.permissions;
                    if (validation.api_key_id && validation.organization_id) {
                        await api_keys_service_1.apiKeysService.logApiKeyUsage(validation.api_key_id, request.url, request.method, 200, validation.organization_id, request.ip, request.headers['user-agent']);
                    }
                    logger_1.logger.debug('✅ Autenticação API Key híbrida bem-sucedida');
                    return;
                }
                catch (error) {
                    logger_1.logger.error('❌ Erro na autenticação API Key híbrida:', error);
                    return reply.code(500).send({
                        error: 'Internal Server Error',
                        message: 'Authentication service error'
                    });
                }
            }
            try {
                await request.jwtVerify();
                request.authType = 'jwt';
                logger_1.logger.debug('✅ Autenticação JWT híbrida bem-sucedida');
            }
            catch (err) {
                logger_1.logger.debug('❌ Falha na autenticação JWT híbrida:', err.message);
                return reply.code(401).send({
                    error: 'Unauthorized',
                    message: 'Invalid JWT token or API key'
                });
            }
        };
    });
}
exports.default = (0, fastify_plugin_1.default)(authPlugin);
//# sourceMappingURL=auth.js.map