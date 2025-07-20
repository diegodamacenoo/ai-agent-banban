import { createSupabaseServerClient } from '@/core/supabase/server';
import { createSupabaseBrowserClient } from '@/core/supabase/client';

// ================================================
// GENERIC DATA SERVICE: Trabalha com as novas tabelas genéricas
// Data: 2025-01-14
// Descrição: Abstração para acesso às tabelas tenant_business_*
// ================================================

// Função helper para criar cliente Supabase baseado no contexto
async function getSupabaseClient() {
  try {
    return await createSupabaseServerClient();
  } catch {
    return createSupabaseBrowserClient();
  }
}

// ================================================
// BUSINESS ENTITIES (produtos, fornecedores, locais, etc.)
// ================================================

export interface BusinessEntity {
  id: string;
  organization_id: string;
  entity_type: 'product' | 'supplier' | 'location' | 'customer' | 'variant';
  external_id: string;
  name: string;
  business_data: Record<string, any>;
  configuration: Record<string, any>;
  metadata: Record<string, any>;
  status: 'active' | 'inactive' | 'discontinued' | 'archived';
  created_at: string;
  updated_at: string;
}

export async function getBusinessEntities(
  entityType: string,
  organizationId?: string,
  filters: Record<string, any> = {}
): Promise<BusinessEntity[]> {
  const supabase = await getSupabaseClient();
  
  let query = supabase
    .from('tenant_business_entities')
    .select('*')
    .eq('entity_type', entityType);

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  // Aplicar filtros adicionais
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (key.includes('->')) {
        // Filtro JSONB
        query = query.eq(key, value);
      } else {
        query = query.eq(key, value);
      }
    }
  });

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching ${entityType} entities:`, error);
    return [];
  }

  return data || [];
}

export async function getBusinessEntityByExternalId(
  entityType: string,
  externalId: string,
  organizationId?: string
): Promise<BusinessEntity | null> {
  const supabase = await getSupabaseClient();
  
  let query = supabase
    .from('tenant_business_entities')
    .select('*')
    .eq('entity_type', entityType)
    .eq('external_id', externalId);

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data, error } = await query.single();

  if (error) {
    console.error(`Error fetching ${entityType} entity:`, error);
    return null;
  }

  return data;
}

export async function createBusinessEntity(
  entity: Omit<BusinessEntity, 'id' | 'created_at' | 'updated_at'>
): Promise<BusinessEntity | null> {
  const supabase = await getSupabaseClient();
  
  const { data, error } = await supabase
    .from('tenant_business_entities')
    .insert({
      ...entity,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating business entity:', error);
    return null;
  }

  return data;
}

export async function updateBusinessEntity(
  id: string,
  updates: Partial<BusinessEntity>
): Promise<BusinessEntity | null> {
  const supabase = await getSupabaseClient();
  
  const { data, error } = await supabase
    .from('tenant_business_entities')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating business entity:', error);
    return null;
  }

  return data;
}

// ================================================
// COMPATIBILITY FUNCTIONS - Migração gradual
// ================================================

// Produtos (compatibilidade com core_products)
export async function getProducts(organizationId?: string): Promise<any[]> {
  const entities = await getBusinessEntities('product', organizationId);
  
  return entities.map(entity => ({
    id: entity.id,
    external_id: entity.external_id,
    product_name: entity.name,
    category: entity.business_data.category || null,
    description: entity.business_data.description || null,
    gtin: entity.business_data.gtin || null,
    unit_measure: entity.business_data.unit_measure || null,
    gender: entity.business_data.gender || null,
    brand: entity.business_data.brand || null,
    folder: entity.business_data.folder || null,
    type: entity.business_data.type || null,
    supplier_external_id: entity.business_data.supplier_external_id || null,
    status: entity.status,
    created_at: entity.created_at,
    updated_at: entity.updated_at
  }));
}

// Fornecedores (compatibilidade com core_suppliers)
export async function getSuppliers(organizationId?: string): Promise<any[]> {
  const entities = await getBusinessEntities('supplier', organizationId);
  
  return entities.map(entity => ({
    id: entity.id,
    external_id: entity.external_id,
    trade_name: entity.name,
    legal_name: entity.business_data.legal_name || null,
    cnpj: entity.business_data.cnpj || null,
    status: entity.status,
    created_at: entity.created_at,
    updated_at: entity.updated_at,
    organization_id: entity.organization_id
  }));
}

// Locais (compatibilidade com core_locations)
export async function getLocations(organizationId?: string): Promise<any[]> {
  const entities = await getBusinessEntities('location', organizationId);
  
  return entities.map(entity => ({
    id: entity.id,
    external_id: entity.external_id,
    location_name: entity.name,
    location_type: entity.business_data.location_type || 'WAREHOUSE',
    address: entity.business_data.address || null,
    status: entity.status,
    created_at: entity.created_at,
    updated_at: entity.updated_at
  }));
}

// Variantes (compatibilidade com core_product_variants)
export async function getProductVariants(organizationId?: string, productId?: string): Promise<any[]> {
  const entities = await getBusinessEntities('variant', organizationId);
  
  let filtered = entities;
  if (productId) {
    filtered = entities.filter(entity => 
      entity.business_data.product_id === productId ||
      entity.metadata.product_external_id === productId
    );
  }
  
  return filtered.map(entity => ({
    id: entity.id,
    external_id: entity.external_id,
    product_id: entity.business_data.product_id || null,
    sku: entity.external_id,
    size: entity.business_data.size || null,
    color: entity.business_data.color || null,
    name: entity.name,
    status: entity.status,
    created_at: entity.created_at,
    updated_at: entity.updated_at
  }));
}

// ================================================
// BUSINESS RELATIONSHIPS
// ================================================

export interface BusinessRelationship {
  id: string;
  organization_id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: 'variant_of' | 'supplied_by' | 'located_at' | 'priced_as' | 'categorized_as';
  relationship_data: Record<string, any>;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
}

export async function getBusinessRelationships(
  relationshipType: string,
  organizationId?: string,
  sourceEntityId?: string,
  targetEntityId?: string
): Promise<BusinessRelationship[]> {
  const supabase = await getSupabaseClient();
  
  let query = supabase
    .from('tenant_business_relationships')
    .select('*')
    .eq('relationship_type', relationshipType);

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  if (sourceEntityId) {
    query = query.eq('source_entity_id', sourceEntityId);
  }

  if (targetEntityId) {
    query = query.eq('target_entity_id', targetEntityId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching ${relationshipType} relationships:`, error);
    return [];
  }

  return data || [];
}

// ================================================
// BUSINESS TRANSACTIONS
// ================================================

export interface BusinessTransaction {
  id: string;
  organization_id: string;
  transaction_type: 'order' | 'document' | 'movement' | 'sale' | 'transfer' | 'adjustment';
  external_id?: string;
  transaction_number?: string;
  transaction_data: Record<string, any>;
  transaction_items: any[];
  total_value: number;
  currency: string;
  origin_entity_id?: string;
  destination_entity_id?: string;
  reference_transaction_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'error';
  transaction_date: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export async function getBusinessTransactions(
  transactionType: string,
  organizationId?: string,
  filters: Record<string, any> = {}
): Promise<BusinessTransaction[]> {
  const supabase = await getSupabaseClient();
  
  let query = supabase
    .from('tenant_business_transactions')
    .select('*')
    .eq('transaction_type', transactionType);

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  // Aplicar filtros
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query = query.eq(key, value);
    }
  });

  const { data, error } = await query.order('transaction_date', { ascending: false });

  if (error) {
    console.error(`Error fetching ${transactionType} transactions:`, error);
    return [];
  }

  return data || [];
}

export async function createBusinessTransaction(
  transaction: Omit<BusinessTransaction, 'id' | 'created_at' | 'updated_at'>
): Promise<BusinessTransaction | null> {
  const supabase = await getSupabaseClient();
  
  const { data, error } = await supabase
    .from('tenant_business_transactions')
    .insert({
      ...transaction,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating business transaction:', error);
    return null;
  }

  return data;
}

// ================================================
// HELPER FUNCTIONS para resolução de referências
// ================================================

export async function resolveOrCreateEntity(
  entityType: string,
  externalId: string,
  entityData: Record<string, any>,
  organizationId: string
): Promise<BusinessEntity | null> {
  // Primeiro, tentar encontrar
  const existing = await getBusinessEntityByExternalId(entityType, externalId, organizationId);
  
  if (existing) {
    return existing;
  }

  // Se não existe, criar
  return await createBusinessEntity({
    organization_id: organizationId,
    entity_type: entityType as any,
    external_id: externalId,
    name: entityData.name || externalId,
    business_data: entityData.business_data || {},
    configuration: entityData.configuration || {},
    metadata: entityData.metadata || {},
    status: 'active'
  });
}

export async function resolveEntityReference(
  entityType: string,
  externalId: string,
  organizationId?: string
): Promise<BusinessEntity | null> {
  return await getBusinessEntityByExternalId(entityType, externalId, organizationId);
} 