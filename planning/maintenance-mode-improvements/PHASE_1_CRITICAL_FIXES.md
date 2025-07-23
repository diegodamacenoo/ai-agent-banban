# Fase 1: Correções Críticas - Modo Manutenção

**Duração:** 2-3 dias  
**Prioridade:** ⭐ ALTA  
**Esforço:** ~8-12 horas

## 🎯 Objetivos

Corrigir lacunas críticas na cobertura do modo de manutenção e melhorar visibilidade básica.

## 📋 Tarefas

### **1. Completar Verificações Faltantes** (3-4 horas)

#### **`tenant-module-assignments.ts`**
```typescript
// Adicionar em TODAS as funções de escrita:
export async function createTenantAssignment(data: TenantAssignmentData) {
  const { inMaintenance, message } = await checkMaintenanceMode();
  if (inMaintenance) {
    return { success: false, error: message || 'Sistema em manutenção' };
  }
  // ... resto da função
}
```

**Funções a modificar:**
- `createTenantAssignment`
- `updateTenantAssignment` 
- `deleteTenantAssignment`
- `bulkUpdateTenantAssignments`

#### **Outras Operações Críticas**
- `src/app/actions/admin/users.ts` - criação/edição usuários
- `src/app/actions/admin/organizations.ts` - gestão organizações

### **2. Expandir Alertas para Usuários** (2-3 horas)

#### **Modificar `MaintenanceCheck.tsx`**
```typescript
// Adicionar prop para mostrar para todos os usuários
interface MaintenanceCheckProps {
  showForAllUsers?: boolean;
  variant?: 'admin' | 'user';
}

// Versão para usuários regulares
if (variant === 'user') {
  return (
    <Alert variant="warning" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        Sistema temporariamente indisponível para manutenção.
        Algumas funcionalidades podem estar limitadas.
      </AlertDescription>
    </Alert>
  );
}
```

#### **Adicionar em Layout Principal**
```typescript
// app/(protected)/layout.tsx
import { MaintenanceCheck } from '@/components/MaintenanceCheck';

export default function ProtectedLayout({ children }) {
  return (
    <div>
      <MaintenanceCheck showForAllUsers variant="user" />
      {children}
    </div>
  );
}
```

### **3. Logs de Ativação/Desativação** (1-2 horas)

#### **Modificar `saveSystemSettings`**
```typescript
// module-settings.ts
export async function saveSystemSettings(settings: SystemSettings) {
  const previousConfig = await getSystemConfig();
  
  // ... salvar configurações
  
  // Log mudanças no modo manutenção
  if (previousConfig.maintenanceMode !== settings.maintenanceMode) {
    await conditionalAuditLog({
      actor_user_id: userId,
      action_type: settings.maintenanceMode ? 'MAINTENANCE_ENABLED' : 'MAINTENANCE_DISABLED',
      resource_type: 'system_config',
      details: {
        previousMode: previousConfig.maintenanceMode,
        newMode: settings.maintenanceMode,
        timestamp: new Date().toISOString()
      }
    });
  }
}
```

### **4. Melhorar Mensagens** (1 hora)

#### **Mensagens Mais Informativas**
```typescript
// system-config-utils.ts
export async function checkMaintenanceMode(): Promise<{ inMaintenance: boolean; message?: string }> {
  const maintenance = await isMaintenanceMode();
  
  if (maintenance) {
    return {
      inMaintenance: true,
      message: 'Sistema em modo de manutenção. Operações administrativas estão temporariamente indisponíveis. Tente novamente em alguns minutos.'
    };
  }
  
  return { inMaintenance: false };
}
```

## 🧪 Testes

### **Teste de Cobertura**
```bash
# Verificar se todas operações críticas checam manutenção
npm test -- --testPathPattern="maintenance.*coverage"
```

### **Teste de UX**
1. Ativar modo manutenção via admin
2. Verificar alerta para usuários regulares
3. Tentar operações bloqueadas
4. Verificar logs de auditoria

## ✅ Critérios de Conclusão

- [ ] `tenant-module-assignments.ts` verifica manutenção em todas funções
- [ ] Usuários regulares veem alerta quando manutenção ativa
- [ ] Logs registram ativação/desativação do modo
- [ ] Mensagens são claras e informativas
- [ ] Todos os testes passam

## 📊 Impacto Esperado

**Antes:** Sistema incompleto, usuários confusos  
**Depois:** Cobertura 90%+, UX clara, logs auditáveis

**Esforço vs. Retorno:** 8-12 horas → 80% de melhoria na eficácia