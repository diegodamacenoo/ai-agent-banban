export interface RFMMetrics {
    recency: number;
    frequency: number;
    monetary: number;
}
export interface RFMScore {
    recency_score: number;
    frequency_score: number;
    monetary_score: number;
    overall_score: number;
    segment: string;
}
export interface CustomerSegment {
    customer_id: string;
    segment: string;
    rfm_score: RFMScore;
    metrics: RFMMetrics;
    last_purchase_date: string;
    predicted_ltv: number;
}
export interface SalesAnalytics {
    summary: {
        total_sales: number;
        total_revenue: number;
        avg_order_value: number;
        total_customers: number;
        new_customers: number;
        return_rate: number;
    };
    trends: {
        daily_sales: Array<{
            date: string;
            sales_count: number;
            revenue: number;
        }>;
        monthly_trends: Array<{
            month: string;
            sales_count: number;
            revenue: number;
            avg_order_value: number;
        }>;
    };
    segments: CustomerSegment[];
    top_products: Array<{
        product_id: string;
        quantity_sold: number;
        revenue: number;
    }>;
    top_customers: Array<{
        customer_id: string;
        total_spent: number;
        total_orders: number;
        segment: string;
    }>;
}
export declare class BanbanAnalytics {
    private supabaseService;
    constructor();
    calculateRFMAnalysis(organizationId: string, dateFrom?: string, dateTo?: string): Promise<CustomerSegment[]>;
    private calculateCustomerMetrics;
    private segmentCustomers;
    private calculateQuartiles;
    private getScore;
    private determineSegment;
    private calculatePredictedLTV;
    generateSalesAnalytics(organizationId: string, filters?: any): Promise<SalesAnalytics>;
    private calculateDailyTrends;
    private calculateMonthlyTrends;
    private calculateTopProducts;
    private calculateTopCustomers;
}
//# sourceMappingURL=analytics.d.ts.map