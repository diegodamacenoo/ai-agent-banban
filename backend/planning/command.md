Analise C:\Users\brcom\ai-agent\src\app\(protected)\admin\modules em relação aos padrões estabelecidos na documentação /context, identificando não conformidades e sugerindo correções.

  Pré-Análise: Identificação do Escopo

  PRIMEIRO: Identifique o tipo de escopo e aplique apenas critérios relevantes:

  Fase 1: Arquitetura & Estrutura (Módulos, Componentes, Páginas)

  Critérios Arquiteturais:
  - Multi-tenant: Isolamento por organization_id implementado
  - Estrutura de diretórios: app/ (routes) + clients/ + core/ + shared/
  - Sistema modular: Base Modules → Implementations → Tenant Assignments
  - Client discovery: NEXT_PUBLIC_CLIENT_TYPE e slug routing configurados
  - 3-layer module system: Estrutura base_modules/module_implementations/tenant_assignments

  Para Módulos Específicos:
  - module.json presente e completo (name, slug, version, dependencies, permissions)
  - Estrutura padrão: types/, services/, components/, handlers/
  - README.md com documentação completa
  - Versionamento semântico (1.0.0 format)

  Fase 2: Server Actions (Apenas Server Actions)

  Critérios Obrigatórios:
  - Diretiva 'use server' presente no topo do arquivo
  - Todas exportações são async functions (ZERO exceções)
  - Estrutura padrão: Validação → Auth → Autorização → Lógica → Resposta
  - Formato de resposta: { success: boolean, data?: T, error?: string }
  - getCurrentUser() para autenticação
  - getUserOrgId() para isolamento multi-tenant
  - Try-catch obrigatório com retorno estruturado
  - revalidatePath() após mutações
  - Zod schemas para validação de entrada

  Anti-patterns Críticos:
  - x Funções síncronas exportadas
  - x Throw direto de erros
  - x Queries sem contexto de tenant
  - x Falta de validação Zod

  Fase 3: Segurança RLS (Database, Server Actions, Módulos)

  Políticas RLS:
  - RLS habilitado em todas as tabelas de dados (use o supabase mcp)
  - Política tenant_isolation: organization_id = get_user_org_id()
  - Admin override patterns onde aplicável
  - Service role key NUNCA em application logic
  - createSupabaseServerClient sempre authenticado

  Validação & Sanitização:
  - Parameterized queries - nunca string concatenation
  - DOMPurify para sanitização de inputs
  - Rate limiting em endpoints sensíveis
  - Security headers configurados (CSP, X-Frame-Options)
  - Audit trail para ações sensíveis

  Fase 4: Frontend/React (Componentes, Páginas, Hooks)

  Padrões React:
  - Server Components por padrão, Client apenas quando necessário
  - Component order: Hooks → State → Effects → Handlers → Render
  - useTransition() com Server Actions
  - Dialog structure: <DialogClose asChild> para botões cancelar
  - Icons como props: icon={IconComponent} em vez de children
  - Skeleton/Suspense para loading states

  Convenções de Código:
  - Files: kebab-case.tsx, Components: PascalCase
  - Imports: @/ absolutos, consolidados, sem duplicatas
  - React Hook Form + Zod para formulários
  - Dialog preference: usar @/shared/ui/dialog em vez de alert-dialog

  Rules of Hooks:
  - Dependências completas em useEffect/useCallback arrays
  - Sem useEffect para data fetching
  - Optimistic updates para soft delete

  Fase 5: Backend/Fastify (Módulos Backend, APIs)

  Arquitetura Fastify:
  - Plugin registration order: security first, depois custom
  - Multi-tenant setup: TenantManager e ModuleResolver
  - Module system: Base + Custom modules com interface padrão
  - Versioned API routes: prefixos /v1/
  - Error handling global com tipos diferenciados

  Base Module Interface:
  - slug: string, version: string, dependencies: string[]
  - initialize(): Promise<void>, getRoutes(): RouteDefinition[]
  - Webhook base class com validate() e process()

  Fase 6: Database Schema (Schemas, Migrations, Funções)

  Estrutura de Dados:
  - 3-layer module system implementado no schema
  - JSONB configs para flexibilidade
  - UUID primary keys como padrão
  - Timestamp fields com timezone
  - Constraints apropriados (unique, foreign keys)

  Performance & Índices:
  - Índices multi-tenant para queries com organization_id
  - Partial indexes para soft delete
  - Database functions como fonte única de verdade

  Security Functions:
  - get_user_org_id(), is_admin() implementadas
  - Security definer em funções sensíveis

  Fase 7: Qualidade & Testes (Todos os tipos)

  Coverage & Documentação:
  - Coverage de testes ≥ 70%
  - Unit tests: Jest + React Testing Library
  - Integration tests: Multi-tenant isolation
  - README.md atualizado e completo

  Code Quality:
  - Imports limpos: sem duplicatas, @/ paths, unused removidos
  - console.debug em vez de console.log
  - Sem emojis no código (exceto se explicitamente solicitado)
  - TypeScript strict: sem tipos 'any' sem justificativa

  Fase 8: Performance & Caching (Server Actions, APIs, Componentes)

  Caching Patterns:
  - Next.js revalidate + React cache() para data fetching
  - Cache invalidation após mutações
  - Lazy loading: dynamic() imports
  - Code splitting automático App Router

  Database Performance:
  - Explicit selects: select('col1, col2') para evitar JOIN ambiguity
  - JOINs explícitos para filtros complexos
  - Metrics collection para monitoring

  Fase 9: UI/UX Patterns (Componentes, Páginas)

  User-Friendly Data:
  - Role mapping: Database roles → nomes amigáveis (master_admin → "Administrador Master")
  - Security alerts: Códigos técnicos → texto legível
  - IP formatting: localhost addresses formatados
  - Consistent mapping pattern com fallback

  Layout & Components:
  - PageLayout component usado consistentemente
  - Design system components do @/shared/ui/
  - Responsive design implementado
  - Loading states apropriados

  Matriz de Aplicabilidade Expandida:

  Server Action → Fases: 2, 3, 7, 8
  Componente React → Fases: 1, 4, 7, 9
  Módulo Backend → Fases: 1, 5, 7, 8
  Schema/Migration → Fases: 3, 6, 7
  Página/Route → Fases: 1, 4, 7, 9
  API Route → Fases: 3, 5, 7, 8
  Hook/Utility → Fases: 4, 7
  Módulo Completo → Fases: 1, 2, 3, 4, 5, 6, 7, 8, 9

  Comando de Execução:

  1. IDENTIFIQUE o tipo de escopo detalhadamente
  2. APLIQUE apenas fases relevantes da matriz
  3. É MANDATÓRIO fazer análise abrangente de TODOS os arquivos
  3. VERIFIQUE cada critério aplicável (não invente conformidade)
  4. REPORTE não conformidades com linha específica do código
  5. SUGIRA correções concretas com referência ao padrão /context

  Analise o escopo em relação aos padrões estabelecidos em /context. Execute a análise seguindo as fases  definidas, fornecendo um relatório detalhado de conformidade e ações corretivas necessárias em arquivo .md em pastas apropriadas.