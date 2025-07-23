export declare const banbanPurchaseFlowSchemas: {
    ecaPurchaseOrder: {
        $id: string;
        type: string;
        properties: {
            id: {
                type: string;
                description: string;
            };
            tenant_id: {
                type: string;
                description: string;
            };
            transaction_type: {
                type: string;
                enum: "ORDER_PURCHASE"[];
                description: string;
            };
            external_id: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                enum: ("PENDENTE" | "APPROVED" | "PRE_BAIXA" | "AGUARDANDO_CONFERENCIA_CD" | "EM_CONFERENCIA_CD" | "CONFERENCIA_CD_SEM_DIVERGENCIA" | "CONFERENCIA_CD_COM_DIVERGENCIA" | "EFETIVADO_CD")[];
                description: string;
            };
            attributes: {
                type: string;
                description: string;
                properties: {
                    total_value: {
                        type: string;
                        description: string;
                    };
                    issue_date: {
                        type: string;
                        format: string;
                        description: string;
                    };
                    expected_delivery: {
                        type: string;
                        format: string;
                        description: string;
                    };
                    approved_by: {
                        type: string;
                        description: string;
                    };
                    approval_date: {
                        type: string;
                        format: string;
                        description: string;
                    };
                    notes: {
                        type: string;
                        description: string;
                    };
                    supplier_code: {
                        type: string;
                        description: string;
                    };
                    supplier_name: {
                        type: string;
                        description: string;
                    };
                    destination: {
                        type: string;
                        description: string;
                    };
                    state_history: {
                        type: string;
                        description: string;
                        items: {
                            type: string;
                            properties: {
                                from: {
                                    type: string;
                                };
                                to: {
                                    type: string;
                                };
                                transitioned_at: {
                                    type: string;
                                    format: string;
                                };
                                attributes: {
                                    type: string;
                                };
                            };
                        };
                    };
                };
                required: string[];
            };
            created_at: {
                type: string;
                format: string;
            };
            updated_at: {
                type: string;
                format: string;
            };
        };
        required: string[];
    };
    ecaSupplierDocument: {
        $id: string;
        type: string;
        properties: {
            id: {
                type: string;
            };
            organization_id: {
                type: string;
            };
            transaction_type: {
                type: string;
                enum: "DOCUMENT_SUPPLIER_IN"[];
            };
            external_id: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                enum: ("PENDENTE" | "APPROVED" | "PRE_BAIXA" | "AGUARDANDO_CONFERENCIA_CD" | "EM_CONFERENCIA_CD" | "CONFERENCIA_CD_SEM_DIVERGENCIA" | "CONFERENCIA_CD_COM_DIVERGENCIA" | "EFETIVADO_CD")[];
            };
            attributes: {
                type: string;
                properties: {
                    invoice_number: {
                        type: string;
                        description: string;
                    };
                    issue_date: {
                        type: string;
                        format: string;
                        description: string;
                    };
                    total_value: {
                        type: string;
                        description: string;
                    };
                    supplier_code: {
                        type: string;
                        description: string;
                    };
                    location_code: {
                        type: string;
                        description: string;
                    };
                    conferencia_iniciada_em: {
                        type: string;
                        format: string;
                    };
                    conferencia_finalizada_em: {
                        type: string;
                        format: string;
                    };
                    divergencias: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                sku: {
                                    type: string;
                                };
                                qty_expected: {
                                    type: string;
                                };
                                qty_scanned: {
                                    type: string;
                                };
                                qty_diff: {
                                    type: string;
                                };
                                reason: {
                                    type: string;
                                };
                            };
                        };
                    };
                };
            };
            created_at: {
                type: string;
                format: string;
            };
            updated_at: {
                type: string;
                format: string;
            };
        };
        required: string[];
    };
    purchaseOrder: {
        $id: string;
        type: string;
        description: string;
        properties: {
            id: {
                type: string;
            };
            external_id: {
                type: string;
            };
            order_type: {
                type: string;
                enum: string[];
            };
            status: {
                type: string;
                enum: string[];
            };
            total_value: {
                type: string;
            };
            issue_date: {
                type: string;
                format: string;
            };
            expected_delivery: {
                type: string;
                format: string;
            };
            approved_by: {
                type: string;
            };
            approval_date: {
                type: string;
                format: string;
            };
            notes: {
                type: string;
            };
            created_at: {
                type: string;
                format: string;
            };
            updated_at: {
                type: string;
                format: string;
            };
            core_order_items: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        id: {
                            type: string;
                        };
                        item_seq: {
                            type: string;
                        };
                        qty_ordered: {
                            type: string;
                        };
                        unit_cost: {
                            type: string;
                        };
                        unit_price: {
                            type: string;
                        };
                        total_cost: {
                            type: string;
                        };
                        notes: {
                            type: string;
                        };
                    };
                };
            };
        };
    };
    ecaPurchaseFlowWebhook: {
        $id: string;
        type: string;
        required: string[];
        properties: {
            action: {
                type: string;
                enum: ("create_order" | "approve_order" | "register_invoice" | "arrive_at_cd" | "start_conference" | "scan_items" | "effectuate_cd")[];
                description: string;
            };
            attributes: {
                type: string;
                description: string;
                properties: {
                    external_id: {
                        type: string;
                        description: string;
                    };
                    order_number: {
                        type: string;
                    };
                    supplier_code: {
                        type: string;
                    };
                    supplier_name: {
                        type: string;
                    };
                    total_value: {
                        type: string;
                    };
                    issue_date: {
                        type: string;
                    };
                    expected_delivery: {
                        type: string;
                    };
                    destination: {
                        type: string;
                    };
                    approved_by: {
                        type: string;
                    };
                    approval_date: {
                        type: string;
                    };
                    notes: {
                        type: string;
                    };
                    invoice_number: {
                        type: string;
                    };
                    location_code: {
                        type: string;
                    };
                    items: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                item_sequence: {
                                    type: string;
                                };
                                product_id: {
                                    type: string;
                                    description: string;
                                };
                                product_name: {
                                    type: string;
                                };
                                variant_code: {
                                    type: string;
                                };
                                size: {
                                    type: string;
                                };
                                color: {
                                    type: string;
                                };
                                quantity_ordered: {
                                    type: string;
                                };
                                quantity_invoiced: {
                                    type: string;
                                };
                                quantity_received: {
                                    type: string;
                                };
                                quantity_divergence: {
                                    type: string;
                                };
                                unit_cost: {
                                    type: string;
                                };
                                unit_price: {
                                    type: string;
                                };
                                total_cost: {
                                    type: string;
                                };
                                notes: {
                                    type: string;
                                };
                                divergence_reason: {
                                    type: string;
                                };
                            };
                            required: string[];
                        };
                    };
                    received_items: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                item_sequence: {
                                    type: string;
                                };
                                variant_code: {
                                    type: string;
                                };
                                quantity_invoiced: {
                                    type: string;
                                };
                                quantity_received: {
                                    type: string;
                                };
                                quantity_divergence: {
                                    type: string;
                                };
                                unit_price: {
                                    type: string;
                                };
                                divergence_reason: {
                                    type: string;
                                };
                            };
                        };
                    };
                    inventory_impact: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                variant_code: {
                                    type: string;
                                };
                                location_code: {
                                    type: string;
                                };
                                previous_stock: {
                                    type: string;
                                };
                                received_qty: {
                                    type: string;
                                };
                                new_stock: {
                                    type: string;
                                };
                            };
                        };
                    };
                    location: {
                        type: string;
                        properties: {
                            location_code: {
                                type: string;
                            };
                            location_name: {
                                type: string;
                            };
                        };
                    };
                };
            };
            metadata: {
                type: string;
                description: string;
                properties: {
                    source_system: {
                        type: string;
                    };
                    user_id: {
                        type: string;
                    };
                    timestamp: {
                        type: string;
                        format: string;
                    };
                };
            };
        };
    };
    purchaseFlowWebhook: {
        $id: string;
        type: string;
        description: string;
        required: string[];
        properties: {
            action: {
                type: string;
                enum: string[];
            };
            data: {
                type: string;
                properties: {
                    purchase_order: {
                        type: string;
                        properties: {
                            order_number: {
                                type: string;
                            };
                            supplier_code: {
                                type: string;
                            };
                            supplier_name: {
                                type: string;
                            };
                            total_value: {
                                type: string;
                            };
                            issue_date: {
                                type: string;
                            };
                            expected_delivery: {
                                type: string;
                            };
                            destination: {
                                type: string;
                            };
                            approved_by: {
                                type: string;
                            };
                            approval_date: {
                                type: string;
                            };
                            notes: {
                                type: string;
                            };
                        };
                    };
                    items: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                item_sequence: {
                                    type: string;
                                };
                                product_code: {
                                    type: string;
                                };
                                product_name: {
                                    type: string;
                                };
                                variant_code: {
                                    type: string;
                                };
                                size: {
                                    type: string;
                                };
                                color: {
                                    type: string;
                                };
                                quantity_ordered: {
                                    type: string;
                                };
                                quantity_invoiced: {
                                    type: string;
                                };
                                quantity_received: {
                                    type: string;
                                };
                                quantity_divergence: {
                                    type: string;
                                };
                                unit_cost: {
                                    type: string;
                                };
                                unit_price: {
                                    type: string;
                                };
                                total_cost: {
                                    type: string;
                                };
                                notes: {
                                    type: string;
                                };
                                divergence_reason: {
                                    type: string;
                                };
                            };
                        };
                    };
                    invoice: {
                        type: string;
                        properties: {
                            invoice_number: {
                                type: string;
                            };
                            issue_date: {
                                type: string;
                            };
                            total_value: {
                                type: string;
                            };
                            supplier_code: {
                                type: string;
                            };
                        };
                    };
                    received_items: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                item_sequence: {
                                    type: string;
                                };
                                variant_code: {
                                    type: string;
                                };
                                quantity_invoiced: {
                                    type: string;
                                };
                                quantity_received: {
                                    type: string;
                                };
                                quantity_divergence: {
                                    type: string;
                                };
                                unit_price: {
                                    type: string;
                                };
                                divergence_reason: {
                                    type: string;
                                };
                            };
                        };
                    };
                    inventory_impact: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                variant_code: {
                                    type: string;
                                };
                                location_code: {
                                    type: string;
                                };
                                previous_stock: {
                                    type: string;
                                };
                                received_qty: {
                                    type: string;
                                };
                                new_stock: {
                                    type: string;
                                };
                            };
                        };
                    };
                    location: {
                        type: string;
                        properties: {
                            location_code: {
                                type: string;
                            };
                            location_name: {
                                type: string;
                            };
                        };
                    };
                };
            };
        };
    };
    ecaPurchaseFlowResponse: {
        $id: string;
        type: string;
        properties: {
            success: {
                type: string;
                description: string;
            };
            action: {
                type: string;
                enum: ("create_order" | "approve_order" | "register_invoice" | "arrive_at_cd" | "start_conference" | "scan_items" | "effectuate_cd")[];
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
                        enum: ("PENDENTE" | "APPROVED" | "PRE_BAIXA" | "AGUARDANDO_CONFERENCIA_CD" | "EM_CONFERENCIA_CD" | "CONFERENCIA_CD_SEM_DIVERGENCIA" | "CONFERENCIA_CD_COM_DIVERGENCIA" | "EFETIVADO_CD")[];
                        description: string;
                    };
                    to: {
                        type: string;
                        enum: ("PENDENTE" | "APPROVED" | "PRE_BAIXA" | "AGUARDANDO_CONFERENCIA_CD" | "EM_CONFERENCIA_CD" | "CONFERENCIA_CD_SEM_DIVERGENCIA" | "CONFERENCIA_CD_COM_DIVERGENCIA" | "EFETIVADO_CD")[];
                        description: string;
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
                    organization_id: {
                        type: string;
                    };
                    action: {
                        type: string;
                        enum: ("create_order" | "approve_order" | "register_invoice" | "arrive_at_cd" | "start_conference" | "scan_items" | "effectuate_cd")[];
                    };
                    event_uuid: {
                        type: string;
                    };
                };
            };
        };
        required: string[];
    };
    purchaseFlowResponse: {
        $id: string;
        type: string;
        description: string;
        properties: {
            success: {
                type: string;
            };
            action: {
                type: string;
            };
            transaction_id: {
                type: string;
            };
            entity_ids: {
                type: string;
                items: {
                    type: string;
                };
            };
            state_transition: {
                type: string;
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
            };
            metadata: {
                type: string;
            };
        };
        required: string[];
    };
    purchaseAnalytics: {
        $id: string;
        type: string;
        properties: {
            summary: {
                type: string;
                properties: {
                    totalOrders: {
                        type: string;
                    };
                    totalValue: {
                        type: string;
                    };
                    avgOrderValue: {
                        type: string;
                    };
                    statusDistribution: {
                        type: string;
                        additionalProperties: {
                            type: string;
                        };
                    };
                };
            };
            trends: {
                type: string;
                properties: {
                    monthly: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                month: {
                                    type: string;
                                };
                                orders: {
                                    type: string;
                                };
                                value: {
                                    type: string;
                                };
                            };
                        };
                    };
                };
            };
            suppliers: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        supplierId: {
                            type: string;
                        };
                        totalOrders: {
                            type: string;
                        };
                        totalValue: {
                            type: string;
                        };
                        avgOrderValue: {
                            type: string;
                        };
                        avgLeadTime: {
                            type: string;
                        };
                    };
                };
            };
            leadTime: {
                type: string;
                properties: {
                    avgLeadTime: {
                        type: string;
                    };
                    minLeadTime: {
                        type: string;
                    };
                    maxLeadTime: {
                        type: string;
                    };
                    medianLeadTime: {
                        type: string;
                    };
                };
            };
            generatedAt: {
                type: string;
                format: string;
            };
        };
    };
};
//# sourceMappingURL=banban-purchase-flow-schemas.d.ts.map