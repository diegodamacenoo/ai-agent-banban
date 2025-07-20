-- ========================================
-- BACKUP DE SEGURANÇA PARA MIGRAÇÃO DE MÓDULOS
-- Data: 2025-07-11
-- Objetivo: Backup das tabelas críticas antes da migração
-- ========================================

-- Criar backups das tabelas críticas
CREATE TABLE _migration_backup_core_modules AS SELECT * FROM core_modules;
CREATE TABLE _migration_backup_module_implementations AS SELECT * FROM module_implementations;
CREATE TABLE _migration_backup_tenant_modules AS SELECT * FROM tenant_modules;

-- Verificar se os backups foram criados corretamente
SELECT 
  'core_modules' as tabela,
  COUNT(*) as registros_backup,
  (SELECT COUNT(*) FROM core_modules) as registros_original
FROM _migration_backup_core_modules
UNION ALL
SELECT 
  'module_implementations' as tabela,
  COUNT(*) as registros_backup,
  (SELECT COUNT(*) FROM module_implementations) as registros_original
FROM _migration_backup_module_implementations
UNION ALL
SELECT 
  'tenant_modules' as tabela,
  COUNT(*) as registros_backup,
  (SELECT COUNT(*) FROM tenant_modules) as registros_original
FROM _migration_backup_tenant_modules;

-- Criar índices nos backups para consultas rápidas
CREATE INDEX idx_backup_core_modules_slug ON _migration_backup_core_modules(slug);
CREATE INDEX idx_backup_core_modules_id ON _migration_backup_core_modules(id);
CREATE INDEX idx_backup_module_impl_module_id ON _migration_backup_module_implementations(module_id);
CREATE INDEX idx_backup_tenant_modules_org_id ON _migration_backup_tenant_modules(organization_id);
CREATE INDEX idx_backup_tenant_modules_module_id ON _migration_backup_tenant_modules(module_id);

-- Registrar o backup na tabela de migração (criar se não existir)
CREATE TABLE IF NOT EXISTS migration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_step VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  executed_at TIMESTAMP DEFAULT now(),
  notes TEXT
);

INSERT INTO migration_log (migration_step, status, notes) 
VALUES ('BACKUP_CRITICAL_TABLES', 'COMPLETED', 'Backup de segurança das tabelas core_modules, module_implementations e tenant_modules criado com sucesso');