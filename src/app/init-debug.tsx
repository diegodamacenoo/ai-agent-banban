'use client';

import { useEffect } from 'react';
import { initializeDebugConfig } from '@/shared/utils/debug-config';
import { initializeSyncDebugSystem } from '@/app/actions/admin/modules/system-config-utils';

/**
 * Componente que inicializa a configuraÃ§Ã£o de debug na montagem da aplicaÃ§Ã£o.
 * Sem renderizaÃ§Ã£o visual.
 */
export default function InitDebug() {
  useEffect(() => {
    async function initializeDebugSystems() {
      try {
        // Inicializa configuração de debug existente (client-side)
        initializeDebugConfig();
        
        // Inicializa sistema de debug condicional (server-side)
        await initializeSyncDebugSystem();
        
        console.debug('[INIT] Sistemas de debug inicializados com sucesso');
      } catch (error) {
        console.warn('[INIT] Erro ao inicializar sistemas de debug:', error);
      }
    }
    
    initializeDebugSystems();
  }, []);

  return null;
} 
