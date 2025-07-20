-- Script para corrigir configuração dos módulos da organização BanBan
-- Execute este script no Supabase SQL Editor

-- 1. Verificar configuração atual da BanBan
SELECT 
  id,
  company_trading_name,
  client_type,
  implementation_config,
  is_implementation_complete
FROM organizations 
WHERE company_trading_name ILIKE '%banban%' OR company_legal_name ILIKE '%banban%';

-- 2. Atualizar configuração da BanBan com módulos corretos
UPDATE organizations 
SET 
  client_type = 'custom',
  is_implementation_complete = true,
  custom_backend_url = 'http://localhost:4000',
  implementation_config = jsonb_build_object(
    'subscribed_modules', jsonb_build_array('inventory', 'insights', 'performance'),
    'custom_modules', jsonb_build_array('inventory-advanced', 'insights-advanced', 'performance-advanced'),
    'enabled_standard_modules', jsonb_build_array('performance-base'),
    'features', jsonb_build_array('inventory', 'insights', 'performance')
  ),
  implementation_date = NOW(),
  implementation_team_notes = 'Configuração corrigida via script - Módulos: inventory, insights, performance'
WHERE company_trading_name ILIKE '%banban%' OR company_legal_name ILIKE '%banban%';

-- 3. Verificar se a atualização foi aplicada
SELECT 
  id,
  company_trading_name,
  client_type,
  implementation_config,
  is_implementation_complete,
  implementation_date
FROM organizations 
WHERE company_trading_name ILIKE '%banban%' OR company_legal_name ILIKE '%banban%';

-- 4. Se não existe organização BanBan, criar uma nova
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
  'BanBan Fashion Ltda',
  'BanBan Fashion',
  'banban-fashion',
  'custom',
  'http://localhost:4000',
  true,
  jsonb_build_object(
    'subscribed_modules', jsonb_build_array('inventory', 'insights', 'performance'),
    'custom_modules', jsonb_build_array('inventory-advanced', 'insights-advanced', 'performance-advanced'),
    'enabled_standard_modules', jsonb_build_array('performance-base'),
    'features', jsonb_build_array('inventory', 'insights', 'performance')
  )
WHERE NOT EXISTS (
  SELECT 1 FROM organizations 
  WHERE company_trading_name ILIKE '%banban%' OR company_legal_name ILIKE '%banban%'
);

-- 5. Verificar resultado final
SELECT 
  'RESULTADO FINAL:' as status,
  id,
  company_trading_name,
  slug,
  client_type,
  implementation_config->'subscribed_modules' as subscribed_modules,
  is_implementation_complete
FROM organizations 
WHERE company_trading_name ILIKE '%banban%' OR company_legal_name ILIKE '%banban%'; 