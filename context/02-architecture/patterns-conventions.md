# Patterns & Conventions Guide

## Core Architecture Patterns

### Multi-tenant & Modular System
- **RLS Isolation**: `organization_id` em todas as tabelas
- **3-Layer Module System**: Base Modules → Implementations → Tenant Assignments
- **Client Discovery**: Via `NEXT_PUBLIC_CLIENT_TYPE` e slug routing
- **API Stack**: Next.js (Frontend) + Fastify (Backend) + Supabase (Database)

## Code Conventions

### File Structure & Naming
- **Files**: `kebab-case.tsx`, **Components**: `PascalCase`, **Functions**: `camelCase`
- **Imports**: External → `@/` absolute → relative, consolidate duplicates
- **Structure**: `app/` (routes) + `clients/` (specific) + `core/` + `shared/`

## Security & Data Patterns

### Authentication & Authorization
- **Server-side**: Always use `getUser()`, never client-side auth
- **RLS**: Automatic filtering by `organization_id` 
- **Rate Limiting**: Redis (prod) / In-memory (dev)
- **Session Tracking**: Middleware automático registra atividade, dispositivo, geo
- **Browser Client**: Use `createSupabaseBrowserClient()` em hooks/providers

### Server Actions & Data Flow
- **Server Actions**: Always async, `'use server'`, internal auth validation
- **Client Forms**: Use `useTransition()` with `startTransition()`
- **Error Handling**: Retry pattern with exponential backoff
- **Validation**: Zod schemas + `revalidatePath()` after mutations

### Middleware Patterns
- **Session Tracking**: `trackUserSession()` integrado no middleware principal
- **Device Detection**: Parse automático de User-Agent para browser/OS/device
- **Geo Location**: Headers Cloudflare/Vercel para localização
- **Cleanup Automático**: Edge Functions para limpeza de sessões antigas

## UI Patterns

### Component Structure & Loading
- **Component Order**: Hooks → State → Effects → Handlers → Render
- **Loading States**: `<Skeleton />` components + `<Suspense>` boundaries
- **Forms**: React Hook Form + Zod + Server Actions integration

### Performance & Optimization
- **Caching**: Next.js `revalidate` + React `cache()` for data fetching
- **Lazy Loading**: `dynamic()` imports + automatic App Router code splitting
- **Database**: Multi-tenant indexes + partial indexes for soft delete

### Testing Strategy
- **Unit**: Jest + React Testing Library
- **Integration**: API routes + multi-tenant isolation testing
- **Components**: Render + screen assertions

## Layout Patterns

### PageLayout Component (`@/shared/components/PageLayout.tsx`)
- **Flexible Template**: Single/sidebar-left/sidebar-right layouts
- **Built-in Features**: Header, breadcrumbs, actions, loading states
- **Usage**: Admin pages (with header) + Tenant pages (customized) + Standard modules

## Development Conventions

### Critical React/HTML Rules
- **Dialog Structure**: Never nest block elements in `<p>` tags, use `asChild` prop
- **Server Actions**: All exports must be async, use `'use server'` directive  
- **Soft Delete**: Use `archived_at`/`deleted_at` fields + conditional UI
- **Form Binding**: Sanitize optional fields with `value={data.field || ''}`
- **Tabs Component**: Declarative `items` prop, `TabsContent` as siblings

### Dialog & Component Rules
- **Dialog Integration**: `onSelect={(e) => e.preventDefault()}` + `onSuccess` callbacks
- **Components**: Use `alert-dialog` (not modal), icons as props
- **State Management**: Optimistic updates + progressive operations for soft delete

### Database & Performance 
- **Primary Keys**: Check SQL migrations, may be composite keys
- **Explicit Selects**: Use `select('col1, col2')` to avoid JOIN ambiguity  
- **Data Translation**: Handle inconsistent naming in server actions
- **JOINs**: Use explicit JOINs for complex relationship filters

### Code Quality Rules
- **Imports**: Consolidate duplicates, use `@/` paths, clean unused
- **Hooks**: Include all dependencies in useEffect/useCallback arrays
- **Forms**: Handle disabled fields with hidden inputs, ensure callback flow
- **Architecture**: Server Components by default, no useEffect for data fetching

### Development Guidelines
- **Context Awareness**: Keep module system architecture in mind
- **Debugging**: Use `console.debug` (not console.log), avoid emojis in code
- **Anchor Comments**: Use `AIDEV-NOTE:` for inline knowledge (≤ 120 chars) 