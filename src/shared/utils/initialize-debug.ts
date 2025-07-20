import { initializeDebugConfig, DEBUG_MODULES } from './debug-config';

// Inicializa a configuraÃ§Ã£o de debug
initializeDebugConfig();

/**
 * Arquivo de inicializaÃ§Ã£o da configuraÃ§Ã£o de debug
 * 
 * Para usar o sistema de logs:
 * 
 * 1. Importe este mÃ³dulo no ponto de entrada da aplicaÃ§Ã£o:
 *    import '@/shared/utils/initialize-debug';
 * 
 * 2. Em seus componentes/serviÃ§os, use o logger:
 *    import { createLogger } from '@/shared/utils/logger';
 *    import { DEBUG_MODULES } from '@/shared/utils/debug-config';
 * 
 *    const logger = createLogger(DEBUG_MODULES.UI_DASHBOARD);
 *    logger.debug('Mensagem de debug');
 * 
 * 3. Para ativar/desativar logs programaticamente:
 *    import { debug } from '@/shared/utils/debug-config';
 * 
 *    // Ativar/desativar todos os logs
 *    debug.enable(true);
 * 
 *    // Ativar/desativar mÃ³dulo especÃ­fico
 *    debug.toggleModule(DEBUG_MODULES.API_PROFILES, false);
 * 
 *    // Alterar nÃ­vel de log
 *    debug.setLevel('info');
 */

// Exporte os DEBUG_MODULES para facilitar o uso
export { DEBUG_MODULES }; 
