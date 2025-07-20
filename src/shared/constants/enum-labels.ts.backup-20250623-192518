// Constantes de mapeamento para manter labels em portuguÃªs
// Arquivo criado para padronizaÃ§Ã£o de ENUMs (mantenha atualizado)

// Tipos dos ENUMs apÃ³s migraÃ§Ã£o da Fase 1
// âœ… MIGRADO: location_type, order_type, order_status, entity_type
type LocationType = 'CD' | 'STORE';
type OrderType = 'PURCHASE' | 'TRANSFER';  
type OrderStatus = 'NEW' | 'APPROVED' | 'CANCELLED';
type DocumentType = 'SUPPLIER_IN' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'RETURN' | 'SALE';
type DocumentStatus = 
  | 'PENDING' | 'AWAITING_CD_VERIFICATION' | 'IN_CD_VERIFICATION'
  | 'CD_VERIFIED_NO_DISCREPANCY' | 'CD_VERIFIED_WITH_DISCREPANCY' | 'EFFECTIVE_CD'
  | 'TRANSFER_ORDER_CREATED' | 'SEPARATION_MAP_CREATED' | 'AWAITING_CD_SEPARATION'
  | 'IN_CD_SEPARATION' | 'CD_SEPARATED_NO_DISCREPANCY' | 'CD_SEPARATED_WITH_DISCREPANCY'
  | 'SEPARATED_PRE_DOCK' | 'SHIPPED_CD' | 'CDH_TRANSFER_INVOICED'
  | 'AWAITING_STORE_VERIFICATION' | 'IN_STORE_VERIFICATION'
  | 'STORE_VERIFIED_NO_DISCREPANCY' | 'STORE_VERIFIED_WITH_DISCREPANCY'
  | 'EFFECTIVE_STORE' | 'SALE_COMPLETED' | 'RETURN_AWAITING' | 'RETURN_COMPLETED'
  | 'STORE_TO_STORE_TRANSFER' | 'CANCELLED';

type MovementType = 'CD_RECEIPT' | 'CD_TRANSFER' | 'STORE_RECEIPT' | 'SALE' | 'RETURN' | 'INVENTORY_ADJUSTMENT';
type EntityType = 'ORDER' | 'DOCUMENT' | 'MOVEMENT' | 'VARIANT';
type EventCode = 
  | 'purchase_order_created' | 'purchase_order_approved' | 'supplier_invoice_precleared'
  | 'receipt_in_conference_cd' | 'receipt_item_scanned_ok' | 'receipt_item_scanned_diff'
  | 'transfer_order_created' | 'separation_map_created' | 'separation_in_progress'
  | 'separation_invoiced' | 'store_receipt_start' | 'store_receipt_effective'
  | 'sale_completed' | 'return_same_store' | 'return_other_store' | 'manual_exchange_created'
  | 'sale' | 'return' | 'transfer' | 'adjustment' | 'receipt_ok_cd'
  | 'return_waiting' | 'return_completed' | 'catalog_sync' | 'stock_adjustment' | 'pricing_update';

type UnitMeasure = 'PAR' | 'UND' | 'CX';
type Gender = 'MAS' | 'FEM' | 'USX';
// Tipos adicionados na Fase 3 âœ… MIGRADO
type DataExportFormat = 'JSON' | 'CSV' | 'PDF';
type DeletionStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
type ExportStatus = 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
type MfaMethod = 'EMAIL' | 'WHATSAPP';
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';

// ============================================================================
// MAPEAMENTOS DE LABELS
// ============================================================================

export const LOCATION_TYPE_LABELS: Partial<Record<LocationType, string>> = {
  CD: 'Centro de DistribuiÃ§Ã£o',
  STORE: 'Loja', // âœ… Migrado
  // LOJA: 'Loja', // âŒ Removido apÃ³s migraÃ§Ã£o
} as const;

export const ORDER_TYPE_LABELS: Partial<Record<OrderType, string>> = {
  PURCHASE: 'Compra', // âœ… Migrado
  TRANSFER: 'TransferÃªncia',
  // COMPRA: 'Compra', // âŒ Removido apÃ³s migraÃ§Ã£o
} as const;

export const ORDER_STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  NEW: 'Novo', // âœ… Migrado
  APPROVED: 'Aprovado', // âœ… Migrado  
  CANCELLED: 'Cancelado', // âœ… Migrado
  // NOVO: 'Novo', // âŒ Removido apÃ³s migraÃ§Ã£o
  // APROVADO: 'Aprovado', // âŒ Removido apÃ³s migraÃ§Ã£o
  // CANCELADO: 'Cancelado', // âŒ Removido apÃ³s migraÃ§Ã£o
} as const;

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  SUPPLIER_IN: 'Entrada de Fornecedor',
  TRANSFER_OUT: 'SaÃ­da para TransferÃªncia',
  TRANSFER_IN: 'Entrada por TransferÃªncia',
  RETURN: 'DevoluÃ§Ã£o',
  SALE: 'Venda',
} as const;

export const DOCUMENT_STATUS_LABELS: Partial<Record<DocumentStatus, string>> = {
  // âœ… Valores migrados (inglÃªs) - Fase 2 completa
  PENDING: 'Pendente',
  AWAITING_CD_VERIFICATION: 'Aguardando ConferÃªncia CD',
  IN_CD_VERIFICATION: 'Em ConferÃªncia CD',
  CD_VERIFIED_NO_DISCREPANCY: 'CD Conferido sem DivergÃªncia',
  CD_VERIFIED_WITH_DISCREPANCY: 'CD Conferido com DivergÃªncia',
  EFFECTIVE_CD: 'Efetivado CD',
  TRANSFER_ORDER_CREATED: 'Pedido de TransferÃªncia Criado',
  SEPARATION_MAP_CREATED: 'Mapa de SeparaÃ§Ã£o Criado',
  AWAITING_CD_SEPARATION: 'Aguardando SeparaÃ§Ã£o CD',
  IN_CD_SEPARATION: 'Em SeparaÃ§Ã£o CD',
  CD_SEPARATED_NO_DISCREPANCY: 'CD Separado sem DivergÃªncia',
  CD_SEPARATED_WITH_DISCREPANCY: 'CD Separado com DivergÃªncia',
  SEPARATED_PRE_DOCK: 'Separado PrÃ©-doca',
  SHIPPED_CD: 'Embarcado CD',
  CDH_TRANSFER_INVOICED: 'TransferÃªncia CDH Faturada',
  AWAITING_STORE_VERIFICATION: 'Aguardando ConferÃªncia Loja',
  IN_STORE_VERIFICATION: 'Em ConferÃªncia Loja',
  STORE_VERIFIED_NO_DISCREPANCY: 'Loja Conferida sem DivergÃªncia',
  STORE_VERIFIED_WITH_DISCREPANCY: 'Loja Conferida com DivergÃªncia',
  EFFECTIVE_STORE: 'Efetivado Loja',
  SALE_COMPLETED: 'Venda ConcluÃ­da',
  RETURN_AWAITING: 'DevoluÃ§Ã£o Aguardando',
  RETURN_COMPLETED: 'DevoluÃ§Ã£o ConcluÃ­da',
  STORE_TO_STORE_TRANSFER: 'TransferÃªncia entre Lojas',
  CANCELLED: 'Cancelada',
  
  // âŒ Valores antigos removidos apÃ³s migraÃ§Ã£o
  // PENDENTE, PRE_BAIXA, AGUARDANDO_CONFERENCIA_CD, etc.
} as const;

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  CD_RECEIPT: 'Recebimento CD',
  CD_TRANSFER: 'TransferÃªncia CD',
  STORE_RECEIPT: 'Recebimento Loja',
  SALE: 'Venda',
  RETURN: 'DevoluÃ§Ã£o',
  INVENTORY_ADJUSTMENT: 'Ajuste de Estoque',
} as const;

export const ENTITY_TYPE_LABELS: Partial<Record<EntityType, string>> = {
  ORDER: 'Pedido',
  DOCUMENT: 'Documento',
  MOVEMENT: 'MovimentaÃ§Ã£o',
  VARIANT: 'VariaÃ§Ã£o', // âœ… Migrado
  // variant: 'VariaÃ§Ã£o', // âŒ Removido apÃ³s migraÃ§Ã£o
} as const;

export const EVENT_CODE_LABELS: Record<EventCode, string> = {
  purchase_order_created: 'Pedido de Compra Criado',
  purchase_order_approved: 'Pedido de Compra Aprovado',
  supplier_invoice_precleared: 'NF Fornecedor PrÃ©-aprovada',
  receipt_in_conference_cd: 'Recebimento em ConferÃªncia CD',
  receipt_item_scanned_ok: 'Item Escaneado OK',
  receipt_item_scanned_diff: 'Item Escaneado com DivergÃªncia',
  transfer_order_created: 'Pedido de TransferÃªncia Criado',
  separation_map_created: 'Mapa de SeparaÃ§Ã£o Criado',
  separation_in_progress: 'SeparaÃ§Ã£o em Andamento',
  separation_invoiced: 'SeparaÃ§Ã£o Faturada',
  store_receipt_start: 'InÃ­cio Recebimento Loja',
  store_receipt_effective: 'Recebimento Loja Efetivado',
  sale_completed: 'Venda ConcluÃ­da',
  return_same_store: 'DevoluÃ§Ã£o Mesma Loja',
  return_other_store: 'DevoluÃ§Ã£o Outra Loja',
  manual_exchange_created: 'Troca Manual Criada',
  sale: 'Venda',
  return: 'DevoluÃ§Ã£o',
  transfer: 'TransferÃªncia',
  adjustment: 'Ajuste',
  receipt_ok_cd: 'Recebimento OK CD',
  return_waiting: 'DevoluÃ§Ã£o Aguardando',
  return_completed: 'DevoluÃ§Ã£o ConcluÃ­da',
  catalog_sync: 'SincronizaÃ§Ã£o CatÃ¡logo',
  stock_adjustment: 'Ajuste de Estoque',
  pricing_update: 'AtualizaÃ§Ã£o de PreÃ§os',
} as const;

export const UNIT_MEASURE_LABELS: Record<UnitMeasure, string> = {
  PAR: 'Par',
  UND: 'Unidade',
  CX: 'Caixa',
} as const;

export const GENDER_LABELS: Record<Gender, string> = {
  MAS: 'Masculino',
  FEM: 'Feminino',
  USX: 'Unissex',
} as const;

// ============================================================================
// LABELS ADICIONADOS NA FASE 3 âœ… MIGRADO
// ============================================================================

export const DATA_EXPORT_FORMAT_LABELS: Record<DataExportFormat, string> = {
  JSON: 'JSON',
  CSV: 'CSV',
  PDF: 'PDF',
} as const;

export const DELETION_STATUS_LABELS: Record<DeletionStatus, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'ConcluÃ­do',
} as const;

export const EXPORT_STATUS_LABELS: Record<ExportStatus, string> = {
  REQUESTED: 'Solicitado',
  PROCESSING: 'Processando',
  COMPLETED: 'ConcluÃ­do',
  FAILED: 'Falhou',
  EXPIRED: 'Expirado',
} as const;

export const MFA_METHOD_LABELS: Record<MfaMethod, string> = {
  EMAIL: 'E-mail',
  WHATSAPP: 'WhatsApp',
} as const;

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  DELETED: 'ExcluÃ­do',
} as const;

// ============================================================================
// FUNÃ‡Ã•ES HELPER
// ============================================================================

export function getLocationTypeLabel(type: LocationType): string {
  return LOCATION_TYPE_LABELS[type] || type;
}

export function getOrderTypeLabel(type: OrderType): string {
  return ORDER_TYPE_LABELS[type] || type;
}

export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status] || status;
}

export function getDocumentTypeLabel(type: DocumentType): string {
  return DOCUMENT_TYPE_LABELS[type] || type;
}

/**
 * Helper function para obter label de status de documento
 * âœ… Fase 2: Usando apenas valores em inglÃªs apÃ³s migraÃ§Ã£o
 */
export function getDocumentStatusLabel(status: DocumentStatus): string {
  return DOCUMENT_STATUS_LABELS[status] || status;
}

export function getMovementTypeLabel(type: MovementType): string {
  return MOVEMENT_TYPE_LABELS[type] || type;
}

export function getEntityTypeLabel(type: EntityType): string {
  return ENTITY_TYPE_LABELS[type] || type;
}

export function getEventCodeLabel(code: EventCode): string {
  return EVENT_CODE_LABELS[code] || code;
}

export function getUnitMeasureLabel(unit: UnitMeasure): string {
  return UNIT_MEASURE_LABELS[unit] || unit;
}

export function getGenderLabel(gender: Gender): string {
  return GENDER_LABELS[gender] || gender;
}

// ============================================================================
// FUNÃ‡Ã•ES HELPER ADICIONADAS NA FASE 3 âœ… MIGRADO
// ============================================================================

export function getDataExportFormatLabel(format: DataExportFormat): string {
  return DATA_EXPORT_FORMAT_LABELS[format] || format;
}

export function getDeletionStatusLabel(status: DeletionStatus): string {
  return DELETION_STATUS_LABELS[status] || status;
}

export function getExportStatusLabel(status: ExportStatus): string {
  return EXPORT_STATUS_LABELS[status] || status;
}

export function getMfaMethodLabel(method: MfaMethod): string {
  return MFA_METHOD_LABELS[method] || method;
}

export function getUserStatusLabel(status: UserStatus): string {
  return USER_STATUS_LABELS[status] || status;
}

// ============================================================================
// ARRAYS PARA COMPONENTES SELECT/FILTER
// ============================================================================

export const LOCATION_TYPE_OPTIONS = Object.entries(LOCATION_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as LocationType, label })
);

export const ORDER_TYPE_OPTIONS = Object.entries(ORDER_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as OrderType, label })
);

export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as OrderStatus, label })
);

export const DOCUMENT_TYPE_OPTIONS = Object.entries(DOCUMENT_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as DocumentType, label })
);

export const DOCUMENT_STATUS_OPTIONS = Object.entries(DOCUMENT_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as DocumentStatus, label })
);

export const MOVEMENT_TYPE_OPTIONS = Object.entries(MOVEMENT_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as MovementType, label })
);

export const UNIT_MEASURE_OPTIONS = Object.entries(UNIT_MEASURE_LABELS).map(
  ([value, label]) => ({ value: value as UnitMeasure, label })
);

export const GENDER_OPTIONS = Object.entries(GENDER_LABELS).map(
  ([value, label]) => ({ value: value as Gender, label })
);

// ============================================================================
// ARRAYS DE OPÃ‡Ã•ES ADICIONADAS NA FASE 3 âœ… MIGRADO
// ============================================================================

export const DATA_EXPORT_FORMAT_OPTIONS = Object.entries(DATA_EXPORT_FORMAT_LABELS).map(
  ([value, label]) => ({ value: value as DataExportFormat, label })
);

export const DELETION_STATUS_OPTIONS = Object.entries(DELETION_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as DeletionStatus, label })
);

export const EXPORT_STATUS_OPTIONS = Object.entries(EXPORT_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as ExportStatus, label })
);

export const MFA_METHOD_OPTIONS = Object.entries(MFA_METHOD_LABELS).map(
  ([value, label]) => ({ value: value as MfaMethod, label })
);

export const USER_STATUS_OPTIONS = Object.entries(USER_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as UserStatus, label })
);

// ============================================================================
// UTILITÃRIOS PARA VALIDAÃ‡ÃƒO DE STATUS
// ============================================================================

export function isOrderPending(status: OrderStatus): boolean {
  return status === 'NEW';
}

export function isOrderApproved(status: OrderStatus): boolean {
  return status === 'APPROVED';
}

export function isOrderCancelled(status: OrderStatus): boolean {
  return status === 'CANCELLED';
}

export function isDocumentPending(status: DocumentStatus): boolean {
  return status === 'PENDING';
}

export function isDocumentInProcess(status: DocumentStatus): boolean {
  return [
    'AWAITING_CD_VERIFICATION',
    'IN_CD_VERIFICATION',
    'AWAITING_CD_SEPARATION',
    'IN_CD_SEPARATION',
    'AWAITING_STORE_VERIFICATION',
    'IN_STORE_VERIFICATION'
  ].includes(status);
}

export function isDocumentCompleted(status: DocumentStatus): boolean {
  return [
    'EFFECTIVE_CD',
    'EFFECTIVE_STORE',
    'SALE_COMPLETED',
    'RETURN_COMPLETED'
  ].includes(status);
}

export function isDocumentCancelled(status: DocumentStatus): boolean {
  return status === 'CANCELLED';
}
