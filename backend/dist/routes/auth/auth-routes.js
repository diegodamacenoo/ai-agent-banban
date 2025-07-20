"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const supabase_service_1 = require("../../shared/services/supabase-service");
const logger_1 = require("../../utils/logger");
const loginBodySchema = {
    type: 'object',
    properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
    },
    required: ['email', 'password'],
};
const protectedRouteHeadersSchema = {
    type: 'object',
    properties: {
        authorization: { type: 'string' },
    },
    required: ['authorization'],
};
async function authRoutes(server) {
    server.post('/login', {
        schema: {
            description: 'Autentica um usuário e retorna um token JWT.',
            tags: ['Authentication'],
            body: loginBodySchema,
            response: {
                200: {
                    description: 'Login bem-sucedido',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        token: { type: 'string' },
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                email: { type: 'string' },
                                emailVerified: { type: 'boolean' },
                                lastSignIn: { type: 'string', nullable: true },
                            },
                        },
                    },
                },
                400: {
                    description: 'Erro de validação',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: {
                            type: 'object',
                            properties: {
                                type: { type: 'string' },
                                message: { type: 'string' },
                                timestamp: { type: 'string' },
                            },
                        },
                    },
                },
                401: {
                    description: 'Credenciais inválidas',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: {
                            type: 'object',
                            properties: {
                                type: { type: 'string' },
                                message: { type: 'string' },
                                timestamp: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const { email, password } = request.body;
            if (!email || !password) {
                return reply.code(400).send({
                    success: false,
                    error: {
                        type: 'ValidationError',
                        message: 'Email and password are required',
                        timestamp: new Date().toISOString()
                    }
                });
            }
            const authResult = await supabase_service_1.supabaseService.authenticateUser(email, password);
            if (!authResult.success) {
                return reply.code(401).send({
                    success: false,
                    error: {
                        type: 'AuthenticationError',
                        message: authResult.error || 'Invalid credentials',
                        timestamp: new Date().toISOString()
                    }
                });
            }
            const user = {
                id: authResult.user.id,
                email: authResult.user.email,
                emailVerified: authResult.user.emailVerified,
                lastSignIn: authResult.user.lastSignIn,
                userMetadata: authResult.user.userMetadata
            };
            const token = server.jwt.sign({ user });
            logger_1.logger.info('User login successful', {
                userId: user.id,
                email: user.email,
                emailVerified: user.emailVerified
            });
            return reply.send({
                success: true,
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    emailVerified: user.emailVerified,
                    lastSignIn: user.lastSignIn
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Login error:', error);
            return reply.code(500).send({
                success: false,
                error: {
                    type: 'InternalError',
                    message: 'Internal server error',
                    timestamp: new Date().toISOString()
                }
            });
        }
    });
    server.get('/profile', {
        preHandler: [server.authenticate],
        schema: {
            description: 'Retorna o perfil do usuário autenticado.',
            tags: ['Authentication'],
            headers: protectedRouteHeadersSchema,
            response: {
                200: {
                    description: 'Perfil do usuário',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                email: { type: 'string' },
                                emailVerified: { type: 'boolean' },
                                lastSignIn: { type: 'string', nullable: true },
                            },
                        },
                    },
                },
                401: {
                    description: 'Token inválido ou ausente',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: {
                            type: 'object',
                            properties: {
                                type: { type: 'string' },
                                message: { type: 'string' },
                                timestamp: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const user = request.user;
            if (!user) {
                return reply.code(401).send({
                    success: false,
                    error: {
                        type: 'AuthenticationError',
                        message: 'User not found in token',
                        timestamp: new Date().toISOString()
                    }
                });
            }
            logger_1.logger.info('Profile access successful', {
                userId: user.id,
                email: user.email
            });
            return reply.send({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    emailVerified: user.emailVerified,
                    lastSignIn: user.lastSignIn
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Profile error:', error);
            return reply.code(500).send({
                success: false,
                error: {
                    type: 'InternalError',
                    message: 'Internal server error',
                    timestamp: new Date().toISOString()
                }
            });
        }
    });
    server.post('/logout', {
        preHandler: [server.authenticate],
        schema: {
            description: 'Efetua logout do usuário (invalida token do lado do cliente).',
            tags: ['Authentication'],
            headers: protectedRouteHeadersSchema,
            response: {
                200: {
                    description: 'Logout bem-sucedido',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const user = request.user;
            logger_1.logger.info('User logout successful', {
                userId: user.id,
                email: user.email
            });
            return reply.send({
                success: true,
                message: 'Logout successful. Please remove token from client storage.'
            });
        }
        catch (error) {
            logger_1.logger.error('Logout error:', error);
            return reply.code(500).send({
                success: false,
                error: {
                    type: 'InternalError',
                    message: 'Internal server error',
                    timestamp: new Date().toISOString()
                }
            });
        }
    });
}
//# sourceMappingURL=auth-routes.js.map