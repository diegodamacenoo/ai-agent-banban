import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import { supabaseService } from '../../shared/services/supabase-service';
import { logger } from '../../utils/logger';
import { 
  AuthenticationError, 
  ValidationError, 
  InternalServerError,
  ErrorHandler
} from '../../shared/errors/v2';

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

export async function authRoutes(server: FastifyInstance) {
  // Rota de Login (pública)
  server.post(
    '/login',
    {
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
    },
    async (request: FastifyRequest<{ Body: FromSchema<typeof loginBodySchema> }>, reply: FastifyReply) => {
      const { email, password } = request.body;

      // Validações básicas
      if (!email || !password) {
        throw new ValidationError('Email and password are required', { email: !!email, password: !!password });
      }

      // Autenticar com o Supabase
      const authResult = await supabaseService.authenticateUser(email, password);

      if (!authResult.success) {
        throw new AuthenticationError(
          authResult.error || 'Invalid credentials',
          { email, timestamp: new Date().toISOString() }
        );
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
        token, 
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
          lastSignIn: user.lastSignIn
        }
      });
    }
  );

  // Rota de Perfil (protegida)
  server.get(
    '/profile',
    {
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
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user;

      if (!user) {
        throw new AuthenticationError('User not found in token', { 
          tokenPresent: !!request.headers.authorization 
        });
      }

      logger.info('Profile access successful', { 
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
    }
  );
}