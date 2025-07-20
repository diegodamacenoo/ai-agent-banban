-- ================================================
-- SQL PARA REMOVER MÓDULOS FANTASMAS
-- ================================================
-- Este script remove registros de módulos que não existem fisicamente
-- no sistema de arquivos, mas aparecem na interface admin.
-- 
-- Gerado em: 2025-01-03 09:55:00
-- Módulos a serem removidos: banban-analytics, banban-components

-- ================================================
-- VERIFICAÇÃO ANTES DA REMOÇÃO
-- ================================================
SELECT ''ANTES DA REMOÇÃO - organization_modules'' as tabela, COUNT(*) as contagem
FROM organization_modules
WHERE module_id IN (''banban-analytics'', ''banban-components'');

SELECT ''ANTES DA REMOÇÃO - core_modules'' as tabela, COUNT(*) as contagem
FROM core_modules
WHERE module_id IN (''banban-analytics'', ''banban-components'');

SELECT ''ANTES DA REMOÇÃO - tenant_modules'' as tabela, COUNT(*) as contagem
FROM tenant_modules
WHERE module_id IN (''banban-analytics'', ''banban-components'');

SELECT ''ANTES DA REMOÇÃO - module_lifecycle'' as tabela, COUNT(*) as contagem
FROM module_lifecycle
WHERE module_id IN (''banban-analytics'', ''banban-components'');

-- ================================================
-- REMOÇÃO DOS MÓDULOS FANTASMAS
-- ================================================

-- Remover registros de módulos fantasmas da tabela organization_modules
DELETE FROM organization_modules
WHERE module_id IN (''banban-analytics'', ''banban-components'');

-- Remover registros de módulos fantasmas da tabela core_modules
DELETE FROM core_modules
WHERE module_id IN (''banban-analytics'', ''banban-components'');

-- Remover registros de módulos fantasmas da tabela tenant_modules
DELETE FROM tenant_modules
WHERE module_id IN (''banban-analytics'', ''banban-components'');

-- Remover registros de módulos fantasmas da tabela module_lifecycle
DELETE FROM module_lifecycle
WHERE module_id IN (''banban-analytics'', ''banban-components'');

-- ================================================
-- VERIFICAÇÃO APÓS A REMOÇÃO
-- ================================================
SELECT ''APÓS REMOÇÃO - organization_modules'' as tabela, COUNT(*) as contagem
FROM organization_modules
WHERE module_id IN (''banban-analytics'', ''banban-components'');

SELECT ''APÓS REMOÇÃO - core_modules'' as tabela, COUNT(*) as contagem
FROM core_modules
WHERE module_id IN (''banban-analytics'', ''banban-components'');

SELECT ''APÓS REMOÇÃO - tenant_modules'' as tabela, COUNT(*) as contagem
FROM tenant_modules
WHERE module_id IN (''banban-analytics'', ''banban-components'');

SELECT ''APÓS REMOÇÃO - module_lifecycle'' as tabela, COUNT(*) as contagem
FROM module_lifecycle
WHERE module_id IN (''banban-analytics'', ''banban-components'');

-- ================================================
-- RELATÓRIO FINAL
-- ================================================
SELECT ''RELATÓRIO FINAL'' as status, ''Limpeza de módulos fantasmas concluída'' as mensagem;

-- Listar todos os módulos restantes para verificação
SELECT DISTINCT module_id, module_name, module_type 
FROM organization_modules 
ORDER BY module_id;
