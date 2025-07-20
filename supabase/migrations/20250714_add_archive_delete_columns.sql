-- Adicionar colunas archived_at e deleted_at à tabela base_modules
ALTER TABLE base_modules
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Remover a coluna status e adicionar archived_at e deleted_at à tabela module_implementations
-- Primeiro, remova quaisquer dependências ou restrições da coluna 'status' se existirem.
-- Exemplo: ALTER TABLE module_implementations DROP CONSTRAINT IF EXISTS module_implementations_status_check;
ALTER TABLE module_implementations
DROP COLUMN IF EXISTS status; -- Use IF EXISTS para evitar erro se a coluna já foi removida

ALTER TABLE module_implementations
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Remover a coluna status da tabela tenant_module_assignments
-- Primeiro, remova quaisquer dependências ou restrições da coluna 'status' se existirem.
-- Exemplo: ALTER TABLE tenant_module_assignments DROP CONSTRAINT IF EXISTS tenant_module_assignments_status_check;
ALTER TABLE tenant_module_assignments
DROP COLUMN IF EXISTS status; -- Use IF EXISTS para evitar erro se a coluna já foi removida

-- Opcional: Adicionar índices para as novas colunas para otimizar consultas
CREATE INDEX idx_base_modules_archived_at ON base_modules (archived_at);
CREATE INDEX idx_base_modules_deleted_at ON base_modules (deleted_at);
CREATE INDEX idx_module_implementations_archived_at ON module_implementations (archived_at);
CREATE INDEX idx_module_implementations_deleted_at ON module_implementations (deleted_at);
