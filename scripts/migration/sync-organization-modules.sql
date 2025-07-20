-- ================================================
-- SINCRONIZAÇÃO DE ORGANIZATION_MODULES
-- ================================================
-- Sincroniza dados de implementation_config para a tabela organization_modules
-- Permite rastreamento detalhado do ciclo de vida dos módulos

-- 1. Verificar estado atual
SELECT 
  'Estado Atual:' as status,
  COUNT(*) as total_orgs,
  COUNT(implementation_config) as orgs_with_config
FROM organizations;

SELECT 
  'Módulos Registrados:' as status,
  COUNT(*) as total_modules
FROM organization_modules;

-- 2. Função para sincronizar modules de uma organização
CREATE OR REPLACE FUNCTION sync_organization_modules(org_id UUID)
RETURNS VOID AS $$
DECLARE
  org_record RECORD;
  module_id TEXT;
  module_name TEXT;
  module_type TEXT;
BEGIN
  -- Buscar organização
  SELECT * INTO org_record 
  FROM organizations 
  WHERE id = org_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organização não encontrada: %', org_id;
  END IF;
  
  -- Processar subscribed_modules
  IF org_record.implementation_config ? 'subscribed_modules' THEN
    FOR module_id IN 
      SELECT jsonb_array_elements_text(org_record.implementation_config->'subscribed_modules')
    LOOP
      -- Determinar nome e tipo do módulo
      CASE 
        WHEN module_id LIKE 'banban-%' THEN
          module_name := CASE module_id
            WHEN 'banban-insights' THEN 'Insights Avançados'
            WHEN 'banban-performance' THEN 'Performance'
            WHEN 'banban-alerts' THEN 'Sistema de Alertas'
            WHEN 'banban-inventory' THEN 'Gestão de Estoque'
            WHEN 'banban-data-processing' THEN 'Processamento de Dados'
            ELSE INITCAP(REPLACE(REPLACE(module_id, 'banban-', ''), '-', ' '))
          END;
          module_type := 'custom';
        ELSE
          module_name := INITCAP(REPLACE(module_id, '-', ' '));
          module_type := 'standard';
      END CASE;
      
      -- Inserir ou atualizar módulo
      INSERT INTO organization_modules (
        organization_id,
        module_id,
        module_name,
        module_type,
        status,
        configuration,
        expected_features,
        implementation_notes,
        priority,
        implemented_at,
        activated_at
      ) VALUES (
        org_id,
        module_id,
        module_name,
        module_type,
        'active', -- Assumir que módulos em subscribed_modules estão ativos
        COALESCE(org_record.implementation_config->'configuration'->module_id, '{}'),
        COALESCE(
          ARRAY(SELECT jsonb_array_elements_text(org_record.implementation_config->'features')), 
          '{}'
        ),
        CASE 
          WHEN org_record.client_type = 'custom' THEN 
            'Módulo customizado sincronizado automaticamente'
          ELSE 
            'Módulo padrão sincronizado automaticamente'
        END,
        CASE 
          WHEN module_id LIKE '%alerts%' THEN 'high'
          WHEN module_id LIKE '%performance%' OR module_id LIKE '%insights%' THEN 'medium'
          ELSE 'low'
        END,
        CASE 
          WHEN org_record.is_implementation_complete THEN NOW()
          ELSE NULL
        END,
        CASE 
          WHEN org_record.is_implementation_complete THEN NOW()
          ELSE NULL
        END
      )
      ON CONFLICT (organization_id, module_id) 
      DO UPDATE SET
        module_name = EXCLUDED.module_name,
        module_type = EXCLUDED.module_type,
        status = CASE 
          WHEN organization_modules.status = 'planned' THEN 'active'
          ELSE organization_modules.status
        END,
        updated_at = NOW();
        
      RAISE NOTICE 'Sincronizado módulo: % para organização %', module_id, org_record.company_trading_name;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Sincronizar todas as organizações com implementation_config
DO $$
DECLARE
  org_record RECORD;
  total_synced INTEGER := 0;
BEGIN
  FOR org_record IN 
    SELECT id, company_trading_name, implementation_config
    FROM organizations 
    WHERE implementation_config IS NOT NULL 
    AND implementation_config ? 'subscribed_modules'
  LOOP
    PERFORM sync_organization_modules(org_record.id);
    total_synced := total_synced + 1;
  END LOOP;
  
  RAISE NOTICE 'Sincronização concluída! Total de organizações processadas: %', total_synced;
END $$;

-- 4. Verificar resultado da sincronização
SELECT 
  'Resultado da Sincronização:' as status,
  o.company_trading_name,
  COUNT(om.*) as modules_count,
  ARRAY_AGG(om.module_id ORDER BY om.module_id) as modules,
  ARRAY_AGG(om.status ORDER BY om.module_id) as status_list
FROM organizations o
LEFT JOIN organization_modules om ON o.id = om.organization_id
WHERE o.implementation_config IS NOT NULL
GROUP BY o.id, o.company_trading_name
ORDER BY o.company_trading_name;

-- 5. Estatísticas finais
SELECT 
  'Estatísticas Finais:' as status,
  COUNT(*) as total_modules,
  COUNT(*) FILTER (WHERE status = 'active') as active_modules,
  COUNT(*) FILTER (WHERE status = 'planned') as planned_modules,
  COUNT(*) FILTER (WHERE module_type = 'custom') as custom_modules,
  COUNT(*) FILTER (WHERE module_type = 'standard') as standard_modules
FROM organization_modules;

-- 6. Limpar função auxiliar
DROP FUNCTION sync_organization_modules(UUID); 