import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { logger } from "../../utils/logger";
import {
  EntityType,
  TransactionType,
  RelationshipType,
  BusinessState,
  BusinessAction,
  BANBAN_ORG_ID,
  isValidStateForTransactionType,
  ACTION_TO_TRANSACTION_TYPE,
  ACTION_TO_TARGET_STATE,
} from "@shared/enums";

// Configuração do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    fetch: (...args) => {
      // Aumentar timeout para evitar fetch failed intermitente
      return fetch(args[0], {
        ...args[1],
        signal: AbortSignal.timeout(15000), // 15 segundos timeout
      });
    },
  },
});

// Cache em memória para modo desenvolvimento (apenas para transações mock)
const devTransactionCache = new Map<string, ECABusinessTransaction>();

// ================================================
// INTERFACES ECA (Event-Condition-Action)
// ================================================

interface TenantData {
  organization_id: string;
  business_data: Record<string, any>;
}

/**
 * Interface para Entidades de Negócio (ECA)
 * Baseada na tabela tenant_business_entities
 */
interface ECABusinessEntity {
  id: string;
  organization_id: string;
  entity_type: EntityType; // Enum tipado
  external_id: string;
  attributes: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

/**
 * Interface para Relacionamentos de Negócio (ECA)
 * Baseada na tabela tenant_business_relationships
 */
interface ECABusinessRelationship {
  id: string;
  organization_id: string;
  source_id: string;
  target_id: string;
  relationship_type: RelationshipType; // Enum tipado
  attributes: Record<string, any>;
  created_at?: string;
  deleted_at?: string | null;
}

/**
 * Interface para Transações de Negócio (ECA)
 * Baseada na tabela tenant_business_transactions
 */
interface ECABusinessTransaction {
  id: string;
  organization_id: string;
  transaction_type: TransactionType; // Enum tipado
  external_id: string | null;
  status: BusinessState; // Enum tipado
  attributes: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

/**
 * Interface para Payload de Webhook ECA
 */
interface ECAWebhookPayload {
  action: BusinessAction;
  attributes: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Interface para Resposta de Webhook ECA
 */
interface ECAWebhookResponse {
  success: boolean;
  action: BusinessAction;
  transaction_id?: string;
  entity_ids?: string[];
  relationship_ids?: string[];
  state_transition?: {
    from: BusinessState;
    to: BusinessState;
  };
  attributes: {
    success: boolean;
    entityType?: string;
    entityId?: string;
    summary: {
      message: string;
      records_processed: number;
      records_successful: number;
      records_failed: number;
    };
  };
  metadata: {
    processed_at: string;
    processing_time_ms: number;
    organization_id: string;
    action: BusinessAction;
    event_uuid: string;
  };
}

// Manter interfaces antigas para compatibilidade (DEPRECATED)
/** @deprecated Use ECABusinessEntity */
interface BusinessEntity
  extends Omit<ECABusinessEntity, "organization_id" | "entity_type"> {
  organization_id: string;
  entity_type: string;
}

/** @deprecated Use ECABusinessRelationship */
interface BusinessRelationship
  extends Omit<
    ECABusinessRelationship,
    "organization_id" | "relationship_type"
  > {
  organization_id: string;
  relationship_type: string;
  updated_at?: string;
}

/** @deprecated Use ECABusinessTransaction */
interface BusinessTransaction
  extends Omit<
    ECABusinessTransaction,
    "organization_id" | "transaction_type" | "status"
  > {
  organization_id: string;
  transaction_type: string;
  status: string;
}

// Função para registrar logs de webhook
export async function logWebhookEvent(
  flow: string,
  eventType: string,
  payload: any,
  status: "success" | "error" | "pending",
  responseData?: any,
  errorMessage?: any, // Alterado para 'any' para aceitar Error object
  processingTimeMs?: number
) {
  try {
    let errorToLog: string | undefined;

    if (errorMessage instanceof Error) {
      errorToLog = errorMessage.message;
    } else if (typeof errorMessage === "string") {
      errorToLog = errorMessage;
    }

    const { error } = await supabase.from("webhook_logs").insert({
      webhook_flow: flow,
      event_type: eventType,
      payload: payload,
      status: status,
      response_data: responseData,
      error_message: errorToLog,
      processing_time_ms: processingTimeMs,
      source_ip: null,
      user_agent: null,
    });

    if (error) {
      console.error("❌ Erro ao gravar log de webhook:", error);

      // FALLBACK: Log local em desenvolvimento
      if (process.env.NODE_ENV === "development") {
        console.log(
          `📝 [DEV-LOG] ${flow}/${eventType} - ${status} (${processingTimeMs}ms)`
        );
        if (errorToLog) console.log(`📝 [DEV-ERROR] ${errorToLog}`);
      }
    } else {
      console.log(
        `📝 Log de webhook gravado: ${flow}/${eventType} - ${status}`
      );
    }
  } catch (logError) {
    console.error("❌ Erro crítico ao gravar log:", logError);

    // FALLBACK: Log local em desenvolvimento
    if (process.env.NODE_ENV === "development") {
      console.log(
        `📝 [DEV-FALLBACK] ${flow}/${eventType} - ${status} (${processingTimeMs}ms)`
      );
    }
  }
}

// ================================================
// MÁQUINA DE ESTADOS ECA
// ================================================

/**
 * Classe para gerenciar transições de estado no sistema ECA
 */
class ECAStateMachine {
  private transitions: Map<
    TransactionType,
    Map<BusinessState, BusinessState[]>
  >;

  constructor() {
    this.transitions = new Map();
    this.initializeTransitions();
  }

  private initializeTransitions() {
    // Purchase Flow transitions
    this.transitions.set(
      "ORDER_PURCHASE",
      new Map([
        ["PENDENTE" as BusinessState, ["APPROVED" as BusinessState, "PRE_BAIXA" as BusinessState]],
        ["APPROVED" as BusinessState, ["PRE_BAIXA" as BusinessState]]
      ])
    );

    this.transitions.set(
      "DOCUMENT_SUPPLIER_IN",
      new Map([
        [
          "PRE_BAIXA" as BusinessState,
          ["AGUARDANDO_CONFERENCIA_CD" as BusinessState],
        ],
        [
          "AGUARDANDO_CONFERENCIA_CD" as BusinessState,
          ["EM_CONFERENCIA_CD" as BusinessState],
        ],
        [
          "EM_CONFERENCIA_CD" as BusinessState,
          [
            "CONFERENCIA_CD_SEM_DIVERGENCIA" as BusinessState,
            "CONFERENCIA_CD_COM_DIVERGENCIA" as BusinessState,
          ],
        ],
        [
          "CONFERENCIA_CD_SEM_DIVERGENCIA" as BusinessState,
          [
            "EFETIVADO_CD" as BusinessState,
            "CONFERENCIA_CD_COM_DIVERGENCIA" as BusinessState, // Permitir mudança de estado
          ],
        ],
        [
          "CONFERENCIA_CD_COM_DIVERGENCIA" as BusinessState,
          [
            "EFETIVADO_CD" as BusinessState,
            "CONFERENCIA_CD_SEM_DIVERGENCIA" as BusinessState, // Permitir mudança de estado
          ],
        ],
      ])
    );

    // Transfer Out Flow transitions
    this.transitions.set(
      "TRANSFER_OUT",
      new Map([
        [
          "PEDIDO_TRANSFERENCIA_CRIADO" as BusinessState,
          ["MAPA_SEPARACAO_CRIADO" as BusinessState],
        ],
        [
          "MAPA_SEPARACAO_CRIADO" as BusinessState,
          ["AGUARDANDO_SEPARACAO_CD" as BusinessState],
        ],
        [
          "AGUARDANDO_SEPARACAO_CD" as BusinessState,
          ["EM_SEPARACAO_CD" as BusinessState],
        ],
        [
          "EM_SEPARACAO_CD" as BusinessState,
          [
            "SEPARACAO_CD_SEM_DIVERGENCIA" as BusinessState,
            "SEPARACAO_CD_COM_DIVERGENCIA" as BusinessState,
          ],
        ],
        [
          "SEPARACAO_CD_SEM_DIVERGENCIA" as BusinessState,
          ["SEPARADO_PRE_DOCA" as BusinessState],
        ],
        [
          "SEPARACAO_CD_COM_DIVERGENCIA" as BusinessState,
          ["SEPARADO_PRE_DOCA" as BusinessState],
        ],
        [
          "SEPARADO_PRE_DOCA" as BusinessState,
          ["EMBARCADO_CD" as BusinessState],
        ],
        [
          "EMBARCADO_CD" as BusinessState,
          ["TRANSFERENCIA_CDH_FATURADA" as BusinessState],
        ],
      ])
    );

    // Transfer In Flow transitions
    this.transitions.set(
      "TRANSFER_IN",
      new Map([
        [
          "AGUARDANDO_CONFERENCIA_LOJA" as BusinessState,
          ["EM_CONFERENCIA_LOJA" as BusinessState],
        ],
        [
          "EM_CONFERENCIA_LOJA" as BusinessState,
          [
            "CONFERENCIA_LOJA_SEM_DIVERGENCIA" as BusinessState,
            "CONFERENCIA_LOJA_COM_DIVERGENCIA" as BusinessState,
          ],
        ],
        [
          "CONFERENCIA_LOJA_SEM_DIVERGENCIA" as BusinessState,
          ["EFETIVADO_LOJA" as BusinessState],
        ],
        [
          "CONFERENCIA_LOJA_COM_DIVERGENCIA" as BusinessState,
          ["EFETIVADO_LOJA" as BusinessState],
        ],
      ])
    );

    // Sales Flow (simples)
    this.transitions.set(
      "DOCUMENT_SALE",
      new Map([
        // Sales não tem transições complexas por enquanto
      ])
    );

    // Return Flow transitions
    this.transitions.set(
      "DOCUMENT_RETURN",
      new Map([
        [
          "DEVOLUCAO_AGUARDANDO" as BusinessState,
          ["DEVOLUCAO_CONCLUIDA" as BusinessState],
        ],
        [
          "DEVOLUCAO_CONCLUIDA" as BusinessState,
          ["TRANSFERENCIA_ENTRE_LOJAS" as BusinessState],
        ],
      ])
    );

    // Inventory Movement transitions
    this.transitions.set(
      "INVENTORY_MOVEMENT",
      new Map([
        [
          "MOVIMENTO_PENDENTE" as BusinessState,
          [
            "MOVIMENTO_EXECUTADO" as BusinessState,
            "MOVIMENTO_CANCELADO" as BusinessState,
          ],
        ],
      ])
    );
  }

  public canTransition(
    transactionType: TransactionType,
    fromState: BusinessState,
    toState: BusinessState
  ): boolean {
    const typeTransitions = this.transitions.get(transactionType);
    if (!typeTransitions) return false;

    const allowedStates = typeTransitions.get(fromState);
    return allowedStates?.includes(toState) || false;
  }

  public getNextStates(
    transactionType: TransactionType,
    currentState: BusinessState
  ): BusinessState[] {
    const typeTransitions = this.transitions.get(transactionType);
    return typeTransitions?.get(currentState) || [];
  }
}

// Instância global da máquina de estados
const stateMachine = new ECAStateMachine();

// ================================================
// FUNÇÕES DE TENANT E VALIDAÇÃO
// ================================================

/**
 * Valida e obtém dados do tenant (atualizada para ECA)
 * Como as APIs são dedicadas ao BanBan, usa o tenant_id fixo
 */
export async function validateAndGetTenant(
  organizationId?: string
): Promise<TenantData> {
  const tenantId = organizationId || BANBAN_ORG_ID;

  try {
    // Verificar se a organização existe
    const { data: orgs, error } = await supabase
      .from("organizations")
      .select("id, slug, company_trading_name")
      .eq("id", tenantId)
      .limit(1);

    const org = orgs && orgs.length > 0 ? orgs[0] : null;

    if (error) {
      console.error("[validateAndGetTenant] Erro Supabase:", error);
      console.log("[validateAndGetTenant] NODE_ENV:", process.env.NODE_ENV);
      console.log(
        "[validateAndGetTenant] Error message includes fetch failed:",
        error.message?.includes("fetch failed")
      );

      // FALLBACK: Modo desenvolvimento sem Supabase
      if (
        process.env.NODE_ENV === "development" ||
        (error as Error).message?.includes("fetch failed")
      ) {
        console.warn(
          "[validateAndGetTenant] 🚧 MODO DESENVOLVIMENTO: Usando dados mock para tenant - considere configurar Supabase"
        );
        return {
          organization_id: tenantId,
          business_data: {
            slug: "banban-dev",
            company_trading_name:
              "BanBan Footwear (Dev Mode - Configure Supabase para produção)",
          },
        };
      }

      throw new Error(`Erro ao conectar com banco de dados: ${error.message}`);
    }

    if (!org) {
      throw new Error(
        `Organização não encontrada para organization_id: ${tenantId}`
      );
    }

    // Retornar dados no formato esperado
    return {
      organization_id: tenantId, // Manter para compatibilidade
      business_data: {
        slug: org.slug,
        company_trading_name: org.company_trading_name,
      },
    };
  } catch (error) {
    console.error("[validateAndGetTenant] Erro durante validação:", error);
    console.log(
      "[validateAndGetTenant] CATCH - NODE_ENV:",
      process.env.NODE_ENV
    );
    console.log(
      "[validateAndGetTenant] CATCH - Error message:",
      (error as Error).message
    );

    // FALLBACK: Modo desenvolvimento
    if (
      process.env.NODE_ENV === "development" ||
      (error as Error).message?.includes("fetch failed")
    ) {
      console.warn(
        "[validateAndGetTenant] 🚧 MODO DESENVOLVIMENTO: Usando dados mock devido a erro de conectividade - configure Supabase para produção"
      );
      return {
        organization_id: tenantId,
        business_data: {
          slug: "banban-dev",
          company_trading_name:
            "BanBan Footwear (Dev Mode - Configure Supabase)",
        },
      };
    }

    throw error;
  }
}

// ================================================
// FUNÇÕES ECA PARA ENTIDADES
// ================================================

/**
 * Função ECA para criar/atualizar entidade de negócio
 * Versão atualizada usando organization_id e tipos tipados
 */
export async function upsertECABusinessEntity(
  entityType: EntityType,
  external_id: string,
  businessData: Record<string, any>,
  entityId?: string,
  organizationId?: string
): Promise<ECABusinessEntity> {
  const actualTenantId = organizationId || BANBAN_ORG_ID;

  const entity = {
    id: entityId || crypto.randomUUID(),
    organization_id: actualTenantId,
    entity_type: entityType,
    external_id: external_id,
    attributes: businessData,
    created_at: undefined as unknown as string | undefined,
    updated_at: new Date().toISOString(),
  };

  // Se não tem ID, é inserção. Se tem ID, é update
  if (entityId) {
    const { data, error } = await supabase
      .from("tenant_business_entities")
      .update(entity)
      .eq("id", entityId)
      .eq("organization_id", actualTenantId)
      .select();

    logger.debug(`[upsertECABusinessEntity] Resultado do UPDATE: data=${JSON.stringify(data)}, error=${JSON.stringify(error)}`);

    if (error) {
      logger.error("❌ ECA - Erro ao atualizar entidade:", JSON.stringify(error, null, 2));
      throw new Error(`Erro ao atualizar entidade ECA: ${error.message}`);
    }

    if (!data || data.length === 0) {
      logger.error(`❌ ECA - Entidade não encontrada para atualização: ${entityId}`);
      throw new Error(`Entidade não encontrada para atualização: ${entityId}`);
    }
    logger.info(`✅ ECA - Entidade ${entityType} atualizada com sucesso:`, data[0].id);
    return data[0] as ECABusinessEntity;
  } else {
    // Inserção
    entity.created_at = new Date().toISOString();

    logger.info(
      `🔍 ECA - Criando entidade ${entityType} com external_id: ${external_id}`
    );

    const { data, error } = await supabase
      .from("tenant_business_entities")
      .insert(entity)
      .select();

    logger.debug(`[upsertECABusinessEntity] Resultado do INSERT: data=${JSON.stringify(data)}, error=${JSON.stringify(error)}`);

    if (error) {
      logger.error(
        "❌ ECA - Erro na criação da entidade:",
        JSON.stringify(error, null, 2)
      );
      throw new Error(`Erro ao criar entidade ECA: ${error.message}`);
    }

    if (!data || data.length === 0) {
      logger.error(`❌ ECA - Falha ao criar entidade ${entityType}`);
      throw new Error(`Falha ao criar entidade ${entityType}`);
    }

    logger.info(
      `✅ ECA - Entidade ${entityType} criada com sucesso:`,
      data[0].id
    );
    return data[0] as ECABusinessEntity;
  }
}

/**
 * Função ECA para buscar entidade por external_id e tipo
 * Busca usando a chave de negócio conforme ECA.md
 */
export async function getECAEntityByExternalId(
  entityType: EntityType,
  external_id: string,
  organizationId?: string
): Promise<ECABusinessEntity | null> {
  const actualTenantId = organizationId || BANBAN_ORG_ID;

  logger.debug(`[getECAEntityByExternalId] Buscando entidade: entityType=${entityType}, external_id=${external_id}, organizationId=${actualTenantId}`);

  const { data, error } = await supabase
    .from("tenant_business_entities")
    .select("*")
    .eq("organization_id", actualTenantId)
    .eq("entity_type", entityType)
    .eq("external_id", external_id)
    .is("deleted_at", null)
    .limit(1);

  logger.debug(`[getECAEntityByExternalId] Resultado da busca: data=${JSON.stringify(data)}, error=${JSON.stringify(error)}`);

  if (error) {
    throw new Error(`Erro ao buscar entidade ECA: ${error.message}`);
  }

  // Se não encontrou nenhuma entidade, retornar null
  if (!data || data.length === 0) {
    logger.debug(`[getECAEntityByExternalId] Entidade não encontrada.`);
    return null;
  }

  // Se encontrou múltiplas, usar a primeira (pode indicar problema de dados, mas evita crash)
  if (data.length > 1) {
    console.warn(
      `⚠️ Múltiplas entidades encontradas para ${entityType}/${external_id}. Usando a primeira.`
    );
  }

  logger.debug(`[getECAEntityByExternalId] Entidade encontrada: ${JSON.stringify(data[0])}`);
  return data[0] as ECABusinessEntity;
}

/**
 * Função LEGACY para criar/atualizar entidade de negócio
 * Mantida para compatibilidade, mas usa internamente as funções ECA
 * @deprecated Use upsertECABusinessEntity
 */
export async function upsertBusinessEntity(
  organizationId: string,
  entityType: string,
  businessData: Record<string, any>,
  entityId?: string
): Promise<BusinessEntity> {
  // Converter para tipos ECA e chamar nova função
  const ecaEntity = await upsertECABusinessEntity(
    entityType as EntityType,
    businessData.external_id || entityId || crypto.randomUUID(),
    businessData,
    entityId,
    organizationId || BANBAN_ORG_ID
  );

  // Converter de volta para interface legacy
  return {
    id: ecaEntity.id,
    organization_id: ecaEntity.organization_id,
    entity_type: ecaEntity.entity_type,
    external_id: ecaEntity.external_id,
    attributes: ecaEntity.attributes,
    created_at: ecaEntity.created_at,
    updated_at: ecaEntity.updated_at,
  };
}

// ================================================
// FUNÇÕES ECA PARA RELACIONAMENTOS
// ================================================

/**
 * Função ECA para criar relacionamento de negócio
 * Versão atualizada usando organization_id e tipos tipados
 */
export async function createECABusinessRelationship(
  relationshipType: RelationshipType,
  sourceId: string,
  targetId: string,
  attributes: Record<string, any> = {},
  organizationId?: string
): Promise<ECABusinessRelationship> {
  const actualTenantId = organizationId || BANBAN_ORG_ID;

  const relationship = {
    id: crypto.randomUUID(),
    organization_id: actualTenantId,
    relationship_type: relationshipType,
    source_id: sourceId,
    target_id: targetId,
    attributes: attributes,
    created_at: new Date().toISOString(),
  };

  logger.info(
    `🔗 ECA - Criando relacionamento ${relationshipType}: ${sourceId} -> ${targetId}`
  );

  const { data, error } = await supabase
    .from("tenant_business_relationships")
    .insert(relationship)
    .select();

  logger.debug(`[createECABusinessRelationship] Resultado do INSERT: data=${JSON.stringify(data)}, error=${JSON.stringify(error)}`);

  if (error) {
    logger.error(
      "❌ ECA - Erro na criação do relacionamento:",
      JSON.stringify(error, null, 2)
    );
    throw new Error(`Erro ao criar relacionamento ECA: ${error.message}`);
  }

  if (!data || data.length === 0) {
    logger.error(`❌ ECA - Falha ao criar relacionamento ${relationshipType}`);
    throw new Error(`Falha ao criar relacionamento ${relationshipType}`);
  }

  logger.info(
    `✅ ECA - Relacionamento ${relationshipType} criado com sucesso:`,
    data[0].id
  );
  return data[0] as ECABusinessRelationship;
}

/**
 * Função LEGACY para criar relacionamento de negócio
 * @deprecated Use createECABusinessRelationship
 */
export async function createBusinessRelationship(
  organizationId: string,
  relationshipType: string,
  sourceId: string,
  targetId: string,
  attributes: Record<string, any>
): Promise<BusinessRelationship> {
  logger.debug(`[createBusinessRelationship] Chamando createECABusinessRelationship com: organizationId=${organizationId}, relationshipType=${relationshipType}, sourceId=${sourceId}, targetId=${targetId}, attributes=${JSON.stringify(attributes)}`);
  try {
    // Converter para tipos ECA e chamar nova função
    const ecaRelationship = await createECABusinessRelationship(
      relationshipType as RelationshipType,
      sourceId,
      targetId,
      attributes,
      organizationId || BANBAN_ORG_ID
    );
    logger.debug(`[createBusinessRelationship] ecaRelationship retornado: ${JSON.stringify(ecaRelationship)}`);

    // Converter de volta para interface legacy
    return {
      id: ecaRelationship.id,
      organization_id: ecaRelationship.organization_id,
      relationship_type: ecaRelationship.relationship_type,
      source_id: ecaRelationship.source_id,
      target_id: ecaRelationship.target_id,
      attributes: ecaRelationship.attributes,
      created_at: ecaRelationship.created_at,
      updated_at: ecaRelationship.created_at, // Relationships não têm updated_at
      deleted_at: ecaRelationship.deleted_at,
    };
  } catch (error) {
    logger.error(`❌ [createBusinessRelationship] Erro ao criar relacionamento:`, error);
    throw error;
  }
}

// ================================================
// FUNÇÕES ECA PARA TRANSAÇÕES
// ================================================

/**
 * Função ECA para criar transação de negócio
 * Versão atualizada usando organization_id, tipos tipados e validação de estado
 */
export async function createECABusinessTransaction(
  transactionType: TransactionType,
  external_id: string | null,
  initialStatus: BusinessState,
  transactionData: Record<string, any>,
  organizationId?: string
): Promise<ECABusinessTransaction> {
  const actualTenantId = organizationId || BANBAN_ORG_ID;

  // Validar se o estado é válido para o tipo de transação
  if (!isValidStateForTransactionType(transactionType, initialStatus)) {
    throw new Error(
      `Estado '${initialStatus}' não é válido para transação tipo '${transactionType}'`
    );
  }

  const transaction = {
    id: crypto.randomUUID(),
    organization_id: actualTenantId,
    transaction_type: transactionType,
    external_id: external_id,
    status: initialStatus,
    attributes: transactionData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  logger.info(
    `📝 ECA - Criando transação ${transactionType} com status: ${initialStatus}`
  );
  if (external_id) {
    logger.info(`🔑 ECA - External ID: ${external_id}`);
  }

  const { data, error } = await supabase
    .from("tenant_business_transactions")
    .insert(transaction)
    .select();

  logger.debug(`[createECABusinessTransaction] Resultado do INSERT: data=${JSON.stringify(data)}, error=${JSON.stringify(error)}`);

  if (error) {
    logger.error(
      "❌ ECA - Erro na criação da transação:",
      JSON.stringify(error, null, 2)
    );
    throw new Error(`Erro ao criar transação ECA: ${error.message}`);
  }

  if (!data || data.length === 0) {
    logger.error(`❌ ECA - Falha ao criar transação ${transactionType}`);
    throw new Error(`Falha ao criar transação ${transactionType}`);
  }

  logger.info(
    `✅ ECA - Transação ${transactionType} criada com sucesso:`,
    data[0].id
  );
  return data[0] as ECABusinessTransaction;
}

/**
 * Função ECA para atualizar estado de transação com validação de máquina de estados
 */
export async function transitionECATransactionState(
  transactionId: string,
  newStatus: BusinessState,
  additionalAttributes: Record<string, any> = {},
  organizationId?: string
): Promise<ECABusinessTransaction> {
  const actualTenantId = organizationId || BANBAN_ORG_ID;

  // Buscar transação atual
  const { data: transactions, error: fetchError } = await supabase
    .from("tenant_business_transactions")
    .select("*")
    .eq("id", transactionId)
    .eq("organization_id", actualTenantId)
    .limit(1);

  const currentTransaction =
    transactions && transactions.length > 0 ? transactions[0] : null;

  if (fetchError || !currentTransaction) {
    // Tentar novamente uma vez antes de falhar
    if (fetchError?.message?.includes("fetch failed")) {
      console.warn(
        `⚠️ Problema de conectividade detectado, tentando novamente...`
      );

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Aguardar 1s

        const { data: retryTransactions, error: retryError } = await supabase
          .from("tenant_business_transactions")
          .select("*")
          .eq("id", transactionId)
          .eq("organization_id", actualTenantId)
          .limit(1);

        const retryTransaction =
          retryTransactions && retryTransactions.length > 0
            ? retryTransactions[0]
            : null;

        if (!retryError && retryTransaction) {
          console.log(`✅ Reconectado com sucesso na segunda tentativa`);
          // Continuar com a transação encontrada na retry
          const transaction = retryTransaction as ECABusinessTransaction;

          // Continuar o resto da lógica normal...
          if (
            !stateMachine.canTransition(
              transaction.transaction_type,
              transaction.status,
              newStatus
            )
          ) {
            throw new Error(
              `Transição inválida de '${transaction.status}' para '${newStatus}' ` +
                `no tipo '${transaction.transaction_type}'`
            );
          }

          // Atualizar transação
          const updatedTransaction = {
            status: newStatus,
            attributes: {
              ...transaction.attributes,
              ...additionalAttributes,
              state_history: [
                ...(transaction.attributes.state_history || []),
                {
                  from: transaction.status,
                  to: newStatus,
                  transitioned_at: new Date().toISOString(),
                  attributes: additionalAttributes,
                },
              ],
            },
            updated_at: new Date().toISOString(),
          };

          logger.info(
            `🔄 ECA - Transição de estado: ${transaction.status} -> ${newStatus}`
          );

          const { data, error } = await supabase
            .from("tenant_business_transactions")
            .update(updatedTransaction)
            .eq("id", transactionId)
            .eq("organization_id", actualTenantId)
            .select();

          if (error) {
            logger.error(
              "❌ ECA - Erro na transição de estado:",
              JSON.stringify(error, null, 2)
            );
            throw new Error(
              `Erro ao atualizar estado da transação: ${error.message}`
            );
          }

          if (!data || data.length === 0) {
            throw new Error(`Falha ao atualizar transação ${transactionId}`);
          }

          logger.info(
            `✅ ECA - Estado atualizado com sucesso para: ${newStatus}`
          );
          return data[0] as ECABusinessTransaction;
        }
      } catch (retryErr) {
        console.error(`❌ Falha na segunda tentativa:`, retryErr);
      }
    }

    throw new Error(`Transação não encontrada: ${transactionId}`);
  }

  const transaction = currentTransaction as ECABusinessTransaction;

  // Validar transição de estado
  if (
    !stateMachine.canTransition(
      transaction.transaction_type,
      transaction.status,
      newStatus
    )
  ) {
    throw new Error(
      `Transição inválida de '${transaction.status}' para '${newStatus}' ` +
        `no tipo '${transaction.transaction_type}'`
    );
  }

  // Atualizar transação
  const updatedTransaction = {
    status: newStatus,
    attributes: {
      ...transaction.attributes,
      ...additionalAttributes,
      state_history: [
        ...(transaction.attributes.state_history || []),
        {
          from: transaction.status,
          to: newStatus,
          transitioned_at: new Date().toISOString(),
          attributes: additionalAttributes,
        },
      ],
    },
    updated_at: new Date().toISOString(),
  };

  logger.info(
    `🔄 ECA - Transição de estado: ${transaction.status} -> ${newStatus}`
  );

  const { data, error } = await supabase
    .from("tenant_business_transactions")
    .update(updatedTransaction)
    .eq("id", transactionId)
    .eq("organization_id", actualTenantId)
    .select();

  if (error) {
    logger.error(
      "❌ ECA - Erro na transição de estado:",
      JSON.stringify(error, null, 2)
    );
    throw new Error(`Erro ao atualizar estado da transação: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(`Falha ao atualizar transação ${transactionId}`);
  }

  logger.info(`✅ ECA - Estado atualizado com sucesso para: ${newStatus}`);
  return data[0] as ECABusinessTransaction;
}

/**
 * Função ECA para buscar transação por external_id e tipo
 */
export async function getECATransactionByExternalId(
  transactionType: TransactionType,
  external_id: string,
  organizationId?: string
): Promise<ECABusinessTransaction | null> {
  const actualTenantId = organizationId || BANBAN_ORG_ID;

  logger.info(
    `DEBUG: Buscando transação com organization_id: ${actualTenantId}, transaction_type: ${String(transactionType)}, external_id: ${String(external_id)}`
  );

  const { data: transactions, error } = await supabase
    .from("tenant_business_transactions")
    .select("*")
    .eq("organization_id", actualTenantId)
    .eq("transaction_type", transactionType)
    .eq("external_id", external_id)
    .is("deleted_at", null)
    .limit(1);

  if (error) {
    logger.error(`DEBUG: Erro ao buscar transação ECA:`, error);

    // FORÇAR ERRO: Não usar fallback mock - problema de conectividade deve ser resolvido
    if (error.message?.includes("fetch failed")) {
      console.error(
        `❌ CONECTIVIDADE: Problema de rede detectado ao buscar ${transactionType}/${external_id}`
      );
      console.error(
        `💡 SOLUÇÃO: Configure corretamente a conectividade de rede do container`
      );
      console.error(`🔍 DEBUG: Error details:`, error);
    }

    throw new Error(`Erro ao buscar transação ECA: ${error.message}`);
  }

  // Se não encontrou nenhuma transação, retornar null
  if (!transactions || transactions.length === 0) {
    logger.info(
      `DEBUG: Transação não encontrada para organization_id: ${actualTenantId}, transaction_type: ${String(transactionType)}, external_id: ${String(external_id)}`
    );
    return null;
  }

  // Se encontrou múltiplas, usar a primeira
  if (transactions.length > 1) {
    console.warn(
      `⚠️ Múltiplas transações encontradas para ${transactionType}/${external_id}. Usando a primeira.`
    );
  }

  logger.info(`DEBUG: Transação encontrada:`, transactions[0]);
  return transactions[0] as ECABusinessTransaction;
}

/**
 * Função LEGACY para criar transação de negócio
 * @deprecated Use createECABusinessTransaction
 */
export async function createBusinessTransaction(
  organizationId: string,
  transactionType: string,
  externalId: string | null,
  transactionData: Record<string, any>
): Promise<BusinessTransaction> {
  const status = transactionData.status || "PENDENTE";

  logger.debug(`[createBusinessTransaction] Chamando createECABusinessTransaction com: organizationId=${organizationId}, transactionType=${transactionType}, externalId=${externalId}, status=${status}, transactionData=${JSON.stringify(transactionData)}`);
  try {
    // Converter para tipos ECA e chamar nova função
    const ecaTransaction = await createECABusinessTransaction(
      transactionType as TransactionType,
      externalId,
      status as BusinessState,
      transactionData,
      organizationId || BANBAN_ORG_ID
    );
    logger.debug(`[createBusinessTransaction] ecaTransaction retornado: ${JSON.stringify(ecaTransaction)}`);

    // Converter de volta para interface legacy
    return {
      id: ecaTransaction.id,
      organization_id: ecaTransaction.organization_id,
      transaction_type: ecaTransaction.transaction_type,
      external_id: ecaTransaction.external_id,
      status: ecaTransaction.status,
      attributes: ecaTransaction.attributes,
      created_at: ecaTransaction.created_at,
      updated_at: ecaTransaction.updated_at,
      deleted_at: ecaTransaction.deleted_at,
    };
  } catch (error) {
    logger.error(`❌ [createBusinessTransaction] Erro ao criar transação:`, error);
    throw error;
  }
}

/**
 * Função LEGACY para buscar entidade por ID
 * @deprecated Use getECAEntityByExternalId ou busque diretamente por external_id
 */
export async function getBusinessEntityById(
  organizationId: string,
  entityId: string
): Promise<BusinessEntity | null> {
  const { data: entities, error } = await supabase
    .from("tenant_business_entities")
    .select("*")
    .eq("organization_id", organizationId || BANBAN_ORG_ID) // Atualizado para organization_id
    .eq("id", entityId)
    .is("deleted_at", null)
    .limit(1);

  if (error) {
    throw new Error(`Erro ao buscar entidade: ${error.message}`);
  }

  if (!entities || entities.length === 0) {
    return null;
  }

  const data = entities[0];

  // Converter para interface legacy
  return {
    id: data.id,
    organization_id: data.organization_id,
    entity_type: data.entity_type,
    external_id: data.external_id,
    attributes: data.attributes,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

// ================================================
// PROCESSAMENTO DE AÇÕES ECA
// ================================================

/**
 * Função principal para processar ações ECA
 * Implementa a lógica Event-Condition-Action conforme ECA.md
 */
export async function processECAAction(
  action: BusinessAction,
  attributes: Record<string, any>,
  metadata: Record<string, any> = {},
  organizationId?: string
): Promise<ECAWebhookResponse> {
  const startTime = Date.now();
  const eventUuid = crypto.randomUUID();
  const actualTenantId = organizationId || BANBAN_ORG_ID;

  logger.info(`🎡 ECA - Iniciando ação: ${action}`);

  try {
    // Determinar tipo de transação e estado alvo
    const transactionType = ACTION_TO_TRANSACTION_TYPE[
      action as keyof typeof ACTION_TO_TRANSACTION_TYPE
    ] as TransactionType;
    const targetState = ACTION_TO_TARGET_STATE[
      action as keyof typeof ACTION_TO_TARGET_STATE
    ] as BusinessState;

    if (!transactionType || !targetState) {
      throw new Error(`Ação '${action}' não mapeada no sistema ECA`);
    }

    let transactionId: string;
    const entityIds: string[] = [];
    const relationshipIds: string[] = [];
    let stateTransition: { from: BusinessState; to: BusinessState } | undefined;

    // Processar baseado no external_id se fornecido
    if (attributes.external_id) {
      // Buscar transação existente
      const existingTransaction = await getECATransactionByExternalId(
        transactionType,
        attributes.external_id,
        actualTenantId
      );

      if (existingTransaction) {
        // Transação existe - fazer transição de estado
        const fromState = existingTransaction.status;
        const updatedTransaction = await transitionECATransactionState(
          existingTransaction.id,
          targetState,
          attributes,
          actualTenantId
        );

        transactionId = updatedTransaction.id;
        stateTransition = { from: fromState, to: targetState };
      } else {
        // Transação não existe - criar nova
        const newTransaction = await createECABusinessTransaction(
          transactionType,
          attributes.external_id,
          targetState,
          attributes,
          actualTenantId
        );

        transactionId = newTransaction.id;
      }
    } else {
      // Criar nova transação sem external_id (movimento interno)
      const newTransaction = await createECABusinessTransaction(
        transactionType,
        null,
        targetState,
        attributes,
        actualTenantId
      );

      transactionId = newTransaction.id;
    }

    // Processar entidades relacionadas (produtos, fornecedores, locais)
    if (attributes.items) {
      for (const item of attributes.items) {
        if (item.product_id) {
          // Garantir que produto existe
          let product = await getECAEntityByExternalId(
            "PRODUCT",
            item.product_id,
            actualTenantId
          );
          if (!product) {
            product = await upsertECABusinessEntity(
              "PRODUCT",
              item.product_id,
              { name: item.product_name || item.product_id },
              undefined,
              actualTenantId
            );
          }
          entityIds.push(product.id);

          // Criar relacionamento item
          const relationship = await createECABusinessRelationship(
            "CONTAINS_ITEM",
            transactionId,
            product.id,
            {
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
            },
            actualTenantId
          );
          relationshipIds.push(relationship.id);
        }
      }
    }

    // Processar locais
    if (
      attributes.location_id ||
      attributes.origin_location_external_id ||
      attributes.destination_location_external_id
    ) {
      const locationIds = [
        attributes.location_id,
        attributes.origin_location_external_id,
        attributes.destination_location_external_id,
      ].filter(Boolean);

      for (const locationId of locationIds) {
        let location = await getECAEntityByExternalId(
          "LOCATION",
          locationId,
          actualTenantId
        );
        if (!location) {
          location = await upsertECABusinessEntity(
            "LOCATION",
            locationId,
            { name: locationId },
            undefined,
            actualTenantId
          );
        }
        entityIds.push(location.id);

        // Criar relacionamento local
        const relationship = await createECABusinessRelationship(
          "AT_LOCATION",
          transactionId,
          location.id,
          {},
          actualTenantId
        );
        relationshipIds.push(relationship.id);
      }
    }

    // Processar fornecedores
    if (attributes.supplier_code) {
      let supplier = await getECAEntityByExternalId(
        "SUPPLIER",
        attributes.supplier_code,
        actualTenantId
      );
      if (!supplier) {
        supplier = await upsertECABusinessEntity(
          "SUPPLIER",
          attributes.supplier_code,
          { name: attributes.supplier_name || attributes.supplier_code },
          undefined,
          actualTenantId
        );
      }
      entityIds.push(supplier.id);

      // Criar relacionamento fornecedor
      const relationship = await createECABusinessRelationship(
        "FROM_SUPPLIER",
        transactionId,
        supplier.id,
        {},
        actualTenantId
      );
      relationshipIds.push(relationship.id);
    }

    const processingTime = Date.now() - startTime;

    logger.info(
      `✅ ECA - Ação ${action} processada com sucesso em ${processingTime}ms`
    );

    return {
      success: true,
      action,
      transaction_id: transactionId,
      entity_ids: entityIds,
      relationship_ids: relationshipIds,
      state_transition: stateTransition,
      attributes: {
        success: true,
        entityType: transactionType,
        entityId: transactionId,
        summary: {
          message: `Ação ${action} executada com sucesso`,
          records_processed: 1 + entityIds.length + relationshipIds.length,
          records_successful: 1 + entityIds.length + relationshipIds.length,
          records_failed: 0,
        },
      },
      metadata: {
        processed_at: new Date().toISOString(),
        processing_time_ms: processingTime,
        organization_id: actualTenantId,
        action,
        event_uuid: eventUuid,
      },
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;

    logger.error(`❌ ECA - Erro ao processar ação ${action}:`, error);

    return {
      success: false,
      action,
      attributes: {
        success: false,
        summary: {
          message: `Erro ao executar ação ${action}: ${(error as Error).message}`,
          records_processed: 0,
          records_successful: 0,
          records_failed: 1,
        },
      },
      metadata: {
        processed_at: new Date().toISOString(),
        processing_time_ms: processingTime,
        organization_id: actualTenantId,
        action,
        event_uuid: eventUuid,
      },
    };
  }
}

// ================================================
// VALIDAÇÃO DE WEBHOOKS
// ================================================

/**
 * Função para validar payload do webhook ECA
 */
export function validateECAWebhookPayload(payload: any): ECAWebhookPayload {
  if (!payload) {
    throw new Error("Payload não pode ser vazio");
  }

  if (!payload.action) {
    throw new Error("action é obrigatório");
  }

  if (!payload.attributes) {
    throw new Error("attributes é obrigatório");
  }

  // Validar se a ação é válida
  if (
    !ACTION_TO_TRANSACTION_TYPE[
      payload.action as keyof typeof ACTION_TO_TRANSACTION_TYPE
    ]
  ) {
    throw new Error(`Ação '${payload.action}' não é válida`);
  }

  return {
    action: payload.action,
    attributes: payload.attributes,
    metadata: payload.metadata || {},
  };
}

/**
 * Função LEGACY para validar payload do webhook
 * @deprecated Use validateECAWebhookPayload
 */
export function validateWebhookPayload(payload: any): void {
  validateECAWebhookPayload(payload);
}

// Função para gerar resposta de erro
export function generateErrorResponse(error: Error, eventType: string) {
  logger.error(`❌ Erro ao processar ${eventType}:`, error);

  return {
    success: false,
    error: error.message,
    event_type: eventType,
  };
}

// Função para gerar resposta de sucesso
export function generateSuccessResponse(
  eventType: string,
  result: any,
  flowSummary: any
) {
  return {
    success: true,
    event_type: eventType,
    result,
    flow_summary: flowSummary,
  };
}

// Middleware de autenticação para webhooks
export function webhookAuthMiddleware(secretToken: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    if (token !== secretToken) {
      return reply.code(401).send({ error: "Invalid token" });
    }
  };
}

// ================================================
// EXPORTAÇÕES
// ================================================

// Exportar tipos ECA
export type {
  TenantData,
  ECABusinessEntity,
  ECABusinessRelationship,
  ECABusinessTransaction,
  ECAWebhookPayload,
  ECAWebhookResponse,
  // Legacy types (deprecated)
  BusinessEntity,
  BusinessRelationship,
  BusinessTransaction,
};

// Exportar instância do Supabase
export { supabase };

// Exportar classe da máquina de estados
export { ECAStateMachine };

// Exportar instância global da máquina de estados
export { stateMachine as ecaStateMachine };

// Re-exportar enums para conveniência
export {
  ENTITY_TYPES,
  TRANSACTION_TYPES,
  RELATIONSHIP_TYPES,
  BANBAN_ORG_ID,
} from "@shared/enums";
