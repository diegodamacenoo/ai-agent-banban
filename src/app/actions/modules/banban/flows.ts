'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Types for Banban Flow Modules
interface TransferFlowData {
  transfer_id: string;
  from_location: string;
  to_location: string;
  status: string;
  items: {
    product_id: string;
    quantity: number;
    status: string;
  }[];
  created_at: string;
  updated_at: string;
}

interface SalesFlowData {
  sale_id: string;
  customer_id: string;
  items: {
    product_id: string;
    quantity: number;
    price: number;
  }[];
  total_amount: number;
  payment_status: string;
  status: string;
  created_at: string;
}

interface InventoryFlowData {
  adjustment_id: string;
  product_id: string;
  location: string;
  adjustment_type: 'add' | 'remove' | 'transfer' | 'count';
  quantity_before: number;
  quantity_after: number;
  reason: string;
  created_at: string;
}

interface PurchaseFlowData {
  purchase_id: string;
  supplier_id: string;
  items: {
    product_id: string;
    quantity: number;
    unit_cost: number;
  }[];
  total_amount: number;
  status: string;
  created_at: string;
  expected_delivery: string;
}

// Transfer Flow Actions
export async function getBanbanTransferFlow(
  organizationId: string,
  transferId?: string,
  filters?: {
    status?: string;
    from_location?: string;
    to_location?: string;
    dateRange?: { start: string; end: string };
  }
): Promise<{ success: boolean; data?: TransferFlowData[]; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();

    // Mock data simulating transfer flow records
    const mockTransfers: TransferFlowData[] = [
      {
        transfer_id: 'TRF-001',
        from_location: 'CD São Paulo',
        to_location: 'Loja Shopping ABC',
        status: 'EM_SEPARACAO_CD',
        items: [
          { product_id: 'PROD-123', quantity: 10, status: 'SEPARADO' },
          { product_id: 'PROD-456', quantity: 5, status: 'PENDENTE' },
        ],
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T14:22:00Z',
      },
      {
        transfer_id: 'TRF-002',
        from_location: 'CD Rio de Janeiro',
        to_location: 'Loja Centro',
        status: 'EMBARCADO_CD',
        items: [
          { product_id: 'PROD-789', quantity: 8, status: 'EMBARCADO' },
          { product_id: 'PROD-101', quantity: 12, status: 'EMBARCADO' },
        ],
        created_at: '2024-01-14T09:15:00Z',
        updated_at: '2024-01-15T08:45:00Z',
      },
    ];

    // Apply filters
    let filteredData = mockTransfers;

    if (transferId) {
      filteredData = filteredData.filter(t => t.transfer_id === transferId);
    }

    if (filters?.status) {
      filteredData = filteredData.filter(t => t.status === filters.status);
    }

    if (filters?.from_location) {
      filteredData = filteredData.filter(t => 
        t.from_location.toLowerCase().includes(filters.from_location!.toLowerCase())
      );
    }

    if (filters?.to_location) {
      filteredData = filteredData.filter(t => 
        t.to_location.toLowerCase().includes(filters.to_location!.toLowerCase())
      );
    }

    return {
      success: true,
      data: filteredData,
    };

  } catch (error) {
    console.error('Error getting Banban transfer flow:', error);
    return {
      success: false,
      error: 'Failed to retrieve transfer flow data',
    };
  }
}

export async function createBanbanTransferRequest(
  organizationId: string,
  transferData: {
    from_location: string;
    to_location: string;
    items: { product_id: string; quantity: number }[];
    priority?: 'low' | 'normal' | 'high';
    notes?: string;
  }
): Promise<{ success: boolean; data?: { transfer_id: string }; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();

    // Generate transfer ID (in real implementation, this would be from DB)
    const transferId = `TRF-${Date.now().toString().slice(-6)}`;

    // Simulate creating transfer request in database
    // In real implementation, this would insert into tenant_business_transactions
    
    const newTransfer: TransferFlowData = {
      transfer_id: transferId,
      from_location: transferData.from_location,
      to_location: transferData.to_location,
      status: 'PEDIDO_TRANSFERENCIA_CRIADO',
      items: transferData.items.map(item => ({
        ...item,
        status: 'PENDENTE',
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Log the action (simulate webhook processing)
    console.debug('Transfer request created:', transferId);

    // Revalidate relevant pages
    revalidatePath('/banban/transfer-flow');
    revalidatePath('/banban/inventory');

    return {
      success: true,
      data: { transfer_id: transferId },
    };

  } catch (error) {
    console.error('Error creating Banban transfer request:', error);
    return {
      success: false,
      error: 'Failed to create transfer request',
    };
  }
}

// Sales Flow Actions
export async function getBanbanSalesFlow(
  organizationId: string,
  saleId?: string,
  filters?: {
    customer_id?: string;
    status?: string;
    dateRange?: { start: string; end: string };
  }
): Promise<{ success: boolean; data?: SalesFlowData[]; error?: string }> {
  try {
    const mockSales: SalesFlowData[] = [
      {
        sale_id: 'SALE-001',
        customer_id: 'CUST-123',
        items: [
          { product_id: 'PROD-123', quantity: 2, price: 89.90 },
          { product_id: 'PROD-456', quantity: 1, price: 129.90 },
        ],
        total_amount: 309.70,
        payment_status: 'PAID',
        status: 'COMPLETED',
        created_at: '2024-01-15T14:30:00Z',
      },
      {
        sale_id: 'SALE-002',
        customer_id: 'CUST-456',
        items: [
          { product_id: 'PROD-789', quantity: 1, price: 199.90 },
        ],
        total_amount: 199.90,
        payment_status: 'PENDING',
        status: 'PROCESSING',
        created_at: '2024-01-15T15:45:00Z',
      },
    ];

    let filteredData = mockSales;

    if (saleId) {
      filteredData = filteredData.filter(s => s.sale_id === saleId);
    }

    if (filters?.customer_id) {
      filteredData = filteredData.filter(s => s.customer_id === filters.customer_id);
    }

    if (filters?.status) {
      filteredData = filteredData.filter(s => s.status === filters.status);
    }

    return {
      success: true,
      data: filteredData,
    };

  } catch (error) {
    console.error('Error getting Banban sales flow:', error);
    return {
      success: false,
      error: 'Failed to retrieve sales flow data',
    };
  }
}

// Inventory Flow Actions
export async function getBanbanInventoryFlow(
  organizationId: string,
  filters?: {
    product_id?: string;
    location?: string;
    adjustment_type?: string;
    dateRange?: { start: string; end: string };
  }
): Promise<{ success: boolean; data?: InventoryFlowData[]; error?: string }> {
  try {
    const mockInventoryAdjustments: InventoryFlowData[] = [
      {
        adjustment_id: 'ADJ-001',
        product_id: 'PROD-123',
        location: 'Loja Shopping ABC',
        adjustment_type: 'add',
        quantity_before: 15,
        quantity_after: 25,
        reason: 'Reposição de estoque',
        created_at: '2024-01-15T09:15:00Z',
      },
      {
        adjustment_id: 'ADJ-002',
        product_id: 'PROD-456',
        location: 'CD São Paulo',
        adjustment_type: 'count',
        quantity_before: 100,
        quantity_after: 98,
        reason: 'Contagem cíclica',
        created_at: '2024-01-15T11:30:00Z',
      },
    ];

    let filteredData = mockInventoryAdjustments;

    if (filters?.product_id) {
      filteredData = filteredData.filter(adj => adj.product_id === filters.product_id);
    }

    if (filters?.location) {
      filteredData = filteredData.filter(adj => 
        adj.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters?.adjustment_type) {
      filteredData = filteredData.filter(adj => adj.adjustment_type === filters.adjustment_type);
    }

    return {
      success: true,
      data: filteredData,
    };

  } catch (error) {
    console.error('Error getting Banban inventory flow:', error);
    return {
      success: false,
      error: 'Failed to retrieve inventory flow data',
    };
  }
}

// Purchase Flow Actions
export async function getBanbanPurchaseFlow(
  organizationId: string,
  purchaseId?: string,
  filters?: {
    supplier_id?: string;
    status?: string;
    dateRange?: { start: string; end: string };
  }
): Promise<{ success: boolean; data?: PurchaseFlowData[]; error?: string }> {
  try {
    const mockPurchases: PurchaseFlowData[] = [
      {
        purchase_id: 'PUR-001',
        supplier_id: 'SUP-123',
        items: [
          { product_id: 'PROD-123', quantity: 50, unit_cost: 35.00 },
          { product_id: 'PROD-456', quantity: 30, unit_cost: 42.50 },
        ],
        total_amount: 3025.00,
        status: 'AGUARDANDO_ENTREGA',
        created_at: '2024-01-10T10:00:00Z',
        expected_delivery: '2024-01-20T00:00:00Z',
      },
      {
        purchase_id: 'PUR-002',
        supplier_id: 'SUP-456',
        items: [
          { product_id: 'PROD-789', quantity: 20, unit_cost: 75.00 },
        ],
        total_amount: 1500.00,
        status: 'ENTREGUE',
        created_at: '2024-01-08T14:30:00Z',
        expected_delivery: '2024-01-15T00:00:00Z',
      },
    ];

    let filteredData = mockPurchases;

    if (purchaseId) {
      filteredData = filteredData.filter(p => p.purchase_id === purchaseId);
    }

    if (filters?.supplier_id) {
      filteredData = filteredData.filter(p => p.supplier_id === filters.supplier_id);
    }

    if (filters?.status) {
      filteredData = filteredData.filter(p => p.status === filters.status);
    }

    return {
      success: true,
      data: filteredData,
    };

  } catch (error) {
    console.error('Error getting Banban purchase flow:', error);
    return {
      success: false,
      error: 'Failed to retrieve purchase flow data',
    };
  }
}

// Webhook simulation functions that replicate ECA logic
export async function processBanbanWebhook(
  organizationId: string,
  webhookType: 'transfer' | 'sales' | 'inventory' | 'purchase',
  action: string,
  payload: any
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Generate unique event ID
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log webhook processing
    console.debug(`Processing Banban webhook: ${webhookType}:${action}`, {
      organizationId,
      eventId,
      payload,
    });

    // Simulate processing based on webhook type and action
    let result = null;
    
    switch (webhookType) {
      case 'transfer':
        result = await processTransferAction(action, payload, organizationId);
        break;
      case 'sales':
        result = await processSalesAction(action, payload, organizationId);
        break;
      case 'inventory':
        result = await processInventoryAction(action, payload, organizationId);
        break;
      case 'purchase':
        result = await processPurchaseAction(action, payload, organizationId);
        break;
      default:
        throw new Error(`Unknown webhook type: ${webhookType}`);
    }

    // Revalidate relevant paths
    revalidatePath(`/banban/${webhookType}-flow`);
    
    return {
      success: true,
      data: {
        event_id: eventId,
        action,
        processed_at: new Date().toISOString(),
        result,
      },
    };

  } catch (error) {
    console.error('Error processing Banban webhook:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown webhook processing error',
    };
  }
}

// Helper functions for processing different action types
async function processTransferAction(action: string, payload: any, orgId: string) {
  // Simulate transfer state transitions based on backend logic
  const stateTransitions = {
    'CREATE_TRANSFER_REQUEST': 'AGUARDANDO_SEPARACAO_CD',
    'START_SEPARATION': 'EM_SEPARACAO_CD',
    'COMPLETE_SEPARATION': 'SEPARADO_PRE_DOCA',
    'SHIP_TRANSFER': 'EMBARCADO_CD',
    'START_STORE_CONFERENCE': 'EM_CONFERENCIA_LOJA',
    'COMPLETE_STORE_CONFERENCE': 'EFETIVADO_LOJA',
  };

  const newState = stateTransitions[action as keyof typeof stateTransitions];
  
  return {
    transfer_id: payload.transfer_id || `TRF-${Date.now()}`,
    previous_state: payload.current_state || 'PEDIDO_TRANSFERENCIA_CRIADO',
    new_state: newState,
    processed_items: payload.items?.length || 0,
  };
}

async function processSalesAction(action: string, payload: any, orgId: string) {
  const stateTransitions = {
    'REGISTER_SALE': 'SALE_REGISTERED',
    'REGISTER_PAYMENT': 'PAYMENT_PROCESSED',
    'REGISTER_CANCELLATION': 'SALE_CANCELLED',
    'REQUEST_RETURN': 'RETURN_REQUESTED',
  };

  const newState = stateTransitions[action as keyof typeof stateTransitions];
  
  return {
    sale_id: payload.sale_id || `SALE-${Date.now()}`,
    new_state: newState,
    total_amount: payload.total_amount || 0,
    items_count: payload.items?.length || 0,
  };
}

async function processInventoryAction(action: string, payload: any, orgId: string) {
  const adjustmentTypes = {
    'ADJUST_STOCK': 'adjustment',
    'COUNT_INVENTORY': 'count',
    'RESERVE_STOCK': 'reserve',
    'TRANSFER_INTERNAL': 'transfer',
  };

  const adjustmentType = adjustmentTypes[action as keyof typeof adjustmentTypes];
  
  return {
    adjustment_id: payload.adjustment_id || `ADJ-${Date.now()}`,
    adjustment_type: adjustmentType,
    product_id: payload.product_id,
    quantity_change: payload.quantity_change || 0,
    location: payload.location,
  };
}

async function processPurchaseAction(action: string, payload: any, orgId: string) {
  const stateTransitions = {
    'CREATE_ORDER': 'ORDER_CREATED',
    'APPROVE_ORDER': 'ORDER_APPROVED',
    'REGISTER_INVOICE': 'INVOICE_REGISTERED',
    'ARRIVE_AT_CD': 'ARRIVED_CD',
    'EFFECTUATE_CD': 'EFFECTUATED_CD',
  };

  const newState = stateTransitions[action as keyof typeof stateTransitions];
  
  return {
    purchase_id: payload.purchase_id || `PUR-${Date.now()}`,
    new_state: newState,
    supplier_id: payload.supplier_id,
    total_amount: payload.total_amount || 0,
    items_count: payload.items?.length || 0,
  };
}