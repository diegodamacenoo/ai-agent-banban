import { createLogger } from './logger';
import { DEBUG_MODULES } from './debug-config';

/**
 * Conjunto de funções auxiliares para facilitar a conversão dos console.log existentes para o novo sistema de logging.
 * 
 * Uso:
 * 
 * Em vez de:
 * console.log('Mensagem de log', data);
 * console.error('Erro:', error);
 * 
 * Use:
 * import { debug } from '@/lib/utils/debug-utils';
 * 
 * debug.log('module-name', 'Mensagem de log', data);
 * debug.error('module-name', 'Erro:', error);
 */

/**
 * Utilitário para criação rápida de logs sem precisar criar um logger por arquivo
 */
export const debug = {
  /**
   * Log de nível error
   */
  error: (module: string, ...args: any[]) => {
    const logger = createLogger(module);
    logger.error(...args);
  },

  /**
   * Log de nível warn
   */
  warn: (module: string, ...args: any[]) => {
    const logger = createLogger(module);
    logger.warn(...args);
  },

  /**
   * Log de nível info
   */
  info: (module: string, ...args: any[]) => {
    const logger = createLogger(module);
    logger.info(...args);
  },

  /**
   * Log de nível debug
   */
  log: (module: string, ...args: any[]) => {
    const logger = createLogger(module);
    logger.debug(...args);
  },

  /**
   * Log de nível trace
   */
  trace: (module: string, ...args: any[]) => {
    const logger = createLogger(module);
    logger.trace(...args);
  }
};

/**
 * Guia de substituição para conversão de console.log para o novo sistema de logging:
 * 
 * 1. console.log -> debug.log(DEBUG_MODULES.MODULE, ...)
 * 2. console.info -> debug.info(DEBUG_MODULES.MODULE, ...)
 * 3. console.warn -> debug.warn(DEBUG_MODULES.MODULE, ...)
 * 4. console.error -> debug.error(DEBUG_MODULES.MODULE, ...)
 */ 