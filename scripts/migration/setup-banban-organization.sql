-- Script para configurar organização BanBan Fashion no banco de dados
-- Execute este script no Supabase SQL Editor

-- 1. Inserir ou atualizar organização BanBan
INSERT INTO organizations (
  company_legal_name,
  company_trading_name,
  client_type,
  custom_backend_url,
  is_implementation_complete,
  implementation_config
) VALUES (
  'BanBan Fashion Ltda',
  'BanBan Fashion', 
  'custom',
  'http://localhost:4000',
  true,
  '{"sector": "fashion", "features": ["fashion-metrics", "seasonal-analysis", "brand-performance"]}'::jsonb
)
ON CONFLICT (company_trading_name) 
DO UPDATE SET
  client_type = EXCLUDED.client_type,
  custom_backend_url = EXCLUDED.custom_backend_url,
  is_implementation_complete = EXCLUDED.is_implementation_complete,
  implementation_config = EXCLUDED.implementation_config;

-- 2. Inserir organizações Riachuelo e C&A para teste
INSERT INTO organizations (
  company_legal_name,
  company_trading_name,
  client_type,
  custom_backend_url,
  is_implementation_complete,
  implementation_config
) VALUES 
(
  'Riachuelo S.A.',
  'Riachuelo',
  'custom', 
  'http://localhost:4000',
  true,
  '{"sector": "fashion", "features": ["fashion-metrics", "seasonal-analysis", "brand-performance"]}'::jsonb
),
(
  'C&A Modas Ltda',
  'C&A',
  'custom',
  'http://localhost:4000', 
  true,
  '{"sector": "fashion", "features": ["fashion-metrics", "seasonal-analysis", "brand-performance"]}'::jsonb
)
ON CONFLICT (company_trading_name) 
DO UPDATE SET
  client_type = EXCLUDED.client_type,
  custom_backend_url = EXCLUDED.custom_backend_url,
  is_implementation_complete = EXCLUDED.is_implementation_complete,
  implementation_config = EXCLUDED.implementation_config;

-- 3. Verificar organizações criadas
SELECT 
  id,
  company_legal_name,
  company_trading_name,
  client_type,
  is_implementation_complete
FROM organizations 
WHERE company_trading_name IN ('BanBan Fashion', 'Riachuelo', 'C&A')
ORDER BY company_trading_name; 