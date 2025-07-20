/**
 * Schemas ECA para Purchase Flow
 * Atualizado para usar enums centralizados e estrutura genérica
 */
import {
  PURCHASE_STATES,
  PURCHASE_ACTIONS,
  TRANSACTION_TYPES
} from '@shared/enums';

export const banbanPurchaseFlowSchemas = {
  // Schema ECA para Purchase Order
  ecaPurchaseOrder: {
    $id: 'eca-purchase-order',
    type: 'object',
    properties: {
      id: { type: 'string', description: 'ID interno da transação' },
      tenant_id: { type: 'string', description: 'ID do tenant (fixo para BanBan)' },
      transaction_type: { 
        type: 'string', 
        enum: [TRANSACTION_TYPES.ORDER_PURCHASE],
        description: 'Tipo da transação (sempre ORDER_PURCHASE)'
      },
      external_id: { 
        type: 'string', 
        description: 'Número do pedido no sistema externo (chave de negócio)' 
      },
      status: { 
        type: 'string',
        enum: Object.values(PURCHASE_STATES),
        description: 'Estado atual do pedido conforme máquina de estados ECA'
      },
      attributes: {
        type: 'object',
        description: 'Dados específicos do pedido de compra',
        properties: {
          total_value: { type: 'number', description: 'Valor total do pedido' },
          issue_date: { type: 'string', format: 'date', description: 'Data de emissão' },
          expected_delivery: { type: 'string', format: 'date', description: 'Data de entrega esperada' },
          approved_by: { type: 'string', description: 'Usuário que aprovou' },
          approval_date: { type: 'string', format: 'date-time', description: 'Data de aprovação' },
          notes: { type: 'string', description: 'Observações do pedido' },
          supplier_code: { type: 'string', description: 'Código do fornecedor' },
          supplier_name: { type: 'string', description: 'Nome do fornecedor' },
          destination: { type: 'string', description: 'Local de destino' },
          state_history: {
            type: 'array',
            description: 'Histórico de transições de estado',
            items: {
              type: 'object',
              properties: {
                from: { type: 'string' },
                to: { type: 'string' },
                transitioned_at: { type: 'string', format: 'date-time' },
                attributes: { type: 'object' }
              }
            }
          }
        },
        required: ['total_value', 'issue_date', 'supplier_code']
      },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' }
    },
    required: ['external_id', 'transaction_type', 'status', 'attributes']
  },

  // Schema ECA para Document Supplier In (NF de Entrada)
  ecaSupplierDocument: {
    $id: 'eca-supplier-document',
    type: 'object',
    properties: {
      id: { type: 'string' },
      organization_id: { type: 'string' },
      transaction_type: { 
        type: 'string', 
        enum: [TRANSACTION_TYPES.DOCUMENT_SUPPLIER_IN] 
      },
      external_id: { 
        type: 'string', 
        description: 'Número da nota fiscal' 
      },
      status: { 
        type: 'string',
        enum: Object.values(PURCHASE_STATES) 
      },
      attributes: {
        type: 'object',
        properties: {
          invoice_number: { type: 'string', description: 'Número da NF' },
          issue_date: { type: 'string', format: 'date', description: 'Data de emissão da NF' },
          total_value: { type: 'number', description: 'Valor total da NF' },
          supplier_code: { type: 'string', description: 'Código do fornecedor' },
          location_code: { type: 'string', description: 'Código do local (CD)' },
          conferencia_iniciada_em: { type: 'string', format: 'date-time' },
          conferencia_finalizada_em: { type: 'string', format: 'date-time' },
          divergencias: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                sku: { type: 'string' },
                qty_expected: { type: 'number' },
                qty_scanned: { type: 'number' },
                qty_diff: { type: 'number' },
                reason: { type: 'string' }
              }
            }
          }
        }
      },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' }
    },
    required: ['external_id', 'transaction_type', 'status', 'attributes']
  },

  // Schema legacy mantido para compatibilidade
  purchaseOrder: {
    $id: 'banban-purchase-order',
    type: 'object',
    description: 'DEPRECATED: Use ecaPurchaseOrder',
    properties: {
      id: { type: 'string' },
      external_id: { type: 'string' },
      order_type: { type: 'string', enum: ['PURCHASE'] },
      status: { type: 'string', enum: ['NEW', 'APPROVED', 'RECEIVED', 'CANCELLED'] },
      total_value: { type: 'number' },
      issue_date: { type: 'string', format: 'date' },
      expected_delivery: { type: 'string', format: 'date' },
      approved_by: { type: 'string' },
      approval_date: { type: 'string', format: 'date-time' },
      notes: { type: 'string' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
      core_order_items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            item_seq: { type: 'integer' },
            qty_ordered: { type: 'number' },
            unit_cost: { type: 'number' },
            unit_price: { type: 'number' },
            total_cost: { type: 'number' },
            notes: { type: 'string' }
          }
        }
      }
    }
  },

  // Schema ECA para Webhook de Purchase Flow
  ecaPurchaseFlowWebhook: {
    $id: 'eca-purchase-flow-webhook',
    type: 'object',
    required: ['action', 'attributes'],
    properties: {
      action: { 
        type: 'string',
        enum: Object.values(PURCHASE_ACTIONS),
        description: 'Ação ECA a ser executada'
      },
      attributes: {
        type: 'object',
        description: 'Dados da ação',
        properties: {
          external_id: { 
            type: 'string', 
            description: 'ID externo (número do pedido ou NF)' 
          },
          // Dados do pedido de compra
          order_number: { type: 'string' },
          supplier_code: { type: 'string' },
          supplier_name: { type: 'string' },
          total_value: { type: 'number' },
          issue_date: { type: 'string' },
          expected_delivery: { type: 'string' },
          destination: { type: 'string' },
          approved_by: { type: 'string' },
          approval_date: { type: 'string' },
          notes: { type: 'string' },
          // Dados da nota fiscal
          invoice_number: { type: 'string' },
          location_code: { type: 'string' },
          // Itens do pedido/NF
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                item_sequence: { type: 'integer' },
                product_id: { type: 'string', description: 'SKU/Código do produto' },
                product_name: { type: 'string' },
                variant_code: { type: 'string' },
                size: { type: 'string' },
                color: { type: 'string' },
                quantity_ordered: { type: 'number' },
                quantity_invoiced: { type: 'number' },
                quantity_received: { type: 'number' },
                quantity_divergence: { type: 'number' },
                unit_cost: { type: 'number' },
                unit_price: { type: 'number' },
                total_cost: { type: 'number' },
                notes: { type: 'string' },
                divergence_reason: { type: 'string' }
              },
              required: ['product_id', 'quantity_ordered']
            }
          },
          // Dados de recebimento/conferência
          received_items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                item_sequence: { type: 'integer' },
                variant_code: { type: 'string' },
                quantity_invoiced: { type: 'number' },
                quantity_received: { type: 'number' },
                quantity_divergence: { type: 'number' },
                unit_price: { type: 'number' },
                divergence_reason: { type: 'string' }
              }
            }
          },
          // Impacto no inventário
          inventory_impact: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                variant_code: { type: 'string' },
                location_code: { type: 'string' },
                previous_stock: { type: 'number' },
                received_qty: { type: 'number' },
                new_stock: { type: 'number' }
              }
            }
          },
          // Local da operação
          location: {
            type: 'object',
            properties: {
              location_code: { type: 'string' },
              location_name: { type: 'string' }
            }
          }
        }
      },
      metadata: {
        type: 'object',
        description: 'Metadados opcionais',
        properties: {
          source_system: { type: 'string' },
          user_id: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    }
  },

  // Schema legacy mantido para compatibilidade
  purchaseFlowWebhook: {
    $id: 'banban-purchase-flow-webhook',
    type: 'object',
    description: 'DEPRECATED: Use ecaPurchaseFlowWebhook',
    required: ['action', 'data'],
    properties: {
      action: { 
        type: 'string',
        enum: ['create_order', 'approve_order', 'register_invoice', 'start_conference', 'scan_items', 'complete_conference']
      },
      data: {
        type: 'object',
        properties: {
          purchase_order: {
            type: 'object',
            properties: {
              order_number: { type: 'string' },
              supplier_code: { type: 'string' },
              supplier_name: { type: 'string' },
              total_value: { type: 'number' },
              issue_date: { type: 'string' },
              expected_delivery: { type: 'string' },
              destination: { type: 'string' },
              approved_by: { type: 'string' },
              approval_date: { type: 'string' },
              notes: { type: 'string' }
            }
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                item_sequence: { type: 'integer' },
                product_code: { type: 'string' },
                product_name: { type: 'string' },
                variant_code: { type: 'string' },
                size: { type: 'string' },
                color: { type: 'string' },
                quantity_ordered: { type: 'number' },
                quantity_invoiced: { type: 'number' },
                quantity_received: { type: 'number' },
                quantity_divergence: { type: 'number' },
                unit_cost: { type: 'number' },
                unit_price: { type: 'number' },
                total_cost: { type: 'number' },
                notes: { type: 'string' },
                divergence_reason: { type: 'string' }
              }
            }
          },
          invoice: {
            type: 'object',
            properties: {
              invoice_number: { type: 'string' },
              issue_date: { type: 'string' },
              total_value: { type: 'number' },
              supplier_code: { type: 'string' }
            }
          },
          received_items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                item_sequence: { type: 'integer' },
                variant_code: { type: 'string' },
                quantity_invoiced: { type: 'number' },
                quantity_received: { type: 'number' },
                quantity_divergence: { type: 'number' },
                unit_price: { type: 'number' },
                divergence_reason: { type: 'string' }
              }
            }
          },
          inventory_impact: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                variant_code: { type: 'string' },
                location_code: { type: 'string' },
                previous_stock: { type: 'number' },
                received_qty: { type: 'number' },
                new_stock: { type: 'number' }
              }
            }
          },
          location: {
            type: 'object',
            properties: {
              location_code: { type: 'string' },
              location_name: { type: 'string' }
            }
          }
        }
      }
    }
  },

  // Schema ECA para Response de Purchase Flow
  ecaPurchaseFlowResponse: {
    $id: 'eca-purchase-flow-response',
    type: 'object',
    properties: {
      success: { type: 'boolean', description: 'Indica se a ação foi executada com sucesso' },
      action: { 
        type: 'string',
        enum: Object.values(PURCHASE_ACTIONS),
        description: 'Ação ECA que foi executada'
      },
      transaction_id: { 
        type: 'string', 
        description: 'ID da transação criada/atualizada' 
      },
      entity_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'IDs das entidades criadas/atualizadas'
      },
      relationship_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'IDs dos relacionamentos criados'
      },
      state_transition: {
        type: 'object',
        description: 'Transição de estado executada',
        properties: {
          from: { 
            type: 'string',
            enum: Object.values(PURCHASE_STATES),
            description: 'Estado anterior'
          },
          to: { 
            type: 'string',
            enum: Object.values(PURCHASE_STATES),
            description: 'Estado atual'
          }
        }
      },
      attributes: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          entityType: { type: 'string' },
          entityId: { type: 'string' },
          summary: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              records_processed: { type: 'integer' },
              records_successful: { type: 'integer' },
              records_failed: { type: 'integer' }
            }
          }
        }
      },
      metadata: {
        type: 'object',
        properties: {
          processed_at: { type: 'string', format: 'date-time' },
          processing_time_ms: { type: 'number' },
          organization_id: { type: 'string' },
          action: { 
            type: 'string',
            enum: Object.values(PURCHASE_ACTIONS)
          },
          event_uuid: { type: 'string' }
        }
      }
    },
    required: ['success', 'action', 'attributes', 'metadata']
  },

  // Schema legacy mantido para compatibilidade
  purchaseFlowResponse: {
    $id: 'banban-purchase-flow-response',
    type: 'object',
    description: 'DEPRECATED: Use ecaPurchaseFlowResponse',
    properties: {
      success: { type: 'boolean' },
      action: { type: 'string' },
      transaction_id: { type: 'string' },
      entity_ids: {
        type: 'array',
        items: { type: 'string' }
      },
      state_transition: {
        type: 'object',
        properties: {
          from: { type: 'string' },
          to: { type: 'string' }
        }
      },
      attributes: { type: 'object' },
      metadata: { type: 'object' }
    },
    required: ['success', 'action']
  },

  purchaseAnalytics: {
    $id: 'banban-purchase-analytics',
    type: 'object',
    properties: {
      summary: {
        type: 'object',
        properties: {
          totalOrders: { type: 'integer' },
          totalValue: { type: 'number' },
          avgOrderValue: { type: 'number' },
          statusDistribution: {
            type: 'object',
            additionalProperties: { type: 'integer' }
          }
        }
      },
      trends: {
        type: 'object',
        properties: {
          monthly: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                month: { type: 'string' },
                orders: { type: 'integer' },
                value: { type: 'number' }
              }
            }
          }
        }
      },
      suppliers: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            supplierId: { type: 'string' },
            totalOrders: { type: 'integer' },
            totalValue: { type: 'number' },
            avgOrderValue: { type: 'number' },
            avgLeadTime: { type: 'number' }
          }
        }
      },
      leadTime: {
        type: 'object',
        properties: {
          avgLeadTime: { type: 'number' },
          minLeadTime: { type: 'number' },
          maxLeadTime: { type: 'number' },
          medianLeadTime: { type: 'number' }
        }
      },
      generatedAt: { type: 'string', format: 'date-time' }
    }
  }
};