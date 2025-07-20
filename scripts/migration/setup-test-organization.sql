-- Script para configurar organização de teste para o usuário atual
-- Resolução do erro "Organization not found" nos testes de integração

-- 1. Criar organização de teste se não existir
INSERT INTO organizations (
  id,
  name,
  company_legal_name,
  company_trading_name,
  client_type,
  custom_backend_url,
  implementation_config,
  is_implementation_complete,
  implementation_date,
  implementation_team_notes,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Organização de Teste Multi-Tenant',
  'Teste Organização Ltda',
  'Teste Org',
  'custom',
  'http://localhost:4000',
  '{"enabled_modules": ["analytics", "performance", "inventory"], "custom_features": ["advanced_reporting", "real_time_sync"]}',
  true,
  NOW(),
  'Organização criada automaticamente para testes de integração multi-tenant',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- 2. Obter o ID da organização criada
WITH test_org AS (
  SELECT id FROM organizations WHERE name = 'Organização de Teste Multi-Tenant' LIMIT 1
)

-- 3. Atualizar perfis que não têm organização vinculada
UPDATE profiles 
SET organization_id = (SELECT id FROM test_org)
WHERE organization_id IS NULL;

-- 4. Verificar se existem perfis sem organização
SELECT 
  COUNT(*) as profiles_without_org,
  'Perfis sem organização após atualização' as description
FROM profiles 
WHERE organization_id IS NULL;

-- 5. Verificar a organização criada
SELECT 
  o.id,
  o.name,
  o.client_type,
  o.custom_backend_url,
  o.is_implementation_complete,
  COUNT(p.id) as users_count
FROM organizations o
LEFT JOIN profiles p ON o.id = p.organization_id
WHERE o.name = 'Organização de Teste Multi-Tenant'
GROUP BY o.id, o.name, o.client_type, o.custom_backend_url, o.is_implementation_complete;

-- 6. Criar uma organização padrão também para testes
INSERT INTO organizations (
  id,
  name,
  company_legal_name,
  company_trading_name,
  client_type,
  implementation_config,
  is_implementation_complete,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Organização Padrão SaaS',
  'SaaS Padrão Ltda',
  'SaaS Padrão',
  'standard',
  '{"enabled_standard_modules": ["analytics", "reports", "alerts", "dashboard"]}',
  true,
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- 7. Verificar ambas as organizações
SELECT 
  id,
  name,
  client_type,
  custom_backend_url,
  is_implementation_complete,
  implementation_config
FROM organizations
WHERE name IN ('Organização de Teste Multi-Tenant', 'Organização Padrão SaaS')
ORDER BY client_type; 