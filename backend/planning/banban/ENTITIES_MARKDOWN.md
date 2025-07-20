# Entidades

## core_locations
> **O que gerencia:** Locais físicos onde ocorre movimentação de estoque (centro de distribuição, filiais, armazéns ou até mesmo e-commerce).
> **Função principal:** Identifica cada local por um código interno e por um código externo do ERP, além de classificar o tipo (ex: CD, LOJA), para que as quantidades sejam sempre atribuídas ao local correto.

| PROPRIEDADE | TIPO DE DADO | DESCRIÇÃO | REQUERIDO NO PAYLOAD | EXEMPLO DE DADO ESPERADO |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PK interna, gerada automaticamente | Não esperado | |
| `external_id` | TEXT | Código da loja no ERP | Obrigatório | `"Loja Rio Mar Pappa"` |
| `name` | TEXT | Nome do local/loja | Obrigatório | `"Loja Rio Mar Pappa"` |
| `location_type` | ENUM('CD', 'LOJA') | Tipo de ponto físico:<br>CD=Centro de Distribuição,<br>LOJA=Loja física | Obrigatório | `"CD"` |
| `address` | TEXT | Endereço completo | Opcional | `"Av. Doutor Lins..."` |
| `created_at` | TIMESTAMPTZ | Data e hora de quando foi criado | Não esperado | |
| `updated_at` | TIMESTAMPTZ | Data e hora da última vez que foi atualizado | Não esperado | |

## core_suppliers
> **O que gerencia:** Cadastro de todos os fornecedores que abastecem o sistema.
> **Função principal:** Armazena informações básicas (identificador interno, código externo, razão social, CNPJ etc.) para que o restante do fluxo de compras e recebimentos possa referenciar corretamente de onde vem cada item.

| PROPRIEDADE | TIPO DE DADO | DESCRIÇÃO | REQUERIDO NO PAYLOAD | EXEMPLO DE DADO ESPERADO |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PK interna, gerada automaticamente | Não esperado | |
| `external_id` | TEXT | Código do fornecedor no ERP | Obrigatório | `"FORN002"` |
| `trade_name` | TEXT | Nome fantasia | Obrigatório | `"Yandeh Calçados LTDA"` |
| `legal_name` | TEXT | Razão social | Opcional | `"Yandeh"` |
| `cnpj` | TEXT | CNPJ/CPF | Opcional | `"12.628.945/0001-56"` |
| `created_at` | TIMESTAMPTZ | Data e hora de quando foi criado | Não esperado | |
| `updated_at` | TIMESTAMPTZ | Data e hora da última vez que foi atualizado | Não esperado | |

## core_products
> **O que gerencia:** Catálogo de produtos usados no fluxo (tênis, camisetas, eletrônicos etc.).
> **Função principal:** Guarda dados essenciais de cada item (código ERP, SKU interno, GTIN/EAN, descrição e unidade de medida), garantindo que todos os documentos e movimentações apontem para um cadastro único de produto.

| PROPRIEDADE | TIPO DE DADO | DESCRIÇÃO | REQUERIDO NO PAYLOAD | EXEMPLO DE DADO ESPERADO |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PK interna, gerada automaticamente | Não esperado | |
| `external_id` | TEXT | Referência principal no ERP | Obrigatório | `"TENIS CASUAL UNISSEX"` |
| `product_name` | TEXT | Nome mais detalhado do produto | Obrigatório | `"Y-345678"` |
| `description` | TEXT | GTIN/EAN | Obrigatório | `"789123456789"` |
| `uom` | ENUM('PAR', 'UNID', 'CX') | Unidade de medida do produto | Obrigatório | `"Par"` |
| `category` | TEXT | Categoria do produto no ERP | Opcional | `"Casual"` |
| `sub_category` | TEXT | Sub categoria do produto no ERP | Opcional | `"Tênis Casual F"` |
| `type` | TEXT | Perfil, conforme no ERP | Obrigatório | `"Tênis"` |
| `gender` | ENUM('MASC', 'FEM', 'UNISSEX') | Gênero, conforme no ERP | Obrigatório | `"Masc"` |
| `axapta_external_id` | TEXT | ID do produto no Axapta | Obrigatório | `"ID AX"` |
| `status` | TEXT | Importante para filtrar produtos que serão enviados para Aires (ativo) | Opcional | `"ativo"` |
| `created_at` | TIMESTAMPTZ | Data e hora de quando foi criado | Não esperado | |
| `updated_at` | TIMESTAMPTZ | Data e hora da última vez que foi atualizado | Não esperado | |

## core_product_variants
> **O que gerencia:** Gerencia cada combinação do produto com cor, tamanho e GTIN específico.
> **Função principal:** (Não especificada)

| PROPRIEDADE | TIPO DE DADO | DESCRIÇÃO | REQUERIDO NO PAYLOAD | EXEMPLO DE DADO ESPERADO |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PK interna, gerada automaticamente | Não esperado | |
| `external_id` | TEXT | Código do produto no ERP | Obrigatório | `"VONZ002AZUL34"` |
| `product_id` | UUID | FK = core_products.id. Identificador da referência principal | Fornecido na lógica da aplicação | `"<UUID>"` |
| `size` | TEXT | Tamanho do variante (P, M, G, 38, 40, U, ...) | Obrigatório | `"34"` |
| `color` | TEXT | Cor do variante | Opcional | `"Azul"` |
| `gtin_variant` | TEXT | GTIN específico desta combinação (pode diferir do GTIN genérico do pai) | Obrigatório | `"7899999999974-02"` |
| `created_at` | TIMESTAMPTZ | Data e hora de quando foi criado | Não esperado | |
| `updated_at` | TIMESTAMPTZ | Data e hora da última vez que foi atualizado | Não esperado | |

## core_product_pricing
> **O que gerencia:** Armazena histórico de preços de venda (ou custos) para cada produto, permitindo múltiplas "tabelas" ou "tipos" de preço ao longo do tempo.
> **Função principal:** (Não especificada)

| PROPRIEDADE | TIPO DE DADO | DESCRIÇÃO | REQUERIDO NO PAYLOAD | EXEMPLO DE DADO ESPERADO |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PK interna, gerada automaticamente | Não esperado | |
| `variant_id` | UUID | FK = core_product_variants.id. Identificador do variante | Fornecido na lógica da aplicação | `"VONZ002AZUL34"` |
| `product_id` | UUID | FK = core_products.id. Identificador da referência principal | Fornecido na lógica da aplicação | `"<UUID>"` |
| `gtin_variant` | TEXT | (Não especificado) | (Não especificado) | |
| `price_type` | ENUM ('BASE', 'PROMO', 'COST') | Valores possíveis:<br>• `BASE`: Preço padrão de venda do produto.<br>• `COST`: Custo interno de aquisição.<br>• `PROMO`: Valor aplicável em períodos específicos. | Obrigatório | `"BASE"` |
| `value` | NUMERIC(14,2) | Valor unitário válido para o tipo de preço | Obrigatório | `189.90` |
| `valid_from` | DATE | Data de início de vigência deste preço | Opcional | `"2020-08-01"` |
| `valid_to` | DATE | Data final de vigência deste preço | Opcional | `"2020-08-30"` |
| `created_at` | TIMESTAMPTZ | Data e hora de quando foi criado | Não esperado | |
| `updated_at` | TIMESTAMPTZ | Data e hora da última vez que foi atualizado | Não esperado | |

## core_orders
> **O que gerencia:** "Compromissos" de movimentação futura, sejam ordens de compra junto ao fornecedor ou de transferência entre CD e loja.
> **Função principal:** Registra cabeçalhos de pedidos, com tipo (COMPRA ou TRANSFER), vínculos ao fornecedor ou aos locais de origem/destino, timestamps de emissão e status (novo, aprovado, cancelado). Serve de base para inserir os itens e gerar documentos associados.

| PROPRIEDADE | TIPO DE DADO | DESCRIÇÃO | REQUERIDO NO PAYLOAD | EXEMPLO DE DADO ESPERADO |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PK interna, gerada automaticamente | Não esperado | |
| `external_id` | TEXT | Pedido nº no ERP | Obrigatório | `"SAPP01234"` |
| `supplier_id` | UUID | FK = core_suppliers.id (obrigatório para COMPRA) | Fornecido na lógica da aplicação | `"<UUID>"` |
| `origin_location_id` | UUID | FK = core_locations.id (obrigatório para TRANSFER) | Fornecido na lógica da aplicação | `"<UUID>"` |
| `dest_location_id` | UUID | FK = core_locations.id (obrigatório para TRANSFER) | Fornecido na lógica da aplicação | `"<UUID>"` |
| `type` | ENUM ('COMPRA', 'TRANSFER') | Tipo de pedido.<br>`COMPRA` = de fornecedor.<br>`TRANSFER` = entre CD e lojas. | Obrigatório | `"COMPRA"` |
| `issue_timestamp` | TIMESTAMPTZ | Data de emissão do pedido | Obrigatório | `"2020-05-20T15Z"` |
| `status` | ENUM ('NOVO', 'APROVADO', 'CANCELADO') | • `NOVO`: Estado inicial que indica que a ordem de compra não está aprovada e aguarda confirmação antes dos fluxos subsequentes.<br>• `APROVADO`: Estado que indica que a ordem de compra está aprovada e os produtos podem ser enviados.<br>• `CANCELADO`: Usado quando a ordem foi invalidada ou cancelada antes da chegada dos itens. | Obrigatório | `"APROVADO"` |
| `created_at` | TIMESTAMPTZ | Data e hora de quando foi criado | Não esperado | |
| `updated_at` | TIMESTAMPTZ | Data e hora da última vez que foi atualizado | Não esperado | |

## core_order_items
> **O que gerencia:** Lista de itens dentro de cada pedido (compras ou transferências).
> **Função principal:** Detalha, para cada `order_id`, quais produtos foram solicitados, em que quantidade, a qual custo estimado por unidade; esse detalhamento é usado depois para comparar com o que efetivamente chega na nota fiscal.

| PROPRIEDADE | TIPO DE DADO | DESCRIÇÃO | REQUERIDO NO PAYLOAD | EXEMPLO DE DADO ESPERADO |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PK interna, gerada automaticamente | Não esperado | |
| `order_id` | UUID | FK = core_orders.id. Identificador do pedido. | Fornecido na lógica da aplicação | `"<UUID>"` |
| `external_id` | TEXT | (Não especificado) | Fornecido na lógica da aplicação | `"VOHZ...-1"` |
| `product_variant_id` | UUID | FK = core_product_variants.id. Identificador do produto. | Fornecido na lógica da aplicação | `"<UUID VOHZ..._1>"` |
| `item_seq` | INT | Código sequencial do item | Obrigatório | `1` |
| `qty_ordered` | NUMERIC | Quantidade solicitada | Obrigatório | `12.0` |
| `unit_cost_est` | NUMERIC(14,4) | Custo estimado por unidade | Obrigatório | `112.55` |
| `notes` | TEXT | Observações | Opcional | |
| `created_at` | TIMESTAMPTZ | Data e hora de quando foi criado | Não esperado | |
| `updated_at` | TIMESTAMPTZ | Data e hora da última vez que foi atualizado | Não esperado | |

## core_documents
> **O que gerencia:** Todos os documentos fiscais ou comerciais emitidos/recebidos (nota de fornecedor, nota de transferência, cupom de venda, devolução etc.).
> **Função principal:** Armazena o cabeçalho de cada documento, incluindo tipo (SUPPLIER_IN, TRANSFER_OUT, TRANSFER_IN, RETURN, SALE), vínculo ao pedido correspondente (quando houver), data de emissão, valor total e status de processamento (pré-baixa, efetivado etc.).

| PROPRIEDADE | TIPO DE DADO | DESCRIÇÃO | REQUERIDO NO PAYLOAD | EXEMPLO DE DADO ESPERADO |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PK interna, gerada automaticamente | Não esperado | |
| `order_id` | UUID | FK = core_orders.id | Fornecido na lógica da aplicação | |
| `external_id` | TEXT | Nº NF, cupom ou chave de acesso | Obrigatório | `"3"` |
| `type` | ENUM('SUPPLIER_IN', 'TRANSFER_OUT', 'TRANSFER_IN', 'RETURN', 'SALE') | Tipo de documento:<br>• `SUPPLIER_IN` - Nota Fiscal de Entrada de Fornecedor: Documento emitido por um fornecedor externo quando vende produtos para o CD. Sempre associado a uma ordem de compra aprovada.<br>• `TRANSFER_OUT` - Nota Fiscal de Saída de Transferência: Documento emitido pelo CD quando produtos saem em direção a uma loja. Normalmente criado automaticamente a partir de uma ordem de transferência.<br>• `TRANSFER_IN` - Nota Fiscal de Entrada de Transferência: Documento gerado pela loja ao receber itens quando ocorre transferência entre CD e loja. Normalmente associado a uma ordem de transferência e uma nota fiscal de saída.<br>• `RETURN` - Devolução: Usado quando há devolução de produto pelo consumidor (arrependimento, troca etc.).<br>• `SALE` - Venda ao Cliente Final: Representa o cupom fiscal ou nota de venda registrada no ponto de venda (PDV) da loja. Usa-se este evento para que o estoque da loja seja atualizado. | Obrigatório | `"SUPPLIER_IN"` |
| `issue_date` | DATE | Data de emissão do documento | Obrigatório | `"2020-05-30"` |
| `total_value` | NUMERIC | Valor total | Obrigatório | `1500.00` |
| `status` | ENUM('...') | • `PENDENTE`: Pedido criado, mas fornecedor ainda não faturou<br>• `PRÉ-BAIXA`: NF recebida, mas ainda não conferida no CD<br>• `AGUARDANDO_CONFERENCIA_CD`: Aguardando conferência no CD<br>• `EM_CONFERENCIA_CD`: Picking e conferência no CD iniciados (já é possível ter divergências parciais)<br>• `CONFERENCIA_CD_OK`: Conferência finalizada sem divergências (itens OK, qtd OK)<br>• `CONFERENCIA_CD_COM_DIVERGENCIA`: Conferência finalizada com ressalvas ou divergências (item divergente, qtd <>).<br>**Transferência CD -> Loja (TRANSFER_OUT)**<br>• `PEDIDO_TRANSFERENCIA_CRIADO`: Pedido de transferência criado (novo mapa)<br>• `MAPA_SEPARACAO_CRIADO`: Mapa de Separação foi gerado<br>• `AGUARDANDO_SEPARACAO_CD`: Aguardando início da separação (antes de gerar expedição)<br>• `EM_SEPARACAO_CD`: Separação em progresso<br>• `SEPARACAO_CD_OK`: Separação concluída sem divergências<br>• `SEPARACAO_CD_COM_DIVERGENCIA`: Picking concluído com divergências<br>• `EMBARCADO_CD`: Mercadoria em trânsito<br>• `AGUARDANDO_CONFERENCIA_LOJA`: Aguardando conferência na loja<br>• `CONFERENCIA_LOJA_OK`: Conferência na loja concluída sem divergências<br>• `CONFERENCIA_LOJA_COM_DIVERGENCIA`: Conferência na loja concluída com divergências<br>• `EFETIVADO_LOJA`: Efetivado no estoque da loja<br>**Venda**<br>• `VENDA_CONCLUIDA`: Venda concluída, cupom emitido<br>**Ciclo de devolução (RETURN)**<br>• `DEVOLUCAO_CONCLUIDA`: Apurando entrada na NF de devolução<br>• `REENTRADA_LOJA_OK`: Devolução efetivada e estoque atualizado | Obrigatório | `"PRE_BAIXA"` |
| `origin_location_id` | UUID | FK = core_locations.id. Localização que emitiu o documento | Não esperado | |
| `dest_location_id` | UUID | FK = core_locations.id. Localização que recebeu o documento | Não esperado | |
| `created_at` | TIMESTAMPTZ | Data e hora de quando foi criado | Não esperado | |
| `updated_at` | TIMESTAMPTZ | Data e hora da última vez que foi atualizado | Não esperado | |

## core_document_items
> **O que gerencia:** Lista de itens para cada documento fiscal registrado em `core_documents`.
> **Função principal:** Detalha, para cada `document_id`, quais produtos entraram ou saíram naquele documento, com quantidade e valor unitário, permitindo conferir divergências entre o pedido inicial e o que realmente foi faturado.

| PROPRIEDADE | TIPO DE DADO | DESCRIÇÃO | REQUERIDO NO PAYLOAD | EXEMPLO DE DADO ESPERADO |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PK interna, gerada automaticamente | Não esperado | |
| `document_id` | UUID | FK = core_documents.id | Fornecido na lógica da aplicação | `"<UUID>"` |
| `product_variant_id` | UUID | FK = core_product_variants.id. Identificador do variante. | Fornecido na lógica da aplicação | `"VONZ002AZUL34"` |
| `item_seq` | INT | Identificador do item na NF. | Obrigatório | `1` |
| `unit_price` | NUMERIC(14,4) | Preço unitário | Obrigatório | `125.0` |
| `qty_expected` | NUMERIC | Quantidade que deveria chegar conforme o pedido (a escolher) | Opcional | |
| `qty_scanned_ok` | NUMERIC | Total acumulado de unidades conferidas sem divergência | Opcional | |
| `qty_scanned_diff` | NUMERIC | Total acumulado de unidades marcadas com divergência (defeituoso) | Opcional | |
| `created_at` | TIMESTAMPTZ | Data e hora de quando foi criado | Não esperado | |
| `updated_at` | TIMESTAMPTZ | Data e hora da última vez que foi atualizado | Não esperado | |

## core_movements
> **O que gerencia:** Histórico de mudanças de quantidade de estoques, entendidas como eventos de entrada e saída.
> **Função principal:** Registra cada movimento (recebimento no CD, saída de transferência, entrada na loja, venda, devolução etc.) com um tipo (CD_RECEIPT, CD_TRANSFER, STORE_RECEIPT, SALE, RETURN), local, produto, quantidade alterada (positiva ou negativa) e a referência que gerou esse movimento (por exemplo, o documento que causou a movimentação).

| PROPRIEDADE | TIPO DE DADO | DESCRIÇÃO | REQUERIDO NO PAYLOAD | EXEMPLO DE DADO ESPERADO |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PK interna, gerada automaticamente | Não esperado | |
| `product_id` | UUID | FK = core_products.id. Referência ao produto. | Fornecido na lógica da aplicação | `"<v.ub_p01>"` |
| `variant_id` | UUID | FK = core_product_variants.id. Identificador do variante. | Fornecido na lógica da aplicação | `"<v.ub_p01v>"` |
| `location_id` | UUID | FK = core_locations.id. Identificador da localização onde ocorre a movimentação. | Fornecido na lógica da aplicação | `"<v.ub_L01>"` |
| `reference_id` | UUID | Pode ser ID de documento ou outro movimento correlato | Fornecido na lógica da aplicação | `"<v.ub_D01>"` |
| `movement_type` | ENUM('CD_RECEIPT', 'CD_TRANSFER', 'STORE_RECEIPT', 'SALE', 'RETURN') | Natureza do movimento:<br>• `CD_RECEIPT` - Recebimento no CD. Indica que produtos entraram no estoque do Centro de Distribuição a partir de um fornecedor externo. Geralmente é disparado quando o documento do tipo SUPPLIER_IN é efetivado.<br>• `CD_TRANSFER` - Saída do CD para a loja. Indica que produtos saíram do estoque de um local interno (normalmente, uma loja).<br>• `STORE_RECEIPT` - Recebimento na Loja. Registra a entrada de produtos no estoque da loja, geralmente quando a nota de transferência chega (TRANSFER_IN) e é efetivada no ponto de venda (PDV) da loja.<br>• `SALE` - Venda na Loja. Registra a saída do estoque da loja quando o produto é vendido ao cliente final (associado ao documento SALE).<br>• `RETURN` - Devolução na Loja. Indica o retorno de um item ao estoque da loja ou de um mesmo tipo em outra. Geralmente disparado para documento RETURN, na NF devolução. | Obrigatório | `"CD_RECEIPT"` |
| `qty_change` | NUMERIC | Positivo ou negativo | Obrigatório | `12.0` |
| `movement_ts` | TIMESTAMPTZ | Momento do evento | Obrigatório | `"2020-05-30T18Z"` |
| `created_at` | TIMESTAMPTZ | Data e hora de quando foi criado | Não esperado | |
| `updated_at` | TIMESTAMPTZ | Data e hora da última vez que foi atualizado | Não esperado | |

## core_inventory_snapshots
> **O que gerencia:** Visão instantânea ("foto") dos níveis de estoque de cada produto em cada local.
> **Função principal:** Mantém, para cada combinação `location_id` + `product_id`, a quantidade disponível naquele momento, atualizada por triggers ou processos que somam/subtraem a partir de `core_movements`. Serve para consultas rápidas de estoque sem precisar somar todo o histórico.

| PROPRIEDADE | TIPO DE DADO | DESCRIÇÃO | REQUERIDO NO PAYLOAD | EXEMPLO DE DADO ESPERADO |
| :--- | :--- | :--- | :--- | :--- |
| `id` | PK | PK interna, gerada automaticamente | Não esperado | |
| `product_id` | UUID | FK = core_products.id. Referência principal do produto. | Fornecido na lógica da aplicação | `"<UUID>"` |
| `variant_id` | UUID | FK = core_product_variants.id | Fornecido na lógica da aplicação | `"<VONZ002AZUL34>"` |
| `location_id` | UUID | FK = core_locations.id. Identificador da localização no ERP. | Fornecido na lógica da aplicação | `"<UUID>"` |
| `qty_on_hand` | NUMERIC | Saldo atual calculado | Obrigatório | `320.0` |
| `last_update_ts` | TIMESTAMPTZ | Última recalculada | Obrigatório | `"2020-05-30T18:00Z"` |
| `created_at` | TIMESTAMPTZ | Data e hora de quando foi criado | Não esperado | |
| `updated_at` | TIMESTAMPTZ | Data e hora da última vez que foi atualizado | Não esperado | |

## core_events
> **O que gerencia:** Centraliza o log de eventos de mudança de estado em qualquer entidade (pedido, documento, movimentação).
> **Função principal:** Centraliza todos os status e transições (como "pedido aprovado", "início de conferência no CD", "documento efetivado" etc.), armazenando `entity_type`, `entity_id`, `event_code`, `timestamp` e `payload` adicional. Isso possibilita auditoria completa e acionamento de regras ou alertas em cada etapa.

| PROPRIEDADE | TIPO DE DADO | DESCRIÇÃO | REQUERIDO NO PAYLOAD | EXEMPLO DE DADO ESPERADO |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PK interna, gerada automaticamente | Não esperado | |
| `entity_type` | ENUM ('ORDER', 'DOCUMENT', 'MOVEMENT') | A qual entidade o evento pertence | Obrigatório | `"DOCUMENT"` |
| `entity_id` | UUID | ID da entidade referida | Fornecido na lógica da aplicação | `"<docu_ZDA1>"` |
| `event_code` | ENUM | **Código esperado do event_type. Mais comum:**<br>**Ciclo de compra:**<br>• `order_created`: Pedido de compra criado no ERP<br>• `order_approved`: Pedido de compra aprovado<br>• `pre_receipt_created`: Pré-baixa da nota criada no ERP<br>• `receipt_conference_started`: CD iniciou conferência da nota do fornecedor<br>• `receipt_conference_finished`: Conferência da nota finalizada no CD<br>• `transfer_order_created`: Pedido de transferência criado (para Comercial).<br>• `separation_map_created`: Mapa de separação gerado<br>• `separation_in_progress`: CD começou a separação<br>• `transfer_embarked`: CD finalizou separação e embarcou para loja.<br>• `store_receipt_started`: Loja iniciou conferência.<br>• `store_receipt_effective`: Loja concluiu conferência e efetivou na entrega.<br>**Ciclo de devolução:**<br>• `return_advice_created`: Devolução avisada há menos 30d.<br>• `return_in_progress`: Devolução em andamento (chegada no CD)<br>• `manual_stock_change_created`: Ordem manual de troca física de posto (>30 dias). | Obrigatório | `"receipt_in_ok"` |
| `event_ts` | TIMESTAMPTZ | Data/hora do evento | Obrigatório | `"2020-08-30T18:30Z"` |
| `payload` | JSONB | Dados extras do log (ex: divergências) | Obrigatório | `"{'qty': 2}"` |
| `created_at` | TIMESTAMPTZ | Data e hora de quando foi criado | Não esperado | |
| `updated_at` | TIMESTAMPTZ | Data e hora da última vez que foi atualizado | Não esperado | |