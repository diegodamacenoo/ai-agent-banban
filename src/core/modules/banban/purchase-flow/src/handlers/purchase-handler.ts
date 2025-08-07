import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PurchaseFlowService, PurchaseOrderData } from '../services/PurchaseFlowService';

// Event types mapping
const EVENT_TYPES = {
  PURCHASE_ORDER_CREATED: 'purchase_order_created',
  PURCHASE_ORDER_APPROVED: 'purchase_order_approved',
  GOODS_RECEIVED_CD: 'goods_received_cd',
  RECEIPT_VERIFIED_OK: 'receipt_verified_ok',
  RECEIPT_VERIFIED_WITH_DISCREPANCY: 'receipt_verified_with_discrepancy',
  RECEIPT_EFFECTIVE_IN_CD: 'receipt_effective_in_cd'
} as const;

interface WebhookPayload {
  event_type: string;
  timestamp: string;
  organization_id: string;
  data: PurchaseOrderData;
}

function validateWebhookPayload(payload: any): void {
  if (!payload.event_type) {
    throw new Error('event_type é obrigatório');
  }
  if (!payload.organization_id) {
    throw new Error('organization_id é obrigatório');
  }
  if (!payload.data) {
    throw new Error('data é obrigatório');
  }
}

async function getOrganizationFromPayload(supabase: any, organizationId: string) {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, slug')
    .eq('id', organizationId)
    .single();

  if (error || !data) {
    throw new Error(`Organização não encontrada: ${organizationId}`);
  }

  return data;
}

export async function handlePurchaseFlowPOST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const payload: WebhookPayload = await req.json();
    
    // Validate payload
    validateWebhookPayload(payload);

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Validate organization
    const organization = await getOrganizationFromPayload(supabase, payload.organization_id);
    
    // Create service instance
    const purchaseFlowService = new PurchaseFlowService(supabase, organization.id);

    let result;
    switch (payload.event_type) {
      case EVENT_TYPES.PURCHASE_ORDER_CREATED:
        result = await purchaseFlowService.processPurchaseOrderCreated(payload.data);
        break;

      case EVENT_TYPES.PURCHASE_ORDER_APPROVED:
        result = await purchaseFlowService.processPurchaseOrderApproved(payload.data);
        break;

      case EVENT_TYPES.GOODS_RECEIVED_CD:
        result = await purchaseFlowService.processGoodsReceivedCD(payload.data);
        break;

      case EVENT_TYPES.RECEIPT_EFFECTIVE_IN_CD:
        result = await purchaseFlowService.processReceiptEffectiveInCD(payload.data);
        break;

      default:
        throw new Error(`Tipo de evento não suportado: ${payload.event_type}`);
    }

    const processingTime = Date.now() - startTime;

    // Log success (you may want to implement proper logging)
    console.debug('Purchase flow processed successfully:', {
      event_type: payload.event_type,
      organization_id: organization.id,
      entity_id: result.entityId,
      processing_time_ms: processingTime
    });

    return NextResponse.json({
      success: true,
      event_type: payload.event_type,
      data: result,
      metadata: {
        processed_at: new Date().toISOString(),
        processing_time_ms: processingTime,
        records_processed: result.summary.records_processed,
        records_successful: result.summary.records_successful,
        records_failed: result.summary.records_failed,
        success_rate: result.summary.records_processed > 0 
          ? `${((result.summary.records_successful / result.summary.records_processed) * 100).toFixed(2)  }%`
          : '100.00%'
      }
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    console.error('Purchase flow processing error:', {
      error: error.message,
      processing_time_ms: processingTime
    });

    return NextResponse.json({
      success: false,
      error: {
        type: 'PROCESSING_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      metadata: {
        processing_time_ms: processingTime
      }
    }, { status: 400 });
  }
}

export async function handlePurchaseFlowGET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('org');
    const orderNumber = searchParams.get('order');
    const supplierId = searchParams.get('supplier');

    if (!organizationId) {
      return NextResponse.json({
        error: 'organization_id (org) é obrigatório'
      }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
      .from('core_orders')
      .select(`
        id,
        external_id,
        order_type,
        status,
        total_value,
        issue_date,
        expected_delivery,
        approved_by,
        approval_date,
        notes,
        created_at,
        updated_at,
        core_order_items (
          id,
          item_seq,
          qty_ordered,
          unit_cost,
          unit_price,
          total_cost,
          notes
        )
      `)
      .eq('order_type', 'PURCHASE');

    if (orderNumber) {
      query = query.eq('external_id', orderNumber);
    }

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchase orders:', error);
      return NextResponse.json({
        error: 'Erro ao buscar pedidos de compra'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        orders: data,
        total: data?.length || 0
      }
    });

  } catch (error: any) {
    console.error('Purchase flow GET error:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}