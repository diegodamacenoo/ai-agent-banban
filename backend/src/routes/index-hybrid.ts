import { FastifyInstance } from 'fastify';
import { config } from '../config/config';
import { createRouteLogger } from '../utils/logger';

// Nova arquitetura híbrida
import { registerAuthRoutes } from './auth';
import { registerWebhookRoutes } from './webhooks';
import { registerFlowRoutes } from './flows';
import { registerAdminRoutes } from './admin';
import { registerHealthRoutes } from './health';

// Manter compatibilidade com sistema modular existente
import { registerV1Routes } from './v1';

/**
 * Registrar todas as rotas da API - Arquitetura Híbrida
 * 
 * Nova estrutura:
 * /api/auth/*      - Autenticação centralizada
 * /api/webhooks/*  - Sistema ECA BanBan (migrado de v1)
 * /api/flows/*     - Business flows REST
 * /api/admin/*     - Funcionalidades administrativas
 * /api/health/*    - Health checks centralizados
 * /api/modules/*   - Sistema modular (mantido da v1)
 */
export async function registerHybridRoutes(server: FastifyInstance): Promise<void> {
  const logger = createRouteLogger('registration', 'hybrid-routes');
  
  try {
    // === SERVIÇOS CENTRAIS ===
    
    // Autenticação centralizada
    await server.register(registerAuthRoutes, { prefix: `${config.API_PREFIX}/auth` });
    logger.info(`Auth routes registered under ${config.API_PREFIX}/auth`);

    // Health checks centralizados
    await server.register(registerHealthRoutes, { prefix: `${config.API_PREFIX}/health` });
    logger.info(`Health routes registered under ${config.API_PREFIX}/health`);

    // === DOMÍNIOS ESPECÍFICOS ===
    
    // Sistema ECA BanBan (webhooks)
    await server.register(registerWebhookRoutes, { prefix: `${config.API_PREFIX}/webhooks` });
    logger.info(`Webhook routes registered under ${config.API_PREFIX}/webhooks`);

    // Business flows REST
    await server.register(registerFlowRoutes, { prefix: `${config.API_PREFIX}/flows` });
    logger.info(`Flow routes registered under ${config.API_PREFIX}/flows`);

    // Funcionalidades administrativas
    await server.register(registerAdminRoutes, { prefix: `${config.API_PREFIX}/admin` });
    logger.info(`Admin routes registered under ${config.API_PREFIX}/admin`);

    // === COMPATIBILIDADE ===
    
    // Manter sistema modular e métricas da v1 para compatibilidade
    await server.register(async function compatibilityRoutes(server) {
      const { coreV1Routes } = await import('./v1/core');
      const { metricsRoutes } = await import('./v1/metrics');
      
      await server.register(coreV1Routes);
      await server.register(metricsRoutes);
    }, { prefix: `${config.API_PREFIX}` });
    logger.info(`Compatibility routes (modules, metrics) registered under ${config.API_PREFIX}`);

    logger.info('All hybrid architecture routes registered successfully');
    logger.info('Available endpoints:');
    logger.info('  - /api/auth/*      (Authentication)');
    logger.info('  - /api/webhooks/*  (ECA BanBan System)');
    logger.info('  - /api/flows/*     (Business Flows REST)');
    logger.info('  - /api/admin/*     (Administrative)');
    logger.info('  - /api/health/*    (Health Checks)');
    logger.info('  - /api/modules/*   (Modular System - compatibility)');

  } catch (error) {
    logger.error('Error registering hybrid routes:', error);
    throw error;
  }
}