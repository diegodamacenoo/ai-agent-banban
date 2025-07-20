"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BanBanPerformanceService = void 0;
class BanBanPerformanceService {
    async getFashionMetrics() {
        return {
            totalCollections: 12,
            activeProducts: 1847,
            seasonalTrends: {
                spring: { growth: 15.2, revenue: 125000 },
                summer: { growth: 8.7, revenue: 98000 },
                fall: { growth: 22.1, revenue: 156000 },
                winter: { growth: 12.4, revenue: 134000 }
            },
            categoryPerformance: [
                { category: 'Vestidos', revenue: 89000, growth: 18.5, margin: 45.2 },
                { category: 'Calças', revenue: 76000, growth: 12.3, margin: 38.7 },
                { category: 'Blusas', revenue: 65000, growth: 15.8, margin: 42.1 },
                { category: 'Acessórios', revenue: 43000, growth: 25.4, margin: 52.3 },
                { category: 'Calçados', revenue: 112000, growth: 8.9, margin: 35.6 }
            ],
            trendingStyles: [
                { style: 'Boho Chic', demand: 87, growth: 34.2 },
                { style: 'Minimalista', demand: 92, growth: 28.1 },
                { style: 'Vintage', demand: 78, growth: 19.6 },
                { style: 'Casual Elegante', demand: 95, growth: 15.3 }
            ],
            sizeDistribution: {
                'PP': 8.2,
                'P': 22.1,
                'M': 35.4,
                'G': 24.7,
                'GG': 9.6
            },
            colorTrends: [
                { color: 'Azul Marinho', popularity: 89, sales: 23400 },
                { color: 'Preto', popularity: 95, sales: 31200 },
                { color: 'Bege', popularity: 72, sales: 18900 },
                { color: 'Vermelho', popularity: 68, sales: 16700 },
                { color: 'Verde Oliva', popularity: 58, sales: 12300 }
            ]
        };
    }
    async getInventoryTurnover(category, period = '30d') {
        const periodDays = this.getPeriodDays(period);
        const categories = category ? [category] : [
            'Vestidos', 'Calças', 'Blusas', 'Acessórios', 'Calçados', 'Lingerie', 'Moda Praia'
        ];
        return {
            period: period,
            periodDays: periodDays,
            categories: categories.map(cat => ({
                category: cat,
                turnoverRate: Math.random() * 8 + 2,
                averageStock: Math.floor(Math.random() * 500 + 100),
                soldUnits: Math.floor(Math.random() * 300 + 50),
                daysInStock: Math.floor(Math.random() * 45 + 15),
                operational_status: this.getOperationalStatusFromTurnover(Math.random() * 8 + 2),
                health_status: this.getHealthStatusFromTurnover(Math.random() * 8 + 2),
                topProducts: [
                    { name: `${cat} Produto A`, turnover: Math.random() * 12 + 3 },
                    { name: `${cat} Produto B`, turnover: Math.random() * 12 + 3 },
                    { name: `${cat} Produto C`, turnover: Math.random() * 12 + 3 }
                ]
            })),
            summary: {
                averageTurnover: 5.8,
                totalCategories: categories.length,
                fastMoving: categories.filter(() => Math.random() > 0.6).length,
                slowMoving: categories.filter(() => Math.random() > 0.8).length
            }
        };
    }
    async getSeasonalAnalysis(year, season) {
        const currentYear = year || new Date().getFullYear();
        const seasons = season ? [season] : ['spring', 'summer', 'fall', 'winter'];
        return {
            year: currentYear,
            seasons: seasons.map(s => ({
                season: s,
                revenue: Math.floor(Math.random() * 100000 + 80000),
                growth: (Math.random() - 0.5) * 40,
                topCategories: [
                    { category: 'Vestidos', revenue: Math.floor(Math.random() * 30000 + 20000) },
                    { category: 'Calças', revenue: Math.floor(Math.random() * 25000 + 15000) },
                    { category: 'Blusas', revenue: Math.floor(Math.random() * 20000 + 12000) }
                ],
                weatherImpact: {
                    temperature: this.getSeasonalTemp(s),
                    precipitation: Math.random() * 100,
                    salesCorrelation: Math.random() * 0.4 + 0.6
                },
                promotions: [
                    { name: `Promoção ${s.charAt(0).toUpperCase() + s.slice(1)}`, discount: Math.floor(Math.random() * 30 + 10) },
                    { name: `Liquidação ${s}`, discount: Math.floor(Math.random() * 50 + 20) }
                ]
            })),
            yearOverYear: {
                totalGrowth: (Math.random() - 0.3) * 25,
                bestSeason: seasons[Math.floor(Math.random() * seasons.length)],
                worstSeason: seasons[Math.floor(Math.random() * seasons.length)]
            }
        };
    }
    async getBrandPerformance(brandId, period = '30d', metric = 'revenue') {
        const brands = brandId ? [{ id: brandId, name: `Marca ${brandId}` }] : [
            { id: 'brand-001', name: 'Fashion Elite' },
            { id: 'brand-002', name: 'Urban Style' },
            { id: 'brand-003', name: 'Classic Wear' },
            { id: 'brand-004', name: 'Trend Setter' },
            { id: 'brand-005', name: 'Casual Chic' }
        ];
        return {
            period: period,
            metric: metric,
            brands: brands.map(brand => ({
                brandId: brand.id,
                brandName: brand.name,
                metrics: {
                    revenue: Math.floor(Math.random() * 50000 + 20000),
                    units: Math.floor(Math.random() * 1000 + 200),
                    profit: Math.floor(Math.random() * 15000 + 5000),
                    margin: Math.random() * 30 + 20
                },
                growth: (Math.random() - 0.4) * 50,
                topProducts: [
                    { name: 'Produto Top 1', sales: Math.floor(Math.random() * 5000 + 1000) },
                    { name: 'Produto Top 2', sales: Math.floor(Math.random() * 4000 + 800) },
                    { name: 'Produto Top 3', sales: Math.floor(Math.random() * 3000 + 600) }
                ],
                categories: [
                    { category: 'Vestidos', contribution: Math.random() * 40 + 10 },
                    { category: 'Calças', contribution: Math.random() * 30 + 15 },
                    { category: 'Blusas', contribution: Math.random() * 25 + 10 }
                ]
            })),
            summary: {
                totalBrands: brands.length,
                averageGrowth: 12.5,
                topPerformer: brands[0].name,
                totalRevenue: brands.reduce((sum, brand) => sum + Math.floor(Math.random() * 50000 + 20000), 0)
            }
        };
    }
    async getExecutiveDashboard() {
        const [fashionMetrics, seasonalAnalysis] = await Promise.all([
            this.getFashionMetrics(),
            this.getSeasonalAnalysis()
        ]);
        return {
            fashionMetrics,
            topCategories: [
                { category: 'Vestidos', revenue: 89000, growth: 18.5 },
                { category: 'Calçados', revenue: 112000, growth: 8.9 },
                { category: 'Calças', revenue: 76000, growth: 12.3 },
                { category: 'Acessórios', revenue: 43000, growth: 25.4 },
                { category: 'Blusas', revenue: 65000, growth: 15.8 }
            ],
            seasonalTrends: seasonalAnalysis,
            alerts: [
                {
                    type: 'inventory',
                    message: 'Estoque baixo em Vestidos Verão - categoria com alta demanda',
                    severity: 'high'
                },
                {
                    type: 'trend',
                    message: 'Crescimento de 34% em estilo Boho Chic nos últimos 30 dias',
                    severity: 'medium'
                },
                {
                    type: 'performance',
                    message: 'Marca Fashion Elite superou meta mensal em 15%',
                    severity: 'low'
                },
                {
                    type: 'seasonal',
                    message: 'Preparar coleção Outono/Inverno - tendência de crescimento',
                    severity: 'medium'
                }
            ],
            kpis: {
                totalRevenue: 513000,
                totalOrders: 2847,
                averageOrderValue: 180.25,
                customerRetention: 68.4,
                inventoryTurnover: 5.8,
                grossMargin: 42.3
            }
        };
    }
    async getProductMargins(filters = {}) {
        const { productId, category, minMargin, maxMargin } = filters;
        const allProducts = [
            { productId: 'prod-001', name: 'Vestido Floral Premium', category: 'Vestidos', costPrice: 45.00, salePrice: 89.90 },
            { productId: 'prod-002', name: 'Calça Jeans Skinny', category: 'Calças', costPrice: 32.00, salePrice: 79.90 },
            { productId: 'prod-003', name: 'Blusa Seda Estampada', category: 'Blusas', costPrice: 28.50, salePrice: 69.90 },
            { productId: 'prod-004', name: 'Sandália Couro', category: 'Calçados', costPrice: 55.00, salePrice: 129.90 },
            { productId: 'prod-005', name: 'Bolsa Transversal', category: 'Acessórios', costPrice: 23.00, salePrice: 59.90 },
            { productId: 'prod-006', name: 'Óculos de Sol', category: 'Acessórios', costPrice: 15.00, salePrice: 89.90 },
            { productId: 'prod-007', name: 'Vestido Casual', category: 'Vestidos', costPrice: 35.00, salePrice: 69.90 },
            { productId: 'prod-008', name: 'Tênis Esportivo', category: 'Calçados', costPrice: 48.00, salePrice: 119.90 }
        ];
        let filteredProducts = allProducts;
        if (productId) {
            filteredProducts = filteredProducts.filter(p => p.productId === productId);
        }
        if (category) {
            filteredProducts = filteredProducts.filter(p => p.category === category);
        }
        const products = filteredProducts.map(product => {
            const margin = product.salePrice - product.costPrice;
            const marginPercent = (margin / product.salePrice) * 100;
            const unitsSold = Math.floor(Math.random() * 200 + 50);
            const revenue = product.salePrice * unitsSold;
            return {
                ...product,
                margin,
                marginPercent: Math.round(marginPercent * 100) / 100,
                unitsSold,
                revenue: Math.round(revenue * 100) / 100
            };
        }).filter(product => {
            if (minMargin && product.marginPercent < minMargin)
                return false;
            if (maxMargin && product.marginPercent > maxMargin)
                return false;
            return true;
        });
        const summary = {
            totalProducts: products.length,
            averageMargin: products.reduce((sum, p) => sum + p.marginPercent, 0) / products.length,
            totalRevenue: products.reduce((sum, p) => sum + p.revenue, 0),
            totalProfit: products.reduce((sum, p) => sum + (p.margin * p.unitsSold), 0)
        };
        return {
            products,
            summary: {
                ...summary,
                averageMargin: Math.round(summary.averageMargin * 100) / 100,
                totalRevenue: Math.round(summary.totalRevenue * 100) / 100,
                totalProfit: Math.round(summary.totalProfit * 100) / 100
            }
        };
    }
    getPeriodDays(period) {
        switch (period) {
            case '7d': return 7;
            case '30d': return 30;
            case '90d': return 90;
            case '1y': return 365;
            default: return 30;
        }
    }
    getOperationalStatusFromTurnover(turnover) {
        if (turnover >= 8)
            return 'ENABLED';
        if (turnover >= 6)
            return 'ENABLED';
        if (turnover >= 4)
            return 'PENDING_APPROVAL';
        if (turnover >= 2)
            return 'DISABLED';
        return 'DISABLED';
    }
    getHealthStatusFromTurnover(turnover) {
        if (turnover >= 8)
            return 'healthy';
        if (turnover >= 6)
            return 'healthy';
        if (turnover >= 4)
            return 'warning';
        if (turnover >= 2)
            return 'critical';
        return 'critical';
    }
    getSeasonalTemp(season) {
        switch (season) {
            case 'spring': return 22;
            case 'summer': return 28;
            case 'fall': return 18;
            case 'winter': return 12;
            default: return 20;
        }
    }
}
exports.BanBanPerformanceService = BanBanPerformanceService;
//# sourceMappingURL=banban-performance-service.js.map