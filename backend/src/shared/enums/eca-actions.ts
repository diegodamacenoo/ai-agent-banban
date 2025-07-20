/**
 * Actions/Eventos para os fluxos ECA
 * Define as ações que podem ser executadas em cada fluxo
 */

/**
 * Actions do Purchase Flow
 * Mapeiam para as transições de estado do ECA.md
 */
export const PURCHASE_ACTIONS = {
  CREATE_ORDER: 'create_order',                    // Criar pedido → PENDENTE
  APPROVE_ORDER: 'approve_order',                  // Aprovar pedido → APPROVED
  REGISTER_INVOICE: 'register_invoice',            // Registrar NF → PRE_BAIXA
  ARRIVE_AT_CD: 'arrive_at_cd',                   // Chegada no CD → AGUARDANDO_CONFERENCIA_CD
  START_CONFERENCE: 'start_conference',            // Iniciar conferência → EM_CONFERENCIA_CD
  SCAN_ITEMS: 'scan_items',                       // Escanear itens → CONFERENCIA_CD_SEM_DIVERGENCIA / CONFERENCIA_CD_COM_DIVERGENCIA
  EFFECTUATE_CD: 'effectuate_cd'                  // Efetivar no CD → EFETIVADO_CD
} as const;

export type PurchaseAction = keyof typeof PURCHASE_ACTIONS;

/**
 * Actions do Transfer Flow
 * Cobrem tanto TRANSFER_OUT quanto TRANSFER_IN
 */
export const TRANSFER_ACTIONS = {
  // Transfer Out (CD → Loja)
  CREATE_TRANSFER_REQUEST: 'create_transfer_request',      // Criar pedido → PEDIDO_TRANSFERENCIA_CRIADO
  REGISTER_REQUEST: 'register_request', // Added
  CREATE_SEPARATION_MAP: 'create_separation_map',         // Criar mapa → MAPA_SEPARACAO_CRIADO
  START_SEPARATION: 'start_separation',                   // Iniciar separação → AGUARDANDO_SEPARACAO_CD / EM_SEPARACAO_CD
  COMPLETE_SEPARATION: 'complete_separation',             // Separação genérica → SEPARACAO_CD_SEM_DIVERGENCIA (derivado dinamicamente)
  COMPLETE_SEPARATION_OK: 'complete_separation_ok',       // Separação sem divergência → SEPARACAO_CD_SEM_DIVERGENCIA
  COMPLETE_SEPARATION_DIFF: 'complete_separation_diff',   // Separação com divergência → SEPARACAO_CD_COM_DIVERGENCIA
  MOVE_TO_DOCK: 'move_to_dock',                          // Mover para doca → SEPARADO_PRE_DOCA
  SHIP_TRANSFER: 'ship_transfer',                        // Embarcar → EMBARCADO_CD
  INVOICE_TRANSFER: 'invoice_transfer',                   // Faturar transferência → TRANSFERENCIA_CDH_FATURADA

  // Transfer In (Loja recebe)
  START_STORE_CONFERENCE: 'start_store_conference',       // Iniciar conferência na loja → EM_CONFERENCIA_LOJA
  SCAN_STORE_ITEMS: 'scan_store_items',                   // Escanear itens na loja → CONFERENCIA_LOJA_SEM_DIVERGENCIA / CONFERENCIA_LOJA_COM_DIVERGENCIA
  COMPLETE_STORE_CONFERENCE: 'complete_store_conference', // Added generic
  COMPLETE_STORE_CONFERENCE_OK: 'complete_store_conference_ok', // Conferência loja sem divergência → CONFERENCIA_LOJA_SEM_DIVERGENCIA
  COMPLETE_STORE_CONFERENCE_DIFF: 'complete_store_conference_diff', // Conferência loja com divergência → CONFERENCIA_LOJA_COM_DIVERGENCIA
  EFFECTUATE_STORE: 'effectuate_store',                   // Efetivar na loja → EFETIVADO_LOJA
  REGISTER_RECEIPT: 'register_receipt', // Added
  REGISTER_COMPLETION: 'register_completion' // Added
} as const;

export type TransferAction = keyof typeof TRANSFER_ACTIONS;

/**
 * Actions do Sales Flow
 */
export const SALES_ACTIONS = {
  REGISTER_SALE: 'register_sale',                         // Registrar venda → VENDA_CONCLUIDA
  REGISTER_PAYMENT: 'register_payment',                   // Registrar pagamento (pode ser parte da venda)
  REGISTER_FISCAL_DATA: 'register_fiscal_data',           // Registrar dados fiscais (pode ser parte da venda)
  CANCEL_SALE: 'cancel_sale'                             // Cancelar venda
} as const;

export type SalesAction = keyof typeof SALES_ACTIONS;

/**
 * Actions do Return Flow
 */
export const RETURN_ACTIONS = {
  REQUEST_RETURN: 'request_return',                       // Solicitar devolução → DEVOLUCAO_AGUARDANDO
  COMPLETE_RETURN: 'complete_return',                     // Completar devolução → DEVOLUCAO_CONCLUIDA
  TRANSFER_BETWEEN_STORES: 'transfer_between_stores'      // Transferir entre lojas → TRANSFERENCIA_ENTRE_LOJAS
} as const;

export type ReturnAction = keyof typeof RETURN_ACTIONS;

/**
 * Actions do Inventory Flow
 */
export const INVENTORY_ACTIONS = {
  ADJUST_STOCK: 'adjust_stock',                          // Ajuste de estoque
  COUNT_INVENTORY: 'count_inventory',                    // Contagem de inventário
  DAMAGE_PRODUCT: 'damage_product',                      // Produto danificado
  EXPIRE_PRODUCT: 'expire_product',                      // Produto vencido
  RESERVE_STOCK: 'reserve_stock',                        // Reservar estoque
  UNRESERVE_STOCK: 'unreserve_stock',                    // Liberar reserva
  QUARANTINE_PRODUCT: 'quarantine_product',             // Colocar em quarentena
  RELEASE_QUARANTINE: 'release_quarantine'              // Liberar quarentena
} as const;

export type InventoryAction = keyof typeof INVENTORY_ACTIONS;

/**
 * União de todas as actions
 */
export type BusinessAction = 
  | PurchaseAction 
  | TransferAction 
  | SalesAction 
  | ReturnAction 
  | InventoryAction;

/**
 * Mapeamento de Action para Transaction Type
 * Define qual tipo de transação cada action cria/modifica
 */
export const ACTION_TO_TRANSACTION_TYPE = {
  // Purchase Actions
  [PURCHASE_ACTIONS.CREATE_ORDER]: 'ORDER_PURCHASE',
  [PURCHASE_ACTIONS.APPROVE_ORDER]: 'ORDER_PURCHASE',
  [PURCHASE_ACTIONS.REGISTER_INVOICE]: 'DOCUMENT_SUPPLIER_IN',
  [PURCHASE_ACTIONS.ARRIVE_AT_CD]: 'DOCUMENT_SUPPLIER_IN',
  [PURCHASE_ACTIONS.START_CONFERENCE]: 'DOCUMENT_SUPPLIER_IN',
  [PURCHASE_ACTIONS.SCAN_ITEMS]: 'DOCUMENT_SUPPLIER_IN',
  [PURCHASE_ACTIONS.EFFECTUATE_CD]: 'DOCUMENT_SUPPLIER_IN',
  
  // Transfer Actions - Out
  [TRANSFER_ACTIONS.CREATE_TRANSFER_REQUEST]: 'TRANSFER_OUT',
  [TRANSFER_ACTIONS.CREATE_SEPARATION_MAP]: 'TRANSFER_OUT',
  [TRANSFER_ACTIONS.START_SEPARATION]: 'TRANSFER_OUT',
  [TRANSFER_ACTIONS.COMPLETE_SEPARATION]: 'TRANSFER_OUT',
  [TRANSFER_ACTIONS.COMPLETE_SEPARATION_OK]: 'TRANSFER_OUT',
  [TRANSFER_ACTIONS.COMPLETE_SEPARATION_DIFF]: 'TRANSFER_OUT',
  [TRANSFER_ACTIONS.MOVE_TO_DOCK]: 'TRANSFER_OUT',
  [TRANSFER_ACTIONS.SHIP_TRANSFER]: 'TRANSFER_OUT',
  [TRANSFER_ACTIONS.INVOICE_TRANSFER]: 'TRANSFER_OUT',
  
  // Transfer Actions - In
  [TRANSFER_ACTIONS.START_STORE_CONFERENCE]: 'TRANSFER_IN',
  [TRANSFER_ACTIONS.SCAN_STORE_ITEMS]: 'TRANSFER_IN',
  [TRANSFER_ACTIONS.COMPLETE_STORE_CONFERENCE_OK]: 'TRANSFER_IN',
  [TRANSFER_ACTIONS.COMPLETE_STORE_CONFERENCE_DIFF]: 'TRANSFER_IN',
  [TRANSFER_ACTIONS.EFFECTUATE_STORE]: 'TRANSFER_IN',
  
  // Sales Actions
  [SALES_ACTIONS.REGISTER_SALE]: 'DOCUMENT_SALE',
  [SALES_ACTIONS.REGISTER_PAYMENT]: 'DOCUMENT_SALE',
  [SALES_ACTIONS.REGISTER_FISCAL_DATA]: 'DOCUMENT_SALE',
  [SALES_ACTIONS.CANCEL_SALE]: 'DOCUMENT_SALE',
  
  // Return Actions
  [RETURN_ACTIONS.REQUEST_RETURN]: 'DOCUMENT_RETURN',
  [RETURN_ACTIONS.COMPLETE_RETURN]: 'DOCUMENT_RETURN',
  [RETURN_ACTIONS.TRANSFER_BETWEEN_STORES]: 'DOCUMENT_RETURN',
  
  // Inventory Actions
  [INVENTORY_ACTIONS.ADJUST_STOCK]: 'INVENTORY_MOVEMENT',
  [INVENTORY_ACTIONS.COUNT_INVENTORY]: 'INVENTORY_MOVEMENT',
  [INVENTORY_ACTIONS.DAMAGE_PRODUCT]: 'INVENTORY_MOVEMENT',
  [INVENTORY_ACTIONS.EXPIRE_PRODUCT]: 'INVENTORY_MOVEMENT',
  [INVENTORY_ACTIONS.RESERVE_STOCK]: 'INVENTORY_MOVEMENT',
  [INVENTORY_ACTIONS.UNRESERVE_STOCK]: 'INVENTORY_MOVEMENT',
  [INVENTORY_ACTIONS.QUARANTINE_PRODUCT]: 'INVENTORY_MOVEMENT',
  [INVENTORY_ACTIONS.RELEASE_QUARANTINE]: 'INVENTORY_MOVEMENT'
} as const;

/**
 * Mapeamento de Action para Estado Resultante
 * Define qual estado cada action deve produzir
 */
export const ACTION_TO_TARGET_STATE = {
  // Purchase Actions
  [PURCHASE_ACTIONS.CREATE_ORDER]: 'PENDENTE',
  [PURCHASE_ACTIONS.APPROVE_ORDER]: 'APPROVED',
  [PURCHASE_ACTIONS.REGISTER_INVOICE]: 'PRE_BAIXA',
  [PURCHASE_ACTIONS.ARRIVE_AT_CD]: 'AGUARDANDO_CONFERENCIA_CD',
  [PURCHASE_ACTIONS.START_CONFERENCE]: 'EM_CONFERENCIA_CD',
  [PURCHASE_ACTIONS.SCAN_ITEMS]: 'CONFERENCIA_CD_SEM_DIVERGENCIA', // ou COM_DIVERGENCIA, derivado dinamicamente
  [PURCHASE_ACTIONS.EFFECTUATE_CD]: 'EFETIVADO_CD',
  
  // Transfer Actions - Out
  [TRANSFER_ACTIONS.CREATE_TRANSFER_REQUEST]: 'PEDIDO_TRANSFERENCIA_CRIADO',
  [TRANSFER_ACTIONS.CREATE_SEPARATION_MAP]: 'MAPA_SEPARACAO_CRIADO',
  [TRANSFER_ACTIONS.START_SEPARATION]: 'EM_SEPARACAO_CD',
  [TRANSFER_ACTIONS.COMPLETE_SEPARATION]: 'SEPARACAO_CD_SEM_DIVERGENCIA',
  [TRANSFER_ACTIONS.COMPLETE_SEPARATION_OK]: 'SEPARACAO_CD_SEM_DIVERGENCIA',
  [TRANSFER_ACTIONS.COMPLETE_SEPARATION_DIFF]: 'SEPARACAO_CD_COM_DIVERGENCIA',
  [TRANSFER_ACTIONS.MOVE_TO_DOCK]: 'SEPARADO_PRE_DOCA',
  [TRANSFER_ACTIONS.SHIP_TRANSFER]: 'EMBARCADO_CD',
  [TRANSFER_ACTIONS.INVOICE_TRANSFER]: 'TRANSFERENCIA_CDH_FATURADA',
  
  // Transfer Actions - In
  [TRANSFER_ACTIONS.START_STORE_CONFERENCE]: 'EM_CONFERENCIA_LOJA',
  [TRANSFER_ACTIONS.SCAN_STORE_ITEMS]: 'CONFERENCIA_LOJA_SEM_DIVERGENCIA', // ou COM_DIVERGENCIA, derivado dinamicamente
  [TRANSFER_ACTIONS.COMPLETE_STORE_CONFERENCE_OK]: 'CONFERENCIA_LOJA_SEM_DIVERGENCIA',
  [TRANSFER_ACTIONS.COMPLETE_STORE_CONFERENCE_DIFF]: 'CONFERENCIA_LOJA_COM_DIVERGENCIA',
  [TRANSFER_ACTIONS.EFFECTUATE_STORE]: 'EFETIVADO_LOJA',
  
  // Sales Actions
  [SALES_ACTIONS.REGISTER_SALE]: 'VENDA_CONCLUIDA',
  [SALES_ACTIONS.REGISTER_PAYMENT]: 'VENDA_CONCLUIDA',
  [SALES_ACTIONS.REGISTER_FISCAL_DATA]: 'VENDA_CONCLUIDA',
  [SALES_ACTIONS.CANCEL_SALE]: 'VENDA_CANCELADA',
  
  // Return Actions
  [RETURN_ACTIONS.REQUEST_RETURN]: 'DEVOLUCAO_AGUARDANDO',
  [RETURN_ACTIONS.COMPLETE_RETURN]: 'DEVOLUCAO_CONCLUIDA',
  [RETURN_ACTIONS.TRANSFER_BETWEEN_STORES]: 'TRANSFERENCIA_ENTRE_LOJAS',
  
  // Inventory Actions
  [INVENTORY_ACTIONS.ADJUST_STOCK]: 'MOVIMENTO_EXECUTADO',
  [INVENTORY_ACTIONS.COUNT_INVENTORY]: 'MOVIMENTO_EXECUTADO',
  [INVENTORY_ACTIONS.DAMAGE_PRODUCT]: 'MOVIMENTO_EXECUTADO',
  [INVENTORY_ACTIONS.EXPIRE_PRODUCT]: 'MOVIMENTO_EXECUTADO',
  [INVENTORY_ACTIONS.RESERVE_STOCK]: 'MOVIMENTO_EXECUTADO',
  [INVENTORY_ACTIONS.UNRESERVE_STOCK]: 'MOVIMENTO_EXECUTADO',
  [INVENTORY_ACTIONS.QUARANTINE_PRODUCT]: 'MOVIMENTO_EXECUTADO',
  [INVENTORY_ACTIONS.RELEASE_QUARANTINE]: 'MOVIMENTO_EXECUTADO'
} as const;