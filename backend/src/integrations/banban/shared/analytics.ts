import { SupabaseService } from '../../../shared/services/supabase-service';

export interface RFMMetrics {
  recency: number;        // Dias desde última compra
  frequency: number;      // Número de compras
  monetary: number;       // Valor total gasto
}

export interface RFMScore {
  recency_score: number;    // 1-5
  frequency_score: number;  // 1-5
  monetary_score: number;   // 1-5
  overall_score: number;    // 3-15
  segment: string;          // Champions, Loyalists, etc.
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

export class BanbanAnalytics {
  private supabaseService: SupabaseService;

  constructor() {
    this.supabaseService = SupabaseService.getInstance();
  }

  async calculateRFMAnalysis(organizationId: string, dateFrom?: string, dateTo?: string): Promise<CustomerSegment[]> {
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
    } catch (error: any) {
      console.error('Erro na análise RFM:', error);
      throw error;
    }
  }

  private calculateCustomerMetrics(salesData: any[]): Map<string, RFMMetrics> {
    const metrics = new Map<string, RFMMetrics>();
    const today = new Date();

    salesData.forEach(sale => {
      const customerId = sale.attributes?.customer_id;
      const totalAmount = sale.attributes?.total_amount || 0;
      const saleDate = new Date(sale.created_at);

      if (!customerId) return;

      if (!metrics.has(customerId)) {
        metrics.set(customerId, {
          recency: 0,
          frequency: 0,
          monetary: 0
        });
      }

      const customerMetrics = metrics.get(customerId)!;
      
      // Recency: menor valor (mais recente) é melhor
      const daysSinceLastPurchase = Math.floor((today.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
      if (customerMetrics.recency === 0 || daysSinceLastPurchase < customerMetrics.recency) {
        customerMetrics.recency = daysSinceLastPurchase;
      }

      // Frequency: incrementar contagem
      customerMetrics.frequency += 1;

      // Monetary: somar valores
      customerMetrics.monetary += totalAmount;
    });

    return metrics;
  }

  private segmentCustomers(customerMetrics: Map<string, RFMMetrics>): CustomerSegment[] {
    const segments: CustomerSegment[] = [];
    const metricsArray = Array.from(customerMetrics.entries());

    // Calcular quartis para scoring
    const recencyValues = metricsArray.map(([_, m]) => m.recency).sort((a, b) => a - b);
    const frequencyValues = metricsArray.map(([_, m]) => m.frequency).sort((a, b) => b - a); // Desc
    const monetaryValues = metricsArray.map(([_, m]) => m.monetary).sort((a, b) => b - a); // Desc

    const recencyQuartiles = this.calculateQuartiles(recencyValues, true); // Invertido (menor é melhor)
    const frequencyQuartiles = this.calculateQuartiles(frequencyValues, false);
    const monetaryQuartiles = this.calculateQuartiles(monetaryValues, false);

    metricsArray.forEach(([customerId, metrics]) => {
      const rfmScore: RFMScore = {
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

  private calculateQuartiles(values: number[], inverted: boolean): number[] {
    if (values.length === 0) return [0, 0, 0, 0];

    const sorted = inverted ? [...values].reverse() : values;
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q2 = sorted[Math.floor(sorted.length * 0.5)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];

    return [0, q1, q2, q3, sorted[sorted.length - 1]];
  }

  private getScore(value: number, quartiles: number[], inverted: boolean): number {
    if (quartiles.length === 0) return 3;

    for (let i = 1; i < quartiles.length; i++) {
      if (value <= quartiles[i]) {
        return inverted ? 6 - i : i;
      }
    }
    return inverted ? 1 : 5;
  }

  private determineSegment(rfmScore: RFMScore): string {
    const { recency_score, frequency_score, monetary_score, overall_score } = rfmScore;

    // Segmentação baseada nos scores individuais
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

  private calculatePredictedLTV(metrics: RFMMetrics, rfmScore: RFMScore): number {
    // Fórmula simples de LTV baseada nos dados disponíveis
    const avgOrderValue = metrics.frequency > 0 ? metrics.monetary / metrics.frequency : 0;
    const purchaseFrequencyPerYear = metrics.frequency > 0 ? (365 / Math.max(metrics.recency, 1)) : 0;
    const customerLifespanYears = Math.min(rfmScore.overall_score / 3, 5); // Max 5 anos

    return avgOrderValue * purchaseFrequencyPerYear * customerLifespanYears;
  }

  async generateSalesAnalytics(organizationId: string, filters: any = {}): Promise<SalesAnalytics> {
    try {
      // Buscar dados de vendas
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

      // Calcular métricas básicas
      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, sale) => sum + (sale.attributes?.total_amount || 0), 0);
      const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

      // Calcular clientes únicos
      const uniqueCustomers = new Set(sales.map(sale => sale.attributes?.customer_id).filter(Boolean));
      const totalCustomers = uniqueCustomers.size;

      // Calcular novos clientes (assumindo que é um período específico)
      const newCustomers = Math.floor(totalCustomers * 0.2); // Estimativa

      // Calcular tendências diárias
      const dailySales = this.calculateDailyTrends(sales);
      
      // Calcular tendências mensais
      const monthlyTrends = this.calculateMonthlyTrends(sales);

      // Calcular segmentos RFM
      const segments = await this.calculateRFMAnalysis(organizationId, filters.dateFrom, filters.dateTo);

      // Top produtos (simulado)
      const topProducts = this.calculateTopProducts(sales);

      // Top clientes
      const topCustomers = this.calculateTopCustomers(sales, segments);

      return {
        summary: {
          total_sales: totalSales,
          total_revenue: totalRevenue,
          avg_order_value: avgOrderValue,
          total_customers: totalCustomers,
          new_customers: newCustomers,
          return_rate: 0.05 // Estimativa de 5%
        },
        trends: {
          daily_sales: dailySales,
          monthly_trends: monthlyTrends
        },
        segments,
        top_products: topProducts,
        top_customers: topCustomers
      };

    } catch (error: any) {
      console.error('Erro ao gerar analytics de vendas:', error);
      throw error;
    }
  }

  private calculateDailyTrends(sales: any[]) {
    const dailyData = new Map<string, { count: number; revenue: number }>();

    sales.forEach(sale => {
      const date = sale.created_at.split('T')[0];
      const amount = sale.attributes?.total_amount || 0;

      if (!dailyData.has(date)) {
        dailyData.set(date, { count: 0, revenue: 0 });
      }

      const dayData = dailyData.get(date)!;
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

  private calculateMonthlyTrends(sales: any[]) {
    const monthlyData = new Map<string, { count: number; revenue: number }>();

    sales.forEach(sale => {
      const month = sale.created_at.substring(0, 7); // YYYY-MM
      const amount = sale.attributes?.total_amount || 0;

      if (!monthlyData.has(month)) {
        monthlyData.set(month, { count: 0, revenue: 0 });
      }

      const monthData = monthlyData.get(month)!;
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

  private calculateTopProducts(sales: any[]) {
    const productData = new Map<string, { quantity: number; revenue: number }>();

    sales.forEach(sale => {
      const items = sale.attributes?.items || [];
      items.forEach((item: any) => {
        const productId = item.product_id;
        const quantity = item.quantity || 0;
        const revenue = item.total_price || 0;

        if (!productData.has(productId)) {
          productData.set(productId, { quantity: 0, revenue: 0 });
        }

        const product = productData.get(productId)!;
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

  private calculateTopCustomers(sales: any[], segments: CustomerSegment[]) {
    const customerData = new Map<string, { spent: number; orders: number }>();

    sales.forEach(sale => {
      const customerId = sale.attributes?.customer_id;
      const amount = sale.attributes?.total_amount || 0;

      if (!customerId) return;

      if (!customerData.has(customerId)) {
        customerData.set(customerId, { spent: 0, orders: 0 });
      }

      const customer = customerData.get(customerId)!;
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