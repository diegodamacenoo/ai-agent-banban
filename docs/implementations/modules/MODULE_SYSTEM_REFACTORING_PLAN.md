# Plano de Refatoração do Sistema de Gestão de Módulos

## 📋 Análise do Problema Atual

### Problemas Identificados

1. **Hardcoding Excessivo**
   - 200+ linhas de mapeamentos estáticos no `MODULE_COMPONENT_REGISTRY`
   - Condicionais hardcoded para cada tipo de módulo na sidebar
   - Paths de componentes fixos no código

2. **Duplicação de Lógica**
   - Mesmo módulo definido para 'banban', 'custom', 'riachuelo'
   - Lógica de verificação de módulo repetida em múltiplos arquivos
   - Mapeamentos ID duplicados

3. **Complexidade de Manutenção**
   - Adicionar novo módulo requer mudanças em 5+ arquivos
   - Sincronização manual entre `tenant_modules` e `implementation_config`
   - Forte acoplamento entre componentes

4. **Falta de Escalabilidade**
   - Sistema não suporta módulos dinâmicos
   - Configuração por cliente é hardcoded
   - Rotas e navegação não são configuráveis

---

## 🎯 Objetivos da Refatoração

### Princípios Orientadores

1. **Data-Driven Configuration**: Toda configuração deve vir do banco de dados
2. **Dynamic Loading**: Componentes carregados dinamicamente baseado em configuração
3. **Single Source of Truth**: Uma única fonte de verdade para metadados de módulos
4. **Separation of Concerns**: Separar lógica de negócio, apresentação e dados
5. **Client Agnostic**: Sistema agnóstico a clientes específicos

### Resultados Esperados

- ✅ Adicionar novo módulo em 2 minutos via UI admin
- ✅ Zero hardcoding de nomes, paths ou configurações de módulos
- ✅ Sistema escalável para 100+ módulos e múltiplos clientes
- ✅ Configuração de módulos por interface gráfica
- ✅ Hot-reload de módulos sem restart da aplicação

---

## 🏗️ Nova Arquitetura Proposta

### 1. Database Schema Refatorado

```sql
-- =============================================
-- CORE MODULE REGISTRY (Catálogo Global)
-- =============================================
CREATE TABLE core_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,           -- e.g., 'performance'
  name VARCHAR(100) NOT NULL,                 -- e.g., 'Performance Analytics'
  description TEXT,
  category VARCHAR(30) NOT NULL,              -- 'analytics', 'operations', 'insights'
  version VARCHAR(20) DEFAULT '1.0.0',
  maturity_status VARCHAR(20) DEFAULT 'BETA', -- 'ALPHA', 'BETA', 'GA', 'DEPRECATED'
  pricing_tier VARCHAR(20) DEFAULT 'FREE',    -- 'FREE', 'PREMIUM', 'ENTERPRISE'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- MODULE IMPLEMENTATIONS (Client-Specific)
-- =============================================
CREATE TABLE module_implementations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES core_modules(id) ON DELETE CASCADE,
  client_type VARCHAR(50) NOT NULL,           -- 'banban', 'riachuelo', 'default'
  component_path VARCHAR(200) NOT NULL,       -- '@/clients/banban/modules/performance'
  name VARCHAR(100),                  -- Override do nome para cliente específico
  icon_name VARCHAR(50),                      -- Nome do ícone Lucide
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['performance.view', 'performance.export']
  config JSONB DEFAULT '{}',                  -- Configurações específicas do cliente
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(module_id, client_type)
);

-- =============================================
-- MODULE NAVIGATION (Estrutura de Navegação)
-- =============================================
CREATE TABLE module_navigation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  implementation_id UUID REFERENCES module_implementations(id) ON DELETE CASCADE,
  nav_type VARCHAR(20) NOT NULL,              -- 'direct', 'submenu'
  nav_title VARCHAR(100) NOT NULL,
  nav_order INTEGER DEFAULT 0,
  parent_id UUID REFERENCES module_navigation(id), -- Para submenus
  route_path VARCHAR(200),                    -- '/performance' or null para submenus
  is_external BOOLEAN DEFAULT false,
  
  INDEX (implementation_id, nav_order)
);

-- =============================================
-- TENANT MODULE ACCESS (Instâncias Ativas)
-- =============================================
CREATE TABLE tenant_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  module_id UUID REFERENCES core_modules(id) ON DELETE CASCADE,
  implementation_id UUID REFERENCES module_implementations(id) ON DELETE CASCADE,
  is_visible BOOLEAN DEFAULT true,
  operational_status VARCHAR(20) DEFAULT 'ENABLED', -- 'ENABLED', 'DISABLED', 'UPGRADING'
  custom_config JSONB DEFAULT '{}',           -- Override de configurações por tenant
  installed_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP,
  
  UNIQUE(organization_id, module_id)
);
```

### 2. Dynamic Module Registry

```typescript
// src/core/modules/registry/ModuleRegistry.ts
export class ModuleRegistry {
  private static instance: ModuleRegistry;
  private moduleCache = new Map<string, ModuleImplementation>();
  private componentCache = new Map<string, React.ComponentType>();

  // Carrega configuração de módulos do banco de dados
  async loadModuleConfiguration(organizationId: string, clientType: string): Promise<ModuleConfiguration[]> {
    const { data } = await supabase
      .from('tenant_modules')
      .select(`
        *,
        core_modules (
          slug,
          name,
          description,
          category
        ),
        module_implementations (
          component_path,
          name,
          icon_name,
          permissions,
          config
        ),
        module_navigation (
          nav_type,
          nav_title,
          nav_order,
          route_path,
          parent_id
        )
      `)
      .eq('organization_id', organizationId)
      .eq('module_implementations.client_type', clientType)
      .eq('is_visible', true)
      .eq('operational_status', 'ENABLED')
      .order('module_navigation.nav_order');

    return data.map(this.mapToModuleConfiguration);
  }

  // Carrega componente dinamicamente
  async loadComponent(componentPath: string): Promise<React.ComponentType> {
    if (this.componentCache.has(componentPath)) {
      return this.componentCache.get(componentPath)!;
    }

    try {
      const module = await import(componentPath);
      const component = module.default || module[Object.keys(module)[0]];
      this.componentCache.set(componentPath, component);
      return component;
    } catch (error) {
      console.error(`Erro ao carregar módulo: ${componentPath}`, error);
      throw new Error(`Módulo não encontrado: ${componentPath}`);
    }
  }

  // Gera navegação dinamicamente
  generateNavigation(modules: ModuleConfiguration[]): NavigationItem[] {
    return modules
      .sort((a, b) => a.navigation.nav_order - b.navigation.nav_order)
      .map(module => ({
        id: module.slug,
        title: module.navigation.nav_title,
        icon: module.implementation.icon_name,
        href: module.navigation.route_path,
        items: module.navigation.children?.map(child => ({
          title: child.nav_title,
          href: child.route_path
        }))
      }));
  }
}
```

### 3. Universal Module Loader

```typescript
// src/core/modules/loader/ModuleLoader.tsx
export const ModuleLoader: React.FC<ModuleLoaderProps> = ({ 
  organizationId, 
  clientType, 
  moduleSlug, 
  ...props 
}) => {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModule = async () => {
      try {
        setLoading(true);
        setError(null);

        const registry = ModuleRegistry.getInstance();
        const modules = await registry.loadModuleConfiguration(organizationId, clientType);
        const module = modules.find(m => m.slug === moduleSlug);

        if (!module) {
          throw new Error(`Módulo '${moduleSlug}' não encontrado para organização`);
        }

        const ComponentClass = await registry.loadComponent(module.implementation.component_path);
        setComponent(() => ComponentClass);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadModule();
  }, [organizationId, clientType, moduleSlug]);

  if (loading) return <ModuleLoadingSkeleton />;
  if (error) return <ModuleErrorFallback error={error} />;
  if (!Component) return <ModuleNotFound />;

  return <Component {...props} />;
};
```

### 4. Dynamic Sidebar Generator

```typescript
// src/shared/components/dynamic-sidebar/DynamicSidebar.tsx
export const DynamicSidebar: React.FC<DynamicSidebarProps> = ({
  organizationId,
  clientType,
  organizationSlug
}) => {
  const [navigation, setNavigation] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNavigation = async () => {
      try {
        const registry = ModuleRegistry.getInstance();
        const modules = await registry.loadModuleConfiguration(organizationId, clientType);
        const nav = registry.generateNavigation(modules);
        
        // Adicionar sempre o item Home no início
        setNavigation([
          {
            id: 'home',
            title: 'Home',
            icon: 'Home',
            href: '/',
            exact: true
          },
          ...nav
        ]);
      } catch (error) {
        console.error('Erro ao carregar navegação:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNavigation();
  }, [organizationId, clientType]);

  const getFullHref = (href: string) => {
    if (href === '/') return `/${organizationSlug}`;
    return `/${organizationSlug}${href}`;
  };

  if (loading) return <SidebarSkeleton />;

  return (
    <Sidebar>
      <SidebarHeader>
        <CompanyLogo organizationSlug={organizationSlug} />
      </SidebarHeader>
      <SidebarBody>
        {navigation.map((item) => (
          <SidebarItem
            key={item.id}
            id={item.id}
            label={item.title}
            icon={getLucideIcon(item.icon)}
            href={item.href ? getFullHref(item.href) : undefined}
          >
            {item.items?.map((subItem) => (
              <SidebarItem
                key={subItem.href}
                id={subItem.href}
                label={subItem.title}
                href={getFullHref(subItem.href)}
              />
            ))}
          </SidebarItem>
        ))}
      </SidebarBody>
    </Sidebar>
  );
};
```

### 5. Universal Dynamic Route

```typescript
// src/app/(protected)/[slug]/[module]/page.tsx
export default async function UniversalModulePage({ params }: { params: { slug: string, module: string } }) {
  const { slug, module } = params;

  // Buscar organização
  const organization = await getOrganizationBySlug(slug);
  if (!organization) notFound();

  // Verificar acesso ao módulo
  const hasAccess = await verifyModuleAccess(organization.id, module);
  if (!hasAccess) notFound();

  return (
    <ModuleLoader
      organizationId={organization.id}
      clientType={organization.client_type}
      moduleSlug={module}
      params={params}
      organization={organization}
    />
  );
}

// Funções auxiliares simplificadas
async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const { data } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single();
  return data;
}

async function verifyModuleAccess(organizationId: string, moduleSlug: string): Promise<boolean> {
  const { data } = await supabase
    .from('tenant_modules')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('core_modules.slug', moduleSlug)
    .eq('is_visible', true)
    .eq('operational_status', 'ENABLED')
    .single();
  return !!data;
}
```

---

## 🚀 Plano de Implementação

### Fase 1: Base de Dados ✅ **CONCLUÍDA**
- [x] Criar novas tabelas de módulos
- [x] Migrar dados existentes
- [x] Popular módulos Banban existentes
- [x] Criar seeds para módulos básicos

### Fase 2: Core Registry ✅ **CONCLUÍDA**
- [x] Implementar ModuleRegistry (DynamicModuleRegistry)
- [x] Criar ModuleLoader universal
- [x] Substituir imports estáticos por dinâmicos
- [x] Sistema de cache multicamadas
- [x] Testes e validação de componentes

### Fase 3: Dynamic Navigation ✅ **CONCLUÍDA**
- [x] Implementar DynamicSidebar com design preservado
- [x] Sistema de navegação baseado no banco de dados
- [x] Configurar navegação dinâmica com cache
- [x] Interface complementar de administração
- [x] Adaptadores de compatibilidade para migração gradual
- [x] Suporte a navegação hierárquica (submenus)
- [x] Layouts integrados (DynamicLayout variants)

### Fase 4: Route Simplification ✅ **CONCLUÍDA**
- [x] Criar rota universal `/[slug]/[...path]` simplificada
- [x] Implementar middleware de verificação automática de acesso
- [x] Sistema de cache multicamadas com Next.js unstable_cache
- [x] Fallbacks elegantes (loading, error, not found) com UI rica
- [x] Otimizações de performance avançadas (preloading, retry, tracking)
- [x] Redirecionamentos automáticos para rotas legacy
- [x] Validação de segurança contra paths maliciosos
- [x] Rate limiting por organização
- [x] Audit logging para acessos negados
- [x] Guia completo de migração e cleanup de rotas duplicadas

### Fase 5: Admin Interface Enhancement ✅ **CONCLUÍDA**
- [x] Interface administrativa completa para gestão de módulos (ModuleManager)
- [x] Sistema de permissões granular por usuário/papel (PermissionManager)
- [x] Analytics de uso de módulos em tempo real (ModuleAnalytics)
- [x] A/B testing de diferentes configurações (ABTestingManager)
- [x] Sistema de notificações de mudanças de status (NotificationManager)
- [x] Interface integrada com design system existente
- [x] Componentes seguindo padrões de UI estabelecidos
- [x] Funcionalidades administrativas avançadas

### Fase 6: Migration & Cleanup (Semana 9)
- [ ] Migração completa do sistema antigo
- [ ] Remoção de código legacy
- [ ] Documentação
- [ ] Treinamento da equipe

---

## 📊 Comparação: Antes vs Depois

### Sistema Atual (Complexo)
```typescript
// Para adicionar um novo módulo:
// 1. Editar MODULE_COMPONENT_REGISTRY (40+ linhas)
// 2. Editar unified-sidebar.tsx (15+ linhas)
// 3. Criar componente wrapper
// 4. Atualizar tipos TypeScript
// 5. Sincronizar banco de dados manualmente
// Total: ~60 linhas de código, 5 arquivos
```

### Sistema Proposto (Elegante)
```sql
-- Para adicionar um novo módulo:
INSERT INTO core_modules (slug, name, description, category) 
VALUES ('analytics-advanced', 'Analytics Avançado', 'Análises preditivas', 'analytics');

INSERT INTO module_implementations (module_id, client_type, component_path, icon_name)
VALUES (
  (SELECT id FROM core_modules WHERE slug = 'analytics-advanced'),
  'banban',
  '@/clients/banban/modules/analytics-advanced',
  'TrendingUp'
);

INSERT INTO module_navigation (implementation_id, nav_title, route_path)
VALUES (
  (SELECT id FROM module_implementations WHERE module_id = ... AND client_type = 'banban'),
  'Analytics Avançado',
  '/analytics-advanced'
);

-- Total: 3 queries SQL, zero alterações de código
```

---

## ✅ Benefícios da Refatoração

### Para Desenvolvedores
- **90% menos código** para adicionar novos módulos
- **Zero hardcoding** de configurações
- **Hot-reload** de módulos sem restart
- **Testes mais simples** e isolados

### Para Product Managers
- **Interface gráfica** para configurar módulos
- **A/B testing** de diferentes navegações
- **Feature flags** nativas por módulo
- **Analytics** de uso de módulos

### Para Clientes
- **Configuração personalizada** de módulos
- **White-label** completo por cliente
- **Performance melhorada** com lazy loading
- **Estabilidade** sem acoplamentos

### Para Sistema
- **Escalabilidade** para 100+ módulos
- **Manutenibilidade** drasticamente melhorada
- **Flexibilidade** para novos tipos de cliente
- **Robustez** com fallbacks elegantes

---

## 🔧 Considerações Técnicas

### Performance
- Lazy loading de componentes
- Cache inteligente de configurações
- Otimização de queries com joins eficientes
- Service worker para cache de módulos

### Segurança
- Validação de permissões por módulo
- Sanitização de paths de componentes
- Rate limiting em APIs de configuração
- Audit log de mudanças de configuração

### Escalabilidade
- Sistema preparado para múltiplos data centers
- Cache distribuído via Redis
- Database sharding por tenant se necessário
- CDN para componentes estáticos

### Compatibilidade
- Migração gradual do sistema antigo
- Fallbacks para módulos legacy
- Versionamento de componentes
- Rollback automático em caso de erro

---

## 📈 Status Atual da Implementação

### ✅ **Progresso Concluído (Fases 1-3)**

**Arquivos Implementados:**
- **Base de Dados**: Migração SQL completa em `supabase/migrations/`
- **Registry System**: `src/core/modules/registry/DynamicModuleRegistry.ts`
- **Navigation System**: `src/shared/components/DynamicSidebar.tsx`
- **Layout Components**: `src/shared/components/DynamicLayout.tsx`
- **Admin Interface**: `src/app/(protected)/admin/modules/components/DynamicNavigationConfig.tsx`
- **Compatibility Layer**: `src/shared/components/adapters/SidebarAdapter.tsx`

**Funcionalidades Ativas:**
- ✅ Navegação 100% dinâmica baseada no banco de dados
- ✅ Cache inteligente com TTL configurável
- ✅ Preservação completa do design existente
- ✅ Sistema de módulos escalável para 100+ módulos
- ✅ Interface administrativa complementar
- ✅ Compatibilidade total com sistema existente
- ✅ Suporte a múltiplos tipos de cliente (banban, riachuelo, etc.)

### 🎯 **Próximas Fases Disponíveis**

**Fase 4: Route Simplification**
- Rota universal simplificada `/[slug]/[module]`
- Middleware de verificação automática
- Cleanup de rotas duplicadas

**Fase 5: Admin Interface Enhancement**
- Interface completa de gestão de módulos
- Sistema de permissões granular
- Analytics de uso de módulos

**Fase 6: Migration & Performance**
- Migração completa do sistema legacy
- Otimizações de performance avançadas
- Documentação e treinamento

---

## 📝 Próximos Passos Recomendados

### Opção 1: Prosseguir para Fase 4
```bash
# Implementar Route Simplification
# - Criar rota universal /[slug]/[module]
# - Simplificar sistema de roteamento
# - Remover código duplicado
```

### Opção 2: Consolidar e Testar
```bash
# Focar em testes e refinamento das fases 1-3
# - Testes de integração completos
# - Performance benchmarking
# - Documentação de usuário
```

### Opção 3: Deploy e Produção
```bash
# Preparar sistema atual para produção
# - Migration scripts finais
# - Monitoramento e alertas
# - Rollback strategies
```

---

**Status:** 5 de 6 fases concluídas (83% completo)
**Objetivo Alcançado:** Interface administrativa completa com ferramentas avançadas de gestão
**Próximo Marco:** Migration & Cleanup (Fase 6) - finalização e preparação para produção