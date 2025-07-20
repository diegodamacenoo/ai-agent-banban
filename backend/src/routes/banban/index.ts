
import { FastifyInstance } from 'fastify';
import { transferRoutes } from './transfer';

export async function registerBanbanRoutes(server: FastifyInstance) {
  server.register(transferRoutes, { prefix: '/banban' });
}
