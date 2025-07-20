-- ========================================
-- 🔧 FLUXO CONFIGURÁVEL - EXPANSÃO OTIMIZADA
-- ========================================
-- 
-- Objetivo: Expandir tabelas existentes para suportar fluxo configurável
-- sem criar novas tabelas desnecessárias
--
-- Decisão: Reutilizar estrutura existente + JSONB flexível
-- Resultado: 0 novas tabelas, apenas ALTERs otimizados
-- ========================================

-- ========================================
-- 📋 PRÉ-VERIFICAÇÃO DE SEGURANÇA
-- ========================================

-- Verificar se as tabelas principais existem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'base_modules' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Tabela base_modules não encontrada. Verifique o schema.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'module_implementations' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Tabela module_implementations não encontrada. Verifique o schema.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_module_assignments' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Tabela tenant_module_assignments não encontrada. Verifique o schema.';
    END IF;
    
    RAISE NOTICE 'Todas as tabelas necessárias existem. Prosseguindo com expansão...';
END $$;

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

-- Comentários explicativos
COMMENT ON COLUMN base_modules.icon IS 'Ícone do módulo (nome do ícone Lucide React)';
COMMENT ON COLUMN base_modules.route_pattern IS 'Padrão de rota do módulo (ex: /[slug]/(modules)/analytics)';
COMMENT ON COLUMN base_modules.permissions_required IS 'Array de permissões necessárias para o módulo';
COMMENT ON COLUMN base_modules.supports_multi_tenant IS 'Se o módulo suporta multi-tenancy';
COMMENT ON COLUMN base_modules.config_schema IS 'JSON Schema para validação de configurações do módulo';

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

-- Adicionar constraints para validação (usando DO $$ para evitar erros se já existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'module_implementations' 
                   AND constraint_name = 'chk_component_type') THEN
        ALTER TABLE module_implementations 
        ADD CONSTRAINT chk_component_type 
        CHECK (component_type IN ('file', 'generated'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'module_implementations' 
                   AND constraint_name = 'chk_template_type') THEN
        ALTER TABLE module_implementations 
        ADD CONSTRAINT chk_template_type 
        CHECK (template_type IS NULL OR template_type IN ('dashboard', 'table', 'chart', 'form', 'custom'));
    END IF;
END $$;

-- Comentários explicativos
COMMENT ON COLUMN module_implementations.component_type IS 'Tipo de componente: file (arquivo existente) ou generated (gerado por template)';
COMMENT ON COLUMN module_implementations.template_type IS 'Tipo de template usado para gerar o componente';
COMMENT ON COLUMN module_implementations.template_config IS 'Configuração específica do template (layout, cores, etc.)';
COMMENT ON COLUMN module_implementations.dependencies IS 'Array de UUIDs de outros módulos/implementações necessários';
COMMENT ON COLUMN module_implementations.config_schema_override IS 'Override do schema de configuração do módulo base';

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

-- Comentários explicativos
COMMENT ON COLUMN tenant_module_assignments.permissions_override IS 'Override de permissões específicas para este tenant';
COMMENT ON COLUMN tenant_module_assignments.user_groups IS 'Grupos de usuários que têm acesso ao módulo';
COMMENT ON COLUMN tenant_module_assignments.activation_date IS 'Data de ativação do módulo (pode ser agendada)';
COMMENT ON COLUMN tenant_module_assignments.deactivation_date IS 'Data de desativação automática (opcional)';
COMMENT ON COLUMN tenant_module_assignments.config_schema IS 'Schema de configuração específico para este assignment';

-- ========================================
-- 📊 ÍNDICES OTIMIZADOS
-- ========================================

-- Índices para melhorar performance das consultas mais comuns

-- base_modules: busca por categoria e status
CREATE INDEX IF NOT EXISTS idx_base_modules_category_active 
ON base_modules(category, is_active) WHERE is_active = true;

-- base_modules: busca por suporte multi-tenant
CREATE INDEX IF NOT EXISTS idx_base_modules_multi_tenant 
ON base_modules(supports_multi_tenant) WHERE supports_multi_tenant = true;

-- module_implementations: busca por tipo de componente
CREATE INDEX IF NOT EXISTS idx_module_implementations_component_type 
ON module_implementations(component_type, is_active) WHERE is_active = true;

-- module_implementations: busca por tipo de template
CREATE INDEX IF NOT EXISTS idx_module_implementations_template_type 
ON module_implementations(template_type) WHERE template_type IS NOT NULL;

-- module_implementations: busca por módulo base
CREATE INDEX IF NOT EXISTS idx_module_implementations_base_module 
ON module_implementations(base_module_id, is_active) WHERE is_active = true;

-- tenant_module_assignments: busca por tenant ativo
CREATE INDEX IF NOT EXISTS idx_tenant_assignments_active 
ON tenant_module_assignments(tenant_id, is_active) WHERE is_active = true;

-- tenant_module_assignments: busca por datas de ativação
CREATE INDEX IF NOT EXISTS idx_tenant_assignments_activation 
ON tenant_module_assignments(activation_date) WHERE activation_date IS NOT NULL;

-- ========================================
-- 🔍 VIEWS OTIMIZADAS
-- ========================================

-- View para facilitar consultas de módulos com implementações
DROP VIEW IF EXISTS v_modules_with_implementations CASCADE;
CREATE VIEW v_modules_with_implementations AS
SELECT 
    bm.id as module_id,
    bm.slug as module_slug,
    bm.name as module_name,
    bm.description as module_description,
    bm.category as module_category,
    bm.icon as module_icon,
    bm.route_pattern,
    bm.permissions_required,
    bm.supports_multi_tenant,
    bm.is_active as module_active,
    
    mi.id as implementation_id,
    mi.implementation_key,
    mi.name as implementation_name,
    mi.component_path,
    mi.component_type,
    mi.template_type,
    mi.target_audience,
    mi.complexity_tier,
    mi.is_default as is_default_implementation,
    mi.is_active as implementation_active,
    
    -- Contagem de assignments ativos
    (SELECT COUNT(*) 
     FROM tenant_module_assignments tma 
     WHERE tma.base_module_id = bm.id 
       AND tma.implementation_id = mi.id 
       AND tma.is_active = true) as active_assignments_count
       
FROM base_modules bm
LEFT JOIN module_implementations mi ON bm.id = mi.base_module_id
WHERE bm.is_active = true;

-- View para assignments ativos com informações completas
DROP VIEW IF EXISTS v_active_tenant_assignments CASCADE;
CREATE VIEW v_active_tenant_assignments AS
SELECT 
    tma.tenant_id,
    tma.base_module_id,
    tma.implementation_id,
    tma.custom_config,
    tma.permissions_override,
    tma.user_groups,
    tma.activation_date,
    tma.deactivation_date,
    tma.assigned_at,
    tma.updated_at,
    
    -- Informações do módulo
    bm.slug as module_slug,
    bm.name as module_name,
    bm.category as module_category,
    bm.icon as module_icon,
    bm.route_pattern,
    
    -- Informações da implementação
    mi.implementation_key,
    mi.name as implementation_name,
    mi.component_path,
    mi.component_type,
    mi.template_type,
    mi.target_audience,
    mi.complexity_tier,
    
    -- Informações da organização
    o.slug as tenant_slug,
    o.company_trading_name as tenant_name
    
FROM tenant_module_assignments tma
JOIN base_modules bm ON tma.base_module_id = bm.id
LEFT JOIN module_implementations mi ON tma.implementation_id = mi.id
JOIN organizations o ON tma.tenant_id = o.id
WHERE tma.is_active = true
  AND bm.is_active = true
  AND (mi.is_active = true OR mi.id IS NULL)
  AND (tma.activation_date IS NULL OR tma.activation_date <= NOW())
  AND (tma.deactivation_date IS NULL OR tma.deactivation_date > NOW());

-- ========================================
-- 📝 FUNÇÕES AUXILIARES
-- ========================================

-- Função para validar JSON Schema
CREATE OR REPLACE FUNCTION validate_json_schema(schema_json JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validação básica de schema JSON
    -- Verifica se tem estrutura mínima de um JSON Schema
    IF schema_json ? 'type' OR schema_json ? 'properties' OR schema_json ? '$schema' THEN
        RETURN true;
    END IF;
    
    -- Se está vazio ou é um objeto simples, aceita também
    IF jsonb_typeof(schema_json) = 'object' THEN
        RETURN true;
    END IF;
    
    RETURN false;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar slug a partir do nome
CREATE OR REPLACE FUNCTION generate_slug(input_name TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Verificar se a extensão unaccent está disponível
    BEGIN
        RETURN lower(
            regexp_replace(
                regexp_replace(
                    regexp_replace(
                        unaccent(trim(input_name)),
                        '[^a-zA-Z0-9\s-]', '', 'g'
                    ),
                    '\s+', '-', 'g'
                ),
                '-+', '-', 'g'
            )
        );
    EXCEPTION
        WHEN OTHERS THEN
            -- Fallback se unaccent não estiver disponível
            RETURN lower(
                regexp_replace(
                    regexp_replace(
                        regexp_replace(
                            trim(input_name),
                            '[^a-zA-Z0-9\s-]', '', 'g'
                        ),
                        '\s+', '-', 'g'
                    ),
                    '-+', '-', 'g'
                )
            );
    END;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- ✅ VALIDAÇÃO FINAL
-- ========================================

-- Verificar se todas as colunas foram adicionadas corretamente
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Verificar base_modules
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'base_modules' AND column_name = 'icon' AND table_schema = 'public') THEN
        missing_columns := array_append(missing_columns, 'base_modules.icon');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'base_modules' AND column_name = 'config_schema' AND table_schema = 'public') THEN
        missing_columns := array_append(missing_columns, 'base_modules.config_schema');
    END IF;
    
    -- Verificar module_implementations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'module_implementations' AND column_name = 'component_type' AND table_schema = 'public') THEN
        missing_columns := array_append(missing_columns, 'module_implementations.component_type');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'module_implementations' AND column_name = 'template_config' AND table_schema = 'public') THEN
        missing_columns := array_append(missing_columns, 'module_implementations.template_config');
    END IF;
    
    -- Verificar tenant_module_assignments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_module_assignments' AND column_name = 'permissions_override' AND table_schema = 'public') THEN
        missing_columns := array_append(missing_columns, 'tenant_module_assignments.permissions_override');
    END IF;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE EXCEPTION 'Colunas não foram criadas: %', array_to_string(missing_columns, ', ');
    END IF;
    
    RAISE NOTICE 'Todas as expansões foram aplicadas com sucesso!';
    RAISE NOTICE 'Sistema preparado para fluxo configurável otimizado.';
    RAISE NOTICE 'Total de novas tabelas criadas: 0 (reutilização da estrutura existente)';
    RAISE NOTICE 'Views criadas: v_modules_with_implementations, v_active_tenant_assignments';
    RAISE NOTICE 'Funções auxiliares: validate_json_schema(), generate_slug()';
END $$;

-- ========================================
-- 📊 RELATÓRIO DE ALTERAÇÕES
-- ========================================

-- Gerar relatório das alterações aplicadas
SELECT 
    'EXPANSÃO CONCLUÍDA' as status,
    'base_modules' as tabela,
    array_length(array['icon', 'route_pattern', 'permissions_required', 'supports_multi_tenant', 'config_schema'], 1) as colunas_adicionadas
UNION ALL
SELECT 
    'EXPANSÃO CONCLUÍDA' as status,
    'module_implementations' as tabela,
    array_length(array['component_type', 'template_type', 'template_config', 'dependencies', 'config_schema_override'], 1) as colunas_adicionadas
UNION ALL
SELECT 
    'EXPANSÃO CONCLUÍDA' as status,
    'tenant_module_assignments' as tabela,
    array_length(array['permissions_override', 'user_groups', 'activation_date', 'deactivation_date', 'config_schema'], 1) as colunas_adicionadas;