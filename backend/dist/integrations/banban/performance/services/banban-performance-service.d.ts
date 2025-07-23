export declare class BanBanPerformanceService {
    getFashionMetrics(): Promise<{
        totalCollections: number;
        activeProducts: number;
        seasonalTrends: {
            spring: {
                growth: number;
                revenue: number;
            };
            summer: {
                growth: number;
                revenue: number;
            };
            fall: {
                growth: number;
                revenue: number;
            };
            winter: {
                growth: number;
                revenue: number;
            };
        };
        categoryPerformance: {
            category: string;
            revenue: number;
            growth: number;
            margin: number;
        }[];
        trendingStyles: {
            style: string;
            demand: number;
            growth: number;
        }[];
        sizeDistribution: {
            PP: number;
            P: number;
            M: number;
            G: number;
            GG: number;
        };
        colorTrends: {
            color: string;
            popularity: number;
            sales: number;
        }[];
    }>;
    getInventoryTurnover(category?: string, period?: string): Promise<{
        period: string;
        periodDays: number;
        categories: {
            category: string;
            turnoverRate: number;
            averageStock: number;
            soldUnits: number;
            daysInStock: number;
            operational_status: string;
            health_status: string;
            topProducts: {
                name: string;
                turnover: number;
            }[];
        }[];
        summary: {
            averageTurnover: number;
            totalCategories: number;
            fastMoving: number;
            slowMoving: number;
        };
    }>;
    getSeasonalAnalysis(year?: number, season?: string): Promise<{
        year: number;
        seasons: {
            season: string;
            revenue: number;
            growth: number;
            topCategories: {
                category: string;
                revenue: number;
            }[];
            weatherImpact: {
                temperature: number;
                precipitation: number;
                salesCorrelation: number;
            };
            promotions: {
                name: string;
                discount: number;
            }[];
        }[];
        yearOverYear: {
            totalGrowth: number;
            bestSeason: string;
            worstSeason: string;
        };
    }>;
    getBrandPerformance(brandId?: string, period?: string, metric?: string): Promise<{
        period: string;
        metric: string;
        brands: {
            brandId: string;
            brandName: string;
            metrics: {
                revenue: number;
                units: number;
                profit: number;
                margin: number;
            };
            growth: number;
            topProducts: {
                name: string;
                sales: number;
            }[];
            categories: {
                category: string;
                contribution: number;
            }[];
        }[];
        summary: {
            totalBrands: number;
            averageGrowth: number;
            topPerformer: string;
            totalRevenue: number;
        };
    }>;
    getExecutiveDashboard(): Promise<{
        fashionMetrics: {
            totalCollections: number;
            activeProducts: number;
            seasonalTrends: {
                spring: {
                    growth: number;
                    revenue: number;
                };
                summer: {
                    growth: number;
                    revenue: number;
                };
                fall: {
                    growth: number;
                    revenue: number;
                };
                winter: {
                    growth: number;
                    revenue: number;
                };
            };
            categoryPerformance: {
                category: string;
                revenue: number;
                growth: number;
                margin: number;
            }[];
            trendingStyles: {
                style: string;
                demand: number;
                growth: number;
            }[];
            sizeDistribution: {
                PP: number;
                P: number;
                M: number;
                G: number;
                GG: number;
            };
            colorTrends: {
                color: string;
                popularity: number;
                sales: number;
            }[];
        };
        topCategories: {
            category: string;
            revenue: number;
            growth: number;
        }[];
        seasonalTrends: {
            year: number;
            seasons: {
                season: string;
                revenue: number;
                growth: number;
                topCategories: {
                    category: string;
                    revenue: number;
                }[];
                weatherImpact: {
                    temperature: number;
                    precipitation: number;
                    salesCorrelation: number;
                };
                promotions: {
                    name: string;
                    discount: number;
                }[];
            }[];
            yearOverYear: {
                totalGrowth: number;
                bestSeason: string;
                worstSeason: string;
            };
        };
        alerts: {
            type: string;
            message: string;
            severity: string;
        }[];
        kpis: {
            totalRevenue: number;
            totalOrders: number;
            averageOrderValue: number;
            customerRetention: number;
            inventoryTurnover: number;
            grossMargin: number;
        };
    }>;
    getProductMargins(filters?: any): Promise<{
        products: {
            margin: number;
            marginPercent: number;
            unitsSold: number;
            revenue: number;
            productId: string;
            name: string;
            category: string;
            costPrice: number;
            salePrice: number;
        }[];
        summary: {
            averageMargin: number;
            totalRevenue: number;
            totalProfit: number;
            totalProducts: number;
        };
    }>;
    private getPeriodDays;
    private getOperationalStatusFromTurnover;
    private getHealthStatusFromTurnover;
    private getSeasonalTemp;
}
//# sourceMappingURL=banban-performance-service.d.ts.map