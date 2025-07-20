'use client';

import { useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/core/supabase/client';
import { dynamicModuleRegistry } from './DynamicModuleRegistry';

/**
 * Este provider garante que a instância singleton do DynamicModuleRegistry
 * seja inicializada com um cliente Supabase de navegador.
 * Ele deve ser usado no topo da árvore de componentes da aplicação.
 */
export function ModuleRegistryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Cria um cliente de navegador e o injeta na instância singleton do registry.
    // Isso garante que qualquer chamada subsequente ao registry no lado do cliente
    // use um cliente Supabase funcional.
    const supabase = createSupabaseBrowserClient();
    dynamicModuleRegistry.initialize(supabase);
  }, []); // Executa apenas uma vez, quando o provider é montado.

  return <>{children}</>;
}
