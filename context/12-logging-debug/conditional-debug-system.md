# Sistema de Debug Condicional

**Última atualização:** 2025-01-21  
**Status:** ✅ Implementado - Sistema Dual (Async/Sync)

## 🎯 Visão Geral

Sistema de logging controlável via interface admin que permite ativar/desativar logs em tempo real sem redeploy. Suporta contextos async e sync.

## 🔧 Funções Principais

### **conditionalDebugLog() - Async**
```typescript
import { conditionalDebugLog } from '@/app/actions/admin/modules/system-config-utils';

// Para server actions e serviços async  
export async function processModule() {
  await conditionalDebugLog('Processing module', { moduleId });
  // Salva: console + banco debug_logs
}
```

### **conditionalDebugLogSync() - Sync**  
```typescript
import { conditionalDebugLogSync } from '@/shared/utils/conditional-debug-sync';

// Para middleware e funções síncronas
export function middleware(request: NextRequest) {
  conditionalDebugLogSync('Processing request', { url });
  // Salva: apenas console (cache-based)
}
```

## 📋 Padrões de Uso

### **✅ Use conditionalDebugLog (Async):**
- Server Actions (`'use server'`)
- Serviços e classes async
- Operações com banco de dados

### **✅ Use conditionalDebugLogSync (Sync):**
- Middleware do Next.js  
- Funções utilitárias síncronas
- Contextos onde `await` não funciona

### **❌ Mantenha console.* para:**
- `console.error` - Erros críticos sempre visíveis
- `console.warn` - Warnings importantes
- Logs de bibliotecas externas

## 🎛️ Interface Admin

**Localização:** `/admin/modules/management` → Configurações → "Sistema e Depuração"  
**Campo:** "Modo debug" (Switch vermelho)  
**Efeito:** Mudanças aplicadas instantaneamente via `onDebugModeChanged()`

## 🚀 Inicialização Automática

Sistema inicializa automaticamente via `InitDebug` component:
```typescript
// Executado no startup da aplicação
await initializeSyncDebugSystem();
```

## 📊 Comparação Async vs Sync

| Aspecto | Async | Sync |
|---------|-------|------|
| **Contexto** | Server actions, serviços | Middleware, utils |
| **Persistência** | Console + Banco | Apenas console |  
| **Latência** | Instantânea | Cache 30s |
| **Performance** | Query + INSERT | Verificação cache |

## 🔄 Migração Guidelines

### **Identificar Contexto:**
```typescript
// ❓ Arquivo tem 'use server'? → Use versão async
// ❓ É middleware/função sync? → Use versão sync  
// ❓ Na dúvida? → Teste se await funciona
```

### **Exemplo de Migração:**
```typescript
// ANTES
console.debug('Processing data:', data);

// DEPOIS (Async)
await conditionalDebugLog('Processing data', data);

// DEPOIS (Sync) 
conditionalDebugLogSync('Processing data', data);
```

## 📁 Arquivos Core

- `/app/actions/admin/modules/system-config-utils.ts` - Sistema async
- `/shared/utils/conditional-debug-sync.ts` - Sistema sync  
- `/app/actions/admin/modules/module-settings.ts` - Interface admin
- `/app/init-debug.tsx` - Inicialização automática

**Status:** Sistema completo e operacional com controle administrativo total! 🎯