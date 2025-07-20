export declare const banbanPerformanceSchemas: {
    fashionMetrics: {
        $id: string;
        type: string;
        properties: {
            totalCollections: {
                type: string;
            };
            activeProducts: {
                type: string;
            };
            seasonalTrends: {
                type: string;
                properties: {
                    spring: {
                        type: string;
                        properties: {
                            growth: {
                                type: string;
                            };
                            revenue: {
                                type: string;
                            };
                        };
                    };
                    summer: {
                        type: string;
                        properties: {
                            growth: {
                                type: string;
                            };
                            revenue: {
                                type: string;
                            };
                        };
                    };
                    fall: {
                        type: string;
                        properties: {
                            growth: {
                                type: string;
                            };
                            revenue: {
                                type: string;
                            };
                        };
                    };
                    winter: {
                        type: string;
                        properties: {
                            growth: {
                                type: string;
                            };
                            revenue: {
                                type: string;
                            };
                        };
                    };
                };
            };
            categoryPerformance: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        category: {
                            type: string;
                        };
                        revenue: {
                            type: string;
                        };
                        growth: {
                            type: string;
                        };
                        margin: {
                            type: string;
                        };
                    };
                };
            };
            trendingStyles: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        style: {
                            type: string;
                        };
                        demand: {
                            type: string;
                        };
                        growth: {
                            type: string;
                        };
                    };
                };
            };
            sizeDistribution: {
                type: string;
                additionalProperties: {
                    type: string;
                };
            };
            colorTrends: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        color: {
                            type: string;
                        };
                        popularity: {
                            type: string;
                        };
                        sales: {
                            type: string;
                        };
                    };
                };
            };
        };
    };
    inventoryTurnover: {
        $id: string;
        type: string;
        properties: {
            period: {
                type: string;
            };
            periodDays: {
                type: string;
            };
            categories: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        category: {
                            type: string;
                        };
                        turnoverRate: {
                            type: string;
                        };
                        averageStock: {
                            type: string;
                        };
                        soldUnits: {
                            type: string;
                        };
                        daysInStock: {
                            type: string;
                        };
                        operational_status: {
                            type: string;
                        };
                        health_status: {
                            type: string;
                        };
                        topProducts: {
                            type: string;
                            items: {
                                type: string;
                                properties: {
                                    name: {
                                        type: string;
                                    };
                                    turnover: {
                                        type: string;
                                    };
                                };
                            };
                        };
                    };
                };
            };
            summary: {
                type: string;
                properties: {
                    averageTurnover: {
                        type: string;
                    };
                    totalCategories: {
                        type: string;
                    };
                    fastMoving: {
                        type: string;
                    };
                    slowMoving: {
                        type: string;
                    };
                };
            };
        };
    };
    seasonalAnalysis: {
        $id: string;
        type: string;
        properties: {
            year: {
                type: string;
            };
            seasons: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        season: {
                            type: string;
                        };
                        revenue: {
                            type: string;
                        };
                        growth: {
                            type: string;
                        };
                        topCategories: {
                            type: string;
                            items: {
                                type: string;
                                properties: {
                                    category: {
                                        type: string;
                                    };
                                    revenue: {
                                        type: string;
                                    };
                                };
                            };
                        };
                        weatherImpact: {
                            type: string;
                            properties: {
                                temperature: {
                                    type: string;
                                };
                                precipitation: {
                                    type: string;
                                };
                                salesCorrelation: {
                                    type: string;
                                };
                            };
                        };
                        promotions: {
                            type: string;
                            items: {
                                type: string;
                                properties: {
                                    name: {
                                        type: string;
                                    };
                                    discount: {
                                        type: string;
                                    };
                                };
                            };
                        };
                    };
                };
            };
            yearOverYear: {
                type: string;
                properties: {
                    totalGrowth: {
                        type: string;
                    };
                    bestSeason: {
                        type: string;
                    };
                    worstSeason: {
                        type: string;
                    };
                };
            };
        };
    };
    brandPerformance: {
        $id: string;
        type: string;
        properties: {
            period: {
                type: string;
            };
            metric: {
                type: string;
            };
            brands: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        brandId: {
                            type: string;
                        };
                        brandName: {
                            type: string;
                        };
                        metrics: {
                            type: string;
                            properties: {
                                revenue: {
                                    type: string;
                                };
                                units: {
                                    type: string;
                                };
                                profit: {
                                    type: string;
                                };
                                margin: {
                                    type: string;
                                };
                            };
                        };
                        growth: {
                            type: string;
                        };
                        topProducts: {
                            type: string;
                            items: {
                                type: string;
                                properties: {
                                    name: {
                                        type: string;
                                    };
                                    sales: {
                                        type: string;
                                    };
                                };
                            };
                        };
                        categories: {
                            type: string;
                            items: {
                                type: string;
                                properties: {
                                    category: {
                                        type: string;
                                    };
                                    contribution: {
                                        type: string;
                                    };
                                };
                            };
                        };
                    };
                };
            };
            summary: {
                type: string;
                properties: {
                    totalBrands: {
                        type: string;
                    };
                    averageGrowth: {
                        type: string;
                    };
                    topPerformer: {
                        type: string;
                    };
                    totalRevenue: {
                        type: string;
                    };
                };
            };
        };
    };
};
//# sourceMappingURL=banban-performance-schemas.d.ts.map