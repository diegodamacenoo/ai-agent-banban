import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth';
import errorHandlerV2Plugin from '../../plugins/error-handler-v2';

/**
 * Registra todas as rotas da v2 da API.
 */
export async function registerV2Routes(server: FastifyInstance): Promise<void> {
  // As rotas aqui serão prefixadas com /api/v2 (definido no registrador principal)
  
  // Registrar o error handler específico para v2
  await server.register(errorHandlerV2Plugin);
  
  // Rotas de autenticação v2
  await server.register(authRoutes, { prefix: '/auth' });
}
