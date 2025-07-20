import { createLogger } from './logger';
import { DEBUG_MODULES } from './debug-config';

/**
 * Conjunto de funÃ§Ãµes auxiliares para facilitar a conversÃ£o dos console.log existentes para o novo sistema de logging.
 * 
 * Uso:
 * 
 * Em vez de:
 * console.debug('Mensagem de log', data);
 * console.error('Erro:', error);
 * 
 * Use:
 * import { debug } from '@/shared/utils/debug-utils';
 * 
 * debug.log('module-name', 'Mensagem de log', data);
 * debug.error('module-name', 'Erro:', error);
 */

/**
 * UtilitÃ¡rio para criaÃ§Ã£o rÃ¡pida de logs sem precisar criar um logger por arquivo
 */
export const debug = {
  /**
   * Log de nÃ­vel error
   */
  error: (module: string, ...args: any[]) => {
    const logger = createLogger(module);
    logger.error(...args);
  },

  /**
   * Log de nÃ­vel warn
   */
  warn: (module: string, ...args: any[]) => {
    const logger = createLogger(module);
    logger.warn(...args);
  },

  /**
   * Log de nÃ­vel info
   */
  info: (module: string, ...args: any[]) => {
    const logger = createLogger(module);
    logger.info(...args);
  },

  /**
   * Log de nÃ­vel debug
   */
  log: (module: string, ...args: any[]) => {
    const logger = createLogger(module);
    logger.debug(...args);
  },

  /**
   * Log de nÃ­vel trace
   */
  trace: (module: string, ...args: any[]) => {
    const logger = createLogger(module);
    logger.trace(...args);
  }
};

/**
 * Guia de substituiÃ§Ã£o para conversÃ£o de console.log para o novo sistema de logging:
 * 
 * 1. console.log -> debug.log(DEBUG_MODULES.MODULE, ...)
 * 2. console.info -> debug.info(DEBUG_MODULES.MODULE, ...)
 * 3. console.warn -> debug.warn(DEBUG_MODULES.MODULE, ...)
 * 4. console.error -> debug.error(DEBUG_MODULES.MODULE, ...)
 */ 
