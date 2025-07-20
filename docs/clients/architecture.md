# Arquitetura do Sistema de Clientes

Este documento detalha a implementação técnica da arquitetura de clientes no frontend da plataforma Axon.

## 1. Estrutura de Diretórios

O código-fonte de todos os clientes reside no diretório `src/clients`. Cada subdiretório representa um cliente individual e encapsula toda a sua lógica específica.

```
src/clients/
├── banban/
│   ├── __tests__/
│   ├── components/
│   ├── services/
│   ├── types/
│   ├── config.ts
│   └── index.ts
│
└── riachuelo/
    └── (mesma estrutura)
```

- `__tests__/`: Testes unitários e de integração específicos para o cliente (Jest, React Testing Library).
- `components/`: Componentes React que são exclusivos deste cliente (ex: dashboards, formulários customizados).
- `services/`: Classes e funções que lidam com a lógica de negócio, como chamadas de API e manipulação de dados.
- `types/`: Definições TypeScript (interfaces, tipos) para este cliente.
- `config.ts`: O coração da configuração do cliente. Exporta um objeto que define o comportamento, tema e features.
- `index.ts`: Um ponto de entrada (facade) que exporta os artefatos públicos do cliente para serem consumidos pelo resto da aplicação.

## 2. Sistema de Configuração (`config.ts`)

A customização de um cliente é primariamente controlada pelo seu arquivo `config.ts`. Este arquivo exporta um objeto de configuração `as const` para garantir a imutabilidade e fornecer um intellisense preciso.

**Exemplo de `BANBAN_CONFIG`:**
```typescript
// src/clients/banban/config.ts

export const BANBAN_CONFIG = {
  name: 'BanBan Fashion',
  type: 'banban',
  features: {
    fashionMetrics: true,
    inventoryOptimization: false,
  },
  theme: {
    primary: '#FF4785',
  },
  endpoints: {
    performance: '/api/banban/performance',
  }
} as const;
```
A aplicação pode então usar essas flags para renderizar condicionalmente componentes ou habilitar/desabilitar funcionalidades, sem espalhar lógica específica do cliente pelo código.

## 3. Carregamento Dinâmico

O mecanismo que ativa um cliente específico é a variável de ambiente `NEXT_PUBLIC_CLIENT_TYPE`.

### 3.1. Carregador de Módulos

Criamos um "carregador de cliente" (`src/lib/client-loader.ts` - *exemplo hipotético*) que é responsável por importar e fornecer os módulos do cliente ativo.

```typescript
// src/lib/client-loader.ts (exemplo simplificado)

const CLIENT_TYPE = process.env.NEXT_PUBLIC_CLIENT_TYPE;

let clientModules: any;

switch (CLIENT_TYPE) {
  case 'banban':
    clientModules = require('../clients/banban');
    break;
  case 'riachuelo':
    clientModules = require('../clients/riachuelo');
    break;
d-efault:
    // Carregar um cliente padrão ou lançar um erro
    throw new Error(`Cliente desconhecido: ${CLIENT_TYPE}`);
}

export const useClient = () => clientModules;
```
Este hook `useClient` pode então ser usado em toda a aplicação para acessar a configuração, os serviços e os componentes do cliente ativo de forma segura e desacoplada.

### 3.2. Renderização de Componentes

Em páginas que precisam renderizar um componente específico do cliente (como um dashboard), usamos o carregador para obter o componente correto.

```tsx
// src/app/dashboard/page.tsx

import { useClient } from '@/lib/client-loader';

export default function DashboardPage() {
  const { BanBanFashionDashboard } = useClient(); // O nome do componente é conhecido pelo index.ts

  // Lógica para decidir qual dashboard renderizar
  // Neste exemplo, estamos assumindo que o hook retorna o componente correto
  
  if (!BanBanFashionDashboard) {
    return <div>Dashboard não encontrado para este cliente.</div>;
  }

  return <BanBanFashionDashboard />;
}
```

Esta abordagem garante que o código do núcleo da aplicação permaneça agnóstico ao cliente, delegando a responsabilidade de carregar os módulos corretos ao sistema de carregamento dinâmico. 