declare const SALES_ACTIONS: {
    readonly REGISTER_SALE: "register_sale";
    readonly REGISTER_PAYMENT: "register_payment";
    readonly REGISTER_CANCELLATION: "register_cancellation";
    readonly REQUEST_RETURN: "request_return";
    readonly REGISTER_RETURN: "register_return";
    readonly COMPLETE_RETURN: "complete_return";
    readonly TRANSFER_BETWEEN_STORES: "transfer_between_stores";
    readonly REGISTER_FISCAL_DATA: "register_fiscal_data";
};
type SalesAction = (typeof SALES_ACTIONS)[keyof typeof SALES_ACTIONS];
export declare class BanBanSalesFlowService {
    private supabase;
    constructor();
    processAction(action: SalesAction, transactionData: any, metadata?: any): Promise<{
        transaction_id: any;
        external_id: any;
        status: string;
    }>;
    getSalesData(queryParams: any): Promise<{
        location_external_id: string;
        best_sellers: {
            variant_id: string;
            qty_sold: number;
            revenue: number;
        }[];
        highest_margin: {
            variant_id: string;
            margin_percentage: number;
            revenue: number;
        }[];
        last_updated: string;
    } | {
        customer_external_id: string;
        recency_days: number;
        frequency: any;
        monetary: any;
        segment: string;
        last_updated: string;
    } | {
        transactions: any;
        pagination: {
            limit: any;
            offset: any;
            count: any;
        };
    }>;
    private _registerSale;
    private _requestReturn;
    private _registerPayment;
    private _registerCancellation;
    private _registerReturn;
    private _completeReturn;
    private _transferBetweenStores;
    private _registerFiscalData;
    private _updateSalesAnalyticsSnapshots;
    private _calculateCustomerRfm;
    private _calculateSalespersonPerformance;
    private _analyzeProductPerformance;
    private _updateSnapshot;
    private _getTransactionByExternalId;
    private _createBusinessEvent;
    private _updateInventorySnapshot;
    private _getOrCreateBusinessEntity;
}
export {};
//# sourceMappingURL=banban-sales-flow-service.d.ts.map