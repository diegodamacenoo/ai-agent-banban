# Avaliação da Estratégia de Exclusão (Soft Delete vs. Hard Delete)

Este documento resume a auditoria da implementação de soft delete e exclusão permanente no projeto, com base na análise dos arquivos de "actions" e do esquema do banco de dados (migrações do Supabase).

## Resumo das Implementações Atuais

### 1. Organizações (`organizations` table)
*   **Soft Delete:** **Completamente implementado.** A tabela `organizations` possui a coluna `deleted_at` (timestamp). A função `deleteOrganization` (em `src/app/actions/admin/organizations.ts`) atualiza essa coluna com a data e hora da exclusão, em vez de remover o registro fisicamente. Todas as consultas de listagem de organizações filtram corretamente os registros onde `deleted_at` não é nulo, garantindo que apenas organizações ativas sejam exibidas por padrão.
*   **Exclusão Permanente (Hard Delete):** **Não implementada.** Atualmente, não há nenhuma função ou mecanismo explícito para remover permanentemente uma organização do banco de dados.

### 2. Usuários (`profiles` table e `auth.users`)
*   **Soft Delete:** **Completamente implementado.** A tabela `profiles` possui a coluna `deleted_at`. A função `softDeleteUser` (em `src/app/actions/user-management/users.ts`) atualiza essa coluna, marcando o perfil como inativo/deletado logicamente.
*   **Exclusão Permanente (Hard Delete):** **Completamente implementada.** A função `permanentlyDeleteUser` (em `src/app/actions/admin/organization-users.ts` e `src/app/actions/user-management/users.ts`) remove o usuário tanto do sistema de autenticação do Supabase (`auth.users`) quanto da tabela `profiles`, garantindo a remoção completa dos dados.

### 3. Outras Entidades
*   **Soft Delete:** Implementado para `analytics_dashboards`, `analytics_data_points`, `analytics_dimensions`, `analytics_metrics`, `performance_alerts`, `performance_metrics` e `performance_thresholds`. Essas tabelas também possuem a coluna `deleted_at` em seu esquema.
*   **Exclusão Permanente (Hard Delete):** Para a maioria das outras entidades (ex: `core_modules`, `organization_modules`, `user_invites`, `user_known_devices`, `user_login_history`, `webhook_logs`, etc.), a exclusão é realizada de forma permanente (hard delete) através de chamadas diretas a `.delete()` sem o uso de uma coluna `deleted_at`.

## Proposta de Implementação (O que falta)

A estratégia atual é robusta para organizações e usuários, oferecendo flexibilidade com o soft delete. No entanto, a ausência de uma opção de exclusão permanente para organizações pode ser uma limitação em cenários específicos (ex: conformidade com GDPR/LGPD para "direito ao esquecimento" em casos de dados de teste, ou limpeza de dados inválidos).

**Proposta:**

1.  **Implementar Hard Delete para Organizações:**
    *   **Função:** Criar uma nova função (ex: `hardDeleteOrganization`) que, após validações de segurança rigorosas (ex: apenas master admin, sem usuários ativos, etc.), execute a exclusão física do registro da tabela `organizations`.
    *   **Cascata:** Avaliar cuidadosamente se a exclusão de uma organização deve cascatear para outras tabelas (ex: `profiles` de usuários vinculados, `organization_modules`, `audit_logs` específicos da organização). Idealmente, o hard delete de uma organização deveria remover todos os dados relacionados para garantir a integridade e conformidade. Isso pode exigir a configuração de `ON DELETE CASCADE` nas chaves estrangeiras do banco de dados ou a implementação de lógica de exclusão em cascata no código.
    *   **Interface:** Adicionar uma opção de "Exclusão Permanente" no painel administrativo, claramente separada e com avisos de risco, para organizações que já foram soft-deletadas.

Esta implementação garantiria que o sistema possa lidar com todos os cenários de exclusão de dados de organizações, mantendo a segurança e a conformidade.
