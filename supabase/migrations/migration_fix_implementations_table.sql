-- SQL Migration Script: Fix module_implementations table
-- Date: 2025-07-14
-- Description: This script aligns the 'module_implementations' table with the application schema,
--              addressing the 'column does not exist' error. It adds new columns, populates them,
--              removes obsolete ones, and safely recreates dependent views.

-- Fase 1: Remover as views dependentes
-- Dropping views that depend on the 'module_implementations' table to allow modifications.
DROP VIEW IF EXISTS v_tenant_module_assignments_full;
DROP VIEW IF EXISTS v_modules_with_implementations;
DROP VIEW IF EXISTS v_active_tenant_assignments;

-- Fase 2: Alterar a tabela module_implementations
-- Adicionar novas colunas que estão faltando de acordo com o schema da aplicação.
ALTER TABLE public.module_implementations ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE public.module_implementations ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.module_implementations ADD COLUMN IF NOT EXISTS version VARCHAR(20) DEFAULT '1.0.0';
ALTER TABLE public.module_implementations ADD COLUMN IF NOT EXISTS component_type VARCHAR(50) DEFAULT 'file';
ALTER TABLE public.module_implementations ADD COLUMN IF NOT EXISTS audience VARCHAR(50) DEFAULT 'generic';
ALTER TABLE public.module_implementations ADD COLUMN IF NOT EXISTS complexity VARCHAR(50) DEFAULT 'standard';
ALTER TABLE public.module_implementations ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'medium';
ALTER TABLE public.module_implementations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE public.module_implementations ADD COLUMN IF NOT EXISTS template_type VARCHAR(255);
ALTER TABLE public.module_implementations ADD COLUMN IF NOT EXISTS template_config JSONB;
ALTER TABLE public.module_implementations ADD COLUMN IF NOT EXISTS dependencies JSONB;
ALTER TABLE public.module_implementations ADD COLUMN IF NOT EXISTS config_schema_override JSONB;
ALTER TABLE public.module_implementations ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.module_implementations ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.module_implementations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Popular novas colunas com dados das antigas para preservar a informação.
-- Usamos COALESCE para garantir que não haja valores nulos se a coluna de origem não existir.
UPDATE public.module_implementations SET name = COALESCE(display_name, name);
UPDATE public.module_implementations SET audience = COALESCE(target_audience, audience);
UPDATE public.module_implementations SET complexity = COALESCE(complexity_tier, complexity);

-- Remover colunas antigas que não são mais utilizadas pelo schema da aplicação.
ALTER TABLE public.module_implementations DROP COLUMN IF EXISTS display_name;
ALTER TABLE public.module_implementations DROP COLUMN IF EXISTS target_audience;
ALTER TABLE public.module_implementations DROP COLUMN IF EXISTS complexity_tier;

-- Fase 3: Recriar as views com a nova estrutura de colunas
-- Recriando as views com as colunas atualizadas para refletir a nova estrutura da tabela.

CREATE OR REPLACE VIEW v_active_tenant_assignments AS
 SELECT tma.tenant_id,
    tma.base_module_id,
    tma.implementation_id,
    tma.custom_config,
    tma.permissions_override,
    tma.user_groups,
    tma.activation_date,
    tma.deactivation_date,
    tma.assigned_at,
    tma.updated_at,
    bm.slug AS module_slug,
    bm.name AS module_name,
    bm.category AS module_category,
    bm.icon AS module_icon,
    bm.route_pattern,
    mi.implementation_key,
    mi.name AS implementation_name, -- MODIFICADO
    mi.component_path,
    mi.component_type,
    mi.template_type,
    mi.audience, -- MODIFICADO
    mi.complexity, -- MODIFICADO
    o.slug AS tenant_slug,
    o.company_trading_name AS tenant_name
   FROM (((tenant_module_assignments tma
     JOIN base_modules bm ON ((tma.base_module_id = bm.id)))
     LEFT JOIN module_implementations mi ON ((tma.implementation_id = mi.id)))
     JOIN organizations o ON ((tma.tenant_id = o.id)))
  WHERE ((tma.is_active = true) AND (bm.is_active = true) AND (mi.status = 'active') AND ((tma.activation_date IS NULL) OR (tma.activation_date <= now())) AND ((tma.deactivation_date IS NULL) OR (tma.deactivation_date > now())));

CREATE OR REPLACE VIEW v_modules_with_implementations AS
 SELECT bm.id AS module_id,
    bm.slug AS module_slug,
    bm.name AS module_name,
    bm.description AS module_description,
    bm.category AS module_category,
    bm.icon AS module_icon,
    bm.route_pattern,
    bm.permissions_required,
    bm.supports_multi_tenant,
    bm.is_active AS module_active,
    mi.id AS implementation_id,
    mi.implementation_key,
    mi.name AS implementation_name, -- MODIFICADO
    mi.component_path,
    mi.component_type,
    mi.template_type,
    mi.audience, -- MODIFICADO
    mi.complexity, -- MODIFICADO
    mi.is_default AS is_default_implementation,
    (mi.status = 'active') AS implementation_active, -- MODIFICADO
    ( SELECT count(*) AS count
           FROM tenant_module_assignments tma
          WHERE ((tma.base_module_id = bm.id) AND (tma.implementation_id = mi.id) AND (tma.is_active = true))) AS active_assignments_count
   FROM (base_modules bm
     LEFT JOIN module_implementations mi ON ((bm.id = mi.base_module_id)))
  WHERE (bm.is_active = true);

CREATE OR REPLACE VIEW v_tenant_module_assignments_full AS
 SELECT tma.tenant_id,
    COALESCE(org.company_trading_name, org.company_legal_name) AS organization_name,
    org.slug AS organization_slug,
    bm.slug AS module_slug,
    bm.name AS module_name,
    bm.category AS module_category,
    mi.implementation_key,
    mi.name AS implementation_name, -- MODIFICADO
    mi.component_path,
    tma.is_active AS assignment_active,
    tma.custom_config,
    tma.assigned_at,
    tma.updated_at
   FROM (((tenant_module_assignments tma
     JOIN organizations org ON ((tma.tenant_id = org.id)))
     JOIN base_modules bm ON ((tma.base_module_id = bm.id)))
     LEFT JOIN module_implementations mi ON ((tma.implementation_id = mi.id)))
  WHERE (tma.is_active = true)
  ORDER BY COALESCE(org.company_trading_name, org.company_legal_name), bm.category, bm.slug;

-- Fim do script
