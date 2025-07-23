# Fase 3: Funcionalidades Avançadas - Modo Manutenção

**Duração:** 3-4 dias  
**Prioridade:** 📝 BAIXA  
**Esforço:** ~12-16 horas

## 🎯 Objetivos

Implementar funcionalidades avançadas para máxima flexibilidade e automação.

## 📋 Tarefas

### **1. Granularidade por Operação** (4-5 horas)

#### **Schema Avançado**
```typescript
interface AdvancedMaintenanceConfig {
  enabled: boolean;
  level: 'read-only' | 'admin-only' | 'critical-only' | 'full';
  blockedOperations: string[];
  allowedOperations: string[];
  affectedModules: string[];
  exemptModules: string[];
}
```

#### **Sistema de Verificação Granular**
```typescript
// system-config-utils.ts
export async function checkOperationAllowed(
  operation: string,
  module?: string,
  userRole?: string
): Promise<{ allowed: boolean; reason?: string }> {
  const config = await getAdvancedMaintenanceConfig();
  
  if (!config.enabled) {
    return { allowed: true };
  }
  
  // Verificar nível de manutenção
  switch (config.level) {
    case 'read-only':
      return { 
        allowed: operation.startsWith('read') || operation.startsWith('get'),
        reason: 'Sistema em modo somente leitura'
      };
      
    case 'admin-only':
      return {
        allowed: userRole === 'admin' || userRole === 'super_admin',
        reason: 'Acesso limitado a administradores'
      };
      
    case 'critical-only':
      return {
        allowed: config.allowedOperations.includes(operation),
        reason: 'Apenas operações críticas permitidas'
      };
      
    case 'full':
    default:
      return { 
        allowed: false,
        reason: 'Sistema completamente indisponível'
      };
  }
}
```

#### **Middleware Granular**
```typescript
// middleware/maintenance-middleware.ts
export function withMaintenanceCheck(operation: string, module?: string) {
  return async function(handler: Function) {
    const userRole = await getCurrentUserRole();
    const { allowed, reason } = await checkOperationAllowed(operation, module, userRole);
    
    if (!allowed) {
      return { 
        success: false, 
        error: reason || 'Operação não permitida durante manutenção'
      };
    }
    
    return handler();
  };
}
```

### **2. Exceções por Role** (2-3 hours)

#### **Sistema de Exceções**
```typescript
interface MaintenanceExceptions {
  allowedRoles: string[];
  allowedUsers: string[];
  emergencyBypass: boolean;
  bypassCode?: string;
}

export async function checkMaintenanceException(
  userId: string,
  userRole: string,
  bypassCode?: string
): Promise<boolean> {
  const config = await getMaintenanceExceptions();
  
  // Role permitida
  if (config.allowedRoles.includes(userRole)) {
    return true;
  }
  
  // Usuário específico permitido
  if (config.allowedUsers.includes(userId)) {
    return true;
  }
  
  // Código de emergência
  if (config.emergencyBypass && bypassCode === config.bypassCode) {
    await logEmergencyBypass(userId);
    return true;
  }
  
  return false;
}
```

#### **Interface de Emergência**
```typescript
// components/EmergencyBypass.tsx
export function EmergencyBypass() {
  const [bypassCode, setBypassCode] = useState('');
  
  return (
    <div className="emergency-bypass">
      <h3>Acesso de Emergência</h3>
      <Input
        type="password"
        value={bypassCode}
        onChange={(e) => setBypassCode(e.target.value)}
        placeholder="Código de emergência"
      />
      <Button onClick={() => attemptBypass(bypassCode)}>
        Solicitar Acesso
      </Button>
    </div>
  );
}
```

### **3. Agendamento Básico** (4-6 horas)

#### **Schema de Agendamento**
```typescript
interface ScheduledMaintenance {
  id: string;
  name: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  autoEnable: boolean;
  autoDisable: boolean;
  preNotificationMinutes: number;
  config: AdvancedMaintenanceConfig;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
}
```

#### **Scheduler Service**
```typescript
// services/maintenance-scheduler.ts
export class MaintenanceScheduler {
  static async scheduleMaintenanceWindow(schedule: ScheduledMaintenance) {
    // Salvar no banco
    await saveScheduledMaintenance(schedule);
    
    // Agendar notificação prévia
    const notifyAt = new Date(schedule.scheduledStart.getTime() - (schedule.preNotificationMinutes * 60 * 1000));
    await scheduleTask('maintenance-pre-notification', notifyAt, { scheduleId: schedule.id });
    
    // Agendar início
    if (schedule.autoEnable) {
      await scheduleTask('maintenance-start', schedule.scheduledStart, { scheduleId: schedule.id });
    }
    
    // Agendar fim
    if (schedule.autoDisable) {
      await scheduleTask('maintenance-end', schedule.scheduledEnd, { scheduleId: schedule.id });
    }
  }
  
  static async executeScheduledMaintenance(scheduleId: string, action: 'start' | 'end') {
    const schedule = await getScheduledMaintenance(scheduleId);
    
    if (action === 'start') {
      await enableMaintenanceMode(schedule.config);
      await updateScheduleStatus(scheduleId, 'active');
    } else {
      await disableMaintenanceMode();
      await updateScheduleStatus(scheduleId, 'completed');
    }
  }
}
```

#### **Interface de Agendamento**
```typescript
// components/MaintenanceScheduler.tsx
export function MaintenanceScheduler() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agendar Manutenção</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Data/Hora de Início</Label>
            <Input type="datetime-local" />
          </div>
          <div>
            <Label>Data/Hora de Fim</Label>
            <Input type="datetime-local" />
          </div>
        </div>
        
        <div>
          <Label>Notificar com antecedência</Label>
          <Select>
            <SelectContent>
              <SelectItem value="15">15 minutos</SelectItem>
              <SelectItem value="60">1 hora</SelectItem>
              <SelectItem value="1440">24 horas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch id="auto-enable" />
          <Label htmlFor="auto-enable">Ativar automaticamente</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch id="auto-disable" />
          <Label htmlFor="auto-disable">Desativar automaticamente</Label>
        </div>
      </CardContent>
    </Card>
  );
}
```

### **4. Webhook Integration** (2-3 horas)

#### **Webhook Service**
```typescript
// services/maintenance-webhooks.ts
export async function notifyMaintenanceWebhooks(
  event: 'enabled' | 'disabled' | 'scheduled',
  data: any
) {
  const webhooks = await getMaintenanceWebhooks();
  
  await Promise.all(
    webhooks.map(async (webhook) => {
      try {
        await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Event-Type': `maintenance.${event}`,
            'X-Signature': generateWebhookSignature(data, webhook.secret)
          },
          body: JSON.stringify({
            event,
            timestamp: new Date().toISOString(),
            data
          })
        });
      } catch (error) {
        console.error(`Webhook ${webhook.id} failed:`, error);
      }
    })
  );
}
```

#### **Interface de Webhooks**
```typescript
// components/MaintenanceWebhooks.tsx
export function MaintenanceWebhooks() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhooks de Manutenção</CardTitle>
        <CardDescription>
          Notifique sistemas externos sobre mudanças no modo de manutenção
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {webhooks.map(webhook => (
            <div key={webhook.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{webhook.name}</p>
                <p className="text-sm text-muted-foreground">{webhook.url}</p>
              </div>
              <Button variant="outline" size="sm">
                Testar
              </Button>
            </div>
          ))}
        </div>
        
        <Button className="mt-4">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Webhook
        </Button>
      </CardContent>
    </Card>
  );
}
```

## 🧪 Testes

### **Teste de Granularidade**
1. Configurar modo "read-only"
2. Verificar que apenas operações de leitura funcionam
3. Testar exceções por role

### **Teste de Agendamento**
1. Agendar manutenção para +5 minutos
2. Verificar notificação prévia
3. Verificar ativação/desativação automática

### **Teste de Webhooks**
1. Configurar webhook de teste
2. Ativar/desativar manutenção
3. Verificar entrega de notificações

## ✅ Critérios de Conclusão

- [ ] Sistema granular por operação/módulo implementado
- [ ] Exceções por role funcionando
- [ ] Agendamento básico operacional
- [ ] Webhooks integrados e testados
- [ ] Interface admin para todas funcionalidades
- [ ] Documentação técnica completa

## 📊 Impacto Esperado

**Antes:** Sistema binário (ligado/desligado)  
**Depois:** Sistema flexível, automatizado e integrado

**Valor:** Capacita manutenções mais granulares e menos disruptivas