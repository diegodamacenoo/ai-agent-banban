-- Script para popular a tabela module_implementations
-- Este script cria as implementações necessárias para os módulos do cliente BanBan

-- Primeiro, vamos limpar implementações existentes para evitar duplicatas
DELETE FROM module_implementations WHERE client_type = 'banban';
DELETE FROM module_navigation WHERE id IN (
  SELECT mn.id FROM module_navigation mn
  JOIN module_implementations mi ON mn.implementation_id = mi.id
  WHERE mi.client_type = 'banban'
);

-- Inserir implementações para módulos BanBan
INSERT INTO module_implementations (
  id,
  module_id,
  client_type,
  component_path,
  is_available,
  configuration_schema,
  created_at,
  updated_at
) VALUES
-- Insights Implementation
(
  gen_random_uuid(),
  'banban-insights',
  'banban',
  '/modules/banban/insights',
  true,
  jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'refresh_interval', jsonb_build_object('type', 'number', 'default', 300),
      'max_insights', jsonb_build_object('type', 'number', 'default', 10)
    )
  ),
  NOW(),
  NOW()
),
-- Performance Implementation  
(
  gen_random_uuid(),
  'banban-performance',
  'banban',
  '/modules/banban/performance',
  true,
  jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'metrics_retention_days', jsonb_build_object('type', 'number', 'default', 90),
      'real_time_updates', jsonb_build_object('type', 'boolean', 'default', true)
    )
  ),
  NOW(),
  NOW()
),
-- Alerts Implementation
(
  gen_random_uuid(),
  'banban-alerts',
  'banban',
  '/modules/banban/alerts',
  true,
  jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'notification_channels', jsonb_build_object('type', 'array', 'default', ARRAY['email', 'system']),
      'severity_levels', jsonb_build_object('type', 'array', 'default', ARRAY['low', 'medium', 'high', 'critical'])
    )
  ),
  NOW(),
  NOW()
),
-- Inventory Implementation
(
  gen_random_uuid(),
  'banban-inventory',
  'banban',
  '/modules/banban/inventory',
  true,
  jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'stock_threshold_warning', jsonb_build_object('type', 'number', 'default', 10),
      'auto_reorder', jsonb_build_object('type', 'boolean', 'default', false)
    )
  ),
  NOW(),
  NOW()
),
-- Data Processing Implementation
(
  gen_random_uuid(),
  'banban-data-processing',
  'banban',
  '/modules/banban/data-processing',
  true,
  jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'batch_size', jsonb_build_object('type', 'number', 'default', 1000),
      'processing_interval', jsonb_build_object('type', 'number', 'default', 3600)
    )
  ),
  NOW(),
  NOW()
);

-- Agora vamos inserir as navegações para cada implementação
WITH implementations AS (
  SELECT id, module_id FROM module_implementations WHERE client_type = 'banban'
)
INSERT INTO module_navigation (
  id,
  implementation_id,
  nav_type,
  nav_title,
  nav_order,
  route_path,
  is_external,
  parent_id,
  created_at
) 
SELECT 
  gen_random_uuid(),
  impl.id,
  'primary',
  CASE impl.module_id
    WHEN 'banban-insights' THEN 'Insights'
    WHEN 'banban-performance' THEN 'Performance'
    WHEN 'banban-alerts' THEN 'Alertas'
    WHEN 'banban-inventory' THEN 'Estoque'
    WHEN 'banban-data-processing' THEN 'Processamento'
  END,
  CASE impl.module_id
    WHEN 'banban-insights' THEN 10
    WHEN 'banban-performance' THEN 20
    WHEN 'banban-alerts' THEN 30
    WHEN 'banban-inventory' THEN 40
    WHEN 'banban-data-processing' THEN 50
  END,
  CASE impl.module_id
    WHEN 'banban-insights' THEN '/insights'
    WHEN 'banban-performance' THEN '/performance'
    WHEN 'banban-alerts' THEN '/alerts'
    WHEN 'banban-inventory' THEN '/inventory'
    WHEN 'banban-data-processing' THEN '/data-processing'
  END,
  false,
  NULL,
  NOW()
FROM implementations impl;

-- Verificar os resultados
SELECT 
  cm.name as module_name,
  mi.client_type,
  mi.component_path,
  mn.nav_title,
  mn.route_path
FROM module_implementations mi
JOIN core_modules cm ON mi.module_id = cm.module_id
LEFT JOIN module_navigation mn ON mn.implementation_id = mi.id
WHERE mi.client_type = 'banban'
ORDER BY mn.nav_order;