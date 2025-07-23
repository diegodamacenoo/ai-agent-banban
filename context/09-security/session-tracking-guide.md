# Session Tracking System

## 📊 Sistema Completo de Tracking de Sessões

Sistema automático de monitoramento de sessões com middleware, hooks React e limpeza automática implementado.

## 🏗️ Componentes

### **1. Middleware Automático**
```typescript
// src/core/middleware/session-tracking.ts
await trackUserSession(request, user.id, profile.organization_id);
```
- Registra sessões automaticamente em cada requisição
- Detecta dispositivo, browser, OS via User-Agent
- Extrai geolocalização (Cloudflare/Vercel headers)
- Atualiza ou cria sessões conforme necessário

### **2. Hook React para Atividade**
```typescript
// src/core/hooks/use-session-tracking.ts
const { updateActivity } = useSessionTracking({
  trackActivity: true,
  updateInterval: 5, // minutos
  idleTimeout: 30    // minutos
});
```
- Monitora atividade (mouse, teclado, scroll, touch)
- Throttle de 1 segundo para performance
- Timeout de inatividade configurável

### **3. Provider Global**
```tsx
// Integrado em src/app/layout.tsx
<SessionTrackingProvider>
  {children}
</SessionTrackingProvider>
```
- Inicialização automática para usuários autenticados
- Context API para acesso global
- Configuração centralizada

### **4. API de Atualização**
```typescript
// src/app/api/session/update-activity/route.ts
POST /api/session/update-activity
```
- Atualiza timestamp de última atividade
- Cria sessão se não existir
- Validação de autenticação

### **5. Edge Function de Limpeza**
```typescript
// supabase/functions/session-cleanup/index.ts
- Desativa sessões inativas > 24h
- Deleta sessões antigas > 30 dias
- Log de auditoria automático
```

### **6. Funções RPC**
```sql
-- Limpeza manual
SELECT cleanup_old_sessions();

-- Estatísticas globais
SELECT * FROM get_active_sessions_stats();

-- Sessões por organização
SELECT * FROM get_organization_active_sessions(org_id);
```

## 📋 Schema da Tabela

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID,
  
  -- Identificação
  user_agent TEXT,
  ip INET,
  session_type TEXT DEFAULT 'web',
  login_method TEXT DEFAULT 'email',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Estados
  is_active BOOLEAN DEFAULT true,
  
  -- Dados estruturados (JSONB)
  device_info JSONB DEFAULT '{}',      -- browser, os, device_type
  geo_location JSONB DEFAULT '{}',     -- country, region, city, timezone
  security_flags JSONB DEFAULT '{}'    -- trusted_device, first_time_login
);
```

## 🔄 Fluxo de Funcionamento

1. **Usuário acessa página** → Middleware detecta e registra sessão
2. **Atividade contínua** → Hook atualiza timestamp a cada ação do usuário
3. **Atualização periódica** → API chamada a cada 5 minutos
4. **Limpeza automática** → Edge Function executa diariamente
5. **Interface de gestão** → UI existente para visualizar/encerrar sessões

## 📊 Dados Coletados

### **Informações Básicas**
- User ID, Organization ID
- IP address, User-Agent
- Timestamps de criação, atividade, expiração

### **Device Info (JSONB)**
```json
{
  "browser": "Chrome",
  "os": "Windows",
  "device_type": "desktop"
}
```

### **Geo Location (JSONB)**
```json
{
  "country": "BR",
  "region": "SP",
  "city": "São Paulo", 
  "timezone": "America/Sao_Paulo"
}
```

### **Security Flags (JSONB)**
```json
{
  "trusted_device": false,
  "first_time_login": false
}
```

## ⚙️ Configuração

### **Provider Options**
```tsx
<SessionTrackingProvider
  trackActivity={true}      // Monitorar atividade
  updateInterval={5}        // Intervalo de sync (min)
  idleTimeout={30}         // Timeout inatividade (min)
>
```

### **Edge Function Env Vars**
```bash
CRON_SECRET=your_secret_key
SUPABASE_URL=your_supabase_url  
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## 🔧 Integração com UI Existente

Sistema integra automaticamente com:
- `src/components/admin/session-monitor.tsx` - Componente de monitoramento
- `src/app/(authenticated)/dashboard/admin/sessions/` - Página de gestão
- `src/app/actions/auth/sessions.ts` - Server actions de sessões

## ✅ Status: Implementado

- ✅ Middleware automático integrado
- ✅ Tracking de atividade em tempo real
- ✅ Provider global configurado  
- ✅ API de atualização funcionando
- ✅ Limpeza automática via Edge Function
- ✅ Funções RPC para estatísticas
- ✅ Integração com UI existente

## 🚨 Padrões de Segurança

- **RLS**: Políticas aplicadas na tabela `user_sessions`
- **Validação**: Autenticação obrigatória em todas as operações
- **Throttling**: Limitação de frequência de atualizações
- **Cleanup**: Limpeza automática de dados antigos
- **Audit**: Logs de auditoria para operações críticas