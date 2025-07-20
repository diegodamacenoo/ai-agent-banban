import { z } from 'zod';

// ================================================
// ENUMS E CONSTANTES
// ================================================

export enum EventType {
  // Product Events
  PRODUCT_CREATED = 'product_created',
  PRODUCT_UPDATED = 'product_updated',
  PRODUCT_DELETED = 'product_deleted',
  
  // Inventory Events
  INVENTORY_ADJUSTMENT = 'inventory_adjustment',
  INVENTORY_COUNT = 'inventory_count',
  INVENTORY_TRANSFER = 'inventory_transfer',
  
  // Sales Events
  SALE_COMPLETED = 'sale_completed',
  SALE_CANCELLED = 'sale_cancelled',
  RETURN_PROCESSED = 'return_processed',
  
  // Purchase Events
  PURCHASE_COMPLETED = 'purchase_completed',
  PURCHASE_CANCELLED = 'purchase_cancelled',
  PURCHASE_RETURNED = 'purchase_returned',
  
  // Transfer Events
  TRANSFER_INITIATED = 'transfer_initiated',
  TRANSFER_COMPLETED = 'transfer_completed',
  TRANSFER_CANCELLED = 'transfer_cancelled'
}

export enum ProductCategory {
  FOOTWEAR = 'FOOTWEAR',
  ACCESSORIES = 'ACCESSORIES',
  CLOTHING = 'CLOTHING'
}

export enum MovementType {
  SALE = 'SALE',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  ADJUSTMENT = 'ADJUSTMENT'
}

export enum ProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING'
}

export enum EdgeFunctionType {
  INVENTORY = 'inventory',
  SALES = 'sales',
  PURCHASE = 'purchase',
  TRANSFER = 'transfer'
}

// ================================================
// INTERFACES PRINCIPAIS
// ================================================

export interface EdgeFunctionEvent {
  eventType: EventType;
  organizationId: string;
  timestamp: string;
  data: EventData;
  metadata?: EventMetadata;
}

export interface EventData {
  // Product data
  sku?: string;
  name?: string;
  category?: ProductCategory;
  price?: number;
  color?: string;
  size?: string;
  collection?: string;
  
  // Movement data
  product_sku?: string;
  store_id?: string;
  quantity?: number;
  unit_price?: number;
  movement_type?: MovementType;
  reference_document?: string;
  
  // Sale data
  sale?: SaleData;
  
  // Purchase data
  purchase?: PurchaseData;
  
  // Transfer data
  transfer?: TransferData;
  
  // Banban specific data
  banban_specific?: BanbanSpecificData;
}

export interface EventMetadata {
  source: string;
  version: string;
  correlation_id?: string;
  retry_count?: number;
  processing_attempts?: number;
}

export interface SaleData {
  sale_id: string;
  total_amount: number;
  items: SaleItem[];
  customer_id?: string;
  payment_method?: string;
  discount_amount?: number;
}

export interface SaleItem {
  sku: string;
  quantity: number;
  unit_price: number;
  discount?: number;
}

export interface PurchaseData {
  purchase_id: string;
  supplier_id: string;
  total_amount: number;
  items: PurchaseItem[];
  expected_delivery?: string;
}

export interface PurchaseItem {
  sku: string;
  quantity: number;
  unit_cost: number;
}

export interface TransferData {
  transfer_id: string;
  from_store_id: string;
  to_store_id: string;
  items: TransferItem[];
  status: string;
}

export interface TransferItem {
  sku: string;
  quantity: number;
}

export interface BanbanSpecificData {
  doc_status: string;
  supplier_code?: string;
  season?: string;
  collection_year?: number;
  style_code?: string;
  color_code?: string;
  size_grid?: string;
}

// ================================================
// INTERFACES DE PROCESSAMENTO
// ================================================

export interface ProcessingResult {
  success: boolean;
  eventId: string;
  processingTimeMs: number;
  triggeredActions: string[];
  errors?: ProcessingError[];
  metadata?: Record<string, any>;
}

export interface ProcessingError {
  code: string;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

export interface EventValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// ================================================
// INTERFACES DE CONFIGURAÇÃO
// ================================================

export interface DataProcessingConfig {
  processingTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  validateEventAge: boolean;
  maxEventAge: number;
  logLevel: string;
  detailedLogging: boolean;
  enableMetrics: boolean;
  metricsRetention: number;
}

export interface WebhookListenerConfig {
  enableInventoryListener: boolean;
  enableSalesListener: boolean;
  enablePurchaseListener: boolean;
  enableTransferListener: boolean;
  batchProcessing: boolean;
  batchSize: number;
  batchTimeout: number;
}

// ================================================
// INTERFACES DE MÉTRICAS
// ================================================

export interface ProcessingMetrics {
  totalEventsProcessed: number;
  successfulEvents: number;
  failedEvents: number;
  averageProcessingTime: number;
  eventsByType: Record<EventType, number>;
  errorsByType: Record<string, number>;
  lastProcessedAt: string;
}

export interface HealthCheckResult {
  healthy: boolean;
  details: HealthDetails;
}

export interface HealthDetails {
  module: string;
  status: string;
  metricsCount?: number;
  lastActivity?: string;
  error?: string;
  uptime?: number;
  memoryUsage?: number;
}

// ================================================
// SCHEMAS DE VALIDAÇÃO ZOD
// ================================================

export const productEventSchema = z.object({
  event_type: z.nativeEnum(EventType),
  organization_id: z.string().uuid(),
  timestamp: z.string().datetime(),
  data: z.object({
    sku: z.string().min(3).max(50),
    name: z.string().min(1).max(200),
    category: z.nativeEnum(ProductCategory),
    price: z.number().positive().multipleOf(0.01),
    color: z.string().min(1).max(50),
    size: z.string().min(1).max(20),
    collection: z.string().optional(),
    banban_specific: z.object({
      doc_status: z.string(),
      supplier_code: z.string().optional(),
      season: z.string().optional(),
      collection_year: z.number().int().min(2020).max(2030).optional(),
      style_code: z.string().optional(),
      color_code: z.string().optional(),
      size_grid: z.string().optional()
    }).optional()
  })
});

export const movementEventSchema = z.object({
  event_type: z.nativeEnum(EventType),
  organization_id: z.string().uuid(),
  timestamp: z.string().datetime(),
  data: z.object({
    product_sku: z.string(),
    store_id: z.string().uuid(),
    quantity: z.number().int(),
    unit_price: z.number().positive().optional(),
    movement_type: z.nativeEnum(MovementType),
    reference_document: z.string().optional()
  })
});

export const saleEventSchema = z.object({
  event_type: z.nativeEnum(EventType),
  organization_id: z.string().uuid(),
  timestamp: z.string().datetime(),
  data: z.object({
    sale: z.object({
      sale_id: z.string(),
      total_amount: z.number().positive(),
      items: z.array(z.object({
        sku: z.string(),
        quantity: z.number().int().positive(),
        unit_price: z.number().positive(),
        discount: z.number().optional()
      })),
      customer_id: z.string().optional(),
      payment_method: z.string().optional(),
      discount_amount: z.number().optional()
    })
  })
});

export const purchaseEventSchema = z.object({
  event_type: z.nativeEnum(EventType),
  organization_id: z.string().uuid(),
  timestamp: z.string().datetime(),
  data: z.object({
    purchase: z.object({
      purchase_id: z.string(),
      supplier_id: z.string(),
      total_amount: z.number().positive(),
      items: z.array(z.object({
        sku: z.string(),
        quantity: z.number().int().positive(),
        unit_cost: z.number().positive()
      })),
      expected_delivery: z.string().optional()
    })
  })
});

export const transferEventSchema = z.object({
  event_type: z.nativeEnum(EventType),
  organization_id: z.string().uuid(),
  timestamp: z.string().datetime(),
  data: z.object({
    transfer: z.object({
      transfer_id: z.string(),
      from_store_id: z.string().uuid(),
      to_store_id: z.string().uuid(),
      items: z.array(z.object({
        sku: z.string(),
        quantity: z.number().int().positive()
      })),
      status: z.string()
    })
  })
});

// ================================================
// TIPOS UTILITÁRIOS
// ================================================

export type EventProcessor = (event: EdgeFunctionEvent) => Promise<ProcessingResult>;
export type EventValidator = (event: EdgeFunctionEvent) => Promise<EventValidationResult>;
export type MetricsCollector = (eventType: EventType, status: string, processingTime?: number) => void;

// ================================================
// CONSTANTES DE CONFIGURAÇÃO
// ================================================

export const DEFAULT_CONFIG: DataProcessingConfig = {
  processingTimeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  validateEventAge: true,
  maxEventAge: 300000,
  logLevel: 'info',
  detailedLogging: true,
  enableMetrics: true,
  metricsRetention: 7200000
};

export const EVENT_TO_EDGE_FUNCTION: Record<EventType, EdgeFunctionType> = {
  [EventType.PRODUCT_CREATED]: EdgeFunctionType.INVENTORY,
  [EventType.PRODUCT_UPDATED]: EdgeFunctionType.INVENTORY,
  [EventType.PRODUCT_DELETED]: EdgeFunctionType.INVENTORY,
  [EventType.INVENTORY_ADJUSTMENT]: EdgeFunctionType.INVENTORY,
  [EventType.INVENTORY_COUNT]: EdgeFunctionType.INVENTORY,
  [EventType.INVENTORY_TRANSFER]: EdgeFunctionType.INVENTORY,
  [EventType.SALE_COMPLETED]: EdgeFunctionType.SALES,
  [EventType.SALE_CANCELLED]: EdgeFunctionType.SALES,
  [EventType.RETURN_PROCESSED]: EdgeFunctionType.SALES,
  [EventType.PURCHASE_COMPLETED]: EdgeFunctionType.PURCHASE,
  [EventType.PURCHASE_CANCELLED]: EdgeFunctionType.PURCHASE,
  [EventType.PURCHASE_RETURNED]: EdgeFunctionType.PURCHASE,
  [EventType.TRANSFER_INITIATED]: EdgeFunctionType.TRANSFER,
  [EventType.TRANSFER_COMPLETED]: EdgeFunctionType.TRANSFER,
  [EventType.TRANSFER_CANCELLED]: EdgeFunctionType.TRANSFER
};

export const PROCESSING_PRIORITIES: Record<EventType, number> = {
  [EventType.SALE_COMPLETED]: 10,
  [EventType.INVENTORY_ADJUSTMENT]: 9,
  [EventType.TRANSFER_COMPLETED]: 8,
  [EventType.PURCHASE_COMPLETED]: 7,
  [EventType.PRODUCT_CREATED]: 6,
  [EventType.PRODUCT_UPDATED]: 5,
  [EventType.RETURN_PROCESSED]: 4,
  [EventType.TRANSFER_INITIATED]: 3,
  [EventType.SALE_CANCELLED]: 2,
  [EventType.PURCHASE_CANCELLED]: 2,
  [EventType.TRANSFER_CANCELLED]: 1,
  [EventType.PRODUCT_DELETED]: 1,
  [EventType.PURCHASE_RETURNED]: 1,
  [EventType.INVENTORY_COUNT]: 1,
  [EventType.INVENTORY_TRANSFER]: 1
};