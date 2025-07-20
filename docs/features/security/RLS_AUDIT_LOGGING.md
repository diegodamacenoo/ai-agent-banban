# Sistema de Audit Logging para RLS

## Sumário Executivo
Este documento detalha o sistema de audit logging implementado para monitorar operações críticas nas tabelas core protegidas por Row Level Security (RLS). O sistema registra todas as operações de modificação de dados e violações de política, permitindo rastreabilidade completa e análise de segurança.

## Estrutura do Sistema

### 1. Tabela de Logs

#### 1.1 Estrutura
```sql
CREATE TABLE rls_audit_logs (
    id UUID PRIMARY KEY,
    timestamp TIMESTAMPTZ,
    user_id UUID,
    organization_id UUID,
    operation_type rls_operation_type,
    entity_type rls_entity_type,
    entity_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN,
    error_message TEXT,
    request_id UUID
);
```

#### 1.2 Tipos ENUM
- `rls_operation_type`: INSERT, UPDATE, DELETE, POLICY_VIOLATION
- `rls_entity_type`: core_suppliers, core_locations, core_products

#### 1.3 Índices
- `idx_rls_audit_logs_user_id`
- `idx_rls_audit_logs_organization_id`
- `idx_rls_audit_logs_timestamp`
- `idx_rls_audit_logs_operation_entity`

### 2. Funções Principais

#### 2.1 Registro de Operações
```sql
log_rls_operation(
    p_operation_type,
    p_entity_type,
    p_entity_id,
    p_old_data,
    p_new_data,
    p_success,
    p_error_message
)
```

#### 2.2 Registro de Violações
```sql
log_rls_policy_violation(
    p_entity_type,
    p_entity_id,
    p_error_message
)
```

#### 2.3 Consulta de Logs
```sql
get_rls_audit_logs(
    p_start_date,
    p_end_date,
    p_entity_type,
    p_operation_type,
    p_success
)
```

### 3. Triggers Automáticos

Implementados para cada tabela core:
- `trg_suppliers_audit`
- `trg_locations_audit`
- `trg_products_audit`

## Funcionalidades

### 1. Registro Automático
- Todas as operações INSERT, UPDATE e DELETE
- Captura de dados antes e depois da operação
- Registro de metadados (IP, User Agent, timestamp)
- Identificação de usuário e organização

### 2. Registro de Violações
- Tentativas de acesso não autorizado
- Violações de política RLS
- Erros de operação

### 3. Controle de Acesso
- Logs visíveis apenas para admins
- Isolamento por organização
- Proteção RLS na própria tabela de logs

## Consulta e Análise

### 1. Filtros Disponíveis
- Intervalo de datas
- Tipo de operação
- Tipo de entidade
- Status de sucesso
- Organização

### 2. Campos Rastreados
- Identificação completa do usuário
- Contexto da requisição
- Dados modificados
- Timestamp preciso
- ID único da requisição

## Considerações de Segurança

### 1. Proteção de Dados
- Funções SECURITY DEFINER
- Search path explícito
- Validações em múltiplas camadas

### 2. Performance
- Índices otimizados
- Dados JSONB para flexibilidade
- Particionamento temporal implícito

### 3. Compliance
- Rastreabilidade completa
- Não-repúdio de operações
- Preservação de histórico

## Exemplos de Uso

### 1. Consulta de Operações por Usuário
```sql
SELECT * FROM get_rls_audit_logs(
    p_start_date := NOW() - INTERVAL '24 hours',
    p_success := true
) WHERE user_id = 'specific_user_id';
```

### 2. Análise de Violações
```sql
SELECT * FROM get_rls_audit_logs(
    p_operation_type := 'POLICY_VIOLATION',
    p_start_date := NOW() - INTERVAL '7 days'
);
```

### 3. Auditoria de Mudanças
```sql
SELECT 
    timestamp,
    user_id,
    operation_type,
    old_data,
    new_data
FROM get_rls_audit_logs(
    p_entity_type := 'core_suppliers',
    p_operation_type := 'UPDATE'
);
```

## Manutenção e Monitoramento

### 1. Rotina de Limpeza
Recomenda-se implementar:
- Retenção de logs por 90 dias
- Arquivamento de logs antigos
- Backup regular da tabela

### 2. Alertas
Configurar alertas para:
- Violações frequentes de política
- Operações em massa
- Tentativas de acesso não autorizado

### 3. Relatórios
Gerar relatórios periódicos de:
- Atividade por usuário
- Violações de segurança
- Padrões de uso

## Próximos Passos

### 1. Melhorias Sugeridas
- Implementar particionamento por data
- Adicionar compressão de dados
- Criar views materializadas para relatórios comuns

### 2. Integrações
- Conectar com sistema de alertas
- Integrar com ferramentas de análise
- Exportação automatizada de relatórios

### 3. Documentação Adicional
- Criar guias de troubleshooting
- Documentar casos de uso específicos
- Manter exemplos atualizados 