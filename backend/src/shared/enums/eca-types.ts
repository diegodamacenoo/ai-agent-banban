/**
 * Enums centralizados para a arquitetura ECA (Event-Condition-Action)
 * Baseado em: /planning/banban/ECA.md
 */

/**
 * Tipos de Entidade de Negócio
 * Representa as entidades fundamentais do sistema
 */
export const ENTITY_TYPES = {
  PRODUCT: 'PRODUCT',       // Produtos, SKUs, Variantes
  SUPPLIER: 'SUPPLIER',     // Fornecedores, Fabricantes
  LOCATION: 'LOCATION'      // CDs, Lojas, Endereços
} as const;

export type EntityType = keyof typeof ENTITY_TYPES;

/**
 * Tipos de Transação de Negócio
 * Representa as transações/documentos do sistema
 */
export const TRANSACTION_TYPES = {
  ORDER_PURCHASE: 'ORDER_PURCHASE',             // Pedidos de compra
  DOCUMENT_SUPPLIER_IN: 'DOCUMENT_SUPPLIER_IN', // Notas fiscais de entrada
  TRANSFER_OUT: 'TRANSFER_OUT',                 // Transferências de saída (CD→Loja)
  TRANSFER_IN: 'TRANSFER_IN',                   // Transferências de entrada (Loja recebe)
  DOCUMENT_SALE: 'DOCUMENT_SALE',               // Vendas ao cliente
  DOCUMENT_RETURN: 'DOCUMENT_RETURN',           // Devoluções
  INVENTORY_MOVEMENT: 'INVENTORY_MOVEMENT',      // Movimentações de estoque
  DOCUMENT_TRANSFER_INTERNAL: 'DOCUMENT_TRANSFER_INTERNAL' // Transferências internas entre lojas
} as const;

export type TransactionType = keyof typeof TRANSACTION_TYPES;

/**
 * Tipos de Relacionamento entre Entidades/Transações
 * Define como entidades e transações se relacionam
 */
export const RELATIONSHIP_TYPES = {
  CONTAINS_ITEM: 'CONTAINS_ITEM',               // Pedido/Documento contém produto
  BASED_ON_ORDER: 'BASED_ON_ORDER',            // Documento baseado em pedido
  AFFECTS_PRODUCT: 'AFFECTS_PRODUCT',           // Movimento afeta produto
  AT_LOCATION: 'AT_LOCATION',                   // Operação em local específico
  CAUSED_BY_DOCUMENT: 'CAUSED_BY_DOCUMENT',     // Movimento causado por documento
  FROM_SUPPLIER: 'FROM_SUPPLIER',               // Pedido/Documento de fornecedor
  TO_CUSTOMER: 'TO_CUSTOMER'                    // Venda para cliente
} as const;

export type RelationshipType = keyof typeof RELATIONSHIP_TYPES;

/**
 * Estados do Ciclo de Nota de Fornecedor (SUPPLIER_IN)
 * Fluxo: Purchase Order → Document Supplier In → Inventory Movement
 */
export const PURCHASE_STATES = {
  // Estados do Pedido de Compra
  PENDENTE: 'PENDENTE',                                     // Pedido criado, aguardando faturamento
  APPROVED: 'APPROVED',                                     // Pedido aprovado, aguardando faturamento
  
  // Estados do Documento de Entrada
  PRE_BAIXA: 'PRE_BAIXA',                                   // NF faturada, pré-baixa realizada
  AGUARDANDO_CONFERENCIA_CD: 'AGUARDANDO_CONFERENCIA_CD',   // Carga chegou no CD, aguardando conferência
  EM_CONFERENCIA_CD: 'EM_CONFERENCIA_CD',                   // Conferência em andamento
  CONFERENCIA_CD_SEM_DIVERGENCIA: 'CONFERENCIA_CD_SEM_DIVERGENCIA', // Conferência sem divergências
  CONFERENCIA_CD_COM_DIVERGENCIA: 'CONFERENCIA_CD_COM_DIVERGENCIA', // Conferência com divergências
  EFETIVADO_CD: 'EFETIVADO_CD'                              // Produto efetivado no estoque do CD
} as const;

export type PurchaseState = keyof typeof PURCHASE_STATES;

/**
 * Estados do Ciclo de Transferência CD → Loja (TRANSFER_OUT)
 * Fluxo: Transfer Request → Separation → Shipment → Transfer Document
 */
export const TRANSFER_OUT_STATES = {
  PEDIDO_TRANSFERENCIA_CRIADO: 'PEDIDO_TRANSFERENCIA_CRIADO',     // Pedido criado
  MAPA_SEPARACAO_CRIADO: 'MAPA_SEPARACAO_CRIADO',                // Mapa de separação gerado
  AGUARDANDO_SEPARACAO_CD: 'AGUARDANDO_SEPARACAO_CD',            // Aguardando separação
  EM_SEPARACAO_CD: 'EM_SEPARACAO_CD',                            // Separação em andamento
  SEPARACAO_CD_SEM_DIVERGENCIA: 'SEPARACAO_CD_SEM_DIVERGENCIA',  // Separação sem divergências
  SEPARACAO_CD_COM_DIVERGENCIA: 'SEPARACAO_CD_COM_DIVERGENCIA',  // Separação com divergências
  SEPARADO_PRE_DOCA: 'SEPARADO_PRE_DOCA',                        // Separado, aguardando na pré-doca
  EMBARCADO_CD: 'EMBARCADO_CD',                                  // Embarcado, aguardando faturamento
  TRANSFERENCIA_CDH_FATURADA: 'TRANSFERENCIA_CDH_FATURADA'       // NF de transferência faturada
} as const;

export type TransferOutState = keyof typeof TRANSFER_OUT_STATES;

/**
 * Estados do Ciclo de Recebimento na Loja (TRANSFER_IN)
 * Fluxo: Transfer Document → Store Conference → Store Inventory
 */
export const TRANSFER_IN_STATES = {
  AGUARDANDO_CONFERENCIA_LOJA: 'AGUARDANDO_CONFERENCIA_LOJA',     // Aguardando conferência na loja
  EM_CONFERENCIA_LOJA: 'EM_CONFERENCIA_LOJA',                    // Conferência em andamento na loja
  CONFERENCIA_LOJA_SEM_DIVERGENCIA: 'CONFERENCIA_LOJA_SEM_DIVERGENCIA', // Conferência sem divergências
  CONFERENCIA_LOJA_COM_DIVERGENCIA: 'CONFERENCIA_LOJA_COM_DIVERGENCIA', // Conferência com divergências
  EFETIVADO_LOJA: 'EFETIVADO_LOJA'                               // Efetivado no estoque da loja
} as const;

export type TransferInState = keyof typeof TRANSFER_IN_STATES;

/**
 * Estados do Ciclo de Venda (SALE)
 * Fluxo simplificado: Sale completed
 */
export const SALES_STATES = {
  VENDA_CONCLUIDA: 'VENDA_CONCLUIDA'                             // Venda concluída, cupom emitido
} as const;

export type SalesState = keyof typeof SALES_STATES;

/**
 * Estados do Ciclo de Devolução (RETURN)
 * Fluxo: Return Request → Return Document → Inventory Movement
 */
export const RETURN_STATES = {
  DEVOLUCAO_AGUARDANDO: 'DEVOLUCAO_AGUARDANDO',                 // Aguardando emissão da NF de devolução
  DEVOLUCAO_CONCLUIDA: 'DEVOLUCAO_CONCLUIDA',                   // NF de devolução emitida
  TRANSFERENCIA_ENTRE_LOJAS: 'TRANSFERENCIA_ENTRE_LOJAS'        // NF de transferência interna emitida
} as const;

export type ReturnState = keyof typeof RETURN_STATES;

/**
 * Estados do Inventário (INVENTORY_MOVEMENT)
 * Estados para movimentações de estoque
 */
export const INVENTORY_STATES = {
  MOVIMENTO_PENDENTE: 'MOVIMENTO_PENDENTE',                     // Movimento criado, aguardando execução
  MOVIMENTO_EXECUTADO: 'MOVIMENTO_EXECUTADO',                   // Movimento executado com sucesso
  MOVIMENTO_CANCELADO: 'MOVIMENTO_CANCELADO'                    // Movimento cancelado
} as const;

export type InventoryState = keyof typeof INVENTORY_STATES;

/**
 * Estados da Transferência Interna (RETURN)
 * Fluxo: Transferência criada para regularizar estoque
 */
export const TRANSFER_INTERNAL_STATES = {
  TRANSFERENCIA_ENTRE_LOJAS: 'TRANSFERENCIA_ENTRE_LOJAS' // Transferência criada
} as const;

export type TransferInternalState = keyof typeof TRANSFER_INTERNAL_STATES;

/**
 * União de todos os estados possíveis
 */
export type BusinessState = 
  | PurchaseState 
  | TransferOutState 
  | TransferInState 
  | SalesState 
  | ReturnState 
  | InventoryState
  | TransferInternalState;

/**
 * Mapeamento de Transaction Type para Estados Válidos
 * Define quais estados são válidos para cada tipo de transação
 */
export const TRANSACTION_STATE_MAPPING = {
  [TRANSACTION_TYPES.ORDER_PURCHASE]: PURCHASE_STATES,
  [TRANSACTION_TYPES.DOCUMENT_SUPPLIER_IN]: PURCHASE_STATES,
  [TRANSACTION_TYPES.TRANSFER_OUT]: TRANSFER_OUT_STATES,
  [TRANSACTION_TYPES.TRANSFER_IN]: TRANSFER_IN_STATES,
  [TRANSACTION_TYPES.DOCUMENT_SALE]: SALES_STATES,
  [TRANSACTION_TYPES.DOCUMENT_RETURN]: RETURN_STATES,
  [TRANSACTION_TYPES.INVENTORY_MOVEMENT]: INVENTORY_STATES,
  [TRANSACTION_TYPES.DOCUMENT_TRANSFER_INTERNAL]: TRANSFER_INTERNAL_STATES
} as const;

/**
 * Função utilitária para validar se um estado é válido para um tipo de transação
 */
export function isValidStateForTransactionType(
  transactionType: TransactionType, 
  state: string
): boolean {
  const validStates = TRANSACTION_STATE_MAPPING[transactionType];
  return Object.values(validStates).includes(state as any);
}

/**
 * Função utilitária para obter estados válidos para um tipo de transação
 */
export function getValidStatesForTransactionType(
  transactionType: TransactionType
): readonly string[] {
  return Object.values(TRANSACTION_STATE_MAPPING[transactionType]);
}

/**
 * Constante com o organization_id fixo do BanBan
 * Como as APIs são dedicadas, usamos um organization_id fixo
 */
export const BANBAN_ORG_ID = '2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4';

/**
 * Função utilitária para obter o organization_id
 * Para futuras expansões multi-tenant
 */
export function getOrganizationId(): string {
  return BANBAN_ORG_ID;
}