import { createClient } from '@supabase/supabase-js';

export interface PurchaseOrderData {
  purchase_order?: {
    order_number: string;
    supplier_code?: string;
    supplier_name?: string;
    total_value?: number;
    issue_date?: string;
    expected_delivery?: string;
    destination?: string;
    approved_by?: string;
    approval_date?: string;
    notes?: string;
  };
  items?: Array<{
    item_sequence: number;
    product_code: string;
    product_name: string;
    variant_code: string;
    size: string;
    color: string;
    quantity_ordered?: number;
    quantity_invoiced?: number;
    quantity_received?: number;
    quantity_divergence?: number;
    unit_cost?: number;
    unit_price?: number;
    total_cost?: number;
    notes?: string;
    divergence_reason?: string;
  }>;
  invoice?: {
    invoice_number: string;
    issue_date: string;
    total_value: number;
    supplier_code: string;
  };
  received_items?: Array<{
    item_sequence: number;
    variant_code: string;
    quantity_invoiced: number;
    quantity_received: number;
    quantity_divergence: number;
    unit_price: number;
    divergence_reason?: string;
  }>;
  inventory_impact?: Array<{
    variant_code: string;
    location_code: string;
    previous_stock: number;
    received_qty: number;
    new_stock: number;
  }>;
  location?: {
    location_code: string;
    location_name: string;
  };
}

export interface PurchaseFlowResult {
  success: boolean;
  entityType: string;
  entityId: string | null;
  summary: {
    message: string;
    records_processed: number;
    records_successful: number;
    records_failed: number;
  };
  transactions?: any[];
  relationships?: any[];
}

export class PurchaseFlowService {
  private supabase: any;
  private organizationId: string;

  constructor(supabaseClient: any, organizationId: string) {
    this.supabase = supabaseClient;
    this.organizationId = organizationId;
  }

  async processPurchaseOrderCreated(data: PurchaseOrderData): Promise<PurchaseFlowResult> {
    console.debug('=== PURCHASE ORDER CREATED ===');
    console.debug('Processando criação de pedido de compra:', data.purchase_order?.order_number);
    
    if (!data.purchase_order || !data.items) {
      throw new Error('Dados de pedido de compra incompletos: purchase_order e items são obrigatórios');
    }

    const results: PurchaseFlowResult = {
      success: false,
      entityType: 'ORDER',
      entityId: null,
      summary: {
        message: 'Pedido de compra criado com sucesso.',
        records_processed: 0,
        records_successful: 0,
        records_failed: 0
      }
    };

    try {
      console.debug('Resolvendo/criando fornecedor...');
      const supplierResult = await this.resolveOrCreateSupplier(
        data.purchase_order.supplier_code,
        data.purchase_order.supplier_name
      );
      console.debug('Fornecedor resolvido:', supplierResult?.id);

      console.debug('Resolvendo/criando localização...');
      const locationResult = await this.resolveOrCreateLocation(data.purchase_order.destination);
      console.debug('Localização resolvida:', locationResult?.id);

      console.debug('Criando pedido de compra...');
      const { data: orderData, error: orderError } = await this.supabase
        .from('core_orders')
        .insert({
          external_id: data.purchase_order.order_number,
          supplier_id: supplierResult?.id,
          dest_location_id: locationResult?.id,
          order_type: 'PURCHASE',
          status: 'NEW',
          total_value: data.purchase_order.total_value,
          issue_date: data.purchase_order.issue_date,
          expected_delivery: data.purchase_order.expected_delivery,
          approved_by: data.purchase_order.approved_by,
          approval_date: data.purchase_order.approval_date,
          notes: data.purchase_order.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (orderError) {
        console.error('Erro ao criar pedido:', orderError);
        throw new Error(`Erro ao criar pedido: ${JSON.stringify(orderError)}`);
      }

      console.debug('Pedido criado:', orderData.id);
      results.entityId = orderData.id;
      results.summary.records_processed++;
      results.summary.records_successful++;

      console.debug('Processando itens do pedido...');
      for (const item of data.items) {
        try {
          console.debug(`Processando item: ${item.variant_code}`);
          
          const variantResult = await this.resolveOrCreateVariant(
            item.variant_code,
            item.product_code,
            item.product_name
          );
          console.debug('Variante resolvida:', variantResult?.id);

          const { error: itemError } = await this.supabase
            .from('core_order_items')
            .insert({
              order_id: orderData.id,
              variant_id: variantResult?.id,
              item_seq: item.item_sequence,
              qty_ordered: item.quantity_ordered,
              unit_cost: item.unit_cost,
              unit_price: item.unit_price,
              total_cost: item.total_cost,
              notes: item.notes,
              created_at: new Date().toISOString()
            });

          if (itemError) {
            console.error('Erro ao criar item:', itemError);
            results.summary.records_processed++;
            results.summary.records_failed++;
          } else {
            console.debug(`Item ${item.variant_code} criado com sucesso`);
            results.summary.records_processed++;
            results.summary.records_successful++;
          }
        } catch (error) {
          console.error(`Erro ao processar item ${item.variant_code}:`, error);
          results.summary.records_processed++;
          results.summary.records_failed++;
        }
      }

      results.success = true;
      console.debug('Pedido de compra criado com sucesso:', {
        order_id: orderData.id,
        external_id: data.purchase_order.order_number,
        items_processed: data.items.length,
        items_successful: results.summary.records_successful - 1,
        items_failed: results.summary.records_failed
      });

      return results;

    } catch (error) {
      console.error('Erro ao criar pedido de compra:', error);
      results.summary.records_failed++;
      results.success = false;
      throw error;
    }
  }

  async processPurchaseOrderApproved(data: PurchaseOrderData): Promise<PurchaseFlowResult> {
    console.debug('=== PURCHASE ORDER APPROVED ===');
    console.debug('Processando aprovação de pedido:', data.purchase_order?.order_number);
    
    if (!data.purchase_order?.order_number) {
      throw new Error('Número do pedido é obrigatório para aprovação');
    }

    const orderResult = await this.resolveOrderReference(data.purchase_order.order_number);
    if (!orderResult) {
      throw new Error(`Pedido ${data.purchase_order.order_number} não encontrado`);
    }

    const { data: updatedOrder, error } = await this.supabase
      .from('core_orders')
      .update({
        status: 'APPROVED',
        approval_date: data.purchase_order.approval_date || new Date().toISOString(),
        approved_by: data.purchase_order.approved_by,
        updated_at: new Date().toISOString()
      })
      .eq('external_id', data.purchase_order.order_number)
      .select()
      .single();

    if (error) {
      console.error('Erro ao aprovar pedido:', error);
      throw error;
    }

    console.debug('Pedido aprovado com sucesso:', updatedOrder.id);

    return {
      success: true,
      entityType: 'ORDER',
      entityId: updatedOrder.id,
      summary: {
        message: 'Pedido aprovado com sucesso.',
        records_processed: 1,
        records_successful: 1,
        records_failed: 0
      }
    };
  }

  async processGoodsReceivedCD(data: PurchaseOrderData): Promise<PurchaseFlowResult> {
    console.debug('=== GOODS RECEIVED CD ===');
    console.debug('Processando recebimento no CD:', data.invoice?.invoice_number);
    
    if (!data.invoice || !data.received_items) {
      throw new Error('Dados de recebimento incompletos: invoice e received_items são obrigatórios');
    }

    const results: PurchaseFlowResult = {
      success: false,
      entityType: 'DOCUMENT',
      entityId: null,
      summary: {
        message: 'Recebimento no CD processado com sucesso.',
        records_processed: 0,
        records_successful: 0,
        records_failed: 0
      }
    };

    try {
      console.debug('Resolvendo referências...');
      const orderResult = await this.resolveOrderReference(data.purchase_order?.order_number);
      const locationResult = await this.resolveLocationReference(data.location?.location_code);

      console.debug('Criando documento fiscal...');
      const { data: documentData, error: documentError } = await this.supabase
        .from('core_documents')
        .upsert({
          order_id: orderResult?.id,
          external_id: data.invoice.invoice_number,
          doc_type: 'SUPPLIER_IN',
          issue_date: data.invoice.issue_date,
          total_value: data.invoice.total_value,
          status: 'PENDING',
          dest_location_id: locationResult?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'external_id'
        })
        .select()
        .single();

      if (documentError) {
        console.error('Erro ao criar documento:', documentError);
        throw documentError;
      }
      
      console.debug('Documento criado:', documentData.id);
      results.entityId = documentData.id;
      results.summary.records_processed++;
      results.summary.records_successful++;

      console.debug('Processando itens recebidos...');
      for (const item of data.received_items) {
        try {
          console.debug(`Processando item recebido: ${item.variant_code}`);
          
          const variantResult = await this.resolveVariantReference(item.variant_code);
          if (!variantResult) {
            throw new Error(`Variante ${item.variant_code} não encontrada`);
          }
          
          const { error: itemError } = await this.supabase
            .from('core_document_items')
            .upsert({
              document_id: documentData.id,
              variant_id: variantResult.id,
              item_seq: item.item_sequence,
              qty: item.quantity_invoiced,
              unit_price: item.unit_price,
              qty_expected: item.quantity_invoiced,
              qty_scanned_ok: item.quantity_received,
              qty_scanned_diff: item.quantity_divergence,
              created_at: new Date().toISOString()
            }, {
              onConflict: 'document_id,item_seq'
            });

          if (itemError) {
            console.error('Erro ao criar item do documento:', itemError);
            results.summary.records_processed++;
            results.summary.records_failed++;
          } else {
            console.debug(`Item ${item.variant_code} processado com sucesso`);
            results.summary.records_processed++;
            results.summary.records_successful++;
          }
        } catch (error) {
          console.error(`Erro ao processar item ${item.variant_code}:`, error);
          results.summary.records_processed++;
          results.summary.records_failed++;
        }
      }

      results.success = true;
      console.debug('Recebimento no CD processado:', {
        document_id: documentData.id,
        invoice_number: data.invoice.invoice_number,
        items_processed: data.received_items.length
      });

      return results;

    } catch (error) {
      console.error('Erro ao processar recebimento no CD:', error);
      results.summary.records_failed++;
      results.success = false;
      throw error;
    }
  }

  async processReceiptEffectiveInCD(data: PurchaseOrderData): Promise<PurchaseFlowResult> {
    console.debug('=== RECEIPT EFFECTIVE IN CD ===');
    console.debug('Processando efetivação no CD:', data.invoice?.invoice_number);
    
    if (!data.invoice?.invoice_number) {
      throw new Error('Número da nota fiscal é obrigatório');
    }

    const results: PurchaseFlowResult = {
      success: false,
      entityType: 'DOCUMENT',
      entityId: null,
      summary: {
        message: 'Efetivação no CD processada com sucesso.',
        records_processed: 0,
        records_successful: 0,
        records_failed: 0
      }
    };

    try {
      const documentResult = await this.resolveDocumentReference(data.invoice.invoice_number);
      if (!documentResult) {
        throw new Error(`Documento ${data.invoice.invoice_number} não encontrado`);
      }

      console.debug('Atualizando status do documento...');
      const { data: updatedDocument, error: docError } = await this.supabase
        .from('core_documents')
        .update({
          status: 'EFFECTIVE_CD',
          updated_at: new Date().toISOString()
        })
        .eq('external_id', data.invoice.invoice_number)
        .select()
        .single();

      if (docError) {
        console.error('Erro ao atualizar documento:', docError);
        throw docError;
      }
      
      console.debug('Documento efetivado:', updatedDocument.id);
      results.entityId = updatedDocument.id;
      results.summary.records_processed++;
      results.summary.records_successful++;

      console.debug('Atualizando snapshots de inventário...');
      if (data.inventory_impact) {
        for (const impact of data.inventory_impact) {
          try {
            console.debug(`Atualizando snapshot: ${impact.variant_code} @ ${impact.location_code}`);
            
            const variantResult = await this.resolveVariantReference(impact.variant_code);
            if (!variantResult) {
              throw new Error(`Variante ${impact.variant_code} não encontrada`);
            }

            const locationResult = await this.resolveLocationReference(impact.location_code);
            if (!locationResult) {
              throw new Error(`Localização ${impact.location_code} não encontrada`);
            }

            const productResult = await this.resolveProductByVariant(variantResult.id);

            const { error: snapshotError } = await this.supabase
              .from('core_inventory_snapshots')
              .upsert({
                product_id: productResult?.id,
                variant_id: variantResult.id,
                location_id: locationResult.id,
                qty_on_hand: impact.new_stock,
                last_update_ts: new Date().toISOString()
              }, {
                onConflict: 'variant_id,location_id'
              });

            if (snapshotError) {
              console.error('Erro ao atualizar snapshot:', snapshotError);
              results.summary.records_processed++;
              results.summary.records_failed++;
            } else {
              console.debug(`Snapshot atualizado: ${impact.variant_code} = ${impact.new_stock}`);
              results.summary.records_processed++;
              results.summary.records_successful++;
            }
          } catch (error) {
            console.error(`Erro ao atualizar snapshot ${impact.variant_code}:`, error);
            results.summary.records_processed++;
            results.summary.records_failed++;
          }
        }
      }

      results.success = true;
      console.debug('Efetivação no CD concluída:', {
        document_id: updatedDocument.id,
        inventory_impacts: data.inventory_impact?.length || 0
      });

      return results;

    } catch (error) {
      console.error('Erro ao efetivar no CD:', error);
      results.summary.records_failed++;
      results.success = false;
      throw error;
    }
  }

  // Helper methods for entity resolution
  private async resolveOrCreateSupplier(supplierCode?: string, supplierName?: string) {
    if (!supplierCode) return null;
    
    console.debug(`Resolvendo fornecedor: ${supplierCode}`);
    
    const { data, error } = await this.supabase
      .from('tenant_business_entities')
      .select('id')
      .eq('entity_type', 'supplier')
      .eq('external_id', supplierCode)
      .eq('organization_id', this.organizationId)
      .single();
        
    if (error || !data) {
      console.debug(`Fornecedor ${supplierCode} não encontrado, criando...`);
      
      const { data: newSupplier, error: createError } = await this.supabase
        .from('tenant_business_entities')
        .insert({
          organization_id: this.organizationId,
          entity_type: 'supplier',
          external_id: supplierCode,
          name: supplierName || supplierCode,
          business_data: {
            trade_name: supplierName || supplierCode,
            legal_name: supplierName || supplierCode
          },
          configuration: {},
          metadata: {},
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
          
      if (createError) {
        console.error('Erro ao criar fornecedor:', createError);
        throw new Error(`Erro ao criar fornecedor ${supplierCode}: ${JSON.stringify(createError)}`);
      }
      
      console.debug(`Fornecedor criado: ${newSupplier.id}`);
      return newSupplier;
    }
    
    console.debug(`Fornecedor encontrado: ${data.id}`);
    return data;
  }

  private async resolveOrCreateLocation(locationCode?: string) {
    if (!locationCode) return null;
    
    console.debug(`Resolvendo localização: ${locationCode}`);
    
    const { data, error } = await this.supabase
      .from('tenant_business_entities')
      .select('id')
      .eq('entity_type', 'location')
      .eq('external_id', locationCode)
      .eq('organization_id', this.organizationId)
      .single();
        
    if (error || !data) {
      console.debug(`Localização ${locationCode} não encontrada, criando...`);
      
      const { data: newLocation, error: createError } = await this.supabase
        .from('tenant_business_entities')
        .insert({
          organization_id: this.organizationId,
          entity_type: 'location',
          external_id: locationCode,
          name: locationCode,
          business_data: {
            location_type: 'WAREHOUSE',
            address: null
          },
          configuration: {},
          metadata: {},
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
          
      if (createError) {
        console.error('Erro ao criar localização:', createError);
        throw new Error(`Erro ao criar localização ${locationCode}: ${JSON.stringify(createError)}`);
      }
      
      console.debug(`Localização criada: ${newLocation.id}`);
      return newLocation;
    }
    
    console.debug(`Localização encontrada: ${data.id}`);
    return data;
  }

  private async resolveOrCreateVariant(variantCode?: string, productCode?: string, productName?: string) {
    if (!variantCode) return null;
    
    console.debug(`Resolvendo variante: ${variantCode}`);
    
    const { data, error } = await this.supabase
      .from('tenant_business_entities')
      .select('id, business_data')
      .eq('entity_type', 'variant')
      .eq('external_id', variantCode)
      .eq('organization_id', this.organizationId)
      .single();
        
    if (error || !data) {
      console.debug(`Variante ${variantCode} não encontrada, criando produto e variante...`);
      
      let productResult = null;
      if (productCode) {
        const { data: existingProduct } = await this.supabase
          .from('tenant_business_entities')
          .select('id')
          .eq('entity_type', 'product')
          .eq('external_id', productCode)
          .eq('organization_id', this.organizationId)
          .single();
            
        if (existingProduct) {
          productResult = existingProduct;
        } else {
          const { data: newProduct, error: productError } = await this.supabase
            .from('tenant_business_entities')
            .insert({
              organization_id: this.organizationId,
              entity_type: 'product',
              external_id: productCode,
              name: productName || productCode,
              business_data: {
                category: null,
                description: null
              },
              configuration: {},
              metadata: {},
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
              
          if (productError) {
            console.error('Erro ao criar produto:', productError);
            throw new Error(`Erro ao criar produto ${productCode}: ${JSON.stringify(productError)}`);
          }
          
          productResult = newProduct;
          console.debug(`Produto criado: ${newProduct.id}`);
        }
      }
      
      const { data: newVariant, error: createError } = await this.supabase
        .from('tenant_business_entities')
        .insert({
          organization_id: this.organizationId,
          entity_type: 'variant',
          external_id: variantCode,
          name: variantCode,
          business_data: {
            product_id: productResult?.id,
            sku: variantCode,
            size: null,
            color: null
          },
          configuration: {},
          metadata: {},
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
          
      if (createError) {
        console.error('Erro ao criar variante:', createError);
        throw new Error(`Erro ao criar variante ${variantCode}: ${JSON.stringify(createError)}`);
      }
      
      console.debug(`Variante criada: ${newVariant.id}`);
      return newVariant;
    }
    
    console.debug(`Variante encontrada: ${data.id}`);
    return data;
  }

  private async resolveOrderReference(orderNumber?: string) {
    if (!orderNumber) return null;
    
    const { data, error } = await this.supabase
      .from('core_orders')
      .select('id')
      .eq('external_id', orderNumber)
      .single();
        
    if (error || !data) {
      console.debug('Pedido não encontrado:', orderNumber);
      return null;
    }
    
    return data;
  }

  private async resolveLocationReference(locationCode?: string) {
    if (!locationCode) return null;
    
    const { data, error } = await this.supabase
      .from('tenant_business_entities')
      .select('id')
      .eq('entity_type', 'location')
      .eq('external_id', locationCode)
      .eq('organization_id', this.organizationId)
      .single();
        
    if (error || !data) {
      console.debug('Localização não encontrada:', locationCode);
      return null;
    }
    
    return data;
  }

  private async resolveVariantReference(variantCode?: string) {
    if (!variantCode) return null;
    
    const { data, error } = await this.supabase
      .from('tenant_business_entities')
      .select('id')
      .eq('entity_type', 'variant')
      .eq('external_id', variantCode)
      .eq('organization_id', this.organizationId)
      .single();
        
    if (error || !data) {
      console.debug('Variante não encontrada:', variantCode);
      return null;
    }
    
    return data;
  }

  private async resolveDocumentReference(documentNumber?: string) {
    if (!documentNumber) return null;
    
    const { data, error } = await this.supabase
      .from('core_documents')
      .select('id')
      .eq('external_id', documentNumber)
      .single();
        
    if (error || !data) {
      console.debug('Documento não encontrado:', documentNumber);
      return null;
    }
    
    return data;
  }

  private async resolveProductByVariant(variantId?: string) {
    if (!variantId) return null;
    
    const { data, error } = await this.supabase
      .from('tenant_business_entities')
      .select('id, business_data')
      .eq('id', variantId)
      .eq('entity_type', 'variant')
      .single();
        
    if (error || !data) {
      console.debug('Variante não encontrada para buscar produto:', variantId);
      return null;
    }
    
    const productId = data.business_data?.product_id;
    if (!productId) {
      console.debug('Produto não vinculado à variante:', variantId);
      return null;
    }
    
    const { data: productData, error: productError } = await this.supabase
      .from('tenant_business_entities')
      .select('id')
      .eq('id', productId)
      .eq('entity_type', 'product')
      .single();
        
    if (productError || !productData) {
      console.debug('Produto não encontrado:', productId);
      return null;
    }
    
    return productData;
  }
}