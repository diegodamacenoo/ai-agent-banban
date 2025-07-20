# Guia de Boas Práticas: Next.js 15+ com Supabase

Referência rápida para LLMs em **vibe-coding** - diretrizes essenciais para implementar funcionalidades com **segurança** e **qualidade**.

---

## 1. Princípios Fundamentais

### Segurança
- **SEMPRE** validar dados no servidor antes de persistir
- **NUNCA** confiar apenas em validações do cliente
- **SEMPRE** verificar permissões do usuário para cada operação
- **SEMPRE** implementar Row Level Security (RLS) nas tabelas

### Arquitetura
- **Server Components** para busca de dados e conteúdo estático
- **Client Components** apenas quando necessário (interatividade, hooks)
- **Server Actions** para mutações de dados (CREATE, UPDATE, DELETE)
- **API Routes** apenas para integrações externas ou webhooks

### Componentização
- Componentes pequenos, focados e reutilizáveis
- Props tipadas com TypeScript
- Isolamento de responsabilidades
- Composição sobre configuração

---

## 2. Padrões de Implementação

### 2.1 Autenticação e Autorização
```ts
// Em Server Components - SEMPRE verificar sessão
const { data: { user } } = await supabase.auth.getUser();
if (!session) redirect('/login');

// Verificar permissões específicas quando necessário
const canAccess = await checkUserPermissions(session.user.id, requiredPermission);
if (!canAccess) redirect('/unauthorized');
```

### 2.2 Server Actions
- Use `'use server'` no topo do arquivo
- SEMPRE valide dados com schemas Zod
- SEMPRE verifique permissões antes da operação
- **SEMPRE** registre ações críticas em audit_logs
- Use `revalidatePath()` após mutações para atualizações suaves
- Retorne objetos com `success` e `error/errors`
- Implemente optimistic updates quando apropriado

### 2.3 Data Fetching
- Selecione apenas campos necessários nas queries
- Use joins adequados para evitar N+1 queries
- Implemente paginação em listas grandes
- Verifique permissões antes de retornar dados

### 2.4 Client Components
- Use `'use client'` apenas quando necessário
- Implemente loading states para melhor UX
- Verifique permissões no cliente para UX (mas sempre no servidor para segurança)
- Use React Query para cache em data fetching complexo
- **SEMPRE** implemente optimistic updates para ações críticas
- Use skeleton loading em vez de spinners genéricos

---

## 3. Estrutura de Arquivos

```
app/
├── (protected)/     # Rotas autenticadas
├── (public)/        # Rotas públicas
├── actions/         # Server Actions globais
├── api/            # API Routes (uso limitado)
└── lib/            # Utilitários e configurações

components/         # Componentes reutilizáveis
├── ui/            # shadcn/ui components
└── [feature]/     # Componentes específicos por funcionalidade

lib/
├── auth/          # Utilitários de autenticação
├── validators/    # Schemas Zod
├── permissions/   # Lógica de permissões
└── supabase/      # Configuração Supabase
```

---

## 4. Segurança Essencial

### 4.1 Row Level Security (RLS)
- SEMPRE habilitar RLS em todas as tabelas
- Criar políticas para SELECT, INSERT, UPDATE, DELETE
- Usar `auth.uid()` para identificar usuário atual
- Testar políticas com diferentes roles

### 4.2 Validação de Dados
- Usar schemas Zod para validação
- Validar SEMPRE no servidor, opcionalmente no cliente
- Sanitizar inputs para prevenir XSS
- Usar prepared statements (Supabase faz automaticamente)

### 4.3 Permissões
- Implementar sistema de roles/permissões
- Verificar permissões em cada operação sensível
- Usar middleware para rotas que precisam de autenticação
- **SEMPRE** registrar ações sensíveis em audit_logs

### 4.4 Audit Logs Obrigatórios
- **SEMPRE** registrar em `audit_logs` para ações críticas
- Incluir: `user_id`, `action`, `table_name`, `record_id`, `old_values`, `new_values`
- Registrar: CREATE, UPDATE, DELETE em tabelas críticas
- Registrar: login, logout, mudanças de permissões
- Registrar: operações administrativas (convites, desativações)
- **NUNCA** registrar dados sensíveis (senhas, tokens)

---

## 5. Auditoria e Logs

### 5.1 Implementação de Audit Logs
```ts
// Função helper para audit logs
async function createAuditLog({
  action,
  tableName,
  recordId,
  oldValues,
  newValues,
  userId
}: {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  tableName: string;
  recordId?: string;
  oldValues?: object;
  newValues?: object;
  userId: string;
}) {
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    table_name: tableName,
    record_id: recordId,
    old_values: oldValues,
    new_values: newValues,
    timestamp: new Date().toISOString()
  });
}
```

### 5.2 Ações que Requerem Audit Log
- **Gestão de usuários**: criação, edição, desativação
- **Mudanças de permissões**: alteração de roles
- **Operações financeiras**: pagamentos, refunds
- **Configurações críticas**: mudanças de sistema
- **Autenticação**: login, logout, falhas de login
- **Dados sensíveis**: qualquer modificação

---

## 6. Optimistic Updates e UX Moderna

### 6.1 Implementação de Optimistic Updates
```tsx
// Hook personalizado para optimistic updates
import { useOptimisticAction } from '@/hooks/use-optimistic-action';

const { data, isPending, execute } = useOptimisticAction(initialData);

// Executar com feedback instantâneo
execute({
  optimisticUpdate: (current) => ({ ...current, ...changes }),
  action: async () => await updateData(changes),
  messages: {
    loading: "Atualizando...",
    success: "Atualizado!",
    error: "Erro ao atualizar"
  },
  onSuccess: () => console.log('Sucesso!'),
  onError: (error) => console.error(error)
});
```

### 6.2 Quando Usar Optimistic Updates
- **SEMPRE** em ações de perfil do usuário
- **SEMPRE** em toggles e switches
- **SEMPRE** em ações frequentes (curtir, favoritar)
- **NUNCA** em operações financeiras críticas
- **NUNCA** em ações irreversíveis sem confirmação

### 6.3 Skeleton Loading States
```tsx
// Implementação de skeleton loading
import { SkeletonProfile, SuspenseWrapper } from '@/components/ui/skeleton-loader';

// Opção 1: Condicional
{isLoading ? <SkeletonProfile /> : <ActualComponent />}

// Opção 2: Com Suspense (recomendado)
<SuspenseWrapper fallback="profile">
  <AsyncComponent />
</SuspenseWrapper>

// Opção 3: Com delay para evitar flash
const showSkeleton = useDelayedLoading(isLoading, 300);
```

### 6.4 Melhores Práticas de Loading States
- **Skeleton loading** para conteúdo estruturado
- **Spinners** apenas para ações pontuais
- **Progress bars** para uploads/downloads
- **Shimmer effect** para listas e grids
- **Delayed loading** para evitar flashes (300ms)

### 6.5 Hooks Personalizados para UX
```tsx
// Hook para optimistic updates genérico
const useOptimisticAction = <T>(initialData: T) => {
  const [optimisticData, setOptimisticData] = useOptimistic(initialData);
  const [isPending, startTransition] = useTransition();
  // ... implementação
};

// Hook para delayed loading
const useDelayedLoading = (loading: boolean, delay = 300) => {
  const [showLoading, setShowLoading] = useState(false);
  // ... implementação com debounce
};

// Hook para optimistic lists
const useOptimisticList = <T extends { id: string }>(
  initialItems: T[]
) => {
  // ... implementação para listas com CRUD
};
```

## 7. Atualizações de Dados e UX

### 7.1 Atualizações Suaves (Sem Refresh)
- **NUNCA** usar `window.location.reload()` ou refresh completo
- Usar `revalidatePath()` para atualizar dados específicos
- Usar `revalidateTag()` para invalidar cache por tags
- **SEMPRE** implementar optimistic updates para feedback imediato
- Manter estado local consistente durante atualizações
- Usar React 18's `useOptimistic` e `useTransition` para melhor UX

### 7.2 Toast Notifications
- **SEMPRE** mostrar feedback para ações do usuário
- Toast de sucesso para operações bem-sucedidas
- Toast de erro com mensagens claras e acionáveis
- Toast de loading para operações longas
- Posicionamento consistente (geralmente top-right)
- Integrar com optimistic updates para feedback duplo

---

## 8. Performance

### 8.1 Estratégias de Renderização
- **Static**: `export const dynamic = 'force-static'` para conteúdo estático
- **ISR**: `export const revalidate = 3600` para conteúdo semi-estático
- **Dynamic**: `export const dynamic = 'force-dynamic'` para conteúdo personalizado

### 8.2 Otimizações
- Usar `Suspense` para carregamento incremental
- Implementar paginação em listas grandes
- Otimizar queries com índices apropriados
- Usar `revalidatePath()` e `revalidateTag()` estrategicamente
- **SEMPRE** evitar refresh completo da página - prefira atualizações parciais
- Implementar skeleton loading para perceived performance

### 8.3 Perceived Performance (UX)
- **Optimistic updates** reduzem tempo percebido para 0ms
- **Skeleton loading** mantém layout estável durante carregamento
- **Delayed loading states** evitam flashes desnecessários (>300ms)
- **Shimmer effects** para listas e grids
- **Progressive loading** com Suspense boundaries

---

## 9. Tratamento de Erros

### 9.1 Server Actions
- Usar try/catch robusto
- Retornar objetos padronizados `{ success: boolean, error?: string, errors?: Record<string, string[]> }`
- Log erros no servidor (sem dados sensíveis)
- Diferenciar erros de validação de erros internos

### 9.2 Componentes
- **SEMPRE** implementar Error Boundaries para capturar erros
- Estados de loading e error em Client Components
- Fallbacks adequados para quando dados não carregam
- Mensagens de erro amigáveis ao usuário
- Auto-retry para erros temporários

---

## 10. shadcn/ui e Tailwind

### 10.1 Componentes
- Usar componentes shadcn/ui como base
- Personalizar através de CSS Variables
- Manter consistência visual com design system
- Implementar componentes compostos quando necessário

### 10.2 Styling
- Usar Tailwind classes utilitárias
- Evitar CSS customizado desnecessário
- Usar `cn()` helper para conditional classes
- Manter responsividade em todos os componentes

### 10.3 Feedback ao Usuário
- **SEMPRE** usar toast para feedback de ações (sucesso/erro)
- Implementar loading states visuais durante operações
- **SEMPRE** usar skeleton loading para melhor perceived performance
- **SEMPRE** implementar feedback imediato com optimistic updates

---

## 11. Testes

### 11.1 Essencial
- Testar Server Actions com dados válidos e inválidos
- Testar componentes com diferentes estados (loading, error, success)
- Testar fluxos de autenticação e autorização
- Mocks adequados para Supabase e APIs externas
- Testar optimistic updates e rollbacks

### 11.2 E2E
- Testar fluxos críticos do usuário
- Testar em diferentes viewports
- Validar acessibilidade básica
- Testar com diferentes roles/permissões
- Testar perceived performance e loading states

---

## 12. Checklist de Implementação

Antes de implementar qualquer funcionalidade:

**Segurança**
- [ ] Autenticação verificada?
- [ ] Permissões checadas?
- [ ] Dados validados no servidor?
- [ ] RLS implementado?
- [ ] Audit logs registrados para ações críticas?

**Qualidade**
- [ ] Componentes tipados?
- [ ] Error handling implementado?
- [ ] Estados de loading?
- [ ] Responsivo?

**Performance**
- [ ] Estratégia de renderização adequada?
- [ ] Queries otimizadas?
- [ ] Cache implementado quando necessário?
- [ ] Revalidação configurada?

**UX**
- [ ] Toast notifications implementados?
- [ ] Feedback visual para ações (loading, success, error)?
- [ ] **SEMPRE** Optimistic updates implementados?
- [ ] **SEMPRE** Skeleton loading em vez de spinners?
- [ ] Atualizações sem refresh completo da página?
- [ ] Delayed loading para evitar flashes (>300ms)?
- [ ] Error Boundaries implementados?
- [ ] Mensagens de erro claras e acionáveis?
- [ ] Navegação intuitiva?
- [ ] Acessibilidade básica?

**Verificação Final**
- [ ] Script de conformidade executado?
- [ ] Score ≥ 70% obtido?
- [ ] Zero erros críticos?
- [ ] Máximo 5 warnings?
- [ ] Correções implementadas quando necessário?

---

---

## 13. Verificação de Conformidade

### 13.1 Script de Verificação Automatizada
- **SEMPRE** executar o script de conformidade após cada implementação
- **NUNCA** fazer commit sem verificar conformidade
- Corrigir todos os erros críticos antes de prosseguir
- Documentar melhorias implementadas

### 13.2 Comando de Verificação
```powershell
# Windows PowerShell
.\scripts\verificar-conformidade.ps1

# Ou usar terminal integrado no VS Code/Cursor
powershell -ExecutionPolicy Bypass -File .\scripts\verificar-conformidade.ps1
```

### 13.3 Critérios de Aprovação
- **Score mínimo**: 70% de conformidade
- **Erros críticos**: 0 (zero tolerância)
- **Warnings**: Máximo 5 (documentar plano de correção)
- **Sucessos**: Mínimo 8 de 10 categorias

### 13.4 Processo de Implementação
1. **Implementar funcionalidade** seguindo o guia
2. **Executar script de conformidade** 
3. **Corrigir issues identificados**
4. **Re-executar verificação** até aprovação
5. **Documentar melhorias** (opcional)
6. **Fazer commit** apenas após aprovação

---

**Lembre-se**: Este projeto prioriza segurança e experiência do usuário. Quando em dúvida, prefira a abordagem mais segura e teste thoroughly antes de fazer deploy. **SEMPRE** execute o script de conformidade antes de qualquer commit!