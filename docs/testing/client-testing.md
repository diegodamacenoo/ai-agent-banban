# Guia de Testes para Módulos de Clientes

Este guia fornece diretrizes e exemplos práticos para testar as implementações específicas de cada cliente, garantindo que as customizações sejam robustas e não introduzam regressões.

## 1. Estrutura de Testes do Cliente

Todos os testes para um cliente devem residir no diretório `__tests__` dentro da pasta do cliente. A estrutura interna deve espelhar a estrutura do cliente.

```
src/clients/banban/
└── __tests__/
    ├── components/
    │   └── BanBanFashionDashboard.test.tsx
    └── services/
        └── banban-service.test.ts
```

## 2. Testando Componentes Específicos

Componentes de clientes geralmente dependem de serviços e configurações específicas. O segredo para testá-los de forma eficaz é **isolar o componente**, mockando suas dependências.

**Ferramentas:** Jest, React Testing Library.

### Exemplo: Testando o `BanBanFashionDashboard`

**Objetivo:** Verificar se o dashboard renderiza corretamente os dados recebidos do `BanBanService` e se exibe uma mensagem de "loading" enquanto os dados não chegam.

```tsx
// src/clients/banban/__tests__/components/BanBanFashionDashboard.test.tsx

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BanBanFashionDashboard } from '../../components/BanBanFashionDashboard';
import { BanBanService } from '../../services/banban-service';

// Mock completo do serviço para controlar o que ele retorna nos testes
jest.mock('../../services/banban-service');

describe('BanBanFashionDashboard', () => {
  const mockBanBanService = BanBanService as jest.Mocked<typeof BanBanService>;

  it('should display a loading state initially', () => {
    // Mock para simular uma chamada de API pendente
    mockBanBanService.getInstance.mockReturnValue({
      getFashionMetrics: jest.fn().mockReturnValue(new Promise(() => {})), // Promessa que nunca resolve
    } as any);

    render(<BanBanFashionDashboard />);
    
    expect(screen.getByText(/carregando métricas/i)).toBeInTheDocument();
  });

  it('should render fashion metrics when data is fetched', async () => {
    const mockMetrics = { totalRevenue: 50000, topSeller: 'Camisa X' };

    // Mock para simular uma chamada de API bem-sucedida
    mockBanBanService.getInstance.mockReturnValue({
      getFashionMetrics: jest.fn().mockResolvedValue(mockMetrics),
    } as any);

    render(<BanBanFashionDashboard />);

    // Usa waitFor para aguardar a resolução da promessa e a atualização do DOM
    await waitFor(() => {
      expect(screen.getByText(/faturamento total/i)).toBeInTheDocument();
      expect(screen.getByText(/R\$ 50.000,00/)).toBeInTheDocument(); // Exemplo de formatação
    });
  });
});
```
**Pontos-chave:**
- **Mock do Serviço:** Usamos `jest.mock` para substituir o `BanBanService` real por uma versão controlada, evitando chamadas de API reais.
- **Testando Estados:** Testamos explicitamente os estados de carregamento e de dados recebidos.
- **`waitFor`:** Usado para lidar com atualizações de estado assíncronas.

## 3. Testando Serviços Específicos

Serviços de clientes encapsulam a lógica de negócio. Os testes devem focar em garantir que essa lógica funcione como esperado.

### Exemplo: Testando o `BanBanService`

**Objetivo:** Garantir que o padrão Singleton funciona e que os métodos de busca de dados chamam os endpoints corretos.

```ts
// src/clients/banban/__tests__/services/banban-service.test.ts

import { BanBanService } from '../../services/banban-service';
import { BANBAN_CONFIG } from '../../config';

// Mock do `fetch` global para não fazer chamadas de rede
global.fetch = jest.fn();

describe('BanBanService', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should be a singleton', () => {
    const instance1 = BanBanService.getInstance();
    const instance2 = BanBanService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should call the correct endpoint for getFashionMetrics', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const service = BanBanService.getInstance();
    await service.getFashionMetrics();

    expect(fetch).toHaveBeenCalledWith(
      BANBAN_CONFIG.endpoints.performance, // Verifica se o endpoint da config foi usado
      expect.any(Object) // Headers, etc.
    );
  });
});
```
**Pontos-chave:**
- **Mock de `fetch`:** Testamos se o serviço chama a API corretamente sem de fato fazer uma requisição de rede.
- **Uso da Config:** O teste verifica se o serviço está utilizando os endpoints definidos no `BANBAN_CONFIG`, garantindo o desacoplamento.
- **Singleton:** Um teste simples garante que o padrão de design está sendo respeitado. 