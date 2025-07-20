# Plano de Adequação da Interface do Tenant

> **Objetivo**: Detalhar as tarefas de frontend necessárias para migrar a interface do tenant para a nova arquitetura de módulos base com implementações dinâmicas. Este documento detalha a execução da **Fase 4 (Reestruturação do Frontend)** e **Fase 6 (Cleanup)** do plano mestre (`MAR_00_MASTER_MIGRATION_PLAN.md`).

---

## ✅ **Lista de Tarefas para Adequação da Interface do Tenant**

O objetivo é substituir a antiga página dinâmica (`DynamicModulePage`) pela nova arquitetura de roteamento e carregamento de implementações específicas por tenant.

### **Fase 1: Estruturação dos Novos Diretórios de Módulos**

- **Tarefa 1.1: Criar a Estrutura de Pastas dos Módulos Base**
  - **O que fazer:** Dentro de `src/app/(protected)/[slug]/(modules)/`, criar um diretório para cada módulo base identificado.
  - **Estrutura Alvo:**
    ```
    (modules)/
    ├── performance/
    ├── insights/
    ├── alerts/
    ├── inventory/
    └── analytics/
    ```
  - **Status (conforme plano):** ✅ **CONCLUÍDO**

- **Tarefa 1.2: Criar os Subdiretórios de Implementações**
  - **O que fazer:** Dentro de cada pasta de módulo base criada acima, adicionar um subdiretório chamado `implementations`.
  - **Estrutura Alvo (exemplo para `performance`):**
    ```
    performance/
    └── implementations/
    ```
  - **Status (conforme plano):** ✅ **CONCLUÍDO**

---

### **Fase 2: Implementação do Carregador de Módulos (Module Router)**

*   **Tarefa 2.1: Criar o Componente `page.tsx` para Cada Módulo**
    *   **O que fazer:** Em cada diretório de módulo base (ex: `/performance`), criar um arquivo `page.tsx`. Este componente atuará como um roteador, decidindo qual implementação carregar.
    *   **Lógica Essencial (template do plano):**
        1.  Utilizar a função `getModuleImplementation(tenantSlug, moduleSlug)` para buscar no backend qual implementação está ativa para o tenant.
        2.  Criar um mapa de implementações (`implementationMap`) que associa a `implementation_key` (ex: `'banban'`) ao componente React correspondente.
        3.  Usar `React.lazy()` para importar dinamicamente cada componente de implementação (ex: `lazy(() => import('./implementations/BanbanImplementation'))`).
        4.  Envolver o componente carregado com `<Suspense fallback={...}>` para exibir um esqueleto de carregamento (`ModuleLoadingSkeleton`) enquanto o componente real é baixado.
        5.  Renderizar o componente correto, passando as configurações customizadas (`custom_config`) como props.
    *   **Status:** ✅ **CONCLUÍDO**. Os arquivos `page.tsx` para `inventory` e `analytics` foram criados, completando a fase.

---

### **Fase 3: Migração e Criação dos Componentes de Implementação**

*   **Tarefa 3.1: Mover ou Criar os Componentes de Implementação**
    *   **O que fazer:** Mover a lógica das páginas de módulos existentes (que estavam espalhadas) ou criar novos arquivos para cada implementação dentro do diretório `implementations` correspondente.
    *   **Ação:** Foram criados componentes de *placeholder* para as implementações `Standard`, `Banban` e `Enterprise` dos módulos `inventory` e `analytics`.
    *   **Status:** ✅ **CONCLUÍDO**. A estrutura de frontend para os módulos pendentes está completa e pronta para validação.

---

### **Fase 4: Integração e Navegação**

*   **Tarefa 4.1: Atualizar Todos os Links de Navegação**
    *   **O que fazer:** Realizar uma busca em todo o código-fonte (barras laterais, menus, dashboards, etc.) por links que apontavam para a rota antiga e genérica (`/[slug]/[module]`).
    *   **Ação:** Após análise do `DynamicSidebar.tsx` e da API (`/api/modules/configuration`), foi verificado que a geração de links já é de responsabilidade do backend.
    *   **Descoberta:** O `ModuleConfigurationService` no backend já constrói os `href` usando o `slug` do módulo (ex: `/performance`), o que está alinhado com a nova arquitetura. Nenhuma alteração no código do frontend foi necessária.
    *   **Status:** ✅ **CONCLUÍDO (Validação)**.

---

### **Fase 5: Cleanup do Código Legado**

*   **[ ] Tarefa 5.1: Remover a `DynamicModulePage`**
  - **O que fazer:** Após a validação completa de que todos os módulos funcionam na nova estrutura, deletar o arquivo da página dinâmica antiga.
  - **Arquivo a ser Deletado:** `src/app/(protected)/[slug]/[module]/DynamicModulePage.tsx`
  - **Status (conforme plano):** 🔄 **NÃO INICIADO**.

- **[ ] Tarefa 5.2: Remover a Rota Dinâmica Antiga**
  - **O que fazer:** Deletar o diretório `[module]` que continha a `DynamicModulePage`.
  - **Diretório a ser Deletado:** `src/app/(protected)/[slug]/[module]/`
  - **Status (conforme plano):** 🔄 **NÃO INICIADO**.

---

### **Fase 6: Validação Funcional**

- **[ ] Tarefa 6.1: Testar o Carregamento para Diferentes Tenants**
  - **O que fazer:** Validar o fluxo completo para múltiplos tipos de tenants (ex: um tenant `standard`, um `banban`, um `enterprise`).
  - **Critérios de Verificação:**
    - [ ] O tenant `banban` carrega a `BanbanImplementation`?
    - [ ] Um tenant padrão carrega a `StandardImplementation`?
    - [ ] O esqueleto de carregamento (`loading skeleton`) é exibido corretamente?
    - [ ] As configurações do `custom_config` são aplicadas corretamente na interface?
    - [ ] O sistema faz o fallback para a implementação `standard` caso uma implementação específica não seja encontrada?
