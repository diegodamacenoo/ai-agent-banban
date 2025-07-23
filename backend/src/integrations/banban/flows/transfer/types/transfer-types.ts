import { FastifyRequest, FastifyReply } from 'fastify';
import { SupabaseClient } from '@supabase/supabase-js';

// ============================
// CORE INTERFACES
// ============================

export interface TransferItem {
  product_id: string;
  product_external_id?: string;
  quantity: number;
  unit_cost?: number;
  product_name?: string;
  variant_external_id?: string;
  qty_solicitada?: number;
  qty_separada?: number;
  qty_diff?: number;
  qty_shipped?: number;
  qty_expected?: number;
  qty_received?: number;
}

export interface ShippingInfo {
  carrier?: string;
  tracking_number?: string;
  estimated_delivery?: string;
}

export interface TransferDiscrepancy {
  sku: string;
  qty_solicitada?: number;
  qty_separada?: number;
  qty_expected?: number;
  qty_received?: number;
  qty_diff: number;
}

export interface StateHistoryEntry {
  status: string;
  transitioned_at: string;
  metadata?: Record<string, unknown>;
}

// ============================
// WEBHOOK INTERFACES
// ============================

export interface WebhookPayloadData {
  transfer_id?: string;
  origin_location_external_id: string;
  destination_location_external_id: string;
  origin_location_name?: string;
  destination_location_name?: string;
  items: TransferItem[];
  transfer_date: string;
  status: string;
  shipping_info?: ShippingInfo;
  notes?: string;
  mapa_separacao_id?: string;
  operador_id?: string;
  veiculo_id?: string;
  invoice_external_id?: string;
  items_shipped?: TransferItem[];
  items_received?: TransferItem[];
  external_id?: string;
  transfer_external_id?: string;
}

export interface WebhookPayload {
  event_type: string;
  organization_id: string;
  data: WebhookPayloadData;
}

// ============================
// QUERY INTERFACES  
// ============================

export interface QueryTransfersParams {
  org: string;
  transfer_id?: string;
  origin_location_id?: string;
  destination_location_id?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
  external_id?: string;
  transaction_type?: string;
  date_from?: string;
  date_to?: string;
  origin_location_external_id?: string;
  destination_location_external_id?: string;
  route_analysis?: boolean;
  demand_analysis?: boolean;
}

export interface AnalyticsParams {
  org: string;
  from_date?: string;
  to_date?: string;
  location_id?: string;
  product_id?: string;
  origin_location_external_id?: string;
  destination_location_external_id?: string;
}

// ============================
// RESPONSE INTERFACES
// ============================

export interface TransferProcessResult {
  transaction_id: string;
  external_id: string;
  status: string;
  transfer_out_document_id?: string;
  transfer_in_document_id?: string;
  // Added properties for consistency with ECA response
  success: boolean;
  entityType: string;
  entityId: string;
  entityIds?: string[]; // Optional, as it might not always be an array
  relationshipIds?: string[]; // Optional
  stateTransition?: { from: string; to: string }; // Optional
  summary: {
    message: string;
    records_processed: number;
    records_successful: number;
    records_failed: number;
  };
}

export interface TransferQueryResult {
  success: boolean;
  data: {
    transfers: BusinessTransaction[];
    total: number;
    limit: number;
    offset: number;
  };
  metadata: {
    query_executed_at: string;
    organization_id: string;
    filters_applied: Record<string, unknown>;
  };
}

export interface TransferAnalyticsResult {
  success: boolean;
  data: {
    summary: {
      total_transfers: number;
      transfer_out_count: number;
      transfer_in_count: number;
      status_distribution: Record<string, number>;
      avg_processing_time_hours: number;
      period_from?: string;
      period_to?: string;
    };
    route_analytics: {
      top_routes: RouteStats[];
    };
    trends: {
      daily_volume: DailyVolumeStats[];
    };
  };
  metadata: {
    generated_at: string;
    organization_id: string;
  };
}

export interface RouteStats {
  route: string;
  count: number;
}

export interface DailyVolumeStats {
  date: string;
  count: number;
}

export interface RoutePerformance {
  route: string;
  total_transfers: number;
  avg_lead_time_hours: string;
  on_time_rate: string;
  accuracy_rate: string;
  last_updated: string;
}

export interface DemandPatterns {
  location: string;
  total_transfers_received: number;
  avg_monthly_transfers: string;
  critical_products: CriticalProduct[];
  last_updated: string;
}

export interface CriticalProduct {
  variant_external_id: string;
  total_qty: number;
  frequency: number;
}

// ============================
// DATABASE INTERFACES
// ============================

export interface BusinessTransaction {
  id: string;
  organization_id: string;
  transaction_type: string;
  external_id?: string;
  status: string;
  attributes: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
  tenant_business_relationships?: BusinessRelationship[];
}

export interface BusinessRelationship {
  id: string;
  organization_id: string;
  relationship_type: string;
  from_entity_id: string;
  to_entity_id: string;
  attributes: Record<string, unknown>;
  tenant_business_entities?: BusinessEntity;
}

export interface BusinessEntity {
  id: string;
  organization_id: string;
  entity_type: string;
  external_id: string;
  attributes: Record<string, unknown>;
}

export interface BusinessEvent {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_id: string;
  event_code: string;
  event_data: Record<string, unknown>;
  created_at: string;
}

export interface InventorySnapshot {
  organization_id: string;
  snapshot_type: string;
  snapshot_key: string;
  snapshot_value: {
    current_stock: number;
    last_movement: string;
    last_movement_ref: string;
    last_updated: string;
  };
  snapshot_date: string;
}

// ============================
// HANDLER TYPES
// ============================

export interface WebhookRequest extends FastifyRequest {
  body: WebhookPayload;
}

export interface QueryRequest extends FastifyRequest {
  query: QueryTransfersParams;
}

export interface AnalyticsRequest extends FastifyRequest {
  query: AnalyticsParams;
}

export interface HealthCheckRequest extends FastifyRequest {
  // Empty query for health check
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  module: string;
  version: string;
  timestamp: string;
  uptime: number;
  database_connection?: string;
  last_processed_event?: string;
  error?: string;
}

export interface WebhookResponse {
  success: boolean;
  message: string;
  data?: {
    event_type: string;
    processed_at: string;
    event_uuid: string;
    processing_time_ms: number;
    records_processed: number;
    records_successful: number;
    records_failed: number;
    success_rate: string;
    result: TransferProcessResult;
  };
  error?: {
    type: string;
    message: string;
    event_type?: string;
    processing_time_ms?: number;
    timestamp: string;
  };
}

// ============================
// TYPE UTILITIES
// ============================

export type TransferStatus = 
  | 'PEDIDO_TRANSFERENCIA_CRIADO'
  | 'MAPA_SEPARACAO_CRIADO'
  | 'AGUARDANDO_SEPARACAO_CD'
  | 'EM_SEPARACAO_CD'
  | 'SEPARACAO_CD_COM_DIVERGENCIA'
  | 'SEPARACAO_CD_SEM_DIVERGENCIA'
  | 'SEPARADO_PRE_DOCA'
  | 'EMBARCADO_CD'
  | 'TRANSFERENCIA_CDH_FATURADA'
  | 'AGUARDANDO_CONFERENCIA_LOJA'
  | 'EM_CONFERENCIA_LOJA'
  | 'CONFERENCIA_LOJA_COM_DIVERGENCIA'
  | 'CONFERENCIA_LOJA_SEM_DIVERGENCIA'
  | 'EFETIVADO_LOJA';

export type TransactionType = 
  | 'ORDER_TRANSFER'
  | 'DOCUMENT_TRANSFER_OUT'
  | 'DOCUMENT_TRANSFER_IN'
  | 'INVENTORY_MOVEMENT'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN';

export type RelationshipType = 
  | 'ORIGINATES_FROM'
  | 'DESTINED_TO'
  | 'CONTAINS_ITEM'
  | 'AFFECTS_PRODUCT'
  | 'AT_LOCATION'
  | 'CAUSED_BY_TRANSFER'
  | 'BASED_ON_ORDER'
  | 'CORRESPONDS_TO';

export function isValidTransferStatus(status: string): status is TransferStatus {
  const validStatuses: TransferStatus[] = [
    'PEDIDO_TRANSFERENCIA_CRIADO',
    'MAPA_SEPARACAO_CRIADO',
    'AGUARDANDO_SEPARACAO_CD',
    'EM_SEPARACAO_CD',
    'SEPARACAO_CD_COM_DIVERGENCIA',
    'SEPARACAO_CD_SEM_DIVERGENCIA',
    'SEPARADO_PRE_DOCA',
    'EMBARCADO_CD',
    'TRANSFERENCIA_CDH_FATURADA',
    'AGUARDANDO_CONFERENCIA_LOJA',
    'EM_CONFERENCIA_LOJA',
    'CONFERENCIA_LOJA_COM_DIVERGENCIA',
    'CONFERENCIA_LOJA_SEM_DIVERGENCIA',
    'EFETIVADO_LOJA'
  ];
  return validStatuses.includes(status as TransferStatus);
}
