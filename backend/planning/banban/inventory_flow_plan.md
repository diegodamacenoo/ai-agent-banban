# Plano Executivo: Inventory Flow API

## Objetivo
Implementar uma API simplificada de controle de inventário que permita consultar estoques, fazer ajustes, contagens e reservas, além de fornecer visibilidade completa sobre movimentações.

## Endpoints Simplificados

### 1. **POST /api/v1/inventory** 
**Responsabilidade:** Registrar TODAS as ações relacionadas ao inventário
- Ajustar estoque
- Fazer contagem de estoque
- Reservar/liberar estoque
- Transferir entre localizações
- Marcar produtos em quarentena

### 2. **GET /api/v1/inventory**
**Responsabilidade:** Consultar informações de inventário
- Consultar estoque atual
- Histórico de movimentações
- Status de reservas
- Alertas de estoque
- Relatórios de contagem

## Estratégia de Implementação

### **POST /api/v1/inventory - Payload Unificado**

```json
{
  "action": "adjust_stock|count_inventory|reserve_stock|transfer_internal|quarantine_product",
  "transaction_data": {
    "external_id": "string",
    "reference_external_id": "string", // Para referenciar processo pai
    // Dados específicos da ação
  },
  "metadata": {
    "user_id": "string",
    "timestamp": "datetime",
    "reason": "string",
    "notes": "string"
  }
}
```

### **GET /api/v1/inventory - Query Parameters**

```
GET /api/v1/inventory?variant_external_id=VONBX2099AZUL34&location_external_id=CD001
GET /api/v1/inventory?movement_type=ADJUSTMENT&date_from=2025-01-01
GET /api/v1/inventory?alert_type=LOW_STOCK&location_external_id=LJ005
GET /api/v1/inventory?reserved_by=ORDER123&status=ACTIVE
```

## Estrutura de Implementação

### **Preparação: Tabelas Utilizadas**

**Usaremos as mesmas tabelas do Purchase Flow:**
- `tenant_business_entities` - Produtos, variantes, localizações
- `tenant_business_transactions` - Movimentações e ajustes
- `tenant_business_events` - Eventos de inventário
- `tenant_snapshots` - Estado atual do estoque

### **Fase 1: Modelo Unificado (1 dia)**

#### 1.1 **Inventory Action Enum**
```python
class InventoryAction(str, Enum):
    ADJUST_STOCK = "adjust_stock"
    COUNT_INVENTORY = "count_inventory"
    RESERVE_STOCK = "reserve_stock"
    RELEASE_RESERVATION = "release_reservation"
    TRANSFER_INTERNAL = "transfer_internal"
    QUARANTINE_PRODUCT = "quarantine_product"
    RELEASE_QUARANTINE = "release_quarantine"
    SET_ALERT_THRESHOLDS = "set_alert_thresholds"
```

#### 1.2 **Request Model Único**
```python
class InventoryRequest(BaseModel):
    action: InventoryAction
    transaction_data: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None
```

#### 1.3 **Response Model Único**
```python
class InventoryResponse(BaseModel):
    transaction_id: Optional[uuid.UUID]
    external_id: str
    action: InventoryAction
    status: str
    result: Dict[str, Any]
    timestamp: datetime
```

### **Fase 2: Service Layer Unificado (2 dias)**

#### 2.1 **InventoryFlowService.process_action()**
```python
async def process_action(
    self, 
    action: InventoryAction,
    transaction_data: Dict[str, Any],
    organization_id: uuid.UUID,
    user_id: Optional[uuid.UUID] = None
) -> Dict[str, Any]:
    
    # Roteamento baseado na action
    if action == InventoryAction.ADJUST_STOCK:
        return await self._adjust_stock(transaction_data, organization_id, user_id)
    elif action == InventoryAction.COUNT_INVENTORY:
        return await self._count_inventory(transaction_data, organization_id, user_id)
    # ... outros casos
```

#### 2.2 **Métodos de Implementação**

##### **_adjust_stock()**
1. Validar variante e localização existem via external_ids
2. Resolver UUIDs internos
3. Criar transação de ajuste em `tenant_business_transactions`
4. Atualizar snapshot de estoque em `tenant_snapshots`
5. Registrar evento de ajuste
6. Verificar alertas de estoque

##### **_count_inventory()**
1. Validar localização via external_id
2. Iniciar processo de contagem
3. Registrar itens contados
4. Comparar com estoque atual
5. Gerar divergências se houver
6. Permitir aceitar/rejeitar contagem

##### **_reserve_stock()**
1. Validar disponibilidade de estoque
2. Criar reserva com TTL
3. Atualizar snapshot com quantidade reservada
4. Registrar evento de reserva
5. Configurar expiração automática

##### **_transfer_internal()**
1. Validar origem e destino via external_ids
2. Verificar disponibilidade na origem
3. Criar movimentações de saída e entrada
4. Atualizar snapshots de ambas localizações
5. Registrar eventos de transferência

##### **_quarantine_product()**
1. Validar produto/variante via external_id
2. Mover para área de quarentena
3. Bloquear para vendas
4. Registrar motivo da quarentena
5. Definir processo de liberação

#### 2.3 **Database Helpers Específicos**

```python
async def get_current_stock_detailed(self, variant_external_id: str, location_external_id: str) -> Dict:
    """Retorna estoque detalhado com reservas, quarentena, etc."""
    
async def check_stock_availability(self, variant_external_id: str, location_external_id: str, qty_needed: float) -> bool:
    """Verifica se há estoque disponível"""
    
async def create_stock_reservation(self, reservation_data: Dict) -> uuid.UUID:
    """Cria reserva de estoque com TTL"""
    
async def calculate_stock_alerts(self, location_external_id: str) -> List[Dict]:
    """Calcula alertas de estoque baixo/alto"""
    
async def get_inventory_movements(self, filters: Dict) -> List[Dict]:
    """Consulta movimentações com filtros diversos"""
    
async def aggregate_stock_by_location(self, location_external_id: str) -> Dict:
    """Agrega estoque total por localização"""
```

### **Fase 3: API Layer Simplificado (1 dia)**

#### 3.1 **POST Endpoint**
```python
@router.post("/inventory")
async def process_inventory_action(
    request: InventoryRequest,
    service: InventoryFlowService = Depends(get_service),
    current_user: dict = Depends(get_current_user),
    organization_id: uuid.UUID = Depends(get_organization_id)
):
    result = await service.process_action(
        action=request.action,
        transaction_data=request.transaction_data,
        organization_id=organization_id,
        user_id=current_user.get("id")
    )
    
    return InventoryResponse(
        action=request.action,
        **result
    )
```

#### 3.2 **GET Endpoint**
```python
@router.get("/inventory")
async def get_inventory_data(
    variant_external_id: Optional[str] = None,
    location_external_id: Optional[str] = None,
    movement_type: Optional[str] = None,
    alert_type: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    show_reserved: bool = False,
    show_quarantined: bool = False,
    limit: int = 50,
    offset: int = 0,
    service: InventoryFlowService = Depends(get_service),
    organization_id: uuid.UUID = Depends(get_organization_id)
):
    filters = {
        "variant_external_id": variant_external_id,
        "location_external_id": location_external_id,
        "movement_type": movement_type,
        "alert_type": alert_type,
        "date_from": date_from,
        "date_to": date_to,
        "show_reserved": show_reserved,
        "show_quarantined": show_quarantined
    }
    
    result = await service.get_inventory_data(
        filters=filters,
        limit=limit,
        offset=offset,
        organization_id=organization_id
    )
    
    return result
```

## Mapeamento para Tabelas Existentes

### **tenant_business_transactions** - Movimentações de Inventário

#### **Ajuste de Estoque**
```json
{
  "transaction_type": "INVENTORY_ADJUSTMENT",
  "external_id": "ADJ-2025-001",
  "transaction_data": {
    "adjustment_type": "MANUAL_ADJUSTMENT",
    "reason_code": "INVENTORY_COUNT",
    "reason_description": "Ajuste após contagem física",
    "location_external_id": "CD001"
  },
  "transaction_items": [
    {
      "variant_external_id": "VONBX2099AZUL34",
      "qty_before": 150.0,
      "qty_after": 145.0,
      "qty_change": -5.0,
      "unit_cost": 112.55
    }
  ],
  "status": "COMPLETED"
}
```

#### **Contagem de Inventário**
```json
{
  "transaction_type": "INVENTORY_COUNT",
  "external_id": "COUNT-2025-001",
  "transaction_data": {
    "count_type": "CYCLE_COUNT",
    "location_external_id": "CD001",
    "counter_user_id": "USER123",
    "count_date": "2025-01-15"
  },
  "transaction_items": [
    {
      "variant_external_id": "VONBX2099AZUL34",
      "qty_system": 150.0,
      "qty_counted": 145.0,
      "qty_variance": -5.0,
      "variance_percentage": -3.33
    }
  ],
  "status": "PENDING_APPROVAL"
}
```

#### **Reserva de Estoque**
```json
{
  "transaction_type": "STOCK_RESERVATION",
  "external_id": "RES-ORDER-123",
  "transaction_data": {
    "reservation_type": "SALE_ORDER",
    "reference_external_id": "ORDER-123",
    "location_external_id": "LJ005",
    "expires_at": "2025-01-20T00:00:00Z"
  },
  "transaction_items": [
    {
      "variant_external_id": "VONBX2099AZUL34",
      "qty_reserved": 2.0,
      "priority": "HIGH"
    }
  ],
  "status": "ACTIVE"
}
```

### **tenant_snapshots** - Estados de Inventário

#### **Estoque Detalhado por Localização**
```json
{
  "snapshot_type": "INVENTORY",
  "entity_id": "variant-uuid",
  "related_entity_id": "location-uuid",
  "snapshot_key": "detailed_stock",
  "snapshot_value": {
    "qty_on_hand": 150.0,
    "qty_reserved": 10.0,
    "qty_available": 140.0,
    "qty_quarantined": 5.0,
    "avg_cost": 112.55,
    "last_movement_date": "2025-01-15",
    "reorder_point": 20.0,
    "max_stock": 300.0
  },
  "snapshot_date": "2025-01-15",
  "metadata": {
    "variant_external_id": "VONBX2099AZUL34",
    "location_external_id": "CD001"
  }
}
```

#### **Alertas de Estoque**
```json
{
  "snapshot_type": "INVENTORY",
  "entity_id": "location-uuid",
  "snapshot_key": "stock_alerts",
  "snapshot_value": [
    {
      "variant_external_id": "VONBX2099AZUL34",
      "alert_type": "LOW_STOCK",
      "current_qty": 15.0,
      "threshold": 20.0,
      "severity": "WARNING",
      "days_until_stockout": 7
    }
  ],
  "snapshot_date": "2025-01-15"
}
```

### **tenant_business_events** - Eventos de Inventário

#### **Eventos de Ajuste**
```json
{
  "entity_type": "TRANSACTION",
  "entity_id": "adjustment-uuid",
  "event_code": "inventory_adjustment_made",
  "event_data": {
    "variant_external_id": "VONBX2099AZUL34",
    "location_external_id": "CD001",
    "qty_change": -5.0,
    "reason": "INVENTORY_COUNT",
    "user_id": "USER123"
  }
}
```

## Exemplos de Uso

### **1. Ajustar Estoque**
```json
POST /api/v1/inventory
{
  "action": "adjust_stock",
  "transaction_data": {
    "external_id": "ADJ-2025-001",
    "variant_external_id": "VONBX2099AZUL34",
    "location_external_id": "CD001",
    "qty_change": -5.0,
    "reason_code": "INVENTORY_COUNT",
    "reason_description": "Ajuste após contagem física",
    "unit_cost": 112.55
  },
  "metadata": {
    "user_id": "USER123",
    "notes": "Produto danificado encontrado durante contagem"
  }
}
```

### **2. Fazer Contagem de Inventário**
```json
POST /api/v1/inventory
{
  "action": "count_inventory",
  "transaction_data": {
    "external_id": "COUNT-2025-001",
    "location_external_id": "CD001",
    "count_type": "CYCLE_COUNT",
    "items": [
      {
        "variant_external_id": "VONBX2099AZUL34",
        "qty_counted": 145.0
      },
      {
        "variant_external_id": "VONBX2099AZUL36",
        "qty_counted": 89.0
      }
    ]
  },
  "metadata": {
    "counter_user_id": "USER123"
  }
}
```

### **3. Reservar Estoque**
```json
POST /api/v1/inventory
{
  "action": "reserve_stock",
  "transaction_data": {
    "external_id": "RES-ORDER-123",
    "reference_external_id": "ORDER-123",
    "location_external_id": "LJ005",
    "items": [
      {
        "variant_external_id": "VONBX2099AZUL34",
        "qty_to_reserve": 2.0,
        "priority": "HIGH"
      }
    ],
    "expires_in_hours": 24
  }
}
```

### **4. Transferência Interna**
```json
POST /api/v1/inventory
{
  "action": "transfer_internal",
  "transaction_data": {
    "external_id": "TRANS-INT-001",
    "origin_location_external_id": "CD001",
    "destination_location_external_id": "LJ005",
    "items": [
      {
        "variant_external_id": "VONBX2099AZUL34",
        "qty_transfer": 10.0
      }
    ],
    "reason": "RESTOCK_STORE"
  }
}
```

### **5. Colocar em Quarentena**
```json
POST /api/v1/inventory
{
  "action": "quarantine_product",
  "transaction_data": {
    "external_id": "QUAR-2025-001",
    "variant_external_id": "VONBX2099AZUL34",
    "location_external_id": "CD001",
    "qty_quarantine": 5.0,
    "quarantine_reason": "QUALITY_ISSUE",
    "expected_resolution_date": "2025-01-20"
  }
}
```

### **6. Consultar Estoque Atual**
```
GET /api/v1/inventory?variant_external_id=VONBX2099AZUL34&location_external_id=CD001&show_reserved=true
```

### **7. Consultar Alertas de Estoque**
```
GET /api/v1/inventory?alert_type=LOW_STOCK&location_external_id=LJ005
```

### **8. Histórico de Movimentações**
```
GET /api/v1/inventory?variant_external_id=VONBX2099AZUL34&movement_type=ADJUSTMENT&date_from=2025-01-01&date_to=2025-01-31
```

## Arquitetura de 3 Camadas

### **Fluxo Completo de Ajuste de Estoque:**
```python
async def adjust_stock(self, transaction_data: Dict, organization_id: uuid.UUID):
    async with db.transaction():
        # 1. EVENTO: Registrar o que aconteceu
        await self.create_event({
            "entity_type": "TRANSACTION",
            "entity_id": adjustment_id,
            "event_code": "inventory_adjustment_made",
            "event_data": {
                "variant_external_id": transaction_data["variant_external_id"],
                "location_external_id": transaction_data["location_external_id"],
                "qty_change": transaction_data["qty_change"],
                "reason": transaction_data["reason_code"]
            }
        })
        
        # 2. TRANSAÇÃO: Registrar movimentação
        adjustment_id = await self.create_transaction({
            "transaction_type": "INVENTORY_ADJUSTMENT",
            "external_id": transaction_data["external_id"],
            "transaction_data": transaction_data,
            "status": "COMPLETED"
        })
        
        # 3. SNAPSHOT: Atualizar estoque atual
        await self.update_inventory_snapshot(
            variant_external_id=transaction_data["variant_external_id"],
            location_external_id=transaction_data["location_external_id"],
            qty_change=transaction_data["qty_change"]
        )
        
        # 4. ALERTAS: Verificar se precisa gerar alertas
        await self.check_and_create_stock_alerts(
            variant_external_id=transaction_data["variant_external_id"],
            location_external_id=transaction_data["location_external_id"]
        )
```

## Cronograma Simplificado

| Fase | Duração | Entregável |
|------|---------|------------|
| 1 | 1 dia | Modelos de inventário |
| 2 | 2 dias | Service com ações |
| 3 | 1 dia | Endpoints implementados |
| 4 | 1 dia | Testes automatizados |

**Total: 5 dias**

## Critérios de Aceitação

### **Funcional**
- [x] Ajustar estoque com validações
- [x] Fazer contagem de inventário
- [x] Reservar/liberar estoque
- [x] Transferências internas
- [x] Controle de quarentena
- [x] Consultar estoque atual
- [x] Histórico de movimentações
- [x] Alertas de estoque

### **Não Funcional**
- [x] Consultas de estoque < 1s
- [x] Consistência em ajustes
- [x] Auditoria completa
- [x] Alertas automáticos

### **Relatórios Incluídos**
- [x] Estoque por localização
- [x] Movimentações por período
- [x] Divergências de contagem
- [x] Reservas ativas
- [x] Produtos em quarentena
- [x] Alertas de reposição

## Event Codes Específicos

### **Inventory Flow Events**
- `inventory_adjustment_made` - Ajuste realizado
- `inventory_count_started` - Contagem iniciada
- `inventory_count_completed` - Contagem finalizada
- `inventory_count_approved` - Contagem aprovada
- `stock_reservation_made` - Reserva criada
- `stock_reservation_released` - Reserva liberada
- `stock_reservation_expired` - Reserva expirada
- `internal_transfer_completed` - Transferência interna concluída
- `product_quarantined` - Produto colocado em quarentena
- `quarantine_released` - Quarentena liberada
- `stock_alert_triggered` - Alerta de estoque disparado
- `reorder_point_reached` - Ponto de reposição atingido

Esta API de Inventory Flow oferece controle completo sobre o inventário mantendo a simplicidade de apenas 2 endpoints!