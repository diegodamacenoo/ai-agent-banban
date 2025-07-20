# 📋 Plano: Integração Client-Modules com Painel Admin

## 🎯 Visão Geral

Criar um sistema completo de gestão de módulos no painel admin que permita:
1. **Descobrir** módulos disponíveis no código
2. **Configurar** quais módulos cada organização usa
3. **Gerenciar** configurações específicas por cliente
4. **Monitorar** status e performance dos módulos

## 🏗️ Arquitetura do Sistema

### Fluxo Principal
```
1. Admin cria organização → 2. Seleciona módulos → 3. Configura módulos → 4. Ativa implementação
```

### Cenários de Uso

#### Cenário A: Módulos Já Implementados
- Sistema descobre módulos automaticamente
- Admin seleciona da lista disponível
- Configuração baseada em templates

#### Cenário B: Nenhum Módulo Implementado (Caso Inicial)
- Admin cria organização "vazia"
- Sistema permite configuração manual de módulos esperados
- Módulos ficam em estado "pendente" até implementação
- Desenvolvedor implementa módulos baseado na configuração

### Componentes Necessários

#### 1. **Module Discovery System**
- Escaneamento automático de `src/core/modules/`
- Registro dinâmico de módulos disponíveis
- Suporte a módulos "planejados" (não implementados)
- Validação de configurações

#### 2. **Admin Interface**
- Página de gestão de módulos
- Interface de configuração por organização
- Suporte a módulos pendentes
- Monitoramento de status

#### 3. **Database Schema**
- Tabela `organization_modules` (relacionamento)
- Campos adicionais em `organizations`
- Estados: `planned`, `implemented`, `active`, `inactive`
- Auditoria de mudanças

#### 4. **API Layer**
- Actions para gestão de módulos
- Endpoints de descoberta
- Validação de configurações
- Templates de módulos

## 📊 Estrutura de Dados

### Tabela `organization_modules`
```sql
CREATE TABLE organization_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  module_id TEXT NOT NULL,
  module_name TEXT NOT NULL,
  module_type TEXT NOT NULL, -- 'standard' | 'custom'
  status TEXT NOT NULL DEFAULT 'planned', -- 'planned' | 'implemented' | 'active' | 'inactive'
  configuration JSONB DEFAULT '{}',
  expected_features TEXT[] DEFAULT '{}',
  implementation_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  implemented_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ
);
```

### Campo `module_strategy` em organizations
```sql
ALTER TABLE organizations ADD COLUMN module_strategy JSONB DEFAULT '{
  "approach": "planned", -- "discovered" | "planned"
  "expected_modules": [],
  "implementation_priority": "high"
}';
```

## 🔧 Implementação Detalhada

### Fase 1: Module Discovery System

#### 1.1 Service de Descoberta
```typescript
// src/core/services/module-discovery.ts
class ModuleDiscoveryService {
  async scanAvailableModules(): Promise<ModuleInfo[]>
  async getPlannedModules(): Promise<PlannedModule[]>
  async validateModuleConfig(moduleId: string): Promise<ValidationResult>
  async getModuleMetadata(moduleId: string): Promise<ModuleMetadata>
  async createModuleTemplate(moduleId: string): Promise<ModuleTemplate>
}
```

#### 1.2 Types e Interfaces
```typescript
interface ModuleInfo {
  id: string;
  name: string;
  type: 'standard' | 'custom';
  version: string;
  description: string;
  status: 'implemented' | 'planned';
  requiredConfig: ConfigSchema;
  dependencies: string[];
  isAvailable: boolean;
  templatePath?: string;
}

interface PlannedModule {
  id: string;
  name: string;
  type: 'standard' | 'custom';
  expectedFeatures: string[];
  configurationTemplate: object;
  implementationNotes: string;
  priority: 'high' | 'medium' | 'low';
}
```

### Fase 2: Admin Interface

#### 2.1 Estrutura de Páginas
```
/admin/modules/
├── page.tsx                 # Lista todos os módulos
├── planned/
│   └── page.tsx            # Módulos planejados
├── [id]/
│   ├── page.tsx            # Detalhes do módulo
│   └── configure/
│       └── page.tsx        # Configuração do módulo
└── organization/
    └── [orgId]/
        ├── page.tsx        # Módulos da organização
        └── plan/
            └── page.tsx    # Planejar módulos
```

#### 2.2 Componentes
- `ModuleCard` - Card de módulo com status
- `PlannedModuleCard` - Card para módulos planejados
- `ModuleConfigForm` - Formulário de configuração
- `ModulePlanningForm` - Formulário de planejamento
- `OrganizationModules` - Lista de módulos da org
- `ModuleStatusIndicator` - Indicador de status (planned/implemented/active)

### Fase 3: Database Integration

#### 3.1 Migrations
```sql
-- 20240401000000_create_organization_modules.sql
CREATE TABLE organization_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  module_name TEXT NOT NULL,
  module_type TEXT NOT NULL CHECK (module_type IN ('standard', 'custom')),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'implemented', 'active', 'inactive')),
  configuration JSONB DEFAULT '{}',
  expected_features TEXT[] DEFAULT '{}',
  implementation_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  implemented_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  
  UNIQUE(organization_id, module_id)
);

-- Índices para performance
CREATE INDEX idx_organization_modules_org_id ON organization_modules(organization_id);
CREATE INDEX idx_organization_modules_status ON organization_modules(status);
CREATE INDEX idx_organization_modules_type ON organization_modules(module_type);

-- RLS Policies
ALTER TABLE organization_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organization_modules_isolation" ON organization_modules
  FOR ALL USING (
    organization_id = get_user_organization_id() OR is_master_admin()
  );

-- Adicionar campo em organizations
ALTER TABLE organizations ADD COLUMN module_strategy JSONB DEFAULT '{
  "approach": "planned",
  "expected_modules": [],
  "implementation_priority": "high"
}';
```

#### 3.2 Server Actions
```typescript
// src/app/actions/admin/modules.ts
export async function getAvailableModules()
export async function getPlannedModules()
export async function getOrganizationModules(orgId: string)
export async function planOrganizationModule(config: PlannedModuleConfig)
export async function configureOrganizationModule(config: ModuleConfig)
export async function activateModule(orgId: string, moduleId: string)
export async function deactivateModule(orgId: string, moduleId: string)
export async function markModuleAsImplemented(orgId: string, moduleId: string)
```

### Fase 4: API Integration

#### 4.1 Endpoints
```
GET  /api/admin/modules                         # Lista módulos (implementados + planejados)
GET  /api/admin/modules/planned                 # Apenas módulos planejados
GET  /api/admin/modules/[id]                    # Detalhes do módulo
POST /api/admin/modules/scan                    # Rescanear módulos implementados
GET  /api/admin/organizations/[id]/modules      # Módulos da org
POST /api/admin/organizations/[id]/modules/plan # Planejar módulo
POST /api/admin/organizations/[id]/modules      # Configurar módulo
PUT  /api/admin/modules/[id]/implement          # Marcar como implementado
```

## 🎨 Interface do Usuário

### Dashboard de Módulos
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Gestão de Módulos                                        │
├─────────────────────────────────────────────────────────────┤
│ 🔍 Total: 15   ✅ Implementados: 8   📋 Planejados: 7       │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │
│ │ 📦 Inventory│ │ 📊 Analytics│ │ 🔔 Alerts   │             │
│ │ Standard    │ │ Standard    │ │ Standard    │             │
│ │ ✅ Ativo    │ │ ✅ Ativo    │ │ 📋 Planejado│             │
│ └─────────────┘ └─────────────┘ └─────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### Criação de Organização - Cenário Sem Módulos
```
┌─────────────────────────────────────────────────────────────┐
│ 🏢 Nova Organização - Etapa 3: Módulos                     │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ Nenhum módulo implementado ainda                         │
│                                                             │
│ 📋 Planejar Módulos Necessários:                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ➕ Adicionar Módulo Planejado                           │ │
│ │                                                         │ │
│ │ Nome: [Gestão de Estoque_____________]                  │ │
│ │ Tipo: [Custom ▼]                                       │ │
│ │ Features: [controle-estoque, alertas, relatórios]      │ │
│ │ Prioridade: [Alta ▼]                                   │ │
│ │ Notas: [Sistema específico para moda]                  │ │
│ │                                                         │ │
│ │ [Cancelar] [Adicionar Módulo]                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 📋 Módulos Planejados:                                     │
│ • Gestão de Estoque (Custom) - Alta prioridade             │
│ • Sistema de Vendas (Custom) - Alta prioridade             │
│                                                             │
│ [← Voltar] [Finalizar Organização →]                       │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Fluxos de Trabalho Atualizados

### Cenário 1: Criar Organização SEM Módulos Implementados
1. Admin acessa `/admin/organizations`
2. Clica em "Nova Organização"
3. Preenche dados básicos
4. **Etapa Módulos**: Sistema detecta que não há módulos implementados
5. Admin planeja módulos necessários (nome, tipo, features esperadas)
6. Sistema salva organização com módulos em estado "planned"
7. Desenvolvedor vê lista de módulos planejados
8. Implementa módulos baseado no planejamento
9. Admin marca módulos como "implementados" quando prontos

### Cenário 2: Criar Organização COM Módulos Implementados
1. Admin acessa `/admin/organizations`
2. Clica em "Nova Organização"
3. Preenche dados básicos
4. **Etapa Módulos**: Sistema mostra módulos disponíveis
5. Admin seleciona módulos da lista
6. Configura cada módulo selecionado
7. Salva organização com módulos ativos

### Cenário 3: Desenvolver Módulo Planejado
1. Desenvolvedor acessa `/admin/modules/planned`
2. Vê lista de módulos planejados por organizações
3. Seleciona módulo para implementar
4. Vê especificações e configurações esperadas
5. Implementa módulo em `src/core/modules/`
6. Testa implementação
7. Marca módulo como "implementado"
8. Admin pode ativar módulo para a organização

## 📋 Tarefas de Implementação

### Sprint 1: Foundation (Semana 1)
- [ ] Criar migrations de banco de dados
- [ ] Implementar service de descoberta de módulos
- [ ] Suporte a módulos planejados
- [ ] Criar types e interfaces
- [ ] Testes de descoberta

### Sprint 2: Admin Interface (Semana 2)
- [ ] Página de gestão de módulos
- [ ] Interface para módulos planejados
- [ ] Componentes de UI (cards, forms)
- [ ] Integração com discovery service
- [ ] Testes de interface

### Sprint 3: Organization Integration (Semana 3)
- [ ] Etapa de módulos na criação de organização
- [ ] Formulários de planejamento
- [ ] Aba de módulos na página de organização
- [ ] Server actions para gestão
- [ ] Validação de configurações

### Sprint 4: Developer Experience (Semana 4)
- [ ] Dashboard de módulos planejados
- [ ] Templates de implementação
- [ ] Documentação para desenvolvedores
- [ ] Sistema de notificações
- [ ] Logs e auditoria

## 🎯 Estados dos Módulos

### Diagrama de Estados
```
📋 Planned → 🔧 Implemented → ✅ Active
    ↓              ↓              ↓
    ❌ Cancelled   ⚠️ Inactive    ⏸️ Paused
```

### Descrição dos Estados
- **Planned**: Módulo planejado mas não implementado
- **Implemented**: Código implementado mas não ativo
- **Active**: Módulo ativo e funcionando
- **Inactive**: Módulo implementado mas desativado
- **Cancelled**: Planejamento cancelado
- **Paused**: Módulo pausado temporariamente

## 🚀 Benefícios da Abordagem

### Para Admins
- **Planejamento**: Pode planejar módulos antes da implementação
- **Visibilidade**: Vê progresso de implementação
- **Flexibilidade**: Adapta estratégia conforme necessário
- **Controle**: Ativa módulos quando prontos

### Para Desenvolvedores
- **Clareza**: Especificações claras do que implementar
- **Priorização**: Sabe quais módulos são mais urgentes
- **Templates**: Estrutura base para implementação
- **Feedback**: Vê como módulos são usados

### Para o Sistema
- **Escalabilidade**: Cresce conforme demanda
- **Rastreabilidade**: Histórico completo de módulos
- **Flexibilidade**: Suporta diferentes cenários
- **Manutenibilidade**: Gestão centralizada

## 📝 Próximos Passos

1. **Implementar Sprint 1**: Foundation e banco de dados
2. **Testar cenários**: Com e sem módulos implementados
3. **Iterar interface**: Baseado em feedback
4. **Documentar processo**: Para desenvolvedores
5. **Monitorar uso**: Métricas de adoção

---

**Status**: 📋 Planejado  
**Prioridade**: 🔥 Alta  
**Estimativa**: 4 semanas  
**Responsável**: Equipe de desenvolvimento 