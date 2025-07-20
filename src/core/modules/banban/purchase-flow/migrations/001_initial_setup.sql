-- Purchase Flow Module Migration
-- This migration ensures all required tables and indexes exist for the Purchase Flow module

-- Ensure core_orders table has proper indexes for purchase flow queries
CREATE INDEX IF NOT EXISTS idx_core_orders_purchase_flow 
ON core_orders(order_type, external_id, supplier_id, status, created_at) 
WHERE order_type = 'PURCHASE';

-- Ensure core_order_items has proper indexes
CREATE INDEX IF NOT EXISTS idx_core_order_items_purchase_flow 
ON core_order_items(order_id, variant_id, item_seq);

-- Ensure core_documents has proper indexes for purchase documents
CREATE INDEX IF NOT EXISTS idx_core_documents_purchase_flow 
ON core_documents(doc_type, external_id, order_id, status, created_at) 
WHERE doc_type = 'SUPPLIER_IN';

-- Ensure core_document_items has proper indexes
CREATE INDEX IF NOT EXISTS idx_core_document_items_purchase_flow 
ON core_document_items(document_id, variant_id, item_seq);

-- Ensure tenant_business_entities has proper indexes for purchase entities
CREATE INDEX IF NOT EXISTS idx_tenant_business_entities_purchase_suppliers 
ON tenant_business_entities(organization_id, entity_type, external_id, status) 
WHERE entity_type = 'supplier';

CREATE INDEX IF NOT EXISTS idx_tenant_business_entities_purchase_locations 
ON tenant_business_entities(organization_id, entity_type, external_id, status) 
WHERE entity_type = 'location';

CREATE INDEX IF NOT EXISTS idx_tenant_business_entities_purchase_products 
ON tenant_business_entities(organization_id, entity_type, external_id, status) 
WHERE entity_type = 'product';

CREATE INDEX IF NOT EXISTS idx_tenant_business_entities_purchase_variants 
ON tenant_business_entities(organization_id, entity_type, external_id, status) 
WHERE entity_type = 'variant';

-- Ensure core_inventory_snapshots has proper indexes for inventory updates
CREATE INDEX IF NOT EXISTS idx_core_inventory_snapshots_purchase_flow 
ON core_inventory_snapshots(variant_id, location_id, last_update_ts);

-- Create function to log purchase flow events (optional, for debugging)
CREATE OR REPLACE FUNCTION log_purchase_flow_event(
    p_event_type TEXT,
    p_entity_type TEXT,
    p_entity_id TEXT,
    p_organization_id UUID,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- This function can be used to log purchase flow events for debugging
    -- Currently just a placeholder, can be extended based on requirements
    INSERT INTO audit_logs (
        event_type,
        resource_type,
        resource_id,
        organization_id,
        metadata,
        created_at
    ) VALUES (
        p_event_type,
        p_entity_type,
        p_entity_id,
        p_organization_id,
        p_metadata,
        NOW()
    )
    ON CONFLICT DO NOTHING; -- Ignore if audit_logs table doesn't exist
EXCEPTION
    WHEN others THEN
        -- Silently ignore if audit_logs table doesn't exist
        NULL;
END;
$$;

-- Create view for purchase flow analytics
CREATE OR REPLACE VIEW purchase_flow_analytics AS
SELECT 
    o.id as order_id,
    o.external_id as order_number,
    o.status as order_status,
    o.total_value,
    o.issue_date,
    o.expected_delivery,
    o.approval_date,
    o.created_at as order_created_at,
    s.name as supplier_name,
    s.external_id as supplier_code,
    l.name as location_name,
    l.external_id as location_code,
    COUNT(oi.id) as item_count,
    SUM(oi.qty_ordered) as total_qty_ordered,
    SUM(oi.total_cost) as total_item_cost,
    CASE 
        WHEN o.approval_date IS NOT NULL AND o.issue_date IS NOT NULL 
        THEN EXTRACT(DAYS FROM (o.approval_date - o.issue_date))
        ELSE NULL 
    END as approval_lead_time_days
FROM core_orders o
LEFT JOIN tenant_business_entities s ON o.supplier_id = s.id AND s.entity_type = 'supplier'
LEFT JOIN tenant_business_entities l ON o.dest_location_id = l.id AND l.entity_type = 'location'
LEFT JOIN core_order_items oi ON o.id = oi.order_id
WHERE o.order_type = 'PURCHASE'
GROUP BY 
    o.id, o.external_id, o.status, o.total_value, o.issue_date, 
    o.expected_delivery, o.approval_date, o.created_at,
    s.name, s.external_id, l.name, l.external_id;

-- Grant permissions to the view
GRANT SELECT ON purchase_flow_analytics TO authenticated;
GRANT SELECT ON purchase_flow_analytics TO anon;

-- Add comment for documentation
COMMENT ON VIEW purchase_flow_analytics IS 'Analytics view for purchase flow operations, providing aggregated data for reporting and insights';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Purchase Flow Module migration completed successfully';
END
$$;