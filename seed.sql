-- ================================================
-- SEED.SQL - Supabase Database Schema & Mock Data
-- ================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. CRIAÇÃO DAS TABELAS
-- ================================================

-- Tabela de produtos principais
CREATE TABLE IF NOT EXISTS core_products (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id text UNIQUE NOT NULL,
    product_name text NOT NULL,
    category text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela de variantes de produtos
CREATE TABLE IF NOT EXISTS core_product_variants (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id uuid NOT NULL REFERENCES core_products(id) ON DELETE CASCADE,
    size text NOT NULL,
    color text NOT NULL,
    sku text GENERATED ALWAYS AS (external_id || '-' || size || '-' || color) STORED,
    created_at timestamptz DEFAULT now(),
    UNIQUE(product_id, size, color)
);

-- Adicionar external_id à tabela de variantes se necessário
ALTER TABLE core_product_variants ADD COLUMN IF NOT EXISTS external_id text;

-- Tabela de preços das variantes
CREATE TABLE IF NOT EXISTS core_product_pricing (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id uuid NOT NULL REFERENCES core_product_variants(id) ON DELETE CASCADE,
    price_value numeric(10,2) NOT NULL CHECK (price_value >= 0),
    valid_from date NOT NULL DEFAULT CURRENT_DATE,
    valid_to date,
    created_at timestamptz DEFAULT now(),
    UNIQUE(variant_id, valid_from)
);

-- Tabela de locais (para referência nos snapshots)
CREATE TABLE IF NOT EXISTS core_locations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_code text UNIQUE NOT NULL,
    location_name text NOT NULL,
    location_type text NOT NULL CHECK (location_type IN ('warehouse', 'store')),
    created_at timestamptz DEFAULT now()
);

-- Tabela de fornecedores
CREATE TABLE IF NOT EXISTS core_suppliers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id text UNIQUE NOT NULL,
    supplier_name text NOT NULL,
    cnpj text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela de pedidos (compra ou transferência)
CREATE TABLE IF NOT EXISTS core_orders (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id text UNIQUE NOT NULL,
    supplier_id uuid REFERENCES core_suppliers(id),
    origin_location_id uuid REFERENCES core_locations(id),
    dest_location_id uuid REFERENCES core_locations(id),
    order_type text NOT NULL CHECK (order_type IN ('COMPRA', 'TRANSFER')),
    issue_timestamp timestamptz NOT NULL,
    status text NOT NULL CHECK (status IN ('NOVO', 'APROVADO', 'CANCELADO')) DEFAULT 'NOVO',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- Constraints para garantir integridade
    CONSTRAINT chk_compra_supplier CHECK (
        (order_type = 'COMPRA' AND supplier_id IS NOT NULL) OR 
        (order_type != 'COMPRA')
    ),
    CONSTRAINT chk_transfer_locations CHECK (
        (order_type = 'TRANSFER' AND origin_location_id IS NOT NULL AND dest_location_id IS NOT NULL) OR 
        (order_type != 'TRANSFER')
    )
);

-- Tabela de documentos (notas fiscais, cupons)
CREATE TABLE IF NOT EXISTS core_documents (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id uuid REFERENCES core_orders(id),
    external_id text NOT NULL,
    doc_type text NOT NULL CHECK (doc_type IN ('SUPPLIER_IN', 'TRANSFER_OUT', 'TRANSFER_IN', 'RETURN', 'SALE')),
    issue_date date NOT NULL,
    total_value numeric(12,2) NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'PRE_BAIXA',
    origin_location_id uuid REFERENCES core_locations(id),
    dest_location_id uuid REFERENCES core_locations(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela de itens de documentos
CREATE TABLE IF NOT EXISTS core_document_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id uuid NOT NULL REFERENCES core_documents(id) ON DELETE CASCADE,
    variant_id uuid NOT NULL REFERENCES core_product_variants(id),
    item_seq integer NOT NULL,
    qty numeric NOT NULL DEFAULT 0,
    unit_price numeric(12,4) NOT NULL DEFAULT 0,
    qty_expected numeric DEFAULT 0,
    qty_scanned_ok numeric DEFAULT 0,
    qty_scanned_diff numeric DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(document_id, item_seq)
);

-- Tabela de movimentações (histórico de estoque)
CREATE TABLE IF NOT EXISTS core_movements (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id uuid NOT NULL REFERENCES core_products(id),
    variant_id uuid NOT NULL REFERENCES core_product_variants(id),
    location_id uuid NOT NULL REFERENCES core_locations(id),
    reference_id uuid, -- Pode referenciar document, order ou outro movement
    movement_type text NOT NULL CHECK (movement_type IN ('CD_RECEIPT', 'CD_TRANSFER', 'STORE_RECEIPT', 'SALE', 'RETURN')),
    qty_change numeric NOT NULL,
    movement_ts timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela de snapshots de inventário
CREATE TABLE IF NOT EXISTS core_inventory_snapshots (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id uuid NOT NULL REFERENCES core_product_variants(id) ON DELETE CASCADE,
    location_id uuid NOT NULL REFERENCES core_locations(id) ON DELETE CASCADE,
    qty_on_hand integer NOT NULL DEFAULT 0 CHECK (qty_on_hand >= 0),
    snapshot_ts timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    UNIQUE(variant_id, location_id, snapshot_ts)
);

-- Tabela de eventos
CREATE TABLE IF NOT EXISTS core_events (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type text NOT NULL,
    event_code text NOT NULL CHECK (event_code IN ('sale', 'return', 'transfer', 'adjustment')),
    entity_id uuid NOT NULL,
    event_ts timestamptz NOT NULL DEFAULT now(),
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Tabela de métricas diárias
CREATE TABLE IF NOT EXISTS daily_metrics (
    day date PRIMARY KEY,
    sales numeric(12,2) NOT NULL DEFAULT 0,
    margin numeric(5,2) NOT NULL DEFAULT 0 CHECK (margin >= 0 AND margin <= 100),
    cover_days numeric(5,1) NOT NULL DEFAULT 0 CHECK (cover_days >= 0),
    sell_through numeric(5,2) NOT NULL DEFAULT 0 CHECK (sell_through >= 0 AND sell_through <= 100),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela de alertas (legacy - manter para compatibilidade)
CREATE TABLE IF NOT EXISTS alert_digest (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_ts timestamptz NOT NULL DEFAULT now(),
    severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title text NOT NULL,
    description text NOT NULL,
    resolved boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- ================================================
-- TABELAS MART PARA ALERTAS INTELIGENTES
-- ================================================

-- Tabela de produtos parados (sem movimento)
CREATE TABLE IF NOT EXISTS mart_stagnant_products (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_date date NOT NULL,
    variant_id uuid NOT NULL REFERENCES core_product_variants(id),
    location_id uuid NOT NULL REFERENCES core_locations(id),
    days_without_movement integer NOT NULL,
    last_movement_date date,
    current_stock integer NOT NULL,
    suggested_action text CHECK (suggested_action IN ('promotion', 'transfer', 'liquidation')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(analysis_date, variant_id, location_id)
);

-- Tabela de alertas de reposição
CREATE TABLE IF NOT EXISTS mart_replenishment_alerts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_date date NOT NULL,
    variant_id uuid NOT NULL REFERENCES core_product_variants(id),
    location_id uuid NOT NULL REFERENCES core_locations(id),
    current_stock integer NOT NULL,
    avg_daily_sales numeric(8,2) NOT NULL,
    coverage_days numeric(5,1) NOT NULL,
    min_coverage_threshold integer NOT NULL,
    suggested_qty integer NOT NULL,
    priority_level text CHECK (priority_level IN ('low', 'medium', 'high', 'critical')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(analysis_date, variant_id, location_id)
);

-- Tabela de divergências de estoque
CREATE TABLE IF NOT EXISTS mart_inventory_divergences (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_date date NOT NULL,
    variant_id uuid NOT NULL REFERENCES core_product_variants(id),
    location_id uuid NOT NULL REFERENCES core_locations(id),
    expected_qty numeric NOT NULL,
    scanned_qty numeric NOT NULL,
    difference_qty numeric NOT NULL,
    difference_percentage numeric(5,2) NOT NULL,
    total_value_impact numeric(10,2) NOT NULL,
    severity text CHECK (severity IN ('low', 'medium', 'high')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(analysis_date, variant_id, location_id)
);

-- Tabela de alertas de margem
CREATE TABLE IF NOT EXISTS mart_margin_alerts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_date date NOT NULL,
    variant_id uuid NOT NULL REFERENCES core_product_variants(id),
    current_price numeric(10,2) NOT NULL,
    cost_price numeric(10,2) NOT NULL,
    current_margin_pct numeric(5,2) NOT NULL,
    min_acceptable_margin_pct numeric(5,2) NOT NULL,
    suggested_price numeric(10,2) NOT NULL,
    potential_revenue_impact numeric(10,2) NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(analysis_date, variant_id)
);

-- Tabela de picos de devolução
CREATE TABLE IF NOT EXISTS mart_return_spike_alerts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_date date NOT NULL,
    variant_id uuid NOT NULL REFERENCES core_product_variants(id),
    location_id uuid NOT NULL REFERENCES core_locations(id),
    returns_last_7_days integer NOT NULL,
    returns_previous_7_days integer NOT NULL,
    increase_percentage numeric(5,2) NOT NULL,
    total_return_value numeric(10,2) NOT NULL,
    suggested_investigation text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(analysis_date, variant_id, location_id)
);

-- Tabela de sugestões de redistribuição
CREATE TABLE IF NOT EXISTS mart_redistribution_suggestions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_date date NOT NULL,
    variant_id uuid NOT NULL REFERENCES core_product_variants(id),
    source_location_id uuid NOT NULL REFERENCES core_locations(id),
    target_location_id uuid NOT NULL REFERENCES core_locations(id),
    source_excess_qty integer NOT NULL,
    target_shortage_qty integer NOT NULL,
    suggested_transfer_qty integer NOT NULL,
    priority_score numeric(5,2) NOT NULL,
    estimated_revenue_gain numeric(10,2) NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(analysis_date, variant_id, source_location_id, target_location_id)
);

-- Tabela de resumo diário para dashboard
CREATE TABLE IF NOT EXISTS mart_daily_summary (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_date date NOT NULL UNIQUE,
    total_stagnant_products integer NOT NULL DEFAULT 0,
    total_replenishment_alerts integer NOT NULL DEFAULT 0,
    total_inventory_divergences integer NOT NULL DEFAULT 0,
    total_margin_alerts integer NOT NULL DEFAULT 0,
    total_return_spikes integer NOT NULL DEFAULT 0,
    total_redistribution_suggestions integer NOT NULL DEFAULT 0,
    critical_alerts integer NOT NULL DEFAULT 0,
    high_alerts integer NOT NULL DEFAULT 0,
    medium_alerts integer NOT NULL DEFAULT 0,
    low_alerts integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ================================================
-- 2. DADOS MOCK
-- ================================================

-- Limpar dados existentes (opcional)
TRUNCATE TABLE alert_digest, daily_metrics, core_events, core_movements, core_document_items,
                core_documents, core_orders, core_suppliers, core_inventory_snapshots, 
                core_product_pricing, core_product_variants, core_products, core_locations 
                RESTART IDENTITY CASCADE;

-- Inserir locais (1 CD + 3 lojas)
INSERT INTO core_locations (id, location_code, location_name, location_type) VALUES
    (uuid_generate_v4(), 'CD001', 'Centro de Distribuição Principal', 'warehouse'),
    (uuid_generate_v4(), 'LJ001', 'Loja North Shopping', 'store'),
    (uuid_generate_v4(), 'LJ002', 'Loja Praça do Ferreira', 'store'),
    (uuid_generate_v4(), 'LJ003', 'Loja Riomar Shopping', 'store');

-- Inserir fornecedores (3 fornecedores)
INSERT INTO core_suppliers (id, external_id, supplier_name, cnpj) VALUES
    (uuid_generate_v4(), 'FORN001', 'Calçados Premium Ltda', '12.345.678/0001-99'),
    (uuid_generate_v4(), 'FORN002', 'Moda & Estilo Distribuidora', '98.765.432/0001-11'),
    (uuid_generate_v4(), 'FORN003', 'Acessórios Fashion S.A.', '11.222.333/0001-44');

-- Inserir 20 produtos em 3 categorias
INSERT INTO core_products (id, external_id, product_name, category) VALUES
    -- Categoria: Roupas (8 produtos)
    (uuid_generate_v4(), 'PROD001', 'Camiseta Básica Premium', 'roupas'),
    (uuid_generate_v4(), 'PROD002', 'Calça Jeans Classic', 'roupas'),
    (uuid_generate_v4(), 'PROD003', 'Blusa Moletom Comfort', 'roupas'),
    (uuid_generate_v4(), 'PROD004', 'Vestido Casual Elegante', 'roupas'),
    (uuid_generate_v4(), 'PROD005', 'Camisa Social Premium', 'roupas'),
    (uuid_generate_v4(), 'PROD006', 'Shorts Esportivo Pro', 'roupas'),
    (uuid_generate_v4(), 'PROD007', 'Jaqueta Jeans Vintage', 'roupas'),
    (uuid_generate_v4(), 'PROD008', 'Saia Midi Elegance', 'roupas'),
    
    -- Categoria: Calçados (6 produtos)
    (uuid_generate_v4(), 'PROD009', 'Tênis Running Performance', 'calcados'),
    (uuid_generate_v4(), 'PROD010', 'Sapatênis Casual Urbano', 'calcados'),
    (uuid_generate_v4(), 'PROD011', 'Bota Couro Clássica', 'calcados'),
    (uuid_generate_v4(), 'PROD012', 'Sandália Comfort Plus', 'calcados'),
    (uuid_generate_v4(), 'PROD013', 'Sapato Social Executive', 'calcados'),
    (uuid_generate_v4(), 'PROD014', 'Chinelo Premium Beach', 'calcados'),
    
    -- Categoria: Acessórios (6 produtos)
    (uuid_generate_v4(), 'PROD015', 'Relógio Smart Fitness', 'acessorios'),
    (uuid_generate_v4(), 'PROD016', 'Óculos Sol Proteção UV', 'acessorios'),
    (uuid_generate_v4(), 'PROD017', 'Carteira Couro Premium', 'acessorios'),
    (uuid_generate_v4(), 'PROD018', 'Cinto Social Elegante', 'acessorios'),
    (uuid_generate_v4(), 'PROD019', 'Mochila Executiva Pro', 'acessorios'),
    (uuid_generate_v4(), 'PROD020', 'Chapéu Estilo Casual', 'acessorios');

-- Inserir variantes (2 cores × 3 tamanhos = 6 variantes por produto = 120 total)
WITH product_colors AS (
    SELECT id as product_id, external_id,
           unnest(ARRAY['preto', 'branco']) as color
    FROM core_products
),
product_variants AS (
    SELECT product_id, external_id, color,
           unnest(ARRAY['P', 'M', 'G']) as size
    FROM product_colors
)
INSERT INTO core_product_variants (product_id, external_id, size, color)
SELECT product_id, external_id, size, color
FROM product_variants;

-- Inserir preços para todas as variantes
INSERT INTO core_product_pricing (variant_id, price_value, valid_from)
SELECT 
    v.id,
    CASE 
        WHEN p.category = 'roupas' THEN ROUND((RANDOM() * 50 + 30)::numeric, 2)
        WHEN p.category = 'calcados' THEN ROUND((RANDOM() * 80 + 60)::numeric, 2)
        WHEN p.category = 'acessorios' THEN ROUND((RANDOM() * 100 + 40)::numeric, 2)
    END,
    CURRENT_DATE - INTERVAL '30 days'
FROM core_product_variants v
JOIN core_products p ON v.product_id = p.id;

-- Inserir snapshots de inventário (120 variantes × 4 locais = 480 linhas)
-- Snapshot de ontem para todos os locais e variantes
INSERT INTO core_inventory_snapshots (variant_id, location_id, qty_on_hand, snapshot_ts)
SELECT 
    v.id,
    l.id,
    FLOOR(RANDOM() * 81)::integer, -- Quantidade aleatória de 0 a 80
    (CURRENT_DATE - INTERVAL '1 day')::timestamptz + TIME '23:59:59'
FROM core_product_variants v
CROSS JOIN core_locations l;

-- Inserir pedidos (10 pedidos nos últimos 30 dias)
WITH sample_locations AS (
    SELECT id, location_type FROM core_locations
),
sample_suppliers AS (
    SELECT id FROM core_suppliers
)
INSERT INTO core_orders (external_id, supplier_id, origin_location_id, dest_location_id, order_type, issue_timestamp, status)
SELECT 
    'PO' || LPAD(gs::text, 4, '0'),
    CASE 
        WHEN RANDOM() < 0.6 THEN (SELECT id FROM sample_suppliers ORDER BY RANDOM() LIMIT 1)
        ELSE NULL
    END,
    CASE 
        WHEN RANDOM() < 0.6 THEN NULL
        ELSE (SELECT id FROM sample_locations WHERE location_type = 'warehouse' ORDER BY RANDOM() LIMIT 1)
    END,
    CASE 
        WHEN RANDOM() < 0.6 THEN NULL
        ELSE (SELECT id FROM sample_locations WHERE location_type = 'store' ORDER BY RANDOM() LIMIT 1)
    END,
    CASE WHEN RANDOM() < 0.6 THEN 'COMPRA' ELSE 'TRANSFER' END,
    (CURRENT_DATE - INTERVAL '30 days')::timestamptz + (RANDOM() * INTERVAL '30 days'),
    CASE 
        WHEN RANDOM() < 0.8 THEN 'APROVADO'
        WHEN RANDOM() < 0.95 THEN 'NOVO'
        ELSE 'CANCELADO'
    END
FROM generate_series(1, 10) gs;

-- Inserir documentos (15 documentos baseados nos pedidos)
WITH sample_orders AS (
    SELECT id, order_type FROM core_orders WHERE status = 'APROVADO'
),
sample_locations AS (
    SELECT id, location_type FROM core_locations
)
INSERT INTO core_documents (order_id, external_id, doc_type, issue_date, total_value, status, origin_location_id, dest_location_id)
SELECT 
    o.id,
    'DOC' || LPAD(gs::text, 5, '0'),
    CASE 
        WHEN o.order_type = 'COMPRA' THEN 'SUPPLIER_IN'
        WHEN o.order_type = 'TRANSFER' AND RANDOM() < 0.5 THEN 'TRANSFER_OUT'
        ELSE 'TRANSFER_IN'
    END,
    CURRENT_DATE - (RANDOM() * 15)::int,
    ROUND((RANDOM() * 50000 + 5000)::numeric, 2),
    CASE 
        WHEN RANDOM() < 0.7 THEN 'EFETIVADO_CD'
        ELSE 'PRE_BAIXA'
    END,
    (SELECT id FROM sample_locations ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM sample_locations ORDER BY RANDOM() LIMIT 1)
FROM sample_orders o
CROSS JOIN generate_series(1, 2) gs -- 2 documentos por pedido em média
WHERE gs <= 15;

-- Inserir itens de documentos (50 itens distribuídos pelos documentos)
WITH sample_documents AS (
    SELECT id FROM core_documents
),
sample_variants AS (
    SELECT id FROM core_product_variants
)
INSERT INTO core_document_items (document_id, variant_id, item_seq, qty, unit_price, qty_expected, qty_scanned_ok, qty_scanned_diff)
SELECT 
    d.id,
    v.id,
    ROW_NUMBER() OVER (PARTITION BY d.id ORDER BY RANDOM()),
    FLOOR(RANDOM() * 20 + 1)::numeric,
    ROUND((RANDOM() * 200 + 20)::numeric, 4),
    FLOOR(RANDOM() * 20 + 1)::numeric,
    FLOOR(RANDOM() * 18 + 1)::numeric,
    FLOOR(RANDOM() * 2)::numeric
FROM sample_documents d
CROSS JOIN sample_variants v
WHERE RANDOM() < 0.15 -- 15% de chance para cada combinação
LIMIT 50;

-- Inserir movimentações (100 movimentações nos últimos 15 dias)
WITH sample_variants AS (
    SELECT id, product_id FROM core_product_variants
),
sample_locations AS (
    SELECT id FROM core_locations
),
sample_documents AS (
    SELECT id FROM core_documents
)
INSERT INTO core_movements (product_id, variant_id, location_id, reference_id, movement_type, qty_change, movement_ts)
SELECT 
    v.product_id,
    v.id,
    l.id,
    d.id,
    CASE 
        WHEN RANDOM() < 0.3 THEN 'CD_RECEIPT'
        WHEN RANDOM() < 0.5 THEN 'STORE_RECEIPT'
        WHEN RANDOM() < 0.8 THEN 'SALE'
        WHEN RANDOM() < 0.95 THEN 'CD_TRANSFER'
        ELSE 'RETURN'
    END,
    CASE 
        WHEN RANDOM() < 0.8 THEN FLOOR(RANDOM() * 10 + 1)::numeric
        ELSE -FLOOR(RANDOM() * 5 + 1)::numeric
    END,
    (CURRENT_DATE - INTERVAL '15 days')::timestamptz + (RANDOM() * INTERVAL '15 days')
FROM sample_variants v
CROSS JOIN sample_locations l
CROSS JOIN sample_documents d
WHERE RANDOM() < 0.02 -- 2% de chance para cada combinação
LIMIT 100;

-- Inserir 200 eventos distribuídos nos últimos 7 dias
INSERT INTO core_events (entity_type, event_code, entity_id, event_ts, metadata)
SELECT 
    'variant',
    CASE 
        WHEN RANDOM() < 0.7 THEN 'sale'
        WHEN RANDOM() < 0.9 THEN 'return'
        ELSE 'transfer'
    END,
    v.id,
    (CURRENT_DATE - INTERVAL '7 days')::timestamptz + 
    (RANDOM() * INTERVAL '7 days') + 
    (RANDOM() * INTERVAL '24 hours'),
    jsonb_build_object(
        'quantity', FLOOR(RANDOM() * 5 + 1),
        'location_id', (SELECT id FROM core_locations ORDER BY RANDOM() LIMIT 1),
        'unit_price', pr.price_value
    )
FROM core_product_variants v
JOIN core_product_pricing pr ON v.id = pr.variant_id
CROSS JOIN generate_series(1, 200) gs
WHERE gs <= 200
ORDER BY RANDOM()
LIMIT 200;

-- Calcular vendas totais do dia anterior para daily_metrics
WITH yesterday_sales AS (
    SELECT 
        COUNT(*) FILTER (WHERE event_code = 'sale') as total_sales_qty,
        COALESCE(SUM((metadata->>'unit_price')::numeric * (metadata->>'quantity')::integer) 
                 FILTER (WHERE event_code = 'sale'), 0) as total_sales_value
    FROM core_events 
    WHERE event_ts::date = CURRENT_DATE - INTERVAL '1 day'
      AND event_code = 'sale'
)
INSERT INTO daily_metrics (day, sales, margin, cover_days, sell_through)
SELECT 
    CURRENT_DATE - INTERVAL '1 day',
    COALESCE(ys.total_sales_value, 0),
    ROUND((RANDOM() * 25 + 15)::numeric, 2), -- Margem entre 15-40%
    ROUND((RANDOM() * 20 + 10)::numeric, 1), -- Dias de cobertura 10-30
    ROUND((RANDOM() * 30 + 20)::numeric, 2)  -- Sell through 20-50%
FROM yesterday_sales ys;

-- Inserir 8 alertas (3 high + 5 medium)
INSERT INTO alert_digest (alert_ts, severity, title, description) VALUES
    -- Alertas HIGH (3)
    (now() - INTERVAL '2 hours', 'high', 'Estoque Crítico - Tênis Running', 'Produto PROD009 com menos de 5 unidades em todas as lojas'),
    (now() - INTERVAL '4 hours', 'high', 'Pico de Devoluções Detectado', 'Aumento de 300% nas devoluções nas últimas 4 horas'),
    (now() - INTERVAL '6 hours', 'high', 'Sistema de Pagamento Instável', 'Falhas intermitentes no processamento de pagamentos'),
    
    -- Alertas MEDIUM (5)
    (now() - INTERVAL '1 hour', 'low', 'Reposição Recomendada - Categoria Roupas', 'Produtos da categoria roupas com estoque baixo em 2 lojas'),
    (now() - INTERVAL '3 hours', 'medium', 'Variação de Preço Detectada', 'Inconsistência nos preços entre locais para produto PROD015'),
    (now() - INTERVAL '5 hours', 'medium', 'Meta de Vendas - Atenção', 'Vendas 15% abaixo da meta diária projetada'),
    (now() - INTERVAL '8 hours', 'medium', 'Transferência Pendente', 'Transferência entre CD001 e LJ002 aguarda confirmação há mais de 6h'),
    (now() - INTERVAL '12 hours', 'medium', 'Produto Sem Movimento', 'Produto PROD020 sem vendas há mais de 7 dias');

-- ================================================
-- 3. ÍNDICES PARA PERFORMANCE
-- ================================================

-- Índices nas tabelas principais
CREATE INDEX IF NOT EXISTS idx_core_product_variants_product_id ON core_product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_core_product_pricing_variant_id ON core_product_pricing(variant_id);
CREATE INDEX IF NOT EXISTS idx_core_inventory_snapshots_variant_location ON core_inventory_snapshots(variant_id, location_id);
CREATE INDEX IF NOT EXISTS idx_core_inventory_snapshots_ts ON core_inventory_snapshots(snapshot_ts);
CREATE INDEX IF NOT EXISTS idx_core_events_entity_id ON core_events(entity_id);
CREATE INDEX IF NOT EXISTS idx_core_events_ts ON core_events(event_ts);
CREATE INDEX IF NOT EXISTS idx_alert_digest_ts ON alert_digest(alert_ts);
CREATE INDEX IF NOT EXISTS idx_alert_digest_severity ON alert_digest(severity);

-- Índices para as novas tabelas
CREATE INDEX IF NOT EXISTS idx_core_orders_external_id ON core_orders(external_id);
CREATE INDEX IF NOT EXISTS idx_core_orders_supplier_id ON core_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_core_orders_issue_timestamp ON core_orders(issue_timestamp);
CREATE INDEX IF NOT EXISTS idx_core_orders_status ON core_orders(status);

CREATE INDEX IF NOT EXISTS idx_core_documents_order_id ON core_documents(order_id);
CREATE INDEX IF NOT EXISTS idx_core_documents_external_id ON core_documents(external_id);
CREATE INDEX IF NOT EXISTS idx_core_documents_doc_type ON core_documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_core_documents_issue_date ON core_documents(issue_date);

CREATE INDEX IF NOT EXISTS idx_core_document_items_document_id ON core_document_items(document_id);
CREATE INDEX IF NOT EXISTS idx_core_document_items_variant_id ON core_document_items(variant_id);

CREATE INDEX IF NOT EXISTS idx_core_movements_variant_id ON core_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_core_movements_location_id ON core_movements(location_id);
CREATE INDEX IF NOT EXISTS idx_core_movements_movement_type ON core_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_core_movements_movement_ts ON core_movements(movement_ts);
CREATE INDEX IF NOT EXISTS idx_core_movements_reference_id ON core_movements(reference_id);

-- Índices para tabelas mart
CREATE INDEX IF NOT EXISTS idx_mart_stagnant_products_analysis_date ON mart_stagnant_products(analysis_date);
CREATE INDEX IF NOT EXISTS idx_mart_stagnant_products_variant_id ON mart_stagnant_products(variant_id);
CREATE INDEX IF NOT EXISTS idx_mart_stagnant_products_days_without_movement ON mart_stagnant_products(days_without_movement);

CREATE INDEX IF NOT EXISTS idx_mart_replenishment_alerts_analysis_date ON mart_replenishment_alerts(analysis_date);
CREATE INDEX IF NOT EXISTS idx_mart_replenishment_alerts_priority_level ON mart_replenishment_alerts(priority_level);
CREATE INDEX IF NOT EXISTS idx_mart_replenishment_alerts_coverage_days ON mart_replenishment_alerts(coverage_days);

CREATE INDEX IF NOT EXISTS idx_mart_inventory_divergences_analysis_date ON mart_inventory_divergences(analysis_date);
CREATE INDEX IF NOT EXISTS idx_mart_inventory_divergences_severity ON mart_inventory_divergences(severity);

CREATE INDEX IF NOT EXISTS idx_mart_margin_alerts_analysis_date ON mart_margin_alerts(analysis_date);
CREATE INDEX IF NOT EXISTS idx_mart_margin_alerts_current_margin_pct ON mart_margin_alerts(current_margin_pct);

CREATE INDEX IF NOT EXISTS idx_mart_return_spike_alerts_analysis_date ON mart_return_spike_alerts(analysis_date);
CREATE INDEX IF NOT EXISTS idx_mart_return_spike_alerts_increase_percentage ON mart_return_spike_alerts(increase_percentage);

CREATE INDEX IF NOT EXISTS idx_mart_redistribution_suggestions_analysis_date ON mart_redistribution_suggestions(analysis_date);
CREATE INDEX IF NOT EXISTS idx_mart_redistribution_suggestions_priority_score ON mart_redistribution_suggestions(priority_score);

CREATE INDEX IF NOT EXISTS idx_mart_daily_summary_analysis_date ON mart_daily_summary(analysis_date);

-- ================================================
-- 4. VIEWS ÚTEIS (OPCIONAL)
-- ================================================

-- View para resumo de estoque atual
CREATE OR REPLACE VIEW v_current_inventory AS
SELECT 
    p.product_name,
    p.category,
    v.size,
    v.color,
    l.location_name,
    l.location_type,
    s.qty_on_hand,
    pr.price_value as current_price
FROM core_inventory_snapshots s
JOIN core_product_variants v ON s.variant_id = v.id
JOIN core_products p ON v.product_id = p.id
JOIN core_locations l ON s.location_id = l.id
JOIN core_product_pricing pr ON v.id = pr.variant_id
WHERE s.snapshot_ts = (
    SELECT MAX(snapshot_ts) 
    FROM core_inventory_snapshots s2 
    WHERE s2.variant_id = s.variant_id 
      AND s2.location_id = s.location_id
)
AND pr.valid_from <= CURRENT_DATE
AND (pr.valid_to IS NULL OR pr.valid_to >= CURRENT_DATE);

-- View para alertas ativos
CREATE OR REPLACE VIEW v_active_alerts AS
SELECT 
    severity,
    title,
    description,
    alert_ts,
    EXTRACT(EPOCH FROM (now() - alert_ts))/3600 as hours_ago
FROM alert_digest 
WHERE resolved = false 
ORDER BY 
    CASE severity 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
    END,
    alert_ts DESC;

-- ================================================
-- RESUMO DOS DADOS INSERIDOS
-- ================================================

SELECT 'RESUMO DOS DADOS INSERIDOS:' as info;

SELECT 
    'Produtos' as tabela,
    COUNT(*) as registros
FROM core_products
UNION ALL
SELECT 
    'Variantes de Produtos' as tabela,
    COUNT(*) as registros
FROM core_product_variants
UNION ALL
SELECT 
    'Preços' as tabela,
    COUNT(*) as registros
FROM core_product_pricing
UNION ALL
SELECT 
    'Locais' as tabela,
    COUNT(*) as registros
FROM core_locations
UNION ALL
SELECT 
    'Fornecedores' as tabela,
    COUNT(*) as registros
FROM core_suppliers
UNION ALL
SELECT 
    'Pedidos' as tabela,
    COUNT(*) as registros
FROM core_orders
UNION ALL
SELECT 
    'Documentos' as tabela,
    COUNT(*) as registros
FROM core_documents
UNION ALL
SELECT 
    'Itens de Documentos' as tabela,
    COUNT(*) as registros
FROM core_document_items
UNION ALL
SELECT 
    'Movimentações' as tabela,
    COUNT(*) as registros
FROM core_movements
UNION ALL
SELECT 
    'Snapshots Inventário' as tabela,
    COUNT(*) as registros
FROM core_inventory_snapshots
UNION ALL
SELECT 
    'Eventos' as tabela,
    COUNT(*) as registros
FROM core_events
UNION ALL
SELECT 
    'Métricas Diárias' as tabela,
    COUNT(*) as registros
FROM daily_metrics
UNION ALL
SELECT 
    'Alertas' as tabela,
    COUNT(*) as registros
FROM alert_digest;

-- Verificação da distribuição de eventos por tipo
SELECT 
    event_code,
    COUNT(*) as quantidade,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM core_events), 2) as porcentagem
FROM core_events 
GROUP BY event_code 
ORDER BY quantidade DESC;

-- Verificação de alertas por severidade
SELECT 
    severity,
    COUNT(*) as quantidade
FROM alert_digest 
GROUP BY severity 
ORDER BY 
    CASE severity 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
    END; 