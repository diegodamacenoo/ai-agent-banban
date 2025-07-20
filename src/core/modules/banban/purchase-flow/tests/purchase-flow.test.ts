import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PurchaseFlowService, PurchaseOrderData } from '../src/services/PurchaseFlowService';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    })),
    upsert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    }))
  }))
};

describe('PurchaseFlowService', () => {
  let service: PurchaseFlowService;
  const mockOrganizationId = 'test-org-id';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PurchaseFlowService(mockSupabase, mockOrganizationId);
  });

  describe('processPurchaseOrderCreated', () => {
    it('should create a purchase order successfully', async () => {
      const mockOrderData: PurchaseOrderData = {
        purchase_order: {
          order_number: 'PO-001',
          supplier_code: 'SUP001',
          supplier_name: 'Test Supplier',
          total_value: 1000,
          destination: 'WH001'
        },
        items: [
          {
            item_sequence: 1,
            product_code: 'PROD001',
            product_name: 'Test Product',
            variant_code: 'VAR001',
            size: 'M',
            color: 'Blue',
            quantity_ordered: 10,
            unit_cost: 50,
            total_cost: 500
          }
        ]
      };

      // Mock successful responses
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'tenant_business_entities') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({ data: null, error: 'not found' }))
              }))
            })),
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => ({ 
                  data: { id: 'entity-id' }, 
                  error: null 
                }))
              }))
            }))
          };
        }
        if (table === 'core_orders') {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => ({ 
                  data: { id: 'order-id' }, 
                  error: null 
                }))
              }))
            }))
          };
        }
        if (table === 'core_order_items') {
          return {
            insert: jest.fn(() => ({ error: null }))
          };
        }
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ data: null, error: 'not found' }))
            }))
          }))
        };
      });

      const result = await service.processPurchaseOrderCreated(mockOrderData);

      expect(result.success).toBe(true);
      expect(result.entityType).toBe('ORDER');
      expect(result.entityId).toBe('order-id');
      expect(result.summary.records_successful).toBeGreaterThan(0);
    });

    it('should throw error when purchase_order is missing', async () => {
      const invalidData: PurchaseOrderData = {
        items: []
      };

      await expect(service.processPurchaseOrderCreated(invalidData))
        .rejects
        .toThrow('Dados de pedido de compra incompletos');
    });

    it('should throw error when items are missing', async () => {
      const invalidData: PurchaseOrderData = {
        purchase_order: {
          order_number: 'PO-001',
          supplier_code: 'SUP001'
        }
      };

      await expect(service.processPurchaseOrderCreated(invalidData))
        .rejects
        .toThrow('Dados de pedido de compra incompletos');
    });
  });

  describe('processPurchaseOrderApproved', () => {
    it('should approve a purchase order successfully', async () => {
      const mockOrderData: PurchaseOrderData = {
        purchase_order: {
          order_number: 'PO-001',
          approved_by: 'John Doe',
          approval_date: '2024-01-15T10:00:00Z'
        }
      };

      // Mock order exists
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'core_orders') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({ data: { id: 'order-id' }, error: null }))
              }))
            })),
            update: jest.fn(() => ({
              eq: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn(() => ({ 
                    data: { id: 'order-id' }, 
                    error: null 
                  }))
                }))
              }))
            }))
          };
        }
        return {};
      });

      const result = await service.processPurchaseOrderApproved(mockOrderData);

      expect(result.success).toBe(true);
      expect(result.entityType).toBe('ORDER');
      expect(result.summary.records_successful).toBe(1);
    });

    it('should throw error when order number is missing', async () => {
      const invalidData: PurchaseOrderData = {
        purchase_order: {
          order_number: ''
        }
      };

      await expect(service.processPurchaseOrderApproved(invalidData))
        .rejects
        .toThrow('Número do pedido é obrigatório para aprovação');
    });

    it('should throw error when order is not found', async () => {
      const mockOrderData: PurchaseOrderData = {
        purchase_order: {
          order_number: 'NONEXISTENT'
        }
      };

      // Mock order not found
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({ data: null, error: 'not found' }))
          }))
        }))
      }));

      await expect(service.processPurchaseOrderApproved(mockOrderData))
        .rejects
        .toThrow('Pedido NONEXISTENT não encontrado');
    });
  });

  describe('processGoodsReceivedCD', () => {
    it('should process goods receipt successfully', async () => {
      const mockOrderData: PurchaseOrderData = {
        invoice: {
          invoice_number: 'INV-001',
          issue_date: '2024-01-15',
          total_value: 1000,
          supplier_code: 'SUP001'
        },
        received_items: [
          {
            item_sequence: 1,
            variant_code: 'VAR001',
            quantity_invoiced: 10,
            quantity_received: 10,
            quantity_divergence: 0,
            unit_price: 100
          }
        ],
        location: {
          location_code: 'WH001',
          location_name: 'Warehouse 1'
        }
      };

      // Mock successful responses
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'core_documents') {
          return {
            upsert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => ({ 
                  data: { id: 'doc-id' }, 
                  error: null 
                }))
              }))
            }))
          };
        }
        if (table === 'core_document_items') {
          return {
            upsert: jest.fn(() => ({ error: null }))
          };
        }
        if (table === 'tenant_business_entities') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({ 
                  data: { id: 'entity-id' }, 
                  error: null 
                }))
              }))
            }))
          };
        }
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ data: null, error: 'not found' }))
            }))
          }))
        };
      });

      const result = await service.processGoodsReceivedCD(mockOrderData);

      expect(result.success).toBe(true);
      expect(result.entityType).toBe('DOCUMENT');
      expect(result.entityId).toBe('doc-id');
    });

    it('should throw error when invoice is missing', async () => {
      const invalidData: PurchaseOrderData = {
        received_items: []
      };

      await expect(service.processGoodsReceivedCD(invalidData))
        .rejects
        .toThrow('Dados de recebimento incompletos');
    });
  });
});