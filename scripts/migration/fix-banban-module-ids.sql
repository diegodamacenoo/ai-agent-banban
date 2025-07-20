-- ================================================
-- CORREÇÃO DOS IDs DOS MÓDULOS BANBAN
-- ================================================
-- Corrige a discrepância entre os IDs no banco e os IDs gerados pelo ModuleDiscoveryService
-- Problema: banco tem ["insights", "performance", "banban-alerts"]
-- Correto: deve ser ["banban-insights", "banban-performance", "banban-alerts"]

-- 1. Verificar configuração atual da BanBan
SELECT 
  id,
  company_trading_name,
  implementation_config->'subscribed_modules' as current_modules
FROM organizations 
WHERE company_trading_name ILIKE '%banban%' OR company_legal_name ILIKE '%banban%';

-- 2. Atualizar IDs dos módulos para usar prefixo correto
-- Versão simplificada e segura
UPDATE organizations 
SET implementation_config = jsonb_build_object(
  'subscribed_modules', ARRAY['banban-insights', 'banban-performance', 'banban-alerts']::text[],
  'custom_modules', ARRAY['banban-insights-advanced', 'banban-performance-advanced', 'banban-alerts-advanced']::text[],
  'enabled_standard_modules', ARRAY[]::text[],
  'features', ARRAY['banban-insights', 'banban-performance', 'banban-alerts']::text[]
)::jsonb
WHERE (company_trading_name ILIKE '%banban%' OR company_legal_name ILIKE '%banban%')
AND implementation_config IS NOT NULL;

-- 3. Verificar se a correção foi aplicada
SELECT 
  id,
  company_trading_name,
  implementation_config->'subscribed_modules' as corrected_modules
FROM organizations 
WHERE company_trading_name ILIKE '%banban%' OR company_legal_name ILIKE '%banban%';

-- 4. Se não houver organização BanBan, criar uma para teste
INSERT INTO organizations (
  company_legal_name,
  company_trading_name,
  slug,
  client_type,
  custom_backend_url,
  is_implementation_complete,
  implementation_config
) 
SELECT 
  'BanBan Calçados LTDA',
  'BanBan Calçados',
  'banban',
  'custom',
  'http://localhost:4000',
  true,
  jsonb_build_object(
    'subscribed_modules', ARRAY['banban-insights', 'banban-performance', 'banban-alerts']::text[],
    'custom_modules', ARRAY['banban-insights-advanced', 'banban-performance-advanced', 'banban-alerts-advanced']::text[],
    'enabled_standard_modules', ARRAY[]::text[],
    'features', ARRAY['banban-insights', 'banban-performance', 'banban-alerts']::text[]
  )::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM organizations 
  WHERE company_trading_name ILIKE '%banban%' OR company_legal_name ILIKE '%banban%'
);

-- 5. Resultado final esperado
SELECT 
  'Resultado Final:' as status,
  company_trading_name,
  implementation_config
FROM organizations 
WHERE company_trading_name ILIKE '%banban%' OR company_legal_name ILIKE '%banban%'; 