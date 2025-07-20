-- Script para debugar organizações e perfis no banco de dados

-- 1. Verificar se as organizações existem
SELECT 
  id,
  company_legal_name,
  company_trading_name,
  client_type,
  is_implementation_complete,
  created_at
FROM organizations 
WHERE company_trading_name IN ('BanBan Fashion', 'Riachuelo', 'C&A')
ORDER BY company_trading_name;

-- 2. Verificar estrutura da tabela organizations
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
ORDER BY ordinal_position;

-- 3. Verificar perfis e suas organizações
SELECT 
  p.id as profile_id,
  p.email,
  p.is_setup_complete,
  o.id as org_id,
  o.company_legal_name,
  o.company_trading_name
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
LIMIT 10;

-- 4. Verificar se existe algum perfil com organização BanBan
SELECT 
  p.id as profile_id,
  p.email,
  p.is_setup_complete,
  o.company_trading_name
FROM profiles p
JOIN organizations o ON p.organization_id = o.id
WHERE o.company_trading_name = 'BanBan Fashion';

-- 5. Contar total de organizações
SELECT COUNT(*) as total_organizations FROM organizations;

-- 6. Contar perfis por organização
SELECT 
  o.company_trading_name,
  COUNT(p.id) as profile_count
FROM organizations o
LEFT JOIN profiles p ON p.organization_id = o.id
GROUP BY o.id, o.company_trading_name
ORDER BY o.company_trading_name; 