import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth-routes';
import { ErrorHandler } from '../../shared/errors/v2';

/**
 * Registra todas as rotas de autenticação centralizadas.
 * Migrado de /api/v2/auth/* para /api/auth/*
 */
export async function registerAuthRoutes(server: FastifyInstance): Promise<void> {
  // Registrar o error handler centralizado para todas as rotas de auth
  ErrorHandler.register(server);
  
  // Registrar rotas de autenticação
  await server.register(authRoutes);
}