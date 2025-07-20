-- Script para verificar a estrutura atual da tabela organizations

-- 1. Verificar colunas da tabela organizations
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'organizations' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar constraints
SELECT 
  constraint_name,
  constraint_type,
  check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'organizations' 
  AND tc.table_schema = 'public';

-- 3. Verificar índices
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'organizations' 
  AND schemaname = 'public';

-- 4. Testar inserção básica
INSERT INTO organizations (
  name, 
  company_legal_name,
  company_trading_name
) VALUES (
  'Teste Estrutura', 
  'Teste Estrutura Ltda',
  'Teste'
) RETURNING *;

-- 5. Limpar teste
DELETE FROM organizations WHERE name = 'Teste Estrutura'; 