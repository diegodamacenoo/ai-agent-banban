declare const INVENTORY_ACTIONS: {
    readonly ADJUST_STOCK: "adjust_stock";
    readonly COUNT_INVENTORY: "count_inventory";
    readonly RESERVE_STOCK: "reserve_stock";
    readonly TRANSFER_INTERNAL: "transfer_internal";
    readonly QUARANTINE_PRODUCT: "quarantine_product";
};
type InventoryAction = (typeof INVENTORY_ACTIONS)[keyof typeof INVENTORY_ACTIONS];
export declare class BanBanInventoryFlowService {
    private supabase;
    constructor();
    processAction(action: InventoryAction, organizationId: string, transactionData: any, metadata?: any): Promise<{
        entityType: string;
        entityId: string;
        summary: {
            message: string;
        };
    }>;
    getInventoryData(organizationId: string, queryParams: any): Promise<{
        snapshots: any;
        pagination: {
            limit: any;
            offset: any;
            count: any;
        };
        transactions?: undefined;
    } | {
        transactions: any;
        pagination: {
            limit: any;
            offset: any;
            count: any;
        };
        snapshots?: undefined;
    }>;
    private _adjustStock;
    private _countInventory;
    private _reserveStock;
    private _transferInternal;
    private _quarantineProduct;
    private _getInventorySnapshot;
    private _createBusinessEvent;
    private _validateLocationExists;
    private _validateVariantExists;
    private _updateInventorySnapshot;
    private _checkStockAlerts;
    private _getOrCreateBusinessEntity;
}
export {};
//# sourceMappingURL=banban-inventory-flow-service.d.ts.map