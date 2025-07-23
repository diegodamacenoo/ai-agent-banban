-- Script para corrigir cadastro incorreto do módulo alerts
-- Execute este script no Supabase Dashboard ou via CLI

-- Verificar registros antes da correção
SELECT 
  mi.id,
  mi.implementation_key,
  mi.component_path,
  bm.slug as module_slug,
  bm.name as module_name
FROM module_implementations mi
JOIN base_modules bm ON mi.base_module_id = bm.id
WHERE bm.slug = 'alerts' AND mi.implementation_key LIKE 'standard%';

-- Corrigir o cadastro incorreto
UPDATE module_implementations 
SET 
  component_path = '/implementations/StandardAlertsImplementation',
  implementation_key = 'standard'
WHERE 
  implementation_key = 'standard-home' 
  AND component_path = '/standard'
  AND base_module_id = (SELECT id FROM base_modules WHERE slug = 'alerts');

-- Verificar após a correção
SELECT 
  mi.id,
  mi.implementation_key,
  mi.component_path,
  bm.slug as module_slug,
  bm.name as module_name
FROM module_implementations mi
JOIN base_modules bm ON mi.base_module_id = bm.id
WHERE bm.slug = 'alerts' AND mi.implementation_key LIKE 'standard%';