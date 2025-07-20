/**
 * Mapeamento de valores de ENUMs (inglês/maiúsculo) para labels em português
 * 
 * Este arquivo centraliza a tradução dos valores de ENUM padronizados
 * (MAIÚSCULAS, inglês) para exibição na interface em português.
 * 
 * Padrão estabelecido:
 * - Banco de dados: valores em MAIÚSCULAS e inglês (ex: 'ACTIVE', 'PENDING')
 * - Interface: labels em português (ex: 'Ativo', 'Pendente')
 */

// User Status Enum Labels
export const USER_STATUS_LABELS = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  PENDING: 'Pendente',
  DELETED: 'Excluído'
} as const;

// Document Status Enum Labels (exemplo dos 25 status de documento)
export const DOC_STATUS_LABELS = {
  PENDING: 'Pendente',
  AWAITING_CD_VERIFICATION: 'Aguardando Conferência CD',
  IN_CD_VERIFICATION: 'Em Conferência CD',
  CD_VERIFIED_NO_DISCREPANCY: 'Conferência CD Sem Divergência',
  CD_VERIFIED_WITH_DISCREPANCY: 'Conferência CD Com Divergência',
  EFFECTIVE_CD: 'Efetivado CD',
  TRANSFER_ORDER_CREATED: 'Pedido Transferência Criado',
  SEPARATION_MAP_CREATED: 'Mapa Separação Criado',
  AWAITING_CD_SEPARATION: 'Aguardando Separação CD',
  IN_CD_SEPARATION: 'Em Separação CD',
  CD_SEPARATED_NO_DISCREPANCY: 'Separação CD Sem Divergência',
  CD_SEPARATED_WITH_DISCREPANCY: 'Separação CD Com Divergência',
  SEPARATED_PRE_DOCK: 'Separado Pré-Doca',
  SHIPPED_CD: 'Embarcado CD',
  CDH_TRANSFER_INVOICED: 'Transferência CDH Faturada',
  AWAITING_STORE_VERIFICATION: 'Aguardando Conferência Loja',
  IN_STORE_VERIFICATION: 'Em Conferência Loja',
  STORE_VERIFIED_NO_DISCREPANCY: 'Conferência Loja Sem Divergência',
  STORE_VERIFIED_WITH_DISCREPANCY: 'Conferência Loja Com Divergência',
  EFFECTIVE_STORE: 'Efetivado Loja',
  SALE_COMPLETED: 'Venda Concluída',
  RETURN_AWAITING: 'Devolução Aguardando',
  RETURN_COMPLETED: 'Devolução Concluída',
  STORE_TO_STORE_TRANSFER: 'Transferência Entre Lojas',
  CANCELLED: 'Cancelada'
} as const;

// Order Status Enum Labels
export const ORDER_STATUS_LABELS = {
  PURCHASE: 'Compra',
  SALE: 'Venda',
  TRANSFER: 'Transferência',
  RETURN: 'Devolução'
} as const;

// Location Type Enum Labels
export const LOCATION_TYPE_LABELS = {
  CD: 'Centro de Distribuição',
  STORE: 'Loja'
} as const;

// Entity Type Enum Labels
export const ENTITY_TYPE_LABELS = {
  PRODUCT: 'Produto',
  VARIANT: 'Variante',
  ORDER: 'Pedido',
  LOCATION: 'Local'
} as const;

// Helper functions para buscar labels
export function getUserStatusLabel(status: keyof typeof USER_STATUS_LABELS): string {
  return USER_STATUS_LABELS[status] || status;
}

export function getDocStatusLabel(status: keyof typeof DOC_STATUS_LABELS): string {
  return DOC_STATUS_LABELS[status] || status;
}

export function getOrderStatusLabel(status: keyof typeof ORDER_STATUS_LABELS): string {
  return ORDER_STATUS_LABELS[status] || status;
}

export function getLocationTypeLabel(type: keyof typeof LOCATION_TYPE_LABELS): string {
  return LOCATION_TYPE_LABELS[type] || type;
}

export function getEntityTypeLabel(type: keyof typeof ENTITY_TYPE_LABELS): string {
  return ENTITY_TYPE_LABELS[type] || type;
}

// Tipos TypeScript para os ENUMs
export type UserStatusEnum = keyof typeof USER_STATUS_LABELS;
export type DocStatusEnum = keyof typeof DOC_STATUS_LABELS;
export type OrderStatusEnum = keyof typeof ORDER_STATUS_LABELS;
export type LocationTypeEnum = keyof typeof LOCATION_TYPE_LABELS;
export type EntityTypeEnum = keyof typeof ENTITY_TYPE_LABELS; 