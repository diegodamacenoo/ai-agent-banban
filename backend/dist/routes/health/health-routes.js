"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = healthRoutes;
async function healthRoutes(server) {
    server.get('/', {
        schema: {
            description: 'Health check geral do sistema',
            tags: ['Health'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        timestamp: { type: 'string' },
                        uptime: { type: 'number' },
                        environment: { type: 'string' },
                        version: { type: 'string' },
                        services: {
                            type: 'object',
                            properties: {
                                auth: { type: 'string' },
                                webhooks: { type: 'string' },
                                flows: { type: 'string' },
                                admin: { type: 'string' },
                                modules: { type: 'string' }
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
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: '2.0.0-hybrid',
            services: {
                auth: 'healthy',
                webhooks: 'healthy',
                flows: 'healthy',
                admin: 'healthy',
                modules: 'healthy'
            }
        };
    });
    server.get('/detailed', {
        schema: {
            description: 'Health check detalhado de todos os serviços',
            tags: ['Health'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        timestamp: { type: 'string' },
                        system: {
                            type: 'object',
                            properties: {
                                uptime: { type: 'number' },
                                memory: {
                                    type: 'object',
                                    properties: {
                                        used: { type: 'number' },
                                        total: { type: 'number' },
                                        percentage: { type: 'number' }
                                    }
                                },
                                environment: { type: 'string' },
                                nodeVersion: { type: 'string' }
                            }
                        },
                        services: {
                            type: 'object',
                            additionalProperties: {
                                type: 'object',
                                properties: {
                                    status: { type: 'string' },
                                    endpoint: { type: 'string' },
                                    description: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const memoryUsage = process.memoryUsage();
            const totalMemory = memoryUsage.heapTotal + memoryUsage.external;
            const usedMemory = memoryUsage.heapUsed + memoryUsage.external;
            return reply.send({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                system: {
                    uptime: process.uptime(),
                    memory: {
                        used: usedMemory,
                        total: totalMemory,
                        percentage: Math.round((usedMemory / totalMemory) * 100)
                    },
                    environment: process.env.NODE_ENV || 'development',
                    nodeVersion: process.version
                },
                services: {
                    auth: {
                        status: 'healthy',
                        endpoint: '/api/auth/health',
                        description: 'Serviço de autenticação JWT centralizado'
                    },
                    webhooks: {
                        status: 'healthy',
                        endpoint: '/api/webhooks/health',
                        description: 'Sistema ECA BanBan webhooks'
                    },
                    flows: {
                        status: 'healthy',
                        endpoint: '/api/flows/health',
                        description: 'Business flows REST endpoints'
                    },
                    admin: {
                        status: 'healthy',
                        endpoint: '/api/admin/health',
                        description: 'Funcionalidades administrativas'
                    },
                    modules: {
                        status: 'healthy',
                        endpoint: '/api/modules',
                        description: 'Sistema modular multi-tenant'
                    }
                }
            });
        }
        catch (error) {
            return reply.code(500).send({
                status: 'error',
                timestamp: new Date().toISOString(),
                error: 'Internal server error'
            });
        }
    });
    server.get('/status', async (request, reply) => {
        reply.code(200).send('OK');
    });
}
//# sourceMappingURL=health-routes.js.map