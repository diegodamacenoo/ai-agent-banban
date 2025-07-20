# Análise de Adaptação do Modelo Genérico

Este documento detalha a migração do modelo de dados específico do cliente Banban (baseado em tabelas `core_*`) para o novo modelo de dados genérico e multi-tenant (baseado em tabelas `tenant_business_*`). Ele também analisa a implementação das APIs de fluxo (`inventory-flow`, `purchase-flow`, `sales-flow`, `transfer-flow`) em relação a este novo modelo.

O objetivo é demonstrar como o modelo genérico não só acomodou todos os requisitos do sistema legado, mas também proporcionou maior flexibilidade e capacidade de extensão, como validado pela implementação dos novos fluxos de negócio.

## Seção 1: Mapeamento de Entidades (De-Para: `core_*` para `tenant_business_*`)

A tabela a seguir resume a transformação das tabelas legadas para a nova arquitetura genérica, um pilar da migração para um sistema mais flexível e escalável [[memory:75363]].

| Tabela Antiga (`core_*`)                                                     | Tabela Genérica (`tenant_business_*`) | Tipo/Configuração na Tabela Genérica                                     | Notas sobre a Migração                                                                                                                                    |
| :--------------------------------------------------------------------------- | :------------------------------------ | :----------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core_locations`, `core_suppliers`, `core_products`, `core_product_variants` | `tenant_business_entities`            | `entity_type`: 'LOCATION', 'SUPPLIER', 'PRODUCT', 'PRODUCT_VARIANT'      | Entidades de negócio primárias foram consolidadas, usando `entity_type` para diferenciação.                                                               |
| `core_product_pricing`                                                       | `tenant_business_entities`            | `entity_type`: 'PRICE'                                                   | O preço, antes uma tabela de junção, tornou-se uma entidade própria, vinculada a um produto via `tenant_business_relationships` com o tipo `PRICED_AS`.   |
| `core_orders`                                                                | `tenant_business_transactions`        | `transaction_type`: 'PURCHASE_ORDER', 'TRANSFER_ORDER'                   | "Compromissos" de movimentação (pedidos) são agora transações de um tipo específico.                                                                      |
| `core_documents`                                                             | `tenant_business_transactions`        | `transaction_type`: 'SUPPLIER_INVOICE', 'TRANSFER_OUT', 'SALE', 'RETURN' | Documentos fiscais e comerciais que oficializam as operações também foram modelados como transações.                                                      |
| `core_order_items`, `core_document_items`                                    | `tenant_business_transactions`        | Itens armazenados no campo `data: { items: [...] }` (JSONB)              | A lista de itens foi movida para dentro de um campo JSONB na transação pai, eliminando tabelas de junção e aumentando a flexibilidade.                    |
| `core_movements`                                                             | `tenant_business_events`              | `event_code`: 'STOCK_MOVEMENT' associado a uma transação                 | Movimentações de estoque agora são registradas como eventos que ocorrem como resultado da efetivação de uma transação (ex: 'SALE' ou 'SUPPLIER_INVOICE'). |
| `core_inventory_snapshots`                                                   | `tenant_snapshots`                    | `snapshot_type`: 'INVENTORY_ON_HAND'                                     | O conceito de "foto" do estoque foi mantido, mapeando diretamente para a tabela de snapshots genérica.                                                    |
| `core_events`                                                                | `tenant_business_events`              | `event_code` mapeado para os status do workflow.                         | A capacidade de auditoria foi preservada e expandida, centralizando todas as mudanças de estado na tabela de eventos.                                     |

## Seção 2: Mapeamento de Fluxos de Trabalho (Workflow para Transações/Eventos)

O fluxo de trabalho detalhado do cliente Banban foi totalmente mapeado para o novo modelo de transações e eventos, garantindo que a lógica de negócio seja preservada.

### Processo: Pedido de Compra e Recebimento

| Passo no Workflow (Banban)       | Objeto no Modelo Genérico      | Tipo (`transaction_type` / `event_code`)    | Notas                                                              |
| :------------------------------- | :----------------------------- | :------------------------------------------ | :----------------------------------------------------------------- |
| Criação da Ordem de Compra       | `tenant_business_transactions` | `transaction_type`: 'PURCHASE_ORDER'        | O evento `order_created` é registrado em `tenant_business_events`. |
| Fornecedor Fatura NF             | `tenant_business_transactions` | `transaction_type`: 'SUPPLIER_INVOICE'      | Nova transação relacionada à `PURCHASE_ORDER` original.            |
| Atualiza Status: pré-baixa       | `tenant_business_events`       | `event_code`: 'PRE_RECEIPT_CREATED'         | Evento associado à transação `SUPPLIER_INVOICE`.                   |
| Carga Chega no CD                | `tenant_business_events`       | `event_code`: 'RECEIPT_ARRIVED_AT_CD'       | Registra a chegada física da mercadoria.                           |
| Em Conferência                   | `tenant_business_events`       | `event_code`: 'RECEIPT_CONFERENCE_STARTED'  | Indica o início do processo de verificação.                        |
| Conferido (c/ ou s/ divergência) | `tenant_business_events`       | `event_code`: 'RECEIPT_CONFERENCE_FINISHED' | O `payload` do evento contém os detalhes de qualquer divergência.  |
| Efetivado                        | `tenant_business_events`       | `event_code`: 'RECEIPT_EFFECTIVE'           | Dispara a movimentação de estoque (`STOCK_MOVEMENT`).              |

### Processo: Transferência entre Locais

| Passo no Workflow (Banban)         | Objeto no Modelo Genérico      | Tipo (`transaction_type` / `event_code`)          | Notas                                                                |
| :--------------------------------- | :----------------------------- | :------------------------------------------------ | :------------------------------------------------------------------- |
| Criação do pedido de transferência | `tenant_business_transactions` | `transaction_type`: 'TRANSFER_ORDER'              | Inicia o fluxo de transferência interna.                             |
| Criação do mapa de separação       | `tenant_business_events`       | `event_code`: 'SEPARATION_MAP_CREATED'            | Evento que marca o planejamento da separação.                        |
| Em Separação (bipagem)             | `tenant_business_events`       | `event_code`: 'SEPARATION_IN_PROGRESS'            | O `payload` do evento pode ser atualizado com divergências parciais. |
| Embarcado (doca)                   | `tenant_business_events`       | `event_code`: 'TRANSFER_EMBARKED'                 | Mercadoria em trânsito. Dispara a criação da NF (`TRANSFER_OUT`).    |
| Chegada em Loja (conferência)      | `tenant_business_events`       | `event_code`: 'STORE_RECEIPT_CONFERENCE_FINISHED' | Loja de destino confirma o recebimento e as quantidades.             |
| Efetivado Loja                     | `tenant_business_events`       | `event_code`: 'STORE_RECEIPT_EFFECTIVE'           | Atualiza o estoque da loja de destino.                               |

### Processo: Venda e Devolução

| Passo no Workflow (Banban) | Objeto no Modelo Genérico      | Tipo (`transaction_type` / `event_code`) | Notas                                                           |
| :------------------------- | :----------------------------- | :--------------------------------------- | :-------------------------------------------------------------- |
| Cliente Compra             | `tenant_business_transactions` | `transaction_type`: 'SALE'               | Registra a venda final. Sua efetivação gera a saída de estoque. |
| Cliente Devolve Produto    | `tenant_business_transactions` | `transaction_type`: 'RETURN'             | Registra a devolução. Sua efetivação gera a entrada de estoque. |

## Seção 3: Análise de Extensões do Modelo

As "diferenças" observadas entre o modelo genérico teórico e a implementação prática não são inconsistências, mas sim extensões naturais que validam a flexibilidade do design.

### 3.1. Novos Tipos de Entidade (`entity_type`)

| Aspecto         | Modelo Teórico                    | Implementação Prática (`BanBanInventoryFlowService`) | Análise                                                                                                                                                            |
| :-------------- | :-------------------------------- | :--------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tipos Base**  | `LOCATION`, `SUPPLIER`, `PRODUCT` | Mantidos                                             | Os tipos básicos foram preservados.                                                                                                                                |
| **Novos Tipos** | -                                 | `INVENTORY_COUNT`, `INVENTORY_COUNT_ITEM`            | O modelo foi estendido para suportar novas entidades de negócio ("substantivos") como contagens de inventário, sem exigir mudanças na estrutura do banco de dados. |

### 3.2. Novos Tipos de Transação (`transaction_type`)

| Aspecto         | Modelo Teórico                     | Implementação Prática (Vários Serviços)          | Análise                                                                                                                                                            |
| :-------------- | :--------------------------------- | :----------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tipos Base**  | `PURCHASE_ORDER`, `SALE`, `RETURN` | Mantidos                                         | Os tipos de transação fundamentais foram preservados.                                                                                                              |
| **Novos Tipos** | -                                  | `PAYMENT`, `FISCAL_DOCUMENT`, `TRANSFER_REQUEST` | A implementação expandiu o modelo para incluir outros tipos de transações que fazem parte dos fluxos de negócio, como pagamentos e documentos fiscais específicos. |

### 3.3. Uso Expandido de Snapshots (`tenant_snapshots`)

A implementação expandiu significativamente o uso de `tenant_snapshots` para incluir dados de analytics e performance, demonstrando a versatilidade da tabela para armazenar não apenas o estado atual (estoque), mas também métricas e dados analíticos agregados.

| Categoria                | Tipo de Snapshot               | Descrição                              | Origem                                |
| :----------------------- | :----------------------------- | :------------------------------------- | :------------------------------------ |
| **Operacional**          | `INVENTORY_ON_HAND`            | Dados básicos de estoque               | Mapeado de `core_inventory_snapshots` |
| **Analytics - Cliente**  | `CUSTOMER_RFM`                 | Análise RFM do cliente                 | Nova capacidade do modelo genérico    |
| **Analytics - Vendedor** | `SALESPERSON_PERFORMANCE`      | Performance do vendedor                | Nova capacidade do modelo genérico    |
| **Analytics - Produto**  | `LOCATION_PRODUCT_PERFORMANCE` | Performance de produto por localização | Nova capacidade do modelo genérico    |

## Resumo Comparativo

| **Aspecto**                 | **Status**       | **Impacto** | **Validação do Modelo**                         |
| --------------------------- | ---------------- | ----------- | ----------------------------------------------- |
| **Consistência Estrutural** | ✅ Mantida       | Positivo    | Confirma flexibilidade                          |
| **Extensibilidade**         | ✅ Demonstrada   | Positivo    | Valida design genérico                          |
| **Compatibilidade Legada**  | ✅ Total         | Positivo    | Garante que nenhuma funcionalidade foi perdida. |
| **Novas Funcionalidades**   | ✅ Implementadas | Positivo    | Expansão natural para analytics e novos tipos.  |

## Conclusão

A migração do sistema legado do Banban para o modelo genérico foi um sucesso. As "diferenças" observadas não representam inconsistências, mas sim a aplicação prática e a extensão natural do modelo de dados genérico. A análise confirma a flexibilidade e a capacidade de adaptação do design para acomodar os fluxos de trabalho existentes e novas necessidades de negócio, como analytics avançado, sem a necessidade de alterações estruturais fundamentais no esquema do banco de dados.

### Benefícios Identificados

| **Benefício**        | **Descrição**                                         | **Evidência**                                   |
| -------------------- | ----------------------------------------------------- | ----------------------------------------------- |
| **Flexibilidade**    | Modelo suporta novos tipos sem alterações estruturais | Novos `entity_type` e `transaction_type`        |
| **Escalabilidade**   | Capacidade de expansão para analytics avançados       | Múltiplos tipos de snapshots de performance     |
| **Consistência**     | Mantém padrões arquiteturais em um schema unificado   | Uso consistente das tabelas `tenant_business_*` |
| **Manutenibilidade** | Reduz a complexidade ao eliminar tabelas de junção    | Itens de pedido/documento em JSONB              |
