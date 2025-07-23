# Template de Migração - Console.* → conditionalDebugLog

**Criado em:** 2025-01-21  
**Baseado na migração da Fase 1**

## 📋 Checklist de Migração

### **Pré-requisitos**
- [ ] Sistema `conditionalDebugLog` funcionando
- [ ] Tabela `debug_logs` existente
- [ ] Interface administrativa configurada

### **1. Análise do Arquivo**
- [ ] Identificar logs `console.log`, `console.debug`, `console.info`
- [ ] **Manter** `console.error`, `console.warn` (críticos)
- [ ] Classificar por prioridade: ⭐ CRÍTICO | 🔥 ALTO | 📝 MÉDIO

### **2. Preparar Arquivo**
```typescript
// Verificar se já importa
import { conditionalDebugLog } from './system-config-utils';

// Se não, adicionar import:
import { conditionalDebugLog } from '@/path/to/system-config-utils';
```

### **3. Padrões de Migração**

#### **MIGRAR (console.log/debug informativos)**
```typescript
// ❌ ANTES
console.log('Dados processados:', data);
console.debug('Estado atual:', { id, status });

// ✅ DEPOIS  
await conditionalDebugLog('Dados processados', data);
await conditionalDebugLog('Estado atual', { id, status });
```

#### **CONVERTER (console.log de erro → console.error)**
```typescript
// ❌ ANTES
console.log('[ERROR] Falha na operação:', error);

// ✅ DEPOIS
console.error('[ERROR] Falha na operação:', error);
```

#### **MANTER (logs críticos)**
```typescript
// ✅ MANTER COMO ESTÁ
console.error('Erro crítico:', error);
console.warn('Aviso importante:', warning);
```

## 🎯 Critérios de Decisão

### **⭐ MIGRAR PARA conditionalDebugLog**
- Logs úteis para **diagnóstico administrativo**
- Informações sobre **comportamento interno**
- **Troubleshooting** que admins podem precisar
- **Fluxos de configuração** e automação

### **❌ MANTER console.*  **
- **Erros críticos** sempre visíveis
- **Logs temporários** de desenvolvimento  
- **Status de aplicação** essenciais
- **Bibliotecas externas**

## 📝 Exemplo Completo

```typescript
// ANTES da migração
export async function processModule(moduleId: string) {
  console.log('=== PROCESSING MODULE ===');
  console.debug('Module ID:', moduleId);
  
  try {
    const result = await processLogic(moduleId);
    console.log('Processing successful:', result);
    return result;
  } catch (error) {
    console.log('ERROR: Processing failed:', error);
    throw error;
  }
}

// DEPOIS da migração  
import { conditionalDebugLog } from './system-config-utils';

export async function processModule(moduleId: string) {
  await conditionalDebugLog('Iniciando processamento de módulo');
  await conditionalDebugLog('Module ID', { moduleId });
  
  try {
    const result = await processLogic(moduleId);
    await conditionalDebugLog('Processing successful', result);
    return result;
  } catch (error) {
    console.error('Processing failed:', error); // Mantido como error
    throw error;
  }
}
```

## ✅ Validação Pós-Migração

### **1. Testes Técnicos**
- [ ] `npx tsc --noEmit` sem erros críticos
- [ ] Funções ainda compilam e executam
- [ ] Imports corretos

### **2. Teste Funcional**  
- [ ] Sistema funciona com `debugMode: false`
- [ ] Logs aparecem quando `debugMode: true`
- [ ] Interface administrativa controla logs

### **3. Performance**
- [ ] Sem degradação perceptível
- [ ] Cache de configuração funcionando
- [ ] Logs condicionais não impactam prod

## 🔧 Resolução de Problemas

### **Erro: "Cannot find module"**
```typescript
// Verificar path correto
import { conditionalDebugLog } from './system-config-utils';
// ou 
import { conditionalDebugLog } from '@/app/actions/admin/modules/system-config-utils';
```

### **Erro: "Property does not exist"**
- Problema existente, não relacionado à migração
- Verificar tipos/schemas separadamente

### **Performance Issues**
- Verificar se cache de configuração está ativo
- Confirmar que logs só são processados quando necessário

## 📈 Métricas de Sucesso

- **✅ 0 console.log/debug** informativos restantes
- **✅ 100% console.error/warn** preservados  
- **✅ 0 regressões** funcionais
- **✅ Controle administrativo** funcionando

---

**Próximo arquivo:** Usar este template para migrar arquivos da Fase 2 (core services e middleware).