import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { ErrorHandler } from '../shared/errors/v2';

/**
 * Plugin para registrar o sistema de error handling da API v2
 * Este plugin é aplicado apenas nas rotas v2
 */
async function errorHandlerV2Plugin(fastify: FastifyInstance) {
  // Registrar o error handler específico para v2
  ErrorHandler.register(fastify);
  
  // Adicionar decorator para facilitar uso nas rotas
  fastify.decorate('catchAsync', ErrorHandler.catchAsync);
  
  // Log de inicialização
  fastify.log.info('Error handler v2 plugin registered successfully');
}

export default fp(errorHandlerV2Plugin, {
  name: 'error-handler-v2',
  dependencies: ['@fastify/jwt']
});