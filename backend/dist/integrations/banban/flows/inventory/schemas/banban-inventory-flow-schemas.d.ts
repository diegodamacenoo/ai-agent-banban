export declare const banbanInventoryFlowSchemas: {
    inventoryEvent: {
        $id: string;
        type: string;
        properties: {
            event_id: {
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
                        unit_cost: {
                            type: string;
                        };
                        reason: {
                            type: string;
                        };
                        notes: {
                            type: string;
                        };
                    };
                    required: string[];
                };
            };
            event_date: {
                type: string;
                format: string;
            };
            event_type: {
                type: string;
                enum: string[];
            };
            status: {
                type: string;
            };
            notes: {
                type: string;
            };
        };
        required: string[];
    };
    inventoryFlowWebhook: {
        $id: string;
        type: string;
        properties: {
            action: {
                type: string;
                enum: string[];
            };
            organization_id: {
                type: string;
            };
            attributes: {
                $ref: string;
            };
        };
        required: string[];
    };
    inventoryFlowResponse: {
        $id: string;
        type: string;
        properties: {
            success: {
                type: string;
                description: string;
            };
            action: {
                type: string;
                enum: string[];
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
                            inventory_transactions: {
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
    };
    inventoryAnalytics: {
        $id: string;
        type: string;
        properties: {
            summary: {
                type: string;
                properties: {
                    total_events: {
                        type: string;
                    };
                    total_products: {
                        type: string;
                    };
                    total_locations: {
                        type: string;
                    };
                    total_adjustments: {
                        type: string;
                    };
                    total_value_adjusted: {
                        type: string;
                    };
                };
            };
            inventory_turnover: {
                type: string;
                properties: {
                    average_turnover_days: {
                        type: string;
                    };
                    fast_moving_products: {
                        type: string;
                    };
                    slow_moving_products: {
                        type: string;
                    };
                    obsolete_products: {
                        type: string;
                    };
                };
            };
            location_metrics: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        location_id: {
                            type: string;
                        };
                        location_name: {
                            type: string;
                        };
                        total_events: {
                            type: string;
                        };
                        total_value: {
                            type: string;
                        };
                        accuracy_score: {
                            type: string;
                        };
                    };
                };
            };
            event_trends: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        date: {
                            type: string;
                            format: string;
                        };
                        adjustments: {
                            type: string;
                        };
                        counts: {
                            type: string;
                        };
                        damages: {
                            type: string;
                        };
                        expiries: {
                            type: string;
                        };
                        total_value: {
                            type: string;
                        };
                    };
                };
            };
            product_analysis: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        product_id: {
                            type: string;
                        };
                        product_name: {
                            type: string;
                        };
                        total_adjustments: {
                            type: string;
                        };
                        net_quantity_change: {
                            type: string;
                        };
                        value_impact: {
                            type: string;
                        };
                        accuracy_issues: {
                            type: string;
                        };
                    };
                };
            };
        };
    };
};
//# sourceMappingURL=banban-inventory-flow-schemas.d.ts.map