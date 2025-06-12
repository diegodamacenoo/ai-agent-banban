# Gerenciamento de Dados na Aplicação

Este documento detalha como os dados são persistidos, gerenciados e acessados na aplicação, desde a persistência de sessões até o estado de componentes no cliente.

---

## Gerenciamento de Sessões

O sistema utiliza a estrutura de sessões do **Supabase Auth (`auth.sessions`)** como a fonte primária de verdade para as sessões de usuário. Para fins de auditoria e gerenciamento específico da aplicação (ex: visualização de dispositivos conectados), mantemos uma tabela espelhada `public.user_sessions` que se sincroniza automaticamente com `auth.sessions`.

### Sincronização entre `auth.sessions` e `user_sessions`

1.  **Trigger de Espelhamento**:
    * Um trigger denominado `clone_sessions_trigger` observa operações (INSERT/UPDATE/DELETE) em `auth.sessions`.
    * Este trigger executa a função `clone_sessions()` que replica as alterações para `public.user_sessions`.
    * A função é definida com `SECURITY DEFINER` para garantir que ela tenha as permissões necessárias para escrever na tabela `public.user_sessions`, mesmo com as políticas de RLS ativas.

2.  **Políticas de RLS (Row Level Security)**:
    * A tabela `public.user_sessions` utiliza as seguintes políticas para controlar o acesso:
        * Permissões específicas para `supabase_auth_admin` executar todas as operações (SELECT, INSERT, UPDATE, DELETE).
        * Permissões de leitura para que usuários autenticados possam consultar **suas próprias sessões** (filtrado por `user_id`).
        * Uma política adicional que permite a administradores (ex: `role = 'organization_admin'`) visualizar **todas as sessões da organização**.

3.  **Considerações Importantes**:
    * É essencial manter as permissões de banco de dados corretamente configuradas.
    * O trigger deve ser definido com `SECURITY DEFINER` para superar restrições de RLS e garantir que a replicação funcione.
    * Permissões explícitas devem ser concedidas ao role `supabase_auth_admin` na tabela `public.user_sessions` para operações de espelhamento.

### Resolução de Problemas Comuns

1.  **Erro "permission denied for table user_sessions"**:
    * Verifique as políticas RLS para garantir que `supabase_auth_admin` tenha permissão `ALL` na tabela `public.user_sessions`.
    * Confirme que a função do trigger está usando `SECURITY DEFINER`.
    * Conceda permissões explícitas com: `GRANT ALL PRIVILEGES ON TABLE public.user_sessions TO supabase_auth_admin;`

2.  **Sessões Órfãs**:
    * Ocasionalmente, podem surgir sessões em `public.user_sessions` que não existem mais em `auth.sessions` (ex: em caso de falhas na sincronização ou exclusões diretas).
    * Implemente uma rotina de limpeza periódica para remover essas sessões órfãs:
        ```sql
        DELETE FROM public.user_sessions WHERE id NOT IN (SELECT id FROM auth.sessions);
        ```

### Implementação para UI "Dispositivos e Locais Conectados"

Para implementar uma interface de usuário que exibe e permite gerenciar dispositivos conectados:

1.  **Server Action para Buscar Sessões**:
    * Crie uma Server Action (ex: `/actions/auth/sessions.ts`) para buscar as sessões ativas do usuário.
    * Esta action deve consultar `public.user_sessions` e incluir detalhes relevantes como dispositivo, endereço IP, localização aproximada e data de criação/última atividade.

2.  **Server Action para Encerrar Sessões**:
    * Implemente uma Server Action que permita revogar sessões específicas (ex: pelo ID da sessão).
    * Esta action deve utilizar o método apropriado do Supabase Auth para encerrar a sessão, o que, por sua vez, acionará o trigger para remover a sessão de `public.user_sessions`.

3.  **Componente Client-Side**:
    * Crie um componente React de cliente para exibir a lista de sessões.
    * Implemente a UI para o usuário encerrar sessões individuais ou todas as sessões, chamando as Server Actions correspondentes.

---

## Fluxos Auxiliares de Conta

O sistema implementa funcionalidades essenciais para gestão avançada de contas de usuário, incluindo exportação de dados, desativação temporária e exclusão permanente de conta. Estas funcionalidades seguem as melhores práticas de segurança e conformidade com regulamentações de proteção de dados.

### Exportação de Dados Pessoais

O sistema permite que usuários solicitem e baixem uma cópia completa de seus dados pessoais em diferentes formatos.

1.  **Estrutura de Banco de Dados**:
    * Tabela `user_data_exports` para controlar solicitações de exportação
    * Suporte a formatos: JSON, CSV e PDF
    * Sistema de tokens únicos para download seguro
    * Controle de expiração e limite de downloads

2.  **Fluxo de Exportação**:
    * Usuário solicita exportação via interface (`requestDataExport`)
    * Sistema verifica se não há exportação pendente
    * Gera token único de download e registra auditoria
    * Processa dados de forma assíncrona (simulado)
    * Envia notificação quando pronto para download

3.  **Download Seguro**:
    * API Route `/api/download/data-export/[token]` para download
    * Verificação de token, expiração e limites
    * Incremento automático de contador de downloads
    * Registro de auditoria para compliance

### Desativação Temporária de Conta

Permite que usuários desativem temporariamente suas contas preservando todos os dados.

1.  **Validações de Segurança**:
    * Verificação se é o último administrador da organização
    * Bloqueio se há solicitação de exclusão pendente
    * Verificação de status atual da conta

2.  **Processo de Desativação**:
    * Alteração do status para 'inactive' na tabela `profiles`
    * Encerramento automático de todas as sessões ativas
    * Registro completo em auditoria
    * Reativação possível via novo login

### Exclusão Permanente de Conta

Implementa processo seguro de exclusão com período de carência e múltiplas confirmações.

1.  **Estrutura de Controle**:
    * Tabela `user_deletion_requests` para gerenciar solicitações
    * Status: pending, confirmed, cancelled, completed
    * Tokens de verificação com expiração de 24h
    * Período de carência de 7 dias após confirmação

2.  **Fluxo de Exclusão**:
    * **Solicitação**: Validação de senha e verificações de segurança
    * **Confirmação**: Via email com token único (API `/api/confirm-deletion/[token]`)
    * **Carência**: 7 dias para cancelamento após confirmação
    * **Execução**: Exclusão definitiva (implementação futura)

3.  **Proteções Implementadas**:
    * Bloqueio para último administrador da organização
    * Validação rigorosa de senha atual
    * Sistema de tokens únicos e seguros
    * Possibilidade de cancelamento até execução final
    * Auditoria completa de todas as etapas

### Server Actions Implementadas

**Gestão de Conta** (`/actions/auth/account-management.ts`):
- `requestDataExport(format)`: Solicitar exportação de dados
- `deactivateAccount()`: Desativar conta temporariamente  
- `requestAccountDeletion(password)`: Solicitar exclusão permanente
- `confirmAccountDeletion(token)`: Confirmar exclusão via token
- `cancelAccountDeletion()`: Cancelar solicitação de exclusão

**Status de Conta** (`/actions/auth/account-status.ts`):
- `getUserDataExports()`: Buscar exportações do usuário
- `getUserDeletionRequest()`: Buscar solicitação de exclusão ativa
- `getUserDeletionHistory()`: Histórico completo de solicitações

### Componente de Interface

O componente `FluxosAuxiliares` (`/settings/components/conta-components/fluxos-auxiliares.tsx`) fornece interface completa para:

- Seleção de formato e solicitação de exportação
- Listagem de exportações recentes com status
- Desativação temporária com confirmação
- Processo de exclusão com validações
- Cancelamento de solicitações pendentes
- Feedback visual em tempo real

### Considerações de Segurança

1.  **Validação de Entrada**: Todos os inputs são validados com Zod
2.  **Autenticação**: Verificação obrigatória de usuário logado
3.  **Autorização**: Controle de permissões e RLS no banco
4.  **Auditoria**: Registro completo de todas as operações
5.  **Rate Limiting**: Prevenção de spam de solicitações
6.  **Tokens Seguros**: Geração criptográfica com expiração

---

## Estado da Aplicação (Client-Side)

Para o gerenciamento de estado na parte do cliente, seguimos estes princípios:

* **React Context API**: É a ferramenta preferencial para gerenciar **estado global ou local da UI** que não precisa ser persistido no banco de dados (ex: tema, estado de modais, preferências temporárias).
* **Coexistência com Server Actions**: Se o estado gerenciado por um contexto precisar ser persistido no backend, as funções de mutação do contexto **DEVEM** invocar as Server Actions apropriadas. Após a conclusão bem-sucedida da Server Action, o estado local do contexto pode ser atualizado para refletir a nova verdade do backend.

---

## UserContext: Padrão de Gerenciamento de Dados do Usuário

O `UserContext` é um padrão fundamental implementado para centralizar e gerenciar os dados do perfil do usuário em toda a aplicação, garantindo consistência e facilidade de acesso.

### Estrutura e Responsabilidades

1.  **Definição de Tipos**:
    * `UserData`: Interface que define todos os dados de perfil do usuário (ex: `first_name`, `last_name`, `email`, `role`). Deve refletir a estrutura dos dados armazenados no perfil do usuário no banco de dados.
    * `UserConditions`: Interface para condições derivadas com base nos dados do usuário (ex: `canAccessPremium`, `hasActiveSubscription`, `isAdmin`).
    * `UserContextType`: Interface que expõe os dados do usuário (`userData`, `userConditions`) e os métodos de manipulação (`WorkspaceUserData`, `updateUserData`) do contexto.

2.  **Inicialização e Carregamento de Dados**:
    * Ao montar o provedor do `UserContext`, ele realiza uma chamada inicial a uma API interna (ex: `/api/profiles/me`) ou diretamente a uma Server Action que busca os dados do perfil do usuário.
    * Esta API/Server Action encapsula a lógica para buscar dados da tabela `profiles` no Supabase.
    * Combina dados do perfil com informações de autenticação (ex: `email` do objeto `user` retornado pelo Supabase Auth) para garantir que informações básicas estejam sempre disponíveis.

3.  **Funções Expostas pelo Contexto**:
    * `WorkspaceUserData()`: Permite que qualquer componente consumidor solicite uma **atualização forçada** dos dados do usuário do servidor. Isso é crucial após operações de mutação (ex: o usuário atualiza seu nome).
    * `updateUserData(newData)`: Atualiza localmente o estado do contexto. **Importante**: Em um ambiente de produção, esta função deve ser acompanhada por chamadas às Server Actions correspondentes para persistir as alterações no banco de dados.

4.  **Condições Derivadas**:
    * O `UserContext` calcula automaticamente estados derivados em `userConditions` sempre que os dados do usuário (`userData`) são alterados.
    * **Exemplo**: `canAccessPremium` pode ser calculado com base em uma propriedade `is_premium_member` do `userData` ou na `role` do usuário.

### Integração com Server Actions e Server Components

1.  **Fluxo de Atualização de Dados**:
    * Um componente de UI (Client Component) envia uma mutação (ex: atualização de perfil) que chama uma **Server Action**.
    * A Server Action interage com a API/Database para persistir as alterações.
    * Após o sucesso da Server Action, o componente cliente ou o `UserContext` chama `WorkspaceUserData()` para **revalidar e atualizar** o estado do contexto com os dados mais recentes do servidor.
    * Diagrama Simplificado: `Componente UI` → `Server Action` → `API/Database` → `Atualização do UserContext`

2.  **Verificação de Permissões**:
    * Os dados do usuário (especialmente o campo `role` dentro de `userData`) são utilizados para **controle de acesso** a funcionalidades e visualização de elementos da UI.
    * **Exemplo**: Acesso a uma página administrativa ou a um botão de configuração avançada pode ser condicionado a `userData.role === 'organization_admin'`.

3.  **Tratamento de Erros e Estados de Carregamento**:
    * O contexto deve gerenciar um estado `loading` para indicar quando os dados estão sendo carregados.
    * Em caso de erro na busca inicial ou na atualização, o contexto deve retornar valores iniciais (`initialUserData`) ou `null`, e um estado `error` para que os componentes consumidores possam lidar com isso apropriadamente (ex: exibir uma mensagem de erro).

### Boas Práticas e Considerações

1.  **Consistência entre Cliente e Servidor**:
    * Os tipos e interfaces (como `UserData`) devem ser rigorosamente consistentes em ambos os lados (frontend e backend) para evitar erros de tipagem e garantir que os dados sejam interpretados corretamente.
    * Garantir que campos críticos (como `role`) estejam presentes tanto no tipo `UserData` quanto na query ao Supabase para o perfil.

2.  **Fallbacks para Dados Ausentes**:
    * Em caso de dados ausentes no banco de dados (ex: o `first_name` ainda não foi preenchido), o `UserContext` deve combinar informações do Supabase Auth (ex: `email: user.email || ''`) para fornecer dados básicos.

3.  **Controle de Acesso Centralizado**:
    * Componentes devem usar as propriedades do `userData.role` (ou `userConditions`) para determinar permissões de visualização e ação na UI.
    * Mantenha consistência nas verificações de papéis (`organization_admin` vs. outros papéis) para evitar inconsistências de segurança.

4.  **Revalidação**:
    * Após qualquer operação que modifique o perfil do usuário (ex: atualização de nome, mudança de papel), é fundamental chamar `WorkspaceUserData()` para garantir que o estado do contexto esteja sincronizado.
    * Combinar com `revalidatePath()` nas Server Actions relevantes para garantir que os Server Components que dependem desses dados também sejam atualizados.