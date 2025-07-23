import { TRANSFER_ACTIONS } from '../../../../../shared/enums/eca-actions';
import { WebhookPayloadData, QueryTransfersParams, AnalyticsParams, TransferProcessResult, TransferQueryResult, TransferAnalyticsResult, RoutePerformance, DemandPatterns } from '../types/transfer-types';
export declare class BanBanTransferFlowService {
    private supabase;
    constructor();
    processAction(action: keyof typeof TRANSFER_ACTIONS, transactionData: WebhookPayloadData, metadata?: Record<string, unknown>): Promise<TransferProcessResult>;
    getTransferData(queryParams: QueryTransfersParams): Promise<TransferQueryResult | RoutePerformance | DemandPatterns>;
    getTransferAnalytics(queryParams: AnalyticsParams): Promise<TransferAnalyticsResult>;
    private _calculateAvgTransferTime;
    private _calculateTopRoutes;
    private _calculateDailyTransferVolume;
    private _calculateDemandAnalysis;
    private _createTransferRequest;
    private _registerRequest;
    private _createSeparationMap;
    private _startSeparation;
    private _completeSeparation;
    private _registerShipment;
    private _invoiceTransfer;
    private _startStoreConference;
    private _scanStoreItems;
    private _completeStoreConference;
    private _effectuateStore;
    private _registerReceipt;
    private _registerCompletion;
    private _updateAnalyticsSnapshots;
    private _calculateRoutePerformance;
    private _analyzeDemandPatterns;
    private _updateSnapshot;
    private _getTransactionByExternalId;
    private _createBusinessEvent;
    private _updateInventorySnapshot;
    private _getOrCreateBusinessEntity;
}
//# sourceMappingURL=banban-transfer-flow-service.d.ts.map