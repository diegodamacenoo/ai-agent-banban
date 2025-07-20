# Guia das APIs ECA - BanBan Flow

## 📋 Sumário

- [Introdução](#introdução)
- [Conceitos Fundamentais](#conceitos-fundamentais)
- [Purchase Flow API](#purchase-flow-api)
- [Transfer Flow API](#transfer-flow-api)
- [Consulta de Dados](#consulta-de-dados)
- [Estados e Transições](#estados-e-transições)
- [Exemplos Práticos (PowerShell)](#exemplos-práticos-powershell)
- [Troubleshooting](#troubleshooting)
- [Suporte](#suporte)

---

## 🎯 Introdução

A arquitetura **ECA (Event-Condition-Action)** do BanBan Flow substitui as APIs legacy por um sistema unificado, rastreável e baseado em máquina de estados. Esta documentação orienta desenvolvedores na integração com as novas APIs.

---

## 🧠 Conceitos Fundamentais

A API opera sobre um modelo de `action` e `attributes`. A `action` define a operação a ser executada, e os `attributes` contêm os dados necessários para essa operação.

- **`action`**: Uma string que identifica a operação (e.g., `'create_order'`). **Deve ser sempre em minúsculas (snake_case)**.
- **`attributes`**: Um objeto JSON com os dados da transação. A estrutura deste objeto varia conforme a `action`.
- **`metadata`**: Um objeto opcional para incluir informações adicionais que não fazem parte do modelo de dados principal, mas são úteis para rastreamento ou depuração.

---

## 🛒 Purchase Flow API

### Endpoint

`POST http://localhost:4000/api/webhooks/banban/purchase`

### Actions Disponíveis

- `create_order`
- `approve_order`
- `register_invoice`
- `arrive_at_cd`
- `start_conference`
- `scan_items`
- `effectuate_cd`

---

## 🚚 Transfer Flow API

### Endpoint

`POST http://localhost:4000/api/webhooks/banban/transfer`

### Actions Disponíveis

- `create_transfer_request`
- `create_separation_map`
- `start_separation`
- `complete_separation`
- `ship_transfer`
- `invoice_transfer`
- `start_store_conference`
- `scan_store_items`
- `effectuate_store`

---

## 📤 Returns Flow API

### Endpoint

`POST http://localhost:4000/api/webhooks/banban/returns`

### Actions Disponíveis

- `request_return`
- `complete_return`
- `transfer_between_stores`

---

## 📊 Consulta de Dados

### Consultar Transações (Purchase e Transfer)

É possível filtrar as transações por diversos parâmetros via GET.

**Endpoint (Exemplo Purchase):**
`GET http://localhost:4000/api/v1/banban/purchase`

**Parâmetros de Query Comuns:**

- `external_id`, `status`, `limit`, `offset`.

---

## 🔄 Estados e Transições

### Purchase Flow - Máquina de Estados

```mermaid
graph TD
    A[PENDENTE] --> B[APPROVED]
    B --> C[PRE_BAIXA]
    C --> D[AGUARDANDO_CONFERENCIA_CD]
    D --> E[EM_CONFERENCIA_CD]
    E --> F{scan_items}
    F -->|Item sem divergência| G[CONFERENCIA_CD_SEM_DIVERGENCIA]
    F -->|Item com divergência| H[CONFERENCIA_CD_COM_DIVERGENCIA]
    G -->|Próximo item| F
    H -->|Próximo item| F
    G --> I[EFETIVADO_CD]
    H --> I[EFETIVADO_CD]

    style F fill:#e1f5fe
    style G fill:#c8e6c9
    style H fill:#ffcdd2
```

### Transfer Flow - Máquina de Estados

```mermaid
graph TD
    subgraph "CD"
        A[PEDIDO_TRANSFERENCIA_CRIADO] --> B[MAPA_SEPARACAO_CRIADO]
        B --> C[EM_SEPARACAO_CD]
        C --> D{SEPARACAO_CD}
        D --> D1[SEM_DIVERGENCIA]
        D --> D2[COM_DIVERGENCIA]
        D1 --> E[EMBARCADO_CD]
        D2 --> E[EMBARCADO_CD]
        E --> F[TRANSFERENCIA_FATURADA]
    end
    subgraph "Loja"
        G[AGUARDANDO_CONFERENCIA_LOJA] --> H[EM_CONFERENCIA_LOJA]
        H --> I{CONFERENCIA_LOJA}
        I --> I1[SEM_DIVERGENCIA]
        I --> I2[COM_DIVERGENCIA]
        I1 --> J[EFETIVADO_LOJA]
        I2 --> J[EFETIVADO_LOJA]
    end
    F --> G
```

### Returns Flow - Máquina de Estados

```mermaid
graph TD
    subgraph "Devolução Mesma Loja"
        A[DEVOLUCAO_AGUARDANDO] --> B[DEVOLUCAO_CONCLUIDA]
    end
    subgraph "Devolução Loja Diferente"
        C[DEVOLUCAO_AGUARDANDO] --> D[DEVOLUCAO_CONCLUIDA]
        D --> E[TRANSFERENCIA_ENTRE_LOJAS]
    end
    
    style E fill:#fff2cc
```

---

## 💡 Exemplos Práticos (curl)

**Nota:** Use uma API Key válida criada com `node scripts/create-initial-api-key.js`. A API Key deve começar com `ak_` e ter 64 caracteres hexadecimais.

### Fluxo Completo de Compra

```bash
# 1. Criar Pedido de Compra
curl -X POST "http://localhost:4000/api/webhooks/banban/purchase" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create_order",
    "attributes": {
      "external_id": "PS-FINAL-001",
      "supplier_external_id": "FORNEC-FINAL",
      "items": [
        {
          "product_external_id": "SKU-FINAL-1",
          "quantity": 5,
          "unit_price": 9.99
        }
      ]
    }
  }'

# 2. Aprovar Pedido de Compra
curl -X POST "http://localhost:4000/api/webhooks/banban/purchase" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve_order",
    "attributes": {
      "external_id": "PS-FINAL-001"
    }
  }'

# 3. Registrar Nota Fiscal
curl -X POST "http://localhost:4000/api/webhooks/banban/purchase" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "register_invoice",
    "attributes": {
      "external_id": "PS-NFE-FINAL-001",
      "purchase_order_external_id": "PS-FINAL-001"
    }
  }'

# 4. Chegada no CD
curl -X POST "http://localhost:4000/api/webhooks/banban/purchase" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "arrive_at_cd",
    "attributes": {
      "invoice_external_id": "PS-NFE-FINAL-001"
    }
  }'

# 5. Iniciar Conferência
curl -X POST "http://localhost:4000/api/webhooks/banban/purchase" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "start_conference",
    "attributes": {
      "invoice_external_id": "PS-NFE-FINAL-001"
    }
  }'

# 6. Escanear Itens (Item por Item - Nova Lógica)
# 6.1. Primeiro item (sem divergência)
curl -X POST "http://localhost:4000/api/webhooks/banban/purchase" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "scan_items",
    "attributes": {
      "invoice_external_id": "PS-NFE-FINAL-001",
      "items": [
        {
          "product_external_id": "SKU-FINAL-1",
          "qty_expected": 5,
          "qty_scanned": 5,
          "qty_diff": 0,
          "location_external_id": "E-5-3"
        }
      ]
    }
  }'

# 6.2. Segundo item (com divergência)
curl -X POST "http://localhost:4000/api/webhooks/banban/purchase" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "scan_items",
    "attributes": {
      "invoice_external_id": "PS-NFE-FINAL-001",
      "items": [
        {
          "product_external_id": "SKU-FINAL-2",
          "qty_expected": 3,
          "qty_scanned": 2,
          "qty_diff": -1,
          "location_external_id": "E-5-3"
        }
      ]
    }
  }'

# 7. Efetivar no CD
curl -X POST "http://localhost:4000/api/webhooks/banban/purchase" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "effectuate_cd",
    "attributes": {
      "invoice_external_id": "PS-NFE-FINAL-001"
    }
  }'

echo "Fluxo de Compra com Nova Lógica de Conferência Concluído!"
echo "Status final derivado automaticamente: CONFERENCIA_CD_COM_DIVERGENCIA (devido ao SKU-FINAL-2)"
```

### Ciclo de Vida Completo: Compra → Transferência → Venda → Devolução

```bash
# ========================================
# PARTE 1: FLUXO DE COMPRA (já visto acima)
# ========================================
# Resultado: Produtos no estoque do CD

# ========================================
# PARTE 2: TRANSFERÊNCIA CD → LOJA
# ========================================

# 8. Criar Pedido de Transferência
curl -X POST "http://localhost:4000/api/webhooks/banban/transfer" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create_transfer_request",
    "attributes": {
      "external_id": "PT-LOJA-001",
      "origin_location_external_id": "CD-001",
      "destination_location_external_id": "LOJA-SP-001",
      "items": [
        { "product_external_id": "SKU-FINAL-1", "quantity": 3 },
        { "product_external_id": "SKU-FINAL-2", "quantity": 1 }
      ]
    }
  }'

# 9. Criar Mapa de Separação
curl -X POST "http://localhost:4000/api/webhooks/banban/transfer" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create_separation_map",
    "attributes": {
      "external_id": "PT-LOJA-001"
    }
  }'

# 10. Iniciar Separação no CD
curl -X POST "http://localhost:4000/api/webhooks/banban/transfer" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "start_separation",
    "attributes": {
      "external_id": "PT-LOJA-001"
    }
  }'

# 11. Finalizar Separação (sem divergência)
curl -X POST "http://localhost:4000/api/webhooks/banban/transfer" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "complete_separation",
    "attributes": {
      "external_id": "PT-LOJA-001",
      "items": [
        { "product_external_id": "SKU-FINAL-1", "qty_separated": 3 },
        { "product_external_id": "SKU-FINAL-2", "qty_separated": 1 }
      ]
    }
  }'

# 12. Embarcar Transferência
curl -X POST "http://localhost:4000/api/webhooks/banban/transfer" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "ship_transfer",
    "attributes": {
      "transfer_external_id": "PT-LOJA-001",
      "items_shipped": [
        {
          "variant_external_id": "SKU-FINAL-1",
          "qty_shipped": 3,
          "product_name": "Produto Final 1"
        },
        {
          "variant_external_id": "SKU-FINAL-2",
          "qty_shipped": 1,
          "product_name": "Produto Final 2"
        }
      ]
    }
  }'

# 13. Faturar Transferência (emitir NF de saída)
curl -X POST "http://localhost:4000/api/webhooks/banban/transfer" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "invoice_transfer",
    "attributes": {
      "external_id": "PT-LOJA-001",
      "invoice_external_id": "NFE-TRANSF-001"
    }
  }'

# ========================================
# PARTE 3: RECEBIMENTO NA LOJA
# ========================================

# 14. Iniciar Conferência na Loja
curl -X POST "http://localhost:4000/api/webhooks/banban/transfer" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "start_store_conference",
    "attributes": {
      "invoice_external_id": "NFE-TRANSF-001"
    }
  }'

# 15. Conferir Itens na Loja (item por item)
curl -X POST "http://localhost:4000/api/webhooks/banban/transfer" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "scan_store_items",
    "attributes": {
      "invoice_external_id": "NFE-TRANSF-001",
      "items": [
        {
          "product_external_id": "SKU-FINAL-1",
          "qty_expected": 3,
          "qty_scanned": 3,
          "qty_diff": 0,
          "location_external_id": "LOJA-SP-001"
        }
      ]
    }
  }'

# 16. Efetivar na Loja
curl -X POST "http://localhost:4000/api/webhooks/banban/transfer" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "effectuate_store",
    "attributes": {
      "invoice_external_id": "NFE-TRANSF-001"
    }
  }'

# ========================================
# PARTE 4: VENDA AO CLIENTE
# ========================================

# 17. Registrar Venda
curl -X POST "http://localhost:4000/api/webhooks/banban/sales" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "register_sale",
    "attributes": {
      "external_id": "VENDA-001",
      "location_external_id": "LOJA-SP-001",
      "customer_external_id": "CLIENTE-123",
      "sale_date": "2025-07-08T14:30:00Z",
      "total_value": 199.99,
      "items": [
        {
          "product_external_id": "SKU-FINAL-1",
          "quantity": 1,
          "unit_price": 199.99,
          "total_price": 199.99
        }
      ]
    }
  }'

# ========================================
# PARTE 5: DEVOLUÇÃO DO CLIENTE
# ========================================

# 18. Solicitar Devolução (Mesma Loja)
curl -X POST "http://localhost:4000/api/webhooks/banban/returns" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "request_return",
    "attributes": {
      "external_id": "DEV-001",
      "original_sale_external_id": "VENDA-001",
      "return_reason": "Defeito no produto",
      "return_date": "2025-07-10T10:00:00Z",
      "items": [
        {
          "product_external_id": "SKU-FINAL-1",
          "quantity": 1,
          "return_reason": "Produto com defeito"
        }
      ]
    }
  }'

# 19. Completar Devolução (emitir NF de devolução)
curl -X POST "http://localhost:4000/api/webhooks/banban/returns" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "complete_return",
    "attributes": {
      "external_id": "DEV-001",
      "return_invoice_external_id": "NFE-DEV-001",
      "refund_amount": 199.99
    }
  }'

echo "🎉 CICLO COMPLETO FINALIZADO!"
echo "📦 Compra: PS-FINAL-001 → CD efetivado"
echo "🚚 Transferência: PT-LOJA-001 → Loja efetivada"
echo "💰 Venda: VENDA-001 → Cliente comprou"
echo "↩️  Devolução: DEV-001 → Produto devolvido ao estoque"

# ========================================
# PARTE 6: DEVOLUÇÃO EM LOJA DIFERENTE
# ========================================

# 🔄 CENÁRIO: Cliente comprou na LOJA-SP-001 mas devolve na LOJA-RJ-001
# O sistema automaticamente cria transferência interna entre lojas

# 20. Solicitar Devolução em Loja Diferente
curl -X POST "http://localhost:4000/api/webhooks/banban/returns" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "request_return",
    "attributes": {
      "external_id": "DEV-LOJA-DIFF-001",
      "original_sale_external_id": "VENDA-001",
      "return_reason": "Troca de tamanho",
      "return_date": "2025-07-12T15:30:00Z",
      "return_location_external_id": "LOJA-RJ-001",
      "items": [
        {
          "product_external_id": "SKU-FINAL-1",
          "quantity": 1,
          "return_reason": "Tamanho incorreto"
        }
      ]
    }
  }'

# 21. Completar Devolução em Loja Diferente
curl -X POST "http://localhost:4000/api/webhooks/banban/returns" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "complete_return",
    "attributes": {
      "external_id": "DEV-LOJA-DIFF-001",
      "return_invoice_external_id": "NFE-DEV-RJ-001",
      "refund_amount": 199.99
    }
  }'

# 22. Transferência Automática Entre Lojas
# O sistema detecta automaticamente que a devolução foi em loja diferente
# e cria uma transferência interna para regularizar o estoque
curl -X POST "http://localhost:4000/api/webhooks/banban/returns" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "transfer_between_stores",
    "attributes": {
      "external_id": "TRANSF-DEVOLUCAO-001",
      "origin_store_external_id": "LOJA-RJ-001",
      "destination_store_external_id": "LOJA-SP-001",
      "transfer_reason": "Regularização de devolução em loja diferente",
      "items": [
        {
          "variant_external_id": "SKU-FINAL-1",
          "qty": 1,
          "product_name": "Produto Final 1"
        }
      ]
    }
  }'

echo "🔄 DEVOLUÇÃO EM LOJA DIFERENTE PROCESSADA!"
echo "📍 Venda Original: LOJA-SP-001"
echo "📍 Devolução: LOJA-RJ-001"
echo "🚚 Transferência: LOJA-RJ-001 → LOJA-SP-001"
echo "✅ Estoque regularizado automaticamente"
```

### Monitoramento e Consultas do Ciclo Completo

```bash
# ========================================
# CONSULTAS DE ACOMPANHAMENTO
# ========================================

# Verificar status da compra
purchase=$(curl -s "http://localhost:4000/api/webhooks/banban/purchase?external_id=PS-NFE-FINAL-001" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d")
echo "Status da Compra: $(echo $purchase | jq -r '.data.transactions[0].status')"

# Verificar status da transferência
transfer=$(curl -s "http://localhost:4000/api/webhooks/banban/transfer?external_id=PT-LOJA-001" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d")
echo "Status da Transferência: $(echo $transfer | jq -r '.data.transactions[0].status')"

# Verificar status da venda
sale=$(curl -s "http://localhost:4000/api/webhooks/banban/sales?external_id=VENDA-001" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d")
echo "Status da Venda: $(echo $sale | jq -r '.data.transactions[0].status')"

# Verificar status da devolução
return_data=$(curl -s "http://localhost:4000/api/webhooks/banban/returns?external_id=DEV-001" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d")
echo "Status da Devolução: $(echo $return_data | jq -r '.data.transactions[0].status')"

# Verificar status da transferência entre lojas
transfer_stores=$(curl -s "http://localhost:4000/api/webhooks/banban/returns?external_id=TRANSF-DEVOLUCAO-001" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d")
echo "Status da Transferência Entre Lojas: $(echo $transfer_stores | jq -r '.data.transactions[0].status')"

# ========================================
# RASTREABILIDADE COMPLETA DO PRODUTO
# ========================================

# Histórico completo do produto SKU-FINAL-1
product_history=$(curl -s "http://localhost:4000/api/v1/banban/inventory/movements?product_external_id=SKU-FINAL-1" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d")

echo "📊 RASTREABILIDADE DO PRODUTO SKU-FINAL-1:"
echo "1. Recebimento no CD: +5 unidades (compra)"
echo "2. Saída do CD: -3 unidades (transferência)"
echo "3. Entrada na Loja SP: +3 unidades (recebimento)"
echo "4. Venda na Loja SP: -1 unidade (venda)"
echo "5. Devolução na Loja RJ: +1 unidade (devolução em loja diferente)"
echo "6. Transferência Loja RJ → Loja SP: +1 unidade (regularização)"
echo "📦 Estoque Final: 2 unidades no CD + 3 unidades na Loja SP"

# ========================================
# ANALYTICS E MÉTRICAS
# ========================================

# Métricas de performance por período
analytics=$(curl -s "http://localhost:4000/api/v1/banban/analytics?date_from=2025-07-01&date_to=2025-07-31" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d")

echo "📈 MÉTRICAS DO PERÍODO:"
echo "• Taxa de divergência na conferência: 50% (1 de 2 SKUs)"
echo "• Tempo médio CD→Loja: $(echo $analytics | jq -r '.data.avg_transfer_time') horas"
echo "• Taxa de devolução: $(echo $analytics | jq -r '.data.return_rate')%"
echo "• Produtos mais transferidos: SKU-FINAL-1, SKU-FINAL-2"
```

---

## 🔍 Nova Lógica de Conferência (Atualizada)

### Conferência Item por Item

A partir desta versão, a conferência segue uma **lógica item por item** sem necessidade de trigger final:

#### ✅ **Como Funciona**

1. **`scan_items`**: A cada item escaneado, o sistema **deriva automaticamente** o status da NF
2. **Status Derivado**:
   - `CONFERENCIA_CD_SEM_DIVERGENCIA` se nenhum item tem divergência
   - `CONFERENCIA_CD_COM_DIVERGENCIA` se pelo menos um item tem divergência
3. **Movimentação de Estoque**: Criada **imediatamente** para cada item
4. **`effectuate_cd`**: Serve como **indicador** de que a conferência foi finalizada

#### 📋 **Vantagens**

- ⚡ **Tempo Real**: Status sempre atualizado
- 🔄 **Flexível**: Não precisa "declarar" fim da conferência
- 📊 **Rastreável**: Cada item escaneado é registrado imediatamente
- 🎯 **Simples**: `effectuate_cd` é o trigger natural de finalização

#### ❌ **APIs Removidas**

- `complete_conference` - Não é mais necessário
- O status é **derivado automaticamente** baseado nos itens escaneados

---

## 🔄 Transferência Entre Lojas (Devolução)

### Cenário de Uso

Quando um cliente realiza uma devolução em uma loja diferente da compra original, o sistema deve:

1. **Processar a devolução** na loja onde o cliente está
2. **Criar transferência interna** para regularizar o estoque
3. **Manter rastreabilidade** completa do produto

### ✅ **Como Funciona**

1. **Devolução**: Cliente devolve produto na Loja B (comprou na Loja A)
2. **Detecção Automática**: Sistema identifica que a devolução é em loja diferente
3. **Transferência**: Cria automaticamente transferência Loja B → Loja A
4. **Regularização**: Estoque fica correto em ambas as lojas

### 📋 **Vantagens**

- 🎯 **Automatização**: Processo automático sem intervenção manual
- 📊 **Rastreabilidade**: Histórico completo de movimentações
- ⚡ **Tempo Real**: Estoque atualizado imediatamente
- 🔄 **Flexibilidade**: Suporta qualquer combinação de lojas

### 💡 **Exemplo Prático**

```bash
# Cenário: Cliente comprou na LOJA-SP mas devolve na LOJA-RJ
# O sistema cria automaticamente uma transferência LOJA-RJ → LOJA-SP

# 1. Devolução em loja diferente
curl -X POST "http://localhost:4000/api/webhooks/banban/returns" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "request_return",
    "attributes": {
      "external_id": "DEV-DIFF-001",
      "original_sale_external_id": "VENDA-SP-001",
      "return_location_external_id": "LOJA-RJ-001",
      "items": [...]
    }
  }'

# 2. Transferência automática entre lojas
curl -X POST "http://localhost:4000/api/webhooks/banban/returns" \
  -H "Authorization: Bearer ak_559a73aa675e139a42cd957ee19b099cf1c88dfb15e50099809d09916518805d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "transfer_between_stores",
    "attributes": {
      "external_id": "TRANSF-REG-001",
      "origin_store_external_id": "LOJA-RJ-001",
      "destination_store_external_id": "LOJA-SP-001",
      "items": [...]
    }
  }'
```

### 🔍 **Estados Resultantes**

- **Devolução**: Status `DEVOLUCAO_CONCLUIDA`
- **Transferência**: Status `TRANSFERENCIA_ENTRE_LOJAS`
- **Inventário**: Atualizado automaticamente em ambas as lojas

---

## 🔧 Troubleshooting

### Erros Comuns

- **`body/action must be equal to one of the allowed values`**: A `action` enviada não existe ou está com a formatação errada (e.g., `CREATE_ORDER` em vez de `create_order`).
- **`"statusCode":401,"code":"FST_JWT_AUTHORIZATION_TOKEN_INVALID"`**: O token de autorização está ausente, é inválido ou expirou.
- **`Transição de estado inválida`**: Você está tentando executar uma ação fora da ordem lógica do fluxo.
- **`[nome_do_campo] são obrigatórios`**: Faltam campos essenciais no payload da sua ação.

---

## 📞 Suporte

### Contatos

- **Equipe de Desenvolvimento**: dev@banban.com
- **Suporte Técnico**: suporte@banban.com

### Recursos Adicionais

- [Postman Collection](https://postman.banban.com/eca-flows)
- [SDKs Oficiais](https://github.com/banban/eca-sdk)

---

**Versão**: 1.6  
**Última atualização**: 2025-07-09
**Compatibilidade**: APIs ECA v1.0+
**Novidades**:

- Nova lógica de conferência item por item
- Exemplos do ciclo de vida completo (Compra → Transferência → Venda → Devolução)
- **Documentação completa de transferência entre lojas em devoluções**
- **Returns Flow API** com action `transfer_between_stores`
- Monitoramento e rastreabilidade de produtos
- Cenários de devolução em loja diferente da compra
