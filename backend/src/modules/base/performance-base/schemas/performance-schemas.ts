/**
 * Schemas JSON Schema para o módulo Performance Base
 */

export const PerformanceSchemas = {
  businessMetricsResponse: {
    $id: 'businessMetricsResponse',
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: {
        type: 'object',
        properties: {
          revenue: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              growth: { type: 'number' },
              period: { type: 'string' }
            },
            required: ['total', 'growth', 'period']
          },
          orders: {
            type: 'object',
            properties: {
              count: { type: 'number' },
              averageValue: { type: 'number' },
              growth: { type: 'number' }
            },
            required: ['count', 'averageValue', 'growth']
          },
          customers: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              new: { type: 'number' },
              retention: { type: 'number' }
            },
            required: ['total', 'new', 'retention']
          },
          products: {
            type: 'object',
            properties: {
              topSelling: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    sales: { type: 'number' }
                  },
                  required: ['id', 'name', 'sales']
                }
              },
              lowStock: { type: 'number' }
            },
            required: ['topSelling', 'lowStock']
          },
          generatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['revenue', 'orders', 'customers', 'products', 'generatedAt']
      },
      period: { type: 'string' },
      generatedAt: { type: 'string', format: 'date-time' },
      module: { type: 'string' }
    },
    required: ['success', 'data', 'period', 'generatedAt', 'module']
  },

  summaryResponse: {
    $id: 'summaryResponse',
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: {
        type: 'object',
        properties: {
          overview: {
            type: 'object',
            properties: {
              totalRevenue: { type: 'number' },
              totalOrders: { type: 'number' },
              totalCustomers: { type: 'number' },
              averageOrderValue: { type: 'number' }
            },
            required: ['totalRevenue', 'totalOrders', 'totalCustomers', 'averageOrderValue']
          },
          trends: {
            type: 'object',
            properties: {
              revenueGrowth: { type: 'number' },
              orderGrowth: { type: 'number' },
              customerGrowth: { type: 'number' }
            },
            required: ['revenueGrowth', 'orderGrowth', 'customerGrowth']
          },
          alerts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                message: { type: 'string' },
                severity: { type: 'string', enum: ['low', 'medium', 'high'] }
              },
              required: ['type', 'message', 'severity']
            }
          }
        },
        required: ['overview', 'trends', 'alerts']
      },
      generatedAt: { type: 'string', format: 'date-time' },
      module: { type: 'string' }
    },
    required: ['success', 'data', 'generatedAt', 'module']
  },

  calculateRequest: {
    $id: 'calculateRequest',
    type: 'object',
    properties: {
      metrics: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1
      },
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          filters: { type: 'object' }
        }
      }
    },
    required: ['metrics'],
    additionalProperties: false
  }
}; 