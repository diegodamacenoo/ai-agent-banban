export interface ECAEvent {
    type: string;
    organizationId: string;
    data: any;
    timestamp?: string;
    eventId?: string;
}
export interface ECACondition {
    field: string;
    operator: 'equals' | 'contains' | 'greater' | 'less' | 'exists';
    value: any;
}
export interface ECAAction {
    type: string;
    handler: string;
    parameters: Record<string, any>;
}
export interface ECARule {
    id: string;
    name: string;
    event: string;
    conditions: ECACondition[];
    actions: ECAAction[];
    enabled: boolean;
}
export declare class BanbanECAEngine {
    private tenantManager;
    private rules;
    constructor();
    private loadBanbanRules;
    processEvent(event: ECAEvent): Promise<any>;
    private evaluateConditions;
    private getNestedValue;
    private executeAction;
    private updateInventoryAction;
    private updateCustomerMetricsAction;
    private generateReceiptAction;
    private processRefundAction;
    private logAdjustmentAction;
    getRules(): ECARule[];
    getRuleByEvent(eventType: string): ECARule | undefined;
    addRule(rule: ECARule): void;
    removeRule(eventType: string): boolean;
    enableRule(eventType: string): boolean;
    disableRule(eventType: string): boolean;
}
//# sourceMappingURL=eca-engine.d.ts.map