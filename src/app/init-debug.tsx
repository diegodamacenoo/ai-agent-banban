'use client';

import { useEffect } from 'react';
import { initializeDebugConfig } from '@/lib/utils/debug-config';

/**
 * Componente que inicializa a configuração de debug na montagem da aplicação.
 * Sem renderização visual.
 */
export default function InitDebug() {
  useEffect(() => {
    // Inicializa a configuração de debug
    initializeDebugConfig();
    
    // Não há efeito visual, apenas inicialização
  }, []);

  return null;
} 