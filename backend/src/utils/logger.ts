import pino from 'pino';
import { config, getEnvironmentConfig } from '../config/config';

/**
 * Logger configurado para o ambiente multi-tenant
 */
const logger = pino({
  level: getEnvironmentConfig().LOG_LEVEL,
  transport: config.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname'
    }
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    }
  },
  serializers: {
    err: pino.stdSerializers.err
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    pid: process.pid,
    hostname: process.env.HOSTNAME || 'unknown',
    service: 'banban-backend-fastify',
    version: '1.0.0'
  }
});

/**
 * Logger específico para multi-tenant com contexto adicional
 */
export const createTenantLogger = (tenantId: string, clientType: 'custom' | 'standard') => {
  return logger.child({
    tenantId,
    clientType,
    component: 'multi-tenant'
  });
};

/**
 * Logger para rotas com contexto de requisição
 */
export const createRouteLogger = (method: string, path: string, requestId?: string) => {
  return logger.child({
    method,
    path,
    requestId,
    component: 'route'
  });
};

/**
 * Logger para plugins
 */
export const createPluginLogger = (pluginName: string) => {
  return logger.child({
    plugin: pluginName,
    component: 'plugin'
  });
};

/**
 * Logger para erros com stack trace
 */
export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error({
    err: error,
    stack: error.stack,
    ...context
  }, error.message);
};

/**
 * Logger para performance/métricas
 */
export const logPerformance = (operation: string, duration: number, context?: Record<string, any>) => {
  logger.info({
    operation,
    duration,
    unit: 'ms',
    component: 'performance',
    ...context
  }, `Operation ${operation} completed in ${duration}ms`);
};

/**
 * Logger para audit trail
 */
export const logAudit = (action: string, userId?: string, tenantId?: string, details?: Record<string, any>) => {
  logger.info({
    action,
    userId,
    tenantId,
    component: 'audit',
    timestamp: new Date().toISOString(),
    ...details
  }, `Audit: ${action}`);
};

export { logger }; 