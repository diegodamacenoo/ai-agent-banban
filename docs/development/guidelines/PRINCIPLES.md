# Princípios Fundamentais da Arquitetura

Este documento descreve os princípios essenciais que guiam o desenvolvimento e a arquitetura da aplicação, garantindo consistência, performance e segurança.

---

## Server Actions para Mutações e Interações com o Servidor

As **Server Actions** são o pilar para todas as operações que interagem com o backend, especialmente mutações.

* **Persistência de Dados**: Todas as operações de CRUD (Criar, Ler, Atualizar, Deletar) que envolvem persistência de dados no backend **DEVEM** ser encapsuladas em Server Actions.
* **Fonte da Verdade**: O banco de dados, acessado exclusivamente via Server Actions, é a **fonte única da verdade** para todos os dados persistentes da aplicação.
* **Validação**: É crucial implementar **validação de dados** (com [Zod](https://zod.dev/)) tanto no cliente (para feedback imediato ao usuário) quanto no servidor (para garantir a integridade dos dados e segurança).
* **Otimização de Consultas**: Priorize a seleção explícita de colunas nas consultas ao banco de dados (evite `select('*')`) para otimizar a performance e melhorar a clareza do código.

---

## Renderização e Busca de Dados

A escolha entre Server Components e Client Components é fundamental para otimização e experiência do usuário.

* **Server Components**: Utilize para **renderização inicial**, páginas estáticas ou busca de dados inicial que não requerem interatividade complexa imediata. Eles executam no servidor, otimizando o carregamento inicial.
* **Client Components**: Use para **UI interativa** e para buscas de dados disparadas por interação do usuário.
    * **Busca de Dados Inerente à Interação**: Se a busca for disparada por uma interação do usuário (ex: paginação, filtros em tempo real), podem ser usados **API Routes** (integradas com bibliotecas como [TanStack Query](https://tanstack.com/query/latest)) ou **Server Actions** chamadas a partir do cliente.
    * **Busca de Dados Inicial em Client Components**: Podem buscar dados iniciais através de Server Actions chamadas dentro de `useEffect` ou custom hooks de data fetching.

---

## API Routes

As **API Routes** têm um papel específico dentro da arquitetura.

* Reservar para **endpoints genuinamente públicos** ou para casos onde Server Actions não são a solução ideal (ex: webhooks, integrações com serviços de terceiros que exigem um endpoint HTTP tradicional).
* Sua estrutura de diretórios deve ser **espelhada** com a das Server Actions (ex: `/api/auth/` para rotas de autenticação).

---

## Separação de Lógicas

Manter uma clara distinção entre as responsabilidades do servidor e do cliente é vital.

* **Lógica de Servidor**: Server Actions, API Routes, e qualquer código utilitário em `app/server/` devem lidar com persistência de dados, lógica de negócio sensível e acesso a recursos de backend.
* **Lógica de Cliente**: Client Components devem focar na renderização da UI, interações do usuário e gerenciamento de estado local.

---

## Segurança

A segurança é uma preocupação transversal em toda a aplicação.

* Implemente **middleware Next.js** para autenticação e autorização de rotas, garantindo que apenas usuários autorizados acessem certas páginas.
* **Valide permissões** estritamente dentro das Server Actions e API Routes, antes de qualquer operação de escrita ou leitura sensível, para proteger contra acessos indevidos.