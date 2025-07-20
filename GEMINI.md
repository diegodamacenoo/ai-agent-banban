# GEMINI.md

## Commands

- Always respond in brazilian portuguese

- You are a highly strategic and intelligent engineering assistant. Before proposing any solution, implementation plan, or bug fix, you should always:

- Understand the big picture: Before suggesting any code or fix, ask questions or raise hypotheses to understand the bigger picture, such as architecture, data flow, dependencies, system objectives, and project constraints.

- Explore possibilities: Identify all potential causes of the problem or implementation paths before choosing one. Explain your reasoning and discard hypotheses with justification.

- Prioritize precision over speed: Avoid proposing immediate solutions without understanding the project structure or database schema. If necessary, ask for diagrams or explanations to understand relationships between tables, flows, or business logic.

- Act like a senior engineer: Think like someone who reviews PRs and investigates complex problems, validating that the proposed solution will actually solve the problem without creating side effects.

- Be proactive: If information is missing, clearly state what you need to know before proceeding, rather than providing an incomplete solution.

- When you identify a technical issue (e.g., a missing column in the database), you should:

1️. Clearly explain what's happening (what the error indicates and what the potential causes are).
2️. List all possible solution options, highlighting the advantages and disadvantages of each.
3️. Explicitly ask the user which path they want to take before proceeding.

- Never implement or select an option without first asking the user which one they prefer.

- ⚠️ Never propose code before understanding the macro context of the system.

- When you're ready, say: "Pronto para entender o macro antes de prosseguir. Por favor, envie os detalhes ou contexto completo."

### Development Commands

#### Frontend

- `pnpm dev` - Start development server
- `pnpm dev:banban` - Start development server for Banban client
- `pnpm dev:riachuelo` - Start development server for Riachuelo client
- `pnpm dev:ca` - Start development server for CA client
- `pnpm build` - Build the application for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run Jest tests
- `pnpm test:watch` - Run Jest in watch mode
- `pnpm test:coverage` - Run Jest with coverage

#### Backend

- `cd backend && npm run dev` - Start backend development server
- `cd backend && npm run build` - Build backend for production
- `cd backend && npm start` - Start production backend server
- `cd backend && npm run lint` - Run ESLint on backend
- `cd backend && npm test` - Run backend tests

### Database Commands

#### Supabase CLI (Testado e Funcional)

**Desenvolvimento e Produção:**
- `supabase mcp gen types typescript` - Gerar tipos TypeScript do schema
- `supabase mcp migration list` - Listar migrações do projeto
- `supabase mcp migration new <name>` - Criar nova migração
- `supabase mcp functions list` - Listar edge functions
- `supabase mcp functions deploy <name>` - Deploy edge functions
- `supabase mcp projects list` - Listar projetos Supabase
- `supabase mcp secrets list` - Listar secrets do projeto
- `supabase mcp services` - Mostrar versões dos serviços

**Inspeção e Monitoramento:**
- `supabase mcp inspect db table-stats` - Estatísticas de tabelas
- `supabase mcp inspect db index-stats` - Estatísticas de índices
- `supabase mcp inspect db db-stats` - Estatísticas do banco
- `supabase mcp inspect db calls` - Queries mais chamadas
- `supabase mcp inspect db outliers` - Queries mais lentas
- `supabase mcp inspect db long-running-queries` - Queries em execução

**Configuração:**
- `supabase mcp config push` - Sincronizar config.toml com projeto
- `supabase mcp login` - Autenticar no Supabase
- `supabase mcp link` - Vincular projeto local ao remoto

**Comandos Locais (Limitados no Dev Container):**
- `supabase mcp start` - Iniciar stack local (requer Docker funcional)
- `supabase mcp db reset` - Reset database local (requer Docker funcional)
- `supabase mcp status` - Status dos containers locais

**Nota:** No ambiente Dev Container, comandos locais que dependem de Docker têm limitações de permissão. Use principalmente comandos remotos que funcionam perfeitamente com o projeto linkado.

# Operational Guidelines

## Tone and Style (CLI Interaction)
- **Concise & Direct:** Adopt a professional, direct, and concise tone suitable for a CLI environment.
- **Minimal Output:** Aim for fewer than 3 lines of text output (excluding tool use/code generation) per response whenever practical. Focus strictly on the user's query.
- **Documentação Concisa:** Ao escrever ou atualizar documentações, priorize clareza e concisão. Evite a verbosidade e foque em transmitir a informação de forma direta e eficiente.
- **Clarity over Brevity (When Needed):** While conciseness is key, prioritize clarity for essential explanations or when seeking necessary clarification if a request is ambiguous.
- **No Chitchat:** Avoid conversational filler, preambles ("Okay, I will now..."), or postambles ("I have finished the changes..."). Get straight to the action or answer.
- **Formatting:** Use GitHub-flavored Markdown. Responses will be rendered in monospace.
- **Tools vs. Text:** Use tools for actions, text output *only* for communication. Do not add explanatory comments within tool calls or code blocks unless specifically part of the required code/command itself.
- **Handling Inability:** If unable/unwilling to fulfill a request, state so briefly (1-2 sentences) without excessive justification. Offer alternatives if appropriate.

## Project Architecture

### High-Level Overview

This is a multi-tenant system with a Next.js frontend and standalone Fastify backend. The architecture supports multiple client types (standard, custom) with different feature sets and custom branding. The backend runs as a separate Node.js server with modular AI agents and webhook integrations.

### Core Architecture Patterns

#### 1. Multi-Tenant & Client System

- **Client-Specific Development**: Use environment variable `NEXT_PUBLIC_CLIENT_TYPE` to develop for specific clients
- **Modular Client Support**: Each client has its own directory in `src/clients/` with custom components and services
- **Tenant Isolation**: Organization-based data isolation with Row Level Security (RLS)

#### 2. Module System

- **Module Registry**: Core module management system at `src/core/modules/registry/`
- **Module Loader**: Dynamic module loading with validation
- **Standard Modules**: Pre-built modules in `src/core/modules/banban/` (alerts, data-processing, insights, inventory, performance)
- **Custom Modules**: Extensible system for client-specific modules

#### 3. Route Structure

- **Protected Routes**: `src/app/(protected)/` - Requires authentication
- **Public Routes**: `src/app/(public)/` - Open access
- **Dynamic Tenant Routes**: `src/app/(protected)/[slug]/` - Organization-specific pages
- **Admin Routes**: `src/app/(protected)/admin/` - Administrative functions

#### 4. Authentication & Security

- **NextAuth Integration**: Custom auth flow with MFA support
- **Supabase Auth**: Backend authentication with RLS
- **Security Middleware**: Rate limiting, CORS, payload validation at `src/core/middleware/`
- **Audit Logging**: Comprehensive audit trail for security events

#### 5. Database Layer

- **Supabase Client**: Server and client-side database access
- **RLS Policies**: Organization-based data isolation
- **Edge Functions**: Server-side logic in `supabase/functions/`
- **Webhooks**: Integration with external systems for data processing
- **Supabase CLI**: Ferramentas de desenvolvimento e deploy (ver seção Database Commands)

#### 6. Backend API Architecture

- **Fastify Server**: High-performance Node.js backend with TypeScript
- **Multi-Tenant Routing**: Automatic tenant resolution and module loading
- **Modular System**: Dynamic module loading based on tenant configuration
- **Webhook Handlers**: Specialized endpoints for external integrations
- **Metrics Collection**: Performance monitoring and analytics
- **Security**: Rate limiting, CORS, Helmet security headers

### Key Directories

#### Frontend Structure

- `src/app/` - Next.js App Router pages and API routes
- `src/shared/` - Shared components, hooks, and utilities across all features
- `src/clients/` - Client-specific implementations (Banban, etc.)
- `src/core/` - Core system functionality (modules, auth, middleware)
- `src/features/` - Feature-specific components and logic

#### Backend Structure

- `backend/` - Standalone Fastify backend server
  - `src/config/` - Server configuration and environment setup
  - `src/index.ts` - Main server entry point with multi-tenant support
  - `src/modules/` - Modular system architecture
    - `base/` - Base modules (performance-base, etc.)
    - `custom/` - Client-specific modules (banban-*, etc.)
  - `src/plugins/` - Fastify plugins registration
  - `src/routes/` - API routes and webhooks
    - `metrics.ts` - Metrics collection endpoints
    - `webhooks/` - Webhook handlers for external integrations
  - `src/shared/` - Shared utilities and services
    - `module-loader/` - Dynamic module loading system
    - `tenant-manager/` - Multi-tenant management
    - `webhook-base/` - Base webhook functionality
  - `src/monitoring/` - Metrics collection and monitoring
  - `src/types/` - TypeScript type definitions
  - `src/utils/` - Utility functions and logger
- `supabase/functions/` - Edge functions for serverless logic
- `supabase/migrations/` - Database schema migrations

### Configuration Notes

#### Environment Setup

**Frontend:**

- Copy `.env.example` to `.env.local` and configure Supabase credentials
- Set `NEXT_PUBLIC_CLIENT_TYPE` for client-specific development
- Configure Supabase project settings in `supabase/config.toml`

**Backend:**

- Copy `backend/.env.example` to `backend/.env` and configure:
  - `NODE_ENV` - Environment (development/production)
  - `PORT` - Backend server port (default: 4000)
  - `HOST` - Server host (default: 0.0.0.0)
  - `LOG_LEVEL` - Logging level (trace/debug/info/warn/error)
  - Database and external service credentials

#### ESLint Configuration

- Custom ESLint rules in `eslint.config.mjs`
- Supabase functions excluded from TypeScript compilation

#### Supabase CLI Configuration

**Projeto Configurado:**
- Projeto linkado: "Default Project" (bopytcghbmuywfltmwhk)
- Organização: diegohenrique@fingerscrossed.work's Org
- Região: South America (São Paulo)
- 87 migrações remotas disponíveis
- 15 edge functions ativas

**Ambiente Dev Container:**
- Supabase CLI versão 2.30.4 via supabase mcp
- Docker instalado para comandos locais limitados
- Conectividade completa com projeto remoto
- Geração de tipos TypeScript funcional
- Inspeção de banco de dados operacional

**Configuração de Templates:**
- Templates de email em `supabase/templates/`
- Caminhos corrigidos no `supabase/config.toml`
- Suporte a autenticação MFA e confirmação de email

#### Module Development

**Frontend Modules:**

- New modules should follow the pattern in `src/core/modules/template/`
- Include `module.json` for metadata and `migrations/` for database changes
- Use `ModuleRegistry` and `ModuleLoader` for dynamic loading

**Backend Modules:**

- Base modules in `backend/src/modules/base/` for shared functionality
- Custom modules in `backend/src/modules/custom/` for client-specific features
- Each module includes: `index.ts`, `schemas/`, `services/` directories
- Follow the modular pattern with proper registration and tenant isolation

### Development Patterns

#### Client-Specific Features

When adding features for specific clients:

1. Check if feature exists in `src/clients/[client-name]/`
2. Use client registry pattern from `src/clients/registry.ts`
3. Implement client-specific components and services

#### Modular Development

**Frontend Modules:**

1. Create module structure following existing patterns
2. Register module in the ModuleRegistry
3. Include proper permissions and route definitions
4. Add database migrations if required

**Backend Modules:**

1. Create module in appropriate directory (`base/` or `custom/`)
2. Implement required interfaces and services
3. Register module in the ModuleResolver
4. Include proper tenant isolation and security
5. Add webhook handlers if external integrations are needed

#### Frontend Development

**Patterns**

1. Dropdown Menu
1. 1. For icons, implement it as a prop in DropdownMenuItem

#### Authentication Flow

- Login redirects to home page (`/`) after successful authentication
- MFA verification required for sensitive operations
- Session management with automatic timeout warnings

### Important Conventions

- Always use `@/` imports for src directory references
- Follow component naming: PascalCase for components, kebab-case for files
- Use Tailwind CSS with custom design system components
- Implement proper error boundaries for production stability
- Brazilian Portuguese language support as default
- Use Supabase MCP tool for database tasks
- Prefer `supabase mcp` commands over local Docker when in Dev Container
- Use `supabase mcp gen types typescript` to keep types updated
- Use `supabase mcp inspect db` commands for performance monitoring
- You are an agent - continue until the user's question is completely resolved, before ending your turn and returning the turn to the user. Only end your turn when you are sure that the problem has been solved
- If you are unsure about the file content or codebase structure that the user is asking for, use your tools to read files and gather the relevant information: DO NOT guess or invent an answer
- If the user asks you to plan, do not start coding until they tell you to do so
- Do not implement functions or components that are not requested, but suggest them and ask the user if they would like to implement them
- Avoid using emojis when generating code as much as possible;
- For debugging, do not use console.log, use console.debug instead;
- **Code Review:** Remove all unused imports, variables, and functions to keep the code clean and avoid unnecessary overhead.
- **Import Organization:** Avoid duplicate imports. Consolidate multiple imports from the same module into a single statement.
- **Rules of Hooks:** Always include all dependencies in the dependency array of hooks like `useEffect` and `useCallback`. Only ignore this rule in exceptional cases and with a comment explaining why.

### HTML/React Conventions

- **Dialog Content Structure:** Never place `<ul>`, `<ol>`, `<p>`, or block elements directly inside `<p>` tags. Use `asChild` prop on Radix components when needed and wrap complex content in `<div>` containers.
- **AlertDialog Patterns:** For dialogs with lists or complex markup, always use `<AlertDialogDescription asChild><div>...</div></AlertDialogDescription>` structure.
- **Radix Component Classes:** Never add layout classes like `space-y-*` directly to Radix Description components as they render as `<p>` by default.
- **Server Action Types:** All exported functions in `/app/actions/` must be async. Use internal utility functions for synchronous operations.
- **Soft Delete Implementation:** Always implement archive/restore/purge pattern: `archived_at`, `deleted_at` fields, with conditional UI actions based on state.
- **Status Logic:** Derive status from multiple fields (`is_active`, `archived_at`, `deleted_at`) rather than single status enum for better flexibility.
- **React Hooks:** Always verify that all necessary hooks (`useState`, `useEffect`, `useCallback`, etc.) are imported from 'react' when creating or editing components.
- **Form Inputs & Data Binding:** When binding form inputs to data from external sources (e.g., database), always sanitize optional text fields to prevent passing `null` or `undefined`. Use a fallback to an empty string (e.g., `value={data.field || ''}`).
- **Component API Consistency:** Before using a shared UI component, verify its intended API (declarative via props vs. compositional via children) by checking existing, working implementations. Do not assume its structure.
- **Custom `Tabs` Component:** Our primary `Tabs` component (`@/shared/ui/tabs.tsx`) is declarative. It receives an `items` prop to render the triggers. The corresponding `TabsContent` components must be placed as *siblings* to the `<Tabs />` component, not as children. Their visibility is controlled by the `activeValue` prop.

### Convenções de Código (Aprendizados da Sessão)

- **Fonte de Dados para Seletores:** Para preencher seletores (dropdowns) com uma lista de todas as entidades (ex: todas as organizações), carregue a lista completa da fonte primária, em vez de derivá-la de dados relacionados (ex: atribuições existentes).
- **Componente de Dialog:** Favoreça o uso de `<DialogTrigger asChild>` para controlar a abertura, em vez de gerenciar o estado `isOpen` manualmente com `useState`, especialmente dentro de loops.
- **Gerenciamento de Estado de Carregamento (Loading):** Em hooks ou funções assíncronas, garanta que `setLoading(false)` seja chamado dentro de um bloco `finally` para cobrir tanto os casos de sucesso quanto os de erro, evitando estados de "loading" presos.
- **Imutabilidade de Estado:** Nunca modifique o estado diretamente (ex: `state.variable = 'novo'`). Sempre use a função setter correspondente (ex: `setVariable('novo')`) ou a `action` retornada por `useActionState`.

### Supabase CLI Troubleshooting

**Problemas Comuns em Dev Container:**

1. **Docker Issues**: 
   - Erro: "Cannot connect to the Docker daemon"
   - Solução: Use comandos remotos em vez de locais
   - Exemplo: `supabase mcp gen types typescript` em vez de `supabase mcp start`

2. **Template Path Issues**:
   - Erro: "open supabase\templates\*.html: no such file or directory"
   - Solução: Corrigir caminhos no `supabase/config.toml` para usar "/" em vez de "\\"

3. **Permission Issues**:
   - Erro: "unshare: operation not permitted"
   - Solução: Limitação do ambiente containerizado, usar comandos remotos

4. **SMS Provider Warning**:
   - Aviso: "no SMS provider is enabled"
   - Esperado: Configure providers SMS apenas se necessário

**Comandos de Diagnóstico:**
- `supabase mcp --version` - Verificar instalação
- `supabase mcp projects list` - Verificar conectividade
- `supabase mcp services` - Verificar versões dos serviços
- `supabase mcp --debug <command>` - Debug detalhado

### Testing Strategy

**Frontend Testing:**

- Unit tests for utilities and services using Jest
- Component tests using React Testing Library
- Integration tests for critical user flows
- Database tests using Supabase test client

**Backend Testing:**

- Unit tests for modules and services using Jest
- Integration tests for API endpoints
- Webhook integration testing
- Multi-tenant isolation testing

### Component Guidelines

- Do not use modal component, use alert-dialog instead.
- Set icons as props, whenever is available for a component

### Project Development Reminders

- Whenever we talk about client projects, or implementing new modules, we should keep in context how the module system is managed (explained in @/context/02-architecture/client-modules-architecture.md) and how the tenant system is managed.

### What NOT to Do

- Don't use useEffect for data fetching
- Don't create global state without explicit approval
- Don't bypass TypeScript with 'any' types

### Server Actions Conventions (Next.js App Router)

- ALL exported functions in server action files MUST be async
- Utility functions should be internal (not exported) to avoid async requirement
- Never export sync functions from `/app/actions/` files
- Use `'use server'` directive at top of server action files
- Server actions must handle auth validation internally

### Architecture Decisions

- Server Components by default, Client Components only when necessary

### Anchor comments

Add specially formatted comments throughout the codebase, where appropriate, for yourself as inline knowledge that can be easily `grep`ped for.

#### Guidelines:

- Use `AIDEV-NOTE:`, `AIDEV-TODO:`, or `AIDEV-QUESTION:` (all-caps prefix) for comments aimed at AI and developers.
- Keep them concise (≤ 120 chars).
- **Important:** Before scanning files, always first try to **locate existing anchors** `AIDEV-*` in relevant subdirectories.
- **Update relevant anchors** when modifying associated code.
- **Do not remove `AIDEV-NOTE`s** without explicit human instruction.

- Example:
  AIDEV-NOTE: perf-hot-path; avoid extra allocations (see ADR-24)
  async def render_feed(...):  
   ...
### Convenções de Código (Aprendizados da Sessão)
- **Verifique a Chave Primária:** Antes de manipular uma entidade do banco, verifique sua chave primária na migração SQL (`CREATE TABLE`). Não presuma que é `id`; pode ser uma chave composta.
- **Passe Dados Completos:** Ao agrupar ou transformar dados para passar como props (ex: em `useMemo`), passe o objeto de dados completo, não apenas IDs, para garantir que os componentes filhos tenham todas as informações necessárias para renderização.
- **Cuidado com Campos Desabilitados:** Campos de formulário com o atributo `disabled` não são incluídos no envio do formulário. Para submeter seu valor, use um `<input type="hidden" />` adicional.
- **Garanta o Fluxo de Callbacks:** Para atualizar o estado de um componente pai a partir de um filho aninhado (ex: fechar um diálogo e recarregar uma lista), garanta que a função de callback (ex: `onSuccess`) seja passada corretamente por toda a cadeia de componentes intermediários.
- **Seja Explícito no `select`:** Prefira `select('coluna1, coluna2')` em vez de `select('*')` em chamadas ao banco de dados para evitar ambiguidades com colunas de mesmo nome (como `id`) em `JOINs`.
- **Traduza Nomes na Fonte:** Se houver inconsistência de nomes entre o banco de dados (ex: `organization_id`) e o frontend (ex: `tenant_id`), faça a "tradução" na camada de acesso a dados (a `server action`), não nos componentes do cliente.
- **Estado Otimístico Preferencial:** Para operações CRUD que afetam listas ou dados frequentemente editados, implemente estado otimístico para UX instantânea. Update local imediato + server action em background + rollback automático em caso de erro. Evite revalidatePath excessivo que causa recarregamento completo desnecessário.
- **Filtros com Estados Relacionados:** Ao implementar filtros para entidades relacionadas (ex: implementações de módulos arquivados), mantenha consistência visual usando o mesmo padrão de dropdown menu. Evite checkboxes expostos - use `DropdownMenuCheckboxItem` para uniformidade.
- **Operações Progressivas em Soft Delete:** Para entidades com múltiplos estados (ativo → arquivado → deletado), implemente operações progressivas. Uma mesma action pode executar passos diferentes baseado no estado atual, permitindo fluxo de limpeza intuitivo.
- **Validação de Estado antes de Operações:** Sempre verifique o estado atual da entidade antes de operações CRUD. Evite erros como "já arquivado" - em vez disso, implemente lógica progressiva que avança o estado apropriadamente.
- **JOIN com Filtros Complexos:** Ao filtrar dados que dependem de relacionamentos (ex: implementações por status do módulo pai), use JOINs explícitos na query em vez de filtros no frontend para melhor performance e controle.
