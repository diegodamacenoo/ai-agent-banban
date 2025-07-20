import { useState, useEffect } from 'react';
import type { ComponentType } from 'react';

// Tipos base para componentes customizados
export interface CustomDashboardProps {
  slug: string;
  organization: any;
  activeModules?: Array<{
    id: string;
    slug: string;
    name: string;
    description: string;
    is_visible: boolean;
    operational_status?: string;
  }>;
}



// Interface para registro de cliente
export interface ClientRegistry {
  Dashboard: ComponentType<CustomDashboardProps>;
  // Adicione outros componentes customizáveis aqui
}

// Mapeamento de tipos de cliente para identificadores
// NOTA: Se um client_type não estiver mapeado aqui, o sistema usará o dashboard padrão
const clientTypeMap: Record<string, string> = {
  'custom': 'banban', // O tipo 'custom' no banco mapeia para o cliente BanBan
  // 'standard' não está mapeado intencionalmente - usa dashboard padrão
  // Adicione outros mapeamentos aqui conforme necessário
};

// Mapa de clientes registrados
const clientRegistryMap: Record<string, () => Promise<ClientRegistry>> = {
  banban: () => import('./banban/components').then(m => ({
    Dashboard: m.BanBanDashboardWrapper,
  })),
  // Adicione outros clientes aqui
};

// Função para carregar componentes do cliente
export async function loadClientComponents(clientId: string): Promise<ClientRegistry | null> {
  try {
    const registryLoader = clientRegistryMap[clientId];
    if (!registryLoader) return null;
    
    return await registryLoader();
  } catch (error) {
    console.error(`Erro ao carregar componentes do cliente ${clientId}:`, error);
    return null;
  }
}

// Hook para carregar componentes do cliente
export function useClientComponents(clientType: string | null) {
  const [components, setComponents] = useState<ClientRegistry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadComponents() {
      if (!clientType) {
        setComponents(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Mapeia o tipo de cliente para o identificador correto
        const clientId = clientTypeMap[clientType.toLowerCase()];
        
        // Se não houver mapeamento para o tipo de cliente, significa que deve usar o dashboard padrão
        if (!clientId) {
          console.debug(`Tipo de cliente "${clientType}" não mapeado - usando dashboard padrão`);
          setComponents(null);
          setLoading(false);
          return;
        }

        const loader = clientRegistryMap[clientId];
        if (!loader) {
          console.warn(`Cliente "${clientId}" não encontrado no registro - usando dashboard padrão`);
          setComponents(null);
          setLoading(false);
          return;
        }

        const clientComponents = await loader();
        setComponents(clientComponents);
      } catch (err) {
        console.error('Erro ao carregar componentes do cliente:', err);
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
        setComponents(null);
      } finally {
        setLoading(false);
      }
    }

    loadComponents();
  }, [clientType]);

  return { components, loading, error };
} 