# Confronto do Plano de Implementação dos Módulos Banban com o Estado Atual

## 1. Introdução

Este documento confronta o `Planejamento de Implementação - Módulos Cliente Banban (Adaptado para Dashboard Dinâmico)` (`BANBAN_MODULES_IMPLEMENTATION_PLAN_ADAPTED.md`) com o estado atual de desenvolvimento dos módulos Banban, conforme descrito no próprio plano. O objetivo é identificar as lacunas existentes e definir os próximos passos necessários para que os módulos estejam em conformidade com o plano de implementação revisado, especialmente no que tange à transição para o dashboard dinâmico baseado em widgets.

## 2. Estado Atual dos Módulos Banban (Conforme o Plano Adaptado)

De acordo com o `BANBAN_MODULES_IMPLEMENTATION_PLAN_ADAPTED.md`, as **Fases 1 e 2 estão CONCLUÍDAS**:

### Fase 1: Fundação (Semanas 1-2) ✅ CONCLUÍDA

- **Setup da estrutura modular**: Sistema de módulos em `src/core/modules/banban/`.
- **Configuração de testes base**: Testes abrangentes com 15+ cenários.
- **Implementação do sistema de validações**: Schemas Zod para eventos.
- **Setup de logging e monitoramento**: BanbanLogger singleton + métricas.

### Fase 2: Integração com Edge Functions (Semanas 3-4) ✅ CONCLUÍDA

- **Ativação dos Listeners**: Sistema de listeners ativos implementado.
- **Integração com Edge Functions**: API endpoint para eventos criada.
- **Sistema de processamento pós-webhook**: Motor de insights e alertas funcionais.
- **Testes de integração com dados reais**: 25+ testes end-to-end implementados.

**Em resumo, o backend dos módulos Banban está funcional para processar dados via webhooks, gerar insights e alertas, e expor esses dados internamente.**

## 3. Plano de Implementação Adaptado (Fase 3: Próximos Passos)

A `Fase 3: Home de Insights e Integração com Dashboard Dinâmico` é o próximo marco no plano adaptado e representa a principal área de divergência com o estado atual (que ainda não possui essa implementação). Os objetivos desta fase são:

- **Definição dos Contratos de Widget (`widget.json`)** para todos os insights Banban.
- **Adaptação das APIs dos módulos Banban** para expor dados via RPC/REST para os widgets.
- **Integração com o pipeline de publicação de widgets** (CI/CD).
- **Refatoração da interface da Home (`/banban`)** para ser um contêiner de dashboard dinâmico.
- **Desenvolvimento dos componentes React de widget** para cada tipo de insight.
- **Implementação inicial da UI de personalização** (ativar/desativar widgets).

## 4. Confronto e Lacunas

O estado atual dos módulos Banban (Fases 1 e 2 concluídas) fornece a **base de dados e lógica de negócio** para os insights e alertas. No entanto, a **camada de apresentação (frontend do dashboard)** ainda opera sob o modelo antigo de renderização condicional hardcoded (`default-tenant-dashboard.tsx`).

As principais lacunas são:

1.  **Ausência de Definição de Widgets**: Os módulos Banban ainda não possuem os arquivos `widget.json` que descrevem seus insights como widgets para o novo sistema de dashboard.
2.  **APIs de Módulos Não Expostas para Widgets**: Embora os motores de insights e alertas existam, suas saídas não estão formalmente expostas via RPC/REST de forma a serem consumidas pelo `dashboard-service` (BFF) conforme o contrato de widget.
3.  **Falta de Pipeline de Publicação de Widgets**: Não há um mecanismo de CI/CD configurado para ler os `widget.json` dos módulos Banban e publicá-los na tabela `dashboard_widgets`.
4.  **Dashboard Frontend Não Adaptado**: A interface da Home (`/banban`) ainda não foi refatorada para ser um contêiner dinâmico que consome o `dashboard-service` e renderiza widgets via `React.lazy`.
5.  **Componentes de Widget Inexistentes**: Os componentes React específicos para cada tipo de insight (ex: `LowStockInsightCard.tsx`) que seriam carregados dinamicamente ainda não foram desenvolvidos.
6.  **UI de Personalização Pendente**: A funcionalidade para o tenant ativar/desativar widgets no dashboard ainda não foi implementada.

## 5. Plano de Ação para Conformidade (Implementação da Fase 3)

Para que os módulos Banban estejam em conformidade com o plano de implementação adaptado, as seguintes ações devem ser executadas, correspondendo à `Fase 3` do cronograma:

### 5.1. Preparação dos Módulos Banban para Widgets

- **Ação 1.1: Definir `widget.json` para cada Insight/Alerta**: Para cada insight ou alerta gerado pelos módulos Banban (ex: estoque baixo, margem baixa, slow-movers), criar um arquivo `widget.json` (ou similar) dentro da estrutura do módulo, seguindo o contrato JSON do `DASHBOARD_TENANT_CUSTOMIZADO.md`. Isso inclui definir o `widget_id`, `name`, `description`, `category`, `component` (caminho do componente React), e a `query` (RPC/REST).

  - **Responsável**: Equipe de Desenvolvimento Banban (Backend/Frontend).
  - **Exemplo de Arquivos**: `src/core/modules/banban/insights/widgets/low-stock-insight.json`, `src/core/modules/banban/alerts/widgets/critical-alert-list.json`.

- **Ação 1.2: Adaptar APIs dos Módulos para Consumo de Widgets**: Revisar os motores de insights (`insights/engine.ts`) e alertas (`alerts/processor.ts`) para garantir que os dados necessários para os widgets possam ser facilmente recuperados via funções RPC no Supabase ou endpoints REST. Criar as funções RPC/endpoints correspondentes que serão referenciadas nas `query`s dos `widget.json`.
  - **Responsável**: Equipe de Desenvolvimento Banban (Backend).
  - **Exemplo**: Criar `Supabase Function` `banban_insights_get_low_stock(organization_id, limit)`.

### 5.2. Integração com o Pipeline de Publicação de Widgets

- **Ação 2.1: Configurar CI/CD para Publicação de Widgets**: Integrar o script `publish_widgets.ts` (a ser desenvolvido como parte da Fase 2 do plano de dashboard) no pipeline de CI/CD dos módulos Banban. Este script deve ser executado sempre que houver uma alteração nos `widget.json` dos módulos, garantindo que a tabela `dashboard_widgets` no Supabase esteja sempre atualizada.
  - **Responsável**: Equipe de DevOps/Backend.

### 5.3. Refatoração do Frontend do Dashboard

- **Ação 3.1: Refatorar a Página da Home (`/banban`)**: Modificar `src/app/(protected)/[slug]/page.tsx` (ou o componente que renderiza o dashboard do tenant) para que ele atue como um contêiner de dashboard dinâmico. Isso envolve:

  - Consumir o novo `dashboard-service` (BFF) para obter o layout e os dados dos widgets habilitados para o tenant.
  - Implementar um sistema de grid (ex: `react-grid-layout`) para renderizar o layout.
  - Utilizar `React.lazy` e `Suspense` para carregar dinamicamente os componentes React dos widgets com base no `component` path do `widget.json`.
  - **Responsável**: Equipe de Desenvolvimento Frontend.

- **Ação 3.2: Desenvolver Componentes React de Widget**: Criar os componentes React (`.tsx`) para cada tipo de insight/alerta Banban. Estes componentes devem ser "stateless", receber os dados via props do contêiner do dashboard e seguir as "Boas Práticas de Desenvolvimento de Widget" (estados de `isLoading`, `isEmpty`, `isError`).

  - **Responsável**: Equipe de Desenvolvimento Frontend.
  - **Exemplo de Arquivos**: `src/app/(protected)/[slug]/components/widgets/LowStockInsightCard.tsx`, `src/app/(protected)/[slug]/components/widgets/LowMarginInsightCard.tsx`.

- **Ação 3.3: Implementar UI de Personalização (Inicial)**: Desenvolver a interface básica que permite ao tenant ativar/desativar widgets no dashboard. Isso envolverá a interação com as tabelas `tenant_dashboard_widgets` via Server Actions.
  - **Responsável**: Equipe de Desenvolvimento Frontend.

## 6. Conclusão

As Fases 1 e 2 do plano de implementação dos módulos Banban estabeleceram uma base sólida de processamento de dados e geração de insights no backend. O próximo desafio é a **transformação da camada de apresentação** para um sistema de dashboard dinâmico e personalizável. A execução das ações detalhadas na `Fase 3` será crucial para alinhar o estado atual dos módulos Banban com a visão do dashboard dinâmico, proporcionando maior flexibilidade e valor para os tenants.
