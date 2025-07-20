import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import { supabaseService } from '../../shared/services/supabase-service';
import { logger } from '../../utils/logger';
import { 
  AuthenticationError, 
  ValidationError, 
  ErrorHandler
} from '@/shared/errors/v2';

const loginBodySchema = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8 },
  },
  required: ['email', 'password'],
} as const;

const protectedRouteHeadersSchema = {
  type: 'object',
  properties: {
    authorization: { type: 'string' },
  },
  required: ['authorization'],
} as const;

/**
 * Rotas de autenticação centralizadas
 * Migrado de /api/v2/auth/* para /api/auth/*
 */
export async function authRoutes(server: FastifyInstance) {
  // Rota de Login
  server.post(
    '/login',
    {
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
    },
    async (request: FastifyRequest<{ Body: FromSchema<typeof loginBodySchema> }>, reply: FastifyReply) => {
      try {
        const { email, password } = request.body;

        // Validações básicas
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

        // Autenticar com o Supabase
        const authResult = await supabaseService.authenticateUser(email, password);

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

        // Criar token JWT com os dados do usuário
        const user = {
          id: authResult.user!.id,
          email: authResult.user!.email!,
          emailVerified: authResult.user!.emailVerified,
          lastSignIn: authResult.user!.lastSignIn,
          userMetadata: authResult.user!.userMetadata
        };

        const token = server.jwt.sign({ user });

        logger.info('User login successful', { 
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
      } catch (error) {
        logger.error('Login error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            type: 'InternalError',
            message: 'Internal server error',
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  );

  // Rota de Perfil (protegida)
  server.get(
    '/profile',
    {
      preHandler: [server.authenticate], // Hook de autenticação
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
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user;

        // Verificar se o usuário está presente (deve sempre estar devido ao middleware de auth)
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

        logger.info('Profile access successful', { 
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
      } catch (error) {
        logger.error('Profile error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            type: 'InternalError',
            message: 'Internal server error',
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  );

  // Rota de Logout (opcional - para invalidar tokens do lado do cliente)
  server.post(
    '/logout',
    {
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
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user;

        logger.info('User logout successful', { 
          userId: user.id, 
          email: user.email 
        });

        return reply.send({ 
          success: true,
          message: 'Logout successful. Please remove token from client storage.'
        });
      } catch (error) {
        logger.error('Logout error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            type: 'InternalError',
            message: 'Internal server error',
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  );
}