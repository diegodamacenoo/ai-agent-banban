-- Script para prevenir implementações órfãs no futuro
-- Cria triggers que mantêm consistência entre módulos e implementações

-- ================================================
-- TRIGGER: Arquivar/desarquivar implementações em cascata
-- ================================================

-- Function to handle cascade archiving/unarchiving
CREATE OR REPLACE FUNCTION sync_implementations_archive_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If module is being archived, archive all its implementations
    IF NEW.archived_at IS NOT NULL AND OLD.archived_at IS NULL THEN
        UPDATE module_implementations 
        SET archived_at = NEW.archived_at
        WHERE base_module_id = NEW.id 
          AND archived_at IS NULL;
        
        RAISE NOTICE 'Archived % implementations for module %', 
            (SELECT COUNT(*) FROM module_implementations WHERE base_module_id = NEW.id AND archived_at = NEW.archived_at),
            NEW.slug;
    END IF;
    
    -- If module is being unarchived, unarchive all its implementations
    IF NEW.archived_at IS NULL AND OLD.archived_at IS NOT NULL THEN
        UPDATE module_implementations 
        SET archived_at = NULL
        WHERE base_module_id = NEW.id 
          AND archived_at IS NOT NULL;
          
        RAISE NOTICE 'Unarchived % implementations for module %', 
            (SELECT COUNT(*) FROM module_implementations WHERE base_module_id = NEW.id AND archived_at IS NULL),
            NEW.slug;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on base_modules table
DROP TRIGGER IF EXISTS trigger_sync_implementations_archive ON base_modules;

CREATE TRIGGER trigger_sync_implementations_archive
    AFTER UPDATE OF archived_at ON base_modules
    FOR EACH ROW
    WHEN (OLD.archived_at IS DISTINCT FROM NEW.archived_at)
    EXECUTE FUNCTION sync_implementations_archive_status();

-- ================================================
-- TRIGGER: Soft delete implementações em cascata
-- ================================================

-- Function to handle cascade soft deletion
CREATE OR REPLACE FUNCTION sync_implementations_delete_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If module is being soft deleted, soft delete all its implementations
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        UPDATE module_implementations 
        SET deleted_at = NEW.deleted_at
        WHERE base_module_id = NEW.id 
          AND deleted_at IS NULL;
          
        RAISE NOTICE 'Soft deleted % implementations for module %', 
            (SELECT COUNT(*) FROM module_implementations WHERE base_module_id = NEW.id AND deleted_at = NEW.deleted_at),
            NEW.slug;
    END IF;
    
    -- If module is being restored from soft delete, restore all its implementations
    IF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
        UPDATE module_implementations 
        SET deleted_at = NULL
        WHERE base_module_id = NEW.id 
          AND deleted_at IS NOT NULL;
          
        RAISE NOTICE 'Restored % implementations for module %', 
            (SELECT COUNT(*) FROM module_implementations WHERE base_module_id = NEW.id AND deleted_at IS NULL),
            NEW.slug;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on base_modules table  
DROP TRIGGER IF EXISTS trigger_sync_implementations_delete ON base_modules;

CREATE TRIGGER trigger_sync_implementations_delete
    AFTER UPDATE OF deleted_at ON base_modules
    FOR EACH ROW
    WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
    EXECUTE FUNCTION sync_implementations_delete_status();

-- ================================================
-- VALIDAÇÃO: Verificar se triggers foram criados
-- ================================================

-- List created triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    trigger_schema
FROM information_schema.triggers 
WHERE trigger_name LIKE '%sync_implementations%'
ORDER BY trigger_name;

-- ================================================
-- TESTE: Testar triggers (OPCIONAL - só para validação)
-- ================================================

-- Uncomment to test triggers:
-- 
-- -- Test archive cascade
-- UPDATE base_modules SET archived_at = NOW() WHERE slug = 'test-module';
-- UPDATE base_modules SET archived_at = NULL WHERE slug = 'test-module';
--
-- -- Test delete cascade  
-- UPDATE base_modules SET deleted_at = NOW() WHERE slug = 'test-module';
-- UPDATE base_modules SET deleted_at = NULL WHERE slug = 'test-module';

-- ================================================
-- COMENTÁRIOS
-- ================================================

COMMENT ON FUNCTION sync_implementations_archive_status() IS 
'Mantém consistência entre módulos e implementações durante arquivamento/desarquivamento';

COMMENT ON FUNCTION sync_implementations_delete_status() IS 
'Mantém consistência entre módulos e implementações durante soft delete/restore';