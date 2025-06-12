# 📖 Guia de Documentação do Projeto

Este guia estabelece as diretrizes para criar e manter a documentação do projeto, garantindo que ela seja útil, atualizada e fácil de navegar.

## 🎯 Por Que Documentar?

*   **Onboarding**: Acelerar a integração de novos membros da equipe.
*   **Referência**: Fornecer uma fonte da verdade para desenvolvedores atuais.
*   **Consistência**: Manter padrões e melhores práticas em todo o projeto.
*   **Registro de Decisões**: Documentar o "porquê" por trás de escolhas arquiteturais e de design.
*   **Manutenção**: Facilitar a compreensão e modificação do código existente.

## 👥 Audiência

Primariamente desenvolvedores (atuais e futuros), mas também pode ser útil para QAs, Product Owners ou outros stakeholders técnicos. Escreva de forma clara e acessível.

## ⏰ Quando Criar ou Atualizar Documentação?

*   **Nova Feature Significativa**: Documentar sua arquitetura, componentes chave e APIs.
*   **Mudança em Padrão Existente**: Atualizar o guia relevante (ex: mudar a forma de autenticação).
*   **Nova API ou Modificação Crítica**: Atualizar o relatório de APIs e guias relacionados.
*   **Implementação de Requisito Complexo**: (ex: Logs de Auditoria).
*   **Correção de Bug Relevante com Lições Aprendidas**: Adicionar ao changelog ou a uma seção de troubleshooting.
*   **Decisão Arquitetural Importante**: Registrar a decisão e sua justificativa.
*   **Regularmente**: Revisar documentos existentes para garantir que ainda são precisos.

## 🗺️ Estrutura da Documentação

A documentação está organizada nas seguintes pastas:

### 📁 **`executive/`**
Documentos de alto nível para stakeholders e visão geral do projeto:
- `DOCUMENTO_EXECUTIVO.md` - Visão geral executiva do projeto

### 📁 **`guides/`**
Princípios, melhores práticas e guias de "como fazer":
- `API_ROUTES_GUIDE.md` - Guia para criação de API routes
- `AUDIT_LOGS_STANDARD_METHOD.md` - Padrão para logs de auditoria
- `CLIENT_SERVER_INTERACTIONS.md` - Interações cliente-servidor
- `BEST_PRACTICES.md` - Melhores práticas gerais
- `SERVER_ACTIONS_GUIDE.md` - Guia para Server Actions
- `COMPONENTS_GUIDE.md` - Guia de componentes
- `PRINCIPLES.md` - Princípios de desenvolvimento
- `PREFERENCIAS-UX-INTERFACE.md` - Preferências de UX/UI
- `audit-logging-requirements.md` - Requisitos de auditoria

### 📁 **`implementations/`**
Detalhes técnicos de funcionalidades específicas:
- `AUDIT-LOGGING-INTEGRATION.md` - Implementação de logs de auditoria
- `IMPLEMENTACAO-COMPLETA.md` - Implementação completa do sistema
- `IMPLEMENTATION_SUMMARY.md` - Resumo das implementações
- `DATA_MANAGEMENT.md` - Gestão de dados

### 📁 **`reports/`**
Relatórios organizados por categoria:

#### 📁 **`reports/compliance/`**
Relatórios de conformidade e correções:
- `analise-conformidade-paginas-principais.md`
- `correcoes-paginas-principais-relatorio.md`
- `correcoes-skeleton-loading-completo.md`
- `correcoes-skeleton-loading.md`
- `FINAL_CORRECTION_SUMMARY.md`

#### 📁 **`reports/phases/`**
Relatórios por fases do projeto:
- `relatorio-fase1-conformidade.md`
- `relatorio-fase2-otimizacoes.md`
- `aprendizados-fase2.md`

#### 📁 **`reports/api/`**
Relatórios específicos sobre APIs:
- `API_ANALYSIS_AND_REORGANIZATION.md`
- `API_FIX_REPORT.md`
- `API_IMPROVEMENTS_SUMMARY.md`
- `FINAL_API_REPORT.md`

### 📁 **`testing/`**
Planos e resultados de testes:
- `TESTE-SOFT-DELETE-USUARIOS.md`
- `TESTE-FLUXOS-AUXILIARES.md`

### 📁 **`configuration/`**
Setup, variáveis de ambiente e scripts:
- `CONFIGURATION.md` - Configurações do sistema
- `setup-storage.sql` - Script de configuração do storage

### 📁 **`reference/`**
Informações de referência rápida e troubleshooting:
- `DEBUG.md` - Guia de debug
- `TROUBLESHOOTING-AUDIT-LOGGING.md` - Troubleshooting de logs

### 📁 **`changelog/`**
Histórico de mudanças significativas:
- `CHANGELOG-API-ROUTES-REFACTOR.md`
- `CHANGELOG-AUDIT-LOGS-V2.md`
- `CHANGELOG-CORRECOES.md`
- `REFATORACAO-COMPLETA-API-ROUTES.md`
- `REORGANIZACAO-DOCUMENTACAO.md`

### 📁 **`projects/`**
Documentação específica de projetos (reservado para futuro uso)

**Princípio Chave**: Mantenha documentos focados. Se um documento começar a cobrir muitos tópicos não relacionados, considere dividi-lo.

## ✍️ Como Documentar?

### 1. Estrutura do Documento

Para a maioria dos documentos, use uma estrutura similar:

1.  **Título Claro e Descritivo**.
2.  **Resumo/Objetivo (1-2 frases)**: O que este documento cobre? Por que ele existe?
3.  **Data da Última Atualização/Revisão**.
4.  **(Opcional, para documentos longos) Índice (Table of Contents)**.
5.  **Corpo do Documento**:
    *   Use headings (`##`, `###`) para organizar seções.
    *   Use listas (`-`, `*`, `1.`) para clareza.
    *   Use **negrito** para destacar termos chave ou ações importantes.
    *   Use `code blocks` para nomes de arquivos, variáveis, e trechos de código.
6.  **(Opcional) Seção de Troubleshooting/FAQ**.
7.  **(Opcional) Próximos Passos/Recomendações (se aplicável e atual)**.
8.  **(Opcional) Documentos Relacionados/Links Úteis**.

### 2. Estilo de Escrita

*   **Clareza e Concisão**: Vá direto ao ponto. Evite jargões desnecessários ou explique-os.
*   **Voz Ativa**: Prefira "O sistema registra o log" a "O log é registrado pelo sistema".
*   **Consistência**: Use os mesmos termos para os mesmos conceitos em toda a documentação. Crie um glossário se necessário.
*   **Exemplos**: Use exemplos de código (corretos e, às vezes, incorretos para ilustrar) sempre que possível.
*   **Visual**: Use emojis (como você já faz bem!) para adicionar apelo visual e significado rápido. Considere diagramas simples (Mermaid.js é ótimo para Markdown) para fluxos ou arquiteturas.

### 3. Formato (Markdown)

*   Utilize as funcionalidades do Markdown de forma eficaz (headings, listas, links, code blocks com syntax highlighting).
*   ```typescript
    // Exemplo de bloco de código com linguagem especificada
    function helloWorld() {
      console.log("Hello, documentation!");
    }
    ```

### 4. Tipos de Documentos Comuns e Seu Foco

*   **Guias (`guides/`)**:
    *   **Foco**: "Como fazer" ou "Por que fazemos desta forma".
    *   **Conteúdo**: Princípios, regras, melhores práticas, passo-a-passo.
    *   **Exemplo**: `CLIENT_SERVER_INTERACTIONS.md` é um guia de "como" e "porquê".
*   **Implementações (`implementations/`)**:
    *   **Foco**: "O que foi construído" e "como funciona internamente".
    *   **Conteúdo**: Detalhes técnicos de uma feature, arquitetura, tabelas de banco de dados envolvidas, APIs criadas especificamente para ela.
    *   **Exemplo**: `AUDIT-LOGGING-INTEGRATION.md` detalha a implementação.
*   **Relatórios (`reports/`)**:
    *   **Foco**: Análise de um problema, proposta de solução, ou o estado atual de um subsistema.
    *   **Conteúdo**: Identificação de problemas, alternativas, solução escolhida, métricas.
    *   **Exemplo**: `FINAL_API_REPORT.md` descreve o estado atual das APIs.
*   **Changelogs (`changelog/`)**:
    *   **Foco**: Histórico de mudanças importantes.
    *   **Conteúdo**: Data, descrição da mudança, motivo, impacto.
*   **Configuração (`configuration/`)**:
    *   **Foco**: Como configurar o ambiente ou uma feature específica.
    *   **Conteúdo**: Variáveis de ambiente, scripts, passos de setup.

## 🔄 Manutenção da Documentação

*   **Documentação como Código**: Trate a documentação como parte do seu código. Atualize-a quando o código mudar.
*   **Revisão em PRs**: Se uma mudança no código impacta a documentação, inclua a atualização da documentação no mesmo Pull Request.
*   **Revisão Periódica**:
    *   **Mensal/Trimestral**: Revise rapidamente os guias principais e documentos de implementação de features ativas.
    *   **Ao Iniciar uma Task Relacionada**: O desenvolvedor que for trabalhar em uma área deve primeiro revisar a documentação existente para ela.
*   **Responsabilidade**: A equipe como um todo é responsável, mas pode ser útil designar "donos" para seções críticas da documentação.
*   **Arquivamento**: Mova documentos obsoletos para uma pasta `_archive/` ou similar, em vez de excluí-los, caso precisem ser consultados no futuro. Adicione uma nota no topo do arquivo arquivado indicando por que ele foi arquivado e qual documento o substitui.
*   **Feedback**: Incentive a equipe a apontar documentação desatualizada ou confusa.

## 📋 Onde Documentar Cada Tipo de Conteúdo?

| Tipo de Conteúdo | Pasta | Exemplo |
|-------------------|-------|---------|
| Visão executiva | `executive/` | Documento executivo do projeto |
| Guias e práticas | `guides/` | Como implementar APIs, padrões |
| Implementações técnicas | `implementations/` | Detalhes de funcionalidades |
| Relatórios de conformidade | `reports/compliance/` | Análises de conformidade |
| Relatórios por fase | `reports/phases/` | Relatórios de cada fase |
| Relatórios de API | `reports/api/` | Análises e melhorias de API |
| Testes | `testing/` | Planos e resultados de teste |
| Configurações | `configuration/` | Setup e scripts |
| Referência rápida | `reference/` | Debug e troubleshooting |
| Histórico de mudanças | `changelog/` | Logs de alterações |
| Projetos específicos | `projects/` | Documentação por projeto |