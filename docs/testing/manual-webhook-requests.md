# 🎯 Comandos cURL para Simulação Manual de Webhooks

## 📋 Configurações Base

```bash
BASE_URL="https://bopytcghbmuywfltmwhk.supabase.co/functions/v1"
AUTH_TOKEN="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2Nzk4MDAsImV4cCI6MjA1MTI1NTgwMH0.YGKfKlmKNqxuJO8HsGQWJ2w9HGTqbqgw3VLJXLq4Yx8"
```

---

## 💰 SALES FLOW

### 1. Sale Completed
```bash
curl -X POST \
  'https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-sales-flow' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2Nzk4MDAsImV4cCI6MjA1MTI1NTgwMH0.YGKfKlmKNqxuJO8HsGQWJ2w9HGTqbqgw3VLJXLq4Yx8' \
  -H 'Content-Type: application/json' \
  -d '{
    "event_type": "sale_completed",
    "sale_id": "SALE-20250119-001",
    "customer_id": "CUST-12345",
    "items": [
      {
        "product_id": "PROD-001",
        "product_name": "Notebook Dell",
        "quantity": 1,
        "unit_price": 2500.00,
        "total_price": 2500.00
      },
      {
        "product_id": "PROD-002",
        "product_name": "Mouse Wireless",
        "quantity": 2,
        "unit_price": 50.00,
        "total_price": 100.00
      }
    ],
    "total_amount": 2600.00,
    "payment_method": "credit_card",
    "store_location": "STORE-SP-001",
    "timestamp": "2025-01-19T15:30:00.000Z"
  }'
```

### 2. Sale Cancelled
```bash
curl -X POST \
  'https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-sales-flow' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2Nzk4MDAsImV4cCI6MjA1MTI1NTgwMH0.YGKfKlmKNqxuJO8HsGQWJ2w9HGTqbqgw3VLJXLq4Yx8' \
  -H 'Content-Type: application/json' \
  -d '{
    "event_type": "sale_cancelled",
    "sale_id": "SALE-20250119-001",
    "customer_id": "CUST-12345",
    "cancellation_reason": "customer_request",
    "cancellation_details": "Cliente solicitou cancelamento por mudança de planos",
    "refund_amount": 2600.00,
    "refund_method": "credit_card",
    "cancelled_by": "customer",
    "store_location": "STORE-SP-001",
    "timestamp": "2025-01-19T15:35:00.000Z"
  }'
```

### 3. Return Processed
```bash
curl -X POST \
  'https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-sales-flow' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2Nzk4MDAsImV4cCI6MjA1MTI1NTgwMH0.YGKfKlmKNqxuJO8HsGQWJ2w9HGTqbqgw3VLJXLq4Yx8' \
  -H 'Content-Type: application/json' \
  -d '{
    "event_type": "return_processed",
    "return_id": "RET-20250119-001",
    "original_sale_id": "SALE-20250119-001",
    "customer_id": "CUST-12345",
    "returned_items": [
      {
        "product_id": "PROD-001",
        "product_name": "Notebook Dell",
        "quantity": 1,
        "return_reason": "defective",
        "condition": "damaged",
        "refund_amount": 2500.00
      }
    ],
    "total_refund": 2500.00,
    "return_method": "store_credit",
    "processed_by": "STAFF-001",
    "store_location": "STORE-SP-001",
    "timestamp": "2025-01-19T15:40:00.000Z"
  }'
```

---

## 🛒 PURCHASE FLOW

### 1. Purchase Completed
```bash
curl -X POST \
  'https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-purchase-flow' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2Nzk4MDAsImV4cCI6MjA1MTI1NTgwMH0.YGKfKlmKNqxuJO8HsGQWJ2w9HGTqbqgw3VLJXLq4Yx8' \
  -H 'Content-Type: application/json' \
  -d '{
    "event_type": "purchase_completed",
    "purchase_id": "PUR-20250119-001",
    "supplier_id": "SUPP-98765",
    "items": [
      {
        "product_id": "PROD-001",
        "product_name": "Notebook Dell",
        "quantity": 50,
        "unit_cost": 2000.00,
        "total_cost": 100000.00
      }
    ],
    "total_amount": 100000.00,
    "payment_terms": "30_days",
    "delivery_location": "WAREHOUSE-SP-001",
    "timestamp": "2025-01-19T16:00:00.000Z"
  }'
```

### 2. Purchase Cancelled
```bash
curl -X POST \
  'https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-purchase-flow' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2Nzk4MDAsImV4cCI6MjA1MTI1NTgwMH0.YGKfKlmKNqxuJO8HsGQWJ2w9HGTqbqgw3VLJXLq4Yx8' \
  -H 'Content-Type: application/json' \
  -d '{
    "event_type": "purchase_cancelled",
    "purchase_id": "PUR-20250119-002",
    "supplier_id": "SUPP-98765",
    "cancellation_reason": "supplier_unavailable",
    "cancellation_details": "Fornecedor não consegue entregar no prazo",
    "cancelled_by": "supplier",
    "timestamp": "2025-01-19T16:05:00.000Z"
  }'
```

---

## 📦 INVENTORY FLOW

### 1. Inventory Adjustment
```bash
curl -X POST \
  'https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-inventory-flow' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2Nzk4MDAsImV4cCI6MjA1MTI1NTgwMH0.YGKfKlmKNqxuJO8HsGQWJ2w9HGTqbqgw3VLJXLq4Yx8' \
  -H 'Content-Type: application/json' \
  -d '{
    "event_type": "inventory_adjustment",
    "adjustment_id": "ADJ-20250119-001",
    "product_id": "PROD-001",
    "location": "WAREHOUSE-SP-001",
    "adjustment_type": "manual_correction",
    "quantity_before": 100,
    "quantity_after": 95,
    "quantity_change": -5,
    "reason": "damaged_items",
    "adjusted_by": "STAFF-002",
    "timestamp": "2025-01-19T16:10:00.000Z"
  }'
```

### 2. Inventory Count
```bash
curl -X POST \
  'https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-inventory-flow' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2Nzk4MDAsImV4cCI6MjA1MTI1NTgwMH0.YGKfKlmKNqxuJO8HsGQWJ2w9HGTqbqgw3VLJXLq4Yx8' \
  -H 'Content-Type: application/json' \
  -d '{
    "event_type": "inventory_count",
    "count_id": "COUNT-20250119-001",
    "location": "WAREHOUSE-SP-001",
    "count_type": "cycle_count",
    "items_counted": [
      {
        "product_id": "PROD-001",
        "expected_quantity": 95,
        "actual_quantity": 93,
        "variance": -2
      },
      {
        "product_id": "PROD-002",
        "expected_quantity": 200,
        "actual_quantity": 200,
        "variance": 0
      }
    ],
    "total_variance": -2,
    "counted_by": "STAFF-003",
    "timestamp": "2025-01-19T16:15:00.000Z"
  }'
```

---

## 🔄 TRANSFER FLOW

### 1. Transfer Initiated
```bash
curl -X POST \
  'https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-transfer-flow' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2Nzk4MDAsImV4cCI6MjA1MTI1NTgwMH0.YGKfKlmKNqxuJO8HsGQWJ2w9HGTqbqgw3VLJXLq4Yx8' \
  -H 'Content-Type: application/json' \
  -d '{
    "event_type": "transfer_initiated",
    "transfer_id": "TRF-20250119-001",
    "from_location": "WAREHOUSE-SP-001",
    "to_location": "STORE-SP-001",
    "items": [
      {
        "product_id": "PROD-001",
        "product_name": "Notebook Dell",
        "quantity": 5
      },
      {
        "product_id": "PROD-002",
        "product_name": "Mouse Wireless",
        "quantity": 20
      }
    ],
    "transfer_reason": "stock_replenishment",
    "requested_by": "MANAGER-001",
    "expected_delivery": "2025-01-20T10:00:00.000Z",
    "timestamp": "2025-01-19T16:20:00.000Z"
  }'
```

### 2. Transfer Completed
```bash
curl -X POST \
  'https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-transfer-flow' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2Nzk4MDAsImV4cCI6MjA1MTI1NTgwMH0.YGKfKlmKNqxuJO8HsGQWJ2w9HGTqbqgw3VLJXLq4Yx8' \
  -H 'Content-Type: application/json' \
  -d '{
    "event_type": "transfer_completed",
    "transfer_id": "TRF-20250119-001",
    "from_location": "WAREHOUSE-SP-001",
    "to_location": "STORE-SP-001",
    "items_transferred": [
      {
        "product_id": "PROD-001",
        "product_name": "Notebook Dell",
        "quantity_sent": 5,
        "quantity_received": 5,
        "status": "complete"
      },
      {
        "product_id": "PROD-002",
        "product_name": "Mouse Wireless",
        "quantity_sent": 20,
        "quantity_received": 20,
        "status": "complete"
      }
    ],
    "completed_by": "STAFF-004",
    "completion_notes": "Transferência realizada com sucesso",
    "timestamp": "2025-01-20T09:30:00.000Z"
  }'
```

---

## 🧪 Como Testar

1. **Execute os comandos** em ordem para simular um fluxo completo
2. **Verifique o dashboard** em `http://localhost:3000/webhooks` após cada comando
3. **Observe os logs** na aba "Logs de Eventos" para ver os detalhes
4. **Monitore as métricas** na aba "Visão Geral" para ver as estatísticas atualizadas

## 📊 O que Observar

- ✅ **Status dos webhooks**: success/error
- ⏱️ **Tempo de processamento**: em millisegundos
- 📋 **Payload completo**: dados enviados e recebidos
- 🔍 **Logs detalhados**: para debugging
- 📈 **Métricas atualizadas**: no dashboard 