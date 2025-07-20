import { FastifyInstance } from 'fastify';
import { config } from '../config/config';
import { createRouteLogger } from '../utils/logger';

/**
 * Registrar todas as rotas da API - Suporte para arquitetura híbrida ou versionada
 */
export async function registerRoutes(server: FastifyInstance): Promise<void> {
  const logger = createRouteLogger('registration', 'routes');
  
  try {
    if (config.ENABLE_HYBRID_ARCHITECTURE) {
      // Nova arquitetura híbrida
      const { registerHybridRoutes } = await import('./index-hybrid');
      await registerHybridRoutes(server);
      logger.info('Hybrid architecture routes registered successfully');
    } else {
      // Arquitetura versionada antiga (fallback)
      const { registerV1Routes } = await import('./v1');
      const { registerV2Routes } = await import('./v2');
      
      await server.register(registerV1Routes, { prefix: `${config.API_PREFIX}/v1` });
      logger.info(`API v1 routes registered under ${config.API_PREFIX}/v1`);

      await server.register(registerV2Routes, { prefix: `${config.API_PREFIX}/v2` });
      logger.info(`API v2 routes registered under ${config.API_PREFIX}/v2`);
      
      logger.info('Versioned API routes registered successfully');
    }

  } catch (error) {
    logger.error('Error registering routes:', error);
    throw error;
  }
}