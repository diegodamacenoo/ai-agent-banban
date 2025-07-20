# Plano de Migração Multi-Tenant
**Versão:** 1.0  
**Data:** Janeiro 2025  
**Responsável Técnico:** Assistente IA  

---

## 📋 **Sumário Executivo**

Este documento detalha o plano para transformar o projeto BanBan AI Agent em uma plataforma multi-tenant escalável, aproveitando a infraestrutura de `organization_id` já existente.

**Objetivo:** Permitir que múltiplos clientes utilizem a mesma aplicação com dados isolados e módulos configuráveis por organização.

**Prazo Total:** 8-10 semanas  
**Esforço Estimado:** ~160-200 horas  
**Risco:** Médio-Baixo (base já existe)

---

## 🎯 **Análise da Situação Atual**

### ✅ **O que já temos (pontos fortes):**
- `organization_id` implementado em várias tabelas
- Sistema de perfis e roles (`organization_admin`, `standard_user`, `reader`)
- Audit logging com `organization_id`
- Estrutura de analytics com isolamento por organização
- Edge functions para webhooks
- Sistema de permissões básico

### ⚠️ **O que precisa ser implementado:**
- Sistema de módulos dinâmicos
- Controle de acesso por módulos
- Templates de onboarding
- Sistema de planos/pricing
- Isolamento total de dados
- Interface de administração multi-tenant

---

## 🗓️ **Cronograma de Implementação**

## **FASE 1: Fundação Multi-Tenant (3 semanas)**

### **Semana 1: Estrutura de Banco Multi-Tenant**

#### **1.1 Migração do Schema Base (2 dias)**
- [ ] Criar migração `multi_tenant_foundation.sql`
- [ ] Estender tabela `organizations`
- [ ] Criar tabela `organization_modules`  
- [ ] Criar tabela `business_templates`
- [ ] Atualizar RLS policies

**Entregáveis:**
```sql
-- organizations extensão
ALTER TABLE organizations ADD COLUMN:
- plan_type TEXT DEFAULT 'basic'
- features_enabled JSONB DEFAULT '{}'
- max_users INTEGER DEFAULT 5
- max_storage_gb INTEGER DEFAULT 10
- is_active BOOLEAN DEFAULT true
- subscription_ends_at TIMESTAMPTZ
- business_sector TEXT DEFAULT 'retail'
- onboarding_completed_at TIMESTAMPTZ

-- Nova tabela organization_modules
CREATE TABLE organization_modules (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  module_name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  configuration JSONB DEFAULT '{}',
  enabled_at TIMESTAMPTZ
);

-- Nova tabela business_templates  
CREATE TABLE business_templates (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sector TEXT,
  default_modules JSONB,
  sample_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **1.2 Sistema de Módulos (3 dias)**
- [ ] Criar `src/lib/modules/module-manager.ts`
- [ ] Definir interface `ModuleConfig`
- [ ] Implementar funções de verificação de módulos
- [ ] Criar hooks para controle de acesso

**Entregáveis:**
```typescript
// Módulos disponíveis
const AVAILABLE_MODULES = {
  'inventory': { requiredPlan: 'basic', routes: ['/catalog'] },
  'webhooks': { requiredPlan: 'professional', routes: ['/webhooks'] },
  'ai_insights': { requiredPlan: 'enterprise', routes: ['/insights'] },
  'performance': { requiredPlan: 'basic', routes: ['/performance'] },
  'reports': { requiredPlan: 'professional', routes: ['/reports'] }
};

// Hook para verificação
export function useModuleAccess(moduleId: string): boolean
export async function getEnabledModules(orgId: string): Promise<string[]>
```

### **Semana 2: Middleware e Controle de Acesso**

#### **2.1 Middleware Multi-Tenant (2 dias)**
- [ ] Estender `src/middleware.ts`
- [ ] Adicionar verificação de módulos por rota
- [ ] Implementar redirecionamentos inteligentes
- [ ] Criar página de "módulo não disponível"

#### **2.2 Context Provider (1 dia)**
- [ ] Criar `OrganizationContext`
- [ ] Provider para dados da organização
- [ ] Hook `useOrganization()`

#### **2.3 Atualizar getUserData (2 dias)**
- [ ] Incluir dados da organização
- [ ] Incluir módulos habilitados
- [ ] Cache otimizado

**Entregáveis:**
```typescript
// Middleware extension
export async function middleware(request: NextRequest) {
  // ... código existente ...
  
  const requiredModule = getRouteModule(pathname);
  if (requiredModule) {
    const hasAccess = await checkModuleAccess(orgId, requiredModule);
    if (!hasAccess) {
      return NextResponse.redirect('/module-unavailable');
    }
  }
}

// Organization Context
interface OrganizationContextType {
  organization: Organization;
  enabledModules: string[];
  hasModule: (moduleId: string) => boolean;
}
```

### **Semana 3: Templates de Negócio**

#### **3.1 Templates Pré-configurados (2 dias)**
- [ ] Template "Moda/Calçados" (baseado na BanBan)
- [ ] Template "Eletrônicos"  
- [ ] Template "Supermercado"
- [ ] Dados de exemplo por setor

#### **3.2 Sistema de Onboarding (3 dias)**
- [ ] Wizard de configuração inicial
- [ ] Seleção de template de negócio
- [ ] Configuração de módulos
- [ ] Import de dados exemplo

**Entregáveis:**
```typescript
// Business templates
export const BUSINESS_TEMPLATES = {
  'fashion_retail': {
    name: 'Varejo de Moda',
    enabledModules: ['inventory', 'webhooks', 'performance'],
    sampleData: { /* produtos exemplo */ },
    defaultSettings: { currency: 'BRL', timezone: 'America/Sao_Paulo' }
  }
};

// Onboarding flow
/setup-account -> /select-business -> /configure-modules -> /
```

---

## **FASE 2: Interface e Experiência (2 semanas)**

### **Semana 4: Sidebar e Navegação Dinâmica**

#### **4.1 Sidebar Responsiva a Módulos (2 dias)**
- [ ] Atualizar `src/app/ui/sidebar/sidebar.tsx`
- [ ] Filtrar itens baseado em módulos habilitados
- [ ] Indicadores visuais de módulos bloqueados

#### **4.2 Componentes de Upgrade (1 dia)**
- [ ] Modal de upgrade de plano
- [ ] Call-to-action para módulos premium
- [ ] Pricing table

#### **4.3 Dashboard Adaptativo (2 dias)**
- [ ] Widgets baseados em módulos
- [ ] Métricas por plano
- [ ] Onboarding hints

**Entregáveis:**
```typescript
// Sidebar dinâmica
const MENU_ITEMS = MENU_DATA.navMain.filter(item => 
  hasModuleAccess(getItemModule(item.url))
);

// Upgrade components
<UpgradeModal module="webhooks" currentPlan="basic" />
<FeatureGate module="ai_insights" fallback={<UpgradeCard />}>
  <AIInsightsWidget />
</FeatureGate>
```

### **Semana 5: Configurações Multi-Tenant**

#### **5.1 Painel de Configurações (3 dias)**
- [ ] Aba "Plano e Módulos"
- [ ] Gerenciamento de usuários por organização
- [ ] Configurações específicas por setor

#### **5.2 Billing e Usage (2 dias)**
- [ ] Dashboard de uso (usuários, storage, etc.)
- [ ] Histórico de transações
- [ ] Alertas de limite

**Entregáveis:**
```typescript
// Settings extensão
/settings/organization -> configurações da org
/settings/modules -> habilitar/desabilitar módulos
/settings/billing -> planos e pagamento
/settings/users -> gestão de equipe
```

---

## **FASE 3: Backend e Isolamento (2 semanas)**

### **Semana 6: Isolamento de Dados**

#### **6.1 RLS Policies Completas (2 dias)**
- [ ] Auditar todas as tabelas
- [ ] Garantir `organization_id` em todas as queries
- [ ] Policies de segurança robustas

#### **6.2 API Routes Multi-Tenant (2 dias)**
- [ ] Middleware para APIs
- [ ] Validação de organização em todas as rotas
- [ ] Rate limiting por organização

#### **6.3 Edge Functions Update (1 dia)**
- [ ] Roteamento por `organization_id`
- [ ] Configurações específicas por cliente

**Entregáveis:**
```sql
-- RLS completo
CREATE POLICY "organization_isolation" ON table_name
FOR ALL TO authenticated
USING (organization_id = (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid()
));
```

### **Semana 7: Sistema de Planos e Pricing**

#### **7.1 Engine de Planos (3 dias)**
- [ ] Verificação de limites (usuários, storage, etc.)
- [ ] Sistema de quotas
- [ ] Enforcement automático

#### **7.2 Billing Integration (2 dias)**
- [ ] Estrutura para pagamentos (Stripe/PagSeguro)
- [ ] Webhooks de cobrança
- [ ] Suspensão automática

**Entregáveis:**
```typescript
// Quota system
export async function checkQuota(
  orgId: string, 
  resource: 'users' | 'storage' | 'api_calls'
): Promise<{ allowed: boolean; current: number; limit: number }>;

// Plan enforcement
export async function enforceUserLimit(orgId: string): Promise<boolean>;
```

---

## **FASE 4: Admin e Monitoramento (1.5 semanas)**

### **Semana 8: Dashboard Administrativo**

#### **8.1 Multi-Tenant Admin (3 dias)**
- [ ] `/admin/organizations` - listagem e gestão
- [ ] `/admin/analytics` - métricas globais
- [ ] `/admin/support` - ferramentas de suporte

#### **8.2 Monitoramento e Alertas (2 dias)**
- [ ] Métricas por organização
- [ ] Alertas de performance
- [ ] Health checks automáticos

**Entregáveis:**
```typescript
// Admin dashboard
/admin/organizations -> lista todas as orgs
/admin/analytics -> métricas cross-tenant
/admin/billing -> overview financeiro
/admin/support -> ferramentas de debug
```

### **Semana 9-10: Testes e Deploy**

#### **9.1 Testes Completos (1 semana)**
- [ ] Testes de isolamento
- [ ] Testes de performance
- [ ] Testes de segurança

#### **9.2 Documentação e Deploy (0.5 semana)**
- [ ] Documentação técnica
- [ ] Guias de onboarding
- [ ] Deploy gradual

---

## 🔧 **Detalhamento Técnico**

### **Arquivos a Serem Criados:**

```
src/lib/modules/
├── module-manager.ts        # Gestão de módulos
├── quota-manager.ts         # Sistema de quotas
└── billing-engine.ts        # Engine de cobrança

src/components/multi-tenant/
├── feature-gate.tsx         # Bloqueio por plano
├── upgrade-modal.tsx        # Modal de upgrade
├── quota-indicator.tsx      # Indicador de uso
└── admin/
    ├── org-list.tsx         # Lista organizações
    ├── org-metrics.tsx      # Métricas por org
    └── billing-overview.tsx # Overview billing

src/app/(admin)/
├── layout.tsx               # Layout admin
├── organizations/
│   ├── page.tsx            # Lista orgs
│   └── [id]/page.tsx       # Detalhes org
└── analytics/page.tsx      # Analytics global

supabase/migrations/
├── multi_tenant_foundation.sql  # Base multi-tenant
├── rls_policies_complete.sql    # Políticas RLS
└── business_templates.sql       # Templates padrão
```

### **Arquivos a Serem Modificados:**

```
src/middleware.ts              # + verificação módulos
src/app/ui/sidebar/sidebar.tsx # + filtros por módulo
src/lib/auth/getUserData.ts    # + dados organização
src/app/(protected)/layout.tsx # + context provider
src/app/(protected)/settings/  # + configurações multi-tenant
```

---

## 📊 **Métricas de Sucesso**

### **KPIs Técnicos:**
- [ ] 100% das queries com `organization_id`
- [ ] Tempo de onboarding < 5 minutos
- [ ] Performance degradation < 10%
- [ ] Zero vazamentos de dados entre tenants

### **KPIs de Negócio:**
- [ ] Redução de 80% no tempo de deploy novo cliente
- [ ] Custo operacional < $100/mês para 10 clientes
- [ ] Satisfação cliente > 4.5/5 no onboarding

---

## ⚠️ **Riscos e Mitigações**

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Vazamento de dados** | Baixa | Alto | Testes exaustivos de RLS, audit trail |
| **Performance degradation** | Média | Médio | Monitoring, otimização de queries |
| **Complexidade UI** | Média | Baixo | UX testing, feedback loops |
| **Billing integration** | Alta | Médio | MVP sem pagamento, integração posterior |

---

## 💰 **Estimativa de Custos**

### **Desenvolvimento:**
- Desenvolvedores: 160-200h × $50/h = $8k-10k USD
- Infraestrutura adicional: $50/mês
- Ferramentas/licenças: $100/mês

### **ROI Esperado:**
- Cliente atual: $500/mês
- 10 clientes multi-tenant: $5k/mês  
- Break-even: 2-3 meses

---

## 🚀 **Próximos Passos**

1. **Aprovação do plano** - Review e ajustes necessários
2. **Setup do projeto** - Branches, issues, board
3. **Início Fase 1** - Migração do schema base
4. **Weekly reviews** - Acompanhamento semanal
5. **Beta testing** - 2-3 clientes piloto

---

## 📚 **Recursos e Referências**

- [Multi-tenant SaaS patterns](https://docs.aws.amazon.com/whitepapers/latest/saas-tenant-isolation-strategies/saas-tenant-isolation-strategies.html)
- [Supabase RLS guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

**Status:** 📋 Planejamento  
**Última atualização:** Janeiro 2025  
**Próxima revisão:** Após aprovação 