-- Migration: Criar tabelas para sistema de API Keys
-- Data: 2025-01-10
-- Descrição: Implementação da estratégia de autenticação híbrida com API Keys

-- Criar enum para tipos de permissões de API Keys
CREATE TYPE api_key_permission AS ENUM (
  'webhook:purchase',
  'webhook:inventory', 
  'webhook:sales',
  'webhook:transfer',
  'webhook:returns',
  'webhook:etl',
  'system:admin',
  'system:read',
  'system:write'
);

-- Tabela principal de API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  key_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash da API key
  prefix VARCHAR(15) NOT NULL, -- Primeiros caracteres para identificação (ak_xxxxxxxxxxxx...)
  permissions api_key_permission[] NOT NULL,
  expires_at TIMESTAMPTZ, -- NULL = sem expiração
  rate_limit INTEGER DEFAULT 1000, -- Requests por hora
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  usage_count BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT api_keys_rate_limit_positive CHECK (rate_limit > 0),
  CONSTRAINT api_keys_permissions_not_empty CHECK (array_length(permissions, 1) > 0),
  CONSTRAINT api_keys_name_length CHECK (char_length(name) >= 1)
);

-- Tabela de logs de uso das API Keys
CREATE TABLE IF NOT EXISTS api_key_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  response_status INTEGER NOT NULL,
  processing_time_ms INTEGER,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT api_key_usage_logs_status_valid CHECK (response_status >= 100 AND response_status < 600),
  CONSTRAINT api_key_usage_logs_processing_time_positive CHECK (processing_time_ms IS NULL OR processing_time_ms >= 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_api_keys_organization_id ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_keys_permissions ON api_keys USING GIN(permissions);

CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_api_key_id ON api_key_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_created_at ON api_key_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_organization_id ON api_key_usage_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_endpoint ON api_key_usage_logs(endpoint);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER api_keys_updated_at_trigger
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_keys_updated_at();

-- RLS (Row Level Security) para multi-tenancy
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage_logs ENABLE ROW LEVEL SECURITY;

-- Política RLS para api_keys - usuários só veem suas próprias organizações
CREATE POLICY api_keys_organization_policy ON api_keys
  FOR ALL
  USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Política RLS para api_key_usage_logs - usuários só veem logs de suas organizações  
CREATE POLICY api_key_usage_logs_organization_policy ON api_key_usage_logs
  FOR ALL
  USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Política especial para service role (bypass RLS para operações internas)
CREATE POLICY api_keys_service_role_policy ON api_keys
  FOR ALL
  TO service_role
  USING (true);

CREATE POLICY api_key_usage_logs_service_role_policy ON api_key_usage_logs
  FOR ALL  
  TO service_role
  USING (true);

-- Função para limpar logs antigos (manutenção)
CREATE OR REPLACE FUNCTION cleanup_old_api_key_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM api_key_usage_logs 
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE api_keys IS 'Tabela para armazenar API Keys para autenticação de serviços automatizados';
COMMENT ON COLUMN api_keys.key_hash IS 'Hash SHA-256 da API key para segurança - a chave real nunca é armazenada';
COMMENT ON COLUMN api_keys.prefix IS 'Primeiros caracteres da chave para identificação visual sem expor a chave completa';
COMMENT ON COLUMN api_keys.permissions IS 'Array de permissões granulares que esta API key possui';
COMMENT ON COLUMN api_keys.rate_limit IS 'Limite de requests por hora para esta API key';

COMMENT ON TABLE api_key_usage_logs IS 'Logs de uso das API Keys para auditoria e monitoramento';
COMMENT ON FUNCTION cleanup_old_api_key_logs IS 'Função para limpeza automática de logs antigos de API Keys';

-- Dados iniciais - API Key para sistema BanBan existente
-- NOTA: Será criada via API administrativa após deploy