# Fase 2: Melhorias de UX - Modo Manutenção

**Duração:** 4-5 dias  
**Prioridade:** 🔥 MÉDIA  
**Esforço:** ~16-20 horas

## 🎯 Objetivos

Melhorar significativamente a experiência do usuário durante modo de manutenção.

## 📋 Tarefas

### **1. Página Dedicada de Manutenção** (6-8 horas)

#### **Criar `app/maintenance/page.tsx`**
```typescript
import { Metadata } from 'next';
import { MaintenanceLayout } from './components/MaintenanceLayout';

export const metadata: Metadata = {
  title: 'Sistema em Manutenção',
  description: 'O sistema está temporariamente indisponível'
};

export default async function MaintenancePage() {
  const config = await getMaintenanceConfig();
  
  return (
    <MaintenanceLayout>
      <div className="max-w-lg mx-auto text-center">
        <MaintenanceIcon className="h-24 w-24 mx-auto mb-6" />
        
        <h1 className="text-3xl font-bold mb-4">
          Sistema em Manutenção
        </h1>
        
        <p className="text-muted-foreground mb-6">
          {config.message || 'Estamos realizando melhorias no sistema.'}
        </p>
        
        {config.estimatedReturn && (
          <div className="mb-6">
            <p className="font-medium">Previsão de retorno:</p>
            <p className="text-2xl">{formatDate(config.estimatedReturn)}</p>
          </div>
        )}
        
        <ContactSupport />
      </div>
    </MaintenanceLayout>
  );
}
```

#### **Middleware para Redirecionamento**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { inMaintenance } = await checkMaintenanceMode();
  
  if (inMaintenance && !isMaintenancePage(request.nextUrl.pathname)) {
    // Permitir exceções para super-admins
    const userRole = await getUserRole(request);
    if (userRole !== 'super_admin') {
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  }
}
```

### **2. Configurações Avançadas** (4-5 horas)

#### **Expandir Interface Admin**
```typescript
// ModuleSettingsFormContent.tsx - adicionar campos
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <Label className="text-orange-600">Modo de manutenção</Label>
    <Switch
      checked={settings.maintenanceMode}
      onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
    />
  </div>
  
  {settings.maintenanceMode && (
    <div className="space-y-4 border-l-2 border-orange-200 pl-4">
      <div className="space-y-2">
        <Label>Mensagem personalizada</Label>
        <Textarea
          value={settings.maintenanceMessage}
          onChange={(e) => handleSettingChange('maintenanceMessage', e.target.value)}
          placeholder="Estamos realizando melhorias no sistema..."
        />
      </div>
      
      <div className="space-y-2">
        <Label>Previsão de retorno</Label>
        <Input
          type="datetime-local"
          value={settings.estimatedReturn}
          onChange={(e) => handleSettingChange('estimatedReturn', e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Motivo da manutenção</Label>
        <Select
          value={settings.maintenanceReason}
          onValueChange={(value) => handleSettingChange('maintenanceReason', value)}
        >
          <SelectContent>
            <SelectItem value="scheduled">Manutenção programada</SelectItem>
            <SelectItem value="emergency">Manutenção emergencial</SelectItem>
            <SelectItem value="upgrade">Atualização de sistema</SelectItem>
            <SelectItem value="security">Correção de segurança</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )}
</div>
```

#### **Atualizar Schema**
```typescript
// module-settings.ts
interface MaintenanceConfig {
  enabled: boolean;
  message?: string;
  estimatedReturn?: string;
  reason?: 'scheduled' | 'emergency' | 'upgrade' | 'security';
  contactInfo?: string;
}

interface SystemSettings {
  // ... outras configs
  maintenance: MaintenanceConfig;
}
```

### **3. Notificações por Email** (3-4 horas)

#### **Service de Notificação**
```typescript
// services/maintenance-notifications.ts
export async function notifyMaintenanceToggle(
  enabled: boolean,
  config: MaintenanceConfig
) {
  const admins = await getOrganizationAdmins();
  
  const subject = enabled 
    ? '🚧 Modo de manutenção ativado'
    : '✅ Sistema voltou ao normal';
    
  const template = enabled 
    ? 'maintenance-enabled'
    : 'maintenance-disabled';
  
  await Promise.all(
    admins.map(admin => 
      sendEmail({
        to: admin.email,
        subject,
        template,
        data: { config, admin }
      })
    )
  );
}
```

#### **Integrar no Toggle**
```typescript
// module-settings.ts
export async function saveSystemSettings(settings: SystemSettings) {
  const previous = await getSystemConfig();
  
  // ... salvar
  
  // Notificar mudança no modo manutenção
  if (previous.maintenance.enabled !== settings.maintenance.enabled) {
    await notifyMaintenanceToggle(settings.maintenance.enabled, settings.maintenance);
  }
}
```

### **4. Status API Melhorado** (2-3 horas)

#### **Endpoint Rico**
```typescript
// api/system/maintenance-status/route.ts
export async function GET() {
  const config = await getMaintenanceConfig();
  
  return NextResponse.json({
    inMaintenance: config.enabled,
    message: config.message,
    estimatedReturn: config.estimatedReturn,
    reason: config.reason,
    startedAt: config.startedAt,
    affectedServices: ['modules', 'admin-operations']
  });
}
```

#### **Hook Melhorado**
```typescript
// hooks/useMaintenanceStatus.ts
export function useMaintenanceStatus() {
  const [status, setStatus] = useState<MaintenanceStatus>({
    inMaintenance: false
  });
  
  useEffect(() => {
    const checkStatus = async () => {
      const response = await fetch('/api/system/maintenance-status');
      const data = await response.json();
      setStatus(data);
    };
    
    checkStatus();
    
    // WebSocket para updates em tempo real (opcional)
    const ws = new WebSocket('/ws/maintenance-status');
    ws.onmessage = (event) => {
      setStatus(JSON.parse(event.data));
    };
    
    return () => ws.close();
  }, []);
  
  return status;
}
```

## 🧪 Testes

### **Teste de Fluxo Completo**
1. Admin ativa manutenção com config avançada
2. Verificar página `/maintenance` carrega corretamente  
3. Usuários redirecionados automaticamente
4. Email enviado para admins
5. Status API retorna dados completos

### **Teste de UX**
- Página responsiva em mobile/desktop
- Mensagens claras e úteis
- Redirecionamento funciona corretamente

## ✅ Critérios de Conclusão

- [ ] Página `/maintenance` completa e responsiva
- [ ] Middleware redireciona usuários automaticamente
- [ ] Interface admin expandida com configs avançadas
- [ ] Notificações por email funcionando
- [ ] Status API rico implementado
- [ ] Todos os testes de UX passando

## 📊 Impacto Esperado

**Antes:** UX confusa, usuários perdidos  
**Depois:** Experiência clara, informativa e profissional

**ROI:** Redução significativa em tickets de suporte durante manutenções