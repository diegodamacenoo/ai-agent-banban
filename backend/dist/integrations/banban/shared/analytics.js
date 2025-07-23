"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BanbanAnalytics = void 0;
const supabase_service_1 = require("../../../shared/services/supabase-service");
class BanbanAnalytics {
    constructor() {
        this.supabaseService = supabase_service_1.SupabaseService.getInstance();
    }
    async calculateRFMAnalysis(organizationId, dateFrom, dateTo) {
        try {
            const { data: salesData, error } = await this.supabaseService.getClient()
                .from('eca_entities')
                .select('*')
                .eq('organization_id', organizationId)
                .eq('entity_type', 'sale')
                .gte('created_at', dateFrom || '2023-01-01')
                .lte('created_at', dateTo || new Date().toISOString());
            if (error) {
                throw new Error(`Erro ao buscar dados de vendas: ${error.message}`);
            }
            const customerMetrics = this.calculateCustomerMetrics(salesData || []);
            const segments = this.segmentCustomers(customerMetrics);
            return segments;
        }
        catch (error) {
            console.error('Erro na análise RFM:', error);
            throw error;
        }
    }
    calculateCustomerMetrics(salesData) {
        const metrics = new Map();
        const today = new Date();
        salesData.forEach(sale => {
            const customerId = sale.attributes?.customer_id;
            const totalAmount = sale.attributes?.total_amount || 0;
            const saleDate = new Date(sale.created_at);
            if (!customerId)
                return;
            if (!metrics.has(customerId)) {
                metrics.set(customerId, {
                    recency: 0,
                    frequency: 0,
                    monetary: 0
                });
            }
            const customerMetrics = metrics.get(customerId);
            const daysSinceLastPurchase = Math.floor((today.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
            if (customerMetrics.recency === 0 || daysSinceLastPurchase < customerMetrics.recency) {
                customerMetrics.recency = daysSinceLastPurchase;
            }
            customerMetrics.frequency += 1;
            customerMetrics.monetary += totalAmount;
        });
        return metrics;
    }
    segmentCustomers(customerMetrics) {
        const segments = [];
        const metricsArray = Array.from(customerMetrics.entries());
        const recencyValues = metricsArray.map(([_, m]) => m.recency).sort((a, b) => a - b);
        const frequencyValues = metricsArray.map(([_, m]) => m.frequency).sort((a, b) => b - a);
        const monetaryValues = metricsArray.map(([_, m]) => m.monetary).sort((a, b) => b - a);
        const recencyQuartiles = this.calculateQuartiles(recencyValues, true);
        const frequencyQuartiles = this.calculateQuartiles(frequencyValues, false);
        const monetaryQuartiles = this.calculateQuartiles(monetaryValues, false);
        metricsArray.forEach(([customerId, metrics]) => {
            const rfmScore = {
                recency_score: this.getScore(metrics.recency, recencyQuartiles, true),
                frequency_score: this.getScore(metrics.frequency, frequencyQuartiles, false),
                monetary_score: this.getScore(metrics.monetary, monetaryQuartiles, false),
                overall_score: 0,
                segment: ''
            };
            rfmScore.overall_score = rfmScore.recency_score + rfmScore.frequency_score + rfmScore.monetary_score;
            rfmScore.segment = this.determineSegment(rfmScore);
            const predictedLTV = this.calculatePredictedLTV(metrics, rfmScore);
            segments.push({
                customer_id: customerId,
                segment: rfmScore.segment,
                rfm_score: rfmScore,
                metrics,
                last_purchase_date: new Date(Date.now() - (metrics.recency * 24 * 60 * 60 * 1000)).toISOString(),
                predicted_ltv: predictedLTV
            });
        });
        return segments.sort((a, b) => b.rfm_score.overall_score - a.rfm_score.overall_score);
    }
    calculateQuartiles(values, inverted) {
        if (values.length === 0)
            return [0, 0, 0, 0];
        const sorted = inverted ? [...values].reverse() : values;
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q2 = sorted[Math.floor(sorted.length * 0.5)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        return [0, q1, q2, q3, sorted[sorted.length - 1]];
    }
    getScore(value, quartiles, inverted) {
        if (quartiles.length === 0)
            return 3;
        for (let i = 1; i < quartiles.length; i++) {
            if (value <= quartiles[i]) {
                return inverted ? 6 - i : i;
            }
        }
        return inverted ? 1 : 5;
    }
    determineSegment(rfmScore) {
        const { recency_score, frequency_score, monetary_score, overall_score } = rfmScore;
        if (recency_score >= 4 && frequency_score >= 4 && monetary_score >= 4) {
            return 'Champions';
        }
        if (recency_score >= 3 && frequency_score >= 3 && monetary_score >= 3) {
            return 'Loyal Customers';
        }
        if (recency_score >= 4 && frequency_score <= 2) {
            return 'New Customers';
        }
        if (recency_score >= 3 && frequency_score >= 3 && monetary_score <= 2) {
            return 'Potential Loyalists';
        }
        if (recency_score <= 2 && frequency_score >= 3 && monetary_score >= 3) {
            return 'At Risk';
        }
        if (recency_score <= 1 && frequency_score >= 4) {
            return 'Cannot Lose Them';
        }
        if (recency_score <= 2 && frequency_score <= 2) {
            return 'Hibernating';
        }
        return 'Others';
    }
    calculatePredictedLTV(metrics, rfmScore) {
        const avgOrderValue = metrics.frequency > 0 ? metrics.monetary / metrics.frequency : 0;
        const purchaseFrequencyPerYear = metrics.frequency > 0 ? (365 / Math.max(metrics.recency, 1)) : 0;
        const customerLifespanYears = Math.min(rfmScore.overall_score / 3, 5);
        return avgOrderValue * purchaseFrequencyPerYear * customerLifespanYears;
    }
    async generateSalesAnalytics(organizationId, filters = {}) {
        try {
            const { data: salesData, error } = await this.supabaseService.getClient()
                .from('eca_entities')
                .select('*')
                .eq('organization_id', organizationId)
                .eq('entity_type', 'sale')
                .gte('created_at', filters.dateFrom || '2023-01-01')
                .lte('created_at', filters.dateTo || new Date().toISOString());
            if (error) {
                throw new Error(`Erro ao buscar dados de vendas: ${error.message}`);
            }
            const sales = salesData || [];
            const totalSales = sales.length;
            const totalRevenue = sales.reduce((sum, sale) => sum + (sale.attributes?.total_amount || 0), 0);
            const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
            const uniqueCustomers = new Set(sales.map(sale => sale.attributes?.customer_id).filter(Boolean));
            const totalCustomers = uniqueCustomers.size;
            const newCustomers = Math.floor(totalCustomers * 0.2);
            const dailySales = this.calculateDailyTrends(sales);
            const monthlyTrends = this.calculateMonthlyTrends(sales);
            const segments = await this.calculateRFMAnalysis(organizationId, filters.dateFrom, filters.dateTo);
            const topProducts = this.calculateTopProducts(sales);
            const topCustomers = this.calculateTopCustomers(sales, segments);
            return {
                summary: {
                    total_sales: totalSales,
                    total_revenue: totalRevenue,
                    avg_order_value: avgOrderValue,
                    total_customers: totalCustomers,
                    new_customers: newCustomers,
                    return_rate: 0.05
                },
                trends: {
                    daily_sales: dailySales,
                    monthly_trends: monthlyTrends
                },
                segments,
                top_products: topProducts,
                top_customers: topCustomers
            };
        }
        catch (error) {
            console.error('Erro ao gerar analytics de vendas:', error);
            throw error;
        }
    }
    calculateDailyTrends(sales) {
        const dailyData = new Map();
        sales.forEach(sale => {
            const date = sale.created_at.split('T')[0];
            const amount = sale.attributes?.total_amount || 0;
            if (!dailyData.has(date)) {
                dailyData.set(date, { count: 0, revenue: 0 });
            }
            const dayData = dailyData.get(date);
            dayData.count += 1;
            dayData.revenue += amount;
        });
        return Array.from(dailyData.entries())
            .map(([date, data]) => ({
            date,
            sales_count: data.count,
            revenue: data.revenue
        }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }
    calculateMonthlyTrends(sales) {
        const monthlyData = new Map();
        sales.forEach(sale => {
            const month = sale.created_at.substring(0, 7);
            const amount = sale.attributes?.total_amount || 0;
            if (!monthlyData.has(month)) {
                monthlyData.set(month, { count: 0, revenue: 0 });
            }
            const monthData = monthlyData.get(month);
            monthData.count += 1;
            monthData.revenue += amount;
        });
        return Array.from(monthlyData.entries())
            .map(([month, data]) => ({
            month,
            sales_count: data.count,
            revenue: data.revenue,
            avg_order_value: data.count > 0 ? data.revenue / data.count : 0
        }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }
    calculateTopProducts(sales) {
        const productData = new Map();
        sales.forEach(sale => {
            const items = sale.attributes?.items || [];
            items.forEach((item) => {
                const productId = item.product_id;
                const quantity = item.quantity || 0;
                const revenue = item.total_price || 0;
                if (!productData.has(productId)) {
                    productData.set(productId, { quantity: 0, revenue: 0 });
                }
                const product = productData.get(productId);
                product.quantity += quantity;
                product.revenue += revenue;
            });
        });
        return Array.from(productData.entries())
            .map(([product_id, data]) => ({
            product_id,
            quantity_sold: data.quantity,
            revenue: data.revenue
        }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
    }
    calculateTopCustomers(sales, segments) {
        const customerData = new Map();
        sales.forEach(sale => {
            const customerId = sale.attributes?.customer_id;
            const amount = sale.attributes?.total_amount || 0;
            if (!customerId)
                return;
            if (!customerData.has(customerId)) {
                customerData.set(customerId, { spent: 0, orders: 0 });
            }
            const customer = customerData.get(customerId);
            customer.spent += amount;
            customer.orders += 1;
        });
        const segmentMap = new Map(segments.map(s => [s.customer_id, s.segment]));
        return Array.from(customerData.entries())
            .map(([customer_id, data]) => ({
            customer_id,
            total_spent: data.spent,
            total_orders: data.orders,
            segment: segmentMap.get(customer_id) || 'Others'
        }))
            .sort((a, b) => b.total_spent - a.total_spent)
            .slice(0, 10);
    }
}
exports.BanbanAnalytics = BanbanAnalytics;
//# sourceMappingURL=analytics.js.map