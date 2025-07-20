-- ========================================
-- FASE 2: CRIAÇÃO DA NOVA ESTRUTURA DE BANCO
-- Data: 2025-07-12 (Atualizado)
-- Objetivo: Renomear tabelas legadas e criar a nova estrutura modular (base_modules, module_implementations, tenant_module_assignments)
-- ========================================

-- Registrar início da Fase 2
INSERT INTO migration_log (migration_step, status, notes) 
VALUES ('PHASE2_START', 'STARTED', 'Iniciando criação da nova estrutura de banco de dados');

-- ========================================
-- 0. RENOMEAR TABELAS LEGADAS
-- Objetivo: Preservar dados para migração na Fase 3 e evitar conflitos.
-- ========================================

-- Renomear core_modules para preservar a estrutura e dados antigos
ALTER TABLE core_modules RENAME TO legacy_core_modules;

-- Renomear module_implementations, que já existe e será substituída
ALTER TABLE module_implementations RENAME TO legacy_module_implementations;

-- Renomear tenant_modules para preservar dados de assignments
ALTER TABLE tenant_modules RENAME TO legacy_tenant_modules;

INSERT INTO migration_log (migration_step, status, notes) 
VALUES ('PHASE2_RENAME_TABLES', 'SUCCESS', 'Tabelas legadas (core_modules, module_implementations, tenant_modules) renomeadas para legacy_*');


-- ========================================
-- 1. CRIAR TABELA base_modules
-- ========================================

CREATE TABLE base_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  -- Constraints e validações
  CONSTRAINT base_modules_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  -- Categoria atualizada para incluir valores legados e novos, garantindo compatibilidade com a migração.
  CONSTRAINT base_modules_category_valid CHECK (category IN ('analytics', 'operations', 'monitoring', 'intelligence', 'insights', 'reports', 'settings', 'admin'))
);

-- Índices para performance
CREATE INDEX idx_base_modules_slug ON base_modules(slug);
CREATE INDEX idx_base_modules_category ON base_modules(category);
CREATE INDEX idx_base_modules_active ON base_modules(is_active);

-- ========================================
-- 2. CRIAR TABELA module_implementations
-- ========================================

CREATE TABLE module_implementations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_module_id UUID REFERENCES base_modules(id) ON DELETE CASCADE,
  implementation_key VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  component_path VARCHAR(255) NOT NULL,
  target_audience VARCHAR(50) DEFAULT 'generic',
  complexity_tier VARCHAR(50) DEFAULT 'standard',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  -- Constraints e validações
  CONSTRAINT module_impl_unique_per_base UNIQUE(base_module_id, implementation_key),
  CONSTRAINT module_impl_key_format CHECK (implementation_key ~ '^[a-z0-9-]+$'),
  CONSTRAINT module_impl_audience_valid CHECK (target_audience IN ('generic', 'client-specific', 'enterprise')),
  CONSTRAINT module_impl_tier_valid CHECK (complexity_tier IN ('basic', 'standard', 'advanced', 'enterprise'))
);

-- Índices para performance
CREATE INDEX idx_module_impl_base_module ON module_implementations(base_module_id);
CREATE INDEX idx_module_impl_key ON module_implementations(implementation_key);
CREATE INDEX idx_module_impl_default ON module_implementations(is_default);
CREATE INDEX idx_module_impl_active ON module_implementations(is_active);

-- ========================================
-- 3. CRIAR TABELA tenant_module_assignments
-- ========================================

CREATE TABLE tenant_module_assignments (
  tenant_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  base_module_id UUID REFERENCES base_modules(id) ON DELETE CASCADE,
  implementation_id UUID REFERENCES module_implementations(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  custom_config JSONB DEFAULT '{}',
  assigned_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  -- Chave primária composta
  PRIMARY KEY (tenant_id, base_module_id),
  
  -- Constraints e validações
  CONSTRAINT tenant_assignment_valid_config CHECK (jsonb_typeof(custom_config) = 'object')
);

-- Índices para performance
CREATE INDEX idx_tenant_assign_tenant ON tenant_module_assignments(tenant_id);
CREATE INDEX idx_tenant_assign_module ON tenant_module_assignments(base_module_id);
CREATE INDEX idx_tenant_assign_impl ON tenant_module_assignments(implementation_id);
CREATE INDEX idx_tenant_assign_active ON tenant_module_assignments(is_active);

-- ========================================
-- 4. TRIGGER PARA updated_at AUTOMÁTICO
-- ========================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para todas as tabelas
CREATE TRIGGER update_base_modules_updated_at 
    BEFORE UPDATE ON base_modules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_implementations_updated_at 
    BEFORE UPDATE ON module_implementations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_module_assignments_updated_at 
    BEFORE UPDATE ON tenant_module_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 5. VIEWS PARA CONSULTAS SIMPLIFICADAS
-- ========================================

-- View para listar todos os módulos com suas implementações
CREATE VIEW v_modules_with_implementations AS
SELECT 
    bm.id as base_module_id,
    bm.slug as module_slug,
    bm.name as module_name,
    bm.category as module_category,
    bm.description as module_description,
    mi.id as implementation_id,
    mi.implementation_key,
    mi.display_name as implementation_name,
    mi.component_path,
    mi.target_audience,
    mi.complexity_tier,
    mi.is_default as is_default_implementation,
    mi.is_active as implementation_active
FROM base_modules bm
LEFT JOIN module_implementations mi ON bm.id = mi.base_module_id
WHERE bm.is_active = true
ORDER BY bm.category, bm.slug, mi.is_default DESC, mi.implementation_key;

-- View para assignments completos
CREATE VIEW v_tenant_module_assignments_full AS
SELECT 
    tma.tenant_id,
    COALESCE(org.company_trading_name, org.company_legal_name) as organization_name,
    org.slug as organization_slug,
    bm.slug as module_slug,
    bm.name as module_name,
    bm.category as module_category,
    mi.implementation_key,
    mi.display_name as implementation_name,
    mi.component_path,
    tma.is_active as assignment_active,
    tma.custom_config,
    tma.assigned_at,
    tma.updated_at
FROM tenant_module_assignments tma
JOIN organizations org ON tma.tenant_id = org.id
JOIN base_modules bm ON tma.base_module_id = bm.id
LEFT JOIN module_implementations mi ON tma.implementation_id = mi.id
WHERE tma.is_active = true
ORDER BY organization_name, bm.category, bm.slug;

-- ========================================
-- 6. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ========================================

-- Habilitar RLS nas tabelas
ALTER TABLE base_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_implementations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_module_assignments ENABLE ROW LEVEL SECURITY;

-- Política para base_modules (público para leitura, admin para escrita)
CREATE POLICY "base_modules_select_policy" ON base_modules
    FOR SELECT USING (true);

CREATE POLICY "base_modules_admin_policy" ON base_modules
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'role' = 'system'
    );

-- Política para module_implementations (público para leitura, admin para escrita)
CREATE POLICY "module_implementations_select_policy" ON module_implementations
    FOR SELECT USING (is_active = true);

CREATE POLICY "module_implementations_admin_policy" ON module_implementations
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'role' = 'system'
    );

-- Política para tenant_module_assignments (somente própria organização)
CREATE POLICY "tenant_assignments_select_policy" ON tenant_module_assignments
    FOR SELECT USING (
        tenant_id::text = auth.jwt() ->> 'organization_id' OR
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "tenant_assignments_modify_policy" ON tenant_module_assignments
    FOR ALL USING (
        tenant_id::text = auth.jwt() ->> 'organization_id' OR
        auth.jwt() ->> 'role' = 'admin'
    );

-- ========================================
-- 7. FUNÇÕES HELPER
-- ========================================

-- Função para obter implementação ativa de um tenant
CREATE OR REPLACE FUNCTION get_tenant_module_implementation(
    p_tenant_id UUID,
    p_module_slug VARCHAR
) RETURNS TABLE (
    implementation_id UUID,
    implementation_key VARCHAR,
    component_path VARCHAR,
    custom_config JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mi.id,
        mi.implementation_key,
        mi.component_path,
        tma.custom_config
    FROM tenant_module_assignments tma
    JOIN base_modules bm ON tma.base_module_id = bm.id
    LEFT JOIN module_implementations mi ON tma.implementation_id = mi.id
    WHERE tma.tenant_id = p_tenant_id 
      AND bm.slug = p_module_slug
      AND tma.is_active = true
      AND bm.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter implementação padrão se não houver assignment
CREATE OR REPLACE FUNCTION get_default_module_implementation(
    p_module_slug VARCHAR
) RETURNS TABLE (
    implementation_id UUID,
    implementation_key VARCHAR,
    component_path VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mi.id,
        mi.implementation_key,
        mi.component_path
    FROM base_modules bm
    JOIN module_implementations mi ON bm.id = mi.base_module_id
    WHERE bm.slug = p_module_slug
      AND mi.is_default = true
      AND mi.is_active = true
      AND bm.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 8. VALIDAÇÕES FINAIS
-- ========================================

-- Verificar se as tabelas foram criadas
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_name IN ('base_modules', 'module_implementations', 'tenant_module_assignments')
      AND table_schema = current_schema();
    
    IF table_count = 3 THEN
        INSERT INTO migration_log (migration_step, status, notes)
        VALUES ('PHASE2_TABLES_CREATED', 'SUCCESS', 'Todas as 3 tabelas da nova estrutura foram criadas com sucesso');
    ELSE
        INSERT INTO migration_log (migration_step, status, notes)
        VALUES ('PHASE2_TABLES_CREATED', 'ERROR', 'Erro: Nem todas as tabelas foram criadas. Encontradas: ' || table_count || '/3');
        RAISE EXCEPTION 'Erro na criação das tabelas da nova estrutura';
    END IF;
END $$;

-- Registrar conclusão da Fase 2
INSERT INTO migration_log (migration_step, status, notes) 
VALUES ('PHASE2_COMPLETE', 'SUCCESS', 'Nova estrutura de banco criada com sucesso: base_modules, module_implementations, tenant_module_assignments, views, políticas RLS e funções helper');

-- ========================================
-- RESUMO DO QUE FOI FEITO
-- ========================================

/*
TABELAS RENOMEADAS:
✅ core_modules -> legacy_core_modules
✅ module_implementations -> legacy_module_implementations
✅ tenant_modules -> legacy_tenant_modules

TABELAS CRIADAS:
✅ base_modules - Módulos base do sistema (nova estrutura)
✅ module_implementations - Implementações específicas dos módulos (nova estrutura)
✅ tenant_module_assignments - Atribuições de módulos por tenant (nova estrutura)

RECURSOS ADICIONAIS:
✅ Índices otimizados para performance
✅ Constraints para validação de dados (com categorias ajustadas)
✅ Triggers para updated_at automático
✅ Views para consultas simplificadas
✅ Políticas RLS para segurança
✅ Funções helper para consultas comuns
✅ Log de migração para auditoria

PRÓXIMO PASSO:
🔄 Executar Fase 3 - Migração de dados das tabelas legadas para as novas
*/
