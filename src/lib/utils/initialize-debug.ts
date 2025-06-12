import { initializeDebugConfig, DEBUG_MODULES } from './debug-config';

// Inicializa a configuração de debug
initializeDebugConfig();

/**
 * Arquivo de inicialização da configuração de debug
 * 
 * Para usar o sistema de logs:
 * 
 * 1. Importe este módulo no ponto de entrada da aplicação:
 *    import '@/lib/utils/initialize-debug';
 * 
 * 2. Em seus componentes/serviços, use o logger:
 *    import { createLogger } from '@/lib/utils/logger';
 *    import { DEBUG_MODULES } from '@/lib/utils/debug-config';
 * 
 *    const logger = createLogger(DEBUG_MODULES.UI_DASHBOARD);
 *    logger.debug('Mensagem de debug');
 * 
 * 3. Para ativar/desativar logs programaticamente:
 *    import { debug } from '@/lib/utils/debug-config';
 * 
 *    // Ativar/desativar todos os logs
 *    debug.enable(true);
 * 
 *    // Ativar/desativar módulo específico
 *    debug.toggleModule(DEBUG_MODULES.API_PROFILES, false);
 * 
 *    // Alterar nível de log
 *    debug.setLevel('info');
 */

// Exporte os DEBUG_MODULES para facilitar o uso
export { DEBUG_MODULES }; 