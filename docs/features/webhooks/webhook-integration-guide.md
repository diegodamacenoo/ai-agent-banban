# Guia de Integração - Webhooks ERP para BanBan AI Agent

> **📋 Última Atualização**: Janeiro 2025  
> **✅ Status**: Implementação Completa - Pronto para Deploy  
> **🔄 Abordagem**: Fluxos de Processo de Negócio

## Visão Geral

Este documento fornece instruções completas para integração com os webhooks do sistema BanBan, organizados por **fluxos de processo de negócio** do ERP. Cada fluxo representa um processo completo do seu sistema ERP.

## Informações de Conexão

- **URL Base**: `https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/`
- **Método**: `POST`
- **Content-Type**: `application/json`
- **Autenticação**: Bearer Token
- **Token de Produção**: `BnbNwhTknprD2o25suPasEc`
- **Token de Teste**: `banban_webhook_test_2025`

## Estrutura do Payload

### Formato Base

```json
{
  "event_type": "string",
  "timestamp": "ISO 8601 timestamp",
  "data": {
    // Dados específicos do fluxo
  }
}
```

### Campos Obrigatórios

- `event_type`: Tipo do fluxo (ex: "purchase_order_created", "sale_completed", "transfer_shipped")
- `timestamp`: Data/hora do evento em formato ISO 8601
- `data`: Objeto contendo os dados do fluxo

### ✅ Status dos Testes (Janeiro 2025)

**Todos os webhooks testados com 100% de sucesso:**
- Purchase Flow: 5/5 testes ✅
- Sales Flow: 3/3 testes ✅  
- Inventory Flow: 3/3 testes ✅
- Transfer Flow: 4/4 testes ✅

**Total**: 15/15 testes passaram (Taxa de sucesso: 100%)

## Fluxos de Integração

### 1. Fluxo de Compras (`webhook-purchase-flow`)

**Endpoint**: `/webhook-purchase-flow`  
**Descrição**: Fluxo completo desde criação do pedido de compra até recebimento no CD

#### Eventos Suportados:
- `purchase_order_created` - Pedido de compra criado
- `purchase_order_approved` - Pedido aprovado
- `goods_shipped` - Mercadoria enviada pelo fornecedor
- `goods_received_cd` - Mercadoria recebida no CD
- `receipt_verified_ok` - Conferência no CD sem divergência
- `receipt_verified_with_discrepancy` - Conferência no CD com divergência
- `receipt_effective_in_cd` - Efetivado no CD

#### Exemplo - Criação de Pedido de Compra:

```json
{
  "event_type": "purchase_order_created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "purchase_order": {
      "order_number": "PC2024001",
      "supplier_code": "FORN001",
      "supplier_name": "Vonpar Calçados",
      "total_value": 2685.00,
      "issue_date": "2024-01-15",
      "expected_delivery": "2024-01-25",
      "destination": "CD001"
    },
    "items": [
      {
        "item_sequence": 1,
        "product_code": "VONBX2099",
        "product_name": "Tênis Vonpar Boost",
        "variant_code": "VONBX2099AZUL34",
        "size": "34",
        "color": "AZUL",
        "quantity_ordered": 12,
        "unit_cost": 89.50,
        "total_cost": 1074.00,
        "notes": "Entrega prioritária"
      },
      {
        "item_sequence": 2,
        "product_code": "VONBX2099",
        "product_name": "Tênis Vonpar Boost",
        "variant_code": "VONBX2099AZUL35",
        "size": "35",
        "color": "AZUL",
        "quantity_ordered": 15,
        "unit_cost": 89.50,
        "total_cost": 1342.50
      }
    ]
  }
}
```

#### Exemplo - Recebimento com Nota Fiscal:

```json
{
  "event_type": "goods_received_cd",
  "timestamp": "2024-01-20T15:30:00Z",
  "data": {
    "purchase_order": {
      "order_number": "PC2024001"
    },
    "invoice": {
      "invoice_number": "NFE123456",
      "issue_date": "2024-01-20",
      "total_value": 2685.00,
      "supplier_code": "FORN001"
    },
    "received_items": [
      {
        "item_sequence": 1,
        "variant_code": "VONBX2099AZUL34",
        "quantity_invoiced": 12,
        "quantity_received": 11,
        "quantity_divergence": 1,
        "unit_price": 89.50,
        "divergence_reason": "Produto danificado"
      },
      {
        "item_sequence": 2,
        "variant_code": "VONBX2099AZUL35",
        "quantity_invoiced": 15,
        "quantity_received": 15,
        "quantity_divergence": 0,
        "unit_price": 89.50
      }
    ],
    "location": {
      "location_code": "CD001",
      "location_name": "Centro de Distribuição Principal"
    }
  }
}
```

### 2. Fluxo de Transferências (`webhook-transfer-flow`)

**Endpoint**: `/webhook-transfer-flow`  
**Descrição**: Fluxo de transferência entre localizações (CD para loja, loja para loja)

#### Eventos Suportados:
- `transfer_order_created` - Pedido de transferência criado
- `transfer_shipped` - Transferência enviada
- `transfer_received` - Transferência recebida
- `transfer_completed` - Transferência concluída

#### Exemplo - Transferência CD para Loja:

```json
{
  "event_type": "transfer_order_created",
  "timestamp": "2024-01-25T09:00:00Z",
  "data": {
    "transfer_order": {
      "order_number": "TR2024001",
      "origin_location": "CD001",
      "destination_location": "LOJA001",
      "total_value": 599.70,
      "issue_date": "2024-01-25",
      "expected_delivery": "2024-01-26"
    },
    "items": [
      {
        "item_sequence": 1,
        "variant_code": "VONBX2099AZUL34",
        "product_name": "Tênis Vonpar Boost Azul 34",
        "quantity_requested": 3,
        "unit_cost": 89.50,
        "unit_price": 199.90,
        "total_value": 599.70
      }
    ],
    "locations": {
      "origin": {
        "code": "CD001",
        "name": "Centro de Distribuição Principal",
        "type": "CD"
      },
      "destination": {
        "code": "LOJA001", 
        "name": "Loja Shopping Center",
        "type": "LOJA"
      }
    }
  }
}
```

### 3. Fluxo de Vendas (`webhook-sales-flow`)

**Endpoint**: `/webhook-sales-flow`  
**Descrição**: Fluxo de vendas nas lojas

#### Eventos Suportados:
- `sale_completed` - Venda concluída
- `sale_cancelled` - Venda cancelada
- `return_processed` - Devolução processada

#### Exemplo - Venda Concluída:

```json
{
  "event_type": "sale_completed",
  "timestamp": "2024-01-26T14:30:00Z",
  "data": {
    "sale": {
      "sale_number": "VD2024001",
      "location_code": "LOJA001",
      "total_value": 199.90,
      "payment_method": "CARTAO_CREDITO",
      "sale_date": "2024-01-26",
      "customer_cpf": "123.456.789-00"
    },
    "items": [
      {
        "item_sequence": 1,
        "variant_code": "VONBX2099AZUL34",
        "product_name": "Tênis Vonpar Boost Azul 34",
        "quantity_sold": 1,
        "unit_price": 199.90,
        "discount": 0.00,
        "total_price": 199.90
      }
    ],
    "location": {
      "code": "LOJA001",
      "name": "Loja Shopping Center",
      "type": "LOJA"
    }
  }
}
```

### 4. Fluxo de Cadastros (`webhook-inventory-flow`)

**Endpoint**: `/webhook-inventory-flow`  
**Descrição**: Sincronização de cadastros e atualizações de estoque

#### Eventos Suportados:
- `product_sync` - Sincronização de produtos
- `inventory_update` - Atualização de estoque
- `price_update` - Atualização de preços

#### Exemplo - Sincronização de Produtos:

```json
{
  "event_type": "product_sync",
  "timestamp": "2024-01-15T08:00:00Z",
  "data": {
    "product_sync": {
      "products": [
        {
          "product_code": "VONBX2099",
          "product_name": "Tênis Vonpar Boost",
          "description": "Tênis esportivo com tecnologia boost",
          "category": "CALÇADOS",
          "subcategory": "TÊNIS ESPORTIVO",
          "barcode": "7891234567890",
          "unit_measure": "PAR",
          "collection": "VERÃO 2024",
          "type": "CALÇADO",
          "gender": "UNISSEX",
          "supplier_code": "FORN001",
          "status": "ATIVO",
          "variants": [
            {
              "variant_code": "VONBX2099AZUL34",
              "size": "34",
              "color": "AZUL",
              "barcode_variant": "7891234567892",
              "sku": "VONBX2099-34-AZUL"
            },
            {
              "variant_code": "VONBX2099AZUL35",
              "size": "35", 
              "color": "AZUL",
              "barcode_variant": "7891234567893",
              "sku": "VONBX2099-35-AZUL"
            }
          ]
        }
      ]
    }
  }
}
```

#### Exemplo - Atualização de Estoque:

```json
{
  "event_type": "inventory_update",
  "timestamp": "2024-01-26T18:00:00Z",
  "data": {
    "inventory_snapshot": [
      {
        "location_code": "CD001",
        "location_name": "Centro de Distribuição Principal",
        "items": [
          {
            "variant_code": "VONBX2099AZUL34",
            "product_name": "Tênis Vonpar Boost Azul 34",
            "current_stock": 8,
            "last_movement": "2024-01-26T14:30:00Z",
            "last_movement_type": "TRANSFER_OUT"
          },
          {
            "variant_code": "VONBX2099AZUL35",
            "product_name": "Tênis Vonpar Boost Azul 35",
            "current_stock": 15,
            "last_movement": "2024-01-20T15:30:00Z",
            "last_movement_type": "RECEIPT"
          }
        ]
      },
      {
        "location_code": "LOJA001",
        "location_name": "Loja Shopping Center",
        "items": [
          {
            "variant_code": "VONBX2099AZUL34",
            "product_name": "Tênis Vonpar Boost Azul 34",
            "current_stock": 2,
            "last_movement": "2024-01-26T14:30:00Z",
            "last_movement_type": "SALE"
          }
        ]
      }
    ]
  }
}
```

## Respostas da API

### Resposta de Sucesso

```json
{
  "success": true,
  "message": "Fluxo processado com sucesso",
  "flow_summary": {
    "event_type": "purchase_order_created",
    "timestamp": "2024-01-15T10:30:00Z",
    "processed_at": "2024-01-15T10:30:15Z",
    "records_processed": 15,
    "records_successful": 15,
    "records_failed": 0,
    "success_rate": "100.00%"
  },
  "details": {
    "purchase_order": "PC2024001 criado com sucesso",
    "items_processed": 2,
    "supplier_validated": "FORN001 - Vonpar Calçados",
    "destination_validated": "CD001 - Centro de Distribuição Principal"
  }
}
```

### Resposta de Erro

```json
{
  "success": false,
  "error": "Token de autenticação inválido",
  "flow_context": {
    "event_type": "purchase_order_created",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Códigos de Status HTTP

- `200`: Sucesso (fluxo processado completamente)
- `400`: Payload inválido ou campos obrigatórios ausentes
- `401`: Token de autenticação inválido
- `405`: Método HTTP não permitido (use POST)
- `500`: Erro interno do servidor

## Teste da Integração

### Scripts de Teste Automatizados (Atualizados - Janeiro 2025)

**Scripts PowerShell para Windows**:
- `test-webhook-minimal.ps1` - Teste mínimo recomendado
- `run-webhook-tests.ps1` - Suite completa de testes por fluxo

**Arquivos de Payload**:
- `test-purchase-flow.json` - Dados de teste para purchase flow
- `test-sales-flow.json` - Dados de teste para sales flow
- `test-inventory-flow.json` - Dados de teste para inventory flow
- `test-transfer-flow.json` - Dados de teste para transfer flow

### Executar Testes (Método Recomendado)

```powershell
# Navegue até a pasta scripts
cd scripts

# Teste mínimo (recomendado executar primeiro)
.\test-webhook-minimal.ps1

# Teste de um fluxo específico
.\run-webhook-tests.ps1 purchase-flow
.\run-webhook-tests.ps1 sales-flow
.\run-webhook-tests.ps1 inventory-flow
.\run-webhook-tests.ps1 transfer-flow
```

### Teste Manual via cURL

```bash
curl -X POST \
  https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-purchase-flow \
  -H "Authorization: Bearer banban_webhook_test_2025" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "purchase_order_created",
    "timestamp": "2025-01-15T10:00:00Z",
    "data": {
      "purchase_order": {
        "order_number": "TEST-001",
        "supplier_code": "SUP001",
        "issue_date": "2025-01-15T10:00:00Z"
      },
      "items": [{
        "item_sequence": 1,
        "product_code": "PROD001",
        "variant_code": "VAR001",
        "quantity_ordered": 10,
        "unit_cost": 50
      }]
    }
  }'
```

## Fluxo Recomendado de Integração

### 1. Configuração Inicial
1. **Sincronização de Cadastros**: Use `webhook-inventory-flow` com `product_sync`
2. **Validação**: Confirme que produtos, fornecedores e localizações foram criados

### 2. Operações Diárias
1. **Pedidos de Compra**: Use `webhook-purchase-flow` para todo o ciclo de compras
2. **Transferências**: Use `webhook-transfer-flow` para movimentações entre localizações
3. **Vendas**: Use `webhook-sales-flow` para registrar vendas e devoluções

### 3. Atualizações Periódicas
1. **Estoque**: Use `webhook-inventory-flow` com `inventory_update` (recomendado: a cada hora)
2. **Preços**: Use `webhook-inventory-flow` com `price_update` quando necessário

## Contato e Suporte

- **Email Técnico**: diegohenrique@fingerscrossed.work
- **Documentação**: Este documento será atualizado conforme necessário

---

**⚠️ Importante**: Este documento segue a abordagem por **fluxos de processo**, organizando as integrações de acordo com os processos de negócio do seu ERP, não pelas tabelas internas do sistema BanBan.