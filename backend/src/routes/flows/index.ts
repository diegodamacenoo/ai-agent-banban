import { FastifyInstance } from 'fastify';
import { businessFlowRoutes } from './business-flows';

/**
 * Registra todas as rotas de business flows
 * Funcionalidades REST para acessar flows de negócio
 */
export async function registerFlowRoutes(server: FastifyInstance): Promise<void> {
  // Registrar rotas de business flows
  await server.register(businessFlowRoutes);
}