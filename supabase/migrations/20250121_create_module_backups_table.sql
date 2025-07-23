-- Create module_backups table
-- Armazena backups das implementações de módulos com dados completos

CREATE TABLE IF NOT EXISTS module_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    implementation_id UUID NOT NULL REFERENCES module_implementations(id) ON DELETE CASCADE,
    backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'config_only')),
    backup_data JSONB NOT NULL,
    file_path TEXT,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_module_backups_implementation_id ON module_backups(implementation_id);
CREATE INDEX IF NOT EXISTS idx_module_backups_created_at ON module_backups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_module_backups_expires_at ON module_backups(expires_at);
CREATE INDEX IF NOT EXISTS idx_module_backups_backup_type ON module_backups(backup_type);
CREATE INDEX IF NOT EXISTS idx_module_backups_created_by ON module_backups(created_by);

-- RLS Policies
ALTER TABLE module_backups ENABLE ROW LEVEL SECURITY;

-- Apenas usuários autenticados podem ver backups
CREATE POLICY "Users can view module backups" ON module_backups
    FOR SELECT USING (auth.role() = 'authenticated');

-- Apenas admins podem criar backups
CREATE POLICY "Admins can create module backups" ON module_backups
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Apenas admins podem atualizar backups
CREATE POLICY "Admins can update module backups" ON module_backups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Apenas admins podem excluir backups
CREATE POLICY "Admins can delete module backups" ON module_backups
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Comentários para documentação
COMMENT ON TABLE module_backups IS 'Armazena backups das implementações de módulos com dados completos e metadados';
COMMENT ON COLUMN module_backups.backup_type IS 'Tipo do backup: full (completo), incremental (apenas mudanças), config_only (apenas configurações)';
COMMENT ON COLUMN module_backups.backup_data IS 'Dados do backup em formato JSON - contém implementação, configurações e assignments conforme o tipo';
COMMENT ON COLUMN module_backups.file_path IS 'Caminho do arquivo de backup se armazenado externamente (futuro)';
COMMENT ON COLUMN module_backups.size_bytes IS 'Tamanho do backup em bytes';
COMMENT ON COLUMN module_backups.expires_at IS 'Data de expiração do backup baseada na política de retenção';
COMMENT ON COLUMN module_backups.metadata IS 'Metadados do backup: versão, descrição, compressão, criptografia, etc.';