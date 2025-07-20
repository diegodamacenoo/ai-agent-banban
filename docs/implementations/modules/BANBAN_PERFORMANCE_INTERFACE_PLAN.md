# Plano de Interface - Módulo Performance Banban

## 📋 Resumo Executivo

Este documento apresenta o plano abrangente de interface para o módulo Performance do projeto Banban, baseado na análise detalhada dos requisitos do módulo e da arquitetura existente. O módulo segue a arquitetura Phase 2 com suporte multi-tenant e especialização para o setor fashion.

---

## 🎯 Objetivos da Interface

### Objetivos Primários
- **Dashboard Executivo** para tomada de decisões estratégicas
- **Análises Especializadas** para o setor de moda e calçados
- **Monitoramento em Tempo Real** de KPIs críticos
- **Experiência Responsiva** em desktop, tablet e mobile
- **Multi-tenancy** com customizações por cliente

### Objetivos Secundários  
- Interface intuitiva para usuários não-técnicos
- Exportação de relatórios e dados
- Alertas visuais para métricas críticas
- Integração com sistema de notificações

---

## 🏗️ Arquitetura da Interface

### Estrutura Simplificada - Página Única

```
Performance Module Interface (/performance)
├── 📊 Seção: Dashboard Executivo
│   ├── KPIs Principais (4x2 grid)
│   ├── Gráficos de Tendência
│   └── Alertas Críticos
├── 👗 Seção: Fashion Metrics
│   ├── Análise Sazonal
│   ├── Performance por Categoria
│   └── Botão Exportar (PDF/CSV)
├── 📦 Seção: Giro de Estoque
│   ├── Widget Expandido
│   ├── Análise Detalhada
│   └── Botão Exportar (PDF/CSV)
├── 📈 Seção: Performance por Marca
│   ├── Ranking de Marcas
│   ├── Análise Comparativa
│   └── Botão Exportar (PDF/CSV)
├── 💰 Seção: Análise de Margens
│   ├── Margens por Produto
│   ├── Matriz Tamanho/Cor
│   └── Botão Exportar (PDF/CSV)
└── ⚙️ Modal: Configuração de Alertas
    ├── Thresholds de KPIs
    ├── Notificações
    └── Histórico de Alertas
```

---

## 📱 Especificação da Página Única

### Página Principal - Performance Dashboard

**Rota:** `/performance`
**Componente:** `PerformancePage.tsx`

#### Layout da Página
```typescript
interface PerformancePageLayout {
  header: PageHeader;
  sections: PerformanceSection[];
  alertsModal: AlertsConfigModal;
}

interface PerformanceSection {
  id: string;
  title: string;
  component: React.ComponentType;
  exportable: boolean;
  collapsible?: boolean;
}
```

---

## 📋 Seções da Página

### 🎛️ Header da Página
- **Título dinâmico** baseado no cliente (ex: "Performance Fashion - Banban")
- **Badges de status** (Cliente Premium, Módulo Customizado)
- **Controles globais de período** (7d, 30d, 90d, 1y)
- **Botão de configuração de alertas** (abre modal)

---

### 📊 Seção 1: Dashboard Executivo

#### Grid de KPIs (4x2)
**Linha 1 - Vendas:**
- **Vendas Total** (R$ valor, % variação)
- **Margem Média** (% valor, tendência)
- **Cobertura de Estoque** (dias, status)
- **Sell Through** (% valor, meta)

**Linha 2 - Operacional:**
- **Giro de Estoque** (multiplicador, classificação)
- **Produtos em Falta** (quantidade, criticidade)
- **Performance Sazonal** (% da meta, estação atual)
- **ROI Coleções** (% retorno, comparativo)

#### Gráficos de Tendência
- **Gráfico Principal** - Performance Multi-período
- **Gráfico Sazonal** - Comparativo ano anterior

#### Alertas Críticos
- Lista compacta dos 3 alertas mais críticos
- Link para "Ver todos" (abre modal de alertas)

---

### 👗 Seção 2: Fashion Metrics

```typescript
interface FashionMetricsSection {
  seasonalAnalysis: SeasonalChart;
  categoryBreakdown: CategoryGrid;
  collectionPerformance: CollectionTable;
  exportButton: ExportButton; // PDF/CSV
}
```

#### Componentes:
- **Análise Sazonal** - Performance por estação (chart)
- **Performance por Categoria** - Calçados, Bolsas, Acessórios (grid)
- **ROI por Coleção** - Tabela com comparativos
- **Botão Exportar** - PDF/CSV no header da seção

---

### 📦 Seção 3: Giro de Estoque

#### Widget Expandido:
- **Tabela Principal** - Giro por categoria (widget existente expandido)
- **Gráfico de Barras** - Visualização comparativa
- **Filtros Locais** - Por categoria, marca
- **Drill-down** - Click na linha para detalhes
- **Botão Exportar** - PDF/CSV no header da seção

---

### 📈 Seção 4: Performance por Marca

#### Componentes:
- **Ranking de Marcas** - Top performers (tabela)
- **Gráfico de Market Share** - Participação nas vendas
- **Análise Temporal** - Tendências por marca (line chart)
- **Botão Exportar** - PDF/CSV no header da seção

---

### 💰 Seção 5: Análise de Margens

#### Componentes:
- **Margens por Categoria** - Grid de rentabilidade
- **Matriz Tamanho/Cor** - Heatmap de performance
- **Gráfico de Margem Temporal** - Evolução das margens
- **Botão Exportar** - PDF/CSV no header da seção

---

## ⚙️ Modal de Configuração de Alertas

```typescript
interface AlertsConfigModal {
  kpiThresholds: ThresholdConfig[];
  notificationSettings: NotificationConfig;
  alertHistory: AlertHistoryTable;
  activeAlerts: ActiveAlertsList;
}
```

### Conteúdo do Modal:

#### Aba 1: Configuração de Limites
- **Sliders para cada KPI** - Definir thresholds
- **Toggle de ativação** - Ligar/desligar alertas
- **Severidade** - Crítico, Alto, Médio, Baixo

#### Aba 2: Notificações
- **Canais** - Email, SMS, Push
- **Frequência** - Imediato, Diário, Semanal
- **Horários** - Quando receber alertas

#### Aba 3: Histórico e Alertas Ativos
- **Lista de alertas ativos** - Com ações (dispensar, resolver)
- **Histórico** - Últimos 30 dias de alertas
- **Estatísticas** - Resumo de alertas por tipo

---

## 🎨 Design System & UI Components

### Paleta de Cores (Banban Fashion)

```css
:root {
  /* Cores Primárias */
  --banban-primary: #8B5CF6;     /* Roxo vibrante */
  --banban-secondary: #EC4899;   /* Rosa fashion */
  --banban-accent: #10B981;      /* Verde sucesso */
  
  /* Cores de Status */
  --success: #059669;            /* Verde performance boa */
  --warning: #D97706;            /* Laranja atenção */
  --danger: #DC2626;             /* Vermelho crítico */
  --info: #2563EB;               /* Azul informativo */
  
  /* Gradientes */
  --gradient-primary: linear-gradient(135deg, #8B5CF6, #EC4899);
  --gradient-success: linear-gradient(135deg, #10B981, #059669);
}
```

### Componentes Customizados

#### 1. KPI Card Component
```typescript
interface KPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period: string;
  };
  icon?: React.ComponentType;
  format?: 'currency' | 'percentage' | 'number' | 'days';
  status?: 'success' | 'warning' | 'danger' | 'info';
}
```

#### 2. Section Header Component
```typescript
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  exportable?: boolean;
  collapsible?: boolean;
  onExport?: (format: 'pdf' | 'csv') => void;
  onToggle?: (collapsed: boolean) => void;
}
```

#### 3. Export Button Component
```typescript
interface ExportButtonProps {
  formats: ('pdf' | 'csv')[];
  onExport: (format: 'pdf' | 'csv') => void;
  loading?: boolean;
  disabled?: boolean;
}
```

#### 4. Performance Section Container
```typescript
interface PerformanceSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  exportable?: boolean;
  collapsible?: boolean;
  children: React.ReactNode;
  onExport?: (format: 'pdf' | 'csv') => void;
}
```

---

## 📱 Responsividade e Layouts

### Breakpoints
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px  
- **Desktop:** > 1024px
- **Large Desktop:** > 1440px

### Layout Adaptativo

#### Mobile (< 768px)
- **Stack vertical** de todos os componentes
- **KPIs em grid 2x4** (2 colunas, 4 linhas)
- **Gráficos full-width** com scroll horizontal
- **Menu hamburguer** para navegação
- **Bottom sheet** para filtros

#### Tablet (768px - 1024px)
- **Grid 2x2** para KPIs principais
- **Gráficos side-by-side** quando possível
- **Sidebar colapsível**
- **Modal overlays** para detalhes

#### Desktop (> 1024px)
- **Layout completo** conforme especificação
- **Grid 4x2** para KPIs
- **Sidebar fixa**
- **Múltiplos gráficos** simultâneos

---

## ⚡ Funcionalidades Interativas

### 1. Filtros e Controles

#### Filtros Globais:
- **Período** - Seletor de data range
- **Cliente/Tenant** - Troca de contexto (admin)
- **Categoria** - Filtro por tipo de produto
- **Marca** - Filtro por fornecedor

#### Controles de Visualização:
- **Tipo de Gráfico** - Line, Bar, Area, Heatmap
- **Agrupamento** - Por dia, semana, mês
- **Comparação** - Período anterior, ano anterior
- **Métricas** - Seleção de KPIs a exibir

### 2. Interações com Dados

#### Drill-down:
- **KPI Cards** → Análise detalhada
- **Gráficos** → Dados granulares
- **Tabelas** → Detalhes do item

#### Tooltips e Contexto:
- **Hover states** com informações adicionais
- **Explicações** de métricas complexas
- **Trends** e variações em popover

---

## 🔧 Integrações e APIs

### Endpoints Necessários

#### 1. Dashboard Data
```typescript
GET /api/performance/dashboard
{
  tenant_id: string;
  period: string;
  filters?: FilterParams;
}
```

#### 2. Fashion Metrics
```typescript
GET /api/performance/fashion-metrics
{
  season?: string;
  category?: string[];
  brands?: string[];
}
```

#### 3. Inventory Turnover
```typescript
GET /api/performance/inventory-turnover
{
  period: string;
  category?: string;
  minimum_turnover?: number;
}
```

### Export Functionality
- **PDF Export** para relatórios formatados
- **CSV Export** para análise de dados
- **Per-section Export** - Cada seção pode ser exportada individualmente

---

## 🚀 Fases de Implementação Simplificada

### Fase 1: Estrutura Base (1 semana)
- ✅ Estrutura base do módulo (já implementado)
- 🔄 **Layout da página única com seções**
- 🔄 **Header com controles globais**
- 🔄 **Estrutura de seções colapsíveis**

### Fase 2: Dashboard e KPIs (1 semana)
- 🔄 **Grid de KPIs (4x2)**
- 🔄 **Gráficos de tendência básicos**
- 🔄 **Alertas críticos (top 3)**
- 🔄 **Responsividade mobile**

### Fase 3: Seções de Análise (2 semanas)
- 🔄 **Fashion Metrics section**
- 🔄 **Giro de Estoque expandido**
- 🔄 **Performance por Marca**
- 🔄 **Análise de Margens**
- 🔄 **Botões de exportação (PDF/CSV)**

### Fase 4: Modal de Alertas (1 semana)
- 🔄 **Modal de configuração de alertas**
- 🔄 **Configuração de thresholds**
- 🔄 **Histórico de alertas**
- 🔄 **Sistema de notificações básico**

---

## 📊 Métricas de Sucesso

### Métricas de Interface:
- **Time to First Paint** < 1.5s
- **Largest Contentful Paint** < 2.5s
- **Cumulative Layout Shift** < 0.1
- **First Input Delay** < 100ms

### Métricas de Usuário:
- **Task completion rate** > 90%
- **Time to insight** < 30s
- **Error rate** < 2%
- **User satisfaction** > 4.5/5

---

## 🔒 Considerações de Segurança

### Controle de Acesso:
- **RBAC** - Role-based access control
- **Tenant isolation** - Dados isolados por organização
- **Data masking** - Informações sensíveis protegidas

### Auditoria:
- **Logs** de todas as ações críticas
- **Tracking** de visualizações de dados
- **Export logging** - Controle de relatórios gerados

---

## 📋 Checklist de Implementação

### Preparação:
- [ ] Definir estrutura de componentes
- [ ] Configurar design system
- [ ] Preparar dados de mock para desenvolvimento
- [ ] Definir APIs necessárias

### Desenvolvimento:
- [ ] Implementar página única com seções
- [ ] Criar sistema de KPI cards (4x2 grid)
- [ ] Desenvolver seções de análise (Fashion, Giro, Marca, Margem)
- [ ] Implementar botões de exportação (PDF/CSV)
- [ ] Criar modal de configuração de alertas
- [ ] Desenvolver responsividade

### Testes:
- [ ] Testes unitários de componentes
- [ ] Testes de integração com APIs
- [ ] Testes de responsividade
- [ ] Testes de performance
- [ ] Testes de acessibilidade

### Deploy:
- [ ] Configuração de ambiente
- [ ] Migrations de banco de dados
- [ ] Deploy de APIs
- [ ] Deploy de frontend
- [ ] Testes de produção

---

## 📞 Próximos Passos

1. **Aprovação do Plano Simplificado** - Review com stakeholders
2. **Prototipagem da Página Única** - Wireframes das seções
3. **Implementação Fase 1** - Estrutura base e layout
4. **Desenvolvimento Iterativo** - Implementação seção por seção

---

## 🎯 Resumo das Simplificações

### ✅ **Mantido:**
- Página única `/performance` com múltiplas seções
- Grid de KPIs 4x2 especializado para fashion
- Seções específicas: Fashion Metrics, Giro, Marca, Margem
- Modal para configuração de alertas
- Exportação PDF/CSV por seção
- Design responsivo e multi-tenant

### 🚫 **Removido:**
- Múltiplas páginas separadas
- Sistema completo de relatórios
- Dashboard em tempo real
- Página dedicada para configuração de alertas

### ⚡ **Simplificado:**
- Cronograma reduzido de 8 para 5 semanas
- Foco na funcionalidade essencial
- Implementação mais direta e objetiva

---

*Este plano simplificado mantém todas as funcionalidades essenciais do módulo Performance Banban em uma interface mais concisa e focada, facilitando tanto o desenvolvimento quanto a experiência do usuário.*