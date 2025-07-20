"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BANBAN_ORG_ID = exports.RELATIONSHIP_TYPES = exports.TRANSACTION_TYPES = exports.ENTITY_TYPES = exports.ecaStateMachine = exports.ECAStateMachine = exports.supabase = void 0;
exports.logWebhookEvent = logWebhookEvent;
exports.validateAndGetTenant = validateAndGetTenant;
exports.upsertECABusinessEntity = upsertECABusinessEntity;
exports.getECAEntityByExternalId = getECAEntityByExternalId;
exports.upsertBusinessEntity = upsertBusinessEntity;
exports.createECABusinessRelationship = createECABusinessRelationship;
exports.createBusinessRelationship = createBusinessRelationship;
exports.createECABusinessTransaction = createECABusinessTransaction;
exports.transitionECATransactionState = transitionECATransactionState;
exports.getECATransactionByExternalId = getECATransactionByExternalId;
exports.createBusinessTransaction = createBusinessTransaction;
exports.getBusinessEntityById = getBusinessEntityById;
exports.processECAAction = processECAAction;
exports.validateECAWebhookPayload = validateECAWebhookPayload;
exports.validateWebhookPayload = validateWebhookPayload;
exports.generateErrorResponse = generateErrorResponse;
exports.generateSuccessResponse = generateSuccessResponse;
exports.webhookAuthMiddleware = webhookAuthMiddleware;
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = require("../../utils/logger");
const enums_1 = require("@shared/enums");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
    global: {
        fetch: (...args) => {
            return fetch(args[0], {
                ...args[1],
                signal: AbortSignal.timeout(15000),
            });
        },
    },
});
exports.supabase = supabase;
const devTransactionCache = new Map();
async function logWebhookEvent(flow, eventType, payload, status, responseData, errorMessage, processingTimeMs) {
    try {
        let errorToLog;
        if (errorMessage instanceof Error) {
            errorToLog = errorMessage.message;
        }
        else if (typeof errorMessage === "string") {
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
            if (process.env.NODE_ENV === "development") {
                console.log(`📝 [DEV-LOG] ${flow}/${eventType} - ${status} (${processingTimeMs}ms)`);
                if (errorToLog)
                    console.log(`📝 [DEV-ERROR] ${errorToLog}`);
            }
        }
        else {
            console.log(`📝 Log de webhook gravado: ${flow}/${eventType} - ${status}`);
        }
    }
    catch (logError) {
        console.error("❌ Erro crítico ao gravar log:", logError);
        if (process.env.NODE_ENV === "development") {
            console.log(`📝 [DEV-FALLBACK] ${flow}/${eventType} - ${status} (${processingTimeMs}ms)`);
        }
    }
}
class ECAStateMachine {
    constructor() {
        this.transitions = new Map();
        this.initializeTransitions();
    }
    initializeTransitions() {
        this.transitions.set("ORDER_PURCHASE", new Map([
            ["PENDENTE", ["APPROVED", "PRE_BAIXA"]],
            ["APPROVED", ["PRE_BAIXA"]]
        ]));
        this.transitions.set("DOCUMENT_SUPPLIER_IN", new Map([
            [
                "PRE_BAIXA",
                ["AGUARDANDO_CONFERENCIA_CD"],
            ],
            [
                "AGUARDANDO_CONFERENCIA_CD",
                ["EM_CONFERENCIA_CD"],
            ],
            [
                "EM_CONFERENCIA_CD",
                [
                    "CONFERENCIA_CD_SEM_DIVERGENCIA",
                    "CONFERENCIA_CD_COM_DIVERGENCIA",
                ],
            ],
            [
                "CONFERENCIA_CD_SEM_DIVERGENCIA",
                [
                    "EFETIVADO_CD",
                    "CONFERENCIA_CD_COM_DIVERGENCIA",
                ],
            ],
            [
                "CONFERENCIA_CD_COM_DIVERGENCIA",
                [
                    "EFETIVADO_CD",
                    "CONFERENCIA_CD_SEM_DIVERGENCIA",
                ],
            ],
        ]));
        this.transitions.set("TRANSFER_OUT", new Map([
            [
                "PEDIDO_TRANSFERENCIA_CRIADO",
                ["MAPA_SEPARACAO_CRIADO"],
            ],
            [
                "MAPA_SEPARACAO_CRIADO",
                ["AGUARDANDO_SEPARACAO_CD"],
            ],
            [
                "AGUARDANDO_SEPARACAO_CD",
                ["EM_SEPARACAO_CD"],
            ],
            [
                "EM_SEPARACAO_CD",
                [
                    "SEPARACAO_CD_SEM_DIVERGENCIA",
                    "SEPARACAO_CD_COM_DIVERGENCIA",
                ],
            ],
            [
                "SEPARACAO_CD_SEM_DIVERGENCIA",
                ["SEPARADO_PRE_DOCA"],
            ],
            [
                "SEPARACAO_CD_COM_DIVERGENCIA",
                ["SEPARADO_PRE_DOCA"],
            ],
            [
                "SEPARADO_PRE_DOCA",
                ["EMBARCADO_CD"],
            ],
            [
                "EMBARCADO_CD",
                ["TRANSFERENCIA_CDH_FATURADA"],
            ],
        ]));
        this.transitions.set("TRANSFER_IN", new Map([
            [
                "AGUARDANDO_CONFERENCIA_LOJA",
                ["EM_CONFERENCIA_LOJA"],
            ],
            [
                "EM_CONFERENCIA_LOJA",
                [
                    "CONFERENCIA_LOJA_SEM_DIVERGENCIA",
                    "CONFERENCIA_LOJA_COM_DIVERGENCIA",
                ],
            ],
            [
                "CONFERENCIA_LOJA_SEM_DIVERGENCIA",
                ["EFETIVADO_LOJA"],
            ],
            [
                "CONFERENCIA_LOJA_COM_DIVERGENCIA",
                ["EFETIVADO_LOJA"],
            ],
        ]));
        this.transitions.set("DOCUMENT_SALE", new Map([]));
        this.transitions.set("DOCUMENT_RETURN", new Map([
            [
                "DEVOLUCAO_AGUARDANDO",
                ["DEVOLUCAO_CONCLUIDA"],
            ],
            [
                "DEVOLUCAO_CONCLUIDA",
                ["TRANSFERENCIA_ENTRE_LOJAS"],
            ],
        ]));
        this.transitions.set("INVENTORY_MOVEMENT", new Map([
            [
                "MOVIMENTO_PENDENTE",
                [
                    "MOVIMENTO_EXECUTADO",
                    "MOVIMENTO_CANCELADO",
                ],
            ],
        ]));
    }
    canTransition(transactionType, fromState, toState) {
        const typeTransitions = this.transitions.get(transactionType);
        if (!typeTransitions)
            return false;
        const allowedStates = typeTransitions.get(fromState);
        return allowedStates?.includes(toState) || false;
    }
    getNextStates(transactionType, currentState) {
        const typeTransitions = this.transitions.get(transactionType);
        return typeTransitions?.get(currentState) || [];
    }
}
exports.ECAStateMachine = ECAStateMachine;
const stateMachine = new ECAStateMachine();
exports.ecaStateMachine = stateMachine;
async function validateAndGetTenant(organizationId) {
    const tenantId = organizationId || enums_1.BANBAN_ORG_ID;
    try {
        const { data: orgs, error } = await supabase
            .from("organizations")
            .select("id, slug, company_trading_name")
            .eq("id", tenantId)
            .limit(1);
        const org = orgs && orgs.length > 0 ? orgs[0] : null;
        if (error) {
            console.error("[validateAndGetTenant] Erro Supabase:", error);
            console.log("[validateAndGetTenant] NODE_ENV:", process.env.NODE_ENV);
            console.log("[validateAndGetTenant] Error message includes fetch failed:", error.message?.includes("fetch failed"));
            if (process.env.NODE_ENV === "development" ||
                error.message?.includes("fetch failed")) {
                console.warn("[validateAndGetTenant] 🚧 MODO DESENVOLVIMENTO: Usando dados mock para tenant - considere configurar Supabase");
                return {
                    organization_id: tenantId,
                    business_data: {
                        slug: "banban-dev",
                        company_trading_name: "BanBan Footwear (Dev Mode - Configure Supabase para produção)",
                    },
                };
            }
            throw new Error(`Erro ao conectar com banco de dados: ${error.message}`);
        }
        if (!org) {
            throw new Error(`Organização não encontrada para organization_id: ${tenantId}`);
        }
        return {
            organization_id: tenantId,
            business_data: {
                slug: org.slug,
                company_trading_name: org.company_trading_name,
            },
        };
    }
    catch (error) {
        console.error("[validateAndGetTenant] Erro durante validação:", error);
        console.log("[validateAndGetTenant] CATCH - NODE_ENV:", process.env.NODE_ENV);
        console.log("[validateAndGetTenant] CATCH - Error message:", error.message);
        if (process.env.NODE_ENV === "development" ||
            error.message?.includes("fetch failed")) {
            console.warn("[validateAndGetTenant] 🚧 MODO DESENVOLVIMENTO: Usando dados mock devido a erro de conectividade - configure Supabase para produção");
            return {
                organization_id: tenantId,
                business_data: {
                    slug: "banban-dev",
                    company_trading_name: "BanBan Footwear (Dev Mode - Configure Supabase)",
                },
            };
        }
        throw error;
    }
}
async function upsertECABusinessEntity(entityType, external_id, businessData, entityId, organizationId) {
    const actualTenantId = organizationId || enums_1.BANBAN_ORG_ID;
    const entity = {
        id: entityId || crypto.randomUUID(),
        organization_id: actualTenantId,
        entity_type: entityType,
        external_id: external_id,
        attributes: businessData,
        created_at: undefined,
        updated_at: new Date().toISOString(),
    };
    if (entityId) {
        const { data, error } = await supabase
            .from("tenant_business_entities")
            .update(entity)
            .eq("id", entityId)
            .eq("organization_id", actualTenantId)
            .select();
        logger_1.logger.debug(`[upsertECABusinessEntity] Resultado do UPDATE: data=${JSON.stringify(data)}, error=${JSON.stringify(error)}`);
        if (error) {
            logger_1.logger.error("❌ ECA - Erro ao atualizar entidade:", JSON.stringify(error, null, 2));
            throw new Error(`Erro ao atualizar entidade ECA: ${error.message}`);
        }
        if (!data || data.length === 0) {
            logger_1.logger.error(`❌ ECA - Entidade não encontrada para atualização: ${entityId}`);
            throw new Error(`Entidade não encontrada para atualização: ${entityId}`);
        }
        logger_1.logger.info(`✅ ECA - Entidade ${entityType} atualizada com sucesso:`, data[0].id);
        return data[0];
    }
    else {
        entity.created_at = new Date().toISOString();
        logger_1.logger.info(`🔍 ECA - Criando entidade ${entityType} com external_id: ${external_id}`);
        const { data, error } = await supabase
            .from("tenant_business_entities")
            .insert(entity)
            .select();
        logger_1.logger.debug(`[upsertECABusinessEntity] Resultado do INSERT: data=${JSON.stringify(data)}, error=${JSON.stringify(error)}`);
        if (error) {
            logger_1.logger.error("❌ ECA - Erro na criação da entidade:", JSON.stringify(error, null, 2));
            throw new Error(`Erro ao criar entidade ECA: ${error.message}`);
        }
        if (!data || data.length === 0) {
            logger_1.logger.error(`❌ ECA - Falha ao criar entidade ${entityType}`);
            throw new Error(`Falha ao criar entidade ${entityType}`);
        }
        logger_1.logger.info(`✅ ECA - Entidade ${entityType} criada com sucesso:`, data[0].id);
        return data[0];
    }
}
async function getECAEntityByExternalId(entityType, external_id, organizationId) {
    const actualTenantId = organizationId || enums_1.BANBAN_ORG_ID;
    logger_1.logger.debug(`[getECAEntityByExternalId] Buscando entidade: entityType=${entityType}, external_id=${external_id}, organizationId=${actualTenantId}`);
    const { data, error } = await supabase
        .from("tenant_business_entities")
        .select("*")
        .eq("organization_id", actualTenantId)
        .eq("entity_type", entityType)
        .eq("external_id", external_id)
        .is("deleted_at", null)
        .limit(1);
    logger_1.logger.debug(`[getECAEntityByExternalId] Resultado da busca: data=${JSON.stringify(data)}, error=${JSON.stringify(error)}`);
    if (error) {
        throw new Error(`Erro ao buscar entidade ECA: ${error.message}`);
    }
    if (!data || data.length === 0) {
        logger_1.logger.debug(`[getECAEntityByExternalId] Entidade não encontrada.`);
        return null;
    }
    if (data.length > 1) {
        console.warn(`⚠️ Múltiplas entidades encontradas para ${entityType}/${external_id}. Usando a primeira.`);
    }
    logger_1.logger.debug(`[getECAEntityByExternalId] Entidade encontrada: ${JSON.stringify(data[0])}`);
    return data[0];
}
async function upsertBusinessEntity(organizationId, entityType, businessData, entityId) {
    const ecaEntity = await upsertECABusinessEntity(entityType, businessData.external_id || entityId || crypto.randomUUID(), businessData, entityId, organizationId || enums_1.BANBAN_ORG_ID);
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
async function createECABusinessRelationship(relationshipType, sourceId, targetId, attributes = {}, organizationId) {
    const actualTenantId = organizationId || enums_1.BANBAN_ORG_ID;
    const relationship = {
        id: crypto.randomUUID(),
        organization_id: actualTenantId,
        relationship_type: relationshipType,
        source_id: sourceId,
        target_id: targetId,
        attributes: attributes,
        created_at: new Date().toISOString(),
    };
    logger_1.logger.info(`🔗 ECA - Criando relacionamento ${relationshipType}: ${sourceId} -> ${targetId}`);
    const { data, error } = await supabase
        .from("tenant_business_relationships")
        .insert(relationship)
        .select();
    logger_1.logger.debug(`[createECABusinessRelationship] Resultado do INSERT: data=${JSON.stringify(data)}, error=${JSON.stringify(error)}`);
    if (error) {
        logger_1.logger.error("❌ ECA - Erro na criação do relacionamento:", JSON.stringify(error, null, 2));
        throw new Error(`Erro ao criar relacionamento ECA: ${error.message}`);
    }
    if (!data || data.length === 0) {
        logger_1.logger.error(`❌ ECA - Falha ao criar relacionamento ${relationshipType}`);
        throw new Error(`Falha ao criar relacionamento ${relationshipType}`);
    }
    logger_1.logger.info(`✅ ECA - Relacionamento ${relationshipType} criado com sucesso:`, data[0].id);
    return data[0];
}
async function createBusinessRelationship(organizationId, relationshipType, sourceId, targetId, attributes) {
    logger_1.logger.debug(`[createBusinessRelationship] Chamando createECABusinessRelationship com: organizationId=${organizationId}, relationshipType=${relationshipType}, sourceId=${sourceId}, targetId=${targetId}, attributes=${JSON.stringify(attributes)}`);
    try {
        const ecaRelationship = await createECABusinessRelationship(relationshipType, sourceId, targetId, attributes, organizationId || enums_1.BANBAN_ORG_ID);
        logger_1.logger.debug(`[createBusinessRelationship] ecaRelationship retornado: ${JSON.stringify(ecaRelationship)}`);
        return {
            id: ecaRelationship.id,
            organization_id: ecaRelationship.organization_id,
            relationship_type: ecaRelationship.relationship_type,
            source_id: ecaRelationship.source_id,
            target_id: ecaRelationship.target_id,
            attributes: ecaRelationship.attributes,
            created_at: ecaRelationship.created_at,
            updated_at: ecaRelationship.created_at,
            deleted_at: ecaRelationship.deleted_at,
        };
    }
    catch (error) {
        logger_1.logger.error(`❌ [createBusinessRelationship] Erro ao criar relacionamento:`, error);
        throw error;
    }
}
async function createECABusinessTransaction(transactionType, external_id, initialStatus, transactionData, organizationId) {
    const actualTenantId = organizationId || enums_1.BANBAN_ORG_ID;
    if (!(0, enums_1.isValidStateForTransactionType)(transactionType, initialStatus)) {
        throw new Error(`Estado '${initialStatus}' não é válido para transação tipo '${transactionType}'`);
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
    logger_1.logger.info(`📝 ECA - Criando transação ${transactionType} com status: ${initialStatus}`);
    if (external_id) {
        logger_1.logger.info(`🔑 ECA - External ID: ${external_id}`);
    }
    const { data, error } = await supabase
        .from("tenant_business_transactions")
        .insert(transaction)
        .select();
    logger_1.logger.debug(`[createECABusinessTransaction] Resultado do INSERT: data=${JSON.stringify(data)}, error=${JSON.stringify(error)}`);
    if (error) {
        logger_1.logger.error("❌ ECA - Erro na criação da transação:", JSON.stringify(error, null, 2));
        throw new Error(`Erro ao criar transação ECA: ${error.message}`);
    }
    if (!data || data.length === 0) {
        logger_1.logger.error(`❌ ECA - Falha ao criar transação ${transactionType}`);
        throw new Error(`Falha ao criar transação ${transactionType}`);
    }
    logger_1.logger.info(`✅ ECA - Transação ${transactionType} criada com sucesso:`, data[0].id);
    return data[0];
}
async function transitionECATransactionState(transactionId, newStatus, additionalAttributes = {}, organizationId) {
    const actualTenantId = organizationId || enums_1.BANBAN_ORG_ID;
    const { data: transactions, error: fetchError } = await supabase
        .from("tenant_business_transactions")
        .select("*")
        .eq("id", transactionId)
        .eq("organization_id", actualTenantId)
        .limit(1);
    const currentTransaction = transactions && transactions.length > 0 ? transactions[0] : null;
    if (fetchError || !currentTransaction) {
        if (fetchError?.message?.includes("fetch failed")) {
            console.warn(`⚠️ Problema de conectividade detectado, tentando novamente...`);
            try {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                const { data: retryTransactions, error: retryError } = await supabase
                    .from("tenant_business_transactions")
                    .select("*")
                    .eq("id", transactionId)
                    .eq("organization_id", actualTenantId)
                    .limit(1);
                const retryTransaction = retryTransactions && retryTransactions.length > 0
                    ? retryTransactions[0]
                    : null;
                if (!retryError && retryTransaction) {
                    console.log(`✅ Reconectado com sucesso na segunda tentativa`);
                    const transaction = retryTransaction;
                    if (!stateMachine.canTransition(transaction.transaction_type, transaction.status, newStatus)) {
                        throw new Error(`Transição inválida de '${transaction.status}' para '${newStatus}' ` +
                            `no tipo '${transaction.transaction_type}'`);
                    }
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
                    logger_1.logger.info(`🔄 ECA - Transição de estado: ${transaction.status} -> ${newStatus}`);
                    const { data, error } = await supabase
                        .from("tenant_business_transactions")
                        .update(updatedTransaction)
                        .eq("id", transactionId)
                        .eq("organization_id", actualTenantId)
                        .select();
                    if (error) {
                        logger_1.logger.error("❌ ECA - Erro na transição de estado:", JSON.stringify(error, null, 2));
                        throw new Error(`Erro ao atualizar estado da transação: ${error.message}`);
                    }
                    if (!data || data.length === 0) {
                        throw new Error(`Falha ao atualizar transação ${transactionId}`);
                    }
                    logger_1.logger.info(`✅ ECA - Estado atualizado com sucesso para: ${newStatus}`);
                    return data[0];
                }
            }
            catch (retryErr) {
                console.error(`❌ Falha na segunda tentativa:`, retryErr);
            }
        }
        throw new Error(`Transação não encontrada: ${transactionId}`);
    }
    const transaction = currentTransaction;
    if (!stateMachine.canTransition(transaction.transaction_type, transaction.status, newStatus)) {
        throw new Error(`Transição inválida de '${transaction.status}' para '${newStatus}' ` +
            `no tipo '${transaction.transaction_type}'`);
    }
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
    logger_1.logger.info(`🔄 ECA - Transição de estado: ${transaction.status} -> ${newStatus}`);
    const { data, error } = await supabase
        .from("tenant_business_transactions")
        .update(updatedTransaction)
        .eq("id", transactionId)
        .eq("organization_id", actualTenantId)
        .select();
    if (error) {
        logger_1.logger.error("❌ ECA - Erro na transição de estado:", JSON.stringify(error, null, 2));
        throw new Error(`Erro ao atualizar estado da transação: ${error.message}`);
    }
    if (!data || data.length === 0) {
        throw new Error(`Falha ao atualizar transação ${transactionId}`);
    }
    logger_1.logger.info(`✅ ECA - Estado atualizado com sucesso para: ${newStatus}`);
    return data[0];
}
async function getECATransactionByExternalId(transactionType, external_id, organizationId) {
    const actualTenantId = organizationId || enums_1.BANBAN_ORG_ID;
    logger_1.logger.info(`DEBUG: Buscando transação com organization_id: ${actualTenantId}, transaction_type: ${String(transactionType)}, external_id: ${String(external_id)}`);
    const { data: transactions, error } = await supabase
        .from("tenant_business_transactions")
        .select("*")
        .eq("organization_id", actualTenantId)
        .eq("transaction_type", transactionType)
        .eq("external_id", external_id)
        .is("deleted_at", null)
        .limit(1);
    if (error) {
        logger_1.logger.error(`DEBUG: Erro ao buscar transação ECA:`, error);
        if (error.message?.includes("fetch failed")) {
            console.error(`❌ CONECTIVIDADE: Problema de rede detectado ao buscar ${transactionType}/${external_id}`);
            console.error(`💡 SOLUÇÃO: Configure corretamente a conectividade de rede do container`);
            console.error(`🔍 DEBUG: Error details:`, error);
        }
        throw new Error(`Erro ao buscar transação ECA: ${error.message}`);
    }
    if (!transactions || transactions.length === 0) {
        logger_1.logger.info(`DEBUG: Transação não encontrada para organization_id: ${actualTenantId}, transaction_type: ${String(transactionType)}, external_id: ${String(external_id)}`);
        return null;
    }
    if (transactions.length > 1) {
        console.warn(`⚠️ Múltiplas transações encontradas para ${transactionType}/${external_id}. Usando a primeira.`);
    }
    logger_1.logger.info(`DEBUG: Transação encontrada:`, transactions[0]);
    return transactions[0];
}
async function createBusinessTransaction(organizationId, transactionType, externalId, transactionData) {
    const status = transactionData.status || "PENDENTE";
    logger_1.logger.debug(`[createBusinessTransaction] Chamando createECABusinessTransaction com: organizationId=${organizationId}, transactionType=${transactionType}, externalId=${externalId}, status=${status}, transactionData=${JSON.stringify(transactionData)}`);
    try {
        const ecaTransaction = await createECABusinessTransaction(transactionType, externalId, status, transactionData, organizationId || enums_1.BANBAN_ORG_ID);
        logger_1.logger.debug(`[createBusinessTransaction] ecaTransaction retornado: ${JSON.stringify(ecaTransaction)}`);
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
    }
    catch (error) {
        logger_1.logger.error(`❌ [createBusinessTransaction] Erro ao criar transação:`, error);
        throw error;
    }
}
async function getBusinessEntityById(organizationId, entityId) {
    const { data: entities, error } = await supabase
        .from("tenant_business_entities")
        .select("*")
        .eq("organization_id", organizationId || enums_1.BANBAN_ORG_ID)
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
async function processECAAction(action, attributes, metadata = {}, organizationId) {
    const startTime = Date.now();
    const eventUuid = crypto.randomUUID();
    const actualTenantId = organizationId || enums_1.BANBAN_ORG_ID;
    logger_1.logger.info(`🎡 ECA - Iniciando ação: ${action}`);
    try {
        const transactionType = enums_1.ACTION_TO_TRANSACTION_TYPE[action];
        const targetState = enums_1.ACTION_TO_TARGET_STATE[action];
        if (!transactionType || !targetState) {
            throw new Error(`Ação '${action}' não mapeada no sistema ECA`);
        }
        let transactionId;
        const entityIds = [];
        const relationshipIds = [];
        let stateTransition;
        if (attributes.external_id) {
            const existingTransaction = await getECATransactionByExternalId(transactionType, attributes.external_id, actualTenantId);
            if (existingTransaction) {
                const fromState = existingTransaction.status;
                const updatedTransaction = await transitionECATransactionState(existingTransaction.id, targetState, attributes, actualTenantId);
                transactionId = updatedTransaction.id;
                stateTransition = { from: fromState, to: targetState };
            }
            else {
                const newTransaction = await createECABusinessTransaction(transactionType, attributes.external_id, targetState, attributes, actualTenantId);
                transactionId = newTransaction.id;
            }
        }
        else {
            const newTransaction = await createECABusinessTransaction(transactionType, null, targetState, attributes, actualTenantId);
            transactionId = newTransaction.id;
        }
        if (attributes.items) {
            for (const item of attributes.items) {
                if (item.product_id) {
                    let product = await getECAEntityByExternalId("PRODUCT", item.product_id, actualTenantId);
                    if (!product) {
                        product = await upsertECABusinessEntity("PRODUCT", item.product_id, { name: item.product_name || item.product_id }, undefined, actualTenantId);
                    }
                    entityIds.push(product.id);
                    const relationship = await createECABusinessRelationship("CONTAINS_ITEM", transactionId, product.id, {
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        total_price: item.total_price,
                    }, actualTenantId);
                    relationshipIds.push(relationship.id);
                }
            }
        }
        if (attributes.location_id ||
            attributes.origin_location_external_id ||
            attributes.destination_location_external_id) {
            const locationIds = [
                attributes.location_id,
                attributes.origin_location_external_id,
                attributes.destination_location_external_id,
            ].filter(Boolean);
            for (const locationId of locationIds) {
                let location = await getECAEntityByExternalId("LOCATION", locationId, actualTenantId);
                if (!location) {
                    location = await upsertECABusinessEntity("LOCATION", locationId, { name: locationId }, undefined, actualTenantId);
                }
                entityIds.push(location.id);
                const relationship = await createECABusinessRelationship("AT_LOCATION", transactionId, location.id, {}, actualTenantId);
                relationshipIds.push(relationship.id);
            }
        }
        if (attributes.supplier_code) {
            let supplier = await getECAEntityByExternalId("SUPPLIER", attributes.supplier_code, actualTenantId);
            if (!supplier) {
                supplier = await upsertECABusinessEntity("SUPPLIER", attributes.supplier_code, { name: attributes.supplier_name || attributes.supplier_code }, undefined, actualTenantId);
            }
            entityIds.push(supplier.id);
            const relationship = await createECABusinessRelationship("FROM_SUPPLIER", transactionId, supplier.id, {}, actualTenantId);
            relationshipIds.push(relationship.id);
        }
        const processingTime = Date.now() - startTime;
        logger_1.logger.info(`✅ ECA - Ação ${action} processada com sucesso em ${processingTime}ms`);
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
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        logger_1.logger.error(`❌ ECA - Erro ao processar ação ${action}:`, error);
        return {
            success: false,
            action,
            attributes: {
                success: false,
                summary: {
                    message: `Erro ao executar ação ${action}: ${error.message}`,
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
function validateECAWebhookPayload(payload) {
    if (!payload) {
        throw new Error("Payload não pode ser vazio");
    }
    if (!payload.action) {
        throw new Error("action é obrigatório");
    }
    if (!payload.attributes) {
        throw new Error("attributes é obrigatório");
    }
    if (!enums_1.ACTION_TO_TRANSACTION_TYPE[payload.action]) {
        throw new Error(`Ação '${payload.action}' não é válida`);
    }
    return {
        action: payload.action,
        attributes: payload.attributes,
        metadata: payload.metadata || {},
    };
}
function validateWebhookPayload(payload) {
    validateECAWebhookPayload(payload);
}
function generateErrorResponse(error, eventType) {
    logger_1.logger.error(`❌ Erro ao processar ${eventType}:`, error);
    return {
        success: false,
        error: error.message,
        event_type: eventType,
    };
}
function generateSuccessResponse(eventType, result, flowSummary) {
    return {
        success: true,
        event_type: eventType,
        result,
        flow_summary: flowSummary,
    };
}
function webhookAuthMiddleware(secretToken) {
    return async (request, reply) => {
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
var enums_2 = require("@shared/enums");
Object.defineProperty(exports, "ENTITY_TYPES", { enumerable: true, get: function () { return enums_2.ENTITY_TYPES; } });
Object.defineProperty(exports, "TRANSACTION_TYPES", { enumerable: true, get: function () { return enums_2.TRANSACTION_TYPES; } });
Object.defineProperty(exports, "RELATIONSHIP_TYPES", { enumerable: true, get: function () { return enums_2.RELATIONSHIP_TYPES; } });
Object.defineProperty(exports, "BANBAN_ORG_ID", { enumerable: true, get: function () { return enums_2.BANBAN_ORG_ID; } });
//# sourceMappingURL=index.js.map