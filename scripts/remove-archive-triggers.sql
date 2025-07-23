-- Script para remover triggers que arquivam implementações automaticamente
-- Permite que a aplicação controle o comportamento de arquivamento

-- ================================================
-- REMOVER TRIGGERS DE ARQUIVAMENTO AUTOMÁTICO
-- ================================================

-- Remove trigger that automatically archives implementations when module is archived
DROP TRIGGER IF EXISTS trigger_sync_implementations_archive ON base_modules;

-- Remove the function (optional - keep it for future use if needed)
-- DROP FUNCTION IF EXISTS sync_implementations_archive_status();

-- ================================================
-- MANTER TRIGGERS PARA SOFT DELETE (ESTES SÃO NECESSÁRIOS)
-- ================================================
-- O trigger de soft delete continua válido porque quando um módulo é deletado,
-- suas implementações devem ser deletadas também

-- Verificar triggers restantes
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    trigger_schema
FROM information_schema.triggers 
WHERE trigger_name LIKE '%sync_implementations%'
ORDER BY trigger_name;

-- ================================================
-- COMENTÁRIOS
-- ================================================

/* 
COMPORTAMENTO APÓS REMOÇÃO DOS TRIGGERS:

1. ARQUIVAR MÓDULO:
   - ✅ Módulo base é arquivado (archived_at definido)
   - ✅ Implementações permanecem ativas (archived_at = null)
   - ✅ Assignments permanecem ativos (is_active = true)
   - ✅ Tenants existentes continuam acessando
   - ✅ Interface admin impede novas atribuições

2. DESARQUIVAR MÓDULO:
   - ✅ Módulo base volta a ficar disponível (archived_at = null)
   - ✅ Interface admin permite novas atribuições
   
3. SOFT DELETE MÓDULO:
   - ✅ Módulo base é soft-deletado (deleted_at definido)
   - ✅ Implementações são soft-deletadas via trigger (correto)
   - ✅ Tenants perdem acesso (comportamento esperado)
*/