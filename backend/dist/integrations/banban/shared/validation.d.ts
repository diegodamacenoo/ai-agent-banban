export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export interface BanbanSaleData {
    sale_id?: string;
    customer_id?: string;
    location_id: string;
    items: BanbanSaleItem[];
    total_amount: number;
    payment_method: string;
    payment_status: string;
    sale_date: string;
    status: string;
}
export interface BanbanSaleItem {
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    discount?: number;
}
export interface BanbanInventoryData {
    location_id: string;
    items: BanbanInventoryItem[];
    event_date: string;
    event_type: string;
    status: string;
    notes?: string;
}
export interface BanbanInventoryItem {
    product_id: string;
    quantity: number;
    unit_cost?: number;
    reason?: string;
    notes?: string;
}
export interface BanbanTransferData {
    from_location_id: string;
    to_location_id: string;
    items: BanbanTransferItem[];
    transfer_date: string;
    status: string;
    notes?: string;
}
export interface BanbanTransferItem {
    product_id: string;
    quantity: number;
    unit_cost?: number;
    condition?: string;
}
export declare class BanbanValidationService {
    validateSaleData(data: any): ValidationResult;
    validateInventoryData(data: any): ValidationResult;
    validateTransferData(data: any): ValidationResult;
    validateWebhookPayload(payload: any): ValidationResult;
    private isValidPaymentMethod;
    private isValidPaymentStatus;
    private isValidSaleStatus;
    private isValidInventoryEventType;
    private isValidTransferStatus;
    private isValidDate;
    validateBusinessRules(eventType: string, data: any, organizationId: string): ValidationResult;
    sanitizeData(data: any): any;
}
//# sourceMappingURL=validation.d.ts.map