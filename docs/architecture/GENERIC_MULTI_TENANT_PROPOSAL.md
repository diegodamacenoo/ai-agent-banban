# Proposta de Refatoração: Padronização da Arquitetura Multi-Tenant

## 📋 Sumário Executivo

**Problema Real:** O sistema possui uma inconsistência arquitetural onde existem tabelas `core_*` específicas para o cliente Banban convivendo com tabelas `tenant_*` genéricas por módulo, criando dois padrões conflitantes de multi-tenancy.

**Solução:** Eliminar o padrão `core_*` e padronizar tudo no padrão `tenant_*` com isolamento por `organization_id`, mantendo a flexibilidade para diferentes tipos de negócio.

## 🎯 Objetivos

1. **Eliminar** a inconsistência entre padrões `core_*` vs `tenant_*`
2. **Padronizar** TODO o sistema no padrão `tenant_*` + `organization_id`
3. **Manter** a flexibilidade para diferentes tipos de clientes/negócios
4. **Preservar** a funcionalidade específica do Banban via configuração
5. **Escalar** para novos clientes sem criar tabelas específicas

## 📊 Análise da Situação Atual

### **Problema Arquitetural Identificado:**

#### 1. **Padrão Inconsistente - Tabelas Core (específicas Banban)**
```sql
-- ❌ PADRÃO PROBLEMÁTICO: Tabelas específicas sem organization_id
core_products          -- Apenas para Banban
core_suppliers         -- Apenas para Banban  
core_locations         -- Apenas para Banban
core_orders           -- Apenas para Banban
core_documents        -- Apenas para Banban
core_movements        -- Apenas para Banban
core_product_variants -- Apenas para Banban
core_product_pricing  -- Apenas para Banban
```

#### 2. **Padrão Correto - Tabelas Tenant (genéricas por módulo)**
```sql
-- ✅ PADRÃO IDEAL: Tabelas genéricas com organization_id
tenant_performance_metrics  -- Qualquer tipo de métrica
tenant_performance_cache    -- Cache genérico
tenant_insights_cache      -- Insights genéricos
tenant_inventory_items     -- Inventário genérico
tenant_inventory_config    -- Configuração flexível
```

### **Tipos de Clientes Existentes:**
- **Standard:** Clientes que usam módulos padrão (performance, insights, etc.)
- **Custom:** Clientes com necessidades específicas (como Banban - varejo/moda)
- **Híbridos:** Clientes que usam módulos padrão + customizações

## 🏗️ **Proposta de Padronização**

### **Princípio Central:**
> "Uma tabela por conceito de negócio, não por cliente específico"

### **Estratégia de Migração:**

#### **Fase 1: Módulos de Negócio Genéricos**
```sql
-- Para clientes como Banban (varejo/moda)
CREATE TABLE tenant_business_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    
    -- Identificação genérica
    entity_type TEXT NOT NULL, -- 'product', 'supplier', 'location', 'customer'
    external_id TEXT NOT NULL,
    name TEXT NOT NULL,
    
    -- Dados estruturados flexíveis
    business_data JSONB DEFAULT '{}', -- Dados específicos do tipo de negócio
    configuration JSONB DEFAULT '{}', -- Configurações específicas
    metadata JSONB DEFAULT '{}',      -- Metadados técnicos
    
    -- Campos comuns
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, entity_type, external_id)
);
```

#### **Fase 2: Relacionamentos Genéricos**
```sql
-- Substituir relacionamentos específicos por genéricos
CREATE TABLE tenant_business_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    
    -- Relacionamento genérico
    source_entity_id UUID NOT NULL REFERENCES tenant_business_entities(id),
    target_entity_id UUID NOT NULL REFERENCES tenant_business_entities(id),
    relationship_type TEXT NOT NULL, -- 'variant_of', 'supplied_by', 'located_at'
    
    -- Dados do relacionamento
    relationship_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, source_entity_id, target_entity_id, relationship_type)
);
```

#### **Fase 3: Transações Genéricas**
```sql
-- Substituir core_orders, core_documents, core_movements
CREATE TABLE tenant_business_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    
    -- Tipo de transação
    transaction_type TEXT NOT NULL, -- 'order', 'document', 'movement', 'sale'
    external_id TEXT,
    
    -- Dados da transação
    transaction_data JSONB NOT NULL,
    transaction_items JSONB DEFAULT '[]',
    
    -- Status e datas
    status TEXT DEFAULT 'pending',
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, transaction_type, external_id)
);
```

## 📋 **Configuração por Tipo de Cliente**

### **Para Banban (Varejo/Moda):**
```sql
-- Configuração na tabela organizations
UPDATE organizations 
SET implementation_config = {
  "business_domain": "fashion_retail",
  "entity_types": ["product", "supplier", "location", "variant"],
  "transaction_types": ["order", "document", "movement"],
  "required_fields": {
    "product": ["gender", "brand", "folder", "season", "material"],
    "variant": ["size", "color", "sku"]
  },
  "modules": ["inventory", "performance", "insights"]
}
WHERE slug = 'banban';
```

### **Para Cliente Standard (Qualquer Negócio):**
```sql
-- Configuração genérica
UPDATE organizations 
SET implementation_config = {
  "business_domain": "general",
  "entity_types": ["item", "contact", "location"],
  "transaction_types": ["transaction"],
  "modules": ["performance", "insights"]
}
WHERE client_type = 'standard';
```

## 🚀 **Plano de Migração Detalhado**

### **Fase 1: Criação das Tabelas Genéricas (1 semana)**
- Criar `tenant_business_entities`
- Criar `tenant_business_relationships`  
- Criar `tenant_business_transactions`
- Configurar RLS e índices

### **Fase 2: Migração de Dados Banban (2 semanas)**
```sql
-- Migrar core_products → tenant_business_entities
INSERT INTO tenant_business_entities (
    organization_id, entity_type, external_id, name, business_data
)
SELECT 
    (SELECT id FROM organizations WHERE slug = 'banban'),
    'product',
    external_id,
    product_name,
    jsonb_build_object(
        'category', category,
        'description', description,
        'gtin', gtin,
        'gender', gender,
        'brand', brand,
        'folder', folder,
        'type', type,
        'supplier_external_id', supplier_external_id
    )
FROM core_products;
```

### **Fase 3: Atualização do Código (1 semana)**
- Atualizar queries para usar novas tabelas
- Implementar layer de abstração por tipo de negócio
- Manter views de compatibilidade temporárias

### **Fase 4: Validação e Limpeza (1 semana)**
- Testes completos de funcionalidade
- Remoção das tabelas `core_*` antigas
- Limpeza de código e documentação

## 💡 **Benefícios da Padronização**

### **1. Arquitetura Consistente**
- ✅ Um único padrão: `tenant_*` + `organization_id`
- ✅ RLS uniforme em todas as tabelas
- ✅ Padrão previsível para novos desenvolvedores

### **2. Escalabilidade Infinita**
- ✅ Novos clientes = INSERT em `organizations`
- ✅ Novos tipos de negócio = configuração JSONB
- ✅ Sem necessidade de novas tabelas específicas

### **3. Flexibilidade Total**
- ✅ Campos JSONB para qualquer customização
- ✅ Relacionamentos genéricos para qualquer modelo de negócio
- ✅ Transações flexíveis para qualquer workflow

### **4. Manutenção Simplificada**
- ✅ Uma migração aplica a todos os tenants
- ✅ Uma funcionalidade beneficia todos os clientes
- ✅ Deploy e manutenção unificados

## 🔧 **Implementação Técnica**

### **Layer de Abstração por Domínio:**
```typescript
// Para diferentes tipos de negócio
interface BusinessEntityService {
  async getProducts(orgId: string): Promise<Product[]>
  async getSuppliers(orgId: string): Promise<Supplier[]>
  async getLocations(orgId: string): Promise<Location[]>
}

class FashionRetailService implements BusinessEntityService {
  // Implementação específica para moda/varejo
}

class GeneralBusinessService implements BusinessEntityService {
  // Implementação genérica
}
```

### **Configuração Dinâmica:**
```typescript
// Baseado em organizations.implementation_config
const getBusinessService = (orgConfig: any): BusinessEntityService => {
  switch (orgConfig.business_domain) {
    case 'fashion_retail': return new FashionRetailService()
    default: return new GeneralBusinessService()
  }
}
```

## 📊 **Recursos Necessários**

- **1 Backend Developer** (full-time, 5 semanas)
- **1 Database Specialist** (part-time, 3 semanas)  
- **1 QA Engineer** (full-time, últimas 2 semanas)
- **Total:** 5 semanas de desenvolvimento

## 🎯 **Resultado Final**

### **Antes (Inconsistente):**
```
core_products (só Banban)
core_suppliers (só Banban)
tenant_performance_metrics (genérico ✅)
tenant_insights_cache (genérico ✅)
```

### **Depois (Consistente):**
```
tenant_business_entities (genérico ✅)
tenant_business_relationships (genérico ✅)
tenant_business_transactions (genérico ✅)
tenant_performance_metrics (genérico ✅)
tenant_insights_cache (genérico ✅)
```

### **Vantagem Competitiva:**
- 🚀 **Onboarding de novos clientes em horas, não semanas**
- 🎯 **Suporte a qualquer tipo de negócio sem desenvolvimento extra**
- ⚡ **Deployments unificados para todos os clientes**
- 🔧 **Manutenção centralizada e eficiente**

## 🎯 **Próximos Passos Imediatos**

### **Arquivos Prontos para Execução:**

1. **📄 `scripts/migration/phase1-create-generic-tables.sql`**
   - Cria as 3 tabelas genéricas com RLS, índices e configurações
   - Views de compatibilidade temporárias
   - Função de configuração por domínio de negócio
   - **Tempo:** 30 minutos de execução

2. **📄 `scripts/migration/phase2-migrate-data.sql`**  
   - Migra todos os dados das tabelas `core_*` para as genéricas
   - Validação pré e pós-migração
   - Relatório detalhado de migração
   - **Tempo:** 2-3 horas de execução

3. **📄 `scripts/analysis/analyze-tenant-specific-tables.sql`**
   - Análise completa do volume de dados atual
   - Identificação de dependências
   - Estimativa de complexidade

### **Comandos de Execução:**
```bash
# Fase 1: Criar tabelas genéricas
psql -h localhost -U postgres -d banban -f scripts/migration/phase1-create-generic-tables.sql

# Fase 2: Migrar dados
psql -h localhost -U postgres -d banban -f scripts/migration/phase2-migrate-data.sql

# Validação final
psql -h localhost -U postgres -d banban -f scripts/analysis/analyze-tenant-specific-tables.sql
```

### **Aprovação Necessária:**
- [ ] **Aprovação técnica** da arquitetura proposta
- [ ] **Backup completo** do banco antes da migração
- [ ] **Ambiente de staging** preparado para testes
- [ ] **Cronograma** de implementação aprovado (5 semanas)

---

**✅ Esta proposta resolve definitivamente a inconsistência arquitetural e posiciona o sistema para escalabilidade infinita, mantendo toda a funcionalidade específica do Banban através de configuração inteligente.**

**🚀 Pronto para implementação imediata com scripts validados e documentação completa.** 