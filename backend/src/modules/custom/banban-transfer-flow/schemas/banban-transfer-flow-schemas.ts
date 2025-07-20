import { FastifyInstance, FastifySchema } from 'fastify';
import {
  TRANSFER_OUT_STATES,
  TRANSFER_IN_STATES,
  TRANSFER_ACTIONS,
  TRANSACTION_TYPES
} from '@shared/enums';

/**
 * Schemas ECA para Transfer Flow
 * Atualizado para usar enums centralizados e estrutura genérica
 */

// Schema ECA para Transfer Transaction
export const ECATransferDataSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', description: 'ID interno da transação' },
    tenant_id: { type: 'string', description: 'ID do tenant (fixo para BanBan)' },
    transaction_type: { 
      type: 'string', 
      enum: [TRANSACTION_TYPES.TRANSFER_OUT, TRANSACTION_TYPES.TRANSFER_IN],
      description: 'Tipo da transação (TRANSFER_OUT ou TRANSFER_IN)'
    },
    external_id: { 
      type: 'string', 
      description: 'Número da transferência no sistema externo' 
    },
    status: { 
      type: 'string',
      enum: [...Object.values(TRANSFER_OUT_STATES), ...Object.values(TRANSFER_IN_STATES)],
      description: 'Estado atual da transferência conforme máquina de estados ECA'
    },
    attributes: {
      type: 'object',
      description: 'Dados específicos da transferência',
      properties: {
        origin_location_external_id: { type: 'string', description: 'Código do local de origem' },
        destination_location_external_id: { type: 'string', description: 'Código do local de destino' },
        transfer_date: { type: 'string', format: 'date-time', description: 'Data da transferência' },
        shipping_info: {
          type: 'object',
          properties: {
            carrier: { type: 'string' },
            tracking_number: { type: 'string' },
            estimated_delivery: { type: 'string', format: 'date-time' }
          }
        },
        notes: { type: 'string' },
        mapa_separacao_id: { type: 'string', description: 'ID do mapa de separação' },
        operador_id: { type: 'string', description: 'ID do operador' },
        veiculo_id: { type: 'string', description: 'ID do veículo' },
        doca_id: { type: 'string', description: 'ID da doca' },
        divergencias: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sku: { type: 'string' },
              qty_solicitada: { type: 'number' },
              qty_separada: { type: 'number' },
              qty_diferenca: { type: 'number' },
              reason: { type: 'string' }
            }
          }
        },
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
      required: ['origin_location_external_id', 'destination_location_external_id', 'transfer_date']
    },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' }
  },
  required: ['external_id', 'transaction_type', 'status', 'attributes']
};

// Schema legacy mantido para compatibilidade
export const TransferDataSchema = {
  type: 'object',
  properties: {
    transfer_id: { type: 'string' },
    origin_location_external_id: { type: 'string' },
    destination_location_external_id: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          product_id: { type: 'string' },
          quantity: { type: 'number' },
          unit_cost: { type: 'number' }
        },
        required: ['product_id', 'quantity'],
        additionalProperties: false
      }
    },
    transfer_date: { type: 'string', format: 'date-time' },
    status: { type: 'string' },
    shipping_info: {
      type: 'object',
      properties: {
        carrier: { type: 'string' },
        tracking_number: { type: 'string' },
        estimated_delivery: { type: 'string', format: 'date-time' }
      },
      additionalProperties: false
    },
    notes: { type: 'string' }
  },
  required: ['origin_location_external_id', 'destination_location_external_id', 'items', 'transfer_date', 'status'],
  additionalProperties: false
};

// Schema ECA para webhook de Transfer Flow
export const ECATransferWebhookSchema: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      action: { 
        type: 'string',
        enum: Object.values(TRANSFER_ACTIONS),
        description: 'Ação ECA a ser executada'
      },
      attributes: {
        type: 'object',
        description: 'Dados da ação de transferência',
        properties: {
          external_id: { 
            type: 'string', 
            description: 'ID externo da transferência' 
          },
          origin_location_external_id: { type: 'string' },
          destination_location_external_id: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                product_id: { type: 'string', description: 'SKU/Código do produto' },
                quantity: { type: 'number' },
                unit_cost: { type: 'number' },
                quantity_requested: { type: 'number' },
                quantity_separated: { type: 'number' },
                quantity_received: { type: 'number' },
                divergence_reason: { type: 'string' }
              },
              required: ['product_id', 'quantity']
            }
          },
          transfer_date: { type: 'string', format: 'date-time' },
          shipping_info: {
            type: 'object',
            properties: {
              carrier: { type: 'string' },
              tracking_number: { type: 'string' },
              estimated_delivery: { type: 'string', format: 'date-time' }
            }
          },
          notes: { type: 'string' },
          // Dados específicos de separação
          mapa_separacao_id: { type: 'string' },
          operador_id: { type: 'string' },
          doca_id: { type: 'string' },
          veiculo_id: { type: 'string' },
          // Dados de conferência
          conferencia_iniciada_em: { type: 'string', format: 'date-time' },
          conferencia_finalizada_em: { type: 'string', format: 'date-time' }
        },
        required: ['origin_location_external_id', 'destination_location_external_id']
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
    },
    required: ['action', 'attributes'],
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        action: { 
          type: 'string',
          enum: Object.values(TRANSFER_ACTIONS)
        },
        transaction_id: { type: 'string' },
        entity_ids: {
          type: 'array',
          items: { type: 'string' }
        },
        relationship_ids: {
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
            organization_id: { type: 'string' },
            action: { type: 'string' },
            event_uuid: { type: 'string' }
          }
        }
      }
    }
  }
};

// Schema para GET query
export const QueryTransfersSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      org: { type: 'string' },
      transfer_id: { type: 'string' },
      origin_location_external_id: { type: 'string' },
      destination_location_external_id: { type: 'string' },
      status: {
        type: 'string',
        enum: ['REQUESTED', 'SHIPPED', 'RECEIVED', 'CANCELLED']
      },
      from_date: { type: 'string', format: 'date-time' },
      to_date: { type: 'string', format: 'date-time' },
      limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
      offset: { type: 'number', minimum: 0, default: 0 }
    },
    required: ['org'],
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            transfers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  transfer_id: { type: 'string' },
                  origin_location_id: { type: 'string' },
                  destination_location_id: { type: 'string' },
                  status: { type: 'string' },
                  transfer_date: { type: 'string' },
                  created_at: { type: 'string' },
                  updated_at: { type: 'string' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        product_id: { type: 'string' },
                        quantity: { type: 'number' },
                        unit_cost: { type: 'number' }
                      }
                    }
                  }
                }
              }
            },
            total: { type: 'number' },
            limit: { type: 'number' },
            offset: { type: 'number' }
          }
        }
      }
    }
  }
};

// Schema para GET analytics
export const AnalyticsSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      org: { type: 'string' },
      from_date: { type: 'string', format: 'date-time' },
      to_date: { type: 'string', format: 'date-time' },
      location_external_id: { type: 'string' },
      product_id: { type: 'string' }
    },
    required: ['org'],
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            transfer_metrics: {
              type: 'object',
              properties: {
                total_transfers: { type: 'number' },
                total_items_transferred: { type: 'number' },
                total_value_transferred: { type: 'number' },
                average_transfer_time: { type: 'number' },
                transfer_success_rate: { type: 'number' }
              }
            },
            status_distribution: {
              type: 'object',
              properties: {
                REQUESTED: { type: 'number' },
                SHIPPED: { type: 'number' },
                RECEIVED: { type: 'number' },
                CANCELLED: { type: 'number' }
              }
            },
            location_analytics: {
              type: 'object',
              properties: {
                top_origin_locations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      location_external_id: { type: 'string' },
                      transfers_count: { type: 'number' },
                      total_items: { type: 'number' },
                      total_value: { type: 'number' }
                    }
                  }
                },
                top_destination_locations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      location_external_id: { type: 'string' },
                      transfers_count: { type: 'number' },
                      total_items: { type: 'number' },
                      total_value: { type: 'number' }
                    }
                  }
                }
              }
            },
            time_trends: {
              type: 'object',
              properties: {
                daily_transfers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      date: { type: 'string' },
                      transfers_count: { type: 'number' },
                      items_count: { type: 'number' },
                      total_value: { type: 'number' }
                    }
                  }
                },
                monthly_trends: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      month: { type: 'string' },
                      transfers_count: { type: 'number' },
                      items_count: { type: 'number' },
                      total_value: { type: 'number' },
                      average_transfer_time: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

// Schema para GET health
export const HealthCheckSchema: FastifySchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        module: { type: 'string' },
        version: { type: 'string' },
        timestamp: { type: 'string' },
        uptime: { type: 'number' },
        database_connection: { type: 'string' },
        last_processed_event: { type: 'string' }
      }
    }
  }
};

// Função para registrar todos os schemas ECA
export function registerTransferFlowSchemas(fastify: FastifyInstance) {
  // Registrar schemas ECA
  fastify.addSchema({
    $id: 'eca-transfer-data',
    ...ECATransferDataSchema
  });
  
  // Registrar schemas legacy para compatibilidade
  fastify.addSchema({
    $id: 'transfer-data',
    ...TransferDataSchema
  });
}

