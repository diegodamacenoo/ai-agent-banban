-- SQL Migration Script: Rename display_name to name in module_implementations
-- Date: 2025-07-14
-- Description: This script corrects the column name inconsistency in the 'module_implementations' table
--              by renaming 'display_name' to 'name' and safely recreating dependent views.
--              This is the final fix for the 'column does not exist' error.

-- Fase 1: Remover as views dependentes
-- Dropping views that depend on the 'module_implementations' table to allow modifications.
DROP VIEW IF EXISTS v_tenant_module_assignments_full;
DROP VIEW IF EXISTS v_modules_with_implementations;
DROP VIEW IF EXISTS v_active_tenant_assignments;

-- Fase 2: Renomear a coluna
-- Renames the 'display_name' column to 'name', which is the standard expected by the application code.
ALTER TABLE public.module_implementations RENAME COLUMN display_name TO name;

-- Fase 3: Recriar as views com a coluna 'name'
-- The view definitions were already correct and using 'name', so we just need to recreate them
-- after the column has been renamed.

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
    mi.name AS implementation_name,
    mi.component_path,
    mi.component_type,
    mi.template_type,
    mi.audience,
    mi.complexity,
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
    mi.name AS implementation_name,
    mi.component_path,
    mi.component_type,
    mi.template_type,
    mi.audience,
    mi.complexity,
    mi.is_default AS is_default_implementation,
    (mi.status = 'active') AS implementation_active,
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
    mi.name AS implementation_name,
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
