# Referência Completa do Schema do Banco de Dados

## Índice

1. [Visão Geral](#visão-geral)
2. [Módulo Core - Produtos](#módulo-core---produtos)
3. [Módulo Core - Localizações](#módulo-core---localizações)
4. [Módulo Core - Fornecedores](#módulo-core---fornecedores)
5. [Módulo Core - Pedidos](#módulo-core---pedidos)
6. [Módulo Core - Documentos](#módulo-core---documentos)
7. [Módulo Core - Movimentações](#módulo-core---movimentações)
8. [Módulo Core - Eventos](#módulo-core---eventos)
9. [Módulo Core - Estoque](#módulo-core---estoque)
10. [Relacionamentos e Integridade](#relacionamentos-e-integridade)
11. [Queries Comuns](#queries-comuns)
12. [Constraints e Validações](#constraints-e-validações)

---

## Visão Geral

O banco de dados é estruturado em módulos funcionais que representam o fluxo completo de gestão de estoque e operações de varejo:

- **Produtos**: Catálogo de produtos e suas variações
- **Localizações**: Centros de distribuição e lojas
- **Fornecedores**: Gestão de fornecedores e métricas
- **Pedidos**: Pedidos de compra e transferência
- **Documentos**: Notas fiscais e documentos de movimentação
- **Movimentações**: Histórico de entradas e saídas
- **Eventos**: Log de eventos do sistema
- **Estoque**: Snapshots de estoque por localização

---

## Módulo Core - Produtos

### `core_products`

**Função**: Catálogo principal de produtos da empresa.

| Campo                  | Tipo        | Obrigatório | Descrição                          | Exemplo                                |
| ---------------------- | ----------- | ----------- | ---------------------------------- | -------------------------------------- |
| `id`                   | UUID        | ✅          | PK interna, gerada automaticamente | `uuid_generate_v4()`                   |
| `external_id`          | TEXT        | ✅          | Código do produto no ERP           | `PROD2099`                             |
| `product_name`         | TEXT        | ✅          | Nome do produto                    | `Produto Premium`                      |
| `description`          | TEXT        | ✅          | Descrição detalhada                | `Produto premium com tecnologia X`     |
| `category`             | TEXT        | ✅          | Categoria principal                | `CATEGORIA_A`                          |
| `sub_category`         | TEXT        | ❌          | Subcategoria                       | `SUBCATEGORIA_1`                       |
| `gtin`                 | TEXT        | ✅          | Código de barras do produto        | `7891234567890`                        |
| `unit_measure`         | ENUM        | ✅          | Unidade de medida                  | `UND`, `CX`, `KG`                      |
| `folder`               | TEXT        | ✅          | Pasta/coleção                      | `VERÃO 2024`                           |
| `type`                 | TEXT        | ✅          | Tipo do produto                    | `TIPO_A`                               |
| `gender`               | ENUM        | ✅          | Gênero alvo                        | `MAS`, `FEM`, `USX`                    |
| `supplier_external_id` | TEXT        | ✅          | ID do fornecedor no ERP            | `FORN001`                              |
| `status`               | TEXT        | ✅          | Status do produto                  | `Ativo`, `Inativo`                     |
| `created_at`           | TIMESTAMPTZ | ✅          | Data de criação                    | `now()`                                |
| `updated_at`           | TIMESTAMPTZ | ✅          | Data de atualização                | `now()`                                |

**Constraints**:

- `unit_measure` ∈ {'UND', 'CX', 'KG'} (ENUM: `unit_measure_enum`)
- `gender` ∈ {'MAS', 'FEM', 'USX'} (ENUM: `gender_enum`)
- `external_id` UNIQUE

### `core_product_variants`

**Função**: Variações de produtos (cor, tamanho, etc.).

| Campo          | Tipo        | Obrigatório | Descrição                   | Exemplo              |
| -------------- | ----------- | ----------- | --------------------------- | -------------------- |
| `id`           | UUID        | ✅          | PK interna                  | `uuid_generate_v4()` |
| `product_id`   | UUID        | ✅          | FK → `core_products.id`     | —                    |
| `external_id`  | TEXT        | ❌          | Código da variação no ERP   | `PROD2099AZULM`      |
| `size`         | TEXT        | ✅          | Tamanho                     | `P`, `M`, `G`        |
| `color`        | TEXT        | ✅          | Cor                         | `AZUL`, `PRETO`      |
| `gtin_variant` | TEXT        | ❌          | GTIN específico da variação | `7891234567891`      |
| `sku`          | TEXT        | ❌          | SKU gerado automaticamente  | `PROD2099-M-AZUL`    |
| `created_at`   | TIMESTAMPTZ | ✅          | Data de criação             | `now()`              |
| `updated_at`   | TIMESTAMPTZ | ✅          | Data de atualização         | `now()`              |

**Relacionamentos**:

- `product_id` → `core_products.id` (FOREIGN KEY)

### `core_product_pricing`

**Função**: Histórico de preços por variação de produto.

| Campo               | Tipo          | Obrigatório | Descrição                       | Exemplo                         |
| ------------------- | ------------- | ----------- | ------------------------------- | ------------------------------- |
| `id`                | UUID          | ✅          | PK interna                      | `uuid_generate_v4()`            |
| `product_id`        | UUID          | ❌          | FK → `core_products.id`         | —                               |
| `variant_id`        | UUID          | ✅          | FK → `core_product_variants.id` | —                               |
| `price_type`        | TEXT          | ✅          | Tipo de preço                   | `BASE`, `CUSTO`, `PROMO`, `VIP` |
| `price_value`       | NUMERIC(12,4) | ✅          | Valor do preço                  | `199.90`                        |
| `cost_price`        | NUMERIC(12,4) | ❌          | Preço de custo                  | `89.50`                         |
| `margin_percentage` | NUMERIC       | ❌          | Margem percentual               | `55.2`                          |
| `markup_percentage` | NUMERIC       | ❌          | Markup percentual               | `123.4`                         |
| `valid_from`        | DATE          | ✅          | Data início vigência            | `2024-01-01`                    |
| `valid_to`          | DATE          | ❌          | Data fim vigência               | `2024-12-31`                    |
| `change_reason`     | TEXT          | ❌          | Motivo da alteração             | `Reajuste sazonal`              |
| `created_at`        | TIMESTAMPTZ   | ✅          | Data de criação                 | `now()`                         |
| `updated_at`        | TIMESTAMPTZ   | ✅          | Data de atualização             | `now()`                         |

**Constraints**:

- `price_type` ∈ {'BASE', 'CUSTO', 'PROMO', 'VIP'} (não implementado como ENUM no banco atual)
- `price_value` ≥ 0

---

## Módulo Core - Localizações

### `core_locations`

**Função**: Centros de distribuição e lojas da rede.

| Campo           | Tipo        | Obrigatório | Descrição                    | Exemplo                            |
| --------------- | ----------- | ----------- | ---------------------------- | ---------------------------------- |
| `id`            | UUID        | ✅          | PK interna                   | `uuid_generate_v4()`               |
| `external_id`   | TEXT        | ✅          | Código da localização no ERP | `CD001`, `LOJA045`                 |
| `name`          | TEXT        | ✅          | Nome da localização          | `Centro de Distribuição Principal` |
| `location_type` | ENUM        | ✅          | Tipo de localização          | `CD`, `STORE`                      |
| `address`       | TEXT        | ❌          | Endereço completo            | `Rua das Flores, 123`              |
| `created_at`    | TIMESTAMPTZ | ✅          | Data de criação              | `now()`                            |
| `updated_at`    | TIMESTAMPTZ | ✅          | Data de atualização          | `now()`                            |

**Constraints**:

- `location_type` ∈ {'CD', 'STORE'} (ENUM: `location_type_enum`)
- `external_id` UNIQUE

---

## Módulo Core - Fornecedores

### `core_suppliers`

**Função**: Cadastro de fornecedores.

| Campo         | Tipo        | Obrigatório | Descrição                   | Exemplo                             |
| ------------- | ----------- | ----------- | --------------------------- | ----------------------------------- |
| `id`          | UUID        | ✅          | PK interna                  | `uuid_generate_v4()`                |
| `external_id` | TEXT        | ✅          | Código do fornecedor no ERP | `FORN001`                           |
| `trade_name`  | TEXT        | ✅          | Nome fantasia               | `Fornecedor A`                      |
| `legal_name`  | TEXT        | ❌          | Razão social                | `Fornecedor A Indústria Ltda`       |
| `cnpj`        | TEXT        | ❌          | CNPJ                        | `12.345.678/0001-90`                |
| `created_at`  | TIMESTAMPTZ | ✅          | Data de criação             | `now()`                             |
| `updated_at`  | TIMESTAMPTZ | ✅          | Data de atualização         | `now()`                             |

**Constraints**:

- `external_id` UNIQUE

---

## Módulo Core - Pedidos

### `core_orders`

**Função**: Pedidos de compra e transferência.

| Campo                | Tipo        | Obrigatório | Descrição                          | Exemplo                  |
| -------------------- | ----------- | ----------- | ---------------------------------- | ------------------------ |
| `id`                 | UUID        | ✅          | PK interna                         | `uuid_generate_v4()`     |
| `external_id`        | TEXT        | ✅          | Número do pedido no ERP            | `PC2024001`              |
| `supplier_id`        | UUID        | ❌          | FK → `core_suppliers.id`           | —                        |
| `origin_location_id` | UUID        | ❌          | FK → `core_locations.id` (origem)  | —                        |
| `dest_location_id`   | UUID        | ❌          | FK → `core_locations.id` (destino) | —                        |
| `order_type`         | ENUM        | ✅          | Tipo do pedido                     | `PURCHASE`, `TRANSFER`   |
| `status`             | ENUM        | ✅          | Status do pedido                   | `NEW`, `APPROVED`, `CANCELLED` |
| `issue_timestamp`    | TIMESTAMPTZ | ✅          | Data/hora de emissão               | `2024-01-15 10:30:00`    |
| `created_at`         | TIMESTAMPTZ | ✅          | Data de criação                    | `now()`                  |
| `updated_at`         | TIMESTAMPTZ | ✅          | Data de atualização                | `now()`                  |

**Valores para `order_type` (ENUM: `order_type_enum`)** ✅ MIGRADO:
- `PURCHASE`: Pedido de compra realizado a um fornecedor externo.
- `TRANSFER`: Pedido de transferência de mercadorias entre duas localizações internas (ex: CD para Loja).

**Valores para `status` (ENUM: `order_status_enum`)** ✅ MIGRADO:
- `NEW`: O pedido foi criado mas ainda não foi processado ou aprovado.
- `APPROVED`: O pedido foi revisado e aprovado, aguardando os próximos passos (ex: emissão de nota fiscal).
- `CANCELLED`: O pedido foi cancelado e não será processado.

**Constraints**:

- `external_id` UNIQUE
- `order_type` ∈ {'TRANSFER', 'PURCHASE'} (ENUM: `order_type_enum`)
- `status` ∈ {'NEW', 'APPROVED', 'CANCELLED'} (ENUM: `order_status_enum`)

### `core_order_items`

**Função**: Itens dentro de cada pedido.

| Campo           | Tipo          | Obrigatório | Descrição                       | Exemplo              |
| --------------- | ------------- | ----------- | ------------------------------- | -------------------- |
| `id`            | UUID          | ✅          | PK interna                      | `uuid_generate_v4()` |
| `order_id`      | UUID          | ✅          | FK → `core_orders.id`           | —                    |
| `variant_id`    | UUID          | ✅          | FK → `core_product_variants.id` | —                    |
| `item_seq`      | INTEGER       | ✅          | Sequência do item               | `1`, `2`, `3`        |
| `qty_ordered`   | NUMERIC       | ✅          | Quantidade solicitada           | `12.0`               |
| `unit_cost_est` | NUMERIC(12,4) | ✅          | Custo unitário estimado         | `89.50`              |
| `notes`         | TEXT          | ❌          | Observações                     | `Entrega urgente`    |
| `created_at`    | TIMESTAMPTZ   | ✅          | Data de criação                 | `now()`              |
| `updated_at`    | TIMESTAMPTZ   | ✅          | Data de atualização             | `now()`              |

---

## Módulo Core - Documentos

### `core_documents`

**Função**: Documentos fiscais (NFe, etc.).

| Campo                | Tipo        | Obrigatório | Descrição                | Exemplo                             |
| -------------------- | ----------- | ----------- | ------------------------ | ----------------------------------- |
| `id`                 | UUID        | ✅          | PK interna               | `uuid_generate_v4()`                |
| `order_id`           | UUID        | ❌          | FK → `core_orders.id`    | —                                   |
| `external_id`        | TEXT        | ✅          | Número da NF no ERP      | `NFE123456`                         |
| `doc_type`           | ENUM        | ✅          | Tipo do documento        | `SUPPLIER_IN`, `TRANSFER_OUT`, etc. |
| `issue_date`         | DATE        | ✅          | Data de emissão          | `2024-01-15`                        |
| `total_value`        | NUMERIC     | ✅          | Valor total              | `2388.00`                           |
| `status`             | ENUM        | ✅          | Status do documento      | `PENDENTE`, `EFETIVADO_CD`, etc.    |
| `origin_location_id` | UUID        | ❌          | FK → `core_locations.id` | —                                   |
| `dest_location_id`   | UUID        | ❌          | FK → `core_locations.id` | —                                   |
| `created_at`         | TIMESTAMPTZ | ✅          | Data de criação          | `now()`                             |
| `updated_at`         | TIMESTAMPTZ | ✅          | Data de atualização      | `now()`                             |

**Valores para `doc_type` (ENUM: `doc_type_enum`)**:
- `SUPPLIER_IN`: Nota fiscal de entrada de mercadoria vinda de um fornecedor.
- `TRANSFER_OUT`: Nota fiscal de saída para transferência entre localizações da empresa.
- `TRANSFER_IN`: Nota fiscal de entrada por transferência, recebida de outra localização da empresa.
- `RETURN`: Nota fiscal de devolução de cliente.
- `SALE`: Documento fiscal que acompanha uma venda direta ao consumidor.

**Valores para `status` (ENUM: `doc_status_enum`)** - **✅ MIGRADO PARA INGLÊS (Fase 2)**:
- `PENDING`: Documento recebido/criado, mas aguardando processamento (ex: conferência).
- `AWAITING_CD_VERIFICATION`: Aguardando a conferência física dos itens no CD.
- `IN_CD_VERIFICATION`: Processo de conferência em andamento no CD.
- `CD_VERIFIED_NO_DISCREPANCY`: Conferência do CD finalizada sem divergências.
- `CD_VERIFIED_WITH_DISCREPANCY`: Conferência do CD finalizada com divergências encontradas.
- `EFFECTIVE_CD`: Documento processado e estoque atualizado no Centro de Distribuição.
- `TRANSFER_ORDER_CREATED`: Pedido de transferência criado a partir do documento.
- `SEPARATION_MAP_CREATED`: Mapa de separação criado para o documento.
- `AWAITING_CD_SEPARATION`: Aguardando início da separação no CD.
- `IN_CD_SEPARATION`: Processo de separação em andamento no CD.
- `CD_SEPARATED_NO_DISCREPANCY`: Separação do CD finalizada sem divergências.
- `CD_SEPARATED_WITH_DISCREPANCY`: Separação do CD finalizada com divergências.
- `SEPARATED_PRE_DOCK`: Mercadoria separada e aguardando na pré-doca.
- `SHIPPED_CD`: Mercadoria embarcada do CD.

**Constraints**:

- `external_id` UNIQUE
- `doc_type` ∈ (valores do ENUM `doc_type_enum`)
- `status` ∈ (valores do ENUM `doc_status_enum`)

### `core_document_items`

**Função**: Itens de cada documento fiscal.

| Campo              | Tipo          | Obrigatório | Descrição                       | Exemplo              |
| ------------------ | ------------- | ----------- | ------------------------------- | -------------------- |
| `id`               | UUID          | ✅          | PK interna                      | `uuid_generate_v4()` |
| `document_id`      | UUID          | ✅          | FK → `core_documents.id`        | —                    |
| `variant_id`       | UUID          | ✅          | FK → `core_product_variants.id` | —                    |
| `item_seq`         | INTEGER       | ✅          | Sequência do item na NF         | `1`                  |
| `qty`              | NUMERIC       | ✅          | Quantidade no documento         | `12.0`               |
| `unit_price`       | NUMERIC(12,4) | ✅          | Preço unitário                  | `199.00`             |
| `qty_expected`     | NUMERIC       | ✅          | Quantidade esperada             | `12.0`               |
| `qty_scanned_ok`   | NUMERIC       | ❌          | Unidades confirmadas OK         | `11.0`               |
| `qty_scanned_diff` | NUMERIC       | ❌          | Unidades com divergência        | `1.0`                |
| `created_at`       | TIMESTAMPTZ   | ✅          | Data de criação                 | `now()`              |
| `updated_at`       | TIMESTAMPTZ   | ✅          | Data de atualização             | `now()`              |

---

## Módulo Core - Movimentações

### `core_movements`

**Função**: Histórico de todas as movimentações de estoque.

| Campo           | Tipo        | Obrigatório | Descrição                       | Exemplo                    |
| --------------- | ----------- | ----------- | ------------------------------- | -------------------------- |
| `id`            | UUID        | ✅          | PK interna                      | `uuid_generate_v4()`       |
| `product_id`    | UUID        | ✅          | FK → `core_products.id`         | —                          |
| `variant_id`    | UUID        | ✅          | FK → `core_product_variants.id` | —                          |
| `location_id`   | UUID        | ✅          | FK → `core_locations.id`        | —                          |
| `reference_id`  | UUID        | ❌          | Referência (documento, pedido)  | —                          |
| `movement_type` | ENUM        | ✅          | Tipo de movimentação            | `CD_RECEIPT`, `SALE`, etc. |
| `qty_change`    | NUMERIC     | ✅          | Alteração na quantidade         | `+12.0`, `-3.0`            |
| `movement_ts`   | TIMESTAMPTZ | ✅          | Data/hora da movimentação       | `2024-01-15 14:30:00`      |
| `created_at`    | TIMESTAMPTZ | ✅          | Data de criação                 | `now()`                    |
| `updated_at`    | TIMESTAMPTZ | ✅          | Data de atualização             | `now()`                    |

**Valores para `movement_type` (ENUM: `movement_type_enum`)**:
- `CD_RECEIPT`: Recebimento de mercadoria de um fornecedor no Centro de Distribuição.
- `CD_TRANSFER`: Saída de mercadoria do Centro de Distribuição para uma loja (transferência).
- `STORE_RECEIPT`: Recebimento de mercadoria em uma loja (vinda de transferência do CD ou outra loja).
- `SALE`: Venda de um produto a um cliente final.
- `RETURN`: Devolução de um produto por um cliente.
- `INVENTORY_ADJUSTMENT`: Ajuste manual de estoque.

**Constraints**:

- `movement_type` ∈ (valores do ENUM `movement_type_enum`)

---

## Módulo Core - Eventos

### `core_events`

**Função**: Log de eventos do sistema.

| Campo         | Tipo        | Obrigatório | Descrição           | Exemplo                        |
| ------------- | ----------- | ----------- | ------------------- | ------------------------------ |
| `id`          | UUID        | ✅          | PK interna          | `uuid_generate_v4()`           |
| `entity_type` | ENUM        | ✅          | Tipo da entidade    | `ORDER`, `DOCUMENT`, `VARIANT` |
| `entity_id`   | UUID        | ✅          | ID da entidade      | —                              |
| `event_code`  | ENUM        | ✅          | Código do evento    | `purchase_order_created`       |
| `event_ts`    | TIMESTAMPTZ | ✅          | Data/hora do evento | `2024-01-15 10:30:00`          |
| `payload`     | JSONB       | ❌          | Dados do evento     | `{"order_value": 2388.00}`     |
| `created_at`  | TIMESTAMPTZ | ✅          | Data de criação     | `now()`                        |

**Valores para `entity_type` (ENUM: `entity_type_enum`)** ✅ MIGRADO:
- `ORDER`: Evento relacionado a pedidos.
- `DOCUMENT`: Evento relacionado a documentos fiscais.
- `MOVEMENT`: Evento relacionado a movimentações de estoque.
- `VARIANT`: Evento relacionado a variações de produtos.

**Valores para `event_code` (ENUM: `event_code_enum`)**:
- `purchase_order_created`: Criação de um novo pedido de compra.
- `purchase_order_approved`: Aprovação de um pedido de compra.
- `supplier_invoice_precleared`: Nota fiscal de fornecedor pré-aprovada.
- `receipt_in_conference_cd`: Recebimento em conferência no CD.
- `receipt_item_scanned_ok`: Item escaneado com sucesso durante conferência.
- `receipt_item_scanned_diff`: Item escaneado com divergência durante conferência.
- `transfer_order_created`: Criação de pedido de transferência.
- `separation_map_created`: Criação de mapa de separação.
- `separation_in_progress`: Separação em andamento.
- `separation_invoiced`: Separação faturada.
- `store_receipt_start`: Início de recebimento na loja.
- `store_receipt_effective`: Recebimento efetivado na loja.
- `sale_completed`: Venda finalizada.
- `return_same_store`: Devolução na mesma loja.
- `return_other_store`: Devolução em loja diferente.
- `manual_exchange_created`: Troca manual criada.
- `sale`: Venda realizada no PDV.
- `return`: Devolução de produto pelo cliente.
- `transfer`: Evento relacionado a uma transferência entre lojas/CD.
- `adjustment`: Ajuste manual de estoque.
- `receipt_ok_cd`: Recebimento de mercadoria no CD conferido e sem divergências.
- `return_waiting`: Devolução aguardando recebimento.
- `return_completed`: Processo de devolução finalizado.
- `catalog_sync`: Sincronização de catálogo.
- `stock_adjustment`: Ajuste de estoque.
- `pricing_update`: Atualização de preços.

**Constraints**:

- `entity_type` ∈ (valores do ENUM `entity_type_enum`)
- `event_code` ∈ (valores do ENUM `event_code_enum`)

---

## Módulo Core - Estoque

### `core_inventory_snapshots`

**Função**: Snapshots de estoque por localização e produto.

| Campo            | Tipo        | Obrigatório | Descrição                       | Exemplo               |
| ---------------- | ----------- | ----------- | ------------------------------- | --------------------- |
| `id`             | UUID        | ✅          | PK interna                      | `uuid_generate_v4()`  |
| `product_id`     | UUID        | ❌          | FK → `core_products.id`         | —                     |
| `variant_id`     | UUID        | ✅          | FK → `core_product_variants.id` | —                     |
| `location_id`    | UUID        | ✅          | FK → `core_locations.id`        | —                     |
| `qty_on_hand`    | INTEGER     | ✅          | Quantidade em estoque           | `45`                  |
| `last_update_ts` | TIMESTAMPTZ | ✅          | Última atualização              | `2024-01-15 16:45:00` |
| `created_at`     | TIMESTAMPTZ | ✅          | Data de criação                 | `now()`               |

**Constraints**:

- `qty_on_hand` ≥ 0

---

## Relacionamentos e Integridade

### Diagrama de Relacionamentos Principais

```
core_products (1) ←→ (N) core_product_variants
    ↓                        ↓
    └─ core_product_pricing ─┘

core_suppliers (1) ←→ (N) core_orders
core_locations (1) ←→ (N) core_orders (origin/dest)

core_orders (1) ←→ (N) core_order_items
core_orders (1) ←→ (N) core_documents

core_documents (1) ←→ (N) core_document_items

core_product_variants (1) ←→ (N) core_inventory_snapshots
core_locations (1) ←→ (N) core_inventory_snapshots

core_product_variants (1) ←→ (N) core_movements
core_locations (1) ←→ (N) core_movements
```

### Integridade Referencial

**Cascatas e Restrições**:

- Produtos não podem ser deletados se tiverem variações
- Variações não podem ser deletadas se tiverem estoque
- Localizações não podem ser deletadas se tiverem estoque
- Fornecedores não podem ser deletados se tiverem pedidos

---

## Queries Comuns

### 1. Estoque Atual por Produto e Localização

```sql
SELECT
    p.product_name,
    pv.size,
    pv.color,
    l.name as location_name,
    inv.qty_on_hand,
    inv.last_update_ts
FROM core_inventory_snapshots inv
JOIN core_product_variants pv ON inv.variant_id = pv.id
JOIN core_products p ON pv.product_id = p.id
JOIN core_locations l ON inv.location_id = l.id
WHERE inv.qty_on_hand > 0
ORDER BY p.product_name, l.name;
```

### 2. Histórico de Movimentações por Período

```sql
SELECT
    p.product_name,
    pv.sku,
    l.name as location_name,
    m.movement_type,
    m.qty_change,
    m.movement_ts
FROM core_movements m
JOIN core_product_variants pv ON m.variant_id = pv.id
JOIN core_products p ON pv.product_id = p.id
JOIN core_locations l ON m.location_id = l.id
WHERE m.movement_ts >= '2024-01-01'
  AND m.movement_ts < '2024-02-01'
ORDER BY m.movement_ts DESC;
```

### 3. Pedidos Pendentes com Itens

```sql
SELECT
    o.external_id as order_number,
    s.trade_name as supplier_name,
    o.issue_timestamp,
    o.status,
    COUNT(oi.id) as total_items,
    SUM(oi.qty_ordered * oi.unit_cost_est) as estimated_total
FROM core_orders o
LEFT JOIN core_suppliers s ON o.supplier_id = s.id
LEFT JOIN core_order_items oi ON o.id = oi.order_id
WHERE o.status IN ('NOVO', 'APROVADO')
GROUP BY o.id, s.trade_name
ORDER BY o.issue_timestamp DESC;
```

### 4. Preços Vigentes por Produto

```sql
SELECT
    p.product_name,
    pv.sku,
    pp.price_type,
    pp.price_value,
    pp.valid_from,
    pp.valid_to
FROM core_product_pricing pp
JOIN core_product_variants pv ON pp.variant_id = pv.id
JOIN core_products p ON pv.product_id = p.id
WHERE pp.valid_from <= CURRENT_DATE
  AND (pp.valid_to IS NULL OR pp.valid_to >= CURRENT_DATE)
ORDER BY p.product_name, pp.price_type;
```

### 5. Divergências em Documentos

```sql
SELECT
    d.external_id as document_number,
    p.product_name,
    pv.sku,
    di.qty_expected,
    di.qty_scanned_ok,
    di.qty_scanned_diff,
    (di.qty_expected - COALESCE(di.qty_scanned_ok, 0)) as pending_qty
FROM core_document_items di
JOIN core_documents d ON di.document_id = d.id
JOIN core_product_variants pv ON di.variant_id = pv.id
JOIN core_products p ON pv.product_id = p.id
WHERE di.qty_scanned_diff > 0
   OR (di.qty_expected - COALESCE(di.qty_scanned_ok, 0)) > 0
ORDER BY d.external_id, di.item_seq;
```

---

## Constraints e Validações

### Constraints de Domínio

```sql
-- ENUMs já implementados no banco de dados:

-- Unidades de medida (ENUM: unit_measure_enum)
-- Valores: {'UND', 'CX', 'KG'}

-- Gêneros (ENUM: gender_enum)
-- Valores: {'MAS', 'FEM', 'USX'}

-- Tipos de localização (ENUM: location_type_enum) ✅ MIGRADO
-- Valores: {'CD', 'STORE'}

-- Tipos de pedido (ENUM: order_type_enum) ✅ MIGRADO
-- Valores: {'TRANSFER', 'PURCHASE'}

-- Status de pedido (ENUM: order_status_enum) ✅ MIGRADO
-- Valores: {'NEW', 'APPROVED', 'CANCELLED'}

-- Tipos de documento (ENUM: doc_type_enum)
-- Valores: {'SUPPLIER_IN', 'TRANSFER_OUT', 'TRANSFER_IN', 'RETURN', 'SALE'}

-- Status de documento (ENUM: doc_status_enum) ✅ MIGRADO
-- Valores: {'PENDING', 'AWAITING_CD_VERIFICATION', 'IN_CD_VERIFICATION', 
--           'CD_VERIFIED_NO_DISCREPANCY', 'CD_VERIFIED_WITH_DISCREPANCY', 'EFFECTIVE_CD',
--           'TRANSFER_ORDER_CREATED', 'SEPARATION_MAP_CREATED', 'AWAITING_CD_SEPARATION',
--           'IN_CD_SEPARATION', 'CD_SEPARATED_NO_DISCREPANCY', 'CD_SEPARATED_WITH_DISCREPANCY',
--           'SEPARATED_PRE_DOCK', 'SHIPPED_CD', 'CDH_TRANSFER_INVOICED',
--           'AWAITING_STORE_VERIFICATION', 'IN_STORE_VERIFICATION', 'STORE_VERIFIED_NO_DISCREPANCY',
--           'STORE_VERIFIED_WITH_DISCREPANCY', 'EFFECTIVE_STORE', 'SALE_COMPLETED',
--           'RETURN_AWAITING', 'RETURN_COMPLETED', 'STORE_TO_STORE_TRANSFER', 'CANCELLED'}

-- Tipos de movimentação (ENUM: movement_type_enum)
-- Valores: {'CD_RECEIPT', 'CD_TRANSFER', 'STORE_RECEIPT', 'SALE', 'RETURN', 'INVENTORY_ADJUSTMENT'}

-- Tipos de entidade para eventos (ENUM: entity_type_enum) ✅ MIGRADO
-- Valores: {'ORDER', 'DOCUMENT', 'MOVEMENT', 'VARIANT'}

-- Códigos de eventos (ENUM: event_code_enum)
-- Valores: {'purchase_order_created', 'purchase_order_approved', 'supplier_invoice_precleared',
--           'receipt_in_conference_cd', 'receipt_item_scanned_ok', 'receipt_item_scanned_diff',
--           'transfer_order_created', 'separation_map_created', 'separation_in_progress',
--           'separation_invoiced', 'store_receipt_start', 'store_receipt_effective',
--           'sale_completed', 'return_same_store', 'return_other_store', 'manual_exchange_created',
--           'sale', 'return', 'transfer', 'adjustment', 'receipt_ok_cd', 'return_waiting',
--           'return_completed', 'catalog_sync', 'stock_adjustment', 'pricing_update'}

-- Constraints de valor para campos numéricos:

-- Preços não negativos
ALTER TABLE core_product_pricing
ADD CONSTRAINT core_product_pricing_price_value_check
CHECK (price_value >= 0);

-- Estoque não negativo
ALTER TABLE core_inventory_snapshots
ADD CONSTRAINT core_inventory_snapshots_qty_check
CHECK (qty_on_hand >= 0);
```

### Índices Recomendados

```sql
-- Índices para performance
CREATE INDEX idx_product_variants_product_id ON core_product_variants(product_id);
CREATE INDEX idx_product_pricing_variant_id ON core_product_pricing(variant_id);
CREATE INDEX idx_inventory_variant_location ON core_inventory_snapshots(variant_id, location_id);
CREATE INDEX idx_movements_variant_location_ts ON core_movements(variant_id, location_id, movement_ts);
CREATE INDEX idx_events_entity_type_id ON core_events(entity_type, entity_id);
CREATE INDEX idx_orders_status_timestamp ON core_orders(status, issue_timestamp);
CREATE INDEX idx_documents_status_date ON core_documents(status, issue_date);

-- Índices para busca textual
CREATE INDEX idx_products_name_trgm ON core_products USING gin(product_name gin_trgm_ops);
CREATE INDEX idx_suppliers_name_trgm ON core_suppliers USING gin(trade_name gin_trgm_ops);
```

### Triggers Recomendados

```sql
-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar em todas as tabelas com updated_at
CREATE TRIGGER update_core_products_updated_at
    BEFORE UPDATE ON core_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_core_product_variants_updated_at
    BEFORE UPDATE ON core_product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... aplicar em todas as outras tabelas
```

---

## Notas de Implementação

### Boas Práticas

1. **UUIDs**: Todas as PKs usam UUID para evitar conflitos em ambientes distribuídos
2. **Timestamps**: Sempre com timezone (TIMESTAMPTZ) para consistência global
3. **Soft Deletes**: Considerar implementar `deleted_at` para auditoria
4. **Versionamento**: Manter histórico de alterações em tabelas críticas
5. **Particionamento**: Considerar particionar tabelas grandes por data

### Monitoramento

- Monitorar crescimento das tabelas `core_movements` e `core_events`
- Implementar rotinas de limpeza para dados antigos
- Monitorar performance das queries mais frequentes
- Alertas para inconsistências de estoque

### Backup e Recovery

- Backup diário completo
- Backup incremental a cada 4 horas
- Teste de recovery mensal
- Replicação para ambiente de DR

---

## Módulo Administrativo e Segurança

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

## Módulo de Segurança e Alertas

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

## Módulo de Notificações e Consentimentos

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

## Módulo de Webhooks e Monitoramento

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

## Módulo Multi-Tenant Avançado

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

## Migrações Recentes Aplicadas

### Últimas 10 Migrações (Dezembro 2024 - Janeiro 2025)

1. **`fix-test-rls-function-with-jwt-override`** (2025-06-22)
   - Correção da função de teste RLS com override JWT

2. **`fix-test-rls-function-for-security-definer`** (2025-06-22)
   - Correção da função de teste RLS para security definer

3. **`create_test_rls_function`** (2025-06-22)
   - Criação de função de teste para políticas RLS

4. **`remove_temporary_password_from_user_invites`** (2025-06-21)
   - Remoção do campo temporary_password da tabela user_invites

5. **`add_temporary_password_to_user_invites`** (2025-06-21)
   - Adição temporária do campo temporary_password (posteriormente removido)

6. **`fix_rls_policy_and_add_deleted_at`** (2025-06-21)
   - Correção das políticas RLS para user_known_devices
   - Adição da coluna deleted_at na tabela organizations

7. **`add_master_admin_policies`** (2025-06-20)
   - Adição de políticas RLS para o papel master_admin

8. **`add_master_admin_role`** (2025-06-20)
   - Criação do papel master_admin no sistema

9. **`extend_organizations_multi_tenant`** (2025-06-19)
   - Extensão da tabela organizations para suporte multi-tenant avançado

10. **`create_webhook_monitoring_tables`** (2025-06-19)
    - Criação das tabelas de monitoramento de webhooks

## Extensões Instaladas

### Extensões Ativas no Supabase
- **pgcrypto** (1.3): Funções criptográficas
- **pgjwt** (0.2.0): API JWT para PostgreSQL  
- **uuid-ossp** (1.1): Geração de UUIDs
- **pg_stat_statements** (1.10): Estatísticas de queries
- **pg_graphql** (1.5.11): Suporte GraphQL
- **supabase_vault** (0.3.1): Extensão Vault do Supabase
- **plpgsql** (1.0): Linguagem procedural PL/pgSQL

### Extensões Disponíveis (não instaladas)
- **postgis** (3.3.7): Tipos e funções espaciais
- **timescaledb** (2.16.1): Banco de dados de séries temporais
- **pg_cron** (1.6): Agendador de jobs
- **vector** (0.8.0): Tipo de dados vetorial para AI/ML
- **pgaudit** (1.7): Funcionalidades de auditoria
- **pg_trgm** (1.6): Busca por similaridade textual

---

_Documento atualizado em: Janeiro 2025_
_Versão do Schema: 4.0 - Sistema Multi-Tenant Completo + Módulos Administrativos_
_Total de Migrações Aplicadas: 39_
_Última Migração: fix-test-rls-function-with-jwt-override (2025-06-22)_
_Status: Sistema 100% funcional com correções de RLS e roles master_admin_
