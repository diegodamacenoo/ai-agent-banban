# ECA APIs - Guia Rápido 🚀

## ⚡ Início Rápido em 5 Minutos

### 1. Configuração Básica

```bash
# Base URL
BASE_URL="https://api.banban.com"
TOKEN="seu-bearer-token"

# Headers padrão
HEADERS=(
  -H "Authorization: Bearer $TOKEN"
  -H "Content-Type: application/json"
)
```

### 2. Primeiro Pedido de Compra

```bash
# Criar pedido
curl -X POST "$BASE_URL/api/v1/banban/purchase" "${HEADERS[@]}" \
  -d '{
    "action": "CREATE_ORDER",
    "attributes": {
      "external_id": "PO-TESTE-001",
      "supplier_code": "FORNEC-001",
      "supplier_name": "Fornecedor Teste",
      "total_value": 1000.00,
      "issue_date": "2025-01-07",
      "expected_delivery": "2025-01-15",
      "items": [{
        "product_id": "SKU-TESTE-001",
        "quantity_ordered": 10,
        "unit_cost": 50.00,
        "unit_price": 100.00
      }]
    }
  }'
```

### 3. Primeira Transferência

```bash
# Criar transferência
curl -X POST "$BASE_URL/api/v1/banban/transfer" "${HEADERS[@]}" \
  -d '{
    "action": "CREATE_TRANSFER_REQUEST",
    "attributes": {
      "external_id": "PT-TESTE-001",
      "origin_location_external_id": "CD-001",
      "destination_location_external_id": "LOJA-001",
      "transfer_date": "2025-01-08T10:00:00Z",
      "items": [{
        "product_id": "SKU-TESTE-001",
        "quantity": 5
      }]
    }
  }'
```

### 4. Consultar Status

```bash
# Ver pedido
curl "$BASE_URL/api/v1/banban/purchase?external_id=PO-TESTE-001" "${HEADERS[@]}"

# Ver transferência
curl "$BASE_URL/api/v1/banban/transfer?external_id=PT-TESTE-001" "${HEADERS[@]}"
```

---

## 📝 Checklist de Implementação

### ✅ Requisitos Mínimos
- [ ] Token de autenticação válido
- [ ] External IDs únicos por tipo de transação
- [ ] Códigos de produto, fornecedor e localização cadastrados
- [ ] Seguir sequência de estados obrigatória

### ✅ Campos Obrigatórios por Fluxo

#### Purchase Flow
- [ ] `external_id` - ID único do pedido/NF
- [ ] `supplier_code` - Código do fornecedor
- [ ] `items[]` - Array com produtos
- [ ] `items[].product_id` - SKU do produto
- [ ] `items[].quantity_ordered` - Quantidade pedida

#### Transfer Flow
- [ ] `external_id` - ID único da transferência
- [ ] `origin_location_external_id` - Local origem
- [ ] `destination_location_external_id` - Local destino
- [ ] `items[]` - Array com produtos
- [ ] `items[].product_id` - SKU do produto
- [ ] `items[].quantity` - Quantidade a transferir

---

## 🎯 Casos de Uso Comuns

### Caso 1: Pedido Simples Sem Divergência

```javascript
// 1. Criar pedido
await api.post('/purchase', {
  action: 'CREATE_ORDER',
  attributes: { external_id: 'PO-001', ... }
});

// 2. Registrar NF
await api.post('/purchase', {
  action: 'REGISTER_INVOICE', 
  attributes: { external_id: 'NFE-001', order_number: 'PO-001' }
});

// 3. Chegada → Conferência → Efetivação
await api.post('/purchase', { action: 'ARRIVE_AT_CD', ... });
await api.post('/purchase', { action: 'START_CONFERENCE', ... });
await api.post('/purchase', { action: 'COMPLETE_CONFERENCE_OK', ... });
await api.post('/purchase', { action: 'EFFECTUATE_CD', ... });
```

### Caso 2: Transferência Com Divergência

```javascript
// 1. Criar → Separar com divergência
await api.post('/transfer', { action: 'CREATE_TRANSFER_REQUEST', ... });
await api.post('/transfer', { action: 'CREATE_SEPARATION_MAP', ... });
await api.post('/transfer', { action: 'START_SEPARATION', ... });
await api.post('/transfer', { 
  action: 'COMPLETE_SEPARATION_DIFF',
  attributes: {
    items: [{
      product_id: 'SKU-001',
      quantity_requested: 10,
      quantity_separated: 8,
      divergence_reason: 'Estoque insuficiente'
    }]
  }
});

// 2. Continuar fluxo normal
await api.post('/transfer', { action: 'SHIP_TRANSFER', ... });
await api.post('/transfer', { action: 'INVOICE_TRANSFER', ... });
```

### Caso 3: Monitoramento e Analytics

```javascript
// Consultar transações em andamento
const pendingOrders = await api.get('/purchase?status=PENDENTE');
const inTransit = await api.get('/transfer?status=EMBARCADO_CD');

// Analytics do período
const analytics = await api.get('/purchase/analytics?date_from=2025-01-01&date_to=2025-01-31');
console.log('Taxa de divergência:', analytics.data.divergence_rate);

// Rotas mais utilizadas
const routes = await api.get('/transfer/analytics');
console.log('Top rotas:', routes.data.route_analytics.top_routes);
```

---

## ⚠️ Armadilhas Comuns

### 1. Estados Fora de Ordem
```javascript
// ❌ Errado - pular estados
await api.post('/purchase', { action: 'CREATE_ORDER' });       // PENDENTE
await api.post('/purchase', { action: 'EFFECTUATE_CD' });      // ERRO!

// ✅ Correto - seguir sequência
await api.post('/purchase', { action: 'CREATE_ORDER' });       // PENDENTE
await api.post('/purchase', { action: 'REGISTER_INVOICE' });   // PRE_BAIXA
await api.post('/purchase', { action: 'ARRIVE_AT_CD' });       // AGUARDANDO_CONFERENCIA_CD
// ... continuar sequência
```

### 2. External IDs Duplicados
```javascript
// ❌ Errado - reutilizar external_id
await api.post('/purchase', { 
  action: 'CREATE_ORDER',
  attributes: { external_id: 'PO-001' }  // Primeira vez: OK
});
await api.post('/purchase', { 
  action: 'CREATE_ORDER',
  attributes: { external_id: 'PO-001' }  // Segunda vez: ERRO!
});

// ✅ Correto - IDs únicos
await api.post('/purchase', { attributes: { external_id: 'PO-001' } });
await api.post('/purchase', { attributes: { external_id: 'PO-002' } });
```

### 3. Produtos Não Cadastrados
```javascript
// ❌ Pode falhar se produto não existir
await api.post('/purchase', {
  attributes: {
    items: [{ product_id: 'SKU-INEXISTENTE', quantity_ordered: 10 }]
  }
});

// ✅ Sistema ECA cria automaticamente, mas melhor pré-cadastrar
await api.post('/products', { 
  external_id: 'SKU-001',
  name: 'Produto Teste',
  category: 'Calçados'
});
```

---

## 🔍 Debug e Validação

### Ver Estado Atual
```bash
# Verificar estado de uma transação
curl "$BASE_URL/api/v1/banban/purchase?external_id=PO-001" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.transactions[0].status'
```

### Ver Histórico Completo
```bash
# Ver todas as transições
curl "$BASE_URL/api/v1/banban/purchase?external_id=PO-001" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.transactions[0].attributes.state_history'
```

### Próximos Estados Válidos
```javascript
// Consultar quais estados são válidos a partir do atual
const transaction = await api.get('/purchase?external_id=PO-001');
const currentState = transaction.data.transactions[0].status;
console.log('Estado atual:', currentState);

// Estados possíveis (consultar documentação da máquina de estados)
const validTransitions = {
  'PENDENTE': ['PRE_BAIXA'],
  'PRE_BAIXA': ['AGUARDANDO_CONFERENCIA_CD'],
  'AGUARDANDO_CONFERENCIA_CD': ['EM_CONFERENCIA_CD'],
  // ... etc
};
console.log('Próximos estados válidos:', validTransitions[currentState]);
```

---

## 📚 Recursos Essenciais

### Estados Mais Usados

#### Purchase Flow
- `PENDENTE` → Pedido criado
- `PRE_BAIXA` → NF registrada
- `EM_CONFERENCIA_CD` → Sendo conferido
- `EFETIVADO_CD` → Finalizado

#### Transfer Flow
- `PEDIDO_TRANSFERENCIA_CRIADO` → Solicitação criada
- `EM_SEPARACAO_CD` → Sendo separado
- `EMBARCADO_CD` → Em trânsito
- `EFETIVADO_LOJA` → Recebido na loja

### Actions Mais Usadas

#### Purchase Flow
- `CREATE_ORDER` → Criar pedido
- `REGISTER_INVOICE` → Registrar NF
- `COMPLETE_CONFERENCE_OK` → Conferir sem divergência
- `EFFECTUATE_CD` → Efetivar

#### Transfer Flow
- `CREATE_TRANSFER_REQUEST` → Criar transferência
- `COMPLETE_SEPARATION_OK` → Separar sem divergência
- `INVOICE_TRANSFER` → Faturar
- `EFFECTUATE_STORE` → Efetivar na loja

---

## 🆘 Suporte Rápido

### Problemas Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `INVALID_STATE_TRANSITION` | Estado fora de ordem | Seguir sequência correta |
| `DUPLICATE_EXTERNAL_ID` | ID já existe | Usar ID único |
| `UNMAPPED_ACTION` | Action inválida | Verificar lista de actions |
| `REQUIRED_FIELD_MISSING` | Campo obrigatório | Verificar schema |

### Links Úteis
- 📖 [Documentação Completa](./ECA_API_GUIDE.md)
- 🔧 [Schemas e Validações](../src/shared/enums/)
- 🎯 [Exemplos no Postman](https://postman.banban.com)
- 💬 [Slack de Suporte](https://banban.slack.com/channels/api-support)

---

**🎉 Pronto! Agora você já pode integrar com as APIs ECA do BanBan Flow!**