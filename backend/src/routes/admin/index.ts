import { FastifyInstance } from 'fastify';
import { adminRoutes } from './admin-routes';
import { apiKeysAdminRoutes } from './api-keys';

/**
 * Registra todas as rotas administrativas
 * Funcionalidades de gestão do sistema
 */
export async function registerAdminRoutes(server: FastifyInstance): Promise<void> {
  // Registrar rotas administrativas
  await server.register(adminRoutes);
  
  // Registrar rotas de gestão de API Keys
  await server.register(apiKeysAdminRoutes, { prefix: '/api-keys' });
}