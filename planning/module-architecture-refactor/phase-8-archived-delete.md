## Fase 8: Gerenciamento de Ciclo de Vida de Módulos (Arquivamento e Exclusão)

**Status:** ✅ **CONCLUÍDA (Backend)**

**Objetivo:** Implementar um sistema granular de gerenciamento do ciclo de vida de módulos, permitindo desativação, arquivamento lógico, soft delete e exclusão permanente.

### 🏗 **Alterações no Backend (`src/app/actions/admin/configurable-modules.ts`)**

1.  **Esquema do Banco de Dados:**
    *   Adicionadas colunas `archived_at` e `deleted_at` (tipo `TIMESTAMP WITH TIME ZONE`, padrão `NULL`) às tabelas `base_modules` e `module_implementations`.
    *   Removida a coluna `status` das tabelas `module_implementations` e `tenant_module_assignments`.
    *   A tabela `tenant_module_assignments` **NÃO** recebeu as colunas `archived_at` ou `deleted_at`.

2.  **Server Actions:**
    *   **`deleteBaseModule` e `deleteModuleImplementation`:** Convertidas para realizar **soft delete** (definem `deleted_at = now()`) com cascata para entidades relacionadas.
    *   **`deleteTenantAssignment`:** Permanece como um **hard delete** (exclusão física imediata).
    *   **Novas Funções de Ciclo de Vida:**
        *   `archiveBaseModule`, `archiveModuleImplementation`: Realizam **soft archive** (definem `archived_at = now()`) com cascata.
        *   `restoreBaseModule`, `restoreModuleImplementation`: Revertem o arquivamento ou soft delete (definem `archived_at = NULL`, `deleted_at = NULL`) com cascata.
        *   `purgeBaseModule`, `purgeModuleImplementation`: Realizam **hard delete** (exclusão física) com pré-condição de que o item já esteja soft-deletado.
    *   **Funções de Listagem (`get*`):**
        *   `getBaseModules` e `getModuleImplementations`: Por padrão, filtram por `archived_at IS NULL` e `deleted_at IS NULL`. Adicionadas opções para incluir registros arquivados/deletados.
        *   `getTenantAssignments`: Filtra assignments com base no estado (`archived_at` e `deleted_at`) dos `base_modules` e `module_implementations` associados.

### 🚀 **Impacto no Frontend**

*   **Modelos de Dados:** Necessidade de atualizar interfaces TypeScript (`BaseModule`, `ModuleImplementation`, `TenantModuleAssignment`) para refletir as novas colunas e a remoção de `status`.
*   **Chamadas de API:** Ajustar chamadas às Server Actions de listagem para usar os novos filtros.
*   **Componentes UI:**
    *   Adaptar a exibição de status para inferir o estado a partir de `is_active`, `archived_at` e `deleted_at`.
    *   Implementar novos botões e lógica para "Arquivar", "Restaurar" e "Purgar".
    *   Ajustar o comportamento do botão "Deletar" para soft delete (módulos/implementações) ou hard delete (assignments).
    *   Adicionar filtros na UI para visualizar itens arquivados e soft-deletados.

### ➡️ **Próximos Passos**

*   Implementação das modificações necessárias no frontend para suportar a nova lógica de ciclo de vida dos módulos.
