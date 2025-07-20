# Esquema de Banco de Dados - Analytics e Performance

Este documento descreve o esquema de banco de dados para os módulos de Analytics e Performance, incluindo tabelas, índices, políticas RLS e funções auxiliares.

## Módulo de Performance

### Tabelas

#### performance_metrics
Armazena métricas de performance coletadas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único da métrica |
| name | VARCHAR(255) | Nome da métrica |
| value | NUMERIC | Valor da métrica |
| unit | VARCHAR(50) | Unidade de medida |
| tags | JSONB | Tags adicionais em formato JSON |
| organization_id | UUID | ID da organização (FK) |
| created_at | TIMESTAMPTZ | Data de criação |
| deleted_at | TIMESTAMPTZ | Data de exclusão lógica |

#### performance_thresholds
Configuração de limites para alertas de performance.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único do threshold |
| metric_name | VARCHAR(255) | Nome da métrica monitorada |
| min_value | NUMERIC | Valor mínimo permitido |
| max_value | NUMERIC | Valor máximo permitido |
| alert_level | VARCHAR(50) | Nível do alerta (warning/critical) |
| notification_channels | TEXT[] | Canais para notificação |
| organization_id | UUID | ID da organização (FK) |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Data de atualização |
| deleted_at | TIMESTAMPTZ | Data de exclusão lógica |

#### performance_alerts
Registro de alertas gerados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único do alerta |
| metric_id | UUID | ID da métrica (FK) |
| threshold_id | UUID | ID do threshold (FK) |
| current_value | NUMERIC | Valor que gerou o alerta |
| status | VARCHAR(50) | Status do alerta |
| organization_id | UUID | ID da organização (FK) |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Data de atualização |
| deleted_at | TIMESTAMPTZ | Data de exclusão lógica |

## Módulo de Analytics

### Tabelas

#### analytics_dimensions
Dimensões disponíveis para análise.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único da dimensão |
| name | VARCHAR(255) | Nome da dimensão |
| type | VARCHAR(50) | Tipo de dado |
| allowed_values | TEXT[] | Valores permitidos |
| description | TEXT | Descrição da dimensão |
| organization_id | UUID | ID da organização (FK) |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Data de atualização |
| deleted_at | TIMESTAMPTZ | Data de exclusão lógica |

#### analytics_metrics
Métricas configuradas para análise.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único da métrica |
| name | VARCHAR(255) | Nome da métrica |
| description | TEXT | Descrição da métrica |
| unit | VARCHAR(50) | Unidade de medida |
| aggregation_type | VARCHAR(50) | Tipo de agregação |
| dimensions | TEXT[] | Dimensões associadas |
| organization_id | UUID | ID da organização (FK) |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Data de atualização |
| deleted_at | TIMESTAMPTZ | Data de exclusão lógica |

#### analytics_data_points
Pontos de dados coletados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único do ponto |
| category | VARCHAR(255) | Categoria do dado |
| metric | VARCHAR(255) | Nome da métrica |
| value | NUMERIC | Valor do ponto |
| dimensions | JSONB | Dimensões em formato JSON |
| organization_id | UUID | ID da organização (FK) |
| created_at | TIMESTAMPTZ | Data de criação |
| deleted_at | TIMESTAMPTZ | Data de exclusão lógica |

#### analytics_dashboards
Dashboards configurados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único do dashboard |
| name | VARCHAR(255) | Nome do dashboard |
| description | TEXT | Descrição do dashboard |
| widgets | JSONB | Configuração dos widgets |
| organization_id | UUID | ID da organização (FK) |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Data de atualização |
| deleted_at | TIMESTAMPTZ | Data de exclusão lógica |

## Índices

Para otimizar o desempenho das consultas mais comuns, foram criados os seguintes índices:

- `idx_performance_metrics_org_name`: Busca de métricas por organização e nome
- `idx_performance_metrics_created_at`: Filtragem por data de criação
- `idx_performance_thresholds_org_metric`: Busca de thresholds por organização e métrica
- `idx_performance_alerts_org_status`: Filtragem de alertas por organização e status
- `idx_analytics_data_points_org_category`: Busca de dados por organização e categoria
- `idx_analytics_data_points_org_metric`: Busca de dados por organização e métrica
- `idx_analytics_data_points_created_at`: Filtragem por data de criação

## Políticas RLS

Todas as tabelas têm Row Level Security (RLS) habilitado com as seguintes políticas:

### Políticas de Leitura
- Usuários autenticados podem ver apenas dados de sua organização

### Políticas de Inserção
- Usuários autenticados podem inserir dados apenas em sua organização

### Políticas de Atualização
- Usuários autenticados podem atualizar dados apenas de sua organização

## Funções Auxiliares

### calculate_metric_aggregation
Calcula agregações de métricas com diferentes tipos:

```sql
calculate_metric_aggregation(
  p_metric_name TEXT,
  p_organization_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_aggregation_type TEXT
) RETURNS NUMERIC
```

Tipos de agregação suportados:
- sum: Soma total dos valores
- average: Média dos valores
- min: Valor mínimo
- max: Valor máximo
- count: Contagem de registros

## Considerações de Segurança

1. Todas as tabelas têm RLS habilitado
2. Todas as operações são isoladas por organização
3. Soft delete implementado em todas as tabelas
4. Constraints e checks para garantir integridade dos dados
5. Função de agregação marcada como SECURITY DEFINER

## Próximos Passos

1. Implementar funções para cálculos estatísticos avançados
2. Adicionar suporte a particionamento para tabelas de métricas
3. Criar índices adicionais baseado no padrão de uso
4. Implementar sistema de cache para agregações frequentes
5. Adicionar suporte a exportação de dados 