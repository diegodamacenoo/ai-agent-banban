# TROUBLESHOOTING GUIDE
## Guia Completo de Resolução de Problemas - Sistema de Módulos Dinâmicos

### 🎯 VISÃO GERAL

Este guia aborda **todos os problemas comuns** do sistema de módulos dinâmicos, com soluções passo-a-passo e scripts de diagnóstico automático.

---

## 🚨 PROBLEMAS CRÍTICOS

### **❌ Módulo Não Carrega (Erro 500)**

#### **Sintomas**
- Página em branco ou erro "Component not found"
- Console mostra erro de import
- Loading infinito

#### **Diagnóstico**
```bash
# 1. Verificar se o componente existe
ls -la src/clients/banban/modules/nome-do-modulo/

# 2. Testar import manualmente
node -e "import('@/clients/banban/modules/nome-do-modulo').then(console.log).catch(console.error)"

# 3. Verificar configuração no banco
npx supabase db shell
```

```sql
-- Verificar módulo no banco
SELECT 
  cm.slug,
  cm.name,
  mi.component_path,
  mi.is_available,
  tm.operational_status
FROM core_modules cm
JOIN module_implementations mi ON cm.id = mi.module_id
LEFT JOIN tenant_modules tm ON cm.id = tm.module_id
WHERE cm.slug = 'nome-do-modulo';
```

#### **Soluções**

1. **Path Incorreto**
```sql
-- Corrigir path do componente
UPDATE module_implementations 
SET component_path = '@/clients/banban/modules/nome-correto'
WHERE module_id = (SELECT id FROM core_modules WHERE slug = 'nome-do-modulo');
```

2. **Componente Não Existe**
```bash
# Criar estrutura básica
mkdir -p src/clients/banban/modules/nome-do-modulo
cat > src/clients/banban/modules/nome-do-modulo/index.tsx << 'EOF'
import React from 'react';

export default function NomeDoModulo() {
  return <div>Módulo em desenvolvimento</div>;
}
EOF
```

3. **Status Incorreto**
```sql
-- Ativar módulo
UPDATE tenant_modules 
SET operational_status = 'ENABLED', is_visible = true
WHERE module_id = (SELECT id FROM core_modules WHERE slug = 'nome-do-modulo');
```

---

### **❌ Navegação Não Aparece**

#### **Sintomas**
- Módulo existe mas não aparece na sidebar
- Sidebar carrega mas sem itens específicos
- Erro "navigation not found"

#### **Diagnóstico**
```typescript
// No DevTools Console
localStorage.setItem('debug', 'sidebar,navigation');
// Recarregar página e verificar logs
```

#### **Verificações**

1. **Módulo Ativo para a Organização**
```sql
SELECT 
  o.slug as org_slug,
  cm.slug as module_slug,
  tm.is_visible,
  tm.operational_status
FROM organizations o
JOIN tenant_modules tm ON o.id = tm.organization_id
JOIN core_modules cm ON tm.module_id = cm.id
WHERE o.slug = 'sua-org-slug';
```

2. **Navegação Configurada**
```sql
SELECT 
  mn.nav_title,
  mn.nav_type,
  mn.route_path,
  mn.nav_order
FROM module_navigation mn
JOIN module_implementations mi ON mn.implementation_id = mi.id
JOIN core_modules cm ON mi.module_id = cm.id
WHERE cm.slug = 'nome-do-modulo'
ORDER BY mn.nav_order;
```

#### **Soluções**

1. **Ativar para Organização**
```sql
INSERT INTO tenant_modules (organization_id, module_id, implementation_id)
VALUES (
  (SELECT id FROM organizations WHERE slug = 'sua-org'),
  (SELECT id FROM core_modules WHERE slug = 'nome-do-modulo'),
  (SELECT id FROM module_implementations WHERE module_id = (SELECT id FROM core_modules WHERE slug = 'nome-do-modulo') AND client_type = 'banban')
);
```

2. **Criar Navegação**
```sql
INSERT INTO module_navigation (implementation_id, nav_type, nav_title, nav_order, route_path)
VALUES (
  (SELECT id FROM module_implementations WHERE module_id = (SELECT id FROM core_modules WHERE slug = 'nome-do-modulo') AND client_type = 'banban'),
  'direct',
  'Nome do Módulo',
  10,
  '/nome-do-modulo'
);
```

---

## ⚡ PROBLEMAS DE PERFORMANCE

### **🐌 Carregamento Lento**

#### **Sintomas**
- Módulos demoram > 3s para carregar
- Navegação lenta
- Interface trava temporariamente

#### **Diagnóstico**
```typescript
// Verificar performance do registry
import { dynamicModuleRegistry } from '@/core/modules/registry/DynamicModuleRegistry';

console.time('module-load');
const modules = await dynamicModuleRegistry.loadModuleConfiguration('org-id', 'banban');
console.timeEnd('module-load');

// Verificar stats do cache
console.log('Cache stats:', dynamicModuleRegistry.getStats());
```

#### **Soluções**

1. **Otimizar Cache**
```typescript
// Limpar cache corrompido
dynamicModuleRegistry.clearCache();

// Pré-carregar módulos críticos
await dynamicModuleRegistry.preloadModules(['alerts', 'performance', 'insights']);
```

2. **Reduzir Bundle Size**
```typescript
// Use dynamic imports para módulos pesados
const HeavyModule = dynamic(() => import('./HeavyModule'), {
  loading: () => <div>Carregando...</div>,
  ssr: false
});
```

3. **Otimizar Database Queries**
```sql
-- Adicionar índices se necessário
CREATE INDEX IF NOT EXISTS idx_tenant_modules_lookup 
ON tenant_modules(organization_id, operational_status, is_visible);
```

---

### **💾 Cache Não Funciona**

#### **Sintomas**
- Mesma query executada repetidamente
- Performance degradada
- Cache hit rate baixo

#### **Diagnóstico**
```typescript
// Verificar se cache está habilitado
const registry = DynamicModuleRegistry.getInstance();
console.log('Cache enabled:', registry.config?.enableCache);
console.log('Cache timeout:', registry.config?.cacheTimeout);
```

#### **Soluções**

1. **Reconfigurar Cache**
```typescript
// Criar registry com configuração otimizada
const registry = DynamicModuleRegistry.getInstance({
  enableCache: true,
  cacheTimeout: 10 * 60 * 1000, // 10 minutos
});
```

2. **Verificar TTL**
```typescript
// Cache pode estar expirando muito rápido
// Verificar configuração no DynamicModuleRegistry.ts
```

---

## 🔒 PROBLEMAS DE ACESSO

### **🚫 Acesso Negado**

#### **Sintomas**
- Erro 403 ou "Access Denied"
- Módulo não aparece para alguns usuários
- Redirecionamento para página de erro

#### **Diagnóstico**
```sql
-- Verificar permissões do usuário
SELECT 
  p.role,
  o.slug,
  cm.slug as module_slug,
  mi.permissions
FROM profiles p
JOIN organizations o ON p.organization_id = o.id
JOIN tenant_modules tm ON o.id = tm.organization_id
JOIN core_modules cm ON tm.module_id = cm.id
JOIN module_implementations mi ON cm.id = mi.module_id AND o.client_type = mi.client_type
WHERE p.id = 'user-uuid';
```

#### **Soluções**

1. **Ajustar Permissões do Módulo**
```sql
-- Reduzir permissões necessárias
UPDATE module_implementations 
SET permissions = ARRAY['module.view'] -- Remover permissões complexas
WHERE module_id = (SELECT id FROM core_modules WHERE slug = 'nome-do-modulo');
```

2. **Verificar Role do Usuário**
```sql
-- Atualizar role se necessário
UPDATE profiles 
SET role = 'user' 
WHERE id = 'user-uuid';
```

---

### **🔐 Middleware Bloqueando**

#### **Sintomas**
- Redirects infinitos
- Middleware sempre bloqueia acesso
- Rate limiting excessivo

#### **Diagnóstico**
```bash
# Verificar logs do middleware
grep "middleware" logs/application.log | tail -20

# Verificar rate limiting
grep "rate.limit" logs/application.log | tail -10
```

#### **Soluções**

1. **Ajustar Rate Limiting**
```typescript
// Em middleware.ts, temporariamente aumentar limite
const rateLimitResult = await withRateLimit('higher-limit');
```

2. **Verificar Configuração de Rotas**
```typescript
// Verificar se rota está na lista de públicas ou protegidas corretamente
const publicRoutes = ['/login', '/access-denied']; // Verificar lista
```

---

## 🗄️ PROBLEMAS DE BANCO DE DADOS

### **💔 Dados Inconsistentes**

#### **Sintomas**
- Módulo existe mas não tem implementação
- Navegação sem módulo correspondente
- Organizações sem módulos

#### **Diagnóstico Script**
```sql
-- Verificar integridade dos dados
SELECT 'Modules without implementations' as issue, COUNT(*) as count
FROM core_modules cm
LEFT JOIN module_implementations mi ON cm.id = mi.module_id
WHERE mi.id IS NULL

UNION ALL

SELECT 'Implementations without navigation' as issue, COUNT(*) as count
FROM module_implementations mi
LEFT JOIN module_navigation mn ON mi.id = mn.implementation_id
WHERE mn.id IS NULL

UNION ALL

SELECT 'Tenant modules without core module' as issue, COUNT(*) as count
FROM tenant_modules tm
LEFT JOIN core_modules cm ON tm.module_id = cm.id
WHERE cm.id IS NULL;
```

#### **Soluções**

1. **Script de Limpeza**
```sql
-- Remover dados órfãos
DELETE FROM tenant_modules 
WHERE module_id NOT IN (SELECT id FROM core_modules);

DELETE FROM module_navigation 
WHERE implementation_id NOT IN (SELECT id FROM module_implementations);
```

2. **Script de Reparo**
```sql
-- Criar implementações padrão para módulos sem implementação
INSERT INTO module_implementations (module_id, client_type, component_path, name, icon_name)
SELECT 
  cm.id,
  'default',
  '@/components/modules/' || cm.slug,
  cm.name,
  'Package'
FROM core_modules cm
LEFT JOIN module_implementations mi ON cm.id = mi.module_id
WHERE mi.id IS NULL;
```

---

## 🛠️ FERRAMENTAS DE DIAGNÓSTICO

### **Script de Health Check**

```bash
#!/bin/bash
# health-check.sh

echo "🔍 DIAGNÓSTICO DO SISTEMA DE MÓDULOS"

# 1. Verificar arquivos críticos
echo "📁 Verificando arquivos..."
if [ ! -f "src/core/modules/registry/DynamicModuleRegistry.ts" ]; then
  echo "❌ DynamicModuleRegistry.ts não encontrado"
else
  echo "✅ DynamicModuleRegistry.ts OK"
fi

# 2. Verificar banco de dados
echo "🗄️ Verificando banco..."
npx supabase db check || echo "❌ Problemas no banco detectados"

# 3. Verificar cache
echo "💾 Testando cache..."
node -e "
  import { dynamicModuleRegistry } from './src/core/modules/registry/DynamicModuleRegistry.js';
  console.log('Cache stats:', dynamicModuleRegistry.getStats());
"

# 4. Verificar performance
echo "⚡ Testando performance..."
npm run test:performance || echo "⚠️ Performance abaixo do esperado"

echo "✅ Diagnóstico concluído"
```

### **Debug Console Commands**

```typescript
// Comandos úteis para o DevTools Console

// 1. Verificar módulos carregados
window.debugModules = async () => {
  const registry = await import('@/core/modules/registry/DynamicModuleRegistry');
  const modules = await registry.dynamicModuleRegistry.loadModuleConfiguration('org-id', 'banban');
  console.table(modules);
};

// 2. Limpar todos os caches
window.clearAllCaches = async () => {
  const registry = await import('@/core/modules/registry/DynamicModuleRegistry');
  registry.dynamicModuleRegistry.clearCache();
  localStorage.clear();
  sessionStorage.clear();
  location.reload();
};

// 3. Verificar performance
window.performanceTest = async () => {
  console.time('module-load-test');
  const registry = await import('@/core/modules/registry/DynamicModuleRegistry');
  await registry.dynamicModuleRegistry.loadModuleConfiguration('org-id', 'banban');
  console.timeEnd('module-load-test');
};

// 4. Debug de navegação
window.debugNavigation = () => {
  localStorage.setItem('debug', 'sidebar,navigation,registry');
  location.reload();
};
```

---

## 📊 MONITORAMENTO AVANÇADO

### **Métricas-Chave para Monitorar**

```typescript
// Implementar em produção
const metrics = {
  // Performance
  moduleLoadTime: 'tempo de carregamento < 2s',
  cacheHitRate: 'cache hit rate > 90%',
  errorRate: 'error rate < 0.1%',
  
  // Uso
  activeModules: 'módulos ativos por org',
  userSessions: 'sessões ativas',
  popularModules: 'módulos mais utilizados',
  
  // Sistema
  databaseLatency: 'latência do banco < 100ms',
  memoryUsage: 'uso de memória < 80%',
  cpuUsage: 'uso de CPU < 70%'
};
```

### **Alertas Automáticos**

```yaml
# alerts.yml
alerts:
  - name: "Module Load Failure"
    condition: "error_rate > 5%"
    duration: "5m"
    action: "slack_notification"
    
  - name: "Performance Degradation"  
    condition: "load_time > 3s"
    duration: "10m"
    action: "email_admin"
    
  - name: "Cache Miss High"
    condition: "cache_hit_rate < 70%"
    duration: "15m"
    action: "investigate_cache"
```

---

## 🆘 CONTATOS DE EMERGÊNCIA

### **Escalação**

1. **Nível 1**: Developer on-call (Slack #module-support)
2. **Nível 2**: Senior Developer (emergency-dev@company.com)
3. **Nível 3**: Tech Lead (tech-lead@company.com)
4. **Nível 4**: CTO (cto@company.com)

### **Procedimento de Emergência**

```bash
# Em caso de sistema completamente fora
# 1. Rollback para sistema legacy (se disponível)
git checkout backup-legacy-system
npm run deploy:emergency

# 2. Ativar modo de manutenção
echo "Sistema em manutenção" > public/maintenance.html

# 3. Notificar stakeholders
./scripts/notify-emergency.sh
```

---

## 📚 RECURSOS ADICIONAIS

- **Wiki Interno**: [wiki.company.com/modules]
- **Runbooks**: [runbooks.company.com/module-system]
- **Logs**: [logs.company.com] (buscar por "module-system")
- **Monitoring**: [monitoring.company.com/modules]

**📞 SUPORTE 24/7**: +1-XXX-XXX-XXXX (apenas emergências críticas)