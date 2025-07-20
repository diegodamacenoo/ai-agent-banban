-- ========================================
-- 🔧 EXPANSÃO OTIMIZADA - VERSÃO SIMPLIFICADA
-- ========================================
-- 
-- Script simplificado para expandir tabelas existentes
-- sem criar novas tabelas desnecessárias
-- ========================================

-- ========================================
-- 🏗️ EXPANSÃO: base_modules
-- ========================================

-- Adicionar campos para configuração avançada de módulos
ALTER TABLE base_modules 
ADD COLUMN IF NOT EXISTS icon VARCHAR(50),
ADD COLUMN IF NOT EXISTS route_pattern VARCHAR(255),
ADD COLUMN IF NOT EXISTS permissions_required TEXT[],
ADD COLUMN IF NOT EXISTS supports_multi_tenant BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS config_schema JSONB DEFAULT '{}'::jsonb;

-- ========================================
-- 🔧 EXPANSÃO: module_implementations
-- ========================================

-- Adicionar campos para templates e configurações avançadas
ALTER TABLE module_implementations 
ADD COLUMN IF NOT EXISTS component_type VARCHAR(20) DEFAULT 'file',
ADD COLUMN IF NOT EXISTS template_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS template_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dependencies UUID[],
ADD COLUMN IF NOT EXISTS config_schema_override JSONB;

-- ========================================
-- 👥 EXPANSÃO: tenant_module_assignments
-- ========================================

-- Adicionar campos para controle granular de assignments
ALTER TABLE tenant_module_assignments 
ADD COLUMN IF NOT EXISTS permissions_override TEXT[],
ADD COLUMN IF NOT EXISTS user_groups TEXT[],
ADD COLUMN IF NOT EXISTS activation_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS deactivation_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS config_schema JSONB;

-- ========================================
-- 📊 VERIFICAÇÃO SIMPLES
-- ========================================

-- Verificar se as colunas foram adicionadas
SELECT 
    'base_modules' as tabela,
    COUNT(*) FILTER (WHERE column_name IN ('icon', 'route_pattern', 'permissions_required', 'supports_multi_tenant', 'config_schema')) as colunas_adicionadas,
    5 as colunas_esperadas
FROM information_schema.columns 
WHERE table_name = 'base_modules' AND table_schema = 'public'

UNION ALL

SELECT 
    'module_implementations' as tabela,
    COUNT(*) FILTER (WHERE column_name IN ('component_type', 'template_type', 'template_config', 'dependencies', 'config_schema_override')) as colunas_adicionadas,
    5 as colunas_esperadas
FROM information_schema.columns 
WHERE table_name = 'module_implementations' AND table_schema = 'public'

UNION ALL

SELECT 
    'tenant_module_assignments' as tabela,
    COUNT(*) FILTER (WHERE column_name IN ('permissions_override', 'user_groups', 'activation_date', 'deactivation_date', 'config_schema')) as colunas_adicionadas,
    5 as colunas_esperadas
FROM information_schema.columns 
WHERE table_name = 'tenant_module_assignments' AND table_schema = 'public';

-- ========================================
-- 🎯 CONCLUSÃO
-- ========================================

SELECT 'Expansão concluída! Verifique se colunas_adicionadas = colunas_esperadas acima.' as resultado;