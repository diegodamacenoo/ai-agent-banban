-- ================================================
-- SCRIPT: Limpeza de Views e Tabelas Não Utilizadas
-- Projeto: Banban - Limpeza do Banco de Dados
-- Data: $(date)
-- ================================================

-- IMPORTANTE: Execute este script em ambiente de desenvolvimento primeiro!
-- Faça backup antes de executar em produção.

BEGIN;

-- ================================================
-- 1. DELETAR VIEWS DE COMPATIBILIDADE
-- ================================================

-- Views de compatibilidade (não mais necessárias)
DROP VIEW IF EXISTS public.core_products_compat CASCADE;
DROP VIEW IF EXISTS public.core_suppliers_compat CASCADE;
DROP VIEW IF EXISTS public.tenant_inventory_items_compat CASCADE;

-- ================================================
-- 2. DELETAR VIEWS DE TENANT
-- ================================================

-- Views específicas de tenant
DROP VIEW IF EXISTS public.tenant_inventory_movements_view CASCADE;
DROP VIEW IF EXISTS public.tenant_locations_view CASCADE;
DROP VIEW IF EXISTS public.tenant_product_pricing_view CASCADE;
DROP VIEW IF EXISTS public.tenant_product_variants_view CASCADE;
DROP VIEW IF EXISTS public.tenant_products_view CASCADE;
DROP VIEW IF EXISTS public.tenant_suppliers_view CASCADE;

-- ================================================
-- 3. DELETAR VIEWS COM PREFIXO v_
-- ================================================

-- Views com prefixo v_
DROP VIEW IF EXISTS public.v_active_alerts CASCADE;
DROP VIEW IF EXISTS public.v_current_inventory CASCADE;
DROP VIEW IF EXISTS public.v_locations CASCADE;
DROP VIEW IF EXISTS public.v_products CASCADE;
DROP VIEW IF EXISTS public.v_suppliers CASCADE;

-- ================================================
-- 4. VERIFICAR SE EXISTEM TABELAS COM PREFIXO v_
-- ================================================

-- Verificar e deletar tabelas que começam com v_ (se existirem)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Buscar tabelas que começam com 'v_'
    FOR r IN (
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'v_%'
        AND table_type = 'BASE TABLE'
    ) LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.table_name) || ' CASCADE';
        RAISE NOTICE 'Tabela deletada: %', r.table_name;
    END LOOP;
END $$;

-- ================================================
-- 5. CONFIRMAÇÃO E RELATÓRIO
-- ================================================

-- Verificar views restantes
SELECT 'VIEWS RESTANTES:' as status;
SELECT 
    schemaname,
    viewname
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- Verificar se ainda existem tabelas com prefixo v_
SELECT 'TABELAS v_ RESTANTES:' as status;
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'v_%'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

COMMIT;

-- ================================================
-- RESUMO DAS VIEWS DELETADAS
-- ================================================

/*
VIEWS DELETADAS:
1. core_products_compat
2. core_suppliers_compat  
3. tenant_inventory_items_compat
4. tenant_inventory_movements_view
5. tenant_locations_view
6. tenant_product_pricing_view
7. tenant_product_variants_view
8. tenant_products_view
9. tenant_suppliers_view
10. v_active_alerts
11. v_current_inventory
12. v_locations
13. v_products
14. v_suppliers

OBSERVAÇÕES:
- Todas as views foram deletadas com CASCADE para remover dependências
- Script verifica automaticamente tabelas com prefixo v_
- Backup recomendado antes da execução
- Teste em desenvolvimento primeiro
*/ 