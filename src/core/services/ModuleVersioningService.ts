import { createSupabaseAdminClient } from '@/core/supabase/server';
import { z } from 'zod';

// Schemas de validação
const SemVerSchema = z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/, 'Versão deve seguir formato semântico (ex: 1.0.0)');

const ModuleVersionSchema = z.object({
  module_id: z.string().uuid(),
  version: SemVerSchema,
  build_hash: z.string().optional(),
  changelog: z.string().optional(),
  migration_scripts: z.array(z.string()).optional(),
  upgrade_script: z.string().optional(),
  downgrade_script: z.string().optional(),
  breaking_changes: z.boolean().default(false),
  min_platform_version: z.string().optional(),
  max_platform_version: z.string().optional(),
  status: z.enum(['draft', 'testing', 'released', 'deprecated']).default('draft'),
  is_stable: z.boolean().default(false),
  is_latest: z.boolean().default(false)
});

export type ModuleVersionInput = z.infer<typeof ModuleVersionSchema>;

export interface ModuleVersion {
  id: string;
  module_id: string;
  version: string;
  build_hash?: string;
  changelog?: string;
  migration_scripts?: string[];
  upgrade_script?: string;
  downgrade_script?: string;
  breaking_changes: boolean;
  min_platform_version?: string;
  max_platform_version?: string;
  status: 'draft' | 'testing' | 'released' | 'deprecated';
  is_stable: boolean;
  is_latest: boolean;
  created_at: string;
  released_at?: string;
  deprecated_at?: string;
}

export interface VersionComparisonResult {
  current: string;
  target: string;
  type: 'major' | 'minor' | 'patch' | 'prerelease';
  breaking_changes: boolean;
  migration_required: boolean;
}

export class ModuleVersioningService {
  /**
   * Cria uma nova versão de módulo
   */
  async createVersion(input: ModuleVersionInput): Promise<ModuleVersion> {
    const validated = ModuleVersionSchema.parse(input);
    const supabase = await createSupabaseAdminClient();
    
    // Verificar se o módulo existe
    const { data: module, error: moduleError } = await supabase
      .from('core_modules')
      .select('id')
      .eq('id', validated.module_id)
      .single();

    if (moduleError || !module) {
      throw new Error(`Módulo não encontrado: ${validated.module_id}`);
    }

    // Verificar se a versão já existe
    const { data: existingVersion } = await supabase
      .from('core_module_versions')
      .select('id')
      .eq('module_id', validated.module_id)
      .eq('version', validated.version)
      .single();

    if (existingVersion) {
      throw new Error(`Versão ${validated.version} já existe para este módulo`);
    }

    // Se esta versão deve ser a latest, remover flag de outras versões
    if (validated.is_latest) {
      await supabase
        .from('core_module_versions')
        .update({ is_latest: false })
        .eq('module_id', validated.module_id);
    }

    // Criar nova versão
    const { data, error } = await supabase
      .from('core_module_versions')
      .insert({
        module_id: validated.module_id,
        version: validated.version,
        build_hash: validated.build_hash,
        changelog: validated.changelog,
        migration_scripts: validated.migration_scripts,
        upgrade_script: validated.upgrade_script,
        downgrade_script: validated.downgrade_script,
        breaking_changes: validated.breaking_changes,
        min_platform_version: validated.min_platform_version,
        max_platform_version: validated.max_platform_version,
        status: validated.status,
        is_stable: validated.is_stable,
        is_latest: validated.is_latest
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar versão: ${error.message}`);
    }

    return data as ModuleVersion;
  }

  /**
   * Lista todas as versões de um módulo
   */
  async getModuleVersions(moduleId: string): Promise<ModuleVersion[]> {
    const supabase = await createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('core_module_versions')
      .select('*')
      .eq('module_id', moduleId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar versões: ${error.message}`);
    }

    return data as ModuleVersion[];
  }

  /**
   * Obtém a versão mais recente de um módulo
   */
  async getLatestVersion(moduleId: string): Promise<ModuleVersion | null> {
    const supabase = await createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('core_module_versions')
      .select('*')
      .eq('module_id', moduleId)
      .eq('is_latest', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Erro ao buscar versão mais recente: ${error.message}`);
    }

    return data as ModuleVersion | null;
  }

  /**
   * Obtém uma versão específica
   */
  async getVersion(moduleId: string, version: string): Promise<ModuleVersion | null> {
    const supabase = await createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('core_module_versions')
      .select('*')
      .eq('module_id', moduleId)
      .eq('version', version)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar versão: ${error.message}`);
    }

    return data as ModuleVersion | null;
  }

  /**
   * Marca uma versão como released
   */
  async releaseVersion(moduleId: string, version: string): Promise<ModuleVersion> {
    const supabase = await createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('core_module_versions')
      .update({
        status: 'released',
        released_at: new Date().toISOString()
      })
      .eq('module_id', moduleId)
      .eq('version', version)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao marcar versão como released: ${error.message}`);
    }

    return data as ModuleVersion;
  }

  /**
   * Depreca uma versão
   */
  async deprecateVersion(moduleId: string, version: string): Promise<ModuleVersion> {
    const supabase = await createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('core_module_versions')
      .update({
        status: 'deprecated',
        deprecated_at: new Date().toISOString()
      })
      .eq('module_id', moduleId)
      .eq('version', version)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao deprecar versão: ${error.message}`);
    }

    return data as ModuleVersion;
  }

  /**
   * Define uma versão como latest
   */
  async setLatestVersion(moduleId: string, version: string): Promise<void> {
    const supabase = await createSupabaseAdminClient();
    
    // Remover flag latest de todas as versões
    await supabase
      .from('core_module_versions')
      .update({ is_latest: false })
      .eq('module_id', moduleId);

    // Definir nova versão como latest
    const { error } = await supabase
      .from('core_module_versions')
      .update({ is_latest: true })
      .eq('module_id', moduleId)
      .eq('version', version);

    if (error) {
      throw new Error(`Erro ao definir versão como latest: ${error.message}`);
    }
  }

  /**
   * Compara duas versões semânticas
   */
  compareVersions(version1: string, version2: string): number {
    const v1Parts = this.parseVersion(version1);
    const v2Parts = this.parseVersion(version2);

    // Comparar major
    if (v1Parts.major !== v2Parts.major) {
      return v1Parts.major - v2Parts.major;
    }

    // Comparar minor
    if (v1Parts.minor !== v2Parts.minor) {
      return v1Parts.minor - v2Parts.minor;
    }

    // Comparar patch
    if (v1Parts.patch !== v2Parts.patch) {
      return v1Parts.patch - v2Parts.patch;
    }

    // Comparar prerelease
    if (v1Parts.prerelease && v2Parts.prerelease) {
      return v1Parts.prerelease.localeCompare(v2Parts.prerelease);
    }

    if (v1Parts.prerelease && !v2Parts.prerelease) return -1;
    if (!v1Parts.prerelease && v2Parts.prerelease) return 1;

    return 0;
  }

  /**
   * Analisa uma mudança de versão
   */
  async analyzeVersionChange(moduleId: string, currentVersion: string, targetVersion: string): Promise<VersionComparisonResult> {
    const current = this.parseVersion(currentVersion);
    const target = this.parseVersion(targetVersion);

    let type: 'major' | 'minor' | 'patch' | 'prerelease';

    if (target.major > current.major) {
      type = 'major';
    } else if (target.minor > current.minor) {
      type = 'minor';
    } else if (target.patch > current.patch) {
      type = 'patch';
    } else {
      type = 'prerelease';
    }

    // Verificar se a versão target tem breaking changes
    const targetVersionData = await this.getVersion(moduleId, targetVersion);
    const breaking_changes = targetVersionData?.breaking_changes || false;

    // Determinar se migração é necessária
    const migration_required = type === 'major' || breaking_changes;

    return {
      current: currentVersion,
      target: targetVersion,
      type,
      breaking_changes,
      migration_required
    };
  }

  /**
   * Parseia uma versão semântica
   */
  private parseVersion(version: string) {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/);
    
    if (!match) {
      throw new Error(`Versão inválida: ${version}`);
    }

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4] || null,
      build: match[5] || null
    };
  }

  /**
   * Gera próxima versão baseada no tipo de mudança
   */
  generateNextVersion(currentVersion: string, type: 'major' | 'minor' | 'patch'): string {
    const current = this.parseVersion(currentVersion);

    switch (type) {
      case 'major':
        return `${current.major + 1}.0.0`;
      case 'minor':
        return `${current.major}.${current.minor + 1}.0`;
      case 'patch':
        return `${current.major}.${current.minor}.${current.patch + 1}`;
      default:
        throw new Error(`Tipo de versão inválido: ${type}`);
    }
  }

  /**
   * Valida se uma versão é compatível com a plataforma
   */
  async validatePlatformCompatibility(version: ModuleVersion, platformVersion: string): Promise<boolean> {
    if (version.min_platform_version && this.compareVersions(platformVersion, version.min_platform_version) < 0) {
      return false;
    }

    if (version.max_platform_version && this.compareVersions(platformVersion, version.max_platform_version) > 0) {
      return false;
    }

    return true;
  }
}

export const moduleVersioningService = new ModuleVersioningService(); 