
export const banbanSalesFlowSchemas = {
  // Sale entity schema
  saleEntity: {
    $id: 'banban-sale-entity',
    type: 'object',
    properties: {
      sale_id: { type: 'string' },
      customer_id: { type: 'string' },
      location_id: { type: 'string' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            product_id: { type: 'string' },
            quantity: { type: 'number' },
            unit_price: { type: 'number' },
            total_price: { type: 'number' }
          },
          required: ['product_id', 'quantity', 'unit_price', 'total_price']
        }
      },
      total_amount: { type: 'number' },
      payment_method: { type: 'string' },
      payment_status: { type: 'string' },
      sale_date: { type: 'string' },
      status: { type: 'string' }
    },
    required: ['location_id', 'items', 'total_amount', 'payment_method', 'payment_status', 'sale_date', 'status']
  },

  // Return entity schema
  returnEntity: {
    $id: 'banban-return-entity',
    type: 'object',
    properties: {
      return_id: { type: 'string' },
      original_sale_id: { type: 'string' },
      location_id: { type: 'string' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            product_id: { type: 'string' },
            quantity: { type: 'number' },
            unit_price: { type: 'number' },
            total_price: { type: 'number' },
            reason: { type: 'string' }
          },
          required: ['product_id', 'quantity', 'unit_price', 'total_price', 'reason']
        }
      },
      total_amount: { type: 'number' },
      return_date: { type: 'string' },
      status: { type: 'string' }
    },
    required: ['original_sale_id', 'location_id', 'items', 'total_amount', 'return_date', 'status']
  },

  // Sales Flow webhook payload schema
  salesFlowWebhook: {
    $id: 'banban-sales-flow-webhook',
    type: 'object',
    properties: {
      event_type: { 
        type: 'string',
        enum: ['sale_completed', 'sale_cancelled', 'return_processed']
      },
      organization_id: { type: 'string' },
      data: {
        type: 'object',
        properties: {
          sale_id: { type: 'string' },
          customer_id: { type: 'string' },
          location_id: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                product_id: { type: 'string' },
                quantity: { type: 'number' },
                unit_price: { type: 'number' },
                total_price: { type: 'number' }
              }
            }
          },
          total_amount: { type: 'number' },
          payment_method: { type: 'string' },
          payment_status: { type: 'string' },
          sale_date: { type: 'string' },
          status: { type: 'string' }
        }
      }
    },
    required: ['event_type', 'organization_id', 'data']
  },

  // Sales Flow response schema
  salesFlowResponse: {
    $id: 'banban-sales-flow-response',
    type: 'object',
    properties: {
      success: { type: 'boolean', description: 'Indica se a ação foi executada com sucesso' },
      action: {
        type: 'string',
        enum: ['sale_completed', 'sale_cancelled', 'return_processed'],
        description: 'Ação ECA que foi executada'
      },
      transaction_id: {
        type: 'string',
        description: 'ID da transação criada/atualizada (se aplicável)'
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
        description: 'Transição de estado executável (se aplicável)',
        properties: {
          from: { type: 'string' },
          to: { type: 'string' }
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
              records_processed: { type: 'number' },
              records_successful: { type: 'number' },
              records_failed: { type: 'number' }
            }
          }
        }
      },
      metadata: {
        type: 'object',
        properties: {
          processed_at: { type: 'string', format: 'date-time' },
          processing_time_ms: { type: 'number' },
          records_processed: { type: 'number' },
          records_successful: { type: 'number' },
          records_failed: { type: 'number' },
          success_rate: { type: 'string' }
        }
      },
      error: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
          details: { type: 'object' }
        }
      }
    },
    required: ['success', 'action', 'attributes', 'metadata']
  },

  // Sales analytics schema
  salesAnalytics: {
    $id: 'banban-sales-analytics',
    type: 'object',
    properties: {
      summary: {
        type: 'object',
        properties: {
          total_sales: { type: 'number' },
          total_revenue: { type: 'number' },
          total_returns: { type: 'number' },
          return_rate: { type: 'number' },
          avg_order_value: { type: 'number' },
          period_from: { type: 'string' },
          period_to: { type: 'string' }
        }
      },
      customer_metrics: {
        type: 'object',
        properties: {
          total_customers: { type: 'number' },
          new_customers: { type: 'number' },
          repeat_customers: { type: 'number' },
          avg_customer_value: { type: 'number' },
          top_customers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                customer_id: { type: 'string' },
                total_spent: { type: 'number' },
                total_orders: { type: 'number' }
              }
            }
          }
        }
      },
      product_metrics: {
        type: 'object',
        properties: {
          total_products_sold: { type: 'number' },
          top_products: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                product_id: { type: 'string' },
                quantity_sold: { type: 'number' },
                revenue: { type: 'number' }
              }
            }
          }
        }
      },
      location_metrics: {
        type: 'object',
        properties: {
          top_locations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                location_id: { type: 'string' },
                total_sales: { type: 'number' },
                total_revenue: { type: 'number' }
              }
            }
          }
        }
      },
      trends: {
        type: 'object',
        properties: {
          daily_sales: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string' },
                sales_count: { type: 'number' },
                revenue: { type: 'number' }
              }
            }
          },
          monthly_trends: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                month: { type: 'string' },
                sales_count: { type: 'number' },
                revenue: { type: 'number' },
                avg_order_value: { type: 'number' }
              }
            }
          }
        }
      }
    },
    required: ['summary', 'customer_metrics', 'product_metrics', 'location_metrics', 'trends']
  }
};