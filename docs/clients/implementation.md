# Guia Prático: Implementando um Novo Cliente

Este guia é um tutorial passo a passo para implementar um novo cliente na plataforma Axon. Vamos criar um cliente hipotético chamado **"Nexus"**, que terá seu próprio tema e um dashboard simples.

## Pré-requisitos

- Ambiente de desenvolvimento configurado (siga o [Guia de Setup](./../setup/README.md)).
- Entendimento da [Arquitetura de Clientes](./architecture.md).

---

### Passo 1: Criar a Estrutura do Cliente

1.  Crie um novo diretório `nexus` dentro de `src/clients/`.
2.  Dentro de `src/clients/nexus/`, crie a seguinte estrutura de arquivos e pastas:

    ```
    nexus/
    ├── components/
    │   └── NexusDashboard.tsx
    ├── services/
    │   └── nexus-service.ts
    ├── types/
    │   └── index.ts
    ├── config.ts
    └── index.ts
    ```

---

### Passo 2: Definir a Configuração (`config.ts`)

No arquivo `src/clients/nexus/config.ts`, defina a configuração básica para o cliente Nexus.

```typescript
import { NexusConfig } from './types';

export const NEXUS_CONFIG: NexusConfig = {
  name: 'Nexus Corp',
  type: 'nexus',
  features: {
    realTimeAnalytics: true,
  },
  theme: {
    primary: '#3b82f6', // blue-500
    secondary: '#10b981', // green-500
  },
  endpoints: {
    analytics: '/api/nexus/analytics',
  },
};
```

---

### Passo 3: Definir os Tipos (`types/index.ts`)

Defina as interfaces TypeScript que serão usadas pelo cliente.

```typescript
// src/clients/nexus/types/index.ts

// Tipo para a configuração, garantindo a tipagem forte
export type NexusConfig = {
  name: string;
  type: 'nexus';
  features: {
    realTimeAnalytics: boolean;
  };
  theme: {
    primary: string;
    secondary: string;
  };
  endpoints: {
    analytics: string;
  };
};

// Tipo para os dados do dashboard
export type AnalyticsData = {
  activeUsers: number;
  requestsPerSecond: number;
};
```

---

### Passo 4: Criar o Serviço (`services/nexus-service.ts`)

Implemente o serviço que buscará os dados para o dashboard.

```typescript
import { NEXUS_CONFIG } from '../config';
import { AnalyticsData } from '../types';

export class NexusService {
  private static instance: NexusService;

  public static getInstance(): NexusService {
    if (!NexusService.instance) {
      NexusService.instance = new NexusService();
    }
    return NexusService.instance;
  }

  public async getAnalytics(): Promise<AnalyticsData> {
    // Em uma aplicação real, você faria um fetch para NEXUS_CONFIG.endpoints.analytics
    // Aqui, vamos retornar dados mockados.
    return Promise.resolve({
      activeUsers: Math.floor(Math.random() * 1000),
      requestsPerSecond: Math.floor(Math.random() * 150),
    });
  }
}
```

---

### Passo 5: Criar o Componente (`components/NexusDashboard.tsx`)

Crie o componente de dashboard que usará o serviço para buscar e exibir os dados.

```tsx
'use client';

import { useEffect, useState } from 'react';
import { NexusService } from '../services/nexus-service';
import { AnalyticsData } from '../types';
import { NEXUS_CONFIG } from '../config';

export function NexusDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const service = NexusService.getInstance();
    service.getAnalytics().then(setData);
  }, []);

  return (
    <div style={{ border: `2px solid ${NEXUS_CONFIG.theme.primary}`, padding: '16px' }}>
      <h1 style={{ color: NEXUS_CONFIG.theme.primary }}>{NEXUS_CONFIG.name} Dashboard</h1>
      {data ? (
        <div>
          <p>Active Users: {data.activeUsers}</p>
          <p>Requests per Second: {data.requestsPerSecond}</p>
        </div>
      ) : (
        <p>Loading analytics...</p>
      )}
    </div>
  );
}
```

---

### Passo 6: Exportar os Módulos (`index.ts`)

Crie a fachada do módulo, exportando os artefatos necessários.

```typescript
// src/clients/nexus/index.ts

export { NEXUS_CONFIG } from './config';
export { NexusDashboard } from './components/NexusDashboard';
export { NexusService } from './services/nexus-service';
export * from './types';
```

---

### Passo 7: Adicionar o Script de Desenvolvimento

No `package.json`, adicione o script para rodar o cliente Nexus.

```json
"scripts": {
  // ...
  "dev:banban": "NEXT_PUBLIC_CLIENT_TYPE=banban next dev",
  "dev:nexus": "NEXT_PUBLIC_CLIENT_TYPE=nexus next dev"
},
```

---

### Passo 8: Rodar e Testar

1.  **Configure o `hosts`:** Adicione `127.0.0.1 nexus.axon.localhost` ao seu arquivo de hosts.
2.  **Modifique o `client-loader`:** Adicione o `case 'nexus'` no seu carregador de clientes para que ele possa encontrar os módulos.
3.  **Inicie o servidor:**
    ```bash
    pnpm dev:nexus
    ```
4.  Acesse [http://nexus.axon.localhost:3000/dashboard](http://nexus.axon.localhost:3000/dashboard) (supondo que a página de dashboard esteja configurada para carregar o componente do cliente). Você deverá ver o dashboard do Nexus com seu tema e dados. 