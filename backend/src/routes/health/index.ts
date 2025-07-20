import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health-routes';

/**
 * Registra todas as rotas de health check e monitoramento
 * Centralizadas para todos os domínios
 */
export async function registerHealthRoutes(server: FastifyInstance): Promise<void> {
  // Registrar rotas de health
  await server.register(healthRoutes);
}