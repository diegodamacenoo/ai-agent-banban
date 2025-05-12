# Arquitetura (ARCHITECTURE.md)

Este documento fornece uma visão geral da arquitetura do projeto, incluindo a estrutura de pastas, os principais componentes e os padrões de design utilizados.

## Visão Geral

Este projeto consiste no desenvolvimento de uma solução baseada em Inteligência Artificial, conectada ao ERP da BanBan via webhook, com foco na gestão inteligente de produtos e estoque. A ferramenta oferece validação de cadastros, alertas automatizados, dashboards analíticos e sugestões estratégicas para otimização de giro, margem e redistribuição entre lojas.
O principal objetivo é resolver gargalos operacionais relacionados à lentidão na ativação de produtos, ruptura de estoque e baixa visibilidade dos indicadores de performance no ponto de venda, promovendo uma tomada de decisão mais ágil e baseada em dados.

## Estrutura de Pastas

Uma visão geral das pastas e arquivos mais importantes na raiz do projeto:

```
/
├── .next/            # Pasta de build do Next.js (gerada automaticamente)
├── .vscode/          # Configurações do VS Code para o projeto
├── docs/             # Documentação do projeto (SETUP.md, ARCHITECTURE.md, etc.)
├── node_modules/     # Dependências do projeto (gerenciadas pelo pnpm)
├── public/           # Arquivos estáticos servidos diretamente (imagens, fontes, etc.)
├── src/              # Código fonte principal da aplicação
│   ├── app/          # (Next.js App Router) Contém as rotas, páginas, layouts e API routes.
│   ├── components/   # Componentes React reutilizáveis (UI, shadcn/ui, etc.).
│   ├── hooks/        # Hooks React customizados para lógica reutilizável.
│   ├── lib/          # Funções utilitárias, helpers, configurações, validações (ex: Zod), clientes Supabase, etc.
│   └── middleware.ts # Middleware do Next.js para interceptar requisições (ex: autenticação).
├── .eslintrc.json    # Configuração do ESLint (descontinuado, ver eslint.config.mjs)
├── .gitignore        # Arquivos e pastas ignorados pelo Git.
├── components.json   # Configuração do shadcn/ui.
├── CONTRIBUTING.md   # Diretrizes para contribuir com o projeto.
├── eslint.config.mjs # Configuração principal do ESLint.
├── next-env.d.ts     # Declarações de tipo do Next.js para TypeScript.
├── next.config.ts    # Configuração do Next.js (ou .mjs).
├── package.json      # Metadados do projeto e dependências.
├── pnpm-lock.yaml    # Lockfile do PNPM, garante instalações consistentes.
├── postcss.config.js # Configuração do PostCSS (usado pelo Tailwind CSS).
├── postcss.config.mjs# Configuração alternativa do PostCSS.
├── README.md         # Ponto de entrada da documentação e visão geral.
├── tailwind.config.js# Configuração do Tailwind CSS.
└── tsconfig.json     # Configuração do TypeScript.
```

*   **`src/app/`**: Estruturada de acordo com o App Router do Next.js. Pastas representam segmentos de rota. Arquivos como `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, e `route.ts` definem a UI e o comportamento de cada rota.
*   **`src/components/`**: Contém componentes React. Provavelmente inclui componentes `ui/` gerados pelo shadcn/ui e componentes mais específicos da aplicação.
*   **`src/lib/`**: Módulos auxiliares genéricos. Contém utilitários (ex: `clsx`, `tailwind-merge`), configuração e cliente Supabase, validações com Zod, etc.
*   **`src/hooks/`**: Hooks customizados que encapsulam lógica de estado e efeitos colaterais reutilizáveis (ex: `use-debounce`).
*   **`src/middleware.ts`**: Executa código antes de uma requisição ser completada. Provavelmente usado para proteger rotas com base na autenticação Supabase.

## Principais Tecnologias e Bibliotecas

*   **Framework:** Next.js (App Router)
*   **Linguagem:** TypeScript
*   **Gerenciador de Pacotes:** PNPM
*   **Build/Dev Tool:** Turbopack (via `pnpm dev`)
*   **Estilização:** Tailwind CSS
*   **Componentes UI:** shadcn/ui (utilizando Radix UI por baixo dos panos)
*   **Backend/Autenticação:** Supabase (Auth Helpers, SSR, Supabase Client)
*   **Validação de Dados:** Zod
*   **Tabelas:** TanStack Table
*   **Gráficos:** Recharts
*   **Notificações (Toast):** Sonner
*   **Drag and Drop:** dnd-kit
*   **Linting:** ESLint
*   **Utilitários:** Lucide Icons, clsx, tailwind-merge, use-debounce

## Fluxos de Dados e Padrões

*   **Renderização:** Utiliza primariamente Server Components (padrão no App Router) para buscar dados no servidor (via Server Actions ou Route Handlers interagindo com Supabase) e renderizar a UI inicial. Client Components (`"use client"`) são usados para interatividade (event handlers, state, effects).
*   **Autenticação:** O fluxo de autenticação é gerenciado pelo Supabase Auth Helpers e SSR, provavelmente utilizando o `middleware.ts` para proteger rotas e cookies para gerenciar a sessão.
*   **Mutação de Dados:** Operações de escrita (CUD) provavelmente são feitas via Server Actions, que executam código seguro no servidor e podem revalidar dados ou redirecionar o usuário, ou via API Routes (`route.ts`).
*   **Gerenciamento de Estado:** O estado global pode ser gerenciado via Context API, Zustand, ou outras bibliotecas se necessário, mas Server Components reduzem a necessidade de estado global no cliente.
*   **Componentes:** A estrutura de componentes pode seguir princípios de Atomic Design ou simplesmente separar componentes de UI genéricos (`components/ui`) de componentes mais específicos da aplicação.

## Decisões Arquiteturais Chave

*   **Next.js App Router:** Escolhido pelas vantagens de Server Components (melhor performance, busca de dados simplificada), layouts aninhados, e features modernas do React.
*   **TypeScript:** Para segurança de tipos, melhor DX (autocompletar, refatoração) e manutenibilidade em projetos maiores.
*   **Tailwind CSS:** Abordagem utility-first para estilização rápida e consistente, com fácil customização via `tailwind.config.js`.
*   **shadcn/ui:** Biblioteca de componentes não opinativa, que permite copiar e colar código de componentes baseados em Radix UI e Tailwind, dando total controle sobre o código e estilo.
*   **Supabase:** Plataforma BaaS (Backend as a Service) que oferece banco de dados PostgreSQL, autenticação, storage e mais, simplificando o desenvolvimento backend.
*   **Zod:** Para validação robusta de dados em formulários, API routes e Server Actions, garantindo a integridade dos dados.