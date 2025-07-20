import { FastifyInstance } from 'fastify';
import { coreV1Routes } from './core';
import { metricsRoutes } from './metrics';
import { registerWebhookRoutes } from './webhooks';

/**
 * Registra todas as rotas da v1 da API.
 */
export async function registerV1Routes(server: FastifyInstance): Promise<void> {
  // As rotas aqui serão prefixadas com /api/v1 (definido no registrador principal)
  
  await server.register(coreV1Routes);
  await server.register(metricsRoutes);
  await server.register(registerWebhookRoutes);
}
