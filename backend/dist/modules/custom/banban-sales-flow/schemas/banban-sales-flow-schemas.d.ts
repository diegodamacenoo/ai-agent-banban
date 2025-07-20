export declare const banbanSalesFlowSchemas: {
    saleEntity: {
        $id: string;
        type: string;
        properties: {
            sale_id: {
                type: string;
            };
            customer_id: {
                type: string;
            };
            location_id: {
                type: string;
            };
            items: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        product_id: {
                            type: string;
                        };
                        quantity: {
                            type: string;
                        };
                        unit_price: {
                            type: string;
                        };
                        total_price: {
                            type: string;
                        };
                    };
                    required: string[];
                };
            };
            total_amount: {
                type: string;
            };
            payment_method: {
                type: string;
            };
            payment_status: {
                type: string;
            };
            sale_date: {
                type: string;
            };
            status: {
                type: string;
            };
        };
        required: string[];
    };
    returnEntity: {
        $id: string;
        type: string;
        properties: {
            return_id: {
                type: string;
            };
            original_sale_id: {
                type: string;
            };
            location_id: {
                type: string;
            };
            items: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        product_id: {
                            type: string;
                        };
                        quantity: {
                            type: string;
                        };
                        unit_price: {
                            type: string;
                        };
                        total_price: {
                            type: string;
                        };
                        reason: {
                            type: string;
                        };
                    };
                    required: string[];
                };
            };
            total_amount: {
                type: string;
            };
            return_date: {
                type: string;
            };
            status: {
                type: string;
            };
        };
        required: string[];
    };
    salesFlowWebhook: {
        $id: string;
        type: string;
        properties: {
            action: {
                type: string;
                enum: string[];
            };
            attributes: {
                oneOf: {
                    $ref: string;
                }[];
            };
        };
        required: string[];
    };
    salesFlowResponse: {
        $id: string;
        type: string;
        properties: {
            success: {
                type: string;
                description: string;
            };
            action: {
                type: string;
                enum: ("register_sale" | "register_payment" | "register_fiscal_data" | "cancel_sale")[];
                description: string;
            };
            transaction_id: {
                type: string;
                description: string;
            };
            entity_ids: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            relationship_ids: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            state_transition: {
                type: string;
                description: string;
                properties: {
                    from: {
                        type: string;
                    };
                    to: {
                        type: string;
                    };
                };
            };
            attributes: {
                type: string;
                properties: {
                    success: {
                        type: string;
                    };
                    entityType: {
                        type: string;
                    };
                    entityId: {
                        type: string;
                    };
                    summary: {
                        type: string;
                        properties: {
                            message: {
                                type: string;
                            };
                            records_processed: {
                                type: string;
                            };
                            records_successful: {
                                type: string;
                            };
                            records_failed: {
                                type: string;
                            };
                        };
                    };
                };
            };
            metadata: {
                type: string;
                properties: {
                    processed_at: {
                        type: string;
                        format: string;
                    };
                    processing_time_ms: {
                        type: string;
                    };
                    records_processed: {
                        type: string;
                    };
                    records_successful: {
                        type: string;
                    };
                    records_failed: {
                        type: string;
                    };
                    success_rate: {
                        type: string;
                    };
                };
            };
            error: {
                type: string;
                properties: {
                    code: {
                        type: string;
                    };
                    message: {
                        type: string;
                    };
                    details: {
                        type: string;
                    };
                };
            };
        };
        required: string[];
    };
    salesAnalytics: {
        $id: string;
        type: string;
        properties: {
            summary: {
                type: string;
                properties: {
                    total_sales: {
                        type: string;
                    };
                    total_revenue: {
                        type: string;
                    };
                    total_returns: {
                        type: string;
                    };
                    return_rate: {
                        type: string;
                    };
                    avg_order_value: {
                        type: string;
                    };
                    period_from: {
                        type: string;
                    };
                    period_to: {
                        type: string;
                    };
                };
            };
            customer_metrics: {
                type: string;
                properties: {
                    total_customers: {
                        type: string;
                    };
                    new_customers: {
                        type: string;
                    };
                    repeat_customers: {
                        type: string;
                    };
                    avg_customer_value: {
                        type: string;
                    };
                    top_customers: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                customer_id: {
                                    type: string;
                                };
                                total_spent: {
                                    type: string;
                                };
                                total_orders: {
                                    type: string;
                                };
                            };
                        };
                    };
                };
            };
            product_metrics: {
                type: string;
                properties: {
                    total_products_sold: {
                        type: string;
                    };
                    top_products: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                product_id: {
                                    type: string;
                                };
                                quantity_sold: {
                                    type: string;
                                };
                                revenue: {
                                    type: string;
                                };
                            };
                        };
                    };
                };
            };
            location_metrics: {
                type: string;
                properties: {
                    top_locations: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                location_id: {
                                    type: string;
                                };
                                total_sales: {
                                    type: string;
                                };
                                total_revenue: {
                                    type: string;
                                };
                            };
                        };
                    };
                };
            };
            trends: {
                type: string;
                properties: {
                    daily_sales: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                date: {
                                    type: string;
                                };
                                sales_count: {
                                    type: string;
                                };
                                revenue: {
                                    type: string;
                                };
                            };
                        };
                    };
                    monthly_trends: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                month: {
                                    type: string;
                                };
                                sales_count: {
                                    type: string;
                                };
                                revenue: {
                                    type: string;
                                };
                                avg_order_value: {
                                    type: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=banban-sales-flow-schemas.d.ts.map