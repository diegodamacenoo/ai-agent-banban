# Documentação Completa: Wizard de Criação de Novo Módulo

## Visão Geral

O Wizard de Criação de Novo Módulo é um sistema multi-etapas que guia o usuário através do processo completo de criação de módulos na plataforma. O wizard é composto por 6 steps principais, com fluxos condicionais baseados no tipo de módulo e configurações selecionadas.

## Arquitetura do Wizard

### Componentes Principais

- **ModuleCreationWizard.tsx**: Interface principal do wizard com navegação
- **ModuleWizardContext.tsx**: Context para compartilhar estado entre componentes
- **useModuleWizard.ts**: Hook principal com toda a lógica de estado e navegação
- **Types (index.ts)**: Definições TypeScript completas
- **Steps individuais**: Cada etapa como componente separado

### Fluxo de Navegação

```
1. module-type → 2. basic-config → 3. review-create → 4. implementation-config* → 5. client-config* → 6. checklist

* Steps condicionais baseados nas configurações
```

## Steps Detalhados

### Step 1: Module Type (Seleção do Tipo de Módulo)

**Arquivo**: `ModuleTypeStep.tsx`

#### Campos:

**`type` (obrigatório)**
- **Tipo**: `'standard' | 'custom'`
- **Título**: "Escolha o Tipo de Módulo"
- **Descrição**: Seleção entre módulo padrão ou personalizado
- **Opções**:
  - `standard`: Módulo Padrão - genérico para todos os clientes
  - `custom`: Módulo Personalizado - específico para um cliente

#### Condicionais:

- Se `type === 'standard'`: limpa configurações de cliente
- Se `type === 'custom'`: habilita configurações específicas de cliente nos próximos steps

#### Características por Tipo:

**Standard:**
- Funcionalidade genérica
- Configuração simplificada
- Compatível com todos os clientes
- Desenvolvimento mais rápido
- Manutenção facilitada

**Custom:**
- Personalizações específicas do cliente
- Branding customizado
- Integrações específicas
- Fluxos de trabalho únicos
- Funcionalidades exclusivas

---

### Step 2: Basic Config (Configuração Básica)

**Arquivo**: `BasicConfigStep.tsx`

#### Campos Obrigatórios:

**`name` (obrigatório)**
- **Tipo**: `string`
- **Título**: "Nome do Módulo"
- **Validação**: 
  - Mínimo 2 caracteres
  - Máximo 100 caracteres
  - Permite letras, números, espaços e caracteres especiais comuns
  - Regex: `/^[a-zA-ZÀ-ÿ0-9\s\-_&().,!]+$/`
- **Exemplo**: "Performance Analytics"

**`slug` (auto-gerado, somente leitura)**
- **Tipo**: `string`
- **Título**: "Identificador (Slug)"
- **Geração**: Automática baseada no `name`
- **Função**: Identificador técnico único usado internamente
- **Regras**: Apenas letras minúsculas, números e hífen
- **Não pode ser alterado após criação**
- **Exemplo**: "performance-analytics"

**`description` (obrigatório)**
- **Tipo**: `string`
- **Título**: "Descrição"
- **Campo**: Textarea com 3 rows
- **Placeholder**: "Descreva o que este módulo faz..."

**`category` (obrigatório)**
- **Tipo**: `string`
- **Título**: "Categoria"
- **Campo**: Select
- **Opções**: 
  - `analytics`
  - `intelligence`
  - `monitoring`
  - `operations`
  - `reporting`
  - `automation`
  - `integration`
  - `security`

#### Campos Opcionais:

**`version`**
- **Tipo**: `string`
- **Título**: "Versão"
- **Padrão**: "1.0.0"
- **Placeholder**: "1.0.0"

**`icon`**
- **Tipo**: `string`
- **Título**: "Ícone"
- **Campo**: Select com preview visual
- **Padrão**: "Package"
- **Opções**: Package, BarChart3, Activity, Settings, Bell, Users, Shield, Zap, Database, Globe

**`route_pattern` (avançado)**
- **Tipo**: `string`
- **Título**: "Padrão de Rota (Opcional)"
- **Descrição**: Define como o módulo aparece na URL e estrutura de arquivos
- **Comportamento Automático**:
  - Se vazio: definido automaticamente baseado no cliente
  - Módulos Custom: usa nome do cliente (ex: "banban", "pco")
  - Módulos Standard: usa "standard"
- **Exemplo**: "performance" → URL: `/banban-fashion/performance`

#### Campos Avançados (Collapsible):

**`supports_multi_tenant`**
- **Tipo**: `boolean`
- **Título**: "Multi-tenant"
- **Padrão**: `true`
- **Descrição**: Suporta múltiplos tenants
- **Campo**: Switch

**`exclusive_tenant_id` (condicional)**
- **Tipo**: `string | null`
- **Título**: "Tenant Exclusivo"
- **Visível**: Apenas quando `supports_multi_tenant === false`
- **Campo**: Select com organizações do banco
- **Obrigatório**: Quando single-tenant

**`auto_create_standard`**
- **Tipo**: `boolean`
- **Título**: "Implementação Standard"
- **Padrão**: `true`
- **Descrição**: Criar automaticamente implementação padrão
- **Campo**: Switch

#### Auto-Generated Fields:

Baseados no `name`, gerados automaticamente:

**`auto_generated.slug`**
- Baseado no nome, convertido para kebab-case

**`auto_generated.implementation_key`**
- Formato: `${slug}-impl`
- Exemplo: "performance-analytics-impl"

**`auto_generated.component_path`**
- Formato: `${slug}Implementation`
- Exemplo: "performanceAnalyticsImplementation"

#### Condicionais:

- **Multi-tenant toggle**: Se desabilitado, exibe campo de tenant exclusivo
- **Preview da estrutura**: Atualiza em tempo real baseado nas configurações
- **Route pattern**: Calcula automaticamente baseado no tipo e organização

---

### Step 3: Review Create (Revisão e Criação)

**Arquivo**: `ReviewCreateStep.tsx`

#### Função:

Este step não possui campos de entrada, apenas exibe um resumo das configurações e executa a criação do módulo base.

#### Informações Exibidas:

**Informações Básicas:**
- Nome do módulo
- Slug técnico
- Categoria (badge)
- Tipo (badge: Personalizado/Padrão)

**Configurações:**
- Multi-tenant (Sim/Exclusivo)
- Cliente (se custom)
- Tenant ID (se single-tenant)

**Descrição:**
- Texto completo da descrição em card destacado

#### Ações Executadas:

**Criação do Base Module:**
- Chama `createBaseModule()` com todas as configurações
- Registra o módulo no catálogo (`base_modules` table)
- Salva o ID do módulo criado no contexto

**Implementação Automática (condicional):**
- Se `auto_create_standard === true`: cria implementação padrão automaticamente
- Chama `createModuleImplementation()` 
- Pula direto para o checklist (step 6) se bem-sucedido

#### Condicionais:

- **Auto-create ON**: Cria módulo + implementação, vai direto para checklist
- **Auto-create OFF**: Cria apenas módulo base, vai para implementation-config (step 4)

---

### Step 4: Implementation Config (Configuração da Implementação)

**Arquivo**: `ImplementationConfigStep.tsx`

#### Visibilidade:

Este step é **PULADO** se:
- `auto_create_standard === true` (implementação já foi criada automaticamente)

#### Campos:

**`name` (obrigatório)**
- **Tipo**: `string`
- **Título**: "Nome da Implementação"
- **Padrão**: `${moduleName} - Implementação`
- **Placeholder**: "Ex: Performance Analytics - Implementação Banban"

**`description` (obrigatório)**
- **Tipo**: `string`
- **Título**: "Descrição"
- **Campo**: Textarea
- **Padrão**: `Implementação específica do módulo ${moduleName}`

**`implementation_key` (auto-gerado com opção de personalização)**
- **Tipo**: `string`
- **Título**: "Chave da Implementação"
- **Auto-gerado**: Baseado no `auto_generated.implementation_key`
- **Campo**: Input desabilitado + botão "Personalizar"
- **Personalização**: Clique em "Personalizar" habilita edição manual

**`version` (herdado com opção de personalização)**
- **Tipo**: `string`
- **Título**: "Versão da Implementação"
- **Herdado**: Do módulo base (`config.basic.version`)
- **Campo**: Input desabilitado + botão "Personalizar"
- **Padrão**: Usa versão do módulo base

**`component_path` (auto-gerado com opção de personalização)**
- **Tipo**: `string`
- **Título**: "Componente da Implementação"
- **Auto-gerado**: Baseado no `auto_generated.component_path`
- **Campo**: Input desabilitado + botão "Personalizar"
- **Função**: Define como localizar o componente React

**`audience`**
- **Tipo**: `'generic' | 'client-specific' | 'enterprise'`
- **Título**: "Público-Alvo"
- **Campo**: Select
- **Padrão**: "generic"

**`complexity`**
- **Tipo**: `'basic' | 'standard' | 'advanced' | 'enterprise'`
- **Título**: "Disponibilidade" (plano de assinatura)
- **Campo**: Select
- **Padrão**: "standard"

**`priority`**
- **Tipo**: `'low' | 'medium' | 'high' | 'critical'`
- **Título**: "Prioridade"
- **Campo**: Select
- **Padrão**: "medium"

**`status`**
- **Tipo**: `'active' | 'inactive'`
- **Título**: "Status"
- **Campo**: Select com AutoConfigSwitch
- **Padrão**: Baseado no `defaultLifecycle` do sistema

**`template_type`**
- **Tipo**: `'dashboard' | 'table' | 'chart' | 'form' | 'custom'`
- **Título**: "Tipo de Template"
- **Campo**: Select
- **Padrão**: "dashboard"

**`is_default`**
- **Tipo**: `boolean`
- **Título**: "Implementação Padrão"
- **Campo**: Checkbox
- **Padrão**: `true`
- **Descrição**: "Marque se esta deve ser a implementação padrão para o módulo base"

#### Recursos Especiais:

**AutoConfigSwitch:**
- Permite alternar entre valor automático (do sistema) e manual
- Usado para `status` e `version`

**Sistema de Validação:**
- Usa `react-hook-form` com `zod` schemas
- Validação em tempo real com mensagens de erro

#### Condicionais:

- **Implementação já existente**: Mostra notificação de que foi criada automaticamente
- **Personalização de campos**: Botões "Auto/Personalizar" habilitam/desabilitam edição

---

### Step 5: Client Config (Configuração de Cliente)

**Arquivo**: `ClientConfigStep.tsx`

#### Função:

Este step gerencia a atribuição do módulo a uma organização específica e cria a associação no sistema tenant-módulo.

#### Campos:

**`selectedOrgId` (obrigatório)**
- **Tipo**: `string`
- **Título**: "Organização Target"
- **Campo**: Select carregado dinamicamente do banco
- **Fonte**: `getAllOrganizations()` action
- **Cache**: Usa sessionStorage por 5 minutos
- **Display**: Nome comercial + slug + tipo de cliente

#### Informações da Organização Selecionada:

**Display Card:**
- Nome comercial/legal da organização
- Slug da organização
- Tipo: Cliente Personalizado/Padrão

#### Opções de Atribuição:

**`createAssignment`**
- **Tipo**: `boolean`
- **Título**: "Criar Atribuição Automática (Recomendado)"
- **Padrão**: `true`
- **Campo**: Checkbox
- **Descrição**: Cria atribuição inativa para desenvolvimento

#### Ações Executadas:

**Se `createAssignment === true`:**
- Chama `createSimpleTenantModuleAssignment()`
- Cria atribuição com status "INATIVO" 
- Configura como `development_mode: true`
- Permite desenvolvimento/teste antes da ativação

**Dados da Atribuição:**
```javascript
customConfig: {
  development_mode: true,
  auto_created_by_wizard: true,
  created_at: new Date().toISOString(),
  wizard_created: true,
  initial_status: 'inactive'
}
```

#### Estados:

- **Loading**: Carregando organizações
- **Creating**: Criando atribuição
- **Error**: Exibe erros de criação
- **Success**: Confirma criação e vai para próximo step

#### Condicionais:

- **Organização selecionada**: Habilita opções de atribuição
- **Criar atribuição**: Executa criação automática
- **Pular**: Permite prosseguir sem criar atribuição

---

### Step 6: Checklist (Lista de Implementação)

**Arquivo**: `ChecklistStep.tsx`

#### Função:

Step final que não possui campos de entrada. Exibe um guia completo de implementação do módulo com checklist interativo.

#### Recursos:

**Checklist Interativo:**
- 15 tarefas estruturadas de implementação
- Sistema de tracking de progresso com localStorage
- Ações contextuais (abrir pasta, arquivo, links)
- Exportação de relatórios (JSON/Markdown)

**Progresso Visual:**
- Barra de progresso geral
- Contadores de tarefas completadas
- Estimativa de tempo de conclusão
- Badge de status por tarefa

**Instruções Detalhadas:**
- Acordeão com instruções passo-a-passo
- Blocos de código copiáveis
- Exemplos específicos baseados na configuração
- Comandos terminal prontos

#### Tarefas Geradas:

1. **Criar estrutura unificada** (Core + Frontend)
2. **Implementar ModuleInterface**
3. **Verificar registros criados pelo wizard**
4. **Criar módulo backend (Fastify)**
5. **Criar tipos TypeScript do Core**
6. **Planejar schema da tabela**
7. **Criar migração SQL**
8. **Configurar RLS policies**
9. **Criar Server Actions CRUD**
10. **Criar arquivo principal page.tsx**
11. **Criar implementações específicas**
12. **Criar hook personalizado**
13. **Atribuir módulo ao tenant**
14. **Executar testes locais**
15. **Build e deploy**

#### Personalização Baseada na Configuração:

**Route Pattern:**
- Usa `route_pattern` se definido
- Fallback para lógica automática baseada no tipo
- Estrutura unificada: `src/core/modules/${moduleDirectory}/`

**Cliente Específico:**
- Nome do cliente baseado na organização selecionada
- Caminhos específicos para implementações
- URLs de exemplo personalizadas

**Tipo de Módulo:**
- Instruções diferentes para standard vs custom
- Configurações RLS específicas
- Template de código ajustado

---

## Validações por Step

### Validação Geral:

Cada step possui validação específica implementada no `useModuleWizard.ts`:

#### Step 1 (module-type):
- **Válido**: `config.type` está definido
- **Inválido**: Nenhum tipo selecionado

#### Step 2 (basic-config):
- **Válido**: `name`, `description` e `category` preenchidos e válidos
- **Inválido**: 
  - Campos obrigatórios vazios
  - `name` menor que 2 caracteres
  - `name` com caracteres inválidos

#### Step 3 (review-create):
- **Válido**: Todos os steps anteriores obrigatórios são válidos
- **Inválido**: Algum step obrigatório anterior inválido

#### Step 4 (implementation-config):
- **Válido**: 
  - Base module foi criado (`created_base_module_id` existe) OU
  - Implementação já existe (`auto_created_implementation` existe)
- **Inválido**: Nenhuma das condições acima

#### Step 5 (client-config):
- **Válido**: Implementação existe (manual ou automática)
- **Inválido**: Nenhuma implementação encontrada

#### Step 6 (checklist):
- **Sempre válido**: Apenas visualização/guia

## Fluxo Condicional

### Baseado no `auto_create_standard`:

**Se `auto_create_standard === true`:**
```
module-type → basic-config → review-create → [PULA implementation-config] → client-config → checklist
```

**Se `auto_create_standard === false`:**
```
module-type → basic-config → review-create → implementation-config → client-config → checklist
```

### Baseado no tipo de módulo:

**Standard vs Custom:**
- Ambos seguem o mesmo fluxo
- Diferenças estão nas configurações e validações internas
- Custom pode ter configurações específicas de cliente

## Estado Global (WizardState)

### Estrutura Principal:

```typescript
interface WizardState {
  currentStep: WizardStep;
  steps: WizardStepDefinition[];
  config: Partial<ModuleCreationConfig>;
  validation: Record<WizardStep, StepValidationStatus>;
  visitedSteps: Set<WizardStep>;
  progress: {
    currentStepIndex: number;
    totalSteps: number;
    percentage: number;
  };
  canProceed: boolean;
  canGoBack: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
}
```

### Configuração do Módulo:

```typescript
interface ModuleCreationConfig {
  type: ModuleType; // 'standard' | 'custom'
  basic: BasicModuleConfig;
  client?: ClientSpecificConfig;
  advanced: AdvancedModuleOptions;
  auto_generated?: AutoGeneratedFields;
  flow_config?: {
    skip_implementation_config?: boolean;
    skip_client_config?: boolean;
  };
  metadata: {
    createdAt: Date;
    createdBy: string;
    estimatedTime: number;
    complexity: 'simple' | 'medium' | 'complex';
  };
}
```

## Persistência

### Estado Atual:
- **localStorage**: Desabilitado intencionalmente
- **SessionStorage**: Usado apenas para cache de organizações (5 min)
- **Reset automático**: Estado limpo a cada nova sessão

### Dados Salvos Durante o Processo:
- Base module criado em `base_modules` table
- Implementation criada em `module_implementations` table  
- Assignment criada em `tenant_module_assignments` table
- Progress do checklist em localStorage (por módulo)

## Navegação

### Controles:
- **Próximo**: Habilitado apenas se step atual válido
- **Anterior**: Sempre habilitado (exceto primeiro step)
- **Reset**: Limpa todo estado e volta ao início
- **Navegação direta**: Click nos indicadores de step (se válido)

### Indicadores Visuais:
- **Atual**: Border azul + ícone de número
- **Completo**: Background verde + ícone de check
- **Erro**: Background vermelho + ícone de alerta
- **Warning**: Background amarelo + ícone de alerta
- **Pendente**: Background cinza + número

## Integração com Sistema

### Server Actions Utilizadas:
- `createBaseModule()` - Cria módulo no catálogo
- `createModuleImplementation()` - Cria implementação específica
- `getAllOrganizations()` - Lista organizações para seleção
- `createSimpleTenantModuleAssignment()` - Atribui módulo ao tenant

### Dados Gerados:
- **base_modules**: Entrada no catálogo de módulos
- **module_implementations**: Implementação(ões) específica(s)
- **tenant_module_assignments**: Atribuição tenant-módulo (inativa)

### Sistema de Resolução:
- **DynamicModulePage**: Resolve implementações automaticamente
- **ModuleRegistry**: Registra módulos dinamicamente
- **Component resolution**: Por `component_path` no database

## Conclusão

O wizard proporciona uma experiência guiada completa para criação de módulos, desde a concepção até a implementação, com validações robustas, fluxos condicionais inteligentes e um sistema de checklist interativo que orienta o desenvolvedor através de todas as etapas técnicas necessárias.