declare const PURCHASE_ACTIONS: {
    readonly CREATE_ORDER: "create_order";
    readonly APPROVE_ORDER: "approve_order";
    readonly REGISTER_INVOICE: "register_invoice";
    readonly ARRIVE_AT_CD: "arrive_at_cd";
    readonly START_CONFERENCE: "start_conference";
    readonly SCAN_ITEMS: "scan_items";
    readonly EFFECTUATE_CD: "effectuate_cd";
};
type PurchaseAction = (typeof PURCHASE_ACTIONS)[keyof typeof PURCHASE_ACTIONS];
export declare class BanBanPurchaseFlowService {
    private supabase;
    constructor();
    processAction(action: PurchaseAction, transactionData: any, metadata?: any): Promise<{
        transaction_id: string;
        external_id: any;
        status: string;
    }>;
    getPurchaseData(queryParams: any): Promise<{
        success: boolean;
        data: {
            purchases: any;
            total: any;
            limit: any;
            offset: any;
        };
    }>;
    processPurchaseOrderCreated(data: any, organizationId: string): Promise<{
        transaction_id: string;
        external_id: any;
        status: string;
    }>;
    private _createOrder;
    private _getOrCreateBusinessEntity;
    private _getTransactionByExternalId;
    private _createBusinessEvent;
    private _updateInventorySnapshot;
    private _approveOrder;
    private _registerInvoice;
    private _arriveAtCD;
    private _startConference;
    private _scanItems;
    private _processItemInventoryMovement;
    private _effectuateCD;
}
export {};
//# sourceMappingURL=banban-purchase-flow-service.d.ts.map