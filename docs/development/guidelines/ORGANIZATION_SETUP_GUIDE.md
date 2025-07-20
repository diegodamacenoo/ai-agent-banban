# Guia de Configuração de Organizações - Sistema Multi-Tenant

## 🎯 **Objetivo**

Este guia resolve o erro "Organization not found" que pode ocorrer nos testes de integração do sistema multi-tenant e explica como configurar organizações de teste.

## ❌ **Problema Identificado**

Quando você clica em "Executar Testes de Conectividade" na página `/multi-tenant-demo` e recebe o erro:

```
Error: Organization not found
    at APIRouter.routeRequest (webpack-internal:///(app-pages-browser)/./src/lib/utils/api-router.ts:17:23)
```

**Causa:** O usuário atual não possui uma organização vinculada no banco de dados.

## ✅ **Soluções Disponíveis**

### **Opção 1: Interface Gráfica (Recomendado)**

1. **Acesse a página de demo:** `/multi-tenant-demo`
2. **Vá para a aba "Configuração"** (primeira aba)
3. **Clique em "Configurar Organizações de Teste"**
4. **Aguarde a conclusão** da configuração automática
5. **Teste novamente** na aba "Testes de Integração"

### **Opção 2: Script SQL Manual**

Execute o script SQL no Supabase SQL Editor:

```sql
-- 1. Criar organização customizada de teste
INSERT INTO organizations (
  id,
  name,
  company_legal_name,
  company_trading_name,
  client_type,
  custom_backend_url,
  implementation_config,
  is_implementation_complete,
  implementation_date,
  implementation_team_notes,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Organização de Teste Multi-Tenant',
  'Teste Organização Ltda',
  'Teste Org',
  'custom',
  'http://localhost:4000',
  '{"enabled_modules": ["analytics", "performance", "inventory"], "custom_features": ["advanced_reporting", "real_time_sync"]}',
  true,
  NOW(),
  'Organização criada automaticamente para testes de integração multi-tenant',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- 2. Criar organização padrão de teste
INSERT INTO organizations (
  id,
  name,
  company_legal_name,
  company_trading_name,
  client_type,
  implementation_config,
  is_implementation_complete,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Organização Padrão SaaS',
  'SaaS Padrão Ltda',
  'SaaS Padrão',
  'standard',
  '{"enabled_standard_modules": ["analytics", "reports", "alerts", "dashboard"]}',
  true,
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- 3. Vincular usuários sem organização à organização customizada
WITH test_org AS (
  SELECT id FROM organizations WHERE name = 'Organização de Teste Multi-Tenant' LIMIT 1
)
UPDATE profiles 
SET organization_id = (SELECT id FROM test_org)
WHERE organization_id IS NULL;

-- 4. Verificar configuração
SELECT 
  o.id,
  o.name,
  o.client_type,
  o.custom_backend_url,
  o.is_implementation_complete,
  COUNT(p.id) as users_count
FROM organizations o
LEFT JOIN profiles p ON o.id = p.organization_id
WHERE o.name IN ('Organização de Teste Multi-Tenant', 'Organização Padrão SaaS')
GROUP BY o.id, o.name, o.client_type, o.custom_backend_url, o.is_implementation_complete
ORDER BY o.client_type;
```

## 🔧 **Organizações Criadas**

### **Organização Customizada**
- **Nome:** Organização de Teste Multi-Tenant
- **Tipo:** `custom`
- **Backend:** `http://localhost:4000` (Fastify)
- **Módulos:** analytics, performance, inventory
- **Features:** advanced_reporting, real_time_sync

### **Organização Padrão**
- **Nome:** Organização Padrão SaaS
- **Tipo:** `standard`
- **Backend:** Next.js API Routes
- **Módulos:** analytics, reports, alerts, dashboard

## 🧪 **Testando a Integração**

Após configurar as organizações:

1. **Acesse:** `/multi-tenant-demo`
2. **Verifique a aba "Visão Geral"** - deve mostrar sua organização
3. **Execute os testes na aba "Testes de Integração"**
4. **Teste APIs na aba "Testador de API"**

### **Testes Esperados:**

✅ **Backend Connectivity** - Conectividade com localhost:4000  
✅ **Organization Detection** - Detecção da organização vinculada  
✅ **API Test Endpoint** - Teste básico do backend  
✅ **Integration Test Endpoint** - Teste de integração completa  
✅ **Dynamic Routing** - Roteamento dinâmico de módulos  

## 🔍 **Verificação Manual**

### **Verificar Organização no Banco:**
```sql
SELECT 
  p.id as profile_id,
  p.organization_id,
  o.name as organization_name,
  o.client_type,
  o.custom_backend_url
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
WHERE p.id = 'SEU_USER_ID';
```

### **Verificar Backend:**
```bash
# Testar health check
curl http://localhost:4000/health

# Testar com headers
curl -H "X-Tenant-Id: test-tenant" \
     -H "X-Client-Type: custom" \
     -H "X-Organization-Name: Test Organization" \
     http://localhost:4000/api/test
```

## 🚨 **Troubleshooting**

### **Erro: "Custom backend URL not configured"**
- Verifique se o backend está rodando na porta 4000
- Execute: `cd backend && npm run dev`

### **Erro: "User not authenticated"**
- Faça login novamente no sistema
- Verifique se a sessão não expirou

### **Erro: "Organization not found" persiste**
- Execute o script SQL manual
- Verifique se o `organization_id` no perfil não é NULL
- Recarregue a página após configurar

### **Backend não responde**
- Verifique se está na porta correta: `http://localhost:4000`
- Inicie o backend: `cd backend && npm run dev`
- Verifique logs do backend para erros

## 📝 **Logs para Debug**

O sistema registra logs detalhados no console:

```javascript
// Frontend (Console do browser)
🔍 APIRouter - Organization detected: { name, type, backendUrl }
🔄 Routing to custom backend: { url, method, organizationId }

// Backend (Terminal)
Test endpoint called { tenantId, clientType, organizationName }
```

## 🎯 **Próximos Passos**

Após resolver o problema:

1. **Teste todos os flows** na página de demo
2. **Explore diferentes tipos** de cliente (custom vs standard)
3. **Valide o roteamento** entre backends
4. **Prossiga para a Fase 1.2** (plugins dinâmicos)

---

**Nota:** Este guia resolve especificamente o erro de organização não encontrada. Para outros problemas de integração, consulte o [Troubleshooting Guide](./TROUBLESHOOTING-MULTI-TENANT.md). 