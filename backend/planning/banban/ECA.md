# ECA - Arquitetura Genérica com ID Externo

Entendido. Essa é uma restrição crucial e muito comum em integrações com sistemas legados ou ERPs. A arquitetura precisa ser robusta o suficiente para usar o ID externo como a "chave de negócio" para todas as operações.

A lógica central muda de "agir sobre um UUID" para "primeiro, encontrar o registro usando o ID externo e o tipo; depois, agir sobre seu ID interno".

Vamos ajustar a estrutura das tabelas e o fluxo ECA para refletir essa realidade.

## Estrutura Atualizada das Tabelas Genéricas (com ID Externo)

A principal mudança é a introdução de um `external_id` e a definição de uma chave de negócio única.

### 1. `tenant_business_entities`

_(Produtos, Fornecedores, Lojas, CDs)_

| Coluna         | Tipo        | Descrição                                                                                |
| :------------- | :---------- | :--------------------------------------------------------------------------------------- |
| `id`           | BIGINT/UUID | Chave primária interna, auto-gerada. Usada para joins eficientes.                        |
| `organization_id`    | UUID        | Identificador da organização.                                                              |
| `entity_type`  | VARCHAR     | Define o que a entidade é ('PRODUCT', 'SUPPLIER', 'LOCATION').                           |
| `external_id`  | VARCHAR     | **Chave de negócio.** O ID da entidade no sistema de origem (SKU, CNPJ, Código da Loja). |
| `attributes`   | JSONB       | Dados específicos da entidade (nome, descrição, etc.).                                   |
| `created_at`   | TIMESTAMPTZ | Data de criação.                                                                         |
| `updated_at`   | TIMESTAMPTZ | Data da última atualização.                                                              |
| **Constraint** | `UNIQUE`    | `(organization_id, entity_type, external_id)`                                                  |

### 2. `tenant_business_transactions`

_(Pedidos, Documentos Fiscais, Movimentações)_

| Coluna             | Tipo        | Descrição                                                                                                                                                                       |
| :----------------- | :---------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`               | BIGINT/UUID | Chave primária interna, auto-gerada.                                                                                                                                            |
| `organization_id`        | UUID        | Identificador da organização.                                                                                                                                                     |
| `transaction_type` | VARCHAR     | Define o que a transação é ('ORDER_PURCHASE', 'DOCUMENT_SUPPLIER_IN').                                                                                                          |
| `external_id`      | VARCHAR     | **Chave de negócio.** O ID da transação no sistema de origem (Nº do Pedido, Chave da NF-e). **Pode ser NULO** para transações puramente internas (ex: movimentação de estoque). |
| `status`           | VARCHAR     | O estado atual da transação (ver estados detalhados abaixo).                                                                                                                    |
| `attributes`       | JSONB       | Dados específicos da transação (data de emissão, valor total, divergências de conferência).                                                                                     |
| `created_at`       | TIMESTAMPTZ | Data de criação.                                                                                                                                                                |
| `updated_at`       | TIMESTAMPTZ | Data da última atualização.                                                                                                                                                     |
| **Constraint**     | `UNIQUE`    | `(organization_id, transaction_type, external_id)` - _Atenção: Tratar nulos se o DB não os considerar únicos._                                                                        |

### 3. `tenant_business_relationships`

_(A cola que conecta tudo, usando os IDs internos para performance)_

| Coluna              | Tipo        | Descrição                                                                   |
| :------------------ | :---------- | :-------------------------------------------------------------------------- |
| `id`                | BIGINT/UUID | Chave primária única.                                                       |
| `organization_id`         | UUID        | Identificador da organização.                                                 |
| `source_id`         | BIGINT/UUID | FK para o `id` interno da tabela de origem (`entities` ou `transactions`).  |
| `target_id`         | BIGINT/UUID | FK para o `id` interno da tabela de destino (`entities` ou `transactions`). |
| `relationship_type` | VARCHAR     | Descreve a natureza do link ('CONTAINS_ITEM', 'BASED_ON_ORDER').            |
| `attributes`        | JSONB       | Dados específicos do relacionamento (quantidade, preço, divergências).      |
| `created_at`        | TIMESTAMPTZ | Data de criação.                                                            |

## Estados Detalhados do Sistema

### Ciclo de Nota de Fornecedor (SUPPLIER_IN)

- `PENDENTE` - Pedido criado, mas fornecedor ainda não faturou
- `PRE_BAIXA` - NF faturada pelo fornecedor já deu pré-baixa
- `AGUARDANDO_CONFERENCIA_CD` - Aguardando conferência no CD
- `EM_CONFERENCIA_CD` - Em conferência (bipagem item a item)
- `CONFERENCIA_CD_SEM_DIVERGENCIA` - Conferência finalizada sem divergências (qty_scanned_diff = 0 para todos itens)
- `CONFERENCIA_CD_COM_DIVERGENCIA` - Conferência finalizada com ao menos uma divergência (algum qty_scanned_diff > 0)
- `EFETIVADO_CD` - Produto efetivado no estoque do CD

### Transferência CD → Loja (TRANSFER_OUT)

- `PEDIDO_TRANSFERENCIA_CRIADO` - Pedido de Transferência criado (sem mapa)
- `MAPA_SEPARACAO_CRIADO` - Mapa de Separação foi gerado
- `AGUARDANDO_SEPARACAO_CD` - Aguardando Separação (lista de picking aguardando execução)
- `EM_SEPARACAO_CD` - Em Separação (bipagem)
- `SEPARACAO_CD_SEM_DIVERGENCIA` - Picking concluído sem divergências
- `SEPARACAO_CD_COM_DIVERGENCIA` - Picking concluído com divergências
- `SEPARADO_PRE_DOCA` - Separado e em pré-doca
- `EMBARCADO_CD` - Embarcado (itens na doca aguardando faturamento)
- `TRANSFERENCIA_CDH_FATURADA` - Documento TRANSFER_OUT efetivamente faturado (nota de saída); caminhão saiu

### Recebimento na Loja (TRANSFER_IN)

- `AGUARDANDO_CONFERENCIA_LOJA` - Aguardando conferência na loja
- `EM_CONFERENCIA_LOJA` - Em conferência (bipagem) na loja
- `CONFERENCIA_LOJA_SEM_DIVERGENCIA` - Conferência na loja concluída sem divergências
- `CONFERENCIA_LOJA_COM_DIVERGENCIA` - Conferência na loja concluída com divergências
- `EFETIVADO_LOJA` - Efetivado no estoque da loja

### Ciclo de Venda ao Cliente (SALE)

- `VENDA_CONCLUIDA` - Venda concluída, cupom emitido

### Ciclo de Devolução (RETURN)

- `DEVOLUCAO_AGUARDANDO` - Aguardando emissão da NF de devolução
- `DEVOLUCAO_CONCLUIDA` - NF de devolução emitida e estoque atualizado
- `TRANSFERENCIA_ENTRE_LOJAS` - NF de transferência interna emitida

## ECA Unificado (Fluxo Completo com Estados Detalhados)

### 1. Ciclo de Nota de Fornecedor (SUPPLIER_IN)

| Estado                             | Evento/Trigger                                                                                                                    | Chave de Busca                                                                                     | Ação (Operações no Banco de Dados)                                                                                                                                                                                                                                     |
| :--------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PENDENTE**                       | Usuário cria Pedido de Compra `external_id` = "PO-001" para Fornecedor `external_id` = "CNPJ-X" e Produto `external_id` = "SKU-Y" | `entity_type`='SUPPLIER', `external_id`="CNPJ-X"<br>`entity_type`='PRODUCT', `external_id`="SKU-Y" | 1. **`INSERT`** em `tenant_business_transactions` (`transaction_type`='`ORDER_PURCHASE`', `external_id`="PO-001", `status`='`PENDENTE`')<br>2. **Localizar** IDs internos do fornecedor e produto<br>3. **`INSERT`** relationships (pedido→fornecedor, pedido→produto) |
| **PRE_BAIXA**                      | Fornecedor fatura NF `external_id` = "NFE-123" para o Pedido "PO-001"                                                             | `transaction_type`='`ORDER_PURCHASE`', `external_id`="PO-001"                                      | 1. **`INSERT`** `DOCUMENT_SUPPLIER_IN` (`external_id`="NFE-123", `status`='`PRE_BAIXA`')<br>2. **`INSERT`** relationship (documento→pedido, `type`='`BASED_ON_ORDER`')                                                                                                 |
| **AGUARDANDO_CONFERENCIA_CD**      | Carga da NF "NFE-123" chega na portaria do CD                                                                                     | `transaction_type`='`DOCUMENT_SUPPLIER_IN`', `external_id`="NFE-123"                               | **`UPDATE`** `status` = '`AGUARDANDO_CONFERENCIA_CD`'                                                                                                                                                                                                                  |
| **EM_CONFERENCIA_CD**              | Inicia-se a conferência da NF "NFE-123" no CD                                                                                     | `transaction_type`='`DOCUMENT_SUPPLIER_IN`', `external_id`="NFE-123"                               | **`UPDATE`** `status` = '`EM_CONFERENCIA_CD`'<br>**`UPDATE`** `attributes` = `{conferencia_iniciada_em: timestamp}`                                                                                                                                                    |
| **CONFERENCIA_CD_SEM_DIVERGENCIA** | Item conferido sem divergência (qty_scanned = qty_expected) - **Status derivado automaticamente**                                | `transaction_type`='`DOCUMENT_SUPPLIER_IN`', `external_id`="NFE-123"                               | **`UPDATE`** `status` = '`CONFERENCIA_CD_SEM_DIVERGENCIA`'<br>**`UPDATE`** `attributes` = `{ultima_conferencia_em: timestamp, divergencias: []}`<br>**`INSERT`** `INVENTORY_MOVEMENT` para item conferido                                                             |
| **CONFERENCIA_CD_COM_DIVERGENCIA** | Item conferido com divergência (qty_scanned ≠ qty_expected) - **Status derivado automaticamente**                                | `transaction_type`='`DOCUMENT_SUPPLIER_IN`', `external_id`="NFE-123"                               | **`UPDATE`** `status` = '`CONFERENCIA_CD_COM_DIVERGENCIA`'<br>**`UPDATE`** `attributes` = `{ultima_conferencia_em: timestamp, divergencias: [{sku, qty_expected, qty_scanned, qty_diff, scanned_at}]}`<br>**`INSERT`** `INVENTORY_MOVEMENT` para item conferido |
| **EFETIVADO_CD**                   | Carga da NF "NFE-123" é efetivada no estoque do CD                                                                                | `transaction_type`='`DOCUMENT_SUPPLIER_IN`', `external_id`="NFE-123"                               | 1. **`UPDATE`** `status` = '`EFETIVADO_CD`'<br>2. Para cada item: **`INSERT`** `INVENTORY_MOVEMENT` com relationships (`AFFECTS_PRODUCT`, `AT_LOCATION`=CD, `CAUSED_BY_DOCUMENT`)                                                                                      |

### 2. Transferência CD → Loja (TRANSFER_OUT)

| Estado                           | Evento/Trigger                                                                                  | Chave de Busca                                                                                       | Ação (Operações no Banco de Dados)                                                                                                                                                                                                                                                                                                 |
| :------------------------------- | :---------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PEDIDO_TRANSFERENCIA_CRIADO**  | Usuário cria Pedido de Transferência `external_id` = "PT-500" do CD "CD-01" para Loja "LOJA-SP" | `entity_type`='LOCATION', `external_id`="CD-01"<br>`entity_type`='LOCATION', `external_id`="LOJA-SP" | 1. **`INSERT`** `ORDER_TRANSFER` (`external_id`="PT-500", `status`='`PEDIDO_TRANSFERENCIA_CRIADO`')<br>2. **`INSERT`** relationships (pedido→CD origem, pedido→loja destino)                                                                                                                                                       |
| **MAPA_SEPARACAO_CRIADO**        | Sistema gera mapa de separação para PT-500                                                      | `transaction_type`='`ORDER_TRANSFER`', `external_id`="PT-500"                                        | **`UPDATE`** `status` = '`MAPA_SEPARACAO_CRIADO`'<br>**`UPDATE`** `attributes` = `{mapa_separacao_id: "MAP-001", criado_em: timestamp}`                                                                                                                                                                                            |
| **AGUARDANDO_SEPARACAO_CD**      | Mapa de separação disponível para picking                                                       | `transaction_type`='`ORDER_TRANSFER`', `external_id`="PT-500"                                        | **`UPDATE`** `status` = '`AGUARDANDO_SEPARACAO_CD`'                                                                                                                                                                                                                                                                                |
| **EM_SEPARACAO_CD**              | Operador inicia separação (bipagem)                                                             | `transaction_type`='`ORDER_TRANSFER`', `external_id`="PT-500"                                        | **`UPDATE`** `status` = '`EM_SEPARACAO_CD`'<br>**`UPDATE`** `attributes` = `{separacao_iniciada_em: timestamp, operador_id: "OP-001"}`                                                                                                                                                                                             |
| **SEPARACAO_CD_SEM_DIVERGENCIA** | Picking concluído sem divergências                                                              | `transaction_type`='`ORDER_TRANSFER`', `external_id`="PT-500"                                        | **`UPDATE`** `status` = '`SEPARACAO_CD_SEM_DIVERGENCIA`'<br>**`UPDATE`** `attributes` = `{separacao_finalizada_em: timestamp, divergencias: []}`                                                                                                                                                                                   |
| **SEPARACAO_CD_COM_DIVERGENCIA** | Picking concluído com divergências                                                              | `transaction_type`='`ORDER_TRANSFER`', `external_id`="PT-500"                                        | **`UPDATE`** `status` = '`SEPARACAO_CD_COM_DIVERGENCIA`'<br>**`UPDATE`** `attributes` = `{separacao_finalizada_em: timestamp, divergencias: [{sku, qty_solicitada, qty_separada}]}`                                                                                                                                                |
| **SEPARADO_PRE_DOCA**            | Itens separados e em pré-doca                                                                   | `transaction_type`='`ORDER_TRANSFER`', `external_id`="PT-500"                                        | **`UPDATE`** `status` = '`SEPARADO_PRE_DOCA`'<br>**`UPDATE`** `attributes` = `{pre_doca_em: timestamp, doca_id: "DOCA-A"}`                                                                                                                                                                                                         |
| **EMBARCADO_CD**                 | Itens embarcados aguardando faturamento                                                         | `transaction_type`='`ORDER_TRANSFER`', `external_id`="PT-500"                                        | **`UPDATE`** `status` = '`EMBARCADO_CD`'<br>**`UPDATE`** `attributes` = `{embarcado_em: timestamp, veiculo_id: "TRUCK-001"}`                                                                                                                                                                                                       |
| **TRANSFERENCIA_CDH_FATURADA**   | NF de transferência faturada, caminhão saiu                                                     | `transaction_type`='`ORDER_TRANSFER`', `external_id`="PT-500"                                        | 1. **`UPDATE`** `status` = '`TRANSFERENCIA_CDH_FATURADA`'<br>2. **`INSERT`** `DOCUMENT_TRANSFER_OUT` (`external_id`="NFE-456", `status`='`TRANSFERENCIA_CDH_FATURADA`')<br>3. **`INSERT`** movimentos de saída do CD<br>4. **`INSERT`** `DOCUMENT_TRANSFER_IN` (`external_id`="NFE-456", `status`='`AGUARDANDO_CONFERENCIA_LOJA`') |

### 3. Recebimento na Loja (TRANSFER_IN)

| Estado                               | Evento/Trigger                                        | Chave de Busca                                                       | Ação (Operações no Banco de Dados)                                                                                                                                                           |
| :----------------------------------- | :---------------------------------------------------- | :------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AGUARDANDO_CONFERENCIA_LOJA**      | NF de transferência criada aguardando chegada na loja | `transaction_type`='`DOCUMENT_TRANSFER_IN`', `external_id`="NFE-456" | Estado já definido na criação do documento                                                                                                                                                   |
| **EM_CONFERENCIA_LOJA**              | Inicia conferência da NF "NFE-456" na loja            | `transaction_type`='`DOCUMENT_TRANSFER_IN`', `external_id`="NFE-456" | **`UPDATE`** `status` = '`EM_CONFERENCIA_LOJA`'<br>**`UPDATE`** `attributes` = `{conferencia_loja_iniciada_em: timestamp}`                                                                   |
| **CONFERENCIA_LOJA_SEM_DIVERGENCIA** | Conferência na loja concluída sem divergências        | `transaction_type`='`DOCUMENT_TRANSFER_IN`', `external_id`="NFE-456" | **`UPDATE`** `status` = '`CONFERENCIA_LOJA_SEM_DIVERGENCIA`'<br>**`UPDATE`** `attributes` = `{conferencia_loja_finalizada_em: timestamp, divergencias: []}`                                  |
| **CONFERENCIA_LOJA_COM_DIVERGENCIA** | Conferência na loja concluída com divergências        | `transaction_type`='`DOCUMENT_TRANSFER_IN`', `external_id`="NFE-456" | **`UPDATE`** `status` = '`CONFERENCIA_LOJA_COM_DIVERGENCIA`'<br>**`UPDATE`** `attributes` = `{conferencia_loja_finalizada_em: timestamp, divergencias: [{sku, qty_esperada, qty_recebida}]}` |
| **EFETIVADO_LOJA**                   | Transferência efetivada no estoque da loja            | `transaction_type`='`DOCUMENT_TRANSFER_IN`', `external_id`="NFE-456" | 1. **`UPDATE`** `status` = '`EFETIVADO_LOJA`'<br>2. Para cada item: **`INSERT`** `INVENTORY_MOVEMENT` com relationships (`AFFECTS_PRODUCT`, `AT_LOCATION`=LOJA, `CAUSED_BY_DOCUMENT`)        |

### 4. Ciclo de Venda ao Cliente (SALE)

| Estado              | Evento/Trigger                                                    | Chave de Busca                                             | Ação (Operações no Banco de Dados)                                                                                                                                                                                     |
| :------------------ | :---------------------------------------------------------------- | :--------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **VENDA_CONCLUIDA** | Cliente compra produto, cupom emitido `external_id` = "VENDA-789" | Validação de estoque (calculado dos `INVENTORY_MOVEMENT`s) | 1. **`INSERT`** `DOCUMENT_SALE` (`external_id`="VENDA-789", `status`='`VENDA_CONCLUIDA`')<br>2. **`INSERT`** movimentos de saída da loja<br>3. **`INSERT`** relationships (venda→produtos, venda→cliente se aplicável) |

### 5. Ciclo de Devolução (RETURN)

| Estado                        | Evento/Trigger                                           | Chave de Busca                                                  | Ação (Operações no Banco de Dados)                                                                                                                                                           |
| :---------------------------- | :------------------------------------------------------- | :-------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DEVOLUCAO_AGUARDANDO**      | Cliente solicita devolução referente à venda "VENDA-789" | `transaction_type`='`DOCUMENT_SALE`', `external_id`="VENDA-789" | **`INSERT`** `DOCUMENT_RETURN` (`external_id`="DEV-010", `status`='`DEVOLUCAO_AGUARDANDO`')<br>**`INSERT`** relationship (devolução→venda original)                                          |
| **DEVOLUCAO_CONCLUIDA**       | NF de devolução emitida e estoque atualizado             | `transaction_type`='`DOCUMENT_RETURN`', `external_id`="DEV-010" | 1. **`UPDATE`** `status` = '`DEVOLUCAO_CONCLUIDA`'<br>2. **`INSERT`** movimentos de entrada na loja<br>3. **`UPDATE`** `attributes` = `{nf_devolucao: "NFE-DEV-010", emitida_em: timestamp}` |
| **TRANSFERENCIA_ENTRE_LOJAS** | NF de transferência interna emitida entre lojas          | Lógica específica de transferência                              | **`INSERT`** `DOCUMENT_TRANSFER_INTERNAL` com status específico e relationships adequadas                                                                                                    |

## Lógica de Conferência Item por Item (Atualizada)

### Novo Fluxo de Conferência

A partir da implementação atualizada, a conferência de itens no CD segue uma lógica **item por item** sem necessidade de trigger final explícito:

#### 1. **Scan Items (`scan_items`)**
- **Comportamento**: A cada item escaneado, o sistema **deriva automaticamente** o status da NF
- **Lógica de Status**:
  - Se **nenhum item** conferido até o momento tem divergência → `CONFERENCIA_CD_SEM_DIVERGENCIA`
  - Se **pelo menos um item** conferido tem divergência → `CONFERENCIA_CD_COM_DIVERGENCIA`
- **Movimentação de Estoque**: Criada **imediatamente** para cada item escaneado
- **Divergências**: Armazenadas cumulativamente no campo `attributes.divergencias`

#### 2. **Effectuate CD (`effectuate_cd`)**
- **Comportamento**: Serve como **indicador** de que a conferência foi finalizada
- **Validação**: Aceita apenas NFs com status `CONFERENCIA_CD_SEM_DIVERGENCIA` ou `CONFERENCIA_CD_COM_DIVERGENCIA`
- **Função**: Transiciona para `EFETIVADO_CD`, consolidando a operação

#### 3. **Vantagens da Nova Abordagem**
- ✅ **Tempo Real**: Status sempre reflete o estado atual da conferência
- ✅ **Flexibilidade**: Não requer "declaração" de fim da conferência
- ✅ **Rastreabilidade**: Cada item escaneado atualiza o status imediatamente
- ✅ **Simplicidade**: `EFFECTUATE_CD` serve como trigger natural de finalização

#### 4. **Estrutura de Divergências**
```json
{
  "divergencias": [
    {
      "sku": "SKU-123",
      "qty_expected": 10,
      "qty_scanned": 8,
      "qty_diff": -2,
      "scanned_at": "2025-07-07T10:30:00Z"
    }
  ]
}
```

#### 5. **APIs Removidas**
- ❌ `COMPLETE_CONFERENCE` - Não é mais necessário
- ❌ `COMPLETE_CONFERENCE_OK` - Derivado automaticamente
- ❌ `COMPLETE_CONFERENCE_DIFF` - Derivado automaticamente

## Implicações da Arquitetura

### Camada de Aplicação é Crucial

A aplicação se torna a guardiã da lógica de negócio. Ela é responsável por:

1. Receber um payload com IDs externos.
2. Traduzir esses IDs externos em IDs internos do banco de dados.
3. Executar as operações de escrita (INSERT/UPDATE) usando os IDs internos.
4. Construir as relações entre as entidades e transações.
5. **Gerenciar as transições de estado** seguindo as regras de negócio.
6. **Validar divergências** e armazenar detalhes no campo `attributes`.

### Performance de Leitura

Para consultas complexas (ex: "Qual o estoque atual do produto X?"), será necessário agregar todos os `INVENTORY_MOVEMENT`s relacionados. Isso pode ser lento. Estratégias como visões materializadas ou tabelas de snapshot de inventário (que seriam atualizadas por gatilhos ou processos batch) podem ser necessárias para otimizar a performance de leitura.

### Auditoria e Rastreabilidade

Com os estados detalhados, o sistema oferece:

- **Rastreabilidade completa** de cada item desde a compra até a venda
- **Auditoria de divergências** em cada etapa de conferência
- **Timestamps precisos** para análise de performance operacional
- **Histórico completo** de mudanças de estado via `updated_at`
