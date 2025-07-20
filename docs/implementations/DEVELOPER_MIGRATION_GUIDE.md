# DEVELOPER MIGRATION GUIDE
## Guia Completo para Desenvolvedores - Sistema de Módulos Dinâmicos

### 🎯 VISÃO GERAL

Este guia ensina como trabalhar com o **novo sistema de módulos dinâmicos** que substituiu o sistema hardcoded anterior. Todas as configurações agora vêm do banco de dados e são carregadas dinamicamente.

### 🔄 PRINCIPAIS MUDANÇAS

#### **Antes (Sistema Legacy)**
```typescript
// ❌ Configuração hardcoded
const MODULE_COMPONENT_REGISTRY = {
  'alerts': () => import('@/components/AlertsPage'),
  'performance': () => import('@/components/PerformancePage')
};

// ❌ Rotas estáticas
// src/app/(protected)/alerts/page.tsx
// src/app/(protected)/performance/page.tsx
```

#### **Depois (Sistema Dinâmico)**
```typescript
// ✅ Configuração dinâmica do banco
const modules = await dynamicModuleRegistry.loadModuleConfiguration(orgId, clientType);

// ✅ Rota universal
// src/app/(protected)/[slug]/[...path]/page.tsx
```

---

## 🚀 COMO ADICIONAR UM NOVO MÓDULO

### **1. Criar o Componente**

```typescript
// src/clients/banban/modules/analytics-advanced/index.tsx
import React from 'react';

interface AnalyticsAdvancedProps {
  organizationId: string;
  searchParams?: Record<string, string>;
}

export default function AnalyticsAdvanced({ organizationId, searchParams }: AnalyticsAdvancedProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Analytics Avançado</h1>
      <p>Módulo de analytics para organização: {organizationId}</p>
    </div>
  );
}
```

### **2. Registrar no Banco de Dados**

Use a **interface administrativa** em `/admin/modules` ou execute SQL:

```sql
-- 1. Criar módulo base
INSERT INTO core_modules (slug, name, description, category, maturity_status, pricing_tier)
VALUES (
  'analytics-advanced',
  'Analytics Avançado', 
  'Análises preditivas e relatórios avançados',
  'analytics',
  'BETA',
  'PREMIUM'
);

-- 2. Criar implementação para cliente
INSERT INTO module_implementations (
  module_id, 
  client_type, 
  component_path, 
  name, 
  icon_name, 
  permissions
)
VALUES (
  (SELECT id FROM core_modules WHERE slug = 'analytics-advanced'),
  'banban',
  '@/clients/banban/modules/analytics-advanced',
  'Analytics Avançado',
  'TrendingUp',
  ARRAY['analytics.view', 'analytics.advanced']
);

-- 3. Configurar navegação
INSERT INTO module_navigation (
  implementation_id,
  nav_type,
  nav_title,
  nav_order,
  route_path
)
VALUES (
  (SELECT id FROM module_implementations WHERE module_id = (SELECT id FROM core_modules WHERE slug = 'analytics-advanced') AND client_type = 'banban'),
  'direct',
  'Analytics Avançado',
  10,
  '/analytics-advanced'
);
```

### **3. Ativar para Organizações**

```sql
-- Ativar para uma organização específica
INSERT INTO tenant_modules (
  organization_id,
  module_id,
  implementation_id,
  is_visible,
  operational_status
)
VALUES (
  'org-uuid-here',
  (SELECT id FROM core_modules WHERE slug = 'analytics-advanced'),
  (SELECT id FROM module_implementations WHERE module_id = (SELECT id FROM core_modules WHERE slug = 'analytics-advanced') AND client_type = 'banban'),
  true,
  'ENABLED'
);
```

### **4. Testar**

O módulo estará automaticamente disponível em:
- **URL**: `/[organization-slug]/analytics-advanced`
- **Navegação**: Aparecerá automaticamente na sidebar
- **Carregamento**: Dinâmico via DynamicModuleRegistry

---

## 🛠️ DEBUGGING E TROUBLESHOOTING

### **Debug do Cache**

```typescript
// Verificar status do cache
import { dynamicModuleRegistry } from '@/core/modules/registry/DynamicModuleRegistry';

const stats = dynamicModuleRegistry.getStats();
console.log('Cache stats:', stats);

// Limpar cache se necessário
dynamicModuleRegistry.clearCache();
```

### **Debug de Carregamento de Módulos**

```typescript
// No DevTools Console
localStorage.setItem('debug', 'module-registry');

// Verificar logs no console:
// 🔄 DynamicModuleRegistry: Carregando módulos...
// ✅ DynamicModuleRegistry: 5 módulos carregados em 120ms
```

### **Problemas Comuns**

#### ❌ **Módulo não aparece na navegação**
```sql
-- Verificar se está ativo
SELECT tm.*, cm.slug, cm.name 
FROM tenant_modules tm
JOIN core_modules cm ON tm.module_id = cm.id
WHERE tm.organization_id = 'your-org-id'
AND tm.is_visible = true
AND tm.operational_status = 'ENABLED';
```

#### ❌ **Erro de carregamento de componente**
```bash
# Verificar se o path está correto
ls -la src/clients/banban/modules/seu-modulo/
```

#### ❌ **Cache desatualizado**
```typescript
// Invalidar cache de uma organização
dynamicModuleRegistry.invalidateOrganizationCache('org-id');
```

---

## 📊 PERFORMANCE BEST PRACTICES

### **1. Otimização de Carregamento**

```typescript
// ✅ Use React.lazy para componentes grandes
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// ✅ Implemente loading states
function ModuleLoader() {
  return (
    <Suspense fallback={<ModuleLoadingSkeleton />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### **2. Cache Inteligente**

```typescript
// ✅ O cache é automático, mas você pode pré-carregar
useEffect(() => {
  // Pré-carregar módulos críticos
  dynamicModuleRegistry.preloadModules(['alerts', 'performance']);
}, []);
```

### **3. Bundle Optimization**

```typescript
// ✅ Use importação dinâmica para módulos opcionais
const OptionalModule = dynamic(
  () => import('./OptionalModule'),
  { 
    ssr: false,
    loading: () => <div>Carregando...</div>
  }
);
```

---

## 🔒 SISTEMA DE PERMISSÕES

### **Verificar Permissões no Componente**

```typescript
import { usePermissions } from '@/shared/hooks/usePermissions';

function SecureComponent() {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission('analytics.view')) {
    return <AccessDenied />;
  }
  
  return <AnalyticsContent />;
}
```

### **Configurar Permissões do Módulo**

```sql
-- Atualizar permissões de uma implementação
UPDATE module_implementations 
SET permissions = ARRAY['module.view', 'module.edit', 'module.admin']
WHERE module_id = (SELECT id FROM core_modules WHERE slug = 'your-module')
AND client_type = 'banban';
```

---

## 🧪 TESTING

### **Testes de Módulos**

```typescript
// tests/modules/analytics-advanced.test.tsx
import { render, screen } from '@testing-library/react';
import AnalyticsAdvanced from '@/clients/banban/modules/analytics-advanced';

describe('AnalyticsAdvanced Module', () => {
  it('renders correctly', () => {
    render(
      <AnalyticsAdvanced 
        organizationId="test-org" 
        searchParams={{}} 
      />
    );
    
    expect(screen.getByText('Analytics Avançado')).toBeInTheDocument();
  });
});
```

### **Testes de Registry**

```typescript
// tests/registry/dynamic-module-registry.test.ts
import { dynamicModuleRegistry } from '@/core/modules/registry/DynamicModuleRegistry';

describe('DynamicModuleRegistry', () => {
  it('loads modules correctly', async () => {
    const modules = await dynamicModuleRegistry.loadModuleConfiguration(
      'test-org',
      'banban'
    );
    
    expect(modules).toHaveLength(5);
    expect(modules[0]).toHaveProperty('slug');
  });
});
```

---

## 🎨 CONVENÇÕES DE CÓDIGO

### **Estrutura de Módulos**

```
src/clients/banban/modules/module-name/
├── index.tsx              # Componente principal
├── components/            # Componentes específicos
├── hooks/                 # Hooks customizados
├── types.ts              # Tipos TypeScript
└── __tests__/            # Testes
```

### **Nomenclatura**

- **Slugs**: `kebab-case` (ex: `analytics-advanced`)
- **Componentes**: `PascalCase` (ex: `AnalyticsAdvanced`)
- **Arquivos**: `kebab-case.tsx` (ex: `analytics-advanced.tsx`)
- **Hooks**: `use + PascalCase` (ex: `useAnalyticsData`)

### **Props Padrão**

```typescript
interface ModuleProps {
  organizationId: string;        // Sempre obrigatório
  searchParams?: Record<string, string>;  // Parâmetros da URL
  subPath?: string[];           // Sub-rotas do módulo
  originalParams?: any;         // Parâmetros originais da rota
}
```

---

## 🔄 MIGRAÇÃO DE MÓDULOS EXISTENTES

### **Checklist de Migração**

- [ ] Componente criado na estrutura de cliente
- [ ] Módulo registrado no banco de dados
- [ ] Implementação configurada para client_type
- [ ] Navegação definida
- [ ] Permissões configuradas
- [ ] Ativado para organizações teste
- [ ] Testes criados e passando
- [ ] Documentação atualizada
- [ ] Rota legacy marcada como deprecated

### **Script de Migração**

```bash
#!/bin/bash
# migrate-module.sh

MODULE_NAME=$1
CLIENT_TYPE=$2

echo "🔄 Migrando módulo: $MODULE_NAME para $CLIENT_TYPE"

# 1. Criar estrutura de diretórios
mkdir -p src/clients/$CLIENT_TYPE/modules/$MODULE_NAME

# 2. Criar template do componente
cat > src/clients/$CLIENT_TYPE/modules/$MODULE_NAME/index.tsx << EOF
import React from 'react';

interface ${MODULE_NAME^}Props {
  organizationId: string;
  searchParams?: Record<string, string>;
}

export default function ${MODULE_NAME^}({ organizationId }: ${MODULE_NAME^}Props) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">${MODULE_NAME^}</h1>
      {/* Seu conteúdo aqui */}
    </div>
  );
}
EOF

echo "✅ Módulo $MODULE_NAME criado em src/clients/$CLIENT_TYPE/modules/$MODULE_NAME"
echo "🔧 Próximos passos:"
echo "  1. Registrar no banco de dados"
echo "  2. Configurar navegação"
echo "  3. Testar carregamento"
```

---

## 📚 RECURSOS ADICIONAIS

### **Documentação**
- [Admin Interface Guide](./ADMIN_MANUAL.md)
- [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)
- [API Reference](./API_REFERENCE.md)

### **Exemplos**
- [Módulo Simples](../examples/simple-module.tsx)
- [Módulo com Sub-rotas](../examples/complex-module.tsx)
- [Módulo com Permissões](../examples/secure-module.tsx)

### **Ferramentas**
- Interface Admin: `/admin/modules`
- DevTools Extension: [Module Registry Inspector]
- CLI Tools: `npm run module:create`

---

**🆘 SUPORTE**: Para dúvidas, entre em contato com a equipe de desenvolvimento via Slack #module-system