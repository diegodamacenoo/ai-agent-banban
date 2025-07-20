- **✅ Segmentação inteligente** de clientes e produtos

## Endpoints Simplificados

### 1. **POST /api/v1/sales** 
**Responsabilidade:** Registrar TODAS as ações do fluxo de vendas
- Registrar vendas realizadas (PDV, e-commerce)
- Registrar pagamentos recebidos
- Registrar cancelamentos e devoluções
- Registrar aplicação de descontos
- Registrar dados fiscais (NF emitida)

### 2. **GET /api/v1/sales**
**Responsabilidade:** Consultar vendas e analytics comerciais
- Buscar vendas por external_id, cliente, vendedor, período
- Analytics de performance de vendedores
- Segmentação RFM de clientes
- Relatórios de produtos mais vendidos
- Insights de margem e lucratividade

## Estratégia de Implementação

### **POST /api/v1/sales - Payload Unificado**

```json
{
  "action": "register_sale|register_payment|register_cancellation|register_return|register_fiscal_data",
  "transaction_data": {
    "external_id": "string",
    "reference_external_id": "string",
    // Dados específicos da ação
  },
  "metadata": {
    "user_id": "string",
    "timestamp": "datetime",
    "system_source": "string", // PDV, E-commerce, Mobile, etc.
    "location": "string",
    "notes": "string"
  }
}
```

### **GET /api/v1/sales - Query Parameters**

```
GET /api/v1/sales?external_id=VENDA-001
GET /api/v1/sales?customer_external_id=CLI001&include_analytics=true
GET /api/v1/sales?salesperson_id=VEND123&date_from=2025-01-01&include_performance=true
GET /api/v1/sales?product_analysis=true&location_external_id=LJ005
```

## Estrutura de Implementação

### **Preparação: Tabelas Utilizadas**

**Usaremos as tabelas existentes:**
- `tenant_business_entities` - Clientes, vendedores, produtos, lojas
- `tenant_business_transactions` - Vendas, pagamentos, devoluções
- `tenant_business_events` - Eventos comerciais e comportamentais
- `tenant_snapshots` - Performance comercial e segmentação de clientes

### **Fase 1: Modelo Unificado (1 dia)**

#### 1.1 **Sales Action Enum**
```python
class SalesAction(str, Enum):
    REGISTER_SALE = "register_sale"
    REGISTER_PAYMENT = "register_payment"
    REGISTER_CANCELLATION = "register_cancellation"
    REGISTER_RETURN = "register_return"
    REGISTER_FISCAL_DATA = "register_fiscal_data"
    APPLY_DISCOUNT = "apply_discount"
    UPDATE_CUSTOMER_DATA = "update_customer_data"
    PROCESS_LOYALTY_POINTS = "process_loyalty_points"
```

#### 1.2 **Request Model Único**
```python
class SalesRequest(BaseModel):
    action: SalesAction
    transaction_data: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None
```

#### 1.3 **Response Model Único**
```python
class SalesResponse(BaseModel):
    transaction_id: Optional[uuid.UUID]
    external_id: str
    action: SalesAction
    status: str
    result: Dict[str, Any]
    timestamp: datetime
    commercial_metrics: Optional[Dict[str, Any]] = None
    customer_insights: Optional[Dict[str, Any]] = None
```

### **Fase 2: Service Layer Unificado (2-3 dias)**

#### 2.1 **SalesFlowService.process_action()**
```python
async def process_action(
    self, 
    action: SalesAction,
    transaction_data: Dict[str, Any],
    organization_id: uuid.UUID,
    user_id: Optional[uuid.UUID] = None
) -> Dict[str, Any]:
    
    # Roteamento baseado na action
    if action == SalesAction.REGISTER_SALE:
        return await self._register_sale(transaction_data, organization_id, user_id)
    elif action == SalesAction.REGISTER_PAYMENT:
        return await self._register_payment(transaction_data, organization_id, user_id)
    # ... outros casos
```

#### 2.2 **Métodos de Implementação (SEM INTEGRAÇÕES EXTERNAS)**

##### **_register_sale()**
1. Validar cliente e produtos existem na base
2. Resolver UUIDs internos dos external_ids
3. **Calcular métricas da venda** (margem, ticket médio, etc.)
4. **Processar saída de estoque** automaticamente
5. **Atualizar segmentação RFM** do cliente
6. **Calcular comissões** de vendedores
7. **Detectar oportunidades** de cross-sell/up-sell

##### **_register_payment()**
1. Associar pagamento à venda existente
2. **Processar dados financeiros** internamente
3. **Calcular prazo médio** de recebimento
4. **Atualizar credit score** do cliente
5. **Registrar método** de pagamento preferido
6. **Calcular cashflow** projetado

##### **_register_cancellation()**
1. Validar venda pode ser cancelada
2. **Processar estorno** de estoque se necessário
3. **Calcular impacto** na performance do vendedor
4. **Analisar motivos** de cancelamento
5. **Atualizar churn indicators** do cliente
6. **Ajustar métricas** de performance

##### **_register_return()**
1. Processar devolução de produtos
2. **Entrada de estoque** com condição
3. **Calcular taxa de devolução** por produto
4. **Analisar motivos** da devolução
5. **Impactar satisfaction score** do cliente
6. **Alertar sobre qualidade** se padrão detectado

##### **_register_fiscal_data()**
1. Processar dados da nota fiscal emitida
2. **Calcular impostos** e valores líquidos
3. **Registrar dados fiscais** para compliance
4. **Atualizar faturamento** consolidado
5. **Calcular margem líquida** real

#### 2.3 **Database Helpers Focados em Analytics**

```python
async def calculate_customer_rfm(self, customer_external_id: str) -> Dict:
    """Calcula segmentação RFM do cliente"""
    
    # Buscar histórico de compras dos últimos 12 meses
    sales = await self.get_customer_sales(customer_external_id, days=365)
    
    if not sales:
        return {"segment": "NEW", "scores": {"R": 0, "F": 0, "M": 0}}
    
    # Calcular Recency (dias desde última compra)
    last_sale_date = max([s["sale_date"] for s in sales])
    recency_days = (datetime.now().date() - last_sale_date).days
    
    # Calcular Frequency (número de compras)
    frequency = len(sales)
    
    # Calcular Monetary (valor total gasto)
    monetary = sum([s["total_value"] for s in sales])
    
    # Converter para scores 1-5
    r_score = await self.calculate_recency_score(recency_days)
    f_score = await self.calculate_frequency_score(frequency)
    m_score = await self.calculate_monetary_score(monetary)
    
    # Determinar segmento
    segment = await self.determine_rfm_segment(r_score, f_score, m_score)
    
    return {
        "customer_external_id": customer_external_id,
        "recency_days": recency_days,
        "frequency": frequency,
        "monetary": monetary,
        "scores": {"R": r_score, "F": f_score, "M": m_score},
        "segment": segment,
        "last_updated": datetime.now().isoformat()
    }

async def calculate_salesperson_performance(self, salesperson_external_id: str, period_days: int = 30) -> Dict:
    """Calcula performance completa do vendedor"""
    
    # Buscar vendas do período
    sales = await self.get_salesperson_sales(salesperson_external_id, days=period_days)
    
    if not sales:
        return {"message": "Sem vendas no período"}
    
    # Métricas básicas
    total_sales = len(sales)
    total_revenue = sum([s["total_value"] for s in sales])
    avg_ticket = total_revenue / total_sales if total_sales > 0 else 0
    
    # Margem média
    total_margin = sum([s.get("gross_margin", 0) for s in sales])
    avg_margin = total_margin / total_sales if total_sales > 0 else 0
    
    # Taxa de conversão (se tiver dados de tentativas)
    conversion_data = await self.get_conversion_data(salesperson_external_id, period_days)
    conversion_rate = conversion_data.get("conversion_rate", 0)
    
    # Produtos mais vendidos
    product_sales = {}
    for sale in sales:
        for item in sale.get("items", []):
            variant_id = item["variant_external_id"]
            if variant_id not in product_sales:
                product_sales[variant_id] = {"qty": 0, "revenue": 0}
            product_sales[variant_id]["qty"] += item["qty"]
            product_sales[variant_id]["revenue"] += item["line_total"]
    
    top_products = sorted(
        product_sales.items(), 
        key=lambda x: x[1]["revenue"], 
        reverse=True
    )[:5]
    
    # Clientes únicos
    unique_customers = len(set([s["customer_external_id"] for s in sales if s.get("customer_external_id")]))
    
    # Ticket médio por cliente
    avg_ticket_per_customer = total_revenue / unique_customers if unique_customers > 0 else 0
    
    # Comissões
    total_commission = sum([s.get("commission_amount", 0) for s in sales])
    
    return {
        "salesperson_external_id": salesperson_external_id,
        "period_days": period_days,
        "metrics": {
            "total_sales": total_sales,
            "total_revenue": total_revenue,
            "avg_ticket": avg_ticket,
            "avg_margin_percentage": avg_margin,
            "conversion_rate": conversion_rate,
            "unique_customers": unique_customers,
            "avg_ticket_per_customer": avg_ticket_per_customer,
            "total_commission": total_commission
        },
        "top_products": top_products,
        "performance_score": await self.calculate_performance_score(
            total_sales, avg_ticket, conversion_rate, avg_margin
        )
    }

async def analyze_product_performance(self, location_external_id: str, period_days: int = 30) -> Dict:
    """Analisa performance de produtos por localização"""
    
    # Buscar vendas da localização
    sales = await self.get_location_sales(location_external_id, days=period_days)
    
    # Agrupar por produto
    product_data = {}
    for sale in sales:
        for item in sale.get("items", []):
            variant_id = item["variant_external_id"]
            if variant_id not in product_data:
                product_data[variant_id] = {
                    "qty_sold": 0,
                    "revenue": 0,
                    "margin": 0,
                    "sales_count": 0,
                    "avg_price": 0,
                    "customers": set()
                }
            
            product_data[variant_id]["qty_sold"] += item["qty"]
            product_data[variant_id]["revenue"] += item["line_total"]
            product_data[variant_id]["margin"] += item.get("margin_amount", 0)
            product_data[variant_id]["sales_count"] += 1
            product_data[variant_id]["customers"].add(sale.get("customer_external_id"))
    
    # Calcular métricas por produto
    for variant_id, data in product_data.items():
        data["avg_price"] = data["revenue"] / data["qty_sold"] if data["qty_sold"] > 0 else 0
        data["margin_percentage"] = (data["margin"] / data["revenue"]) * 100 if data["revenue"] > 0 else 0
        data["unique_customers"] = len(data["customers"])
        data["customers"] = None  # Remove set para serialização
    
    # Rankings
    best_sellers = sorted(product_data.items(), key=lambda x: x[1]["qty_sold"], reverse=True)[:10]
    highest_revenue = sorted(product_data.items(), key=lambda x: x[1]["revenue"], reverse=True)[:10]
    highest_margin = sorted(product_data.items(), key=lambda x: x[1]["margin_percentage"], reverse=True)[:10]
    
    return {
        "location_external_id": location_external_id,
        "period_days": period_days,
        "total_products_sold": len(product_data),
        "rankings": {
            "best_sellers": best_sellers,
            "highest_revenue": highest_revenue,
            "highest_margin": highest_margin
        },
        "summary": {
            "total_revenue": sum([d["revenue"] for d in product_data.values()]),
            "total_margin": sum([d["margin"] for d in product_data.values()]),
            "avg_margin_percentage": sum([d["margin_percentage"] for d in product_data.values()]) / len(product_data)
        }
    }

async def detect_sales_patterns(self, organization_id: uuid.UUID) -> List[Dict]:
    """Detecta padrões de vendas para insights"""
    patterns = []
    
    # Sazonalidade de vendas
    seasonal_data = await self.analyze_seasonal_sales_patterns(organization_id)
    if seasonal_data["confidence"] > 0.7:
        patterns.append({
            "type": "SEASONAL_SALES",
            "pattern": seasonal_data,
            "recommendation": "Ajustar estoque e marketing sazonalmente"
        })
    
    # Cross-sell opportunities
    cross_sell = await self.identify_cross_sell_opportunities(organization_id)
    patterns.append({
        "type": "CROSS_SELL_OPPORTUNITIES",
        "pattern": cross_sell,
        "recommendation": "Implementar sugestões de produtos relacionados"
    })
    
    # Clientes em risco de churn
    churn_risk = await self.identify_churn_risk_customers(organization_id)
    if churn_risk:
        patterns.append({
            "type": "CHURN_RISK",
            "pattern": churn_risk,
            "recommendation": "Campanhas de retenção para clientes identificados"
        })
    
    # Horários de pico de vendas
    peak_hours = await self.analyze_sales_peak_hours(organization_id)
    patterns.append({
        "type": "SALES_PEAK_HOURS",
        "pattern": peak_hours,
        "recommendation": "Otimizar equipe nos horários de maior movimento"
    })
    
    return patterns

async def calculate_customer_clv(self, customer_external_id: str) -> Dict:
    """Calcula Customer Lifetime Value"""
    
    # Histórico completo do cliente
    sales_history = await self.get_customer_sales(customer_external_id, days=None)  # Todos os dados
    
    if len(sales_history) < 2:
        return {"clv": 0, "confidence": "low", "message": "Dados insuficientes"}
    
    # Métricas base
    total_revenue = sum([s["total_value"] for s in sales_history])
    total_purchases = len(sales_history)
    avg_order_value = total_revenue / total_purchases
    
    # Frequência de compra (compras por mês)
    first_purchase = min([s["sale_date"] for s in sales_history])
    last_purchase = max([s["sale_date"] for s in sales_history])
    customer_lifespan_months = ((last_purchase - first_purchase).days / 30) or 1
    purchase_frequency = total_purchases / customer_lifespan_months
    
    # CLV simples = AOV * Frequência * Margem * Tempo previsto
    avg_margin_rate = 0.35  # Assumir 35% de margem média
    predicted_lifespan_months = 24  # Assumir 2 anos
    
    clv = avg_order_value * purchase_frequency * avg_margin_rate * predicted_lifespan_months
    
    # Confidence score baseado em dados históricos
    confidence = "high" if total_purchases >= 5 else "medium" if total_purchases >= 3 else "low"
    
    return {
        "customer_external_id": customer_external_id,
        "clv": clv,
        "confidence": confidence,
        "metrics": {
            "total_revenue": total_revenue,
            "total_purchases": total_purchases,
            "avg_order_value": avg_order_value,
            "purchase_frequency_monthly": purchase_frequency,
            "customer_lifespan_months": customer_lifespan_months
        },
        "calculated_at": datetime.now().isoformat()
    }

async def update_sales_snapshots(self, transaction_data: Dict) -> None:
    """Atualiza snapshots para analytics rápidas"""
    
    customer_external_id = transaction_data.get("customer_external_id")
    salesperson_external_id = transaction_data.get("salesperson_external_id")
    location_external_id = transaction_data.get("location_external_id")
    
    # Atualizar RFM do cliente
    if customer_external_id:
        customer_uuid = await self.resolve_entity_uuid(customer_external_id, "CUSTOMER")
        rfm_data = await self.calculate_customer_rfm(customer_external_id)
        
        await self.update_snapshot(
            snapshot_type="CUSTOMER_RFM",
            entity_id=customer_uuid,
            snapshot_key="current_rfm",
            snapshot_value=rfm_data,
            metadata={
                "customer_external_id": customer_external_id,
                "last_sale_id": transaction_data.get("external_id")
            }
        )
        
        # Atualizar CLV
        clv_data = await self.calculate_customer_clv(customer_external_id)
        await self.update_snapshot(
            snapshot_type="CUSTOMER_CLV",
            entity_id=customer_uuid,
            snapshot_key="current_clv",
            snapshot_value=clv_data
        )
    
    # Atualizar performance do vendedor
    if salesperson_external_id:
        salesperson_uuid = await self.resolve_entity_uuid(salesperson_external_id, "SALESPERSON")
        performance_data = await self.calculate_salesperson_performance(salesperson_external_id)
        
        await self.update_snapshot(
            snapshot_type="SALESPERSON_PERFORMANCE",
            entity_id=salesperson_uuid,
            snapshot_key="monthly_performance",
            snapshot_value=performance_data,
            metadata={
                "salesperson_external_id": salesperson_external_id,
                "last_sale_id": transaction_data.get("external_id")
            }
        )
    
    # Atualizar performance de produtos da localização
    if location_external_id:
        location_uuid = await self.resolve_entity_uuid(location_external_id, "LOCATION")
        product_performance = await self.analyze_product_performance(location_external_id)
        
        await self.update_snapshot(
            snapshot_type="LOCATION_PRODUCT_PERFORMANCE",
            entity_id=location_uuid,
            snapshot_key="monthly_products",
            snapshot_value=product_performance,
            metadata={
                "location_external_id": location_external_id
            }
        )
```

### **Fase 3: API Layer Simplificado (1 dia)**

#### 3.1 **POST Endpoint**
```python
@router.post("/sales")
async def process_sales_action(
    request: SalesRequest,
    service: SalesFlowService = Depends(get_service),
    current_user: dict = Depends(get_current_user),
    organization_id: uuid.UUID = Depends(get_organization_id)
):
    result = await service.process_action(
        action=request.action,
        transaction_data=request.transaction_data,
        organization_id=organization_id,
        user_id=current_user.get("id")
    )
    
    return SalesResponse(
        action=request.action,
        **result
    )
```

#### 3.2 **GET Endpoint com Analytics Avançadas**
```python
@router.get("/sales")
async def get_sales_data(
    external_id: Optional[str] = None,
    customer_external_id: Optional[str] = None,
    salesperson_external_id: Optional[str] = None,
    location_external_id: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    include_analytics: bool = False,
    include_performance: bool = False,
    include_rfm: bool = False,
    product_analysis: bool = False,
    customer_segmentation: bool = False,
    sales_patterns: bool = False,
    limit: int = 50,
    offset: int = 0,
    service: SalesFlowService = Depends(get_service),
    organization_id: uuid.UUID = Depends(get_organization_id)
):
    filters = {
        "external_id": external_id,
        "customer_external_id": customer_external_id,
        "salesperson_external_id": salesperson_external_id,
        "location_external_id": location_external_id,
        "date_from": date_from,
        "date_to": date_to
    }
    
    result = await service.get_sales_data(
        filters=filters,
        include_analytics=include_analytics,
        include_performance=include_performance,
        include_rfm=include_rfm,
        product_analysis=product_analysis,
        customer_segmentation=customer_segmentation,
        sales_patterns=sales_patterns,
        limit=limit,
        offset=offset,
        organization_id=organization_id
    )
    
    return result
```

## Mapeamento para Tabelas Existentes

### **tenant_business_entities** - Entidades do Sales Flow

#### **Clientes**
```json
{
  "entity_type": "CUSTOMER",
  "external_id": "CLI001",
  "name": "João Silva Santos",
  "business_data": {
    "customer_type": "PERSON",
    "cpf": "123.456.789-01",
    "email": "joao.silva@email.com",
    "phone": "(85) 99999-9999",
    "birth_date": "1985-05-15",
    "address": {
      "street": "Rua das Flores, 123",
      "neighborhood": "Centro",
      "city": "Fortaleza",
      "state": "CE",
      "zipcode": "60000-000"
    },
    "preferences": {
      "favorite_categories": ["Tênis", "Sapatênis"],
      "size": "42",
      "communication_channel": "whatsapp",
      "price_sensitivity": "medium"
    },
    "acquisition": {
      "channel": "ORGANIC",
      "first_purchase_date": "2024-01-15",
      "referral_source": "FRIEND"
    }
  }
}
```

#### **Vendedores**
```json
{
  "entity_type": "SALESPERSON",
  "external_id": "VEND123",
  "name": "Maria Oliveira Santos",
  "business_data": {
    "employee_id": "EMP001",
    "cpf": "987.654.321-00",
    "email": "maria.oliveira@banban.com.br",
    "phone": "(85) 98888-8888",
    "hire_date": "2023-06-01",
    "location_external_id": "LJ005",
    "commission_rate": 3.5,
    "sales_target_monthly": 50000.00,
    "specialties": ["Calçados Femininos", "Acessórios"],
    "languages": ["Portuguese", "English"],
    "experience_years": 5
  }
}
```

### **tenant_business_transactions** - Transações de Vendas

#### **Venda Completa**
```json
{
  "transaction_type": "SALE",
  "external_id": "VENDA-001",
  "transaction_number": "PDV-2025-001",
  "transaction_data": {
    "sale_type": "RETAIL",
    "customer_external_id": "CLI001",
    "salesperson_external_id": "VEND123",
    "location_external_id": "LJ005",
    "channel": "PHYSICAL_STORE",
    "sale_date": "2025-01-15",
    "sale_time": "14:30:00",
    "payment_method": "CREDIT_CARD",
    "payment_installments": 3,
    "discount_percentage": 10.0,
    "discount_amount": 35.50,
    "tax_amount": 42.60,
    "shipping_amount": 0.0,
    "gross_amount": 355.00,
    "net_amount": 319.50,
    "margin_amount": 142.75,
    "margin_percentage": 44.7,
    "commission_amount": 11.18,
    "loyalty_points_earned": 32,
    "loyalty_points_used": 0,
    "campaign_id": "PROMO_VERAO_2025"
  },
  "transaction_items": [
    {
      "variant_external_id": "VONBX2099AZUL34",
      "product_name": "Tênis Casual Azul 34",
      "category": "Tênis",
      "qty": 1.0,
      "unit_price": 199.90,
      "unit_cost": 112.55,
      "discount_percentage": 10.0,
      "discount_amount": 19.99,
      "line_total": 179.91,
      "line_margin": 67.36,
      "line_margin_percentage": 37.4,
      "commission_amount": 6.30
    },
    {
      "variant_external_id": "VONBX2099AZUL36",
      "product_name": "Tênis Casual Azul 36",
      "category": "Tênis",
      "qty": 1.0,
      "unit_price": 199.90,
      "unit_cost": 112.55,
      "discount_percentage": 10.0,
      "discount_amount": 19.99,
      "line_total": 179.91,
      "line_margin": 67.36,
      "line_margin_percentage": 37.4,
      "commission_amount": 6.30
    }
  ],
  "total_value": 359.82,
  "status": "COMPLETED",
  "origin_entity_id": "customer-uuid",
  "destination_entity_id": "store-uuid"
}
```

#### **Pagamento Recebido**
```json
{
  "transaction_type": "PAYMENT",
  "external_id": "PAG-VENDA-001",
  "transaction_data": {
    "payment_type": "SALE_PAYMENT",
    "reference_external_id": "VENDA-001",
    "payment_method": "CREDIT_CARD",
    "payment_date": "2025-01-15",
    "amount": 359.82,
    "installments": 3,
    "card_brand": "VISA",
    "card_last_digits": "1234",
    "authorization_code": "AUTH123456",
    "transaction_id": "TXN789012",
    "fee_amount": 10.79,
    "net_amount": 349.03,
    "processing_time_seconds": 2.5
  },
  "status": "CONFIRMED",
  "reference_transaction_id": "sale-uuid"
}
```

#### **Nota Fiscal (Dados Processados)**
```json
{
  "transaction_type": "FISCAL_DOCUMENT",
  "external_id": "NFE-2025-001",
  "transaction_data": {
    "doc_type": "SALE",
    "fiscal_number": "000001",
    "serie": "001",
    "cfop": "5102",
    "nfe_key": "25250112345678000195550010000000011000000001",
    "issue_date": "2025-01-15T15:00:00Z",
    "reference_external_id": "VENDA-001",
    "customer_external_id": "CLI001",
    "taxes": {
      "icms": 25.20,
      "pis": 2.34,
      "cofins": 10.78,
      "total": 38.32
    },
    "emission_type": "ONLINE"
  },
  "total_value": 359.82,
  "status": "ISSUED",
  "reference_transaction_id": "sale-uuid"
}
```

### **tenant_snapshots** - Analytics Comerciais

#### **Segmentação RFM de Cliente**
```json
{
  "snapshot_type": "CUSTOMER_RFM",
  "entity_id": "customer-uuid",
  "snapshot_key": "current_rfm",
  "snapshot_value": {
    "customer_external_id": "CLI001",
    "recency_days": 5,
    "frequency": 8,
    "monetary": 2450.80,
    "scores": {"R": 5, "F": 4, "M": 4},
    "segment": "CHAMPIONS",
    "segment_description": "Melhores clientes - compram recentemente, frequentemente e gastam muito",
    "next_purchase_probability": 0.85,
    "churn_risk": "low"
  },
  "snapshot_date": "2025-01-15",
  "metadata": {
    "customer_external_id": "CLI001",
    "last_sale_id": "VENDA-001",
    "calculation_date": "2025-01-15T16:00:00Z"
  }
}
```

#### **Customer Lifetime Value**
```json
{
  "snapshot_type": "CUSTOMER_CLV",
  "entity_id": "customer-uuid",
  "snapshot_key": "current_clv",
  "snapshot_value": {
    "customer_external_id": "CLI001",
    # Plano Executivo: Sales Flow API - Sistema Interno

## Objetivo
Implementar uma API simplificada de fluxo de vendas que processe dados de transações comerciais para gerar insights avançados sobre performance de vendas, comportamento de clientes e otimização comercial.

## 🏗️ **Premissa Fundamental**
- **❌ SEM integrações externas** (gateways de pagamento, SEFAZ, etc.)
- **✅ Processamento interno** de dados de vendas informados
- **✅ Foco total em analytics** comerciais e insights de performance
- **✅ Segmentação int