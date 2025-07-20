-- Script para debugar os tipos de cliente existentes no banco
-- Este script ajuda a entender quais client_types estão sendo usados

-- 1. Verificar todos os client_types distintos
SELECT 
    client_type,
    COUNT(*) as count,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM organizations WHERE deleted_at IS NULL) as percentage
FROM organizations 
WHERE deleted_at IS NULL
GROUP BY client_type
ORDER BY count DESC;

-- 2. Listar algumas organizações de cada tipo
SELECT 
    client_type,
    slug,
    company_trading_name,
    is_implementation_complete,
    created_at
FROM organizations 
WHERE deleted_at IS NULL
ORDER BY client_type, created_at DESC
LIMIT 20;

-- 3. Verificar se existem organizações com client_type não mapeado
SELECT 
    client_type,
    slug,
    company_trading_name,
    'Precisa de mapeamento no registry' as status
FROM organizations 
WHERE deleted_at IS NULL
  AND client_type NOT IN ('custom')  -- Apenas 'custom' está mapeado atualmente
ORDER BY client_type, slug;

-- 4. Verificar constraint do client_type
SELECT 
    conname,
    consrc
FROM pg_constraint 
WHERE conname LIKE '%client_type%';