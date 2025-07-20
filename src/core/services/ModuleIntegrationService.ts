import { ModuleVersioningService } from './ModuleVersioningService';
import { ModuleDeploymentService } from './ModuleDeploymentService';
import { createSupabaseServerClient } from '@/core/supabase/server';
// import { BANBAN_MODULES } from '@/core/modules/banban'; // TODO: Migrar para novo sistema dinâmico
const BANBAN_MODULES = {}; // Stub temporário para evitar build error
import { MODULE_ID_MAPPING } from '@/shared/utils/module-mapping';

interface BanbanModuleInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  features: string[];
  endpoints: string[];
  maturity: 'ALPHA' | 'BETA' | 'RC' | 'GA';
  status: 'ACTIVE' | 'INACTIVE' | 'DEPRECATED';
}

export class ModuleIntegrationService {
  private versioningService: ModuleVersioningService;
  private deploymentService: ModuleDeploymentService;

  constructor() {
    this.versioningService = new ModuleVersioningService();
    this.deploymentService = new ModuleDeploymentService();
  }

  /**
   * Registra todos os módulos Banban no sistema de versionamento
   */
  async integrateBanbanModules(): Promise<{
    success: boolean;
    results: Array<{
      moduleId: string;
      registered: boolean;
      versioned: boolean;
      error?: string;
    }>;
  }> {
    const results: Array<{
      moduleId: string;
      registered: boolean;
      versioned: boolean;
      error?: string;
    }> = [];

    const moduleInfos = await this.getBanbanModuleInfos();

    for (const moduleInfo of moduleInfos) {
      try {
        console.debug(`🔄 Integrando módulo: ${moduleInfo.id}`);

        // 1. Registrar módulo no core_modules se não existir
        const registered = await this.registerModuleInCore(moduleInfo);
        
        // 2. Criar versão inicial no sistema de versionamento
        const versioned = await this.createInitialVersion(moduleInfo);

        results.push({
          moduleId: moduleInfo.id,
          registered,
          versioned,
        });

        console.debug(`✅ Módulo ${moduleInfo.id} integrado com sucesso`);
      } catch (error) {
        console.error(`❌ Erro ao integrar módulo ${moduleInfo.id}:`, error);
        results.push({
          moduleId: moduleInfo.id,
          registered: false,
          versioned: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    const successCount = results.filter(r => r.registered && r.versioned).length;
    
    return {
      success: successCount === results.length,
      results,
    };
  }

  /**
   * Obtém informações dos módulos Banban existentes
   */
  private async getBanbanModuleInfos(): Promise<BanbanModuleInfo[]> {
    const moduleInfos: BanbanModuleInfo[] = [];

    // Mapear módulos Banban para informações estruturadas
    const banbanModuleMapping = {
      'banban-insights': {
        name: 'Insights Avançados',
        description: 'Sistema de insights e análises para fashion retail',
        features: ['dashboard-insights', 'trend-analysis', 'performance-metrics', 'predictive-analytics'],
        maturity: 'GA' as const,
      },
      'banban-performance': {
        name: 'Performance Analytics',
        description: 'Análise de performance e métricas de negócio',
        features: ['fashion-metrics', 'inventory-turnover', 'seasonal-analysis', 'brand-performance'],
        maturity: 'GA' as const,
      },
      'banban-inventory': {
        name: 'Gestão de Estoque',
        description: 'Sistema avançado de gestão de estoque para fashion',
        features: ['stock-control', 'abc-analysis', 'replenishment', 'multi-store'],
        maturity: 'GA' as const,
      },
      'banban-alerts': {
        name: 'Sistema de Alertas',
        description: 'Alertas inteligentes e notificações',
        features: ['real-time-alerts', 'threshold-monitoring', 'escalation', 'multi-channel'],
        maturity: 'GA' as const,
      },
      'banban-data-processing': {
        name: 'Processamento de Dados',
        description: 'Engine de processamento e transformação de dados',
        features: ['event-processing', 'batch-processing', 'webhook-validation', 'metrics-collection'],
        maturity: 'GA' as const,
      },
    };

    for (const [moduleId, moduleData] of Object.entries(banbanModuleMapping)) {
      try {
        // Tentar obter informações do módulo real se disponível
        const banbanModule = BANBAN_MODULES[moduleId.replace('banban-', '')];
        
        const endpoints = banbanModule?.endpoints || [
          `/api/modules/${moduleId}/health`,
          `/api/modules/${moduleId}/config`,
          `/api/modules/${moduleId}/metrics`,
        ];

        moduleInfos.push({
          id: moduleId,
          name: moduleData.name,
          version: '1.0.0', // Versão inicial padrão
          description: moduleData.description,
          features: moduleData.features,
          endpoints,
          maturity: moduleData.maturity,
          status: 'ACTIVE',
        });
      } catch (error) {
        console.warn(`⚠️ Erro ao processar módulo ${moduleId}:`, error);
      }
    }

    return moduleInfos;
  }

  /**
   * Registra um módulo na tabela core_modules
   */
  private async registerModuleInCore(moduleInfo: BanbanModuleInfo): Promise<boolean> {
    try {
      const supabase = await createSupabaseServerClient();

      // Verificar se o módulo já existe
      const { data: existingModule } = await supabase
        .from('core_modules')
        .select('id')
        .eq('slug', moduleInfo.id)
        .single();

      if (existingModule) {
        console.debug(`📋 Módulo ${moduleInfo.id} já registrado no core_modules`);
        return true;
      }

      // Registrar novo módulo
      const { error } = await supabase
        .from('core_modules')
        .insert({
          slug: moduleInfo.id,
          name: moduleInfo.name,
          description: moduleInfo.description,
          maturity: moduleInfo.maturity,
          status: moduleInfo.status,
          features: moduleInfo.features,
          endpoints: moduleInfo.endpoints,
          metadata: {
            integration_date: new Date().toISOString(),
            integration_version: '1.0.0',
            source: 'banban-integration',
          },
        });

      if (error) {
        throw error;
      }

      console.debug(`✅ Módulo ${moduleInfo.id} registrado no core_modules`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao registrar módulo ${moduleInfo.id}:`, error);
      return false;
    }
  }

  /**
   * Cria versão inicial de um módulo no sistema de versionamento
   */
  private async createInitialVersion(moduleInfo: BanbanModuleInfo): Promise<boolean> {
    try {
      // Verificar se já existe versão
      const existingVersions = await this.versioningService.getModuleVersions(moduleInfo.id);
      
      if (existingVersions.length > 0) {
        console.debug(`📋 Módulo ${moduleInfo.id} já possui versões no sistema`);
        return true;
      }

            // Primeiro, obter o ID do módulo registrado no core_modules
      const supabase = await createSupabaseServerClient();
      const { data: coreModule } = await supabase
        .from('core_modules')
        .select('id')
        .eq('slug', moduleInfo.id)
        .single();

      if (!coreModule) {
        throw new Error(`Módulo ${moduleInfo.id} não encontrado no core_modules`);
      }

      // Criar versão inicial
      await this.versioningService.createVersion({
        module_id: coreModule.id,
        version: moduleInfo.version,
        changelog: `Versão inicial do módulo ${moduleInfo.name} integrada ao sistema de versionamento.`,
        breaking_changes: false,
        upgrade_script: this.generateUpgradeScript(moduleInfo),
        downgrade_script: this.generateDowngradeScript(moduleInfo),
        status: 'released',
        is_stable: true,
        is_latest: true,
      });

      // Marcar como released se for GA
      if (moduleInfo.maturity === 'GA') {
        const versions = await this.versioningService.getModuleVersions(coreModule.id);
        const latestVersion = versions[0];
        
        if (latestVersion) {
          await this.versioningService.releaseVersion(coreModule.id, moduleInfo.version);
        }
      }

      console.debug(`✅ Versão inicial criada para ${moduleInfo.id}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao criar versão inicial para ${moduleInfo.id}:`, error);
      return false;
    }
  }

  /**
   * Gera script de upgrade para um módulo
   */
  private generateUpgradeScript(moduleInfo: BanbanModuleInfo): string {
    return `-- Upgrade script for ${moduleInfo.id} v${moduleInfo.version}
-- Generated automatically during integration

-- Ensure module is registered in tenant_module_assignments
INSERT INTO tenant_module_assignments (organization_id, module_id, operational_status, custom_config)
SELECT 
  o.id as organization_id,
  '${moduleInfo.id}' as module_id,
  'ENABLED' as operational_status,
  '{}' as custom_config
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_module_assignments tm 
  WHERE tm.organization_id = o.id 
  AND tm.module_id = '${moduleInfo.id}'
);

-- Update module metadata
UPDATE core_modules 
SET 
  features = '${JSON.stringify(moduleInfo.features)}',
  endpoints = '${JSON.stringify(moduleInfo.endpoints)}',
  updated_at = NOW()
WHERE slug = '${moduleInfo.id}';

-- Log upgrade
INSERT INTO module_deployment_logs (deployment_id, level, message, context)
VALUES (
  (SELECT id FROM module_deployments WHERE module_id = '${moduleInfo.id}' ORDER BY created_at DESC LIMIT 1),
  'info',
  'Module ${moduleInfo.id} upgraded to v${moduleInfo.version}',
  '{"features": ${JSON.stringify(moduleInfo.features)}}'
);`;
  }

  /**
   * Gera script de downgrade para um módulo
   */
  private generateDowngradeScript(moduleInfo: BanbanModuleInfo): string {
    return `-- Downgrade script for ${moduleInfo.id} v${moduleInfo.version}
-- Generated automatically during integration

-- This is the initial version, downgrade not supported
-- Log downgrade attempt
INSERT INTO module_deployment_logs (deployment_id, level, message, context)
VALUES (
  (SELECT id FROM module_deployments WHERE module_id = '${moduleInfo.id}' ORDER BY created_at DESC LIMIT 1),
  'warn',
  'Downgrade attempted for initial version of ${moduleInfo.id}',
  '{"action": "downgrade_blocked", "reason": "initial_version"}'
);`;
  }

  /**
   * Obtém status da integração de todos os módulos
   */
  async getIntegrationStatus(): Promise<{
    totalModules: number;
    integratedModules: number;
    pendingModules: string[];
    details: Array<{
      moduleId: string;
      name: string;
      registered: boolean;
      versioned: boolean;
      currentVersion?: string;
      status: string;
    }>;
  }> {
    const moduleInfos = await this.getBanbanModuleInfos();
    const details: Array<{
      moduleId: string;
      name: string;
      registered: boolean;
      versioned: boolean;
      currentVersion?: string;
      status: string;
    }> = [];

    for (const moduleInfo of moduleInfos) {
      try {
        // Verificar se está registrado
        const supabase = await createSupabaseServerClient();
        const { data: coreModule } = await supabase
          .from('core_modules')
          .select('id, status')
          .eq('slug', moduleInfo.id)
          .single();

        const registered = !!coreModule;

        // Verificar se tem versões
        const versions = await this.versioningService.getModuleVersions(moduleInfo.id);
        const versioned = versions.length > 0;
        const currentVersion = versions.find(v => v.is_latest)?.version;

        details.push({
          moduleId: moduleInfo.id,
          name: moduleInfo.name,
          registered,
          versioned,
          currentVersion,
          status: registered && versioned ? 'INTEGRATED' : 'PENDING',
        });
      } catch (error) {
        details.push({
          moduleId: moduleInfo.id,
          name: moduleInfo.name,
          registered: false,
          versioned: false,
          status: 'error',
        });
      }
    }

    const integratedCount = details.filter(d => d.status === 'INTEGRATED').length;
    const pendingModules = details
      .filter(d => d.status !== 'INTEGRATED')
      .map(d => d.moduleId);

    return {
      totalModules: moduleInfos.length,
      integratedModules: integratedCount,
      pendingModules,
      details,
    };
  }

  /**
   * Força re-integração de um módulo específico
   */
  async reintegrateModule(moduleId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const moduleInfos = await this.getBanbanModuleInfos();
      const moduleInfo = moduleInfos.find(m => m.id === moduleId);

      if (!moduleInfo) {
        return {
          success: false,
          message: `Módulo ${moduleId} não encontrado`,
        };
      }

      // Re-registrar no core
      const registered = await this.registerModuleInCore(moduleInfo);
      
      // Re-criar versão
      const versioned = await this.createInitialVersion(moduleInfo);

      if (registered && versioned) {
        return {
          success: true,
          message: `Módulo ${moduleId} re-integrado com sucesso`,
        };
      } else {
        return {
          success: false,
          message: `Falha na re-integração do módulo ${moduleId}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Erro na re-integração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }
} 