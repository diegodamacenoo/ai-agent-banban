# Schema do Sistema Axon Core

## Visão Geral

O sistema Axon Core é responsável pela infraestrutura multi-tenant, segurança, auditoria e controle administrativo. Este schema é compartilhado por todos os clientes e contém as tabelas essenciais para o funcionamento do sistema.

## 📋 Índice

1. [Módulo Administrativo](#módulo-administrativo)
2. [Módulo de Segurança](#módulo-de-segurança)
3. [Módulo de Auditoria](#módulo-de-auditoria)
4. [Módulo Multi-Tenant](#módulo-multi-tenant)
5. [Módulo de Webhooks](#módulo-de-webhooks)
6. [Módulo de Notificações](#módulo-de-notificações)
7. [Extensões e Configurações](#extensões-e-configurações)

---

## Módulo Administrativo

### `organizations`

**Função**: Organizações multi-tenant do sistema.

| Campo                        | Tipo        | Obrigatório | Descrição                         | Exemplo                    |
| ---------------------------- | ----------- | ----------- | --------------------------------- | -------------------------- |
| `id`                         | UUID        | ✅          | PK interna                        | `uuid_generate_v4()`       |
| `company_legal_name`         | TEXT        | ✅          | Razão social                      | `Empresa ABC Ltda`         |
| `company_trading_name`       | TEXT        | ✅          | Nome fantasia                     | `ABC Store`                |
| `slug`                       | TEXT        | ✅          | Identificador único para URLs     | `abc-store`                |
| `client_type`                | TEXT        | ❌          | Tipo de cliente (multi-tenant)    | `standard`, `enterprise`   |
| `custom_backend_url`         | TEXT        | ❌          | URL backend customizado           | `https://api.abc.com`      |
| `implementation_config`      | JSONB       | ❌          | Configurações de implementação    | `{"modules": ["inventory"]}`|
| `is_implementation_complete` | BOOLEAN     | ❌          | Status da implementação           | `true`                     |
| `deleted_at`                 | TIMESTAMPTZ | ❌          | Soft delete timestamp             | `null`                     |
| `created_at`                 | TIMESTAMPTZ | ✅          | Data de criação                   | `now()`                    |
| `updated_at`                 | TIMESTAMPTZ | ✅          | Data de atualização               | `now()`                    |

**Constraints**:
- `slug` UNIQUE (quando `deleted_at IS NULL`)
- Slug gerado automaticamente a partir do nome fantasia

### `profiles`

**Função**: Perfis de usuários do sistema (complementa auth.users do Supabase).

| Campo             | Tipo        | Obrigatório | Descrição                    | Exemplo                  |
| ----------------- | ----------- | ----------- | ---------------------------- | ------------------------ |
| `id`              | UUID        | ✅          | PK = auth.users.id           | `uuid_generate_v4()`     |
| `first_name`      | TEXT        | ✅          | Primeiro nome                | `João`                   |
| `last_name`       | TEXT        | ✅          | Sobrenome                    | `Silva`                  |
| `role`            | TEXT        | ✅          | Papel do usuário             | `master_admin`, `admin`  |
| `status`          | TEXT        | ✅          | Status da conta              | `active`, `suspended`    |
| `organization_id` | UUID        | ✅          | FK → `organizations.id`      | —                        |
| `created_at`      | TIMESTAMPTZ | ✅          | Data de criação              | `now()`                  |
| `updated_at`      | TIMESTAMPTZ | ✅          | Data de atualização          | `now()`                  |

**Nota**: O email do usuário está em `auth.users`, não na tabela `profiles`.

### `user_invites`

**Função**: Convites de usuários pendentes.

| Campo             | Tipo        | Obrigatório | Descrição                    | Exemplo                    |
| ----------------- | ----------- | ----------- | ---------------------------- | -------------------------- |
| `id`              | UUID        | ✅          | PK interna                   | `uuid_generate_v4()`       |
| `email`           | TEXT        | ✅          | Email do convidado           | `user@example.com`         |
| `role`            | TEXT        | ✅          | Papel a ser atribuído        | `admin`, `user`            |
| `organization_id` | UUID        | ✅          | FK → organizations.id        | —                          |
| `invited_by`      | UUID        | ✅          | FK → auth.users.id           | —                          |
| `status`          | TEXT        | ✅          | Status do convite            | `pending`, `accepted`      |
| `expires_at`      | TIMESTAMPTZ | ✅          | Data de expiração            | `now() + interval '7 days'`|
| `created_at`      | TIMESTAMPTZ | ✅          | Data de criação              | `now()`                    |
| `updated_at`      | TIMESTAMPTZ | ✅          | Data de atualização          | `now()`                    |

---

## Módulo de Segurança

### `user_sessions`

**Função**: Controle de sessões ativas dos usuários.

| Campo             | Tipo        | Obrigatório | Descrição                    | Exemplo                    |
| ----------------- | ----------- | ----------- | ---------------------------- | -------------------------- |
| `id`              | UUID        | ✅          | PK interna                   | `uuid_generate_v4()`       |
| `user_id`         | UUID        | ✅          | FK → auth.users.id           | —                          |
| `session_token`   | TEXT        | ✅          | Token da sessão              | `jwt_token_hash`           |
| `ip_address`      | INET        | ❌          | Endereço IP                  | `192.168.1.1`             |
| `user_agent`      | TEXT        | ❌          | User agent                   | `Mozilla/5.0...`           |
| `expires_at`      | TIMESTAMPTZ | ✅          | Data de expiração            | `now() + interval '24 hours'`|
| `created_at`      | TIMESTAMPTZ | ✅          | Data de criação              | `now()`                    |
| `last_accessed`   | TIMESTAMPTZ | ✅          | Último acesso                | `now()`                    |

### `user_known_devices`

**Função**: Dispositivos conhecidos dos usuários para segurança.

| Campo             | Tipo        | Obrigatório | Descrição                    | Exemplo                    |
| ----------------- | ----------- | ----------- | ---------------------------- | -------------------------- |
| `id`              | UUID        | ✅          | PK interna                   | `uuid_generate_v4()`       |
| `user_id`         | UUID        | ✅          | FK → auth.users.id           | —                          |
| `device_fingerprint` | TEXT     | ✅          | Fingerprint do dispositivo   | `browser_fp_hash`          |
| `device_name`     | TEXT        | ❌          | Nome do dispositivo          | `Chrome on Windows`        |
| `ip_address`      | INET        | ❌          | Endereço IP                  | `192.168.1.1`             |
| `user_agent`      | TEXT        | ❌          | User agent                   | `Mozilla/5.0...`           |
| `trusted`         | BOOLEAN     | ✅          | Dispositivo confiável        | `true`                     |
| `last_used`       | TIMESTAMPTZ | ✅          | Último uso                   | `now()`                    |
| `created_at`      | TIMESTAMPTZ | ✅          | Data de criação              | `now()`                    |

### `security_alerts`

**Função**: Alertas de segurança do sistema.

| Campo             | Tipo        | Obrigatório | Descrição                    | Exemplo                    |
| ----------------- | ----------- | ----------- | ---------------------------- | -------------------------- |
| `id`              | UUID        | ✅          | PK interna                   | `uuid_generate_v4()`       |
| `user_id`         | UUID        | ❌          | FK → auth.users.id           | —                          |
| `organization_id` | UUID        | ✅          | FK → organizations.id        | —                          |
| `alert_type`      | TEXT        | ✅          | Tipo do alerta               | `SUSPICIOUS_LOGIN`         |
| `severity`        | TEXT        | ✅          | Severidade                   | `HIGH`, `MEDIUM`, `LOW`    |
| `title`           | TEXT        | ✅          | Título do alerta             | `Login suspeito detectado` |
| `description`     | TEXT        | ✅          | Descrição detalhada          | `Login de IP não reconhecido`|
| `metadata`        | JSONB       | ❌          | Metadados adicionais         | `{"ip": "1.2.3.4"}`       |
| `status`          | TEXT        | ✅          | Status do alerta             | `OPEN`, `RESOLVED`         |
| `resolved_at`     | TIMESTAMPTZ | ❌          | Data de resolução            | `null`                     |
| `resolved_by`     | UUID        | ❌          | FK → auth.users.id           | —                          |
| `created_at`      | TIMESTAMPTZ | ✅          | Data de criação              | `now()`                    |

### `security_alert_history`

**Função**: Histórico de alterações dos alertas de segurança.

| Campo             | Tipo        | Obrigatório | Descrição                    | Exemplo                    |
| ----------------- | ----------- | ----------- | ---------------------------- | -------------------------- |
| `id`              | UUID        | ✅          | PK interna                   | `uuid_generate_v4()`       |
| `alert_id`        | UUID        | ✅          | FK → security_alerts.id      | —                          |
| `changed_by`      | UUID        | ✅          | FK → auth.users.id           | —                          |
| `action`          | TEXT        | ✅          | Ação realizada               | `RESOLVED`, `REOPENED`     |
| `old_status`      | TEXT        | ❌          | Status anterior              | `OPEN`                     |
| `new_status`      | TEXT        | ❌          | Novo status                  | `RESOLVED`                 |
| `notes`           | TEXT        | ❌          | Observações                  | `Falso positivo`           |
| `created_at`      | TIMESTAMPTZ | ✅          | Data de criação              | `now()`                    |

---

## Módulo de Auditoria

### `audit_logs`

**Função**: Log de auditoria de todas as ações do sistema.

| Campo             | Tipo        | Obrigatório | Descrição                    | Exemplo                    |
| ----------------- | ----------- | ----------- | ---------------------------- | -------------------------- |
| `id`              | UUID        | ✅          | PK interna                   | `uuid_generate_v4()`       |
| `user_id`         | UUID        | ❌          | FK → auth.users.id           | —                          |
| `organization_id` | UUID        | ✅          | FK → organizations.id        | —                          |
| `action`          | TEXT        | ✅          | Ação realizada               | `CREATE_USER`, `LOGIN`     |
| `resource_type`   | TEXT        | ✅          | Tipo de recurso              | `USER`, `PRODUCT`          |
| `resource_id`     | TEXT        | ❌          | ID do recurso                | `user_123`                 |
| `details`         | JSONB       | ❌          | Detalhes da ação             | `{"field": "status"}`      |
| `ip_address`      | INET        | ❌          | Endereço IP                  | `192.168.1.1`             |
| `user_agent`     | TEXT        | ❌          | User agent do navegador      | `Mozilla/5.0...`           |
| `created_at`      | TIMESTAMPTZ | ✅          | Data de criação              | `now()`                    |

---

## Módulo Multi-Tenant

### `custom_modules`

**Função**: Módulos customizados por organização.

| Campo             | Tipo        | Obrigatório | Descrição                    | Exemplo                    |
| ----------------- | ----------- | ----------- | ---------------------------- | -------------------------- |
| `id`              | UUID        | ✅          | PK interna                   | `uuid_generate_v4()`       |
| `organization_id` | UUID        | ✅          | FK → organizations.id        | —                          |
| `module_name`     | TEXT        | ✅          | Nome do módulo               | `advanced_analytics`       |
| `module_config`   | JSONB       | ✅          | Configuração do módulo       | `{"features": ["reports"]}` |
| `enabled`         | BOOLEAN     | ✅          | Módulo habilitado            | `true`                     |
| `version`         | TEXT        | ✅          | Versão do módulo             | `1.0.0`                    |
| `created_at`      | TIMESTAMPTZ | ✅          | Data de criação              | `now()`                    |
| `updated_at`      | TIMESTAMPTZ | ✅          | Data de atualização          | `now()`                    |

### `implementation_templates`

**Função**: Templates de implementação para novos clientes.

| Campo             | Tipo        | Obrigatório | Descrição                    | Exemplo                    |
| ----------------- | ----------- | ----------- | ---------------------------- | -------------------------- |
| `id`              | UUID        | ✅          | PK interna                   | `uuid_generate_v4()`       |
| `template_name`   | TEXT        | ✅          | Nome do template             | `retail_standard`          |
| `description`     | TEXT        | ❌          | Descrição                    | `Template padrão varejo`   |
| `config_schema`   | JSONB       | ✅          | Schema de configuração       | `{"modules": []}`          |
| `default_config`  | JSONB       | ✅          | Configuração padrão          | `{"inventory": true}`      |
| `active`          | BOOLEAN     | ✅          | Template ativo               | `true`                     |
| `created_at`      | TIMESTAMPTZ | ✅          | Data de criação              | `now()`                    |
| `updated_at`      | TIMESTAMPTZ | ✅          | Data de atualização          | `now()`                    |

---

## Módulo de Webhooks

### `webhook_logs`

**Função**: Log de webhooks enviados/recebidos.

| Campo             | Tipo        | Obrigatório | Descrição                    | Exemplo                    |
| ----------------- | ----------- | ----------- | ---------------------------- | -------------------------- |
| `id`              | UUID        | ✅          | PK interna                   | `uuid_generate_v4()`       |
| `organization_id` | UUID        | ✅          | FK → organizations.id        | —                          |
| `webhook_type`    | TEXT        | ✅          | Tipo do webhook              | `sales_flow`               |
| `event_type`      | TEXT        | ✅          | Tipo do evento               | `sale_completed`           |
| `payload`         | JSONB       | ✅          | Payload do webhook           | `{"order_id": "123"}`      |
| `response_status` | INTEGER     | ❌          | Status HTTP da resposta      | `200`                      |
| `response_body`   | TEXT        | ❌          | Corpo da resposta            | `{"success": true}`        |
| `processing_time_ms` | INTEGER  | ❌          | Tempo de processamento       | `150`                      |
| `error_message`   | TEXT        | ❌          | Mensagem de erro             | `Connection timeout`       |
| `retry_count`     | INTEGER     | ✅          | Número de tentativas         | `0`                        |
| `created_at`      | TIMESTAMPTZ | ✅          | Data de criação              | `now()`                    |

### `webhook_subscriptions`

**Função**: Inscrições de webhooks por organização.

| Campo             | Tipo        | Obrigatório | Descrição                    | Exemplo                    |
| ----------------- | ----------- | ----------- | ---------------------------- | -------------------------- |
| `id`              | UUID        | ✅          | PK interna                   | `uuid_generate_v4()`       |
| `organization_id` | UUID        | ✅          | FK → organizations.id        | —                          |
| `webhook_type`    | TEXT        | ✅          | Tipo do webhook              | `sales_flow`               |
| `endpoint_url`    | TEXT        | ✅          | URL do endpoint              | `https://api.client.com/webhook`|
| `secret_key`      | TEXT        | ❌          | Chave secreta                | `webhook_secret_123`       |
| `active`          | BOOLEAN     | ✅          | Webhook ativo                | `true`                     |
| `created_at`      | TIMESTAMPTZ | ✅          | Data de criação              | `now()`                    |
| `updated_at`      | TIMESTAMPTZ | ✅          | Data de atualização          | `now()`                    |

---

## Módulo de Notificações

### `user_consents`

**Função**: Consentimentos LGPD/GDPR dos usuários.

| Campo             | Tipo        | Obrigatório | Descrição                    | Exemplo                    |
| ----------------- | ----------- | ----------- | ---------------------------- | -------------------------- |
| `id`              | UUID        | ✅          | PK interna                   | `uuid_generate_v4()`       |
| `user_id`         | UUID        | ✅          | FK → auth.users.id           | —                          |
| `consent_type`    | TEXT        | ✅          | Tipo de consentimento        | `DATA_PROCESSING`          |
| `granted`         | BOOLEAN     | ✅          | Consentimento concedido      | `true`                     |
| `granted_at`      | TIMESTAMPTZ | ❌          | Data de concessão            | `now()`                    |
| `revoked_at`      | TIMESTAMPTZ | ❌          | Data de revogação            | `null`                     |
| `ip_address`      | INET        | ❌          | IP da concessão              | `192.168.1.1`             |
| `user_agent`      | TEXT        | ❌          | User agent                   | `Mozilla/5.0...`           |
| `created_at`      | TIMESTAMPTZ | ✅          | Data de criação              | `now()`                    |
| `updated_at`      | TIMESTAMPTZ | ✅          | Data de atualização          | `now()`                    |

### `notification_preferences`

**Função**: Preferências de notificação dos usuários.

| Campo             | Tipo        | Obrigatório | Descrição                    | Exemplo                    |
| ----------------- | ----------- | ----------- | ---------------------------- | -------------------------- |
| `id`              | UUID        | ✅          | PK interna                   | `uuid_generate_v4()`       |
| `user_id`         | UUID        | ✅          | FK → auth.users.id           | —                          |
| `notification_type` | TEXT      | ✅          | Tipo de notificação          | `EMAIL_ALERTS`             |
| `enabled`         | BOOLEAN     | ✅          | Notificação habilitada       | `true`                     |
| `frequency`       | TEXT        | ❌          | Frequência                   | `IMMEDIATE`, `DAILY`       |
| `created_at`      | TIMESTAMPTZ | ✅          | Data de criação              | `now()`                    |
| `updated_at`      | TIMESTAMPTZ | ✅          | Data de atualização          | `now()`                    |

### `user_deletion_requests`

**Função**: Solicitações de exclusão de conta (LGPD/GDPR).

| Campo             | Tipo        | Obrigatório | Descrição                    | Exemplo                    |
| ----------------- | ----------- | ----------- | ---------------------------- | -------------------------- |
| `id`              | UUID        | ✅          | PK interna                   | `uuid_generate_v4()`       |
| `user_id`         | UUID        | ✅          | FK → auth.users.id           | —                          |
| `reason`          | TEXT        | ❌          | Motivo da exclusão           | `GDPR request`             |
| `status`          | TEXT        | ✅          | Status da solicitação        | `pending`, `completed`     |
| `requested_at`    | TIMESTAMPTZ | ✅          | Data da solicitação          | `now()`                    |
| `processed_at`    | TIMESTAMPTZ | ❌          | Data do processamento        | `null`                     |
| `processed_by`    | UUID        | ❌          | FK → auth.users.id           | —                          |

---

## Extensões e Configurações

### Extensões Ativas no Supabase
- **pgcrypto** (1.3): Funções criptográficas
- **pgjwt** (0.2.0): API JWT para PostgreSQL  
- **uuid-ossp** (1.1): Geração de UUIDs
- **pg_stat_statements** (1.10): Estatísticas de queries
- **pg_graphql** (1.5.11): Suporte GraphQL
- **supabase_vault** (0.3.1): Extensão Vault do Supabase
- **plpgsql** (1.0): Linguagem procedural PL/pgSQL

### Políticas RLS (Row Level Security)

#### Organizações
```sql
-- Usuários só podem ver sua própria organização
CREATE POLICY "Users can only see their own organization" ON organizations
FOR SELECT USING (id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
```

#### Profiles
```sql
-- Usuários podem ver profiles da mesma organização
CREATE POLICY "Users can see profiles from same organization" ON profiles
FOR SELECT USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
```

#### Audit Logs
```sql
-- Usuários podem ver logs da própria organização
CREATE POLICY "Users can see audit logs from same organization" ON audit_logs
FOR SELECT USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
```

### Funções de Segurança

#### Função de Teste RLS
```sql
CREATE OR REPLACE FUNCTION test_rls_function(p_user_id UUID, p_organization_id UUID)
RETURNS TABLE(can_access BOOLEAN, user_org_id UUID, target_org_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (p.organization_id = p_organization_id) as can_access,
        p.organization_id as user_org_id,
        p_organization_id as target_org_id
    FROM profiles p
    WHERE p.id = p_user_id;
END;
$$;
```

---

## Migrações Recentes

### Últimas 10 Migrações do Sistema Core

1. **`fix-test-rls-function-with-jwt-override`** (2025-06-22)
   - Correção da função de teste RLS com override JWT

2. **`fix-test-rls-function-for-security-definer`** (2025-06-22)
   - Correção da função de teste RLS para security definer

3. **`create_test_rls_function`** (2025-06-22)
   - Criação de função de teste para políticas RLS

4. **`fix_rls_policy_and_add_deleted_at`** (2025-06-21)
   - Correção das políticas RLS para user_known_devices
   - Adição da coluna deleted_at na tabela organizations

5. **`add_master_admin_policies`** (2025-06-20)
   - Adição de políticas RLS para o papel master_admin

6. **`add_master_admin_role`** (2025-06-20)
   - Criação do papel master_admin no sistema

7. **`extend_organizations_multi_tenant`** (2025-06-19)
   - Extensão da tabela organizations para suporte multi-tenant avançado

8. **`create_webhook_monitoring_tables`** (2025-06-19)
   - Criação das tabelas de monitoramento de webhooks

9. **`create_implementation_templates_table`** (2025-06-19)
   - Criação da tabela de templates de implementação

10. **`create_custom_modules_table`** (2025-06-19)
    - Criação da tabela de módulos customizados

---

## Queries Administrativas Comuns

### 1. Listar Organizações Ativas
```sql
SELECT 
    id,
    company_trading_name,
    slug,
    client_type,
    is_implementation_complete,
    created_at
FROM organizations
WHERE deleted_at IS NULL
ORDER BY created_at DESC;
```

### 2. Usuários por Organização
```sql
SELECT 
    o.company_trading_name,
    p.first_name || ' ' || p.last_name as full_name,
    p.role,
    p.status,
    u.email
FROM profiles p
JOIN organizations o ON p.organization_id = o.id
JOIN auth.users u ON p.id = u.id
WHERE o.deleted_at IS NULL
ORDER BY o.company_trading_name, p.first_name;
```

### 3. Alertas de Segurança Ativos
```sql
SELECT 
    sa.title,
    sa.severity,
    sa.alert_type,
    o.company_trading_name,
    sa.created_at
FROM security_alerts sa
JOIN organizations o ON sa.organization_id = o.id
WHERE sa.status = 'OPEN'
ORDER BY sa.created_at DESC;
```

### 4. Logs de Auditoria Recentes
```sql
SELECT 
    al.action,
    al.resource_type,
    p.first_name || ' ' || p.last_name as user_name,
    o.company_trading_name,
    al.created_at
FROM audit_logs al
JOIN profiles p ON al.user_id = p.id
JOIN organizations o ON al.organization_id = o.id
WHERE al.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY al.created_at DESC;
```

---

_Documentação do Sistema Axon Core - Janeiro 2025_
_Versão 4.0 - Sistema Multi-Tenant Completo_
_Total de Migrações: 39 aplicadas_ 