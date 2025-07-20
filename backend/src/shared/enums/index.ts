/**
 * Índice centralizado para todos os enums ECA
 */

// Tipos e Estados
export * from './eca-types';

// Actions e Eventos
export * from './eca-actions';

// Re-exportação dos principais tipos para conveniência
export type {
  EntityType,
  TransactionType,
  RelationshipType,
  BusinessState,
  PurchaseState,
  TransferOutState,
  TransferInState,
  SalesState,
  ReturnState,
  InventoryState
} from './eca-types';

export type {
  BusinessAction,
  PurchaseAction,
  TransferAction,
  SalesAction,
  ReturnAction,
  InventoryAction
} from './eca-actions';

export { getOrganizationId as getTenantId } from './eca-types';