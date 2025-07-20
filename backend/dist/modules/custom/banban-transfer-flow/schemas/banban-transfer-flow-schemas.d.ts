import { FastifyInstance, FastifySchema } from 'fastify';
export declare const ECATransferDataSchema: {
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
            enum: ("TRANSFER_OUT" | "TRANSFER_IN")[];
            description: string;
        };
        external_id: {
            type: string;
            description: string;
        };
        status: {
            type: string;
            enum: ("PEDIDO_TRANSFERENCIA_CRIADO" | "MAPA_SEPARACAO_CRIADO" | "AGUARDANDO_SEPARACAO_CD" | "EM_SEPARACAO_CD" | "SEPARACAO_CD_SEM_DIVERGENCIA" | "SEPARACAO_CD_COM_DIVERGENCIA" | "SEPARADO_PRE_DOCA" | "EMBARCADO_CD" | "TRANSFERENCIA_CDH_FATURADA" | "AGUARDANDO_CONFERENCIA_LOJA" | "EM_CONFERENCIA_LOJA" | "CONFERENCIA_LOJA_SEM_DIVERGENCIA" | "CONFERENCIA_LOJA_COM_DIVERGENCIA" | "EFETIVADO_LOJA")[];
            description: string;
        };
        attributes: {
            type: string;
            description: string;
            properties: {
                origin_location_external_id: {
                    type: string;
                    description: string;
                };
                destination_location_external_id: {
                    type: string;
                    description: string;
                };
                transfer_date: {
                    type: string;
                    format: string;
                    description: string;
                };
                shipping_info: {
                    type: string;
                    properties: {
                        carrier: {
                            type: string;
                        };
                        tracking_number: {
                            type: string;
                        };
                        estimated_delivery: {
                            type: string;
                            format: string;
                        };
                    };
                };
                notes: {
                    type: string;
                };
                mapa_separacao_id: {
                    type: string;
                    description: string;
                };
                operador_id: {
                    type: string;
                    description: string;
                };
                veiculo_id: {
                    type: string;
                    description: string;
                };
                doca_id: {
                    type: string;
                    description: string;
                };
                divergencias: {
                    type: string;
                    items: {
                        type: string;
                        properties: {
                            sku: {
                                type: string;
                            };
                            qty_solicitada: {
                                type: string;
                            };
                            qty_separada: {
                                type: string;
                            };
                            qty_diferenca: {
                                type: string;
                            };
                            reason: {
                                type: string;
                            };
                        };
                    };
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
export declare const TransferDataSchema: {
    type: string;
    properties: {
        transfer_id: {
            type: string;
        };
        origin_location_external_id: {
            type: string;
        };
        destination_location_external_id: {
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
                };
                required: string[];
                additionalProperties: boolean;
            };
        };
        transfer_date: {
            type: string;
            format: string;
        };
        status: {
            type: string;
        };
        shipping_info: {
            type: string;
            properties: {
                carrier: {
                    type: string;
                };
                tracking_number: {
                    type: string;
                };
                estimated_delivery: {
                    type: string;
                    format: string;
                };
            };
            additionalProperties: boolean;
        };
        notes: {
            type: string;
        };
    };
    required: string[];
    additionalProperties: boolean;
};
export declare const ECATransferWebhookSchema: FastifySchema;
export declare const QueryTransfersSchema: FastifySchema;
export declare const AnalyticsSchema: FastifySchema;
export declare const HealthCheckSchema: FastifySchema;
export declare function registerTransferFlowSchemas(fastify: FastifyInstance): void;
//# sourceMappingURL=banban-transfer-flow-schemas.d.ts.map