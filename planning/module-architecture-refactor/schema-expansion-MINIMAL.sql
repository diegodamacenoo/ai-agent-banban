-- ========================================
-- 🔧 EXPANSÃO MINIMAL - APENAS COLUNAS
-- ========================================
-- 
-- Script minimal: apenas adiciona as colunas necessárias
-- sem views, funções ou validações complexas
-- ========================================

-- Adicionar campos em base_modules
ALTER TABLE base_modules 
ADD COLUMN IF NOT EXISTS icon VARCHAR(50),
ADD COLUMN IF NOT EXISTS route_pattern VARCHAR(255),
ADD COLUMN IF NOT EXISTS permissions_required TEXT[],
ADD COLUMN IF NOT EXISTS supports_multi_tenant BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS config_schema JSONB DEFAULT '{}'::jsonb;

-- Adicionar campos em module_implementations
ALTER TABLE module_implementations 
ADD COLUMN IF NOT EXISTS component_type VARCHAR(20) DEFAULT 'file',
ADD COLUMN IF NOT EXISTS template_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS template_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dependencies UUID[],
ADD COLUMN IF NOT EXISTS config_schema_override JSONB;

-- Adicionar campos em tenant_module_assignments
ALTER TABLE tenant_module_assignments 
ADD COLUMN IF NOT EXISTS permissions_override TEXT[],
ADD COLUMN IF NOT EXISTS user_groups TEXT[],
ADD COLUMN IF NOT EXISTS activation_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS deactivation_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS config_schema JSONB;

-- Verificação rápida
SELECT 'Migração concluída! Execute o validation-queries.sql para verificar.' as resultado;