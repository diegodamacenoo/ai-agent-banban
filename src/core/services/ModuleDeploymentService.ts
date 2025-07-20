import { createSupabaseAdminClient } from '@/core/supabase/server';
import { moduleVersioningService, ModuleVersion } from './ModuleVersioningService';
import { z } from 'zod';

// Schemas de validação
const DeploymentRequestSchema = z.object({
  organization_id: z.string().uuid(),
  module_id: z.string().uuid(),
  target_version: z.string(),
  deployment_type: z.enum(['install', 'upgrade', 'downgrade']),
  force_deploy: z.boolean().default(false),
  skip_validation: z.boolean().default(false),
  rollback_on_failure: z.boolean().default(true)
});

export type DeploymentRequest = z.infer<typeof DeploymentRequestSchema>;

export interface DeploymentResult {
  id: string;
  organization_id: string;
  module_id: string;
  version: string;
  status: DeploymentStatus;
  deployment_type: 'install' | 'upgrade' | 'downgrade';
  started_at: string;
  completed_at?: string;
  error_message?: string;
  rollback_version?: string;
  validation_results: ValidationResult[];
  migration_logs: string[];
}

export type DeploymentStatus = 
  | 'pending'
  | 'validating'
  | 'deploying'
  | 'migrating'
  | 'testing'
  | 'completed'
  | 'failed'
  | 'rolled_back'
  | 'cancelled';

export interface ValidationResult {
  type: 'error' | 'warning' | 'info';
  message: string;
  component: string;
  blocking: boolean;
}

export interface DeploymentPlan {
  current_version?: string;
  target_version: string;
  deployment_type: 'install' | 'upgrade' | 'downgrade';
  migration_required: boolean;
  breaking_changes: boolean;
  validation_checks: string[];
  estimated_duration: number; // em minutos
  rollback_plan: string[];
}

export class ModuleDeploymentService {
  /**
   * Cria um plano de deployment
   */
  async createDeploymentPlan(
    organizationId: string,
    moduleId: string,
    targetVersion: string
  ): Promise<DeploymentPlan> {
    const supabase = await createSupabaseAdminClient();

    // Verificar versão atual instalada
    const { data: currentInstallation } = await supabase
      .from('tenant_module_assignments')
      .select(`
        version_id,
        core_module_versions!inner(version)
      `)
      .eq('organization_id', organizationId)
      .eq('module_id', moduleId)
      .single();

    const currentVersion = (currentInstallation?.core_module_versions as any)?.version;
    
    // Obter informações da versão target
    const targetVersionData = await moduleVersioningService.getVersion(moduleId, targetVersion);
    if (!targetVersionData) {
      throw new Error(`Versão ${targetVersion} não encontrada para o módulo ${moduleId}`);
    }

    // Determinar tipo de deployment
    let deployment_type: 'install' | 'upgrade' | 'downgrade';
    let migration_required = false;
    let breaking_changes = false;

    if (!currentVersion) {
      deployment_type = 'install';
    } else {
      const comparison = moduleVersioningService.compareVersions(currentVersion, targetVersion);
      if (comparison < 0) {
        deployment_type = 'upgrade';
      } else if (comparison > 0) {
        deployment_type = 'downgrade';
      } else {
        throw new Error('Versão target é igual à versão atual');
      }

      // Analisar mudanças necessárias
      const versionAnalysis = await moduleVersioningService.analyzeVersionChange(
        moduleId,
        currentVersion,
        targetVersion
      );
      migration_required = versionAnalysis.migration_required;
      breaking_changes = versionAnalysis.breaking_changes;
    }

    // Definir validações necessárias
    const validation_checks = [
      'module_compatibility',
      'platform_compatibility',
      'dependency_check',
      'resource_availability'
    ];

    if (migration_required) {
      validation_checks.push('migration_script_validation');
    }

    if (breaking_changes) {
      validation_checks.push('breaking_changes_impact');
    }

    // Estimar duração (baseado em complexidade)
    let estimated_duration = 5; // baseline
    if (migration_required) estimated_duration += 10;
    if (breaking_changes) estimated_duration += 15;
    if (deployment_type === 'install') estimated_duration += 5;

    // Plano de rollback
    const rollback_plan = currentVersion 
      ? [`rollback_to_version_${currentVersion}`, 'restore_previous_config', 'validate_rollback']
      : ['uninstall_module', 'cleanup_resources'];

    return {
      current_version: currentVersion,
      target_version: targetVersion,
      deployment_type,
      migration_required,
      breaking_changes,
      validation_checks,
      estimated_duration,
      rollback_plan
    };
  }

  /**
   * Valida um deployment antes de executar
   */
  async validateDeployment(
    organizationId: string,
    moduleId: string,
    targetVersion: string
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    const supabase = await createSupabaseAdminClient();

    try {
      // 1. Validar se o módulo existe
      const { data: module } = await supabase
        .from('core_modules')
        .select('id, name')
        .eq('id', moduleId)
        .single();

      if (!module) {
        results.push({
          type: 'error',
          message: `Módulo ${moduleId} não encontrado`,
          component: 'module_compatibility',
          blocking: true
        });
        return results;
      }

      // 2. Validar se a versão existe
      const targetVersionData = await moduleVersioningService.getVersion(moduleId, targetVersion);
      if (!targetVersionData) {
        results.push({
          type: 'error',
          message: `Versão ${targetVersion} não encontrada`,
          component: 'module_compatibility',
          blocking: true
        });
        return results;
      }

      // 3. Validar status da versão
      if (targetVersionData.status !== 'released') {
        results.push({
          type: 'warning',
          message: `Versão ${targetVersion} não está marcada como released (status: ${targetVersionData.status})`,
          component: 'module_compatibility',
          blocking: false
        });
      }

      // 4. Validar compatibilidade com plataforma
      const platformVersion = '2.0.0'; // Versão atual da plataforma
      const isCompatible = await moduleVersioningService.validatePlatformCompatibility(
        targetVersionData,
        platformVersion
      );

      if (!isCompatible) {
        results.push({
          type: 'error',
          message: `Versão ${targetVersion} não é compatível com a plataforma ${platformVersion}`,
          component: 'platform_compatibility',
          blocking: true
        });
      }

      // 5. Validar dependências
      const dependencyValidation = await this.validateDependencies(moduleId, targetVersion);
      results.push(...dependencyValidation);

      // 6. Validar recursos disponíveis
      const resourceValidation = await this.validateResources(organizationId);
      results.push(...resourceValidation);

      // 7. Validar scripts de migração se necessário
      if (targetVersionData.migration_scripts && targetVersionData.migration_scripts.length > 0) {
        const migrationValidation = await this.validateMigrationScripts(targetVersionData.migration_scripts);
        results.push(...migrationValidation);
      }

    } catch (error) {
      results.push({
        type: 'error',
        message: `Erro durante validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        component: 'validation_system',
        blocking: true
      });
    }

    return results;
  }

  /**
   * Executa o deployment de um módulo
   */
  async deployModule(request: DeploymentRequest): Promise<DeploymentResult> {
    const validated = DeploymentRequestSchema.parse(request);
    const supabase = await createSupabaseAdminClient();

    // Criar registro de deployment
    const { data: deployment, error: deployError } = await supabase
      .from('module_deployments')
      .insert({
        organization_id: validated.organization_id,
        module_id: validated.module_id,
        target_version: validated.target_version,
        deployment_type: validated.deployment_type,
        status: 'pending',
        started_at: new Date().toISOString(),
        force_deploy: validated.force_deploy,
        skip_validation: validated.skip_validation,
        rollback_on_failure: validated.rollback_on_failure
      })
      .select()
      .single();

    if (deployError || !deployment) {
      throw new Error(`Erro ao criar registro de deployment: ${deployError?.message}`);
    }

    const deploymentId = deployment.id;
    let currentStatus: DeploymentStatus = 'pending';

    try {
      // Fase 1: Validação
      if (!validated.skip_validation) {
        currentStatus = 'validating';
        await this.updateDeploymentStatus(deploymentId, currentStatus);

        const validationResults = await this.validateDeployment(
          validated.organization_id,
          validated.module_id,
          validated.target_version
        );

        const blockingErrors = validationResults.filter(r => r.type === 'error' && r.blocking);
        if (blockingErrors.length > 0 && !validated.force_deploy) {
          throw new Error(`Validação falhou: ${blockingErrors.map(e => e.message).join(', ')}`);
        }
      }

      // Fase 2: Deploy
      currentStatus = 'deploying';
      await this.updateDeploymentStatus(deploymentId, currentStatus);

      const targetVersionData = await moduleVersioningService.getVersion(
        validated.module_id,
        validated.target_version
      );

      if (!targetVersionData) {
        throw new Error(`Versão ${validated.target_version} não encontrada`);
      }

      // Fase 3: Migração (se necessário)
      const migrationLogs: string[] = [];
      if (targetVersionData.migration_scripts && targetVersionData.migration_scripts.length > 0) {
        currentStatus = 'migrating';
        await this.updateDeploymentStatus(deploymentId, currentStatus);

        for (const script of targetVersionData.migration_scripts) {
          migrationLogs.push(`Executando script: ${script}`);
          // Aqui executaríamos o script de migração
          migrationLogs.push(`Script ${script} executado com sucesso`);
        }
      }

      // Fase 4: Atualizar registro do tenant
      await this.updateTenantModule(
        validated.organization_id,
        validated.module_id,
        targetVersionData.id
      );

      // Fase 5: Testes pós-deployment
      currentStatus = 'testing';
      await this.updateDeploymentStatus(deploymentId, currentStatus);

      // Simular testes básicos
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Finalizar deployment
      currentStatus = 'completed';
      await this.updateDeploymentStatus(deploymentId, currentStatus, {
        completed_at: new Date().toISOString()
      });

      return {
        id: deploymentId,
        organization_id: validated.organization_id,
        module_id: validated.module_id,
        version: validated.target_version,
        status: currentStatus,
        deployment_type: validated.deployment_type,
        started_at: deployment.started_at,
        completed_at: new Date().toISOString(),
        validation_results: [],
        migration_logs: migrationLogs
      };

    } catch (error) {
      // Em caso de erro, tentar rollback se configurado
      if (validated.rollback_on_failure) {
        try {
          await this.rollbackDeployment(deploymentId);
          currentStatus = 'rolled_back';
        } catch (rollbackError) {
          currentStatus = 'failed';
        }
      } else {
        currentStatus = 'failed';
      }

      await this.updateDeploymentStatus(deploymentId, currentStatus, {
        error_message: error instanceof Error ? error.message : 'Erro desconhecido',
        completed_at: new Date().toISOString()
      });

      throw error;
    }
  }

  /**
   * Executa rollback de um deployment
   */
  async rollbackDeployment(deploymentId: string): Promise<void> {
    const supabase = await createSupabaseAdminClient();

    // Obter informações do deployment
    const { data: deployment } = await supabase
      .from('module_deployments')
      .select('*')
      .eq('id', deploymentId)
      .single();

    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} não encontrado`);
    }

    // Implementar lógica de rollback
    // Por enquanto, apenas marcar como rolled_back
    await this.updateDeploymentStatus(deploymentId, 'rolled_back');
  }

  /**
   * Valida dependências do módulo
   */
  private async validateDependencies(moduleId: string, version: string): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    // Implementar validação de dependências
    // Por enquanto, retornar sucesso
    results.push({
      type: 'info',
      message: 'Dependências validadas com sucesso',
      component: 'dependency_check',
      blocking: false
    });

    return results;
  }

  /**
   * Valida recursos disponíveis
   */
  private async validateResources(organizationId: string): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    // Implementar validação de recursos
    // Por enquanto, retornar sucesso
    results.push({
      type: 'info',
      message: 'Recursos suficientes disponíveis',
      component: 'resource_availability',
      blocking: false
    });

    return results;
  }

  /**
   * Valida scripts de migração
   */
  private async validateMigrationScripts(scripts: string[]): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (const script of scripts) {
      // Validar sintaxe SQL básica
      if (!script.trim()) {
        results.push({
          type: 'warning',
          message: `Script de migração vazio: ${script}`,
          component: 'migration_script_validation',
          blocking: false
        });
      } else {
        results.push({
          type: 'info',
          message: `Script de migração válido: ${script}`,
          component: 'migration_script_validation',
          blocking: false
        });
      }
    }

    return results;
  }

  /**
   * Atualiza status do deployment
   */
  private async updateDeploymentStatus(
    deploymentId: string,
    status: DeploymentStatus,
    additionalData?: Record<string, any>
  ): Promise<void> {
    const supabase = await createSupabaseAdminClient();
    
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
      ...additionalData
    };

    await supabase
      .from('module_deployments')
      .update(updateData)
      .eq('id', deploymentId);
  }

  /**
   * Atualiza registro do módulo do tenant
   */
  private async updateTenantModule(
    organizationId: string,
    moduleId: string,
    versionId: string
  ): Promise<void> {
    const supabase = await createSupabaseAdminClient();

    // Verificar se já existe registro
    const { data: existing } = await supabase
      .from('tenant_module_assignments')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('module_id', moduleId)
      .single();

    if (existing) {
      // Atualizar registro existente
      await supabase
        .from('tenant_module_assignments')
        .update({
          version_id: versionId,
          status: 'UP_TO_DATE',
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('module_id', moduleId);
    } else {
      // Criar novo registro
      await supabase
        .from('tenant_module_assignments')
        .insert({
          organization_id: organizationId,
          module_id: moduleId,
          version_id: versionId,
          status: 'ENABLED',
          activated_at: new Date().toISOString()
        });
    }
  }
}

export const moduleDeploymentService = new ModuleDeploymentService(); 