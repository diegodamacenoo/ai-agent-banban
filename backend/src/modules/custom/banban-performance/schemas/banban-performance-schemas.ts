export const banbanPerformanceSchemas = {
  fashionMetrics: {
    $id: 'banban-fashion-metrics',
    type: 'object',
    properties: {
      totalCollections: { type: 'integer' },
      activeProducts: { type: 'integer' },
      seasonalTrends: {
        type: 'object',
        properties: {
          spring: {
            type: 'object',
            properties: {
              growth: { type: 'number' },
              revenue: { type: 'number' }
            }
          },
          summer: {
            type: 'object',
            properties: {
              growth: { type: 'number' },
              revenue: { type: 'number' }
            }
          },
          fall: {
            type: 'object',
            properties: {
              growth: { type: 'number' },
              revenue: { type: 'number' }
            }
          },
          winter: {
            type: 'object',
            properties: {
              growth: { type: 'number' },
              revenue: { type: 'number' }
            }
          }
        }
      },
      categoryPerformance: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            revenue: { type: 'number' },
            growth: { type: 'number' },
            margin: { type: 'number' }
          }
        }
      },
      trendingStyles: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            style: { type: 'string' },
            demand: { type: 'number' },
            growth: { type: 'number' }
          }
        }
      },
      sizeDistribution: {
        type: 'object',
        additionalProperties: { type: 'number' }
      },
      colorTrends: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            color: { type: 'string' },
            popularity: { type: 'number' },
            sales: { type: 'number' }
          }
        }
      }
    }
  },

  inventoryTurnover: {
    $id: 'banban-inventory-turnover',
    type: 'object',
    properties: {
      period: { type: 'string' },
      periodDays: { type: 'integer' },
      categories: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            turnoverRate: { type: 'number' },
            averageStock: { type: 'integer' },
            soldUnits: { type: 'integer' },
            daysInStock: { type: 'integer' },
            operational_status: { type: 'string' },
            health_status: { type: 'string' },
            topProducts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  turnover: { type: 'number' }
                }
              }
            }
          }
        }
      },
      summary: {
        type: 'object',
        properties: {
          averageTurnover: { type: 'number' },
          totalCategories: { type: 'integer' },
          fastMoving: { type: 'integer' },
          slowMoving: { type: 'integer' }
        }
      }
    }
  },

  seasonalAnalysis: {
    $id: 'banban-seasonal-analysis',
    type: 'object',
    properties: {
      year: { type: 'integer' },
      seasons: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            season: { type: 'string' },
            revenue: { type: 'number' },
            growth: { type: 'number' },
            topCategories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  revenue: { type: 'number' }
                }
              }
            },
            weatherImpact: {
              type: 'object',
              properties: {
                temperature: { type: 'number' },
                precipitation: { type: 'number' },
                salesCorrelation: { type: 'number' }
              }
            },
            promotions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  discount: { type: 'number' }
                }
              }
            }
          }
        }
      },
      yearOverYear: {
        type: 'object',
        properties: {
          totalGrowth: { type: 'number' },
          bestSeason: { type: 'string' },
          worstSeason: { type: 'string' }
        }
      }
    }
  },

  brandPerformance: {
    $id: 'banban-brand-performance',
    type: 'object',
    properties: {
      period: { type: 'string' },
      metric: { type: 'string' },
      brands: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            brandId: { type: 'string' },
            brandName: { type: 'string' },
            metrics: {
              type: 'object',
              properties: {
                revenue: { type: 'number' },
                units: { type: 'integer' },
                profit: { type: 'number' },
                margin: { type: 'number' }
              }
            },
            growth: { type: 'number' },
            topProducts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  sales: { type: 'number' }
                }
              }
            },
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  contribution: { type: 'number' }
                }
              }
            }
          }
        }
      },
      summary: {
        type: 'object',
        properties: {
          totalBrands: { type: 'integer' },
          averageGrowth: { type: 'number' },
          topPerformer: { type: 'string' },
          totalRevenue: { type: 'number' }
        }
      }
    }
  }
}; 