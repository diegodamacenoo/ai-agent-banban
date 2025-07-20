'use client';

import { useEffect } from 'react';
import { initializeDebugConfig } from '@/shared/utils/debug-config';

/**
 * Componente que inicializa a configuraÃ§Ã£o de debug na montagem da aplicaÃ§Ã£o.
 * Sem renderizaÃ§Ã£o visual.
 */
export default function InitDebug() {
  useEffect(() => {
    // Inicializa a configuraÃ§Ã£o de debug
    initializeDebugConfig();
    
    // NÃ£o hÃ¡ efeito visual, apenas inicializaÃ§Ã£o
  }, []);

  return null;
} 
