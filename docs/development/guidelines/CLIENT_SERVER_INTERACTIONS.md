# Interação entre Client Components e Server Actions

Este documento descreve como os Client Components (componentes de cliente) interagem com as Server Actions (ações de servidor) para buscar e modificar dados, e como gerenciar o estado da UI durante essas interações.

---

## ⚠️ **REGRA OBRIGATÓRIA: Client Components DEVEM usar API Routes**

**🚨 IMPORTANTE**: Client Components **NUNCA** devem chamar Server Actions diretamente. Esta é uma regra **OBRIGATÓRIA** do projeto.

### **✅ Padrão Correto**
```tsx
// ✅ Client Component usando API Route
"use client";
export function MyClientComponent() {
  const handleSubmit = async (data) => {
    const result = await fetch('/api/profiles/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    const response = await result.json();
    if (result.ok && response.success) {
      // Sucesso
    }
  };
}
```

### **❌ Padrão Incorreto**
```tsx
// ❌ NUNCA faça isso em Client Components
"use client";
import { updateProfile } from "@/app/actions/profiles/user-profile";

export function MyClientComponent() {
  const handleSubmit = async (data) => {
    const result = await updateProfile(data); // ❌ PROIBIDO
  };
}
```

### **📋 Diretrizes de Implementação**

1. **Mutações (Alteração de Dados)**: 
   - Client Components **DEVEM OBRIGATORIAMENTE** usar API Routes (`/api/*`)
   - Server Components **PODEM** usar Server Actions diretamente

2. **Leitura de Dados**:
   - Server Components: Buscar dados diretamente (ex: do banco de dados)
   - Client Components: **DEVEM** usar API Routes, preferencialmente com TanStack Query

3. **Estrutura de Arquivos**:
   - Manter Server Actions em `/actions/*` para uso **EXCLUSIVO** em Server Components
   - Criar API Routes correspondentes em `/api/*` para Client Components
   - Exemplo: `/actions/user-management/users.ts` → `/api/user-management/users/route.ts`

4. **Segurança**:
   - API Routes **DEVEM** validar autenticação usando `createSupabaseClient(cookieStore)`
   - API Routes **DEVEM** validar dados de entrada com Zod
   - API Routes **DEVEM** implementar logs de auditoria quando aplicável

---

## Componentes de Client-Side

Ao interagir com API Routes, os componentes de cliente devem gerenciar seu próprio estado de UI para feedback ao usuário e tratamento de erros.

1.  **Gerenciamento de Estado**:
    * Mantenha estados locais para `loading` (indicando que uma operação está em andamento), `isSubmitting` (para formulários), `error` (para exibir mensagens de erro), e quaisquer outros estados pertinentes à UI.
    * Ao receber o resultado de uma API Route, verifique `result.ok` e `response.success` para determinar sucesso/erro.
    * **Evite "flashes" de conteúdo**: Garanta que os indicadores de loading (skeletons, spinners) persistam até a conclusão da operação e a revalidação/atualização dos dados.

2.  **Atualização de UI**:
    * Após mutações bem-sucedidas através de API Routes, **PREFIRA updates otimistas locais** ao invés de `router.refresh()` para melhor UX.
    * Para Client Components que buscam dados por conta própria (ex: usando `useEffect` ou TanStack Query), pode ser necessário refazer a busca de dados explicitamente para atualizar a UI.
    * **Forneça feedback visual**: Utilize mecanismos como "toasts", notificações ou mensagens de sucesso/erro na própria interface para informar o usuário sobre o resultado da operação.

3.  **Tratamento de Erros**:
    * Exiba mensagens de erro de forma **amigável e clara** ao usuário, utilizando o `response.error` retornado pela API Route.
    * Quando possível, permita que o usuário **tente novamente** a operação após um erro, talvez oferecendo um botão de "Tentar Novamente".

4.  **Padrão de Implementação com Updates Otimistas**:
    ```tsx
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (data) => {
      setIsSubmitting(true);
      
      // Update otimista: atualizar estado local imediatamente
      const previousState = currentState;
      setCurrentState(data);
      
      try {
        const result = await fetch('/api/endpoint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data),
        });

        const response = await result.json();

        if (result.ok && response.success) {
          toast({ description: "Operação realizada com sucesso." });
          onSuccess?.();
        } else {
          // Reverter em caso de erro
          setCurrentState(previousState);
          toast({
            description: response.error || "Erro na operação",
            variant: "destructive"
          });
        }
      } catch (error) {
        // Reverter em caso de erro
        setCurrentState(previousState);
        toast({
          description: "Erro inesperado",
          variant: "destructive"
        });
      } finally {
        setIsSubmitting(false);
      }
    };
    ```

---

## Componentes de Contexto

Contextos React podem ser usados para gerenciar estados globais e interagir com API Routes para manter esses estados sincronizados com o servidor.

1.  **Integração com API Routes**:
    * As funções expostas pelo contexto que realizam mutações **DEVEM** chamar API Routes.
    * Após a conclusão da API Route, o contexto deve atualizar seu estado local para refletir as alterações no servidor, garantindo a consistência.

2.  **Carregamento Inicial**:
    * Contextos que dependem de dados do servidor podem buscar esses dados na montagem do provedor, usando `useEffect` para chamar uma API Route de consulta.
    * Mantenha estados de `loading` e `error` dentro do contexto para que os componentes consumidores saibam o status do carregamento dos dados.

---

## Relação entre Server Actions e API Routes

Embora ambos permitam a interação com o servidor, Server Actions e API Routes têm propósitos distintos no nosso projeto.

1.  **Quando usar Server Actions**:
    * Para **operações em Server Components** (criar, atualizar, excluir) que são disparadas diretamente da UI do Next.js via formulários.
    * Para operações que exigem **contexto de servidor** (acesso a cookies, headers da requisição) para autenticação ou autorização.
    * Para chamadas a partir de formulários e interfaces de **Server Components**, pois elas se integram de forma nativa e otimizada.
    * **NUNCA** devem incluir `revalidatePath()` quando usadas por Client Components via API Routes.

2.  **Quando usar API Routes**:
    * **OBRIGATÓRIO** para todas as operações em **Client Components**.
    * Para **endpoints genuinamente públicos** ou que precisem ser acessados por serviços de terceiros (webhooks, integrações).
    * Para operações que exigem **cabeçalhos de resposta personalizados** ou controle mais granular sobre a resposta HTTP.
    * Para endpoints que serão consumidos por Client Components via chamadas `fetch` tradicionais ou bibliotecas de data fetching como [TanStack Query](https://tanstack.com/query/latest).

3.  **Estrutura espelhada**:
    * **OBRIGATÓRIO** manter uma estrutura de diretórios semelhante entre `/actions` (para Server Actions) e `/api` (para API Routes).
    * **Exemplo**: `/actions/user-management/users.ts` (Server Action para Server Components) e `/api/user-management/users/route.ts` (API Route para Client Components).

4.  **Migração de Server Actions para API Routes**:
    * Ao refatorar Client Components que usam Server Actions, **DEVE** criar API Routes correspondentes.
    * Mantenha a mesma lógica de validação, autenticação e logs de auditoria.
    * Use o mesmo schema de validação Zod quando possível.
    * **REMOVA** `revalidatePath()` das Server Actions e implemente updates otimistas nos Client Components.

---

## Exemplo Prático de Migração

### Antes (❌ Incorreto)
```tsx
// Client Component usando Server Action
"use client";
import { inviteUser } from "@/app/actions/user-management/invites";

export function InviteDialog() {
  const handleInvite = async (data) => {
    const result = await inviteUser(data); // ❌ PROIBIDO
    if (result.success) {
      // sucesso
    }
  };
}
```

### Depois (✅ Correto)
```tsx
// Client Component usando API Route com updates otimistas
"use client";
export function InviteDialog() {
  const [invites, setInvites] = useState(currentInvites);
  
  const handleInvite = async (data) => {
    // Update otimista
    const newInvite = { ...data, id: 'temp-id', status: 'pending' };
    setInvites(prev => [...prev, newInvite]);
    
    try {
      const result = await fetch('/api/user-management/invites/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      const response = await result.json();
      if (result.ok && response.success) {
        // Atualizar com dados reais do servidor
        setInvites(prev => prev.map(invite => 
          invite.id === 'temp-id' ? response.data : invite
        ));
        toast.success('Convite enviado com sucesso');
      } else {
        // Reverter em caso de erro
        setInvites(prev => prev.filter(invite => invite.id !== 'temp-id'));
        toast.error(response.error || 'Erro ao enviar convite');
      }
    } catch (error) {
      // Reverter em caso de erro
      setInvites(prev => prev.filter(invite => invite.id !== 'temp-id'));
      toast.error('Erro inesperado');
    }
  };
}
```

---

**Última atualização**: Dezembro 2024  
**Responsável**: Equipe de Desenvolvimento
