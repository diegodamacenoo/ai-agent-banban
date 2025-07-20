# Plano Detalhado de Interface: Gestão de Status Operacional por Tenant

## 📋 Objetivo
Criar interface administrativa completa para gestão de status operacional de módulos por tenant, seguindo os padrões estabelecidos no design system existente.

---

## 🎯 Escopo de Implementação

### **1. Interface de Aprovações - Visão Global**
**Rota**: `/admin/organizations` (novo card + sidebar widgets)
**Propósito**: Card de aprovações pendentes na listagem de organizações

### **2. Interface de Aprovações - Por Organização**
**Rota**: `/admin/organizations/[id]` (nova seção + sidebar widgets)
**Propósito**: Solicitações específicas de uma organização

### **3. Gestão de Módulos - Ciclo de Vida**
**Rota**: `/admin/modules/[id]` (melhorias + sidebar widgets)
**Propósito**: Gestão completa do módulo (maturidade, políticas, catálogo)

### **4. Integração Mínima com Páginas Existentes**
**Rotas**: Melhorias pontuais nas páginas administrativas existentes
**Propósito**: Preservar interface existente com adições complementares

---

## 📊 1. Interface de Aprovações - Visão Global (/admin/organizations)

### **1.1 Adições Complementares (Preservando Interface Existente)**

**Novo Card de Aprovações** (inserido entre estatísticas existentes e tabela):
```
┌─ Solicitações de Módulos ────────────────────────────────────┐
│ 🕐 8 Pendentes    ✅ 12 Hoje    ⏱️ 1.5h Médio             │
│                                                             │
│ Urgentes (> 24h):                                          │
│ • Banban Fashion: Analytics Dashboard                      │
│ • CA Store: Inventory Module                               │
│                                                             │
│ [Ver Todas] [Aprovar Urgentes] [Configurar Políticas]      │
└─────────────────────────────────────────────────────────────┘
```

**Nova Coluna na Tabela Existente** (preservando todas as colunas atuais):
- **Coluna "Pendências"** (adicionar após coluna existente "Tipo"):
  - Badge com número de solicitações pendentes (se > 0)
  - Exemplo: "3 pendentes" (badge amarelo)
  - Link para página da organização com foco nas solicitações

**Sidebar Widgets** (utilizando SidebarProvider):

**Widget 1**: Estatísticas de Aprovação
- Total de solicitações pendentes
- Tempo médio de aprovação
- Taxa de aprovação (últimos 30 dias)

**Widget 2**: Alertas de Urgência
- Lista de solicitações > 24h
- Solicitações de clientes enterprise
- Módulos críticos aguardando aprovação

**Widget 3**: Ações Rápidas
- "Aprovar Todas GA" (botão rápido)
- "Verificar Dependências" 
- "Relatório de Aprovações"

### **1.2 Modal de Aprovações Globais**
**Trigger**: Botão "Ver Todas" no card
**Layout**: Dialog fullscreen (max-w-6xl)
**Conteúdo**: Lista paginada de todas as solicitações pendentes
**Filtros**: Por organização, módulo, urgência
**Ações**: Aprovação/negação individual e em lote

---

## ✅ 2. Interface de Aprovações - Por Organização (/admin/organizations/[id])

### **2.1 Nova Seção de Solicitações (Preservando Interface Existente)**

**Posição**: Adicionar após a seção "Módulos" existente na página da organização

**Nova Seção**:
```
┌─ Solicitações de Módulos ────────────────────────────────────┐
│ 📊 3 Pendentes | 15 Aprovadas | 2 Negadas | 1 Cancelada     │
│                                                              │
│ 📋 [Pendentes] [Histórico] [Todas]                          │
│                                                              │
│ Lista de solicitações específicas desta organização         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Sidebar Widgets** (específicos para organização):

**Widget 1**: Status da Organização
- Módulos ativos vs disponíveis
- Taxa de adoção de módulos
- Tenant type e privilégios

**Widget 2**: Histórico de Atividade
- Últimas 5 solicitações
- Padrão de uso de módulos
- Tempo médio de aprovação para esta org

**Widget 3**: Ações Contextuais
- "Aprovar Todas Pendentes" (se aplicável)
- "Recomendar Módulos" (baseado no tenant_type)
- "Ver Módulos Disponíveis"

### **2.2 Tab Pendentes**
**Layout**: Cards focados no módulo (organização já é conhecida)

**Card de Solicitação**:
```
┌─ Analytics Dashboard (BETA) ─────────────────────────────────┐
│ 👤 João Silva       📅 há 3 horas      🏷️ [PENDING]        │
│ 💭 "Precisamos para análise de vendas Q4"                   │
│ 🏷️ Alta Prioridade   📦 Dependências: OK                   │
│ [Aprovar] [Negar] [Ver Módulo] [Detalhes]                  │
└─────────────────────────────────────────────────────────────┘
```

### **2.3 Tab Histórico**
**Layout**: Lista compacta dos últimos 90 dias

**Formato**:
```
✅ Analytics Dashboard    Aprovado por Admin     15/12/2024
❌ AI Insights           Negado: "Fora do plano" 10/12/2024
⏳ Inventory Module      Cancelado pelo usuário  08/12/2024
```

### **2.4 Integração com OrganizationModulesCard Existente**
**Melhorias Mínimas** (preservando estrutura atual):
- **Trocar badges simples** por `TenantOperationalStatusBadge`
- **Adicionar coluna "Health"** com ícone de status
- **Botão "Ver Solicitações"** no header do card (link para nova seção)

## ✅ 3. Gestão de Módulos - Ciclo de Vida (/admin/modules/[id])

### **3.1 Melhorias Complementares (Preservando Interface Existente)**

**Sidebar Widgets** (específicos para gestão do módulo):

**Widget 1**: Estatísticas do Módulo
- Total de organizações usando
- Distribuição por tenant_type
- Adoção por região/segmento

**Widget 2**: Status de Maturidade
- Status atual (ALPHA, BETA, GA, etc.)
- Próximos marcos no roadmap
- Ações de promoção disponíveis

**Widget 3**: Políticas de Disponibilidade
- Visibilidade: PUBLIC/INTERNAL/HIDDEN
- Aprovação: AUTO/MANUAL/DENY
- Auto-enable: NONE/NEW_TENANTS/ALL

**Widget 4**: Ações de Gestão
- "Promover para próxima fase"
- "Alterar políticas de acesso"
- "Configurar dependências"
- "Ver histórico de mudanças"

### **3.2 Adições na Interface Principal**

**Novo Card de Policies** (adicionar na página do módulo):
```
┌─ Políticas de Disponibilidade ──────────────────────────────┐
│ 👁️ Visibilidade: PUBLIC        🔐 Aprovação: AUTO_APPROVE  │
│ 🚀 Auto-enable: NEW_TENANTS    📋 Dependências: 2 módulos  │
│                                                             │
│ [Editar Políticas] [Ver Dependências] [Histórico]          │
└─────────────────────────────────────────────────────────────┘
```

**Nova Seção de Maturidade** (expandir informações existentes do módulo):
- Badge atual de maturidade (expandido)
- Timeline de evolução (PLANNED → ALPHA → BETA → GA)
- Critérios para próxima fase
- Botão "Promover" (se elegível)

### **3.3 Ações de Gestão do Módulo**

**Para Módulos ALPHA/BETA**:
- "Promover para BETA/RC/GA"
- "Alterar critérios de acesso"
- "Configurar teste A/B"

**Para Módulos GA**:
- "Alterar políticas globais"
- "Configurar auto-upgrade"
- "Deprecar módulo"

**Para Módulos DEPRECATED**:
- "Definir data de retirement"
- "Notificar organizações ativas"
- "Migração assistida"

### **3.4 Modal de Edição de Políticas**
**Trigger**: Botão "Editar Políticas" no card
**Layout**: Dialog com formulário estruturado

**Conteúdo**:
- Visibilidade (radio buttons)
- Política de aprovação (radio buttons)
- Auto-enable (radio buttons + condições)
- Dependências (multi-select)
- Notas internas (textarea)

## ✅ 4. Integrações Mínimas com Páginas Existentes

### **4.1 Página Principal de Módulos (/admin/modules)**
**Melhorias Complementares** (preservando tabela e layout existentes):

**Nova Coluna "Adoção"** (adicionar após coluna "Status"):
- Número de organizações ativas (formato: "45 orgs")
- Badge de tendência (crescendo/estável/decrescendo)
- Link para página do módulo específico

**Sidebar Widget**: Estatísticas Globais
- Total de módulos por maturidade
- Módulos mais adotados
- Problemas críticos pendentes

### **4.2 Melhorias no Header da Página da Organização**
**Adição de Indicadores** (sem alterar layout existente):

**Badge de Status Geral** (ao lado do nome da organização):
- "3 módulos ativos" (verde se tudo OK)
- "1 problema" (amarelo se há issues)
- "2 pendentes" (azul se há solicitações)

### **4.3 Modal de Aprovação Universal**
**Componente Reutilizável** para todas as interfaces:

**Conteúdo Padrão**:
```
┌─ Aprovar Solicitação: [Módulo] ─────────────────────────────┐
│                                                             │
│ 🏢 Organização: [Nome] ([Tenant Type])                     │
│ 📦 Módulo: [Nome] ([Maturidade])                           │
│ 👤 Solicitante: [Nome] ([Email])                           │
│ 📅 Solicitado em: [Data/Hora]                              │
│ 💭 Motivo: [Texto da solicitação]                          │
│                                                             │
│ 📝 Observações da Aprovação (opcional):                    │
│ [TextArea]                                                  │
│                                                             │
│ ⚙️ Opções:                                                  │
│ ☑️ Iniciar provisioning automaticamente                    │
│ ☑️ Notificar solicitante                                   │
│ ☐ Agendar para fora do horário comercial                   │
│                                                             │
│                              [Cancelar] [Negar] [Aprovar]  │
└─────────────────────────────────────────────────────────────┘
```

**Validações Automáticas**:
- Verificar dependências do módulo
- Validar tenant_type vs module policies
- Checar limites de billing (se aplicável)
- Alertar sobre conflitos potenciais

---

## 🔍 5. Resumo das Intervenções Mínimas

### **5.1 Filosofia de Preservação da Interface**
- **Manter 100%** da estrutura de layout existente
- **Adicionar apenas** componentes complementares
- **Não refatorar** componentes já funcionais
- **Usar sidebar** para widgets informativos

### **5.2 Intervenções por Página**

**📊 /admin/organizations**:
- ➕ **Novo card** "Solicitações de Módulos"
- ➕ **Nova coluna** "Pendências" na tabela
- ➕ **3 widgets** na sidebar (estatísticas, alertas, ações)

**🏢 /admin/organizations/[id]**:
- ➕ **Nova seção** "Solicitações de Módulos" (após módulos)
- ➕ **3 widgets** na sidebar (status, histórico, ações)
- 🔄 **Upgrade badges** no OrganizationModulesCard existente
- ➕ **Nova coluna "Health"** no card de módulos

**📦 /admin/modules/[id]**:
- ➕ **Novo card** "Políticas de Disponibilidade"
- ➕ **4 widgets** na sidebar (estatísticas, maturidade, políticas, ações)
- 🔄 **Expandir seção** de maturidade existente

**📋 /admin/modules**:
- ➕ **Nova coluna** "Adoção" na tabela
- ➕ **1 widget** na sidebar (estatísticas globais)

### **5.3 Componentes Novos Necessários**
- `ApprovalsCard` - Card de solicitações na página de orgs
- `ApprovalsModal` - Modal de visão completa de aprovações
- `OrganizationRequestsSection` - Seção de solicitações por org
- `ModulePoliciesCard` - Card de políticas na página do módulo
- `ApprovalModal` - Modal universal de aprovação/negação
- `SidebarStatsWidget` - Widget reutilizável para estatísticas
- `SidebarActionsWidget` - Widget reutilizável para ações

### **5.4 Componentes Atualizados Minimamente**
- `OrganizationModulesCard` - Trocar badges + adicionar coluna health
- `OrganizationsPage` - Inserir novo card + nova coluna
- `ModulesPage` - Adicionar coluna de adoção
- `ModulePage` - Adicionar card de políticas

---

## 🎨 7. Design System e Padrões Visuais

### **7.1 Cores e Estados**
**Status Operacional** (seguindo padrão existente):
- REQUESTED: outline (cinza)
- PENDING_APPROVAL: secondary (azul claro)
- PROVISIONING: secondary com loading spinner
- ENABLED: success (verde)
- UPGRADING: secondary com loading spinner
- UP_TO_DATE: success (verde intenso)
- SUSPENDED: warning (amarelo)
- DISABLED: outline (cinza)
- ARCHIVED: outline com opacity
- ERROR: destructive (vermelho)

**Health Status**:
- healthy: verde (Circle icon)
- warning: amarelo (AlertTriangle icon)
- critical: vermelho (X icon)
- unknown: cinza (Help icon)

### **7.2 Iconografia Consistente**
**Status Actions**:
- Aprovar: CheckCircle
- Negar: XCircle
- Suspender: Pause
- Reativar: Play
- Arquivar: Archive
- Retry: RotateCcw
- Ver Detalhes: Eye
- Configurar: Settings
- Ver Logs: FileText
- Histórico: History

**Interface Navigation**:
- Dashboard: BarChart3
- Aprovações: Clock
- Filtros: Filter
- Busca: Search
- Export: Download
- Refresh: RefreshCw

### **7.3 Responsividade**
**Breakpoints**:
- Mobile (< 768px): Layout em coluna única, tabelas com scroll
- Tablet (768px - 1024px): Layout adaptado, sidebar colapsível
- Desktop (> 1024px): Layout completo com sidebar fixa

**Adaptações Mobile**:
- Filtros em drawer/sheet
- Tabelas com scroll horizontal
- Ações em bottom sheet
- Cards em stack vertical

### **7.4 Estados de Loading**
**Página carregando**: Skeleton layout completo
**Tabela carregando**: Skeleton rows
**Ação processando**: Button loading state
**Auto-refresh**: Subtle loading indicator

### **7.5 Feedback e Notificações**
**Toast Messages**:
- Sucesso: "Status atualizado com sucesso"
- Erro: "Falha ao atualizar status: [razão]"
- Loading: "Processando solicitação..."

**Confirmações**:
- Ações destrutivas sempre com AlertDialog
- Textos claros sobre consequências
- Opção de desfazer quando aplicável

---

## 🔄 8. Fluxos de Interação

### **8.1 Fluxo de Aprovação Rápida (Novo)**
1. Admin acessa `/admin/organizations`
2. Vê card de aprovações pendentes com urgentes destacadas
3. Clica "Aprovar Urgentes" ou "Ver Todas"
4. Modal abre com lista filtrada
5. Clica "Aprovar" em solicitação específica
6. Modal de aprovação abre com contexto completo
7. Confirma aprovação com observações
8. Sistema inicia provisioning automaticamente
9. Toast confirma sucesso + notificação para solicitante

### **8.2 Fluxo de Investigação por Organização**
1. Admin acessa página específica da organização
2. Vê seção "Solicitações de Módulos" com pendências
3. Identifica solicitação problemática na tab "Pendentes"
4. Clica "Ver Módulo" para entender melhor o módulo
5. Volta e decide aprovar/negar com contexto completo
6. Histórico fica registrado na tab "Histórico"

### **8.3 Fluxo de Gestão por Módulo**
1. Admin acessa página do módulo específico
2. Vê tab "Status Operacional" com visão consolidada
3. Identifica padrões de problema (múltiplas orgs com erro)
4. Executa "Health Check Global" ou "Investigar Problemas"
5. Aplica correções em lote baseadas nos achados
6. Monitora melhorias via métricas do módulo

### **8.4 Fluxo de Ação em Lote no Dashboard**
1. Admin acessa dashboard principal `/admin/tenant-status`
2. Aplica filtros para isolar problema específico
3. Seleciona múltiplos itens com checkboxes
4. Barra de ação em lote aparece no bottom
5. Escolhe ação aplicável aos status selecionados
6. Modal confirma ação com validações automáticas
7. Execução em background com progress tracking
8. Dashboard atualiza em tempo real

---

## ⚡ 9. Performance e Otimização

### **9.1 Lazy Loading**
- Componentes de modal carregados apenas quando necessários
- Tabelas com paginação server-side
- Filtros com debounce para busca

### **9.2 Cache e Refresh**
- Cache de 30s para estatísticas
- Refresh automático a cada 2 minutos na página de aprovações
- Invalidação de cache após ações

### **9.3 Real-time Updates**
- WebSocket para updates de status críticos
- Polling suave para páginas de monitoramento
- Notificações push para administradores

---

## 🧪 10. Estados para Teste

### **10.1 Dados de Demonstração**
- 3 organizações com diferentes tenant_types
- 5 módulos em diferentes status operacionais
- 10 solicitações pendentes com variação de prioridade
- Histórico de mudanças dos últimos 30 dias

### **10.2 Cenários de Teste**
**Cenário 1**: Aprovação em massa de módulos GA
**Cenário 2**: Investigação e resolução de erro de provisioning
**Cenário 3**: Suspensão de módulo por problema de billing
**Cenário 4**: Upgrade automático vs manual de módulos

---

## ✅ 11. Critérios de Aprovação

### **11.1 Funcionalidade**
- [ ] Dashboard mostra estatísticas corretas
- [ ] Filtros funcionam isolados e combinados
- [ ] Ações em lote executam sem conflitos
- [ ] Aprovações atualizam status corretamente
- [ ] Histórico registra todas as mudanças

### **11.2 Usabilidade**
- [ ] Interface intuitiva para novos usuários
- [ ] Fluxos de ação claros e diretos
- [ ] Feedback adequado para todas as ações
- [ ] Estados de loading não bloqueiam trabalho
- [ ] Mobile usável para consulta básica

### **11.3 Performance**
- [ ] Página carrega em < 3s
- [ ] Filtros respondem em < 1s
- [ ] Ações executam em < 5s
- [ ] Não há memory leaks em uso prolongado

### **11.4 Consistência**
- [ ] Design system seguido 100%
- [ ] Padrões de componentes respeitados
- [ ] Nomenclatura consistente
- [ ] Comportamentos previsíveis

---

## 📝 12. Entregáveis

### **12.1 Componentes Novos (Intervenções Mínimas)**
- `ApprovalsCard` - Card de solicitações na página de organizações
- `ApprovalsModal` - Modal de visão completa de aprovações
- `OrganizationRequestsSection` - Seção de solicitações por organização
- `ModulePoliciesCard` - Card de políticas na página do módulo
- `ApprovalModal` - Modal universal de aprovação/negação
- `SidebarStatsWidget` - Widget reutilizável para estatísticas
- `SidebarActionsWidget` - Widget reutilizável para ações

### **12.2 Componentes Atualizados (Preservando Estrutura)**
- `OrganizationModulesCard` - Trocar badges + adicionar coluna health
- `OrganizationsPage` - Inserir novo card + nova coluna "Pendências"
- `ModulesPage` - Adicionar coluna "Adoção"
- `ModulePage` - Adicionar card de políticas + expandir maturidade
- `TenantOperationalStatusBadge` - Melhorias se necessárias

### **12.3 Serviços e Actions (Reutilizando Existentes)**
- Integração com `TenantOperationalStatusService` existente
- Actions para aprovação/negação de solicitações
- Handlers para mudanças de políticas de módulos
- Utils para cálculo de estatísticas e widgets

### **12.4 Rotas (Sem Novas Rotas)**
- `/admin/organizations` - Card + coluna de aprovações (atualização)
- `/admin/organizations/[id]` - Seção de solicitações (atualização)  
- `/admin/modules/[id]` - Card de políticas (atualização)
- `/admin/modules` - Coluna de adoção (atualização)
- **Nenhuma nova rota necessária** - apenas melhorias complementares

---

Este plano detalha granularmente toda a interface a ser implementada, seguindo os padrões existentes e focando na experiência do usuário administrativo. Cada seção pode ser implementada incrementalmente, permitindo validação e feedback contínuo durante o desenvolvimento.