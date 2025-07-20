# Guia de Migração para a Arquitetura de Clientes Axon

Este guia destina-se a desenvolvedores que precisam migrar funcionalidades de um sistema legado ou de uma implementação monolítica anterior para a nova arquitetura multi-cliente da Axon.

## 1. Princípios da Migração

- **Incremental e Iterativa:** Não tente migrar tudo de uma vez. Planeje a migração em partes, começando pelas funcionalidades mais isoladas.
- **Foco no Isolamento:** O objetivo principal é desacoplar a lógica específica do cliente do núcleo da plataforma.
- **Refatoração Contínua:** A migração é uma oportunidade para melhorar a qualidade do código, remover débitos técnicos e aumentar a cobertura de testes.

## 2. Checklist de Migração

Use este checklist para garantir que todos os passos foram concluídos ao migrar uma funcionalidade para um cliente específico (ex: "BanBan").

### ☐ **1. Análise e Planejamento**
- [ ] Identificar todas as funcionalidades a serem migradas.
- [ ] Mapear quais componentes, serviços e tipos pertencem exclusivamente ao cliente.
- [ ] Identificar o código que é compartilhado e que deve permanecer no núcleo (`/src/components`, `/src/lib`, etc.).

### ☐ **2. Estrutura do Cliente**
- [ ] Criar a estrutura de diretórios para o cliente em `src/clients/[nome-do-cliente]/`.
- [ ] Configurar o arquivo `config.ts` com as flags e endpoints necessários para a funcionalidade.

### ☐ **3. Migração de Componentes**
- [ ] Mover os componentes React específicos do cliente de `/src/app`, `/src/components` para `src/clients/[nome-do-cliente]/components/`.
- [ ] Refatorar os componentes para remover qualquer lógica de negócio, movendo-a para os serviços.
- [ ] Substituir importações diretas por importações do `index.ts` do cliente.

### ☐ **4. Migração de Lógica de Negócio (Serviços)**
- [ ] Mover a lógica de chamadas de API, manipulação de dados e regras de negócio para `src/clients/[nome-do-cliente]/services/`.
- [ ] Criar classes de serviço (como o `BanBanService`) para encapsular a lógica.
- [ ] Garantir que os serviços sejam facilmente testáveis e, se necessário, utilizem injeção de dependência.

### ☐ **5. Migração de Tipos**
- [ ] Mover as definições de tipo (TypeScript) específicas do cliente para `src/clients/[nome-do-cliente]/types/`.
- [ ] Centralizar as exportações de tipos no arquivo `index.ts` da pasta de tipos.

### ☐ **6. Refatoração e Limpeza**
- [ ] Remover os arquivos antigos das localizações originais (`/src/app`, `/src/components`).
- [ ] Verificar se não há referências cruzadas entre clientes.
- [ ] Executar o linter (`npm run lint`) e os testes (`npm run test`) para garantir a integridade.
- [ ] Atualizar a documentação, se necessário.

## 3. Exemplo Prático: Migrando um Dashboard

**Cenário:** Um componente `FashionDashboard` localizado em `/src/app/(dashboard)/page.tsx` que contém chamadas de API e lógica de exibição para o cliente BanBan.

**Passos:**

1.  **Mover Componente:** Mova `/src/app/(dashboard)/page.tsx` para `src/clients/banban/components/BanBanFashionDashboard.tsx`.
2.  **Criar Serviço:** Crie `src/clients/banban/services/banban-service.ts`. Extraia toda a lógica de `fetch`, `useEffect` e manipulação de dados do componente para métodos dentro deste serviço (ex: `getFashionMetrics()`).
3.  **Refatorar Componente:** O `BanBanFashionDashboard` agora deve apenas chamar os métodos do `BanBanService` e renderizar os dados. Ele se torna um "dumb component".
4.  **Criar Tipos:** Defina as interfaces para os dados (ex: `FashionMetrics`) em `src/clients/banban/types/index.ts`.
5.  **Atualizar Página Principal:** A página em `/src/app/(dashboard)/page.tsx` agora se torna um "loader" que, com base na variável de ambiente, renderiza o dashboard do cliente correto.

```tsx
// /src/app/(dashboard)/page.tsx

import { getClientDashboard } from '@/lib/client-loader';

export default function DashboardPage() {
  const ClientDashboard = getClientDashboard();
  return <ClientDashboard />;
}
```

Este processo garante que o código principal permaneça limpo e agnóstico ao cliente, enquanto a lógica específica é mantida de forma isolada e organizada. 