# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 🚨 MANDATORY: Context Documentation First

**BEFORE any implementation or analysis, you MUST:**

1. **Read `context/README.md`** - Index with scenario-specific guidance and navigation
2. **Follow the scenario-specific reading sequence** from the README index for your task type
3. **Consume relevant context docs** based on task:
   - Getting Started: `context/01-getting-started/` (setup, troubleshooting)
   - Architecture: `context/02-architecture/` (overview, client-modules, patterns)
   - APIs/Integrations: `context/03-apis-integrations/` (APIs overview, webhooks)
   - Development: `context/04-development/` (module development, templates)
   - Operations: `context/05-operations/` (module lifecycle)
   - Database: `context/06-database/` (schema reference, function patterns)
   - Types: `context/07-types/typescript-reference.md` (TypeScript reference)
   - Server Actions: `context/08-server-actions/` (patterns, cache, module management)
   - Security: `context/09-security/rls-security-guide.md` (RLS policies)
   - Testing: `context/10-testing/testing-strategy.md` (test strategies)
   - Backend: `context/11-backend/fastify-patterns.md` (Fastify architecture)
   - Logging/Debug: `context/12-logging-debug/` (conditional debug system)
   - Troubleshooting: `context/12-troubleshooting/` (module lifecycle, troubleshooting)

3. **Follow established patterns** - Do NOT reinvent existing solutions
4. **Update context/** when adding new patterns or architectural changes

**Why:** Context docs are optimized for AI consumption (1000-2000 tokens vs 5000-10000 from reading code files) while ensuring consistency and following established patterns.

## Commands

- Always respond in brazilian portuguese
- Stop saying I'm right all time. I'm not the owner of truth.

### Development Commands

#### Frontend

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run dev:banban` - Inicia o servidor de desenvolvimento para o cliente Banban
- `npm run dev:riachuelo` - Inicia o servidor de desenvolvimento para o cliente Riachuelo
- `npm run dev:ca` - Inicia o servidor de desenvolvimento para o cliente CA
- `npm run build` - Compila a aplicação para produção
- `npm start` - Inicia o servidor em modo produção
- `npm run lint` - Executa o ESLint
- `npm test` - Executa os testes com Jest
- `npm run test:watch` - Executa o Jest em modo watch
- `npm run test:coverage` - Executa o Jest com relatório de cobertura

#### Backend

- `cd backend && npm run dev` - Start backend development server
- `cd backend && npm run build` - Build backend for production
- `cd backend && npm start` - Start production backend server
- `cd backend && npm run lint` - Run ESLint on backend
- `cd backend && npm test` - Run backend tests

### Database Commands

#### Supabase CLI (Testado e Funcional)

**Desenvolvimento e Produção:**

- `npx supabase gen types typescript --linked > src/types/database.types.ts` - Gerar e salvar tipos TypeScript atualizados
- `npx supabase migration list` - Listar migrações do projeto
- `npx supabase migration new <name>` - Criar nova migração
- `npx supabase functions list` - Listar edge functions
- `npx supabase functions deploy <name>` - Deploy edge functions
- `npx supabase projects list` - Listar projetos Supabase
- `npx supabase secrets list` - Listar secrets do projeto
- `npx supabase services` - Mostrar versões dos serviços

**Inspeção e Monitoramento:**

- `npx supabase inspect db table-stats` - Estatísticas de tabelas
- `npx supabase inspect db index-stats` - Estatísticas de índices
- `npx supabase inspect db db-stats` - Estatísticas do banco
- `npx supabase inspect db calls` - Queries mais chamadas
- `npx supabase inspect db outliers` - Queries mais lentas
- `npx supabase inspect db long-running-queries` - Queries em execução

**Configuração:**

- `npx supabase config push` - Sincronizar config.toml com projeto
- `npx supabase login` - Autenticar no Supabase
- `npx supabase link` - Vincular projeto local ao remoto

**Comandos Locais (Limitados no Dev Container):**

- `npx supabase start` - Iniciar stack local (requer Docker funcional)
- `npx supabase db reset` - Reset database local (requer Docker funcional)
- `npx supabase status` - Status dos containers locais

**Nota:** No ambiente Dev Container, comandos locais que dependem de Docker têm limitações de permissão. Use principalmente comandos remotos que funcionam perfeitamente com o projeto linkado.

### MCP Tools (Model Context Protocol)

#### Context7 MCP
- **Uso**: Documentação e exemplos de código atualizados para bibliotecas
- **Comandos**:
  - `mcp__context7__resolve-library-id <library-name>` - Resolver ID da biblioteca
  - `mcp__context7__get-library-docs <library-id>` - Obter documentação
- **Exemplo**: Para Next.js, React, Tailwind, TypeScript, etc.
- **Quando usar**: Antes de implementar features com bibliotecas externas

#### Playwright MCP  
- **Uso**: Automação de browser e testes E2E
- **Comandos principais**:
  - `mcp__playwright__browser_navigate <url>` - Navegar para URL
  - `mcp__playwright__browser_snapshot` - Capturar estado da página
  - `mcp__playwright__browser_click <element>` - Clicar em elemento
  - `mcp__playwright__browser_type <text>` - Digitar texto
  - `mcp__playwright__browser_take_screenshot` - Capturar screenshot
- **Quando usar**: Testes de interface, automação de workflows, validação de features

#### Supabase MCP

# Operational Guidelines

## Tone and Style (CLI Interaction)

- **Concise & Direct:** Adopt a professional, direct, and concise tone suitable for a CLI environment.
- **Minimal Output:** Aim for fewer than 3 lines of text output (excluding tool use/code generation) per response whenever practical. Focus strictly on the user's query.
- **Documentação Concisa:** Ao escrever ou atualizar documentações, priorize clareza e concisão. Evite a verbosidade e foque em transmitir a informação de forma direta e eficiente.
- **Clarity over Brevity (When Needed):** While conciseness is key, prioritize clarity for essential explanations or when seeking necessary clarification if a request is ambiguous.
- **No Chitchat:** Avoid conversational filler, preambles ("Okay, I will now..."), or postambles ("I have finished the changes..."). Get straight to the action or answer.
- **Formatting:** Use GitHub-flavored Markdown. Responses will be rendered in monospace.
- **Tools vs. Text:** Use tools for actions, text output _only_ for communication. Do not add explanatory comments within tool calls or code blocks unless specifically part of the required code/command itself.
- **Handling Inability:** If unable/unwilling to fulfill a request, state so briefly (1-2 sentences) without excessive justification. Offer alternatives if appropriate.

## Project Architecture

**📋 See `context/02-architecture/overview.md` for complete architecture details**

### Quick Overview

- **Multi-tenant system** with Next.js frontend + standalone Fastify backend
- **3-layer module system**: Base Modules → Implementations → Tenant Assignments
- **Organization-based isolation** with RLS policies
- **Client-specific customizations** (Banban, Riachuelo, CA)
- **Modular backend** with dynamic loading per tenant

### Configuration Notes

**📋 See `context/01-getting-started/quick-start.md` for complete setup**

#### Environment Setup

- **Frontend**: `.env.local` with Supabase credentials + `NEXT_PUBLIC_CLIENT_TYPE`
- **Backend**: `backend/.env` with NODE_ENV, PORT, HOST, LOG_LEVEL

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

- Supabase CLI versão 2.30.4 via npx
- Docker instalado para comandos locais limitados
- Conectividade completa com projeto remoto
- Geração de tipos TypeScript funcional
- Inspeção de banco de dados operacional

**Configuração de Templates:**

- Templates de email em `supabase/templates/`
- Caminhos corrigidos no `supabase/config.toml`
- Suporte a autenticação MFA e confirmação de email

#### Module Development

**📋 See `context/04-development/` for complete development guides:**

- `module-development-guide.md` - Criação de módulos completo
- `system-configurations-guide.md` - Configurações de sistema
- `templates/` - Templates e generators para módulos
- `EXAMPLE_USAGE.md` - Exemplos práticos de uso

**Estrutura:**
- **Frontend**: Follow template in `src/core/modules/template/`
- **Backend**: Base modules in `backend/src/modules/base/`, custom in `backend/src/modules/custom/`

### Development Patterns

**📋 See `context/02-architecture/patterns-conventions.md` for complete patterns**

#### Key Patterns

- **Client-Specific**: Use `src/clients/[client-name]/` directory structure
- **Module Development**: Follow ModuleRegistry/ModuleLoader patterns
- **Authentication**: Login → home (`/`), MFA for sensitive ops
- **Components**: PascalCase components, kebab-case files, `@/` imports

### Important Conventions

- Always use `@/` imports for src directory references
- Follow component naming: PascalCase for components, kebab-case for files
- Use Tailwind CSS with custom design system components
- Implement proper error boundaries for production stability
- Brazilian Portuguese language support as default
- Use Supabase MCP tool for database tasks
- Use Context7 MCP tool for library documentation and code examples
- Use Playwright MCP tool for browser automation and E2E testing
- Prefer `npx supabase` commands over local Docker when in Dev Container
- Use `npx supabase gen types typescript` to keep types updated
- Use `npx supabase inspect db` commands for performance monitoring
- You are an agent - continue until the user's question is completely resolved, before ending your turn and returning the turn to the user. Only end your turn when you are sure that the problem has been solved
- If you are unsure about the file content or codebase structure that the user is asking for, use your tools to read files and gather the relevant information: DO NOT guess or invent an answer
- If the user asks you to plan, do not start coding until they tell you to do so
- Do not implement functions or components that are not requested, but suggest them and ask the user if they would like to implement them
- Avoid using emojis when generating code as much as possible;
- For debugging, do not use console.log, use console.debug instead;
- **Code Review:** Remove all unused imports, variables, and functions to keep the code clean and avoid unnecessary overhead.
- **Import Organization:** Avoid duplicate imports. Consolidate multiple imports from the same module into a single statement.
- **Rules of Hooks:** Always include all dependencies in the dependency array of hooks like `useEffect` and `useCallback`. Only ignore this rule in exceptional cases and with a comment explaining why.

### Patterns and Conventions

**📋 All patterns documented in `context/02-architecture/patterns-conventions.md`**

### Supabase CLI Troubleshooting

**Problemas Comuns em Dev Container:**

1. **Docker Issues**:
   - Erro: "Cannot connect to the Docker daemon"
   - Solução: Use comandos remotos em vez de locais
   - Exemplo: `npx supabase gen types typescript` em vez de `npx supabase start`

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

- `npx supabase --version` - Verificar instalação
- `npx supabase projects list` - Verificar conectividade
- `npx supabase services` - Verificar versões dos serviços
- `npx supabase --debug <command>` - Debug detalhado

### Testing Strategy

**📋 See `context/10-testing/testing-strategy.md` for complete strategy**

- **Unit tests**: Jest + React Testing Library
- **Integration tests**: Multi-tenant isolation patterns
- **E2E tests**: Critical user journeys com Playwright MCP

#### MCP Integration Guidelines

**Context7 MCP:**
- Use antes de implementar novas features com bibliotecas
- Consulte documentação atualizada para evitar APIs depreciadas
- Obtenha exemplos de código para padrões atuais

**Playwright MCP:**
- Implemente testes E2E para fluxos críticos do sistema
- Use `browser_snapshot` para verificar estado da UI
- Combine com testes de módulos para validação completa
- Configure testes de regressão para client customizations

### Development Guidelines

#### Project Context

- Whenever working with client projects or implementing new modules, keep in context how the module system is managed (explained in @context/02-architecture/client-modules-architecture.md) and how the tenant system is managed.

#### Architecture Decisions

- Server Components by default, Client Components only when necessary

#### Component Guidelines

- Do not use modal component, use alert-dialog instead
- **Set icons as props**: Use `icon={IconComponent}` prop instead of child elements like `<Icon className="mr-2 h-4 w-4" />`. Components like Button, Badge, DropdownMenuItem, etc. support icon props for consistent styling and positioning.

#### Development Rules

- Don't use useEffect for data fetching
- Don't create global state without explicit approval
- Don't bypass TypeScript with 'any' types
- For debugging, use console.debug instead of console.log
- Avoid using emojis when generating code

### Server Actions Conventions

**📋 See `context/08-server-actions/` for complete patterns:**

- `patterns-guide.md` - Estrutura padrão de Server Actions
- `cache-patterns.md` - Padrões de cache e invalidação
- `module-management-patterns.md` - Gerenciamento de módulos

**Convenções:**
- **ALL exports MUST be async functions**
- **Use `'use server'` directive**
- **Handle auth validation internally**
- **Follow standard structure**: validate → auth → business logic → response

### Database & Types

**📋 See `context/06-database/` and `context/07-types/`:**

- `schema-reference.md` - Schema atual completo com RLS
- `supabase-function-patterns.md` - Padrões de funções do banco
- `typescript-reference.md` - Tipos principais e patterns
- Database types gerados em: `src/types/database.types.ts`

### Troubleshooting & Debug

**📋 See `context/12-troubleshooting/` and `context/12-logging-debug/`:**

- `conditional-debug-system.md` - Sistema de debug controlável via UI  
- `module-lifecycle-patterns.md` - Troubleshooting do ciclo de vida
- `module-troubleshooting-essentials.md` - Resolução de problemas essenciais

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.

## Context Documentation Maintenance

**WHEN implementing new patterns, architectural changes, or conventions:**

1. **Update relevant context/ documents** to keep them current
2. **Add new context docs** if introducing major new concepts
3. **Keep docs concise** (max 200 lines) and focused
4. **Use existing context/** before reading large code files

**This ensures future AI interactions are efficient and consistent.**
