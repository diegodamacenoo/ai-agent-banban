# Plano Executivo: Purchase Flow API (Simplificada)

## Objetivo
Implementar uma API simplificada de fluxo de compras com apenas 2 endpoints principais que cobrem todo o ciclo de vida das transações de compra.

## Endpoints Simplificados

### 1. **POST /api/v1/purchase** 
**Responsabilidade:** Registrar TODOS os eventos do fluxo de compra
- Criar ordem de compra
- Aprovar ordem de compra  
- Registrar nota fiscal do fornecedor
- Iniciar conferência no CD
- Bipar itens na conferência
- Finalizar conferência e efetivar

### 2. **GET /api/v1/purchase**
**Responsabilidade:** Consultar transações e seus status
- Buscar por external_id, transaction_id, ou filtros
- Retornar histórico completo de eventos
- Status atual da transação

## Estratégia de Implementação

### **POST /api/v1/purchase - Payload Unificado**

```json
{
  "action": "create_order|approve_order|register_invoice|start_conference|scan_items|complete_conference",
  "transaction_data": {
    "external_id": "string",
    "reference_id": "string", // Para referenciar transação pai
    // Dados específicos da ação
  },
  "metadata": {
    "user_id": "uuid",
    "timestamp": "datetime",
    "notes": "string"
  }
}
```

### **GET /api/v1/purchase - Query Parameters**

```
GET /api/v1/purchase?external_id=SAPPO1234
GET /api/v1/purchase?transaction_id=uuid
GET /api/v1/purchase?status=APROVADO
GET /api/v1/purchase?supplier_id=FORN001
GET /api/v1/purchase?date_from=2025-01-01&date_to=2025-01-31
```

## Estrutura de Implementação

### **Preparação: Tabelas Necessárias**

#### **Criar tenant_business_events**
```sql
CREATE TABLE public.tenant_business_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  entity_type text NOT NULL, -- 'TRANSACTION', 'ENTITY', 'RELATIONSHIP'
  entity_id uuid NOT NULL,
  event_code text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  event_timestamp timestamp with time zone DEFAULT now(),
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT tenant_business_events_pkey PRIMARY KEY (id),
  CONSTRAINT tenant_business_events_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
```

#### **Criar tenant_snapshots (Genérica)**
```sql
CREATE TABLE public.tenant_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  snapshot_type text NOT NULL, -- 'INVENTORY', 'FINANCIAL', 'PERFORMANCE', etc.
  entity_id uuid NOT NULL, -- ID da entidade (produto, localização, etc.)
  related_entity_id uuid, -- ID relacionado (ex: localização para estoque)
  snapshot_key text NOT NULL, -- Chave específica (ex: 'qty_on_hand', 'reserved_qty')
  snapshot_value jsonb NOT NULL, -- Valor flexível (number, object, array)
  snapshot_date date NOT NULL,
  last_calculated_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone, -- Para cache com TTL
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT tenant_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT tenant_snapshots_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT tenant_snapshots_entity_id_fkey 
    FOREIGN KEY (entity_id) REFERENCES public.tenant_business_entities(id),
  CONSTRAINT tenant_snapshots_related_entity_id_fkey 
    FOREIGN KEY (related_entity_id) REFERENCES public.tenant_business_entities(id),
  
  -- Índice único para evitar duplicatas
  UNIQUE(organization_id, snapshot_type, entity_id, related_entity_id, snapshot_key, snapshot_date)
);

-- Índices para performance
CREATE INDEX idx_tenant_snapshots_lookup ON tenant_snapshots(organization_id, snapshot_type, entity_id, related_entity_id);
CREATE INDEX idx_tenant_snapshots_date ON tenant_snapshots(snapshot_date);
CREATE INDEX idx_tenant_snapshots_expires ON tenant_snapshots(expires_at) WHERE expires_at IS NOT NULL;
```

### **Fase 1: Modelo Unificado (1 dia)**

#### 1.1 **Request Model Único**
```python
class PurchaseRequest(BaseModel):
    action: PurchaseAction  # Enum com todas as ações
    transaction_data: Dict[str, Any]  # Payload flexível
    metadata: Optional[Dict[str, Any]] = None
```

#### 1.2 **Purchase Action Enum**
```python
class PurchaseAction(str, Enum):
    CREATE_ORDER = "create_order"
    APPROVE_ORDER = "approve_order"
    REGISTER_INVOICE = "register_invoice"
    START_CONFERENCE = "start_conference"
    SCAN_ITEMS = "scan_items"
    COMPLETE_CONFERENCE = "complete_conference"
```

#### 1.3 **Response Model Único**
```python
class PurchaseResponse(BaseModel):
    transaction_id: uuid.UUID
    external_id: str
    action: PurchaseAction
    status: str
    result: Dict[str, Any]  # Resultado específico da ação
    timestamp: datetime
```

### **Fase 2: Service Layer Unificado (2 dias)**

#### 2.1 **PurchaseFlowService.process_action()**
```python
async def process_action(
    self, 
    action: PurchaseAction,
    transaction_data: Dict[str, Any],
    organization_id: uuid.UUID,
    user_id: Optional[uuid.UUID] = None
) -> Dict[str, Any]:
    
    # Roteamento baseado na action
    if action == PurchaseAction.CREATE_ORDER:
        return await self._create_order(transaction_data, organization_id, user_id)
    elif action == PurchaseAction.APPROVE_ORDER:
        return await self._approve_order(transaction_data, organization_id, user_id)
    # ... outros casos
```

### **Fase 2: Service Layer Unificado (2 dias)**

#### 2.1 **PurchaseFlowService.process_action()**
```python
async def process_action(
    self, 
    action: PurchaseAction,
    transaction_data: Dict[str, Any],
    organization_id: uuid.UUID,
    user_id: Optional[uuid.UUID] = None
) -> Dict[str, Any]:
    
    # Roteamento baseado na action
    if action == PurchaseAction.CREATE_ORDER:
        return await self._create_order(transaction_data, organization_id, user_id)
    elif action == PurchaseAction.APPROVE_ORDER:
        return await self._approve_order(transaction_data, organization_id, user_id)
    # ... outros casos
```

#### 2.2 **Métodos de Implementação**

##### **_create_order()**
1. Validar fornecedor existe em `tenant_business_entities` por `external_id`
2. Validar variantes existem em `tenant_business_entities` por `external_id`
3. **Resolver UUIDs internos** a partir dos external_ids
4. Inserir em `tenant_business_transactions` com `transaction_type = 'PURCHASE_ORDER'`
5. Registrar evento em `tenant_business_events`

##### **_approve_order()**
1. Buscar ordem em `tenant_business_transactions` por `external_id`
2. Validar status atual = 'NOVO'
3. Atualizar status para 'APROVADO'
4. Registrar evento

##### **_register_invoice()**
1. Buscar ordem de compra relacionada por `reference_external_id`
2. Validar ordem está aprovada
3. **Resolver UUIDs das entidades** via external_ids
4. Inserir NF em `tenant_business_transactions` com `transaction_type = 'SUPPLIER_INVOICE'`
5. Referenciar ordem original em `reference_transaction_id`
6. Registrar evento

##### **_scan_items()**
1. Buscar invoice por `invoice_external_id`
2. **Resolver UUIDs das variantes** via `variant_external_id`
3. Registrar eventos de bipagem com dados das variantes
4. Manter external_ids nos event_data para rastreabilidade

##### **_complete_conference()**
1. Buscar invoice por `external_id`
2. **Resolver UUIDs de localização** via `location_external_id`
3. Finalizar conferência
4. Criar movimentação de estoque com UUIDs resolvidos
5. Atualizar snapshot de estoque
6. Registrar evento de efetivação

#### 2.3 **Database Helpers com Resolução de IDs**

```python
# Resolução de External IDs para UUIDs internos
async def resolve_entity_uuid(self, external_id: str, entity_type: str) -> uuid.UUID:
    """Resolve external_id para UUID interno"""
    entity = await self.get_entity_by_external_id(external_id, entity_type)
    if not entity:
        raise ValidationError(f"{entity_type} '{external_id}' não encontrado")
    return entity["id"]

async def resolve_transaction_uuid(self, external_id: str) -> uuid.UUID:
    """Resolve external_id de transação para UUID interno"""
    transaction = await self.get_transaction_by_external_id(external_id)
    if not transaction:
        raise ValidationError(f"Transação '{external_id}' não encontrada")
    return transaction["id"]

# Helpers principais com external_ids
async def create_entity(self, entity_data: Dict) -> uuid.UUID:
    """Cria entidade em tenant_business_entities"""
    
async def get_entity_by_external_id(self, external_id: str, entity_type: str) -> Dict:
    """Busca entidade por external_id e tipo"""
    
async def create_transaction(self, transaction_data: Dict) -> uuid.UUID:
    """Cria transação em tenant_business_transactions"""
    
async def get_transaction_by_external_id(self, external_id: str) -> Dict:
    """Busca transação por external_id"""
    
async def create_event(self, event_data: Dict) -> uuid.UUID:
    """Registra evento em tenant_business_events"""
    
async def update_inventory_snapshot(self, variant_external_id: str, location_external_id: str, qty_change: float):
    """Atualiza snapshot de estoque usando external_ids"""
    # Resolve UUIDs internamente
    variant_uuid = await self.resolve_entity_uuid(variant_external_id, "PRODUCT_VARIANT")
    location_uuid = await self.resolve_entity_uuid(location_external_id, "LOCATION")
    # Atualiza snapshot com UUIDs
    
async def get_current_stock(self, variant_external_id: str, location_external_id: str) -> float:
    """Consulta snapshot atual de estoque usando external_ids"""
    # Resolve UUIDs e consulta snapshot
```

#### 2.4 **Arquitetura de 3 Camadas: Eventos + Transações + Snapshots**

##### **Fluxo Completo de Atualização:**
```python
async def complete_cd_conference(self, invoice_id: uuid.UUID, organization_id: uuid.UUID):
    async with db.transaction():
        # 1. EVENTO: Registrar o que aconteceu
        await self.create_event({
            "entity_type": "TRANSACTION",
            "entity_id": invoice_id,
            "event_code": "receipt_effective_cd",
            "event_data": {
                "external_id": invoice["external_id"],
                "items_processed": len(items),
                "total_value": float(invoice["total_value"])
            }
        })
        
        # 2. TRANSAÇÃO: Registrar movimentação de estoque
        movement_id = await self.create_transaction({
            "transaction_type": "INVENTORY_MOVEMENT",
            "external_id": f"MOV-{invoice['external_id']}",
            "transaction_data": {
                "movement_type": "CD_RECEIPT",
                "reference_transaction_id": invoice_id,
                "trigger_snapshot_update": True
            },
            "transaction_items": movement_items,
            "status": "COMPLETED"
        })
        
        # 3. SNAPSHOT: Atualizar estoque atual (performance)
        for item in movement_items:
            await self.update_inventory_snapshot(
                variant_id=item["variant_id"],
                location_id=item["location_id"], 
                qty_change=item["qty_change"],
                movement_reference_id=movement_id
            )
```

##### **Cada Camada tem seu Propósito:**

**🎯 EVENTOS (`tenant_business_events`)**
- **O QUE aconteceu** e **QUANDO**
- **Auditoria** e **rastreabilidade**
- **Triggers** para automações
- **Timeline** completa do fluxo

**📊 TRANSAÇÕES (`tenant_business_transactions`)**
- **COMO** as coisas mudaram
- **Fonte da verdade** para cálculos
- **Histórico detalhado** de movimentações
- **Base para recálculos**

**⚡ SNAPSHOTS (`tenant_snapshots`)**
- **ESTADO ATUAL** das coisas
- **Performance** para consultas
- **Cache inteligente** 
- **Agregações pré-calculadas**

##### **Consultas Otimizadas por Camada:**

```python
# CONSULTA RÁPIDA - Via snapshot (95% dos casos)
async def get_current_stock(self, variant_id: str, location_id: uuid.UUID) -> float:
    snapshot = await self.get_snapshot(
        snapshot_type="INVENTORY",
        entity_id=variant_id,
        related_entity_id=location_id,
        snapshot_key="qty_on_hand"
    )
    return snapshot["snapshot_value"] if snapshot else 0.0

# AUDITORIA - Via eventos (rastreamento)
async def get_stock_audit_trail(self, variant_id: str, location_id: uuid.UUID) -> List[Dict]:
    return await self.get_events_by_criteria({
        "event_code__in": ["receipt_effective_cd", "transfer_completed", "sale_completed"],
        "event_data__variant_id": variant_id,
        "event_data__location_id": str(location_id)
    })

# RECÁLCULO - Via transações (fonte da verdade)
async def recalculate_stock(self, variant_id: str, location_id: uuid.UUID) -> float:
    movements = await self.get_inventory_movements(variant_id, location_id)
    
    total_stock = 0.0
    for movement in movements:
        if movement["transaction_data"]["movement_type"] in ["CD_RECEIPT", "STORE_RECEIPT", "RETURN"]:
            total_stock += movement["qty_change"]
        elif movement["transaction_data"]["movement_type"] in ["CD_TRANSFER", "SALE"]:
            total_stock -= movement["qty_change"]
    
    # Atualizar snapshot com valor recalculado
    await self.update_snapshot(
        snapshot_type="INVENTORY",
        entity_id=variant_id,
        related_entity_id=location_id,
        snapshot_key="qty_on_hand",
        snapshot_value=total_stock,
        metadata={"recalculated_at": datetime.now(), "source": "transaction_aggregation"}
    )
    
    return total_stock
```

##### **Exemplo Completo - Efetivação no CD:**

**1. EVENTO registrado:**
```json
{
  "entity_type": "TRANSACTION",
  "entity_id": "invoice-uuid",
  "event_code": "receipt_effective_cd",
  "event_data": {
    "external_id": "NF-123456",
    "items_processed": 3,
    "total_value": 1350.60,
    "location_external_id": "CD001"
  },
  "event_timestamp": "2025-01-15T14:30:00Z"
}
```

**2. TRANSAÇÃO de movimento criada:**
```json
{
  "transaction_type": "INVENTORY_MOVEMENT",
  "external_id": "MOV-NF-123456",
  "transaction_data": {
    "movement_type": "CD_RECEIPT", 
    "reference_transaction_id": "invoice-uuid",
    "reference_external_id": "NF-123456"
  },
  "transaction_items": [
    {
      "variant_id": "VONBX2099AZUL34",
      "qty_change": 12.0,
      "location_id": "cd-uuid",
      "unit_cost": 112.55
    }
  ],
  "status": "COMPLETED"
}
```

**3. SNAPSHOT atualizado:**
```json
{
  "snapshot_type": "INVENTORY",
  "entity_id": "variant-uuid", // UUID interno resolvido
  "related_entity_id": "cd-uuid", // UUID interno resolvido  
  "snapshot_key": "qty_on_hand", 
  "snapshot_value": 162.0, // Era 150, agora +12
  "snapshot_date": "2025-01-15",
  "metadata": {
    "last_movement_external_id": "MOV-NF-123456", // External ID para rastreabilidade
    "last_movement_type": "CD_RECEIPT",
    "updated_by_event": "receipt_effective_cd",
    "variant_external_id": "VONBX2099AZUL34", // External ID mantido
    "location_external_id": "CD001" // External ID mantido
  }
}
```

##### **Fluxo de Resolução de IDs:**

```python
async def process_create_order(self, transaction_data: Dict) -> Dict:
    # 1. Recebe payload com external_ids
    supplier_external_id = transaction_data["supplier_external_id"]
    
    # 2. Resolve UUIDs internos
    supplier_uuid = await self.resolve_entity_uuid(supplier_external_id, "SUPPLIER")
    
    # 3. Valida e resolve variantes
    for item in transaction_data["items"]:
        variant_uuid = await self.resolve_entity_uuid(item["variant_external_id"], "PRODUCT_VARIANT")
        # Mantém external_id no item para rastreabilidade
    
    # 4. Cria transação com UUIDs internos + external_ids para rastreabilidade
    transaction_id = await self.create_transaction({
        "transaction_type": "PURCHASE_ORDER",
        "external_id": transaction_data["external_id"],
        "transaction_data": {
            "supplier_external_id": supplier_external_id, # Mantém para audit
            ...
        },
        "transaction_items": transaction_data["items"], # Mantém external_ids
        "origin_entity_id": supplier_uuid, # UUID para FK
        "destination_entity_id": cd_uuid # UUID para FK
    })
    
    # 5. Retorna response com external_ids (sem UUIDs)
    return {
        "external_id": transaction_data["external_id"],
        "status": "NOVO",
        "supplier_external_id": supplier_external_id
    }
```

##### **Benefícios da Arquitetura Tripla:**
- ✅ **Eventos**: Auditoria completa + triggers
- ✅ **Transações**: Fonte da verdade + histórico
- ✅ **Snapshots**: Performance + consultas rápidas
- ✅ **Consistência**: Recálculo sempre possível
- ✅ **Escalabilidade**: Cada camada otimizada para seu uso

### **Fase 3: API Layer Simplificado (1 dia)**

#### 3.1 **POST Endpoint**
```python
@router.post("/purchase")
async def process_purchase_action(
    request: PurchaseRequest,
    service: PurchaseFlowService = Depends(get_service),
    current_user: dict = Depends(get_current_user),
    organization_id: uuid.UUID = Depends(get_organization_id)
):
    result = await service.process_action(
        action=request.action,
        transaction_data=request.transaction_data,
        organization_id=organization_id,
        user_id=current_user.get("id")
    )
    
    return PurchaseResponse(
        action=request.action,
        **result
    )
```

#### 3.2 **GET Endpoint**
```python
@router.get("/purchase")
async def get_purchase_transactions(
    external_id: Optional[str] = None,
    transaction_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    supplier_id: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    limit: int = 50,
    offset: int = 0,
    service: PurchaseFlowService = Depends(get_service),
    organization_id: uuid.UUID = Depends(get_organization_id)
):
    filters = {
        "external_id": external_id,
        "transaction_id": transaction_id,
        "status": status,
        "supplier_id": supplier_id,
        "date_from": date_from,
        "date_to": date_to
    }
    
    result = await service.get_transactions(
        filters=filters,
        limit=limit,
        offset=offset,
        organization_id=organization_id
    )
    
    return result
```

## Mapeamento para Tabelas Existentes

### **tenant_business_entities** - Entidades do Fluxo

#### **Fornecedores**
```json
{
  "entity_type": "SUPPLIER",
  "external_id": "FORN0552",
  "name": "BanBan Calçados LTDA",
  "business_data": {
    "trade_name": "BanBan Calçados LTDA",
    "legal_name": "BanBan",
    "cnpj": "22.626.945/0001-56",
    "contact_info": {...}
  }
}
```

#### **Produtos**
```json
{
  "entity_type": "PRODUCT",
  "external_id": "BX2099",
  "name": "TENIS CASUAL UNISSEX VONZ BX2099",
  "business_data": {
    "description": "Tênis Casual",
    "gtin": "7891234567890",
    "unit_measure": "PAR",
    "category": "Casual",
    "sub_category": "Praia",
    "type": "Tenis",
    "gender": "FEM",
    "supplier_external_id": "Vonz",
    "pricing": [
      {
        "price_type": "BASE",
        "price_value": 199.90,
        "valid_from": "2025-06-01",
        "valid_to": "2025-06-30"
      }
    ]
  }
}
```

#### **Variantes de Produtos**
```json
{
  "entity_type": "PRODUCT_VARIANT", 
  "external_id": "VONBX2099AZUL34",
  "name": "TENIS CASUAL AZUL 34",
  "business_data": {
    "product_external_id": "BX2099",
    "size": "34",
    "color": "Azul",
    "gtin_variant": "789999990101402"
  }
}
```

#### **Localizações**
```json
{
  "entity_type": "LOCATION",
  "external_id": "CD001",
  "name": "Centro de Distribuição Principal",
  "business_data": {
    "location_type": "CD",
    "address": "Av. Dom Luiz...",
    "capacity": 10000,
    "operating_hours": {...}
  }
}
```

### **tenant_business_transactions** - Transações do Fluxo

#### **Ordem de Compra**
```json
{
  "transaction_type": "PURCHASE_ORDER",
  "external_id": "SAPPO1234",
  "transaction_number": "PO-2025-001",
  "transaction_data": {
    "order_type": "COMPRA",
    "issue_timestamp": "2025-05-30T10:15Z",
    "supplier_external_id": "FORN0552", // Mantém external_id para rastreabilidade
    "notes": "Pedido urgente"
  },
  "transaction_items": [
    {
      "variant_external_id": "VONBX2099AZUL34", // External ID no payload
      "item_seq": 1,
      "qty_ordered": 12.0,
      "unit_cost_est": 112.55,
      "notes": ""
    }
  ],
  "total_value": 1350.60,
  "status": "NEW",
  "origin_entity_id": "supplier-uuid", // UUID interno resolvido
  "destination_entity_id": "cd-uuid" // UUID interno resolvido
}
```

#### **Nota Fiscal do Fornecedor**
```json
{
  "transaction_type": "SUPPLIER_INVOICE",
  "external_id": "NF-123456",
  "transaction_data": {
    "doc_type": "SUPPLIER_IN",
    "issue_date": "2025-05-30",
    "reference_external_id": "SAPPO1234" // Referência por external_id
  },
  "transaction_items": [
    {
      "variant_external_id": "VONBX2099AZUL34", // External ID mantido
      "item_seq": 1,
      "qty": 12.0,
      "unit_price": 112.55,
      "qty_expected": 12.0,
      "qty_scanned_ok": 0,
      "qty_scanned_diff": 0
    }
  ],
  "total_value": 1350.60,
  "status": "PRE_CLEARED",
  "reference_transaction_id": "purchase-order-uuid" // UUID interno resolvido
}
```

### **tenant_business_events** - Eventos do Fluxo

#### **Eventos de Ordem de Compra**
```json
{
  "entity_type": "TRANSACTION",
  "entity_id": "purchase-order-uuid",
  "event_code": "purchase_order_created",
  "event_data": {
    "external_id": "SAPPO1234",
    "supplier_external_id": "FORN0552",
    "total_value": 1350.60,
    "items_count": 1
  }
}
```

#### **Eventos de Conferência**
```json
{
  "entity_type": "TRANSACTION", 
  "entity_id": "invoice-uuid", // UUID interno
  "event_code": "receipt_item_scanned_ok",
  "event_data": {
    "variant_external_id": "VONBX2099AZUL34", // External ID mantido
    "invoice_external_id": "NF-123456", // External ID mantido
    "item_seq": 1,
    "qty_scanned": 12.0,
    "is_divergent": false,
    "scanner_id": "OPERADOR123"
  }
}
```

### **tenant_snapshots** - Snapshots Genéricos

#### **Estoque de Produtos**
```json
{
  "snapshot_type": "INVENTORY",
  "entity_id": "variant-uuid", // Variante do produto
  "related_entity_id": "location-uuid", // Localização
  "snapshot_key": "qty_on_hand",
  "snapshot_value": 150.0,
  "snapshot_date": "2025-01-15",
  "metadata": {
    "last_movement_id": "movement-uuid",
    "last_movement_type": "CD_RECEIPT"
  }
}
```

#### **Estoque Reservado**
```json
{
  "snapshot_type": "INVENTORY",
  "entity_id": "variant-uuid",
  "related_entity_id": "location-uuid", 
  "snapshot_key": "reserved_qty",
  "snapshot_value": 25.0,
  "snapshot_date": "2025-01-15",
  "metadata": {
    "reservations": [
      {"order_id": "uuid", "qty": 15.0},
      {"order_id": "uuid", "qty": 10.0}
    ]
  }
}
```

#### **Performance de Vendas (Futuro)**
```json
{
  "snapshot_type": "SALES_PERFORMANCE", 
  "entity_id": "variant-uuid",
  "related_entity_id": "location-uuid",
  "snapshot_key": "daily_sales",
  "snapshot_value": {
    "qty_sold": 8.0,
    "revenue": 1592.00,
    "avg_price": 199.00
  },
  "snapshot_date": "2025-01-15"
}
```

#### **Métricas Financeiras (Futuro)**
```json
{
  "snapshot_type": "FINANCIAL",
  "entity_id": "supplier-uuid",
  "snapshot_key": "monthly_spend",
  "snapshot_value": {
    "total_amount": 50000.00,
    "invoice_count": 15,
    "avg_lead_time_days": 7.5
  },
  "snapshot_date": "2025-01-01" // Primeiro dia do mês
}
```

### **Movimentações de Estoque (Mantém Transações)**

#### **Em tenant_business_transactions**
```json
{
  "transaction_type": "INVENTORY_MOVEMENT",
  "external_id": "MOV-2025-001", 
  "transaction_data": {
    "movement_type": "CD_RECEIPT",
    "reference_transaction_id": "invoice-uuid",
    "reference_external_id": "NF-123456",
    "trigger_snapshot_update": true
  },
  "transaction_items": [
    {
      "variant_id": "VONBX2099AZUL34",
      "qty_change": 12.0,
      "location_id": "cd-uuid",
      "unit_cost": 112.55
    }
  ],
  "status": "COMPLETED"
}
```

### **1. Criar Ordem de Compra**
```json
POST /api/v1/purchase
{
  "action": "create_order",
  "transaction_data": {
    "external_id": "SAPPO1234",
    "supplier_external_id": "FORN0552",
    "items": [
      {
        "variant_id": "VONBX2099AZUL34",
        "item_seq": 1,
        "qty_ordered": 12.0,
        "unit_cost_est": 112.55
      }
    ],
    "issue_timestamp": "2025-05-30T10:15Z"
  }
}
```

### **2. Aprovar Ordem**
```json
POST /api/v1/purchase
{
  "action": "approve_order",
  "transaction_data": {
    "external_id": "SAPPO1234"
  }
}
```

### **3. Registrar NF**
```json
POST /api/v1/purchase
{
  "action": "register_invoice",
  "transaction_data": {
    "external_id": "NF-123456",
    "purchase_order_external_id": "SAPPO1234",
    "issue_date": "2025-05-30",
    "total_value": 1350.60,
    "items": [...]
  }
}
```

### **4. Bipar Itens**
```json
POST /api/v1/purchase
{
  "action": "scan_items",
  "transaction_data": {
    "invoice_external_id": "NF-123456",
    "items": [
      {
        "variant_id": "VONBX2099AZUL34",
        "item_seq": 1,
        "qty_scanned": 12.0,
        "is_divergent": false
      }
    ]
  }
}
```

### **5. Consultar Transações**
```
GET /api/v1/purchase?external_id=SAPPO1234
GET /api/v1/purchase?status=APROVADO&limit=10
GET /api/v1/purchase?supplier_id=FORN0552&date_from=2025-01-01
```

## Vantagens da Abordagem Simplificada

### **Para o Desenvolvedor**
- ✅ Apenas 2 endpoints para implementar
- ✅ Lógica centralizada no service
- ✅ Validação unificada
- ✅ Menos código para manter

### **Para o Cliente da API**
- ✅ Interface mais simples
- ✅ Apenas uma URL para lembrar
- ✅ Ações autoexplicativas
- ✅ Flexibilidade no payload

### **Para o Sistema**
- ✅ Logging centralizado
- ✅ Monitoramento simplificado
- ✅ Versionamento mais fácil
- ✅ Cache mais eficiente

## Cronograma Simplificado

| Fase | Duração | Entregável |
|------|---------|------------|
| 1 | 1 dia | Modelos unificados |
| 2 | 2 dias | Service com roteamento |
| 3 | 1 dia | Endpoints implementados |
| 4 | 1 dia | Testes automatizados |

**Total: 5 dias** (redução de ~60% no tempo)

## Estrutura de Validação

### **Validação Dinâmica por Action**
```python
def validate_transaction_data(action: PurchaseAction, data: Dict) -> Dict:
    validators = {
        PurchaseAction.CREATE_ORDER: validate_create_order,
        PurchaseAction.APPROVE_ORDER: validate_approve_order,
        PurchaseAction.REGISTER_INVOICE: validate_register_invoice,
        # ...
    }
    
    validator = validators.get(action)
    if not validator:
        raise ValueError(f"Action {action} não suportada")
    
    return validator(data)
```

## Considerações de Implementação

### **Roteamento Interno**
- Service layer decide qual método chamar baseado na `action`
- Validações específicas para cada action
- Reutilização de código comum

### **Flexibilidade**
- Payload `transaction_data` permite extensibilidade
- Novas actions podem ser adicionadas facilmente
- Backward compatibility garantida

### **Monitoramento**
- Um único ponto para logs de entrada
- Métricas por action type
- Rate limiting unificado

### **Documentação**
- OpenAPI com examples para cada action
- Schema dinâmico baseado na action
- Documentação centralizada

Essa abordagem reduz drasticamente a complexidade mantendo toda a funcionalidade necessária. O que acha?