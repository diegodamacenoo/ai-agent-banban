# Plano Executivo: Transfer Flow API - Sistema Interno

## Mapeamento para Tabelas Existentes

### **tenant_business_entities** - Entidades do Transfer Flow

#### **Transportadoras/Rotas**
```json
{
  "entity_type": "CARRIER",
  "external_id": "TRANSP001",
  "name": "Logística Rápida LTDA",
  "business_data": {
    "cnpj": "12.345.678/0001-90",
    "contact_phone": "(85) 99999-9999",
    "service_areas": ["CE", "PE", "RN"],
    "avg_delivery_time_hours": 24,
    "performance_rating": 4.2,
    "cost_per_km": 2.50
  }
}
```

#### **Rotas de Distribuição**
```json
{
  "entity_type": "DISTRIBUTION_ROUTE",
  "external_id": "ROUTE_CD001_LJ005",
  "name": "CD Principal → Loja Centro",
  "business_data": {
    "origin_external_id": "CD001",
    "destination_external_id": "LJ005",
    "distance_km": 15.2,
    "estimated_time_hours": 1.5,
    "preferred_carrier": "TRANSP001",
    "frequency": "DAILY",
    "capacity_limit": 500
  }
}
```

### **tenant_business_transactions** - Transações de Transferência

#### **Solicitação de Transferência**
```json
{
  "transaction_type": "TRANSFER_REQUEST",
  "external_id": "TRANS-001",
  "transaction_number": "TRF-2025-001",
  "transaction_data": {
    "transfer_type": "CD_TO_STORE",
    "origin_location_external_id": "CD001",
    "destination_location_external_id": "LJ005",
    "priority": "NORMAL",
    "requested_date": "2025-01-15",
    "expected_delivery_date": "2025-01-16",
    "requester_user_id": "MANAGER123",
    "system_source": "ERP",
    "reason": "RESTOCK_STORE"
  },
  "transaction_items": [
    {
      "variant_external_id": "VONBX2099AZUL34",
      "qty_requested": 10.0,
      "priority": "HIGH",
      "current_stock_origin": 150.0,
      "current_stock_destination": 5.0
    }
  ],
  "total_value": 1125.50,
  "status": "REQUESTED",
  "origin_entity_id": "cd-uuid",
  "destination_entity_id": "store-uuid"
}
```

#### **Processo de Transferência Completo**
```json
{
  "transaction_type": "TRANSFER_PROCESS",
  "external_id": "PROC-TRANS-001",
  "transaction_data": {
    "reference_external_id": "TRANS-001",
    "separation_started_at": "2025-01-15T08:00:00Z",
    "separation_completed_at": "2025-01-15T08:45:00Z",
    "separation_time_minutes": 45,
    "separator_user_id": "SEP123",
    "shipped_at": "2025-01-15T14:00:00Z",
    "carrier_external_id": "TRANSP001",
    "tracking_internal": "TRACK001",
    "received_at": "2025-01-16T09:30:00Z",
    "completed_at": "2025-01-16T10:15:00Z",
    "total_lead_time_hours": 26.25,
    "on_time": true,
    "accuracy_rate": 100.0
  },
  "transaction_items": [
    {
      "variant_external_id": "VONBX2099AZUL34",
      "qty_separated": 10.0,
      "qty_shipped": 10.0,
      "qty_received": 10.0,
      "qty_variance": 0.0,
      "condition": "GOOD"
    }
  ],
  "status": "COMPLETED",
  "reference_transaction_id": "transfer-request-uuid"
}
```

#### **Movimentações de Estoque (Saída/Entrada)**
```json
{
  "transaction_type": "INVENTORY_MOVEMENT",
  "external_id": "MOV-OUT-TRANS-001",
  "transaction_data": {
    "movement_type": "TRANSFER_OUT",
    "reference_external_id": "TRANS-001",
    "location_external_id": "CD001",
    "destination_location_external_id": "LJ005",
    "system_source": "TRANSFER_SYSTEM"
  },
  "transaction_items": [
    {
      "variant_external_id": "VONBX2099AZUL34",
      "qty_change": -10.0,
      "unit_cost": 112.55
    }
  ],
  "status": "COMPLETED"
}
```

### **tenant_snapshots** - Analytics de Transferência

#### **Performance de Rota**
```json
{
  "snapshot_type": "TRANSFER_PERFORMANCE",
  "entity_id": "origin-location-uuid",
  "related_entity_id": "destination-location-uuid",
  "snapshot_key": "route_metrics",
  "snapshot_value": {
    "route": "CD001 → LJ005",
    "total_transfers": 45,
    "avg_lead_time_hours": 26.5,
    "min_lead_time_hours": 18.0,
    "max_lead_time_hours": 48.0,
    "on_time_rate": 87.5,
    "avg_separation_time_minutes": 42,
    "accuracy_rate": 96.8,
    "volume_trend": "increasing",
    "efficiency_score": 8.2,
    "cost_per_transfer": 45.80
  },
  "snapshot_date": "2025-01-15",
  "metadata": {
    "origin_external_id": "CD001",
    "destination_external_id": "LJ005",
    "period": "last_30_days"
  }
}
```

#### **Demanda por Localização**
```json
{
  "snapshot_type": "LOCATION_DEMAND",
  "entity_id": "destination-location-uuid",
  "snapshot_key": "demand_patterns",
  "snapshot_value": {
    "location": "LJ005",
    "total_transfers_received": 67,
    "avg_monthly_transfers": 22,
    "critical_products": [
      {"variant_external_id": "VONBX2099AZUL34", "total_qty": 245, "frequency": 15},
      {"variant_external_id": "VONBX2099AZUL36", "total_qty": 198, "frequency": 12}
    ],
    "seasonal_peaks": {
      "Q4": {"increase_percentage": 45.0, "peak_months": ["NOV", "DEC"]},
      "Q2": {"increase_percentage": 25.0, "peak_months": ["MAY", "JUN"]}
    },
    "avg_items_per_transfer": 8.5,
    "demand_volatility": "medium"
  },
  "snapshot_date": "2025-01-15",
  "metadata": {
    "destination_external_id": "LJ005",
    "analysis_period": "12_months"
  }
}
```

#### **Otimizações Sugeridas**
```json
{
  "snapshot_type": "TRANSFER_OPTIMIZATION",
  "entity_id": "organization-uuid",
  "snapshot_key": "route_suggestions",
  "snapshot_value": [
    {
      "type": "REDUCE_LEAD_TIME",
      "route": "CD001 → LJ003",
      "current_lead_time": 52.3,
      "target_lead_time": 36.0,
      "recommendation": "Revisar processo de separação",
      "potential_savings": "30% tempo",
      "priority": "high"
    },
    {
      "type": "CONSOLIDATE_TRANSFERS",
      "routes": ["CD001 → LJ007", "CD001 → LJ008"],
      "current_frequency": "daily",
      "suggested_frequency": "every_2_days",
      "potential_savings": "25% custo logístico",
      "priority": "medium"
    }
  ],
  "snapshot_date": "2025-01-15",
  "expires_at": "2025-01-22T00:00:00Z"
}
```

#### **Alertas de Transferência**
```json
{
  "snapshot_type": "TRANSFER_ALERTS",
  "entity_id": "organization-uuid",
  "snapshot_key": "active_alerts",
  "snapshot_value": [
    {
      "alert_type": "URGENT_TRANSFER_DELAY_RISK",
      "severity": "high",
      "transfer_external_id": "TRANS-001",
      "route": "CD001 → LJ005",
      "risk_factors": ["high_priority", "historical_delays"],
      "recommended_action": "EXPEDITE_SEPARATION"
    },
    {
      "alert_type": "LOW_PERFORMANCE_ROUTE",
      "severity": "medium",
      "route": "CD001 → LJ003",
      "on_time_rate": 65.2,
      "threshold": 80.0,
      "recommended_action": "REVIEW_LOGISTICS"
    }
  ],
  "snapshot_date": "2025-01-15",
  "expires_at": "2025-01-16T00:00:00Z"
}
```

### **tenant_business_events** - Eventos de Transferência

#### **Eventos de Processo**
```json
{
  "entity_type": "TRANSACTION",
  "entity_id": "transfer-uuid",
  "event_code": "transfer_separation_completed",
  "event_data": {
    "transfer_external_id": "TRANS-001",
    "separator_user_id": "SEP123",
    "separation_time_minutes": 45,
    "items_separated": 3,
    "efficiency_score": 8.5,
    "next_step": "SHIPMENT"
  }
}
```

#### **Eventos de Performance**
```json
{
  "entity_type": "TRANSACTION",
  "entity_id": "transfer-uuid",
  "event_code": "transfer_completed_on_time",
  "event_data": {
    "transfer_external_id": "TRANS-001",
    "route": "CD001 → LJ005",
    "total_lead_time_hours": 26.25,
    "expected_lead_time_hours": 28.0,
    "performance_bonus": true,
    "accuracy_rate": 100.0
  }
}
```

## Exemplos de Uso - Foco em Processamento Interno

### **1. Registrar Solicitação de Transferência**
```json
POST /api/v1/transfer
{
  "action": "register_request",
  "transaction_data": {
    "external_id": "TRANS-001",
    "origin_location_external_id": "CD001",
    "destination_location_external_id": "LJ005",
    "transfer_type": "CD_TO_STORE",
    "priority": "HIGH",
    "requested_date": "2025-01-15",
    "items": [
      {
        "variant_external_id": "VONBX2099AZUL34",
        "qty_requested": 10.0,
        "reason": "LOW_STOCK_ALERT"
      },
      {
        "variant_external_id": "VONBX2099AZUL36",
        "qty_requested": 8.0,
        "reason": "RESTOCK"
      }
    ]
  },
  "metadata": {
    "user_id": "MANAGER123",
    "system_source": "ERP",
    "reason": "Reposição urgente para promoção fim de semana"
  }
}
```

### **2. Registrar Início de Separação**
```json
POST /api/v1/transfer
{
  "action": "register_separation",
  "transaction_data": {
    "transfer_external_id": "TRANS-001",
    "separation_started_at": "2025-01-15T08:00:00Z",
    "separator_user_id": "SEP123",
    "estimated_completion_minutes": 45,
    "separation_zone": "ZONE_A"
  },
  "metadata": {
    "user_id": "SEP123",
    "location": "CD001"
  }
}
```

### **3. Registrar Embarque**
```json
POST /api/v1/transfer
{
  "action": "register_shipment",
  "transaction_data": {
    "transfer_external_id": "TRANS-001",
    "separation_completed_at": "2025-01-15T08:45:00Z",
    "separation_time_minutes": 45,
    "shipped_at": "2025-01-15T14:00:00Z",
    "carrier_external_id": "TRANSP001",
    "tracking_internal": "TRACK001",
    "estimated_delivery": "2025-01-16T10:00:00Z",
    "items_shipped": [
      {
        "variant_external_id": "VONBX2099AZUL34",
        "qty_shipped": 10.0,
        "condition": "GOOD"
      }
    ]
  },
  "metadata": {
    "user_id": "EXPEDICAO123"
  }
}
```

### **4. Registrar Recebimento**
```json
POST /api/v1/transfer
{
  "action": "register_receipt",
  "transaction_data": {
    "transfer_external_id": "TRANS-001",
    "received_at": "2025-01-16T09:30:00Z",
    "receiver_user_id": "LOJA005_REC",
    "condition_on_arrival": "GOOD",
    "temperature_ok": true,
    "packaging_ok": true
  },
  "metadata": {
    "user_id": "LOJA005_REC",
    "location": "LJ005"
  }
}
```

### **5. Registrar Conclusão com Conferência**
```json
POST /api/v1/transfer
{
  "action": "register_completion",
  "transaction_data": {
    "transfer_external_id": "TRANS-001",
    "completed_at": "2025-01-16T10:15:00Z",
    "conference_user_id": "LOJA005_CONF",
    "items_received": [
      {
        "variant_external_id": "VONBX2099AZUL34",
        "qty_received": 10.0,
        "qty_expected": 10.0,
        "condition": "GOOD",
        "variance": 0.0
      }
    ],
    "overall_accuracy": 100.0,
    "total_lead_time_hours": 26.25
  },
  "metadata": {
    "user_id": "LOJA005_CONF",
    "notes": "Transferência recebida sem divergências"
  }
}
```

### **6. Consultar Performance de Rota**
```
GET /api/v1/transfer?origin_location_external_id=CD001&destination_location_external_id=LJ005&route_analysis=true
```

**Response:**
```json
{
  "route_performance": {
    "route": "CD001 → LJ005",
    "total_transfers": 45,
    "avg_lead_time_hours": 26.5,
    "on_time_rate": 87.5,
    "accuracy_rate": 96.8,
    "efficiency_score": 8.2,
    "trends": {
      "lead_time": "stable",
      "volume": "increasing",
      "accuracy": "improving"
    }
  },
  "recommendations": [
    {
      "type": "PROCESS_OPTIMIZATION",
      "description": "Separação poderia ser 15% mais rápida",
      "impact": "Redução de 6h no lead time total"
    }
  ]
}
```

### **7. Análise de Demanda por Loja**
```
GET /api/v1/transfer?destination_location_external_id=LJ005&demand_analysis=true&date_from=2024-01-01
```

**Response:**
```json
{
  "demand_analysis": {
    "location": "LJ005",
    "total_transfers_received": 67,
    "avg_monthly_transfers": 22,
    "critical_products": [
      {
        "variant_external_id": "VONBX2099AZUL34",
        "total_qty": 245,
        "frequency": 15,
        "trend": "growing"
      }
    ],
    "seasonal_patterns": {
      "peak_months": ["NOV", "DEC", "MAY"],
      "low_months": ["FEB", "MAR"],
      "volatility": "medium"
    },
    "recommendations": [
      {
        "type": "STOCK_PLANNING",
        "description": "Aumentar estoque base em 20% para Q4",
        "products": ["VONBX2099AZUL34", "VONBX2099AZUL36"]
      }
    ]
  }
}
```

### **8. Otimizações de Rotas**
```
GET /api/v1/transfer?include_optimization=true&date_from=2025-01-01
```

**Response:**
```json
{
  "optimization_suggestions": [
    {
      "type": "CONSOLIDATE_TRANSFERS",
      "routes": ["CD001 → LJ007", "CD001 → LJ008"],
      "current_cost": 150.00,
      "optimized_cost": 112.50,
      "savings": "25%",
      "feasibility": "high"
    },
    {
      "type": "CHANGE_FREQUENCY",
      "route": "CD001 → LJ003",
      "current": "daily",
      "suggested": "every_2_days",
      "impact": "Redução de 30% nos custos logísticos"
    }
  ],
  "total_potential_savings": "22% nos custos de transferência"
}
```

### **9. Dashboard de Transferências em Tempo Real**
```
GET /api/v1/transfer?status=IN_TRANSIT&include_analytics=true
```

**Response:**
```json
{
  "in_transit": [
    {
      "external_id": "TRANS-002",
      "route": "CD001 → LJ003",
      "estimated_arrival": "2025-01-16T15:00:00Z",
      "delay_risk": "low",
      "tracking": "On schedule"
    }
  ],
  "daily_metrics": {
    "transfers_completed": 12,
    "avg_lead_time_today": 24.5,
    "on_time_rate_today": 91.7,
    "separations_pending": 3
  },
  "alerts": [
    {
      "type": "SEPARATION_DELAY",
      "transfer_id": "TRANS-004",
      "delay_minutes": 15
    }
  ]
}
```

### **10. Relatório de Eficiência de Separação**
```
GET /api/v1/transfer?include_analytics=true&date_from=2025-01-01&date_to=2025-01-31
```

**Response:**
```json
{
  "separation_analytics": {
    "total_separations": 156,
    "avg_separation_time_minutes": 38.5,
    "best_performers": [
      {
        "user_id": "SEP123",
        "avg_time_minutes": 28.2,
        "accuracy_rate": 98.5,
        "efficiency_score": 9.2
      }
    ],
    "improvement_opportunities": [
      {
        "area": "ZONE_B",
        "current_avg": 45.2,
        "target": 35.0,
        "recommendation": "Reorganizar layout de produtos"
      }
    ]
  }
}
```

## Arquitetura de 3 Camadas - Transfer Flow

### **Fluxo Completo de Transferência:**
```python
async def register_completion(self, transaction_data: Dict, organization_id: uuid.UUID):
    async with db.transaction():
        # 1. EVENTO: Registrar conclusão
        await self.create_event({
            "entity_type": "TRANSACTION",
            "entity_id": transfer_id,
            "event_code": "transfer_completed",
            "event_data": {
                "transfer_external_id": transaction_data["transfer_external_id"],
                "total_lead_time_hours": transaction_data["total_lead_time_hours"],
                "accuracy_rate": transaction_data["overall_accuracy"],
                "route": f"{origin_external_id} → {destination_external_id}"
            }
        })
        
        # 2. TRANSAÇÃO: Criar movimentação de entrada no destino
        movement_id = await self.create_transaction({
            "transaction_type": "INVENTORY_MOVEMENT",
            "external_id": f"MOV-IN-{transaction_data['transfer_external_id']}",
            "transaction_data": {
                "movement_type": "TRANSFER_IN",
                "reference_external_id": transaction_data["transfer_external_id"],
                "location_external_id": destination_external_id
            },
            "status": "COMPLETED"
        })
        
        # 3. SNAPSHOT: Atualizar estoque do destino
        for item in transaction_data["items_received"]:
            await self.update_inventory_snapshot(
                variant_external_id=item["variant_external_id"],
                location_external_id=destination_external_id,
                qty_change=item["qty_received"],
                movement_type="TRANSFER_IN"
            )
        
        # 4. ANALYTICS: Atualizar métricas de performance
        await self.update_transfer_snapshots(transaction_data)
        
        # 5. OTIMIZAÇÃO: Atualizar sugestões de rotas
        await self.update_route_optimization_suggestions(organization_id)
```

## Cronograma Atualizado - Sistema Interno

| Fase | Duração | Entregável |
|------|---------|------------|
| 1 | 1 dia | Modelos de transferência |
| 2 | 2 dias | Service com analytics logísticas |
| 3 | 1 dia | Endpoints implementados |
| 4 | 1 dia | Dashboards de logística |

**Total: 5 dias**

## Critérios de Aceitação - Foco em Analytics

### **Funcional**
- [x] Registrar solicitações de transferência com priorização
- [x] Monitorar processo de separação em tempo real
- [x] Rastrear embarques e recebimentos
- [x] Calcular lead times automaticamente
- [x] Detectar divergências e problemas de qualidade
- [x] Gerar métricas de performance por rota
- [x] Dashboard logístico em tempo real

### **Analytics Avançadas**
- [x] **Performance de rotas** (lead time, pontualidade, acuracidade)
- [x] **Análise de demanda** por localização
- [x] **Eficiência de separação** por operador
- [x] **Sazonalidade** de transferências
- [x] **Otimização de rotas** e consolidação
- [x] **Previsão de demanda** baseada em histórico
- [x] **Alertas proativos** de atraso e performance

### **Relatórios Pré-configurados**
- [x] **Performance de rotas** por período
- [x] **Eficiência de separadores** individual
- [x] **Demanda por loja** com sazonalidade
- [x] **Otimizações sugeridas** de logística
- [x] **Custos logísticos** por rota
- [x] **SLA de entregas** por região

### **Não Funcional**
- [x] Consultas de performance < 1s
- [x] Cálculos de métricas em tempo real
- [x] Snapshots atualizados automaticamente
- [x] Alertas baseados em ML patterns
- [x] Otimizações recalculadas semanalmente

## Event Codes Específicos

### **Transfer Flow Events**
- `transfer_request_registered` - Solicitação registrada
- `transfer_separation_started` - Separação iniciada
- `transfer_separation_completed` - Separação finalizada
- `transfer_shipped` - Embarque realizado
- `transfer_in_transit` - Em trânsito
- `transfer_received` - Recebido no destino
- `transfer_completed` - Processo finalizado
- `transfer_delayed` - Atraso detectado
- `separation_efficiency_alert` - Alerta de eficiência
- `route_performance_updated` - Performance atualizada
- `demand_pattern_detected` - Padrão identificado

## Dashboards Incluídos

### **1. Dashboard Operacional**
- **Transferências em andamento** por status
- **Separações pendentes** por prioridade
- **Alertas críticos** de atraso
- **Performance do dia** vs meta

### **2. Dashboard Logístico**
- **Mapa de rotas** com performance
- **Lead times** por destino
- **Eficiência de separação** por zona
- **Custos logísticos** por período

### **3. Dashboard Gerencial**
- **Performance consolidada** de rotas
- **Demanda por loja** com tendências
- **Otimizações disponíveis** com ROI
- **SLA de entregas** por região

### **4. Dashboard Executivo**
- **KPIs logísticos** principais
- **Evolução de eficiência** mensal
- **Savings opportunities** identificadas
- **Performance vs concorrência**

## Alertas Inteligentes

### **Tipos de Alertas**
```python
TRANSFER_ALERTS = {
    "SEPARATION_DELAY": {
        "condition": "separation_time > avg_time * 1.5",
        "severity": "medium",
        "action": "INVESTIGATE_BOTTLENECK"
    },
    "ROUTE_PERFORMANCE_DROP": {
        "condition": "on_time_rate < 80%",
        "severity": "high",
        "action": "REVIEW_LOGISTICS"
    },
    "HIGH_DEMAND_DESTINATION": {
        "condition": "transfer_frequency > avg * 2",
        "severity": "low",
        "action": "INCREASE_BASE_STOCK"
    },
    "CONSOLIDATION_OPPORTUNITY": {
        "condition": "multiple_small_transfers_same_route",
        "severity": "low",
        "action": "OPTIMIZE_SCHEDULE"
    }
}
```

### **Machine Learning Patterns**
```python
async def detect_transfer_patterns(self, organization_id: uuid.UUID) -> List[Dict]:
    """Detecta padrões usando ML básico"""
    
    patterns = []
    
    # Padrão de sazonalidade
    seasonal = await self.analyze_seasonal_transfer_patterns(organization_id)
    if seasonal["confidence"] > 0.8:
        patterns.append({
            "type": "SEASONAL_DEMAND",
            "pattern": seasonal,
            "recommendation": "Ajustar estoque base sazonalmente"
        })
    
    # Padrão de eficiência por separador
    efficiency = await self.analyze_separator_efficiency_patterns(organization_id)
    patterns.append({
        "type": "SEPARATOR_EFFICIENCY",
        "pattern": efficiency,
        "recommendation": "Treinar separadores com baixa performance"
    })
    
    # Padrão de rotas problemáticas
    problematic_routes = await self.identify_problematic_routes(organization_id)
    if problematic_routes:
        patterns.append({
            "type": "ROUTE_ISSUES",
            "pattern": problematic_routes,
            "recommendation": "Revisar logística das rotas identificadas"
        })
    
    return patterns
```

## Benefícios Específicos para BanBan

### **Operacional**
- ✅ **Visibilidade total** do fluxo de transferências
- ✅ **Otimização de separação** com métricas por operador
- ✅ **Redução de lead times** com identificação de gargalos
- ✅ **Melhoria da pontualidade** com alertas proativos

### **Logístico**
- ✅ **Otimização de rotas** com consolidação inteligente
- ✅ **Redução de custos** logísticos em 20-30%
- ✅ **Melhoria do SLA** de entregas
- ✅ **Planejamento de capacidade** baseado em demanda

### **Estratégico**
- ✅ **Análise de demanda** por loja para planejamento
- ✅ **Sazonalidade identificada** automaticamente
- ✅ **Oportunidades de savings** quantificadas
- ✅ **Benchmarking** de performance entre rotas

### **Financeiro**
- ✅ **Redução de custos** logísticos
- ✅ **Otimização de inventário** em trânsito
- ✅ **Melhoria do giro** com entregas mais rápidas
- ✅ **ROI calculado** para melhorias propostas

Esta API de Transfer Flow oferece **otimização logística avançada** e **insights acionáveis** para melhoria contínua da distribuição, mantendo a simplicidade de apenas 2 endpoints! Objetivo
Implementar uma API simplificada de fluxo de transferências que processe dados de movimentação entre localizações para gerar insights sobre eficiência logística e otimização de distribuição.

## 🏗️ **Premissa Fundamental**
- **❌ SEM integrações externas** (transportadoras, GPS, etc.)
- **✅ Processamento interno** de dados de transferência informados
- **✅ Foco total em analytics** logísticas e insights de distribuição
- **✅ Otimização de rotas** baseada em dados históricos

## Endpoints Simplificados

### 1. **POST /api/v1/transfer** 
**Responsabilidade:** Registrar TODAS as ações do fluxo de transferência
- Registrar solicitação de transferência
- Registrar início de separação
- Registrar embarque/expedição
- Registrar recebimento no destino
- Registrar conferência e efetivação

### 2. **GET /api/v1/transfer**
**Responsabilidade:** Consultar transferências e analytics
- Buscar transferências por external_id, rota, período
- Métricas de performance logística
- Análise de lead times por rota
- Relatórios de eficiência de separação
- Insights de demanda por localização

## Estratégia de Implementação

### **POST /api/v1/transfer - Payload Unificado**

```json
{
  "action": "register_request|register_separation|register_shipment|register_receipt|register_completion",
  "transaction_data": {
    "external_id": "string",
    "reference_external_id": "string",
    // Dados específicos da ação
  },
  "metadata": {
    "user_id": "string",
    "timestamp": "datetime",
    "system_source": "string", // WMS, ERP, Mobile, etc.
    "location": "string",
    "notes": "string"
  }
}
```

### **GET /api/v1/transfer - Query Parameters**

```
GET /api/v1/transfer?external_id=TRANS-001
GET /api/v1/transfer?origin_location_external_id=CD001&status=EM_TRANSITO
GET /api/v1/transfer?destination_location_external_id=LJ005&include_analytics=true
GET /api/v1/transfer?route_analysis=true&date_from=2025-01-01
```

## Estrutura de Implementação

### **Preparação: Tabelas Utilizadas**

**Usaremos as tabelas existentes:**
- `tenant_business_entities` - Produtos, localizações, transportadoras
- `tenant_business_transactions` - Solicitações e processos de transferência  
- `tenant_business_events` - Eventos do fluxo logístico
- `tenant_snapshots` - Métricas de performance e demanda

### **Fase 1: Modelo Unificado (1 dia)**

#### 1.1 **Transfer Action Enum**
```python
class TransferAction(str, Enum):
    REGISTER_REQUEST = "register_request"
    REGISTER_SEPARATION = "register_separation"
    REGISTER_SHIPMENT = "register_shipment"
    REGISTER_RECEIPT = "register_receipt"
    REGISTER_COMPLETION = "register_completion"
    UPDATE_STATUS = "update_status"
    REGISTER_DIVERGENCE = "register_divergence"
    CANCEL_TRANSFER = "cancel_transfer"
```

#### 1.2 **Request Model Único**
```python
class TransferRequest(BaseModel):
    action: TransferAction
    transaction_data: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None
```

#### 1.3 **Response Model Único**
```python
class TransferResponse(BaseModel):
    transaction_id: Optional[uuid.UUID]
    external_id: str
    action: TransferAction
    status: str
    result: Dict[str, Any]
    timestamp: datetime
    logistics_metrics: Optional[Dict[str, Any]] = None
    alerts_generated: Optional[List[Dict]] = None
```

### **Fase 2: Service Layer Unificado (2 dias)**

#### 2.1 **TransferFlowService.process_action()**
```python
async def process_action(
    self, 
    action: TransferAction,
    transaction_data: Dict[str, Any],
    organization_id: uuid.UUID,
    user_id: Optional[uuid.UUID] = None
) -> Dict[str, Any]:
    
    # Roteamento baseado na action
    if action == TransferAction.REGISTER_REQUEST:
        return await self._register_request(transaction_data, organization_id, user_id)
    elif action == TransferAction.REGISTER_SEPARATION:
        return await self._register_separation(transaction_data, organization_id, user_id)
    # ... outros casos
```

#### 2.2 **Métodos de Implementação (SEM INTEGRAÇÕES EXTERNAS)**

##### **_register_request()**
1. Validar origem e destino existem na base
2. Verificar disponibilidade de estoque na origem
3. **Calcular demanda histórica** do destino
4. **Sugerir prioridade** baseada em criticidade
5. Criar transação de solicitação
6. **Estimar tempo de entrega** baseado em histórico
7. Registrar evento de solicitação

##### **_register_separation()**
1. Buscar transferência por external_id
2. Registrar início da separação
3. **Calcular tempo estimado** de separação
4. **Monitorar performance** do separador
5. **Detectar demoras** anômalas
6. Atualizar status e métricas

##### **_register_shipment()**
1. Finalizar separação se não finalizada
2. Registrar embarque/expedição
3. **Processar saída de estoque** da origem
4. **Calcular tempo total** de separação
5. **Iniciar tracking interno** de lead time
6. **Atualizar métricas** de eficiência

##### **_register_receipt()**
1. Registrar chegada no destino
2. **Calcular lead time real** vs estimado
3. **Identificar atrasos** ou antecipações
4. Preparar para conferência
5. **Atualizar métricas** de transportadora
6. Registrar evento de recebimento

##### **_register_completion()**
1. Finalizar conferência no destino
2. **Processar entrada de estoque** no destino
3. **Identificar divergências** de transferência
4. **Calcular tempo total** do processo
5. **Atualizar performance** da rota
6. **Liberar reservas** se houver
7. Finalizar processo com métricas completas

#### 2.3 **Database Helpers Focados em Analytics**

```python
async def calculate_route_performance(self, origin_external_id: str, destination_external_id: str) -> Dict:
    """Calcula métricas de performance de rota"""
    
    # Buscar transferências da rota nos últimos 6 meses
    transfers = await self.get_route_transfers(origin_external_id, destination_external_id, days=180)
    
    if not transfers:
        return {"message": "Dados insuficientes para análise"}
    
    # Calcular métricas
    lead_times = [t["lead_time_hours"] for t in transfers if t.get("lead_time_hours")]
    separation_times = [t["separation_time_minutes"] for t in transfers if t.get("separation_time_minutes")]
    
    metrics = {
        "total_transfers": len(transfers),
        "avg_lead_time_hours": sum(lead_times) / len(lead_times) if lead_times else 0,
        "min_lead_time_hours": min(lead_times) if lead_times else 0,
        "max_lead_time_hours": max(lead_times) if lead_times else 0,
        "on_time_rate": await self.calculate_on_time_rate(transfers),
        "avg_separation_time_minutes": sum(separation_times) / len(separation_times) if separation_times else 0,
        "accuracy_rate": await self.calculate_transfer_accuracy_rate(transfers),
        "volume_trend": await self.analyze_volume_trend(transfers),
        "efficiency_score": await self.calculate_efficiency_score(transfers)
    }
    
    return metrics

async def analyze_demand_patterns(self, destination_external_id: str) -> Dict:
    """Analisa padrões de demanda de uma localização"""
    
    # Buscar transferências recebidas nos últimos 12 meses
    incoming_transfers = await self.get_incoming_transfers(destination_external_id, days=365)
    
    # Agrupar por produto e período
    demand_by_product = {}
    demand_by_month = {}
    
    for transfer in incoming_transfers:
        # Por produto
        for item in transfer.get("items", []):
            variant_id = item["variant_external_id"]
            if variant_id not in demand_by_product:
                demand_by_product[variant_id] = {"total_qty": 0, "transfer_count": 0}
            demand_by_product[variant_id]["total_qty"] += item["qty"]
            demand_by_product[variant_id]["transfer_count"] += 1
        
        # Por mês
        month = transfer["created_at"][:7]  # YYYY-MM
        if month not in demand_by_month:
            demand_by_month[month] = {"total_transfers": 0, "total_items": 0}
        demand_by_month[month]["total_transfers"] += 1
        demand_by_month[month]["total_items"] += len(transfer.get("items", []))
    
    # Identificar produtos críticos (alta demanda)
    critical_products = sorted(
        demand_by_product.items(), 
        key=lambda x: x[1]["total_qty"], 
        reverse=True
    )[:10]
    
    # Detectar sazonalidade
    seasonal_peaks = await self.detect_seasonal_peaks(demand_by_month)
    
    return {
        "destination": destination_external_id,
        "analysis_period": "12 months",
        "total_transfers": len(incoming_transfers),
        "demand_by_product": demand_by_product,
        "critical_products": critical_products,
        "seasonal_patterns": seasonal_peaks,
        "avg_monthly_transfers": len(incoming_transfers) / 12,
        "recommendations": await self.generate_demand_recommendations(demand_by_product, seasonal_peaks)
    }

async def optimize_route_suggestions(self, organization_id: uuid.UUID) -> List[Dict]:
    """Sugere otimizações de rotas baseadas em dados"""
    
    suggestions = []
    
    # Analisar todas as rotas ativas
    routes = await self.get_active_routes(organization_id)
    
    for route in routes:
        performance = await self.calculate_route_performance(
            route["origin_external_id"], 
            route["destination_external_id"]
        )
        
        # Rota com lead time alto
        if performance.get("avg_lead_time_hours", 0) > 48:
            suggestions.append({
                "type": "REDUCE_LEAD_TIME",
                "route": f"{route['origin_external_id']} → {route['destination_external_id']}",
                "current_lead_time": performance["avg_lead_time_hours"],
                "recommendation": "Revisar processo de separação ou logística",
                "priority": "high"
            })
        
        # Rota com baixa taxa de pontualidade
        if performance.get("on_time_rate", 100) < 80:
            suggestions.append({
                "type": "IMPROVE_ON_TIME_RATE",
                "route": f"{route['origin_external_id']} → {route['destination_external_id']}",
                "current_rate": performance["on_time_rate"],
                "recommendation": "Revisar planejamento de embarques",
                "priority": "medium"
            })
        
        # Rota com baixa acuracidade
        if performance.get("accuracy_rate", 100) < 95:
            suggestions.append({
                "type": "IMPROVE_ACCURACY",
                "route": f"{route['origin_external_id']} → {route['destination_external_id']}",
                "current_accuracy": performance["accuracy_rate"],
                "recommendation": "Melhorar processo de conferência",
                "priority": "high"
            })
    
    # Consolidação de rotas (múltiplas transferências pequenas)
    consolidation_opportunities = await self.identify_consolidation_opportunities(organization_id)
    suggestions.extend(consolidation_opportunities)
    
    return suggestions

async def generate_transfer_alerts(self, transaction_data: Dict) -> List[Dict]:
    """Gera alertas baseados em métricas de transferência"""
    alerts = []
    
    transfer_external_id = transaction_data.get("external_id")
    origin_external_id = transaction_data.get("origin_location_external_id")
    destination_external_id = transaction_data.get("destination_location_external_id")
    
    if origin_external_id and destination_external_id:
        # Calcular métricas da rota
        route_performance = await self.calculate_route_performance(origin_external_id, destination_external_id)
        
        # Transferência urgente com prazo apertado
        if transaction_data.get("priority") == "HIGH" and route_performance.get("avg_lead_time_hours", 0) > 24:
            alerts.append({
                "type": "URGENT_TRANSFER_DELAY_RISK",
                "severity": "high",
                "message": f"Transferência urgente {transfer_external_id} com risco de atraso",
                "route": f"{origin_external_id} → {destination_external_id}",
                "avg_lead_time": route_performance["avg_lead_time_hours"],
                "recommended_action": "EXPEDITE_SEPARATION"
            })
        
        # Demanda alta no destino
        demand_analysis = await self.analyze_demand_patterns(destination_external_id)
        if destination_external_id in [p[0] for p in demand_analysis.get("critical_products", [])[:5]]:
            alerts.append({
                "type": "HIGH_DEMAND_DESTINATION",
                "severity": "medium",
                "message": f"Destino {destination_external_id} com alta demanda histórica",
                "recommended_action": "PRIORITIZE_TRANSFER"
            })
        
        # Rota com performance baixa
        if route_performance.get("on_time_rate", 100) < 70:
            alerts.append({
                "type": "LOW_PERFORMANCE_ROUTE",
                "severity": "medium", 
                "message": f"Rota {origin_external_id} → {destination_external_id} com baixa performance",
                "on_time_rate": route_performance["on_time_rate"],
                "recommended_action": "REVIEW_LOGISTICS"
            })
    
    return alerts

async def update_transfer_snapshots(self, transaction_data: Dict) -> None:
    """Atualiza snapshots para analytics rápidas"""
    
    origin_external_id = transaction_data.get("origin_location_external_id")
    destination_external_id = transaction_data.get("destination_location_external_id")
    
    if origin_external_id and destination_external_id:
        # Resolver UUIDs
        origin_uuid = await self.resolve_entity_uuid(origin_external_id, "LOCATION")
        destination_uuid = await self.resolve_entity_uuid(destination_external_id, "LOCATION")
        
        # Atualizar performance da rota
        route_performance = await self.calculate_route_performance(origin_external_id, destination_external_id)
        
        await self.update_snapshot(
            snapshot_type="TRANSFER_PERFORMANCE",
            entity_id=origin_uuid,
            related_entity_id=destination_uuid,
            snapshot_key="route_metrics",
            snapshot_value=route_performance,
            metadata={
                "origin_external_id": origin_external_id,
                "destination_external_id": destination_external_id,
                "last_transfer_id": transaction_data.get("external_id")
            }
        )
        
        # Atualizar demanda do destino
        demand_analysis = await self.analyze_demand_patterns(destination_external_id)
        
        await self.update_snapshot(
            snapshot_type="LOCATION_DEMAND",
            entity_id=destination_uuid,
            snapshot_key="demand_patterns",
            snapshot_value=demand_analysis,
            metadata={
                "destination_external_id": destination_external_id,
                "analysis_date": datetime.now().isoformat()
            }
        )
```

### **Fase 3: API Layer Simplificado (1 dia)**

#### 3.1 **POST Endpoint**
```python
@router.post("/transfer")
async def process_transfer_action(
    request: TransferRequest,
    service: TransferFlowService = Depends(get_service),
    current_user: dict = Depends(get_current_user),
    organization_id: uuid.UUID = Depends(get_organization_id)
):
    result = await service.process_action(
        action=request.action,
        transaction_data=request.transaction_data,
        organization_id=organization_id,
        user_id=current_user.get("id")
    )
    
    return TransferResponse(
        action=request.action,
        **result
    )
```

#### 3.2 **GET Endpoint com Analytics**
```python
@router.get("/transfer")
async def get_transfer_data(
    external_id: Optional[str] = None,
    origin_location_external_id: Optional[str] = None,
    destination_location_external_id: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    include_analytics: bool = False,
    route_analysis: bool = False,
    demand_analysis: bool = False,
    include_optimization: bool = False,
    limit: int = 50,
    offset: int = 0,
    service: TransferFlowService = Depends(get_service),
    organization_id: uuid.UUID = Depends(get_organization_id)
):
    filters = {
        "external_id": external_id,
        "origin_location_external_id": origin_location_external_id,
        "destination_location_external_id": destination_location_external_id,
        "status": status,
        "date_from": date_from,
        "date_to": date_to
    }
    
    result = await service.get_transfer_data(
        filters=filters,
        include_analytics=include_analytics,
        route_analysis=route_analysis,
        demand_analysis=demand_analysis,
        include_optimization=include_optimization,
        limit=limit,
        offset=offset,
        organization_id=organization_id
    )
    
    return result
```

##