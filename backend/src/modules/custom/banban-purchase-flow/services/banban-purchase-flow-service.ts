import { createClient } from "@supabase/supabase-js";
import {
  validateAndGetTenant,
  createECABusinessTransaction,
  upsertECABusinessEntity,
  createECABusinessRelationship,
  getECATransactionByExternalId,
  transitionECATransactionState,
  getECAEntityByExternalId,
} from "@shared/webhook-base/index";
import {
  ENTITY_TYPES,
  TRANSACTION_TYPES,
  PURCHASE_STATES,
} from "@shared/enums/eca-types";
import { logger } from "../../../../utils/logger";

// ID da organização fixo para esta instância dedicada.
const BANBAN_ORG_ID = "2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4";

const PURCHASE_ACTIONS = {
  CREATE_ORDER: "create_order",
  APPROVE_ORDER: "approve_order",
  REGISTER_INVOICE: "register_invoice",
  ARRIVE_AT_CD: "arrive_at_cd",
  START_CONFERENCE: "start_conference",
  SCAN_ITEMS: "scan_items",
  EFFECTUATE_CD: "effectuate_cd",
} as const;

type PurchaseAction = (typeof PURCHASE_ACTIONS)[keyof typeof PURCHASE_ACTIONS];

/**
 * Orquestra os fluxos de trabalho de Compras, seguindo o plano de arquitetura.
 * Implementa a lógica de Eventos, Transações e Snapshots.
 */
export class BanBanPurchaseFlowService {
  private supabase: any;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  /**
   * Ponto de entrada principal para processar todas as ações de compra.
   */
  async processAction(
    action: PurchaseAction,
    transactionData: any,
    metadata?: any
  ) {
    logger.debug(`[PurchaseService] Iniciando ação '${action}'`);
    await validateAndGetTenant(BANBAN_ORG_ID);

    switch (action) {
      case PURCHASE_ACTIONS.CREATE_ORDER:
        return this._createOrder(transactionData, metadata);
      case PURCHASE_ACTIONS.APPROVE_ORDER:
        return this._approveOrder(transactionData, metadata);
      case PURCHASE_ACTIONS.REGISTER_INVOICE:
        return this._registerInvoice(transactionData, metadata);
      case PURCHASE_ACTIONS.ARRIVE_AT_CD:
        return this._arriveAtCD(transactionData, metadata);
      case PURCHASE_ACTIONS.START_CONFERENCE:
        return this._startConference(transactionData, metadata);
      case PURCHASE_ACTIONS.SCAN_ITEMS:
        return this._scanItems(transactionData, metadata);
      case PURCHASE_ACTIONS.EFFECTUATE_CD:
        return this._effectuateCD(transactionData, metadata);
      default:
        throw new Error(`Ação de compra desconhecida: ${action}`);
    }
  }

  /**
   * Lida com a consulta de dados de compras para a rota GET.
   */
  async getPurchaseData(queryParams: any) {
    logger.debug(
      `[PurchaseService-GET] Buscando dados com filtros:`,
      queryParams
    );
    const {
      limit = 50,
      offset = 0,
      external_id,
      transaction_id,
      status,
      supplier_id,
      date_from,
      date_to,
    } = queryParams;

    let query = this.supabase
      .from("tenant_business_transactions")
      .select("*")
      .eq("organization_id", BANBAN_ORG_ID);

    if (external_id) query = query.eq("external_id", external_id);
    if (transaction_id) query = query.eq("id", transaction_id);
    if (status) query = query.eq("status", status);
    if (supplier_id)
      query = query.contains("attributes", {
        supplier_external_id: supplier_id,
      });
    if (date_from) query = query.gte("created_at", date_from);
    if (date_to) query = query.lte("created_at", date_to);

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(
        `Erro ao buscar dados de Purchase (legacy): ${error.message}`
      );
    }

    return {
      success: true,
      data: {
        purchases: data || [],
        total: data?.length || 0,
        limit,
        offset,
      },
    };
  }

  /**
   * Wrapper público para integração direta com o webhook (ECA)
   * @deprecated Use processECAWebhook para novos desenvolvimentos
   */
  async processPurchaseOrderCreated(data: any, organizationId: string) {
    logger.info(
      "⚠️  [PurchaseService-LEGACY] Usando wrapper legacy processPurchaseOrderCreated"
    );

    // Processar usando nova arquitetura ECA
    return await this.processAction(
      "create_order",
      {
        external_id: data.external_id,
        supplier_external_id: data.supplier_external_id,
        supplier_name: data.supplier_name,
        items: data.items,
        total_value: data.total_value,
        issue_date: data.issue_date,
        expected_delivery: data.expected_delivery,
      },
      { organizationId }
    );
  }

  // --- MÉTODOS DE IMPLEMENTAÇÃO PRIVADOS ---

  private async _createOrder(data: any, metadata?: any) {
    logger.info(
      "[_createOrder] Iniciando criação de ordem de compra:",
      data.external_id
    );
    if (!data.external_id || !data.items || !data.supplier_external_id) {
      throw new Error(
        "external_id, items e supplier_external_id são obrigatórios."
      );
    }

    // 1. Criar ou obter a entidade do fornecedor
    const supplierEntity = await this._getOrCreateBusinessEntity(
      BANBAN_ORG_ID,
      "SUPPLIER",
      data.supplier_external_id,
      { name: data.supplier_name || `Fornecedor ${data.supplier_external_id}` }
    );

    // 2. Criar a transação de ordem de compra com status PENDENTE (conforme ECA: ORDER_PURCHASE)
    const transaction = await createECABusinessTransaction(
      "ORDER_PURCHASE",
      data.external_id,
      "PENDENTE",
      { ...data, status: "PENDENTE" }
    );

    // 3. Registrar relacionamento: Pedido -> Fornecedor
    await createECABusinessRelationship(
      "FROM_SUPPLIER",
      transaction.id,
      supplierEntity.id,
      {} // ECA: relacionamento simples, sem dados extras
    );

    // 4. Registrar relacionamentos: Pedido -> Produtos
    for (const item of data.items) {
      const productEntity = await this._getOrCreateBusinessEntity(
        BANBAN_ORG_ID,
        "PRODUCT",
        item.product_external_id,
        { name: item.product_name || `Produto ${item.product_external_id}` }
      );

      await createECABusinessRelationship(
        "CONTAINS_ITEM",
        transaction.id,
        productEntity.id,
        { quantity: item.quantity, unit_price: item.unit_price } // ECA: atributos do relacionamento item
      );
    }

    await this._createBusinessEvent(
      "TRANSACTION",
      transaction.id,
      "purchase_order_created",
      { ...data, ...metadata }
    );

    logger.info("[_createOrder] Ordem de compra criada com sucesso.");
    return {
      transaction_id: transaction.id,
      external_id: data.external_id,
      status: "PENDENTE",
    };
  }

  // --- MÉTODOS AUXILIARES ---

  private async _getOrCreateBusinessEntity(
    organizationId: string,
    entityType: keyof typeof ENTITY_TYPES,
    externalId: string,
    initialData: any
  ) {
    let entity = await getECAEntityByExternalId(
      entityType,
      externalId,
      organizationId
    );

    if (!entity) {
      logger.debug(
        `[${entityType}] Entidade com external_id ${externalId} não encontrada. Criando nova...`
      );
      entity = await upsertECABusinessEntity(
        entityType,
        externalId,
        initialData,
        undefined,
        organizationId
      );
    }
    return entity;
  }

  private async _getTransactionByExternalId(
    externalId: string,
    transactionType: keyof typeof TRANSACTION_TYPES
  ) {
    const transaction = await getECATransactionByExternalId(
      transactionType,
      externalId,
      BANBAN_ORG_ID
    );
    if (!transaction)
      throw new Error(
        `Transação do tipo ${transactionType} com ID externo ${externalId} não encontrada.`
      );
    return transaction;
  }

  private async _createBusinessEvent(
    entityType: string,
    entityId: string,
    eventCode: string,
    eventData: any
  ) {
    logger.debug(
      `[_createBusinessEvent] Registrando evento '${eventCode}' para ${entityType} ${entityId}`
    );
    try {
      const { error } = await this.supabase
        .from("tenant_business_events")
        .insert({
          organization_id: BANBAN_ORG_ID,
          entity_type: entityType,
          entity_id: entityId,
          event_code: eventCode,
          event_data: eventData,
        });

      if (error) {
        logger.error(`[_createBusinessEvent] Erro ao registrar evento:`, error);

        // FALLBACK: Log local em desenvolvimento
        if (process.env.NODE_ENV === "development") {
          logger.debug(
            `🚧 [DEV-EVENT] ${eventCode} para ${entityType}/${entityId} (modo desenvolvimento)`
          );
        }
      } else {
        logger.debug(`[_createBusinessEvent] Evento registrado com sucesso`);
      }
    } catch (error) {
      logger.error(`[_createBusinessEvent] Erro crítico:`, error);

      // FALLBACK: Log local em desenvolvimento
      if (process.env.NODE_ENV === "development") {
        logger.debug(
          `🚧 [DEV-EVENT-FALLBACK] ${eventCode} para ${entityType}/${entityId}`
        );
      }
    }
  }

  private async _updateInventorySnapshot(
    variantExternalId: string,
    locationExternalId: string,
    qtyChange: number,
    movementType: string,
    referenceId: string
  ) {
    const snapshotKey = `stock_${variantExternalId}_${locationExternalId}`;

    // Usar query sem .single() para evitar erro quando não existe ou há múltiplos
    const { data: snapshots, error: queryError } = await this.supabase
      .from("tenant_snapshots")
      .select("*")
      .eq("organization_id", BANBAN_ORG_ID)
      .eq("snapshot_key", snapshotKey)
      .limit(1);

    if (queryError) {
      logger.error(
        `[_updateInventorySnapshot] Erro ao buscar snapshot:`,
        queryError
      );
      throw queryError;
    }

    const existing = snapshots && snapshots.length > 0 ? snapshots[0] : null;

    const stock = existing?.snapshot_value || {};
    stock.current_stock = (stock.current_stock || 0) + qtyChange;
    stock.last_movement = movementType;
    stock.last_movement_ref = referenceId;
    stock.last_updated = new Date().toISOString();

    const { error: upsertError } = await this.supabase
      .from("tenant_snapshots")
      .upsert(
        {
          organization_id: BANBAN_ORG_ID,
          snapshot_type: "INVENTORY",
          snapshot_key: snapshotKey,
          snapshot_value: stock,
          snapshot_date: new Date().toISOString().split("T")[0],
        },
        { onConflict: "organization_id,snapshot_key" }
      );

    if (upsertError) {
      logger.error(
        `[_updateInventorySnapshot] Erro ao atualizar snapshot:`,
        upsertError
      );
      throw upsertError;
    }
  }

  private async _approveOrder(data: any, metadata?: any) {
    logger.info("[_approveOrder] Iniciando aprovação para:", data.external_id);
    const transaction = await this._getTransactionByExternalId(
      data.external_id,
      "ORDER_PURCHASE"
    );

    // Validar que o status atual é PENDENTE
    if (transaction.status !== "PENDENTE") {
      throw new Error(
        `Ordem de compra ${data.external_id} não pode ser aprovada pois seu status é ${transaction.status}. Esperado: PENDENTE.`
      );
    }

    // Atualizar o status para APPROVED
    const updatedTx = await transitionECATransactionState(
      transaction.id,
      "APPROVED",
      { ...transaction.attributes, status: "APPROVED" },
      BANBAN_ORG_ID
    );

    await this._createBusinessEvent(
      "TRANSACTION",
      transaction.id,
      "purchase_order_approved",
      { ...data, ...metadata }
    );

    logger.info("[_approveOrder] Ordem de compra aprovada.");
    return {
      transaction_id: transaction.id,
      external_id: data.external_id,
      status: "APPROVED",
    };
  }

  private async _registerInvoice(data: any, metadata?: any) {
    logger.info(
      "[_registerInvoice] Iniciando registro de NF:",
      data.external_id
    );
    if (!data.external_id || !data.purchase_order_external_id) {
      throw new Error(
        "external_id e purchase_order_external_id são obrigatórios."
      );
    }
    const poTransaction = await this._getTransactionByExternalId(
      data.purchase_order_external_id,
      "ORDER_PURCHASE"
    );

    // Criar a transação de NF com status PRE_BAIXA
    const invoiceData = { ...data, reference_transaction_id: poTransaction.id };
    const transaction = await createECABusinessTransaction(
      "DOCUMENT_SUPPLIER_IN",
      data.external_id,
      "PRE_BAIXA",
      { ...invoiceData, status: "PRE_BAIXA" } // Adiciona status ao attributes
    );

    // Registrar relacionamento: NF -> Pedido de Compra
    await createECABusinessRelationship(
      "BASED_ON_ORDER",
      transaction.id,
      poTransaction.id,
      {}
    );

    await this._createBusinessEvent(
      "TRANSACTION",
      transaction.id,
      "invoice_registered",
      { ...data, ...metadata }
    );

    logger.info("[_registerInvoice] NF registrada com sucesso.");
    return {
      transaction_id: transaction.id,
      external_id: data.external_id,
      status: "PRE_BAIXA",
    };
  }

  private async _arriveAtCD(data: any, metadata?: any) {
    logger.info(
      "[_arriveAtCD] Carga chegou na portaria do CD para NF:",
      data.invoice_external_id
    );
    if (!data.invoice_external_id)
      throw new Error("invoice_external_id é obrigatório.");
    const transaction = await this._getTransactionByExternalId(
      data.invoice_external_id,
      "DOCUMENT_SUPPLIER_IN"
    );

    // Validar que o status atual é PRE_BAIXA
    if (transaction.status !== "PRE_BAIXA") {
      throw new Error(
        `NF ${data.invoice_external_id} não pode ser marcada como chegada pois seu status é ${transaction.status}. Esperado: PRE_BAIXA.`
      );
    }

    // Atualizar o status para AGUARDANDO_CONFERENCIA_CD
    const updatedTx = await transitionECATransactionState(
      transaction.id,
      "AGUARDANDO_CONFERENCIA_CD",
      {
        ...transaction.attributes,
        status: "AGUARDANDO_CONFERENCIA_CD",
        chegada_cd_em: new Date().toISOString(),
      },
      BANBAN_ORG_ID
    );

    await this._createBusinessEvent(
      "TRANSACTION",
      transaction.id,
      "arrived_at_cd",
      { ...data, ...metadata }
    );

    logger.info("[_arriveAtCD] Carga marcada como chegada no CD.");
    return {
      transaction_id: transaction.id,
      external_id: transaction.external_id,
      status: "AGUARDANDO_CONFERENCIA_CD",
    };
  }

  private async _startConference(data: any, metadata?: any) {
    logger.info(
      "[_startConference] Iniciando conferência para NF:",
      data.invoice_external_id
    );
    logger.debug("[_startConference] Dados recebidos:", JSON.stringify(data));

    try {
      const transaction = await this._getTransactionByExternalId(
        data.invoice_external_id,
        "DOCUMENT_SUPPLIER_IN"
      );
      logger.debug("[_startConference] Transação encontrada:", transaction.id);

      // Validar que o status atual é PRE_BAIXA ou AGUARDANDO_CONFERENCIA_CD
      if (
        transaction.status !== "PRE_BAIXA" &&
        transaction.status !== "AGUARDANDO_CONFERENCIA_CD"
      ) {
        throw new Error(
          `NF ${data.invoice_external_id} não pode iniciar conferência pois seu status é ${transaction.status}. Esperado: PRE_BAIXA ou AGUARDANDO_CONFERENCIA_CD.`
        );
      }

      logger.debug(
        "[_startConference] Status validado, iniciando transição para EM_CONFERENCIA_CD"
      );

      // Atualizar o status para EM_CONFERENCIA_CD e adicionar timestamp
      const updatedTx = await transitionECATransactionState(
        transaction.id,
        "EM_CONFERENCIA_CD",
        {
          ...transaction.attributes,
          status: "EM_CONFERENCIA_CD",
          conferencia_iniciada_em: new Date().toISOString(),
        },
        BANBAN_ORG_ID
      );

      logger.debug("[_startConference] Status atualizado com sucesso");

      await this._createBusinessEvent(
        "TRANSACTION",
        transaction.id,
        "conference_started",
        { ...data, ...metadata }
      );
      logger.debug("[_startConference] Evento criado com sucesso");

      return {
        transaction_id: transaction.id,
        external_id: transaction.external_id,
        status: "EM_CONFERENCIA_CD",
      };
    } catch (error) {
      logger.error("[_startConference] Erro no start_conference:", error);
      throw error;
    }
  }

  private async _scanItems(data: any, metadata?: any) {
    logger.info(
      "[_scanItems] Registrando itens escaneados para NF:",
      data.invoice_external_id
    );
    if (!data.invoice_external_id || !data.items)
      throw new Error("invoice_external_id e items são obrigatórios.");
    const transaction = await this._getTransactionByExternalId(
      data.invoice_external_id,
      "DOCUMENT_SUPPLIER_IN"
    );

    // Validar que o status atual é EM_CONFERENCIA_CD ou já em conferência
    if (
      transaction.status !== "EM_CONFERENCIA_CD" &&
      transaction.status !== "CONFERENCIA_CD_SEM_DIVERGENCIA" &&
      transaction.status !== "CONFERENCIA_CD_COM_DIVERGENCIA"
    ) {
      throw new Error(
        `NF ${data.invoice_external_id} não está em conferência. Status atual: ${transaction.status}.`
      );
    }

    // Processar cada item escaneado
    const allDiscrepancies: any[] = transaction.attributes.divergencias || [];

    for (const item of data.items) {
      // Registrar evento de item escaneado
      await this._createBusinessEvent(
        "TRANSACTION",
        transaction.id,
        "receipt_item_scanned_ok",
        { ...item, ...metadata }
      );

      // Verificar se há divergência neste item
      if (item.qty_diff && item.qty_diff !== 0) {
        // Atualizar ou adicionar divergência
        const existingDiscrepancyIndex = allDiscrepancies.findIndex(
          (d) => d.sku === item.product_external_id
        );
        const discrepancyData = {
          sku: item.product_external_id,
          qty_expected: item.qty_expected,
          qty_scanned: item.qty_scanned,
          qty_diff: item.qty_diff,
          scanned_at: new Date().toISOString(),
        };

        if (existingDiscrepancyIndex >= 0) {
          allDiscrepancies[existingDiscrepancyIndex] = discrepancyData;
        } else {
          allDiscrepancies.push(discrepancyData);
        }
      }

      // Criar movimentação de estoque para item escaneado
      await this._processItemInventoryMovement(item, transaction);
    }

    // Verificar se há divergências no total (incluindo divergências anteriores)
    const totalDiscrepancies = allDiscrepancies.length > 0;

    // Derivar status baseado nas divergências encontradas
    const newStatus = totalDiscrepancies
      ? "CONFERENCIA_CD_COM_DIVERGENCIA"
      : "CONFERENCIA_CD_SEM_DIVERGENCIA";

    // Atualizar status da transação
    await transitionECATransactionState(
      transaction.id,
      newStatus,
      {
        ...transaction.attributes,
        status: newStatus,
        divergencias: allDiscrepancies,
        ultima_conferencia_em: new Date().toISOString(),
      },
      BANBAN_ORG_ID
    );

    logger.info(
      `[_scanItems] ${data.items.length} itens processados. Status atualizado para: ${newStatus}`
    );
    return {
      transaction_id: transaction.id,
      external_id: transaction.external_id,
      status: newStatus,
      summary: `${data.items.length} itens escaneados`,
      divergencias: allDiscrepancies,
    };
  }

  private async _processItemInventoryMovement(item: any, transaction: any) {
    logger.debug(
      `[_processItemInventoryMovement] Processando item ${item.product_external_id}: +${item.qty_scanned}`
    );

    // Obter ou criar entidades de Produto e Localização
    const productEntity = await this._getOrCreateBusinessEntity(
      BANBAN_ORG_ID,
      "PRODUCT",
      item.product_external_id,
      { name: item.product_name || `Produto ${item.product_external_id}` }
    );

    const locationEntity = await this._getOrCreateBusinessEntity(
      BANBAN_ORG_ID,
      "LOCATION",
      item.location_external_id,
      { name: item.location_name || `Local ${item.location_external_id}` }
    );

    // Criar transação INVENTORY_MOVEMENT
    const inventoryMovement = await createECABusinessTransaction(
      "INVENTORY_MOVEMENT",
      null, // external_id pode ser nulo para movimentos internos
      "MOVIMENTO_EXECUTADO", // Status inicial para movimento de inventário
      {
        qty_change: item.qty_scanned,
        movement_type: "CD_RECEIPT",
        reference_invoice_id: transaction.id,
        reference_invoice_external_id: transaction.external_id,
        product_external_id: item.product_external_id,
        location_external_id: item.location_external_id,
        ...item, // Incluir todos os dados do item escaneado
      }
    );

    // Registrar relacionamentos para o movimento de inventário
    await createECABusinessRelationship(
      "AFFECTS_PRODUCT",
      inventoryMovement.id,
      productEntity.id,
      {}
    );
    await createECABusinessRelationship(
      "AT_LOCATION",
      inventoryMovement.id,
      locationEntity.id,
      {}
    );
    await createECABusinessRelationship(
      "CAUSED_BY_DOCUMENT",
      inventoryMovement.id,
      transaction.id,
      {}
    );

    // Atualizar o snapshot de inventário
    await this._updateInventorySnapshot(
      item.product_external_id,
      item.location_external_id,
      item.qty_scanned,
      "CD_RECEIPT",
      inventoryMovement.id // Referência ao ID da transação de movimento
    );
  }

  private async _effectuateCD(data: any, metadata?: any) {
    logger.info(
      "[_effectuateCD] Iniciando efetivação no CD para NF:",
      data.invoice_external_id
    );
    if (!data.invoice_external_id)
      throw new Error("invoice_external_id é obrigatório.");
    const transaction = await this._getTransactionByExternalId(
      data.invoice_external_id,
      "DOCUMENT_SUPPLIER_IN"
    );

    // Validar que o status atual é CONFERENCIA_CD_SEM_DIVERGENCIA ou CONFERENCIA_CD_COM_DIVERGENCIA
    if (
      transaction.status !== "CONFERENCIA_CD_SEM_DIVERGENCIA" &&
      transaction.status !== "CONFERENCIA_CD_COM_DIVERGENCIA"
    ) {
      throw new Error(
        `NF ${data.invoice_external_id} não pode ser efetivada pois seu status é ${transaction.status}. Esperado: CONFERENCIA_CD_SEM_DIVERGENCIA ou CONFERENCIA_CD_COM_DIVERGENCIA.`
      );
    }

    // Atualizar o status para EFETIVADO_CD
    await transitionECATransactionState(
      transaction.id,
      "EFETIVADO_CD",
      {
        ...transaction.attributes,
        status: "EFETIVADO_CD",
        efetivado_em: new Date().toISOString(),
      },
      BANBAN_ORG_ID
    );

    await this._createBusinessEvent(
      "TRANSACTION",
      transaction.id,
      "cd_effectuated",
      { ...data, ...metadata }
    );

    logger.info("[_effectuateCD] NF efetivada no CD com sucesso.");
    return {
      transaction_id: transaction.id,
      external_id: transaction.external_id,
      status: "EFETIVADO_CD",
    };
  }

  // ================================================
  // NOTA: MÉTODOS LEGACY ACIMA
  // ================================================
  // Todos os métodos privados acima (_createOrder, _approveOrder, etc.) são mantidos
  // apenas para compatibilidade com o sistema atual. Para novos desenvolvimentos,
  // use a arquitetura ECA via processECAWebhook() que automaticamente:
  //
  // 1. Valida ações usando enums centralizados
  // 2. Gerencia transições de estado via máquina de estados
  // 3. Cria entidades, transações e relacionamentos automaticamente
  // 4. Mantém histórico completo de transições
  // 5. Fornece rastreabilidade completa conforme ECA.md
  //
  // TODO: Migrar gradualmente todos os clients para usar processECAWebhook()
  // TODO: Deprecar e remover métodos legacy após migração completa
}
