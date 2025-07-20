-- Script de Migração para Padronização de ENUMs
-- Execução em fases para minimizar impacto

-- ============================================================================
-- FASE 1: ENUMs SIMPLES
-- ============================================================================

-- 1.1 location_type_enum: LOJA → STORE
-- ============================================================================
BEGIN;

-- Adicionar novo valor
ALTER TYPE location_type_enum ADD VALUE 'STORE';

-- Atualizar dados existentes
UPDATE core_locations 
SET location_type = 'STORE' 
WHERE location_type = 'LOJA';

-- Verificar migração
SELECT location_type, COUNT(*) 
FROM core_locations 
GROUP BY location_type;

COMMIT;

-- 1.2 order_type_enum: COMPRA → PURCHASE
-- ============================================================================
BEGIN;

-- Adicionar novo valor
ALTER TYPE order_type_enum ADD VALUE 'PURCHASE';

-- Atualizar dados existentes
UPDATE core_orders 
SET order_type = 'PURCHASE' 
WHERE order_type = 'COMPRA';

-- Verificar migração
SELECT order_type, COUNT(*) 
FROM core_orders 
GROUP BY order_type;

COMMIT;

-- 1.3 order_status_enum: NOVO → NEW, APROVADO → APPROVED, CANCELADO → CANCELLED
-- ============================================================================
BEGIN;

-- Adicionar novos valores
ALTER TYPE order_status_enum ADD VALUE 'NEW';
ALTER TYPE order_status_enum ADD VALUE 'APPROVED';
ALTER TYPE order_status_enum ADD VALUE 'CANCELLED';

-- Atualizar dados existentes
UPDATE core_orders SET status = 'NEW' WHERE status = 'NOVO';
UPDATE core_orders SET status = 'APPROVED' WHERE status = 'APROVADO';
UPDATE core_orders SET status = 'CANCELLED' WHERE status = 'CANCELADO';

-- Verificar migração
SELECT status, COUNT(*) 
FROM core_orders 
GROUP BY status;

COMMIT;

-- 1.4 entity_type_enum: variant → VARIANT
-- ============================================================================
BEGIN;

-- Adicionar novo valor
ALTER TYPE entity_type_enum ADD VALUE 'VARIANT';

-- Atualizar dados existentes
UPDATE core_events 
SET entity_type = 'VARIANT' 
WHERE entity_type = 'variant';

-- Verificar migração
SELECT entity_type, COUNT(*) 
FROM core_events 
GROUP BY entity_type;

COMMIT;

-- ============================================================================
-- FASE 3: ENUMs RESTANTES (PADRONIZAÇÃO FINAL)
-- STATUS: ✅ COMPLETA - EXECUTADA EM Janeiro 2025
-- ============================================================================

-- 3.1 Padronizar data_export_format_enum (minúsculas → MAIÚSCULAS)
-- ============================================================================
BEGIN;

-- Adicionar valores em maiúsculas
ALTER TYPE data_export_format_enum ADD VALUE 'JSON';
ALTER TYPE data_export_format_enum ADD VALUE 'CSV';
ALTER TYPE data_export_format_enum ADD VALUE 'PDF';

-- Migrar dados existentes
UPDATE user_data_exports SET format = 'JSON' WHERE format = 'json';
UPDATE user_data_exports SET format = 'CSV' WHERE format = 'csv';
UPDATE user_data_exports SET format = 'PDF' WHERE format = 'pdf';

COMMIT;

-- 3.2 Padronizar deletion_status_enum (minúsculas → MAIÚSCULAS)
-- ============================================================================
BEGIN;

ALTER TYPE deletion_status_enum ADD VALUE 'PENDING';
ALTER TYPE deletion_status_enum ADD VALUE 'CONFIRMED';
ALTER TYPE deletion_status_enum ADD VALUE 'CANCELLED';
ALTER TYPE deletion_status_enum ADD VALUE 'COMPLETED';

-- Migrar dados (caso existam)
UPDATE user_deletion_requests SET status = 'PENDING' WHERE status = 'pending';
UPDATE user_deletion_requests SET status = 'CONFIRMED' WHERE status = 'confirmed';
UPDATE user_deletion_requests SET status = 'CANCELLED' WHERE status = 'cancelled';
UPDATE user_deletion_requests SET status = 'COMPLETED' WHERE status = 'completed';

COMMIT;

-- 3.3 Padronizar export_status_enum (minúsculas → MAIÚSCULAS)
-- ============================================================================
BEGIN;

ALTER TYPE export_status_enum ADD VALUE 'REQUESTED';
ALTER TYPE export_status_enum ADD VALUE 'PROCESSING';
ALTER TYPE export_status_enum ADD VALUE 'COMPLETED';
ALTER TYPE export_status_enum ADD VALUE 'FAILED';
ALTER TYPE export_status_enum ADD VALUE 'EXPIRED';

-- Migrar dados existentes
UPDATE user_data_exports SET status = 'COMPLETED' WHERE status = 'completed';
UPDATE user_data_exports SET status = 'REQUESTED' WHERE status = 'requested';
UPDATE user_data_exports SET status = 'PROCESSING' WHERE status = 'processing';
UPDATE user_data_exports SET status = 'FAILED' WHERE status = 'failed';
UPDATE user_data_exports SET status = 'EXPIRED' WHERE status = 'expired';

COMMIT;

-- 3.4 Padronizar mfa_method_enum (minúsculas → MAIÚSCULAS)
-- ============================================================================
BEGIN;

ALTER TYPE mfa_method_enum ADD VALUE 'EMAIL';
ALTER TYPE mfa_method_enum ADD VALUE 'WHATSAPP';

-- Migrar dados (caso existam)
UPDATE profiles SET mfa_method = 'EMAIL' WHERE mfa_method = 'email';
UPDATE profiles SET mfa_method = 'WHATSAPP' WHERE mfa_method = 'whatsapp';

COMMIT;

-- 3.5 Padronizar user_status_enum (minúsculas → MAIÚSCULAS)
-- ============================================================================
BEGIN;

ALTER TYPE user_status_enum ADD VALUE 'ACTIVE';
ALTER TYPE user_status_enum ADD VALUE 'INACTIVE';
ALTER TYPE user_status_enum ADD VALUE 'DELETED';

-- Migrar dados existentes
UPDATE profiles SET status = 'ACTIVE' WHERE status = 'active';
UPDATE profiles SET status = 'INACTIVE' WHERE status = 'inactive';
UPDATE profiles SET status = 'DELETED' WHERE status = 'deleted';

COMMIT;

-- ============================================================================
-- VERIFICAÇÕES FINAIS DAS FASES 1, 2 e 3
-- ============================================================================

-- Verificar se ainda existem valores antigos
SELECT 'location_type_enum - valores antigos' as check_type, COUNT(*) as count
FROM core_locations 
WHERE location_type = 'LOJA'

UNION ALL

SELECT 'order_type_enum - valores antigos', COUNT(*)
FROM core_orders 
WHERE order_type = 'COMPRA'

UNION ALL

SELECT 'order_status_enum - valores antigos', COUNT(*)
FROM core_orders 
WHERE status IN ('NOVO', 'APROVADO', 'CANCELADO')

UNION ALL

SELECT 'entity_type_enum - valores antigos', COUNT(*)
FROM core_events 
WHERE entity_type = 'variant';

-- ============================================================================
-- SCRIPT PARA REMOÇÃO DOS VALORES ANTIGOS (EXECUTAR APÓS VALIDAÇÃO)
-- ============================================================================

-- ATENÇÃO: Estes comandos só devem ser executados após confirmar que:
-- 1. Não existem mais dados usando os valores antigos
-- 2. A aplicação foi atualizada para usar os novos valores
-- 3. Todos os testes passaram

/*
-- Para remover valores antigos de ENUM, é necessário recriar o tipo
-- Exemplo para location_type_enum:

BEGIN;

-- Criar novo tipo temporário
CREATE TYPE location_type_enum_new AS ENUM ('CD', 'STORE');

-- Alterar coluna para usar novo tipo
ALTER TABLE core_locations 
ALTER COLUMN location_type TYPE location_type_enum_new 
USING location_type::text::location_type_enum_new;

-- Remover tipo antigo e renomear novo
DROP TYPE location_type_enum;
ALTER TYPE location_type_enum_new RENAME TO location_type_enum;

COMMIT;
*/

-- ============================================================================
-- FASE 2: doc_status_enum (COMPLEXO - 26 valores)
-- STATUS: ✅ COMPLETA - EXECUTADA EM Janeiro 2025
-- ============================================================================

-- 2.1 Adicionar valores em inglês
-- ============================================================================
BEGIN;

ALTER TYPE doc_status_enum ADD VALUE 'PENDING';
ALTER TYPE doc_status_enum ADD VALUE 'AWAITING_CD_VERIFICATION';
ALTER TYPE doc_status_enum ADD VALUE 'IN_CD_VERIFICATION';
ALTER TYPE doc_status_enum ADD VALUE 'CD_VERIFIED_NO_DISCREPANCY';
ALTER TYPE doc_status_enum ADD VALUE 'CD_VERIFIED_WITH_DISCREPANCY';
ALTER TYPE doc_status_enum ADD VALUE 'EFFECTIVE_CD';
ALTER TYPE doc_status_enum ADD VALUE 'TRANSFER_ORDER_CREATED';
ALTER TYPE doc_status_enum ADD VALUE 'SEPARATION_MAP_CREATED';
ALTER TYPE doc_status_enum ADD VALUE 'AWAITING_CD_SEPARATION';
ALTER TYPE doc_status_enum ADD VALUE 'IN_CD_SEPARATION';
ALTER TYPE doc_status_enum ADD VALUE 'CD_SEPARATED_NO_DISCREPANCY';
ALTER TYPE doc_status_enum ADD VALUE 'CD_SEPARATED_WITH_DISCREPANCY';
ALTER TYPE doc_status_enum ADD VALUE 'SEPARATED_PRE_DOCK';
ALTER TYPE doc_status_enum ADD VALUE 'SHIPPED_CD';
ALTER TYPE doc_status_enum ADD VALUE 'CDH_TRANSFER_INVOICED';
ALTER TYPE doc_status_enum ADD VALUE 'AWAITING_STORE_VERIFICATION';
ALTER TYPE doc_status_enum ADD VALUE 'IN_STORE_VERIFICATION';
ALTER TYPE doc_status_enum ADD VALUE 'STORE_VERIFIED_NO_DISCREPANCY';
ALTER TYPE doc_status_enum ADD VALUE 'STORE_VERIFIED_WITH_DISCREPANCY';
ALTER TYPE doc_status_enum ADD VALUE 'EFFECTIVE_STORE';
ALTER TYPE doc_status_enum ADD VALUE 'SALE_COMPLETED';
ALTER TYPE doc_status_enum ADD VALUE 'RETURN_AWAITING';
ALTER TYPE doc_status_enum ADD VALUE 'RETURN_COMPLETED';
ALTER TYPE doc_status_enum ADD VALUE 'STORE_TO_STORE_TRANSFER';
ALTER TYPE doc_status_enum ADD VALUE 'CANCELLED';

COMMIT;

-- 2.2 Migrar dados existentes
-- ============================================================================
BEGIN;

-- Migrações baseadas em dados reais do banco:
-- PENDENTE → PENDING: 2 registros
-- PRE_BAIXA → PENDING: 0 registros  
-- CONFERENCIA_CD_COM_DIVERGENCIA → CD_VERIFIED_WITH_DISCREPANCY: 1 registro
-- EFETIVADO_CD → EFFECTIVE_CD: 1 registro

UPDATE core_documents SET status = 'PENDING' WHERE status = 'PENDENTE';
UPDATE core_documents SET status = 'PENDING' WHERE status = 'PRE_BAIXA';
UPDATE core_documents SET status = 'AWAITING_CD_VERIFICATION' WHERE status = 'AGUARDANDO_CONFERENCIA_CD';
UPDATE core_documents SET status = 'IN_CD_VERIFICATION' WHERE status = 'EM_CONFERENCIA_CD';
UPDATE core_documents SET status = 'CD_VERIFIED_NO_DISCREPANCY' WHERE status = 'CONFERENCIA_CD_SEM_DIVERGENCIA';
UPDATE core_documents SET status = 'CD_VERIFIED_WITH_DISCREPANCY' WHERE status = 'CONFERENCIA_CD_COM_DIVERGENCIA';
UPDATE core_documents SET status = 'EFFECTIVE_CD' WHERE status = 'EFETIVADO_CD';
UPDATE core_documents SET status = 'TRANSFER_ORDER_CREATED' WHERE status = 'PEDIDO_TRANSFERENCIA_CRIADO';
UPDATE core_documents SET status = 'SEPARATION_MAP_CREATED' WHERE status = 'MAPA_SEPARACAO_CRIADO';
UPDATE core_documents SET status = 'AWAITING_CD_SEPARATION' WHERE status = 'AGUARDANDO_SEPARACAO_CD';
UPDATE core_documents SET status = 'IN_CD_SEPARATION' WHERE status = 'EM_SEPARACAO_CD';
UPDATE core_documents SET status = 'CD_SEPARATED_NO_DISCREPANCY' WHERE status = 'SEPARACAO_CD_SEM_DIVERGENCIA';
UPDATE core_documents SET status = 'CD_SEPARATED_WITH_DISCREPANCY' WHERE status = 'SEPARACAO_CD_COM_DIVERGENCIA';
UPDATE core_documents SET status = 'SEPARATED_PRE_DOCK' WHERE status = 'SEPARADO_PRE_DOCA';
UPDATE core_documents SET status = 'SHIPPED_CD' WHERE status = 'EMBARCADO_CD';
UPDATE core_documents SET status = 'CDH_TRANSFER_INVOICED' WHERE status = 'TRANSFERENCIA_CDH_FATURADA';
UPDATE core_documents SET status = 'AWAITING_STORE_VERIFICATION' WHERE status = 'AGUARDANDO_CONFERENCIA_LOJA';
UPDATE core_documents SET status = 'IN_STORE_VERIFICATION' WHERE status = 'EM_CONFERENCIA_LOJA';
UPDATE core_documents SET status = 'STORE_VERIFIED_NO_DISCREPANCY' WHERE status = 'CONFERENCIA_LOJA_SEM_DIVERGENCIA';
UPDATE core_documents SET status = 'STORE_VERIFIED_WITH_DISCREPANCY' WHERE status = 'CONFERENCIA_LOJA_COM_DIVERGENCIA';
UPDATE core_documents SET status = 'EFFECTIVE_STORE' WHERE status = 'EFETIVADO_LOJA';
UPDATE core_documents SET status = 'SALE_COMPLETED' WHERE status = 'VENDA_CONCLUIDA';
UPDATE core_documents SET status = 'RETURN_AWAITING' WHERE status = 'DEVOLUCAO_AGUARDANDO';
UPDATE core_documents SET status = 'RETURN_COMPLETED' WHERE status = 'DEVOLUCAO_CONCLUIDA';
UPDATE core_documents SET status = 'STORE_TO_STORE_TRANSFER' WHERE status = 'TRANSFERENCIA_ENRE_LOJAS';
UPDATE core_documents SET status = 'CANCELLED' WHERE status = 'CANCELADA';

-- Verificar migração
SELECT status, COUNT(*) 
FROM core_documents 
GROUP BY status
ORDER BY COUNT(*) DESC;

COMMIT;

-- 2.3 Verificações da Fase 2
-- ============================================================================

-- Verificar se ainda existem valores antigos
SELECT COUNT(*) as valores_antigos_restantes
FROM core_documents 
WHERE status IN (
  'PENDENTE', 'PRE_BAIXA', 'AGUARDANDO_CONFERENCIA_CD', 'EM_CONFERENCIA_CD',
  'CONFERENCIA_CD_SEM_DIVERGENCIA', 'CONFERENCIA_CD_COM_DIVERGENCIA', 'EFETIVADO_CD',
  'PEDIDO_TRANSFERENCIA_CRIADO', 'MAPA_SEPARACAO_CRIADO', 'AGUARDANDO_SEPARACAO_CD',
  'EM_SEPARACAO_CD', 'SEPARACAO_CD_SEM_DIVERGENCIA', 'SEPARACAO_CD_COM_DIVERGENCIA',
  'SEPARADO_PRE_DOCA', 'EMBARCADO_CD', 'TRANSFERENCIA_CDH_FATURADA',
  'AGUARDANDO_CONFERENCIA_LOJA', 'EM_CONFERENCIA_LOJA', 'CONFERENCIA_LOJA_SEM_DIVERGENCIA',
  'CONFERENCIA_LOJA_COM_DIVERGENCIA', 'EFETIVADO_LOJA', 'VENDA_CONCLUIDA',
  'DEVOLUCAO_AGUARDANDO', 'DEVOLUCAO_CONCLUIDA', 'TRANSFERENCIA_ENRE_LOJAS', 'CANCELADA'
);

-- ============================================================================
-- LOGS E AUDITORIA
-- ============================================================================

-- Inserir logs de migração (se tabela de logs existir)
-- INSERT INTO migration_logs (migration_name, executed_at, description)
-- VALUES ('enum_standardization_phase1', NOW(), 'Padronização de ENUMs - Fase 1: ENUMs simples');

-- INSERT INTO migration_logs (migration_name, executed_at, description)
-- VALUES ('enum_standardization_phase2', NOW(), 'Padronização de ENUMs - Fase 2: doc_status_enum completo'); 