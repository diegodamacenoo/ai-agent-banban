"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const supabase_service_1 = require("../../shared/services/supabase-service");
const logger_1 = require("../../utils/logger");
const v2_1 = require("../../shared/errors/v2");
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
            tags: ['auth'],
            body: loginBodySchema,
            response: {
                200: {
                    description: 'Login bem-sucedido',
                    type: 'object',
                    properties: {
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
                401: {
                    description: 'Credenciais inválidas',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
                500: {
                    description: 'Erro interno do servidor',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const { email, password } = request.body;
        if (!email || !password) {
            throw new v2_1.ValidationError('Email and password are required', { email: !!email, password: !!password });
        }
        const authResult = await supabase_service_1.supabaseService.authenticateUser(email, password);
        if (!authResult.success) {
            throw new v2_1.AuthenticationError(authResult.error || 'Invalid credentials', { email, timestamp: new Date().toISOString() });
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
            token,
            user: {
                id: user.id,
                email: user.email,
                emailVerified: user.emailVerified,
                lastSignIn: user.lastSignIn
            }
        });
    });
    server.get('/profile', {
        preHandler: [server.authenticate],
        schema: {
            description: 'Retorna o perfil do usuário autenticado.',
            tags: ['auth'],
            headers: protectedRouteHeadersSchema,
            response: {
                200: {
                    description: 'Perfil do usuário',
                    type: 'object',
                    properties: {
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
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const user = request.user;
        if (!user) {
            throw new v2_1.AuthenticationError('User not found in token', {
                tokenPresent: !!request.headers.authorization
            });
        }
        logger_1.logger.info('Profile access successful', {
            userId: user.id,
            email: user.email
        });
        return reply.send({
            user: {
                id: user.id,
                email: user.email,
                emailVerified: user.emailVerified,
                lastSignIn: user.lastSignIn
            }
        });
    });
}
//# sourceMappingURL=auth.js.map