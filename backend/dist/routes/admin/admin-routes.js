"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = adminRoutes;
async function adminRoutes(server) {
    server.get('/health', {
        schema: {
            description: 'Health check para funcionalidades administrativas',
            tags: ['Admin', 'Health'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        timestamp: { type: 'string' },
                        features: {
                            type: 'object',
                            properties: {
                                user_management: { type: 'string' },
                                system_config: { type: 'string' },
                                monitoring: { type: 'string' },
                                metrics: { type: 'string' }
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
            features: {
                user_management: 'planned',
                system_config: 'planned',
                monitoring: 'planned',
                metrics: 'planned'
            }
        };
    });
    server.get('/info', {
        schema: {
            description: 'Informações administrativas do sistema',
            tags: ['Admin'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        system: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                version: { type: 'string' },
                                environment: { type: 'string' },
                                uptime: { type: 'number' },
                                architecture: { type: 'string' }
                            }
                        },
                        features: {
                            type: 'array',
                            items: { type: 'string' }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            return reply.send({
                success: true,
                system: {
                    name: 'Backend BanBan - Arquitetura Híbrida',
                    version: '2.0.0-hybrid',
                    environment: process.env.NODE_ENV || 'development',
                    uptime: process.uptime(),
                    architecture: 'hybrid'
                },
                features: [
                    'Autenticação JWT centralizada',
                    'Sistema ECA BanBan (webhooks)',
                    'Business flows REST',
                    'Error handling unificado',
                    'Logging estruturado',
                    'Sistema modular multi-tenant'
                ]
            });
        }
        catch (error) {
            return reply.code(500).send({
                success: false,
                error: 'Internal server error'
            });
        }
    });
    server.get('/users', async (request, reply) => {
        return reply.code(404).send({
            success: false,
            error: {
                type: 'NotFoundError',
                message: 'User management not implemented yet. Coming in Phase 2.',
                timestamp: new Date().toISOString()
            }
        });
    });
    server.get('/config', async (request, reply) => {
        return reply.code(404).send({
            success: false,
            error: {
                type: 'NotFoundError',
                message: 'System configuration not implemented yet. Coming in Phase 2.',
                timestamp: new Date().toISOString()
            }
        });
    });
    server.get('/metrics', async (request, reply) => {
        return reply.code(404).send({
            success: false,
            error: {
                type: 'NotFoundError',
                message: 'Admin metrics not implemented yet. Coming in Phase 2.',
                timestamp: new Date().toISOString()
            }
        });
    });
}
//# sourceMappingURL=admin-routes.js.map