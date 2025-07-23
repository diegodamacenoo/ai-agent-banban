import { FastifyRequest, FastifyReply } from "fastify";
import { SupabaseClient } from "@supabase/supabase-js";
import { EntityType, TransactionType, RelationshipType, BusinessState, BusinessAction } from "@shared/enums";
declare const supabase: SupabaseClient<any, "public", any>;
interface TenantData {
    organization_id: string;
    business_data: Record<string, any>;
}
interface ECABusinessEntity {
    id: string;
    organization_id: string;
    entity_type: EntityType;
    external_id: string;
    attributes: Record<string, any>;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}
interface ECABusinessRelationship {
    id: string;
    organization_id: string;
    source_id: string;
    target_id: string;
    relationship_type: RelationshipType;
    attributes: Record<string, any>;
    created_at?: string;
    deleted_at?: string | null;
}
interface ECABusinessTransaction {
    id: string;
    organization_id: string;
    transaction_type: TransactionType;
    external_id: string | null;
    status: BusinessState;
    attributes: Record<string, any>;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}
interface ECAWebhookPayload {
    action: BusinessAction;
    attributes: Record<string, any>;
    metadata?: Record<string, any>;
}
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
interface BusinessEntity extends Omit<ECABusinessEntity, "organization_id" | "entity_type"> {
    organization_id: string;
    entity_type: string;
}
interface BusinessRelationship extends Omit<ECABusinessRelationship, "organization_id" | "relationship_type"> {
    organization_id: string;
    relationship_type: string;
    updated_at?: string;
}
interface BusinessTransaction extends Omit<ECABusinessTransaction, "organization_id" | "transaction_type" | "status"> {
    organization_id: string;
    transaction_type: string;
    status: string;
}
export declare function logWebhookEvent(flow: string, eventType: string, payload: any, status: "success" | "error" | "pending", responseData?: any, errorMessage?: any, processingTimeMs?: number): Promise<void>;
declare class ECAStateMachine {
    private transitions;
    constructor();
    private initializeTransitions;
    canTransition(transactionType: TransactionType, fromState: BusinessState, toState: BusinessState): boolean;
    getNextStates(transactionType: TransactionType, currentState: BusinessState): BusinessState[];
}
declare const stateMachine: ECAStateMachine;
export declare function validateAndGetTenant(organizationId?: string): Promise<TenantData>;
export declare function upsertECABusinessEntity(entityType: EntityType, external_id: string, businessData: Record<string, any>, entityId?: string, organizationId?: string): Promise<ECABusinessEntity>;
export declare function getECAEntityByExternalId(entityType: EntityType, external_id: string, organizationId?: string): Promise<ECABusinessEntity | null>;
export declare function upsertBusinessEntity(organizationId: string, entityType: string, businessData: Record<string, any>, entityId?: string): Promise<BusinessEntity>;
export declare function createECABusinessRelationship(relationshipType: RelationshipType, sourceId: string, targetId: string, attributes?: Record<string, any>, organizationId?: string): Promise<ECABusinessRelationship>;
export declare function createBusinessRelationship(organizationId: string, relationshipType: string, sourceId: string, targetId: string, attributes: Record<string, any>): Promise<BusinessRelationship>;
export declare function createECABusinessTransaction(transactionType: TransactionType, external_id: string | null, initialStatus: BusinessState, transactionData: Record<string, any>, organizationId?: string): Promise<ECABusinessTransaction>;
export declare function transitionECATransactionState(transactionId: string, newStatus: BusinessState, additionalAttributes?: Record<string, any>, organizationId?: string): Promise<ECABusinessTransaction>;
export declare function getECATransactionByExternalId(transactionType: TransactionType, external_id: string, organizationId?: string): Promise<ECABusinessTransaction | null>;
export declare function createBusinessTransaction(organizationId: string, transactionType: string, externalId: string | null, transactionData: Record<string, any>): Promise<BusinessTransaction>;
export declare function getBusinessEntityById(organizationId: string, entityId: string): Promise<BusinessEntity | null>;
export declare function processECAAction(action: BusinessAction, attributes: Record<string, any>, metadata?: Record<string, any>, organizationId?: string): Promise<ECAWebhookResponse>;
export declare function validateECAWebhookPayload(payload: any): ECAWebhookPayload;
export declare function validateWebhookPayload(payload: any): void;
export declare function generateErrorResponse(error: Error, eventType: string): {
    success: boolean;
    error: string;
    event_type: string;
};
export declare function generateSuccessResponse(eventType: string, result: any, flowSummary: any): {
    success: boolean;
    event_type: string;
    result: any;
    flow_summary: any;
};
export declare function webhookAuthMiddleware(secretToken: string): (request: FastifyRequest, reply: FastifyReply) => Promise<undefined>;
export type { TenantData, ECABusinessEntity, ECABusinessRelationship, ECABusinessTransaction, ECAWebhookPayload, ECAWebhookResponse, BusinessEntity, BusinessRelationship, BusinessTransaction, };
export { supabase };
export { ECAStateMachine };
export { stateMachine as ecaStateMachine };
export { ENTITY_TYPES, TRANSACTION_TYPES, RELATIONSHIP_TYPES, BANBAN_ORG_ID, } from "@shared/enums";
//# sourceMappingURL=index.d.ts.map