import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { config } from '../config/config';
import { apiKeysService } from '../shared/services/api-keys-service';
import { ApiKeyPermissionType } from '../shared/schemas/api-keys-schema';
import { logger } from '../utils/logger';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authenticateUser: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authenticateService: (
      requiredPermission?: ApiKeyPermissionType
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authenticateHybrid: (
      requiredPermission?: ApiKeyPermissionType
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: string;
      email: string;
      emailVerified: boolean;
      lastSignIn: string | null;
      userMetadata?: any;
    };
  }
}

// Extensão dos tipos do request para incluir informações de autenticação
declare module 'fastify' {
  interface FastifyRequest {
    authType?: 'jwt' | 'api_key';
    organizationId?: string;
    apiKeyId?: string;
    permissions?: ApiKeyPermissionType[];
  }
}

async function authPlugin(fastify: FastifyInstance) {
  // Verificar se JWT_SECRET está configurado
  if (!config.JWT_SECRET) {
    throw new Error('JWT_SECRET is required for authentication');
  }

  fastify.register(jwt, {
    secret: config.JWT_SECRET,
  });

  // Autenticação JWT clássica (compatibilidade)
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      request.authType = 'jwt';
    } catch (err) {
      reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'Invalid or missing token' 
      });
    }
  });

  // Autenticação específica para usuários (JWT)
  fastify.decorate('authenticateUser', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      request.authType = 'jwt';
      logger.debug('✅ Autenticação JWT bem-sucedida');
    } catch (err) {
      logger.debug('❌ Falha na autenticação JWT:', (err as Error).message);
      reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'Invalid or missing JWT token' 
      });
    }
  });

  // Autenticação específica para serviços (API Keys)
  fastify.decorate('authenticateService', (requiredPermission?: ApiKeyPermissionType) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const authHeader = request.headers.authorization;

      if (!authHeader) {
        logger.debug('❌ Cabeçalho Authorization ausente');
        return reply.code(401).send({ 
          error: 'Unauthorized', 
          message: 'Authorization header required' 
        });
      }

      // Esperar formato: "Bearer ak_..."
      if (!authHeader.startsWith('Bearer ')) {
        logger.debug('❌ Formato Authorization inválido');
        return reply.code(401).send({ 
          error: 'Unauthorized', 
          message: 'Invalid authorization format' 
        });
      }

      const apiKey = authHeader.substring(7);

      // Validar se é uma API Key (começa com 'ak_')
      if (!apiKey.startsWith('ak_')) {
        logger.debug('❌ Não é uma API Key válida');
        return reply.code(401).send({ 
          error: 'Unauthorized', 
          message: 'Invalid API key format' 
        });
      }

      try {
        const validation = await apiKeysService.validateApiKey(apiKey, requiredPermission);

        if (!validation.valid) {
          logger.debug('❌ Validação de API Key falhou:', validation.error);
          return reply.code(401).send({ 
            error: 'Unauthorized', 
            message: validation.error || 'Invalid API key' 
          });
        }

        // Armazenar informações de autenticação no request
        request.authType = 'api_key';
        request.organizationId = validation.organization_id;
        request.apiKeyId = validation.api_key_id;
        request.permissions = validation.permissions;

        // Registrar uso da API Key
        if (validation.api_key_id && validation.organization_id) {
          await apiKeysService.logApiKeyUsage(
            validation.api_key_id,
            request.url,
            request.method,
            200, // Status será atualizado depois se necessário
            validation.organization_id,
            request.ip,
            request.headers['user-agent'] as string
          );
        }

        logger.debug('✅ Autenticação API Key bem-sucedida');
      } catch (error) {
        logger.error('❌ Erro na autenticação API Key:', error);
        return reply.code(500).send({ 
          error: 'Internal Server Error', 
          message: 'Authentication service error' 
        });
      }
    };
  });

  // Autenticação híbrida (JWT ou API Key)
  fastify.decorate('authenticateHybrid', (requiredPermission?: ApiKeyPermissionType) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const authHeader = request.headers.authorization;

      if (!authHeader) {
        logger.debug('❌ Cabeçalho Authorization ausente');
        return reply.code(401).send({ 
          error: 'Unauthorized', 
          message: 'Authorization header required' 
        });
      }

      if (!authHeader.startsWith('Bearer ')) {
        logger.debug('❌ Formato Authorization inválido');
        return reply.code(401).send({ 
          error: 'Unauthorized', 
          message: 'Invalid authorization format' 
        });
      }

      const token = authHeader.substring(7);

      // Tentar autenticação via API Key primeiro (se começa com 'ak_')
      if (token.startsWith('ak_')) {
        try {
          const validation = await apiKeysService.validateApiKey(token, requiredPermission);

          if (!validation.valid) {
            logger.debug('❌ Validação de API Key falhou:', validation.error);
            return reply.code(401).send({ 
              error: 'Unauthorized', 
              message: validation.error || 'Invalid API key' 
            });
          }

          // Armazenar informações de autenticação no request
          request.authType = 'api_key';
          request.organizationId = validation.organization_id;
          request.apiKeyId = validation.api_key_id;
          request.permissions = validation.permissions;

          // Registrar uso da API Key
          if (validation.api_key_id && validation.organization_id) {
            await apiKeysService.logApiKeyUsage(
              validation.api_key_id,
              request.url,
              request.method,
              200,
              validation.organization_id,
              request.ip,
              request.headers['user-agent'] as string
            );
          }

          logger.debug('✅ Autenticação API Key híbrida bem-sucedida');
          return;
        } catch (error) {
          logger.error('❌ Erro na autenticação API Key híbrida:', error);
          return reply.code(500).send({ 
            error: 'Internal Server Error', 
            message: 'Authentication service error' 
          });
        }
      }

      // Tentar autenticação via JWT
      try {
        await request.jwtVerify();
        request.authType = 'jwt';
        logger.debug('✅ Autenticação JWT híbrida bem-sucedida');
      } catch (err) {
        logger.debug('❌ Falha na autenticação JWT híbrida:', (err as Error).message);
        return reply.code(401).send({ 
          error: 'Unauthorized', 
          message: 'Invalid JWT token or API key' 
        });
      }
    };
  });
}

export default fp(authPlugin);
