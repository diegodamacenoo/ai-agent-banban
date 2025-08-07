# Sistema de Encerramento de Sessão

**Última atualização:** 2025-01-25  
**Status:** ✅ Implementado e Refatorado

## 🎯 Visão Geral

Sistema completo para encerramento administrativo de sessões de usuários com feedback automático, redirecionamento inteligente e countdown para desbloqueio. Totalmente integrado ao sistema de debug condicional.

## 🏗️ Arquitetura do Sistema

### **Core Components**

```
src/
├── hooks/
│   ├── useSessionTermination.ts      # Detecção de sessão encerrada
│   ├── useLoginCountdown.ts          # Countdown para desbloqueio  
│   ├── useLoginBlockValidation.ts    # Validação de bloqueios
│   └── useCurrentUser.ts             # Utilitário para user ID
├── components/auth/
│   ├── countdown-card.tsx            # UI do countdown
│   ├── login-form-fields.tsx         # Campos modulares do form
│   └── login-submit-button.tsx       # Botão com estados
├── core/middleware/
│   └── middleware.ts                 # Detecção no middleware
└── app/actions/auth/
    └── login.ts                      # Validação no server action
```

### **Database Schema**

```sql
-- Bloqueios de usuários por admin
user_session_blocks (
  id, user_id, reason, blocked_until, created_at, created_by
)

-- Funções RPC para verificação segura
is_user_session_blocked(check_user_id uuid) 
get_user_block_remaining_time(check_user_id uuid)
get_recent_user_blocks(minutes_ago int, limit_count int)
```

## 🔄 Fluxo Completo

### **1. Encerramento pelo Admin**
```typescript
// Admin encerra sessão → usuário é redirecionado automaticamente
middleware.ts → detecta bloqueio → redirect('/login?reason=session_terminated&blocked_until=300')
```

### **2. Detecção no Login**
```typescript
// useSessionTermination hook processa parâmetros da URL
const { timeRemaining } = useSessionTermination()
// Toast exibido automaticamente baseado no tempo restante
```

### **3. Validação Pre-Login**
```typescript
// useLoginBlockValidation verifica antes do submit
const { validateUserBlock } = useLoginBlockValidation()
const blockResult = await validateUserBlock(email)
if (blockResult.isBlocked) return // Mostra countdown
```

### **4. Countdown Inteligente**
```typescript
// useLoginCountdown gerencia timer e desbloqueio
const { timeRemaining, isBlocked } = useLoginCountdown(initialTime)
// Notifica quando desbloqueio ocorre
```

## 🎨 Estados da Interface

### **Tipos de Toast**

1. **Sessão Encerrada (Com Bloqueio)**
   ```typescript
   toast.error('Sessão Encerrada', {
     description: `Sua sessão foi encerrada por motivos de segurança. Acesso liberado em ${minutes} minuto(s).`,
     duration: 8000, persistent: true
   })
   ```

2. **Sessão Encerrada (Sem Bloqueio)**
   ```typescript
   toast.warning('Sessão Encerrada', {
     description: 'Sua sessão foi encerrada por motivos de segurança. Você já pode fazer login novamente.',
     duration: 6000, persistent: true
   })
   ```

3. **Login Bloqueado**
   ```typescript
   toast.warning("Login Temporariamente Bloqueado", {
     description: `Acesso suspenso por motivos de segurança. Aguarde ${timeText} para tentar novamente.`
   })
   ```

### **Countdown Card**
```tsx
// Design sofisticado com gradientes e padrões
<div className="bg-gradient-to-br from-amber-50 to-orange-50 border-l-4 border-amber-400">
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgb(245_245_244)_1px,_transparent_1px)]" />
  {/* Countdown timer com formatação MM:SS */}
</div>
```

## 🔧 Hooks Especializados

### **useSessionTermination**
- **Propósito:** Detectar e processar encerramento de sessão via URL params
- **Funcionalidades:** Toast automático, limpeza de URL, prevenção de duplicação
- **Uso:** Apenas na página de login

### **useLoginCountdown**  
- **Propósito:** Gerenciar countdown de desbloqueio
- **Funcionalidades:** Timer em tempo real, notificação de desbloqueio
- **Integração:** Com useSessionTermination

### **useLoginBlockValidation**
- **Propósito:** Validar bloqueios antes do login
- **Funcionalidades:** Query de usuário, verificação RPC, toast de bloqueio
- **Timing:** Pre-submit do formulário

### **useCurrentUser**
- **Propósito:** Utilitário para obter user ID
- **Simplicidade:** Hook reutilizável sem lógica complexa

## 🛡️ Segurança e Validação

### **Middleware Protection**
```typescript
// Detecta sessões encerradas em qualquer rota protegida
if (isBlocked) {
  await supabase.auth.admin.signOut(user.id, 'global')
  return redirect('/login?reason=session_terminated&blocked_until=X')
}
```

### **Server Action Validation** 
```typescript
// Verifica bloqueio durante login antes de permitir acesso
const { data: isBlocked } = await supabase.rpc('is_user_session_blocked')
if (isBlocked) {
  await supabase.auth.signOut() // Logout imediato
  return { redirect: '/login?reason=session_terminated&blocked_until=X' }
}
```

### **RPC Functions Security**
```sql
-- Função com SECURITY DEFINER para acesso seguro
CREATE OR REPLACE FUNCTION is_user_session_blocked(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
```

## 📊 Debug e Monitoramento

### **Logging Condicional**
```typescript
// Sistema dual async/sync para logs controlados via UI
await conditionalDebugLog('ServerAction: Verificando bloqueio', { userId })
conditionalDebugLogSync('useSessionTermination: Processando encerramento', { reason })
```

### **Pontos de Debug**
- Middleware: Detecção de bloqueios e redirecionamentos  
- Server Actions: Validação de login e logout forçado
- Hooks: Processamento de parâmetros e estados
- Components: Estados de UI e transições

## ⚡ Performance e Otimizações

### **Prevenção de Re-renders**
```typescript
// useRef para evitar processamento múltiplo
const processedRef = useRef(false)
if (processedRef.current) return
```

### **Cleanup Inteligente**
```typescript
// Timeout para permitir leitura por outros componentes
setTimeout(() => {
  url.searchParams.delete('reason')
  window.history.replaceState({}, '', url.toString())
}, 500)
```

### **Cache de Validação**
- RPC calls otimizadas para verificação de bloqueios
- Fallback graceful em caso de erros
- Estados intermediários para UX suave

## 🔄 Refatoração Realizada

### **Antes: LoginForm Monolítico**
- 480+ linhas em um único arquivo
- Lógica complexa misturada com UI
- Múltiplos useEffect interdependentes
- Estados duplicados e flags confusos

### **Depois: Arquitetura Modular**
- 144 linhas no componente principal
- 4 hooks especializados separados
- 3 componentes UI modulares
- Estado limpo e responsabilidades claras

### **Benefícios da Refatoração**
- **Manutenibilidade:** Cada hook tem responsabilidade única
- **Testabilidade:** Componentes isolados e testáveis
- **Reutilização:** Hooks podem ser usados em outros contextos
- **Debug:** Logs centralizados e controláveis
- **Performance:** Menos re-renders e estado otimizado

## 📋 Checklist de Implementação

### **✅ Core Sistema**
- [x] Middleware de detecção de sessões encerradas
- [x] Server Action com validação de bloqueios
- [x] Hooks especializados para cada responsabilidade
- [x] Componentes UI modulares e reutilizáveis

### **✅ Segurança**
- [x] RPC functions com SECURITY DEFINER
- [x] Logout global via admin API
- [x] Validação pre-login e durante acesso
- [x] Cleanup de sessões ativas

### **✅ UX/UI**
- [x] Toasts diferenciados por contexto
- [x] Countdown visual sofisticado
- [x] Estados de loading e disabled apropriados
- [x] Transições suaves entre estados

### **✅ Debug e Monitoramento**
- [x] Sistema de debug condicional integrado
- [x] Logs estruturados em pontos críticos
- [x] Controle via interface admin
- [x] Fallbacks graceful para erros

## 💡 Padrões Estabelecidos

### **Hook Specialization Pattern**
```typescript
// Cada hook tem uma responsabilidade específica e bem definida
useSessionTermination()    // Detecção e feedback
useLoginCountdown()       // Timer e desbloqueio  
useLoginBlockValidation() // Validação pre-submit
useCurrentUser()          // Utilitário simples
```

### **Component Modularization Pattern**
```typescript
// UI dividida em componentes focados e reutilizáveis
<CountdownCard />         // Visual do countdown
<LoginFormFields />       // Campos do formulário
<LoginSubmitButton />     // Botão com estados
```

### **Conditional Debug Pattern**
```typescript
// Logs controláveis sem redeploy
await conditionalDebugLog()    // Async contexts
conditionalDebugLogSync()      // Sync contexts
```

Este sistema serve como referência para implementações similares de gerenciamento de sessão e feedback de usuário em tempo real.