-- Script para identificar todas as Foreign Keys que referenciam tabelas core_*
-- Este script ajuda a identificar as dependências que impedem a exclusão das tabelas core_*

-- Função para listar constraints que referenciam uma tabela específica
CREATE OR REPLACE FUNCTION get_referencing_constraints(target_table text)
RETURNS TABLE (
    constraint_name text,
    table_schema text,
    table_name text,
    column_name text,
    foreign_table_schema text,
    foreign_table_name text,
    foreign_column_name text,
    constraint_type text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tc.constraint_name::text,
        tc.table_schema::text,
        tc.table_name::text,
        kcu.column_name::text,
        ccu.table_schema::text as foreign_table_schema,
        ccu.table_name::text as foreign_table_name,
        ccu.column_name::text as foreign_column_name,
        tc.constraint_type::text
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = target_table
        AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name;
END;
$$ LANGUAGE plpgsql;

-- Análise de Foreign Keys por tabela core_*
DO $$
DECLARE
    core_table text;
    constraint_count integer;
    total_constraints integer := 0;
    core_tables text[] := ARRAY[
        'core_products',
        'core_suppliers', 
        'core_locations',
        'core_product_variants',
        'core_orders',
        'core_documents',
        'core_movements',
        'core_product_pricing',
        'core_inventory_snapshots',
        'core_order_items',
        'core_document_items'
    ];
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'ANÁLISE DE FOREIGN KEYS - TABELAS CORE_*';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';

    FOREACH core_table IN ARRAY core_tables
    LOOP
        -- Contar constraints para esta tabela
        SELECT COUNT(*) INTO constraint_count
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu 
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = core_table
            AND tc.table_schema = 'public';

        IF constraint_count > 0 THEN
            RAISE NOTICE '📋 TABELA: % (% constraints)', upper(core_table), constraint_count;
            RAISE NOTICE '─────────────────────────────────────────';
            
            -- Listar todas as constraints
            FOR constraint_name, table_schema, table_name, column_name, foreign_table_schema, foreign_table_name, foreign_column_name, constraint_type IN 
                SELECT * FROM get_referencing_constraints(core_table)
            LOOP
                RAISE NOTICE '   🔗 %.% (%)', table_name, column_name, constraint_name;
            END LOOP;
            
            RAISE NOTICE '';
            total_constraints := total_constraints + constraint_count;
        ELSE
            RAISE NOTICE '✅ %: Nenhuma constraint (pronta para exclusão)', upper(core_table);
        END IF;
    END LOOP;

    RAISE NOTICE '==========================================';
    RAISE NOTICE 'RESUMO FINAL';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Total de Foreign Keys encontradas: %', total_constraints;
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  TODAS essas constraints devem ser removidas antes';
    RAISE NOTICE '   da exclusão das tabelas core_*';
    RAISE NOTICE '';
END;
$$;

-- Script para gerar comandos de remoção das constraints
DO $$
DECLARE
    core_table text;
    drop_commands text := '';
    constraint_record record;
    core_tables text[] := ARRAY[
        'core_products',
        'core_suppliers', 
        'core_locations',
        'core_product_variants',
        'core_orders',
        'core_documents',
        'core_movements',
        'core_product_pricing',
        'core_inventory_snapshots',
        'core_order_items',
        'core_document_items'
    ];
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'COMANDOS PARA REMOVER FOREIGN KEYS';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE '-- Execute estes comandos ANTES de excluir as tabelas core_*';
    RAISE NOTICE '';

    FOREACH core_table IN ARRAY core_tables
    LOOP
        FOR constraint_record IN 
            SELECT * FROM get_referencing_constraints(core_table)
        LOOP
            RAISE NOTICE 'ALTER TABLE %.% DROP CONSTRAINT IF EXISTS %;', 
                constraint_record.table_schema, 
                constraint_record.table_name, 
                constraint_record.constraint_name;
        END LOOP;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '-- Após remover as constraints, as tabelas podem ser excluídas:';
    RAISE NOTICE '';
    
    FOREACH core_table IN ARRAY core_tables
    LOOP
        RAISE NOTICE 'DROP TABLE IF EXISTS % CASCADE;', core_table;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
END;
$$;

-- Verificar se as tabelas core_* ainda existem
DO $$
DECLARE
    core_table text;
    table_exists boolean;
    existing_tables integer := 0;
    core_tables text[] := ARRAY[
        'core_products',
        'core_suppliers', 
        'core_locations',
        'core_product_variants',
        'core_orders',
        'core_documents',
        'core_movements',
        'core_product_pricing',
        'core_inventory_snapshots',
        'core_order_items',
        'core_document_items'
    ];
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'VERIFICAÇÃO DE EXISTÊNCIA DAS TABELAS';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';

    FOREACH core_table IN ARRAY core_tables
    LOOP
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = core_table
        ) INTO table_exists;

        IF table_exists THEN
            RAISE NOTICE '📋 % - EXISTS', upper(core_table);
            existing_tables := existing_tables + 1;
        ELSE
            RAISE NOTICE '❌ % - NOT FOUND', upper(core_table);
        END IF;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE 'Tabelas core_* encontradas: %/11', existing_tables;
    
    IF existing_tables = 0 THEN
        RAISE NOTICE '🎉 Todas as tabelas core_* foram removidas!';
    ELSE
        RAISE NOTICE '⚠️  % tabelas ainda existem no banco', existing_tables;
    END IF;
    RAISE NOTICE '';
END;
$$;

-- Limpeza da função temporária
DROP FUNCTION IF EXISTS get_referencing_constraints(text); 