export declare const PerformanceSchemas: {
    businessMetricsResponse: {
        $id: string;
        type: string;
        properties: {
            success: {
                type: string;
            };
            data: {
                type: string;
                properties: {
                    revenue: {
                        type: string;
                        properties: {
                            total: {
                                type: string;
                            };
                            growth: {
                                type: string;
                            };
                            period: {
                                type: string;
                            };
                        };
                        required: string[];
                    };
                    orders: {
                        type: string;
                        properties: {
                            count: {
                                type: string;
                            };
                            averageValue: {
                                type: string;
                            };
                            growth: {
                                type: string;
                            };
                        };
                        required: string[];
                    };
                    customers: {
                        type: string;
                        properties: {
                            total: {
                                type: string;
                            };
                            new: {
                                type: string;
                            };
                            retention: {
                                type: string;
                            };
                        };
                        required: string[];
                    };
                    products: {
                        type: string;
                        properties: {
                            topSelling: {
                                type: string;
                                items: {
                                    type: string;
                                    properties: {
                                        id: {
                                            type: string;
                                        };
                                        name: {
                                            type: string;
                                        };
                                        sales: {
                                            type: string;
                                        };
                                    };
                                    required: string[];
                                };
                            };
                            lowStock: {
                                type: string;
                            };
                        };
                        required: string[];
                    };
                    generatedAt: {
                        type: string;
                        format: string;
                    };
                };
                required: string[];
            };
            period: {
                type: string;
            };
            generatedAt: {
                type: string;
                format: string;
            };
            module: {
                type: string;
            };
        };
        required: string[];
    };
    summaryResponse: {
        $id: string;
        type: string;
        properties: {
            success: {
                type: string;
            };
            data: {
                type: string;
                properties: {
                    overview: {
                        type: string;
                        properties: {
                            totalRevenue: {
                                type: string;
                            };
                            totalOrders: {
                                type: string;
                            };
                            totalCustomers: {
                                type: string;
                            };
                            averageOrderValue: {
                                type: string;
                            };
                        };
                        required: string[];
                    };
                    trends: {
                        type: string;
                        properties: {
                            revenueGrowth: {
                                type: string;
                            };
                            orderGrowth: {
                                type: string;
                            };
                            customerGrowth: {
                                type: string;
                            };
                        };
                        required: string[];
                    };
                    alerts: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                type: {
                                    type: string;
                                };
                                message: {
                                    type: string;
                                };
                                severity: {
                                    type: string;
                                    enum: string[];
                                };
                            };
                            required: string[];
                        };
                    };
                };
                required: string[];
            };
            generatedAt: {
                type: string;
                format: string;
            };
            module: {
                type: string;
            };
        };
        required: string[];
    };
    calculateRequest: {
        $id: string;
        type: string;
        properties: {
            metrics: {
                type: string;
                items: {
                    type: string;
                };
                minItems: number;
            };
            parameters: {
                type: string;
                properties: {
                    period: {
                        type: string;
                        enum: string[];
                    };
                    startDate: {
                        type: string;
                        format: string;
                    };
                    endDate: {
                        type: string;
                        format: string;
                    };
                    filters: {
                        type: string;
                    };
                };
            };
        };
        required: string[];
        additionalProperties: boolean;
    };
};
//# sourceMappingURL=performance-schemas.d.ts.map